# Full deployment status – backend and frontend

This document shows what is done and what is left for **backend (Railway)** and **frontend (Vercel)**, plus GitHub and Supabase.

---

## Overview

| Area | Repo/code ready | Platform configured | Live & working |
|------|------------------|----------------------|-----------------|
| **Backend (Railway)** | Yes | Pending (Root Directory + vars) | No |
| **Frontend (Vercel)** | Yes | Partially (Root Directory per project) | Depends on PR merge + config |
| **GitHub** | Yes | PR/merge flow in use | Files on main after PR merge |
| **Supabase** | N/A | You configure in dashboard | Auth + DB + Storage |

---

## Backend (Railway) – status

### Done (in repo)

| Item | Status | Location |
|------|--------|----------|
| FastAPI app | Done | `backend/app/main.py` (`app = FastAPI(...)`) |
| `/health` endpoint | Done | `backend/app/main.py` |
| Start command for Railway | Done | `backend/railway.toml` → `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Healthcheck path | Done | `backend/railway.toml` → `/health` |
| Python version | Done | `backend/runtime.txt` → `python-3.11.9` |
| Dependencies | Done | `backend/requirements.txt` (FastAPI, Uvicorn, Supabase, etc.) |
| CORS (env-driven) | Done | `backend/app/main.py` uses `CORS_ORIGINS` env var |

### Pending (you do in Railway dashboard)

| Step | What to do | Done? |
|------|------------|--------|
| 1 | Set **Root Directory** = `backend` (Settings) | |
| 2 | **Redeploy** after Root Directory is set | |
| 3 | Add **Variables**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `CORS_ORIGINS` (and optionally `DATABASE_URL` / `SUPABASE_DB_URL`) | |
| 4 | **Generate Domain** (Settings → Networking) and copy public URL | |
| 5 | Test `https://YOUR-RAILWAY-URL/health` → `{"status":"ok",...}` | |

### Backend summary

- **Code/repo:** 100% ready.
- **Railway:** 0% until Root Directory is set; then add variables, domain, and test.
- **After above:** Backend is “done” when `/health` works and env vars are set.

---

## Frontend (Vercel) – status

### Done (in repo)

| Item | Status | Location |
|------|--------|----------|
| React + Vite app | Done | `fms-frontend/` |
| SPA rewrites (no 404) | Done | `fms-frontend/vercel.json` → all routes → `/index.html` |
| API base URL from env | Done | `fms-frontend/src/api/axios.ts` uses `VITE_API_BASE_URL` |
| Build command | Done | `package.json` → `npm run build` (tsc + vite build) |
| Output directory | Done | Vite default `dist/` |

### Pending (you do in Vercel dashboard)

| Step | What to do | Done? |
|------|------------|--------|
| 1 | In the **project** (not team) → **Settings** → **General** (or Build): set **Root Directory** = `fms-frontend` | |
| 2 | **Environment Variables** (for Production and optionally Preview): `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | |
| 3 | After PR merge: ensure project is connected to repo and **main** (or your production branch) | |
| 4 | **Redeploy** (or let auto-deploy run) and open frontend URL; no 404 on refresh | |
| 5 | Set `VITE_API_BASE_URL` to your **Railway backend URL** when backend is live | |

### Frontend summary

- **Code/repo:** 100% ready (including `vercel.json`).
- **Vercel:** Depends on Root Directory + env vars + PR merge; then point API URL to Railway and redeploy.
- **After above:** Frontend is “done” when the app loads and can call the backend.

---

## GitHub – status

| Item | Status |
|------|--------|
| Repo | `amandey688-png/IP-Internal-manage-Software` |
| Branch protection | main protected; changes via Pull Request + CodeRabbit (and possibly Vercel check) |
| Files on main | `backend/railway.toml`, `backend/runtime.txt`, `fms-frontend/vercel.json` and deploy docs should be on main after PR #5 (or equivalent) is merged |
| What you do | Merge PR when checks pass; optionally add any missing files in a follow-up PR |

---

## Supabase – status

| Item | Status |
|------|--------|
| Backend env vars | You set in Railway: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (and optionally DB URL) |
| Frontend env vars | You set in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Auth redirect URLs | You add in Supabase: **Authentication** → **URL Configuration** → **Redirect URLs** → add your Vercel frontend URL (e.g. `https://your-app.vercel.app`) |
| Database / migrations | Per your existing Supabase setup (e.g. scripts in `database/`) |
| Storage (e.g. attachments) | Per your existing bucket and policies |

---

## End-to-end flow (after deployment)

1. User opens **Vercel frontend URL**.
2. Frontend uses **VITE_API_BASE_URL** (Railway) for API calls and **VITE_SUPABASE_*** for auth.
3. Backend (Railway) uses **SUPABASE_*** and **CORS_ORIGINS** (frontend URL).
4. Supabase Auth redirects back to the URL you added in **Redirect URLs**.

---

## How much is done – summary

| Part | In repo | On platform (you configure) | Live & tested |
|------|---------|-----------------------------|----------------|
| **Backend** | 100% | 0% until Root Directory + vars + domain | 0% until deploy succeeds and `/health` works |
| **Frontend** | 100% | Partially (Root Directory per project; env vars) | 0% until deploy succeeds and app loads |
| **GitHub** | 100% | PR merged when checks pass | After merge |
| **Supabase** | N/A | You set redirect URL + use same project for backend/frontend | After wiring |

**Overall:** Repo/code is **100%** ready for both backend and frontend. Deployment is **not done** until you:

1. **Railway:** Set Root Directory = `backend`, add variables, generate domain, redeploy, test `/health`.
2. **Vercel:** Set Root Directory = `fms-frontend` (in **project** settings), add env vars, merge PR, set `VITE_API_BASE_URL` to Railway URL, redeploy.
3. **Supabase:** Add Vercel frontend URL to Auth redirect URLs.
4. **Test:** Open app → login → use app (e.g. create ticket).

---

## Quick checklist (in order)

- [ ] **GitHub:** PR #5 (or current PR) merged; `backend/railway.toml`, `backend/runtime.txt`, `fms-frontend/vercel.json` on `main`.
- [ ] **Railway:** Root Directory = `backend` → Redeploy → Variables (Supabase + CORS) → Generate Domain → Test `/health`.
- [ ] **Vercel:** Open **project** (not team) → Settings → Root Directory = `fms-frontend` → Env vars (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) → Redeploy.
- [ ] **Vercel:** Set `VITE_API_BASE_URL` to Railway URL (when backend is live).
- [ ] **Supabase:** Auth → Redirect URLs → add Vercel frontend URL.
- [ ] **Test:** Open frontend URL → Login → Create ticket (or equivalent flow).

When all boxes are checked, **full deployment (backend + frontend) is done.**
