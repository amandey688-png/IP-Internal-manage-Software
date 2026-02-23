-- Stage 2 Remarks for Chores & Bugs tickets
-- All users can add and view remarks. Only Master Admin or the remark author can edit.

CREATE TABLE IF NOT EXISTS public.ticket_stage2_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    remark_text TEXT NOT NULL,
    added_by UUID NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_stage2_remarks_ticket_id ON public.ticket_stage2_remarks(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_stage2_remarks_added_by ON public.ticket_stage2_remarks(added_by);
CREATE INDEX IF NOT EXISTS idx_ticket_stage2_remarks_added_at ON public.ticket_stage2_remarks(added_at);

COMMENT ON TABLE public.ticket_stage2_remarks IS 'Stage 2 Work Progress remarks. All users add/view; only Master Admin or author can edit.';
