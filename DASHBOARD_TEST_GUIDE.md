# Dashboard – Step-by-Step Testing Guide

Use this to verify the dashboard loads correctly, text wraps, and nothing is blank.

---

## Prerequisites

1. **Backend** running (e.g. port 8000):
   ```powershell
   cd "c:\Support FMS to APPLICATION\backend"
   $env:PYTHONIOENCODING="utf-8"
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Frontend** running (e.g. port 3003):
   ```powershell
   cd "c:\Support FMS to APPLICATION\fms-frontend"
   npm run dev
   ```

3. Browser: open **http://localhost:3003** (or the URL shown by `npm run dev`).

---

## Step 1: Login

1. Go to **http://localhost:3003** (or **http://localhost:3003/login**).
2. Enter your email and password.
3. Click **Login** (and complete OTP if enabled).
4. You should land on the **Dashboard** (or the default post-login page).

**Pass:** You see the app layout (sidebar + header), not a blank white screen.

---

## Step 2: Dashboard loads (no white screen)

1. If you are not on the dashboard, click **Dashboard** in the sidebar (or open **http://localhost:3003/dashboard**).
2. Wait 1–2 seconds for data to load.

**Pass:** You see:
- A purple **Support Overview** card at the top.
- Five metric cards in a row (Chores & Bug this month, Response Delay, Completion Delay, Total Last Week, Pending Last Week).
- **In Staging** section with two cards (Feature Pending, Chores & Bug Pending).
- **Response Delay Trend** and **Completion Delay Trend** cards.
- **Average tickets created** and **Recent tickets (Chores & Bug)** cards.

**Fail:** White/blank screen → open browser **Developer Tools** (F12) → **Console** tab. Note any red errors and share them.

---

## Step 3: Support Overview is clickable

1. On the dashboard, click the purple **Support Overview** card (anywhere on it).
2. The URL should change to **http://localhost:3003/tickets?section=chores-bugs**.
3. The page should show the **Chores & Bug** ticket list (table with filters).

**Pass:** Navigation works and the list shows only Chores & Bug tickets (or “No tickets yet” if empty).

---

## Step 4: Text wraps (minimal space)

1. Go back to the dashboard (**Dashboard** in sidebar or **http://localhost:3003/dashboard**).
2. Resize the browser window to be **narrow** (e.g. half screen or mobile width).
3. Check:
   - **Support Overview** title and subtitle wrap to the next line instead of overflowing.
   - Metric card labels (e.g. “Chores & Bug (this month)”, “Completion Delay”) wrap.
   - **In Staging** card titles wrap.
   - **Recent tickets** list: long ticket titles wrap inside their row.

**Pass:** No horizontal scrollbar caused by text; long text wraps within the layout.

---

## Step 5: Metrics show numbers (no crash)

1. On the dashboard, confirm all metric cards show **numbers** (0 or positive).
2. **In Staging** cards show numbers (0 if no pending staging).
3. **Recent tickets** shows a list (or “No tickets yet”).

**Pass:** All cards render; no “undefined” or “NaN”; no console errors.

---

## Step 6: Recent tickets clickable

1. If there are recent tickets, click one row.
2. You should navigate to that ticket’s detail page.
3. Click **View all** on the Recent tickets card → should go to Chores & Bug list (**/tickets?section=chores-bugs**).

**Pass:** Both actions work without errors.

---

## Step 7: Retry on error

1. Stop the **backend** (Ctrl+C in the backend terminal).
2. Refresh the dashboard (F5).
3. You should see an **error message** and a **Retry** button (not a blank screen).
4. Start the backend again and click **Retry**.
5. The dashboard should load again.

**Pass:** Error state is visible and Retry recovers when the backend is back.

---

## Quick checklist

| Step | What to do | Pass condition |
|------|------------|----------------|
| 1 | Login | You reach the app (sidebar + header). |
| 2 | Open Dashboard | All sections visible; no white screen. |
| 3 | Click Support Overview | Navigates to Chores & Bug tickets. |
| 4 | Resize window | All text wraps; no overflow. |
| 5 | Check metrics | All cards show numbers; no undefined/NaN. |
| 6 | Click recent ticket / View all | Navigation works. |
| 7 | Stop backend → Refresh → Retry | Error shown; Retry works. |

---

## If the screen is still blank

1. Open **Developer Tools** (F12) → **Console**.
2. Look for **red errors** (e.g. “APP_NAME is not defined”, “Cannot read property of undefined”).
3. In **Network** tab, check:
   - **/dashboard/metrics** → status 200 and JSON body with numbers.
   - **/tickets?…** → status 200 if you click Support Overview or View all.
4. Ensure you pulled the latest code (including the **APP_NAME** fix in `App.tsx` and Dashboard wrap/defensive fixes).
5. Hard refresh: **Ctrl+Shift+R** (or Cmd+Shift+R on Mac).

If you share the exact error message from the Console (and, if useful, a screenshot), the fix can be narrowed down further.
