# Database Setup Steps - User Profiles Auto-Creation

## Problem
Users are created in `auth.users` (Supabase Auth) but NOT in `public.user_profiles` table, so they can't login.

## Solution
Create a database trigger that automatically creates `user_profiles` record when a user signs up.

---

## Step-by-Step Database Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Ensure user_profiles Table Exists

Run this SQL first to create the table if it doesn't exist:

```sql
-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
```

### Step 3: Ensure Roles Table Has Default 'user' Role

Run this SQL:

```sql
-- Check if 'user' role exists, if not create it
INSERT INTO public.roles (name, description, is_system_role)
SELECT 'user', 'Standard user with basic permissions', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.roles WHERE name = 'user'
);
```

### Step 4: Create Trigger Function

Copy and paste this entire SQL into Supabase SQL Editor:

```sql
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Get the default 'user' role ID
    SELECT id INTO default_role_id
    FROM public.roles
    WHERE name = 'user'
    LIMIT 1;

    -- If no default role exists, create it
    IF default_role_id IS NULL THEN
        INSERT INTO public.roles (name, description, is_system_role)
        VALUES ('user', 'Standard user with basic permissions', TRUE)
        RETURNING id INTO default_role_id;
    END IF;

    -- Create user_profiles record
    INSERT INTO public.user_profiles (
        id,
        full_name,
        role_id,
        is_active,
        created_at
    ) VALUES (
        NEW.id,  -- Use auth.users.id as primary key
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),  -- Extract full_name from metadata
        default_role_id,
        TRUE,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate inserts

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 5: Create Trigger on auth.users

```sql
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### Step 6: Create Email Confirmation Handler (Optional but Recommended)

```sql
-- Function to handle email confirmation
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Get default role
    SELECT id INTO default_role_id
    FROM public.roles
    WHERE name = 'user'
    LIMIT 1;

    -- Ensure user_profiles exists when email is confirmed
    INSERT INTO public.user_profiles (
        id,
        full_name,
        role_id,
        is_active,
        created_at
    )
    SELECT
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(default_role_id, (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1)),
        TRUE,
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = NEW.id
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.handle_user_email_confirmed();
```

### Step 7: Verify Setup

Run this to check if triggers are created:

```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth';
```

You should see:
- `on_auth_user_created` trigger
- `on_auth_user_email_confirmed` trigger

---

## Step 7: Configure Supabase Email Redirect URL

1. Go to Supabase Dashboard
2. Click **Authentication** → **URL Configuration**
3. Set **Site URL**: `http://localhost:3001`
4. Set **Redirect URLs**: Add these:
   - `http://localhost:3001/confirmation-success`
   - `http://localhost:3001/auth/confirm`
   - `http://127.0.0.1:3001/confirmation-success`
   - `http://127.0.0.1:3001/auth/confirm`

---

## Step 8: Test the Flow

1. **Register a new user** via frontend
2. **Check `auth.users` table** - should see new user
3. **Check `public.user_profiles` table** - should automatically have new record
4. **Click email confirmation link**
5. **Should redirect to**: `http://localhost:3001/confirmation-success?token=...&type=signup`
6. **Should show**: "Email Confirmed!" message
7. **After 5 seconds**: Redirects to login
8. **Try logging in** - should work now!

---

## Troubleshooting

**If user_profiles is still empty after registration:**

1. Check if trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'users';
   ```

2. Check trigger function:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

3. Manually create user_profiles for existing users:
   ```sql
   -- First ensure 'user' role exists
   INSERT INTO public.roles (name, description, is_system_role)
   SELECT 'user', 'Standard user with basic permissions', TRUE
   WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'user');

   -- Then create user_profiles for existing auth.users
   INSERT INTO public.user_profiles (id, full_name, role_id, is_active, created_at)
   SELECT 
       au.id,
       COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
       (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1),
       TRUE,
       COALESCE(au.created_at, NOW())
   FROM auth.users au
   WHERE NOT EXISTS (
       SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
   );
   ```

**If email confirmation redirects to wrong page:**

- Check Supabase URL Configuration (Step 8)
- Make sure redirect URLs include your frontend URL
- Verify the redirect URL in Supabase Auth settings matches: `http://localhost:3001/confirmation-success`

---

## Summary

✅ Database trigger automatically creates `user_profiles` when user signs up
✅ Email confirmation creates profile if it doesn't exist
✅ Frontend shows confirmation success message
✅ User can login after email confirmation

**After running these SQL commands, test registration again!**
