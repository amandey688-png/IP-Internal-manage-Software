-- =============================================================================
-- Production fix: Success / Performance Monitoring reference_no = SUCC-0001 …
--
-- WHY you see SHIK0001, DINE0001, VRAJ0001 (all ending 0001):
--   The OLD function used the first 4 letters of the company name + a counter
--   PER COMPANY — so every company's first row is XXXX0001.
--
-- The FastAPI app already sends SUCC-####, but Supabase often has a BEFORE INSERT
-- trigger that sets reference_no = generate_performance_reference(company_id),
-- which overwrote the app value with the old format.
--
-- Run in Supabase SQL Editor (staging first). BACK UP production before updates.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Align the database function with the app (global SUCC- sequence)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_performance_reference(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INT;
BEGIN
  -- p_company_id is ignored; global SUCC- sequence (matches backend _generate_performance_reference)
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference_no FROM 6) AS INT)
  ), 0) + 1
  INTO next_num
  FROM public.performance_monitoring
  WHERE reference_no ~* '^SUCC-[0-9]+$'
    AND LENGTH(reference_no) > 5;

  RETURN 'SUCC-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- B) See if a trigger overwrites reference_no on insert (run and read output)
-- -----------------------------------------------------------------------------
-- SELECT tgname AS trigger_name, pg_get_triggerdef(t.oid, true) AS definition
-- FROM pg_trigger t
-- JOIN pg_class c ON c.oid = t.tgrelid
-- WHERE c.relname = 'performance_monitoring'
--   AND NOT t.tgisinternal;

-- If you see something like: NEW.reference_no := generate_performance_reference(...)
-- then fixing (A) is enough for NEW rows. Optionally change trigger to only set when NULL:
--   IF NEW.reference_no IS NULL OR btrim(NEW.reference_no) = '' THEN
--     NEW.reference_no := public.generate_performance_reference(NEW.company_id);
--   END IF;

-- -----------------------------------------------------------------------------
-- C) RENUMBER existing bad rows → SUCC-0001 … (see SUCCESS_PERFORMANCE_FIX_REFERENCE_NUMBERS.sql)
--    Run the commented block there (TMP- step + ORDER BY created_at) after reviewing SELECTs.
-- =============================================================================
