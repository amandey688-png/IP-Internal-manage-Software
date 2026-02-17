# Copy "ticket" Data into "tickets" and Then Delete the ticket View

Follow these steps in order. Use **Supabase → SQL Editor** for all SQL.

---

## Before you start

- **ticket** = view on **support_tickets** (your 78 support records).
- **tickets** = FMS table (columns: reference_no, title, description, type, status, company_id, created_by, etc.).
- You need **at least one row** in **public.companies** and one in **public.user_profiles**. If either is empty, the copy will fail; create a company and ensure a user profile exists first.

---

## Step 1: Copy data from `ticket` into `tickets`

1. Open **Supabase** → **SQL Editor** → **New query**.
2. Open **`database/TICKET_COPY_TO_TICKETS_THEN_DROP_VIEW.sql`** in your project.
3. Copy **only the STEP 1 block** (the `INSERT INTO public.tickets ... SELECT ... FROM public.ticket ...` part). Do **not** copy STEP 2 yet.
4. Paste into the SQL Editor and click **Run**.
5. Check the result:
   - It should say something like **"INSERT 0 78"** (or the number of rows in **ticket**).
   - If you get an error about **company_id** or **created_by**, add at least one row to **public.companies** and **public.user_profiles** and run again.
6. In **Table Editor**, open **public.tickets** and confirm the new rows (e.g. filter by **reference_no** starting with `CH-` or sort by **created_at**).

---

## Step 2: Delete the `ticket` view

Run this **only after** you have checked that **tickets** has the copied data.

1. In **SQL Editor**, run:

```sql
DROP VIEW IF EXISTS public.ticket;
```

2. You should see: **Success. No rows returned.**
3. In the left sidebar, **ticket** will no longer appear under **public**.  
   Your data is still in **support_tickets** and is now also in **tickets**; only the view was removed.

---

## Step 3 (optional): Keep or drop `support_tickets`

- **Keep:** Leave **support_tickets** as is if you want to keep the original support data separate (e.g. for reporting or rollback).
- **Drop:** If you no longer need **support_tickets** and only want data in **tickets**, you can run  
  `DROP TABLE public.support_tickets CASCADE;`  
  **Warning:** This deletes the table and all its data; only do this if you are sure.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Run the **INSERT ... SELECT ... FROM public.ticket** query (Step 1 in the SQL file). |
| 2 | Verify in **tickets** that the rows are there. |
| 3 | Run **DROP VIEW IF EXISTS public.ticket;** |
| 4 | (Optional) Drop **support_tickets** if you no longer need it. |

---

## Query reference (Step 1 – copy only)

If you prefer to copy the query from here, use this for **Step 1** (copy from ticket into tickets):

```sql
INSERT INTO public.tickets (
  reference_no,
  title,
  description,
  type,
  status,
  priority,
  company_id,
  division_id,
  created_by,
  assignee_id,
  created_at,
  updated_at,
  resolution_notes
)
SELECT
  t.reference_no,
  COALESCE(NULLIF(TRIM(t.title), ''), 'No title'),
  t.description,
  CASE
    WHEN LOWER(COALESCE(t.type_of_request, '')) LIKE '%bug%' THEN 'bug'
    WHEN LOWER(COALESCE(t.type_of_request, '')) LIKE '%chore%' THEN 'chore'
    ELSE 'feature'
  END,
  'open',
  'medium',
  (SELECT id FROM public.companies LIMIT 1),
  NULL,
  (SELECT id FROM public.user_profiles LIMIT 1),
  NULL,
  t.created_at,
  NOW(),
  'Migrated from support_tickets. Old ref: ' || COALESCE(t.old_reference_no, '')
FROM public.ticket t
ON CONFLICT (reference_no) DO NOTHING;
```

Then for **Step 2** (delete the view):

```sql
DROP VIEW IF EXISTS public.ticket;
```
