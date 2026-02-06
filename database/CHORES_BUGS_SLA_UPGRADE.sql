-- ============================================================================
-- FMS CHORES & BUGS SLA - 4-Stage Workflow
-- Run in Supabase SQL Editor AFTER RUN_IN_SUPABASE.sql
-- ============================================================================

-- Stage 1 - First Action (always visible)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_1 TEXT CHECK (status_1 IN ('yes', 'no'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_1 TIMESTAMPTZ;

-- Stage 2 - Work Progress (visible if status_1 = no)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_2 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_2 TEXT CHECK (status_2 IN ('completed', 'pending', 'staging', 'hold', 'na', 'rejected'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_2 TIMESTAMPTZ;

-- Stage 3 - Review Turnaround (visible if status_2 = completed)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_3 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_3 TEXT CHECK (status_3 IN ('completed', 'pending', 'hold', 'rejected', 'na'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_3 TIMESTAMPTZ;

-- Stage 4 - Confirmation (visible if status_3 = completed OR status_1 = yes)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_4 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_4 TEXT CHECK (status_4 IN ('completed', 'pending', 'na'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_4 TIMESTAMPTZ;

-- Quality Solution (linked by reference_no)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution_submitted_by TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution_submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tickets_status_4 ON public.tickets(status_4);
CREATE INDEX IF NOT EXISTS idx_tickets_actual_4 ON public.tickets(actual_4);
CREATE INDEX IF NOT EXISTS idx_tickets_quality_solution ON public.tickets(quality_solution) WHERE quality_solution IS NOT NULL;

-- ============================================================================
-- DONE - Chores & Bugs SLA columns added
-- ============================================================================
