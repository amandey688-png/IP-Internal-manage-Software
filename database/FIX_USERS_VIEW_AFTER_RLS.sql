-- ============================================================================
-- FIX: User list empty after enabling RLS (users_view)
-- ============================================================================
-- If you ran FULL_RLS_ALL_TABLES.sql and the Users page shows "No data", run
-- this in Supabase SQL Editor. It ensures users_view does not use
-- security_invoker so the backend (service_role) can read all rows.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'users_view') THEN
    -- Default: view runs with owner's rights so backend (service_role) sees all rows
    EXECUTE 'ALTER VIEW public.users_view SET (security_invoker = off)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if option not supported (older Postgres)
END $$;
