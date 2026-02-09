# Railway backend deploy fix – step by step

If you see **"Railpack could not determine how to build the app"** or **"Error creating build plan with Railpack"**, the backend service is building from the repo root instead of the `backend/` folder. Follow the steps below.

---

## What was changed in the repo

- **`backend/railway.toml`** – Tells Railway how to run the app: start command (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) and healthcheck (`/health`).
- **`backend/runtime.txt`** – Pins Python to 3.11 for the build.

You still **must set Root Directory to `backend`** in the Railway dashboard so Railway uses these files.

---

## Step 1 – Push the fix to GitHub

From the project root (e.g. `C:\Support FMS to APPLICATION`):

```powershell
git add backend/railway.toml backend/runtime.txt
git status
git commit -m "Add Railway config and root directory fix for backend deploy"
git push origin main
```

If you also changed `GITHUB_VERIFY_AND_GO_LIVE.md`, add it:

```powershell
git add backend/railway.toml backend/runtime.txt GITHUB_VERIFY_AND_GO_LIVE.md
git commit -m "Add Railway config and deploy doc updates"
git push origin main
```

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
