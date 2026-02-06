-- ============================================================================
-- FMS PART 3 ONLY - Chores & Bugs SLA (4-Stage Workflow)
-- Run this in Supabase SQL Editor if you already ran Part 1 & 2
-- Fixes "Failed to update" when selecting Status 1 (Yes/No)
-- ============================================================================

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_1 TEXT CHECK (status_1 IN ('yes', 'no'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_1 TIMESTAMPTZ;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_2 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_2 TEXT CHECK (status_2 IN ('completed', 'pending', 'staging', 'hold', 'na', 'rejected'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_2 TIMESTAMPTZ;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_3 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_3 TEXT CHECK (status_3 IN ('completed', 'pending', 'hold', 'rejected', 'na'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_3 TIMESTAMPTZ;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_4 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_4 TEXT CHECK (status_4 IN ('completed', 'pending', 'na'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_4 TIMESTAMPTZ;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution_submitted_by TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution_submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tickets_status_4 ON public.tickets(status_4);
CREATE INDEX IF NOT EXISTS idx_tickets_actual_4 ON public.tickets(actual_4);
CREATE INDEX IF NOT EXISTS idx_tickets_has_solution ON public.tickets(id) WHERE quality_solution IS NOT NULL;
