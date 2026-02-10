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
| `VITE_API_BASE_URL` | `https://YOUR-RAILWAY-URL.up.railway.app` | Backend URL (set after Railway deploy). No trailing slash. |
| `VITE_SUPABASE_URL` | Your Supabase project URL | From Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | From Supabase → Settings → API |

- The frontend uses **`VITE_API_BASE_URL`** (see `fms-frontend/src/api/axios.ts`). If your docs say `VITE_API_URL`, use `VITE_API_BASE_URL` in Vercel instead.
- After adding or changing env vars, trigger a **Redeploy** (Deployments → ⋯ → Redeploy).

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
- Put this URL in Vercel as **`VITE_API_BASE_URL`** (no trailing slash), then redeploy the frontend.

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
