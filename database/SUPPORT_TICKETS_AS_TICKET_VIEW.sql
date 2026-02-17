-- ============================================================================
-- VIEW: Expose support_tickets as "Ticket" table for software that expects it
-- ============================================================================
-- Run in Supabase SQL Editor. Does NOT replace public.tickets (FMS app table).
-- Use view name "ticket" (singular) so your software can read support data.
-- NULLs are shown as blank (empty string) for text columns.
-- ============================================================================

-- Drop if you need to recreate (e.g. after adding columns to support_tickets)
DROP VIEW IF EXISTS public.ticket;

CREATE VIEW public.ticket AS
SELECT
  id,
  reference_no,
  COALESCE(old_reference_no, '') AS old_reference_no,
  COALESCE(description, '') AS description,
  COALESCE(stage, '') AS stage,
  COALESCE(status, '') AS status,
  created_at,
  planned_resolution_date,
  actual_resolution_date,
  delay_days,
  COALESCE(response_source, '') AS response_source,
  COALESCE(title, '') AS title,
  COALESCE(type_of_request, '') AS type_of_request,
  COALESCE(page, '') AS page,
  COALESCE(company_name, '') AS company_name,
  COALESCE(submitted_by, '') AS submitted_by,
  query_arrival_at,
  query_response_at,
  COALESCE(reply_status, '') AS reply_status,
  updated_at
FROM public.support_tickets;

-- So RLS on support_tickets applies when API queries this view (not "Security definer")
ALTER VIEW public.ticket SET (security_invoker = on);

COMMENT ON VIEW public.ticket IS 'Support tickets exposed as Ticket table; NULLs as blank. Source: support_tickets.';
