-- =============================================================================
-- Advanced Pending Escalation & Approval Email Configuration
-- Run once in Supabase SQL Editor. Backend uses service_role.
-- =============================================================================

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

COMMENT ON TABLE public.escalation_email_config IS
  'Escalation email profiles: pending_timeframe, critical_pending, stage_2/3/4.';

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

CREATE INDEX IF NOT EXISTS idx_escalation_email_receivers_config
  ON public.escalation_email_receivers (config_id);

COMMENT ON TABLE public.escalation_email_receivers IS
  'Recipients per escalation configuration (multiple per box/stage).';

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

CREATE INDEX IF NOT EXISTS idx_escalation_send_logs_config
  ON public.escalation_send_logs (configuration_type, sent_at DESC);

COMMENT ON TABLE public.escalation_send_logs IS
  'Outbound escalation email audit (per recipient per batch).';

CREATE TABLE IF NOT EXISTS public.escalation_manual_trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_type text NOT NULL,
  triggered_by uuid,
  trigger_source text NOT NULL DEFAULT 'manual',
  force_bypass boolean NOT NULL DEFAULT false,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escalation_manual_trigger_logs_created
  ON public.escalation_manual_trigger_logs (created_at DESC);

COMMENT ON TABLE public.escalation_manual_trigger_logs IS
  'Force-send and manual cron trigger history.';

CREATE TABLE IF NOT EXISTS public.escalation_reminder_dedup (
  dedup_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escalation_reminder_dedup_created
  ON public.escalation_reminder_dedup (created_at DESC);

COMMENT ON TABLE public.escalation_reminder_dedup IS
  'Prevents duplicate automated sends per config per calendar day (Asia/Kolkata).';

-- Seed configuration rows (idempotent)
INSERT INTO public.escalation_email_config (configuration_type, stage_name, is_enabled)
VALUES
  ('pending_timeframe', 'Pending Timeframe Escalation', true),
  ('critical_pending', 'Critical Pending Escalation', true),
  ('stage_2', 'Stage 2 Pending', true),
  ('stage_3', 'Stage 3 Pending', true),
  ('stage_4', 'Stage 4 Pending', true)
ON CONFLICT (configuration_type) DO NOTHING;
