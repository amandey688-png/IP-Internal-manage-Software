# Insert support ticket data into `public.tickets` (as-is)

This puts the TSV data **exactly** into the **tickets** table on Supabase.

---

## 1. Add extra columns (once)

Run in **Supabase → SQL Editor**:

```sql
-- From TICKETS_ADD_SUPPORT_COLUMNS.sql
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS page TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS division TEXT;
```

---

## 2. Run the bulk INSERT

1. Open **Supabase → SQL Editor**.
2. Open **`database/TICKETS_BULK_INSERT_FROM_TSV.sql`** and copy its full contents.
3. Paste into the editor and run.

**Requirements:**

- At least one row in **`public.companies`** (used for `company_id`).
- At least one row in **`public.user_profiles`** (used for `created_by`).

**Behaviour:**

- Inserts 78 rows from **`support_tickets_upload.tsv`**.
- **reference_no** comes from the TSV (e.g. CH-0001, BU-0001).
- **Type of request** → `type`: "Bugs"→bug, "Chores"→chore, else feature.
- **Communicated Though**: "Phone"→phone, "Mail"→mail; "Chat" is stored as NULL (DB only allows phone/mail/whatsapp unless you change the check).
- All other columns (Title, Description, Attachment, Page, Company Name, Users Name, Division, etc.) are stored as-is in the matching `tickets` columns.

**Conflict:**

- The script ends with `ON CONFLICT (reference_no) DO NOTHING`, so existing reference numbers are skipped.

---

## 3. Regenerating the SQL from the TSV

If you change **`database/support_tickets_upload.tsv`** and want to regenerate the INSERT script:

```bash
python database/gen_tickets_bulk_sql.py
```

This overwrites **`database/TICKETS_BULK_INSERT_FROM_TSV.sql`**.

---

## Files

| File | Purpose |
|------|--------|
| **TICKETS_ADD_SUPPORT_COLUMNS.sql** | Adds `page`, `company_name`, `division` to `tickets`. |
| **TICKETS_BULK_INSERT_FROM_TSV.sql** | Bulk INSERT from the TSV (78 rows). |
| **support_tickets_upload.tsv** | Source data. |
| **gen_tickets_bulk_sql.py** | Regenerates the bulk INSERT from the TSV. |
