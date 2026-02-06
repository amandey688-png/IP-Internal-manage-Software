-- ============================================================================
-- COMPLETE FIX - Run this entire script in Supabase SQL Editor
-- ============================================================================
-- This fixes the CHECK constraint issue and sets up everything
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop CHECK constraint on roles.name (if it exists)
-- ============================================================================
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop CHECK constraints on roles.name
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.roles'::regclass 
        AND contype = 'c'
        AND (pg_get_constraintdef(oid) LIKE '%name%' OR conname LIKE '%name%')
    LOOP
        EXECUTE 'ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Add missing columns to roles table
-- ============================================================================
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

-- ============================================================================
-- STEP 3: Insert 'user' role (now that constraint is dropped)
-- ============================================================================
INSERT INTO public.roles (name, description, is_system_role, created_at)
SELECT 'user', 'Standard user with basic permissions', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'user')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 4: Create user_profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- ============================================================================
-- STEP 5: Create function to handle new user creation
-- ============================================================================
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

    -- If 'user' role doesn't exist, get first available role
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id
        FROM public.roles
        ORDER BY created_at
        LIMIT 1;
    END IF;

    -- Create user_profiles record
    IF default_role_id IS NOT NULL THEN
        INSERT INTO public.user_profiles (
            id,
            full_name,
            role_id,
            is_active,
            created_at
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

-- ============================================================================
-- STEP 6: Create trigger on auth.users table
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 7: Create function to handle email confirmation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Get default 'user' role
    SELECT id INTO default_role_id
    FROM public.roles
    WHERE name = 'user'
    LIMIT 1;

    -- If 'user' role doesn't exist, get first available role
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id
        FROM public.roles
        ORDER BY created_at
        LIMIT 1;
    END IF;

    -- Ensure user_profiles exists when email is confirmed
    IF default_role_id IS NOT NULL THEN
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

-- ============================================================================
-- STEP 8: Create trigger for email confirmation
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.handle_user_email_confirmed();

-- ============================================================================
-- STEP 9: Fix existing users (create profiles for users already in auth.users)
-- ============================================================================
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

-- ============================================================================
-- VERIFICATION (Run these separately to check)
-- ============================================================================
-- Check roles:
-- SELECT id, name, description FROM public.roles;

-- Check triggers:
-- SELECT trigger_name FROM information_schema.triggers 
-- WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- Check user_profiles count:
-- SELECT COUNT(*) as user_profiles_count FROM public.user_profiles;
-- SELECT COUNT(*) as auth_users_count FROM auth.users;
-- (These counts should match)

-- ============================================================================
-- SUCCESS! Everything is set up.
-- ============================================================================
