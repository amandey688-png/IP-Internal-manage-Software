# Payment Ageing — allowed clients (per quarter)

The **Payment Ageing** report only shows companies that appear in the allowed list for the current quarter.

- **Source of truth:** `backend/app/payment_ageing.py`
  - `PAYMENT_AGEING_ALLOWED_COMPANY_NAMES` — human-readable names (edit this list).
  - `PAYMENT_AGEING_ALLOWED_COMPANY_KEYS` — normalized keys (computed at import; do not edit).

Matching uses `normalize_company_name()` so small spelling/punctuation differences between `companies`, invoices, and `onboarding_client_payment_ageing` still match the same row.

The report API also matches ageing rows to `companies` by **`company_id`** when set, and by **token Jaccard** (≥ 0.68) when the sheet name and master name still differ (e.g. “Steel” vs “Steels”). Stored **`quarter_days`** always show in the grid; **median / bucket** weighting still ignores quarters before the company’s first raised invoice when that date is known.

Optional FK back-fill: `docs/SUPABASE_PAYMENT_AGEING_BACKFILL_COMPANY_ID.sql`.

**To change the client set for a new quarter:** update `PAYMENT_AGEING_ALLOWED_COMPANY_NAMES` and redeploy the backend.
