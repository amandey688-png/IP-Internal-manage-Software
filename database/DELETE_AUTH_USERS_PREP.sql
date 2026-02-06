-- ============================================================================
-- FMS: Prepare to delete Auth users (fix "Database error deleting user")
-- ============================================================================
-- Run this in Supabase SQL Editor BEFORE deleting users in Auth > Users.
-- It removes/rewrites references so Auth can delete the users.
--
-- IDs used (from your screenshot):
--   Keep:  Aman Dey = 342e09f7-bd46-4848-aeaa-2b4fd0e62e72
--   Delete: Akash Das = 67cb631e-9518-4f7b-afb2-7d6ee0b2cedc
--   Delete: Rimpa = e0df55fb-f7cd-4b5b-913f-85983a8c699e
-- To delete different users, change id1/id2 and set keep_id to an existing user.
-- ============================================================================

DO $$
DECLARE
  keep_id UUID := '342e09f7-bd46-4848-aeaa-2b4fd0e62e72';
  id1 UUID := '67cb631e-9518-4f7b-afb2-7d6ee0b2cedc';
  id2 UUID := 'e0df55fb-f7cd-4b5b-913f-85983a8c699e';
BEGIN
  DELETE FROM public.ticket_responses
  WHERE responded_by IN (id1, id2);

  UPDATE public.tickets
  SET created_by = keep_id
  WHERE created_by IN (id1, id2);

  UPDATE public.tickets
  SET assignee_id = NULL
  WHERE assignee_id IN (id1, id2);

  UPDATE public.solutions
  SET proposed_by = keep_id
  WHERE proposed_by IN (id1, id2);

  UPDATE public.solutions
  SET selected_by = NULL
  WHERE selected_by IN (id1, id2);

  UPDATE public.staging_deployments
  SET deployed_by = NULL
  WHERE deployed_by IN (id1, id2);
END $$;
