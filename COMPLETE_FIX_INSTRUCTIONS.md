# Complete Fix Instructions - Roles CHECK Constraint Issue

## Problem
The `roles` table has a CHECK constraint (`roles_name_check`) that doesn't allow the value 'user' to be inserted.

## Solution
We need to either:
1. Drop/modify the constraint to allow 'user', OR
2. Use an existing role that matches the constraint

---

## Step-by-Step Fix

### Step 1: Check Current State

Run this in Supabase SQL Editor to see what's there:

```sql
-- See what roles exist
SELECT id, name, description FROM public.roles;

-- See what the constraint allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.roles'::regclass 
AND contype = 'c';
```

**Expected**: You'll see what roles exist and what the constraint allows.

---

### Step 2: Fix the Constraint

**Option A: Drop the Constraint (Recommended)**

Run `FIX_ROLES_CONSTRAINT.sql` - it will:
1. Show current roles
2. Show constraint definition
3. Drop the constraint
4. Insert 'user' role

**Option B: Use Existing Role**

If you can't drop the constraint, find what roles are allowed and use one of those instead. Update the script to use that role name.

---

### Step 3: Run the Complete Fix

After fixing the constraint, run `QUICK_FIX_FINAL.sql` which will:
1. Fix roles table structure
2. Create user_profiles table
3. Create triggers
4. Fix existing users

---

## Quick Fix (All-in-One)

If you want to do everything at once:

### Step 1: Drop Constraint and Fix Roles

```sql
-- Drop CHECK constraint on roles.name
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.roles'::regclass 
        AND contype = 'c'
        AND (pg_get_constraintdef(oid) LIKE '%name%' OR conname LIKE '%name%')
    LOOP
        EXECUTE 'ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- Add missing columns
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

-- Insert 'user' role
INSERT INTO public.roles (name, description, is_system_role, created_at)
SELECT 'user', 'Standard user with basic permissions', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'user')
ON CONFLICT (name) DO NOTHING;
```

### Step 2: Create user_profiles Table

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

### Step 3: Create Triggers

```sql
-- Function for new user
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
        SELECT id INTO default_role_id
        FROM public.roles
        ORDER BY created_at
        LIMIT 1;
    END IF;
    
    IF default_role_id IS NOT NULL THEN
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
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function for email confirmation
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
        SELECT id INTO default_role_id
        FROM public.roles
        ORDER BY created_at
        LIMIT 1;
    END IF;
    
    IF default_role_id IS NOT NULL THEN
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
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for email confirmation
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.handle_user_email_confirmed();
```

### Step 4: Fix Existing Users

```sql
INSERT INTO public.user_profiles (id, full_name, role_id, is_active, created_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(
        (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1),
        (SELECT id FROM public.roles ORDER BY created_at LIMIT 1)
    ),
    TRUE,
    COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;
```

---

## Verification

After running all steps:

```sql
-- Check roles
SELECT id, name, description FROM public.roles;

-- Check triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- Check user_profiles
SELECT COUNT(*) FROM public.user_profiles;
SELECT COUNT(*) FROM auth.users;
-- (Counts should match)
```

---

## Files Available

1. **`FIX_ROLES_CONSTRAINT.sql`** - Fixes the constraint issue first
2. **`QUICK_FIX_FINAL.sql`** - Complete fix (run after fixing constraint)
3. **`COMPLETE_FIX_INSTRUCTIONS.md`** - This file

---

## Summary

✅ Drop CHECK constraint on `roles.name`  
✅ Add missing columns to `roles` table  
✅ Insert 'user' role  
✅ Create `user_profiles` table  
✅ Create triggers  
✅ Fix existing users  

**Run the steps in order, and everything should work!**
