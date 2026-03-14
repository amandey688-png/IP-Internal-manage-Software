-- ============================================================================
-- FIX Feature tickets: set company_id, page_id, division_id for visibility
-- Maps: Company Name → company_id, Page → page_id, Division → division_id
-- Sets approval_status = NULL so all features appear in Approval Status
-- Run in Supabase SQL Editor
-- ============================================================================

-- Temp mapping: bulk Company Name → company_id (handles Demo_c, Nutan Ispat, etc.)
DROP TABLE IF EXISTS _fe_company_map CASCADE;
CREATE TEMP TABLE _fe_company_map (bulk_name TEXT PRIMARY KEY, company_id UUID);

INSERT INTO _fe_company_map (bulk_name, company_id) VALUES
  ('Demo_c', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('Hariom Ingots & Power Pvt. Ltd.', 'ae4bcf4f-c06e-4eeb-896f-6540e6129921'),
  ('Odissa Concrete & Allied Industries Ltd', 'ef35fcd5-51bd-489c-8926-4dd4b36a2b76'),
  ('Orissa Concrete & Allied Industries Ltd', 'ef35fcd5-51bd-489c-8926-4dd4b36a2b76'),
  ('Dadijee Steel Manufacturing & Trading Private Limited', '1cf22072-9434-45a5-bec3-3c347c5657b3'),
  ('Dadijee Steel Manufacturing & Trading Pvt. Ltd.', '1cf22072-9434-45a5-bec3-3c347c5657b3'),
  ('Spintech Tubes Pvt Ltd', '22271708-2eca-48ac-9846-8e6c14a92543'),
  ('MVK Industries Pvt Ltd', '38ec0f73-2b46-44b3-ab1a-0eb249c8a5bc'),
  ('Agroha Steel and Power Pvt Ltd', '094455c2-a897-49db-9aa3-f5aeec22dca9'),
  ('Rashmi Sponge Iron & Power Industries Pvt. Limited', '56cf658a-69eb-4bf0-87dd-4cac1fea47d4'),
  ('Rausheena Udyog Limited', 'c522d18d-fc44-437a-8cf5-e1135ecb9c03'),
  ('Maanheruka', 'b97343b1-a456-49e6-8caf-020a2634fd9a'),
  ('Sky Alloys and Power Limited', '1692b219-01f5-4131-9bca-c7c284f7bf6e'),
  ('Balmukund Sponge Iron Pvt. Ltd.', '1d7b3592-4353-4172-a5c8-7087681ea5d8'),
  ('Roopgarh Power & Alloys Pvt. Ltd', '51ae17c5-de50-4a79-822e-f81970d43560'),
  ('Brahmaputra Metallics Ltd.', 'd7def3ff-b59c-4925-a101-012697db0689'),
  ('Hi-Tech Power & Steel Ltd.', '3fedad0b-1aea-45c7-87bf-ebfece5778aa'),
  ('BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('Flexicom Industries Pvt. Ltd.', 'e1c0081a-6823-4332-a0be-d4575a2e392e'),
  ('KSK Engineering Industries Pvt Ltd', '8ed0b2ff-dae9-4cb1-92a1-3da33eb297da'),
  ('Bhagwati Power Pvt. Ltd.', 'b3f647a2-c757-4acd-8ef3-d6fed5a1fb55'),
  ('Hi-Tech', '3fedad0b-1aea-45c7-87bf-ebfece5778aa'),
  ('Nirmaan TMT', 'de61e340-fe65-47c9-bcd3-3b74aa37bada'),
  ('Sky Alloys and Power Pvt Ltd', '1692b219-01f5-4131-9bca-c7c284f7bf6e')
ON CONFLICT (bulk_name) DO NOTHING;

-- Update tickets: company_id from map or companies table
UPDATE public.tickets t
SET
  company_id = COALESCE(
    (SELECT m.company_id FROM _fe_company_map m WHERE TRIM(m.bulk_name) = TRIM(t.company_name) LIMIT 1),
    (SELECT c.id FROM public.companies c WHERE TRIM(c.name) = TRIM(t.company_name) LIMIT 1),
    t.company_id
  )
WHERE t.type = 'feature';

-- Update company_name from companies (canonical name)
UPDATE public.tickets t
SET company_name = (SELECT c.name FROM public.companies c WHERE c.id = t.company_id LIMIT 1)
WHERE t.type = 'feature' AND t.company_id IS NOT NULL;

-- Page name mapping (bulk names → pages.name)
DROP TABLE IF EXISTS _fe_page_map CASCADE;
CREATE TEMP TABLE _fe_page_map (bulk_name TEXT PRIMARY KEY, page_name TEXT);
INSERT INTO _fe_page_map (bulk_name, page_name) VALUES
  ('Non returnable gate pass', 'Non-returnable Gate Pass'),
  ('Pending Po (GRN)', 'Pending PO (GRN)'),
  ('Quotation Comparision', 'Quotation Comparison'),
  ('GRNs to Approve', 'GRN Approval'),
  ('Physical Stocks to Approve', 'Physical stocks to approve'),
  ('Issue Tools on Returnable Basis', 'Issue Tools on Returnable Basis')
ON CONFLICT (bulk_name) DO NOTHING;

-- Update page_id from pages (use map first, then direct match)
UPDATE public.tickets t
SET page_id = (
  SELECT p.id FROM public.pages p
  WHERE TRIM(p.name) = TRIM(COALESCE(
    (SELECT m.page_name FROM _fe_page_map m WHERE TRIM(m.bulk_name) = TRIM(t.page) LIMIT 1),
    t.page
  ))
  LIMIT 1
)
WHERE t.type = 'feature' AND t.page IS NOT NULL;

DROP TABLE IF EXISTS _fe_page_map;

-- Update division_id (division belongs to company)
UPDATE public.tickets t
SET division_id = (
  SELECT d.id FROM public.divisions d
  WHERE d.company_id = t.company_id
    AND TRIM(d.name) = TRIM(COALESCE(NULLIF(TRIM(t.division), ''), 'All'))
  LIMIT 1
)
WHERE t.type = 'feature' AND t.company_id IS NOT NULL;

-- Fallback: tickets with no company match → Demo C
UPDATE public.tickets
SET company_id = 'c57a07d6-1751-4601-b0e5-6dba2ab52689',
    company_name = 'Demo C'
WHERE type = 'feature' AND company_id IS NULL;

-- Make all feature tickets visible in Approval Status
UPDATE public.tickets
SET approval_status = NULL
WHERE type = 'feature';

DROP TABLE IF EXISTS _fe_company_map;
