-- =============================================================================
-- Remove in-app email scheduler table (schedules are on cron-job.org only).
-- Run once in Supabase SQL Editor.
-- =============================================================================

DROP TABLE IF EXISTS public.email_job_schedules CASCADE;

-- Optional: feature_approval_schedule is unused by the app UI; keep if you use the API.
-- DROP TABLE IF EXISTS public.feature_approval_schedule CASCADE;

SELECT 'email_job_schedules dropped' AS status;
