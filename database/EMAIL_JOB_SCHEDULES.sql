-- =============================================================================
-- In-app email schedules (cron-job.org style + Render Cron /scheduler/tick)
-- Run once in Supabase SQL Editor (safe to re-run).
-- Then run EMAIL_JOB_SCHEDULES_V2.sql if table already existed without v2 columns.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_job_schedules (
  job_key text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  schedule_type text NOT NULL DEFAULT 'daily',
  interval_minutes int,
  hour int NOT NULL DEFAULT 8 CHECK (hour >= 0 AND hour <= 23),
  minute int NOT NULL DEFAULT 0 CHECK (minute >= 0 AND minute <= 59),
  day_of_month int DEFAULT 1,
  month int DEFAULT 1,
  cron_expression text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_job_schedules_type_chk CHECK (
    schedule_type IN ('every_minutes', 'daily', 'monthly', 'yearly', 'custom')
  )
);

COMMENT ON TABLE public.email_job_schedules IS
  'Email cron schedules from Settings. Render Cron hits /scheduler/tick every 5 min.';

INSERT INTO public.email_job_schedules (
  job_key, label, schedule_type, hour, minute, timezone, cron_expression
)
VALUES
  ('feature_approval', 'Feature Approval Reminder', 'daily', 8, 7, 'Asia/Kolkata', '7 8 * * *'),
  ('checklist_daily', 'Checklist Daily Reminder (per doer)', 'daily', 8, 0, 'Asia/Kolkata', '0 8 * * *'),
  ('delegation_daily', 'Delegation Daily Reminder (per assignee)', 'daily', 8, 15, 'Asia/Kolkata', '15 8 * * *'),
  ('escalation_pending', 'Escalation — Pending Timeframe', 'daily', 9, 0, 'Asia/Kolkata', '0 9 * * *'),
  ('escalation_critical', 'Escalation — Critical 72hr+', 'daily', 9, 5, 'Asia/Kolkata', '5 9 * * *'),
  ('escalation_stages', 'Escalation — Stage 2 / 3 / 4', 'daily', 9, 10, 'Asia/Kolkata', '10 9 * * *')
ON CONFLICT (job_key) DO NOTHING;

INSERT INTO public.email_job_schedules (
  job_key, label, enabled, schedule_type, hour, minute, timezone, updated_at
)
SELECT
  'feature_approval',
  'Feature Approval Reminder',
  COALESCE(s.enabled, true),
  'daily',
  COALESCE(s.hour, 8),
  COALESCE(s.minute, 7),
  COALESCE(s.timezone, 'Asia/Kolkata'),
  COALESCE(s.updated_at, now())
FROM public.feature_approval_schedule s
WHERE s.id = 1
ON CONFLICT (job_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  hour = EXCLUDED.hour,
  minute = EXCLUDED.minute,
  timezone = EXCLUDED.timezone,
  updated_at = EXCLUDED.updated_at
WHERE public.email_job_schedules.updated_at < EXCLUDED.updated_at;

SELECT job_key, schedule_type, hour, minute, cron_expression, timezone
FROM public.email_job_schedules
ORDER BY job_key;
