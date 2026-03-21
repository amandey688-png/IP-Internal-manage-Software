-- =============================================================================
-- Success / Performance Monitoring – DELETE old data (Supabase SQL Editor)
-- Order respects FKs: followups → ticket_features → training → monitoring
-- =============================================================================
-- BACK UP first if you need any of this data. This does NOT delete companies
-- or feature_list (master features).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- OPTION A — Remove ALL rows (recommended: one CASCADE from root)
-- Works when FKs use ON DELETE CASCADE from performance_monitoring downward.
-- -----------------------------------------------------------------------------
BEGIN;

DELETE FROM public.performance_monitoring;

-- If DELETE fails with FK violation, use OPTION B below instead.

COMMIT;

-- -----------------------------------------------------------------------------
-- OPTION B — Explicit order (use if OPTION A fails or you prefer explicit deletes)
-- -----------------------------------------------------------------------------
/*
BEGIN;

DELETE FROM public.feature_followups
WHERE ticket_feature_id IN (
  SELECT tf.id FROM public.ticket_features tf
  JOIN public.performance_training pt ON pt.id = tf.training_id
);

DELETE FROM public.ticket_features
WHERE training_id IN (SELECT id FROM public.performance_training);

DELETE FROM public.performance_training;

DELETE FROM public.performance_monitoring;

COMMIT;
*/

-- -----------------------------------------------------------------------------
-- OPTION C — Only delete Success “SUCC-” seeded / numbered tickets (keep other tests)
-- -----------------------------------------------------------------------------
/*
BEGIN;

DELETE FROM public.feature_followups
WHERE ticket_feature_id IN (
  SELECT tf.id
  FROM public.ticket_features tf
  JOIN public.performance_training pt ON pt.id = tf.training_id
  JOIN public.performance_monitoring pm ON pm.id = pt.performance_id
  WHERE pm.reference_no ~ '^SUCC-[0-9]+$'
);

DELETE FROM public.ticket_features
WHERE training_id IN (
  SELECT pt.id
  FROM public.performance_training pt
  JOIN public.performance_monitoring pm ON pm.id = pt.performance_id
  WHERE pm.reference_no ~ '^SUCC-[0-9]+$'
);

DELETE FROM public.performance_training
WHERE performance_id IN (
  SELECT id FROM public.performance_monitoring
  WHERE reference_no ~ '^SUCC-[0-9]+$'
);

DELETE FROM public.performance_monitoring
WHERE reference_no ~ '^SUCC-[0-9]+$';

COMMIT;
*/

-- -----------------------------------------------------------------------------
-- OPTION D — Fast truncate (empty tables; resets identity if SERIAL — UUIDs unchanged)
-- -----------------------------------------------------------------------------
/*
TRUNCATE TABLE
  public.feature_followups,
  public.ticket_features,
  public.performance_training,
  public.performance_monitoring
RESTART IDENTITY CASCADE;
*/

-- Verify (should be 0)
-- SELECT
--   (SELECT COUNT(*) FROM public.performance_monitoring) AS pm,
--   (SELECT COUNT(*) FROM public.performance_training) AS pt,
--   (SELECT COUNT(*) FROM public.ticket_features) AS tf,
--   (SELECT COUNT(*) FROM public.feature_followups) AS ff;
