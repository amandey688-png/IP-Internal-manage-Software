# FMS - Verify & Test Guide (Step by Step)

## Part 1: Verify Database Connection

### Step 1.1: Get Correct Connection String from Supabase

1. Go to **Supabase Dashboard** → Your project
2. Click **"Connect"** button (green, top right) OR go to **Project Settings** → **Database**
3. Scroll to **"Connection string"** section
4. Select **"URI"** tab
5. Choose **"Transaction"** mode (port 6543) - recommended for migrations
6. Copy the **exact** connection string
7. Replace `[YOUR-PASSWORD]` with your database password
8. **Important:** If your password contains `@` or `#`, replace them:
   - `@` → `%40`
   - `#` → `%23`

### Step 1.2: Update backend/.env

Add or update this line in `backend/.env`:

```
SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Use the **exact** URI from Supabase. The region (e.g. `ap-south-1`, `us-east-1`) must match your project.

### Step 1.3: Run Migrations

Open PowerShell in project folder:

```powershell
cd "c:\Support FMS to APPLICATION"
pip install psycopg2-binary
python database/run_migrations.py --upgrade
```

**Expected output:**
```
Connecting to Supabase...
Connected.

Running DASHBOARD_UPGRADE.sql...
  OK: DASHBOARD_UPGRADE.sql
Running ALL_TICKETS_UPGRADE.sql...
  OK: ALL_TICKETS_UPGRADE.sql

Done. Database is ready.
```

**If you get "Tenant or user not found":** Your project may be in a different region. Get the exact URI from Supabase Connect button.

**If you get "could not translate host name":** Check your network/VPN. Try from a different network.

---

## Part 2: Verify Application Works

### Step 2.1: Start Backend

```powershell
cd "c:\Support FMS to APPLICATION\backend"
$env:PYTHONIOENCODING="utf-8"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Verify:** Open http://127.0.0.1:8000/health - you should see `{"status":"ok"}`

### Step 2.2: Start Frontend

Open a **new** PowerShell window:

```powershell
cd "c:\Support FMS to APPLICATION\fms-frontend"
npm run dev
```

**Verify:** Open http://localhost:3002 (or the port shown)

### Step 2.3: Test Registration

1. Click **Register**
2. Enter: Full Name, Email, Password (8+ chars)
3. Submit
4. You should see success message

### Step 2.4: Test Login

1. Go to **Login**
2. Enter same email and password
3. Submit
4. You should land on **Dashboard**

### Step 2.5: Test Support Form

1. Click **Add New** (top right)
2. Fill the form (Company, User Name, Page, Division, Title, etc.)
3. Click **OK**
4. You should see "Support ticket created"

### Step 2.6: Test All Tickets Table

1. Go to **Support** → **All Tickets** (sidebar)
2. Table should load with columns
3. Click a row → **Ticket Detail Drawer** opens
4. Add a response in the drawer

---

## Part 3: Verify Database in Supabase

1. Go to **Supabase** → **SQL Editor**
2. Run:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check ticket count
SELECT COUNT(*) FROM tickets;

-- Check companies
SELECT * FROM companies LIMIT 5;
```

You should see: `roles`, `user_profiles`, `tickets`, `companies`, `pages`, `divisions`, `ticket_responses`, etc.

---

## Quick Checklist

| Step | Action | Pass? |
|------|--------|-------|
| 1 | Migrations run successfully | ☐ |
| 2 | Backend /health returns OK | ☐ |
| 3 | Frontend loads | ☐ |
| 4 | Registration works | ☐ |
| 5 | Login works | ☐ |
| 6 | Add New ticket works | ☐ |
| 7 | All Tickets table loads | ☐ |
| 8 | Ticket Detail Drawer opens | ☐ |
