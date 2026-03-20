-- Performance indexes for FMS (Supabase). Run once in SQL Editor.
-- Targets: tickets list/detail, onboarding_client_payment list + drawer lookups.

-- Tickets: list filters and sort
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets (type);
CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON tickets (company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets (updated_at DESC);

-- Tickets: section filters (chores-bugs, staging, approval, etc.)
CREATE INDEX IF NOT EXISTS idx_tickets_status_2 ON tickets (status_2) WHERE status_2 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_live_review_status ON tickets (live_review_status) WHERE live_review_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_approval_status ON tickets (approval_status) WHERE approval_status IS NOT NULL;

-- Onboarding client payment: list (order + filter by payment_received_date and genre)
CREATE INDEX IF NOT EXISTS idx_ocp_timestamp ON onboarding_client_payment (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ocp_payment_received ON onboarding_client_payment (payment_received_date) WHERE payment_received_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ocp_genre ON onboarding_client_payment (genre) WHERE genre IS NOT NULL;

-- Client payment child tables: drawer and list-stage lookups by client_payment_id
CREATE INDEX IF NOT EXISTS idx_ocp_sent_client_payment_id ON onboarding_client_payment_sent (client_payment_id);
CREATE INDEX IF NOT EXISTS idx_ocp_followups_client_payment_id ON onboarding_client_payment_followups (client_payment_id);
CREATE INDEX IF NOT EXISTS idx_ocp_followup1_client_payment_id ON onboarding_client_payment_followup1 (client_payment_id);
CREATE INDEX IF NOT EXISTS idx_ocp_intercept_client_payment_id ON onboarding_client_payment_intercept (client_payment_id);
CREATE INDEX IF NOT EXISTS idx_ocp_discontinuation_client_payment_id ON onboarding_client_payment_discontinuation (client_payment_id);

-- Dashboard payment-actions: intercept tagged to user
CREATE INDEX IF NOT EXISTS idx_ocp_intercept_tagged_user ON onboarding_client_payment_intercept (tagged_user_id) WHERE tagged_user_id IS NOT NULL;

-- Checklist: tasks by doer + list order (~1s load)
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_doer_id ON checklist_tasks (doer_id);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_created_at ON checklist_tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_task_date ON checklist_completions (task_id, occurrence_date);

-- Delegation: tasks by assignee and status (~1s load)
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_assignee_status ON delegation_tasks (assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_due_date ON delegation_tasks (due_date);

-- Admin/Master Admin: user dropdowns (checklist/delegation users list)
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_name ON user_profiles (is_active, full_name) WHERE is_active = true;

-- Backend (Render): optional env ROLE_CACHE_TTL_SEC=120 — caches role resolution for parallel API calls
-- (Master Admin / Admin opening Checklist+Delegation+Dashboard). Remove or lower TTL if you need instant role changes.
