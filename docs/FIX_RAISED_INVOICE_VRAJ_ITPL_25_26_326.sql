-- =============================================================================
-- Raised Invoice — Vraj Iron & Steels Ltd. (Siltara Div)
-- Invoice: ITPL/25-26/326 | Date: 01/03/2026 | Amount: 22,680 | Genre: Monthly (M)
--
-- Run in Supabase SQL Editor if this row is missing or not visible on
-- Payment Management (open list = payment_received_date IS NULL).
-- =============================================================================

-- 1) Clear "paid" flag so it appears under Raised Invoices (open)
UPDATE public.onboarding_client_payment
SET payment_received_date = NULL
WHERE invoice_number = 'ITPL/25-26/326';

-- 2) Insert if missing (exact company_name; no companies-table join)
WITH base AS (
  SELECT COALESCE(
    MAX((substring(reference_no FROM '^INV/COMP/([0-9]+)$'))::int),
    0
  ) AS n
  FROM public.onboarding_client_payment
  WHERE reference_no ~ '^INV/COMP/[0-9]+$'
)
INSERT INTO public.onboarding_client_payment (
  timestamp,
  reference_no,
  company_name,
  invoice_date,
  invoice_amount,
  invoice_number,
  genre,
  stage,
  payment_received_date
)
SELECT
  clock_timestamp(),
  'INV/COMP/' || lpad((base.n + 1)::text, 4, '0'),
  'Vraj Iron & Steels Ltd. (Siltara Div)',
  date '2026-03-01',
  '22680',
  'ITPL/25-26/326',
  'M',
  NULL,
  NULL
FROM base
WHERE NOT EXISTS (
  SELECT 1 FROM public.onboarding_client_payment o WHERE o.invoice_number = 'ITPL/25-26/326'
);

-- 3) Check
-- SELECT id, reference_no, company_name, invoice_date, invoice_amount, invoice_number, genre, payment_received_date
-- FROM public.onboarding_client_payment
-- WHERE invoice_number = 'ITPL/25-26/326';
