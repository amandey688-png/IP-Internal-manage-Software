-- =============================================================================
-- Checklist & Delegation daily reminder tracking (one email per user per day)
-- Run once in Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.checklist_reminder_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_checklist_reminder_sent_date
  ON public.checklist_reminder_sent (reminder_date);

COMMENT ON TABLE public.checklist_reminder_sent IS
  'Prevents duplicate checklist reminder emails per user per calendar day.';

CREATE TABLE IF NOT EXISTS public.delegation_reminder_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_delegation_reminder_sent_date
  ON public.delegation_reminder_sent (reminder_date);

COMMENT ON TABLE public.delegation_reminder_sent IS
  'Prevents duplicate delegation reminder emails per assignee per calendar day.';

CREATE TABLE IF NOT EXISTS public.pending_reminder_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_pending_reminder_sent_date
  ON public.pending_reminder_sent (reminder_date);

COMMENT ON TABLE public.pending_reminder_sent IS
  'Prevents duplicate admin digest emails (Checklist & Delegation + Support) per user per day.';

-- Optional: clear today to re-test cron (run manually when needed)
-- DELETE FROM public.checklist_reminder_sent WHERE reminder_date = CURRENT_DATE;
-- DELETE FROM public.delegation_reminder_sent WHERE reminder_date = CURRENT_DATE;

SELECT 'checklist_reminder_sent' AS tbl, EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'checklist_reminder_sent'
) AS ok
UNION ALL
SELECT 'delegation_reminder_sent', EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'delegation_reminder_sent'
)
UNION ALL
SELECT 'pending_reminder_sent', EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'pending_reminder_sent'
);
