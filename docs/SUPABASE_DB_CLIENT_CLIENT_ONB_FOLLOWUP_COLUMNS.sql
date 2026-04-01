-- =============================================================================
-- Client ONB: follow-up fields for Inactive clients (run AFTER status column exists)
-- Supabase → SQL Editor → Run once.
-- =============================================================================

alter table public.db_client_client_onb
  add column if not exists last_contacted_on date;

alter table public.db_client_client_onb
  add column if not exists remarks_2 text;

alter table public.db_client_client_onb
  add column if not exists follow_up_needed text;

comment on column public.db_client_client_onb.last_contacted_on is 'Inactive follow-up: last contact date';
comment on column public.db_client_client_onb.remarks_2 is 'Inactive follow-up: second remarks line';
comment on column public.db_client_client_onb.follow_up_needed is 'Inactive follow-up: Yes / No / empty';
