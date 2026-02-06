# Fix "Request failed with status code 500" on Registration

## ROOT CAUSE (Windows): Encoding Error

On Windows, the backend can hit a `charmap codec can't encode` error when logging/printing, causing 500. **Fix: Run backend with UTF-8 encoding.**

### Start Backend with UTF-8 (REQUIRED on Windows)

**PowerShell:**
```powershell
cd "c:\Support FMS to APPLICATION\backend"
$env:PYTHONIOENCODING="utf-8"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Command Prompt:**
```cmd
cd "c:\Support FMS to APPLICATION\backend"
set PYTHONIOENCODING=utf-8
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Or use the start script:** `start-backend-utf8.bat` (see below)

---

## If Email Already Exists

**aman@industryprime.com** may already be registered. Either:
1. Use a **different email** (e.g. aman2@industryprime.com)
2. Or delete the user: **Supabase** → **Authentication** → **Users** → find the user → Delete

## Quick Fixes (try in order)

### 1. Disable Email Confirmation in Supabase

Email confirmation often causes 500 errors with sign_up.

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Click **Email**
3. Turn **OFF** "Confirm email" (disable it for development)
4. Save

### 2. Run Database Setup

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `database/FRESH_SETUP.sql` from this project
3. Copy all contents and paste into SQL Editor
4. Click **Run**

### 3. Verify API Keys

Check `backend/.env`:

```
SUPABASE_URL=https://geqcgxassdkrymzsjpoj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_public_jwt
```

- Get keys from **Supabase** → **Settings** → **API**
- Use the **anon public** JWT (starts with `eyJ...`) for `SUPABASE_ANON_KEY`
- Use the **service_role** key for `SUPABASE_SERVICE_ROLE_KEY`

### 4. Add Redirect URL in Supabase

1. Go to **Authentication** → **URL Configuration**
2. **Site URL:** `http://localhost:3001`
3. **Redirect URLs:** Add `http://localhost:3001/**` and `http://localhost:3001/confirmation-success`
4. Save

### 5. Restart Both Servers

**Backend (Windows - use UTF-8):**
```powershell
cd "c:\Support FMS to APPLICATION\backend"
.\start-backend-utf8.bat
```
Or manually:
```powershell
$env:PYTHONIOENCODING="utf-8"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend:**
```bash
cd "c:\Support FMS to APPLICATION\fms-frontend"
npm run dev
```

### 6. Use a New Email

If the email is already registered, use a different one or delete the user in **Supabase** → **Authentication** → **Users**.

---

## Check What's Failing

1. **Backend terminal** – When you click Register, you should see:
   ```
   --> POST /auth/register
   📝 REGISTER START: your@email.com
   📤 Trying sign_up (anon)...
   ```
   If you see an error after that, that's the cause.

2. **Log file** – Check `backend/backend_errors.log` after a failed attempt.

3. **Direct API test:**
   ```bash
   curl -X POST http://127.0.0.1:8000/auth/register -H "Content-Type: application/json" -d "{\"full_name\":\"Test\",\"email\":\"newuser@test.com\",\"password\":\"Test123!@#\"}"
   ```
   Check the backend terminal for output.
