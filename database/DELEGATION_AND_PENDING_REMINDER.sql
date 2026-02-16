-- ============================================================================
-- DELEGATION TASKS & PENDING REMINDER TRACKING
-- ============================================================================
-- Run in Supabase SQL Editor. Creates delegation_tasks and pending_reminder_sent.
-- ============================================================================

-- Delegation tasks
CREATE TABLE IF NOT EXISTS public.delegation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    assignee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    delegation_on DATE,
    submission_date DATE,
    has_document TEXT CHECK (has_document IN ('yes', 'no')),
    document_url TEXT,
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reference_no TEXT UNIQUE,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_delegation_tasks_assignee ON public.delegation_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_due_date ON public.delegation_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_status ON public.delegation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_submitted_by ON public.delegation_tasks(submitted_by);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_completed_at ON public.delegation_tasks(completed_at);

-- RLS
ALTER TABLE public.delegation_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS delegation_tasks_select_authenticated ON public.delegation_tasks;
CREATE POLICY delegation_tasks_select_authenticated ON public.delegation_tasks
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS delegation_tasks_insert_authenticated ON public.delegation_tasks;
CREATE POLICY delegation_tasks_insert_authenticated ON public.delegation_tasks
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS delegation_tasks_update_authenticated ON public.delegation_tasks;
CREATE POLICY delegation_tasks_update_authenticated ON public.delegation_tasks
    FOR UPDATE TO authenticated USING (true);

-- Track pending digest sent to Level 1 & 2 (one per user per date)
CREATE TABLE IF NOT EXISTS public.pending_reminder_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_pending_reminder_sent_date ON public.pending_reminder_sent(reminder_date);

ALTER TABLE public.pending_reminder_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pending_reminder_sent_select_service ON public.pending_reminder_sent;
CREATE POLICY pending_reminder_sent_select_service ON public.pending_reminder_sent
    FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS pending_reminder_sent_insert_service ON public.pending_reminder_sent;
CREATE POLICY pending_reminder_sent_insert_service ON public.pending_reminder_sent
    FOR INSERT TO service_role WITH CHECK (true);
