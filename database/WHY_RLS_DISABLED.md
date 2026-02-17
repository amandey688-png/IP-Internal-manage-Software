# Why You See "RLS Disabled" and "UNRESTRICTED"

## 1. Why **raw_support_upload** shows "RLS disabled"

**Reason:** RLS has **never been enabled** on the table **`raw_support_upload`**.

- The RLS script we use (**SUPPORT_TICKETS_RLS.sql**) only enables RLS on **`support_tickets`**.
- **`raw_support_upload`** is a separate table; it was not included in that script (only in an optional commented block).
- So Supabase correctly shows **"RLS disabled"** for **raw_support_upload** – there are no row-level security rules on that table.

**What you can do:**

- **If you want RLS on raw_support_upload:** Run the SQL below in **Supabase → SQL Editor** (or uncomment the block in **SUPPORT_TICKETS_RLS.sql** and run it).
- **If you don’t care:** Leave it as is; only **support_tickets** (and the **ticket** view) will be protected.

---

## 2. Why **ticket** shows "UNRESTRICTED" / "Security definer view"

The tooltip says: **"Data is publicly accessible via API as this is a Security definer view."**

- By default, the view may have been created as **Security definer**, so it runs with the **owner’s** privileges and can bypass RLS on **support_tickets** when the API queries it.
- So even though **support_tickets** has RLS enabled, the **ticket** view was not respecting it.

**What we did:**

- The **ticket** view was updated so it uses **Security invoker** instead of Security definer:
  - **`ALTER VIEW public.ticket SET (security_invoker = on);`**
- After you **recreate the view** (run **SUPPORT_TICKETS_AS_TICKET_VIEW.sql** again), the view will run with the **caller’s** role (anon / authenticated / service_role), and **RLS on support_tickets will apply** when the API queries **ticket**.

**Steps for you:**

1. In **Supabase → SQL Editor**, run the full contents of **`database/SUPPORT_TICKETS_AS_TICKET_VIEW.sql`** (it now includes `security_invoker = on`).
2. Then when your app queries **ticket**, the same RLS rules as **support_tickets** will apply (e.g. anon sees nothing unless you added an anon policy).

---

## 3. Summary

| Object                 | Why you see "RLS disabled" / "UNRESTRICTED" | What to do |
|------------------------|---------------------------------------------|------------|
| **raw_support_upload** | RLS was never enabled on this table.        | Run the RLS SQL below for this table (optional). |
| **ticket** (view)      | View was "Security definer" so it bypassed RLS. | Re-run **SUPPORT_TICKETS_AS_TICKET_VIEW.sql** (it now sets **security_invoker = on**). |

---

## SQL: Enable RLS on raw_support_upload (optional)

Run this in **Supabase → SQL Editor** if you want **raw_support_upload** to have RLS too:

```sql
ALTER TABLE public.raw_support_upload ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS raw_support_upload_select_authenticated ON public.raw_support_upload;
CREATE POLICY raw_support_upload_select_authenticated ON public.raw_support_upload
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS raw_support_upload_all_service ON public.raw_support_upload;
CREATE POLICY raw_support_upload_all_service ON public.raw_support_upload
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

After this, **raw_support_upload** will show as protected (RLS enabled) and the red "RLS disabled" will no longer apply to that table.
