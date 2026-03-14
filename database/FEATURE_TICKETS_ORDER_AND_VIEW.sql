-- ============================================================================
-- 1) Why "tickets" data may not show in feature_list (Supabase Table Editor)
-- ============================================================================
-- If you are viewing a table named "feature_list" that has reference_no, title,
-- description: that is likely a VIEW or a separate table that is NOT the same
-- as public.tickets. Feature tickets live in public.tickets (type = 'feature').
--
-- To see all feature tickets from public.tickets in one place, use the view below.
-- If your "feature_list" is a view, replace it with this definition so it reads
-- from tickets and shows your uploaded data.
-- ============================================================================

-- Drop the view if it exists (only if you had an old view with same name).
-- If your feature_list is a real table (id, reference_no, title, description),
-- do NOT run DROP VIEW – instead, sync from tickets using the INSERT at the end.
DROP VIEW IF EXISTS public.feature_list_tickets CASCADE;

-- View: all feature tickets from tickets, with desired order
-- (uploaded data first; FE-0001, FE-0002, FE-0003 last)
CREATE OR REPLACE VIEW public.feature_list_tickets AS
SELECT
  id,
  reference_no,
  title,
  description,
  type,
  status,
  created_at,
  updated_at
FROM public.tickets
WHERE type = 'feature';

-- Optional: add a comment
COMMENT ON VIEW public.feature_list_tickets IS 'Feature tickets from tickets table. Use the SELECT in section 3 for order: uploaded first, FE-0001/0002/0003 last.';


-- ============================================================================
-- 2) Renumber FE-0001, FE-0002, FE-0003 so they get NEW reference numbers
--    and appear at the end (after your uploaded data)
-- ============================================================================
-- This updates the 3 tickets so they become FE-0219, FE-0220, FE-0221 (or next
-- available numbers). Run this only if you want to change their reference_no
-- permanently so they sort at the end in the table.
-- ============================================================================

-- Step 1: Move to temporary refs to avoid unique constraint
UPDATE public.tickets SET reference_no = 'FE-TMP-001' WHERE reference_no = 'FE-0001';
UPDATE public.tickets SET reference_no = 'FE-TMP-002' WHERE reference_no = 'FE-0002';
UPDATE public.tickets SET reference_no = 'FE-TMP-003' WHERE reference_no = 'FE-0003';

-- Step 2: Assign new refs at the end (after current max FE-xxxx)
WITH max_n AS (
  SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(reference_no, '^FE-', ''), '') AS INT)), 0) AS m
  FROM public.tickets WHERE reference_no ~ '^FE-[0-9]+$'
),
numbered AS (
  SELECT id, (SELECT m FROM max_n) + row_number() OVER (ORDER BY reference_no) AS new_num
  FROM public.tickets
  WHERE reference_no IN ('FE-TMP-001', 'FE-TMP-002', 'FE-TMP-003')
)
UPDATE public.tickets t
SET reference_no = 'FE-' || LPAD(n.new_num::TEXT, 4, '0')
FROM numbered n
WHERE t.id = n.id;

-- If the CTE above fails, use manual renumber (run and note n1, then run the 3 UPDATEs):
-- SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(reference_no, '^FE-', '') AS INT)), 0) + 1 AS n1 FROM public.tickets WHERE reference_no ~ '^FE-[0-9]+$';
-- UPDATE public.tickets SET reference_no = 'FE-0219' WHERE reference_no = 'FE-TMP-001';
-- UPDATE public.tickets SET reference_no = 'FE-0220' WHERE reference_no = 'FE-TMP-002';
-- UPDATE public.tickets SET reference_no = 'FE-0221' WHERE reference_no = 'FE-TMP-003';


-- ============================================================================
-- SIMPLER RENUMBER (if the Step 2 above is too complex for your Postgres)
-- ============================================================================
-- Run Step 1 first (FE-0001/0002/0003 -> FE-TMP-001/002/003), then run:

/*
UPDATE public.tickets SET reference_no = 'FE-0219' WHERE reference_no = 'FE-TMP-001';
UPDATE public.tickets SET reference_no = 'FE-0220' WHERE reference_no = 'FE-TMP-002';
UPDATE public.tickets SET reference_no = 'FE-0221' WHERE reference_no = 'FE-TMP-003';
*/
-- If FE-0219/0220/0221 already exist, use the next free numbers (e.g. 0222, 0223, 0224).
-- ============================================================================


-- ============================================================================
-- 3) Query: feature tickets with "uploaded first, FE-0001/0002/0003 last"
-- ============================================================================
-- Use this in the Supabase SQL Editor to see the list in the right order:

SELECT id, reference_no, title, description, type, status, created_at
FROM public.tickets
WHERE type = 'feature'
ORDER BY
  CASE WHEN reference_no IN ('FE-0001', 'FE-0002', 'FE-0003') THEN 1 ELSE 0 END,
  reference_no;
