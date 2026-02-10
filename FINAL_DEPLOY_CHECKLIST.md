# Final deploy checklist – GitHub and Railway

Use this as the single place to finish pushing your code and getting the backend live on Railway.

---

## What is already done in the repo (no action needed)

- **backend/railway.toml** – Railway start command and healthcheck.
- **backend/runtime.txt** – Python 3.11 for the build.
- **fms-frontend/vercel.json** – SPA rewrites so Vercel doesn’t show 404.
- **GITHUB_VERIFY_AND_GO_LIVE.md** – Full deploy and 404/Railway fix notes.
- **RAILWAY_DEPLOY_FIX.md** – Detailed Railway build-fix steps.

You only need to: push to GitHub, then configure and redeploy on Railway.

---

## Part A – What to do on GitHub (push your code)

Your repo has a rule: **changes to `main` must go through a Pull Request** and **CodeRabbit** must pass. So you push to a **branch**, then open a **PR** and merge it.

Run these in **PowerShell** from the project root:  
`cd "C:\Support FMS to APPLICATION"`

**If you already committed (e.g. "Add Railway config, Vercel SPA fix, and deploy docs") but push to main was rejected:**

1. Create a new branch and push it (pushing to a branch is allowed):
```powershell
git checkout -b deploy/railway-vercel-fix
git push origin deploy/railway-vercel-fix
```

2. On GitHub: open **https://github.com/amandey688-png/IP-Internal-manage-Software**
   - You should see a yellow bar: **"deploy/railway-vercel-fix had recent pushes"** with a button **"Compare & pull request"**. Click it.
   - Or: go to **Pull requests** → **New pull request** → set **base: main** and **compare: deploy/railway-vercel-fix** → **Create pull request**.
   - Add a title, e.g. "Add Railway config, Vercel SPA fix, and deploy docs".
   - Create the PR. Wait for **CodeRabbit** to finish (required check).
   - Then click **Merge pull request** → **Confirm merge**. After merge, the new files will be on `main`.

**If you have not committed yet:**

1. Stage, commit, create branch, push branch:
```powershell
git add backend/railway.toml backend/runtime.txt fms-frontend/vercel.json GITHUB_VERIFY_AND_GO_LIVE.md RAILWAY_DEPLOY_FIX.md FINAL_DEPLOY_CHECKLIST.md backend/app/main.py
git status
git commit -m "Add Railway config, Vercel SPA fix, and deploy docs"
git checkout -b deploy/railway-vercel-fix
git push origin deploy/railway-vercel-fix
```

2. On GitHub: open a **Pull Request** from `deploy/railway-vercel-fix` into `main`, wait for CodeRabbit, then **Merge**.

**3. Verify on GitHub after merge:**
- On the **Code** tab, branch **main**: you should see `backend/railway.toml`, `backend/runtime.txt`, `fms-frontend/vercel.json`, and the deploy docs.

---

## Part B – What to do on Railway (backend deploy)

**1. Set Root Directory**
- Go to **https://railway.app** → your project → select the **backend** service (e.g. “IP-Internal-manage-Software”).
- Open **Settings**.
- Find **Root Directory** (under General or Build).
- Set it to **`backend`** (no leading or trailing slash).
- Save.

**2. Redeploy**
- If the service is connected to GitHub, a new deployment may start automatically after your push.
- Otherwise: **Deployments** → **⋯** on the latest deployment → **Redeploy**.
- Wait until the build and deploy finish (Build image and Deploy should be green).

**3. Set variables (if not already set)**
- In the same service, go to **Variables** (or **Settings** → **Variables**).
- Add (replace with your real values):

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `CORS_ORIGINS` | Your frontend URL, e.g. `https://your-app.vercel.app` |

If your app uses a database URL, add `DATABASE_URL` or `SUPABASE_DB_URL` as well.

**4. Get the backend URL**
- In the service: **Settings** → **Networking** (or **Generate Domain**).
- Copy the public URL (e.g. `https://xxxx.up.railway.app`). No trailing slash.

**5. Test the backend**
- In a browser open: `https://YOUR-RAILWAY-URL/health`
- You should see: `{"status":"ok","message":"Backend is running"}`.

---

## Part C – After Railway is working

1. **Vercel (frontend)**  
   - Set **VITE_API_BASE_URL** to your Railway URL (e.g. `https://xxxx.up.railway.app`).  
   - Redeploy the frontend.

2. **Supabase**  
   - **Authentication** → **URL Configuration** → **Redirect URLs**: add your Vercel frontend URL (e.g. `https://your-app.vercel.app`).

3. **End-to-end test**  
   - Open the frontend URL → log in → create a ticket and confirm it works.

---

## Quick reference

| Where | Action |
|-------|--------|
| **GitHub** | Push: `git add` → `git commit` → `git pull origin main --rebase` → `git push origin main`. Verify repo has `backend/railway.toml`, `backend/runtime.txt`, `fms-frontend/vercel.json`. |
| **Railway** | Set Root Directory = `backend` → Redeploy → Set Variables (Supabase + CORS) → Copy URL → Test `/health`. |
| **Vercel** | Set `VITE_API_BASE_URL` = Railway URL → Redeploy. |
| **Supabase** | Add frontend URL to Auth redirect URLs. |

For more detail, see **GITHUB_VERIFY_AND_GO_LIVE.md** (Part 3) and **RAILWAY_DEPLOY_FIX.md**.
