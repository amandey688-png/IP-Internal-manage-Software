# Railway backend deploy fix – step by step

If you see **"Railpack could not determine how to build the app"** or **"Error creating build plan with Railpack"**, the backend service is building from the repo root instead of the `backend/` folder. Follow the steps below.

---

## What was changed in the repo

- **`backend/railway.toml`** – Tells Railway how to run the app: start command (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) and healthcheck (`/health`).
- **`backend/runtime.txt`** – Pins Python to 3.11 for the build.

You still **must set Root Directory to `backend`** in the Railway dashboard so Railway uses these files.

---

## Step 1 – Push the fix to GitHub

**1. Open PowerShell and go to the project root.**  
Your prompt should look like `PS C:\Support FMS to APPLICATION>`. If not, run:

```powershell
cd "C:\Support FMS to APPLICATION"
```

**2. Add the files (run one line at a time):**

```powershell
git add backend/railway.toml
git add backend/runtime.txt
git add GITHUB_VERIFY_AND_GO_LIVE.md
git add RAILWAY_DEPLOY_FIX.md
git add fms-frontend/vercel.json
git add backend/app/main.py
git status
```

You should see those files under "Changes to be committed". If you only want the Railway/docs fix and not `main.py` or `vercel.json`, omit those two `git add` lines. If you see "no changes added" or "paths did not match", you are not in the project root—run `cd "C:\Support FMS to APPLICATION"` and try again.

**3. Commit:**

```powershell
git commit -m "Add Railway config and root directory fix for backend deploy"
```

**4. Push (use your branch name if it’s not main):**

```powershell
git push origin main
```

If Git said **"Your branch and 'origin/main' have diverged"**, run `git pull origin main --rebase` first, then `git push origin main`. Use **main** only—do not use `master` or you'll get "src refspec master does not match any".

**If you get "cannot pull with rebase: You have unstaged changes":**

Git won’t pull while you have uncommitted changes. Commit everything, then pull and push:

```powershell
git add -A
git status
git commit -m "Add Railway config and deploy doc updates"
git pull origin main --rebase
git push origin main
```

If you prefer to stash your changes, pull, push, then put them back: `git stash -u` → `git pull origin main --rebase` → `git push origin main` → `git stash pop`. Then commit and push any new changes.

**If you get an error when pushing:**

| Error | What to do |
|-------|------------|
| **"Authentication failed"** or **"Permission denied"** | Sign in to GitHub again. Use a [Personal Access Token](https://github.com/settings/tokens) as the password when Git asks. |
| **"failed to push some refs"** / **"Updates were rejected"** / **non-fast-forward** | Your local branch is behind GitHub. First fix any "unstaged changes" (see above), then run `git pull origin main --rebase`, then `git push origin main`. If rebase gives conflicts, use `git pull origin main` instead, then push. |
| **"branch 'main' does not exist"** | Check your branch: `git branch`. Then push that branch, e.g. `git push origin master`. |
| **"src refspec master does not match any"** | You're on `main`, not `master`. Use `git push origin main` (and pull first if you got "rejected" above). |
| **"nothing added to commit"** | The files may already be committed. Run `git status`; if it says "nothing to commit, working tree clean", you’re done—go to Step 2 (Railway). |
| **"pathspec did not match any file(s)"** | Make sure you’re in the project root (`cd "C:\Support FMS to APPLICATION"`) and the files exist in `backend\` and the repo root. |

---

## Step 2 – Set Root Directory in Railway

1. Open **https://railway.app** and sign in.
2. Open your project and select the **backend service** (e.g. "IP-Internal-manage-Software").
3. Go to **Settings**.
4. Find **Root Directory** (under **General** or **Build**).
5. Set it to **`backend`** (no leading slash, no trailing slash).
6. Save.

---

## Step 3 – Redeploy

- If the service is connected to GitHub, a new deployment may start automatically after you push.
- Otherwise: open **Deployments** → click **⋯** on the latest deployment → **Redeploy**.

Wait for the build to finish. The build should show **Build image** (and **Deploy**) as successful.

---

## Step 4 – Test the backend

1. **Get the public URL**  
   In Railway: your service → **Settings** → **Networking** (or **Generate Domain**) → copy the public URL (e.g. `https://xxx.up.railway.app`).

2. **Health check**  
   In a browser or with curl:
   ```text
   https://YOUR-RAILWAY-URL/health
   ```
   You should see something like: `{"status":"ok","message":"Backend is running"}`.

3. **Optional – test from frontend**  
   In Vercel (or your frontend host), set `VITE_API_BASE_URL` to the Railway URL and redeploy. Then open the app, log in, and create a ticket to confirm the API works.

---

## If the build still fails

- Confirm **Root Directory** is exactly **`backend`** (case-sensitive, no slashes).
- In **Deployments** → latest deployment → **View logs**, check that the build context shows files like `app/main.py`, `requirements.txt`, `railway.toml` (i.e. contents of `backend/`), not `fms-frontend/` or repo root files.
- If your service has a **Start Command** in Settings, set it to:  
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`  
  (or leave it empty so `backend/railway.toml` is used.)

---

## Next steps after backend is live

1. Set **CORS**: In Railway **Variables**, add `CORS_ORIGINS` with your frontend URL (e.g. `https://your-app.vercel.app`).
2. Set **Supabase** env vars in Railway: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and `DATABASE_URL` (or `SUPABASE_DB_URL`) if your app uses it.
3. Point the frontend at the backend: set `VITE_API_BASE_URL` to your Railway URL and redeploy the frontend.
4. Add the frontend URL to Supabase **Authentication** → **URL Configuration** → **Redirect URLs**.

See **GITHUB_VERIFY_AND_GO_LIVE.md** (Part 3) for the full deploy and env setup.
