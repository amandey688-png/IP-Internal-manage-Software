-- ============================================================================
-- SUPPORT_TICKETS MIGRATION – Sample and bulk insert from uploaded dataset
-- ============================================================================
-- Prerequisite: Run SUPPORT_TICKETS_TABLE.sql first.
--
-- Data rules:
-- - Include only rows where your "Status" column (or "Stage 1 - Status") = 'Pending'.
-- - created_at = exact timestamp from file (e.g. "Query Arrival Date & Time" or "Timestamp").
-- - old_reference_no = original "Reference No" from file (e.g. CH-0001, BU-0001).
-- - description = include title/description + "Original Ref: <old_reference_no>".
-- - response_source = 'upload' for this dataset; use 'response' for future app-created tickets.
-- ============================================================================

-- Option A: Set sequence to start after the highest reference you will insert manually (e.g. after bulk load).
-- Run this only if you first insert rows with explicit reference_no (e.g. CH-001 .. CH-100), then use sequence for new rows.
-- SELECT setval('public.support_tickets_ref_seq', 1240);  -- example: next ref will be CH-1241

-- Option B: Let trigger auto-generate reference_no (CH-001, CH-002, ...) by inserting with reference_no = NULL.
-- Insert in a fixed order (e.g. ORDER BY created_at) so numbering is consistent.

-- ---------------------------------------------------------------------------
-- Sample INSERT (3 rows) – map your column names to support_tickets columns
-- ---------------------------------------------------------------------------
-- Your file columns (example): Timestamp, Title, Description, Reference No, Planned, Actual, Status, Stage 1 - Status, ...
-- Filter: use only rows where "Stage 1 - Status" = 'Pending' (or whichever column you use as "Column X").

INSERT INTO public.support_tickets (
  reference_no,
  old_reference_no,
  description,
  stage,
  status,
  created_at,
  planned_resolution_date,
  actual_resolution_date,
  response_source,
  title,
  type_of_request,
  company_name,
  submitted_by
) VALUES
-- Row 1: CH-0001 from your file (trigger will set reference_no if you omit it or pass NULL)
(
  NULL,  -- trigger generates CH-001
  'BU-0001',
  'Showing POP Up to select Item, when already selected. In Pending PO GRN when one item is already selected... Original Ref: BU-0001',
  'Pending',
  'Pending',
  '2024-11-08 14:48:07+00',  -- use exact timestamp from file
  '2024-11-08',              -- Planned (date part)
  NULL,                      -- Actual when still Pending
  'upload',
  'Showing POP Up to select Item, when already selected',
  'Bugs',
  'Demo_c',
  'Shreyasi'
),
(
  NULL,
  'CH-0001',
  'Attachment file not cancel by single click. When we attached one file on creating Indent... Original Ref: CH-0001',
  'Pending',
  'Pending',
  '2024-11-09 14:53:05+00',
  '2024-11-09',
  NULL,
  'upload',
  'Attachment file not cancel by single click',
  'Chores',
  'Demo_c',
  'Rimpa'
),
(
  NULL,
  'CH-1239',
  'In Stock Adjustment, the "Rate" field should be mandatory only for Bhagwati. Original Ref: CH-1239',
  'Pending',
  'Pending',
  '2026-02-16 16:33:50+00',
  '2026-02-17',
  NULL,
  'upload',
  'In Stock Adjustment, the "Rate" field should be mandatory only for Bhagwati',
  'Chores',
  'Bhagwati Power Pvt. Ltd.',
  'Rimpa'
);

-- ---------------------------------------------------------------------------
-- Bulk migration pattern (pseudo-SQL – run from your app or script)
-- ---------------------------------------------------------------------------
-- 1. Read only rows WHERE "Stage 1 - Status" = 'Pending' (or your Column X = 'Pending').
-- 2. For each row:
--
-- INSERT INTO public.support_tickets (
--   old_reference_no,
--   description,
--   stage,
--   status,
--   created_at,
--   planned_resolution_date,
--   actual_resolution_date,
--   response_source,
--   title,
--   type_of_request,
--   page,
--   company_name,
--   submitted_by,
--   query_arrival_at,
--   query_response_at,
--   reply_status
-- ) VALUES (
--   '<Reference No from file>',
--   '<Title> ' || COALESCE('<Description>', '') || ' Original Ref: <Reference No>',
--   CASE WHEN '<Status or Stage>' = 'Pending' THEN 'Pending' ELSE 'Resolved' END,
--   COALESCE(NULLIF(TRIM('<Status column>'), ''), 'Pending'),
--   '<Timestamp>'::TIMESTAMPTZ,
--   '<Planned>'::DATE,
--   NULLIF('<Actual>', '')::DATE,
--   'upload',
--   '<Title>',
--   '<Type of request>',
--   '<Page>',
--   '<Company Name>',
--   '<Submitted By>',
--   '<Query Arrival Date & Time>'::TIMESTAMPTZ,
--   '<Query Response Date & Time>'::TIMESTAMPTZ,
--   '<Reply Status>'
-- );
--
-- 3. reference_no is left NULL so the trigger assigns CH-001, CH-002, ... in insert order.
-- 4. delay_days is set by trigger from status, planned_resolution_date, actual_resolution_date.

-- ---------------------------------------------------------------------------
-- After bulk upload: set sequence so future app tickets continue after max ref
-- ---------------------------------------------------------------------------
-- Run once after all uploaded rows are inserted:
--
-- SELECT setval(
--   'public.support_tickets_ref_seq',
--   COALESCE((
--     SELECT MAX(SUBSTRING(reference_no FROM '[0-9]+')::INTEGER)
--     FROM public.support_tickets
--     WHERE reference_no ~ '^CH-[0-9]+$'
--   ), 0) + 1
-- );
