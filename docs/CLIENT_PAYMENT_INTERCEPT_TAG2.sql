-- Second tag (T 2) on Client Payment — after first Payment Action submit (payment_action_submitted_at).
-- Any authenticated user may submit T 2 via POST /onboarding/client-payment/{id}/intercept/tag-2.
-- Run once in Supabase SQL Editor.

ALTER TABLE public.onboarding_client_payment_intercept
  ADD COLUMN IF NOT EXISTS tagged_user_2_id UUID NULL,
  ADD COLUMN IF NOT EXISTS tagged_user_2_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS tagged_user_2_email TEXT NULL;

COMMENT ON COLUMN public.onboarding_client_payment_intercept.tagged_user_2_id IS 'Second tagged user (T 2) for Client Payment.';

-- Master Admin Payment Action (dashboard) — second round after T1 payment action is submitted
ALTER TABLE public.onboarding_client_payment_intercept
  ADD COLUMN IF NOT EXISTS payment_action_2_person TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_action_2_remarks TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_action_2_submitted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS payment_action_2_submitted_by UUID NULL;

COMMENT ON COLUMN public.onboarding_client_payment_intercept.payment_action_2_submitted_at IS 'When set, T2 row clears from dashboard Payment Action.';
