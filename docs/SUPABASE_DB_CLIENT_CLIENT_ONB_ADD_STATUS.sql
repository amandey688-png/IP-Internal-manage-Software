-- =============================================================================
-- Client ONB: add Active / Inactive status (run once if table already exists)
-- Execute in Supabase SQL Editor after the original Client ONB table was created.
-- =============================================================================

alter table public.db_client_client_onb
  add column if not exists status text;

update public.db_client_client_onb
set status = 'active'
where status is null or trim(status) = '';

alter table public.db_client_client_onb
  alter column status set default 'active';

alter table public.db_client_client_onb
  alter column status set not null;

alter table public.db_client_client_onb
  drop constraint if exists db_client_client_onb_status_check;

alter table public.db_client_client_onb
  add constraint db_client_client_onb_status_check
  check (status in ('active', 'inactive'));

comment on column public.db_client_client_onb.status is 'active = shown in Active clients; inactive = shown in Inactive clients';
