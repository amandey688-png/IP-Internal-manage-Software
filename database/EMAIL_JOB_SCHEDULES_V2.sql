-- =============================================================================
-- Email job schedules v2 — cron-style types (run after EMAIL_JOB_SCHEDULES.sql)
-- Safe to re-run.
-- =============================================================================

ALTER TABLE public.email_job_schedules
  ADD COLUMN IF NOT EXISTS schedule_type text NOT NULL DEFAULT 'daily';

ALTER TABLE public.email_job_schedules
  ADD COLUMN IF NOT EXISTS interval_minutes int;

ALTER TABLE public.email_job_schedules
  ADD COLUMN IF NOT EXISTS day_of_month int;

ALTER TABLE public.email_job_schedules
  ADD COLUMN IF NOT EXISTS month int;

ALTER TABLE public.email_job_schedules
  ADD COLUMN IF NOT EXISTS cron_expression text;

ALTER TABLE public.email_job_schedules
  DROP CONSTRAINT IF EXISTS email_job_schedules_type_chk;

ALTER TABLE public.email_job_schedules
  ADD CONSTRAINT email_job_schedules_type_chk CHECK (
    schedule_type IN ('every_minutes', 'daily', 'monthly', 'yearly', 'custom')
  );

COMMENT ON COLUMN public.email_job_schedules.schedule_type IS
  'every_minutes | daily | monthly | yearly | custom (5-field cron)';

UPDATE public.email_job_schedules
SET schedule_type = 'daily'
WHERE schedule_type IS NULL OR schedule_type = '';

SELECT job_key, schedule_type, interval_minutes, hour, minute, day_of_month, month, cron_expression, timezone
FROM public.email_job_schedules
ORDER BY job_key;
