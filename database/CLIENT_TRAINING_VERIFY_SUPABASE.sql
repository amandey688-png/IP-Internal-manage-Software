-- ============================================================================
-- Client Training: Verify why no data appears
-- Run this in Supabase Dashboard → SQL Editor to check data and RLS.
-- ============================================================================

-- 1) Rows in onboarding_final_setup (each row = one company with "Final Setup" submitted = Fi-DO Done)
SELECT id, payment_status_id, submitted_at, created_at
FROM public.onboarding_final_setup
ORDER BY submitted_at DESC NULLS LAST;

-- 2) Payment Status rows that should appear in Client Training (must match IDs from step 1)
SELECT id, company_name, reference_no, timestamp, poc_name
FROM public.onboarding_payment_status
WHERE id IN (SELECT payment_status_id FROM public.onboarding_final_setup)
ORDER BY timestamp DESC;

-- 3) If step 1 returns 0 rows: Final Setup was never submitted for any company.
--    Fix: In the app, go to Onboarding → Payment Status → open a record → complete "Final Setup" and submit.
--    That will insert a row into onboarding_final_setup and the company will appear in Client Training.

-- 4) If step 1 returns rows but step 2 returns 0 rows: IDs might not match (e.g. typo or different DB).
--    Check that onboarding_payment_status.id exists for each payment_status_id from step 1.

-- 5) RLS: Backend uses service_role key which bypasses RLS. If you ever use anon/authenticated from frontend:
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('onboarding_final_setup', 'onboarding_payment_status');

-- ============================================================================
-- NEXT STEPS (after Supabase checks above show data)
-- ============================================================================
-- 1. Restart the backend (uvicorn) so the latest code runs (string ID fix).
-- 2. In the app: open Client Training and do a hard refresh (Ctrl+F5) or clear cache.
-- 3. You should see the 2 companies (e.g. sgrthyj, Dummy) in the Client Training table.
-- 4. If still empty: in browser DevTools → Network, find the request to /training/clients
--    and check the response body. If it is {"items":[]}, check backend console or
--    backend_errors.log for "training clients list" errors.

-- ============================================================================
-- FIX: "column training_client_assignments.expected_day0 does not exist"
-- (Run this in Supabase SQL Editor if Client Training list was empty due to this.)
-- ============================================================================
ALTER TABLE public.training_client_assignments
  ADD COLUMN IF NOT EXISTS expected_day0 DATE;
