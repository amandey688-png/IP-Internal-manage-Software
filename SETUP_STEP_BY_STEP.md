# FMS Setup – Step-by-Step Guide

Follow this guide **in order** when setting up a new database or fixing issues. This prevents common problems like "Not Found", "User profile not found", and login failures.

---

## Step 1: Create Supabase Project (if new)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose organization, name, password, region
3. Wait for the project to be created

---

## Step 2: Get Your Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:

   | Setting | Where to Find | Example |
   |---------|---------------|---------|
   | **Project URL** | Project URL | `https://xxxxx.supabase.co` |
   | **anon public** | Project API keys → anon public (JWT format) | `eyJhbGciOiJIUzI1...` |
   | **service_role** | Project API keys → service_role (secret) | `eyJhbGciOiJIUzI1...` or `sb_secret_xxx` |

3. **Important:** Use the **anon public** JWT (starts with `eyJ`) for login. The shorter `sb_publishable_xxx` format may not work for auth.

---

## Step 3: Configure Backend

1. Open `backend/.env`
2. Set these values (replace with your actual values):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_public_jwt_here

JWT_AUDIENCE=authenticated
JWT_ISSUER=https://YOUR_PROJECT_REF.supabase.co/auth/v1
```

3. **JWT_ISSUER** = Your Project URL + `/auth/v1`  
   Example: `https://geqcgxassdkrymzsjpoj.supabase.co/auth/v1`

---

## Step 4: Configure Frontend

1. Open `fms-frontend/.env`
2. Set these values:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_jwt_here
```

3. Use the **same anon JWT** as in the backend.

---

## Step 5: Run Database Setup (CRITICAL)

This creates all tables, triggers, and views. **Must be done before using the app.**

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Open `database/FRESH_SETUP.sql` from this project
4. Copy the **entire** contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Confirm you see "Success. No rows returned" or similar

**What this does:**
- Creates `roles`, `user_profiles`, `tickets`, `solutions`, `staging_deployments`
- Creates triggers to auto-create user profiles on signup
- Creates `users_view` for the backend
- Backfills profiles for any existing auth users

---

## Step 6: Configure Auth (Supabase Dashboard)

1. Go to **Authentication** → **Providers** → **Email**
2. **Enable Email provider**
3. For local development, consider:
   - **Confirm email:** OFF (so you can log in immediately without email confirmation)
   - Or keep it ON and use the confirmation link from your email

4. Go to **Authentication** → **URL Configuration**
   - **Site URL:** `http://localhost:3001` (for dev)
   - **Redirect URLs:** Add `http://localhost:3001/confirmation-success`

---

## Step 7: Start the App

**Terminal 1 – Backend:**
```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 – Frontend:**
```bash
cd fms-frontend
npm run dev
```

---

## Step 8: Test

1. Open `http://localhost:3001`
2. Click **Register** and create an account
3. Log in
4. You should see the Dashboard

**If login fails:**
- Check backend terminal for error messages
- Visit `http://127.0.0.1:8000/check-user?email=YOUR_EMAIL` to see if user exists and has a profile
- If "has_profile: false", run `database/FIX_USER_PROFILE.sql`

---

## Checklist – Avoid Problems

| ✓ | Action |
|---|--------|
| ☐ | Run `FRESH_SETUP.sql` in Supabase SQL Editor **before** first use |
| ☐ | Use the **anon public JWT** (eyJ...) for both backend and frontend, not the short key |
| ☐ | Set `JWT_ISSUER` = `https://YOUR_REF.supabase.co/auth/v1` |
| ☐ | Restart backend after changing `.env` |
| ☐ | Restart frontend after changing `.env` |
| ☐ | If "User profile not found", run `FIX_USER_PROFILE.sql` or `FRESH_SETUP.sql` |

---

## Quick Reference – Your Current Setup

| Item | Value |
|------|-------|
| Project URL | `https://geqcgxassdkrymzsjpoj.supabase.co` |
| Backend .env | `backend/.env` |
| Frontend .env | `fms-frontend/.env` |
| Database script | `database/FRESH_SETUP.sql` |
| Fix profiles | `database/FIX_USER_PROFILE.sql` |
