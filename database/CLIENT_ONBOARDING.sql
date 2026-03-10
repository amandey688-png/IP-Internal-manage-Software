-- ============================================================================
-- Onboarding Client module: client_onboarding (progress + step form data)
-- Run in Supabase SQL Editor. Requires public.companies (id, name).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payment_status_completed BOOLEAN NOT NULL DEFAULT FALSE,
  pre_onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  poc_details_completed BOOLEAN NOT NULL DEFAULT FALSE,
  item_cleaning_completed BOOLEAN NOT NULL DEFAULT FALSE,
  org_master_id_completed BOOLEAN NOT NULL DEFAULT FALSE,
  final_setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  step_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id)
);

CREATE INDEX IF NOT EXISTS idx_client_onboarding_company ON public.client_onboarding(company_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_updated ON public.client_onboarding(updated_at DESC);

-- RLS
ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_onboarding_select_authenticated" ON public.client_onboarding;
CREATE POLICY "client_onboarding_select_authenticated" ON public.client_onboarding FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "client_onboarding_insert_authenticated" ON public.client_onboarding;
CREATE POLICY "client_onboarding_insert_authenticated" ON public.client_onboarding FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "client_onboarding_update_authenticated" ON public.client_onboarding;
CREATE POLICY "client_onboarding_update_authenticated" ON public.client_onboarding FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE public.client_onboarding IS 'Onboarding progress and step form data per company. Steps: payment_status, pre_onboarding, poc_details, item_cleaning, org_master_id, final_setup.';
