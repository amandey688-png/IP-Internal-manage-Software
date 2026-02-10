# Railway Root Directory fix – why it keeps failing

## Why the error keeps happening

**Railway is still building from the repo root**, not from `backend/`. The error log shows:

```text
The app contents that Railpack analyzed contains:
./
├── backend/
├── database/
├── fms-frontend/
...
```

This means Railway is analyzing the **entire repo**, not just `backend/`. Railpack can't detect Python because `requirements.txt` is inside `backend/`, not at the root.

---

## The solution (must be done in Railway dashboard)

**You must set Root Directory in Railway Settings.** This cannot be fixed by code alone—it's a Railway dashboard setting.

---

## Exact steps to fix (with screenshots/descriptions)

### 1. Open Railway service

- URL: **https://railway.app**
- Sign in → open your **project** → click the service **"IP-Internal-manage-Software"**

### 2. Go to Settings

- Click **Settings** (top navigation bar or left sidebar)

### 3. Find "Root Directory"

- Scroll down in Settings
- Look for **"Root Directory"** (might be under "General" or "Build" section)
- It might be empty, or show `/` or `.` or `./`

### 4. Set Root Directory = `backend`

- Click the **Root Directory** field (or **Edit** button)
- **Delete** any existing value
- Type exactly: **`backend`**
  - ✅ Correct: `backend`
  - ❌ Wrong: `/backend`
  - ❌ Wrong: `./backend`
  - ❌ Wrong: `backend/`
  - ❌ Wrong: `/backend/`
- Click **Save** or **Update**

### 5. Verify it saved

- Refresh the Settings page
- Confirm **Root Directory** shows **`backend`**

### 6. Redeploy

- Go to **Deployments** tab
- Click **⋯** (three dots) on the latest deployment → **Redeploy**
- Watch the build logs

---

## What the build log should show after fix

**Before (wrong):**

```text
The app contents that Railpack analyzed contains:
./
├── backend/
├── fms-frontend/
├── database/
...
✖ Railpack could not determine how to build the app.
```

**After (correct):**

```text
The app contents that Railpack analyzed contains:
./
├── app/
│   └── main.py
├── requirements.txt
├── railway.toml
├── runtime.txt
...
✅ Detected Python
✅ Detected FastAPI
✅ Build successful
```

---

## If you can't find Root Directory

1. **Make sure you're in the SERVICE view**, not project view
   - URL should be: `railway.app/project/xxx/service/yyy`
   - You should see tabs: Details, Build Logs, Deploy Logs, Settings

2. **Check different sections in Settings:**
   - Scroll through **General**
   - Scroll through **Build**
   - Look for any field labeled "Root", "Root Directory", "Source Directory", or "Working Directory"

3. **If still not found:**
   - Railway UI might have changed
   - Check Railway docs: https://docs.railway.app/guides/monorepo
   - Or contact Railway support

---

## Files in repo (already correct)

These files are correct and ready—Railway just needs Root Directory set:

- ✅ `backend/railway.toml` – Start command and healthcheck
- ✅ `backend/runtime.txt` – Python 3.11
- ✅ `backend/requirements.txt` – All dependencies
- ✅ `backend/app/main.py` – FastAPI app (`app = FastAPI(...)`)

---

## After Root Directory is set and deploy succeeds

1. **Set environment variables** (Settings → Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `CORS_ORIGINS` (your frontend URL)

2. **Get public URL** (Settings → Networking → Generate Domain)

3. **Test**: `https://YOUR-URL/health` → should return `{"status":"ok","message":"Backend is running"}`

---

**Summary:** The repo is correct. Set **Root Directory = `backend`** in Railway Settings, then redeploy. That's the only fix needed.
