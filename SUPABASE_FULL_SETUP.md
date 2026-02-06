# Supabase – Full Step-by-Step Setup

**File:** [SUPABASE_FULL_SETUP.md](SUPABASE_FULL_SETUP.md)  
Use this as the single guide to set up Supabase for the FMS app. All file paths below are **clickable** in Cursor/VS Code (Ctrl+Click or Cmd+Click to open).

---

## Prerequisites

- A [Supabase](https://supabase.com) account
- This repo cloned locally

---

## Step 1: Create a Supabase project

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)** and sign in.
2. Click **New project**.
3. Choose your **organization** (or create one).
4. Set:
   - **Name:** e.g. `fms-app`
   - **Database password:** choose a strong password and **save it** (you need it for DB URL and migrations).
   - **Region:** closest to your users.
5. Click **Create new project** and wait until the project is ready.
6. Note your **Project URL** and **API keys** (you’ll use them in Step 5):
   - Go to **Project Settings** (gear) → **API**.
   - Copy **Project URL**, **anon public** key, and **service_role** key (keep service_role secret).

---

## Step 2: Database – run SQL scripts in order

All scripts are in the **`database`** folder. Run them in the **Supabase SQL Editor** (left sidebar → **SQL Editor** → **New query**), in this order.

### 2.1 Base schema (choose one)

**Option A – Brand new project (clean slate)**  
Run this **once** (it drops and recreates FMS tables):

- **[database/FRESH_SETUP.sql](database/FRESH_SETUP.sql)**

**Option B – Existing project or add to existing DB (idempotent)**  
Safe to run multiple times:

- **[database/SETUP_COMPLETE.sql](database/SETUP_COMPLETE.sql)**

### 2.2 Roles and approval workflow

- **[database/ROLES_AND_APPROVAL_WORKFLOW.sql](database/ROLES_AND_APPROVAL_WORKFLOW.sql)**  
  Adds `approver` role and approval-related tables/settings.

### 2.3 User profiles and section permissions

- **[database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql](database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql)**  
  Adds `display_name`, `users_view` (role name as “Name of User ID”), and `user_section_permissions`.

### 2.4 Staging workflow

- **[database/STAGING_WORKFLOW.sql](database/STAGING_WORKFLOW.sql)**  
  Adds staging columns and logic to `tickets`.

### 2.5 Optional – Companies, divisions, pages

If your app uses companies/divisions/pages:

- **[database/COMPANY_DIVISION_MASTER.sql](database/COMPANY_DIVISION_MASTER.sql)**  
  Companies and divisions.
- **[database/PAGES_MASTER.sql](database/PAGES_MASTER.sql)**  
  Pages master.

Guides (optional reading):

- [database/COMPANY_DIVISION_MASTER_GUIDE.md](database/COMPANY_DIVISION_MASTER_GUIDE.md)
- [database/STEP_BY_STEP_COMPANY_DIVISION.md](database/STEP_BY_STEP_COMPANY_DIVISION.md)
- [database/STEP_BY_STEP_PAGES.md](database/STEP_BY_STEP_PAGES.md)

### 2.6 Optional – Upgrades (tickets, dashboard, SLA, approval)

Run only if you need these features and in this order:

- **[database/DASHBOARD_UPGRADE.sql](database/DASHBOARD_UPGRADE.sql)**  
  Extra ticket columns (e.g. `attachment_url`) and dashboard support.
- **[database/CHORES_BUGS_SLA_UPGRADE.sql](database/CHORES_BUGS_SLA_UPGRADE.sql)**  
  Chores & Bugs SLA stages (if used).
- **[database/APPROVAL_STATUS_UPGRADE.sql](database/APPROVAL_STATUS_UPGRADE.sql)**  
  Approval status upgrades (if used).
- **[database/ALL_TICKETS_UPGRADE.sql](database/ALL_TICKETS_UPGRADE.sql)**  
  All-tickets view/columns (if used).

How to run each script:

1. Open the file (click the link above or open from `database/` in the repo).
2. Copy the **entire** contents.
3. In Supabase: **SQL Editor** → **New query** → paste → **Run**.
4. Fix any errors (e.g. missing table) by running an earlier script first.

---

## Step 3: Authentication (Auth) settings

1. In Supabase, go to **Authentication** (left sidebar).
2. **Providers** → **Email**:
   - **Enable Email provider** = ON.
   - **Confirm email** = ON (so users must confirm before full access).
3. **URL Configuration** (under Auth or Project Settings → Auth):
   - **Site URL:**  
     - Dev: `http://localhost:3001`  
     - Prod: `https://your-domain.com`
   - **Redirect URLs** – add these (one per line):
     - `http://localhost:3001/confirmation-success`
     - `http://localhost:3001/auth/confirm`
     - `http://127.0.0.1:3001/confirmation-success`
     - For production add: `https://your-domain.com/confirmation-success` and `https://your-domain.com/auth/confirm`
4. **Email Templates** (optional):  
   **Confirm signup** – edit subject/body if you want; default is fine.
5. (Optional) **Custom SMTP** for production email delivery:  
   See **[EMAIL_SMTP_SETUP.md](EMAIL_SMTP_SETUP.md)**.

---

## Step 4: Storage – bucket for attachments

1. In Supabase, go to **Storage** (left sidebar).
2. Click **New bucket**.
3. Set:
   - **Name:** `ticket-attachments`
   - **Public bucket:** **ON**
   - (Optional) **File size limit:** e.g. 10 MB.  
   - (Optional) **Allowed MIME types:** e.g. `image/*`, `application/pdf`, `text/plain`.
4. Click **Create bucket**.

For more detail and policies, see **[ATTACHMENT_UPLOAD_SETUP.md](ATTACHMENT_UPLOAD_SETUP.md)**.

---

## Step 5: Environment variables (backend and frontend)

### 5.1 Backend

1. Copy the example env file:
   - **[backend/.env.example](backend/.env.example)**  
   Copy to **`backend/.env`** (same folder).
2. Edit **`backend/.env`** and set (from Supabase **Settings** → **API** and **Database**):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_public_key_here
```

Optional (for DB migrations or custom attachment bucket):

```env
SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
JWT_AUDIENCE=authenticated
JWT_ISSUER=https://YOUR_PROJECT_REF.supabase.co/auth/v1
SUPABASE_ATTACHMENT_BUCKET=ticket-attachments
ATTACHMENT_MAX_MB=10
```

- **Project REF:** from your Project URL, e.g. `geqcgxassdkrymzsjpoj`.
- **Database URI:** **Settings** → **Database** → **Connection string** → **URI** (use Transaction mode; replace `[YOUR-PASSWORD]` with your DB password).

### 5.2 Frontend

1. Edit **`fms-frontend/.env`** (create if missing). Set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
```

Use the **same** Project URL and **anon** key as in the backend. For production, set `VITE_API_BASE_URL` to your backend URL.

---

## Step 6: Verify setup

1. **Database**  
   In **SQL Editor** run:
   ```sql
   SELECT COUNT(*) FROM public.roles;
   SELECT COUNT(*) FROM public.user_profiles;
   ```
   You should see 3+ roles and 0+ profiles (profiles appear after first signup).

2. **Auth**  
   Register a test user from the app; check **Authentication** → **Users** and **Logs** (Auth logs).

3. **Storage**  
   Create a ticket with an attachment from the app; check **Storage** → **ticket-attachments** for the file.

4. **Backend**  
   Open `http://127.0.0.1:8000/health` – should return `{"status":"ok",...}`.

5. **Frontend**  
   Open `http://localhost:3001` – login page; after login, dashboard and Support sections should load.

---

## Quick reference – clickable files

| Purpose | File |
|--------|------|
| This guide | [SUPABASE_FULL_SETUP.md](SUPABASE_FULL_SETUP.md) |
| Fresh DB (drop + create) | [database/FRESH_SETUP.sql](database/FRESH_SETUP.sql) |
| Idempotent base setup | [database/SETUP_COMPLETE.sql](database/SETUP_COMPLETE.sql) |
| Roles + approval | [database/ROLES_AND_APPROVAL_WORKFLOW.sql](database/ROLES_AND_APPROVAL_WORKFLOW.sql) |
| User profiles + section permissions | [database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql](database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql) |
| Staging workflow | [database/STAGING_WORKFLOW.sql](database/STAGING_WORKFLOW.sql) |
| Companies & divisions | [database/COMPANY_DIVISION_MASTER.sql](database/COMPANY_DIVISION_MASTER.sql) |
| Pages master | [database/PAGES_MASTER.sql](database/PAGES_MASTER.sql) |
| Dashboard / attachment_url | [database/DASHBOARD_UPGRADE.sql](database/DASHBOARD_UPGRADE.sql) |
| Chores & Bugs SLA | [database/CHORES_BUGS_SLA_UPGRADE.sql](database/CHORES_BUGS_SLA_UPGRADE.sql) |
| Approval status upgrade | [database/APPROVAL_STATUS_UPGRADE.sql](database/APPROVAL_STATUS_UPGRADE.sql) |
| Backend env template | [backend/.env.example](backend/.env.example) |
| Email SMTP setup | [EMAIL_SMTP_SETUP.md](EMAIL_SMTP_SETUP.md) |
| Attachment upload setup | [ATTACHMENT_UPLOAD_SETUP.md](ATTACHMENT_UPLOAD_SETUP.md) |
| Readiness, test, production | [READY_TEST_PRODUCTION.md](READY_TEST_PRODUCTION.md) |
| General testing | [TESTING.md](TESTING.md) |
| Short setup & deploy | [SETUP_GUIDE.md](SETUP_GUIDE.md) |

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| “relation does not exist” | Run base schema first: [database/FRESH_SETUP.sql](database/FRESH_SETUP.sql) or [database/SETUP_COMPLETE.sql](database/SETUP_COMPLETE.sql). |
| “User profile not found” | Run [database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql](database/USER_PROFILES_AND_SECTION_PERMISSIONS.sql); ensure triggers exist from base setup. |
| No confirmation email | Auth → Enable “Confirm email”; add redirect URLs; see [EMAIL_SMTP_SETUP.md](EMAIL_SMTP_SETUP.md) for custom SMTP. |
| Upload fails (500) | Create Storage bucket `ticket-attachments` (public); see [ATTACHMENT_UPLOAD_SETUP.md](ATTACHMENT_UPLOAD_SETUP.md). |
| 401 on API | Backend `.env` has correct `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`; frontend sends Bearer token. |
| CORS errors | Backend `CORS_ORIGINS` includes your frontend URL (e.g. `http://localhost:3001`). |

---

**Summary:** Create project → run DB scripts in order (base → roles → user profiles → staging → optional masters/upgrades) → set Auth URLs and email → create Storage bucket → set backend and frontend env → verify. Use the links above to open each file quickly.
