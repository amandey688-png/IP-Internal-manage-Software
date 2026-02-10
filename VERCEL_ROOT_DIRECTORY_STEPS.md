# Where to set Root Directory in Vercel

**Root Directory** is set per **project**, not in Team Settings.

---

## Steps

### 1. Leave Team Settings

You are currently in **Settings** for the **team** "aman-projects" (Team Name, Team URL, etc.). That page does **not** have Root Directory.

### 2. Open your project

1. Click **Vercel** logo (top left) or go to **https://vercel.com**.
2. On the dashboard, find and click the **project** that is linked to your repo **IP-Internal-manage-Software** (or the one that deploys your frontend).  
   - It might be named like "IP-Internal-manage-Software", "fms-frontend", or "amans-projects" – the one that shows deployments from your GitHub repo.

### 3. Open that project’s Settings

- Inside that **project**, click **Settings** (project settings, not team settings).

### 4. Set Root Directory

1. In the project’s **Settings**, check the left sidebar.
2. Click **General** (or **Build and Deployment**).
3. Scroll until you see **Root Directory**.
4. Click **Edit** (or the field).
5. Enter: **`fms-frontend`** (no slashes).
6. Click **Save**.

### 5. Redeploy

- Go to **Deployments** for that project.
- Open the **failed** deployment (from branch `add-railway-and-vercel-files`) → **⋯** → **Redeploy**.

---

## Summary

| Where you are now | What to do |
|-------------------|------------|
| **Team** Settings (aman-projects) | Go back to dashboard → open the **project** that deploys your app. |
| **Project** Settings | Open **General** or **Build and Deployment** → set **Root Directory** = `fms-frontend` → Save → Redeploy the failed deployment. |
