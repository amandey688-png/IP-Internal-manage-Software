-- ============================================================================
-- "ticket" RLS – Enable RLS on support_tickets (this secures the ticket view)
-- ============================================================================
-- The "ticket" view has no RLS of its own; it reads from support_tickets.
-- Running this script secures both support_tickets AND the ticket view.
--
-- Step-by-step guide: see database/TICKET_RLS_STEP_BY_STEP.md
--
-- NOTE: Table Editor may still show "UNRESTRICTED" on ticket because (1) ticket
-- is a VIEW, (2) Editor uses role postgres which bypasses RLS. App roles are
-- still restricted. See SUPPORT_TICKETS_RLS.md for details.
-- ============================================================================

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (logged in via Supabase Auth) to read all rows
DROP POLICY IF EXISTS support_tickets_select_authenticated ON public.support_tickets;
CREATE POLICY support_tickets_select_authenticated ON public.support_tickets
  FOR SELECT TO authenticated USING (true);

-- Allow service_role (backend, cron) full access
DROP POLICY IF EXISTS support_tickets_all_service ON public.support_tickets;
CREATE POLICY support_tickets_all_service ON public.support_tickets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Optional: allow anon to read (e.g. if your "Ticket" software uses anon key only)
-- Uncomment the next 3 lines if you need unauthenticated read access:
-- DROP POLICY IF EXISTS support_tickets_select_anon ON public.support_tickets;
-- CREATE POLICY support_tickets_select_anon ON public.support_tickets
--   FOR SELECT TO anon USING (true);

-- ============================================================================
-- Optional: RLS for raw_support_upload (if this table exists)
-- ============================================================================
-- Uncomment the block below to enable RLS on raw_support_upload with same pattern.
/*
ALTER TABLE public.raw_support_upload ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS raw_support_upload_select_authenticated ON public.raw_support_upload;
CREATE POLICY raw_support_upload_select_authenticated ON public.raw_support_upload
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS raw_support_upload_all_service ON public.raw_support_upload;
CREATE POLICY raw_support_upload_all_service ON public.raw_support_upload
  FOR ALL TO service_role USING (true) WITH CHECK (true);
*/
