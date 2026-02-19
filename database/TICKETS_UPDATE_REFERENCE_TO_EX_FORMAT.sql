-- =============================================================================
-- Update existing tickets: normalize Reference No to CH-0001, BU-0001, FE-0001
-- (no EX- prefix). Numbers 1-by-1 per type, ordered by created_at, id.
-- Run this ONCE. Then refresh the app to see updated Reference No column.
-- =============================================================================

-- Phase 1: Set every reference_no to a temporary unique value
UPDATE public.tickets
SET reference_no = 'TMP-' || id::text
WHERE reference_no IS NOT NULL;

-- Phase 2: Set to final CH-0001, BU-0001, FE-0001 (1-by-1 per type)
UPDATE public.tickets t
SET reference_no = sub.new_ref
FROM (
  SELECT
    x.id,
    CONCAT(x.prefix, '-', LPAD(x.rn::text, 4, '0')) AS new_ref
  FROM (
    SELECT
      id,
      CASE type
        WHEN 'chore' THEN 'CH'
        WHEN 'bug' THEN 'BU'
        WHEN 'feature' THEN 'FE'
        ELSE 'CH'
      END AS prefix,
      ROW_NUMBER() OVER (
        PARTITION BY type
        ORDER BY created_at ASC NULLS LAST, id ASC
      ) AS rn
    FROM public.tickets
  ) x
) sub
WHERE t.id = sub.id;

-- =============================================================================
-- Verify (run manually if needed):
-- SELECT type, COUNT(*), MIN(reference_no), MAX(reference_no)
-- FROM public.tickets GROUP BY type ORDER BY type;
-- =============================================================================
