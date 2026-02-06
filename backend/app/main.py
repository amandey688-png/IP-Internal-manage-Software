from dotenv import load_dotenv
load_dotenv()

import os
import sys
# Fix Windows console encoding for emoji/special chars
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, APIRouter, Request, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import uuid
import httpx
from app.supabase_client import supabase, supabase_auth
from app.auth_middleware import get_current_user

# Role-based access: master_admin, admin (Super Admin), approver (Approver), user (Operator)
def _get_role_from_profile(user_id: str) -> str:
    """Fetch user profile and return frontend role name (master_admin, admin, approver, user)."""
    try:
        profile = supabase.table("user_profiles").select("role_id").eq("id", user_id).single().execute()
        if not profile.data:
            return "user"
        role_row = supabase.table("roles").select("name").eq("id", profile.data["role_id"]).single().execute()
        role_name = role_row.data["name"] if role_row.data else "user"
        # Keep master_admin distinct so only Master Admin can edit users/roles/section permissions
        return role_name if role_name in ("master_admin", "admin", "approver", "user") else "user"
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

# CORS configuration - allow frontend origin (include 3002 if frontend runs there)
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
    """Health check endpoint to verify backend is running"""
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

        # Method 1: create_user (service_role) - backend creates user, auto-confirms
        try:
            _log("Trying create_user (Supabase admin)...")
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
        except Exception as e1:
            _log(f"create_user failed: {type(e1).__name__}: {e1}")
            # Method 2: sign_up (anon) fallback
            try:
                _log("Trying sign_up (anon) fallback...")
                result = supabase_auth.auth.sign_up({
                    "email": payload.email.strip().lower(),
                    "password": payload.password,
                    "options": {"data": {"full_name": payload.full_name}},
                })
                if result and getattr(result, "user", None):
                    user_id = str(result.user.id)
                    user_email = getattr(result.user, "email", None) or payload.email
                    _log(f"sign_up OK: {user_id}")
            except Exception as e2:
                _log(f"sign_up failed: {type(e2).__name__}: {e2}")
                err = str(e2).lower()
                if "already" in err or "exists" in err or "registered" in err:
                    raise HTTPException(400, "This email is already registered. Please log in.")
                # Return actual Supabase error so user can fix
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
                        "role_id": role_id, "is_active": True
                    }).execute()
                    _log("Created user_profiles")
        except Exception as pe:
            _log(f"Profile backup: {pe}")

        _log(f"REGISTER SUCCESS: {user_id}")
        return {
            "user_id": user_id,
            "email": str(user_email or payload.email),
            "confirmation_sent": False,
            "message": "Registration successful. You can log in now."
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

        role_row = supabase.table("roles").select("name").eq(
            "id", profile.data["role_id"]
        ).single().execute()
        role_name = role_row.data["name"] if role_row.data else "user"
        # Frontend roles: master_admin, admin, approver, user (display names in UI)
        frontend_role = role_name if role_name in ("master_admin", "admin", "approver", "user") else "user"

        user = {
            "id": user_id,
            "email": result.user.email or payload.email,
            "full_name": profile.data["full_name"],
            "display_name": profile.data.get("display_name") or profile.data["full_name"],
            "role": frontend_role,
            "is_active": profile.data.get("is_active", True),
            "created_at": str(profile.data.get("created_at", "")),
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
    frontend_role = role_name if role_name in ("master_admin", "admin", "approver", "user") else "user"

    return {
        "id": user_id,
        "email": auth["email"],
        "full_name": profile.data["full_name"],
        "display_name": profile.data.get("display_name") or profile.data["full_name"],
        "role": frontend_role,
        "is_active": profile.data.get("is_active", True),
        "created_at": str(profile.data.get("created_at", "")),
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


def _enrich_tickets_with_lookups(rows: list) -> list:
    """Add company_name, page_name, division_name from lookup tables."""
    if not rows:
        return rows
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
        row["company_name"] = companies_map.get(row.get("company_id")) if row.get("company_id") else None
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
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 50,
    section: str | None = None,
    auth: dict = Depends(get_current_user),
):
    # Approval Status section: only admin, master_admin and approver
    if section == "approval-status":
        role = _get_role_from_profile(auth["id"])
        if role not in ("admin", "master_admin", "approver"):
            raise HTTPException(status_code=403, detail="Approval Status is only available to Admin and Approver roles")
    q = supabase.table("tickets").select("*", count="exact")
    if status:
        q = q.eq("status", status)
    if section == "completed-chores-bugs":
        types_list = ["chore", "bug"]
        q = q.in_("type", types_list)
        q = q.or_("quality_solution.not.is.null,live_review_status.eq.completed")
    elif section == "solutions":
        q = q.not_.is_("quality_solution", "null")
    elif section == "completed-feature":
        q = q.eq("type", "feature")
        q = q.or_("status.eq.resolved,live_review_status.eq.completed")
    elif section == "staging":
        # Tickets in Staging: (new workflow: staging_planned set OR old: status_2 = staging) AND not completed Stage 3
        q = q.or_("staging_planned.not.is.null,status_2.eq.staging")
        q = q.or_("live_review_status.is.null,live_review_status.neq.completed")
    elif section == "chores-bugs":
        types_list = ["chore", "bug"]
        q = q.in_("type", types_list)
        q = q.is_("quality_solution", "null")
        # Exclude tickets in Staging (new workflow or old status_2 = staging)
        q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
        q = q.or_("status_2.is.null,status_2.neq.staging")
    elif section == "approval-status":
        # Feature requests: pending, approved, and rejected (all for approval records)
        q = q.eq("type", "feature")
        q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
    elif types_in:
        types_list = [t.strip() for t in types_in.split(",") if t.strip()]
        if types_list:
            q = q.in_("type", types_list)
            q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
    elif type:
        q = q.eq("type", type)
        if type == "feature":
            # Feature section: only tickets already approved/unapproved (pending ones show in Approval Status only)
            q = q.not_.is_("approval_status", "null")
            q = q.or_("staging_planned.is.null,live_review_status.eq.completed")
    if company_id:
        q = q.eq("company_id", company_id)
    if priority:
        q = q.eq("priority", priority)
    if date_from:
        q = q.gte("created_at", date_from)
    if date_to:
        q = q.lte("created_at", date_to)
    if search:
        q = q.or_(f"title.ilike.%{search}%,description.ilike.%{search}%,user_name.ilike.%{search}%,submitted_by.ilike.%{search}%,customer_questions.ilike.%{search}%")
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


# Chores & Bugs: keys that count as "restricted" for Level 3 one-time edit (Stage 2 = status_2/actual_2 is allowed anytime)
_LEVEL3_RESTRICTED_CHORES_BUGS_KEYS = {
    "status_1", "actual_1", "planned_2", "status_3", "actual_3", "planned_3", "status_4", "actual_4", "planned_4",
}


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
    # Level 3 (user): one-time edit for Chores & Bugs (except Stage 2). Feature Stage 1 (remarks/approval) is always allowed.
    if role == "user":
        updated = r.data[0]
        ticket_type = updated.get("type") or (supabase.table("tickets").select("type").eq("id", ticket_id).single().execute().data or {}).get("type")
        if ticket_type in ("chore", "bug") and (data.keys() & _LEVEL3_RESTRICTED_CHORES_BUGS_KEYS):
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

    # All Chores & Bug tickets this month
    try:
        q = supabase.table("tickets").select("id", count="exact").in_("type", types_chores_bugs).gte("created_at", month_start.isoformat())
        r = q.execute()
        all_tickets = r.count or 0
    except Exception:
        all_tickets = 0

    # Last week Chores & Bug tickets
    try:
        q = supabase.table("tickets").select("*").in_("type", types_chores_bugs).gte("created_at", week_start.isoformat())
        r = q.execute()
        week_tickets = r.data or []
    except Exception:
        week_tickets = []

    total_last_week = len(week_tickets)
    pending_last_week = sum(1 for t in week_tickets if t.get("status") in ("open", "in_progress", "on_hold"))

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
        "response_delay": response_delay,
        "completion_delay": completion_delay,
        "total_last_week": total_last_week,
        "pending_last_week": pending_last_week,
        "staging_pending_feature": staging_pending_feature,
        "staging_pending_chores_bugs": staging_pending_chores_bugs,
    }


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
    return name if name in ("master_admin", "admin", "approver", "user") else "user"


# Section keys for user_section_permissions (match sidebar sections)
SECTION_KEYS = [
    "dashboard", "all_tickets", "chores_bugs", "staging", "feature",
    "approval_status", "completed_chores_bugs", "completed_feature",
    "solution", "settings", "users",
]


@api_router.get("/roles")
def list_roles(auth: dict = Depends(require_roles(["admin", "master_admin"]))):
    """List roles for dropdown (e.g. Edit User). Returns id and name."""
    r = supabase.table("roles").select("id, name, description").order("name").execute()
    return {"data": r.data or []}


@api_router.get("/users")
def list_users(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    auth: dict = Depends(require_roles(["admin", "master_admin"])),
):
    """List users. Admin and Master Admin can view; only Master Admin can edit (via PUT)."""
    q = supabase.table("users_view").select("*", count="exact")
    if search:
        q = q.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%,display_name.ilike.%{search}%")
    q = q.range((page - 1) * limit, page * limit - 1).order("created_at", desc=True)
    r = q.execute()
    rows = r.data or []
    for row in rows:
        row["role"] = _map_role(row.get("role_name", "user"))
    return {"data": rows, "total": r.count or 0, "page": page, "limit": limit}


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
