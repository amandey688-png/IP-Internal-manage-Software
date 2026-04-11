-- Bulk upsert KPI daily work log from spreadsheet (Supabase → SQL editor)
--
-- 1) The app stores daily KPI rows under the **Akash KPI profile** (same user as dashboard name=Akash).
--    Use the auth email for that profile in `u` (usually akash@industryprime.com), not a co-editor account.
-- 2) Paste/run the whole script. Uses ON CONFLICT to merge by (user_id, work_date).
-- 3) If you get RLS errors in the dashboard UI only, the SQL editor still usually works as postgres.
--    If insert is denied: run as service role, or temporarily disable RLS on this table for maintenance.

with u as (
  select id as user_id
  from auth.users
  where lower(email) = lower('akash@industryprime.com')  -- <<< change if needed (e.g. aman@industryprime.com)
  limit 1
),
src (
  work_date,
  items_cleaned,
  errors_found,
  videos_created,
  video_type,
  ai_tasks_used,
  process_improved
) as (
  values
    ('2026-03-05'::date, 5000, 233::numeric, 2, 'Short', 2, 1),
    ('2026-03-06'::date, 0, 0::numeric, 0, null, 1, 0),
    ('2026-03-07'::date, 0, 0::numeric, 1, 'How To', null::int, null::int),
    ('2026-03-09'::date, 965, 81::numeric, null::int, null, null::int, null::int),
    ('2026-03-11'::date, null::int, null::numeric, 1, 'Short', 2, 1),
    ('2026-03-14'::date, null::int, null::numeric, 1, 'Short', 2, 1),
    ('2026-03-18'::date, null::int, null::numeric, 1, 'Short', 3, 3),
    ('2026-03-19'::date, 1500, null::numeric, null::int, null, null::int, null::int),
    ('2026-03-26'::date, null::int, null::numeric, 1, 'Short', 3, 3),
    ('2026-03-30'::date, 4000, 120::numeric, null::int, null, null::int, null::int),
    ('2026-03-31'::date, 3000, 300::numeric, null::int, null, null::int, null::int),
    ('2026-04-02'::date, 4500, 230::numeric, null::int, null, 1, 1),
    ('2026-04-03'::date, 5426, 400::numeric, null::int, null, 1, 1),
    ('2026-04-04'::date, 5426, 813::numeric, null::int, null, 1, 1),
    ('2026-04-09'::date, null::int, null::numeric, 1, 'Shorts', null::int, null::int)
)
insert into public.kpi_daily_work_log (
  user_id,
  work_date,
  items_cleaned,
  errors_found,
  videos_created,
  video_type,
  ai_tasks_used,
  process_improved,
  updated_at
)
select
  u.user_id,
  s.work_date,
  s.items_cleaned,
  s.errors_found,
  s.videos_created,
  s.video_type,
  s.ai_tasks_used,
  s.process_improved,
  now()
from u
cross join src s
on conflict (user_id, work_date) do update set
  items_cleaned = excluded.items_cleaned,
  errors_found = excluded.errors_found,
  videos_created = excluded.videos_created,
  video_type = excluded.video_type,
  ai_tasks_used = excluded.ai_tasks_used,
  process_improved = excluded.process_improved,
  updated_at = excluded.updated_at;
