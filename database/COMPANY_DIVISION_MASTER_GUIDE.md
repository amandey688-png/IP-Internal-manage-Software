# Company–Division Master: Step-by-Step Guide

This guide explains how to upload the company–division dataset so that the **Support ticket form** shows only divisions mapped to the selected company.

---

## 1. Database schema (already in place)

Your project already uses this normalized design:

| Table       | Purpose |
|------------|---------|
| `public.companies` | One row per company (`id` UUID, `name` TEXT UNIQUE). |
| `public.divisions` | One row per division per company (`id` UUID, `company_id` → `companies(id)`, `name` TEXT). UNIQUE(`company_id`, `name`). |

- Each **company** has many **divisions**.
- **Tickets** store `company_id` and `division_id`; both are validated by the app.

No schema change is required; you only need to load the master data.

---

## 2. Run the company–division master SQL in Supabase

### Step 2.1 – Open Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com) and open your project.
2. In the left sidebar, open **SQL Editor**.

### Step 2.2 – Ensure base schema exists

If you have not already run the main migration:

1. Open the file **`RUN_IN_SUPABASE.sql`** from the `database` folder.
2. Copy its full content and run it in the SQL Editor (New query → Paste → Run).

This creates `companies`, `pages`, and `divisions` (and the rest of the FMS schema).

### Step 2.3 – Load company–division data

1. Open **`database/COMPANY_DIVISION_MASTER.sql`**.
2. Copy the **entire** file.
3. In Supabase SQL Editor: **New query** → paste → **Run**.

What this script does:

- Creates a **temp table** and inserts your CSV rows (company name + division abbreviations).
- **Inserts into `companies`**: one row per company name (ignores duplicates).
- **Inserts into `divisions`**: for each company, splits `division_abbreviations` by comma and inserts one row per abbreviation (e.g. `SID`, `PP`, `RM`), so the Division dropdown will only show those codes for that company.

After a successful run you should see no errors. You can confirm with:

```sql
SELECT (SELECT count(*) FROM public.companies) AS companies_count,
       (SELECT count(*) FROM public.divisions) AS divisions_count;
```

---

## 3. Backend API (already implemented)

The app already exposes:

- **GET `/companies`**  
  Returns all companies (for the Company dropdown).

- **GET `/divisions?company_id=<uuid>`**  
  Returns only divisions for that company (used by the Support form when a company is selected).

No backend code change is needed for the company–division master; the same API is used.

---

## 4. Frontend (already implemented + small fix)

The Support form already:

1. Loads **companies** when the modal opens.
2. **Watches** the selected **company** (`Form.useWatch('company_id', form)`).
3. When the company changes, calls **`supportApi.getDivisions(companyId)`** and fills the **Division** dropdown with the returned list (only that company’s divisions).
4. Clears **Division** (and “If Other, specify”) when the company changes so no invalid division stays selected.

So:

- **Company** = full list from `GET /companies`.
- **Division** = only divisions for the chosen company from `GET /divisions?company_id=...`.

A small change was added so that when the user changes the company, the form clears `division_id` and `division_other` to avoid submitting a division that does not belong to the new company.

---

## 5. How to test

1. **Backend**  
   Ensure the FMS API is running (e.g. `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`).

2. **Frontend**  
   Run the FMS frontend (e.g. `npm run dev`), then log in.

3. **Open Support form**  
   Click **Submit Support Ticket** (or “Add New” / equivalent) so the Support ticket modal opens.

4. **Company dropdown**  
   You should see all companies from your master (e.g. “Vraj Metaliks Pvt. Ltd.”, “Agroha Steel and Power Pvt. Ltd.”, etc.).

5. **Select a company**  
   Example: **“Agroha Steel and Power Pvt. Ltd.”**.

6. **Division dropdown**  
   It should list **only** the divisions for that company (e.g. RM, SMS, CCM, RAW, SID, PP). No divisions from other companies should appear.

7. **Change company**  
   Select another company (e.g. “Vraj Metaliks Pvt. Ltd.”).  
   - Division dropdown should **update** to only that company’s divisions (e.g. only SID).  
   - Previously selected division should be **cleared** (no stale value).

8. **Submit a ticket**  
   Choose Company + Division + required fields and submit. The ticket should save with the correct `company_id` and `division_id`.

---

## 6. Adding or updating companies/divisions later

To add more rows or change mappings:

1. Edit **`database/COMPANY_DIVISION_MASTER.sql`**:
   - Add or change rows in the `INSERT INTO company_division_csv ... VALUES (...)` list (same format: `('Company Name', 'DIV1,DIV2,DIV3')`).
2. Run the **full** script again in the Supabase SQL Editor.

Because the script uses:

- `ON CONFLICT (name) DO NOTHING` for **companies**
- `ON CONFLICT (company_id, name) DO NOTHING` for **divisions**

running it again will only add **new** companies and **new** division rows; existing ones are left as-is. To **replace** all company–division data, you would first delete from `divisions` and optionally from `companies`, then run the script (not included here; ask if you need a “replace all” script).

---

## 7. Summary

| Step | Action |
|------|--------|
| 1 | Schema is already normalized (`companies` + `divisions`). |
| 2 | Run `RUN_IN_SUPABASE.sql` if not done yet. |
| 3 | Run `COMPANY_DIVISION_MASTER.sql` in Supabase SQL Editor to load your CSV data. |
| 4 | Backend already exposes `GET /companies` and `GET /divisions?company_id=...`. |
| 5 | Frontend already filters divisions by company and clears division when company changes. |
| 6 | Test by selecting different companies and checking that Division shows only mapped divisions. |

After this, the Support ticket form will only show and allow divisions that are mapped to the selected company, preventing invalid division selection and keeping submissions accurate.
