-- =============================================================================
-- Client Payment follow-ups: user-entered timestamp (manual, per follow-up 1–10)
-- Run once in Supabase SQL Editor after onboarding_client_payment_followups exists.
-- =============================================================================

alter table public.onboarding_client_payment_followups
  add column if not exists followup_timestamp timestamptz;

comment on column public.onboarding_client_payment_followups.followup_timestamp is
  'Date/time of the follow-up as entered by the user (not server created_at).';

-- Legacy Follow up 1 table (still read by API for some paths)
alter table public.onboarding_client_payment_followup1
  add column if not exists followup_timestamp timestamptz;

comment on column public.onboarding_client_payment_followup1.followup_timestamp is
  'User-entered follow-up 1 timestamp (legacy table).';
