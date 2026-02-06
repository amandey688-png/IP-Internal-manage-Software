-- ============================================================================
-- FMS DASHBOARD UPGRADE - Support Form & Metrics
-- Run in Supabase SQL Editor AFTER FRESH_SETUP.sql
-- ============================================================================

-- Companies (for Support Form dropdown)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.companies (name) VALUES
    ('Company A'), ('Company B'), ('Company C'), ('Acme Corp'), ('Tech Solutions')
ON CONFLICT (name) DO NOTHING;

-- Pages (for Support Form dropdown)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.pages (name) VALUES
    ('Dashboard'), ('Billing'), ('Reports'), ('Settings'), ('Support'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- Divisions (company-wise, for Support Form)
CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);
-- Seed divisions for each company (ignore conflicts)
INSERT INTO public.divisions (company_id, name)
SELECT c.id, d.n FROM public.companies c
CROSS JOIN (VALUES ('Sales'), ('Engineering'), ('Support'), ('Other')) AS d(n)
ON CONFLICT (company_id, name) DO NOTHING;

-- Add columns to tickets for Support Form & SLA tracking
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.pages(id);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES public.divisions(id);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS communicated_through TEXT CHECK (communicated_through IN ('phone', 'mail', 'whatsapp'));
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS submitted_by TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS query_arrival_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS quality_of_response TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS customer_questions TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS query_response_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS why_feature TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Indexes for dashboard metrics
-- Note: idx_tickets_created_at_month removed - date_trunc on timestamptz is not immutable.
-- idx_tickets_created_at (from FRESH_SETUP) is sufficient for date range queries.
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON public.tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_tickets_first_response ON public.tickets(first_response_at);

-- RLS (enable if using RLS)
-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
