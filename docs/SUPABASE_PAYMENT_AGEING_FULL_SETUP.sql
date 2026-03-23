-- =============================================================================
-- Payment Ageing Report — FULL SETUP (single paste in Supabase SQL Editor)
-- Requires: public.companies exists.
-- Part A: tables | Part B: seed data (aligned to sheet Q3 FY23-24 … Q4 FY25-26)
-- Amounts in the app still come from Payment Management (raised invoices).
-- When the next fiscal quarter starts, extend this window in code + new seed.
-- =============================================================================

-- ---------- Part A: schema ----------

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

-- ---------- Part B: seed data ----------

INSERT INTO public.onboarding_client_payment_ageing (company_name, quarter_days, updated_at)
VALUES
  ('GM Iron & Steels Ltd. Badampahar', '[null,null,18,11,50,23,35,14,26,12]'::jsonb, now()),
  ('Dadiji Steel Manufacture & Trading Pvt Ltd', '[6,15,9,15,6,14,66,10,16,5]'::jsonb, now()),
  ('Shri Varu Polytex Pvt. Ltd.', '[20,null,45,null,23,null,20,null,27,null]'::jsonb, now()),
  ('Govinda Polytex India Pvt. Ltd.', '[19,null,45,null,28,null,1,null,27,null]'::jsonb, now()),
  ('Rausheena Udyog Ltd.', '[36,23,16,31,20,26,9,52,15,26]'::jsonb, now()),
  ('Black Rock Steel & Power Pvt Ltd', '[31,22,21,10,28,19,4,11,30,12]'::jsonb, now()),
  ('Bharat Hitech (Cements) Pvt Ltd', '[31,31,33,25,8,9,4,29,42,36]'::jsonb, now()),
  ('Singhal Enterprises(Jharsuguda)Pvt Ltd', '[10,10,11,16,2,31,11,9,10,2]'::jsonb, now()),
  ('Jay Iron & Steels Ltd.', '[20,8,14,15,1,16,9,4,7,7]'::jsonb, now()),
  ('Agroha Steel and Power Pvt. Ltd.', '[4,2,7,0,57,41,24,2,7,18]'::jsonb, now()),
  ('Gopal Sponge & Power Pvt. Ltd.', '[5,7,9,12,27,6,24,2,12,8]'::jsonb, now()),
  ('Suprime Cement Pvt. Ltd.', '[19,30,43,11,9,9,13,7,12,30]'::jsonb, now()),
  ('Karni Kripa Power Pvt Ltd', '[65,11,32,22,38,6,45,31,21,5]'::jsonb, now()),
  ('GM Iron & Steel Pvt. Ltd.', '[37,18,33,15,17,54,15,172,80,null]'::jsonb, now()),
  ('Crescent Foundry Co Pvt.Ltd.', '[38,23,37,35,25,56,9,50,23,2]'::jsonb, now()),
  ('Maruti Ferrous Private Limited', '[61,11,16,35,55,8,21,28,65,6]'::jsonb, now()),
  ('Vraj Iron & Steels Ltd. Bilaspur', '[39,51,43,52,16,15,8,50,56,47]'::jsonb, now()),
  ('Spintech Tubes Pvt. Ltd.', '[10,31,31,24,49,12,16,34,56,16]'::jsonb, now()),
  ('MVK Industries Pvt. Ltd.', '[4,8,11,4,75,6,24,4,8,11]'::jsonb, now()),
  ('Shakambari Overseas Trade Pvt. Ltd.', '[31,14,21,28,14,24,9,55,38,29]'::jsonb, now()),
  ('Pratishtha Polypack Pvt. Ltd.', '[16,38,35,12,7,20,9,16,9,7]'::jsonb, now()),
  ('Rashmi Sponge Iron & Power Industries Pvt. Ltd.', '[50,7,17,28,8,54,48,24,49,null]'::jsonb, now()),
  ('Indo East Corporation Pvt. Ltd.', '[11,11,12,4,16,10,21,21,26,28]'::jsonb, now()),
  ('Agrawal Sponge Pvt. Ltd.', '[36,29,57,14,14,24,9,14,8,8]'::jsonb, now()),
  ('Vraj Metaliks Pvt. Ltd.', '[12,11,21,8,98,15,80,14,8,8]'::jsonb, now()),
  ('Vraj Iron & Steels Ltd. (Siltara Div)', '[32,77,58,52,28,88,17,55,65,47]'::jsonb, now()),
  ('Maa Mangla Ispat Pvt. Ltd.', '[63,15,15,39,18,15,32,38,34,20]'::jsonb, now()),
  ('B. R Sponge & Power Ltd.', '[60,19,11,24,46,7,14,11,14,8]'::jsonb, now()),
  ('Amiya Steel Pvt. Ltd.', '[15,16,37,46,21,12,9,23,12,26]'::jsonb, now()),
  ('Sky Alloys and Power Pvt Ltd', '[39,8,59,17,29,9,59,28,14,78]'::jsonb, now()),
  ('Nutan Ispat & Power Ltd', '[60,11,16,35,15,19,14,53,48,11]'::jsonb, now()),
  ('Sri Venkatesh Iron & Alloys (India) Ltd.', '[55,42,61,19,8,41,13,8,17,5]'::jsonb, now()),
  ('Maa Shakambari Steel Ltd.', '[25,14,17,19,20,15,13,14,20,11]'::jsonb, now()),
  ('Maan Steel & Power Ltd.', '[17,28,16,10,28,15,8,23,27,16]'::jsonb, now()),
  ('Shree Parashnath Re-Roolling Mills Ltd.', '[116,65,31,50,16,12,4,42,44,46]'::jsonb, now()),
  ('Balajee Mini Steels & Re Rolling Pvt. Ltd.', '[32,11,53,10,20,28,7,36,7,11]'::jsonb, now()),
  ('Balmukund Sponge Iron Pvt. Ltd.', '[32,44,17,10,15,6,15,36,15,11]'::jsonb, now()),
  ('Ugen Ferro Alloys Pvt. Ltd.', '[26,21,35,21,23,8,43,3,7,20]'::jsonb, now()),
  ('Hariom Ingots & Power Pvt. Ltd.', '[24,29,54,35,6,23,86,13,30,16]'::jsonb, now()),
  ('Surendra Mining Industries Pvt. Ltd.', '[32,10,5,4,16,19,8,7,2,6]'::jsonb, now()),
  ('Mark Steels P Ltd.', '[33,4,15,5,7,6,4,0,9,8]'::jsonb, now()),
  ('Maan Concast Pvt. Ltd.', '[59,24,57,33,49,6,30,22,9,6]'::jsonb, now()),
  ('Hitech Plastochem Udyog Pvt. Ltd.', '[52,26,31,5,6,40,48,70,56,18]'::jsonb, now()),
  ('Dhanbad Fuels Ltd.', '[43,15,9,16,20,38,35,24,14,8]'::jsonb, now()),
  ('Hi-Tech Power & Steel Ltd.', '[48,8,11,11,16,48,7,3,3,5]'::jsonb, now()),
  ('Sky Steel & Power Pvt. Ltd', '[null,null,77,32,21,3,6,36,49,27]'::jsonb, now()),
  ('Maa Mangla Ispat Pvt. Ltd 2', '[null,null,33,56,23,7,24,38,26,20]'::jsonb, now()),
  ('Salagram Power & Steels Ltd.', '[null,null,null,49,39,29,16,22,31,35]'::jsonb, now()),
  ('Shikhara Steels Pvt. Ltd.', '[null,null,null,2,0,33,27,9,7,8]'::jsonb, now()),
  ('Super Iron Foundry', '[null,null,null,27,null,null,31,null,10,null]'::jsonb, now()),
  ('Plascom Industries LLP', '[null,null,null,null,120,30,6,44,21,40]'::jsonb, now()),
  ('Odissa Concrete & Allied Industries Limited', '[null,null,null,null,6,26,10,11,10,13]'::jsonb, now()),
  ('Anjanisuta Steels Private Limited', '[null,null,null,null,null,null,48,24,40,27]'::jsonb, now()),
  ('Niranjan Metalliks Ltd.', '[null,null,null,null,null,null,16,27,22,5]'::jsonb, now()),
  ('Mangal Sponge & Steel Pvt. Ltd.', '[null,null,null,null,null,null,16,11,51,27]'::jsonb, now()),
  ('Vaswani Industries Limited', '[null,null,null,null,null,null,14,21,55,24]'::jsonb, now()),
  ('Flexicom Industries Pvt. Ltd.', '[null,null,null,null,null,null,29,44,21,27]'::jsonb, now()),
  ('Orissa Concrete & Allied Industries Ltd. (Raipur)', '[null,null,null,null,null,null,11,37,17,51]'::jsonb, now()),
  ('Brahmaputra Metallics Ltd.', '[null,null,null,null,null,null,null,21,25,7]'::jsonb, now()),
  ('Roopgarh Power & Alloys Pvt. Ltd.', '[null,null,null,null,null,null,null,9,29,29]'::jsonb, now()),
  ('Dinesh Brothers Pvt. Ltd.', '[null,null,null,null,null,null,null,22,16,23]'::jsonb, now()),
  ('Govind Steel Co. Ltd.', '[null,null,null,null,null,null,null,23,16,23]'::jsonb, now()),
  ('Kodarma Chemical Pvt. Ltd.', '[null,null,null,null,null,null,null,16,10,9]'::jsonb, now()),
  ('Vighneshwar Ispat Pvt. Ltd.', '[null,null,null,null,null,null,null,28,29,33]'::jsonb, now()),
  ('Shilphy Steels Pvt. Ltd.', '[null,null,null,null,null,null,null,15,17,20]'::jsonb, now()),
  ('Coffers Metallics Pvt. Ltd.', '[null,null,null,null,null,null,null,18,44,27]'::jsonb, now()),
  ('Kodarma Petrochemicals Pvt. Ltd.', '[null,null,null,null,null,null,null,null,15,9]'::jsonb, now()),
  ('Bihar Foundry & Casting Limited', '[null,null,null,null,null,null,null,null,31,14]'::jsonb, now()),
  ('B R Refinery LLP', '[null,null,null,null,null,null,null,null,null,43]'::jsonb, now())
ON CONFLICT (company_name) DO UPDATE SET
  quarter_days = EXCLUDED.quarter_days,
  updated_at = EXCLUDED.updated_at;
