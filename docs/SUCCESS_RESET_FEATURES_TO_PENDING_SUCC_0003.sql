-- Reset specific Success / Performance Monitoring features back to Pending for reference SUCC-0003
-- Run in Supabase SQL Editor after reviewing the PREVIEW queries.
--
-- Your screenshots show: RFQ, QC, Scrap — adjust the IN (...) list if the 4th feature name differs.
-- The app treats a feature as "completed" in Followup if there is at least one
-- feature_followups row with status = 'completed' (see backend _compute_current_stage).

-- =============================================================================
-- 1) PREVIEW — confirm ticket + the four ticket_features (ids + feature names)
-- =============================================================================
SELECT
  pm.reference_no,
  pm.id AS performance_id,
  fl.name AS feature_name,
  tf.id AS ticket_feature_id,
  tf.status AS ticket_feature_status,
  (SELECT COUNT(*) FROM public.feature_followups ff WHERE ff.ticket_feature_id = tf.id) AS followup_rows
FROM public.performance_monitoring pm
JOIN public.performance_training pt ON pt.performance_id = pm.id
JOIN public.ticket_features tf ON tf.training_id = pt.id
JOIN public.feature_list fl ON fl.id = tf.feature_id
WHERE pm.reference_no = 'SUCC-0003'
ORDER BY fl.name;

-- =============================================================================
-- 2) OPTIONAL — list follow-up rows you are about to remove (audit)
-- =============================================================================
SELECT ff.*
FROM public.feature_followups ff
JOIN public.ticket_features tf ON tf.id = ff.ticket_feature_id
JOIN public.performance_training pt ON pt.id = tf.training_id
JOIN public.performance_monitoring pm ON pm.id = pt.performance_id
JOIN public.feature_list fl ON fl.id = tf.feature_id
WHERE pm.reference_no = 'SUCC-0003'
  AND fl.name IN ('RFQ', 'QC', 'Scrap');  -- add 4th feature name here, e.g. 'Fourth Name'

-- =============================================================================
-- 3) DELETE follow-up history for those features (so UI no longer shows completed steps)
--    Order: child tables first (FKs).
-- =============================================================================
DELETE FROM public.success_followup_click_events ff
WHERE ff.ticket_feature_id IN (
  SELECT tf.id
  FROM public.ticket_features tf
  JOIN public.performance_training pt ON pt.id = tf.training_id
  JOIN public.performance_monitoring pm ON pm.id = pt.performance_id
  JOIN public.feature_list fl ON fl.id = tf.feature_id
  WHERE pm.reference_no = 'SUCC-0003'
    AND fl.name IN ('RFQ', 'QC', 'Scrap')  -- add 4th feature name
);

DELETE FROM public.feature_followups ff
WHERE ff.ticket_feature_id IN (
  SELECT tf.id
  FROM public.ticket_features tf
  JOIN public.performance_training pt ON pt.id = tf.training_id
  JOIN public.performance_monitoring pm ON pm.id = pt.performance_id
  JOIN public.feature_list fl ON fl.id = tf.feature_id
  WHERE pm.reference_no = 'SUCC-0003'
    AND fl.name IN ('RFQ', 'QC', 'Scrap')  -- add 4th feature name
);

-- =============================================================================
-- 4) Set ticket_features back to Pending (capital P — matches app inserts)
--    NOTE: In PostgreSQL you must NOT reference the UPDATE target (tf) inside
--    JOIN ... ON in the FROM list — use comma-FROM + join conditions in WHERE.
-- =============================================================================
UPDATE public.ticket_features tf
SET status = 'Pending'
FROM public.performance_training pt,
     public.performance_monitoring pm,
     public.feature_list fl
WHERE tf.training_id = pt.id
  AND pt.performance_id = pm.id
  AND tf.feature_id = fl.id
  AND pm.reference_no = 'SUCC-0003'
  AND fl.name IN ('RFQ', 'QC', 'Scrap');  -- add 4th feature name

-- =============================================================================
-- 5) If this ticket was marked fully completed, move it back to in_progress
-- =============================================================================
UPDATE public.performance_monitoring
SET completion_status = 'in_progress',
    updated_at = NOW()
WHERE reference_no = 'SUCC-0003'
  AND completion_status = 'completed';

-- =============================================================================
-- 6) OPTIONAL — refresh total % on training when no follow-ups remain for the ticket
--    Set to initial_percentage, or 0 if you prefer a full reset (adjust as needed).
-- =============================================================================
/*
UPDATE public.performance_training pt
SET
  total_percentage = COALESCE(pt.initial_percentage, 0),
  updated_at = NOW()
FROM public.performance_monitoring pm
WHERE pt.performance_id = pm.id
  AND pm.reference_no = 'SUCC-0003'
  AND NOT EXISTS (
    SELECT 1
    FROM public.ticket_features tf
    JOIN public.feature_followups ff ON ff.ticket_feature_id = tf.id
    WHERE tf.training_id = pt.id
  );
*/

-- Re-run PREVIEW (step 1) to verify statuses and followup_rows = 0 for those features.
