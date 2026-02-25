-- ============================================================================
-- Delete companies "Nirman TMt" and "Nirman TMT" from the database
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

-- Step 1: (Optional) See which tickets use these companies
-- SELECT id, reference_no, title, company_id FROM public.tickets
-- WHERE company_id IN (SELECT id FROM public.companies WHERE name IN ('Nirman TMt', 'Nirman TMT'));

-- Step 2: Clear company_id on any tickets that reference these companies
-- (Otherwise the DELETE below will fail due to foreign key.)
UPDATE public.tickets
SET company_id = NULL
WHERE company_id IN (
  SELECT id FROM public.companies
  WHERE name IN ('Nirman TMt', 'Nirman TMT')
);

-- Step 3: Delete the two companies (their divisions are removed automatically via CASCADE)
DELETE FROM public.companies
WHERE name IN ('Nirman TMt', 'Nirman TMT');

-- Optional: Verify they are gone
-- SELECT * FROM public.companies WHERE name ILIKE '%Nirman%';
