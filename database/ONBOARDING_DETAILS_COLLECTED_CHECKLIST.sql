-- ============================================================================
-- Onboarding > Details Collected Checklist (per Payment Status, after POC Details)
-- Run in Supabase SQL Editor after onboarding_poc_details exists.
-- Stores 9 collect fields (Done/Not Done) in JSONB. Editable 48h after first submit.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_details_collected_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_details_collected_checklist_payment_status_id ON public.onboarding_details_collected_checklist(payment_status_id);

ALTER TABLE public.onboarding_details_collected_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_details_collected_checklist_select_authenticated" ON public.onboarding_details_collected_checklist;
CREATE POLICY "onboarding_details_collected_checklist_select_authenticated" ON public.onboarding_details_collected_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_details_collected_checklist_insert_authenticated" ON public.onboarding_details_collected_checklist;
CREATE POLICY "onboarding_details_collected_checklist_insert_authenticated" ON public.onboarding_details_collected_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_details_collected_checklist_update_authenticated" ON public.onboarding_details_collected_checklist;
CREATE POLICY "onboarding_details_collected_checklist_update_authenticated" ON public.onboarding_details_collected_checklist FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE public.onboarding_details_collected_checklist IS 'Details Collected Checklist (9 collect fields, Done/Not Done) per Payment Status. Shown after POC Details. Editable 48h after submit.';
