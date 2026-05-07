-- Performance indexes and dashboard materialized view
-- Generated for Support FMS query patterns used in backend/app/main.py and backend/app/dashboard_success_kpi.py

-- tickets: frequent filtering/sorting on created_at/type/status/company_id and workflow status columns
CREATE INDEX IF NOT EXISTS idx_tickets_created_at_desc
ON public.tickets (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_type_created_at
ON public.tickets (type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at
ON public.tickets (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_company_status
ON public.tickets (company_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_status2_created_at
ON public.tickets (status_2, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_approval_status
ON public.tickets (approval_status);

-- delegation_tasks: KPI filters and ordering
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_due_date
ON public.delegation_tasks (due_date DESC);

CREATE INDEX IF NOT EXISTS idx_delegation_tasks_delegation_on
ON public.delegation_tasks (delegation_on DESC);

CREATE INDEX IF NOT EXISTS idx_delegation_tasks_assignee_status
ON public.delegation_tasks (assignee_id, status);

CREATE INDEX IF NOT EXISTS idx_delegation_tasks_submitter_status
ON public.delegation_tasks (submitted_by, status);

-- checklist flow
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_doer_id
ON public.checklist_tasks (doer_id);

CREATE INDEX IF NOT EXISTS idx_checklist_completions_task_occ_date
ON public.checklist_completions (task_id, occurrence_date);

-- success KPI flow
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_created_at
ON public.performance_monitoring (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_training_perf_created
ON public.performance_training (performance_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_features_training_id
ON public.ticket_features (training_id);

CREATE INDEX IF NOT EXISTS idx_feature_followups_tf_created
ON public.feature_followups (ticket_feature_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_success_click_events_tf_clicked
ON public.success_followup_click_events (ticket_feature_id, clicked_at DESC);

-- payment dashboards/listing
CREATE INDEX IF NOT EXISTS idx_onboarding_client_payment_timestamp
ON public.onboarding_client_payment (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_client_payment_invoice_date
ON public.onboarding_client_payment (invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_client_payment_received_date
ON public.onboarding_client_payment (payment_received_date);

CREATE INDEX IF NOT EXISTS idx_onboarding_client_payment_company_stage
ON public.onboarding_client_payment (company_name, stage);

-- onboarding status and DB client list pages
CREATE INDEX IF NOT EXISTS idx_onboarding_payment_status_timestamp
ON public.onboarding_payment_status (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_db_client_client_onb_timestamp
ON public.db_client_client_onb (timestamp DESC);

-- lookup tables
CREATE INDEX IF NOT EXISTS idx_companies_name
ON public.companies (name);

CREATE INDEX IF NOT EXISTS idx_pages_name
ON public.pages (name);

CREATE INDEX IF NOT EXISTS idx_divisions_company_name
ON public.divisions (company_id, name);

-- Materialized view for dashboard headline KPI counts/revenue
DROP MATERIALIZED VIEW IF EXISTS public.mv_dashboard_kpi;

CREATE MATERIALIZED VIEW public.mv_dashboard_kpi AS
WITH normalized AS (
  SELECT
    id,
    invoice_date::date AS invoice_date,
    payment_received_date::date AS payment_received_date,
    CASE
      WHEN invoice_amount IS NULL THEN 0::numeric
      ELSE NULLIF(regexp_replace(invoice_amount::text, '[^0-9.]', '', 'g'), '')::numeric
    END AS invoice_amount_num
  FROM public.onboarding_client_payment
)
SELECT
  now() AS snapshot_at,
  COUNT(*)::bigint AS total_orders,
  COUNT(*) FILTER (WHERE payment_received_date IS NULL)::bigint AS pending_orders,
  COUNT(*) FILTER (WHERE payment_received_date IS NOT NULL)::bigint AS completed_orders,
  COALESCE(SUM(invoice_amount_num), 0)::numeric AS revenue_total,
  COALESCE(
    SUM(invoice_amount_num) FILTER (
      WHERE date_trunc('month', invoice_date) = date_trunc('month', CURRENT_DATE)
    ),
    0
  )::numeric AS revenue_mtd
FROM normalized;

-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY on single-row MV
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_kpi_singleton
ON public.mv_dashboard_kpi ((1));

-- Optional pg_cron schedule (Supabase):
-- 1) Enable pg_cron in Supabase Dashboard -> Database -> Extensions.
-- 2) Uncomment and run:
-- SELECT cron.schedule(
--   'refresh-mv-dashboard-kpi-every-5m',
--   '*/5 * * * *',
--   $$REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_kpi;$$
-- );
