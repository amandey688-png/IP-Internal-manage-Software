-- ============================================================================
-- FMS DATABASE - FRESH SETUP (Complete reset from scratch)
-- ============================================================================
-- WARNING: This DROPS all FMS tables and recreates them. Run in Supabase SQL Editor.
-- Use this when you want to start completely fresh.
-- ============================================================================

-- Step 1: Drop all FMS tables and views (in correct order due to dependencies)
DROP VIEW IF EXISTS public.users_view CASCADE;
DROP TABLE IF EXISTS public.ticket_responses CASCADE;
DROP TABLE IF EXISTS public.staging_deployments CASCADE;
DROP TABLE IF EXISTS public.solutions CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.divisions CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Drop triggers (they reference auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_email_confirmed() CASCADE;
DROP FUNCTION IF EXISTS public.generate_ticket_reference() CASCADE;

-- Step 2: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 3: Roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.roles (name, description, is_system_role) VALUES
    ('user', 'Standard user', TRUE),
    ('admin', 'Administrator', TRUE),
    ('master_admin', 'Master admin', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Step 4: User profiles
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role_id);

-- Step 5: Triggers for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE rid UUID;
BEGIN
    SELECT id INTO rid FROM public.roles WHERE name = 'user' LIMIT 1;
    IF rid IS NULL THEN SELECT id INTO rid FROM public.roles ORDER BY created_at LIMIT 1; END IF;
    IF rid IS NOT NULL THEN
        INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), rid, TRUE)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE rid UUID;
BEGIN
    SELECT id INTO rid FROM public.roles WHERE name = 'user' LIMIT 1;
    IF rid IS NULL THEN SELECT id INTO rid FROM public.roles ORDER BY created_at LIMIT 1; END IF;
    IF rid IS NOT NULL THEN
        INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
        SELECT NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), rid, TRUE
        WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Step 6: Backfill profiles for existing auth.users
INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((SELECT id FROM public.roles WHERE name = 'user' LIMIT 1),
             (SELECT id FROM public.roles ORDER BY created_at LIMIT 1)), TRUE
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Tickets table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('chore', 'bug', 'feature')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled', 'on_hold')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON public.tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON public.tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);

CREATE OR REPLACE FUNCTION generate_ticket_reference()
RETURNS TRIGGER AS $$
DECLARE n INT;
BEGIN
    SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(reference_no, '^TKT-', ''), '') AS INT)), 0) + 1 INTO n FROM public.tickets;
    NEW.reference_no := 'TKT-' || LPAD(n::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ticket_ref BEFORE INSERT ON public.tickets
FOR EACH ROW WHEN (NEW.reference_no IS NULL OR NEW.reference_no = '')
EXECUTE FUNCTION generate_ticket_reference();

-- Step 8: Solutions table
CREATE TABLE public.solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    solution_number SMALLINT NOT NULL CHECK (solution_number IN (1, 2)),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposed_by UUID NOT NULL REFERENCES auth.users(id),
    proposed_at TIMESTAMPTZ DEFAULT NOW(),
    is_selected BOOLEAN DEFAULT FALSE,
    selected_at TIMESTAMPTZ,
    selected_by UUID REFERENCES auth.users(id),
    quality_score SMALLINT CHECK (quality_score BETWEEN 1 AND 10),
    quality_notes TEXT,
    UNIQUE(ticket_id, solution_number)
);
CREATE INDEX IF NOT EXISTS idx_solutions_ticket ON public.solutions(ticket_id);

-- Step 9: Staging deployments table
CREATE TABLE public.staging_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    staging_environment TEXT NOT NULL DEFAULT 'staging-1',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
    version TEXT,
    deployment_notes TEXT,
    deployed_by UUID REFERENCES auth.users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rollback_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staging_ticket ON public.staging_deployments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_staging_status ON public.staging_deployments(status);

-- Step 10: Users view
CREATE OR REPLACE VIEW public.users_view AS
SELECT up.id, au.email, up.full_name, r.name as role_name, up.is_active, up.created_at
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
JOIN public.roles r ON r.id = up.role_id;

-- ============================================================================
-- DONE - Fresh database ready
-- ============================================================================
-- Verify:
--   SELECT COUNT(*) FROM public.roles;        -- should be 3
--   SELECT COUNT(*) FROM public.user_profiles; -- should match auth.users count
--   SELECT * FROM public.tickets LIMIT 1;      -- should be empty
