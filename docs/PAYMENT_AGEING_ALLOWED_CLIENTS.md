# Payment Ageing — allowed clients (per quarter)

The **Payment Ageing** report only shows companies that appear in the allowed list for the current quarter.

- **Source of truth:** `backend/app/payment_ageing.py`
  - `PAYMENT_AGEING_ALLOWED_COMPANY_NAMES` — human-readable names (edit this list).
  - `PAYMENT_AGEING_ALLOWED_COMPANY_KEYS` — normalized keys (computed at import; do not edit).

Matching uses `normalize_company_name()` so small spelling/punctuation differences between `companies`, invoices, and `onboarding_client_payment_ageing` still match the same row.

**To change the client set for a new quarter:** update `PAYMENT_AGEING_ALLOWED_COMPANY_NAMES` and redeploy the backend.
