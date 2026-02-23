# Fix "Connection failed" on industryprime.vercel.app

## What Was Fixed (Code)

1. **Backend CORS** – FastAPI now:
   - Reads `CORS_ORIGIN`, `CORS_ORIGIN_1`, `CORS_ORIGIN_2`, ... `CORS_ORIGIN_10` (Render-style)
   - Includes `https://industryprime.vercel.app` in the default production CORS list
   - You can use either `CORS_ORIGINS` (comma-separated) or individual `CORS_ORIGIN_*` vars on Render

## What You Must Do

### 1. Vercel (frontend)

1. Open [Vercel Dashboard](https://vercel.com) → your project
2. Go to **Settings** → **Environment Variables**
3. Add or update:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://ip-internal-manage-software.onrender.com`
   - No trailing slash
4. Save
5. Redeploy: **Deployments** → ⋮ → **Redeploy**

### 2. Render (backend)

If you use `CORS_ORIGIN_5` = `https://industryprime.vercel.app`, the updated backend will pick it up.

Or set a single var:
- **Key:** `CORS_ORIGINS`
- **Value:** `https://industryprime.vercel.app`

Redeploy the Render service after any env change.

### 3. Render cold starts

On free tier, the backend sleeps after ~15 minutes. The first request after that can take 30–60 seconds and may time out. Wait ~1 minute and refresh, or use a keep-alive (e.g. UptimeRobot hitting `/health` every 5 minutes).
