-- ============================================================================
-- SUCCESS MODULE - Performance Monitoring
-- ============================================================================
-- Run in Supabase SQL Editor after RUN_IN_SUPABASE.sql (companies table exists)
-- ============================================================================
-- Part 1: Add POC Details (performance_monitoring)
-- Part 2: Training Form (performance_training, ticket_features, feature_list)
-- Part 3: Followup System (feature_followups)
-- Part 4: Percentage logic enforced in backend
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: performance_monitoring (POC Details)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.performance_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    message_owner TEXT NOT NULL CHECK (message_owner IN ('yes', 'no')),
    response TEXT,
    contact TEXT,
    reference_no TEXT NOT NULL UNIQUE,
    completion_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_monitoring_company ON public.performance_monitoring(company_id);
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_status ON public.performance_monitoring(completion_status);
CREATE INDEX IF NOT EXISTS idx_performance_monitoring_ref ON public.performance_monitoring(reference_no);

-- Function: Generate reference_no (first 4 letters of company + 0001, 0002, ... per company)
CREATE OR REPLACE FUNCTION public.generate_performance_reference(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
    company_prefix TEXT;
    next_num INT;
BEGIN
    SELECT UPPER(LEFT(REGEXP_REPLACE(COALESCE(name, ''), '[^a-zA-Z]', '', 'g'), 4))
    INTO company_prefix
    FROM public.companies WHERE id = p_company_id;
    
    IF company_prefix IS NULL OR LENGTH(company_prefix) < 1 THEN
        company_prefix := 'XXXX';
    END IF;
    
    SELECT COALESCE(MAX(
        CAST(NULLIF(REGEXP_REPLACE(reference_no, '^[A-Z]{1,4}', ''), '') AS INT)
    ), 0) + 1
    INTO next_num
    FROM public.performance_monitoring
    WHERE company_id = p_company_id
      AND reference_no ~ ('^' || company_prefix || '[0-9]+$');
    
    RETURN company_prefix || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: feature_list (master list of features)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feature_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.feature_list (name, display_order) VALUES
    ('Indent', 1), ('PO', 2), ('GRN', 3), ('Issue', 4), ('Item Approval', 5),
    ('Reorder Level', 6), ('RFQ', 7), ('QC', 8), ('Gate Pass', 9), ('Work Order', 10),
    ('CC in Issue', 11), ('Location in Stock', 12), ('Vendor Approval', 13),
    ('Negotiation', 14), ('Physical Stock Taking', 15), ('Payment Management', 16),
    ('Budget', 17), ('Scrap', 18), ('Mandatory Vendor', 19)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 2: performance_training (Training Form per ticket)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.performance_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_id UUID NOT NULL REFERENCES public.performance_monitoring(id) ON DELETE CASCADE,
    call_poc TEXT NOT NULL CHECK (call_poc IN ('yes', 'no')),
    message_poc TEXT NOT NULL CHECK (message_poc IN ('yes', 'no')),
    message_owner TEXT NOT NULL CHECK (message_owner IN ('yes', 'no')),
    training_schedule_date DATE,
    training_status TEXT NOT NULL CHECK (training_status IN ('yes', 'no')),
    remarks TEXT,
    total_percentage NUMERIC(5,2) DEFAULT 0 CHECK (total_percentage >= 0 AND total_percentage <= 100),
    previous_percentage NUMERIC(5,2) DEFAULT 0,
    current_percentage NUMERIC(5,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(performance_id)
);

CREATE INDEX IF NOT EXISTS idx_performance_training_perf ON public.performance_training(performance_id);

-- ============================================================================
-- PART 2: ticket_features (features committed per training)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID NOT NULL REFERENCES public.performance_training(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES public.feature_list(id) ON DELETE CASCADE,
    UNIQUE(training_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_features_training ON public.ticket_features(training_id);
CREATE INDEX IF NOT EXISTS idx_ticket_features_feature ON public.ticket_features(feature_id);

-- ============================================================================
-- PART 3: feature_followups (one per feature per ticket)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feature_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_feature_id UUID NOT NULL REFERENCES public.ticket_features(id) ON DELETE CASCADE,
    previous_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    feature_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'pending')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticket_feature_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_followups_ticket_feature ON public.feature_followups(ticket_feature_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.performance_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS performance_select ON public.performance_monitoring;
CREATE POLICY performance_select ON public.performance_monitoring FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS performance_insert ON public.performance_monitoring;
CREATE POLICY performance_insert ON public.performance_monitoring FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS performance_update ON public.performance_monitoring;
CREATE POLICY performance_update ON public.performance_monitoring FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS training_select ON public.performance_training;
CREATE POLICY training_select ON public.performance_training FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS training_insert ON public.performance_training;
CREATE POLICY training_insert ON public.performance_training FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS training_update ON public.performance_training;
CREATE POLICY training_update ON public.performance_training FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS ticket_features_select ON public.ticket_features;
CREATE POLICY ticket_features_select ON public.ticket_features FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS ticket_features_insert ON public.ticket_features;
CREATE POLICY ticket_features_insert ON public.ticket_features FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS ticket_features_delete ON public.ticket_features;
CREATE POLICY ticket_features_delete ON public.ticket_features FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS followups_select ON public.feature_followups;
CREATE POLICY followups_select ON public.feature_followups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS followups_insert ON public.feature_followups;
CREATE POLICY followups_insert ON public.feature_followups FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS followups_update ON public.feature_followups;
CREATE POLICY followups_update ON public.feature_followups FOR UPDATE TO authenticated USING (true);
