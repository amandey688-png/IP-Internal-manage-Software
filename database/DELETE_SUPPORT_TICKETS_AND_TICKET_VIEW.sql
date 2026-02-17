-- ============================================================================
-- 1) Copy ticket/support_tickets data into tickets
-- 2) Drop view "ticket"
-- 3) Drop table "support_tickets"
-- ============================================================================
-- Run in Supabase SQL Editor. Ensure public.companies and public.user_profiles
-- have at least one row. After this, support data lives only in public.tickets.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Copy data from ticket into tickets
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
  (SELECT id FROM public.companies LIMIT 1),
  NULL,
  (SELECT id FROM public.user_profiles LIMIT 1),
  NULL,
  t.created_at,
  NOW(),
  'Migrated from support_tickets. Old ref: ' || COALESCE(t.old_reference_no, '')
FROM public.ticket t
ON CONFLICT (reference_no) DO NOTHING;

-- ---------------------------------------------------------------------------
-- STEP 2: Drop the "ticket" view (CASCADE drops dependent views e.g. support.tickets)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.ticket CASCADE;

-- ---------------------------------------------------------------------------
-- STEP 3: Drop the "support_tickets" table (and its sequence if you want)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.support_tickets CASCADE;

-- Optional: drop the reference sequence (no longer needed)
-- DROP SEQUENCE IF EXISTS public.support_tickets_ref_seq;
