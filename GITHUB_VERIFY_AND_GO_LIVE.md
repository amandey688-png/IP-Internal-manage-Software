# ✅ GitHub Verification & Go Live Checklist

Use this to **check everything is on GitHub** and then **deploy for everyone**.

---

## Part 1: Make Sure Everything Is on GitHub

### Step 1 – Commit all current work (if you have uncommitted changes)

Open a terminal in the **project root** (the folder that contains `fms-frontend`, `backend`, `database`). If you need to change into that folder first, run one of these (use your actual path):

- **Windows PowerShell:** `cd "C:\Support FMS to APPLICATION"`
- **macOS / Linux:** `cd "/path/to/Support FMS to APPLICATION"` or `cd ./Support\ FMS\ to\ APPLICATION` if you are in the parent folder.

Then run:

```powershell
# See what's not committed
git status
```

**Example output:**
```
On branch main
Your branch is ahead of 'origin/main' by 3 commits.
  (use "git push" to publish your local commits)

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   GITHUB_VERIFY_AND_GO_LIVE.md
        modified:   fms-frontend/src/components/common/PrintExport.tsx
        modified:   fms-frontend/src/pages/Dashboard.tsx
        modified:   fms-frontend/src/pages/Staging/StagingList.tsx
        modified:   fms-frontend/src/pages/Tickets/TicketList.tsx
        modified:   fms-frontend/src/utils/helpers.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

**If you see unstaged changes** (like above), stage and commit them:

```powershell
# Add everything
git add .

# Commit with a clear message
git commit -m "Fix docs, export, stage filter, a11y, and helpers"

# If nothing to commit, git will say "nothing to commit, working tree clean"
```

**Note:** If `git status` shows "Your branch is ahead of 'origin/main' by X commits", you have local commits that haven't been pushed yet. You'll push them in Step 2.

### Step 2 – Push to GitHub

**If `git status` showed "Your branch is ahead of 'origin/main' by X commits"**, you have local commits that need to be pushed. Push them now:

```powershell
# Push main to GitHub (so everyone sees the latest code)
git push origin main
```

**Expected output:** You should see something like:
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Writing objects: 100% (X/X), done.
To https://github.com/amandey688-png/IP-Internal-manage-Software.git
   abc1234..def5678  main -> main
```

If you use another branch for release (e.g. `release/production`), push that too:

```powershell
git push origin main
# or: git push origin your-branch-name
```

**If you get "push declined due to repository rule violations" or "Changes must be made through a pull request":**  
Your repo requires PRs and (e.g.) CodeRabbit. Push to a **branch**, then open a **Pull Request** and merge:
```powershell
git checkout -b deploy/railway-vercel-fix
git push origin deploy/railway-vercel-fix
```
Then on GitHub: **Compare & pull request** (or **Pull requests** → **New pull request**: base `main`, compare `deploy/railway-vercel-fix`) → create PR → wait for CodeRabbit → **Merge**. See **FINAL_DEPLOY_CHECKLIST.md** (Part A) for the full steps.

### Step 3 – Verify on GitHub

1. **Open your repo:**  
   https://github.com/amandey688-png/IP-Internal-manage-Software

2. **Check branch**  
   - Click the branch dropdown (e.g. "main").  
   - Confirm the branch you pushed is selected.

3. **Confirm latest commit**  
   - On the repo home you see the latest commit message and time.  
   - It should match the commit you just pushed.

4. **Check nothing is missing**  
   - **Code** tab: Browse `fms-frontend/`, `backend/`, `database/` and spot-check important files.  
   - **Commits** tab: Click "Commits" and confirm your recent commits (e.g. "Add Print/Export...", "Add deployment guides") are listed.

5. **Optional – compare with local**  

   ```powershell
   git fetch origin
   git status
   ```  

   You want: **"Your branch is up to date with 'origin/main'."**  
   If it says "ahead of 'origin/main'" then run `git push origin main` again.

---

## Part 2: Quick “Is everything on GitHub?” checklist

- [ ] `git status` shows no uncommitted changes (or you committed them and then pushed).
- [ ] `git push origin main` (or your release branch) completed without errors.
- [ ] On GitHub, the **Code** tab shows the correct branch and latest commit.
- [ ] On GitHub, **Commits** list includes your latest commit messages.
- [ ] Important folders (`fms-frontend`, `backend`, `database`) and key files are present on GitHub.

If all are yes, your code is properly on GitHub.

---

## Part 3: Go live for everyone (deploy)

After GitHub is verified, follow these steps to deploy the app so everyone can use it.

---

### Step 3.1 – Deploy the frontend (React/Vite) to Vercel

1. Open **https://vercel.com** and sign in with your **GitHub** account.
2. Click **"Add New"** → **"Project"**.
3. **Import** your repo: `amandey688-png/IP-Internal-manage-Software` (select it and click **Import**).
4. **Configure the project:**
   - **Root Directory:** Click **Edit**, set to `fms-frontend`, then **Continue**.
   - **Framework Preset:** Vite (usually auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
   - **Install Command:** `npm install` (default).
5. **Environment variables** – Click **Environment Variables** and add (replace with your real values):

   | Name | Value | Notes |
   |------|--------|--------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL | From Supabase → Settings → API |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | From Supabase → Settings → API |
   | `VITE_API_BASE_URL` | `https://placeholder.com` | Replace with your backend URL (Step 3.2) after deploy; no trailing slash |

6. Click **Deploy** and wait for the build to finish.
7. **Copy your frontend URL** (e.g. `https://your-app-name.vercel.app`). You will need it for the backend and Supabase.

---

### Step 3.2 – Deploy the backend (FastAPI) to Railway

**Important:** This repo is a monorepo (frontend + backend + database). Railway must build only the **backend** folder. Set **Root Directory** to `backend` first; otherwise you will see "Railpack could not determine how to build the app" or "Error creating build plan with Railpack".

1. Open **https://railway.app** and sign in with **GitHub**.
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Select the repo: **IP-Internal-manage-Software** (or `amandey688-png/IP-Internal-manage-Software`).
4. After the repo is linked, open the new **service** and go to **Settings**.
5. **Set Root Directory (required):** In **Settings** → **General** (or **Build**), find **Root Directory**. Set it to **`backend`** (no leading slash). This makes Railway build only the Python app; the repo’s `backend/railway.toml` and `backend/requirements.txt` will be used.
6. **Start command:** The repo’s `backend/railway.toml` already sets the start command. If you prefer to set it in the dashboard: **Settings** → **Deploy** → **Start Command** = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
7. **Environment variables** – In **Variables** (or **Settings** → **Variables**), add:

   | Name | Value |
   |------|--------|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (secret) |
   | `SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `DATABASE_URL` or `SUPABASE_DB_URL` | Your Supabase database connection string (if your backend uses it) |

8. **Deploy:** Railway will build and deploy. When it’s done, open the service and go to **Settings** → **Networking** (or **Generate Domain**). **Generate a public URL**.
9. **Copy your backend URL** (e.g. `https://your-backend.up.railway.app`). Do **not** add a trailing slash.

---

### Step 3.3 – Wire frontend to backend and Supabase

1. **Update frontend API URL (Vercel):**
   - In Vercel, open your project → **Settings** → **Environment Variables**.
   - Edit `VITE_API_BASE_URL` and set it to your **Railway backend URL** (e.g. `https://your-backend.up.railway.app`). Use no trailing slash.
   - Save, then go to **Deployments** → open the **⋯** menu on the latest deployment → **Redeploy** (so the new env is used).

2. **Add frontend URL in Supabase:**
   - Open **https://supabase.com** → your project → **Authentication** → **URL Configuration**.
   - Under **Redirect URLs**, add your **Vercel frontend URL**, e.g. `https://your-app-name.vercel.app`.
   - Add also with trailing slash if you use it: `https://your-app-name.vercel.app/`.
   - Save.

3. **(Optional) Backend CORS:** If your backend allows only specific origins, add your Vercel URL (e.g. `https://your-app-name.vercel.app`) to the CORS allowed origins in `backend/app/main.py` (or your CORS config), then redeploy the backend.

---

### Step 3.4 – Test that everything works

1. Open your **frontend URL** in a browser (e.g. `https://your-app-name.vercel.app`).
2. **Register** a new user or **log in**.
3. Create a **support ticket** and confirm it appears.
4. Check that **Dashboard**, **Tickets**, and **Users** (if you have access) load without errors.

If something fails, check:  
- Browser console (F12) for frontend/API errors.  
- Railway logs for backend errors.  
- Supabase Auth redirect URL and env vars (frontend and backend).

---

### Step 3.5 – Share the app

1. Share the **frontend URL** (e.g. `https://your-app-name.vercel.app`) with your team.
2. Tell users to **bookmark** it and use it for logging in and creating tickets.

---

**More options:**

- **Frontend:** Netlify – same idea: connect repo, root `fms-frontend`, build `npm run build`, output `dist`, same env vars.
- **Backend:** Render – connect repo, root `backend`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, same env vars.

For a faster path, see **QUICK_DEPLOY.md**. For full detail, see **DEPLOYMENT_GUIDE.md**.

---

### If you see "404: NOT FOUND" on Vercel after deploy

The app is a single-page app (SPA). Vercel must serve `index.html` for every path (e.g. `/`, `/login`, `/tickets`) so the frontend router can work. Without that, you get 404.

**Fix (already added in this repo):** The file **`fms-frontend/vercel.json`** tells Vercel to send all requests to `index.html`. Do the following so Vercel uses it:

1. **Commit and push the fix**
   - In your project root (e.g. `C:\Support FMS to APPLICATION`):
   ```powershell
   git add fms-frontend/vercel.json
   git commit -m "Add Vercel SPA rewrites to fix 404"
   git push origin main
   ```
2. **Redeploy on Vercel**
   - Open **https://vercel.com** → your project (e.g. "amans-projects").
   - Vercel often auto-deploys when you push. If a new deployment appears, wait for it to finish.
   - If not: go to **Deployments** → click **⋯** on the latest → **Redeploy**.
3. **Check the app**
   - Open your project URL again (e.g. `https://amans-projects-xxx.vercel.app`). You should see the app (login/dashboard) instead of 404.
4. **If 404 remains**
   - In Vercel → **Settings** → **General**:
     - **Root Directory** must be `fms-frontend` (so `vercel.json` is in the deploy root).
   - In **Settings** → **Build & Development**:
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   Save and redeploy.

---

### If Railway build fails: "Railpack could not determine how to build" / "Error creating build plan with Railpack"

This happens when Railway builds from the **repo root** instead of the `backend/` folder. Fix it as follows:

1. **In Railway dashboard**
   - Open your project → select the **backend service** (e.g. "IP-Internal-manage-Software").
   - Go to **Settings**.
   - Find **Root Directory** (under General or Build).
   - Set it to **`backend`** (exactly, no leading slash).
   - Save, then trigger a **Redeploy** (Deployments → ⋯ on latest → Redeploy).

2. **Ensure config is in the repo**
   - The repo should contain `backend/railway.toml` (start command, healthcheck) and `backend/runtime.txt` (Python 3.11). If you added them locally, commit and push (step 3).

3. **Commit and push the fix (if you added or changed backend config files)**
   ```powershell
   git add backend/railway.toml backend/runtime.txt
   git status
   git commit -m "Add Railway config and root directory fix for backend deploy"
   git push origin main
   ```
   After pushing, Railway will redeploy automatically if connected to GitHub. Otherwise, click **Redeploy** in Railway.

---

## Useful Git commands (reference)

| Goal                    | Command |
|-------------------------|--------|
| See status              | `git status` |
| See remote              | `git remote -v` |
| See branches            | `git branch -a` |
| See unpushed commits    | `git log origin/main..HEAD --oneline` |
| Push main               | `git push origin main` |
| Fetch and compare       | `git fetch origin` then `git status` |

---

## Your repo

- **GitHub:** https://github.com/amandey688-png/IP-Internal-manage-Software  
- **Deploy (quick):** See **QUICK_DEPLOY.md**  
- **Deploy (full):** See **DEPLOYMENT_GUIDE.md**
