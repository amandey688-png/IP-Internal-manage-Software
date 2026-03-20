-- =============================================================================
-- Client Payment Intercept: add 24h edit window + Tag fields
-- Run in Supabase SQL Editor (PRODUCTION).
-- =============================================================================

alter table public.onboarding_client_payment_intercept
  add column if not exists editable_until timestamptz;

alter table public.onboarding_client_payment_intercept
  add column if not exists tagged_user_id uuid;

alter table public.onboarding_client_payment_intercept
  add column if not exists tagged_user_name text;

alter table public.onboarding_client_payment_intercept
  add column if not exists tagged_user_email text;

create index if not exists idx_onb_client_payment_intercept_tagged_user
  on public.onboarding_client_payment_intercept (tagged_user_id);

comment on column public.onboarding_client_payment_intercept.editable_until is 'Creator can edit until this time (24h). Admin/Master Admin bypass.';
comment on column public.onboarding_client_payment_intercept.tagged_user_id is 'User assigned/tagged to take payment action (dashboard).';
