-- ============================================================================
-- FMS DATABASE - COMPLETE SETUP (Run in Supabase SQL Editor)
-- ============================================================================
-- Run this ONCE. Idempotent - safe to re-run.
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 1: AUTH & USERS (roles, user_profiles)
-- ============================================================================

-- Roles table (create first)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop CHECK constraint on roles.name if exists (allows flexible role names)
DO $$
DECLARE c TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='roles') THEN
        FOR c IN SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.roles'::regclass AND contype = 'c'
        LOOP EXECUTE 'ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS ' || quote_ident(c);
        END LOOP;
    END IF;
END $$;

INSERT INTO public.roles (name, description, is_system_role) VALUES
    ('user', 'Standard user', TRUE),
    ('admin', 'Administrator', TRUE),
    ('master_admin', 'Master admin', TRUE)
ON CONFLICT (name) DO NOTHING;

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role_id);

-- Trigger: create profile on signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: ensure profile on email confirm
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

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Fix existing users
INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((SELECT id FROM public.roles WHERE name = 'user' LIMIT 1),
             (SELECT id FROM public.roles ORDER BY created_at LIMIT 1)), TRUE
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 2: TICKETS (drop first to avoid schema conflicts from old runs)
-- ============================================================================

DROP TABLE IF EXISTS public.staging_deployments CASCADE;
DROP TABLE IF EXISTS public.solutions CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;

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

DROP TRIGGER IF EXISTS tr_ticket_ref ON public.tickets;
CREATE TRIGGER tr_ticket_ref BEFORE INSERT ON public.tickets
FOR EACH ROW WHEN (NEW.reference_no IS NULL OR NEW.reference_no = '')
EXECUTE FUNCTION generate_ticket_reference();

-- ============================================================================
-- PART 3: SOLUTIONS
-- ============================================================================

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

-- ============================================================================
-- PART 4: STAGING DEPLOYMENTS
-- ============================================================================

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

-- View for users list (joins user_profiles + auth.users + roles)
CREATE OR REPLACE VIEW public.users_view AS
SELECT up.id, au.email, up.full_name, r.name as role_name, up.is_active, up.created_at
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
JOIN public.roles r ON r.id = up.role_id;

-- ============================================================================
-- DONE
-- ============================================================================
-- Verify: SELECT COUNT(*) FROM public.roles;
-- Verify: SELECT COUNT(*) FROM public.user_profiles;
-- Verify: SELECT * FROM public.tickets LIMIT 1;
