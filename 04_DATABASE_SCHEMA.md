# Database Schema & Responsibilities

## Overview
PostgreSQL database hosted on Supabase with Row Level Security (RLS) policies for data access control.

## Database Schema Design

### Core Tables

#### 1. users (extends Supabase auth.users)
**Purpose**: User profiles and role management
**Columns**:
```sql
CREATE TABLE public.users (
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

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
```

**RLS Policies**:
- Users can read their own profile
- Admins can read all users
- Users can update their own profile (except role)
- Master Admin can update any user's role

**Module Responsibility**: Authentication Module

---

#### 2. tickets
**Purpose**: Core ticket entity
**Columns**:
```sql
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE, -- Format: TKT-001, TKT-002
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

CREATE INDEX idx_tickets_type ON public.tickets(type);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_assignee ON public.tickets(assignee_id);
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX idx_tickets_number ON public.tickets(ticket_number);
```

**RLS Policies**:
- Users can create tickets
- Users can read tickets assigned to them or created by them
- Admins can read all tickets
- Assignees can update tickets assigned to them
- Admins can update any ticket

**Module Responsibility**: Ticket Management Module

---

#### 3. ticket_comments
**Purpose**: Comments and discussions on tickets
**Columns**:
```sql
CREATE TABLE public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal comments visible only to admins/assignees
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_comments_ticket ON public.ticket_comments(ticket_id);
CREATE INDEX idx_comments_user ON public.ticket_comments(user_id);
CREATE INDEX idx_comments_created_at ON public.ticket_comments(created_at);
```

**RLS Policies**:
- Users can read comments on tickets they have access to
- Internal comments visible only to admins and ticket assignees
- Users can create comments on accessible tickets
- Users can update/delete their own comments

**Module Responsibility**: Ticket Management Module

---

#### 4. ticket_history
**Purpose**: Audit log for ticket changes
**Columns**:
```sql
CREATE TABLE public.ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type TEXT NOT NULL, -- 'status_change', 'assignment', 'priority_change', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_history_ticket ON public.ticket_history(ticket_id);
CREATE INDEX idx_history_created_at ON public.ticket_history(created_at);
```

**RLS Policies**:
- Users can read history for tickets they have access to
- System automatically creates history entries (no direct user insert)

**Module Responsibility**: Ticket Management Module

---

#### 5. ticket_attachments
**Purpose**: File attachments for tickets
**Columns**:
```sql
CREATE TABLE public.ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    file_id UUID NOT NULL, -- References file_metadata.id
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_ticket ON public.ticket_attachments(ticket_id);
CREATE INDEX idx_attachments_file ON public.ticket_attachments(file_id);
```

**RLS Policies**:
- Users can read attachments for tickets they have access to
- Users can upload attachments to accessible tickets
- Users can delete attachments they uploaded

**Module Responsibility**: Ticket Management Module, File Management Module

---

#### 6. sla_rules
**Purpose**: SLA configuration rules per ticket type
**Columns**:
```sql
CREATE TABLE public.sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type TEXT NOT NULL UNIQUE CHECK (ticket_type IN ('bug', 'feature', 'chore')),
    response_time_hours INTEGER NOT NULL, -- Hours to first response
    resolution_time_hours INTEGER NOT NULL, -- Hours to resolution
    escalation_enabled BOOLEAN DEFAULT TRUE,
    escalation_time_hours INTEGER, -- Hours before escalation
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

CREATE INDEX idx_sla_rules_type ON public.sla_rules(ticket_type);
```

**RLS Policies**:
- All authenticated users can read active SLA rules
- Only Admins can create/update SLA rules

**Module Responsibility**: SLA & Delay Calculation Module

---

#### 7. sla_tracking
**Purpose**: SLA tracking per ticket
**Columns**:
```sql
CREATE TABLE public.sla_tracking (
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

CREATE INDEX idx_sla_tracking_ticket ON public.sla_tracking(ticket_id);
CREATE INDEX idx_sla_tracking_status ON public.sla_tracking(sla_status);
CREATE INDEX idx_sla_tracking_deadlines ON public.sla_tracking(response_deadline, resolution_deadline);
```

**RLS Policies**:
- Users can read SLA tracking for tickets they have access to
- System automatically creates/updates tracking (no direct user insert)

**Module Responsibility**: SLA & Delay Calculation Module

---

#### 8. sla_breaches
**Purpose**: Historical record of SLA breaches
**Columns**:
```sql
CREATE TABLE public.sla_breaches (
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

CREATE INDEX idx_breaches_ticket ON public.sla_breaches(ticket_id);
CREATE INDEX idx_breaches_type ON public.sla_breaches(breach_type);
CREATE INDEX idx_breaches_created_at ON public.sla_breaches(created_at);
```

**RLS Policies**:
- Admins can read all breaches
- Users can read breaches for their own tickets
- System automatically creates breaches (no direct user insert)

**Module Responsibility**: SLA & Delay Calculation Module

---

#### 9. feature_approvals
**Purpose**: Feature request approval workflow
**Columns**:
```sql
CREATE TABLE public.feature_approvals (
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

CREATE INDEX idx_approvals_ticket ON public.feature_approvals(ticket_id);
CREATE INDEX idx_approvals_approver ON public.feature_approvals(approver_id);
CREATE INDEX idx_approvals_status ON public.feature_approvals(status);
```

**RLS Policies**:
- Users can read approvals for tickets they have access to
- Approvers can read pending approvals assigned to them
- Users can create approval requests for their feature tickets
- Approvers can update approvals assigned to them

**Module Responsibility**: Feature Approval Workflow Module

---

#### 10. approval_history
**Purpose**: History of approval status changes
**Columns**:
```sql
CREATE TABLE public.approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID NOT NULL REFERENCES public.feature_approvals(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_history_approval ON public.approval_history(approval_id);
CREATE INDEX idx_approval_history_created_at ON public.approval_history(created_at);
```

**RLS Policies**:
- Users can read history for approvals they have access to
- System automatically creates history entries

**Module Responsibility**: Feature Approval Workflow Module

---

#### 11. staging_environments
**Purpose**: Staging environment management
**Columns**:
```sql
CREATE TABLE public.staging_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'unavailable')),
    current_deployment_id UUID, -- References deployments.id
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staging_status ON public.staging_environments(status);
```

**RLS Policies**:
- All authenticated users can read environments
- Only Admins can create/update environments

**Module Responsibility**: Staging Workflow Module

---

#### 12. deployments
**Purpose**: Deployment tracking
**Columns**:
```sql
CREATE TABLE public.deployments (
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

CREATE INDEX idx_deployments_ticket ON public.deployments(ticket_id);
CREATE INDEX idx_deployments_environment ON public.deployments(environment_id);
CREATE INDEX idx_deployments_status ON public.deployments(status);
CREATE INDEX idx_deployments_created_at ON public.deployments(created_at);
```

**RLS Policies**:
- Users can read deployments for tickets they have access to
- Admins can create/update deployments
- Users can create deployment requests for approved features

**Module Responsibility**: Staging Workflow Module

---

#### 13. deployment_history
**Purpose**: Deployment status change history
**Columns**:
```sql
CREATE TABLE public.deployment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES public.deployments(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deployment_history_deployment ON public.deployment_history(deployment_id);
```

**RLS Policies**:
- Users can read history for deployments they have access to
- System automatically creates history entries

**Module Responsibility**: Staging Workflow Module

---

#### 14. notifications
**Purpose**: In-app notifications
**Columns**:
```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'ticket_assigned', 'sla_breach', 'approval_required', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_type TEXT, -- 'ticket', 'approval', 'deployment', etc.
    related_entity_id UUID,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
```

**RLS Policies**:
- Users can only read their own notifications
- Users can update their own notifications (mark as read)
- System automatically creates notifications (no direct user insert)

**Module Responsibility**: Notification Module

---

#### 15. notification_preferences
**Purpose**: User notification preferences
**Columns**:
```sql
CREATE TABLE public.notification_preferences (
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

CREATE INDEX idx_notification_prefs_user ON public.notification_preferences(user_id);
```

**RLS Policies**:
- Users can read/update their own preferences
- System can read preferences for sending notifications

**Module Responsibility**: Notification Module

---

#### 16. file_metadata
**Purpose**: File metadata and storage references
**Columns**:
```sql
CREATE TABLE public.file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_uploaded_by ON public.file_metadata(uploaded_by);
CREATE INDEX idx_files_created_at ON public.file_metadata(created_at);
```

**RLS Policies**:
- Users can read files they uploaded
- Users can read files attached to tickets they have access to
- Users can upload files
- Users can delete files they uploaded

**Module Responsibility**: File Management Module

---

## Database Functions & Triggers

### 1. Auto-generate Ticket Number
```sql
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

CREATE TRIGGER trigger_generate_ticket_number
    BEFORE INSERT ON public.tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();
```

### 2. Auto-create SLA Tracking
```sql
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

CREATE TRIGGER trigger_create_sla_tracking
    AFTER INSERT ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_sla_tracking();
```

### 3. Update SLA Tracking on First Response
```sql
CREATE OR REPLACE FUNCTION update_sla_first_response()
RETURNS TRIGGER AS $$
DECLARE
    tracking RECORD;
BEGIN
    -- Check if this is the first comment on the ticket
    IF NOT EXISTS (
        SELECT 1 FROM public.ticket_comments
        WHERE ticket_id = NEW.ticket_id
        AND created_at < NEW.created_at
    ) THEN
        UPDATE public.sla_tracking
        SET first_response_at = NEW.created_at,
            response_delay_hours = EXTRACT(EPOCH FROM (NEW.created_at - response_deadline)) / 3600,
            sla_status = CASE
                WHEN NEW.created_at > response_deadline THEN 'breached'
                WHEN NEW.created_at > response_deadline - INTERVAL '2 hours' THEN 'at_risk'
                ELSE 'compliant'
            END,
            updated_at = NOW()
        WHERE ticket_id = NEW.ticket_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sla_first_response
    AFTER INSERT ON public.ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_sla_first_response();
```

### 4. Update SLA Tracking on Resolution
```sql
CREATE OR REPLACE FUNCTION update_sla_resolution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        UPDATE public.sla_tracking
        SET resolved_at = NEW.resolved_at,
            resolution_delay_hours = EXTRACT(EPOCH FROM (NEW.resolved_at - resolution_deadline)) / 3600,
            sla_status = CASE
                WHEN NEW.resolved_at > resolution_deadline THEN 'breached'
                WHEN NEW.resolved_at > resolution_deadline - INTERVAL '4 hours' THEN 'at_risk'
                ELSE 'compliant'
            END,
            updated_at = NOW()
        WHERE ticket_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sla_resolution
    AFTER UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_sla_resolution();
```

### 5. Create Ticket History Entry
```sql
CREATE OR REPLACE FUNCTION create_ticket_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.ticket_history (ticket_id, changed_by, field_name, new_value, change_type)
        VALUES (NEW.id, NEW.created_by, 'status', NEW.status, 'status_change');
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO public.ticket_history (ticket_id, changed_by, field_name, old_value, new_value, change_type)
            VALUES (NEW.id, auth.uid(), 'status', OLD.status, NEW.status, 'status_change');
        END IF;
        
        IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
            INSERT INTO public.ticket_history (ticket_id, changed_by, field_name, old_value, new_value, change_type)
            VALUES (NEW.id, auth.uid(), 'assignee_id', OLD.assignee_id::TEXT, NEW.assignee_id::TEXT, 'assignment');
        END IF;
        
        IF OLD.priority != NEW.priority THEN
            INSERT INTO public.ticket_history (ticket_id, changed_by, field_name, old_value, new_value, change_type)
            VALUES (NEW.id, auth.uid(), 'priority', OLD.priority, NEW.priority, 'priority_change');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_ticket_history
    AFTER INSERT OR UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_ticket_history();
```

### 6. Updated At Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER trigger_update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to other tables)
```

## Database Views

### 1. Ticket Summary View
```sql
CREATE VIEW ticket_summary AS
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
```

### 2. Dashboard Statistics View
```sql
CREATE VIEW dashboard_stats AS
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
```

## Module Database Responsibilities

| Module | Primary Tables | Read Access | Write Access |
|--------|---------------|-------------|--------------|
| Authentication | users | Own profile, All (Admin) | Own profile, All (Admin) |
| Ticket Management | tickets, ticket_comments, ticket_history, ticket_attachments | Own/Assigned tickets, All (Admin) | Own/Assigned tickets, All (Admin) |
| SLA & Delay | sla_rules, sla_tracking, sla_breaches | All active rules, Own tickets | Rules (Admin), Tracking (System) |
| Feature Approval | feature_approvals, approval_history | Own/Assigned approvals | Create requests, Update assigned |
| Staging Workflow | staging_environments, deployments, deployment_history | All environments, Own tickets | Environments (Admin), Deployments (Admin/User) |
| Dashboard | All tables (read-only) | Aggregated data | None |
| Notifications | notifications, notification_preferences | Own notifications | Own preferences, System creates |
| File Management | file_metadata | Own files, Ticket files | Own files |
