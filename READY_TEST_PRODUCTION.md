# FMS – Readiness, Testing & Production Deployment

**File:** `READY_TEST_PRODUCTION.md`  
This document covers: **how much is ready**, **how to test**, and **how to push to production**.

---

## 1. How Much Is Ready

### 1.1 Database (Supabase)

| Component | Status | File(s) |
|-----------|--------|---------|
| Core schema (roles, user_profiles, tickets, companies, divisions, pages) | ✅ Ready | `database/FRESH_SETUP.sql` or `database/SETUP_COMPLETE.sql` |
| User profiles + display_name + users_view (role name as "Name of User ID") | ✅ Ready | `database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql` |
| Section permissions (Master Admin) | ✅ Ready | Same file |
| Roles (user, admin, master_admin, approver) | ✅ Ready | In SETUP_COMPLETE / FRESH_SETUP + `database/ROLES_AND_APPROVAL_WORKFLOW.sql` |
| Tickets, ticket_responses, solutions | ✅ Ready | FRESH_SETUP / SETUP_COMPLETE |
| Companies, divisions, pages masters | ✅ Ready | `database/COMPANY_DIVISION_MASTER.sql`, `database/PAGES_MASTER.sql` |
| Staging workflow (columns + logic) | ✅ Ready | `database/STAGING_WORKFLOW.sql` |
| Chores & Bugs SLA stages | ✅ Ready | `database/CHORES_BUGS_SLA_UPGRADE.sql` (if used) |
| Approval workflow | ✅ Ready | `database/ROLES_AND_APPROVAL_WORKFLOW.sql` |

**Script run order (Supabase SQL Editor):**

1. **Fresh project:** Run `database/FRESH_SETUP.sql` once.
2. **Existing project:** Run `database/SETUP_COMPLETE.sql` (idempotent).
3. Then run (in order):
   - `database/ROLES_AND_APPROVAL_WORKFLOW.sql` (approver role + approval)
   - `database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql` (display_name, users_view, section permissions)
   - `database/STAGING_WORKFLOW.sql` (staging columns)
   - `database/COMPANY_DIVISION_MASTER.sql` (if using companies/divisions)
   - `database/PAGES_MASTER.sql` (if using pages master)
   - Any upgrade scripts (CHORES_BUGS_SLA_UPGRADE, APPROVAL_STATUS_UPGRADE, etc.) as needed.

---

### 1.2 Backend (FastAPI)

| Area | Status | Notes |
|------|--------|------|
| Health | ✅ | `GET /health` |
| Auth: Register | ✅ | `POST /auth/register` |
| Auth: Login | ✅ | `POST /auth/login` |
| Auth: Logout | ✅ | `POST /auth/logout` |
| Auth: Confirm | ✅ | `GET /auth/confirm` |
| Current user | ✅ | `GET /me`, `GET /users/me` (with role, display_name) |
| JWT middleware | ✅ | Protected routes use Bearer token |
| Tickets CRUD | ✅ | GET/POST/PUT/DELETE, list with filters |
| Ticket responses & quality solution | ✅ | POST responses, quality-solution |
| Mark staging / staging back | ✅ | POST mark-staging, staging-back |
| Approval (settings, tokens, execute) | ✅ | GET/PUT approval-settings, create-tokens, execute-by-token |
| Dashboard | ✅ | GET dashboard/metrics, dashboard/trends |
| Companies, divisions, pages | ✅ | GET /companies, /divisions, /pages |
| Roles | ✅ | GET /roles |
| Users list & update | ✅ | GET /users, GET/PUT /users/:id |
| Section permissions (Master Admin) | ✅ | GET/PUT /users/:id/section-permissions |
| Solutions | ✅ | GET/POST/PUT solutions (by ticket) |
| Staging deployments | ✅ | GET/POST/PUT /staging/deployments |

**Backend env (required):** `backend/.env` – see section 3.

---

### 1.3 Frontend (React + Vite + TypeScript)

| Area | Status | Notes |
|------|--------|------|
| Auth (login, register, confirm) | ✅ | With backend integration |
| Protected routes & role-based sidebar | ✅ | master_admin, admin, approver, user |
| Dashboard | ✅ | Metrics, trends, recent tickets |
| Support dropdown | ✅ | All Tickets, Chores & Bugs, Staging, Feature, Approval Status, Completed sections (no Solution section) |
| Tickets list & detail | ✅ | Sections, filters, staging, responses |
| Staging workflow (3 stages) | ✅ | Stage 1–3, Back to Chores & Bugs |
| Chores & Bugs SLA stages | ✅ | Stage 1–4, Quality Solution, Staging option |
| Feature approval | ✅ | Approval Status, Approve/Unapprove |
| Users list | ✅ | Role column, "Name of User ID" (role name), 3-dot menu |
| Edit user / Section permissions | ✅ | Master Admin: role, View/Edit per section |
| Deactivate user | ✅ | From 3-dot menu |
| Submit Support Ticket (header) | ✅ | Opens support form |
| Companies, divisions, pages | ✅ | Dropdowns from API |

**Frontend env:** `fms-frontend/.env` – `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

### 1.4 Not Ready / Optional

- Email delivery (Supabase SMTP/custom SMTP – config in Supabase Dashboard).
- Storage buckets for attachments (if you add file uploads).
- RLS on all tables (partially applied; backend uses service role).

---

## 2. How to Test

### 2.1 Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase project with SQL scripts applied (see 1.1)
- Backend `.env` and frontend `.env` filled (see 3.1 and 3.2)

---

### 2.2 Start Backend

**PowerShell:**

```powershell
cd "c:\Support FMS to APPLICATION\backend"
$env:PYTHONIOENCODING = "utf-8"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Expected:** `Uvicorn running on http://127.0.0.1:8000`

---

### 2.3 Start Frontend

**New terminal:**

```powershell
cd "c:\Support FMS to APPLICATION\fms-frontend"
npm install
npm run dev
```

**Expected:** Dev server at **http://localhost:3001** (or port shown in terminal).

---

### 2.4 Quick Smoke Test

| Step | Action | Pass if |
|------|--------|--------|
| 1 | Open http://127.0.0.1:8000/health | `{"status":"ok", ...}` |
| 2 | Open http://127.0.0.1:8000/docs | Swagger UI loads |
| 3 | Open frontend URL (e.g. http://localhost:3001) | Login page loads |
| 4 | Register → confirm email → Login | Redirect to Dashboard |
| 5 | Dashboard | Support Overview / metrics (or empty) |
| 6 | Support → All Tickets | List or empty state |
| 7 | Support → Chores & Bugs | Table loads, no console errors |
| 8 | Support → Staging | Table loads |
| 9 | Users (Admin) | List with Role, "Name of User ID" (role name) |
| 10 | Master Admin: User 3-dot → Edit | Modal with role + section View/Edit |

---

### 2.5 Test Database (Supabase SQL Editor)

After running `database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql`:

```sql
-- display_name and role_name should be role name (e.g. admin, user)
SELECT id, email, full_name, display_name, role_name
FROM public.users_view
ORDER BY email;
-- display_name should equal role_name
```

---

### 2.6 Test Staging Workflow

1. **Support → Chores & Bugs** → open a ticket → set Stage 2 **Status 2** to **Staging**.
2. **Support → Staging** → ticket appears; open it → complete Stage 1 → Stage 2 → Stage 3.
3. Ticket moves to **Completed Chores & Bugs** or **Completed Feature**; open it → read-only.

See `TESTING.md` for more detailed scenarios (Back to Chores & Bugs, URL redirect for staging ticket, etc.).

---

## 3. How to Push to Production

### 3.1 Environment Variables

**Backend (production):**

Create `backend/.env` (or set in hosting dashboard):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
# Optional if using DB URL for migrations
SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@...
JWT_AUDIENCE=authenticated
JWT_ISSUER=https://YOUR_PROJECT_REF.supabase.co/auth/v1
# Production frontend URL (for CORS)
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
```

**Frontend (production build):**

Set at **build time** (e.g. Vercel / Netlify env):

```env
VITE_API_BASE_URL=https://your-backend.railway.app
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Use **same** Supabase project as backend.

---

### 3.2 Supabase (Production)

1. **Auth → URL Configuration**
   - Site URL: `https://your-app.vercel.app` (or your production URL).
   - Redirect URLs: add
     - `https://your-app.vercel.app/confirmation-success`
     - `https://your-app.vercel.app/auth/confirm`

2. **Auth → Email**
   - Enable email confirmations if you use them.
   - Configure SMTP or use Supabase default (for production you may want custom SMTP).

3. **Database**
   - All SQL scripts (see 1.1) must be run in **production** Supabase project (or use the same project for dev and prod with different envs).

---

### 3.3 Backend Hosting (e.g. Railway / Render)

1. Connect repo; **root directory:** `backend`.
2. **Build:** `pip install -r requirements.txt`
3. **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`  
   (Use `$PORT` or the port your platform provides.)
4. Set **env vars** (see 3.1); ensure `CORS_ORIGINS` includes your frontend production URL.
5. No code change needed if CORS is read from `CORS_ORIGINS`; otherwise add production origin in `backend/app/main.py` in `_cors_origins`.

---

### 3.4 Frontend Hosting (e.g. Vercel / Netlify)

1. Connect repo; **root directory:** `fms-frontend`.
2. **Build command:** `npm run build`
3. **Output directory:** `dist`
4. Set **env vars** (see 3.1). **Important:** `VITE_API_BASE_URL` must be the **production backend URL** (e.g. `https://your-backend.railway.app`). No `/api` suffix unless your backend is under `/api`.
5. Deploy.

---

### 3.5 Post-Deploy Checklist

- [ ] Open production frontend URL → Login page.
- [ ] Register (or login) → Dashboard loads.
- [ ] Create a ticket → appears in list.
- [ ] Support → Staging → mark ticket staging → complete stages → appears in Completed.
- [ ] Admin: Users list shows "Name of User ID" as role name.
- [ ] Master Admin: Edit user → Role and section permissions save.
- [ ] Supabase Auth redirect URLs include production domain.
- [ ] Backend CORS includes production frontend origin.

---

### 3.6 Single Server (VPS) Option

- **Backend:** `uvicorn app.main:app --host 0.0.0.0 --port 8000` (or gunicorn + uvicorn workers).
- **Frontend:** `cd fms-frontend && npm run build` then serve `dist/` with nginx or `serve -s dist`.
- Set **CORS** to your public URL and **VITE_API_BASE_URL** to the same host or backend URL.

---

## 4. File Reference

| Purpose | File |
|---------|------|
| This guide | `READY_TEST_PRODUCTION.md` |
| Database: full fresh setup | `database/FRESH_SETUP.sql` |
| Database: idempotent setup | `database/SETUP_COMPLETE.sql` |
| Database: users_view + section permissions | `database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql` |
| Database: roles + approval | `database/ROLES_AND_APPROVAL_WORKFLOW.sql` |
| Database: staging | `database/STAGING_WORKFLOW.sql` |
| Backend env template | `backend/.env.example` |
| Detailed testing (staging, chores & bugs) | `TESTING.md` |
| Short setup & deploy | `SETUP_GUIDE.md` |

---

**Summary:** The app is **ready** for end-to-end use (auth, tickets, staging, approvals, users, roles, section permissions, dashboard). Test locally with backend + frontend + Supabase; push to production by setting env vars, running DB scripts on production Supabase, deploying backend and frontend, and configuring Supabase redirect URLs and CORS.
