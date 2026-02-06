# ticket-attachments – Policies & 5 MB Limit (Step-by-Step)

**File:** [STORAGE_TICKET_ATTACHMENTS_POLICY_GUIDE.md](STORAGE_TICKET_ATTACHMENTS_POLICY_GUIDE.md)  
This guide sets up **Storage policies** for the **ticket-attachments** bucket and a **5 MB** file size limit for **all file types**.

---

## Overview

1. **Set bucket file size limit to 5 MB** (Dashboard).
2. **Add two RLS policies** (Dashboard or SQL): **Upload** (INSERT) and **Public read** (SELECT).

File size is enforced at the **bucket** level (Supabase does not enforce size inside RLS). Policies only control **who** can upload and read.

---

## Part 1: Set 5 MB file size limit (bucket)

1. In Supabase, go to **Storage** (left sidebar).
2. Open **Buckets** (or the **Files** tab and the **Buckets** section).
3. Find the bucket **ticket-attachments** and click it (or the **⋮** / **Edit** option if available).
4. If you see **Edit bucket** or **Bucket settings**:
   - Set **File size limit** to **5** and unit **MB**.
   - Save.
5. If the bucket is already created and the UI does not show a size limit:
   - Go to **Storage** → **Settings** (tab or gear).
   - Set **Global file size limit** to at least 5 MB (e.g. 50 MB), then check again for a **per-bucket** limit on **ticket-attachments**.
   - On **Free** plan, per-bucket limit cannot exceed the global limit (max 50 MB); 5 MB is allowed.
6. **New bucket:** If you create the bucket from scratch:
   - **Storage** → **New bucket**.
   - Name: **ticket-attachments**.
   - **Public bucket**: ON.
   - **File size limit**: **5** **MB**.
   - Create.

Your app (backend) also enforces size; set in [backend/.env](backend/.env):  
`ATTACHMENT_MAX_MB=5` and restart the backend so uploads over 5 MB are rejected.

---

## Part 2: Add policies (step-by-step in Dashboard)

You are on **Storage** → **Files** → **Policies**, with **ticket-attachments** under Buckets and **“No policies created yet”**.

### Step 1 – Policy 1: Allow uploads (INSERT)

1. Next to **TICKET-ATTACHMENTS**, click **New policy**.
2. Choose **For full customization** (or **Create policy from scratch**).
3. Fill in:
   - **Policy name:** `ticket-attachments: Allow authenticated uploads`
   - **Allowed operation:** **INSERT** (or **INSERT** only).
   - **Target roles:** **authenticated** (leave **public** / **anon** unchecked for this one).
   - **WITH CHECK expression:**  
     `bucket_id = 'ticket-attachments'`
4. Save / **Create policy**.

Result: Only authenticated users (and the service role) can upload to **ticket-attachments**.

### Step 2 – Policy 2: Allow public read (SELECT)

1. Click **New policy** again (same bucket or under **Policies** for **ticket-attachments**).
2. **For full customization**.
3. Fill in:
   - **Policy name:** `ticket-attachments: Allow public read`
   - **Allowed operation:** **SELECT** (read).
   - **Target roles:** **public** (or **anon** + **authenticated** so everyone can read).
   - **USING expression:**  
     `bucket_id = 'ticket-attachments'`
4. Save / **Create policy**.

Result: Anyone with the file URL can read objects in **ticket-attachments** (needed for attachment links in the app).

---

## Part 3: Add policies via SQL (alternative)

You can create both policies at once in the **SQL Editor**:

1. **SQL Editor** → **New query**.
2. Open this file and copy its contents:  
   **[database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql](database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql)**
3. Paste into the query box and **Run**.

This creates:

- **ticket-attachments: Allow authenticated uploads** – INSERT for `authenticated` with `bucket_id = 'ticket-attachments'`.
- **ticket-attachments: Allow public read** – SELECT for `public` with `bucket_id = 'ticket-attachments'`.

If a policy with the same name already exists, drop it first:

```sql
DROP POLICY IF EXISTS "ticket-attachments: Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "ticket-attachments: Allow public read" ON storage.objects;
```

Then run the `CREATE POLICY` statements from [database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql](database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql).

---

## Summary checklist

- [ ] Bucket **ticket-attachments** exists and is **public**.
- [ ] Bucket **File size limit** = **5 MB** (Dashboard or when creating bucket).
- [ ] Backend **ATTACHMENT_MAX_MB=5** in [backend/.env](backend/.env) (optional but recommended).
- [ ] Policy **ticket-attachments: Allow authenticated uploads** (INSERT) created.
- [ ] Policy **ticket-attachments: Allow public read** (SELECT) created.

---

## Quick reference – clickable files

| What | File |
|------|------|
| This guide | [STORAGE_TICKET_ATTACHMENTS_POLICY_GUIDE.md](STORAGE_TICKET_ATTACHMENTS_POLICY_GUIDE.md) |
| SQL for both policies | [database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql](database/STORAGE_TICKET_ATTACHMENTS_POLICIES.sql) |
| Full attachment setup | [ATTACHMENT_UPLOAD_SETUP.md](ATTACHMENT_UPLOAD_SETUP.md) |

---

## All file types under 5 MB

- The **5 MB** limit applies to **all file types** (PDF, images, Word, Excel, etc.).
- Restricting by type is optional and can be set in **bucket** settings (e.g. **Allowed MIME types**). Leaving it open allows any type up to 5 MB.
- The backend in [backend/app/main.py](backend/app/main.py) still validates MIME types and size; keeping the bucket limit at 5 MB keeps behavior consistent.
