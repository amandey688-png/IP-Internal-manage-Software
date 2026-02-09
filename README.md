# FMS to Application - System Architecture

Cloud-based Facility Management System (FMS) to Application platform with comprehensive ticket management, SLA tracking, feature approval workflows, and staging management.

## Tech Stack

- **Frontend**: React (Next.js 14+) with TypeScript
- **Backend**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email Confirmation)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## Documentation Structure

1. **[High-Level Architecture](./01_HIGH_LEVEL_ARCHITECTURE.md)**
   - System overview and architecture diagram
   - Technology stack details
   - Component responsibilities
   - Data flow patterns
   - Deployment architecture

2. **[Module Breakdown](./02_MODULE_BREAKDOWN.md)**
   - Core modules and their purposes
   - Module components and features
   - Module dependencies
   - Communication patterns
   - Data ownership

3. **[API Layer Overview](./03_API_LAYER_OVERVIEW.md)**
   - Complete API endpoint documentation
   - Request/response formats
   - Authentication endpoints
   - Business logic endpoints
   - Error handling

4. **[Database Schema](./04_DATABASE_SCHEMA.md)**
   - Complete database schema
   - Table definitions and relationships
   - Database functions and triggers
   - Views and aggregations
   - Module database responsibilities

5. **[Security & RLS Strategy](./05_SECURITY_RLS_STRATEGY.md)**
   - Multi-layer security approach
   - Role-based access control (RBAC)
   - Row Level Security (RLS) policies
   - API-level authorization
   - Security best practices

## Key Features

### Role-Based Access Control
- **User**: Create and manage own tickets
- **Approver**: Approve/reject feature requests
- **Admin**: Full ticket management and system configuration
- **Master Admin**: Complete system control including user management

### Ticket Management
- Support for Bug, Feature, and Chore ticket types
- Ticket assignment and status tracking
- Comments and file attachments
- Complete audit history

### SLA & Delay Calculation
- Configurable SLA rules per ticket type
- Automatic delay calculation
- SLA breach tracking and notifications
- Compliance metrics and reporting

### Feature Approval Workflow
- Feature request submission
- Approver assignment
- Approval/rejection workflow
- Integration with staging workflow

### Staging Workflow
- Staging environment management
- Deployment tracking
- Rollback capabilities
- Environment status monitoring

### Dashboard & Analytics
- Real-time ticket statistics
- SLA compliance metrics
- User performance tracking
- Custom reports and exports

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account
- PostgreSQL client (optional)

### Setup Steps

1. **Supabase Setup**
   - Create new Supabase project
   - Run database migrations (from `04_DATABASE_SCHEMA.md`)
   - Configure email templates for authentication
   - Set up storage buckets

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   # Configure environment variables
   uvicorn main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Configure environment variables
   npm run dev
   ```

### Environment Variables

**Backend (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_database_url
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## System Architecture Highlights

### Authentication Flow
- Email-based registration with confirmation
- JWT token-based authentication
- Role-based authorization
- Secure session management

### Data Flow
1. User interacts with Next.js frontend
2. Frontend calls FastAPI backend
3. Backend validates and processes request
4. Backend interacts with Supabase (Database/Auth/Storage)
5. Real-time updates via Supabase subscriptions
6. Response returned to frontend

### Security Layers
1. Network: HTTPS/TLS encryption
2. Authentication: Supabase Auth with email confirmation
3. Authorization: Role-based access control
4. Data: Row Level Security (RLS) policies
5. Application: Input validation and sanitization

## Database Schema Overview

### Core Tables
- `users` - User profiles and roles
- `tickets` - Ticket entities
- `ticket_comments` - Comments on tickets
- `ticket_history` - Audit log
- `sla_rules` - SLA configuration
- `sla_tracking` - SLA monitoring
- `feature_approvals` - Approval workflow
- `staging_environments` - Staging management
- `deployments` - Deployment tracking
- `notifications` - User notifications
- `file_metadata` - File storage metadata

## API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh token

### Tickets
- `GET /api/v1/tickets` - List tickets
- `POST /api/v1/tickets` - Create ticket
- `GET /api/v1/tickets/{id}` - Get ticket
- `PUT /api/v1/tickets/{id}` - Update ticket

### SLA
- `GET /api/v1/sla/rules` - Get SLA rules
- `GET /api/v1/sla/tickets/{id}` - Get ticket SLA status
- `GET /api/v1/sla/metrics` - Get SLA metrics

### Approvals
- `POST /api/v1/approvals/requests` - Submit approval
- `POST /api/v1/approvals/requests/{id}/approve` - Approve
- `POST /api/v1/approvals/requests/{id}/reject` - Reject

### Dashboard
- `GET /api/v1/dashboard/overview` - Dashboard data
- `GET /api/v1/dashboard/analytics/tickets` - Ticket analytics

## Development Guidelines

### Code Organization
- **Frontend**: Feature-based folder structure
- **Backend**: Module-based organization
- **Database**: Schema-first approach

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical workflows
- RLS policy testing

### Deployment
- Frontend: Vercel/Netlify
- Backend: AWS Lambda/Cloud Run/Railway
- Database: Supabase Cloud (managed)

## Contributing

1. Follow the architecture patterns defined in documentation
2. Ensure RLS policies are properly implemented
3. Add appropriate authorization checks
4. Write tests for new features
5. Update documentation as needed

## License

[Specify your license]

## Support

For questions or issues, please refer to the detailed documentation files or contact the development team.
