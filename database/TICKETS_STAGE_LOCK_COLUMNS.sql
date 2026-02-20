-- ============================================================================
-- Stage locking: Stage 1, 3, 4 (Chores & Bugs) and Feature Stage 2 one-time edit
-- Once edited by Admin or User, locked for them. Master Admin can always edit.
-- Run in Supabase SQL Editor.
-- ============================================================================

-- Chores & Bugs: per-stage lock (ticket-level, applies to Admin L2 and User L3)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS stage_1_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS stage_2_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS stage_3_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS stage_4_locked BOOLEAN DEFAULT FALSE;

-- Feature: Stage 2 one-time edit (Admin and User)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS feature_stage_2_edit_used BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.tickets.stage_1_locked IS 'Chores&Bugs Stage 1 edited once by Admin/User; only Master Admin can edit';
COMMENT ON COLUMN public.tickets.stage_2_locked IS 'Chores&Bugs Stage 2 edited once by Admin/User; only Master Admin can edit';
COMMENT ON COLUMN public.tickets.stage_3_locked IS 'Chores&Bugs Stage 3 edited once by Admin/User; only Master Admin can edit';
COMMENT ON COLUMN public.tickets.stage_4_locked IS 'Chores&Bugs Stage 4 edited once by Admin/User; only Master Admin can edit';
COMMENT ON COLUMN public.tickets.feature_stage_2_edit_used IS 'Feature Stage 2 edited once by Admin/User; only Master Admin can edit';
