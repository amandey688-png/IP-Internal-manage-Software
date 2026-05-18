-- =============================================================================
-- ALL EMAIL MODULES — run once in Supabase SQL Editor (in order, safe to re-run)
-- Backend uses service_role — no extra RLS policies required for these tables.
--
-- Modules included:
--   1) Approve/Reject email links (approval_tokens)
--   2) Feature Approval Email Configuration (reminders)
--   3) Advanced Pending Escalation Email Configuration
--
-- NOT required for production URL fix (PUBLIC_API_URL on Render) or Postmark env.
-- =============================================================================

-- ---------- 1) APPROVAL EMAIL ACTION (Approve / Reject from email) ----------
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS remarks text;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS approval_status text,
  ADD COLUMN IF NOT EXISTS approval_source text,
  ADD COLUMN IF NOT EXISTS approval_actual_at timestamptz,
  ADD COLUMN IF NOT EXISTS unapproval_actual_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

CREATE TABLE IF NOT EXISTS public.approval_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  action text NOT NULL CHECK (action IN ('approve', 'reject')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_tokens_token ON public.approval_tokens (token);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_ticket ON public.approval_tokens (ticket_id);

CREATE TABLE IF NOT EXISTS public.approval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  approved_by uuid,
  approved_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL,
  source text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_logs_ticket ON public.approval_logs (ticket_id, approved_at DESC);

-- ---------- 2) FEATURE APPROVAL REMINDER EMAILS ----------
CREATE TABLE IF NOT EXISTS public.feature_approval_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_approval_email_settings_email_ci
  ON public.feature_approval_email_settings (lower(trim(email)));

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

CREATE TABLE IF NOT EXISTS public.feature_approval_reminder_dedup (
  dedup_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- 3) ESCALATION EMAIL CONFIGURATION ----------
CREATE TABLE IF NOT EXISTS public.escalation_email_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_type text NOT NULL,
  stage_name text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escalation_email_config_type_chk CHECK (
    configuration_type IN (
      'pending_timeframe',
      'critical_pending',
      'stage_2',
      'stage_3',
      'stage_4'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_escalation_email_config_type
  ON public.escalation_email_config (configuration_type);

CREATE TABLE IF NOT EXISTS public.escalation_email_receivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES public.escalation_email_config (id) ON DELETE CASCADE,
  email text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_escalation_email_receivers_config_email_ci
  ON public.escalation_email_receivers (config_id, lower(trim(email)));

CREATE TABLE IF NOT EXISTS public.escalation_send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_type text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  total_pending int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_escalation_send_logs_sent_at
  ON public.escalation_send_logs (sent_at DESC);

CREATE TABLE IF NOT EXISTS public.escalation_manual_trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_type text NOT NULL,
  triggered_by uuid,
  trigger_source text NOT NULL DEFAULT 'manual',
  force_bypass boolean NOT NULL DEFAULT false,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.escalation_reminder_dedup (
  dedup_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.escalation_email_config (configuration_type, stage_name, is_enabled)
VALUES
  ('pending_timeframe', 'Pending Timeframe Escalation', true),
  ('critical_pending', 'Critical Pending Escalation', true),
  ('stage_2', 'Stage 2 Pending', true),
  ('stage_3', 'Stage 3 Pending', true),
  ('stage_4', 'Stage 4 Pending', true)
ON CONFLICT (configuration_type) DO NOTHING;

-- =============================================================================
-- VERIFICATION (run after — all should return rows / true)
-- =============================================================================
SELECT 'approval_tokens' AS tbl, EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'approval_tokens'
) AS ok
UNION ALL
SELECT 'feature_approval_email_settings', EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'feature_approval_email_settings'
)
UNION ALL
SELECT 'escalation_email_config', EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'escalation_email_config'
);

SELECT configuration_type, stage_name, is_enabled
FROM public.escalation_email_config
ORDER BY configuration_type;

SELECT id, enabled, hour, minute, timezone
FROM public.feature_approval_schedule
WHERE id = 1;
