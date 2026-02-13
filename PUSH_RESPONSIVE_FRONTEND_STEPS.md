# Push Responsive Frontend – Steps

Your repo requires changes via **Pull Request**. Follow these steps to push the responsive frontend updates.

---

## Step 1: Check Current Branch

```powershell
cd "c:\Support FMS to APPLICATION"
git status
git branch
```

If you're on `main`, switch to a new branch or use the one we'll create.

---

## Step 2: Create Feature Branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/responsive-frontend
```

---

## Step 3: Stage and Commit

```powershell
git add .
git status
git commit -m "feat: responsive frontend for PC, tablet & mobile"
```

---

## Step 4: Push to GitHub

```powershell
git push -u origin feature/responsive-frontend
```

---

## Step 5: Create Pull Request

1. Open: **https://github.com/amandey688-png/IP-Internal-manage-Software/pull/new/feature/responsive-frontend**
2. **Base:** `main`
3. **Compare:** `feature/responsive-frontend`
4. **Title:** `feat: responsive frontend for PC, tablet & mobile`
5. **Description** (optional):
   ```
   - Sidebar: Drawer on mobile/tablet (< 1024px), fixed Sider on desktop
   - Header: Hamburger menu on mobile, responsive padding
   - Content: Adaptive margins and padding
   - Auth pages: Full-width cards on mobile
   - Tables: Horizontal scroll on small screens
   ```
6. Click **Create pull request**

---

## Step 6: Wait for Checks & Merge

- Wait for **CodeRabbit** to pass
- Click **Merge pull request** when ready
- Vercel will deploy the frontend automatically

---

## What Was Changed

| File | Change |
|------|--------|
| `fms-frontend/src/styles/responsive.css` | New responsive breakpoints |
| `fms-frontend/src/main.tsx` | Import responsive.css |
| `fms-frontend/src/components/layout/Sidebar.tsx` | Drawer on mobile/tablet |
| `fms-frontend/src/components/layout/AppLayout.tsx` | Sidebar state, responsive margin |
| `fms-frontend/src/components/layout/Header.tsx` | Hamburger button on mobile |
| `fms-frontend/src/pages/auth/Login.tsx` | auth-card class |
| `fms-frontend/src/pages/auth/Register.tsx` | auth-card class |
