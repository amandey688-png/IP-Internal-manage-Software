# "UNRESTRICTED" on support_tickets and ticket – What It Means & What To Do

## What "UNRESTRICTED" means

In Supabase, **UNRESTRICTED** means **Row Level Security (RLS) is disabled** for that table or view.

- **No row-level rules:** Any client that can reach the table (e.g. with your anon or service key) can read, update, or delete **all rows** (depending on your API/postgres role).
- **Where you see it:** On `raw_support_upload`, `support_tickets`, and `ticket` (the view reads from `support_tickets`, so it follows that table’s RLS status).

So "UNRESTRICTED" = no per-row security; access is only limited by who has the key and what role they use.

---

## What you can do

### Option 1: Leave it as is (simplest)

- **When it’s OK:** Internal tools, same app/users, or when you control access only by keys (e.g. only your backend has the key).
- **Result:** The label stays "UNRESTRICTED"; anyone with a key that can query the table can see all support tickets.

### Option 2: Restrict access with RLS (recommended for production)

Turn on RLS and add policies so only the roles you want can read (or write) support ticket data. After that, the table/view will no longer show as UNRESTRICTED for those roles.

**Steps:**

1. In Supabase, open **SQL Editor**.
2. Run the script **`database/SUPPORT_TICKETS_RLS.sql`** (see below).
3. That will:
   - Enable RLS on **`support_tickets`**.
   - Add policies so:
     - **Authenticated** users (logged-in via Supabase Auth) can **SELECT** (read).
     - **service_role** (your backend) can **SELECT, INSERT, UPDATE, DELETE**.
   - The **`ticket`** view does not have its own RLS; it uses the same rows as `support_tickets`, so once RLS is on `support_tickets`, access to the view is restricted the same way.

**After enabling RLS:**

- Queries using the **anon** key with no logged-in user will **not** see any rows (unless you add an explicit policy for `anon`).
- Queries using **service_role** or an **authenticated** user will see rows according to the policies.

---

## Why it still shows "UNRESTRICTED" after running the script

If you ran **SUPPORT_TICKETS_RLS.sql** but the Table Editor still shows **UNRESTRICTED** on `ticket` or `support_tickets`, it is usually for one of these reasons:

### 1. **`ticket` is a VIEW – views don’t have RLS**

- RLS is a **table** feature. **Views** don’t have their own RLS in PostgreSQL.
- Supabase often labels **views** as **UNRESTRICTED** because there are no policies on the view object itself.
- When someone queries **`ticket`**, Postgres runs the query against **`support_tickets`**. RLS on **`support_tickets`** **does** apply then. So your app (using `anon` / `authenticated` / `service_role`) is still restricted by the policies on `support_tickets`; only the label on the view stays "UNRESTRICTED".

**So:** The script did work. The view will still show UNRESTRICTED in the UI, but access is still controlled via `support_tickets` when the view is queried.

### 2. **Table Editor uses the `postgres` role**

- In the Table Editor you often see **Role: postgres**. The **postgres** role is a superuser.
- In PostgreSQL, **RLS is not applied to superusers** (and often not to the table owner). So when the dashboard connects as **postgres**, it bypasses RLS and sees all rows.
- For that reason the UI may still show "UNRESTRICTED" or show all 78 rows even though RLS is on – because **postgres** is not restricted.

**So:** For **postgres**, there is effectively no restriction. For your **app** (anon / authenticated / service_role), RLS **is** enforced.

### How to confirm RLS is working

In **SQL Editor**, run as a role that should be restricted (e.g. anon). In Supabase you can simulate by using the anon key from your app or by checking from the API:

- With **anon** key and **no** logged-in user: `SELECT * FROM ticket` should return **0 rows** (because we didn’t add an `anon` policy).
- With **authenticated** user or **service_role**: the same query should return rows.

So: **RLS is on and working for non-superuser roles; the "UNRESTRICTED" label on the view and the full access as postgres are expected.**

---

## Summary

| Goal                         | Action |
|-----------------------------|--------|
| Understand the label        | "UNRESTRICTED" = RLS is off; no per-row security. |
| Keep current behavior       | Do nothing; leave RLS disabled. |
| Restrict who can see data   | Run `SUPPORT_TICKETS_RLS.sql` to enable RLS and add read/write policies. |
