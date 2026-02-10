# Railway setup – exact steps (fix "Railpack could not determine how to build")

If you see **"Railpack could not determine how to build the app"** and the build log shows it's analyzing the repo root (backend/, fms-frontend/, database/), Railway is building from the wrong directory. Follow these exact steps.

---

## The problem

Railway is building from the **repo root** instead of the **`backend/`** folder. Railpack sees:
- `backend/` (folder, not the build root)
- `fms-frontend/` (confuses Railpack)
- `package-lock.json` (might make Railpack think it's Node)
- Many `.md` files

Railpack can't detect Python because `requirements.txt` and `app/main.py` are inside `backend/`, not at the root.

---

## The fix: set Root Directory in Railway

**You must set this in the Railway dashboard.** The repo files (`backend/railway.toml`, `backend/runtime.txt`) are correct, but Railway won't use them until you tell it to build from `backend/`.

---

## Step-by-step: Railway dashboard configuration

### Step 1: Open your Railway service

1. Go to **https://railway.app** and sign in.
2. Open your **project** (e.g. "adventurous-reverence").
3. Click on the **service** named **"IP-Internal-manage-Software"** (the one that's failing).

### Step 2: Open Settings

- Click the **Settings** tab (top navigation, or in the left sidebar).

### Step 3: Find Root Directory

- Scroll down to find **"Root Directory"** (it might be under **"General"** or **"Build"**).
- You might see it as empty, or it might say something like `/` or `.` or `./`.

### Step 4: Set Root Directory to `backend`

- Click the **Root Directory** field (or the **Edit** button next to it).
- Type exactly: **`backend`**
  - No leading slash: not `/backend` or `./backend`
  - No trailing slash: not `backend/`
  - Just: **`backend`**
- Click **Save** (or **Update**).

### Step 5: Verify Root Directory is saved

- Refresh the page or go back to **Settings**.
- Confirm **Root Directory** shows **`backend`** (not empty, not `/`, not `.`).

### Step 6: Redeploy

- Go to **Deployments** tab.
- Find the latest deployment (the failed one).
- Click the **⋯** (three dots) menu → **Redeploy**.
- Wait for the build to finish.

---

## What should happen after Root Directory is set

When Railway builds with Root Directory = `backend`, Railpack will analyze only the `backend/` folder and see:
- `requirements.txt` → detects Python
- `app/main.py` → detects FastAPI
- `runtime.txt` → uses Python 3.11
- `railway.toml` → uses the start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

The build log should show:
- ✅ **Build image** step succeeds
- ✅ **Deploy** step succeeds
- ✅ No more "Railpack could not determine how to build"

---

## If Root Directory setting is not visible

If you don't see **Root Directory** in Settings:

1. Check you're in the **service** view (not project view). The URL should be like: `railway.app/project/xxx/service/yyy`
2. Try **Settings** → **General** (scroll down).
3. Try **Settings** → **Build** (scroll down).
4. If still not found, Railway might have moved it. Check Railway docs or contact support.

---

## After successful deploy

1. **Set environment variables** (Settings → Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `CORS_ORIGINS` (your frontend URL)

2. **Get public URL** (Settings → Networking → Generate Domain).

3. **Test**: `https://YOUR-URL/health` should return `{"status":"ok","message":"Backend is running"}`.

---

## Quick checklist

- [ ] Opened Railway → project → service "IP-Internal-manage-Software"
- [ ] Went to **Settings**
- [ ] Found **Root Directory** field
- [ ] Set it to exactly **`backend`** (no slashes)
- [ ] Clicked **Save**
- [ ] Verified it shows **`backend`** (refreshed page)
- [ ] Went to **Deployments** → **Redeploy**
- [ ] Build log shows Railpack analyzing `backend/` folder (not repo root)
- [ ] Build succeeds (Build image ✅, Deploy ✅)

---

**Important:** The repo files (`backend/railway.toml`, `backend/runtime.txt`) are already correct. The only thing you need to do is set **Root Directory = `backend`** in Railway Settings. This cannot be done from code—it must be set in the Railway dashboard.
