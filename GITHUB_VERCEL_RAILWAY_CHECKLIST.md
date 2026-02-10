# What to Do: GitHub, Vercel & Railway

Use this checklist to get your app live and fix common deployment issues.

---

## 1. GitHub

### Push your code

Run these one at a time (or paste the whole block). Use a short commit message without parentheses to avoid PowerShell errors.

```powershell
cd "c:\Support FMS to APPLICATION"
git status
git add .
git commit -m "Deploy checklist and config"
git push origin main
```

- If you use a branch (e.g. `add-railway-and-vercel-files`): push that branch, then open a **Pull Request** into `main`, review, and merge.
- After merging, pull locally: `git checkout main` then `git pull origin main`.

### Optional: GitHub Actions

- You have no `.github/workflows` yet. To add CI (lint/test on push): create `.github/workflows/ci.yml` with a job that runs `npm ci` and `npm run build` in `fms-frontend`, and/or `pip install` and `pytest` in `backend`. Not required for Vercel/Railway to work.

---

## 2. Vercel (Frontend)

### One-time project setup

1. Go to **https://vercel.com** → sign in with **GitHub**.
2. **Add New Project** → import repo: `amandey688-png/IP-Internal-manage-Software` (or your repo name).
3. In project settings, set:
   - **Root Directory:** `fms-frontend` (required; without this the build will fail).
   - **Framework Preset:** Vite.
   - **Build Command:** `npm run build`.
   - **Output Directory:** `dist`.
   - **Install Command:** `npm install` (default).

### Environment variables (Vercel)

In the project → **Settings** → **Environment Variables**, add:

| Name | Value | Notes |
|------|--------|--------|
| `VITE_API_BASE_URL` | `https://ip-internal-manage-software.onrender.com` | **Backend URL used in production.** No trailing slash. |
| `VITE_SUPABASE_URL` | Your Supabase project URL | From Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | From Supabase → Settings → API |

- The frontend reads **`VITE_API_BASE_URL`** first, then **`VITE_API_URL`** as a fallback (see `fms-frontend/src/api/axios.ts`).  
  - If you already created `VITE_API_URL` in Vercel, you can either keep it or rename it to `VITE_API_BASE_URL`.  
  - In all cases, the value should be: `https://ip-internal-manage-software.onrender.com` (no trailing slash).
- After adding or changing env vars, trigger a **Redeploy** (Deployments → ⋯ → Redeploy).

### Fix: "Network Error: Cannot connect to backend server" on Vercel

This happens when **`VITE_API_BASE_URL`/`VITE_API_URL`** is not set (or is wrong) in Vercel. The app then falls back to `http://127.0.0.1:8000`, which does not work in production.

**Fix:** In Vercel → your project → **Settings** → **Environment Variables**:

1. Add or edit **`VITE_API_BASE_URL`** (preferred) or `VITE_API_URL`.
2. Set the value to your **live backend URL**:  
   `https://ip-internal-manage-software.onrender.com`  (no trailing slash)
3. Save, then **Redeploy** (Deployments → ⋯ → Redeploy). **Env vars are baked in at build time** — changing them without redeploying keeps the app on 127.0.0.1.
4. Code now strips a trailing slash, so `https://ip-internal-manage-software.onrender.com/` is fine in Vercel.

**Production URLs (reference):**
- Frontend (Vercel): `https://ip-internal-manage-software-ckpexjizo-amans-projects-56de03ce.vercel.app`
- Backend (Render): `https://ip-internal-manage-software.onrender.com`

**Backend (Render) CORS:** In Render → your service → **Environment** → add `CORS_ORIGINS` = your Vercel frontend URL (e.g. `https://ip-internal-manage-software-ckpexjizo-amans-projects-56de03ce.vercel.app`). Multiple origins: comma-separated. Then redeploy the backend.

### If builds fail

- Confirm **Root Directory** is exactly `fms-frontend` (no leading/trailing slash).
- Check build logs for missing env vars or Node version; set **Node.js Version** in Vercel to 18 or 20 if needed.

---

## 3. Railway (Backend)

### One-time project setup

1. Go to **https://railway.app** → sign in with **GitHub**.
2. **New Project** → **Deploy from GitHub repo** → select the same repo.
3. In the **service** settings (not the project), set:
   - **Root Directory:** `backend` (required; otherwise Railpack sees the monorepo root and the build fails).

### Build & run (already in `backend/railway.toml`)

- **Builder:** RAILPACK (default).
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health check:** `/health` (optional but recommended).

Railway will use `backend/requirements.txt` and `backend/runtime.txt` when Root Directory is `backend`.

### Environment variables (Railway)

In the service → **Variables**, add (names and values from your Supabase and app config):

| Name | Example / notes |
|------|------------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only) |
| `SUPABASE_ANON_KEY` | Anon key |
| `DATABASE_URL` | Supabase connection string (Postgres) |
| Any other vars your `app/main.py` or config use (e.g. JWT secret, SMTP) | As in `.env.example` |

### If build fails with “Railpack could not determine how to build”

- **Root Directory** is not set or wrong. In Railway → your **service** → **Settings** → set **Root Directory** to exactly: `backend` (no `/` or `./`).
- Save and **Redeploy**.

### Get your backend URL

- After a successful deploy, open the service → **Settings** → **Networking** (or **Generate domain**). Copy the public URL (e.g. `https://xxx.up.railway.app`).
- Put this URL in Vercel as **`VITE_API_BASE_URL`** (or `VITE_API_URL`) with **no trailing slash**, then redeploy the frontend.

---

## 4. Order of operations

1. **GitHub:** Push latest code (and merge to `main` if you use PRs).
2. **Railway:** Set Root Directory = `backend`, add env vars, deploy. Copy backend URL.
3. **Vercel:** Set Root Directory = `fms-frontend`, add env vars, set `VITE_API_BASE_URL` to the Railway URL, deploy.
4. **Supabase:** In Authentication → URL Configuration, add your Vercel frontend URL to **Redirect URLs** (and Site URL if you use it).

---

## 5. Quick reference

| Platform | Root Directory | Key env / config |
|----------|----------------|------------------|
| **Vercel** | `fms-frontend` | `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **Railway** | `backend` | `SUPABASE_*`, `DATABASE_URL`, plus any app secrets |

---

## 6. Optional: health check

- Backend: ensure your FastAPI app exposes a route (e.g. `/health`) that returns 200. `railway.toml` already references `healthcheckPath = "/health"`; implement it in `app/main.py` if you haven’t.
- This helps Railway (and you) confirm the service is up.

If you tell me your repo name and whether you use `main` or another default branch, I can adapt the Git commands and branch names in this file.
