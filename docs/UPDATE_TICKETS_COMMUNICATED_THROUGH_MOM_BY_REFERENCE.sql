-- Set CT (communicated_through) to MOM for specific chore reference numbers.
-- Value must be lowercase 'mom' (same as the Add Support Ticket form).
-- Prerequisite: tickets_communicated_through_check must allow 'mom'
-- (see docs/SUPABASE_TICKETS_COMMUNICATED_THROUGH_ADD_MOM.sql).

UPDATE public.tickets
SET communicated_through = 'mom'
WHERE reference_no IN ('CH-0291', 'CH-0292', 'CH-0293', 'CH-0294');

-- Verify:
-- SELECT reference_no, communicated_through, title
-- FROM public.tickets
-- WHERE reference_no IN ('CH-0291', 'CH-0292', 'CH-0293', 'CH-0294');
