-- ============================================================================
-- SUCCESS MODULE - Performance Monitoring Part 4
-- ============================================================================
-- Run AFTER SUCCESS_PERFORMANCE_MONITORING.sql and SUCCESS_PERFORMANCE_PART2_PART3.sql
-- Adds: initial_percentage (1st time user %), features_committed_at (24hr lock)
-- ============================================================================

-- initial_percentage: user enters 1st time; remaining (100 - initial) divided equally among features
ALTER TABLE public.performance_training
ADD COLUMN IF NOT EXISTS initial_percentage NUMERIC(5,2) DEFAULT 0 CHECK (initial_percentage >= 0 AND initial_percentage <= 100);

-- features_committed_at: when user first saved "Feature Committed for Use"; lock after 24hr
ALTER TABLE public.performance_training
ADD COLUMN IF NOT EXISTS features_committed_at TIMESTAMPTZ;
