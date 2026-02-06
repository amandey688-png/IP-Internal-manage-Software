# Attachment Upload – Fix & Step-by-Step Test Guide

## Why attachment didn’t show in frontend or save in database

1. **Attachment URL not sent with ticket** – The form’s hidden field for `attachment_url` was not always included in the submit payload (Ant Design `validateFields()` can omit it).  
   **Fix:** The attachment URL is now stored in **React state** when upload succeeds and is **always** passed in the create-ticket payload.

2. **Submitting before upload finished** – Clicking **OK** before the upload completed created the ticket without `attachment_url`.  
   **Fix:** The **OK** button is **disabled** while the file is uploading.

3. **FormData Content-Type** – The axios interceptor **removes Content-Type** for `FormData` so the backend receives the file.

4. **List not refreshing** – After creating a ticket from the header button, the ticket list did not refetch.  
   **Fix:** A **custom event** is dispatched on success so the ticket list refetches and shows the new ticket (and its attachment).

5. **Backend** – Logs when `attachment_url` is saved; ticket list returns all columns (including `attachment_url`). Attachment column in the table shows **"View"** link when present.

---

## Prerequisites

- Backend running (e.g. `.\backend\start-backend.ps1` or `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`).
- Frontend running (`npm run dev` in `fms-frontend`).
- Backend `.env` has `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API → service_role secret).
- `python-multipart` installed in backend (`pip install python-multipart`).

---

## Step 1: Create the bucket in Supabase (required)

1. Open **Supabase Dashboard** → your project.
2. Go to **Storage** in the left sidebar.
3. Click **New bucket**.
4. Set:
   - **Name:** `ticket-attachments`
   - **Public bucket:** **ON** (so attachment links work).
   - **File size limit:** e.g. **10** MB (or 5 MB if you prefer).
5. Click **Create bucket**.

If the bucket already exists, skip this step.

---

## Step 2: Apply Storage policies (recommended)

1. In your project, open **`database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql`**.
2. In Supabase, go to **SQL Editor** and run the contents of that file (the two `CREATE POLICY` statements).
3. If you already had policies with the same names, uncomment and run the `DROP POLICY IF EXISTS` lines first, then run the `CREATE POLICY` blocks.

This allows authenticated uploads and public read for the bucket. The backend uses the **service role**, so it can upload even without these policies; applying them keeps Storage consistent and helps if you add direct client uploads later.

---

## Step 3: Restart backend (if you changed anything)

If you just created the bucket or changed `.env`:

```powershell
cd "c:\Support FMS to APPLICATION\backend"
.\start-backend.ps1
```

Wait until you see **"Application startup complete."**

---

## Step 4: Test attachment upload in the app

1. **Log in** to the app (frontend URL, e.g. http://localhost:3001 or 3002).
2. Open **Submit Support Ticket** or **Add New Support Ticket** (Feature / Chores / Bug form).
3. Fill the required fields (Company, Page, Division, Title, Type of Request, etc.).
4. In **Attachment (Optional)**:
   - Click or drag a file (PDF, image, Word, Excel, or text; max 10 MB).
   - **Wait for the green message** (e.g. "filename.pdf uploaded"). The **OK** button stays disabled until the upload finishes.
5. Click **OK** to submit the form.
6. **Expected:**
   - Ticket is created; in the ticket list (e.g. Chores & Bugs), the **Attachment** column shows a **link icon** for that ticket.
   - In Supabase **Storage → ticket-attachments**, the file appears under a folder (user id).
7. **If you see an error:**
   - The modal shows the **backend message**. Use it to fix:
     - **Bucket not found / Object not found** → Create the `ticket-attachments` bucket (Step 1).
     - **Upload failed: ... (policies)** → Run `database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql` (Step 2).
     - **File upload requires python-multipart** → In the backend folder run `pip install python-multipart` and restart the backend.
     - **Connection timed out** → Start the backend and ensure http://127.0.0.1:8000/health works.

---

## Step 5: How to check it’s working

1. **In the app (Chores & Bugs or All Tickets):**
   - Find the ticket you just created.
   - The **Attachment** column should show a **link icon** (not "-"). Click it to open the file.

2. **In Supabase Storage:**
   - Go to **Storage** → **ticket-attachments**.
   - You should see a folder (your user UUID) and inside it the uploaded file (e.g. `abc123_filename.pdf`).

3. **In the backend terminal:**
   - After a successful upload you should see a log line like: `Upload OK: <user_id>/<uuid>_filename.pdf`.

If the Attachment column still shows "-" or the bucket is empty, ensure you waited for “filename uploaded” before clicking OK and that the backend is running with `python-multipart` and `SUPABASE_SERVICE_ROLE_KEY` set.

---

## "View" was redirecting to Login – fix applied

If clicking **View** on an attachment opened the app’s **Login** page instead of the file, the link was being handled by the app. All attachment links now use **`window.open(url, '_blank', 'noopener,noreferrer')`** and **`preventDefault()`** on click so the file opens in a new tab. The backend ensures the stored URL is always a full Supabase public URL.

---

## Database: ensure `attachment_url` column exists

If the attachment URL is not saving, run in **Supabase SQL Editor**:  
`ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attachment_url TEXT;`  
(See `database/ADD_ATTACHMENT_URL_COLUMN.sql`.)

---

## Quick checklist

- [ ] Bucket **ticket-attachments** exists in Supabase Storage (Step 1).
- [ ] Storage policies from `database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql` applied (Step 2).
- [ ] Backend running with `python-multipart` installed and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
- [ ] Frontend running; you are logged in.
- [ ] Upload a file; wait for “filename uploaded” (OK is disabled until then); then click OK and ticket saves with attachment (Step 4).

---

## If upload still fails

1. **Check browser console (F12)** – Look for the request to `/upload` and the response body; the backend `detail` message is shown there and in the modal.
2. **Check backend terminal** – You should see a line like `--> POST /upload` and either success or `Storage upload error: ...`.
3. **Backend .env** – Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (Supabase → Settings → API).
4. **File type/size** – Use a supported type (PDF, images, Word, Excel, text) and size under 10 MB (or under the bucket limit you set).
