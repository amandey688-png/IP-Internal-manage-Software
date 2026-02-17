# "ticket" RLS – Step-by-Step Guide

The **`ticket`** object in Supabase is a **view** that reads from the table **`support_tickets`**. In PostgreSQL, **views do not have their own RLS**. To secure **`ticket`**, you enable RLS on **`support_tickets`**. When anyone queries **`ticket`**, the database uses **`support_tickets`**, so the same RLS rules apply.

This guide walks you through enabling RLS so that **`ticket`** (and **`support_tickets`**) are restricted by role.

---

## Step 1: Open Supabase SQL Editor

1. Log in to [Supabase](https://supabase.com) and open your project (e.g. **FMS to APPLICATION**).
2. In the left sidebar, click **SQL Editor**.
3. Click **New query** (or use the existing editor).

---

## Step 2: Run the RLS script

1. Open the file **`database/SUPPORT_TICKETS_RLS.sql`** in your project (or copy the SQL below).
2. Copy the **entire** contents of that file (only the part that runs for **support_tickets** – do not include the optional `raw_support_upload` block unless you need it).
3. Paste into the Supabase SQL Editor.
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter).

**SQL to run (RLS for `support_tickets` = RLS for `ticket` view):**

```sql
-- RLS for support_tickets (this secures the "ticket" view too)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_select_authenticated ON public.support_tickets;
CREATE POLICY support_tickets_select_authenticated ON public.support_tickets
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS support_tickets_all_service ON public.support_tickets;
CREATE POLICY support_tickets_all_service ON public.support_tickets
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

5. You should see: **Success. No rows returned.**  
   That means RLS is now enabled on **`support_tickets`**, and the **`ticket`** view is now restricted by the same policies.

---

## Step 3: Understand who can access `ticket`

After the script runs:

| Role              | Can read `ticket`? | Can insert/update/delete? |
|-------------------|--------------------|----------------------------|
| **anon**          | No (0 rows)        | No                         |
| **authenticated** | Yes (all rows)     | No                         |
| **service_role**  | Yes (all rows)     | Yes (on support_tickets)   |
| **postgres**      | Yes (bypasses RLS) | Yes                        |

Your app uses one of these roles (anon, authenticated, or service_role) when it queries **`ticket`**. The Table Editor in Supabase often uses **postgres**, so it will still show all rows and may still show "UNRESTRICTED" on the view – that is normal.

---

## Step 4 (Optional): Allow anonymous read on `ticket`

If the software that reads **`ticket`** uses only the **anon** key (no login), add this policy so anon can read:

1. In **SQL Editor**, run:

```sql
DROP POLICY IF EXISTS support_tickets_select_anon ON public.support_tickets;
CREATE POLICY support_tickets_select_anon ON public.support_tickets
  FOR SELECT TO anon USING (true);
```

2. After this, **anon** can **SELECT** from both **`support_tickets`** and **`ticket`** (same data).

---

## Step 5: Verify from your app

1. From your **Ticket** software (or API client), query **`ticket`** using:
   - **anon** key, no login → should get 0 rows (unless you added the anon policy in Step 4).
   - **authenticated** (logged-in user) or **service_role** → should get all 78 rows (or whatever you have).
2. In Supabase **Table Editor**, opening **`ticket`** as **postgres** will still show all rows; that does not mean RLS is off for your app.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Open Supabase → SQL Editor. |
| 2 | Run the RLS SQL (enable RLS on **support_tickets** + 2 policies). |
| 3 | Use the table above to see who can read/write **ticket**. |
| 4 | (Optional) Add anon SELECT policy if your app uses only anon key. |
| 5 | Test from your app with anon vs authenticated/service_role. |

**Important:** There is no separate "ticket RLS" – securing **`support_tickets`** with the script above is what secures the **`ticket`** view.
