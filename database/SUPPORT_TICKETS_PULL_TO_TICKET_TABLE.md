# Pull Support Tickets Data into "Ticket" Table for Your Software

Your support ticket data is in **`public.support_tickets`**. Your other software expects a **"Ticket"** table. Use the view below so that software can read the same data. NULLs are shown as blank.

---

## Important: Two Different Tables

| Table / View        | Purpose |
|---------------------|--------|
| **`public.tickets`** | FMS app (bug/feature/chore). **Do not replace or drop.** |
| **`public.support_tickets`** | Your uploaded 78 support tickets. |
| **`public.ticket`** (view) | Same data as `support_tickets`, exposed for software that expects a "Ticket" table. NULL → blank for text. |

---

## Step 1: Create the "Ticket" view in Supabase

1. Open **Supabase Dashboard** → **SQL Editor**.
2. Open **`database/SUPPORT_TICKETS_AS_TICKET_VIEW.sql`** in your project.
3. Copy its **entire contents** and paste into the SQL Editor.
4. Click **Run**.

You should see: **Success. No rows returned.**  
That creates the view **`public.ticket`** (singular), which reads from `support_tickets` and shows NULLs as blank for text columns.

---

## Step 2: Use the view in your software

- **Table / view name to use:** **`ticket`** (singular).
- **Schema:** **`public`** (default).
- So the object to query is: **`public.ticket`** (or just **`ticket`** if the app uses default schema).

In your software:

1. Set the data source / table name to **`ticket`** (or **`public.ticket`**).
2. Ensure the connection points to the same Supabase project where you ran the SQL.
3. Columns available: `id`, `reference_no`, `old_reference_no`, `description`, `stage`, `status`, `created_at`, `planned_resolution_date`, `actual_resolution_date`, `delay_days`, `response_source`, `title`, `type_of_request`, `page`, `company_name`, `submitted_by`, `query_arrival_at`, `query_response_at`, `reply_status`, `updated_at`. All text columns show blank when the value is NULL.

---

## Step 3: Check that data is visible

In Supabase **SQL Editor** run:

```sql
SELECT id, reference_no, title, status, created_at
FROM public.ticket
LIMIT 10;
```

You should see the same 78 support tickets as in `support_tickets`, with text NULLs as blank.

---

## If your software must use the name "tickets" (plural)

You **must not** replace **`public.tickets`** (the FMS app table). Instead you can:

**Option A – Different schema (recommended)**  
Create a schema and a view with the name `tickets` there, e.g.:

```sql
CREATE SCHEMA IF NOT EXISTS support;
CREATE OR REPLACE VIEW support.tickets AS
SELECT * FROM public.ticket;
```

Then in your software use **`support.tickets`** as the table name.

**Option B – Different view name**  
If the software can be configured to use any table name, keep using **`public.ticket`** and set the table name to **`ticket`**.

---

## Summary

| What you did | What to do in software |
|--------------|-------------------------|
| Ran `SUPPORT_TICKETS_AS_TICKET_VIEW.sql` | Use table/view name **`ticket`** (or **`public.ticket`**). |
| Data lives in `support_tickets` | View **`ticket`** reads from it; NULL → blank for text. |
| FMS still uses `public.tickets` | Do not point this software at `public.tickets` for support data. |
