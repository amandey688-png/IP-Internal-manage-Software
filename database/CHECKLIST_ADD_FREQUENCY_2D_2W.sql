-- ============================================================================
-- CHECKLIST: Add frequency options 2D (Every 2 days) and 2W (Every 2 weeks)
-- ============================================================================
-- Run in Supabase SQL Editor after CHECKLIST_MODULE.sql
-- ============================================================================

-- Drop the existing CHECK constraint on frequency.
-- PostgreSQL often names it checklist_tasks_frequency_check; if DROP fails,
-- find the name: SELECT conname FROM pg_constraint WHERE conrelid = 'public.checklist_tasks'::regclass AND contype = 'c';
ALTER TABLE public.checklist_tasks
  DROP CONSTRAINT IF EXISTS checklist_tasks_frequency_check;

-- Add new CHECK allowing D, 2D, W, 2W, M, Q, F, Y
ALTER TABLE public.checklist_tasks
  ADD CONSTRAINT checklist_tasks_frequency_check
  CHECK (frequency IN ('D', '2D', 'W', '2W', 'M', 'Q', 'F', 'Y'));
