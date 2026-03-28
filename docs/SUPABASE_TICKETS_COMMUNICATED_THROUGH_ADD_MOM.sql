-- Fix: "violates check constraint tickets_communicated_through_check" when CT = MOM
-- Run once in Supabase SQL Editor (or psql) against your project database.
--
-- The app stores CT as: phone | mail | whatsapp | mom (lowercase value 'mom').
-- Your table likely has a CHECK that only listed the first three values.

-- Optional: see the current rule before changing
-- SELECT pg_get_constraintdef(c.oid)
-- FROM pg_constraint c
-- JOIN pg_class t ON c.conrelid = t.oid
-- WHERE t.relname = 'tickets' AND c.conname = 'tickets_communicated_through_check';

ALTER TABLE public.tickets
  DROP CONSTRAINT IF EXISTS tickets_communicated_through_check;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_communicated_through_check
  CHECK (
    communicated_through IS NULL
    OR communicated_through IN ('phone', 'mail', 'whatsapp', 'mom')
  );
