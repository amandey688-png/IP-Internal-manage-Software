-- ============================================================================
-- TRAINING – Client Training (Day 0 → Training Feedback Form)
-- ============================================================================
-- Run this in Supabase SQL Editor. Safe to run multiple times.
-- Prerequisite: public.onboarding_payment_status must exist (from Onboarding).
--
-- Tables:
--   1. training_client_assignments (POC, Trainer, Expected Day 0)
--   2. training_day0_checklist (Day 0 Checklist – Yes/No/NA, 48h edit)
--   3. training_checklist_stages (DAY 1(-2h), DAY 1, DAY 1+1, DAY 2, DAY 3, Training Feedback Form)
--
-- Client Training list: companies with Final Setup submitted in Onboarding.
-- Timestamp and Reference No are auto-generated in the app.
-- ============================================================================

-- ============================================================================
-- 1. TRAINING – Client Assignments (POC & Trainer)
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


-- ============================================================================
-- 2. TRAINING – Day 0 Checklist
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
DROP POLICY IF EXISTS "training_day0_checklist_insert_authenticated" ON public.training_day0_checklist;
DROP POLICY IF EXISTS "training_day0_checklist_update_authenticated" ON public.training_day0_checklist;

CREATE POLICY "training_day0_checklist_insert_authenticated"
  ON public.training_day0_checklist FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "training_day0_checklist_update_authenticated"
  ON public.training_day0_checklist FOR UPDATE TO authenticated USING (true);


-- ============================================================================
-- 3. TRAINING – Checklist Stages (DAY 1(-2h), DAY 1, DAY 1+1, DAY 2, DAY 3, Training Feedback Form)
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


-- ============================================================================
-- DONE. Day 0 through Training Feedback Form tables and RLS are ready.
-- ============================================================================
