-- Adrija Dashboard KPI (daily rows + mandatory task name per checked box)
-- Run this in Supabase SQL Editor (safe for first-run + existing table).

create table if not exists public.onboarding_adrija_social_kpi_day (
  work_date date primary key,
  post smallint not null default 0 check (post in (0,1)),
  reel smallint not null default 0 check (reel in (0,1)),
  linkedin smallint not null default 0 check (linkedin in (0,1)),
  updated_at timestamptz not null default now()
);

alter table public.onboarding_adrija_social_kpi_day add column if not exists post_task_name text null;
alter table public.onboarding_adrija_social_kpi_day add column if not exists reel_task_name text null;
alter table public.onboarding_adrija_social_kpi_day add column if not exists linkedin_task_name text null;

alter table public.onboarding_adrija_social_kpi_day drop constraint if exists chk_post_task_required;
alter table public.onboarding_adrija_social_kpi_day drop constraint if exists chk_reel_task_required;
alter table public.onboarding_adrija_social_kpi_day drop constraint if exists chk_linkedin_task_required;
alter table public.onboarding_adrija_social_kpi_day
  add constraint chk_post_task_required check (post = 0 or nullif(trim(post_task_name), '') is not null);
alter table public.onboarding_adrija_social_kpi_day
  add constraint chk_reel_task_required check (reel = 0 or nullif(trim(reel_task_name), '') is not null);
alter table public.onboarding_adrija_social_kpi_day
  add constraint chk_linkedin_task_required check (linkedin = 0 or nullif(trim(linkedin_task_name), '') is not null);

create index if not exists idx_adrija_social_kpi_day_work_date
  on public.onboarding_adrija_social_kpi_day (work_date);

alter table public.onboarding_adrija_social_kpi_day enable row level security;
-- Legacy: weekly-only flags. Current Adrija KPI uses per-day rows — see SUPABASE_ADRIJA_SOCIAL_KPI_DAY.sql.
-- Adrija Dashboard — weekly social KPI (1 Post / 1 Reel / 1 LinkedIn per week)
-- Run in Supabase SQL Editor once. FastAPI uses the service role and bypasses RLS.

create table if not exists public.onboarding_adrija_social_kpi_week (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  post_week smallint not null default 0 check (post_week in (0, 1)),
  reel_week smallint not null default 0 check (reel_week in (0, 1)),
  linkedin_week smallint not null default 0 check (linkedin_week in (0, 1)),
  updated_at timestamptz not null default now(),
  constraint uq_adrija_social_week unique (week_start)
);

create index if not exists idx_adrija_social_week_start
  on public.onboarding_adrija_social_kpi_week (week_start);

comment on table public.onboarding_adrija_social_kpi_week is
  'Adrija dashboard: weekly completion flags for Post / Reel / LinkedIn (0=no, 1=yes).';

alter table public.onboarding_adrija_social_kpi_week enable row level security;
