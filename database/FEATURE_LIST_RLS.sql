-- ============================================================================
-- Fix: Enable RLS on public.feature_list (Security Advisor – "RLS Disabled in Public")
-- ============================================================================
-- Run in Supabase SQL Editor. Safe to run multiple times (DROP POLICY IF EXISTS).
-- Backend uses service_role and bypasses RLS; this policy applies for anon/authenticated.
-- ============================================================================

ALTER TABLE public.feature_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_list_select_authenticated" ON public.feature_list;
CREATE POLICY "feature_list_select_authenticated" ON public.feature_list
  FOR SELECT TO authenticated USING (true);

-- Optional: if you need to manage feature_list via authenticated role (e.g. admin UI), uncomment:
-- DROP POLICY IF EXISTS "feature_list_insert_authenticated" ON public.feature_list;
-- CREATE POLICY "feature_list_insert_authenticated" ON public.feature_list FOR INSERT TO authenticated WITH CHECK (true);
-- DROP POLICY IF EXISTS "feature_list_update_authenticated" ON public.feature_list;
-- CREATE POLICY "feature_list_update_authenticated" ON public.feature_list FOR UPDATE TO authenticated USING (true);
-- DROP POLICY IF EXISTS "feature_list_delete_authenticated" ON public.feature_list;
-- CREATE POLICY "feature_list_delete_authenticated" ON public.feature_list FOR DELETE TO authenticated USING (true);
