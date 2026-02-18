# Fix: "Permission denied for table users" and Section Permissions – Step-by-Step Guide

## Error You See
- **Request failed with status code 400**
- **Permission denied for table users** (PostgreSQL code 42501)
- Occurs when Master Admin edits a user (Active, Role, Section permissions) and clicks OK

## Root Cause
The backend uses **Supabase service_role** for database operations. If `SUPABASE_SERVICE_ROLE_KEY` is **not set** in your `.env`, the backend falls back to `SUPABASE_ANON_KEY`. The anon role **cannot** read `auth.users` (used by `users_view`), causing "Permission denied for table users".

---

## Step-by-Step Fix

### Step 1: Set the Service Role Key in Backend .env

1. Open **Supabase Dashboard** → Your project → **Settings** → **API**
2. Under **Project API keys**, copy the **`service_role`** key (⚠️ secret, never expose to frontend)
3. Open your backend `.env` file (e.g. `backend/.env`)
4. Ensure this line exists and has the correct value:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Restart your backend server (e.g. `uvicorn app.main:app --reload`)

### Step 2: Run the SQL Fix in Supabase

1. Open **Supabase Dashboard** → **SQL Editor** → **New query**
2. Copy the contents of **`database/FIX_USERS_PERMISSION_AND_SECTION_PERMISSIONS.sql`**
3. Paste into the SQL Editor
4. Click **Run**
5. Confirm you see "Success. No rows returned"

### Step 3: Verify

1. Log in as **Master Admin**
2. Go to **Users** → click **Edit** on any user
3. Change **Active** toggle, **Role**, or **Section permissions (View/Edit)**
4. Click **OK**
5. You should see **"User updated"** and no error

---

## Section Permissions (View / Edit)

Master Admin can set for each user:

- **Dashboard, All Tickets, Chores & Bugs, Staging, Feature, Approval Status, Completed Chores & Bugs, Completed Feature, Solution, Settings, Users**
- For each: **View** (can see) and **Edit** (can edit)
- If Master Admin sets only **View** for a section, the user can see it but not edit
- If neither View nor Edit, that section is hidden from the user

## Active / Inactive

- **Active**: User can sign in and use the app
- **Inactive**: User cannot sign in (blocked at login)
- Master Admin can toggle Active in the Edit User modal

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Still "Permission denied" | Double-check `SUPABASE_SERVICE_ROLE_KEY` in `.env` and restart backend |
| Users list empty | Run `database/FIX_USERS_VIEW_AFTER_RLS.sql` in Supabase SQL Editor |
| Section permissions not saving | Ensure `user_section_permissions` table exists (created by `USER_PROFILES_AND_SECTION_PERMISSIONS.sql`) |
| Inactive user can still log in | Backend enforces `is_active` at login; ensure you use latest backend code |
