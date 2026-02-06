# Fix: gotrue==2.27.2 version error

## Problem
`gotrue==2.27.2` doesn't exist. Latest version is `2.12.4`.

## Solution: Use correct gotrue version

Run this command:

```bash
pip install gotrue==2.12.4
```

Then verify all packages are installed:

```bash
pip install supabase-auth==2.27.2 httpx postgrest==2.27.2 gotrue==2.12.4 realtime==2.27.2
```

## Complete Installation (Fixed)

Run these commands in order:

```bash
cd "c:\Support FMS to APPLICATION\backend"

# Step 1: Core packages
pip install fastapi
pip install "uvicorn[standard]"
pip install python-dotenv
pip install "pydantic[email]"

# Step 2: Supabase Auth packages (FIXED VERSIONS)
pip install supabase-auth==2.27.2
pip install httpx
pip install postgrest==2.27.2
pip install gotrue==2.12.4
pip install realtime==2.27.2

# Step 3: Install supabase package
pip install supabase --no-deps
pip install supabase-auth==2.27.2 httpx postgrest==2.27.2 gotrue==2.12.4 realtime==2.27.2
```

## Test Installation

After installation, test:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## Verify

Open browser: http://127.0.0.1:8000/health

Should return: `{"status": "ok", "message": "Backend is running"}`
