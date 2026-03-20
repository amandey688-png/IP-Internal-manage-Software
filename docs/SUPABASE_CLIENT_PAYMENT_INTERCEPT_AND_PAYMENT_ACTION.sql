-- =============================================================================
-- Client Payment: Intercept TAG + Payment Action (Master Admin dashboard Submit)
-- Run once in Supabase SQL Editor (safe to re-run: IF NOT EXISTS / add column if not exists).
--
-- Tag: user tagged on intercept → Payment Action dashboard + "Client Payment" block in drawer.
-- Payment Action Submit: Person + Remarks from dashboard; stored on same intercept row.
-- =============================================================================

-- ---- Tag (Intercept Requirements) ----
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

-- ---- Payment Action (dashboard Submit: Person + Remarks) ----
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
