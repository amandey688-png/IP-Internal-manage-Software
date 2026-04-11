-- =============================================================================
-- Client Payment: editing core "Raised Invoice" / Add Invoice fields
-- =============================================================================
-- The app enforces the same rules via API:
--   PUT /onboarding/client-payment/{id}
--   - Only while payment_received_date IS NULL
--   - Only within 30 calendar days of onboarding_client_payment.timestamp
--
-- No new columns are required. The backend updates:
--   company_name, invoice_date, invoice_amount, invoice_number, genre
--
-- If you must correct data outside the 30-day window (e.g. typo), run an
-- explicit UPDATE in the SQL Editor as a privileged user:
-- =============================================================================

-- Example: fix one row by id (adjust UUID and values)
/*
update public.onboarding_client_payment
set
  company_name = 'Corrected Company Ltd.',
  invoice_date = '2026-04-01',
  invoice_amount = '145800',
  invoice_number = 'ITPL/26-27/038',
  genre = 'Q'
where id = '00000000-0000-0000-0000-000000000000'::uuid;
*/

-- Inspect rows that are still within the 30-day edit window (unpaid):
/*
select
  id,
  reference_no,
  timestamp,
  company_name,
  invoice_date,
  payment_received_date,
  (current_timestamp at time zone 'utc' - timestamp::timestamptz) as age
from public.onboarding_client_payment
where payment_received_date is null
  and timestamp is not null
  and (current_timestamp at time zone 'utc' - timestamp::timestamptz) <= interval '30 days'
order by timestamp desc;
*/

-- RLS: FastAPI with SUPABASE_SERVICE_ROLE_KEY bypasses RLS; no policy change needed
-- for the API. Direct browser (anon) access would need separate policies.
