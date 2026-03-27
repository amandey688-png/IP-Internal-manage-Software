-- =============================================================================
-- Fix: Raised Invoices not visible for these invoice numbers
--   ITPL/25-26/326  Vraj Iron & Steels Ltd. (Siltara Div)
--   ITPL/25-26/328  Shree Parashnath Re-Roolling Mills Ltd.
--   ITPL/25-26/332  Bhagwati Power & Steel Ltd
--   ITPL/25-26/333  Vazron Industries Pvt. Ltd.
--
-- Causes:
--   1) Rows never inserted (bulk script INNER JOIN companies failed — no match)
--   2) Rows marked "paid" (payment_received_date set) — open list only shows unpaid
--
-- Run in Supabase SQL Editor (service role).
-- =============================================================================

-- A) If rows exist but were marked received, clear so they show under Payment Management (open)
UPDATE public.onboarding_client_payment
SET payment_received_date = NULL
WHERE invoice_number IN (
  'ITPL/25-26/326',
  'ITPL/25-26/328',
  'ITPL/25-26/332',
  'ITPL/25-26/333'
);

-- B) Insert missing rows (no companies join — uses exact company_name text)
--    Skips if invoice_number already exists.
WITH base AS (
  SELECT COALESCE(
    MAX((substring(reference_no FROM '^INV/COMP/([0-9]+)$'))::int),
    0
  ) AS n
  FROM public.onboarding_client_payment
  WHERE reference_no ~ '^INV/COMP/[0-9]+$'
),
v AS (
  SELECT * FROM (VALUES
    (date '2026-03-01', '22680', 'ITPL/25-26/326', 'M', 'Vraj Iron & Steels Ltd. (Siltara Div)'),
    (date '2026-03-01', '21240', 'ITPL/25-26/328', 'M', 'Shree Parashnath Re-Roolling Mills Ltd.'),
    (date '2026-03-01', '47200', 'ITPL/25-26/332', 'Q', 'Bhagwati Power & Steel Ltd'),
    (date '2026-03-01', '10620', 'ITPL/25-26/333', 'Q', 'Vazron Industries Pvt. Ltd.')
  ) AS t(invoice_date, invoice_amount, invoice_number, genre, company_name)
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
  'INV/COMP/' || lpad((base.n + row_number() OVER (ORDER BY v.invoice_number))::text, 4, '0'),
  v.company_name,
  v.invoice_date,
  v.invoice_amount,
  v.invoice_number,
  v.genre,
  NULL,
  NULL
FROM v
CROSS JOIN base
WHERE NOT EXISTS (
  SELECT 1
  FROM public.onboarding_client_payment o
  WHERE o.invoice_number = v.invoice_number
);

-- C) Verify (expect 3 rows)
-- SELECT id, reference_no, company_name, invoice_number, genre, payment_received_date
-- FROM public.onboarding_client_payment
-- WHERE invoice_number IN ('ITPL/25-26/328','ITPL/25-26/332','ITPL/25-26/333');
