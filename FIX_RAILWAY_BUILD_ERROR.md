# Fix Railway build error – final solution

## The error you're seeing

```text
✖ Railpack could not determine how to build the app.
The app contents that Railpack analyzed contains:
./
├── backend/
├── fms-frontend/
├── database/
...
```

**This means Railway is building from the repo root, not from `backend/`.**

---

## Why it keeps happening

**Root Directory is not set in Railway Settings.** Railway defaults to building from the repo root, so Railpack sees the entire monorepo and can't detect Python (because `requirements.txt` is inside `backend/`, not at the root).

---

## The fix (one-time setup in Railway dashboard)

**This must be done in Railway's web interface. It cannot be fixed by code alone.**

### Step 1: Open Railway service

1. Go to **https://railway.app**
2. Sign in
3. Open your **project** (e.g. "adventurous-reverence")
4. Click the service **"IP-Internal-manage-Software"**

### Step 2: Open Settings

- Click **Settings** (top navigation bar)

### Step 3: Find and set Root Directory

1. Scroll down in Settings
2. Find **"Root Directory"** (might be under "General" or "Build")
3. Click the field (or **Edit** button)
4. Type exactly: **`backend`**
   - ✅ Correct: `backend`
   - ❌ Wrong: `/backend`, `./backend`, `backend/`, `/backend/`
5. Click **Save**

### Step 4: Verify it saved

- Refresh the Settings page
- Confirm **Root Directory** shows **`backend`** (not empty, not `/`)

### Step 5: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Watch the build logs

---

## What you should see after Root Directory is set

**Build log should show:**

```text
The app contents that Railpack analyzed contains:
./
├── app/
│   └── main.py
├── requirements.txt
├── railway.toml
├── runtime.txt
✅ Detected Python
✅ Detected FastAPI
✅ Build successful
```

**NOT:**

```text
./
├── backend/
├── fms-frontend/
✖ Railpack could not determine how to build
```

---

## Files in repo (already correct – no changes needed)

- ✅ `backend/railway.toml` – Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- ✅ `backend/runtime.txt` – Python 3.11.9
- ✅ `backend/requirements.txt` – All dependencies (FastAPI, Uvicorn, Supabase, etc.)
- ✅ `backend/app/main.py` – FastAPI app (`app = FastAPI(...)`)

**All files are correct. You only need to set Root Directory in Railway.**

---

## After successful deploy

1. **Set environment variables** (Settings → Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `CORS_ORIGINS` (your frontend URL)

2. **Get public URL** (Settings → Networking → Generate Domain)

3. **Test**: `https://YOUR-URL/health` → should return `{"status":"ok","message":"Backend is running"}`

---

## Summary

**The repo is correct. Set Root Directory = `backend` in Railway Settings, then redeploy. That's the only fix needed.**

See **RAILWAY_SETUP_EXACT_STEPS.md** for detailed step-by-step instructions with screenshots/descriptions.
