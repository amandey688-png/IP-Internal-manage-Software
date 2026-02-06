# FMS Database Setup & Testing - Step by Step

This guide sets up your Supabase database **automatically** and walks you through testing.

---

## Part 1: Get Supabase Credentials

### Step 1.1: Create or Open Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project OR open your existing FMS project
3. Wait for the project to finish provisioning (1-2 minutes)

### Step 1.2: Get Database Connection URL

1. In Supabase Dashboard, go to **Settings** (gear icon) → **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. Choose **Transaction** mode (port 6543)
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with your actual database password (set when you created the project)
7. Save this - you'll add it to `.env` in Step 2

### Step 1.3: Get API Keys (if not already set)

1. Go to **Settings** → **API**
2. Copy **Project URL** (e.g. `https://xxx.supabase.co`)
3. Copy **anon public** key (for frontend login)
4. Copy **service_role** key (for backend - keep secret!)

---

## Part 2: Configure Environment

### Step 2.1: Create/Update backend/.env

1. Open `backend/.env` (create from `backend/.env.example` if it doesn't exist)
2. Add or update these variables:

```env
# Supabase API (required for app)
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_public_jwt_here

# Database URL (required for automatic migrations)
SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

3. Replace all placeholders with your actual values
4. **Important:** The `SUPABASE_DB_URL` must have your real database password

---

## Part 3: Run Automatic Database Setup

### Step 3.1: Install Dependencies

```powershell
cd "c:\Support FMS to APPLICATION\backend"
pip install psycopg2-binary
```

Or install all requirements:

```powershell
pip install -r requirements.txt
```

### Step 3.2: Run Migrations

**Option A: Fresh Setup (new project or full reset - DROPS all data)**

```powershell
cd "c:\Support FMS to APPLICATION"
python database/run_migrations.py --fresh
```

**Option B: Upgrade Only (existing project - adds new tables/columns, keeps data)**

```powershell
python database/run_migrations.py --upgrade
```

**Option C: Tickets Upgrade Only (if you already ran DASHBOARD_UPGRADE)**

```powershell
python database/run_migrations.py --tickets-only
```

### Step 3.3: Verify Success

You should see output like:

```
Connecting to Supabase...
Connected.

Running FRESH_SETUP.sql...
  OK: FRESH_SETUP.sql
Running DASHBOARD_UPGRADE.sql...
  OK: DASHBOARD_UPGRADE.sql
Running ALL_TICKETS_UPGRADE.sql...
  OK: ALL_TICKETS_UPGRADE.sql

Done. Database is ready.
```

---

## Part 4: Manual Alternative (Supabase SQL Editor)

If the Python script fails (e.g. connection issues), run SQL manually:

1. Go to Supabase Dashboard → **SQL Editor**
2. Create a new query
3. Copy and paste the contents of these files **in order**:
   - `database/FRESH_SETUP.sql` (for fresh) OR skip if upgrading
   - `database/DASHBOARD_UPGRADE.sql`
   - `database/ALL_TICKETS_UPGRADE.sql`
4. Click **Run**

---

## Part 5: Test the Application

### Step 5.1: Start Backend

```powershell
cd "c:\Support FMS to APPLICATION\backend"
$env:PYTHONIOENCODING="utf-8"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or use the batch file:

```powershell
.\start-backend-utf8.bat
```

### Step 5.2: Start Frontend

```powershell
cd "c:\Support FMS to APPLICATION\fms-frontend"
npm run dev
```

### Step 5.3: Test Registration & Login

1. Open browser: **http://localhost:3002** (or the port shown)
2. Click **Register**
3. Enter: Full Name, Email, Password (8+ chars)
4. Submit - you should get a success message
5. Check your email for confirmation link (if email confirmation is enabled)
6. Go to **Login** and sign in with the same credentials

### Step 5.4: Test Dashboard

1. After login, you should see the **Dashboard**
2. Verify metric cards show numbers (or 0 if no tickets yet)
3. Check **Recent tickets** section

### Step 5.5: Test Support Form (Add New Ticket)

1. Click **Add New** in the header
2. Fill in the form:
   - Company Name (select)
   - User Name
   - Page (select)
   - Division (select)
   - Title
   - Type of Request (Chores/Bug/Feature)
   - Communicated Through
   - Submitted By (auto-filled)
   - Query Arrival Date & Time
   - Quality of Response
   - Customer Questions
   - Query Response Date & Time
   - If Feature: Priority, Why Feature?
3. Click **OK**
4. You should see "Support ticket created"

### Step 5.6: Test All Tickets Table

1. Go to **Support** → **All Tickets** in the sidebar
2. Verify the table loads with 22 columns
3. Click a row - **Ticket Detail Drawer** should open
4. Add a response in the drawer
5. Test filters: Company, Status, Type, Priority, Date range
6. Test global search

### Step 5.7: Verify Database (Optional)

In Supabase SQL Editor, run:

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

---

## Troubleshooting

### "SUPABASE_DB_URL not set"
- Ensure `SUPABASE_DB_URL` is in `backend/.env`
- Copy the exact URI from Supabase Dashboard → Settings → Database
- Replace `[YOUR-PASSWORD]` with your database password

### "Could not connect"
- Check your database password is correct
- Ensure your IP is allowed (Supabase → Settings → Database → Connection pooling)
- Try the **Direct** connection (port 5432) if pooler fails

### "relation does not exist"
- Run `--fresh` to reset: `python database/run_migrations.py --fresh`
- Or run the SQL files manually in order

### Backend 500 errors
- Ensure backend is started with UTF-8: `$env:PYTHONIOENCODING="utf-8"`
- Check `backend/backend_errors.log` for details

### Frontend blank screen
- Check browser console for errors
- Verify backend is running on port 8000
- Check CORS includes your frontend URL (e.g. localhost:3002)

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `python database/run_migrations.py --fresh` | Full reset, drops all data |
| `python database/run_migrations.py --upgrade` | Add new tables/columns, keeps data |
| `python database/run_migrations.py --tickets-only` | Only ticket_responses + ticket columns |
