# Login & Backend – Fix and Step-by-Step Testing Guide

## What was fixed

1. **Backend no longer crashes when python-multipart is missing**  
   The `/upload` route (attachments) is only registered if `python-multipart` is installed. If it is not, the app still starts and login works; only file upload returns 503 with a clear message.

2. **Attachment policies**  
   After you paste and run the **Storage policies** from `database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql` in Supabase, uploads work with the same backend. The backend error message for upload failures now points to that file.

3. **One-command backend start**  
   `backend\start-backend.ps1` installs `python-multipart` (if needed) and starts the server so the backend starts reliably.

---

## Step 1: Apply attachment policies in Supabase (one-time)

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Open `database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql` in your project.
3. Copy its contents and run them in the SQL Editor (or run the file if your client supports it).
4. In **Storage → Buckets**, ensure a bucket named **ticket-attachments** exists. If not, create it (e.g. public, file size limit 5 MB).

This step is required for ticket attachment uploads to work; it does not affect login.

---

## Step 2: Start the backend

**Option A – Recommended (installs python-multipart if needed)**

In PowerShell, from the project root:

```powershell
cd "c:\Support FMS to APPLICATION\backend"
.\start-backend.ps1
```

**Option B – Manual**

```powershell
cd "c:\Support FMS to APPLICATION\backend"
pip install python-multipart
$env:PYTHONIOENCODING = "utf-8"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

You should see:

- `Uvicorn running on http://127.0.0.1:8000`
- `Application startup complete.`

If you see: `WARNING: python-multipart not installed. /upload disabled...` the app still runs; login works, only file upload will return 503 until you run `pip install python-multipart` and restart.

Leave this terminal open.

---

## Step 3: Check backend health

In a browser, open: **http://127.0.0.1:8000/health**

You should get a short response (e.g. `{"status":"ok"}` or similar). If this works, the backend is running.

---

## Step 4: Start the frontend

Open a **second** PowerShell window:

```powershell
cd "c:\Support FMS to APPLICATION\fms-frontend"
npm run dev
```

Note the URL Vite shows (e.g. **http://localhost:3001** or **http://localhost:3002**).

---

## Step 5: Test login

1. In the browser, go to the frontend URL (e.g. **http://localhost:3002**).
2. Open the **Login** page.
3. Enter your email and password.
4. Click **Login**.

**Expected:** The request finishes in a few seconds (no 30s timeout). You either get in or see a normal error (e.g. invalid credentials).

If you still see a timeout:

- Confirm the backend window shows `Application startup complete.`
- Confirm **http://127.0.0.1:8000/health** works in the browser.
- Close any other process using port 8000, then start the backend again (Step 2).

---

## Step 6: Test attachment upload (after login)

1. Log in and open a ticket (create or open existing).
2. Use the attachment/upload control and choose a small file (e.g. PDF or image under 5 MB).
3. Upload.

**Expected:**

- If Storage policies are applied and bucket exists: upload succeeds and you get a link or preview.
- If you see 503 and a message about `python-multipart`: run `pip install python-multipart` in the backend folder and restart the backend (Step 2).
- If you see 500 “Upload failed… bucket/policies”: ensure the **ticket-attachments** bucket exists and you ran `database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql` in Supabase (Step 1).

---

## Quick checklist

- [ ] **Attachment policies** applied in Supabase (Step 1); bucket **ticket-attachments** exists.
- [ ] **Backend** started with `.\start-backend.ps1` or manual commands (Step 2); window shows “Application startup complete.”
- [ ] **http://127.0.0.1:8000/health** returns OK in the browser (Step 3).
- [ ] **Frontend** started with `npm run dev` (Step 4).
- [ ] **Login** completes without timeout (Step 5).
- [ ] **Upload** works or shows the expected 503/500 with clear message (Step 6).

---

## One-command start (backend + frontend)

From the project root:

```powershell
.\start-all.ps1
```

This opens two windows (backend and frontend). The backend window runs `start-backend.ps1`, which installs `python-multipart` if needed and then starts uvicorn. Wait until the backend window shows “Application startup complete” before using the app.

---

## If port 8000 is already in use

1. In PowerShell: `Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object OwningProcess`
2. Note the PID and close that process, or close the terminal that is running the backend.
3. Start the backend again (Step 2).
