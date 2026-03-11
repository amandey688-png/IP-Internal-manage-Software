-- ============================================================================
-- Onboarding > Org & Master ID (per Payment Status, after Item Cleaning Checklist)
-- Run in Supabase SQL Editor after onboarding_item_cleaning_checklist exists.
-- Fields: Data Sent to Ayush?, Timestamps (auto), Organization Created?, Master ID Created?,
-- Item Uploaded?, Stock Uploaded?, Status (Done/Not Done), Remarks (text).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_org_master_id (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_org_master_id_payment_status_id ON public.onboarding_org_master_id(payment_status_id);

ALTER TABLE public.onboarding_org_master_id ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_org_master_id_select_authenticated" ON public.onboarding_org_master_id;
CREATE POLICY "onboarding_org_master_id_select_authenticated" ON public.onboarding_org_master_id FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_org_master_id_insert_authenticated" ON public.onboarding_org_master_id;
CREATE POLICY "onboarding_org_master_id_insert_authenticated" ON public.onboarding_org_master_id FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_org_master_id_update_authenticated" ON public.onboarding_org_master_id;
CREATE POLICY "onboarding_org_master_id_update_authenticated" ON public.onboarding_org_master_id FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE public.onboarding_org_master_id IS 'Org & Master ID (Data Sent to Ayush, Organization/Master ID/Item/Stock timestamps, Status, Remarks) per Payment Status. Shown after Item Cleaning Checklist.';
