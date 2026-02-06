# Step-by-Step Fix Instructions

## Problem
The `roles` table doesn't have a `description` column, causing the SQL script to fail.

## Solution
We'll fix the `roles` table structure first, then run the rest of the setup.

---

## Step-by-Step Instructions

### Option 1: Use the Fixed Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Copy and Paste the Fixed Script**
   - Open `QUICK_FIX.sql` (already fixed)
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)

3. **Verify Success**
   - You should see "Success. No rows returned"
   - If there are errors, see Option 2 below

---

### Option 2: Run Step-by-Step (If Option 1 Fails)

If you get any errors, run these commands **one at a time**:

#### Step 1: Fix Roles Table Structure

Copy and run this first:

```sql
-- Add missing columns to roles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.roles ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'is_system_role'
    ) THEN
        ALTER TABLE public.roles ADD COLUMN is_system_role BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.roles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
```

**Expected Result**: "Success. No rows returned"

#### Step 2: Create user_profiles Table

```sql
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
```

**Expected Result**: "Success. No rows returned"

#### Step 3: Create 'user' Role

```sql
INSERT INTO public.roles (name, description, is_system_role, created_at)
SELECT 'user', 'Standard user with basic permissions', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'user');
```

**Expected Result**: "Success. 1 row inserted" (or "0 rows inserted" if role already exists)

#### Step 4: Create Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    SELECT id INTO default_role_id
    FROM public.roles
    WHERE name = 'user'
    LIMIT 1;

    IF default_role_id IS NULL THEN
        INSERT INTO public.roles (name, description, is_system_role, created_at)
        VALUES ('user', 'Standard user with basic permissions', TRUE, NOW())
        RETURNING id INTO default_role_id;
    END IF;

    INSERT INTO public.user_profiles (
        id, full_name, role_id, is_active, created_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        default_role_id,
        TRUE,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Expected Result**: "Success. No rows returned"

#### Step 5: Create Trigger

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

**Expected Result**: "Success. No rows returned"

#### Step 6: Create Email Confirmation Function

```sql
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    SELECT id INTO default_role_id
    FROM public.roles
    WHERE name = 'user'
    LIMIT 1;

    IF default_role_id IS NULL THEN
        INSERT INTO public.roles (name, description, is_system_role, created_at)
        VALUES ('user', 'Standard user with basic permissions', TRUE, NOW())
        RETURNING id INTO default_role_id;
    END IF;

    INSERT INTO public.user_profiles (
        id, full_name, role_id, is_active, created_at
    )
    SELECT
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        default_role_id,
        TRUE,
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = NEW.id
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Expected Result**: "Success. No rows returned"

#### Step 7: Create Email Confirmation Trigger

```sql
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.handle_user_email_confirmed();
```

**Expected Result**: "Success. No rows returned"

#### Step 8: Fix Existing Users

```sql
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
)
ON CONFLICT (id) DO NOTHING;
```

**Expected Result**: "Success. X rows inserted" (where X is the number of existing users)

---

## Verification

After running all steps, verify everything worked:

### 1. Check Roles Table Structure

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'roles'
ORDER BY ordinal_position;
```

**Expected**: Should show columns: `id`, `name`, `description`, `is_system_role`, `created_at`, `updated_at`

### 2. Check Triggers

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';
```

**Expected**: Should show 2 triggers: `on_auth_user_created` and `on_auth_user_email_confirmed`

### 3. Check User Profiles

```sql
SELECT COUNT(*) as user_profiles_count FROM public.user_profiles;
SELECT COUNT(*) as auth_users_count FROM auth.users;
```

**Expected**: Both counts should match (or user_profiles_count >= auth_users_count)

---

## Troubleshooting

**If Step 1 fails:**
- Check if `roles` table exists: `SELECT * FROM public.roles LIMIT 1;`
- If table doesn't exist, create it first:
  ```sql
  CREATE TABLE IF NOT EXISTS public.roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_system_role BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

**If any step fails:**
- Check the error message
- Make sure you're running commands in order
- Some steps depend on previous steps completing successfully

**If triggers don't work:**
- Check if functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE 'handle_%';`
- Check trigger permissions: The triggers need `SECURITY DEFINER` to access `auth.users`

---

## Next Steps

After successfully running all steps:

1. ✅ Database triggers are set up
2. ✅ User profiles will be created automatically
3. ✅ Test registration flow
4. ✅ Configure Supabase redirect URLs (see `FIX_SUMMARY.md`)

---

## Quick Reference

- **Fixed Script**: `QUICK_FIX.sql` (use this first)
- **Step-by-Step Script**: `QUICK_FIX_STEP_BY_STEP.sql` (if you need to run sections separately)
- **Full Instructions**: This file (`STEP_BY_STEP_INSTRUCTIONS.md`)
