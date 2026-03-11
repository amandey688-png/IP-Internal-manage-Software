-- ============================================================================
-- Onboarding > Item Cleaning (per Payment Status, after Details Collected Checklist)
-- Run in Supabase SQL Editor after onboarding_details_collected_checklist exists.
-- Stores: Timestamp (auto), Company Name, and 17 item-cleaning fields in JSONB.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_item_cleaning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_item_cleaning_payment_status_id ON public.onboarding_item_cleaning(payment_status_id);

ALTER TABLE public.onboarding_item_cleaning ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_item_cleaning_select_authenticated" ON public.onboarding_item_cleaning;
CREATE POLICY "onboarding_item_cleaning_select_authenticated" ON public.onboarding_item_cleaning FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_item_cleaning_insert_authenticated" ON public.onboarding_item_cleaning;
CREATE POLICY "onboarding_item_cleaning_insert_authenticated" ON public.onboarding_item_cleaning FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_item_cleaning_update_authenticated" ON public.onboarding_item_cleaning;
CREATE POLICY "onboarding_item_cleaning_update_authenticated" ON public.onboarding_item_cleaning FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE public.onboarding_item_cleaning IS 'Item Cleaning form (Timestamp, Company Name, Raw Item, Sheets, Grok, Review, etc.) per Payment Status. Shown after Details Collected Checklist.';
