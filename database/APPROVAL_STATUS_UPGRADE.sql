-- Approval Status: actual timestamps for Approve / Unapprove (Feature requests)
-- Run in Supabase SQL Editor after RUN_IN_SUPABASE.sql

-- Timestamps when Approve / Unapprove was clicked
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS approval_actual_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS unapproval_actual_at TIMESTAMPTZ;

-- Optional: make approval_status NULL for new Feature tickets so they appear in "Approval Status" (pending)
-- If your app sets approval_status on create, you can skip this:
-- ALTER TABLE public.tickets ALTER COLUMN approval_status DROP DEFAULT;

COMMENT ON COLUMN public.tickets.approval_actual_at IS 'When the ticket was approved (Feature)';
COMMENT ON COLUMN public.tickets.unapproval_actual_at IS 'When the ticket was unapproved (Feature), with remarks';
