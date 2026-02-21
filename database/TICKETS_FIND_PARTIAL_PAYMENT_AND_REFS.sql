-- Find tickets where these refs are MENTIONED in Description or Title
-- Output format: Old Reference | New Reference | Title
-- Run in Supabase SQL Editor

-- Reference list: CH-0058, CH-0818, CH-0964, CH-0965, BU-0104, CH-0984, CH-1070,
-- CH-1110, CH-1135, CH-1146, CH-1162, CH-1167, CH-1177, CH-1218,
-- FE-0052, FE-0053, FE-0082, FE-0103, FE-0120, FE-0123, FE-0125
-- Title: Add partial payment option

-- ============================================================
-- MAIN QUERY: Old Ref → New Ref (mentioned in Description or Title)
-- ============================================================
-- Finds tickets where description contains any old ref OR title = "Add partial payment option"
-- Output: old_reference_no | new_reference_no | title | match_type

WITH refs (old_ref) AS (
  VALUES
    ('CH-0058'), ('CH-0818'), ('CH-0964'), ('CH-0965'), ('BU-0104'), ('CH-0984'), ('CH-1070'),
    ('CH-1110'), ('CH-1135'), ('CH-1146'), ('CH-1162'), ('CH-1167'), ('CH-1177'), ('CH-1218'),
    ('FE-0052'), ('FE-0053'), ('FE-0082'), ('FE-0103'), ('FE-0120'), ('FE-0123'), ('FE-0125')
),
-- Match: description contains old_ref OR ticket has that reference_no
matches AS (
  SELECT DISTINCT ON (r.old_ref)
    r.old_ref,
    t.reference_no AS new_ref,
    t.title,
    CASE
      WHEN COALESCE(t.description, '') ILIKE '%' || r.old_ref || '%' THEN 'Description'
      ELSE 'Reference No'
    END AS match_type
  FROM refs r
  CROSS JOIN public.tickets t
  WHERE COALESCE(t.description, '') ILIKE '%' || r.old_ref || '%'
     OR t.reference_no = r.old_ref
  ORDER BY r.old_ref, t.id
),
-- Add the ticket with title "Add partial payment option"
partial_payment AS (
  SELECT 'Add partial payment option'::TEXT AS old_ref, reference_no AS new_ref, title, 'Title' AS match_type
  FROM public.tickets
  WHERE title ILIKE '%partial payment%'
  LIMIT 1
)
SELECT old_ref AS "Old Reference", new_ref AS "New Reference", title AS "Title", match_type AS "Found In"
FROM (SELECT * FROM matches UNION ALL SELECT * FROM partial_payment) u
ORDER BY old_ref;

-- ============================================================
-- 4 COLUMNS: New Reference | Title | Description | Type
-- (Use this query - exact format)
-- ============================================================

SELECT
  t.reference_no AS "New Reference",
  t.title AS "Title",
  COALESCE(t.description, '') AS "Description",
  t.type AS "Type"
FROM public.tickets t
WHERE t.reference_no IN (
  'CH-0058', 'CH-0818', 'CH-0964', 'CH-0965', 'BU-0104', 'CH-0984', 'CH-1070',
  'CH-1110', 'CH-1135', 'CH-1146', 'CH-1162', 'CH-1167', 'CH-1177', 'CH-1218',
  'FE-0052', 'FE-0053', 'FE-0082', 'FE-0103', 'FE-0120', 'FE-0123', 'FE-0125'
)
   OR COALESCE(t.description, '') ~ 'CH-0058|CH-0818|CH-0964|CH-0965|BU-0104|CH-0984|CH-1070|CH-1110|CH-1135|CH-1146|CH-1162|CH-1167|CH-1177|CH-1218|FE-0052|FE-0053|FE-0082|FE-0103|FE-0120|FE-0123|FE-0125'
   OR t.title ILIKE '%partial payment%'
ORDER BY t.reference_no;

-- ============================================================
-- REFERENCE MAPPING (from codebase - TICKETS_BULK_INSERT, etc.)
-- Use this if DB descriptions differ. Format: Old Ref → New Ref | Title
-- ============================================================
/*
| Old Reference | New Reference | Title |
|---------------|---------------|-------|
| CH-0058       | CH-0058       | Link for Quote functioning different in Whatsapp and Email(Same like FMS 13) |
| CH-0818       | CH-0818       | WO preview not showing total amount with GST |
| CH-0964       | CH-0964       | After clicking on approval it redirect user to the old UI/UX |
| CH-0965       | CH-0965       | Item tag created without approval |
| BU-0104       | BU-0104       | QC page problem |
| CH-0984       | CH-0984       | Add PO approval levels |
| CH-1070       | CH-1070       | Create indent Cost Center drop down |
| CH-1110       | CH-1110       | GRN amount and Issue amount not match |
| CH-1135       | CH-1135       | If a user attaches a file at the time of issue creation... |
| CH-1146       | CH-1146       | (check in tickets table) |
| CH-1162       | CH-1162       | (check in tickets table) |
| CH-1167       | CH-1167       | Work Order Register Problem |
| CH-1177       | CH-1177       | Here is the list of item names along with their item groups that do not have item codes |
| CH-1218       | CH-1218       | Updated GRN according the remarks column |
| FE-0052       | (in DB)       | (check - may map to another ticket) |
| FE-0053       | FE-0164       | IGST toggle should be on for outside vendors. |
| FE-0082       | FE-0178       | The user wants to add multiple items in Issue Tools on a returnable basis |
| FE-0103       | FE-0196       | Mentioned the edited element(exactly which field has been edited) |
| FE-0120       | FE-0213       | Calculate the difference in between the vendor invoice and actual GRN |
| FE-0123       | FE-0215       | Add Production in Enquiry central |
| FE-0125       | FE-0216       | "NR" Required to Add for item Stock |
| (Title)       | FE-0148       | Add partial payment option |
*/
