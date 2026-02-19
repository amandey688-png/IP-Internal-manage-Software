-- ============================================================================
-- Add MRO department to checklist_departments (Production)
-- Run in Supabase SQL Editor for your PRODUCTION project
-- ============================================================================

INSERT INTO public.checklist_departments (name) VALUES ('MRO')
ON CONFLICT (name) DO NOTHING;
