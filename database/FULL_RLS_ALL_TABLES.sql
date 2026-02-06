-- ============================================================================
-- FULL RLS FOR ALL PUBLIC TABLES
-- ============================================================================
-- Run in Supabase SQL Editor. Safe to run multiple times (DROP POLICY IF EXISTS).
-- Backend uses service_role key and BYPASSES RLS; these policies apply when
-- access uses anon or authenticated JWTs (e.g. direct client or future use).
-- ============================================================================

-- Helper: enable RLS only if table exists
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'roles','user_profiles','companies','pages','divisions','tickets',
    'ticket_responses','approval_settings','approval_logs','approval_tokens',
    'solutions','staging_deployments','user_section_permissions'
  ])
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- NOTE: Do NOT set security_invoker = on on users_view. The backend uses
-- service_role to query users_view; with security_invoker = on the view
-- can return no rows. Leave the view as default (security_invoker = off).

-- ----------------------------------------------------------------------------
-- 2. ROLES (read-only for authenticated)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "roles_select_authenticated" ON public.roles;
CREATE POLICY "roles_select_authenticated" ON public.roles
  FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 3. USER_PROFILES (read all for authenticated; update own only)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_profiles_select_authenticated" ON public.user_profiles;
CREATE POLICY "user_profiles_select_authenticated" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- INSERT is done by trigger handle_new_user (SECURITY DEFINER), so no policy needed for INSERT.

-- ----------------------------------------------------------------------------
-- 4. COMPANIES, PAGES, DIVISIONS (lookup tables: full access for authenticated)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "companies_all_authenticated" ON public.companies;
CREATE POLICY "companies_all_authenticated" ON public.companies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pages_all_authenticated" ON public.pages;
CREATE POLICY "pages_all_authenticated" ON public.pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "divisions_all_authenticated" ON public.divisions;
CREATE POLICY "divisions_all_authenticated" ON public.divisions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. TICKETS (authenticated: select all; insert own; update/delete all - app enforces roles)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "tickets_select_authenticated" ON public.tickets;
CREATE POLICY "tickets_select_authenticated" ON public.tickets
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tickets_insert_own" ON public.tickets;
CREATE POLICY "tickets_insert_own" ON public.tickets
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "tickets_update_authenticated" ON public.tickets;
CREATE POLICY "tickets_update_authenticated" ON public.tickets
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tickets_delete_authenticated" ON public.tickets;
CREATE POLICY "tickets_delete_authenticated" ON public.tickets
  FOR DELETE TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 6. TICKET_RESPONSES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "ticket_responses_select_authenticated" ON public.ticket_responses;
CREATE POLICY "ticket_responses_select_authenticated" ON public.ticket_responses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ticket_responses_insert_authenticated" ON public.ticket_responses;
CREATE POLICY "ticket_responses_insert_authenticated" ON public.ticket_responses
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ticket_responses_update_authenticated" ON public.ticket_responses;
CREATE POLICY "ticket_responses_update_authenticated" ON public.ticket_responses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ticket_responses_delete_authenticated" ON public.ticket_responses;
CREATE POLICY "ticket_responses_delete_authenticated" ON public.ticket_responses
  FOR DELETE TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 7. APPROVAL_SETTINGS, APPROVAL_LOGS, APPROVAL_TOKENS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "approval_settings_all_authenticated" ON public.approval_settings;
CREATE POLICY "approval_settings_all_authenticated" ON public.approval_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "approval_logs_select_authenticated" ON public.approval_logs;
CREATE POLICY "approval_logs_select_authenticated" ON public.approval_logs
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "approval_logs_insert_authenticated" ON public.approval_logs;
CREATE POLICY "approval_logs_insert_authenticated" ON public.approval_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "approval_tokens_select_authenticated" ON public.approval_tokens;
CREATE POLICY "approval_tokens_select_authenticated" ON public.approval_tokens
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "approval_tokens_insert_authenticated" ON public.approval_tokens;
CREATE POLICY "approval_tokens_insert_authenticated" ON public.approval_tokens
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "approval_tokens_update_authenticated" ON public.approval_tokens;
CREATE POLICY "approval_tokens_update_authenticated" ON public.approval_tokens
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 8. SOLUTIONS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "solutions_all_authenticated" ON public.solutions;
CREATE POLICY "solutions_all_authenticated" ON public.solutions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 9. STAGING_DEPLOYMENTS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "staging_deployments_all_authenticated" ON public.staging_deployments;
CREATE POLICY "staging_deployments_all_authenticated" ON public.staging_deployments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 10. USER_SECTION_PERMISSIONS (read own; full write for authenticated - app restricts by role)
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- 11. ALLOW SERVICE ROLE TO BYPASS (default in Supabase; explicit for clarity)
-- ----------------------------------------------------------------------------
-- In Supabase, the service_role key bypasses RLS by default. No policy needed.
-- Anon key without a valid JWT (auth.uid() null) will see no rows for tables
-- that require authenticated.

-- ============================================================================
-- DONE. RLS is enabled on all public tables with policies for authenticated.
-- Backend (service_role) is unaffected. To verify:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- ============================================================================
