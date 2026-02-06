# Login Fix - Step by Step

## For user: test@ip.com (or aman@industryprime.com)

### Step 1: Run SQL in Supabase (REQUIRED)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Paste and run:

```sql
-- Create user_profiles for ALL auth users that don't have one
INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
  (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1), TRUE
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = au.id)
ON CONFLICT (id) DO NOTHING;
```

3. Verify: **Table Editor** → `user_profiles` → you should see your user

### Step 2: Add keys to backend/.env

Your `.env` must have (get from Supabase → Settings → API):

```
SUPABASE_URL=https://odsydofrnpijlgsyndtx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
SUPABASE_ANON_KEY=eyJ...your_anon_public_key
```

### Step 3: Reset password in Supabase

1. **Authentication** → **Users** → click user `test@ip.com`
2. Click **⋮** (three dots) → **Send password recovery**
3. Check email, click link, set new password
4. Or: **⋮** → **Reset password** and set it directly

### Step 4: Restart backend

```powershell
cd "c:\Support FMS to APPLICATION\backend"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Step 5: Test login

1. Open http://localhost:3001/login
2. Email: `test@ip.com`
3. Password: (the one you just set)
4. Click Login

### If still fails

Check **backend terminal** for `🔴 Login error:` - it shows the real error.
