-- Fix ticket reference_no trigger so it works after bulk upload (CH-001, BU-0007, FE-0013 format).
-- The old trigger expected CH/0001 (slash) and failed with "invalid input syntax for type integer: CH-007"
-- when existing rows had hyphen format. This version:
--   - Parses existing reference_no in both CH-001 and CH/0001 formats
--   - Generates next ref as CH-0072, BU-0008, FE-0014 (hyphen + 4-digit number)
-- Run in Supabase SQL Editor.

DROP TRIGGER IF EXISTS tr_ticket_ref ON public.tickets;
DROP FUNCTION IF EXISTS public.generate_ticket_reference() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_ticket_reference()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    n INT;
BEGIN
    prefix := CASE UPPER(NEW.type)
        WHEN 'CHORE' THEN 'CH'
        WHEN 'BUG' THEN 'BU'
        WHEN 'FEATURE' THEN 'FE'
        ELSE 'TK'
    END;
    -- Support CH-001 / BU-0007 / FE-0013 (and legacy CH/0001): strip prefix + hyphen or slash, max numeric part + 1
    SELECT COALESCE(MAX(
        CAST(NULLIF(TRIM(REGEXP_REPLACE(t.reference_no, '^[A-Z]+[-/]', '')), '') AS INT)
    ), 0) + 1 INTO n
    FROM public.tickets t
    WHERE t.type = NEW.type
      AND t.reference_no ~ '^[A-Z]+[-/][0-9]+$';
    NEW.reference_no := prefix || '-' || LPAD(n::TEXT, 4, '0');
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If any row has unexpected format, fallback: use timestamp-based unique ref
        NEW.reference_no := prefix || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 4, '0');
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ticket_ref BEFORE INSERT ON public.tickets
FOR EACH ROW WHEN (NEW.reference_no IS NULL OR NEW.reference_no = '')
EXECUTE FUNCTION generate_ticket_reference();

COMMENT ON FUNCTION public.generate_ticket_reference() IS 'Auto-generate reference_no as CH-0001, BU-0001, FE-0001; continues after bulk upload (e.g. CH-0072 after CH-0071).';
