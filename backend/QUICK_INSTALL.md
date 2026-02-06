# Quick Install Guide - Fix C++ Build Tools Error

## The Problem
`pyroaring` (a dependency) requires Microsoft Visual C++ Build Tools, which is a large download.

## Quick Fix (2 minutes)

Run these commands **one by one** in your terminal:

```bash
cd backend

# Install core packages
pip install fastapi uvicorn[standard] python-dotenv pydantic[email]

# Install Supabase Auth (what we actually need)
pip install supabase-auth==2.27.2 httpx postgrest==2.27.2 gotrue==2.11.0 realtime==2.27.2

# Install supabase package without storage dependencies
pip install supabase --no-deps
pip install supabase-auth==2.27.2 httpx postgrest==2.27.2 gotrue==2.27.2 realtime==2.27.2
```

## Test Installation

After installation, test if it works:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

If you see that, **installation is successful!**

## Verify Backend Works

Open browser and go to:
- http://127.0.0.1:8000/health

Should return: `{"status": "ok", "message": "Backend is running"}`

## If You Still Get Errors

If `supabase` package still has issues, we can use direct HTTP calls to Supabase Auth API instead. But try the above first - it should work!

## Next Steps

Once backend is running:
1. Start frontend: `cd fms-frontend && npm run dev`
2. Go to http://localhost:3001/register
3. Try registering a user
4. Check Network tab to see if request reaches backend
