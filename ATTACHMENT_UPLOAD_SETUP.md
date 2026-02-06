# Attachment Upload – Supabase Setup & Testing

**File:** `ATTACHMENT_UPLOAD_SETUP.md`  
This guide covers how to set up **Supabase Storage** for ticket attachments and how to **test** file upload in the app.

---

## What’s in place

- **Backend:** `POST /upload` – accepts a file, uploads to Supabase Storage bucket `ticket-attachments`, returns `{ "url": "https://..." }`.
- **Frontend:** Support form (Submit Support Ticket) has a **file upload** control; the chosen file is uploaded and its URL is saved as the ticket’s `attachment_url`.
- **DB:** `tickets.attachment_url` stores the public URL (column added by `DASHBOARD_UPGRADE.sql` or `RUN_IN_SUPABASE.sql`).

---

## Step 1: Create the bucket in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **Storage** in the left sidebar.
3. Click **New bucket**.
4. Set:
   - **Name:** `ticket-attachments`
   - **Public bucket:** **ON** (so the app can use public URLs for `attachment_url`).
   - Optionally set **File size limit** (e.g. 10 MB) and **Allowed MIME types** (e.g. `image/*`, `application/pdf`, `text/plain`, etc.).
5. Click **Create bucket**.

---

## Step 2: Storage policies (who can upload)

The backend uses the **service role** key, so it can upload without Storage RLS. If you also want the frontend to upload directly (e.g. with anon key), add a policy. For the current flow (backend upload only), you can skip this or add a policy so only authenticated users can read.

**Optional – allow authenticated uploads via API (backend uses service role):**

1. In **Storage** → select bucket **ticket-attachments**.
2. Open **Policies** (or **New policy**).
3. Add a policy, for example:
   - **Policy name:** Allow authenticated uploads
   - **Allowed operation:** INSERT (or ALL)
   - **Target roles:** authenticated (or leave as default)
   - **USING expression:** `true` (or `auth.role() = 'authenticated'`)
   - **WITH CHECK:** `true`

For **backend-only upload** you don’t need any Storage policy; the service role bypasses RLS.

**Optional – allow public read (for public bucket):**

- If the bucket is **public**, objects are already readable by anyone with the URL. No extra policy needed for read.

---

## Step 3: Backend env (required for uploads)

**Required for Storage uploads:** The Storage API only accepts a **JWT** (a long string starting with `eyJ`). If you get "Invalid Compact JWS" or 403 Unauthorized, use the correct value below.

**Do not use the Key ID** from **Settings → JWT Keys** (e.g. `493059e5-129b-4cbc-85fb-84914efc5c8f`). That is the signing key identifier, not the token for `.env`.

**If your service_role key is `sb_secret_...` (no JWT):**  
The app will use your **anon key** (the `eyJ...` value in `SUPABASE_ANON_KEY`) for Storage uploads. You must run the SQL in `database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql` so that **anon** is allowed to INSERT into the bucket (the script includes "Allow anon uploads"). No need to set `SUPABASE_STORAGE_JWT`.

**If you have a JWT service_role (`eyJ...`):**  
Set `SUPABASE_STORAGE_JWT=<that eyJ... key>` in `backend/.env`. Otherwise the app uses the anon key when `SUPABASE_SERVICE_ROLE_KEY` is `sb_secret_...`.

Restart the backend after any `.env` change.

Optional overrides:

```env
# Optional: bucket name (default: ticket-attachments)
SUPABASE_ATTACHMENT_BUCKET=ticket-attachments

# Optional: max file size in MB (default: 10)
ATTACHMENT_MAX_MB=10
```

Restart the backend after changing `.env`.

---

## Step 4: Ensure `attachment_url` exists on `tickets`

If you didn’t run a script that adds `attachment_url` yet, run in **Supabase SQL Editor**:

```sql
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attachment_url TEXT;
```

(This is already in `database/DASHBOARD_UPGRADE.sql` and `database/RUN_IN_SUPABASE.sql`.)

---

## How to test

### 1. Backend and frontend running

- Backend: `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
- Frontend: `npm run dev` (e.g. http://localhost:3001)

### 2. Create bucket and policies

- Follow **Step 1** and **Step 2** above so the bucket `ticket-attachments` exists and is public.

### 3. Test upload from the Support form

1. Log in.
2. Click **Submit Support Ticket** (header).
3. Fill required fields (Company, User Name, Page, Division, Title, etc.).
4. In **Attachment (Optional)**:
   - Drag a file onto the area, or click and choose a file (e.g. a small PDF or image).
5. Wait for “File uploaded” (or similar) message.
6. Submit the form.
7. Open **Support → All Tickets** (or the section you use), find the new ticket.
8. Check that it has an **Attachment** link or column; open it and confirm the file opens (same URL as in `attachment_url`).

### 4. Test upload API directly (optional)

With a valid JWT:

```bash
curl -X POST http://127.0.0.1:8000/upload \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "file=@/path/to/test.pdf"
```

Expected: `{ "url": "https://YOUR_PROJECT.supabase.co/storage/v1/object/public/ticket-attachments/..." }`.

### 5. If upload fails

| Symptom | What to check |
|--------|----------------|
| 500 or “Upload failed” | Bucket `ticket-attachments` exists and is **public**. Backend has `SUPABASE_SERVICE_ROLE_KEY` in `.env`. |
| “File type not allowed” | Use PDF, image, text, Word, or Excel. Backend allows these MIME types. |
| “File too large” | Default max 10 MB; set `ATTACHMENT_MAX_MB` or use a smaller file. |
| 401 | User is logged in and token is sent (e.g. Submit Support Ticket from the app). |
| Bucket stays empty / "View" does nothing | Wait for "File uploaded" before Submit; ensure `SUPABASE_SERVICE_ROLE_KEY` in `.env`; check backend log for "Storage upload error"; test with curl (Step 4). |

---

## Summary checklist

- [ ] Supabase **Storage** → bucket **ticket-attachments** created.
- [ ] Bucket is **public** (so returned URLs work).
- [ ] `tickets.attachment_url` column exists.
- [ ] Backend `.env` has `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SUPABASE_ATTACHMENT_BUCKET`, `ATTACHMENT_MAX_MB`).
- [ ] Test: Submit Support Ticket → upload file → submit → ticket shows attachment link and file opens.

---

## File reference

| What | Where |
|------|--------|
| Backend upload endpoint | `backend/app/main.py` – `POST /upload` |
| Frontend upload API | `fms-frontend/src/api/upload.ts` – `uploadAttachment()` |
| Support form file input | `fms-frontend/src/components/forms/SupportFormModal.tsx` – Attachment Dragger |
| DB column | `tickets.attachment_url` (add via `database/DASHBOARD_UPGRADE.sql` or `ALTER TABLE` above) |
