-- ============================================================================
-- DELEGATION MODULE – RLS (Row Level Security)
-- ============================================================================
-- Run in Supabase SQL Editor after DELEGATION_AND_PENDING_REMINDER.sql
-- Safe to re-run (DROP POLICY IF EXISTS).
-- Backend using service_role bypasses RLS; these policies apply for anon/authenticated.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- delegation_tasks
-- ----------------------------------------------------------------------------
ALTER TABLE public.delegation_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS delegation_tasks_select_authenticated ON public.delegation_tasks;
CREATE POLICY delegation_tasks_select_authenticated ON public.delegation_tasks
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS delegation_tasks_insert_authenticated ON public.delegation_tasks;
CREATE POLICY delegation_tasks_insert_authenticated ON public.delegation_tasks
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS delegation_tasks_update_authenticated ON public.delegation_tasks;
CREATE POLICY delegation_tasks_update_authenticated ON public.delegation_tasks
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Optional: allow authenticated users to delete (uncomment if app supports delete)
-- DROP POLICY IF EXISTS delegation_tasks_delete_authenticated ON public.delegation_tasks;
-- CREATE POLICY delegation_tasks_delete_authenticated ON public.delegation_tasks
--     FOR DELETE TO authenticated
--     USING (true);

-- ----------------------------------------------------------------------------
-- pending_reminder_sent (used by digest job; typically service_role only)
-- ----------------------------------------------------------------------------
ALTER TABLE public.pending_reminder_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pending_reminder_sent_select_service ON public.pending_reminder_sent;
CREATE POLICY pending_reminder_sent_select_service ON public.pending_reminder_sent
    FOR SELECT TO service_role
    USING (true);

DROP POLICY IF EXISTS pending_reminder_sent_insert_service ON public.pending_reminder_sent;
CREATE POLICY pending_reminder_sent_insert_service ON public.pending_reminder_sent
    FOR INSERT TO service_role
    WITH CHECK (true);

-- ============================================================================
-- DONE. delegation_tasks: authenticated can SELECT/INSERT/UPDATE.
--       pending_reminder_sent: service_role can SELECT/INSERT (for digest).
-- ============================================================================
