-- ============================================================================
-- FMS ALL TICKETS UPGRADE - Enterprise Ticket Management
-- Run in Supabase SQL Editor AFTER DASHBOARD_UPGRADE.sql
-- ============================================================================

-- 1. Add missing columns to tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS division_other TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'unapproved' CHECK (approval_status IN ('approved', 'unapproved'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_time_seconds INTEGER;  -- computed: resolved_at - created_at

-- 2. Ticket responses table (response history)
CREATE TABLE IF NOT EXISTS public.ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    responded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket ON public.ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_created ON public.ticket_responses(created_at);

-- 3. reference_no trigger: CH-0001, BU-0001, FE-0001 (continues after bulk upload e.g. CH-0072)
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
    -- Support CH-001 / BU-0007 (and legacy CH/0001): strip prefix + hyphen or slash, max numeric + 1
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
        NEW.reference_no := prefix || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 4, '0');
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ticket_ref BEFORE INSERT ON public.tickets
FOR EACH ROW WHEN (NEW.reference_no IS NULL OR NEW.reference_no = '')
EXECUTE FUNCTION generate_ticket_reference();

-- 4. Migrate existing reference_no to new format (optional - for existing tickets)
-- UPDATE public.tickets SET reference_no = NULL WHERE reference_no LIKE 'TKT-%';
-- (Uncomment to regenerate refs - or leave old format for existing tickets)

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON public.tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_approval ON public.tickets(approval_status);
CREATE INDEX IF NOT EXISTS idx_tickets_query_arrival ON public.tickets(query_arrival_at);
CREATE INDEX IF NOT EXISTS idx_tickets_query_response ON public.tickets(query_response_at);

-- 6. Function to compute actual_time on resolve
CREATE OR REPLACE FUNCTION public.update_ticket_actual_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resolved_at IS NOT NULL AND NEW.created_at IS NOT NULL THEN
        NEW.actual_time_seconds := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ticket_actual_time ON public.tickets;
CREATE TRIGGER tr_ticket_actual_time
BEFORE INSERT OR UPDATE OF resolved_at ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.update_ticket_actual_time();

-- 7. Backfill actual_time for existing resolved tickets
UPDATE public.tickets
SET actual_time_seconds = EXTRACT(EPOCH FROM (resolved_at - created_at))::INTEGER
WHERE resolved_at IS NOT NULL AND actual_time_seconds IS NULL;
