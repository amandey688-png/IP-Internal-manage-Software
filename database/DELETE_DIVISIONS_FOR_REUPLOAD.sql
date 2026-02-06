-- ============================================================================
-- Delete previous uploaded divisions (run in Supabase SQL Editor when you want
-- to wipe divisions and re-run COMPANY_DIVISION_MASTER.sql)
-- ============================================================================
-- Companies are NOT deleted. Existing tickets keep their company_id; their
-- division_id will point to a removed row until you re-upload (then new
-- division IDs will differ). To avoid orphaned division_id on tickets, you can
-- optionally set ticket division references to NULL before re-uploading.
-- ============================================================================

DELETE FROM public.divisions;

-- Optional: set existing tickets' division_id to NULL so no orphaned references
-- UPDATE public.tickets SET division_id = NULL WHERE division_id IS NOT NULL;
