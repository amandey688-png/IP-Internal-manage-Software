-- ============================================================================
-- 1) Delete delegation task by reference number
-- 2) Regularise reference numbers for that prefix (DEL-ADRIJA-001, 002, 003...)
-- Run in Supabase SQL Editor.
-- ============================================================================

-- Step 1: Delete the specific delegation task
DELETE FROM public.delegation_tasks
WHERE reference_no = 'DEL-ADRIJA-002';

-- Step 2: Regularise reference numbers for DEL-ADRIJA-* (avoid UNIQUE violation by using temp values first)
-- 2a) Set all DEL-ADRIJA-* to temporary refs
UPDATE public.delegation_tasks
SET reference_no = 'DEL-ADRIJA-TMP-' || id::text
WHERE reference_no LIKE 'DEL-ADRIJA-%';

-- 2b) Assign sequential reference numbers by created_at order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM public.delegation_tasks
  WHERE reference_no LIKE 'DEL-ADRIJA-TMP-%'
)
UPDATE public.delegation_tasks t
SET reference_no = 'DEL-ADRIJA-' || LPAD(o.rn::text, 3, '0')
FROM ordered o
WHERE t.id = o.id;
