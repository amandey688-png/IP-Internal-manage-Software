-- =============================================================================
-- Client Payment (Raised Invoices) – core tables
-- Run in Supabase SQL Editor BEFORE docs/supabase_client_payment_followup_flow.sql
-- Backend expects these table/column names exactly.
-- =============================================================================

-- Main raised-invoice rows
create table if not exists public.onboarding_client_payment (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz,
  reference_no text,
  company_name text not null,
  invoice_date date,
  invoice_amount text,
  invoice_number text,
  genre text,
  stage text,
  payment_received_date date
);

-- Optional: restrict genre to M / Q / HY / Y (matches app)
-- alter table public.onboarding_client_payment
--   add constraint onboarding_client_payment_genre_check
--   check (genre is null or genre in ('M', 'Q', 'HY', 'Y'));

create index if not exists idx_onboarding_client_payment_timestamp
  on public.onboarding_client_payment (timestamp desc nulls last);

-- Invoice Sent details (one row per raised invoice)
create table if not exists public.onboarding_client_payment_sent (
  id uuid primary key default gen_random_uuid(),
  client_payment_id uuid not null references public.onboarding_client_payment (id) on delete cascade,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  editable_until timestamptz,
  email_sent boolean not null default false,
  email text,
  courier_sent boolean not null default false,
  tracking_details text,
  whatsapp_sent boolean not null default false,
  whatsapp_number text,
  invoice_number text,
  constraint uq_onboarding_client_payment_sent_payment unique (client_payment_id)
);

-- Legacy Follow up 1 (still used by API alongside followups 1–10 table)
create table if not exists public.onboarding_client_payment_followup1 (
  id uuid primary key default gen_random_uuid(),
  client_payment_id uuid not null references public.onboarding_client_payment (id) on delete cascade,
  contact_person text,
  remarks text,
  mail_sent boolean not null default false,
  whatsapp_sent boolean not null default false,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  editable_until timestamptz,
  constraint uq_onboarding_client_payment_followup1_payment unique (client_payment_id)
);

-- =============================================================================
-- RLS: your FastAPI backend uses SUPABASE_SERVICE_ROLE_KEY and bypasses RLS.
-- If you ever call these tables from the browser with the anon key, add policies.
-- =============================================================================
alter table public.onboarding_client_payment enable row level security;
alter table public.onboarding_client_payment_sent enable row level security;
alter table public.onboarding_client_payment_followup1 enable row level security;

-- Service role bypasses RLS; no policy needed for server-side API.

comment on table public.onboarding_client_payment is 'Raised Invoices (Client Payment / Payment Management)';
