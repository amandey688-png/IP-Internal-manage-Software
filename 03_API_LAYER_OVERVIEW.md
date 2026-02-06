# API Layer Overview

## Overview
FastAPI-based RESTful API providing business logic layer between Next.js frontend and Supabase backend.

## API Architecture

### API Structure
```
/api/v1/
├── /auth          - Authentication endpoints
├── /users         - User management
├── /tickets       - Ticket operations
├── /sla           - SLA management
├── /approvals     - Feature approvals
├── /staging       - Staging workflow
├── /dashboard     - Analytics and reports
├── /notifications - Notification management
└── /files         - File operations
```

## Authentication Endpoints

### POST /api/v1/auth/register
**Purpose**: User registration
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```
**Response**: `{ "user_id": "uuid", "email": "user@example.com", "confirmation_sent": true }`

### POST /api/v1/auth/login
**Purpose**: User login
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response**: `{ "access_token": "jwt_token", "refresh_token": "refresh_token", "user": {...} }`

### POST /api/v1/auth/logout
**Purpose**: User logout
**Headers**: `Authorization: Bearer {token}`
**Response**: `{ "message": "Logged out successfully" }`

### POST /api/v1/auth/refresh
**Purpose**: Refresh access token
**Request Body**:
```json
{
  "refresh_token": "refresh_token"
}
```
**Response**: `{ "access_token": "new_jwt_token" }`

### POST /api/v1/auth/reset-password
**Purpose**: Request password reset
**Request Body**:
```json
{
  "email": "user@example.com"
}
```
**Response**: `{ "message": "Password reset email sent" }`

### POST /api/v1/auth/confirm-email
**Purpose**: Confirm email address (via token from email)
**Request Body**:
```json
{
  "token": "confirmation_token"
}
```
**Response**: `{ "message": "Email confirmed successfully" }`

---

## User Management Endpoints

### GET /api/v1/users/me
**Purpose**: Get current user profile
**Headers**: `Authorization: Bearer {token}`
**Response**: `{ "id": "uuid", "email": "...", "full_name": "...", "role": "..." }`

### PUT /api/v1/users/me
**Purpose**: Update current user profile
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "full_name": "Updated Name",
  "avatar_url": "https://..."
}
```

### GET /api/v1/users
**Purpose**: List users (Admin only)
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?role=approver&page=1&limit=20`
**Response**: `{ "users": [...], "total": 100, "page": 1 }`

### GET /api/v1/users/{user_id}
**Purpose**: Get user by ID
**Headers**: `Authorization: Bearer {token}`

### PUT /api/v1/users/{user_id}/role
**Purpose**: Update user role (Master Admin only)
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "role": "approver"
}
```

---

## Ticket Management Endpoints

### POST /api/v1/tickets
**Purpose**: Create new ticket
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "title": "Bug: Login button not working",
  "description": "Detailed description...",
  "type": "bug",
  "priority": "high",
  "assignee_id": "uuid" // optional
}
```
**Response**: `{ "id": "uuid", "ticket_number": "TKT-001", ... }`

### GET /api/v1/tickets
**Purpose**: List tickets with filtering
**Headers**: `Authorization: Bearer {token}`
**Query Params**: 
- `?type=bug&status=open&assignee_id=uuid&page=1&limit=20`
- `?search=login&sort=created_at&order=desc`
**Response**: `{ "tickets": [...], "total": 50, "page": 1 }`

### GET /api/v1/tickets/{ticket_id}
**Purpose**: Get ticket details
**Headers**: `Authorization: Bearer {token}`
**Response**: Full ticket object with comments and history

### PUT /api/v1/tickets/{ticket_id}
**Purpose**: Update ticket
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "title": "Updated title",
  "status": "in_progress",
  "assignee_id": "uuid",
  "priority": "high"
}
```

### DELETE /api/v1/tickets/{ticket_id}
**Purpose**: Delete ticket (Admin only)
**Headers**: `Authorization: Bearer {token}`

### POST /api/v1/tickets/{ticket_id}/comments
**Purpose**: Add comment to ticket
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "content": "This is a comment",
  "is_internal": false
}
```

### GET /api/v1/tickets/{ticket_id}/comments
**Purpose**: Get ticket comments
**Headers**: `Authorization: Bearer {token}`

### POST /api/v1/tickets/{ticket_id}/assign
**Purpose**: Assign ticket to user
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "assignee_id": "uuid"
}
```

### POST /api/v1/tickets/{ticket_id}/status
**Purpose**: Update ticket status
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "status": "resolved",
  "resolution_notes": "Fixed by..."
}
```

---

## SLA Management Endpoints

### GET /api/v1/sla/rules
**Purpose**: Get SLA rules
**Headers**: `Authorization: Bearer {token}`
**Response**: `{ "rules": [{ "ticket_type": "bug", "response_time_hours": 24, ... }] }`

### PUT /api/v1/sla/rules
**Purpose**: Update SLA rules (Admin only)
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "ticket_type": "bug",
  "response_time_hours": 24,
  "resolution_time_hours": 72
}
```

### GET /api/v1/sla/tickets/{ticket_id}
**Purpose**: Get SLA status for ticket
**Headers**: `Authorization: Bearer {token}`
**Response**: 
```json
{
  "ticket_id": "uuid",
  "sla_status": "compliant",
  "response_deadline": "2024-01-15T10:00:00Z",
  "resolution_deadline": "2024-01-17T10:00:00Z",
  "response_delay_hours": 0,
  "resolution_delay_hours": 0
}
```

### GET /api/v1/sla/breaches
**Purpose**: Get SLA breaches (Admin only)
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?start_date=2024-01-01&end_date=2024-01-31`
**Response**: `{ "breaches": [...], "total": 10 }`

### GET /api/v1/sla/metrics
**Purpose**: Get SLA metrics for dashboard
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?period=30d`
**Response**: 
```json
{
  "compliance_rate": 95.5,
  "average_response_time_hours": 18.5,
  "average_resolution_time_hours": 65.2,
  "breach_count": 12
}
```

---

## Feature Approval Endpoints

### POST /api/v1/approvals/requests
**Purpose**: Submit feature for approval
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "ticket_id": "uuid",
  "description": "Feature description",
  "approver_id": "uuid" // optional, auto-assigned if not provided
}
```

### GET /api/v1/approvals/requests
**Purpose**: List approval requests
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?status=pending&approver_id=uuid`
**Response**: `{ "requests": [...], "total": 5 }`

### GET /api/v1/approvals/requests/{request_id}
**Purpose**: Get approval request details
**Headers**: `Authorization: Bearer {token}`

### POST /api/v1/approvals/requests/{request_id}/approve
**Purpose**: Approve feature request (Approver role)
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "comments": "Approved for staging"
}
```

### POST /api/v1/approvals/requests/{request_id}/reject
**Purpose**: Reject feature request (Approver role)
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "comments": "Needs more information"
}
```

### GET /api/v1/approvals/history/{ticket_id}
**Purpose**: Get approval history for ticket
**Headers**: `Authorization: Bearer {token}`

---

## Staging Workflow Endpoints

### GET /api/v1/staging/environments
**Purpose**: List staging environments
**Headers**: `Authorization: Bearer {token}`
**Response**: `{ "environments": [{ "id": "uuid", "name": "staging-1", "status": "available", ... }] }`

### POST /api/v1/staging/deployments
**Purpose**: Create deployment request
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "ticket_id": "uuid",
  "environment_id": "uuid",
  "version": "1.2.3",
  "deployment_notes": "Deploying feature X"
}
```

### GET /api/v1/staging/deployments
**Purpose**: List deployments
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?status=completed&environment_id=uuid`
**Response**: `{ "deployments": [...], "total": 20 }`

### GET /api/v1/staging/deployments/{deployment_id}
**Purpose**: Get deployment details
**Headers**: `Authorization: Bearer {token}`

### POST /api/v1/staging/deployments/{deployment_id}/status
**Purpose**: Update deployment status (Admin)
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "status": "completed",
  "notes": "Deployment successful"
}
```

### POST /api/v1/staging/deployments/{deployment_id}/rollback
**Purpose**: Request rollback (Admin)
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "reason": "Critical bug found"
}
```

---

## Dashboard & Analytics Endpoints

### GET /api/v1/dashboard/overview
**Purpose**: Get dashboard overview data
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?period=30d`
**Response**:
```json
{
  "ticket_stats": {
    "total": 150,
    "open": 45,
    "in_progress": 30,
    "resolved": 60,
    "closed": 15
  },
  "sla_compliance": 95.5,
  "recent_activity": [...],
  "top_assignees": [...]
}
```

### GET /api/v1/dashboard/analytics/tickets
**Purpose**: Get ticket analytics
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?start_date=2024-01-01&end_date=2024-01-31&group_by=day`
**Response**: `{ "data": [...], "trends": {...} }`

### GET /api/v1/dashboard/analytics/sla
**Purpose**: Get SLA analytics
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?period=30d`
**Response**: `{ "compliance_rate": 95.5, "breaches": [...], "trends": {...} }`

### GET /api/v1/dashboard/reports/export
**Purpose**: Export report data
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?type=tickets&format=csv&start_date=2024-01-01&end_date=2024-01-31`
**Response**: File download

---

## Notification Endpoints

### GET /api/v1/notifications
**Purpose**: Get user notifications
**Headers**: `Authorization: Bearer {token}`
**Query Params**: `?unread_only=true&page=1&limit=20`
**Response**: `{ "notifications": [...], "unread_count": 5 }`

### PUT /api/v1/notifications/{notification_id}/read
**Purpose**: Mark notification as read
**Headers**: `Authorization: Bearer {token}`

### PUT /api/v1/notifications/read-all
**Purpose**: Mark all notifications as read
**Headers**: `Authorization: Bearer {token}`

### GET /api/v1/notifications/preferences
**Purpose**: Get notification preferences
**Headers**: `Authorization: Bearer {token}`

### PUT /api/v1/notifications/preferences
**Purpose**: Update notification preferences
**Headers**: `Authorization: Bearer {token}`
**Request Body**:
```json
{
  "email_ticket_assigned": true,
  "email_sla_breach": true,
  "in_app_comments": true
}
```

---

## File Management Endpoints

### POST /api/v1/files/upload
**Purpose**: Upload file
**Headers**: `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`
**Request Body**: Form data with `file` field
**Response**: `{ "file_id": "uuid", "url": "https://...", "filename": "..." }`

### GET /api/v1/files/{file_id}
**Purpose**: Get file metadata
**Headers**: `Authorization: Bearer {token}`

### GET /api/v1/files/{file_id}/download
**Purpose**: Download file
**Headers**: `Authorization: Bearer {token}`
**Response**: File stream

### DELETE /api/v1/files/{file_id}
**Purpose**: Delete file
**Headers**: `Authorization: Bearer {token}`

### GET /api/v1/files/ticket/{ticket_id}
**Purpose**: Get files for ticket
**Headers**: `Authorization: Bearer {token}`
**Response**: `{ "files": [...] }`

---

## API Middleware & Security

### Authentication Middleware
- Validates JWT token from Authorization header
- Extracts user information
- Checks token expiration
- Returns 401 if invalid/expired

### Authorization Middleware
- Role-based access control (RBAC)
- Permission checking per endpoint
- Returns 403 if unauthorized

### Rate Limiting
- Per-user rate limiting
- Per-endpoint rate limits
- Returns 429 if exceeded

### Request Validation
- Pydantic models for request validation
- Automatic error responses for invalid data
- Returns 422 for validation errors

### CORS Configuration
- Configured for Next.js frontend domain
- Preflight request handling
- Credentials support

## Error Response Format

All errors follow consistent format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
