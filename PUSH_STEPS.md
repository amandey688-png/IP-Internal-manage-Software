# Step-by-step: Push changes to GitHub and go live

Use this when you have local fixes and want to push and deploy.

---

## 1. Check what changed

```powershell
cd "c:\Support FMS to APPLICATION"
git status
```

You should see modified files (e.g. `backend/app/main.py`).

---

## 2. Stage and commit

```powershell
git add backend/app/main.py
# Or stage everything: git add .
git status
git commit -m "fix: normalize role names so master_ad is treated as master_admin for Users list"
```

---

## 3. Push to your branch

**If you're on `add-railway-and-vercel-files` (or another feature branch):**

```powershell
git branch
git push origin add-railway-and-vercel-files
```

If Git says "no upstream branch", run once:

```powershell
git push --set-upstream origin add-railway-and-vercel-files
```

**If you're on `main` and your repo allows direct push:**

```powershell
git push origin main
```

**If `main` is protected (needs a review):**

- Push your branch (e.g. `add-railway-and-vercel-files`) as above.
- On GitHub: **Pull requests** → **New pull request**.
- Base: `main`, Compare: `add-railway-and-vercel-files`.
- Create PR, get it approved, then **Merge**.

---

## 4. Deploy backend (Render)

- Render usually **auto-deploys** when you push to the branch it watches (e.g. `main`).
- If you merged a PR into `main`, wait 1–2 minutes and check Render **Deployments**.
- If you only pushed a feature branch, either merge to `main` first or trigger a manual deploy from that branch in Render (if configured).

---

## 5. Verify

1. Log in to the app as **Aman** (master admin).
2. Open **Users**.
3. You should see the user list (no "Only Admin or Master Admin" warning, no "No data").

---

## Quick reference

| Step            | Command / action                                      |
|----------------|--------------------------------------------------------|
| See changes    | `git status`                                          |
| Stage          | `git add backend/app/main.py` or `git add .`          |
| Commit         | `git commit -m "your message"`                        |
| Push branch    | `git push origin add-railway-and-vercel-files`        |
| Set upstream   | `git push --set-upstream origin <branch>` (first time) |
| Merge to main  | GitHub → Pull request → Merge                          |
