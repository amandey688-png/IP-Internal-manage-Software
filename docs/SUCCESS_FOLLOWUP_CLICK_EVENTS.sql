-- Optional: log "Add followup for this feature" clicks for Success KPI (Training Follow-up)
-- Run in Supabase SQL Editor once.

CREATE TABLE IF NOT EXISTS public.success_followup_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_feature_id UUID NOT NULL REFERENCES public.ticket_features(id) ON DELETE CASCADE,
  performance_id UUID NOT NULL REFERENCES public.performance_monitoring(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_success_followup_clicks_tf ON public.success_followup_click_events(ticket_feature_id);
CREATE INDEX IF NOT EXISTS idx_success_followup_clicks_time ON public.success_followup_click_events(clicked_at);

ALTER TABLE public.success_followup_click_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS success_followup_clicks_all ON public.success_followup_click_events;
CREATE POLICY success_followup_clicks_all ON public.success_followup_click_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
