-- Add reference_no to checklist_tasks (unique per doer, e.g. CHK-AMAN-001)
-- Run in Supabase SQL Editor after CHECKLIST_MODULE.sql
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS reference_no TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_tasks_reference_no ON public.checklist_tasks(reference_no) WHERE reference_no IS NOT NULL;
NOTIFY pgrst, 'reload schema';
