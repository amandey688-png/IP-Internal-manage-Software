-- Fix company_id + company_name on tickets for specific CH reference numbers.
-- Run in Supabase SQL Editor.
--
-- Matches reference formats like "CH-0034", "CH - 0034", "ch- 0034" (spaces ignored).

-- Normalized reference: uppercase, spaces removed
-- WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0034';

BEGIN;

UPDATE public.tickets
SET
  company_id = 'c57a07d6-1751-4601-b0e5-6dba2ab52689'::uuid,
  company_name = 'Demo C',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0034';

UPDATE public.tickets
SET
  company_id = 'de61e340-fe65-47c9-bcd3-3b74aa37bada'::uuid,
  company_name = 'Nirman TMT',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') IN ('CH-0041', 'CH-0046');

UPDATE public.tickets
SET
  company_id = 'f6070d1f-f536-40df-b401-daf90feb46c2'::uuid,
  company_name = 'Karni Kripa Power Pvt Ltd.',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0054';

UPDATE public.tickets
SET
  company_id = '22271708-2eca-48ac-9846-8e6c14a92543'::uuid,
  company_name = 'Spintech Tubes Pvt. Ltd.',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0052';

UPDATE public.tickets
SET
  company_id = 'e11e234f-b740-4f85-aed6-2135bf37eec9'::uuid,
  company_name = 'Ugen Ferro Alloys Pvt. Ltd.',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0061';

UPDATE public.tickets
SET
  company_id = '96f250cc-a604-4adb-bf5a-61acbbecd2f5'::uuid,
  company_name = 'Kodarma Chemical Pvt. Ltd.',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0064';

UPDATE public.tickets
SET
  company_id = '0836fd22-8796-489f-8d72-d14fb3ec7274'::uuid,
  company_name = 'Indo East Corporation Pvt. Ltd.',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0067';

UPDATE public.tickets
SET
  company_id = '3fedad0b-1aea-45c7-87bf-ebfece5778aa'::uuid,
  company_name = 'Hi.Tech Power & Steel Ltd.',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') IN ('CH-0071', 'CH-0074', 'CH-0077');

UPDATE public.tickets
SET
  company_id = '8c4d1820-b285-40f1-b2e8-f4a279f6917c'::uuid,
  company_name = 'Dynamic Engineers Pvt Ltd',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0109';

UPDATE public.tickets
SET
  company_id = 'b3f647a2-c757-4acd-8ef3-d6fed5a1fb55'::uuid,
  company_name = 'Bhagwati Power Pvt. Ltd.',
  updated_at = now()
WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') = 'CH-0173';

COMMIT;

-- Verify:
-- SELECT reference_no, company_id, company_name
-- FROM public.tickets
-- WHERE regexp_replace(upper(trim(reference_no)), '\s', '', 'g') IN (
--   'CH-0034','CH-0041','CH-0046','CH-0054','CH-0052','CH-0061','CH-0064','CH-0067',
--   'CH-0071','CH-0074','CH-0077','CH-0109','CH-0173'
-- )
-- ORDER BY reference_no;
