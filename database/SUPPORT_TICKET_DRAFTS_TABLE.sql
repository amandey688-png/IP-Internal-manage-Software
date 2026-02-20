-- Support Ticket Drafts: Save form data per user when not submitted
-- Run this in Supabase SQL Editor before using the Support form draft feature.

-- 1. Create the support_ticket_drafts table
CREATE TABLE IF NOT EXISTS public.support_ticket_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.support_ticket_drafts IS 'Per-user drafts for Submit Support Ticket form. One row per user. Drafts expire after 24 hours (enforced by backend).';

CREATE INDEX IF NOT EXISTS idx_support_ticket_drafts_user_id ON public.support_ticket_drafts(user_id);

-- 2. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.support_ticket_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_support_ticket_drafts_updated_at ON public.support_ticket_drafts;
CREATE TRIGGER tr_support_ticket_drafts_updated_at
    BEFORE UPDATE ON public.support_ticket_drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.support_ticket_drafts_updated_at();

-- 3. RLS: Users can only read/insert/update/delete their own draft
ALTER TABLE public.support_ticket_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_ticket_drafts_select_own ON public.support_ticket_drafts;
CREATE POLICY support_ticket_drafts_select_own ON public.support_ticket_drafts
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS support_ticket_drafts_insert_own ON public.support_ticket_drafts;
CREATE POLICY support_ticket_drafts_insert_own ON public.support_ticket_drafts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS support_ticket_drafts_update_own ON public.support_ticket_drafts;
CREATE POLICY support_ticket_drafts_update_own ON public.support_ticket_drafts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS support_ticket_drafts_delete_own ON public.support_ticket_drafts;
CREATE POLICY support_ticket_drafts_delete_own ON public.support_ticket_drafts
    FOR DELETE
    USING (auth.uid() = user_id);
