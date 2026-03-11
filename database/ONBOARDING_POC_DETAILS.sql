-- ============================================================================
-- Onboarding > POC Details (per Payment Status, after POC Checklist)
-- Run in Supabase SQL Editor after payment status and POC checklist exist.
-- Stores: Details Sent?, Details Sent Timestamp, Follow-up 1–3 Status/Timestamp,
-- Details Collected?, Details Collected Timestamp, Remarks (JSONB data).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_poc_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_poc_details_payment_status_id ON public.onboarding_poc_details(payment_status_id);

ALTER TABLE public.onboarding_poc_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_poc_details_select_authenticated" ON public.onboarding_poc_details;
CREATE POLICY "onboarding_poc_details_select_authenticated" ON public.onboarding_poc_details FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_poc_details_insert_authenticated" ON public.onboarding_poc_details;
CREATE POLICY "onboarding_poc_details_insert_authenticated" ON public.onboarding_poc_details FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_poc_details_update_authenticated" ON public.onboarding_poc_details;
CREATE POLICY "onboarding_poc_details_update_authenticated" ON public.onboarding_poc_details FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE public.onboarding_poc_details IS 'POC Details (Details Sent, Follow-ups 1–3, Details Collected, Remarks) per Payment Status. Shown after POC Checklist is submitted.';
