-- ============================================================================
-- FMS SYSTEM - SUPABASE POSTGRES SCHEMA
-- ============================================================================
-- Complete database schema implementation with RLS-ready design
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_active ON public.users(is_active);

-- ============================================================================
-- 2. ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. ROLE_PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- ============================================================================
-- 5. USER_ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

-- ============================================================================
-- 6. COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_code ON public.companies(code);
CREATE INDEX idx_companies_active ON public.companies(is_active);

-- ============================================================================
-- 7. DIVISIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    manager_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE INDEX idx_divisions_company_id ON public.divisions(company_id);
CREATE INDEX idx_divisions_manager_id ON public.divisions(manager_id);

-- ============================================================================
-- 8. USER_COMPANY_DIVISIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_company_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id),
    UNIQUE(user_id, company_id, division_id)
);

CREATE INDEX idx_user_company_divisions_user_id ON public.user_company_divisions(user_id);
CREATE INDEX idx_user_company_divisions_company_id ON public.user_company_divisions(company_id);
CREATE INDEX idx_user_company_divisions_division_id ON public.user_company_divisions(division_id);

-- ============================================================================
-- 9. TICKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('chore', 'bug', 'feature')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled', 'on_hold')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    division_id UUID REFERENCES public.divisions(id),
    created_by UUID NOT NULL REFERENCES public.users(id),
    assignee_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tickets_company_id ON public.tickets(company_id);
CREATE INDEX idx_tickets_division_id ON public.tickets(division_id);
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX idx_tickets_type ON public.tickets(type);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_reference_no ON public.tickets(reference_no);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX idx_tickets_user_company ON public.tickets(created_by, company_id, status);
CREATE INDEX idx_tickets_assignee_company ON public.tickets(assignee_id, company_id, status);

-- ============================================================================
-- 10. TICKET_ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

CREATE INDEX idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_uploaded_by ON public.ticket_attachments(uploaded_by);

-- ============================================================================
-- 11. TICKET_COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    parent_comment_id UUID REFERENCES public.ticket_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_user_id ON public.ticket_comments(user_id);
CREATE INDEX idx_ticket_comments_parent ON public.ticket_comments(parent_comment_id);
CREATE INDEX idx_ticket_comments_created_at ON public.ticket_comments(created_at);

-- ============================================================================
-- 12. TICKET_HISTORY TABLE
-- ============================================================================
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

CREATE INDEX idx_ticket_history_ticket_id ON public.ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_changed_by ON public.ticket_history(changed_by);
CREATE INDEX idx_ticket_history_created_at ON public.ticket_history(created_at);
CREATE INDEX idx_ticket_history_change_type ON public.ticket_history(change_type);

-- ============================================================================
-- 13. FEATURE_APPROVALS TABLE
-- ============================================================================
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

CREATE INDEX idx_feature_approvals_ticket_id ON public.feature_approvals(ticket_id);
CREATE INDEX idx_feature_approvals_approver_id ON public.feature_approvals(approver_id);
CREATE INDEX idx_feature_approvals_status ON public.feature_approvals(status);
CREATE INDEX idx_feature_approvals_requested_by ON public.feature_approvals(requested_by);

-- ============================================================================
-- 14. SOLUTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    solution_number INTEGER NOT NULL CHECK (solution_number IN (1, 2)),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposed_by UUID NOT NULL REFERENCES public.users(id),
    proposed_at TIMESTAMPTZ DEFAULT NOW(),
    is_selected BOOLEAN DEFAULT FALSE,
    selected_at TIMESTAMPTZ,
    selected_by UUID REFERENCES public.users(id),
    quality_score DECIMAL(3,2),
    quality_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(ticket_id, solution_number)
);

CREATE INDEX idx_solutions_ticket_id ON public.solutions(ticket_id);
CREATE INDEX idx_solutions_proposed_by ON public.solutions(proposed_by);
CREATE INDEX idx_solutions_is_selected ON public.solutions(is_selected);
CREATE INDEX idx_solutions_ticket_selected ON public.solutions(ticket_id, is_selected);

-- ============================================================================
-- 15. SLA_RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('chore', 'bug', 'feature')),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    response_time_hours INTEGER NOT NULL,
    resolution_time_hours INTEGER NOT NULL,
    escalation_enabled BOOLEAN DEFAULT TRUE,
    escalation_time_hours INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id),
    UNIQUE(ticket_type, company_id)
);

CREATE INDEX idx_sla_rules_ticket_type ON public.sla_rules(ticket_type);
CREATE INDEX idx_sla_rules_company_id ON public.sla_rules(company_id);
CREATE INDEX idx_sla_rules_active ON public.sla_rules(is_active);

-- ============================================================================
-- 16. SLA_TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL UNIQUE REFERENCES public.tickets(id) ON DELETE CASCADE,
    response_time_planned_hours DECIMAL(10,2) NOT NULL,
    resolution_time_planned_hours DECIMAL(10,2) NOT NULL,
    response_time_actual_hours DECIMAL(10,2),
    resolution_time_actual_hours DECIMAL(10,2),
    response_delay_hours DECIMAL(10,2) DEFAULT 0,
    resolution_delay_hours DECIMAL(10,2) DEFAULT 0,
    response_deadline TIMESTAMPTZ NOT NULL,
    resolution_deadline TIMESTAMPTZ NOT NULL,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    sla_status TEXT DEFAULT 'compliant' CHECK (sla_status IN ('compliant', 'at_risk', 'breached')),
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sla_tracking_ticket_id ON public.sla_tracking(ticket_id);
CREATE INDEX idx_sla_tracking_status ON public.sla_tracking(sla_status);
CREATE INDEX idx_sla_tracking_deadlines ON public.sla_tracking(response_deadline, resolution_deadline);
CREATE INDEX idx_sla_tracking_status_deadline ON public.sla_tracking(sla_status, response_deadline, resolution_deadline);

-- ============================================================================
-- 17. SLA_BREACHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sla_breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    breach_type TEXT NOT NULL CHECK (breach_type IN ('response', 'resolution')),
    planned_time_hours DECIMAL(10,2) NOT NULL,
    actual_time_hours DECIMAL(10,2) NOT NULL,
    delay_hours DECIMAL(10,2) NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    breached_at TIMESTAMPTZ NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sla_breaches_ticket_id ON public.sla_breaches(ticket_id);
CREATE INDEX idx_sla_breaches_type ON public.sla_breaches(breach_type);
CREATE INDEX idx_sla_breaches_created_at ON public.sla_breaches(created_at);
CREATE INDEX idx_sla_breaches_resolved ON public.sla_breaches(resolved);

-- ============================================================================
-- 18. STAGING_TICKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staging_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL UNIQUE REFERENCES public.tickets(id) ON DELETE CASCADE,
    staging_environment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
    version TEXT,
    deployment_notes TEXT,
    deployed_by UUID REFERENCES public.users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rollback_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staging_tickets_ticket_id ON public.staging_tickets(ticket_id);
CREATE INDEX idx_staging_tickets_status ON public.staging_tickets(status);
CREATE INDEX idx_staging_tickets_environment ON public.staging_tickets(staging_environment);

-- ============================================================================
-- 19. SOLUTION_QUALITY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.solution_quality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id UUID NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    quality_score DECIMAL(3,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 10),
    evaluated_by UUID NOT NULL REFERENCES public.users(id),
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    criteria_met JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    is_final BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_solution_quality_solution_id ON public.solution_quality(solution_id);
CREATE INDEX idx_solution_quality_ticket_id ON public.solution_quality(ticket_id);
CREATE INDEX idx_solution_quality_evaluated_by ON public.solution_quality(evaluated_by);
CREATE INDEX idx_solution_quality_final ON public.solution_quality(is_final);

-- ============================================================================
-- 20. DASHBOARD_AGGREGATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dashboard_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    data JSONB NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aggregate_type, company_id, division_id, period_start, period_end)
);

CREATE INDEX idx_dashboard_aggregates_type ON public.dashboard_aggregates(aggregate_type);
CREATE INDEX idx_dashboard_aggregates_company ON public.dashboard_aggregates(company_id);
CREATE INDEX idx_dashboard_aggregates_period ON public.dashboard_aggregates(period_start, period_end);
CREATE INDEX idx_dashboard_aggregates_lookup ON public.dashboard_aggregates(aggregate_type, company_id, period_start, period_end);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate ticket reference number (format: CH-0001, BU-0001, FE-0001)
CREATE OR REPLACE FUNCTION generate_ticket_reference()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
BEGIN
    CASE NEW.type
        WHEN 'chore' THEN prefix := 'CH';
        WHEN 'bug' THEN prefix := 'BU';
        WHEN 'feature' THEN prefix := 'FE';
    END CASE;
    -- Numeric part: refs like CH-0109 → number after hyphen (position 4)
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_no FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.tickets
    WHERE type = NEW.type
      AND reference_no LIKE prefix || '-%';
    NEW.reference_no := prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create SLA tracking
CREATE OR REPLACE FUNCTION create_sla_tracking()
RETURNS TRIGGER AS $$
DECLARE
    sla_rule RECORD;
BEGIN
    -- Get company-specific or global SLA rule
    SELECT * INTO sla_rule
    FROM public.sla_rules
    WHERE ticket_type = NEW.type
    AND (company_id = NEW.company_id OR company_id IS NULL)
    AND is_active = TRUE
    ORDER BY company_id DESC NULLS LAST
    LIMIT 1;
    
    IF FOUND THEN
        INSERT INTO public.sla_tracking (
            ticket_id,
            response_time_planned_hours,
            resolution_time_planned_hours,
            response_deadline,
            resolution_deadline
        ) VALUES (
            NEW.id,
            sla_rule.response_time_hours,
            sla_rule.resolution_time_hours,
            NEW.created_at + (sla_rule.response_time_hours || ' hours')::INTERVAL,
            NEW.created_at + (sla_rule.resolution_time_hours || ' hours')::INTERVAL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for ticket reference number generation
DROP TRIGGER IF EXISTS trigger_generate_ticket_reference ON public.tickets;
CREATE TRIGGER trigger_generate_ticket_reference
    BEFORE INSERT ON public.tickets
    FOR EACH ROW
    WHEN (NEW.reference_no IS NULL)
    EXECUTE FUNCTION generate_ticket_reference();

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
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON public.tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_sla_rules_updated_at ON public.sla_rules;
CREATE TRIGGER trigger_update_sla_rules_updated_at
    BEFORE UPDATE ON public.sla_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_sla_tracking_updated_at ON public.sla_tracking;
CREATE TRIGGER trigger_update_sla_tracking_updated_at
    BEFORE UPDATE ON public.sla_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_feature_approvals_updated_at ON public.feature_approvals;
CREATE TRIGGER trigger_update_feature_approvals_updated_at
    BEFORE UPDATE ON public.feature_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_staging_tickets_updated_at ON public.staging_tickets;
CREATE TRIGGER trigger_update_staging_tickets_updated_at
    BEFORE UPDATE ON public.staging_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_divisions_updated_at ON public.divisions;
CREATE TRIGGER trigger_update_divisions_updated_at
    BEFORE UPDATE ON public.divisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_roles_updated_at ON public.roles;
CREATE TRIGGER trigger_update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_ticket_comments_updated_at ON public.ticket_comments;
CREATE TRIGGER trigger_update_ticket_comments_updated_at
    BEFORE UPDATE ON public.ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default roles
INSERT INTO public.roles (name, description, is_system_role) VALUES
    ('user', 'Standard user with basic permissions', TRUE),
    ('approver', 'Can approve feature requests', TRUE),
    ('admin', 'Administrative access within company', TRUE),
    ('master_admin', 'Full system access', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default SLA rules (global)
INSERT INTO public.sla_rules (ticket_type, response_time_hours, resolution_time_hours, escalation_enabled, escalation_time_hours)
VALUES
    ('chore', 72, 336, TRUE, 60),      -- 72h response, 14 days resolution
    ('bug', 24, 72, TRUE, 18),         -- 24h response, 3 days resolution
    ('feature', 48, 168, TRUE, 36)     -- 48h response, 7 days resolution
ON CONFLICT (ticket_type, company_id) DO NOTHING;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_aggregates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTE: RLS Policies should be created separately
-- See DATABASE_SCHEMA_DESIGN.md for complete policy definitions
-- ============================================================================
