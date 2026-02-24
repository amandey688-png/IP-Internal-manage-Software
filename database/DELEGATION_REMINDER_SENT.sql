-- ============================================================================
-- DELEGATION REMINDER SENT – Track daily reminder emails to delegation assignees
-- ============================================================================
-- Run in Supabase SQL Editor. Same pattern as checklist_reminder_sent.
-- Used to send at most one reminder per assignee per day for pending delegation tasks.
-- ============================================================================

-- Track sent delegation reminder emails (one per assignee per date)
CREATE TABLE IF NOT EXISTS public.delegation_reminder_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_delegation_reminder_sent_date ON public.delegation_reminder_sent(reminder_date);

ALTER TABLE public.delegation_reminder_sent ENABLE ROW LEVEL SECURITY;

-- Backend (service_role) needs to read and insert
DROP POLICY IF EXISTS delegation_reminder_sent_select_service ON public.delegation_reminder_sent;
CREATE POLICY delegation_reminder_sent_select_service ON public.delegation_reminder_sent
    FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS delegation_reminder_sent_insert_service ON public.delegation_reminder_sent;
CREATE POLICY delegation_reminder_sent_insert_service ON public.delegation_reminder_sent
    FOR INSERT TO service_role WITH CHECK (true);
