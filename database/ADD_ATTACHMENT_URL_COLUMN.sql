-- Ensure tickets.attachment_url exists (required for attachment link to save)
-- Run in Supabase SQL Editor if attachment "View" shows but URL doesn't save.
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attachment_url TEXT;
