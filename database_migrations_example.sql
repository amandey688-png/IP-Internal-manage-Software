-- ============================================================================
-- FMS TO APPLICATION - DATABASE MIGRATIONS
-- ============================================================================
-- This file contains example SQL migrations for setting up the database
-- Run these migrations in order in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CREATE CUSTOM TYPES (if needed)
-- ============================================================================
-- Note: Using CHECK constraints instead of ENUMs for flexibility

-- ============================================================================
-- 3. CREATE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'approver', 'admin', 'master_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'chore')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_by UUID NOT NULL REFERENCES public.users(id),
    assignee_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_tickets_type ON public.tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON public.tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON public.tickets(ticket_number);

-- Ticket comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_comments_ticket ON public.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.ticket_comments(created_at);

-- Ticket history table
CREATE TABLE IF NOT EXISTS public.ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_history_ticket ON public.ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON public.ticket_history(created_at);
CREATE INDEX IF NOT EXISTS idx_history_change_type ON public.ticket_history(change_type);

-- File metadata table
CREATE TABLE IF NOT EXISTS public.file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.file_metadata(created_at);

-- Ticket attachments table
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.file_metadata(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticket_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON public.ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_file ON public.ticket_attachments(file_id);

-- SLA rules table
CREATE TABLE IF NOT EXISTS public.sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type TEXT NOT NULL UNIQUE CHECK (ticket_type IN ('bug', 'feature', 'chore')),
    response_time_hours INTEGER NOT NULL,
    resolution_time_hours INTEGER NOT NULL,
    escalation_enabled BOOLEAN DEFAULT TRUE,
    escalation_time_hours INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_sla_rules_type ON public.sla_rules(ticket_type);
CREATE INDEX IF NOT EXISTS idx_sla_rules_active ON public.sla_rules(is_active);

-- SLA tracking table
CREATE TABLE IF NOT EXISTS public.sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL UNIQUE REFERENCES public.tickets(id) ON DELETE CASCADE,
    response_deadline TIMESTAMPTZ NOT NULL,
    resolution_deadline TIMESTAMPTZ NOT NULL,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    response_delay_hours DECIMAL(10,2) DEFAULT 0,
    resolution_delay_hours DECIMAL(10,2) DEFAULT 0,
    sla_status TEXT DEFAULT 'compliant' CHECK (sla_status IN ('compliant', 'at_risk', 'breached')),
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_tracking_ticket ON public.sla_tracking(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_status ON public.sla_tracking(sla_status);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_deadlines ON public.sla_tracking(response_deadline, resolution_deadline);

-- SLA breaches table
CREATE TABLE IF NOT EXISTS public.sla_breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    breach_type TEXT NOT NULL CHECK (breach_type IN ('response', 'resolution')),
    deadline TIMESTAMPTZ NOT NULL,
    breached_at TIMESTAMPTZ NOT NULL,
    delay_hours DECIMAL(10,2) NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breaches_ticket ON public.sla_breaches(ticket_id);
CREATE INDEX IF NOT EXISTS idx_breaches_type ON public.sla_breaches(breach_type);
CREATE INDEX IF NOT EXISTS idx_breaches_created_at ON public.sla_breaches(created_at);
CREATE INDEX IF NOT EXISTS idx_breaches_resolved ON public.sla_breaches(resolved);

-- Feature approvals table
CREATE TABLE IF NOT EXISTS public.feature_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL UNIQUE REFERENCES public.tickets(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.users(id),
    approver_id UUID NOT NULL REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    request_description TEXT,
    approver_comments TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_ticket ON public.feature_approvals(ticket_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.feature_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.feature_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON public.feature_approvals(requested_by);

-- Approval history table
CREATE TABLE IF NOT EXISTS public.approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID NOT NULL REFERENCES public.feature_approvals(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_history_approval ON public.approval_history(approval_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_created_at ON public.approval_history(created_at);

-- Staging environments table
CREATE TABLE IF NOT EXISTS public.staging_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'unavailable')),
    current_deployment_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staging_status ON public.staging_environments(status);

-- Deployments table
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id),
    environment_id UUID NOT NULL REFERENCES public.staging_environments(id),
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
    deployment_notes TEXT,
    deployed_by UUID REFERENCES public.users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rollback_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployments_ticket ON public.deployments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_deployments_environment ON public.deployments(environment_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON public.deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON public.deployments(created_at);

-- Deployment history table
CREATE TABLE IF NOT EXISTS public.deployment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES public.deployments(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployment_history_deployment ON public.deployment_history(deployment_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    email_ticket_assigned BOOLEAN DEFAULT TRUE,
    email_sla_breach BOOLEAN DEFAULT TRUE,
    email_approval_required BOOLEAN DEFAULT TRUE,
    email_deployment_ready BOOLEAN DEFAULT TRUE,
    in_app_ticket_assigned BOOLEAN DEFAULT TRUE,
    in_app_comments BOOLEAN DEFAULT TRUE,
    in_app_status_changes BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);

-- ============================================================================
-- 4. INSERT DEFAULT DATA
-- ============================================================================

-- Insert default SLA rules
INSERT INTO public.sla_rules (ticket_type, response_time_hours, resolution_time_hours, escalation_enabled, escalation_time_hours)
VALUES
    ('bug', 24, 72, TRUE, 18),
    ('feature', 48, 168, TRUE, 36), -- 168 hours = 7 days
    ('chore', 72, 336, TRUE, 60) -- 336 hours = 14 days
ON CONFLICT (ticket_type) DO NOTHING;

-- ============================================================================
-- 5. CREATE FUNCTIONS
-- ============================================================================

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.tickets;
    
    NEW.ticket_number := 'TKT-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create SLA tracking
CREATE OR REPLACE FUNCTION create_sla_tracking()
RETURNS TRIGGER AS $$
DECLARE
    sla_rule RECORD;
    response_deadline TIMESTAMPTZ;
    resolution_deadline TIMESTAMPTZ;
BEGIN
    SELECT * INTO sla_rule
    FROM public.sla_rules
    WHERE ticket_type = NEW.type AND is_active = TRUE;
    
    IF FOUND THEN
        response_deadline := NEW.created_at + (sla_rule.response_time_hours || ' hours')::INTERVAL;
        resolution_deadline := NEW.created_at + (sla_rule.resolution_time_hours || ' hours')::INTERVAL;
        
        INSERT INTO public.sla_tracking (
            ticket_id, response_deadline, resolution_deadline
        ) VALUES (
            NEW.id, response_deadline, resolution_deadline
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

-- Trigger for ticket number generation
DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON public.tickets;
CREATE TRIGGER trigger_generate_ticket_number
    BEFORE INSERT ON public.tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- Trigger for SLA tracking creation
DROP TRIGGER IF EXISTS trigger_create_sla_tracking ON public.tickets;
CREATE TRIGGER trigger_create_sla_tracking
    AFTER INSERT ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_sla_tracking();

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON public.tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_sla_rules_updated_at ON public.sla_rules;
CREATE TRIGGER trigger_update_sla_rules_updated_at
    BEFORE UPDATE ON public.sla_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_sla_tracking_updated_at ON public.sla_tracking;
CREATE TRIGGER trigger_update_sla_tracking_updated_at
    BEFORE UPDATE ON public.sla_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_feature_approvals_updated_at ON public.feature_approvals;
CREATE TRIGGER trigger_update_feature_approvals_updated_at
    BEFORE UPDATE ON public.feature_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_staging_environments_updated_at ON public.staging_environments;
CREATE TRIGGER trigger_update_staging_environments_updated_at
    BEFORE UPDATE ON public.staging_environments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_deployments_updated_at ON public.deployments;
CREATE TRIGGER trigger_update_deployments_updated_at
    BEFORE UPDATE ON public.deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER trigger_update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTE: RLS Policies should be created separately
-- See 05_SECURITY_RLS_STRATEGY.md for complete policy definitions
-- ============================================================================

-- ============================================================================
-- 8. CREATE VIEWS (Optional but recommended)
-- ============================================================================

-- Ticket summary view
CREATE OR REPLACE VIEW ticket_summary AS
SELECT 
    t.*,
    u1.full_name as creator_name,
    u2.full_name as assignee_name,
    st.sla_status,
    st.response_deadline,
    st.resolution_deadline,
    st.response_delay_hours,
    st.resolution_delay_hours,
    (SELECT COUNT(*) FROM public.ticket_comments WHERE ticket_id = t.id) as comment_count,
    (SELECT COUNT(*) FROM public.ticket_attachments WHERE ticket_id = t.id) as attachment_count
FROM public.tickets t
LEFT JOIN public.users u1 ON t.created_by = u1.id
LEFT JOIN public.users u2 ON t.assignee_id = u2.id
LEFT JOIN public.sla_tracking st ON t.id = st.ticket_id;

-- Dashboard statistics view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_tickets,
    COUNT(*) FILTER (WHERE type = 'bug') as bug_count,
    COUNT(*) FILTER (WHERE type = 'feature') as feature_count,
    COUNT(*) FILTER (WHERE type = 'chore') as chore_count,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours
FROM public.tickets
WHERE created_at >= NOW() - INTERVAL '30 days';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Create RLS policies (see 05_SECURITY_RLS_STRATEGY.md)
-- 2. Set up Supabase Storage buckets
-- 3. Configure Supabase Auth email templates
-- 4. Test database connections
-- ============================================================================
