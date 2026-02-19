-- Ticket reference number format: CH-0001, BU-0001, FE-0001 (no EX- prefix)
-- Run this once on your database. New tickets (inserted with reference_no NULL) get CH-*, BU-*, FE-* refs.

CREATE OR REPLACE FUNCTION generate_ticket_reference()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
BEGIN
    CASE NEW.type
        WHEN 'chore' THEN prefix := 'CH';
        WHEN 'bug' THEN prefix := 'BU';
        WHEN 'feature' THEN prefix := 'FE';
    END CASE;
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_no FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.tickets
    WHERE type = NEW.type
      AND reference_no LIKE prefix || '-%';
    NEW.reference_no := prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
