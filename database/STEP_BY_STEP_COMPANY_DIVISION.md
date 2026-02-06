# Step-by-Step: Company–Division Master Setup

Follow these steps in order. Use **Supabase SQL Editor** for all SQL (Dashboard → SQL Editor → New query).

---

## Part A: First-time setup (tables not yet created)

Do this only if you have **not** run the main FMS migration before.

| Step | What to do |
|------|------------|
| **A1** | Open **`database/RUN_IN_SUPABASE.sql`** in your project. |
| **A2** | Copy the **entire** file. |
| **A3** | In Supabase: **SQL Editor** → **New query** → paste → **Run**. |
| **A4** | Wait for “Success”. This creates `companies`, `divisions`, `pages`, `tickets`, etc. |

Then go to **Part C** (upload company–division data). Skip Part B.

---

## Part B: Re-upload (delete old divisions first)

Do this when you **already** have companies/divisions and want to **replace** divisions with the master file (e.g. after changing `COMPANY_DIVISION_MASTER.sql`).

| Step | What to do |
|------|------------|
| **B1** | In Supabase **SQL Editor**, click **New query**. |
| **B2** | Copy and run **only** this query: |
| | `DELETE FROM public.divisions;` |
| **B3** | Click **Run**. Wait for “Success”. All division rows are removed; companies stay. |
| **B4** | (Optional) To clear division on existing tickets so nothing points to old divisions, run: |
| | `UPDATE public.tickets SET division_id = NULL WHERE division_id IS NOT NULL;` |
| **B5** | Go to **Part C** and run the company–division master script. |

You can also use the file **`database/DELETE_DIVISIONS_FOR_REUPLOAD.sql`**: open it, copy the `DELETE` (and optional `UPDATE` if you want), paste in SQL Editor, Run.

---

## Part C: Upload company–division data (and “Other”)

| Step | What to do |
|------|------------|
| **C1** | Open **`database/COMPANY_DIVISION_MASTER.sql`** in your project. |
| **C2** | Copy the **entire** file (from the first line to the last). |
| **C3** | In Supabase: **SQL Editor** → **New query** → paste the full script. |
| **C4** | Click **Run**. |
| **C5** | Wait for “Success”. No error messages. |

What the script does:

- Inserts all companies from the CSV list (by name).
- For each company, inserts one division row per abbreviation (e.g. SID, PP, RM; comma-separated values are split).
- Adds a division named **"Other"** for **every** company.

---

## Part D: Verify in Supabase

| Step | What to do |
|------|------------|
| **D1** | In Supabase **SQL Editor**, **New query**. |
| **D2** | Run: |
| | `SELECT (SELECT count(*) FROM public.companies) AS companies_count, (SELECT count(*) FROM public.divisions) AS divisions_count;` |
| **D3** | You should see something like **71** companies and **hundreds** of divisions (abbreviations + one “Other” per company). |
| **D4** | Optional: check “Other” for every company: |
| | `SELECT c.name, d.name FROM public.companies c JOIN public.divisions d ON d.company_id = c.id WHERE d.name = 'Other' ORDER BY c.name;` |
| | You should see one row per company with division name “Other”. |

---

## Part E: Test in the app

| Step | What to do |
|------|------------|
| **E1** | Start **backend** (e.g. `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`). |
| **E2** | Start **frontend** (e.g. `npm run dev`), open the app, and **log in**. |
| **E3** | Open the **Support ticket form** (e.g. click **Submit Support Ticket**). |
| **E4** | In **Company**, select a company (e.g. “Agroha Steel and Power Pvt. Ltd.”). |
| **E5** | In **Division**, confirm you see only that company’s divisions (e.g. RM, SMS, CCM, RAW, SID, PP) **and** **“Other”**. |
| **E6** | Change **Company** to another (e.g. “Vraj Metaliks Pvt. Ltd.”). **Division** should update to only that company’s list (e.g. SID and **Other**). |
| **E7** | Select **“Other”** in Division; the “If Other, specify” field should appear. Fill and submit a ticket to confirm it saves correctly. |

---

## Quick reference

| Goal | Steps |
|------|--------|
| **First time** (no companies/divisions yet) | Part A → Part C → Part D → Part E |
| **Re-upload** (replace existing divisions) | Part B → Part C → Part D → Part E |
| **Only delete divisions** | Part B (steps B1–B3; optionally B4). |

---

## Files used

| File | Use |
|------|-----|
| `RUN_IN_SUPABASE.sql` | Create base tables (companies, divisions, etc.). Run once. |
| `DELETE_DIVISIONS_FOR_REUPLOAD.sql` | Contains `DELETE FROM public.divisions;` (and optional `UPDATE`). Use when re-uploading. |
| `COMPANY_DIVISION_MASTER.sql` | Load companies + divisions from CSV and add “Other” for every company. Run after Part A or after Part B. |

If anything fails, check the Supabase SQL Editor message and that you ran the steps in the order above.
