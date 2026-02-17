# Support Tickets Table – Setup & Migration

**Do not paste this file into the Supabase SQL Editor.** This is a Markdown instructions file, not SQL. Use the `.sql` files below.

Normalized `support_tickets` table for customer support data (Supabase/PostgreSQL).

## What to run in Supabase SQL Editor (in this order)

1. Open **`SUPPORT_TICKETS_TABLE.sql`** in your project, copy its **entire contents**, paste into Supabase SQL Editor, then click **Run**.
2. Open **`SUPPORT_TICKETS_MIGRATION.sql`**, copy its **entire contents**, paste into Supabase SQL Editor, then click **Run**.
3. After a bulk upload of your own data, run the `setval(...)` query from section "Reference number" below (copy only that one SQL statement into the editor).

Do **not** paste this README (`.md`) into the SQL Editor—it will cause a syntax error.

## Files

| File | Purpose |
|------|--------|
| `SUPPORT_TICKETS_TABLE.sql` | CREATE TABLE, sequence, triggers, indexes – **run this first** |
| `SUPPORT_TICKETS_MIGRATION.sql` | Sample INSERTs + bulk migration pattern – **run this second** |
| `SUPPORT_TICKETS_README.md` | Instructions only – **do not run in SQL Editor** |

## 1. Table structure (`support_tickets`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `reference_no` | varchar(20) | Auto-generated CH-001, CH-002, … (trigger) |
| `old_reference_no` | varchar(50) | Original "Reference No" from uploaded file |
| `description` | text | Include "Original Ref: …" in text |
| `stage` | varchar(50) | New, Assigned, In Progress, Pending, Resolved, Closed |
| `status` | varchar(50) | Default Pending when source row = Pending |
| `created_at` | timestamptz | Use exact timestamp from file |
| `planned_resolution_date` | date | From "Planned" |
| `actual_resolution_date` | date | From "Actual" |
| `delay_days` | integer | Computed by trigger (see below) |
| `response_source` | varchar(20) | `upload` \| `response` |
| + optional | title, type_of_request, page, company_name, submitted_by, etc. | From your file |

## 2. Reference number (trigger)

- **Sequence:** `support_tickets_ref_seq` (starts at 1).
- **Trigger:** `tr_support_tickets_reference_no` on `BEFORE INSERT`.
- If `reference_no` is NULL on INSERT, it is set to `CH-` + next sequence value (e.g. CH-001, CH-002).
- To start after an existing max (e.g. after bulk load), run:
  ```sql
  SELECT setval('public.support_tickets_ref_seq',
    (SELECT COALESCE(MAX(SUBSTRING(reference_no FROM '[0-9]+')::INTEGER), 0) + 1
     FROM public.support_tickets WHERE reference_no ~ '^CH-[0-9]+$'));
  ```

## 3. Delay days (trigger)

- **Trigger:** `tr_support_tickets_delay_days` on `BEFORE INSERT OR UPDATE` of status, stage, planned_resolution_date, actual_resolution_date.
- **Logic:**
  - If `status = 'Pending'` or `stage = 'Pending'`:  
    `delay_days = current_date - planned_resolution_date`
  - If resolved (e.g. `actual_resolution_date` set):  
    `delay_days = actual_resolution_date - planned_resolution_date`
  - If `planned_resolution_date` is NULL: `delay_days` remains NULL.

## 4. Indexes

- `reference_no`, `status`, `stage`, `created_at`
- Plus: `old_reference_no`, `response_source`, `planned_resolution_date`

## 5. Migration rules

- **Filter:** Insert only rows where your "Column X" = **Pending** (e.g. "Stage 1 - Status" = 'Pending').
- **created_at:** Use exact timestamp from file (e.g. "Query Arrival Date & Time" or "Timestamp").
- **old_reference_no:** Original "Reference No" from file (e.g. CH-0001, BU-0001).
- **description:** Concatenate title/description and append `"Original Ref: <old_reference_no>"`.
- **response_source:** Use `'upload'` for this dataset; use `'response'` for tickets created from the response system later.
- **reference_no:** Omit or set NULL on INSERT so the trigger generates CH-001, CH-002, … in insert order.

## Run order (Supabase SQL Editor)

1. Run **`SUPPORT_TICKETS_TABLE.sql`** (creates table, sequence, triggers, indexes).
2. Run **`SUPPORT_TICKETS_MIGRATION.sql`** (sample INSERTs and/or your bulk INSERTs).
3. Optionally set the sequence after bulk upload (see section 2 above).

---

## What to do now (after you ran step 1 & 2)

### Step 3: Check that the table and sample data exist

In Supabase SQL Editor, run:

```sql
SELECT reference_no, old_reference_no, status, stage, created_at
FROM public.support_tickets
ORDER BY created_at
LIMIT 10;
```

- You should see 3 sample rows (CH-001, CH-002, CH-003) if you ran `SUPPORT_TICKETS_MIGRATION.sql` as-is.
- If you see them, the table and triggers are working.

### Step 4: Bulk upload your own tickets (if you have more rows)

You have two options:

**Option A – Paste more INSERTs in SQL Editor**

1. From your spreadsheet/file, take only rows where the status column = **Pending** (e.g. "Stage 1 - Status" = Pending).
2. For each row, build one INSERT like the samples in `SUPPORT_TICKETS_MIGRATION.sql`:
   - `old_reference_no` = original "Reference No" from the file (e.g. CH-0476).
   - `description` = title/description + `" Original Ref: "` + that reference.
   - `created_at` = exact timestamp from the file (e.g. Query Arrival Date).
   - `planned_resolution_date` = Planned date, `actual_resolution_date` = Actual (or NULL if still Pending).
   - `stage` = 'Pending', `status` = 'Pending', `response_source` = 'upload'.
   - Leave `reference_no` out or set to `NULL` so the trigger assigns CH-004, CH-005, …
3. Paste all INSERTs into SQL Editor and run them **in one go** (or in batches), in a fixed order (e.g. by `created_at`) so reference numbers stay in order.

**Option B – Use a script or CSV import**

1. Export your Pending rows to CSV (with columns matching the table: old_reference_no, description, created_at, planned_resolution_date, etc.).
2. In Supabase: **Table Editor** → select `support_tickets` → **Insert** → **Import data from CSV** (map columns to the table).
3. For `reference_no`: leave the column empty so the trigger fills it, or ensure your import allows NULL for that column.

### Step 5: After bulk upload – set the sequence (important)

After you have inserted all your historical tickets, run this **once** in SQL Editor so new tickets get the next reference number (e.g. after CH-1240, the next will be CH-1241):

```sql
SELECT setval(
  'public.support_tickets_ref_seq',
  COALESCE((
    SELECT MAX(SUBSTRING(reference_no FROM '[0-9]+')::INTEGER)
    FROM public.support_tickets
    WHERE reference_no ~ '^CH-[0-9]+$'
  ), 0) + 1
);
```

- If you **only** have the 3 sample rows, you can skip this; the next insert will get CH-004.
- If you **bulk inserted** many rows, run this so the sequence continues after your last CH-XXXX.

### Step 6: Use the table (optional)

- **From your app:** Point your backend/API to the `support_tickets` table (Supabase client or REST API).
- **New tickets from the response system:** Insert with `response_source = 'response'` and `reference_no = NULL` so they get the next CH-XXXX.
- **Filters:** Use indexes on `status`, `stage`, `created_at`, `reference_no` for lists and reports.

---

## Stage logic (for your ETL)

- If source status = Pending → `stage = 'Pending'`, `status = 'Pending'`.
- If resolved (e.g. has actual resolution date or resolved flag) → `stage = 'Resolved'`, set `actual_resolution_date` and optionally `status` accordingly.
