-- ============================================================================
-- TRAINING – Manual client entry (add client to training list without Final Setup Done)
-- ============================================================================
-- Run in Supabase SQL Editor after onboarding_payment_status exists. Safe to run multiple times.
-- Allows clients to appear in Client Training list when added manually, not only via onboarding Final Setup.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_manual_clients (
  payment_status_id UUID PRIMARY KEY REFERENCES public.onboarding_payment_status(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_manual_clients_created_at
  ON public.training_manual_clients(created_at DESC);

ALTER TABLE public.training_manual_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_manual_clients_select_authenticated" ON public.training_manual_clients;
CREATE POLICY "training_manual_clients_select_authenticated"
  ON public.training_manual_clients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "training_manual_clients_insert_authenticated" ON public.training_manual_clients;
CREATE POLICY "training_manual_clients_insert_authenticated"
  ON public.training_manual_clients FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "training_manual_clients_delete_authenticated" ON public.training_manual_clients;
CREATE POLICY "training_manual_clients_delete_authenticated"
  ON public.training_manual_clients FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- DONE. Use POST /training/clients/manual with payment_status_id to add manually.
-- ============================================================================
