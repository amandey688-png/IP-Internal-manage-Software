-- ============================================================================
-- SUPABASE UPDATE – Run this file in Supabase SQL Editor
-- ============================================================================
-- Use this to create/update all tables and RLS needed for:
--   • Onboarding (Payment Status + all steps through Final Setup)
--   • Feature list RLS (fixes Security Advisor "RLS Disabled" on feature_list)
--   • Client Training (no extra tables; uses onboarding_final_setup)
--
-- Prerequisites:
--   • If you use Success/Performance module: run SUCCESS_PERFORMANCE_MONITORING.sql
--     first so that public.feature_list exists (then the feature_list RLS block below applies).
--   • If you don't use Success module: skip the "Feature list RLS" section at the end.
--
-- Safe to run multiple times (uses IF NOT EXISTS and DROP POLICY IF EXISTS).
-- ============================================================================

-- ============================================================================
-- 1. ONBOARDING – Payment Status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.onboarding_payment_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_no TEXT NOT NULL,
  company_name TEXT NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Done', 'Not Done')),
  payment_received_date DATE,
  poc_name TEXT,
  poc_contact TEXT,
  accounts_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_payment_status_timestamp ON public.onboarding_payment_status(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_payment_status_reference ON public.onboarding_payment_status(reference_no);
ALTER TABLE public.onboarding_payment_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_payment_status_select_authenticated" ON public.onboarding_payment_status;
CREATE POLICY "onboarding_payment_status_select_authenticated" ON public.onboarding_payment_status FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_payment_status_insert_authenticated" ON public.onboarding_payment_status;
CREATE POLICY "onboarding_payment_status_insert_authenticated" ON public.onboarding_payment_status FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_payment_status_update_authenticated" ON public.onboarding_payment_status;
CREATE POLICY "onboarding_payment_status_update_authenticated" ON public.onboarding_payment_status FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- 2. ONBOARDING – Pre-Onboarding & Pre-Onboarding Checklist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.onboarding_pre_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);
CREATE INDEX IF NOT EXISTS idx_onboarding_pre_onboarding_payment_status_id ON public.onboarding_pre_onboarding(payment_status_id);
ALTER TABLE public.onboarding_pre_onboarding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_pre_onboarding_select_authenticated" ON public.onboarding_pre_onboarding;
CREATE POLICY "onboarding_pre_onboarding_select_authenticated" ON public.onboarding_pre_onboarding FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_pre_onboarding_insert_authenticated" ON public.onboarding_pre_onboarding;
CREATE POLICY "onboarding_pre_onboarding_insert_authenticated" ON public.onboarding_pre_onboarding FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_pre_onboarding_update_authenticated" ON public.onboarding_pre_onboarding;
CREATE POLICY "onboarding_pre_onboarding_update_authenticated" ON public.onboarding_pre_onboarding FOR UPDATE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.onboarding_pre_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);
CREATE INDEX IF NOT EXISTS idx_onboarding_pre_onboarding_checklist_payment_status_id ON public.onboarding_pre_onboarding_checklist(payment_status_id);
ALTER TABLE public.onboarding_pre_onboarding_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_pre_onboarding_checklist_select_authenticated" ON public.onboarding_pre_onboarding_checklist;
CREATE POLICY "onboarding_pre_onboarding_checklist_select_authenticated" ON public.onboarding_pre_onboarding_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_pre_onboarding_checklist_insert_authenticated" ON public.onboarding_pre_onboarding_checklist;
CREATE POLICY "onboarding_pre_onboarding_checklist_insert_authenticated" ON public.onboarding_pre_onboarding_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_pre_onboarding_checklist_update_authenticated" ON public.onboarding_pre_onboarding_checklist;
CREATE POLICY "onboarding_pre_onboarding_checklist_update_authenticated" ON public.onboarding_pre_onboarding_checklist FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- 3. ONBOARDING – POC Checklist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.onboarding_poc_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);
CREATE INDEX IF NOT EXISTS idx_onboarding_poc_checklist_payment_status_id ON public.onboarding_poc_checklist(payment_status_id);
ALTER TABLE public.onboarding_poc_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_poc_checklist_select_authenticated" ON public.onboarding_poc_checklist;
CREATE POLICY "onboarding_poc_checklist_select_authenticated" ON public.onboarding_poc_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_poc_checklist_insert_authenticated" ON public.onboarding_poc_checklist;
CREATE POLICY "onboarding_poc_checklist_insert_authenticated" ON public.onboarding_poc_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_poc_checklist_update_authenticated" ON public.onboarding_poc_checklist;
CREATE POLICY "onboarding_poc_checklist_update_authenticated" ON public.onboarding_poc_checklist FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- 4. ONBOARDING – POC Details
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

-- ============================================================================
-- 5. ONBOARDING – Details Collected Checklist
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

-- ============================================================================
-- 6. ONBOARDING – Item Cleaning
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

-- ============================================================================
-- 7. ONBOARDING – Item Cleaning Checklist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.onboarding_item_cleaning_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);
CREATE INDEX IF NOT EXISTS idx_onboarding_item_cleaning_checklist_payment_status_id ON public.onboarding_item_cleaning_checklist(payment_status_id);
ALTER TABLE public.onboarding_item_cleaning_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_item_cleaning_checklist_select_authenticated" ON public.onboarding_item_cleaning_checklist;
CREATE POLICY "onboarding_item_cleaning_checklist_select_authenticated" ON public.onboarding_item_cleaning_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_item_cleaning_checklist_insert_authenticated" ON public.onboarding_item_cleaning_checklist;
CREATE POLICY "onboarding_item_cleaning_checklist_insert_authenticated" ON public.onboarding_item_cleaning_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_item_cleaning_checklist_update_authenticated" ON public.onboarding_item_cleaning_checklist;
CREATE POLICY "onboarding_item_cleaning_checklist_update_authenticated" ON public.onboarding_item_cleaning_checklist FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- 8. ONBOARDING – Org & Master ID
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

-- ============================================================================
-- 9. ONBOARDING – Org & Master Checklist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.onboarding_org_master_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);
CREATE INDEX IF NOT EXISTS idx_onboarding_org_master_checklist_payment_status_id ON public.onboarding_org_master_checklist(payment_status_id);
ALTER TABLE public.onboarding_org_master_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_org_master_checklist_select_authenticated" ON public.onboarding_org_master_checklist;
CREATE POLICY "onboarding_org_master_checklist_select_authenticated" ON public.onboarding_org_master_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_org_master_checklist_insert_authenticated" ON public.onboarding_org_master_checklist;
CREATE POLICY "onboarding_org_master_checklist_insert_authenticated" ON public.onboarding_org_master_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_org_master_checklist_update_authenticated" ON public.onboarding_org_master_checklist;
CREATE POLICY "onboarding_org_master_checklist_update_authenticated" ON public.onboarding_org_master_checklist FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- 10. ONBOARDING – Setup Checklist
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

-- ============================================================================
-- 11. ONBOARDING – Item & Stock Checklist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.onboarding_item_stock_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_status_id UUID NOT NULL REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_status_id)
);
CREATE INDEX IF NOT EXISTS idx_onboarding_item_stock_checklist_payment_status_id ON public.onboarding_item_stock_checklist(payment_status_id);
ALTER TABLE public.onboarding_item_stock_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_item_stock_checklist_select_authenticated" ON public.onboarding_item_stock_checklist;
CREATE POLICY "onboarding_item_stock_checklist_select_authenticated" ON public.onboarding_item_stock_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "onboarding_item_stock_checklist_insert_authenticated" ON public.onboarding_item_stock_checklist;
CREATE POLICY "onboarding_item_stock_checklist_insert_authenticated" ON public.onboarding_item_stock_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "onboarding_item_stock_checklist_update_authenticated" ON public.onboarding_item_stock_checklist;
CREATE POLICY "onboarding_item_stock_checklist_update_authenticated" ON public.onboarding_item_stock_checklist FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- 12. ONBOARDING – Final Setup
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

-- ============================================================================
-- 13. FEATURE LIST RLS (fixes Security Advisor “RLS Disabled in Public”)
-- ============================================================================
-- Only run if public.feature_list already exists (e.g. from SUCCESS_PERFORMANCE_MONITORING.sql).
-- If the table does not exist, this block will fail; you can comment it out or run
-- SUCCESS_PERFORMANCE_MONITORING.sql first.
-- ============================================================================
ALTER TABLE public.feature_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_list_select_authenticated" ON public.feature_list;
CREATE POLICY "feature_list_select_authenticated" ON public.feature_list
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 14. TRAINING – Client Assignments (POC & Trainer)
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
-- Backward compatible adjustments if table already existed without poc_name / expected_day0 / nullable poc_user_id
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
-- 15. TRAINING – Day 0 Checklist
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
-- 16. TRAINING – Checklist Stages (DAY 1(-2h), DAY 1, DAY 1+1, DAY 2, DAY 3, Feedback)
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
-- DONE. Run “Rerun linter” in Security Advisor if you use it.
-- ============================================================================
