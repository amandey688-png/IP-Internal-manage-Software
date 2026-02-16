-- ============================================================================
-- DELEGATION TASKS - Add delegation_on, submission_date, has_document, etc.
-- ============================================================================
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste & Run
-- ============================================================================

-- Add new columns (one per statement for reliability)
ALTER TABLE public.delegation_tasks ADD COLUMN IF NOT EXISTS delegation_on DATE;
ALTER TABLE public.delegation_tasks ADD COLUMN IF NOT EXISTS submission_date DATE;
ALTER TABLE public.delegation_tasks ADD COLUMN IF NOT EXISTS has_document TEXT;
ALTER TABLE public.delegation_tasks ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.delegation_tasks ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.delegation_tasks ADD COLUMN IF NOT EXISTS reference_no TEXT;
ALTER TABLE public.delegation_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_delegation_tasks_reference_no ON public.delegation_tasks(reference_no) WHERE reference_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_submitted_by ON public.delegation_tasks(submitted_by);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_completed_at ON public.delegation_tasks(completed_at);

-- Reload PostgREST schema cache (Supabase)
NOTIFY pgrst, 'reload schema';
