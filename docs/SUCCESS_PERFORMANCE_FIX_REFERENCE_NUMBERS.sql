-- =============================================================================
-- Success / Performance Monitoring – Find & fix mismatched reference_no
-- Expected format: SUCC-0001, SUCC-0002, … (global sequence, 4-digit pad)
-- Run in Supabase SQL Editor. BACK UP first if production.
--
-- If every company shows XXXX0001 (SHIK0001, DINE0001, …): the DB function
-- generate_performance_reference() was the OLD “4-letter prefix + per-company
-- counter”. Fix the function + renumber rows — see SUCCESS_PERFORMANCE_SUPABASE_GLOBAL_REFS.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) SHOW rows that are NOT valid SUCC references (legacy SHIK0001, VRAJ0001, etc.)
-- -----------------------------------------------------------------------------
SELECT
  id,
  reference_no AS current_ref,
  company_id,
  completion_status,
  created_at,
  'not_SUCC_format' AS issue
FROM public.performance_monitoring
WHERE reference_no !~* '^SUCC-[0-9]+$'
ORDER BY created_at;

-- -----------------------------------------------------------------------------
-- 2) SHOW duplicate reference numbers (should be empty if UNIQUE is enforced)
-- -----------------------------------------------------------------------------
SELECT reference_no, COUNT(*) AS cnt
FROM public.performance_monitoring
GROUP BY reference_no
HAVING COUNT(*) > 1;

-- -----------------------------------------------------------------------------
-- 3) SHOW "sequence mismatch" vs creation order
--    (same SUCC format but number order ≠ created_at order — e.g. re-imports/edits)
--    rn = position if we sorted by created_at; succ_num = parsed SUCC number
-- -----------------------------------------------------------------------------
WITH base AS (
  SELECT
    id,
    reference_no,
    company_id,
    completion_status,
    created_at,
    CAST(SUBSTRING(reference_no FROM '^SUCC-([0-9]+)$') AS INT) AS succ_num
  FROM public.performance_monitoring
  WHERE reference_no ~* '^SUCC-[0-9]+$'
),
ordered AS (
  SELECT
    *,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS expected_seq
  FROM base
)
SELECT
  id,
  reference_no,
  succ_num,
  expected_seq,
  CASE
    WHEN succ_num IS DISTINCT FROM expected_seq THEN 'order_mismatch'
    ELSE 'ok'
  END AS check_result,
  created_at
FROM ordered
WHERE succ_num IS DISTINCT FROM expected_seq
ORDER BY created_at;

-- Quick counts
-- SELECT
--   COUNT(*) FILTER (WHERE reference_no !~* '^SUCC-[0-9]+$') AS non_succ_rows,
--   COUNT(*) AS total
-- FROM public.performance_monitoring;

-- =============================================================================
-- 4) FIX: Renumber ALL rows to SUCC-0001 … SUCC-NNNN by created_at (then id)
--    Use only after reviewing queries above. Stops API from seeing mixed formats.
--    Temp prefix avoids UNIQUE collisions during update.
-- =============================================================================
/*
BEGIN;

UPDATE public.performance_monitoring
SET reference_no = 'TMP-' || REPLACE(id::text, '-', '')
WHERE reference_no IS NOT NULL;

WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST, id ASC) AS rn
  FROM public.performance_monitoring
)
UPDATE public.performance_monitoring pm
SET reference_no = 'SUCC-' || LPAD(o.rn::text, 4, '0')
FROM ordered o
WHERE pm.id = o.id;

COMMIT;
*/

-- =============================================================================
-- 5) OPTIONAL: Align DB function with app (global SUCC next number)
-- =============================================================================
/*
CREATE OR REPLACE FUNCTION public.generate_performance_reference(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference_no FROM LENGTH('SUCC-') + 1) AS INT)
  ), 0) + 1
  INTO next_num
  FROM public.performance_monitoring
  WHERE reference_no ~* '^SUCC-[0-9]+$';

  RETURN 'SUCC-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
*/
