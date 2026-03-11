-- ============================================================================
-- Onboarding > Setup Checklist (per Payment Status, after Org & Master Checklist)
-- 12 fields, each Done/Not Done. Editable 48h after first submit.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_setup_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_setup_checklist_payment_status_id ON public.onboarding_setup_checklist(payment_status_id);
ALTER TABLE public.onboarding_setup_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_setup_checklist_select_authenticated" ON public.onboarding_setup_checklist;
CREATE POLICY "onboarding_setup_checklist_select_authenticated" ON public.onboarding_setup_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_setup_checklist_insert_authenticated" ON public.onboarding_setup_checklist;
CREATE POLICY "onboarding_setup_checklist_insert_authenticated" ON public.onboarding_setup_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_setup_checklist_update_authenticated" ON public.onboarding_setup_checklist;
CREATE POLICY "onboarding_setup_checklist_update_authenticated" ON public.onboarding_setup_checklist FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE public.onboarding_setup_checklist IS 'Setup Checklist (12 fields, Done/Not Done). Shown after Org & Master Checklist. Editable 48h.';
