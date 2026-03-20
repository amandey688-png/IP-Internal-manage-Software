-- =============================================================================
-- Client Payment: Master Admin "Payment Action" submit (Person + Remarks)
-- Run in Supabase SQL Editor after intercept/tag columns exist.
-- When payment_action_submitted_at is set, row leaves Payment Action dashboard.
-- In the app drawer, "Client Payment" shows when a user is **tagged** (not only after Submit);
-- Person/Remarks fill in after Master Admin Submit from the dashboard.
-- =============================================================================

alter table public.onboarding_client_payment_intercept
  add column if not exists payment_action_person text;

alter table public.onboarding_client_payment_intercept
  add column if not exists payment_action_remarks text;

alter table public.onboarding_client_payment_intercept
  add column if not exists payment_action_submitted_at timestamptz;

alter table public.onboarding_client_payment_intercept
  add column if not exists payment_action_submitted_by uuid;

comment on column public.onboarding_client_payment_intercept.payment_action_person is 'Master Admin Payment Action (dashboard Submit).';
comment on column public.onboarding_client_payment_intercept.payment_action_remarks is 'Master Admin Payment Action remarks.';
comment on column public.onboarding_client_payment_intercept.payment_action_submitted_at is 'When set, invoice no longer listed on dashboard Payment Action.';
