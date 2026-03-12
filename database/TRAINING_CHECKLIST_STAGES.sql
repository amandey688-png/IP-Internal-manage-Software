-- ============================================================================
-- TRAINING – Checklist Stages (DAY 1(-2h), DAY 1, DAY 1 (+1day), DAY 2, DAY 3, Feedback)
-- ============================================================================
-- Run after training_day0_checklist exists. Stage keys: day1_minus2, day1, day1_plus1, day2, day3, feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_checklist_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id, stage_key)
);

CREATE INDEX IF NOT EXISTS idx_training_checklist_stages_payment_status_id
  ON public.training_checklist_stages(payment_status_id);
CREATE INDEX IF NOT EXISTS idx_training_checklist_stages_stage_key
  ON public.training_checklist_stages(stage_key);

ALTER TABLE public.training_checklist_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_checklist_stages_select_authenticated" ON public.training_checklist_stages;
CREATE POLICY "training_checklist_stages_select_authenticated"
  ON public.training_checklist_stages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "training_checklist_stages_insert_authenticated" ON public.training_checklist_stages;
CREATE POLICY "training_checklist_stages_insert_authenticated"
  ON public.training_checklist_stages FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "training_checklist_stages_update_authenticated" ON public.training_checklist_stages;
CREATE POLICY "training_checklist_stages_update_authenticated"
  ON public.training_checklist_stages FOR UPDATE TO authenticated USING (true);
