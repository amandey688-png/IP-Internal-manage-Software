# Step-by-Step Installation Guide

## Problem
`pip install -r requirements.txt` fails because `pyroaring` needs C++ build tools.

## Solution: Install packages individually (skips problematic dependency)

### Step 1: Open PowerShell/Terminal
Navigate to backend folder:
```bash
cd "c:\Support FMS to APPLICATION\backend"
```

### Step 2: Install Core Packages
Run these commands **one by one**:

```bash
pip install fastapi
pip install "uvicorn[standard]"
pip install python-dotenv
pip install "pydantic[email]"
```

### Step 3: Install Supabase Auth (What We Need)
```bash
pip install supabase-auth==2.27.2
pip install httpx
pip install postgrest==2.27.2
pip install gotrue==2.12.4
pip install realtime==2.27.2
```

### Step 4: Install Supabase Package (Skip Storage)
```bash
pip install supabase --no-deps
pip install supabase-auth==2.27.2 httpx postgrest==2.27.2 gotrue==2.12.4 realtime==2.27.2
```

### Step 5: Test Installation
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 6: Verify Backend
Open browser: http://127.0.0.1:8000/health

Should return: `{"status": "ok", "message": "Backend is running"}`

## Alternative: Use Batch Script

If you prefer, run the batch script:

```bash
.\install-packages.bat
```

## What This Does

- Installs all packages needed for FastAPI + Supabase Auth
- Skips `pyroaring` (storage dependency we don't need)
- Your `supabase_client.py` will still work for authentication

## Troubleshooting

**If you get "module not found" errors:**
- Make sure you ran all pip install commands
- Check Python version: `python --version` (should be 3.11+)

**If backend doesn't start:**
- Check if port 8000 is already in use
- Try: `netstat -ano | findstr :8000` to see what's using it

**If Supabase auth fails:**
- Check `.env` file has correct Supabase credentials
- Verify Supabase project is active

## Next Steps After Installation

1. ✅ Backend installed and running
2. ✅ Test http://127.0.0.1:8000/health
3. ✅ Start frontend: `cd fms-frontend && npm run dev`
4. ✅ Test registration at http://localhost:3001/register
