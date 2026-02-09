# ✅ GitHub Verification & Go Live Checklist

Use this to **check everything is on GitHub** and then **deploy for everyone**.

---

## Part 1: Make Sure Everything Is on GitHub

### Step 1 – Commit all current work (if you have uncommitted changes)

In PowerShell, from the project root:

```powershell
cd "c:\Support FMS to APPLICATION"

# See what's not committed
git status

# Add everything
git add .

# Commit with a clear message
git commit -m "Add Print/Export standard fields, stage filter, and layout updates"

# If nothing to commit, git will say "nothing to commit, working tree clean"
```

### Step 2 – Push to GitHub

```powershell
# Push main to GitHub (so everyone sees the latest code)
git push origin main
```

If you use another branch for release (e.g. `release/production`), push that too:

```powershell
git push origin main
# or: git push origin your-branch-name
```

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

After GitHub is verified:

1. **Frontend (React/Vite)**  
   Deploy to **Vercel** or **Netlify** and point it at this repo.  
   → See **QUICK_DEPLOY.md** (fast) or **DEPLOYMENT_GUIDE.md** (detailed).

2. **Backend (FastAPI)**  
   Deploy to **Railway** or **Render** from the same repo (`backend/`).  
   → Same guides above.

3. **Environment**  
   - Set production env vars (e.g. `VITE_API_URL`, Supabase keys) in Vercel/Netlify and in Railway/Render.  
   - Add your frontend URL to Supabase Auth redirect URLs.

4. **Share**  
   Share the frontend URL (e.g. `https://your-app.vercel.app`) so everyone can use the app.

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
