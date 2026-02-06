# Quick Reference Guide

## Role Permissions Matrix

| Action | User | Approver | Admin | Master Admin |
|--------|------|----------|-------|--------------|
| Create Ticket | ✅ | ✅ | ✅ | ✅ |
| View Own Tickets | ✅ | ✅ | ✅ | ✅ |
| View All Tickets | ❌ | ✅ (read) | ✅ | ✅ |
| Update Own Tickets | ✅ | ✅ | ✅ | ✅ |
| Update Any Ticket | ❌ | ❌ | ✅ | ✅ |
| Delete Tickets | ❌ | ❌ | ✅ | ✅ |
| Approve Features | ❌ | ✅ | ✅ | ✅ |
| Manage SLA Rules | ❌ | ❌ | ✅ | ✅ |
| Manage Staging | ❌ | ❌ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ✅ | ✅ |
| Change User Roles | ❌ | ❌ | ❌ | ✅ |
| Delete Users | ❌ | ❌ | ❌ | ✅ |

## Ticket Types & SLA Defaults

| Type | Response Time | Resolution Time |
|------|---------------|-----------------|
| Bug | 24 hours | 72 hours |
| Feature | 48 hours | 7 days |
| Chore | 72 hours | 14 days |

## Ticket Status Flow

```
open → in_progress → resolved → closed
  ↓                    ↓
cancelled          (can reopen)
```

## Feature Approval Status Flow

```
pending → approved → staging → production
    ↓
rejected
```

## Deployment Status Flow

```
pending → in_progress → completed
    ↓                    ↓
failed              rolled_back
```

## API Endpoint Quick Reference

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token

### Tickets
- `GET /api/v1/tickets` - List tickets (with filters)
- `POST /api/v1/tickets` - Create ticket
- `GET /api/v1/tickets/{id}` - Get ticket details
- `PUT /api/v1/tickets/{id}` - Update ticket
- `DELETE /api/v1/tickets/{id}` - Delete ticket (Admin)
- `POST /api/v1/tickets/{id}/comments` - Add comment
- `POST /api/v1/tickets/{id}/assign` - Assign ticket

### SLA
- `GET /api/v1/sla/rules` - Get SLA rules
- `PUT /api/v1/sla/rules` - Update rules (Admin)
- `GET /api/v1/sla/tickets/{id}` - Get ticket SLA status
- `GET /api/v1/sla/metrics` - Get SLA metrics

### Approvals
- `POST /api/v1/approvals/requests` - Submit approval
- `GET /api/v1/approvals/requests` - List requests
- `POST /api/v1/approvals/requests/{id}/approve` - Approve
- `POST /api/v1/approvals/requests/{id}/reject` - Reject

### Staging
- `GET /api/v1/staging/environments` - List environments
- `POST /api/v1/staging/deployments` - Create deployment
- `GET /api/v1/staging/deployments` - List deployments
- `POST /api/v1/staging/deployments/{id}/status` - Update status

### Dashboard
- `GET /api/v1/dashboard/overview` - Dashboard data
- `GET /api/v1/dashboard/analytics/tickets` - Ticket analytics
- `GET /api/v1/dashboard/analytics/sla` - SLA analytics

## Database Tables Quick Reference

### Core Tables
- `users` - User profiles and roles
- `tickets` - Ticket entities
- `ticket_comments` - Comments
- `ticket_history` - Audit log
- `ticket_attachments` - File attachments

### SLA Tables
- `sla_rules` - SLA configuration
- `sla_tracking` - SLA monitoring
- `sla_breaches` - Breach records

### Approval Tables
- `feature_approvals` - Approval requests
- `approval_history` - Approval history

### Staging Tables
- `staging_environments` - Environments
- `deployments` - Deployment records
- `deployment_history` - Deployment history

### Other Tables
- `notifications` - User notifications
- `notification_preferences` - User preferences
- `file_metadata` - File storage metadata

## RLS Policy Patterns

### Common Patterns

**Own Records:**
```sql
USING (user_id = auth.uid())
```

**Assigned Records:**
```sql
USING (assignee_id = auth.uid())
```

**Admin Access:**
```sql
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'master_admin')
    )
)
```

**Ticket Access:**
```sql
USING (
    EXISTS (
        SELECT 1 FROM public.tickets
        WHERE id = ticket_id
        AND (
            created_by = auth.uid()
            OR assignee_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'master_admin'))
        )
    )
)
```

## Environment Variables

### Backend (.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx
DATABASE_URL=postgresql://...
JWT_SECRET=xxx
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Common Workflows

### Creating a Bug Ticket
1. User creates ticket with type="bug"
2. System creates SLA tracking (24h response, 72h resolution)
3. Ticket assigned (auto or manual)
4. First comment triggers response time tracking
5. Resolution updates SLA tracking

### Feature Approval Process
1. User creates feature ticket
2. User submits approval request
3. System assigns approver (auto or manual)
4. Approver reviews and approves/rejects
5. If approved, moves to staging workflow
6. Deployment created and tracked

### SLA Breach Detection
1. Ticket created → SLA tracking created with deadlines
2. System checks deadlines periodically
3. If deadline passed → SLA breach created
4. Notification sent to admins
5. Escalation triggered if configured

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## File Upload Limits

- Max file size: 10MB (configurable)
- Allowed types: Images, PDFs, Documents
- Storage: Supabase Storage buckets
- Access: Controlled via RLS policies

## Notification Types

- `ticket_assigned` - Ticket assigned to user
- `ticket_status_changed` - Status updated
- `comment_added` - New comment on ticket
- `sla_breach` - SLA deadline breached
- `approval_required` - Feature needs approval
- `approval_decision` - Approval approved/rejected
- `deployment_ready` - Deployment completed
- `staging_available` - Staging environment ready

## Useful Queries

### Get User's Open Tickets
```sql
SELECT * FROM tickets
WHERE (created_by = auth.uid() OR assignee_id = auth.uid())
AND status IN ('open', 'in_progress');
```

### Get SLA Breaches (Last 30 Days)
```sql
SELECT * FROM sla_breaches
WHERE created_at >= NOW() - INTERVAL '30 days'
AND resolved = FALSE;
```

### Get Pending Approvals
```sql
SELECT * FROM feature_approvals
WHERE approver_id = auth.uid()
AND status = 'pending';
```

## Deployment Checklist

- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Environment variables configured
- [ ] Supabase Auth configured (email confirmation)
- [ ] Storage buckets created
- [ ] API endpoints tested
- [ ] Frontend builds successfully
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Monitoring set up
