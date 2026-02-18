-- ============================================================================
-- SUPPORT_TICKETS TABLE – Normalized structure for customer support tickets
-- ============================================================================
-- Run in Supabase SQL Editor. Creates table, sequence, triggers, indexes.
-- Use SUPPORT_TICKETS_MIGRATION.sql for sample/bulk insert from your dataset.
-- ============================================================================

-- 1. Sequence for auto-incrementing reference_no (CH-001, CH-002, ...)
CREATE SEQUENCE IF NOT EXISTS public.support_tickets_ref_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- 2. Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no VARCHAR(20) UNIQUE,  -- filled by trigger if NULL on INSERT
  old_reference_no VARCHAR(50),
  description TEXT,
  stage VARCHAR(50) NOT NULL DEFAULT 'Pending',
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL,
  planned_resolution_date DATE,
  actual_resolution_date DATE,
  delay_days INTEGER,
  response_source VARCHAR(20) NOT NULL DEFAULT 'upload' CHECK (response_source IN ('upload', 'response')),
  -- Optional: keep extra context from your file
  title TEXT,
  type_of_request VARCHAR(50),
  page VARCHAR(255),
  company_name VARCHAR(255),
  submitted_by VARCHAR(255),
  query_arrival_at TIMESTAMPTZ,
  query_response_at TIMESTAMPTZ,
  reply_status VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.support_tickets IS 'Customer support tickets; reference_no = CH-001, CH-002...; delay_days computed by trigger.';

-- 3. Trigger function: auto-generate reference_no on INSERT when null
CREATE OR REPLACE FUNCTION public.support_tickets_set_reference_no()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.reference_no IS NULL OR TRIM(NEW.reference_no) = '' THEN
    next_num := nextval('public.support_tickets_ref_seq');
    NEW.reference_no := 'CH-' || LPAD(next_num::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_support_tickets_reference_no ON public.support_tickets;
CREATE TRIGGER tr_support_tickets_reference_no
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.support_tickets_set_reference_no();

-- 4. Trigger function: compute delay_days
-- If status = 'Pending': delay_days = current_date - planned_resolution_date
-- If resolved (status != 'Pending' or stage = 'Resolved'): delay_days = actual_resolution_date - planned_resolution_date
CREATE OR REPLACE FUNCTION public.support_tickets_set_delay_days()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.planned_resolution_date IS NULL THEN
    NEW.delay_days := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status = 'Pending' OR (NEW.stage IS NOT NULL AND NEW.stage = 'Pending') THEN
    NEW.delay_days := (CURRENT_DATE - NEW.planned_resolution_date)::INTEGER;
  ELSIF NEW.actual_resolution_date IS NOT NULL THEN
    NEW.delay_days := (NEW.actual_resolution_date - NEW.planned_resolution_date)::INTEGER;
  ELSE
    NEW.delay_days := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_support_tickets_delay_days ON public.support_tickets;
CREATE TRIGGER tr_support_tickets_delay_days
  BEFORE INSERT OR UPDATE OF status, stage, planned_resolution_date, actual_resolution_date
  ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.support_tickets_set_delay_days();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_reference_no ON public.support_tickets(reference_no);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_stage ON public.support_tickets(stage);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_old_reference_no ON public.support_tickets(old_reference_no);
CREATE INDEX IF NOT EXISTS idx_support_tickets_response_source ON public.support_tickets(response_source);
CREATE INDEX IF NOT EXISTS idx_support_tickets_planned_resolution_date ON public.support_tickets(planned_resolution_date);

-- 6. Optional: set sequence to start after existing max reference (run AFTER bulk upload if you inserted with explicit reference_no)
-- SELECT setval('public.support_tickets_ref_seq', (SELECT COALESCE(MAX(SUBSTRING(reference_no FROM '[0-9]+')::INTEGER), 0) + 1 FROM public.support_tickets WHERE reference_no ~ '^CH-[0-9]+$'));
