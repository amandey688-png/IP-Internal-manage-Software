# Delete support_tickets and ticket – After Copying into tickets

You want to **copy** data from **ticket** (view) into **tickets** (table), then **delete** the **ticket** view and the **support_tickets** table. Follow these steps.

---

## Before you start

- **ticket** = view on **support_tickets** (your support records).
- **tickets** = FMS table where the data will live.
- You need **at least one row** in **public.companies** and one in **public.user_profiles**. If either is empty, the copy will fail.

---

## Step 1: Run the full script (copy + drop view + drop table)

1. Open **Supabase** → **SQL Editor** → **New query**.
2. Open **`database/DELETE_SUPPORT_TICKETS_AND_TICKET_VIEW.sql`** in your project.
3. Copy the **entire** file contents (all three steps: INSERT, DROP VIEW, DROP TABLE).
4. Paste into the SQL Editor and click **Run**.
5. You should see something like **"INSERT 0 78"** and then **Success** for the DROP commands.

---

## What the script does (in order)

| Order | Action |
|-------|--------|
| 1 | **INSERT** from **ticket** into **tickets** (same mapping as before). |
| 2 | **DROP VIEW** **ticket** (view removed). |
| 3 | **DROP TABLE** **support_tickets** **CASCADE** (table and its data removed). |

After this, **support_tickets** and **ticket** no longer exist; the data is only in **tickets**.

---

## Step 2: Verify

1. In **Table Editor**, open **public.tickets** and confirm your support rows (e.g. reference_no CH-001, CH-002, …).
2. In the left sidebar, **ticket** and **support_tickets** should be gone.

---

## Warning

- **DROP TABLE support_tickets CASCADE** deletes the table and all its data for good.
- Run the script only after you are sure the **INSERT** has run and the data in **tickets** is correct. If you prefer to be safe, run the **INSERT** and **DROP VIEW** first, check **tickets**, then run **DROP TABLE support_tickets** in a second query.

---

## Summary

| Goal | File to run |
|------|-------------|
| Copy ticket → tickets, then delete ticket view and support_tickets table | **DELETE_SUPPORT_TICKETS_AND_TICKET_VIEW.sql** (full script) |
