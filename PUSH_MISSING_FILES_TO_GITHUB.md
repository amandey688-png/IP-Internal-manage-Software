# Push missing files to GitHub

These files exist locally but are **not on GitHub** yet:
- `backend/railway.toml`
- `backend/runtime.txt`

(Also ensure `fms-frontend/vercel.json` and deploy docs are on GitHub.)

Because your repo requires **Pull Requests**, use a branch and PR.

---

## Step 1: Open PowerShell in project root

```powershell
cd "C:\Support FMS to APPLICATION"
```

---

## Step 2: Create a new branch (from current main)

```powershell
git fetch origin
git checkout main
git pull origin main
git checkout -b add-railway-and-vercel-files
```

---

## Step 3: Add the missing files

```powershell
git add backend/railway.toml
git add backend/runtime.txt
git add fms-frontend/vercel.json
git status
```

If you also want to add the deploy docs (they may already be on GitHub):

```powershell
git add FIX_RAILWAY_BUILD_ERROR.md RAILWAY_SETUP_EXACT_STEPS.md RAILWAY_ROOT_DIRECTORY_FIX.md FINAL_DEPLOY_CHECKLIST.md
git status
```

---

## Step 4: Commit

```powershell
git commit -m "Add backend railway.toml, runtime.txt, and vercel.json for deploy"
```

---

## Step 5: Push the branch

```powershell
git push origin add-railway-and-vercel-files
```

---

## Step 6: Open Pull Request on GitHub

1. Go to **https://github.com/amandey688-png/IP-Internal-manage-Software**
2. You should see **"add-railway-and-vercel-files had recent pushes"** → click **Compare & pull request**
3. Or: **Pull requests** → **New pull request** → **base: main**, **compare: add-railway-and-vercel-files** → **Create pull request**
4. Title: e.g. **Add backend railway.toml, runtime.txt, and vercel.json**
5. **Create pull request**
6. Wait for **CodeRabbit** to finish
7. Click **Merge pull request** → **Confirm merge**

---

## Step 7: Verify on GitHub

- **Code** tab → branch **main**
- Confirm these exist:
  - `backend/railway.toml`
  - `backend/runtime.txt`
  - `fms-frontend/vercel.json`

---

## If you get "nothing to commit" or "already up to date"

- Run `git status` to see if files are already committed.
- If they're already in a previous commit but not on GitHub, that commit may be on another branch. Run:
  ```powershell
  git log --oneline -5
  git branch -a
  ```
  Then push the branch that has the commit: `git push origin <branch-name>` and open a PR from that branch to `main`.

---

## Quick copy-paste (all commands)

```powershell
cd "C:\Support FMS to APPLICATION"
git fetch origin
git checkout main
git pull origin main
git checkout -b add-railway-and-vercel-files
git add backend/railway.toml backend/runtime.txt fms-frontend/vercel.json
git status
git commit -m "Add backend railway.toml, runtime.txt, and vercel.json for deploy"
git push origin add-railway-and-vercel-files
```

Then on GitHub: **Compare & pull request** → create PR → wait for CodeRabbit → **Merge**.
