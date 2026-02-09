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
