-- ============================================================================
-- Training > Day 0 Checklist (per onboarding_payment_status / Client Training)
-- Run in Supabase SQL Editor after ONBOARDING_PAYMENT_STATUS.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_day0_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);

CREATE INDEX IF NOT EXISTS idx_training_day0_checklist_payment_status_id
  ON public.training_day0_checklist(payment_status_id);

ALTER TABLE public.training_day0_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_day0_checklist_select_authenticated" ON public.training_day0_checklist;
CREATE POLICY "training_day0_checklist_select_authenticated"
  ON public.training_day0_checklist FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "training_day0_checklist_upsert_authenticated" ON public.training_day0_checklist;
CREATE POLICY "training_day0_checklist_upsert_authenticated"
  ON public.training_day0_checklist FOR INSERT, UPDATE TO authenticated USING (true) WITH CHECK (true);

