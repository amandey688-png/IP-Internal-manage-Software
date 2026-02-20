from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend/ (works even when run from project root)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

import os
import sys
# Fix Windows console encoding for emoji/special chars
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from datetime import datetime, date, timedelta, timezone
from fastapi import FastAPI, HTTPException, Depends, APIRouter, Request, UploadFile, File, Query, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import uuid
import httpx
from app.supabase_client import supabase, supabase_auth
from app.auth_middleware import get_current_user, get_current_user_optional

# Role-based access: master_admin, admin (Super Admin), approver (Approver), user (Operator)
def _normalize_role(name: str | None) -> str:
    """Map DB role name to frontend role (master_admin, admin, approver, user). Handles 'master_ad' etc."""
    if not name:
        return "user"
    n = (name or "").strip().lower()
    if n in ("master_admin", "master_ad", "masteradmin"):
        return "master_admin"
    if n in ("admin", "super_admin", "superadmin"):
        return "admin"
    if n == "approver":
        return "approver"
    if n == "user":
        return "user"
    return "user"


def _get_role_from_profile(user_id: str) -> str:
    """Fetch user profile and return frontend role name (master_admin, admin, approver, user)."""
    try:
        profile = supabase.table("user_profiles").select("role_id").eq("id", user_id).single().execute()
        if not profile.data:
            return "user"
        role_row = supabase.table("roles").select("name").eq("id", profile.data["role_id"]).single().execute()
        role_name = role_row.data["name"] if role_row.data else "user"
        return _normalize_role(role_name)
    except Exception:
        return "user"


async def get_current_user_with_role(auth: dict = Depends(get_current_user)) -> dict:
    """Current user with role. Use for role checks."""
    role = _get_role_from_profile(auth["id"])
    return {"id": auth["id"], "email": auth["email"], "role": role}


def require_roles(allowed_roles: list[str]):
    """Dependency: allow only given roles (master_admin, admin, approver, user)."""
    async def _check(current: dict = Depends(get_current_user_with_role)) -> dict:
        if current.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current
    return _check


def _log(msg: str):
    """Force log to terminal and log file - ASCII-safe for Windows"""
    safe_msg = msg.encode("ascii", errors="replace").decode("ascii")
    print(safe_msg, flush=True)
    sys.stdout.flush()
    sys.stderr.flush()
    try:
        base = os.path.dirname(os.path.abspath(__file__))
        log_path = os.path.join(base, "..", "backend_errors.log")
        with open(log_path, "a", encoding="utf-8", errors="replace") as f:
            from datetime import datetime as dt
            f.write(f"[{dt.now().isoformat()}] {safe_msg}\n")
            f.flush()
    except Exception:
        pass

app = FastAPI(title="IP Internal manage Software Backend")

# Request logging + CATCH ALL to prevent 500
@app.middleware("http")
async def log_requests(request: Request, call_next):
    _log(f"--> {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        _log(f"<-- {request.method} {request.url.path} -> {response.status_code}")
        return response
    except Exception as ex:
        try:
            _log(f"UNHANDLED ERROR: {ex}")
        except Exception:
            pass
        # Return 400 - use generic msg for encoding errors on Windows
        err_str = str(ex)
        if "charmap" in err_str or "encode" in err_str.lower() or "unicode" in err_str.lower():
            detail = "Registration failed. Restart backend with: set PYTHONIOENCODING=utf-8"
        else:
            try:
                detail = err_str[:300].encode("ascii", errors="replace").decode("ascii")
            except Exception:
                detail = "Registration failed"
        return JSONResponse(status_code=400, content={"detail": detail})

# Global exception handler - convert ALL errors to 400 with message (never 500)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        raise exc
    _log(f"!!! UNHANDLED: {type(exc).__name__}: {exc}")
    import traceback
    _log(traceback.format_exc())
    # Return 400 instead of 500 - so user sees the error
    return JSONResponse(
        status_code=400,
        content={"detail": f"Error: {str(exc)[:200]}"},
    )

# CORS configuration - allow frontend origin (dev defaults; for production set CORS_ORIGINS to your frontend URL, e.g. https://your-app.vercel.app)
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,http://127.0.0.1:3003,http://127.0.0.1:3004").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API router - routes work at BOTH / and /api (e.g. /users/me AND /api/users/me)
api_router = APIRouter()

# ---------- Schemas ----------
class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class RegisterResponse(BaseModel):
    user_id: str
    email: str
    confirmation_sent: bool
    message: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str | None
    user: dict
    requires_otp: bool = False


# ---------- Routes ----------
@app.get("/health")
def health():
    """Lightweight health check (no DB). Use for keep-alive pings (e.g. UptimeRobot every 5 min) to prevent Render cold start."""
    return {"status": "ok", "message": "Backend is running"}


@app.post("/auth/register-simple")
def register_simple(payload: RegisterRequest):
    """Minimal register - just echoes back. Use to test routing + validation."""
    return {"ok": True, "email": payload.email}


@app.get("/health/db")
def health_db():
    """Check if database tables exist - run FRESH_SETUP.sql if this fails"""
    try:
        r = supabase.table("roles").select("id").limit(1).execute()
        return {"status": "ok", "database": "ready", "roles": "exists"}
    except Exception as e:
        return {"status": "error", "database": "not ready", "error": str(e)[:200]}


@app.post("/auth/register-test")
def register_test():
    """Minimal test - returns 200. Use to verify proxy/routing works."""
    return {"ok": True, "message": "Backend and proxy work. Real register at POST /auth/register"}


@app.get("/health/supabase")
def health_supabase():
    """Test Supabase connection - auth + database"""
    out = {"supabase_url": os.getenv("SUPABASE_URL", "")[:50] + "...", "auth": "unknown", "db": "unknown"}
    try:
        # Test auth - list users (requires service_role)
        supabase.auth.admin.list_users(per_page=1)
        out["auth"] = "ok"
    except Exception as e:
        out["auth"] = f"error: {str(e)[:150]}"
    try:
        supabase.table("roles").select("id").limit(1).execute()
        out["db"] = "ok"
    except Exception as e:
        out["db"] = f"error: {str(e)[:150]}"
    return out


@app.get("/check-user")
def check_user(email: str = ""):
    """DIAGNOSTIC: Check if user exists. Use: /check-user?email=test@ip.com"""
    if not email:
        return {"error": "Add ?email=test@ip.com to the URL"}
    try:
        email = email.strip().lower()
        users = supabase.auth.admin.list_users(per_page=1000)
        auth_user = next((u for u in users if getattr(u, "email", "") and getattr(u, "email", "").lower() == email), None)
        if not auth_user:
            return {"exists": False, "error": "User not found", "hint": "Add user in Supabase Auth Users"}
        user_id = str(auth_user.id)
        profile = supabase.table("user_profiles").select("id").eq("id", user_id).execute()
        return {
            "exists": True, "user_id": user_id, "email": getattr(auth_user, "email", ""),
            "email_confirmed": bool(getattr(auth_user, "email_confirmed_at", None)),
            "has_profile": bool(profile.data),
            "hint": "Run FIX_USER_PROFILE.sql" if not profile.data else "OK",
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/", response_class=HTMLResponse)
def root():
    """Root endpoint - HTML page with proper tab title"""
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FMS Backend API</title>
</head>
<body style="font-family:sans-serif;padding:2rem;">
<h1>IP Internal manage Software Backend API</h1>
<p>Backend is running.</p>
<ul>
<li><a href="/docs">API Docs (Swagger)</a></li>
<li><a href="/health">Health Check</a></li>
<li><a href="/check-user?email=test@ip.com">Check User (test@ip.com)</a></li>
<li><strong>API base:</strong> Use <code>http://127.0.0.1:8000</code> or <code>http://127.0.0.1:8000/api</code></li>
<li><a href="/api/users/me">GET /api/users/me</a> (requires token)</li>
</ul>
</body>
</html>"""


@api_router.post("/auth/register")
async def register_user(payload: RegisterRequest):
    """Register a new user via Supabase Auth. Never returns 500 - always 200/400/503.
    Uses run_in_executor so sync Supabase calls don't block; exceptions propagate to us."""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _do_register, payload)
    except HTTPException:
        raise  # Let FastAPI handle HTTPException
    except BaseException as e:
        try:
            _log(f"REGISTER OUTER CATCH: {type(e).__name__}: {e}")
            import traceback
            tb = traceback.format_exc().encode("ascii", errors="replace").decode("ascii")
            _log(tb)
            detail = str(e)[:300].encode("ascii", errors="replace").decode("ascii")
        except Exception:
            detail = "Registration failed (encoding error on Windows - try different email)"
        return JSONResponse(status_code=400, content={"detail": detail})


def _do_register(payload: RegisterRequest):
    import time
    # Fix Windows thread encoding
    if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    try:
        _log(f"REGISTER START: {payload.email}")
        # Pre-check: ensure database tables exist
        try:
            supabase.table("roles").select("id").limit(1).execute()
        except Exception as db_err:
            _log(f"Database check failed: {db_err}")
            raise HTTPException(
                status_code=503,
                detail="Database not set up. Run database/FRESH_SETUP.sql in Supabase SQL Editor.",
            )
        
        result = None
        user_id = None
        user_email = payload.email
        confirmation_sent = False

        # Redirect URL after email confirmation (add to Supabase Auth URL config)
        frontend_url = os.getenv("FRONTEND_URL", os.getenv("SITE_URL", "http://localhost:3000")).rstrip("/")
        redirect_to = f"{frontend_url}/confirmation-success"

        # Method 1: sign_up (anon) - sends confirmation email via Custom SMTP
        try:
            _log("Trying sign_up (sends confirmation email)...")
            result = supabase_auth.auth.sign_up({
                "email": payload.email.strip().lower(),
                "password": payload.password,
                "options": {
                    "data": {"full_name": payload.full_name},
                    "emailRedirectTo": redirect_to,
                },
            })
            if result and getattr(result, "user", None):
                user_id = str(result.user.id)
                user_email = getattr(result.user, "email", None) or payload.email
                # If session is None, Supabase sent confirmation email (Confirm email enabled)
                confirmation_sent = getattr(result, "session", None) is None
                _log(f"sign_up OK: {user_id} confirmation_sent={confirmation_sent}")
        except Exception as e1:
            _log(f"sign_up failed: {type(e1).__name__}: {e1}")
            # Method 2: create_user (service_role) - auto-confirm, no email
            try:
                _log("Trying create_user fallback...")
                result = supabase.auth.admin.create_user({
                    "email": payload.email.strip().lower(),
                    "password": payload.password,
                    "email_confirm": True,
                    "user_metadata": {"full_name": payload.full_name},
                })
                if result and getattr(result, "user", None):
                    user_id = str(result.user.id)
                    user_email = getattr(result.user, "email", None) or payload.email
                    _log(f"create_user OK: {user_id}")
            except Exception as e2:
                _log(f"create_user failed: {type(e2).__name__}: {e2}")
                err = str(e2).lower()
                if "already" in err or "exists" in err or "registered" in err:
                    raise HTTPException(400, "This email is already registered. Please log in.")
                raise HTTPException(400, f"Supabase error: {str(e2)[:200]}")

        if not user_id:
            raise HTTPException(400, "Registration failed: Could not create user.")

        # Ensure user_profiles exists
        time.sleep(0.4)
        try:
            profile = supabase.table("user_profiles").select("id").eq("id", user_id).execute()
            if not profile.data:
                role_row = supabase.table("roles").select("id").eq("name", "user").limit(1).execute()
                role_id = role_row.data[0]["id"] if role_row.data else None
                if role_id:
                    supabase.table("user_profiles").insert({
                        "id": user_id, "full_name": payload.full_name,
                        "role_id": role_id, "is_active": True,
                        "email": (user_email or payload.email or "").strip()
                    }).execute()
                    _log("Created user_profiles")
        except Exception as pe:
            _log(f"Profile backup: {pe}")

        _log(f"REGISTER SUCCESS: {user_id}")
        if confirmation_sent:
            msg = "Registration successful. Check your email for a confirmation link. Click it to activate your account, then log in."
        else:
            msg = "Registration successful. You can log in now."
        return {
            "user_id": user_id,
            "email": str(user_email or payload.email),
            "confirmation_sent": confirmation_sent,
            "message": msg,
        }

    except HTTPException as he:
        # Re-raise HTTPException so FastAPI handles it
        raise he
    except BaseException as e:
        _log(f"REGISTER ERROR: {type(e).__name__}: {e}")
        import traceback
        tb = traceback.format_exc().encode("ascii", errors="replace").decode("ascii")
        _log(tb)
        sys.stdout.flush()
        err = str(e).lower()
        msg = str(e)[:300]
        if "already" in err or "exists" in err or "registered" in err:
            msg = "This email is already registered. Please log in."
        elif "email" in err and "confirm" in err:
            msg = "Disable Confirm email in Supabase Auth Providers"
        elif "roles" in err or "user_profiles" in err or "relation" in err:
            return JSONResponse(status_code=503, content={"detail": "Run database/FRESH_SETUP.sql in Supabase SQL Editor."})
        # Return 400 directly - ASCII-safe for Windows
        safe_msg = msg.encode("ascii", errors="replace").decode("ascii")
        return JSONResponse(status_code=400, content={"detail": safe_msg})


@api_router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    """
    Sign in with email/password. Returns JWT tokens and user profile.
    """
    email = payload.email.strip().lower()
    password = payload.password
    result = None

    try:
        # Try ANON_KEY client first (recommended for sign_in)
        result = supabase_auth.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
    except Exception as e1:
        print(f"Login (anon) error: {e1}")
        try:
            # Fallback: try SERVICE_ROLE client
            result = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
        except Exception as e2:
            print(f"Login (service_role) error: {e2}")
            err = str(e2).lower()
            if "invalid" in err or "login" in err or "credentials" in err:
                raise HTTPException(
                    status_code=401,
                    detail=f"Invalid email or password. (Supabase: {str(e2)[:100]})",
                )
            if "email" in err and "confirm" in err:
                raise HTTPException(
                    status_code=401,
                    detail="Email not confirmed. Add user with Auto Confirm in Supabase.",
                )
            raise HTTPException(status_code=500, detail=str(e2))

    try:
        if not result.user or not result.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_id = str(result.user.id)
        profile = supabase.table("user_profiles").select(
            "id, full_name, role_id, is_active, created_at"
        ).eq("id", user_id).single().execute()

        if not profile.data:
            raise HTTPException(
                status_code=404,
                detail="User profile not found. Run database/FIX_USER_PROFILE.sql in Supabase SQL Editor.",
            )

        if profile.data.get("is_active") is False:
            raise HTTPException(
                status_code=403,
                detail="Your account is inactive. Contact your administrator.",
            )

        role_row = supabase.table("roles").select("name").eq(
            "id", profile.data["role_id"]
        ).single().execute()
        role_name = role_row.data["name"] if role_row.data else "user"
        frontend_role = _normalize_role(role_name)

        # Load section permissions for sidebar visibility
        section_permissions: list[dict] = []
        try:
            perm_r = supabase.table("user_section_permissions").select("section_key, can_view, can_edit").eq("user_id", user_id).execute()
            perm_rows = perm_r.data or []
            by_key = {p["section_key"]: p for p in perm_rows}
            for key in SECTION_KEYS:
                p = by_key.get(key)
                section_permissions.append({
                    "section_key": key,
                    "can_view": p["can_view"] if p else True,
                    "can_edit": p["can_edit"] if p else False,
                })
        except Exception:
            section_permissions = [{"section_key": k, "can_view": True, "can_edit": False} for k in SECTION_KEYS]

        user = {
            "id": user_id,
            "email": result.user.email or payload.email,
            "full_name": profile.data["full_name"],
            "display_name": profile.data.get("display_name") or profile.data["full_name"],
            "role": frontend_role,
            "is_active": profile.data.get("is_active", True),
            "created_at": str(profile.data.get("created_at", "")),
            "section_permissions": section_permissions,
        }

        return LoginResponse(
            access_token=result.session.access_token,
            refresh_token=result.session.refresh_token,
            user=user,
            requires_otp=False,
        )
    except HTTPException:
        raise
    except Exception as e:
        err = str(e).lower()
        print(f"Login (profile) error: {e}")
        if "invalid" in err or "login" in err or "credentials" in err:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if "profile" in err or "404" in err:
            raise HTTPException(
                status_code=404,
                detail="User profile not found. Run database/FIX_USER_PROFILE.sql in Supabase.",
            )
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/me")
@api_router.get("/users/me")
def get_me(auth: dict = Depends(get_current_user)):
    """Get current user profile. Requires Bearer token. Both /me and /users/me work."""
    user_id = auth["id"]
    profile = supabase.table("user_profiles").select(
        "id, full_name, display_name, role_id, is_active, created_at"
    ).eq("id", user_id).single().execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    role_row = supabase.table("roles").select("name").eq(
        "id", profile.data["role_id"]
    ).single().execute()
    role_name = role_row.data["name"] if role_row.data else "user"
    frontend_role = _normalize_role(role_name)

    # Load section permissions for sidebar visibility
    section_permissions: list[dict] = []
    try:
        perm_r = supabase.table("user_section_permissions").select("section_key, can_view, can_edit").eq("user_id", user_id).execute()
        perm_rows = perm_r.data or []
        by_key = {p["section_key"]: p for p in perm_rows}
        for key in SECTION_KEYS:
            p = by_key.get(key)
            section_permissions.append({
                "section_key": key,
                "can_view": p["can_view"] if p else True,
                "can_edit": p["can_edit"] if p else False,
            })
    except Exception:
        section_permissions = [{"section_key": k, "can_view": True, "can_edit": False} for k in SECTION_KEYS]

    return {
        "id": user_id,
        "email": auth["email"],
        "full_name": profile.data["full_name"],
        "display_name": profile.data.get("display_name") or profile.data["full_name"],
        "role": frontend_role,
        "is_active": profile.data.get("is_active", True),
        "created_at": str(profile.data.get("created_at", "")),
        "section_permissions": section_permissions,
    }


@api_router.post("/auth/logout")
def logout():
    """
    Optional: server-side logout. Client clears token regardless.
    No auth required - user may have expired token.
    """
    return {"message": "Logged out successfully"}


@api_router.get("/auth/confirm")
def confirm_email(token: str, type: str = "signup"):
    """Handle email confirmation callback from Supabase."""
    return {"success": True, "message": "Email confirmed successfully"}


class ResendConfirmRequest(BaseModel):
    email: str


@api_router.post("/auth/resend-confirmation")
def resend_confirmation(payload: ResendConfirmRequest):
    """Resend confirmation email to user who didn't receive it. Uses Supabase auth.resend."""
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(400, "Email is required")
    try:
        supabase_auth.auth.resend({"type": "signup", "email": email})
        return {"success": True, "message": "Confirmation email resent. Check your inbox (and spam folder)."}
    except Exception as e:
        err = str(e).lower()
        if "already" in err or "confirmed" in err:
            return {"success": True, "message": "Your email is already confirmed. You can log in."}
        if "rate" in err or "limit" in err:
            raise HTTPException(429, "Please wait a few minutes before requesting another email.")
        raise HTTPException(400, f"Could not resend: {str(e)[:150]}")


# ---------- Tickets ----------
def _ensure_str(v: any) -> str | None:
    """Coerce value to str for API; avoid 'Input should be a valid string' when frontend sends number/object."""
    if v is None:
        return None
    if isinstance(v, str):
        return v
    if isinstance(v, (int, float, bool)):
        return str(v)
    if hasattr(v, "__str__"):
        return str(v)
    return None


class CreateTicketRequest(BaseModel):
    title: str
    description: str | None = None
    type: str  # bug, feature, chore
    priority: str = "medium"
    assignee_id: str | None = None
    company_id: str | None = None
    page_id: str | None = None
    division_id: str | None = None
    division_other: str | None = None
    user_name: str | None = None
    communicated_through: str | None = None
    submitted_by: str | None = None
    query_arrival_at: str | None = None
    quality_of_response: str | None = None
    customer_questions: str | None = None
    query_response_at: str | None = None
    why_feature: str | None = None
    attachment_url: str | None = None

    @model_validator(mode="before")
    @classmethod
    def coerce_string_fields(cls, data: any):
        """Ensure all string fields receive a string or None (fixes 'Input should be a valid string')."""
        if not isinstance(data, dict):
            return data
        out = dict(data)
        string_fields = (
            "title", "description", "type", "priority", "assignee_id", "company_id", "page_id",
            "division_id", "division_other", "user_name", "communicated_through", "submitted_by",
            "query_arrival_at", "quality_of_response", "customer_questions", "query_response_at",
            "why_feature", "attachment_url",
        )
        for k in string_fields:
            if k not in out:
                continue
            v = out[k]
            if v is None:
                continue
            if k == "title":
                out[k] = _ensure_str(v) or ""
            elif isinstance(v, str):
                continue
            else:
                out[k] = _ensure_str(v)
        return out


class UpdateTicketRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee_id: str | None = None
    resolution_notes: str | None = None
    remarks: str | None = None
    approval_status: str | None = None
    approval_actual_at: str | None = None
    unapproval_actual_at: str | None = None
    # SLA stages (Chores & Bugs)
    status_1: str | None = None
    actual_1: str | None = None
    planned_2: str | None = None
    status_2: str | None = None
    actual_2: str | None = None
    planned_3: str | None = None
    status_3: str | None = None
    actual_3: str | None = None
    planned_4: str | None = None
    status_4: str | None = None
    actual_4: str | None = None
    quality_solution: str | None = None
    # Staging workflow (Stage 1–3)
    staging_planned: str | None = None
    staging_review_status: str | None = None
    staging_review_actual: str | None = None
    live_planned: str | None = None
    live_actual: str | None = None
    live_status: str | None = None
    live_review_planned: str | None = None
    live_review_actual: str | None = None
    live_review_status: str | None = None


class CreateTicketResponseRequest(BaseModel):
    response_text: str


class SupportTicketDraftPayload(BaseModel):
    """Draft form data for Submit Support Ticket (JSON-serializable)."""
    draft_data: dict


_DRAFT_EXPIRY_HOURS = 24


@api_router.get("/drafts/support-ticket")
def get_support_ticket_draft(auth: dict = Depends(get_current_user)):
    """Get current user's support ticket draft. Returns 404 if none or if draft is older than 24 hours."""
    user_id = auth["id"]
    r = supabase.table("support_ticket_drafts").select("draft_data, updated_at").eq("user_id", user_id).limit(1).execute()
    if not r.data or len(r.data) == 0:
        raise HTTPException(status_code=404, detail="No draft found")
    row = r.data[0]
    updated_at_str = row.get("updated_at")
    if updated_at_str:
        try:
            updated = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
            if updated.tzinfo is None:
                updated = updated.replace(tzinfo=timezone.utc)
            expiry = datetime.now(timezone.utc) - timedelta(hours=_DRAFT_EXPIRY_HOURS)
            if updated < expiry:
                supabase.table("support_ticket_drafts").delete().eq("user_id", user_id).execute()
                raise HTTPException(status_code=404, detail="Draft expired (older than 24 hours)")
        except (ValueError, TypeError):
            pass
    return {"draft_data": row.get("draft_data") or {}}


@api_router.put("/drafts/support-ticket")
def save_support_ticket_draft(payload: SupportTicketDraftPayload, auth: dict = Depends(get_current_user)):
    """Save or update support ticket draft for current user. One draft per user."""
    user_id = auth["id"]
    data = {"user_id": user_id, "draft_data": payload.draft_data or {}}
    try:
        r = supabase.table("support_ticket_drafts").upsert(data, on_conflict="user_id").execute()
        return {"ok": True}
    except Exception as e:
        _log(f"Save draft error: {e}")
        raise HTTPException(status_code=400, detail=str(e)[:200])


@api_router.delete("/drafts/support-ticket")
def delete_support_ticket_draft(auth: dict = Depends(get_current_user)):
    """Delete current user's support ticket draft (e.g. after successful submit)."""
    user_id = auth["id"]
    supabase.table("support_ticket_drafts").delete().eq("user_id", user_id).execute()
    return {"ok": True}


@api_router.post("/tickets")
def create_ticket(payload: CreateTicketRequest, auth: dict = Depends(get_current_user)):
    data = {
        "title": payload.title,
        "description": payload.description or "",
        "type": payload.type,
        "priority": payload.priority or "medium",
        "created_by": auth["id"],
        "assignee_id": payload.assignee_id,
    }
    # Feature requests start as pending approval (show in Approval Status section)
    if payload.type == "feature":
        data["approval_status"] = None
    extras = ["company_id", "page_id", "division_id", "division_other", "user_name", "communicated_through", "submitted_by", "query_arrival_at", "quality_of_response", "customer_questions", "query_response_at", "why_feature", "attachment_url"]
    for k in extras:
        v = getattr(payload, k, None)
        if v is None:
            continue
        if k in ("company_id", "page_id", "division_id") and v == "":
            continue
        if k == "attachment_url":
            if not v or not str(v).strip():
                continue
            _log(f"Create ticket with attachment_url: {str(v)[:80]}...")
        data[k] = v
    try:
        r = supabase.table("tickets").insert(data).execute()
        return r.data[0] if r.data else {}
    except Exception as e:
        _log(f"Create ticket error: {e}")
        err_msg = str(e).strip()[:400]
        raise HTTPException(
            status_code=400,
            detail=f"Could not create ticket: {err_msg}",
        )


# Fallback: reference_no -> company_name when tickets.company_name is null (e.g. production DB not updated).
# Loaded from tickets table (matching TICKETS_UPDATE_COMPANY_NAMES.sql); cache populated on first use.
_REF_NO_TO_COMPANY: dict[str, str] = {}
_REF_NO_TO_COMPANY_LOADED = False
def _build_ref_no_to_company() -> dict[str, str]:
    global _REF_NO_TO_COMPANY, _REF_NO_TO_COMPANY_LOADED
    if _REF_NO_TO_COMPANY_LOADED:
        return _REF_NO_TO_COMPANY
    _REF_NO_TO_COMPANY_LOADED = True
    try:
        r = supabase.table("tickets").select("reference_no, company_name").not_.is_("company_name", "null").execute()
        rows = r.data or []
        _REF_NO_TO_COMPANY = {row["reference_no"]: row["company_name"] for row in rows if row.get("reference_no") and row.get("company_name")}
    except Exception as e:
        _log(f"ref_no_to_company: failed to load from DB: {e}")
    return _REF_NO_TO_COMPANY


def _enrich_tickets_with_lookups(rows: list) -> list:
    """Add company_name, page_name, division_name from lookup tables."""
    if not rows:
        return rows
    ref_to_company = _build_ref_no_to_company()
    company_ids = {r.get("company_id") for r in rows if r.get("company_id")}
    page_ids = {r.get("page_id") for r in rows if r.get("page_id")}
    division_ids = {r.get("division_id") for r in rows if r.get("division_id")}
    companies_map, pages_map, divisions_map = {}, {}, {}
    try:
        if company_ids:
            r = supabase.table("companies").select("id,name").in_("id", list(company_ids)).execute()
            companies_map = {c["id"]: c["name"] for c in (r.data or [])}
    except Exception:
        pass
    try:
        if page_ids:
            r = supabase.table("pages").select("id,name").in_("id", list(page_ids)).execute()
            pages_map = {p["id"]: p["name"] for p in (r.data or [])}
    except Exception:
        pass
    try:
        if division_ids:
            r = supabase.table("divisions").select("id,name").in_("id", list(division_ids)).execute()
            divisions_map = {d["id"]: d["name"] for d in (r.data or [])}
    except Exception:
        pass
    approved_by_ids = {r.get("approved_by") for r in rows if r.get("approved_by")}
    approvers_map = {}
    try:
        if approved_by_ids:
            r = supabase.table("user_profiles").select("id, full_name").in_("id", list(approved_by_ids)).execute()
            approvers_map = {a["id"]: a.get("full_name") or "Unknown" for a in (r.data or [])}
    except Exception:
        pass
    for row in rows:
        # Prefer ticket's own company_name; then companies lookup; then reference_no fallback (for production when DB not updated)
        row["company_name"] = (
            (row.get("company_name") and str(row.get("company_name")).strip())
            or (companies_map.get(row.get("company_id")) if row.get("company_id") else None)
            or ref_to_company.get(row.get("reference_no") or "")
        )
        row["page_name"] = pages_map.get(row.get("page_id")) if row.get("page_id") else None
        row["division_name"] = divisions_map.get(row.get("division_id")) if row.get("division_id") else None
        row["approved_by_name"] = approvers_map.get(row.get("approved_by")) if row.get("approved_by") else None
    return rows


@api_router.get("/tickets")
def list_tickets(
    status: str | None = None,
    type: str | None = None,
    types_in: str | None = None,
    company_id: str | None = None,
    priority: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    search: str | None = None,
    reference_filter: str | None = None,  # Filter by reference_no (partial match)
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 50,
    section: str | None = None,
    approval_filter: str | None = None,  # For section=approval-status: pending | unapproved | all
    status_2_filter: str | None = None,  # For section=chores-bugs: pending | completed | staging | hold (Stage 2 status)
    search_all_sections: bool = False,   # When True + search present: ignore section/type, search all tickets
    auth: dict = Depends(get_current_user),
):
    # Approval Status section: only admin, master_admin and approver
    if section == "approval-status":
        role = _get_role_from_profile(auth["id"])
        if role not in ("admin", "master_admin", "approver"):
            raise HTTPException(status_code=403, detail="Approval Status is only available to Admin and Approver roles")
    q = supabase.table("tickets").select("*", count="exact")
    # When global search: bypass section/type filters to search across all tickets
    apply_section_filter = section and not (search_all_sections and search and search.strip())
    # Status filter: use status for non–Chores & Bugs; for Chores & Bugs use status_2_filter (Stage 2) instead
    use_status_2_for_chores = apply_section_filter and section == "chores-bugs" and status_2_filter
    if status and not use_status_2_for_chores:
        q = q.eq("status", status)
    if apply_section_filter and section == "completed-chores-bugs":
        types_list = ["chore", "bug"]
        q = q.in_("type", types_list)
        q = q.or_("quality_solution.not.is.null,live_review_status.eq.completed")
    elif apply_section_filter and section == "solutions":
        q = q.not_.is_("quality_solution", "null")
    elif apply_section_filter and section == "completed-feature":
        # Feature: when Stage 2 (live) completed -> auto-move to Completed Feature
        q = q.eq("type", "feature")
        q = q.eq("live_status", "completed")
    elif apply_section_filter and section == "staging":
        # Tickets in Staging: (new workflow: staging_planned set OR old: status_2 = staging) AND not completed Stage 3
        q = q.or_("staging_planned.not.is.null,status_2.eq.staging")
        q = q.or_("live_review_status.is.null,live_review_status.neq.completed")
    elif apply_section_filter and section == "chores-bugs":
        types_list = ["chore", "bug"]
        q = q.in_("type", types_list)
        q = q.is_("quality_solution", "null")
        if status_2_filter and status_2_filter.lower() in ("pending", "completed", "staging", "hold"):
            q = q.eq("status_2", status_2_filter.lower())
            # When filtering by staging: include chore/bug with status_2=staging (override staging exclusion)
            if status_2_filter.lower() != "staging":
                q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
                q = q.or_("status_2.is.null,status_2.neq.staging")
        else:
            # Exclude tickets in Staging (new workflow or old status_2 = staging)
            q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
            q = q.or_("status_2.is.null,status_2.neq.staging")
    elif apply_section_filter and section == "approval-status":
        # Feature requests: only Pending and Unapproved (exclude Approved)
        q = q.eq("type", "feature")
        q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
        if approval_filter == "pending":
            q = q.is_("approval_status", "null")
        elif approval_filter == "unapproved":
            q = q.eq("approval_status", "unapproved")
        else:
            # all (default): show both pending and unapproved
            q = q.or_("approval_status.is.null,approval_status.eq.unapproved")
    elif apply_section_filter and types_in:
        types_list = [t.strip() for t in types_in.split(",") if t.strip()]
        if types_list:
            q = q.in_("type", types_list)
            q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
    elif apply_section_filter and type:
        q = q.eq("type", type)
        if type == "feature":
            # Feature section: approved/unapproved, not yet in Completed Feature (live_status != completed)
            q = q.not_.is_("approval_status", "null")
            q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
            q = q.or_("live_status.is.null,live_status.neq.completed")
    if company_id:
        q = q.eq("company_id", company_id)
    if priority:
        q = q.eq("priority", priority)
    if date_from:
        q = q.gte("created_at", date_from)
    if date_to:
        q = q.lte("created_at", date_to)
    if search and search.strip():
        safe = search.strip().replace("%", "").replace("_", "")[:200]
        if safe:
            q = q.or_(
                f"title.ilike.%{safe}%,description.ilike.%{safe}%,user_name.ilike.%{safe}%,"
                f"submitted_by.ilike.%{safe}%,customer_questions.ilike.%{safe}%,reference_no.ilike.%{safe}%,"
                f"company_name.ilike.%{safe}%,quality_of_response.ilike.%{safe}%,quality_solution.ilike.%{safe}%,why_feature.ilike.%{safe}%"
            )
    if reference_filter and reference_filter.strip():
        safe_ref = reference_filter.strip().replace("%", "").replace("_", "")[:80]
        if safe_ref:
            q = q.ilike("reference_no", f"%{safe_ref}%")
    order_col = sort_by if sort_by in ("created_at", "updated_at", "query_arrival_at", "query_response_at", "title", "status", "priority") else "created_at"
    q = q.order(order_col, desc=(sort_order.lower() == "desc"))
    q = q.range((page - 1) * limit, page * limit - 1)
    r = q.execute()
    rows = _enrich_tickets_with_lookups(r.data or [])
    return {"data": rows, "total": r.count or 0, "page": page, "limit": limit}


def _level3_used_for_ticket(ticket_id: str, user_id: str) -> bool:
    """True if this Level 3 user has already used their one-time edit on this ticket."""
    try:
        r = supabase.table("ticket_level3_edit_used").select("ticket_id").eq("ticket_id", ticket_id).eq("user_id", user_id).limit(1).execute()
        return bool(r.data and len(r.data) > 0)
    except Exception:
        return False


def _mark_level3_edit_used(ticket_id: str, user_id: str) -> None:
    """Record that this Level 3 user has used their one-time edit on this ticket (idempotent)."""
    try:
        supabase.table("ticket_level3_edit_used").insert(
            {"ticket_id": ticket_id, "user_id": user_id}
        ).execute()
    except Exception:
        pass  # ignore duplicate (already used)


@api_router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str, auth: dict = Depends(get_current_user)):
    r = supabase.table("tickets").select("*").eq("id", ticket_id).single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    rows = _enrich_tickets_with_lookups([r.data])
    out = rows[0] if rows else r.data
    role = _get_role_from_profile(auth["id"])
    if role == "user":
        out["level3_used_by_current_user"] = _level3_used_for_ticket(ticket_id, auth["id"])
    else:
        out["level3_used_by_current_user"] = False
    return out


def _apply_staging_cascade(data: dict, ticket_id: str) -> dict:
    """Apply staging workflow cascade: set actual/planned when status changes to completed."""
    now = datetime.utcnow().isoformat()
    if data.get("staging_review_status") == "completed":
        data["staging_review_actual"] = now
        data["live_planned"] = now
    if data.get("live_status") == "completed":
        data["live_actual"] = now
        data["live_review_planned"] = now
    if data.get("live_review_status") == "completed":
        data["live_review_actual"] = now
        data["status"] = "resolved"
        data["resolved_at"] = now
    return data


def _apply_approval_actual_times(data: dict) -> dict:
    """Set approval_actual_at / unapproval_actual_at when approval_status is set."""
    now = datetime.utcnow().isoformat()
    if data.get("approval_status") == "approved" and "approval_actual_at" not in data:
        data["approval_actual_at"] = now
    if data.get("approval_status") == "unapproved" and "unapproval_actual_at" not in data:
        data["unapproval_actual_at"] = now
    return data


# Stage keys for Level 3 one-time edit tracking. Stage 2 is excluded so Users can edit it multiple times.
_STAGE_1_EDIT_KEYS = {"status_1", "actual_1"}
_STAGE_2_EDIT_KEYS = {"status_2", "actual_2"}
_STAGE_3_EDIT_KEYS = {"status_3", "actual_3"}
_STAGE_4_EDIT_KEYS = {"status_4", "actual_4"}
_FEATURE_STAGE_2_KEYS = {"live_status", "live_actual", "live_planned"}


@api_router.put("/tickets/{ticket_id}")
def update_ticket(ticket_id: str, payload: UpdateTicketRequest, auth: dict = Depends(get_current_user)):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    role = _get_role_from_profile(auth["id"])
    # Approve/Unapprove: only admin, master_admin and approver
    if "approval_status" in data:
        if role not in ("admin", "master_admin", "approver"):
            raise HTTPException(status_code=403, detail="Only Admin or Approver can approve or unapprove tickets")
        now = datetime.utcnow().isoformat()
        data["approved_by"] = auth["id"]
        data["approval_source"] = "ui"
    if data.get("status") == "resolved" and "resolved_at" not in data:
        data["resolved_at"] = datetime.utcnow().isoformat()
    data = _apply_approval_actual_times(data)
    data = _apply_staging_cascade(data, ticket_id)
    r = supabase.table("tickets").update(data).eq("id", ticket_id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # Log approval/rejection for audit
    if "approval_status" in data:
        try:
            status_log = "approved" if data["approval_status"] == "approved" else "rejected"
            supabase.table("approval_logs").insert({
                "ticket_id": ticket_id,
                "approved_by": auth["id"],
                "approved_at": data.get("approval_actual_at") or data.get("unapproval_actual_at") or datetime.utcnow().isoformat(),
                "status": status_log,
                "source": "ui",
                "remarks": data.get("remarks"),
            }).execute()
        except Exception:
            pass
    # Level 3 (user): one-time edit for Stage 1, 3, 4. Stage 2 stays editable multiple times for all users.
    if role == "user":
        updated = r.data[0]
        ticket_type = updated.get("type") or (supabase.table("tickets").select("type").eq("id", ticket_id).single().execute().data or {}).get("type")
        if ticket_type in ("chore", "bug") and (data.keys() & (_STAGE_1_EDIT_KEYS | _STAGE_3_EDIT_KEYS | _STAGE_4_EDIT_KEYS)):
            _mark_level3_edit_used(ticket_id, auth["id"])
        if ticket_type == "feature" and (data.keys() & _FEATURE_STAGE_2_KEYS):
            _mark_level3_edit_used(ticket_id, auth["id"])
    return r.data[0]


@api_router.post("/tickets/{ticket_id}/mark-staging")
def mark_ticket_staging(ticket_id: str, auth: dict = Depends(get_current_user)):
    """Mark a ticket as Staging: set Stage 1 planned and status. Ticket will appear only in Staging section."""
    r = supabase.table("tickets").select("id, staging_planned").eq("id", ticket_id).single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if r.data.get("staging_planned"):
        raise HTTPException(status_code=400, detail="Ticket is already in Staging")
    role = _get_role_from_profile(auth["id"])
    now = datetime.utcnow().isoformat()
    data = {"staging_planned": now, "staging_review_status": "pending"}
    out = supabase.table("tickets").update(data).eq("id", ticket_id).execute()
    if out.data and role == "user":
        _mark_level3_edit_used(ticket_id, auth["id"])
    return out.data[0] if out.data else {}


@api_router.post("/tickets/{ticket_id}/staging-back")
def staging_back(ticket_id: str, auth: dict = Depends(get_current_user)):
    """Move ticket back from Staging to Chores & Bugs: clear all staging fields and set status_2 = pending."""
    r = supabase.table("tickets").select("id").eq("id", ticket_id).single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    data = {
        "staging_planned": None,
        "staging_review_actual": None,
        "staging_review_status": None,
        "live_planned": None,
        "live_actual": None,
        "live_status": None,
        "live_review_planned": None,
        "live_review_actual": None,
        "live_review_status": None,
        "status_2": "pending",
    }
    out = supabase.table("tickets").update(data).eq("id", ticket_id).execute()
    return out.data[0] if out.data else {}


# ---------- Approval Settings (Role 1 / Admin only) ----------
class ApprovalSettingsResponse(BaseModel):
    approval_emails: str


class ApprovalSettingsUpdate(BaseModel):
    approval_emails: str


@api_router.get("/approval-settings", response_model=ApprovalSettingsResponse)
def get_approval_settings(auth: dict = Depends(require_roles(["admin", "master_admin"]))):
    """Get approval email addresses. Admin only."""
    r = supabase.table("approval_settings").select("value").eq("key", "approval_emails").limit(1).execute()
    value = (r.data[0]["value"] or "") if r.data else ""
    return ApprovalSettingsResponse(approval_emails=value)


@api_router.put("/approval-settings")
def update_approval_settings(
    payload: ApprovalSettingsUpdate,
    auth: dict = Depends(require_roles(["admin", "master_admin"])),
):
    """Set approval email addresses (comma-separated). Admin only."""
    supabase.table("approval_settings").update({
        "value": payload.approval_emails.strip(),
        "updated_at": datetime.utcnow().isoformat(),
        "updated_by": auth["id"],
    }).eq("key", "approval_emails").execute()
    return {"message": "Approval emails updated"}


# ---------- Email-based approval (tokenized, one-time) ----------
class ApprovalByTokenRequest(BaseModel):
    token: str
    action: str  # approve | reject


class CreateApprovalTokensRequest(BaseModel):
    ticket_id: str


def _frontend_base_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:3001").rstrip("/")


@api_router.post("/approval/create-tokens")
def create_approval_tokens(
    payload: CreateApprovalTokensRequest,
    auth: dict = Depends(require_roles(["admin", "master_admin", "approver"])),
):
    """
    Create one-time approve/reject tokens for a ticket (e.g. to send approval emails).
    Returns the approval and reject URLs. Tokens expire in 7 days.
    """
    from datetime import timedelta
    ticket_id = payload.ticket_id
    r = supabase.table("tickets").select("id, type, approval_status").eq("id", ticket_id).single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if r.data.get("type") != "feature":
        raise HTTPException(status_code=400, detail="Only feature tickets require approval tokens")
    if r.data.get("approval_status") is not None:
        raise HTTPException(status_code=400, detail="Ticket already approved or rejected")
    expires = (datetime.utcnow() + timedelta(days=7)).isoformat()
    base = _frontend_base_url()
    tokens_out = []
    for action in ("approve", "reject"):
        row = supabase.table("approval_tokens").insert({
            "ticket_id": ticket_id,
            "action": action,
            "expires_at": expires,
        }).execute()
        if row.data and len(row.data) > 0:
            token = row.data[0].get("token")
            if token:
                tokens_out.append({"action": action, "url": f"{base}/approval/confirm?token={token}&action={action}"})
    return {"ticket_id": ticket_id, "links": tokens_out, "expires_in_days": 7}


@api_router.post("/approval/execute-by-token")
def approval_execute_by_token(payload: ApprovalByTokenRequest):
    """
    Execute approve/reject from email link. No auth required; token is one-time and time-limited.
    """
    import uuid
    try:
        token_uuid = uuid.UUID(payload.token)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid token")
    r = supabase.table("approval_tokens").select("*").eq("token", str(token_uuid)).is_("used_at", "null").execute()
    if not r.data or len(r.data) == 0:
        raise HTTPException(status_code=400, detail="Token already used or invalid")
    row = r.data[0]
    if row["action"] != payload.action:
        raise HTTPException(status_code=400, detail="Token action mismatch")
    from datetime import datetime as dt, timezone
    exp = row["expires_at"]
    try:
        exp_dt = dt.fromisoformat(str(exp).replace("Z", "+00:00")) if isinstance(exp, str) else exp
        if exp_dt and dt.now(timezone.utc) > exp_dt:
            raise HTTPException(status_code=400, detail="Token expired")
    except (TypeError, ValueError):
        pass
    ticket_id = row["ticket_id"]
    now = datetime.utcnow().isoformat()
    status = "approved" if payload.action == "approve" else "unapproved"
    update_data = {
        "approval_status": status,
        "approval_source": "email",
        "approved_by": None,
        "approval_actual_at": now if status == "approved" else None,
        "unapproval_actual_at": now if status == "unapproved" else None,
    }
    supabase.table("tickets").update(update_data).eq("id", ticket_id).execute()
    supabase.table("approval_tokens").update({"used_at": now}).eq("id", row["id"]).execute()
    supabase.table("approval_logs").insert({
        "ticket_id": ticket_id,
        "approved_by": None,
        "approved_at": now,
        "status": "approved" if status == "approved" else "rejected",
        "source": "email",
    }).execute()
    return {"success": True, "status": status, "ticket_id": ticket_id}


@api_router.get("/tickets/{ticket_id}/responses")
def list_ticket_responses(ticket_id: str, auth: dict = Depends(get_current_user)):
    try:
        r = supabase.table("ticket_responses").select("*").eq("ticket_id", ticket_id).order("created_at", desc=False).execute()
        rows = r.data or []
    except Exception:
        rows = []
    user_ids = {row.get("responded_by") for row in rows if row.get("responded_by")}
    names_map = {}
    if user_ids:
        try:
            up_r = supabase.table("user_profiles").select("id,full_name").in_("id", list(user_ids)).execute()
            names_map = {u["id"]: u.get("full_name", "") for u in (up_r.data or [])}
        except Exception:
            pass
    for row in rows:
        row["responded_by_name"] = names_map.get(row.get("responded_by"), "")
    return {"data": rows}


class SubmitQualitySolutionRequest(BaseModel):
    quality_solution: str


@api_router.post("/tickets/{ticket_id}/quality-solution")
def submit_quality_solution(ticket_id: str, payload: SubmitQualitySolutionRequest, auth: dict = Depends(get_current_user)):
    """Submit Quality of Solution (Chores & Bugs). Links by Reference No, sets submitted_by and submitted_at."""
    r = supabase.table("tickets").select("id, quality_solution").eq("id", ticket_id).single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if r.data.get("quality_solution"):
        raise HTTPException(status_code=400, detail="Quality solution already submitted")
    profile = supabase.table("user_profiles").select("full_name").eq("id", auth["id"]).single().execute()
    submitted_by = profile.data.get("full_name", auth.get("email", "Unknown")) if profile.data else "Unknown"
    data = {
        "quality_solution": payload.quality_solution.strip(),
        "quality_solution_submitted_by": submitted_by,
        "quality_solution_submitted_at": datetime.utcnow().isoformat(),
    }
    up = supabase.table("tickets").update(data).eq("id", ticket_id).execute()
    return up.data[0] if up.data else {}


@api_router.post("/tickets/{ticket_id}/responses")
def create_ticket_response(ticket_id: str, payload: CreateTicketResponseRequest, auth: dict = Depends(get_current_user)):
    r = supabase.table("tickets").select("id").eq("id", ticket_id).single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    try:
        ins = supabase.table("ticket_responses").insert({
            "ticket_id": ticket_id,
            "response_text": payload.response_text,
            "responded_by": auth["id"],
        }).execute()
        return ins.data[0] if ins.data else {}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add response: {str(e)[:100]}")


@api_router.delete("/tickets/{ticket_id}")
def delete_ticket(ticket_id: str, auth: dict = Depends(get_current_user)):
    supabase.table("tickets").delete().eq("id", ticket_id).execute()
    return {"message": "Deleted"}


# ---------- Activity count (for header badge) ----------
@api_router.get("/activity/count")
def activity_count(auth: dict = Depends(get_current_user)):
    """Return count of recent activity: ticket_history + ticket_comments in the last 30 days."""
    from datetime import timedelta
    since = (datetime.utcnow() - timedelta(days=30)).isoformat()
    total = 0
    try:
        r = supabase.table("ticket_history").select("id", count="exact").gte("created_at", since).execute()
        total += r.count or 0
    except Exception:
        pass
    try:
        r = supabase.table("ticket_comments").select("id", count="exact").gte("created_at", since).execute()
        total += r.count or 0
    except Exception:
        pass
    return {"count": total}


# ---------- Dashboard Metrics ----------
@api_router.get("/dashboard/metrics")
def dashboard_metrics(auth: dict = Depends(get_current_user)):
    """Live Supabase-powered dashboard metrics. Support Overview = Chores & Bug only."""
    from datetime import timedelta
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    week_start = week_ago.replace(hour=0, minute=0, second=0, microsecond=0)

    # Chores & Bug only for Support Overview
    types_chores_bugs = ["chore", "bug"]

    # Current month: total Chores & Bug tickets created this month
    try:
        q = supabase.table("tickets").select("id", count="exact").in_("type", types_chores_bugs).gte("created_at", month_start.isoformat())
        r = q.execute()
        all_tickets = r.count or 0
    except Exception:
        all_tickets = 0

    # Pending till date: all Chores & Bug tickets currently open/in_progress/on_hold (no date filter)
    pending_statuses = ["open", "in_progress", "on_hold"]
    try:
        q = supabase.table("tickets").select("id", count="exact").in_("type", types_chores_bugs).in_("status", pending_statuses)
        r = q.execute()
        pending_till_date = r.count or 0
    except Exception:
        pending_till_date = 0

    # Last week Chores & Bug tickets (for response_delay / completion_delay)
    try:
        q = supabase.table("tickets").select("*").in_("type", types_chores_bugs).gte("created_at", week_start.isoformat())
        r = q.execute()
        week_tickets = r.data or []
    except Exception:
        week_tickets = []

    total_last_week = len(week_tickets)
    pending_last_week = sum(1 for t in week_tickets if t.get("status") in pending_statuses)

    # Response delay: Chores & Bug from last week with no assignee (proxy for SLA breach)
    response_delay = sum(1 for t in week_tickets if not t.get("assignee_id"))

    # Completion delay: Chores & Bug from last week not resolved
    completion_delay = sum(1 for t in week_tickets if not t.get("resolved_at"))

    # In Staging: pending counts by type (Feature vs Chores & Bug)
    staging_pending_feature = 0
    staging_pending_chores_bugs = 0
    try:
        r = supabase.table("staging_deployments").select("ticket_id").eq("status", "pending").execute()
        pending_staging = r.data or []
        ticket_ids = [d["ticket_id"] for d in pending_staging if d.get("ticket_id")]
        if ticket_ids:
            # Fetch ticket types for these ids (batch in chunks if many)
            r2 = supabase.table("tickets").select("id, type").in_("id", ticket_ids).execute()
            tickets_in_staging = r2.data or []
            for t in tickets_in_staging:
                if t.get("type") == "feature":
                    staging_pending_feature += 1
                elif t.get("type") in ("chore", "bug"):
                    staging_pending_chores_bugs += 1
    except Exception:
        pass

    return {
        "all_tickets": all_tickets,
        "pending_till_date": pending_till_date,
        "response_delay": response_delay,
        "completion_delay": completion_delay,
        "total_last_week": total_last_week,
        "pending_last_week": pending_last_week,
        "staging_pending_feature": staging_pending_feature,
        "staging_pending_chores_bugs": staging_pending_chores_bugs,
    }


# ---------- Support Dashboard Stats (FMS-style: weekly, pending grouped, top companies, features) ----------
def _week_of_month(dt: datetime) -> int:
    """Week of month (1-5) based on first Monday of month."""
    year, month = dt.year, dt.month
    first = datetime(year, month, 1)
    first_day = first.weekday()  # 0=Mon, 6=Sun
    first_monday = 1 + (7 - first_day) % 7 if first_day != 0 else 1
    day = dt.day
    week_num = ((day - first_monday) // 7) + 1
    return max(1, min(week_num, 5))


def _days_pending(created_iso: str | None, resolved_iso: str | None) -> int:
    """Days from created (or query_arrival) to now if pending, else 0.
    Uses timezone-aware UTC for comparisons (Supabase returns aware datetimes)."""
    start = created_iso or ""
    if not start:
        return 0
    try:
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
    except Exception:
        return 0
    if resolved_iso:
        try:
            end_dt = datetime.fromisoformat(resolved_iso.replace("Z", "+00:00"))
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)
        except Exception:
            end_dt = datetime.now(timezone.utc)
    else:
        end_dt = datetime.now(timezone.utc)
    delta = end_dt - start_dt
    return max(0, delta.days)


def _is_resolved(status: str | None, completed: str | None) -> bool:
    resolved_statuses = ("completed", "complete", "resolved", "closed", "done", "fixed", "cancelled", "na", "n/a", "rejected")
    s = (status or "").lower().strip()
    c = (completed or "").lower().strip()
    if any(x in s for x in resolved_statuses):
        return True
    if any(x in c for x in resolved_statuses):
        return True
    return False


def _is_on_hold(status: str | None) -> bool:
    h = ("on hold", "on-hold", "hold", "paused", "waiting", "pending more info")
    s = (status or "").lower()
    return any(x in s for x in h)


def _is_pending(status: str | None) -> bool:
    if _is_resolved(status, None):
        return False
    p = ("pending", "open", "in progress", "in-progress", "assigned", "active", "new", "received")
    s = (status or "").lower()
    return any(x in s for x in p)


SLA_RESPONSE_MINUTES = 30


def _has_response_delay(query_arrival: str | None, query_response: str | None) -> tuple[bool, str]:
    """Returns (has_delay, delay_time_text). Response SLA = 30 min."""
    if not query_arrival:
        return False, ""
    try:
        arr = datetime.fromisoformat(str(query_arrival).replace("Z", "+00:00"))
        if query_response:
            resp = datetime.fromisoformat(str(query_response).replace("Z", "+00:00"))
            if arr.tzinfo is None:
                arr = arr.replace(tzinfo=timezone.utc)
            if resp.tzinfo is None:
                resp = resp.replace(tzinfo=timezone.utc)
            delta_min = (resp - arr).total_seconds() / 60
            if delta_min <= SLA_RESPONSE_MINUTES:
                return False, ""
            h, m = int(delta_min // 60), int(delta_min % 60)
            d = h // 24
            hr = h % 24
            if d > 0:
                text = f"Delay: {d}d {hr}h {m}m"
            elif h > 0:
                text = f"Delay: {h}h {m}m"
            else:
                text = f"Delay: {m}m"
            return True, text
        return True, "Awaiting response"
    except Exception:
        return False, ""


SLA_STAGE2_DAYS = 1  # Chores & Bugs Stage 2 TAT: 1 day from planned


def _has_completion_delay(
    resolved_at: str | None,
    created_at: str | None,
    ticket_type: str | None = None,
    planned_2: str | None = None,
    actual_2: str | None = None,
    status_2: str | None = None,
    actual_1: str | None = None,
) -> tuple[bool, str]:
    """Returns (has_delay, delay_time_text).
    Completion delay = ONLY (Chores & Bugs) where Stage 2 Status is 'Completed' AND TAT crossed (actual_2 - planned_2 > 1 day).
    If Stage 2 is Pending, do NOT show in completion delay."""
    if ticket_type not in ("chore", "bug"):
        return False, ""
    if not status_2 or str(status_2).lower() != "completed":
        return False, ""
    p2 = planned_2 or actual_1
    if not p2 or not actual_2:
        return False, ""
    try:
        planned = datetime.fromisoformat(str(p2).replace("Z", "+00:00"))
        actual = datetime.fromisoformat(str(actual_2).replace("Z", "+00:00"))
        if planned.tzinfo is None:
            planned = planned.replace(tzinfo=timezone.utc)
        if actual.tzinfo is None:
            actual = actual.replace(tzinfo=timezone.utc)
        delta_days = (actual - planned).days
        if delta_days > SLA_STAGE2_DAYS:
            return True, f"TAT crossed: {delta_days}d"
        return False, ""
    except Exception:
        return False, ""


@api_router.get("/support-dashboard/stats")
def support_dashboard_stats(auth: dict = Depends(get_current_user)):
    """Support Dashboard: weekly stats, pending grouped by 1-2/2-7/7+/hold, top companies, feature metrics."""
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year
    prev_month = current_month - 1 if current_month > 1 else 12
    prev_year = current_year if current_month > 1 else current_year - 1

    # Fetch ALL chores & bugs for weekly stats (include completed); exclude staging
    # For pending items we filter by quality_solution=null in Python
    try:
        q = supabase.table("tickets").select(
            "id, type, status, company_name, created_at, resolved_at, assignee_id, query_arrival_at, query_response_at, quality_solution, planned_2, actual_2, actual_1, status_2"
        ).in_("type", ["chore", "bug"])
        q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
        q = q.or_("status_2.is.null,status_2.neq.staging")
        r = q.execute()
        all_tickets = r.data or []
        # Tickets for pending items: only those still in Chores & Bugs (quality_solution null)
        def _in_chores_bugs_section(ticket: dict) -> bool:
            qs = ticket.get("quality_solution")
            return qs is None or qs == "" or (isinstance(qs, str) and qs.lower() in ("null", "none"))
        tickets_for_pending = [t for t in all_tickets if _in_chores_bugs_section(t)]
    except Exception as e:
        return {"success": False, "message": str(e)[:200]}

    # Fetch feature tickets for feature metrics
    try:
        fq = supabase.table("tickets").select("id, type, status").eq("type", "feature")
        fr = fq.execute()
        feature_tickets = fr.data or []
    except Exception:
        feature_tickets = []

    pending_statuses = ("open", "in_progress", "on_hold", "pending")
    month_names = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]

    # Weekly stats (4 weeks: current + 3 previous)
    weeks_data = []
    current_week = _week_of_month(now)
    for i in range(4):
        w = current_week - i
        month, year = current_month, current_year
        if w < 1:
            w = 4 + w
            month, year = prev_month, prev_year
        week_label = f"Week {w}"
        week_tickets = [t for t in all_tickets if _get_ticket_week(t) == (w, month, year)]
        total = len(week_tickets)
        chores = sum(1 for t in week_tickets if t.get("type") == "chore")
        bugs = sum(1 for t in week_tickets if t.get("type") == "bug")
        completed = sum(1 for t in week_tickets if _is_resolved(t.get("status"), None) or t.get("resolved_at"))
        response_delay = sum(1 for t in week_tickets if _has_response_delay(t.get("query_arrival_at") or t.get("created_at"), t.get("query_response_at"))[0])
        completion_delay = sum(1 for t in week_tickets if _has_completion_delay(
            t.get("resolved_at"), t.get("created_at"),
            ticket_type=t.get("type"),
            planned_2=t.get("planned_2"), actual_2=t.get("actual_2"),
            status_2=t.get("status_2"), actual_1=t.get("actual_1"),
        )[0])
        weeks_data.append({
            "weekNumber": w,
            "months": [month_names[month - 1]],
            "years": [str(year)],
            "weekDateRange": _week_date_range(w, month, year),
            "success": True,
            "stats": {
                "totalTickets": total,
                "totalChores": chores,
                "totalBugs": bugs,
                "completed": completed,
                "pendingBugs": bugs - sum(1 for t in week_tickets if t.get("type") == "bug" and (_is_resolved(t.get("status"), None) or t.get("resolved_at"))),
                "pendingChores": chores - sum(1 for t in week_tickets if t.get("type") == "chore" and (_is_resolved(t.get("status"), None) or t.get("resolved_at"))),
                "responseDelay": response_delay,
                "completionDelay": completion_delay,
            },
        })

    # Pending chores & bugs grouped (only from tickets still in Chores & Bugs section)
    pending_chores = []
    pending_bugs = []
    prev_month_chores = {}
    prev_month_bugs = {}

    for t in tickets_for_pending:
        status = t.get("status") or ""
        if _is_resolved(status, None) or t.get("resolved_at"):
            continue
        if not _is_pending(status) and status not in pending_statuses:
            continue
        created = t.get("query_arrival_at") or t.get("created_at")
        days = _days_pending(created, t.get("resolved_at"))
        if days == 0:
            days = 1
        company = (t.get("company_name") or "").strip() or "Unknown"
        item = {"company": company, "daysPending": days, "status": status, "isOnHold": _is_on_hold(status), "type": t.get("type")}
        if t.get("type") == "chore":
            pending_chores.append(item)
        elif t.get("type") == "bug":
            pending_bugs.append(item)
    for t in all_tickets:
        created_at = t.get("created_at") or ""
        if not created_at:
            continue
        try:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            if dt.month == prev_month and dt.year == prev_year:
                company = (t.get("company_name") or "").strip() or "Unknown"
                if t.get("type") == "chore":
                    prev_month_chores[company] = prev_month_chores.get(company, 0) + 1
                elif t.get("type") == "bug":
                    prev_month_bugs[company] = prev_month_bugs.get(company, 0) + 1
        except Exception:
            pass

    def group_items(items):
        g = {"1-2": [], "2-7": [], "7+": [], "hold": []}
        for it in items:
            if it.get("isOnHold"):
                g["hold"].append(it)
            elif 1 <= it["daysPending"] <= 2:
                g["1-2"].append(it)
            elif 3 <= it["daysPending"] <= 7:
                g["2-7"].append(it)
            else:
                g["7+"].append(it)
        return g

    grouped_chores = group_items(pending_chores)
    grouped_bugs = group_items(pending_bugs)

    # Explicit counts for frontend display (same as grouped array lengths)
    counts = {
        "chores": {"1-2": len(grouped_chores["1-2"]), "2-7": len(grouped_chores["2-7"]), "7+": len(grouped_chores["7+"]), "hold": len(grouped_chores["hold"])},
        "bugs": {"1-2": len(grouped_bugs["1-2"]), "2-7": len(grouped_bugs["2-7"]), "7+": len(grouped_bugs["7+"]), "hold": len(grouped_bugs["hold"])},
    }

    def top_companies(m, limit=5):
        pairs = sorted(m.items(), key=lambda x: -x[1])[:limit]
        return [{"company": k, "requests": v} for k, v in pairs]

    # Feature metrics
    feature_pending = sum(1 for t in feature_tickets if t.get("status") in ("open", "in_progress", "on_hold", "pending"))
    feature_total = len(feature_tickets)

    return {
        "success": True,
        "weeksData": weeks_data,
        "pendingItems": {"grouped": {"chores": grouped_chores, "bugs": grouped_bugs}},
        "counts": counts,
        "monthlyTopCompanies": {
            "chores": top_companies(prev_month_chores),
            "bugs": top_companies(prev_month_bugs),
            "period": f"{month_names[prev_month - 1]} {prev_year}",
        },
        "statistics": {
            "totalChores": len(pending_chores),
            "totalBugs": len(pending_bugs),
            "onHoldChores": len([x for x in pending_chores if x.get("isOnHold")]),
            "onHoldBugs": len([x for x in pending_bugs if x.get("isOnHold")]),
        },
        "featureMetrics": {
            "total": feature_total,
            "pending": feature_pending,
        },
        "summary": {
            "period": f"{month_names[current_month - 1]} {current_year}",
            "lastUpdated": now.strftime("%Y-%m-%d %H:%M:%S"),
        },
    }


def _get_ticket_week(t: dict) -> tuple[int, int, int]:
    """Return (week_num, month, year) for ticket based on created_at."""
    created = t.get("created_at") or ""
    if not created:
        return 0, 0, 0
    try:
        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        return _week_of_month(dt), dt.month, dt.year
    except Exception:
        return 0, 0, 0


def _week_date_range(week_num: int, month: int, year: int) -> str:
    """Return human-readable date range for week (e.g. '1 Jan – 7 Jan')."""
    first = datetime(year, month, 1)
    first_day = first.weekday()
    first_monday = 1 + (7 - first_day) % 7 if first_day != 0 else 1
    start_day = first_monday + (week_num - 1) * 7
    start = datetime(year, month, min(start_day, 28))
    end = datetime(year, month, min(start_day + 5, 28))
    names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return f"{start.day} {names[month - 1]} – {end.day} {names[month - 1]}"


@api_router.get("/support-dashboard/filtered")
def support_dashboard_filtered(
    filter_type: str = Query(..., description="1-2, 2-7, 7+, hold"),
    category: str = Query(..., description="chores or bugs"),
    auth: dict = Depends(get_current_user),
):
    """Filtered tickets for Support Dashboard modal (chores/bugs by days or hold)."""
    try:
        q = supabase.table("tickets").select(
            "id, reference_no, title, description, type, status, company_name, company_id, user_name, created_at, resolved_at, query_arrival_at"
        ).in_("type", ["chore", "bug"])
        q = q.is_("quality_solution", "null")
        q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
        q = q.or_("status_2.is.null,status_2.neq.staging")
        r = q.execute()
        tickets = r.data or []
        _enrich_tickets_with_lookups(tickets)
    except Exception as e:
        return {"success": False, "message": str(e)[:200], "data": [], "totalRecords": 0}

    pending_statuses = ("open", "in_progress", "on_hold", "pending")
    result = []
    for t in tickets:
        status = t.get("status") or ""
        if _is_resolved(status, None) or t.get("resolved_at"):
            continue
        if status not in pending_statuses and not _is_pending(status):
            continue
        ttype = t.get("type")
        if category == "chores" and ttype != "chore":
            continue
        if category == "bugs" and ttype != "bug":
            continue
        days = _days_pending(t.get("query_arrival_at") or t.get("created_at"), t.get("resolved_at"))
        if days == 0:
            days = 1
        on_hold = _is_on_hold(status)
        match = False
        if filter_type == "hold" and on_hold:
            match = True
        elif filter_type == "1-2" and not on_hold and 1 <= days <= 2:
            match = True
        elif filter_type == "2-7" and not on_hold and 3 <= days <= 7:
            match = True
        elif filter_type == "7+" and not on_hold and days > 7:
            match = True
        if match:
            result.append({
                "company": (t.get("company_name") or "").strip() or "Unknown",
                "requestedPerson": (t.get("user_name") or "").strip() or "Not specified",
                "status": status,
                "pendingDays": days,
                "referenceNo": (t.get("reference_no") or "").strip() or "N/A",
                "title": (t.get("title") or "").strip(),
                "description": (t.get("description") or "").strip() or "",
                "queryArrival": t.get("query_arrival_at") or t.get("created_at") or "",
                "rowNumber": 0,
            })
    return {"success": True, "data": result, "totalRecords": len(result), "filterType": filter_type, "category": category}


@api_router.get("/support-dashboard/weekly-details")
def support_dashboard_weekly_details(
    week_number: int = Query(...),
    months: str = Query("", description="comma-separated months"),
    years: str = Query("", description="comma-separated years"),
    ticket_type: str = Query("total", description="total, pending, or completed"),
    auth: dict = Depends(get_current_user),
):
    """Weekly ticket details for Support Dashboard modal.
    ticket_type: total, pending, completed, response_delay, completion_delay.
    Uses ALL chores+bugs (no quality_solution filter) to match weekly stats."""
    try:
        q = supabase.table("tickets").select(
            "id, reference_no, title, description, type, status, company_name, company_id, user_name, assignee_id, created_at, query_arrival_at, query_response_at, resolved_at, planned_2, actual_2, actual_1, status_2"
        ).in_("type", ["chore", "bug"])
        q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
        q = q.or_("status_2.is.null,status_2.neq.staging")
        r = q.execute()
        tickets = r.data or []
        _enrich_tickets_with_lookups(tickets)
    except Exception as e:
        return {"success": False, "message": str(e)[:200], "tickets": []}

    month_list = [m.strip() for m in months.split(",") if m.strip()]
    year_list = [y.strip() for y in years.split(",") if y.strip()]
    result = []
    for t in tickets:
        w, m, y = _get_ticket_week(t)
        if w != week_number:
            continue
        month_name = datetime(2000, m, 1).strftime("%B") if 1 <= m <= 12 else ""
        if month_list and month_name not in month_list:
            continue
        if year_list and str(y) not in year_list:
            continue
        resolved = _is_resolved(t.get("status"), None) or bool(t.get("resolved_at"))
        if ticket_type == "pending" and resolved:
            continue
        if ticket_type == "completed" and not resolved:
            continue
        q_arrival = t.get("query_arrival_at") or t.get("created_at")
        q_response = t.get("query_response_at")
        has_resp_delay, resp_delay_text = _has_response_delay(q_arrival, q_response)
        has_comp_delay, comp_delay_text = _has_completion_delay(
            t.get("resolved_at"), t.get("created_at"),
            ticket_type=t.get("type"),
            planned_2=t.get("planned_2"), actual_2=t.get("actual_2"),
            status_2=t.get("status_2"), actual_1=t.get("actual_1"),
        )
        if ticket_type == "response_delay" and not has_resp_delay:
            continue
        if ticket_type == "completion_delay" and not has_comp_delay:
            continue
        result.append({
            "type": "Bug" if t.get("type") == "bug" else "Chore",
            "company": (t.get("company_name") or "").strip() or "Unknown",
            "requestedPerson": (t.get("user_name") or "").strip() or "Not specified",
            "submittedBy": (t.get("user_name") or "").strip() or "Not specified",
            "title": (t.get("title") or "").strip(),
            "description": (t.get("description") or "").strip() or "",
            "referenceNo": (t.get("reference_no") or "").strip() or "N/A",
            "week": f"Week {week_number}",
            "month": month_name,
            "year": str(y),
            "status": t.get("status") or "",
            "completed": "completed" if resolved else "",
            "queryArrival": q_arrival or "",
            "responseDelayTime": resp_delay_text if has_resp_delay else "",
            "completionDelayTime": comp_delay_text if has_comp_delay else "",
        })
    return {"success": True, "tickets": result, "ticketType": ticket_type, "weekNumber": week_number, "totalTickets": len(result)}


@api_router.get("/support-dashboard/feature-tickets")
def support_dashboard_feature_tickets(
    filter_type: str = Query("all", description="all or pending"),
    auth: dict = Depends(get_current_user),
):
    """Feature tickets for Support Dashboard modal (all or pending only)."""
    try:
        q = supabase.table("tickets").select(
            "id, reference_no, title, description, type, status, company_name, user_name, created_at, query_arrival_at, resolved_at"
        ).eq("type", "feature")
        r = q.execute()
        tickets = r.data or []
    except Exception as e:
        return {"success": False, "message": str(e)[:200], "data": [], "totalRecords": 0}
    pending_statuses = ("open", "in_progress", "on_hold", "pending")
    result = []
    for t in tickets:
        status = t.get("status") or ""
        resolved = _is_resolved(status, None) or bool(t.get("resolved_at"))
        if filter_type == "pending" and resolved:
            continue
        if filter_type == "pending" and status not in pending_statuses and not _is_pending(status):
            continue
        result.append({
            "company": (t.get("company_name") or "").strip() or "Unknown",
            "requestedPerson": (t.get("user_name") or "").strip() or "Not specified",
            "status": status,
            "referenceNo": (t.get("reference_no") or "").strip() or "N/A",
            "title": (t.get("title") or "").strip(),
            "description": (t.get("description") or "").strip() or "",
            "queryArrival": t.get("query_arrival_at") or t.get("created_at") or "",
        })
    return {"success": True, "data": result, "totalRecords": len(result), "filterType": filter_type}


@api_router.get("/dashboard/trends")
def dashboard_trends(auth: dict = Depends(get_current_user)):
    """Monthly trend data for charts (Chores & Bug only)."""
    from datetime import timedelta
    now = datetime.utcnow()
    data = []
    for i in range(6, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(hour=0, minute=0, second=0, microsecond=0)
        month_end = month_start + timedelta(days=32)
        month_end = month_end.replace(day=1) - timedelta(seconds=1)
        try:
            q = supabase.table("tickets").select("id, assignee_id, resolved_at").in_("type", ["chore", "bug"]).gte("created_at", month_start.isoformat()).lte("created_at", month_end.isoformat())
            r = q.execute()
            tickets = r.data or []
            response_delay = sum(1 for t in tickets if not t.get("assignee_id"))
            completion_delay = sum(1 for t in tickets if not t.get("resolved_at"))
            data.append({
                "month": month_start.strftime("%b %Y"),
                "response_delay": response_delay,
                "completion_delay": completion_delay,
            })
        except Exception:
            data.append({"month": month_start.strftime("%b %Y"), "response_delay": 0, "completion_delay": 0})
    return {"data": data}


# ---------- Support Form Lookups ----------
@api_router.get("/companies")
def list_companies(auth: dict = Depends(get_current_user)):
    try:
        r = supabase.table("companies").select("id, name").order("name").execute()
        return r.data or []
    except Exception:
        return [{"id": "1", "name": "Company A"}, {"id": "2", "name": "Company B"}]


@api_router.get("/pages")
def list_pages(auth: dict = Depends(get_current_user)):
    try:
        r = supabase.table("pages").select("id, name").order("name").execute()
        return r.data or []
    except Exception:
        return [{"id": "1", "name": "Dashboard"}, {"id": "2", "name": "Support"}]


@api_router.get("/divisions")
def list_divisions(company_id: str | None = None, auth: dict = Depends(get_current_user)):
    try:
        q = supabase.table("divisions").select("id, name, company_id")
        if company_id:
            q = q.eq("company_id", company_id)
        r = q.order("name").execute()
        return r.data or []
    except Exception:
        return [{"id": "1", "name": "Sales"}, {"id": "2", "name": "Support"}]


# ---------- Users (admin = view only; master_admin = view + edit role, deactivate, section permissions) ----------
# Role name as stored in DB; frontend displays "Master Admin", "Admin", "Approver", "User"
def _map_role(name: str) -> str:
    return _normalize_role(name)


# Section keys for user_section_permissions (match sidebar sections)
SECTION_KEYS = [
    "dashboard", "support_dashboard", "all_tickets", "chores_bugs", "staging", "feature",
    "approval_status", "completed_chores_bugs", "completed_feature",
    "solution", "task", "settings", "users",
]


@api_router.get("/roles")
def list_roles(auth: dict = Depends(require_roles(["admin", "master_admin"]))):
    """List roles for dropdown (e.g. Edit User). Returns id and name."""
    r = supabase.table("roles").select("id, name, description").order("name").execute()
    return {"data": r.data or []}


def _list_users_from_view(safe_search: str, page: int, limit: int):
    """Fetch users via users_view. Raises on failure."""
    q = supabase.table("users_view").select("*")
    if safe_search:
        q = q.or_(f"full_name.ilike.%{safe_search}%,email.ilike.%{safe_search}%")
    q = q.order("id").range((page - 1) * limit, page * limit - 1)
    r = q.execute()
    rows = list(r.data or [])
    count_q = supabase.table("users_view").select("id", count="exact")
    if safe_search:
        count_q = count_q.or_(f"full_name.ilike.%{safe_search}%,email.ilike.%{safe_search}%")
    count_r = count_q.limit(1).execute()
    total = getattr(count_r, "count", len(rows))
    total = total if isinstance(total, int) and total >= 0 else len(rows)
    return rows, total


def _list_users_fallback(page: int, limit: int, search: str | None):
    """Fallback when users_view fails: build list from user_profiles + roles + auth.admin."""
    auth_resp = supabase.auth.admin.list_users(per_page=1000)
    auth_users = getattr(auth_resp, "users", []) or []
    auth_by_id = {str(u.id): getattr(u, "email", "") or "" for u in auth_users}
    profiles = supabase.table("user_profiles").select("id, full_name, role_id, is_active, created_at").execute()
    prows = profiles.data or []
    if not prows:
        return [], 0
    role_ids = list({p["role_id"] for p in prows})
    roles = supabase.table("roles").select("id, name").in_("id", role_ids).execute()
    roles_by_id = {r["id"]: r.get("name", "user") for r in (roles.data or [])}
    merged = []
    for p in prows:
        email = auth_by_id.get(str(p["id"]), "")
        if search and search.strip():
            s = search.strip().lower()
            if s not in ((p.get("full_name") or "").lower(), email.lower()):
                continue
        merged.append({
            "id": p["id"],
            "email": email,
            "full_name": p.get("full_name", ""),
            "display_name": roles_by_id.get(p["role_id"], "user"),
            "role_name": roles_by_id.get(p["role_id"], "user"),
            "role": _map_role(roles_by_id.get(p["role_id"], "user")),
            "is_active": p.get("is_active", True),
            "created_at": str(p.get("created_at", "")),
        })
    merged.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    total = len(merged)
    start = (page - 1) * limit
    return merged[start : start + limit], total


@api_router.get("/users")
def list_users(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    auth: dict = Depends(require_roles(["admin", "master_admin"])),
):
    """List users. Admin and Master Admin can view; only Master Admin can edit (via PUT)."""
    safe_search = ""
    if search and search.strip():
        safe_search = search.strip().replace("%", "").replace("_", "")[:100]
    try:
        rows, total = _list_users_from_view(safe_search, page, limit)
    except Exception as e:
        print(f"[GET /users] users_view failed ({e}), trying fallback")
        try:
            rows, total = _list_users_fallback(page, limit, search)
        except Exception as e2:
            print(f"[GET /users] Fallback failed: {e2}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load users: {str(e2)[:200]}",
            )
    for row in rows:
        if "role" not in row:
            row["role"] = _map_role(row.get("role_name", "user"))
        if "display_name" not in row and "full_name" in row:
            row["display_name"] = row.get("role_name") or row["full_name"]
    return {"data": rows, "total": total, "page": page, "limit": limit}


@api_router.get("/users/{user_id}")
def get_user(user_id: str, auth: dict = Depends(require_roles(["admin", "master_admin"]))):
    r = supabase.table("users_view").select("*").eq("id", user_id).single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="User not found")
    d = r.data
    d["role"] = _map_role(d.get("role_name", "user"))
    return d


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    display_name: str | None = None
    role_id: str | None = None  # only master_admin can set
    is_active: bool | None = None


@api_router.put("/users/{user_id}")
def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    auth: dict = Depends(require_roles(["master_admin"])),
):
    """Update user profile. Master Admin only. Can set full_name, display_name, role_id, is_active."""
    r = supabase.table("user_profiles").select("id").eq("id", user_id).single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="User not found")
    data = {}
    if payload.full_name is not None:
        data["full_name"] = payload.full_name
    if payload.display_name is not None:
        data["display_name"] = payload.display_name
    if payload.role_id is not None:
        data["role_id"] = payload.role_id
    if payload.is_active is not None:
        data["is_active"] = payload.is_active
    if not data:
        return supabase.table("user_profiles").select("*").eq("id", user_id).single().execute().data
    supabase.table("user_profiles").update(data).eq("id", user_id).execute()
    out = supabase.table("users_view").select("*").eq("id", user_id).single().execute()
    d = out.data if out.data else {}
    d["role"] = _map_role(d.get("role_name", "user"))
    return d


class SectionPermissionItem(BaseModel):
    section_key: str
    can_view: bool
    can_edit: bool


class SectionPermissionsUpdate(BaseModel):
    permissions: list[SectionPermissionItem]


@api_router.get("/users/{user_id}/section-permissions")
def get_section_permissions(
    user_id: str,
    auth: dict = Depends(require_roles(["master_admin"])),
):
    """Get section view/edit permissions for a user. Master Admin only."""
    r = supabase.table("user_section_permissions").select("*").eq("user_id", user_id).execute()
    rows = r.data or []
    # Merge with all section keys so frontend always has full list
    by_key = {p["section_key"]: p for p in rows}
    result = []
    for key in SECTION_KEYS:
        p = by_key.get(key)
        result.append({
            "section_key": key,
            "can_view": p["can_view"] if p else True,
            "can_edit": p["can_edit"] if p else False,
        })
    return {"data": result}


@api_router.put("/users/{user_id}/section-permissions")
def update_section_permissions(
    user_id: str,
    payload: SectionPermissionsUpdate,
    auth: dict = Depends(require_roles(["master_admin"])),
):
    """Set section view/edit permissions for a user. Master Admin only."""
    pr = supabase.table("user_profiles").select("id").eq("id", user_id).single().execute()
    if not pr.data:
        raise HTTPException(status_code=404, detail="User not found")
    now = datetime.utcnow().isoformat()
    for item in payload.permissions:
        if item.section_key not in SECTION_KEYS:
            continue
        row = {"user_id": user_id, "section_key": item.section_key, "can_view": item.can_view, "can_edit": item.can_edit, "updated_at": now}
        try:
            supabase.table("user_section_permissions").upsert(row, on_conflict="user_id,section_key").execute()
        except Exception:
            # Fallback: delete then insert if upsert fails (e.g. old Supabase client)
            supabase.table("user_section_permissions").delete().eq("user_id", user_id).eq("section_key", item.section_key).execute()
            supabase.table("user_section_permissions").insert(row).execute()
    return {"message": "Section permissions updated"}


# ---------- Solutions ----------
class CreateSolutionRequest(BaseModel):
    ticket_id: str
    solution_number: int  # 1 or 2
    title: str
    description: str


@api_router.get("/solutions/ticket/{ticket_id}")
def list_solutions(ticket_id: str, auth: dict = Depends(get_current_user)):
    r = supabase.table("solutions").select("*").eq("ticket_id", ticket_id).order("solution_number").execute()
    return r.data or []


@api_router.post("/solutions")
def create_solution(payload: CreateSolutionRequest, auth: dict = Depends(get_current_user)):
    data = {
        "ticket_id": payload.ticket_id,
        "solution_number": payload.solution_number,
        "title": payload.title,
        "description": payload.description,
        "proposed_by": auth["id"],
    }
    r = supabase.table("solutions").insert(data).execute()
    return r.data[0] if r.data else {}


@api_router.put("/solutions/{solution_id}")
def update_solution(solution_id: str, payload: dict = None, auth: dict = Depends(get_current_user)):
    if not payload:
        raise HTTPException(status_code=400, detail="Request body required")
    r = supabase.table("solutions").update(payload).eq("id", solution_id).execute()
    return r.data[0] if r.data else {}


# ---------- Staging ----------
class CreateStagingRequest(BaseModel):
    ticket_id: str
    staging_environment: str = "staging-1"
    version: str = ""
    deployment_notes: str | None = None


@api_router.get("/staging/deployments")
def list_staging(
    page: int = 1,
    limit: int = 20,
    status: str | None = None,
    auth: dict = Depends(get_current_user),
):
    q = supabase.table("staging_deployments").select("*", count="exact")
    if status:
        q = q.eq("status", status)
    q = q.range((page - 1) * limit, page * limit - 1).order("created_at", desc=True)
    r = q.execute()
    return {"data": r.data or [], "total": r.count or 0, "page": page, "limit": limit}


@api_router.post("/staging/deployments")
def create_staging(payload: CreateStagingRequest, auth: dict = Depends(get_current_user)):
    data = {
        "ticket_id": payload.ticket_id,
        "staging_environment": payload.staging_environment,
        "version": payload.version,
        "deployment_notes": payload.deployment_notes,
        "deployed_by": auth["id"],
    }
    r = supabase.table("staging_deployments").insert(data).execute()
    return r.data[0] if r.data else {}


@api_router.put("/staging/deployments/{deployment_id}")
def update_staging(deployment_id: str, payload: dict = None, auth: dict = Depends(get_current_user)):
    if not payload:
        raise HTTPException(status_code=400, detail="Request body required")
    r = supabase.table("staging_deployments").update(payload).eq("id", deployment_id).execute()
    return r.data[0] if r.data else {}

# ---------------------------------------------------------------------------
# CHECKLIST MODULE (Task -> Checklist)
# ---------------------------------------------------------------------------
# Fallback if checklist_departments table is empty or fails
DEPARTMENTS_FALLBACK = [
    "Customer Support & Success",
    "Marketing",
    "Accounts & Admin",
    "Internal Development",
]
FREQUENCY_LABELS = {"D": "Daily", "W": "Weekly", "M": "Monthly", "Q": "Quarterly", "F": "Half-yearly", "Y": "Yearly"}


class CreateChecklistTaskRequest(BaseModel):
    task_name: str
    department: str
    frequency: str  # D, W, M, Q, F, Y
    start_date: str  # YYYY-MM-DD


def _get_holidays_for_year(year: int) -> set:
    """Return set of holiday dates for the year from checklist_holidays table."""
    try:
        r = supabase.table("checklist_holidays").select("holiday_date").eq("year", year).execute()
        if not r.data:
            return set()
        return {date.fromisoformat(d["holiday_date"]) if isinstance(d["holiday_date"], str) else d["holiday_date"] for d in r.data}
    except Exception:
        return set()


def _get_checklist_occurrence_dates(task: dict, year: int) -> list:
    """Get occurrence dates for a checklist task in given year."""
    from app.checklist_utils import get_occurrence_dates
    start = task.get("start_date")
    if isinstance(start, str):
        start = date.fromisoformat(start)
    freq = task.get("frequency", "D")
    holidays = _get_holidays_for_year(year)
    is_holiday = lambda d: d in holidays
    return get_occurrence_dates(start, freq, year, is_holiday)


def _get_checklist_departments() -> list[str]:
    """Fetch department names from checklist_departments table; fallback to hardcoded list."""
    try:
        r = supabase.table("checklist_departments").select("name").order("name").execute()
        names = [row["name"] for row in (r.data or []) if row.get("name")]
        return names if names else DEPARTMENTS_FALLBACK
    except Exception:
        return DEPARTMENTS_FALLBACK


@api_router.get("/checklist/departments")
def list_checklist_departments(auth: dict = Depends(get_current_user)):
    """List departments for checklist dropdown (from checklist_departments table)."""
    return {"departments": _get_checklist_departments()}


@api_router.get("/checklist/holidays")
def list_checklist_holidays(year: int = Query(...), auth: dict = Depends(get_current_user)):
    """List holidays for a year."""
    try:
        r = supabase.table("checklist_holidays").select("holiday_date, holiday_name").eq("year", year).order("holiday_date").execute()
        return {"holidays": r.data or []}
    except Exception as e:
        return {"holidays": []}


class HolidayUploadItem(BaseModel):
    holiday_date: str  # YYYY-MM-DD
    holiday_name: str


class HolidayUploadRequest(BaseModel):
    year: int
    holidays: list[HolidayUploadItem]


@api_router.post("/checklist/holidays/upload")
def upload_holiday_list(payload: HolidayUploadRequest, auth: dict = Depends(require_roles(["admin", "master_admin"]))):
    """Upload holiday list for a year. Available from Dec 15 for next year."""
    today = date.today()
    if today.month < 12 or today.day < 15:
        raise HTTPException(400, "Holiday list upload available from December 15th for the next year.")
    if payload.year <= today.year:
        raise HTTPException(400, "Can only upload holiday list for next year (after Dec 15).")
    rows = [{"holiday_date": h.holiday_date, "holiday_name": h.holiday_name, "year": payload.year} for h in payload.holidays]
    try:
        supabase.table("checklist_holidays").upsert(rows, on_conflict="holiday_date,year").execute()
        return {"success": True, "count": len(rows)}
    except Exception as e:
        raise HTTPException(400, str(e)[:200])


@api_router.post("/checklist/tasks")
def create_checklist_task(payload: CreateChecklistTaskRequest, auth: dict = Depends(get_current_user)):
    """Create a checklist task. Doer is the logged-in user."""
    allowed = _get_checklist_departments()
    if payload.department not in allowed:
        raise HTTPException(400, f"Invalid department. Use one of: {allowed}")
    if payload.frequency not in ("D", "W", "M", "Q", "F", "Y"):
        raise HTTPException(400, "Frequency must be D, W, M, Q, F or Y")
    try:
        start_d = date.fromisoformat(payload.start_date)
    except ValueError:
        raise HTTPException(400, "Invalid start_date. Use YYYY-MM-DD")
    data = {
        "task_name": payload.task_name,
        "doer_id": auth["id"],
        "department": payload.department,
        "frequency": payload.frequency,
        "start_date": payload.start_date,
        "created_by": auth["id"],
    }
    try:
        pr = supabase.table("user_profiles").select("full_name").eq("id", auth["id"]).limit(1).execute()
        name = (pr.data or [{}])[0].get("full_name") or "USER"
        prefix = "".join(c for c in name.upper() if c.isalnum())[:6] or "USER"
        prefix = prefix[:6]
        existing = supabase.table("checklist_tasks").select("reference_no").like("reference_no", f"CHK-{prefix}-%").execute()
        nums = []
        for row in (existing.data or []):
            ref = row.get("reference_no") or ""
            if ref.startswith(f"CHK-{prefix}-"):
                try:
                    nums.append(int(ref.split("-")[-1]))
                except ValueError:
                    pass
        next_num = max(nums, default=0) + 1
        data["reference_no"] = f"CHK-{prefix}-{next_num:03d}"
    except Exception as e:
        _log(f"checklist reference_no fallback: {e}")
        import uuid
        data["reference_no"] = f"CHK-{str(uuid.uuid4())[:8].upper()}"
    try:
        r = supabase.table("checklist_tasks").insert(data).execute()
        return r.data[0] if r.data else {}
    except Exception as e:
        _log(f"checklist create_task error: {e}")
        err = str(e).lower()
        if "does not exist" in err or "relation" in err:
            raise HTTPException(503, "Checklist tables not set up. Run database/CHECKLIST_MODULE.sql in Supabase SQL Editor.")
        raise HTTPException(400, str(e)[:200])


@api_router.get("/checklist/tasks")
def list_checklist_tasks(
    user_id: str | None = Query(None),
    reference_no: str | None = Query(None),
    auth: dict = Depends(get_current_user),
    current: dict = Depends(get_current_user_with_role),
):
    """List checklist tasks. Regular users see only their own. Admin/Master Admin can filter by user_id or see all. All can filter by reference_no."""
    try:
        role = current.get("role", "user")
        if role not in ("admin", "master_admin"):
            user_id = auth["id"]
        q = supabase.table("checklist_tasks").select("*")
        if user_id:
            q = q.eq("doer_id", user_id)
        elif role not in ("admin", "master_admin"):
            q = q.eq("doer_id", auth["id"])
        if reference_no:
            q = q.eq("reference_no", reference_no)
        r = q.order("created_at", desc=True).execute()
        tasks = r.data or []
        doer_ids = list({t["doer_id"] for t in tasks if t.get("doer_id")})
        doer_map = {}
        if doer_ids:
            try:
                pr = supabase.table("user_profiles").select("id, full_name").in_("id", doer_ids).execute()
                doer_map = {p["id"]: p.get("full_name", "") for p in (pr.data or [])}
            except Exception:
                pass
        for t in tasks:
            t["doer_name"] = doer_map.get(t.get("doer_id"), "")
        return {"tasks": tasks}
    except Exception as e:
        _log(f"checklist/tasks error: {e}")
        return {"tasks": []}


@api_router.get("/checklist/occurrences")
def list_checklist_occurrences(
    filter_type: str = Query("today", alias="filter"),
    user_id: str | None = Query(None),
    reference_no: str | None = Query(None),
    auth: dict = Depends(get_current_user),
    current: dict = Depends(get_current_user_with_role),
):
    """
    Get checklist occurrences. filter: today|completed|overdue|upcoming.
    Regular users see only their tasks. Admin can filter by user_id. All can filter by reference_no.
    """
    try:
        from app.checklist_utils import get_occurrence_dates
        role = current.get("role", "user")
        if role not in ("admin", "master_admin"):
            user_id = auth["id"]
        q = supabase.table("checklist_tasks").select("*")
        if user_id:
            q = q.eq("doer_id", user_id)
        elif role not in ("admin", "master_admin"):
            q = q.eq("doer_id", auth["id"])
        if reference_no:
            q = q.eq("reference_no", reference_no)
        r = q.execute()
        tasks = r.data or []
        doer_map = {}
        try:
            prof = supabase.table("user_profiles").select("id, full_name").execute()
            doer_map = {p["id"]: p.get("full_name", "") for p in (prof.data or [])}
        except Exception:
            pass
        comp = {}
        try:
            cr = supabase.table("checklist_completions").select("task_id, occurrence_date, completed_at").execute()
            for row in cr.data or []:
                comp[(row["task_id"], row["occurrence_date"])] = row.get("completed_at")
        except Exception:
            pass
        today = date.today()
        occurrences = []
        for task in tasks:
            t_id = task["id"]
            start = task.get("start_date")
            if isinstance(start, str):
                start = date.fromisoformat(start)
            freq = task.get("frequency", "D")
            for yr in [today.year - 1, today.year, today.year + 1]:
                holidays = _get_holidays_for_year(yr)
                is_holiday = lambda d, h=holidays: d in h
                dates = get_occurrence_dates(start, freq, yr, is_holiday)
                for d in dates:
                    if (today - timedelta(days=60)).year <= yr <= (today + timedelta(days=365)).year:
                        occurrences.append({
                            "task_id": t_id,
                            "task_name": task.get("task_name", ""),
                            "reference_no": task.get("reference_no"),
                            "doer_id": task.get("doer_id"),
                            "doer_name": doer_map.get(task.get("doer_id"), ""),
                            "department": task.get("department", ""),
                            "occurrence_date": d.isoformat(),
                            "completed_at": comp.get((t_id, d.isoformat())),
                        })
        occurrences.sort(key=lambda x: (x["occurrence_date"], x["task_name"]))
        today_str = today.isoformat()
        if filter_type == "today":
            occurrences = [o for o in occurrences if o["occurrence_date"] == today_str]
        elif filter_type == "completed":
            occurrences = [o for o in occurrences if o.get("completed_at")]
        elif filter_type == "overdue":
            occurrences = [o for o in occurrences if not o.get("completed_at") and o["occurrence_date"] < today_str]
        elif filter_type == "upcoming":
            occurrences = [o for o in occurrences if not o.get("completed_at") and o["occurrence_date"] > today_str]
        return {"occurrences": occurrences}
    except Exception as e:
        _log(f"checklist/occurrences error: {e}")
        return {"occurrences": []}


class CompleteChecklistRequest(BaseModel):
    occurrence_date: str  # YYYY-MM-DD


@api_router.post("/checklist/tasks/{task_id}/complete")
def complete_checklist_task(task_id: str, payload: CompleteChecklistRequest, auth: dict = Depends(get_current_user)):
    """Mark a task as completed for the given occurrence date (Submit)."""
    try:
        task = supabase.table("checklist_tasks").select("doer_id").eq("id", task_id).single().execute()
        if not task.data:
            raise HTTPException(404, "Task not found")
        if str(task.data["doer_id"]) != str(auth["id"]):
            raise HTTPException(403, "Only the assigned doer can complete this task")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(404, "Task not found")
    data = {
        "task_id": task_id,
        "occurrence_date": payload.occurrence_date,
        "completed_by": auth["id"],
    }
    try:
        supabase.table("checklist_completions").upsert(data, on_conflict="task_id,occurrence_date").execute()
        return {"success": True, "message": "Task marked as completed"}
    except Exception as e:
        raise HTTPException(400, str(e)[:200])


@api_router.get("/checklist/users")
def list_checklist_users(auth: dict = Depends(get_current_user), current: dict = Depends(get_current_user_with_role)):
    """List users for admin name filter (Master Admin & Admin only)."""
    if current.get("role") not in ("admin", "master_admin"):
        return {"users": []}
    try:
        r = supabase.table("user_profiles").select("id, full_name").eq("is_active", True).order("full_name").execute()
        return {"users": r.data or []}
    except Exception:
        return {"users": []}


# ---------------------------------------------------------------------------
# Delegation Tasks (Task module – separate from Support)
# ---------------------------------------------------------------------------
class CreateDelegationTaskRequest(BaseModel):
    title: str  # Task Name
    assignee_id: str
    due_date: str
    delegation_on: str | None = None
    submission_date: str | None = None
    has_document: str | None = None  # 'yes' | 'no'
    document_url: str | None = None
    submitted_by: str | None = None


@api_router.get("/delegation/users")
def list_delegation_users(auth: dict = Depends(get_current_user), current: dict = Depends(get_current_user_with_role)):
    """List users for assignee dropdown. Level 1 & 2 (admin, approver) only."""
    if current.get("role") not in ("admin", "master_admin", "approver"):
        return {"users": []}
    try:
        r = supabase.table("user_profiles").select("id, full_name").eq("is_active", True).order("full_name").execute()
        return {"users": r.data or []}
    except Exception:
        return {"users": []}


@api_router.get("/delegation/tasks")
def list_delegation_tasks(
    status: str | None = Query(None),
    assignee_id: str | None = Query(None),
    reference_no: str | None = Query(None),
    auth: dict = Depends(get_current_user),
    current: dict = Depends(get_current_user_with_role),
):
    """List delegation tasks. Default status=pending. Admin/Master can filter by user. All users can filter by reference_no."""
    try:
        q = supabase.table("delegation_tasks").select("*")
        role = current.get("role", "user")
        if role not in ("admin", "master_admin"):
            q = q.eq("assignee_id", auth["id"])
        elif assignee_id:
            q = q.eq("assignee_id", assignee_id)
        # Default pending; send status='all' to see all tasks
        if status == "all":
            pass
        else:
            q = q.eq("status", status or "pending")
        if reference_no:
            q = q.eq("reference_no", reference_no)
        r = q.order("due_date", desc=False).execute()
        tasks = r.data or []
        assignee_ids = {t["assignee_id"] for t in tasks if t.get("assignee_id")}
        submitted_by_ids = {t["submitted_by"] for t in tasks if t.get("submitted_by")}
        all_user_ids = assignee_ids | submitted_by_ids
        user_map = {}
        if all_user_ids:
            try:
                pr = supabase.table("user_profiles").select("id, full_name").in_("id", list(all_user_ids)).execute()
                user_map = {p["id"]: p.get("full_name", "") for p in (pr.data or [])}
            except Exception as e:
                _log(f"delegation/tasks: failed to load user profiles for ids={list(all_user_ids)[:5]}...: {e}")
        for t in tasks:
            t["assignee_name"] = user_map.get(t.get("assignee_id"), "")
            t["submitted_by_name"] = user_map.get(t.get("submitted_by"), "")
        return {"tasks": tasks}
    except Exception as e:
        _log(f"delegation/tasks error: {e}")
        return {"tasks": []}


@api_router.post("/delegation/tasks")
def create_delegation_task(payload: CreateDelegationTaskRequest, auth: dict = Depends(get_current_user)):
    """Create a delegation task."""
    try:
        date.fromisoformat(payload.due_date)
    except ValueError:
        raise HTTPException(400, "Invalid due_date. Use YYYY-MM-DD")
    for field_name, val in [("delegation_on", payload.delegation_on), ("submission_date", payload.submission_date)]:
        if val:
            try:
                date.fromisoformat(val)
            except ValueError as err:
                raise HTTPException(400, f"Invalid {field_name}. Use YYYY-MM-DD") from err
    data = {
        "title": payload.title,
        "assignee_id": payload.assignee_id,
        "due_date": payload.due_date,
        "created_by": auth["id"],
    }
    if payload.delegation_on:
        data["delegation_on"] = payload.delegation_on
    if payload.submission_date:
        data["submission_date"] = payload.submission_date
    if payload.has_document:
        data["has_document"] = payload.has_document
    if payload.document_url:
        data["document_url"] = payload.document_url
    if payload.submitted_by:
        data["submitted_by"] = payload.submitted_by
    # Generate unique reference_no based on submitted_by user name (e.g. DEL-AMAN-001)
    try:
        pr = supabase.table("user_profiles").select("full_name").eq("id", payload.submitted_by or payload.assignee_id).limit(1).execute()
        name = (pr.data or [{}])[0].get("full_name") or "USER"
        prefix = "".join(c for c in name.upper() if c.isalnum())[:6] or "USER"
        prefix = prefix[:6]
        existing = supabase.table("delegation_tasks").select("reference_no").like("reference_no", f"DEL-{prefix}-%").execute()
        nums = []
        for row in (existing.data or []):
            ref = row.get("reference_no") or ""
            if ref.startswith(f"DEL-{prefix}-"):
                try:
                    nums.append(int(ref.split("-")[-1]))
                except ValueError:
                    pass
        next_num = max(nums, default=0) + 1
        data["reference_no"] = f"DEL-{prefix}-{next_num:03d}"
    except Exception as e:
        _log(f"delegation reference_no fallback: {e}")
        import uuid
        data["reference_no"] = f"DEL-{str(uuid.uuid4())[:8].upper()}"
    try:
        r = supabase.table("delegation_tasks").insert(data).execute()
        return r.data[0] if r.data else {}
    except Exception as e:
        _log(f"delegation create error: {e}")
        err = str(e).lower()
        if "does not exist" in err or "relation" in err:
            raise HTTPException(503, "Delegation table not set up. Run database/DELEGATION_AND_PENDING_REMINDER.sql in Supabase.")
        raise HTTPException(400, str(e)[:200])


@api_router.put("/delegation/tasks/{task_id}")
def update_delegation_task(task_id: str, payload: dict, auth: dict = Depends(get_current_user), current: dict = Depends(get_current_user_with_role)):
    """Update delegation task. Only Master Admin can edit fields other than status. Status complete/cancel allowed for assignee or admin."""
    from datetime import datetime, timezone
    role = current.get("role", "user")
    allowed_all = {"status", "title", "due_date", "assignee_id", "delegation_on", "submission_date", "has_document", "document_url", "submitted_by", "completed_at"}
    data = {}
    status_only = set(payload.keys()) <= {"status", "document_url"}
    if role == "master_admin":
        data = {k: v for k, v in payload.items() if k in allowed_all and v is not None}
    else:
        if not status_only:
            raise HTTPException(403, "Only Master Admin can edit task fields. You can only Complete or Cancel.")
        # Assignee or Admin can complete/cancel
        task_row = supabase.table("delegation_tasks").select("assignee_id, has_document").eq("id", task_id).limit(1).execute()
        if not task_row.data:
            raise HTTPException(404, "Task not found")
        assignee_id = task_row.data[0].get("assignee_id")
        has_document = task_row.data[0].get("has_document")
        if payload.get("status") == "completed" and has_document == "yes" and not payload.get("document_url"):
            raise HTTPException(400, "Document is required. Please upload the document before completing.")
        if role not in ("admin", "master_admin") and assignee_id != auth["id"]:
            raise HTTPException(403, "You can only complete or cancel your own assigned tasks.")
        if "status" in payload and payload["status"] in ("completed", "cancelled"):
            data["status"] = payload["status"]
        if "document_url" in payload and payload["document_url"]:
            data["document_url"] = payload["document_url"]
    if payload.get("status") == "completed":
        data["completed_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    if not data:
        raise HTTPException(400, "No valid fields to update")
    try:
        r = supabase.table("delegation_tasks").update(data).eq("id", task_id).execute()
        return r.data[0] if r.data else {}
    except Exception as e:
        raise HTTPException(400, str(e)[:200])


async def _send_checklist_reminder_email(to_email: str, task_names: list[str], doer_name: str) -> bool:
    """Send reminder email via utils/email.py (async SMTP with HTML). Returns True if sent."""
    to_email = (to_email or "").strip()
    if not to_email:
        _log("Checklist reminder: no recipient email, skip send")
        return False

    from app.utils.email import send_email

    task_items = "".join(f"<li>{n}</li>" for n in task_names)
    html_content = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h3>You have pending checklist tasks</h3>
  <p>Hi {doer_name or "User"},</p>
  <p>You have <strong>{len(task_names)}</strong> task(s) due today:</p>
  <ul>
    {task_items}
  </ul>
  <p>Please log in to complete them.</p>
</body>
</html>
"""
    plain_fallback = f"You have {len(task_names)} task(s) due today:\n\n" + "\n".join(f"  - {n}" for n in task_names) + "\n\nPlease log in to complete them."

    ok = await send_email(to_email=to_email, subject="Checklist: Tasks due today", html_content=html_content.strip(), plain_fallback=plain_fallback)
    if ok:
        _log(f"Checklist reminder sent to {to_email}")
    return ok


async def _run_checklist_reminders_background():
    """Run checklist daily reminders. Used by cron; logs result. Avoids request timeout."""
    try:
        from app.checklist_utils import get_occurrence_dates
        today = date.today()
        q = supabase.table("checklist_tasks").select("*")
        r = q.execute()
        tasks = r.data or []
        doer_ids = list({str(t.get("doer_id", "")) for t in tasks if t.get("doer_id")})
        user_map = {}
        if doer_ids:
            try:
                profiles_r = supabase.table("user_profiles").select("id, email, full_name").in_("id", doer_ids).execute()
                for p in (profiles_r.data or []):
                    uid = str(p.get("id", ""))
                    email_val = (p.get("email") or "").strip()
                    user_map[uid] = {"email": email_val, "name": p.get("full_name") or "User"}
            except Exception as e:
                _log(f"checklist reminder: user_profiles failed: {e}")
            need_auth = any(uid not in user_map or not (user_map.get(uid) or {}).get("email") for uid in doer_ids)
            if need_auth:
                try:
                    auth_r = supabase.auth.admin.list_users(per_page=1000)
                    auth_users = getattr(auth_r, "users", []) or []
                    prof_r = supabase.table("user_profiles").select("id, full_name").in_("id", doer_ids).execute()
                    profs = {str(x["id"]): x.get("full_name") or "User" for x in (prof_r.data or [])}
                    for u in auth_users:
                        uid = str(getattr(u, "id", "") or (u.get("id") if isinstance(u, dict) else ""))
                        em = (getattr(u, "email", None) or (u.get("email") if isinstance(u, dict) else None) or "").strip()
                        if uid in doer_ids and (uid not in user_map or not (user_map.get(uid) or {}).get("email")):
                            user_map[uid] = {"email": em, "name": profs.get(uid, "User")}
                except Exception as e2:
                    _log(f"checklist reminder: auth fallback failed: {e2}")
        try:
            sent_r = supabase.table("checklist_reminder_sent").select("user_id").eq("reminder_date", today.isoformat()).execute()
            already_sent = {str(row["user_id"]) for row in (sent_r.data or [])}
        except Exception:
            already_sent = set()
        comp = {}
        try:
            cr = supabase.table("checklist_completions").select("task_id, occurrence_date").execute()
            for row in cr.data or []:
                od = row.get("occurrence_date")
                if isinstance(od, str) and "T" in od:
                    od = od[:10]
                comp[(str(row["task_id"]), od or "")] = True
        except Exception:
            pass
        by_user: dict[str, list[str]] = {}
        for task in tasks:
            t_id = task["id"]
            start = task.get("start_date")
            if isinstance(start, str):
                start = date.fromisoformat(start)
            doer_id = str(task.get("doer_id", ""))
            if not doer_id or doer_id in already_sent:
                continue
            freq = task.get("frequency", "D")
            holidays = _get_holidays_for_year(today.year)

            def is_holiday(d: date, h: set[date] | None = None) -> bool:
                return d in (h if h is not None else holidays)

            dates = get_occurrence_dates(start, freq, today.year, is_holiday)
            for d in dates:
                if d == today:
                    key = (str(t_id), d.isoformat())
                    if not comp.get(key):
                        by_user.setdefault(doer_id, []).append(task.get("task_name", ""))
                    break
        sent_count = 0
        for uid, names in by_user.items():
            if not names or uid in already_sent:
                continue
            u = user_map.get(uid, {})
            email = (u.get("email") or "").strip()
            name = u.get("name", "") or "User"
            if not email:
                continue
            if await _send_checklist_reminder_email(email, names, name):
                try:
                    supabase.table("checklist_reminder_sent").insert({
                        "user_id": uid,
                        "reminder_date": today.isoformat(),
                    }).execute()
                    sent_count += 1
                except Exception as e:
                    _log(f"checklist reminder: failed recording send for user_id={uid} date={today.isoformat()}: {e}")
        _log(f"Checklist reminder background: sent {sent_count} for {today.isoformat()}")
    except Exception as e:
        _log(f"Checklist reminder background error: {e}")


@api_router.api_route("/checklist/send-daily-reminders", methods=["GET", "POST"])
async def send_checklist_daily_reminders(
    request: Request,
    background_tasks: BackgroundTasks,
    auth: dict | None = Depends(get_current_user_optional),
):
    """
    Start checklist daily reminders in background. Returns immediately to avoid Render timeout.
    POST or GET. Auth: X-Cron-Secret header, ?secret= query, or admin login.
    Result is logged; check server logs for sent count.
    """
    cron_secret = (os.getenv("CHECKLIST_CRON_SECRET") or "").strip()
    x_cron = (
        request.headers.get("X-Cron-Secret") or
        request.headers.get("x-cron-secret") or
        request.query_params.get("secret") or
        ""
    ).strip()
    if cron_secret and x_cron and x_cron == cron_secret:
        pass
    elif auth:
        role = _get_role_from_profile(auth["id"])
        if role not in ("admin", "master_admin"):
            raise HTTPException(403, "Admin only")
    else:
        raise HTTPException(401, "Set CHECKLIST_CRON_SECRET header or ?secret= for cron, or log in as admin")
    background_tasks.add_task(_run_checklist_reminders_background)
    return {"status": "started", "message": "Checklist reminder job started. Check server logs for result."}


# ---------------------------------------------------------------------------
# Pending Reminder Digest (Checklist & Delegation + Support Chores&Bug & Feature by stage)
# Sent to admin, master_admin, approver roles only
# ---------------------------------------------------------------------------

def _send_pending_digest_email(to_email: str, body: str, recipient_name: str) -> bool:
    """Send pending digest email. Uses SMTP, Postmark API, or SendGrid. Returns True if sent."""
    subject = "Pending Task Reminder – Checklist, Delegation & Support"
    to_email = (to_email or "").strip()
    if not to_email:
        _log("Pending digest: no recipient email, skip send")
        return False

    smtp_host = (os.getenv("SMTP_HOST") or "").strip()
    smtp_port = int(os.getenv("SMTP_PORT") or "587")
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_pass = (os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS") or "").strip()
    smtp_from = (os.getenv("SMTP_FROM_EMAIL") or os.getenv("SENDGRID_FROM_EMAIL") or os.getenv("AUTOSEND_FROM_EMAIL") or "").strip()

    if smtp_host and smtp_user and smtp_pass and smtp_from:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = to_email
            smtp_stream = (os.getenv("SMTP_POSTMARK_STREAM") or "").strip()
            if smtp_stream:
                msg["X-PM-Message-Stream"] = smtp_stream
            msg.attach(MIMEText(body, "plain"))
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, to_email, msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, to_email, msg.as_string())
            _log(f"Pending digest sent to {to_email} (SMTP)")
            return True
        except Exception as e:
            _log(f"Pending digest SMTP error: {e}")
            return False

    postmark_token = (os.getenv("POSTMARK_SERVER_TOKEN") or os.getenv("SMTP_USER") or "").strip()
    postmark_from = (os.getenv("SMTP_FROM_EMAIL") or "").strip()
    postmark_host = (os.getenv("SMTP_HOST") or "").lower()
    if postmark_token and postmark_from and ("postmark" in postmark_host or os.getenv("POSTMARK_SERVER_TOKEN")):
        try:
            from_val = f"IP Internal Management <{postmark_from}>"
            stream = (os.getenv("SMTP_POSTMARK_STREAM") or "outbound").strip()
            resp = httpx.post(
                "https://api.postmarkapp.com/email",
                headers={"X-Postmark-Server-Token": postmark_token, "Content-Type": "application/json"},
                json={
                    "From": from_val,
                    "To": to_email,
                    "Subject": subject,
                    "TextBody": body,
                    "MessageStream": stream,
                },
                timeout=15.0,
            )
            if resp.status_code == 200:
                data = resp.json() if resp.content else {}
                if data.get("ErrorCode", 0) == 0:
                    _log(f"Pending digest sent to {to_email} (Postmark)")
                    return True
            _log(f"Postmark API error: {resp.status_code} {resp.text[:200]}")
        except Exception as e:
            _log(f"Pending digest Postmark error: {e}")
        return False

    api_key = (os.getenv("SENDGRID_API_KEY") or "").strip()
    from_email = (os.getenv("SENDGRID_FROM_EMAIL") or smtp_from or "").strip()
    from_name = (os.getenv("SENDGRID_FROM_NAME") or "IP Internal Management").strip()
    if not api_key or not from_email:
        _log("Pending digest: no SMTP, Postmark, or SENDGRID_API_KEY configured, skip send")
        return False
    try:
        resp = httpx.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": from_email, "name": from_name},
                "subject": subject,
                "content": [{"type": "text/plain", "value": body}],
            },
            timeout=15.0,
        )
        if resp.status_code in (200, 202):
            _log(f"Pending digest sent to {to_email} (SendGrid)")
            return True
        _log(f"SendGrid API error: {resp.status_code} {resp.text[:200]}")
        return False
    except Exception as e:
        _log(f"Pending digest SendGrid error: {e}")
        return False


def _get_level1_level2_user_ids() -> list[str]:
    """Return user IDs with role admin, master_admin, or approver (digest recipients)."""
    try:
        admin_roles = supabase.table("roles").select("id").in_("name", ["admin", "master_admin", "approver"]).execute()
        role_ids = [r["id"] for r in (admin_roles.data or [])]
        if not role_ids:
            return []
        profiles = supabase.table("user_profiles").select("id").in_("role_id", role_ids).eq("is_active", True).execute()
        return [str(p["id"]) for p in (profiles.data or [])]
    except Exception as e:
        _log(f"Pending digest: get recipients error: {e}")
        return []


async def _run_pending_digest_background():
    """Run pending digest (checklist, delegation, chores/bug, feature). Used by cron; logs result. Avoids request timeout."""
    try:
        from app.checklist_utils import get_occurrence_dates
        from app.reminder_utils import get_chores_bugs_stage, get_staging_feature_stage, is_chores_bug_pending, is_feature_pending
        today = date.today()
        level12_ids = _get_level1_level2_user_ids()
        if not level12_ids:
            _log("Pending digest background: no recipients")
            return
        try:
            already_sent_r = supabase.table("pending_reminder_sent").select("user_id").eq("reminder_date", today.isoformat()).execute()
            already_sent = {str(r["user_id"]) for r in (already_sent_r.data or [])}
        except Exception:
            already_sent = set()
        try:
            users_r = supabase.table("users_view").select("id, email, full_name").execute()
            user_map = {str(u["id"]): {"email": (u.get("email") or "").strip(), "name": u.get("full_name") or "User"} for u in (users_r.data or [])}
        except Exception:
            user_map = {}

        def assignee_name(aid) -> str:
            if not aid:
                return "-"
            return user_map.get(str(aid), {}).get("name", str(aid)[:8])

        holidays = _get_holidays_for_year(today.year)
        is_holiday = lambda d, h=holidays: d in h
        checklist_lines = []
        try:
            tasks_r = supabase.table("checklist_tasks").select("*").execute()
            comp_r = supabase.table("checklist_completions").select("task_id, occurrence_date").execute()
            comp = {}
            for row in comp_r.data or []:
                od = row.get("occurrence_date")
                if isinstance(od, str) and "T" in od:
                    od = od[:10]
                comp[(str(row["task_id"]), od or "")] = True
            for task in tasks_r.data or []:
                start = task.get("start_date")
                if isinstance(start, str):
                    start = date.fromisoformat(start)
                freq = task.get("frequency", "D")
                dates = get_occurrence_dates(start, freq, today.year, is_holiday)
                for d in dates:
                    if d == today:
                        key = (str(task["id"]), d.isoformat())
                        if not comp.get(key):
                            doer = assignee_name(task.get("doer_id"))
                            checklist_lines.append(f"  - {task.get('task_name')} (Doer: {doer})")
                        break
        except Exception as e:
            _log(f"Pending digest checklist: {e}")
            checklist_lines = ["  (Error loading)"]
        checklist_section = "\n".join(checklist_lines) if checklist_lines else "  (None)"

        delegation_lines = []
        try:
            del_r = supabase.table("delegation_tasks").select("id, title, assignee_id, due_date").in_("status", ["pending", "in_progress"]).lte("due_date", today.isoformat()).execute()
            for t in del_r.data or []:
                assignee = assignee_name(t.get("assignee_id"))
                delegation_lines.append(f"  - {t.get('title')} (Assignee: {assignee}, Due: {t.get('due_date')})")
        except Exception:
            delegation_lines = ["  (Table not created or error)"]
        delegation_section = "\n".join(delegation_lines) if delegation_lines else "  (None)"

        chores_bug_lines = []
        try:
            cb_r = supabase.table("tickets").select("*").in_("type", ["chore", "bug"]).is_("quality_solution", "null").execute()
            tickets_cb = cb_r.data or []
            staged: dict[str, list] = {}
            for t in tickets_cb:
                if not is_chores_bug_pending(t):
                    continue
                s = get_chores_bugs_stage(t)
                label = s["stage_label"]
                staged.setdefault(label, []).append(t)
            for label in sorted(staged.keys(), key=lambda x: (int(x.split()[1]) if x.split()[1].isdigit() else 0, x)):
                for t in staged[label]:
                    ref = t.get("reference_no") or t.get("id", "")[:8]
                    title = (t.get("title") or "")[:50]
                    assignee = assignee_name(t.get("assignee_id"))
                    chores_bug_lines.append(f"  [{label}] {ref} {title} (Assignee: {assignee})")
        except Exception as e:
            _log(f"Pending digest chores&bug: {e}")
            chores_bug_lines = ["  (Error loading)"]
        chores_bug_section = "\n".join(chores_bug_lines) if chores_bug_lines else "  (None)"

        feature_lines = []
        try:
            feat_r = supabase.table("tickets").select("*").eq("type", "feature").execute()
            tickets_feat = feat_r.data or []
            staged_f: dict[str, list] = {}
            for t in tickets_feat:
                if not is_feature_pending(t):
                    continue
                s = get_staging_feature_stage(t)
                label = s["stage_label"]
                staged_f.setdefault(label, []).append(t)
            for label in sorted(staged_f.keys(), key=lambda x: ("0" if "Approval" in x else "1" + x)):
                for t in staged_f[label]:
                    ref = t.get("reference_no") or t.get("id", "")[:8]
                    title = (t.get("title") or "")[:50]
                    assignee = assignee_name(t.get("assignee_id"))
                    feature_lines.append(f"  [{label}] {ref} {title} (Assignee: {assignee})")
        except Exception as e:
            _log(f"Pending digest feature: {e}")
            feature_lines = ["  (Error loading)"]
        feature_section = "\n".join(feature_lines) if feature_lines else "  (None)"

        body = f"""Pending Task Reminder – {today.isoformat()}

This digest is sent to Admin, Master Admin, and Approver roles.

---
1. CHECKLIST & DELEGATION – Pending Tasks
---
Checklist (due today, not completed):
{checklist_section}

Delegation (pending, due today or overdue):
{delegation_section}

---
2. SUPPORT – Chores & Bug (by Stage, Assignee)
---
{chores_bug_section}

---
3. SUPPORT – Feature (by Stage, Assignee)
---
{feature_section}

---
Please log in to review and take action.
"""

        sent_count = 0
        for uid in level12_ids:
            if uid in already_sent:
                continue
            u = user_map.get(uid, {})
            email = u.get("email", "").strip()
            name = u.get("name", "User")
            if email and _send_pending_digest_email(email, body, name):
                try:
                    supabase.table("pending_reminder_sent").insert({
                        "user_id": uid,
                        "reminder_date": today.isoformat(),
                    }).execute()
                    sent_count += 1
                except Exception:
                    pass
        _log(f"Pending digest background: sent {sent_count} for {today.isoformat()}")
    except Exception as e:
        _log(f"Pending digest background error: {e}")


@api_router.api_route("/reminders/send-pending-digest", methods=["GET", "POST"])
async def send_pending_digest(
    request: Request,
    background_tasks: BackgroundTasks,
    auth: dict | None = Depends(get_current_user_optional),
):
    """
    Start pending reminder digest in background. Returns immediately to avoid Render timeout.
    Content: Checklist & Delegation + Support Chores&Bug & Feature by stage. Sent to admin, master_admin, approver.
    Auth: X-Cron-Secret header, ?secret= query, or admin login. Result is logged; check server logs for sent count.
    """
    cron_secret = (os.getenv("CHECKLIST_CRON_SECRET") or os.getenv("PENDING_REMINDER_CRON_SECRET") or "").strip()
    x_cron = (
        request.headers.get("X-Cron-Secret") or
        request.headers.get("x-cron-secret") or
        request.query_params.get("secret") or
        ""
    ).strip()
    if cron_secret and x_cron and x_cron == cron_secret:
        pass
    elif auth:
        role = _get_role_from_profile(auth["id"])
        if role not in ("admin", "master_admin"):
            raise HTTPException(403, "Admin only (or use cron secret)")
    else:
        raise HTTPException(401, "Set PENDING_REMINDER_CRON_SECRET or CHECKLIST_CRON_SECRET header/?secret=, or log in as admin")

    level12_ids = _get_level1_level2_user_ids()
    if not level12_ids:
        return {"status": "skipped", "message": "No recipients found. Ensure at least one user has role Admin, Master Admin, or Approver and has an email in the system."}

    background_tasks.add_task(_run_pending_digest_background)
    return {"status": "started", "message": "Pending digest job started. Check server logs for result."}


# ---------------------------------------------------------------------------
# Attachment upload (ticket attachments in Supabase Storage)
# Bucket MUST be PUBLIC in Supabase (Storage -> Buckets -> ticket-attachments -> Public: ON)
# so that "View" opens the document. See SUPABASE_ATTACHMENT_VIEW_FIX.md
ATTACHMENT_BUCKET = os.getenv("SUPABASE_ATTACHMENT_BUCKET", "ticket-attachments")
ATTACHMENT_MAX_BYTES = int(os.getenv("ATTACHMENT_MAX_MB", "10")) * 1024 * 1024  # default 10 MB
ALLOWED_ATTACHMENT_TYPES = {
    "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp",
    "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

# Only register /upload route if python-multipart is installed (so app starts even without it)
try:
    import python_multipart  # noqa: F401
    _MULTIPART_AVAILABLE = True
except ImportError:
    _MULTIPART_AVAILABLE = False
    _log("WARNING: python-multipart not installed. /upload disabled. Install with: pip install python-multipart")


def _get_storage_jwt() -> str | None:
    """Return a JWT (eyJ...) to use for Supabase Storage API. Storage requires JWT, not sb_secret_ keys."""
    service = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    storage_jwt = (os.getenv("SUPABASE_STORAGE_JWT") or "").strip()
    if service.startswith("eyJ"):
        return service
    if storage_jwt.startswith("eyJ"):
        return storage_jwt
    anon = (os.getenv("SUPABASE_ANON_KEY") or "").strip()
    if anon.startswith("eyJ"):
        return anon
    return None


if _MULTIPART_AVAILABLE:
    @api_router.post("/upload")
    def upload_attachment(file: UploadFile = File(...), auth: dict = Depends(get_current_user)):
        """
        Upload a file to Supabase Storage (ticket-attachments bucket).
        Returns { "url": "https://...public/..." } for use as attachment_url on tickets.
        Storage API requires a JWT key (starts with eyJ). Set SUPABASE_STORAGE_JWT or use JWT-format service_role in .env.
        """
        storage_jwt = _get_storage_jwt()
        if not storage_jwt:
            _log("Upload rejected: no JWT key for Storage (Storage API needs eyJ... key, not sb_secret_ or Key ID)")
            raise HTTPException(
                status_code=503,
                detail="Storage upload needs a JWT (long string starting with eyJ). Do NOT use the Key ID from Settings → JWT Keys (e.g. 493059e5-...). Use Settings → API and copy the 'service_role' or 'anon' key (eyJ...). Set SUPABASE_STORAGE_JWT=<that key> in backend/.env.",
            )
        if not file.filename or file.filename.strip() == "":
            raise HTTPException(status_code=400, detail="Filename required")
        content_type = (file.content_type or "").strip().lower()
        if content_type and content_type not in ALLOWED_ATTACHMENT_TYPES and not content_type.startswith("image/"):
            if not content_type.startswith("image/"):
                raise HTTPException(
                    status_code=400,
                    detail="File type not allowed. Allowed: PDF, images, text, Word, Excel.",
                )
        contents = file.file.read()
        if len(contents) > ATTACHMENT_MAX_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {ATTACHMENT_MAX_BYTES // (1024*1024)} MB",
            )
        safe_name = "".join(c for c in file.filename if c.isalnum() or c in "._- ")
        if not safe_name:
            safe_name = "file"
        object_path = f"{auth['id']}/{uuid.uuid4().hex}_{safe_name}"
        base = (os.getenv("SUPABASE_URL") or "").rstrip("/")

        # Upload via Supabase Storage REST API (requires JWT in Authorization, not sb_secret_)
        upload_url = f"{base}/storage/v1/object/{ATTACHMENT_BUCKET}/{object_path}"
        headers = {"Authorization": f"Bearer {storage_jwt}"}
        content_type_val = content_type or "application/octet-stream"
        files = {"file": (safe_name, contents, content_type_val)}
        try:
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(upload_url, headers=headers, files=files)
                resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            _log(f"Storage upload HTTP error: {e.response.status_code} {e.response.text[:200]}")
            err_text = (e.response.text or str(e)).lower()
            if e.response.status_code == 403 and ("compact jws" in err_text or "unauthorized" in err_text):
                raise HTTPException(
                    status_code=503,
                    detail="Storage rejected the API key (Invalid JWT). Use a key that starts with 'eyJ'. In backend/.env set SUPABASE_STORAGE_JWT to your service_role JWT from Supabase Dashboard → Settings → API (copy the long key starting with eyJ).",
                )
            err_msg = (e.response.text or str(e))[:300]
            raise HTTPException(
                status_code=500,
                detail=f"Upload failed: {err_msg}. Ensure bucket 'ticket-attachments' exists and is public; run database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql.",
            )
        except Exception as e:
            _log(f"Storage upload error: {type(e).__name__}: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Upload failed: {str(e)[:200]}",
            )

        # Always return a string public URL (never a mock object)
        url = f"{base}/storage/v1/object/public/{ATTACHMENT_BUCKET}/{object_path}"
        _log(f"Upload OK: {object_path} -> {url[:80]}...")
        return {"url": url}
else:
    @api_router.post("/upload")
    def upload_attachment_disabled():
        raise HTTPException(
            status_code=503,
            detail="File upload requires python-multipart. In backend folder run: pip install python-multipart then restart the server.",
        )

# Mount API router at BOTH root and /api - fixes "Not Found" if frontend uses /api prefix
app.include_router(api_router)
app.include_router(api_router, prefix="/api")
