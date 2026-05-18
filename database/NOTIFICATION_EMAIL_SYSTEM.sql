-- =============================================================================
-- Email notification system (Support, Feature, Checklist, Delegation)
-- Run once in Supabase SQL Editor (service role / postgres).
-- Backend uses service_role — RLS optional; policies below allow service role only.
-- =============================================================================

-- Recipient lists per module + stage (e.g. support_tickets / stage_2_24h)
CREATE TABLE IF NOT EXISTS public.notification_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_type text NOT NULL,
  stage text NOT NULL DEFAULT '',
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_email_settings_module_stage_email UNIQUE (module_type, stage, email)
);

CREATE INDEX IF NOT EXISTS idx_notification_email_settings_module
  ON public.notification_email_settings (module_type, stage);

-- Cron schedule per module (Asia/Kolkata by default)
CREATE TABLE IF NOT EXISTS public.notification_schedule_settings (
  module_type text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  hour int NOT NULL DEFAULT 8 CHECK (hour >= 0 AND hour <= 23),
  minute int NOT NULL DEFAULT 0 CHECK (minute >= 0 AND minute <= 59),
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Send audit log
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  dedup_key text,
  meta jsonb
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_module ON public.notification_logs (module, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_dedup ON public.notification_logs (dedup_key) WHERE dedup_key IS NOT NULL;

-- Idempotency: one logical send per dedup_key per day (prevents duplicate cron runs)
CREATE TABLE IF NOT EXISTS public.notification_sent_dedup (
  dedup_key text PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_sent_dedup_sent_at ON public.notification_sent_dedup (sent_at);

-- Default schedules (Master Admin can change in Settings → Email Notifications)
INSERT INTO public.notification_schedule_settings (module_type, enabled, hour, minute, timezone)
VALUES
  ('support_tickets', true, 8, 5, 'Asia/Kolkata'),
  ('feature_approval', true, 8, 7, 'Asia/Kolkata'),
  ('checklist', true, 9, 0, 'Asia/Kolkata'),
  ('delegation', true, 8, 15, 'Asia/Kolkata')
ON CONFLICT (module_type) DO NOTHING;

-- Optional: migrate legacy approval_settings into feature_approval / pending_approval
-- INSERT INTO notification_email_settings (module_type, stage, email)
-- SELECT 'feature_approval', 'pending_approval', trim(x)
-- FROM unnest(string_to_array((SELECT value FROM approval_settings WHERE key = 'approval_emails' LIMIT 1), ',')) AS x
-- WHERE trim(x) <> ''
-- ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.notification_email_settings IS 'Configurable notification recipients by module and stage.';
COMMENT ON TABLE public.notification_schedule_settings IS 'Cron time per module (local timezone).';
COMMENT ON TABLE public.notification_logs IS 'Email send audit trail.';
COMMENT ON TABLE public.notification_sent_dedup IS 'Prevents duplicate sends for same dedup_key.';
