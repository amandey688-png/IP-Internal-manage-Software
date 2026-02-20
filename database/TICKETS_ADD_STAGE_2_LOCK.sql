-- Add Stage 2 lock for Chores & Bugs (one-time edit like Stage 1, 3, 4)
-- Run in Supabase SQL Editor if stage_2_locked does not exist yet.
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS stage_2_locked BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN public.tickets.stage_2_locked IS 'Chores&Bugs Stage 2 edited once by Admin/User; only Master Admin can edit';
