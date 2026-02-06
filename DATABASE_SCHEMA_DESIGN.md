# FMS System - Supabase Postgres Schema Design

## Overview
Comprehensive database schema for Facility Management System with support for multi-tenant structure (companies/divisions), ticket management, SLA tracking, feature approvals, and quality metrics.

---

## Table List with Columns

### 1. users
**Purpose**: User profiles extending Supabase Auth
```sql
CREATE TABLE public.users (
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
```

**Notes**:
- Extends Supabase `auth.users` table
- Password handled by Supabase Auth (not stored here)
- Email must match auth.users email

---

### 2. roles
**Purpose**: System roles definition
```sql
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Roles**:
- `user` - Standard user
- `approver` - Can approve features
- `admin` - Administrative access
- `master_admin` - Full system access

---

### 3. permissions
**Purpose**: Granular permissions
```sql
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL, -- 'ticket', 'user', 'company', etc.
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'approve'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Permissions**:
- `ticket:create`
- `ticket:read:all`
- `ticket:update:assigned`
- `feature:approve`
- `user:manage`
- `company:manage`

---

### 4. role_permissions
**Purpose**: Many-to-many relationship between roles and permissions
```sql
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);
```

---

### 5. user_roles
**Purpose**: User role assignments (supports multiple roles per user)
```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id)
);
```

---

### 6. companies
**Purpose**: Company/Organization entities
```sql
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE, -- Company code/identifier
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
```

---

### 7. divisions
**Purpose**: Divisions within companies
```sql
CREATE TABLE public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT, -- Division code (unique within company)
    description TEXT,
    manager_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);
```

---

### 8. user_company_divisions
**Purpose**: User assignments to companies/divisions (multi-tenant support)
```sql
CREATE TABLE public.user_company_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE, -- Primary company/division for user
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id),
    UNIQUE(user_id, company_id, division_id)
);
```

**Notes**:
- User can belong to multiple companies/divisions
- One primary assignment per user
- If division_id is NULL, user belongs to company only

---

### 9. tickets
**Purpose**: Core ticket entity
```sql
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT NOT NULL UNIQUE, -- CH-001, BU-001, FE-001 format
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
```

**Reference Number Format**:
- CH-001, CH-002 (Chore)
- BU-001, BU-002 (Bug)
- FE-001, FE-002 (Feature)

---

### 10. ticket_attachments
**Purpose**: File attachments for tickets
```sql
CREATE TABLE public.ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);
```

---

### 11. ticket_comments
**Purpose**: Comments and discussions on tickets
```sql
CREATE TABLE public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal comments (admins/assignees only)
    parent_comment_id UUID REFERENCES public.ticket_comments(id) ON DELETE CASCADE, -- For threaded comments
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited BOOLEAN DEFAULT FALSE
);
```

---

### 12. ticket_history
**Purpose**: Audit log for ticket changes
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
```

---

### 13. feature_approvals
**Purpose**: Feature request approval workflow
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
```

---

### 14. solutions
**Purpose**: Solution proposals for tickets (Solution 1 & Solution 2)
```sql
CREATE TABLE public.solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    solution_number INTEGER NOT NULL CHECK (solution_number IN (1, 2)),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposed_by UUID NOT NULL REFERENCES public.users(id),
    proposed_at TIMESTAMPTZ DEFAULT NOW(),
    is_selected BOOLEAN DEFAULT FALSE, -- Selected solution
    selected_at TIMESTAMPTZ,
    selected_by UUID REFERENCES public.users(id),
    quality_score DECIMAL(3,2), -- 0.00 to 10.00
    quality_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(ticket_id, solution_number)
);
```

**Notes**:
- Each ticket can have up to 2 solutions (Solution 1, Solution 2)
- Only one solution can be selected per ticket
- Quality score can be assigned after implementation

---

### 15. sla_rules
**Purpose**: SLA configuration rules per ticket type
```sql
CREATE TABLE public.sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('chore', 'bug', 'feature')),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- NULL = global rule
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
```

**Notes**:
- Company-specific SLA rules override global rules
- NULL company_id = global/default rule

---

### 16. sla_tracking
**Purpose**: SLA time tracking per ticket
```sql
CREATE TABLE public.sla_tracking (
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
```

**Calculations**:
- `response_delay_hours` = `response_time_actual_hours` - `response_time_planned_hours` (if > 0)
- `resolution_delay_hours` = `resolution_time_actual_hours` - `resolution_time_planned_hours` (if > 0)

---

### 17. sla_breaches
**Purpose**: Historical record of SLA breaches
```sql
CREATE TABLE public.sla_breaches (
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
```

---

### 18. staging_tickets
**Purpose**: Staging environment ticket tracking
```sql
CREATE TABLE public.staging_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL UNIQUE REFERENCES public.tickets(id) ON DELETE CASCADE,
    staging_environment TEXT NOT NULL, -- 'staging-1', 'staging-2', etc.
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
```

---

### 19. solution_quality
**Purpose**: Quality metrics for implemented solutions
```sql
CREATE TABLE public.solution_quality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id UUID NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    quality_score DECIMAL(3,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 10),
    evaluated_by UUID NOT NULL REFERENCES public.users(id),
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    criteria_met JSONB DEFAULT '{}'::jsonb, -- Structured quality criteria
    notes TEXT,
    is_final BOOLEAN DEFAULT FALSE -- Final quality assessment
);
```

**Quality Criteria Example**:
```json
{
  "functionality": 9.5,
  "performance": 8.0,
  "maintainability": 9.0,
  "documentation": 7.5,
  "user_satisfaction": 8.5
}
```

---

### 20. dashboard_aggregates
**Purpose**: Pre-computed aggregates for dashboard performance
```sql
CREATE TABLE public.dashboard_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type TEXT NOT NULL, -- 'ticket_stats', 'sla_compliance', 'user_performance', etc.
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    data JSONB NOT NULL, -- Aggregated metrics
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aggregate_type, company_id, division_id, period_start, period_end)
);
```

**Example Data Structure**:
```json
{
  "total_tickets": 150,
  "open_tickets": 45,
  "resolved_tickets": 60,
  "avg_resolution_hours": 48.5,
  "sla_compliance_rate": 95.5,
  "by_type": {
    "chore": 50,
    "bug": 60,
    "feature": 40
  }
}
```

---

## Relationships Diagram

```
users (1) ──┐
            ├── (M) user_roles (M) ── (1) roles
            │
            ├── (M) user_company_divisions (M) ── (1) companies
            │                                      │
            │                                      └── (1) divisions (M)
            │
            ├── (1) tickets (M) ── (1) companies
            │    │                    │
            │    ├── (M) ticket_attachments
            │    ├── (M) ticket_comments
            │    ├── (M) ticket_history
            │    ├── (1) feature_approvals
            │    ├── (M) solutions (1-2 per ticket)
            │    ├── (1) sla_tracking
            │    ├── (M) sla_breaches
            │    └── (1) staging_tickets
            │
            └── (M) solution_quality

roles (1) ── (M) role_permissions (M) ── (1) permissions

solutions (1) ── (M) solution_quality
```

**Key Relationships**:
1. **Users ↔ Companies/Divisions**: Many-to-many via `user_company_divisions`
2. **Users ↔ Roles**: Many-to-many via `user_roles`
3. **Roles ↔ Permissions**: Many-to-many via `role_permissions`
4. **Tickets → Company/Division**: Many-to-one
5. **Tickets → Solutions**: One-to-many (max 2)
6. **Tickets → SLA Tracking**: One-to-one
7. **Solutions → Quality**: One-to-many (multiple evaluations)

---

## Index Suggestions

### Primary Indexes (Already created by PRIMARY KEY)
- All `id` columns

### Foreign Key Indexes
```sql
-- Users
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_user_company_divisions_user_id ON public.user_company_divisions(user_id);
CREATE INDEX idx_user_company_divisions_company_id ON public.user_company_divisions(company_id);
CREATE INDEX idx_user_company_divisions_division_id ON public.user_company_divisions(division_id);

-- Tickets
CREATE INDEX idx_tickets_company_id ON public.tickets(company_id);
CREATE INDEX idx_tickets_division_id ON public.tickets(division_id);
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX idx_tickets_type ON public.tickets(type);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_reference_no ON public.tickets(reference_no);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at);

-- Ticket Relations
CREATE INDEX idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_user_id ON public.ticket_comments(user_id);
CREATE INDEX idx_ticket_history_ticket_id ON public.ticket_history(ticket_id);

-- Solutions
CREATE INDEX idx_solutions_ticket_id ON public.solutions(ticket_id);
CREATE INDEX idx_solutions_proposed_by ON public.solutions(proposed_by);
CREATE INDEX idx_solutions_is_selected ON public.solutions(is_selected);

-- SLA
CREATE INDEX idx_sla_tracking_ticket_id ON public.sla_tracking(ticket_id);
CREATE INDEX idx_sla_tracking_status ON public.sla_tracking(sla_status);
CREATE INDEX idx_sla_tracking_deadlines ON public.sla_tracking(response_deadline, resolution_deadline);
CREATE INDEX idx_sla_breaches_ticket_id ON public.sla_breaches(ticket_id);
CREATE INDEX idx_sla_breaches_resolved ON public.sla_breaches(resolved);

-- Staging
CREATE INDEX idx_staging_tickets_ticket_id ON public.staging_tickets(ticket_id);
CREATE INDEX idx_staging_tickets_status ON public.staging_tickets(status);

-- Dashboard
CREATE INDEX idx_dashboard_aggregates_type ON public.dashboard_aggregates(aggregate_type);
CREATE INDEX idx_dashboard_aggregates_company ON public.dashboard_aggregates(company_id);
CREATE INDEX idx_dashboard_aggregates_period ON public.dashboard_aggregates(period_start, period_end);
```

### Composite Indexes for Common Queries
```sql
-- User's tickets by company/division
CREATE INDEX idx_tickets_user_company ON public.tickets(created_by, company_id, status);
CREATE INDEX idx_tickets_assignee_company ON public.tickets(assignee_id, company_id, status);

-- SLA tracking by status and deadline
CREATE INDEX idx_sla_tracking_status_deadline ON public.sla_tracking(sla_status, response_deadline, resolution_deadline);

-- Dashboard aggregates lookup
CREATE INDEX idx_dashboard_aggregates_lookup ON public.dashboard_aggregates(aggregate_type, company_id, period_start, period_end);

-- Solutions by ticket and selection
CREATE INDEX idx_solutions_ticket_selected ON public.solutions(ticket_id, is_selected);
```

### Full-Text Search Indexes (Optional)
```sql
-- For ticket search
CREATE INDEX idx_tickets_title_search ON public.tickets USING gin(to_tsvector('english', title));
CREATE INDEX idx_tickets_description_search ON public.tickets USING gin(to_tsvector('english', description));

-- For comment search
CREATE INDEX idx_comments_content_search ON public.ticket_comments USING gin(to_tsvector('english', content));
```

---

## RLS (Row Level Security) Notes

### General RLS Strategy

1. **Enable RLS on all tables**:
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- ... (all tables)
```

2. **Use `auth.uid()` for user context**:
   - Supabase provides `auth.uid()` function that returns current authenticated user's UUID
   - Use this in RLS policies to filter by user

3. **Service Role Bypass**:
   - Service role key bypasses RLS
   - Use only for backend operations, never expose to frontend

### RLS Policy Patterns

#### 1. Users Table
```sql
-- Users can read their own profile
CREATE POLICY users_select_own ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Admins can read all users in their company
CREATE POLICY users_select_company_admin ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions ucd
            JOIN public.user_company_divisions ucd2 ON ucd2.company_id = ucd.company_id
            WHERE ucd2.user_id = auth.uid()
            AND ucd.user_id = users.id
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON r.id = ur.role_id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('admin', 'master_admin')
            )
        )
    );
```

#### 2. Companies Table
```sql
-- Users can read companies they belong to
CREATE POLICY companies_select_member ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = companies.id
        )
    );

-- Admins can read all companies
CREATE POLICY companies_select_admin ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'master_admin')
        )
    );
```

#### 3. Divisions Table
```sql
-- Users can read divisions of their companies
CREATE POLICY divisions_select_company_member ON public.divisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = divisions.company_id
        )
    );
```

#### 4. Tickets Table
```sql
-- Users can read tickets from their companies/divisions
CREATE POLICY tickets_select_company_member ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = tickets.company_id
            AND (division_id = tickets.division_id OR tickets.division_id IS NULL)
        )
        OR created_by = auth.uid()
        OR assignee_id = auth.uid()
    );

-- Users can create tickets in their companies
CREATE POLICY tickets_insert_company_member ON public.tickets
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = tickets.company_id
        )
    );

-- Assignees and admins can update tickets
CREATE POLICY tickets_update_assignee_admin ON public.tickets
    FOR UPDATE USING (
        assignee_id = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'master_admin')
        )
    );
```

#### 5. Solutions Table
```sql
-- Users can read solutions for accessible tickets
CREATE POLICY solutions_select_accessible ON public.solutions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = solutions.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );
```

#### 6. SLA Tracking Table
```sql
-- Users can read SLA tracking for accessible tickets
CREATE POLICY sla_tracking_select_accessible ON public.sla_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = sla_tracking.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );
```

#### 7. Dashboard Aggregates Table
```sql
-- Users can read aggregates for their companies
CREATE POLICY dashboard_aggregates_select_company ON public.dashboard_aggregates
    FOR SELECT USING (
        company_id IS NULL -- Global aggregates
        OR EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = dashboard_aggregates.company_id
        )
    );
```

### RLS Policy Best Practices

1. **Test Policies Thoroughly**:
   - Test with different user roles
   - Test with different company/division combinations
   - Test edge cases (NULL values, deleted records)

2. **Use EXISTS for Performance**:
   - Prefer `EXISTS` over `IN` for subqueries
   - Index foreign keys for better performance

3. **Policy Naming Convention**:
   - Format: `{table}_{action}_{scope}`
   - Example: `tickets_select_company_member`

4. **Combine Policies**:
   - Multiple policies with `OR` logic
   - More specific policies first

5. **Service Role Usage**:
   - Use service role for:
     - Background jobs
     - System operations
     - Admin operations (with caution)
   - Never expose service role to frontend

### RLS Testing Checklist

- [ ] Users can only see their own profile
- [ ] Users can only see companies/divisions they belong to
- [ ] Users can create tickets in their companies only
- [ ] Users can only see tickets from their companies
- [ ] Assignees can update assigned tickets
- [ ] Admins can see all tickets in their companies
- [ ] SLA tracking respects ticket access rules
- [ ] Solutions respect ticket access rules
- [ ] Dashboard aggregates filtered by company
- [ ] Service role bypasses all policies

---

## Additional Considerations

### 1. Reference Number Generation
Create a function to auto-generate ticket reference numbers:
```sql
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
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_no FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.tickets
    WHERE type = NEW.type;
    
    NEW.reference_no := prefix || '-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_reference
    BEFORE INSERT ON public.tickets
    FOR EACH ROW
    WHEN (NEW.reference_no IS NULL)
    EXECUTE FUNCTION generate_ticket_reference();
```

### 2. SLA Tracking Auto-Creation
```sql
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
    ORDER BY company_id DESC NULLS LAST -- Prefer company-specific over global
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
```

### 3. Updated At Triggers
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
```

### 4. Dashboard Aggregation Job
Consider creating a scheduled job (pg_cron) to pre-compute dashboard aggregates:
```sql
-- Example: Daily aggregation job
SELECT cron.schedule(
    'daily-dashboard-aggregates',
    '0 1 * * *', -- 1 AM daily
    $$
    INSERT INTO public.dashboard_aggregates (aggregate_type, period_start, period_end, period_type, data)
    SELECT 
        'ticket_stats',
        date_trunc('day', NOW() - INTERVAL '1 day'),
        date_trunc('day', NOW()),
        'daily',
        jsonb_build_object(
            'total_tickets', COUNT(*),
            'open_tickets', COUNT(*) FILTER (WHERE status = 'open'),
            'resolved_tickets', COUNT(*) FILTER (WHERE status = 'resolved')
        )
    FROM public.tickets
    WHERE created_at >= date_trunc('day', NOW() - INTERVAL '1 day')
    AND created_at < date_trunc('day', NOW())
    ON CONFLICT DO NOTHING;
    $$
);
```

---

## Summary

This schema design provides:
- ✅ Multi-tenant support (companies/divisions)
- ✅ Flexible role-based permissions
- ✅ Ticket management with auto-incrementing reference numbers
- ✅ Solution 1 & Solution 2 support
- ✅ Comprehensive SLA tracking (planned, actual, delays)
- ✅ Feature approval workflow
- ✅ Staging ticket tracking
- ✅ Solution quality metrics
- ✅ Dashboard aggregation support
- ✅ RLS-ready design with policy patterns
- ✅ Proper indexing for performance

All tables use UUID primary keys and proper foreign key relationships as required.
