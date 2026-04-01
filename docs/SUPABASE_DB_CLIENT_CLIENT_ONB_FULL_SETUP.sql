-- =============================================================================
-- DB Client > Client ONB — FULL SETUP (new database)
-- Run the block below in Supabase SQL Editor once.
-- =============================================================================

create table if not exists public.db_client_client_onb (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  reference_no text not null,
  organization_name text,
  company_name text,
  contact_person text,
  mobile_no text,
  email_id text,
  paid_divisions text,
  division_abbreviation text,
  name_of_divisions_cost_details text,
  amount_paid_per_division text,
  total_amount_paid_per_month text,
  payment_frequency text,
  client_since date,
  client_till date,
  client_duration text,
  total_amount_paid_till_date text,
  tds_percent text,
  client_location_city text,
  client_location_state text,
  remarks text,
  whatsapp_group_details text,
  updated_at timestamptz,
  last_contacted_on date,
  remarks_2 text,
  follow_up_needed text,
  status text not null default 'active',
  constraint db_client_client_onb_status_check check (status in ('active', 'inactive'))
);

create unique index if not exists uq_db_client_client_onb_reference_no
  on public.db_client_client_onb (reference_no);

create index if not exists idx_db_client_client_onb_timestamp
  on public.db_client_client_onb (timestamp desc nulls last);

alter table public.db_client_client_onb enable row level security;

comment on table public.db_client_client_onb is 'DB Client – Client ONB (FastAPI uses service role).';

-- =============================================================================
-- If you already created the table WITHOUT `status`, run instead:
-- docs/SUPABASE_DB_CLIENT_CLIENT_ONB_ADD_STATUS.sql
-- =============================================================================
