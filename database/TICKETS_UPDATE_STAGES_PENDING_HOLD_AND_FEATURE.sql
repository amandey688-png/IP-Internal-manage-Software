-- ============================================================================
-- TICKETS: Set Chores&Bug → Stage 1 = NO, Stage 2 = Pending/HOLD
--          Set Feature → Stage 1 = Pending
-- Run once in Supabase SQL Editor. Uses current reference_no (CH-xxxx, BU-xxxx, FE-xxxx).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHORES & BUG: For all chore/bug tickets (current reference format),
--    set Stage 1 = NO and Stage 2 = Pending or HOLD (from ticket status).
--    - status_1 = 'no'  → UI shows "Stage 1" as NO
--    - status_2 = 'pending' or 'hold' → UI shows "Stage 2" as Pending / HOLD
-- ----------------------------------------------------------------------------
UPDATE public.tickets
SET
  status_1 = 'no',
  status_2 = CASE
    WHEN status = 'on_hold' THEN 'hold'
    ELSE 'pending'
  END,
  updated_at = NOW()
WHERE type IN ('chore', 'bug')
  AND reference_no ~ '^(CH|BU)-[0-9]+$';

-- ----------------------------------------------------------------------------
-- 2. FEATURE: For all feature tickets, set Stage 1 = Pending.
--    - status_2 = 'pending' → UI shows "Stage 1" with status Pending
--    - Planned = submit time (query_arrival_at/created_at), Actual set when user selects Completed/Staging/Hold
-- ----------------------------------------------------------------------------
UPDATE public.tickets
SET
  status_2 = 'pending',
  updated_at = NOW()
WHERE type = 'feature'
  AND reference_no ~ '^FE-[0-9]+$'
  AND status_2 IS NULL;

-- ============================================================================
-- Optional: List what was updated (run after the UPDATEs if you want to verify)
-- ============================================================================
-- Chores & Bug updated:
-- SELECT id, reference_no, type, status, status_1, status_2, updated_at
-- FROM public.tickets
-- WHERE type IN ('chore', 'bug') AND reference_no ~ '^(CH|BU)-[0-9]+$'
-- ORDER BY reference_no;
--
-- Feature updated:
-- SELECT id, reference_no, type, staging_review_status, status_2, staging_planned, updated_at
-- FROM public.tickets
-- WHERE type = 'feature' AND reference_no ~ '^FE-[0-9]+$'
-- ORDER BY reference_no;
