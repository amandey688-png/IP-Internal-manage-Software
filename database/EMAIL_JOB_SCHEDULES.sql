-- =============================================================================
-- In-app email schedules (Render Cron calls GET /scheduler/tick every 5 minutes)
-- Run once in Supabase SQL Editor (safe to re-run).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_job_schedules (
  job_key text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  hour int NOT NULL DEFAULT 8 CHECK (hour >= 0 AND hour <= 23),
  minute int NOT NULL DEFAULT 0 CHECK (minute >= 0 AND minute <= 59),
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_job_schedules IS
  'Daily send times configured in Settings. Render Cron hits /scheduler/tick to run due jobs.';

INSERT INTO public.email_job_schedules (job_key, label, hour, minute, timezone)
VALUES
  ('feature_approval', 'Feature Approval Reminder', 8, 7, 'Asia/Kolkata'),
  ('checklist_daily', 'Checklist Daily Reminder (per doer)', 8, 0, 'Asia/Kolkata'),
  ('delegation_daily', 'Delegation Daily Reminder (per assignee)', 8, 15, 'Asia/Kolkata'),
  ('escalation_pending', 'Escalation — Pending Timeframe', 9, 0, 'Asia/Kolkata'),
  ('escalation_critical', 'Escalation — Critical 72hr+', 9, 5, 'Asia/Kolkata'),
  ('escalation_stages', 'Escalation — Stage 2 / 3 / 4', 9, 10, 'Asia/Kolkata')
ON CONFLICT (job_key) DO NOTHING;

-- Copy existing feature approval schedule if present
INSERT INTO public.email_job_schedules (job_key, label, enabled, hour, minute, timezone, updated_at)
SELECT
  'feature_approval',
  'Feature Approval Reminder',
  COALESCE(s.enabled, true),
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

SELECT job_key, label, enabled, hour, minute, timezone
FROM public.email_job_schedules
ORDER BY job_key;
