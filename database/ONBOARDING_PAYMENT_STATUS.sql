-- ============================================================================
-- Onboarding > Payment Status
-- Run in Supabase SQL Editor.
-- Fields: Timestamp (auto), Reference No (auto: first 4 letters company + -0001/0002),
-- Company Name, Payment Status (Done/Not Done), Payment Received Date, POC Name,
-- POC Contact (10 digits), Accounts Remarks
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

COMMENT ON TABLE public.onboarding_payment_status IS 'Onboarding Payment Status records. reference_no = first 4 alpha chars of company_name + -0001/0002...';
