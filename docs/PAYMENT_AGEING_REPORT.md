# Payment Ageing Report (Client Payment)

## Supabase — recommended: one full script

Run **`docs/SUPABASE_PAYMENT_AGEING_FULL_SETUP.sql`** in the Supabase SQL Editor (single paste). It:

1. Creates `onboarding_client_payment_ageing` and `onboarding_client_payment_ageing_summary` (+ RLS).
2. Upserts **69 companies** with `quarter_days` (JSON array of **10** integers or `null` per row).

Requires `public.companies` to exist (FK on `company_id` is optional; seed rows use `company_name` only).

### Or run in two steps

| File | Purpose |
|------|---------|
| `docs/SUPABASE_PAYMENT_AGEING_REPORT.sql` | Tables only |
| `docs/SUPABASE_PAYMENT_AGEING_BULK_UPSERT.sql` | Data only (`ON CONFLICT (company_name) DO UPDATE`) |

## API (FastAPI)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/onboarding/client-payment/payment-ageing-report` | Main grid + computed bucket summary |
| PUT | `/onboarding/client-payment/payment-ageing-report/{company_key}` | Save 10 quarter day values (`company_key` = company UUID or URL-encoded name) |
| POST | `/onboarding/client-payment/payment-ageing-report/summary-upload` | Body `{ "summary_rows": [...] }` — optional spreadsheet summary |

## Source data (regenerate SQL from sheet)

1. Paste the sheet into **`docs/payment_ageing_bulk_import.tsv`** (columns: Name, Amount×2, 10 quarter **Days**, optional Median column).
2. Run:
   ```bash
   python docs/parse_payment_ageing_tsv.py
   python docs/generate_payment_ageing_sql.py
   ```
3. Re-run **`docs/SUPABASE_PAYMENT_AGEING_FULL_SETUP.sql`** in Supabase (or **BULK_UPSERT** only if tables already exist).

**Median** column in the sheet is **not** stored; the app recomputes median from the 10 quarter values.

**Next fiscal quarter:** Update the TSV with new **Days** for the new quarter, regenerate, and run the upsert again. To **shift** the 10 column headers in the app to “last 10 quarters” from today, change **`payment_ageing_sheet_quarters()`** in `backend/app/payment_ageing.py` (and keep TSV column order in sync). **Amount (Incl GST)** always comes from **Payment Management** (sum of raised invoice amounts per company).

## Behaviour

- **Companies**: All rows from `companies`, plus any `company_name` from `onboarding_client_payment` that does not match a master company name (case-insensitive).
- **Amount (Incl GST)**: Sum of `invoice_amount` (digits) per company from `onboarding_client_payment`.
- **10 fiscal quarter columns (fixed):** Q3 FY 23-24 through Q4 FY 25-26 (India FY Apr–Mar).
- **Median value**: Median of non-null quarter day values.
- **Last Q days**: Latest quarter’s days, or `0` if none.
- **Summary “Median” / “Received”**: Bucket sums by median days (0–7, 8–14, …).

## Frontend

- Route: **`/onboarding/client-payment/payment-ageing`**
- Menu: **Client Payment → Payment Ageing Report**
- Static SQL files: `public/SUPABASE_PAYMENT_AGEING_FULL_SETUP.sql`, `public/SUPABASE_PAYMENT_AGEING_REPORT.sql`
