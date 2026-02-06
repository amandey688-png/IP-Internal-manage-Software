# ✅ Backend Installation Complete - Start Instructions

## Installation Status
✅ All required packages installed successfully
✅ Supabase client imports correctly
✅ Backend app imports correctly

## Start Backend Server

**Option 1 - Start everything (Backend + Frontend):**
```cmd
cd "C:\Support FMS to APPLICATION"
start-all.bat
```

**Option 2 - Backend only (with UTF-8 - REQUIRED on Windows to fix 500):**
```cmd
cd "C:\Support FMS to APPLICATION\backend"
start-backend-utf8.bat
```

**Option 3 - Manual (PowerShell):**
```powershell
cd "C:\Support FMS to APPLICATION\backend"
$env:PYTHONIOENCODING="utf-8"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Expected Output:**
```
INFO:     Will watch for changes in these directories: ['C:\\Support FMS to APPLICATION\\backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Verify Backend is Running

1. **Open browser**: http://127.0.0.1:8000/health
   - Should return: `{"status": "ok", "message": "Backend is running"}`

2. **Open Swagger UI**: http://127.0.0.1:8000/docs
   - Should show API documentation

## Test Registration

Once backend is running:

1. **Start frontend** (in another terminal):
   ```powershell
   cd "C:\Support FMS to APPLICATION\fms-frontend"
   npm run dev
   ```

2. **Go to**: http://localhost:3001/register

3. **Fill form and click Register**

4. **Check**:
   - Browser console for API request logs
   - Network tab for POST request to `/auth/register`
   - Backend terminal for incoming request logs

## Troubleshooting

**If backend doesn't start:**
- Check if port 8000 is already in use: `netstat -ano | findstr :8000`
- Make sure you're in the `backend` directory
- Check Python version: `python --version` (should be 3.11+)

**If you see import errors:**
- Run: `pip install supabase-functions==2.27.2`
- Run: `pip install storage3==2.27.2 --no-deps`

## Installed Packages Summary

✅ fastapi
✅ uvicorn[standard]
✅ python-dotenv
✅ pydantic[email]
✅ supabase (with storage3 patch)
✅ supabase-auth==2.27.2
✅ supabase-functions==2.27.2
✅ storage3==2.27.2 (without pyiceberg/pyroaring)
✅ httpx
✅ postgrest==2.27.2
✅ gotrue==2.12.4
✅ realtime==2.27.2

## Next Steps

1. ✅ Backend running on http://127.0.0.1:8000
2. ✅ Frontend running on http://localhost:3001
3. ✅ Test registration flow
4. ✅ Check Supabase dashboard for new users
