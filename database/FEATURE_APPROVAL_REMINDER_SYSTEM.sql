-- =============================================================================
-- Feature Approval Reminder emails (Support tickets: type = feature, pending approval)
-- Run once in Supabase SQL Editor. Backend uses service_role.
-- =============================================================================

-- Recipients (enable/disable per row; unique email)
CREATE TABLE IF NOT EXISTS public.feature_approval_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_approval_email_settings_email_ci
  ON public.feature_approval_email_settings (lower(trim(email)));

CREATE INDEX IF NOT EXISTS idx_feature_approval_email_settings_enabled
  ON public.feature_approval_email_settings (is_enabled)
  WHERE is_enabled = true;

COMMENT ON TABLE public.feature_approval_email_settings IS 'Recipients for grouped daily Feature approval pending reminders.';

-- Single schedule row (documentation + optional UI; external cron calls the API)
CREATE TABLE IF NOT EXISTS public.feature_approval_schedule (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  hour int NOT NULL DEFAULT 8 CHECK (hour >= 0 AND hour <= 23),
  minute int NOT NULL DEFAULT 7 CHECK (minute >= 0 AND minute <= 59),
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.feature_approval_schedule (id, enabled, hour, minute, timezone)
VALUES (1, true, 8, 7, 'Asia/Kolkata')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.feature_approval_schedule IS 'Expected local cron time (single row). External job should POST /api/feature-approval-reminders/run with secret.';

-- Audit log (one row per recipient per batch attempt)
CREATE TABLE IF NOT EXISTS public.feature_approval_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  total_pending int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_feature_approval_email_logs_sent_at
  ON public.feature_approval_email_logs (sent_at DESC);

COMMENT ON TABLE public.feature_approval_email_logs IS 'Outbound reminder audit trail.';

-- One grouped send per calendar day in Asia/Kolkata (stops duplicate cron fires)
CREATE TABLE IF NOT EXISTS public.feature_approval_reminder_dedup (
  dedup_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_approval_reminder_dedup_created
  ON public.feature_approval_reminder_dedup (created_at DESC);

COMMENT ON TABLE public.feature_approval_reminder_dedup IS 'Prevents more than one reminder batch per dedup_key (daily slot).';

-- Optional: seed from legacy approval_settings (comma-separated). Skip if table missing.
-- INSERT INTO public.feature_approval_email_settings (email, name, is_enabled)
-- SELECT DISTINCT trim(both FROM x), '', true
-- FROM unnest(
--   string_to_array(
--     COALESCE((SELECT value FROM public.approval_settings WHERE key = 'approval_emails' LIMIT 1), ''),
--     ','
--   )
-- ) AS t(x)
-- WHERE trim(both FROM x) <> ''
--   AND trim(both FROM x) ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
-- ON CONFLICT (lower(trim(email))) DO NOTHING;
