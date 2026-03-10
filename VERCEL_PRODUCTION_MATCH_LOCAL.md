# Production frontend matches local – checklist

If **production shows an old frontend** but local shows the new one, use this checklist.

## 1. Vercel Root Directory (most common cause)

- In **Vercel** → your project → **Settings** → **General**
- Set **Root Directory** to **`fms-frontend`** (no leading/trailing slash)
- If this was wrong, Vercel was building from repo root and can serve an old or broken build.
- After changing: **Redeploy** (Deployments → ⋯ → Redeploy).

## 2. Production branch

- In **Vercel** → **Settings** → **Git**
- Ensure **Production Branch** is **`main`** (or the branch you merge to for releases).
- Production deploys only from this branch.

## 3. Cache (browser / CDN)

- This repo sets **no-cache** for `index.html` in `fms-frontend/vercel.json` so each deploy serves fresh HTML and new asset URLs.
- If you still see old UI: do a **hard refresh** (Ctrl+Shift+R or Cmd+Shift+R) or clear site data for the production URL.

## 4. Redeploy after merge

- After merging to `main`, trigger a **Production** deploy (or wait for Vercel auto-deploy).
- In **Deployments**, confirm the latest deployment is from `main` and **succeeded**.

---

**Summary:** Set Root Directory = `fms-frontend`, Production Branch = `main`, redeploy, then hard refresh. Production should match local.
