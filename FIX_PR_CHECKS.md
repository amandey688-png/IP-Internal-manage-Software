# Fix PR #5 checks – Vercel failed & CodeRabbit pending

Your PR **"Add railway and vercel files" (#5)** has:
1. **Vercel — Deployment has failed** (must be fixed or skipped)
2. **CodeRabbit — Waiting for status / Review in progress** (required; wait or address feedback)

---

## 1. Fix Vercel deployment failure

Vercel is building your **branch** (preview deployment). It often fails when the project builds from the **repo root** instead of `fms-frontend/`.

### In Vercel dashboard

1. Go to **https://vercel.com** → your project (e.g. the one linked to `IP-Internal-manage-Software`).
2. Open **Settings** → **General**.
3. Find **Root Directory**.
4. Set it to **`fms-frontend`** (no leading or trailing slash).
5. **Save**.
6. **Redeploy the failing deployment:**
   - Go to **Deployments**.
   - Find the deployment that failed (e.g. from branch `add-railway-and-vercel-files`).
   - Click **⋯** → **Redeploy** (or trigger a new deploy by pushing an empty commit to the branch).

### Check the actual error

- In Vercel: **Deployments** → click the **failed** deployment → open **Building** or **Logs**.
- Note the error (e.g. "No build script", "Root directory not found", TypeScript/lint error).
- If the error is **Root Directory**: setting Root Directory to `fms-frontend` (above) fixes it.
- If the error is **missing env vars** for preview: in **Settings** → **Environment Variables**, add variables and enable them for **Preview** (not only Production).
- If the error is **TypeScript or build**: fix the reported file/line and push a new commit to the PR branch.

---

## 2. CodeRabbit (pending / required)

- **"Waiting for status to be reported"** – CodeRabbit is still running. Wait a few minutes and refresh the PR page; the check may turn green or report issues.
- **"Review in progress"** – When it finishes, you’ll get either:
  - **Approved** – you can merge once Vercel is green, or
  - **Changes requested** – open the **Files changed** tab, read CodeRabbit’s comments, fix them, push to the same branch, and re-request review or wait for it to run again.

You cannot merge until CodeRabbit’s required check passes (approve or no blocking comments).

---

## 3. After both checks pass

- On the PR page, click **Merge pull request** → **Confirm merge**.
- Then on **main**: set **Root Directory** in **Railway** to `backend` and redeploy (see **FIX_RAILWAY_BUILD_ERROR.md**).

---

## 4. Optional: merge without fixing Vercel (not recommended)

If the **only** blocker is Vercel and you don’t need preview deployments for this PR:

- A **repo admin** can temporarily set the branch protection rule so that **Vercel** is not a required check, merge the PR, then turn the requirement back on.
- Or merge via **command line** (only if your rules allow it and you’re okay skipping checks):
  ```bash
  git fetch origin
  git checkout main
  git pull origin main
  git merge origin/add-railway-and-vercel-files
  git push origin main
  ```
  This only works if the branch protection doesn’t block pushes to `main` when checks have failed.

**Best approach:** fix Vercel (Root Directory = `fms-frontend`), wait for CodeRabbit, then merge in the GitHub UI.

---

## Summary

| Check        | What to do |
|-------------|------------|
| **Vercel failed** | In Vercel: set **Root Directory** = `fms-frontend`, save, then **Redeploy** the failed deployment (or push a small commit to the PR branch). Check deployment logs if it still fails. |
| **CodeRabbit pending** | Wait for it to finish. If it requests changes, fix the comments and push to the same branch. |
| **Then** | Merge the PR when both are green. |
