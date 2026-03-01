-- ============================================================================
-- SUCCESS MODULE - Performance Monitoring Part 2 & 3 (Training + Followups)
-- ============================================================================
-- Run AFTER SUCCESS_PERFORMANCE_MONITORING.sql
-- Adds: ticket_features.status, feature_followups multi-row + added/total %
-- ============================================================================

-- PART 2: ticket_features - add status (default Pending)
ALTER TABLE public.ticket_features
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending'
CHECK (status IN ('Pending', 'Completed'));

-- PART 3: feature_followups - allow multiple followup rows per feature, add added_percentage & total_percentage
ALTER TABLE public.feature_followups
ADD COLUMN IF NOT EXISTS added_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS total_percentage NUMERIC(5,2);

-- Remove UNIQUE so we can have multiple followup entries per ticket_feature
ALTER TABLE public.feature_followups DROP CONSTRAINT IF EXISTS feature_followups_ticket_feature_id_key;

-- Optional: index for "last followup per ticket_feature" queries
CREATE INDEX IF NOT EXISTS idx_feature_followups_created
ON public.feature_followups(ticket_feature_id, created_at DESC);

-- Ensure total_percentage stays 0-100 (application enforces; optional DB check)
-- ALTER TABLE public.feature_followups ADD CONSTRAINT chk_total_pct CHECK (total_percentage IS NULL OR (total_percentage >= 0 AND total_percentage <= 100));
