# FMS Quick Start

## Start Everything (Backend + Frontend)

**Double-click or run:**
```cmd
start-all.bat
```

This opens two terminal windows:
1. **Backend** (with UTF-8 - fixes 500 error on Windows)
2. **Frontend** (Vite dev server)

## Or Start Manually

**Terminal 1 - Backend:**
```cmd
cd "c:\Support FMS to APPLICATION\backend"
start-backend-utf8.bat
```

**Terminal 2 - Frontend:**
```cmd
cd "c:\Support FMS to APPLICATION\fms-frontend"
npm run dev
```

## URLs

- **Frontend:** http://localhost:3001 (or 3002/3003/3004 if 3001 is in use)
- **Backend:** http://127.0.0.1:8000
- **Register:** http://localhost:3001/register

## Verify

1. Open http://localhost:3001/register
2. Fill the form and click Register
3. Should see "Registration successful"
