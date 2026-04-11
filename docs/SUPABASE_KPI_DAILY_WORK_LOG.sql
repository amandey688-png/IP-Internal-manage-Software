-- KPI daily work log (Akash dashboard manual entry) — run in Supabase SQL editor
-- Matches spreadsheet: Item cleaning, Video content, AI learning (per day, Mon–Fri style use)

create table if not exists public.kpi_daily_work_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  work_date date not null,
  items_cleaned integer null,
  errors_found numeric null,
  accuracy_pct numeric null,
  videos_created integer null,
  video_type text null,
  ai_tasks_used integer null,
  process_improved integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kpi_daily_work_log_user_date unique (user_id, work_date)
);

create index if not exists kpi_daily_work_log_user_month_idx
  on public.kpi_daily_work_log (user_id, work_date);

comment on table public.kpi_daily_work_log is 'Manual KPI daily entries for Akash-style dashboard (items/video/AI).';

alter table public.kpi_daily_work_log enable row level security;

-- Users can read/write only their own rows (JWT uid = auth.uid())
create policy "kpi_daily_work_log_select_own"
  on public.kpi_daily_work_log for select
  using (auth.uid() = user_id);

create policy "kpi_daily_work_log_insert_own"
  on public.kpi_daily_work_log for insert
  with check (auth.uid() = user_id);

create policy "kpi_daily_work_log_update_own"
  on public.kpi_daily_work_log for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "kpi_daily_work_log_delete_own"
  on public.kpi_daily_work_log for delete
  using (auth.uid() = user_id);
