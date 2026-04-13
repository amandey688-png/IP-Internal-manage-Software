-- Adrija Dashboard — daily social KPI (mark Post / Reel / LinkedIn per calendar day)
-- Run in Supabase SQL Editor once. FastAPI uses the service role and bypasses RLS.

create table if not exists public.onboarding_adrija_social_kpi_day (
  work_date date primary key,
  post smallint not null default 0 check (post in (0, 1)),
  post_task_name text null,
  reel smallint not null default 0 check (reel in (0, 1)),
  reel_task_name text null,
  linkedin smallint not null default 0 check (linkedin in (0, 1)),
  linkedin_task_name text null,
  updated_at timestamptz not null default now(),
  constraint chk_post_task_required check (post = 0 or nullif(trim(post_task_name), '') is not null),
  constraint chk_reel_task_required check (reel = 0 or nullif(trim(reel_task_name), '') is not null),
  constraint chk_linkedin_task_required check (linkedin = 0 or nullif(trim(linkedin_task_name), '') is not null)
);

create index if not exists idx_adrija_social_kpi_day_work_date
  on public.onboarding_adrija_social_kpi_day (work_date);

comment on table public.onboarding_adrija_social_kpi_day is
  'Adrija dashboard: per-day completion flags for Post / Reel / LinkedIn (0=no, 1=yes).';

alter table public.onboarding_adrija_social_kpi_day enable row level security;
