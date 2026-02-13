# Git Push Fix – Remote Has New Commits

When you see `! [rejected] main -> main (fetch first)`, the remote GitHub has commits you don't have locally.

---

## Fix Steps

### Option A: Pull Then Push (Recommended)

```powershell
cd "c:\Support FMS to APPLICATION"

# 1. Pull remote changes and merge
git pull origin main

# 2. If there are merge conflicts, fix them, then:
#    git add .
#    git commit -m "merge remote main"

# 3. Push
git push origin main
```

---

### Option B: Pull with Rebase (Cleaner history)

```powershell
cd "c:\Support FMS to APPLICATION"

# 1. Pull and rebase your commits on top of remote
git pull --rebase origin main

# 2. If conflicts appear, resolve them, then:
#    git add .
#    git rebase --continue

# 3. Push
git push origin main
```

---

### Option C: Force Push (Use only if you're sure – overwrites remote)

⚠️ **Warning:** This overwrites remote. Use only if you know no one else pushed important changes.

```powershell
git push --force origin main
```

---

## Updated Step 3: Push Code (Full Flow)

```powershell
cd "c:\Support FMS to APPLICATION"

# Stage and commit
git add .
git commit -m "fix: use Postmark HTTP API in production (SMTP blocked on Render)"

# Pull first (integrate any remote changes)
git pull origin main

# Push
git push origin main
```

If `git pull` reports conflicts, Git will list the files. Edit those files to resolve conflicts, then:

```powershell
git add .
git commit -m "merge remote main"
git push origin main
```
