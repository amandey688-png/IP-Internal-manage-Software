-- ============================================================================
-- Onboarding > Final Setup (per Payment Status, after Item & Stock Checklist)
-- 7 Done/Not Done + Remarks. Editable 48h after first submit.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_final_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_final_setup_payment_status_id ON public.onboarding_final_setup(payment_status_id);
ALTER TABLE public.onboarding_final_setup ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_final_setup_select_authenticated" ON public.onboarding_final_setup;
CREATE POLICY "onboarding_final_setup_select_authenticated" ON public.onboarding_final_setup FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_final_setup_insert_authenticated" ON public.onboarding_final_setup;
CREATE POLICY "onboarding_final_setup_insert_authenticated" ON public.onboarding_final_setup FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_final_setup_update_authenticated" ON public.onboarding_final_setup;
CREATE POLICY "onboarding_final_setup_update_authenticated" ON public.onboarding_final_setup FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE public.onboarding_final_setup IS 'Final Setup (Item/Stock Uploaded, Master Setup, Review, Onboarding, Handed to Training, Final Status, Remarks). Shown after Item & Stock Checklist. Editable 48h.';
