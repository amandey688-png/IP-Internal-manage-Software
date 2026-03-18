-- =============================================================================
-- Client Payment Follow-up Flow – ALL IN ONE QUERY
-- Run once in Supabase SQL Editor. Requires onboarding_client_payment (id uuid).
-- =============================================================================

-- 1) Follow-ups 1 to 10
create table if not exists onboarding_client_payment_followups (
  id uuid primary key default gen_random_uuid(),
  client_payment_id uuid not null,
  followup_no integer not null check (followup_no between 1 and 10),
  contact_person text,
  remarks text,
  mail_sent boolean not null default false,
  whatsapp_sent boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  editable_until timestamptz
);
create unique index if not exists uq_onb_client_payment_followups on onboarding_client_payment_followups (client_payment_id, followup_no);
create index if not exists idx_onb_client_payment_followups_payment on onboarding_client_payment_followups (client_payment_id, followup_no);

-- 2) Intercept Requirements
create table if not exists onboarding_client_payment_intercept (
  id uuid primary key default gen_random_uuid(),
  client_payment_id uuid not null,
  last_remark_user text,
  usage_last_1_month text,
  contact_person text,
  contact_number text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create unique index if not exists uq_onb_client_payment_intercept_payment on onboarding_client_payment_intercept (client_payment_id);

-- 3) Discontinuation Mail
create table if not exists onboarding_client_payment_discontinuation (
  id uuid primary key default gen_random_uuid(),
  client_payment_id uuid not null,
  mail_sent_to text,
  mail_sent_on date,
  remarks text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create unique index if not exists uq_onb_client_payment_discontinuation_payment on onboarding_client_payment_discontinuation (client_payment_id);

-- 4) Payment Receive Details (Paym-Rec – final step)
create table if not exists onboarding_client_payment_receive (
  id uuid primary key default gen_random_uuid(),
  client_payment_id uuid not null,
  party_name text not null,
  invoice_number text not null,
  amount numeric(15,2) not null,
  payment_date date not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create unique index if not exists uq_onb_client_payment_receive_payment on onboarding_client_payment_receive (client_payment_id);

-- 5) Foreign keys (skip if already exist)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_onb_client_payment_followups_client_payment') then
    alter table onboarding_client_payment_followups add constraint fk_onb_client_payment_followups_client_payment foreign key (client_payment_id) references onboarding_client_payment (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_onb_client_payment_intercept_client_payment') then
    alter table onboarding_client_payment_intercept add constraint fk_onb_client_payment_intercept_client_payment foreign key (client_payment_id) references onboarding_client_payment (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_onb_client_payment_discontinuation_client_payment') then
    alter table onboarding_client_payment_discontinuation add constraint fk_onb_client_payment_discontinuation_client_payment foreign key (client_payment_id) references onboarding_client_payment (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_onb_client_payment_receive_client_payment') then
    alter table onboarding_client_payment_receive add constraint fk_onb_client_payment_receive_client_payment foreign key (client_payment_id) references onboarding_client_payment (id) on delete cascade;
  end if;
end $$;

-- Optional: ensure onboarding_client_payment has payment_received_date
-- alter table onboarding_client_payment add column if not exists payment_received_date date;
