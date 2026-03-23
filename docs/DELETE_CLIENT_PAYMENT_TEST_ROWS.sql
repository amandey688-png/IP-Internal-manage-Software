-- =============================================================================
-- Delete specific Client Payment (Raised Invoice) rows — test / sample data
-- Run in Supabase SQL Editor (service role / SQL).
--
-- Targets rows from the UI screenshot:
--   INV/COMP/0001, 0002, 0003, 0004
--   Plus row with missing Reference: Company A, 15-Mar-2026, 10000, invoice 123
--
-- Related rows (sent, followups, intercept, etc.) CASCADE from parent.
-- =============================================================================

-- Preview first (optional)
-- SELECT id, reference_no, company_name, invoice_date, invoice_amount, invoice_number
-- FROM public.onboarding_client_payment
-- WHERE reference_no IN (
--   'INV/COMP/0001', 'INV/COMP/0002', 'INV/COMP/0003', 'INV/COMP/0004'
-- )
-- OR (
--   (reference_no IS NULL OR btrim(reference_no) = '')
--   AND company_name = 'Company A'
--   AND invoice_date = '2026-03-15'
--   AND invoice_amount = '10000'
--   AND invoice_number = '123'
-- );

DELETE FROM public.onboarding_client_payment
WHERE reference_no IN (
  'INV/COMP/0001',
  'INV/COMP/0002',
  'INV/COMP/0003',
  'INV/COMP/0004'
)
OR (
  (reference_no IS NULL OR btrim(reference_no) = '')
  AND company_name = 'Company A'
  AND invoice_date = '2026-03-15'
  AND coalesce(invoice_amount, '') = '10000'
  AND coalesce(invoice_number, '') = '123'
);

-- Optional: verify nothing left
-- SELECT COUNT(*) FROM public.onboarding_client_payment
-- WHERE reference_no LIKE 'INV/COMP/000%';
