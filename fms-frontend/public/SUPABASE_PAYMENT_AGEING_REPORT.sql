-- =============================================================================
-- Payment Ageing Report (Client Payment)
-- Run in Supabase SQL Editor after public.companies exists.
-- Backend: GET/PUT /onboarding/client-payment/payment-ageing-report
--
-- Or use one combined script: docs/SUPABASE_PAYMENT_AGEING_FULL_SETUP.sql
-- =============================================================================

create table if not exists public.onboarding_client_payment_ageing (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,
  company_name text not null,
  quarter_days jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_ocp_ageing_company_name unique (company_name)
);

create index if not exists idx_ocp_ageing_company_id
  on public.onboarding_client_payment_ageing (company_id);

comment on table public.onboarding_client_payment_ageing is
  'Per-company payment days for 10 fiscal quarters (Client Payment ageing report).';

-- Single-row store for optional uploaded summary grid (button upload)
create table if not exists public.onboarding_client_payment_ageing_summary (
  id smallint primary key default 1 check (id = 1),
  summary_rows jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.onboarding_client_payment_ageing enable row level security;
alter table public.onboarding_client_payment_ageing_summary enable row level security;
