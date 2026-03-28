-- CH-0295: change Page (page_id) to Indent Register
-- Tickets store Page as page_id -> public.pages(id).
--
-- Why the name-based query failed: UI shows "Set Up" (two words), not "Setup".
-- Using UUIDs avoids name spelling mismatches.

-- Recommended: set page by known IDs (CH-0295 only)
UPDATE public.tickets
SET page_id = 'a0fc1683-b76d-4132-af85-2c00522f337f'::uuid
WHERE reference_no = 'CH-0295';

-- Safer: only update if page_id still matches the old page (avoids overwriting wrong row)
UPDATE public.tickets
SET page_id = 'a0fc1683-b76d-4132-af85-2c00522f337f'::uuid
WHERE reference_no = 'CH-0295'
  AND page_id = '8f94127d-4f0c-430e-ab15-259758dc670d'::uuid;

-- Verify:
-- SELECT t.reference_no, t.page_id, p.name AS page_name
-- FROM public.tickets t
-- LEFT JOIN public.pages p ON p.id = t.page_id
-- WHERE t.reference_no = 'CH-0295';

-- Name-based variant if you prefer (note: old name is often "Set Up", not "Setup"):
-- UPDATE public.tickets t
-- SET page_id = p_new.id
-- FROM public.pages p_old
-- JOIN public.pages p_new ON p_new.id = 'a0fc1683-b76d-4132-af85-2c00522f337f'::uuid
-- WHERE t.reference_no = 'CH-0295'
--   AND t.page_id = p_old.id
--   AND p_old.name IN ('Setup', 'Set Up');
