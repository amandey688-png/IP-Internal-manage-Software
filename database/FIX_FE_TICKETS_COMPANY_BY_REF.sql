-- ============================================================================
-- FIX Company Name: Update company_id & company_name by reference_no
-- Use when company_name was overwritten (e.g. all show "Company A")
-- Maps FE-xxxx → correct company using reference_no
-- Run in Supabase SQL Editor
-- ============================================================================

DROP TABLE IF EXISTS _fe_ref_company CASCADE;
CREATE TEMP TABLE _fe_ref_company (reference_no TEXT PRIMARY KEY, company_name TEXT, company_id UUID);

-- Map reference_no → company (from your bulk data)
INSERT INTO _fe_ref_company (reference_no, company_name, company_id) VALUES
  ('FE-0001', 'Nirmaan TMT', 'de61e340-fe65-47c9-bcd3-3b74aa37bada'),
  ('FE-0002', 'Sky Alloys and Power Pvt Ltd', '1692b219-01f5-4131-9bca-c7c284f7bf6e'),
  ('FE-0003', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0005', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0006', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0009', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0013', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0030', 'Agroha Steel and Power Pvt Ltd', '094455c2-a897-49db-9aa3-f5aeec22dca9'),
  ('FE-0033', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0037', 'MVK Industries Pvt Ltd', '38ec0f73-2b46-44b3-ab1a-0eb249c8a5bc'),
  ('FE-0042', 'Rashmi Sponge Iron & Power Industries Pvt. Limited', '56cf658a-69eb-4bf0-87dd-4cac1fea47d4'),
  ('FE-0047', 'Rausheena Udyog Limited', 'c522d18d-fc44-437a-8cf5-e1135ecb9c03'),
  ('FE-0048', 'Maanheruka', 'b97343b1-a456-49e6-8caf-020a2634fd9a'),
  ('FE-0049', 'Maanheruka', 'b97343b1-a456-49e6-8caf-020a2634fd9a'),
  ('FE-0050', 'Maanheruka', 'b97343b1-a456-49e6-8caf-020a2634fd9a'),
  ('FE-0053', 'Sky Alloys and Power Limited', '1692b219-01f5-4131-9bca-c7c284f7bf6e'),
  ('FE-0055', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0060', 'Balmukund Sponge Iron Pvt. Ltd.', '1d7b3592-4353-4172-a5c8-7087681ea5d8'),
  ('FE-0061', 'Balmukund Sponge Iron Pvt. Ltd.', '1d7b3592-4353-4172-a5c8-7087681ea5d8'),
  ('FE-0064', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0065', 'Balmukund Sponge Iron Pvt. Ltd.', '1d7b3592-4353-4172-a5c8-7087681ea5d8'),
  ('FE-0067', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0070', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0071', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0072', 'MVK Industries Pvt Ltd', '38ec0f73-2b46-44b3-ab1a-0eb249c8a5bc'),
  ('FE-0076', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0078', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0080', 'Brahmaputra Metallics Ltd.', 'd7def3ff-b59c-4925-a101-012697db0689'),
  ('FE-0081', 'Roopgarh Power & Alloys Pvt. Ltd', '51ae17c5-de50-4a79-822e-f81970d43560'),
  ('FE-0082', 'Sky Alloys and Power Limited', '1692b219-01f5-4131-9bca-c7c284f7bf6e'),
  ('FE-0083', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0084', 'Sky Alloys and Power Pvt Ltd', '1692b219-01f5-4131-9bca-c7c284f7bf6e'),
  ('FE-0085', 'Hi-Tech Power & Steel Ltd.', '3fedad0b-1aea-45c7-87bf-ebfece5778aa'),
  ('FE-0096', 'Hi-Tech Power & Steel Ltd.', '3fedad0b-1aea-45c7-87bf-ebfece5778aa'),
  ('FE-0097', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0098', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0099', 'Flexicom Industries Pvt. Ltd.', 'e1c0081a-6823-4332-a0be-d4575a2e392e'),
  ('FE-0100', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0101', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0103', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0104', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0105', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0106', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0107', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0108', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0109', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0110', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0111', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0112', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0113', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0114', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0115', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0116', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0117', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0118', 'BIHAR FOUNDRY', 'abd6873e-eb90-43e4-b861-d5f906f83d10'),
  ('FE-0119', 'KSK Engineering Industries Pvt Ltd', '8ed0b2ff-dae9-4cb1-92a1-3da33eb297da'),
  ('FE-0120', 'Bhagwati Power Pvt. Ltd.', 'b3f647a2-c757-4acd-8ef3-d6fed5a1fb55'),
  ('FE-0121', 'KSK Engineering Industries Pvt Ltd', '8ed0b2ff-dae9-4cb1-92a1-3da33eb297da'),
  ('FE-0123', 'Odissa Concrete & Allied Industries Ltd', 'ef35fcd5-51bd-489c-8926-4dd4b36a2b76'),
  ('FE-0125', 'Sky Alloys and Power Limited', '1692b219-01f5-4131-9bca-c7c284f7bf6e'),
  ('FE-0127', 'Bhagwati Power Pvt. Ltd.', 'b3f647a2-c757-4acd-8ef3-d6fed5a1fb55'),
  ('FE-0128', 'Bhagwati Power Pvt. Ltd.', 'b3f647a2-c757-4acd-8ef3-d6fed5a1fb55')
ON CONFLICT (reference_no) DO UPDATE SET company_name = EXCLUDED.company_name, company_id = EXCLUDED.company_id;

-- FE-0129 to FE-0155 (from bulk order)
INSERT INTO _fe_ref_company (reference_no, company_name, company_id) VALUES
  ('FE-0129', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0130', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0131', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0132', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0133', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0134', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0135', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0136', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0137', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0138', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0139', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0140', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0141', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0142', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0143', 'Hariom Ingots & Power Pvt. Ltd.', 'ae4bcf4f-c06e-4eeb-896f-6540e6129921'),
  ('FE-0144', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0145', 'Odissa Concrete & Allied Industries Ltd', 'ef35fcd5-51bd-489c-8926-4dd4b36a2b76'),
  ('FE-0146', 'Dadijee Steel Manufacturing & Trading Private Limited', '1cf22072-9434-45a5-bec3-3c347c5657b3'),
  ('FE-0147', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0148', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0149', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0150', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0151', 'Spintech Tubes Pvt Ltd', '22271708-2eca-48ac-9846-8e6c14a92543'),
  ('FE-0152', 'Spintech Tubes Pvt Ltd', '22271708-2eca-48ac-9846-8e6c14a92543'),
  ('FE-0153', 'Nutan Ispat & Power Pvt Ltd', '75762953-8e9c-4799-9eb7-0dcb7d0b4b7f'),
  ('FE-0154', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689'),
  ('FE-0155', 'Demo C', 'c57a07d6-1751-4601-b0e5-6dba2ab52689')
ON CONFLICT (reference_no) DO UPDATE SET company_name = EXCLUDED.company_name, company_id = EXCLUDED.company_id;

-- Update tickets by reference_no
UPDATE public.tickets t
SET
  company_id = m.company_id,
  company_name = (SELECT c.name FROM public.companies c WHERE c.id = m.company_id LIMIT 1)
FROM _fe_ref_company m
WHERE t.reference_no = m.reference_no
  AND t.type = 'feature';

-- Fallback: FE tickets not in map → Demo C (adjust manually if needed)
UPDATE public.tickets t
SET company_id = 'c57a07d6-1751-4601-b0e5-6dba2ab52689'::UUID,
    company_name = 'Demo C'
WHERE t.type = 'feature'
  AND t.reference_no ~ '^FE-[0-9]+$'
  AND t.reference_no NOT IN (SELECT reference_no FROM _fe_ref_company);

DROP TABLE IF EXISTS _fe_ref_company;
