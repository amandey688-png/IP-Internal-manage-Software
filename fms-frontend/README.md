# FMS Frontend Application

Enterprise-grade React + TypeScript frontend application for Facility Management System.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **Ant Design** - UI component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management

## Features

- ✅ Complete authentication flow (Register, Login, OTP Verification)
- ✅ Role-based access control (User, Admin, Master)
- ✅ Password validation with real-time feedback
- ✅ Secure token management
- ✅ Protected routes
- ✅ Enterprise UI with Ant Design
- ✅ Table-heavy data views
- ✅ Searchable dropdowns
- ✅ Responsive design

## Project Structure

```
fms-frontend/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable components
│   ├── contexts/         # Context providers
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and set your API base URL
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=FMS Application
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_APP_NAME` - Application name

## Authentication Flow

1. **Registration**: User registers with email, password, and name
   - Password validated (min 8 chars, upper, lower, number, special)
   - Email confirmation sent by backend
   - Auto-redirect to login after 5 seconds

2. **Login**: User logs in with email and password
   - If first-time login: Redirects to OTP verification
   - If already verified: Direct login to dashboard

3. **OTP Verification**: 4-digit OTP verification
   - On success: Stores token and redirects to dashboard
   - Role-based redirect

## Routes

- `/register` - Registration page
- `/login` - Login page
- `/otp` - OTP verification
- `/confirmation-success` - Email confirmation success
- `/dashboard` - Dashboard (all roles)
- `/tickets` - Ticket list (all roles)
- `/tickets/:id` - Ticket detail (all roles)
- `/solutions/:ticketId` - Solutions (all roles)
- `/staging` - Staging deployments (all roles)
- `/users` - User management (Admin/Master only)
- `/settings` - Settings (all roles)

## Role-Based Access

- **User**: Dashboard, Tickets, Solutions, Staging, Settings
- **Admin**: All user routes + Users
- **Master**: All routes

## API Integration

All API calls are made through the centralized API layer in `src/api/`. The Axios instance includes:
- Automatic token injection
- Global error handling (401/403)
- Request/response interceptors

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## License

Proprietary - All rights reserved
