# Support FMS – Development Roadmap

**Product**: Facility Management System / Support ticketing platform with SLA tracking, feature approvals, and staging workflow.

**Tech Stack**: React (Vite) + TypeScript | FastAPI (Python) | Supabase (PostgreSQL + Auth)

**Users**: Internal (user, admin, master_admin, approver)

---

## 1. Development Roadmap

### Phase 1: Auth Complete (Week 1) – **PRIORITY** ✅ Implemented
| Task | Status | Notes |
|------|--------|-------|
| POST /auth/login | ✅ | Supabase sign_in, return JWT + user |
| GET /users/me | ✅ | Validate JWT, return user_profiles + role |
| POST /auth/logout | ✅ | Client-side clear; optional backend |
| authApi.getCurrentUser | ✅ | Frontend calls GET /users/me |
| authApi.logout | ✅ | Frontend clears storage |
| Role mapping (role_id → role name) | ✅ | user_profiles.role_id → roles.name → frontend UserRole |

### Phase 2: Tickets CRUD (Week 2)
| Task | Status | Notes |
|------|--------|-------|
| Apply tickets table schema | ❌ | Run fms_database_schema.sql tickets section |
| POST /tickets | ❌ | Create ticket, auto-generate reference_no |
| GET /tickets | ❌ | List with filters (status, type, search) |
| GET /tickets/{id} | ❌ | Detail with comments |
| PUT /tickets/{id} | ❌ | Update ticket |
| DELETE /tickets/{id} | ❌ | Admin only |
| Wire frontend TicketList, TicketDetail | ❌ | Replace stub calls |

### Phase 3: Solutions & Staging (Week 3)
| Task | Status | Notes |
|------|--------|-------|
| Solutions table + API | ❌ | Link to tickets |
| Staging environments + deployments | ❌ | Per 04_DATABASE_SCHEMA.md |
| Frontend Solutions, Staging pages | ⚠️ | UI exists, wire APIs |

### Phase 4: Users & Dashboard (Week 4)
| Task | Status | Notes |
|------|--------|-------|
| GET /users (admin) | ❌ | List users with role filter |
| PUT /users/{id}/role (master_admin) | ❌ | Change user role |
| GET /dashboard/overview | ❌ | Ticket stats, SLA metrics |
| Wire Dashboard, UserList | ❌ | Replace stubs |

### Phase 5: SLA, Approvals, Notifications (Week 5+)
| Task | Status | Notes |
|------|--------|-------|
| SLA rules + tracking | ❌ | Triggers, cron for breach detection |
| Feature approvals workflow | ❌ | Approver assignment, status flow |
| In-app notifications | ❌ | notifications table + real-time |
| File uploads (Supabase Storage) | ❌ | ticket_attachments |

---

## 2. Database Schema (Current vs Target)

### Current (Applied)
- `auth.users` – Supabase Auth
- `roles` – id, name, description, is_system_role
- `user_profiles` – id (→ auth.users), full_name, role_id (→ roles), is_active, created_at

### Target – Core Tables (Apply in Order)

```sql
-- Tickets (reference_no = TKT-000001 format)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('chore', 'bug', 'feature')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled', 'on_hold')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_type ON public.tickets(type);
CREATE INDEX idx_tickets_assignee ON public.tickets(assignee_id);
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);

-- Auto-generate reference_no
CREATE OR REPLACE FUNCTION generate_ticket_reference()
RETURNS TRIGGER AS $$
DECLARE next_num INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_no FROM 5) AS INT)), 0) + 1 INTO next_num FROM public.tickets;
    NEW.reference_no := 'TKT-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ticket_reference BEFORE INSERT ON public.tickets
FOR EACH ROW WHEN (NEW.reference_no IS NULL OR NEW.reference_no = '')
EXECUTE FUNCTION generate_ticket_reference();
```

**Note**: Your frontend uses `reference_no`; docs use `ticket_number`. Use `reference_no` consistently.

---

## 3. API Definitions

### Auth APIs (Implement First)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /auth/login | Sign in, return JWT + user |
| GET | /users/me | Current user (requires Bearer token) |
| POST | /auth/logout | Optional; client clears token |

### Tickets APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /tickets | Create ticket |
| GET | /tickets | List (query: status, type, search, page, limit) |
| GET | /tickets/{id} | Get one |
| PUT | /tickets/{id} | Update |
| DELETE | /tickets/{id} | Admin only |

### Response Format
```json
{
  "data": { ... },
  "error": null
}
```
Or paginated:
```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

## 4. Sample Code

### 4.1 Backend: POST /auth/login

```python
# backend/app/main.py - add these

from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm

security = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str | None
    user: dict
    requires_otp: bool = False

@app.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    try:
        result = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
        if not result.user or not result.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_id = str(result.user.id)
        # Fetch user_profiles + role name
        profile = supabase.table("user_profiles").select(
            "id, full_name, role_id, is_active, created_at, roles(name)"
        ).eq("id", user_id).single().execute()

        if not profile.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Join with roles if using foreign key
        role_name = profile.data.get("roles", {}).get("name", "user") if isinstance(profile.data.get("roles"), dict) else "user"
        # If roles not joined, fetch separately:
        if "role_id" in profile.data:
            role_row = supabase.table("roles").select("name").eq("id", profile.data["role_id"]).single().execute()
            role_name = role_row.data["name"] if role_row.data else "user"

        # Map master_admin -> master, approver -> user for frontend
        role_map = {"master_admin": "master", "approver": "user"}
        frontend_role = role_map.get(role_name, role_name)

        user = {
            "id": user_id,
            "email": result.user.email,
            "full_name": profile.data["full_name"],
            "role": frontend_role,
            "is_active": profile.data.get("is_active", True),
            "created_at": profile.data.get("created_at", ""),
        }

        return LoginResponse(
            access_token=result.session.access_token,
            refresh_token=result.session.refresh_token,
            user=user,
            requires_otp=False,
        )
    except Exception as e:
        if "Invalid login" in str(e) or "invalid" in str(e).lower():
            raise HTTPException(status_code=401, detail="Invalid email or password")
        raise HTTPException(status_code=500, detail=str(e))
```

### 4.2 Backend: GET /users/me (JWT Auth)

```python
# backend/app/auth_middleware.py - create this file

from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.supabase_client import supabase

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return {"id": str(user.user.id), "email": user.user.email}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

```python
# backend/app/main.py - add route

from app.auth_middleware import get_current_user

@app.get("/users/me")
def get_me(auth: dict = Depends(get_current_user)):
    user_id = auth["id"]
    profile = supabase.table("user_profiles").select(
        "id, full_name, role_id, is_active, created_at"
    ).eq("id", user_id).single().execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    role_row = supabase.table("roles").select("name").eq("id", profile.data["role_id"]).single().execute()
    role_name = role_row.data["name"] if role_row.data else "user"
    role_map = {"master_admin": "master", "approver": "user"}
    frontend_role = role_map.get(role_name, role_name)

    return {
        "id": user_id,
        "email": auth["email"],
        "full_name": profile.data["full_name"],
        "role": frontend_role,
        "is_active": profile.data.get("is_active", True),
        "created_at": profile.data.get("created_at", ""),
    }
```

### 4.3 Frontend: authApi.getCurrentUser & logout

```typescript
// fms-frontend/src/api/auth.ts - add these

getCurrentUser: async (): Promise<ApiResponse<User>> => {
  try {
    const response = await apiClient.get<User>('/users/me')
    return { data: response.data, error: undefined }
  } catch (err: any) {
    return {
      data: undefined,
      error: {
        message: err.response?.data?.detail || 'Failed to get user',
        code: err.response?.status?.toString(),
      },
    }
  }
},

logout: async (): Promise<void> => {
  // Backend logout optional; client clears storage
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // Ignore - we clear locally anyway
  }
},
```

### 4.4 Backend: Tickets CRUD (Minimal)

```python
# backend/app/main.py - add after auth routes

from app.auth_middleware import get_current_user

class CreateTicketRequest(BaseModel):
    title: str
    description: str | None = None
    type: str  # bug, feature, chore
    priority: str = "medium"
    assignee_id: str | None = None

@app.post("/tickets")
def create_ticket(payload: CreateTicketRequest, auth: dict = Depends(get_current_user)):
    data = {
        "title": payload.title,
        "description": payload.description or "",
        "type": payload.type,
        "priority": payload.priority,
        "created_by": auth["id"],
        "assignee_id": payload.assignee_id,
    }
    result = supabase.table("tickets").insert(data).execute()
    return result.data[0] if result.data else {}

@app.get("/tickets")
def list_tickets(
    status: str | None = None,
    type: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
    auth: dict = Depends(get_current_user),
):
    q = supabase.table("tickets").select("*", count="exact")
    if status:
        q = q.eq("status", status)
    if type:
        q = q.eq("type", type)
    if search:
        q = q.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
    q = q.range((page - 1) * limit, page * limit - 1).order("created_at", desc=True)
    result = q.execute()
    return {"data": result.data, "total": result.count or 0, "page": page, "limit": limit}

@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str, auth: dict = Depends(get_current_user)):
    result = supabase.table("tickets").select("*").eq("id", ticket_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return result.data
```

---

## 5. Common Mistakes to Avoid

### Auth
1. **Using ANON_KEY instead of SERVICE_ROLE_KEY** – Registration and admin ops need SERVICE_ROLE_KEY. Set in `backend/.env`.
2. **Not enabling email confirmation** – Supabase Auth → Settings → enable "Email confirmations" and set redirect URLs (see SUPABASE_EMAIL_SETUP.md).
3. **Wrong redirect URL** – Must match frontend (e.g. `http://localhost:3001/confirmation-success`).
4. **get_user(token) vs get_session(token)** – For `/users/me`, use `supabase.auth.get_user(jwt)` to validate; for login use `sign_in_with_password` which returns session with tokens.

### Database
5. **user_profiles vs users** – Your project uses `user_profiles` (id → auth.users). Don’t create a separate `users` table unless you migrate.
6. **role_id vs role name** – Frontend expects `role: "user" | "admin" | "master"`. Map `roles.name` (e.g. master_admin → master).
7. **reference_no vs ticket_number** – Use `reference_no` everywhere to match frontend types.

### API
8. **CORS** – Backend must allow frontend origin (e.g. `http://localhost:3001`). Already in main.py.
9. **401 handling** – Frontend axios interceptor clears storage and redirects to login. Ensure backend returns 401 (not 403) for expired/invalid tokens.
10. **Paginated response shape** – Frontend expects `{ data, total, page, limit }` or `{ tickets, total }`. Align with ticketsApi.list().

### Frontend
11. **authApi.getCurrentUser** – AuthProvider calls it on init. If missing, token is treated as invalid and user is logged out.
12. **Login response shape** – Must return `{ access_token, user, requires_otp? }`. User must have `id, email, full_name, role, is_active, created_at`.

### General
13. **Running migrations** – Run FIX_ALL.sql first, then tickets/solutions schema. Use Supabase SQL Editor.
14. **Env vars** – `VITE_API_BASE_URL` for frontend, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for backend. Never commit real keys.

---

## Quick Start (Phase 1)

1. Ensure FIX_ALL.sql has been run in Supabase.
2. Set `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.
3. Implement POST /auth/login and GET /users/me (see sample code above).
4. Add `getCurrentUser` and `logout` to `auth.ts`.
5. Test: Register → Confirm email → Login → Dashboard.
