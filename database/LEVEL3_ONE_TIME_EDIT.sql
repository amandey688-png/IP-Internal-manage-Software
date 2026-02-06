-- Level 3 (role=user) one-time status edit: after first edit, ticket is view-only for that user
-- except Stage 2 in Chores & Bugs and Stage 1 in Feature (which stay editable).
-- This table records which Level 3 users have used their one-time edit on which tickets.

CREATE TABLE IF NOT EXISTS public.ticket_level3_edit_used (
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (ticket_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_level3_edit_used_user ON public.ticket_level3_edit_used(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_level3_edit_used_ticket ON public.ticket_level3_edit_used(ticket_id);

COMMENT ON TABLE public.ticket_level3_edit_used IS 'Records that a Level 3 (user role) has used their one-time status edit on this ticket; drawer then shows view-only except Stage 2 (Chores&Bugs) and Stage 1 (Feature).';
