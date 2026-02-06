# Step-by-Step: Add Pages to Support Form Dropdown

This replaces **all existing pages** with the new list so the Support form **Page** dropdown shows these options.

---

## Before you run

- **Existing tickets:** If tickets already have a `page_id` set, those IDs will point to deleted rows after you delete pages. To avoid that, you can clear page on tickets first (optional, Step 1b).
- **Backup:** If you need to keep the old page list, export it from Supabase (Table Editor → pages) before running.

---

## Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com) and open your project.
2. In the left sidebar, click **SQL Editor**.
3. Click **New query**.

---

## Step 2 (Optional): Clear page on existing tickets

Only if you have existing tickets and want to avoid orphaned `page_id`:

1. In the SQL Editor, paste this and click **Run**:

```sql
UPDATE public.tickets SET page_id = NULL WHERE page_id IS NOT NULL;
```

2. Wait for "Success".

---

## Step 3: Delete old pages and load new list

1. Open the file **`database/PAGES_MASTER.sql`** in your project.
2. Copy the **entire** file (from the first line to the last).
3. In Supabase SQL Editor, paste into a **new query** (or the same tab after Step 2).
4. Click **Run**.
5. Wait for "Success".

What the script does:

- **Deletes** all rows from `public.pages`.
- **Inserts** the new page names (all the pages you listed for the Support form dropdown).

---

## Step 4: Verify in Supabase

1. In Supabase, open **Table Editor** in the left sidebar.
2. Select the **pages** table.
3. Check that you see the new page names (e.g. Approvals, Budget Report, Dashboard, …) and no old ones (e.g. Billing, Support, Other from the original seed).

Or run in SQL Editor:

```sql
SELECT count(*) AS total_pages FROM public.pages;
```

You should see **99** rows (or the number of lines in the INSERT list).

---

## Step 5: Test in the app

1. Start the **backend** (e.g. `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`).
2. Start the **frontend** (e.g. `npm run dev`), open the app, and **log in**.
3. Open the **Support form** (e.g. click **Submit Support Ticket**).
4. Open the **Page** dropdown.
5. You should see the new list (Approvals, Budget Report, Create Indent, Dashboard, …) and be able to search and select a page.
6. Submit a ticket with a chosen page and confirm it saves correctly.

---

## Quick summary

| Step | Action |
|------|--------|
| 1 | Open Supabase → SQL Editor → New query. |
| 2 (optional) | Run `UPDATE public.tickets SET page_id = NULL WHERE page_id IS NOT NULL;` |
| 3 | Copy all of **`database/PAGES_MASTER.sql`** → paste in SQL Editor → **Run**. |
| 4 | Verify in Table Editor (pages) or with `SELECT count(*) FROM public.pages;`. |
| 5 | Test the Support form Page dropdown in the app. |

---

## Files

| File | Purpose |
|------|--------|
| **`database/PAGES_MASTER.sql`** | Deletes all rows in `public.pages` and inserts the new page list for the Support form. |

No backend or frontend code changes are required; the form already loads pages from the API and the API reads from `public.pages`.
