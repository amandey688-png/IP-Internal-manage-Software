-- ============================================================================
-- FIX: Supabase Security Advisor – 3 errors
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================
-- These fixes address:
-- 1. Exposed Auth Users (public.users_view)
-- 2. Security Definer View (public.users_view)
-- 3. RLS Disabled in Public (public.ticket_stage_remarks or ticket_stage2_remarks)
--
-- NOTE: These do NOT fix "local not working". Local login fails due to
-- .env keys or network (WinError 10060). Use LOGIN_FIX_STEP_BY_STEP.md for that.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1 & 2: users_view – restrict to service_role only (backend uses service_role)
-- This removes "Exposed Auth Users" and reduces risk of "Security Definer View".
-- Anon and authenticated can no longer read the view; only your backend (service_role) can.
-- ----------------------------------------------------------------------------
REVOKE SELECT ON public.users_view FROM anon;
REVOKE SELECT ON public.users_view FROM authenticated;
GRANT SELECT ON public.users_view TO service_role;

-- ----------------------------------------------------------------------------
-- 3: Enable RLS on Stage 2 remarks table(s)
-- Security Advisor may show "ticket_stage_remarks" or "ticket_stage2_remarks".
-- Run both if you have both tables.
-- ----------------------------------------------------------------------------

-- If your table is named ticket_stage2_remarks:
ALTER TABLE public.ticket_stage2_remarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ticket_stage2_remarks_select_authenticated" ON public.ticket_stage2_remarks;
DROP POLICY IF EXISTS "ticket_stage2_remarks_insert_own" ON public.ticket_stage2_remarks;
DROP POLICY IF EXISTS "ticket_stage2_remarks_update_author" ON public.ticket_stage2_remarks;

CREATE POLICY "ticket_stage2_remarks_select_authenticated"
  ON public.ticket_stage2_remarks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ticket_stage2_remarks_insert_own"
  ON public.ticket_stage2_remarks FOR INSERT
  TO authenticated
  WITH CHECK (added_by = auth.uid());

CREATE POLICY "ticket_stage2_remarks_update_author"
  ON public.ticket_stage2_remarks FOR UPDATE
  TO authenticated
  USING (added_by = auth.uid())
  WITH CHECK (added_by = auth.uid());

-- If your table is named ticket_stage_remarks (different name in production):
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ticket_stage_remarks') THEN
    EXECUTE 'ALTER TABLE public.ticket_stage_remarks ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "ticket_stage_remarks_select_authenticated" ON public.ticket_stage_remarks FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "ticket_stage_remarks_insert_own" ON public.ticket_stage_remarks FOR INSERT TO authenticated WITH CHECK (added_by = auth.uid())';
    EXECUTE 'CREATE POLICY "ticket_stage_remarks_update_author" ON public.ticket_stage_remarks FOR UPDATE TO authenticated USING (added_by = auth.uid()) WITH CHECK (added_by = auth.uid())';
  END IF;
END $$;

-- ============================================================================
-- Done. Re-run Security Advisor to confirm errors are resolved.
-- ============================================================================
