-- ============================================================================
-- Copy "ticket" (support_tickets) data into "tickets" table, then drop view ticket
-- ============================================================================
-- Prerequisites:
-- - Table public.tickets exists (FMS tickets: company_id, created_by, etc.)
-- - At least one row in public.companies and one in public.user_profiles (or auth.users)
-- Run in Supabase SQL Editor. Do Step 1 first, then Step 2.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Copy data from ticket (view) into tickets (table)
-- ---------------------------------------------------------------------------
-- Maps: reference_no, title, description, type (Bugs->bug, Chores->chore, else feature),
--       status->open, company_id/created_by from first company/user.
-- Adjust (SELECT id ... LIMIT 1) if you need a specific company or user.
-- ---------------------------------------------------------------------------

INSERT INTO public.tickets (
  reference_no,
  title,
  description,
  type,
  status,
  priority,
  company_id,
  division_id,
  created_by,
  assignee_id,
  created_at,
  updated_at,
  resolution_notes
)
SELECT
  t.reference_no,
  COALESCE(NULLIF(TRIM(t.title), ''), 'No title'),
  t.description,
  CASE
    WHEN LOWER(COALESCE(t.type_of_request, '')) LIKE '%bug%' THEN 'bug'
    WHEN LOWER(COALESCE(t.type_of_request, '')) LIKE '%chore%' THEN 'chore'
    ELSE 'feature'
  END,
  'open',
  'medium',
  (SELECT id FROM public.companies ORDER BY id ASC LIMIT 1),
  NULL,
  (SELECT id FROM public.user_profiles ORDER BY id ASC LIMIT 1),
  NULL,
  t.created_at,
  NOW(),
  'Migrated from support_tickets. Old ref: ' || COALESCE(t.old_reference_no, '')
FROM public.ticket t
ON CONFLICT (reference_no) DO NOTHING;

-- ---------------------------------------------------------------------------
-- STEP 2: Drop the "ticket" view (after you confirm Step 1 row count)
-- ---------------------------------------------------------------------------
-- Run this only after you have verified the copy in Step 1.
-- Your support data remains in support_tickets; the view is removed.
-- ---------------------------------------------------------------------------

-- DROP VIEW IF EXISTS public.ticket;
