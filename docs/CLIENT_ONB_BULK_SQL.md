# Client ONB bulk load (active + inactive)

Pasting hundreds of `VALUES (...)` lines by hand is fragile. Use one of these:

## 1. Recommended: generate SQL from TSV (Supabase SQL Editor)

1. In Excel, copy your sheet (with header row) and paste into a text file, or **Save As** Unicode / tab-delimited text. Ensure the first line is the column headers exactly as in your spreadsheet.
2. From the `backend` folder:

   ```text
   python scripts/bulk_import_client_onb.py path\to\active.tsv --status active --emit-sql ..\docs\sql\client_onb_active.sql
   python scripts/bulk_import_client_onb.py path\to\inactive.tsv --status inactive --emit-sql ..\docs\sql\client_onb_inactive.sql
   ```

3. In **Supabase → SQL Editor**, run migrations **once** (in order), if not already applied:
   - `docs/SUPABASE_DB_CLIENT_CLIENT_ONB.sql` (or your existing table create)
   - `docs/SUPABASE_DB_CLIENT_CLIENT_ONB_ADD_STATUS.sql` (if `status` is missing)
   - `docs/SUPABASE_DB_CLIENT_CLIENT_ONB_FOLLOWUP_COLUMNS.sql` (needed for inactive follow-up columns)

4. Open **`docs/sql/client_onb_active.sql`**, paste into the editor, **Run**. Then run **`docs/sql/client_onb_inactive.sql`**.

   (These files are checked in for the current export; regenerate after you change the TSV sources under `data/client_onb/`.)

Each generated file wraps inserts in `BEGIN` / `COMMIT` so either the whole file applies or nothing does. `reference_no` values are unique (`ONB-IMP-…`).

## 2. Alternative: direct API insert (no SQL file)

Same TSV files, with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`:

```text
python scripts/bulk_import_client_onb.py path\to\active.tsv --status active
python scripts/bulk_import_client_onb.py path\to\inactive.tsv --status inactive
```

## 3. Manual SQL shape (reference only)

If you write SQL yourself, every row must satisfy:

- `reference_no` **unique** (not null).
- `status` = `'active'` or `'inactive'` (check constraint).
- Inactive sheet rows: set `status = 'inactive'` and fill `last_contacted_on`, `remarks_2`, `follow_up_needed` where you have data (nullable).
- `client_till`: use `NULL` for ongoing clients (e.g. “Present”).
- Escape single quotes in text as `''`.

The generator uses this column list:

`timestamp`, `reference_no`, `organization_name`, `company_name`, `contact_person`, `mobile_no`, `email_id`, `paid_divisions`, `division_abbreviation`, `name_of_divisions_cost_details`, `amount_paid_per_division`, `total_amount_paid_per_month`, `payment_frequency`, `client_since`, `client_till`, `client_duration`, `total_amount_paid_till_date`, `tds_percent`, `client_location_city`, `client_location_state`, `remarks`, `whatsapp_group_details`, `updated_at`, `last_contacted_on`, `remarks_2`, `follow_up_needed`, `status`.

`id` is omitted so `gen_random_uuid()` applies per row.
