# Create Pull Request – Postmark Fix

Your branch **fix/postmark-api-production** has been pushed to GitHub.

Direct push to `main` is blocked by repository rules. You must merge via a Pull Request.

---

## Step 1: Open Pull Request Link

Click this link to create the PR:

**https://github.com/amandey688-png/IP-Internal-manage-Software/pull/new/fix/postmark-api-production**

---

## Step 2: Create the PR on GitHub

1. **Base branch:** `main`
2. **Compare branch:** `fix/postmark-api-production`
3. **Title:** `fix: use Postmark HTTP API in production (SMTP blocked on Render)`
4. **Description** (optional):

   ```text
   - Use Postmark HTTP API instead of SMTP on Render (SMTP ports blocked)
   - Add Accept header for Postmark API
   - Update deployment docs
   ```

5. Click **Create pull request**

---

## Step 3: Wait for CodeRabbit Check

- CodeRabbit (required status check) will run on the PR
- Wait for it to complete and pass
- If it fails, fix the reported issues and push to the same branch

---

## Step 4: Merge the PR

Once checks pass:

1. Click **Merge pull request**
2. Confirm merge
3. Delete the branch (optional)

---

## Step 5: Render Will Auto-Deploy

If Render is connected to GitHub `main`, it will deploy after the merge.

---

## If You Need to Push More Changes

```powershell
cd "c:\Support FMS to APPLICATION"
git checkout fix/postmark-api-production
# make changes...
git add .
git commit -m "your message"
git push origin fix/postmark-api-production
```
