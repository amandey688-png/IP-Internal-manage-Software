-- ============================================================================
-- RLS FOR CHECKLIST MODULE
-- ============================================================================
-- Run in Supabase SQL Editor AFTER CHECKLIST_MODULE.sql
-- Backend uses service_role (bypasses RLS); these apply for anon/authenticated.
-- ============================================================================

-- Enable RLS on checklist tables
ALTER TABLE public.checklist_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_reminder_sent ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- checklist_departments (lookup: read-only for authenticated)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "checklist_departments_select_authenticated" ON public.checklist_departments;
CREATE POLICY "checklist_departments_select_authenticated" ON public.checklist_departments
  FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- checklist_holidays (read all; insert/update/delete for authenticated - admin enforced by app)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "checklist_holidays_select_authenticated" ON public.checklist_holidays;
CREATE POLICY "checklist_holidays_select_authenticated" ON public.checklist_holidays
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "checklist_holidays_insert_authenticated" ON public.checklist_holidays;
CREATE POLICY "checklist_holidays_insert_authenticated" ON public.checklist_holidays
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "checklist_holidays_update_authenticated" ON public.checklist_holidays;
CREATE POLICY "checklist_holidays_update_authenticated" ON public.checklist_holidays
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "checklist_holidays_delete_authenticated" ON public.checklist_holidays;
CREATE POLICY "checklist_holidays_delete_authenticated" ON public.checklist_holidays
  FOR DELETE TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- checklist_tasks (select all for authenticated; insert own as doer)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "checklist_tasks_select_authenticated" ON public.checklist_tasks;
CREATE POLICY "checklist_tasks_select_authenticated" ON public.checklist_tasks
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "checklist_tasks_insert_own" ON public.checklist_tasks;
CREATE POLICY "checklist_tasks_insert_own" ON public.checklist_tasks
  FOR INSERT TO authenticated WITH CHECK (doer_id = auth.uid() AND created_by = auth.uid());

DROP POLICY IF EXISTS "checklist_tasks_update_authenticated" ON public.checklist_tasks;
CREATE POLICY "checklist_tasks_update_authenticated" ON public.checklist_tasks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "checklist_tasks_delete_authenticated" ON public.checklist_tasks;
CREATE POLICY "checklist_tasks_delete_authenticated" ON public.checklist_tasks
  FOR DELETE TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- checklist_completions (select all; insert only when completing own task)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "checklist_completions_select_authenticated" ON public.checklist_completions;
CREATE POLICY "checklist_completions_select_authenticated" ON public.checklist_completions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "checklist_completions_insert_own" ON public.checklist_completions;
CREATE POLICY "checklist_completions_insert_own" ON public.checklist_completions
  FOR INSERT TO authenticated WITH CHECK (completed_by = auth.uid());

DROP POLICY IF EXISTS "checklist_completions_update_authenticated" ON public.checklist_completions;
CREATE POLICY "checklist_completions_update_authenticated" ON public.checklist_completions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "checklist_completions_delete_authenticated" ON public.checklist_completions;
CREATE POLICY "checklist_completions_delete_authenticated" ON public.checklist_completions
  FOR DELETE TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- checklist_reminder_sent (backend writes; user can read own)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "checklist_reminder_sent_select_own" ON public.checklist_reminder_sent;
CREATE POLICY "checklist_reminder_sent_select_own" ON public.checklist_reminder_sent
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "checklist_reminder_sent_insert_authenticated" ON public.checklist_reminder_sent;
CREATE POLICY "checklist_reminder_sent_insert_authenticated" ON public.checklist_reminder_sent
  FOR INSERT TO authenticated WITH CHECK (true);
