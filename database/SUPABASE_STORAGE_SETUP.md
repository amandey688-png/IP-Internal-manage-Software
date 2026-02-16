# Supabase Storage Setup (Delegation & Ticket Attachments)

This guide sets up Supabase Storage so that **Delegation document uploads** and **ticket attachments** work. The app uses a single bucket: `ticket-attachments`.

---

## 1. Create the bucket (Supabase Dashboard)

1. Open your project in **Supabase Dashboard**: https://supabase.com/dashboard  
2. Go to **Storage** in the left sidebar.  
3. Click **New bucket**.  
4. **Name:** `ticket-attachments` (must match exactly).  
5. **Public bucket:** turn **ON** so that "View document" links open in the browser.  
6. (Optional) **File size limit:** e.g. **5** or **10** MB.  
7. Click **Create bucket**.

---

## 2. Storage policies (SQL Editor)

Policies allow the backend to upload and allow anyone to read (for public links).

1. In Supabase, go to **SQL Editor** → **New query**.  
2. Paste the contents of **`database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql`**.  
3. Click **Run**.

That file:

- Allows **authenticated** and **anon** users to **INSERT** (upload) into `ticket-attachments`.
- Allows **public** **SELECT** (read) so attachment URLs work without login.

---

## 3. Backend .env (JWT for Storage API)

The backend uploads files using the **Storage REST API**, which requires a **JWT** (long key starting with `eyJ`), not the short Key ID.

1. In Supabase: **Settings** (gear) → **API**.  
2. Under **Project API keys**, copy:
   - **anon** `public` key (starts with `eyJ...`), or  
   - **service_role** `secret` key (starts with `eyJ...`).  
3. In your backend folder, open or create **`.env`**.  
4. Add or update:

```env
# Required for file upload (Delegation documents & ticket attachments)
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_STORAGE_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **SUPABASE_URL:** from Supabase → Settings → API → Project URL.  
- **SUPABASE_STORAGE_JWT:** the **anon** or **service_role** key you copied (the long `eyJ...` string).

**Important:** Do **not** use the short **Key ID** (e.g. `493059e5-...`) from Settings → JWT Keys. Use the full **anon** or **service_role** key from the API section.

---

## 4. Optional: different bucket name

If you use another bucket name:

1. Create the bucket in Storage with that name.  
2. In **`.env`** add:

```env
SUPABASE_ATTACHMENT_BUCKET=your-bucket-name
```

3. In **`STORAGE_TICKET_ATTACHMENTS_POLICIES.sql`**, replace every `ticket-attachments` with your bucket name and run the script again.

---

## 5. Restart backend

After changing `.env`, restart the FastAPI backend so it picks up `SUPABASE_STORAGE_JWT` and `SUPABASE_URL`.

---

## 6. Verify

- **Delegation:** Create a task with Document = Yes, complete it by uploading a file. In the table, the **Submitted Attachment** column should show **View document**; the link should open the file.  
- **Tickets:** Create a ticket with an attachment; the attachment link should open.

If upload fails with "Invalid JWT" or 403, double-check that `SUPABASE_STORAGE_JWT` is the full `eyJ...` key and that the bucket exists and is **public**, and that the policies SQL was run successfully.
