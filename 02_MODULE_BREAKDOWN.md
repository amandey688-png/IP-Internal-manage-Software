# Module Breakdown

## Overview
The FMS to Application system is organized into distinct modules, each handling specific business domains and responsibilities.

## Core Modules

### 1. Authentication & Authorization Module
**Purpose**: User management, authentication, and role-based access control

**Components**:
- User registration and login
- Email confirmation flow
- Password reset functionality
- Role management (Admin, Master Admin, User, Approver)
- Permission checking
- Session management

**Key Features**:
- Supabase Auth integration
- Email confirmation (NO OTP)
- JWT token handling
- Role assignment and validation
- User profile management

**Dependencies**: Supabase Auth, Database (users, roles tables)

---

### 2. Ticket Management Module
**Purpose**: Core ticket lifecycle management

**Components**:
- Ticket creation
- Ticket types (Bug, Feature, Chore)
- Ticket assignment
- Ticket status tracking
- Ticket comments and updates
- Ticket attachments
- Ticket history/audit log

**Key Features**:
- Multi-type ticket support
- Assignment workflow
- Status transitions
- Comment threading
- File attachments
- Real-time updates

**Dependencies**: Database (tickets, comments, attachments), Storage, Auth

---

### 3. SLA & Delay Calculation Module
**Purpose**: Service Level Agreement tracking and delay calculations

**Components**:
- SLA rule definition
- SLA calculation engine
- Delay tracking
- Escalation management
- SLA breach notifications
- SLA reporting

**Key Features**:
- Configurable SLA rules per ticket type
- Automatic delay calculation
- Escalation workflows
- SLA compliance tracking
- Historical SLA analytics

**Dependencies**: Database (sla_rules, sla_tracking), Ticket Module

**SLA Rules Example**:
- Bug: 24 hours response, 72 hours resolution
- Feature: 48 hours response, 7 days resolution
- Chore: 72 hours response, 14 days resolution

---

### 4. Feature Approval Workflow Module
**Purpose**: Feature request approval and staging workflow

**Components**:
- Feature request submission
- Approval workflow engine
- Approver assignment
- Approval/rejection handling
- Staging environment management
- Production deployment tracking

**Key Features**:
- Multi-level approval (if needed)
- Approver assignment logic
- Approval notifications
- Staging environment integration
- Deployment tracking

**Dependencies**: Ticket Module, Auth (Approver role), Database (approvals, staging)

**Workflow States**:
```
Draft → Submitted → Under Review → Approved → Staging → Production
                                    ↓
                                 Rejected
```

---

### 5. Staging Workflow Module
**Purpose**: Manage staging environment and deployment process

**Components**:
- Staging environment tracking
- Deployment requests
- Environment status management
- Rollback capabilities
- Deployment history
- Environment configuration

**Key Features**:
- Staging environment status
- Deployment approval
- Rollback tracking
- Environment health monitoring
- Configuration management

**Dependencies**: Feature Approval Module, Database (staging_environments, deployments)

---

### 6. Dashboard & Analytics Module
**Purpose**: Data visualization, reporting, and insights

**Components**:
- Dashboard widgets
- Ticket analytics
- SLA metrics
- User activity tracking
- Performance metrics
- Custom reports
- Data export

**Key Features**:
- Real-time dashboard updates
- Ticket statistics (open, closed, in-progress)
- SLA compliance metrics
- User performance metrics
- Trend analysis
- Custom date range filtering
- Export to CSV/PDF

**Dependencies**: All modules, Database (aggregated views)

**Dashboard Widgets**:
- Ticket overview (counts by status)
- SLA compliance rate
- Average resolution time
- Top assignees
- Ticket type distribution
- Recent activity feed

---

### 7. Notification Module
**Purpose**: User notifications and communication

**Components**:
- Email notifications
- In-app notifications
- Notification preferences
- Notification templates
- Notification history

**Key Features**:
- Email notifications (via Supabase Auth)
- Real-time in-app notifications
- User notification preferences
- Template-based notifications
- Notification batching

**Dependencies**: Supabase Auth (email), Database (notifications), Real-time

**Notification Types**:
- Ticket assigned
- Ticket status changed
- SLA breach warning
- Feature approval required
- Comment added
- Staging deployment ready

---

### 8. File Management Module
**Purpose**: File upload, storage, and management

**Components**:
- File upload handling
- File storage (Supabase Storage)
- File access control
- File metadata management
- File deletion and cleanup

**Key Features**:
- Secure file uploads
- Access control per file
- File versioning (optional)
- Storage quota management
- File preview support

**Dependencies**: Supabase Storage, Database (file_metadata), Auth

---

## Module Dependencies Graph

```
Authentication Module
    ↓
    ├──→ Ticket Management Module
    │       ↓
    │       ├──→ SLA & Delay Calculation Module
    │       ├──→ Feature Approval Workflow Module
    │       └──→ Notification Module
    │
    ├──→ Feature Approval Workflow Module
    │       ↓
    │       └──→ Staging Workflow Module
    │
    ├──→ File Management Module
    │
    └──→ Dashboard & Analytics Module
            (depends on all other modules)
```

## Module Communication Patterns

### Synchronous Communication
- **API Calls**: FastAPI endpoints for immediate responses
- **Database Queries**: Direct queries for real-time data

### Asynchronous Communication
- **Real-time Updates**: Supabase Realtime subscriptions
- **Notifications**: Background job processing
- **Email Sending**: Async email delivery

## Module Responsibilities Matrix

| Module | Create | Read | Update | Delete | Notify | Calculate |
|--------|--------|------|--------|--------|--------|-----------|
| Authentication | Users | Users | Users | Users | Auth emails | - |
| Ticket Management | Tickets | Tickets | Tickets | Tickets | Status changes | - |
| SLA & Delay | Rules | Metrics | Rules | Rules | Breaches | SLA/Delays |
| Feature Approval | Requests | Requests | Status | - | Approvals | - |
| Staging Workflow | Deployments | Status | Status | - | Deployments | - |
| Dashboard | Reports | All data | - | - | - | Aggregations |
| Notifications | Notifications | Notifications | Read status | - | Send | - |
| File Management | Files | Files | Metadata | Files | Uploads | - |

## Module Data Ownership

Each module owns its primary data entities:
- **Authentication**: users, roles, permissions
- **Ticket Management**: tickets, comments, ticket_history
- **SLA**: sla_rules, sla_tracking, sla_breaches
- **Feature Approval**: approvals, approval_history
- **Staging**: staging_environments, deployments
- **Dashboard**: (read-only access to all modules)
- **Notifications**: notifications, notification_preferences
- **File Management**: file_metadata, storage_buckets
