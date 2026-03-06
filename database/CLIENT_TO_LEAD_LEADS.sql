-- ============================================================================
-- Client to Lead module: leads + lead_stage_data
-- Run in Supabase SQL Editor. Requires user_profiles (auth.users).
-- ============================================================================

-- Stage options (reference table for dropdown)
CREATE TABLE IF NOT EXISTS public.lead_stages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0
);

INSERT INTO public.lead_stages (name, display_order) VALUES
  ('Lead', 1),
  ('Contacted', 2),
  ('Brochure', 3),
  ('Demo Schedule', 4),
  ('Demo Completed', 5),
  ('Quotation', 6),
  ('PO', 7),
  ('Implementation Invoice', 8),
  ('Account Setup', 9),
  ('Item Setup', 10),
  ('Training', 11),
  ('First Invoice', 12),
  ('First Invoice Payment', 13)
ON CONFLICT (name) DO NOTHING;

-- Main leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  stage TEXT NOT NULL,
  assigned_poc_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_no TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_reference_no ON public.leads(reference_no);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_poc ON public.leads(assigned_poc_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Stage-specific data (one row per lead per stage; data as JSONB)
CREATE TABLE IF NOT EXISTS public.lead_stage_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  stage_slug TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lead_id, stage_slug)
);

CREATE INDEX IF NOT EXISTS idx_lead_stage_data_lead ON public.lead_stage_data(lead_id);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select_authenticated" ON public.leads;
CREATE POLICY "leads_select_authenticated" ON public.leads FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "leads_insert_authenticated" ON public.leads;
CREATE POLICY "leads_insert_authenticated" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "leads_update_authenticated" ON public.leads;
CREATE POLICY "leads_update_authenticated" ON public.leads FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "lead_stage_data_select_authenticated" ON public.lead_stage_data;
CREATE POLICY "lead_stage_data_select_authenticated" ON public.lead_stage_data FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lead_stage_data_insert_authenticated" ON public.lead_stage_data;
CREATE POLICY "lead_stage_data_insert_authenticated" ON public.lead_stage_data FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "lead_stage_data_update_authenticated" ON public.lead_stage_data;
CREATE POLICY "lead_stage_data_update_authenticated" ON public.lead_stage_data FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "lead_stages_select_authenticated" ON public.lead_stages;
CREATE POLICY "lead_stages_select_authenticated" ON public.lead_stages FOR SELECT TO authenticated USING (true);
