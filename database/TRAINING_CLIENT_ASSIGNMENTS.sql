-- ============================================================================
-- Training > Client Assignments (POC & Trainer per onboarding_payment_status)
-- Run in Supabase SQL Editor after ONBOARDING_PAYMENT_STATUS.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  poc_user_id UUID,
  poc_name TEXT,
  trainer_user_id UUID NOT NULL,
  expected_day0 DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

-- Backward compatible adjustments if table already existed without poc_name / expected_day0 / nullable poc_user_id
ALTER TABLE public.training_client_assignments
  ADD COLUMN IF NOT EXISTS poc_name TEXT;
ALTER TABLE public.training_client_assignments
  ADD COLUMN IF NOT EXISTS expected_day0 DATE;
ALTER TABLE public.training_client_assignments
  ALTER COLUMN poc_user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_client_assignments_payment_status_id
  ON public.training_client_assignments(payment_status_id);

ALTER TABLE public.training_client_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_client_assignments_select_authenticated" ON public.training_client_assignments;
CREATE POLICY "training_client_assignments_select_authenticated"
  ON public.training_client_assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "training_client_assignments_insert_authenticated" ON public.training_client_assignments;
CREATE POLICY "training_client_assignments_insert_authenticated"
  ON public.training_client_assignments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "training_client_assignments_update_authenticated" ON public.training_client_assignments;
CREATE POLICY "training_client_assignments_update_authenticated"
  ON public.training_client_assignments FOR UPDATE TO authenticated USING (true);

