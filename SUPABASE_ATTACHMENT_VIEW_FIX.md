# Fix: "View" Does Not Open the Uploaded Document

When you click **View** on an attachment, the document does not open (or you see an error/blank page) because the **Supabase Storage bucket must be public** for the attachment URL to work in the browser.

---

## Do this in Supabase (required)

### 1. Make the bucket **Public**

1. Open **Supabase Dashboard** → your project.
2. Go to **Storage** in the left sidebar.
3. Under **Buckets**, click **ticket-attachments** (or create it if it does not exist).
4. Click the **⋮** (three dots) or **Edit bucket** / **Bucket settings**.
5. Turn **Public bucket** **ON** (enable it).
6. Save.

If the bucket is **private**, the public URL (`https://...supabase.co/storage/v1/object/public/ticket-attachments/...`) will return **403 Forbidden** and the document will not open. Making it public fixes this.

### 2. Apply Storage policies (so uploads and reads work)

1. In Supabase, open **SQL Editor**.
2. Run the contents of **`database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql`** (the two `CREATE POLICY` statements; the file already includes `DROP POLICY IF EXISTS` so it is safe to run).

This allows:
- Uploads (backend uses service role; policies keep things consistent).
- **Public read** for the bucket so the "View" link works for everyone.

### 3. (Optional) Create the bucket if it does not exist

1. **Storage** → **New bucket**.
2. **Name:** `ticket-attachments`
3. **Public bucket:** **ON**
4. **File size limit:** e.g. 10 MB
5. Create.

---

## After changing Supabase

- No need to restart the backend or frontend.
- Try **View** again on a ticket that has an attachment. The document should open in a new tab.

If it still does not open:

- Confirm the bucket **ticket-attachments** is **Public** (step 1).
- In the browser, right‑click **View** → **Copy link**, then open that URL in a new tab. If you see 403 or a sign‑in page, the bucket is still not public or policies are missing (repeat steps 1 and 2).
