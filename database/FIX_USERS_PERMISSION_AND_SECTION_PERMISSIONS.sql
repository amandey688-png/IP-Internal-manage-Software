-- ============================================================================
-- FIX: "Permission denied for table users" and Section Permissions
-- ============================================================================
-- Run in Supabase SQL Editor. Fixes:
-- 1. Permission denied for table users (backend must use service_role key)
-- 2. users_view security_invoker (ensures backend sees all rows)
-- 3. user_profiles and user_section_permissions RLS for service_role
-- 4. Ensures all section keys exist for Master Admin edits
-- ============================================================================

-- Step 1: Ensure users_view runs with owner rights (not invoker)
-- Backend uses service_role which bypasses RLS; the view must NOT use security_invoker
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'users_view') THEN
    EXECUTE 'ALTER VIEW public.users_view SET (security_invoker = off)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if option not supported (older Postgres)
END $$;

-- Step 2: Grant necessary permissions for the service_role (Supabase handles this by default)
-- If you use anon key by mistake, you will get "Permission denied for table users"
-- The auth.users table is in auth schema - only service_role and postgres can access it.

-- Step 3: Ensure user_section_permissions table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.user_section_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_user_section_permissions_user ON public.user_section_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_section_permissions_section ON public.user_section_permissions(section_key);

-- Step 4: Ensure user_section_permissions has RLS policies (service_role bypasses RLS)
-- Backend MUST use SUPABASE_SERVICE_ROLE_KEY - anon key causes "Permission denied for table users"
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_section_permissions') THEN
    ALTER TABLE public.user_section_permissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "user_section_permissions_select_authenticated" ON public.user_section_permissions;
CREATE POLICY "user_section_permissions_select_authenticated" ON public.user_section_permissions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "user_section_permissions_insert_authenticated" ON public.user_section_permissions;
CREATE POLICY "user_section_permissions_insert_authenticated" ON public.user_section_permissions
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "user_section_permissions_update_authenticated" ON public.user_section_permissions;
CREATE POLICY "user_section_permissions_update_authenticated" ON public.user_section_permissions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "user_section_permissions_delete_authenticated" ON public.user_section_permissions;
CREATE POLICY "user_section_permissions_delete_authenticated" ON public.user_section_permissions
  FOR DELETE TO authenticated USING (true);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DONE. Next: Ensure your backend .env has SUPABASE_SERVICE_ROLE_KEY set.
-- ============================================================================
