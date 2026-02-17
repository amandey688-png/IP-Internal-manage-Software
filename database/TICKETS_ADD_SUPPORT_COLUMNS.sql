-- Add columns to public.tickets to store support form data as-is (Page, Company Name, Division text)
-- Run once in Supabase before TICKETS_BULK_INSERT_FROM_TSV.sql

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS page TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS division TEXT;

COMMENT ON COLUMN public.tickets.page IS 'Page/screen name from support form (as-is)';
COMMENT ON COLUMN public.tickets.company_name IS 'Company name from support form (as-is)';
COMMENT ON COLUMN public.tickets.division IS 'Division name from support form (as-is)';
