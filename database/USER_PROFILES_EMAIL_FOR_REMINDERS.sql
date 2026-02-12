-- ============================================================================
-- Add email to user_profiles for checklist reminders
-- ============================================================================
-- Run in Supabase SQL Editor. Stores email in user_profiles so reminder can
-- find it without users_view or auth.admin. Backfill from auth.users.
-- ============================================================================

-- 1. Add email column
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill from auth.users (one-time sync)
UPDATE public.user_profiles up
SET email = COALESCE(au.email, '')
FROM auth.users au
WHERE up.id = au.id AND (up.email IS NULL OR up.email = '');

-- 3. Trigger: sync email when new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE rid UUID;
BEGIN
    SELECT id INTO rid FROM public.roles WHERE name = 'user' LIMIT 1;
    IF rid IS NULL THEN SELECT id INTO rid FROM public.roles ORDER BY created_at LIMIT 1; END IF;
    IF rid IS NOT NULL THEN
        INSERT INTO public.user_profiles (id, full_name, role_id, is_active, email)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
            rid,
            TRUE,
            COALESCE(NEW.email, '')
        )
        ON CONFLICT (id) DO UPDATE SET email = COALESCE(EXCLUDED.email, user_profiles.email);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger if needed (drop first if your schema uses different trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Trigger: sync email when user confirms email
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE rid UUID;
BEGIN
    SELECT id INTO rid FROM public.roles WHERE name = 'user' LIMIT 1;
    IF rid IS NULL THEN SELECT id INTO rid FROM public.roles ORDER BY created_at LIMIT 1; END IF;
    IF rid IS NOT NULL THEN
        INSERT INTO public.user_profiles (id, full_name, role_id, is_active, email)
        SELECT NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), rid, TRUE, COALESCE(NEW.email, '')
        WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id)
        ON CONFLICT (id) DO UPDATE SET email = COALESCE(EXCLUDED.email, user_profiles.email);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Sync email for ALL existing users (run again to catch any missed)
UPDATE public.user_profiles up
SET email = COALESCE(au.email, '')
FROM auth.users au
WHERE up.id = au.id;

-- Verify
-- SELECT id, full_name, email FROM public.user_profiles LIMIT 5;
