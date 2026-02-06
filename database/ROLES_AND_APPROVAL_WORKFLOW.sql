-- ============================================================================
-- ROLES & APPROVAL WORKFLOW
-- ============================================================================
-- Run in Supabase SQL Editor AFTER RUN_IN_SUPABASE.sql (or FRESH_SETUP).
-- Ensures: 3 roles (admin, approver, user), approval_settings, approval_logs,
-- approval_tokens, tickets.approved_by & approval_source.
-- ============================================================================

-- 1. Ensure "approver" role exists (Super Admin = admin/master_admin, Approver = approver, Operator = user)
INSERT INTO public.roles (id, name, description, is_system_role)
SELECT gen_random_uuid(), 'approver', 'Can approve/reject tickets, no settings', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'approver');

-- 2. approval_settings: store approval email addresses (comma-separated)
CREATE TABLE IF NOT EXISTS public.approval_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE DEFAULT 'approval_emails',
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);
INSERT INTO public.approval_settings (key, value) VALUES ('approval_emails', '')
ON CONFLICT (key) DO NOTHING;

-- 3. approval_logs: audit trail for every approval/rejection
CREATE TABLE IF NOT EXISTS public.approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
    source TEXT NOT NULL CHECK (source IN ('ui', 'email')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_logs_ticket ON public.approval_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_approval_logs_approved_at ON public.approval_logs(approved_at);

-- 4. approval_tokens: one-time, time-limited links for email approval
CREATE TABLE IF NOT EXISTS public.approval_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_token ON public.approval_tokens(token);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_ticket ON public.approval_tokens(ticket_id);

-- 5. Tickets: who approved and from where
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS approval_source TEXT CHECK (approval_source IN ('ui', 'email'));

COMMENT ON TABLE public.approval_settings IS 'Role 1 (admin) only. Approval email addresses.';
COMMENT ON TABLE public.approval_logs IS 'Every approval/rejection for reporting.';
COMMENT ON TABLE public.approval_tokens IS 'One-time email approval links.';
