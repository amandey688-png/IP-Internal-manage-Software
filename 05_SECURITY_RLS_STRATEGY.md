# Security & Row Level Security (RLS) Strategy

## Overview
Comprehensive security strategy leveraging Supabase Auth, Row Level Security (RLS), and API-level authorization to protect data and ensure proper access control.

## Security Layers

### Layer 1: Network Security
- **HTTPS/TLS**: All communications encrypted in transit
- **CORS**: Configured for Next.js frontend domain only
- **Rate Limiting**: API-level rate limiting per user/IP
- **DDoS Protection**: Cloud provider DDoS mitigation

### Layer 2: Authentication
- **Supabase Auth**: Email confirmation flow (NO OTP)
- **JWT Tokens**: Short-lived access tokens with refresh tokens
- **Session Management**: Secure session handling
- **Password Policy**: Enforced by Supabase Auth

### Layer 3: Authorization (RBAC)
- **Role-Based Access Control**: Four roles (User, Approver, Admin, Master Admin)
- **API-Level Authorization**: FastAPI middleware checks roles
- **Permission Matrix**: Defined permissions per role

### Layer 4: Data Security (RLS)
- **Row Level Security**: Database-level access control
- **Policy-Based Access**: Granular policies per table
- **Dynamic Policies**: Policies based on user context

### Layer 5: Application Security
- **Input Validation**: Pydantic models for all inputs
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token-based CSRF protection

## Role Definitions

### 1. User (Default Role)
**Permissions**:
- Create tickets
- View own tickets and assigned tickets
- Add comments to accessible tickets
- Upload files to tickets
- View own profile
- Update own profile (except role)
- View dashboard (own data)
- Request feature approvals
- View notification preferences
- Update notification preferences

**Restrictions**:
- Cannot view other users' tickets (unless assigned)
- Cannot delete tickets
- Cannot change ticket status to closed
- Cannot access admin features

### 2. Approver
**Inherits**: All User permissions
**Additional Permissions**:
- View all feature approval requests
- Approve/reject feature requests assigned to them
- View approval history
- View all tickets (read-only for context)

**Restrictions**:
- Cannot modify tickets directly
- Cannot access admin features

### 3. Admin
**Inherits**: All Approver permissions
**Additional Permissions**:
- View all tickets
- Update any ticket
- Assign tickets to any user
- Close/resolve tickets
- Delete tickets
- Manage SLA rules
- View SLA breaches
- Manage staging environments
- Create/update deployments
- View all users
- Send notifications
- Access full dashboard analytics
- Export reports

**Restrictions**:
- Cannot change user roles
- Cannot delete users
- Cannot access master admin features

### 4. Master Admin
**Inherits**: All Admin permissions
**Additional Permissions**:
- Change user roles
- Delete users
- Manage all system configurations
- Access audit logs
- Override any restrictions

## Row Level Security (RLS) Policies

### Policy Naming Convention
- Format: `{table}_{action}_{scope}`
- Examples: `tickets_select_own`, `users_update_admin`

### 1. Users Table Policies

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_select_own ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY users_select_admin ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'master_admin')
        )
    );

-- Users can update their own profile (except role)
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (role = (SELECT role FROM public.users WHERE id = auth.uid()))
    );

-- Master Admin can update any user's role
CREATE POLICY users_update_role_master_admin ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'master_admin'
        )
    );
```

### 2. Tickets Table Policies

```sql
-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Users can read tickets they created or are assigned to
CREATE POLICY tickets_select_own ON public.tickets
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR assignee_id = auth.uid()
    );

-- Admins can read all tickets
CREATE POLICY tickets_select_admin ON public.tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'master_admin')
        )
    );

-- Approvers can read all tickets (for context)
CREATE POLICY tickets_select_approver ON public.tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'approver'
        )
    );

-- Users can create tickets
CREATE POLICY tickets_insert_users ON public.tickets
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND is_active = TRUE
        )
    );

-- Assignees can update tickets assigned to them
CREATE POLICY tickets_update_assignee ON public.tickets
    FOR UPDATE
    USING (assignee_id = auth.uid())
    WITH CHECK (assignee_id = auth.uid());

-- Admins can update any ticket
CREATE POLICY tickets_update_admin ON public.tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'master_admin')
        )
    );

-- Admins can delete tickets
CREATE POLICY tickets_delete_admin ON public.tickets
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'master_admin')
        )
    );
```

### 3. Ticket Comments Table Policies

```sql
-- Enable RLS
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Users can read comments on tickets they have access to
CREATE POLICY comments_select_accessible ON public.ticket_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_comments.ticket_id
            AND (
                t.created_by = auth.uid()
                OR t.assignee_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                    AND role IN ('admin', 'master_admin', 'approver')
                )
            )
        )
        AND (
            NOT is_internal
            OR EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid()
                AND role IN ('admin', 'master_admin')
            )
            OR EXISTS (
                SELECT 1 FROM public.tickets
                WHERE id = ticket_comments.ticket_id
                AND assignee_id = auth.uid()
            )
        )
    );

-- Users can create comments on accessible tickets
CREATE POLICY comments_insert_accessible ON public.ticket_comments
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = ticket_comments.ticket_id
            AND (
                created_by = auth.uid()
                OR assignee_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                    AND role IN ('admin', 'master_admin')
                )
            )
        )
    );

-- Users can update their own comments
CREATE POLICY comments_update_own ON public.ticket_comments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY comments_delete_own ON public.ticket_comments
    FOR DELETE
    USING (user_id = auth.uid());
```

### 4. SLA Rules Table Policies

```sql
-- Enable RLS
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active SLA rules
CREATE POLICY sla_rules_select_active ON public.sla_rules
    FOR SELECT
    USING (is_active = TRUE);

-- Admins can read all SLA rules
CREATE POLICY sla_rules_select_admin ON public.sla_rules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'master_admin')
        )
    );

-- Only Admins can create/update SLA rules
CREATE POLICY sla_rules_modify_admin ON public.sla_rules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'master_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'master_admin')
        )
    );
```

### 5. SLA Tracking Table Policies

```sql
-- Enable RLS
ALTER TABLE public.sla_tracking ENABLE ROW LEVEL SECURITY;

-- Users can read SLA tracking for tickets they have access to
CREATE POLICY sla_tracking_select_accessible ON public.sla_tracking
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = sla_tracking.ticket_id
            AND (
                created_by = auth.uid()
                OR assignee_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                    AND role IN ('admin', 'master_admin')
                )
            )
        )
    );

-- System can insert/update (via service role)
-- Regular users cannot modify SLA tracking directly
```

### 6. Feature Approvals Table Policies

```sql
-- Enable RLS
ALTER TABLE public.feature_approvals ENABLE ROW LEVEL SECURITY;

-- Users can read approvals for tickets they have access to
CREATE POLICY approvals_select_accessible ON public.feature_approvals
    FOR SELECT
    USING (
        requested_by = auth.uid()
        OR approver_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = feature_approvals.ticket_id
            AND (
                created_by = auth.uid()
                OR assignee_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                    AND role IN ('admin', 'master_admin')
                )
            )
        )
    );

-- Users can create approval requests for their feature tickets
CREATE POLICY approvals_insert_own_features ON public.feature_approvals
    FOR INSERT
    WITH CHECK (
        requested_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = feature_approvals.ticket_id
            AND created_by = auth.uid()
            AND type = 'feature'
        )
    );

-- Approvers can update approvals assigned to them
CREATE POLICY approvals_update_approver ON public.feature_approvals
    FOR UPDATE
    USING (approver_id = auth.uid())
    WITH CHECK (approver_id = auth.uid());
```

### 7. Notifications Table Policies

```sql
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY notifications_select_own ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- System can insert notifications (via service role)
```

### 8. File Metadata Table Policies

```sql
-- Enable RLS
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

-- Users can read files they uploaded
CREATE POLICY files_select_own ON public.file_metadata
    FOR SELECT
    USING (uploaded_by = auth.uid());

-- Users can read files attached to tickets they have access to
CREATE POLICY files_select_ticket_accessible ON public.file_metadata
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ticket_attachments ta
            JOIN public.tickets t ON ta.ticket_id = t.id
            WHERE ta.file_id = file_metadata.id
            AND (
                t.created_by = auth.uid()
                OR t.assignee_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                    AND role IN ('admin', 'master_admin')
                )
            )
        )
    );

-- Users can upload files
CREATE POLICY files_insert_users ON public.file_metadata
    FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());

-- Users can delete files they uploaded
CREATE POLICY files_delete_own ON public.file_metadata
    FOR DELETE
    USING (uploaded_by = auth.uid());
```

## API-Level Authorization

### FastAPI Middleware

```python
# Example authorization middleware
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    # Verify JWT token with Supabase
    # Return user object with role
    pass

async def require_role(allowed_roles: list[str]):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Usage in endpoints
@app.get("/api/v1/users")
async def list_users(
    current_user = Depends(require_role(["admin", "master_admin"]))
):
    # Admin-only endpoint
    pass
```

### Permission Checks

```python
# Check if user can access ticket
async def can_access_ticket(user_id: str, ticket_id: str) -> bool:
    # Check if user created ticket, is assigned, or is admin
    pass

# Check if user can modify ticket
async def can_modify_ticket(user_id: str, ticket_id: str) -> bool:
    # Check if user is assignee or admin
    pass
```

## Security Best Practices

### 1. Password Security
- Enforced by Supabase Auth
- Minimum length requirements
- Complexity requirements
- Secure password hashing (bcrypt)

### 2. Token Security
- Short-lived access tokens (15 minutes)
- Refresh tokens with longer expiry
- Token rotation on refresh
- Secure token storage (httpOnly cookies recommended)

### 3. Input Validation
- All inputs validated with Pydantic
- SQL injection prevention (parameterized queries)
- XSS prevention (content sanitization)
- File upload validation (type, size limits)

### 4. Audit Logging
- All sensitive operations logged
- User actions tracked in ticket_history
- Approval history maintained
- Deployment history tracked

### 5. Error Handling
- Generic error messages to users
- Detailed errors logged server-side
- No sensitive data in error responses
- Proper HTTP status codes

### 6. Rate Limiting
- Per-user rate limits
- Per-endpoint rate limits
- IP-based rate limiting for auth endpoints
- Graceful degradation

## Service Role vs Authenticated Role

### Authenticated Role (Default)
- Used for user-facing operations
- Subject to RLS policies
- Limited permissions
- Used in FastAPI with user JWT tokens

### Service Role (Admin)
- Used for system operations
- Bypasses RLS policies
- Full database access
- Used for:
  - Creating SLA tracking records
  - Sending notifications
  - Background jobs
  - System maintenance

**Important**: Service role credentials must be kept secure and never exposed to frontend.

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Policies tested for each role
- [ ] API endpoints protected with authorization
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Service role credentials secured
- [ ] Audit logging implemented
- [ ] Error handling secure
- [ ] File uploads validated
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Token expiration configured
- [ ] Password policy enforced
