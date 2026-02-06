# How to Test the Application

## 1. Start the backend

Backend must run first so the frontend can connect.

**PowerShell:**
```powershell
cd "C:\Support FMS to APPLICATION\backend"
$env:PYTHONIOENCODING="utf-8"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Or use the batch file:**
```cmd
cd "C:\Support FMS to APPLICATION\backend"
start-backend-utf8.bat
```

**Expected:** `Uvicorn running on http://127.0.0.1:8000`

---

## 2. Check backend is reachable

- Open: **http://127.0.0.1:8000/health**  
  Should show: `{"status":"ok","message":"Backend is running"}`

- Or open: **http://127.0.0.1:8000/docs**  
  Should show Swagger API docs.

---

## 3. Start the frontend

In a **new** terminal:

```powershell
cd "C:\Support FMS to APPLICATION\fms-frontend"
npm run dev
```

**Expected:** Dev server on **http://localhost:3001** (or the port Vite prints).

---

## 4. Test in the browser

1. Open the app URL (e.g. **http://localhost:3001** or **http://localhost:3003** if you use `--port 3003`).
2. **Login page**
   - If backend is **not** running: you should see a message like *"Connection failed. Start the backend: ..."* after submitting.
   - If backend **is** running: enter email/password and click Login (or Register first).
3. **After login:** Dashboard, tickets, Support sections, etc. should load.

---

## 5. Quick checklist

| Step | Action | Pass if |
|------|--------|--------|
| 1 | Open http://127.0.0.1:8000/health | JSON with `"status":"ok"` |
| 2 | Open frontend URL (e.g. localhost:3001) | Login page loads |
| 3 | Login with valid user | Redirect to Dashboard |
| 4 | Open Support → Chores & Bugs | Ticket list or empty state |
| 5 | Open Dashboard | Support Overview and cards load |

---

## Troubleshooting

- **"Connection failed" on login**  
  Backend is not running or not on port 8000. Start it (step 1) and ensure nothing else uses port 8000.

- **Port 8000 in use**  
  ```powershell
  netstat -ano | findstr :8000
  ```
  Stop the process using that port or change the backend port (and update frontend `.env` `VITE_API_BASE_URL` if needed).

- **Frontend shows wrong port**  
  Vite default is 3001. If you use another port (e.g. 3003), open that URL. Check the terminal output for the actual URL.

- **CORS errors**  
  Backend allows localhost:3000–3004. If you use another port, add it to `CORS_ORIGINS` in the backend `.env`.

---

## Test: Staging workflow (3 stages)

Tickets (Chores, Bug, or Feature) can be moved into a **Staging** workflow. While in Staging they appear only in **Support → Staging** and are removed from Chores & Bugs and Feature lists. After completing Stage 3 they move to **Completed Chores & Bugs** or **Completed Feature** and become read-only.

### Prerequisites

- Run **database/STAGING_WORKFLOW.sql** in the Supabase SQL Editor once (adds staging columns to `tickets`).
- Backend and frontend running; user logged in.

### Steps

1. **Mark a ticket as Staging**
   - Go to **Support → Chores & Bugs** (or **Support → Feature**).
   - Open any ticket (click a row).
   - Click **Mark as Staging**. The drawer should close and the ticket disappear from that list.
2. **Staging section**
   - Go to **Support → Staging**. The ticket should appear in the table (columns up to Reference No).
   - Click the row to open the **Staging Details** drawer.
3. **Stage 1: Staging**
   - **Staging Planned** is set (when you marked as Staging).
   - Set **Staging Review Status** to **Completed**. **Review Actual** and **Live Planned** should fill automatically.
   - If you leave status **Pending** for more than 2 hours, **Staging Delay** appears (Minutes / Hours / Days).
4. **Stage 2: Live** (visible only after Stage 1 = Completed)
   - **Live Planned** = Stage 1 Review Actual.
   - Set **Live Status** to **Completed**. **Live Actual** and **Live Review Planned** should fill.
   - Delay in Push Live: counted after 2 hours from Live Planned if status is Pending.
5. **Stage 3: Live Review** (visible only after Stage 2 = Completed)
   - **Live Review Planned** = Stage 2 Live Actual.
   - Set **Live Review Status** to **Completed**. **Live Review Actual** is set and the ticket is marked **resolved**.
   - The ticket is removed from Staging and routed:
     - **Chores or Bug** → **Completed Chores & Bugs**
     - **Feature** → **Completed Feature**
6. **Completed sections (read-only)**
   - Open **Support → Completed Chores & Bugs** or **Support → Completed Feature**.
   - Open the ticket you just completed. All stages and timestamps should be visible; no status dropdowns or **Mark as Staging**; no edits (read-only).

### Quick checklist

| Step | Action | Pass if |
|------|--------|--------|
| 1 | Mark Chores/Bug or Feature ticket as Staging | Ticket leaves list; appears in Staging |
| 2 | Open Staging → click ticket | Staging drawer with Stage 1–3 (Stage 2/3 show when previous completed) |
| 3 | Complete Stage 1 | Review Actual & Live Planned set |
| 4 | Complete Stage 2 | Live Actual & Live Review Planned set |
| 5 | Complete Stage 3 | Ticket disappears from Staging; appears in Completed Chores & Bugs or Completed Feature |
| 6 | Open ticket in Completed section | Read-only: no edits, all stages visible |

---

## Test: Chores & Bugs + Staging (Stage 2 = Staging, and Back)

### 1. Chores & Bugs section loads (no "RocketOutlined is not defined")

- Go to **Support → Chores & Bugs**.
- **Pass:** Page loads with the ticket table; no white screen and no error "RocketOutlined is not defined".

### 2. Stage 2 = Staging generates staging actual

- In **Chores & Bugs**, open a ticket that has **Status 1 = No** (Stage 2 visible).
- In **Stage 2 — Work Progress**, set **Status 2** to **Staging**.
- **Pass:** Ticket updates; **Actual 2** is set and the ticket disappears from Chores & Bugs and appears in **Support → Staging**.
- Open **Staging** and click that ticket.
- **Pass:** **Stage 1: Staging** shows **Staging Planned** and **Review Actual** (staging actual) both set to the time you selected Staging.

### 3. Staging Stage 1 — Back to Chores & Bugs

- In **Support → Staging**, open a ticket that is in Stage 1 (Staging Review Status = Pending or Completed).
- In **Stage 1: Staging**, click the **Back** button.
- **Pass:** Message: "Ticket moved back to Chores & Bugs. Staging data cleared." Drawer closes; ticket disappears from Staging list.
- Go to **Support → Chores & Bugs**.
- **Pass:** That ticket appears again in the list. Opening it shows Stage 2 **Status 2 = Pending**; staging fields (Staging Planned, Review Actual) are cleared once.

### Quick checklist

| Step | Action | Pass if |
|------|--------|--------|
| 1 | Open Chores & Bugs | No RocketOutlined error; table loads |
| 2 | Set Stage 2 = Staging on a ticket | Actual 2 set; ticket moves to Staging; Staging shows Staging Planned + Review Actual |
| 3 | In Staging, click Back on Stage 1 | Ticket leaves Staging; appears in Chores & Bugs; staging data cleared |

---

## Test: Opening a staging ticket via browser URL

If you open a staging ticket by going directly to its URL (e.g. **/tickets/57eeaede-1902-41cd-ae6d-559422e423de**), the app should show the **Staging** workflow (Stage 1–3) instead of the basic ticket screen.

### Steps

1. **Get a staging ticket ID**
   - Go to **Support → Staging** and click a ticket to open the staging drawer. Copy the ticket ID from the URL if needed, or note the reference no.
   - Or from Chores & Bugs, set a ticket’s Stage 2 to **Staging** so it appears in Staging.
2. **Open the ticket URL directly**
   - In the browser address bar go to: `http://localhost:3001/tickets/<ticket-id>` (replace `<ticket-id>` with the real UUID, e.g. `57eeaede-1902-41cd-ae6d-559422e423de`).
3. **Expected**
   - You are **redirected** to **Support → Staging** with the **Staging details drawer** open for that ticket (URL like `/staging?open=<ticket-id>`).
   - The drawer shows **Stage 1: Staging**, and Stage 2/3 when applicable (Pending, Completed, Back, etc.).
   - You do **not** see the basic ticket screen (Title, Status OPEN, Type CHORE only) for that staging ticket.

### If it fails

- You see the basic ticket screen (Title, Status, Type, empty space) when opening a staging ticket URL.
- **Fix applied:** The ticket detail page detects staging tickets and redirects to `/staging?open=<id>` so the Staging list opens with that ticket’s drawer. Ensure you have the latest frontend build and reload the app.
