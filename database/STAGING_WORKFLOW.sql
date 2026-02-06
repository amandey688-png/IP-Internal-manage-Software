-- ============================================================================
-- Staging-based workflow for support tickets (Chores / Bug / Feature)
-- Run in Supabase SQL Editor after RUN_IN_SUPABASE.sql
-- ============================================================================

-- Stage 1: Staging
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS staging_planned TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS staging_review_actual TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS staging_review_status TEXT
  CHECK (staging_review_status IS NULL OR staging_review_status IN ('pending', 'completed'));

-- Stage 2: Live (visible when Stage 1 = Completed)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS live_planned TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS live_actual TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS live_status TEXT
  CHECK (live_status IS NULL OR live_status IN ('pending', 'completed'));

-- Stage 3: Live Review (visible when Stage 2 = Completed)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS live_review_planned TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS live_review_actual TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS live_review_status TEXT
  CHECK (live_review_status IS NULL OR live_review_status IN ('pending', 'completed'));

CREATE INDEX IF NOT EXISTS idx_tickets_staging_planned ON public.tickets(staging_planned) WHERE staging_planned IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_live_review_status ON public.tickets(live_review_status);
