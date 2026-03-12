-- ============================================================================
-- ONBOARDING – Full schema (run in Supabase SQL Editor)
-- ============================================================================
-- Run this entire file once. Safe to re-run (IF NOT EXISTS, DROP POLICY IF EXISTS).
-- Order: Payment Status → Pre-Onboarding → POC Checklist → POC Details →
--        Details Collected → Item Cleaning → Item Cleaning Checklist →
--        Org & Master ID → Org & Master Checklist → Setup → Item & Stock → Final Setup.
-- ============================================================================

-- ============================================================================
-- 1. Payment Status (base table – required first)
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
COMMENT ON TABLE public.onboarding_payment_status IS 'Onboarding Payment Status. reference_no = first 4 alpha chars of company_name + -0001/0002...';

-- ============================================================================
-- 2. Pre-Onboarding & Pre-Onboarding Checklist
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
-- 3. POC Checklist
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
-- 4. POC Details (after POC Checklist)
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
COMMENT ON TABLE public.onboarding_poc_details IS 'POC Details (Details Sent, Follow-ups 1–3, Details Collected, Remarks) per Payment Status.';

-- ============================================================================
-- 5. Details Collected Checklist (after POC Details)
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
COMMENT ON TABLE public.onboarding_details_collected_checklist IS 'Details Collected Checklist (9 fields, Done/Not Done) per Payment Status. Editable 48h after submit.';

-- ============================================================================
-- 6. Item Cleaning (after Details Collected Checklist)
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
COMMENT ON TABLE public.onboarding_item_cleaning IS 'Item Cleaning form per Payment Status. Shown after Details Collected Checklist.';

-- ============================================================================
-- 7. Item Cleaning Checklist (after Item Cleaning)
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
COMMENT ON TABLE public.onboarding_item_cleaning_checklist IS 'Item Cleaning Checklist (18 fields, Done/Not Done) per Payment Status. Editable 48h after submit.';

-- ============================================================================
-- 8. Org & Master ID (after Item Cleaning Checklist)
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
COMMENT ON TABLE public.onboarding_org_master_id IS 'Org & Master ID (Data Sent to Ayush, timestamps, Status, Remarks) per Payment Status. Shown after Item Cleaning Checklist.';

-- ============================================================================
-- 9. Org & Master Checklist (after Org & Master ID)
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
COMMENT ON TABLE public.onboarding_org_master_checklist IS 'Org & Master Checklist (10 fields, Done/Not Done). Shown after Org & Master ID. Editable 48h.';

-- ============================================================================
-- 10. Setup Checklist (after Org & Master Checklist)
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

-- ============================================================================
-- 11. Item & Stock Checklist (after Setup Checklist)
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
COMMENT ON TABLE public.onboarding_item_stock_checklist IS 'Item & Stock Checklist (29 fields, Done/Not Done). Shown after Setup Checklist. Editable 48h.';

-- ============================================================================
-- 12. Final Setup (after Item & Stock Checklist)
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
COMMENT ON TABLE public.onboarding_final_setup IS 'Final Setup (7 Done/Not Done + Remarks). Shown after Item & Stock Checklist. Editable 48h.';

-- ============================================================================
-- DONE. Onboarding schema complete.
-- ============================================================================
