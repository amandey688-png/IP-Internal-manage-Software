-- ============================================================================
-- FMS UPGRADE - Run this ENTIRE file in Supabase SQL Editor
-- ============================================================================
-- Use when: Python migration script fails (DNS/connection issues)
-- Copy ALL content below and paste in Supabase > SQL Editor > New query > Run
-- ============================================================================

-- ========== PART 1: DASHBOARD UPGRADE ==========
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.companies (name) VALUES
    ('Company A'), ('Company B'), ('Company C'), ('Acme Corp'), ('Tech Solutions')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.pages (name) VALUES
    ('Dashboard'), ('Billing'), ('Reports'), ('Settings'), ('Support'), ('Other')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);
INSERT INTO public.divisions (company_id, name)
SELECT c.id, d.n FROM public.companies c
CROSS JOIN (VALUES ('Sales'), ('Engineering'), ('Support'), ('Other')) AS d(n)
ON CONFLICT (company_id, name) DO NOTHING;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.pages(id);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES public.divisions(id);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS communicated_through TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS submitted_by TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS query_arrival_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_of_response TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS customer_questions TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS query_response_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS why_feature TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attachment_url TEXT;

CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON public.tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_tickets_first_response ON public.tickets(first_response_at);

-- ========== PART 2: ALL TICKETS UPGRADE ==========
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS division_other TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'unapproved';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_time_seconds INTEGER;

CREATE TABLE IF NOT EXISTS public.ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    responded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket ON public.ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_created ON public.ticket_responses(created_at);

DROP TRIGGER IF EXISTS tr_ticket_ref ON public.tickets;
DROP FUNCTION IF EXISTS public.generate_ticket_reference() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_ticket_reference()
RETURNS TRIGGER AS $$
DECLARE prefix TEXT; n INT;
BEGIN
    prefix := CASE UPPER(NEW.type) WHEN 'CHORE' THEN 'CH' WHEN 'BUG' THEN 'BU' WHEN 'FEATURE' THEN 'FE' ELSE 'TK' END;
    SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(reference_no, '^[A-Z]+/', ''), '') AS INT)), 0) + 1 INTO n FROM public.tickets WHERE type = NEW.type;
    NEW.reference_no := prefix || '/' || LPAD(n::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ticket_ref BEFORE INSERT ON public.tickets
FOR EACH ROW WHEN (NEW.reference_no IS NULL OR NEW.reference_no = '')
EXECUTE FUNCTION generate_ticket_reference();

CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON public.tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_approval ON public.tickets(approval_status);
CREATE INDEX IF NOT EXISTS idx_tickets_query_arrival ON public.tickets(query_arrival_at);
CREATE INDEX IF NOT EXISTS idx_tickets_query_response ON public.tickets(query_response_at);

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

UPDATE public.tickets SET actual_time_seconds = EXTRACT(EPOCH FROM (resolved_at - created_at))::INTEGER
WHERE resolved_at IS NOT NULL AND actual_time_seconds IS NULL;

-- ========== PART 3: CHORES & BUGS SLA (4-Stage Workflow) ==========
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_1 TEXT CHECK (status_1 IN ('yes', 'no'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_1 TIMESTAMPTZ;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_2 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_2 TEXT CHECK (status_2 IN ('completed', 'pending', 'staging', 'hold', 'na', 'rejected'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_2 TIMESTAMPTZ;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_3 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_3 TEXT CHECK (status_3 IN ('completed', 'pending', 'hold', 'rejected', 'na'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_3 TIMESTAMPTZ;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS planned_4 TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status_4 TEXT CHECK (status_4 IN ('completed', 'pending', 'na'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_4 TIMESTAMPTZ;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution_submitted_by TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_solution_submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tickets_status_4 ON public.tickets(status_4);
CREATE INDEX IF NOT EXISTS idx_tickets_actual_4 ON public.tickets(actual_4);
CREATE INDEX IF NOT EXISTS idx_tickets_has_solution ON public.tickets(id) WHERE quality_solution IS NOT NULL;

-- ============================================================================
-- DONE - Database upgrade complete
-- ============================================================================
