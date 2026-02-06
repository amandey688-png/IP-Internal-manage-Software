# High-Level System Architecture

## Overview
Cloud-based Facility Management System (FMS) to Application platform built with modern microservices principles, leveraging Supabase for backend services and Next.js for frontend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend Application                 │  │
│  │  - Server-Side Rendering (SSR)                            │  │
│  │  - Static Site Generation (SSG)                           │  │
│  │  - API Routes (Middleware)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FastAPI Backend Service                      │  │
│  │  - RESTful API Endpoints                                  │  │
│  │  - Authentication Middleware                              │  │
│  │  - Request Validation                                     │  │
│  │  - Rate Limiting                                          │  │
│  │  - CORS Management                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Supabase Client SDK
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Postgres   │  │     Auth     │  │   Storage    │         │
│  │   Database   │  │   Service    │  │   Service    │         │
│  │              │  │              │  │              │         │
│  │ - Tables     │  │ - Email      │  │ - Attachments│         │
│  │ - Views      │  │   Confirmation│ │ - Documents  │         │
│  │ - Functions  │  │ - JWT Tokens │  │ - Media      │         │
│  │ - Triggers   │  │ - Sessions   │  │              │         │
│  │ - RLS Policies│ │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  - Email Service (Supabase Auth)                                 │
│  - File Storage (Supabase Storage)                               │
│  - Real-time Subscriptions (Supabase Realtime)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **State Management**: React Query / Zustand
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod
- **Authentication**: Supabase Auth Client

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Language**: Python
- **API Documentation**: OpenAPI/Swagger
- **Validation**: Pydantic
- **Database Client**: Supabase Python Client
- **Async Support**: AsyncIO

### Database & Services
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Email Confirmation)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Row Level Security**: PostgreSQL RLS Policies

## System Components

### 1. Frontend Application (Next.js)
- **Purpose**: User interface and client-side logic
- **Responsibilities**:
  - User authentication UI
  - Ticket management interface
  - Dashboard and analytics visualization
  - Feature approval workflow UI
  - Staging workflow management
  - Real-time updates via Supabase subscriptions

### 2. Backend API (FastAPI)
- **Purpose**: Business logic and API orchestration
- **Responsibilities**:
  - Request validation and sanitization
  - Business rule enforcement
  - SLA calculation and monitoring
  - Workflow orchestration
  - Integration with Supabase services
  - Complex queries and aggregations

### 3. Database Layer (Supabase PostgreSQL)
- **Purpose**: Data persistence and data integrity
- **Responsibilities**:
  - Data storage
  - Referential integrity
  - Row Level Security (RLS)
  - Database functions and triggers
  - Data relationships and constraints

### 4. Authentication Layer (Supabase Auth)
- **Purpose**: User authentication and authorization
- **Responsibilities**:
  - User registration
  - Email confirmation flow
  - JWT token management
  - Session management
  - Password reset

### 5. Storage Layer (Supabase Storage)
- **Purpose**: File and media storage
- **Responsibilities**:
  - Ticket attachments
  - User avatars
  - Document storage
  - Media files

## Data Flow

### Authentication Flow
```
User → Next.js → Supabase Auth → Email Confirmation → JWT Token → API Access
```

### Ticket Creation Flow
```
User → Next.js Form → FastAPI Validation → Supabase DB → RLS Check → Insert → Real-time Update
```

### Feature Approval Flow
```
User → Feature Request → FastAPI → DB Status Update → Notification → Approver → Approval → Staging
```

## Deployment Architecture

### Frontend Deployment
- **Platform**: Vercel / Netlify / AWS Amplify
- **CDN**: Global edge network
- **Build**: Static + SSR hybrid

### Backend Deployment
- **Platform**: AWS Lambda / Google Cloud Run / Railway / Render
- **Scaling**: Auto-scaling based on load
- **Environment**: Production, Staging, Development

### Database Deployment
- **Platform**: Supabase Cloud (Managed PostgreSQL)
- **Backup**: Automated daily backups
- **Replication**: Read replicas for scaling

## Security Layers

1. **Network Security**: HTTPS/TLS encryption
2. **Authentication**: JWT tokens with expiration
3. **Authorization**: Role-based access control (RBAC)
4. **Data Security**: Row Level Security (RLS) policies
5. **API Security**: Rate limiting, CORS, input validation
6. **Storage Security**: Bucket policies and access controls

## Scalability Considerations

- **Horizontal Scaling**: Stateless API design
- **Database Scaling**: Read replicas and connection pooling
- **Caching**: Redis for frequently accessed data (optional)
- **CDN**: Static asset delivery
- **Real-time**: Supabase Realtime for live updates
