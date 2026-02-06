-- ============================================================================
-- Company–Division Master: Upload company and division_abbreviations from CSV
-- Run this in Supabase SQL Editor after RUN_IN_SUPABASE.sql (companies + divisions tables exist)
-- ============================================================================
-- Result: companies table has one row per company; divisions table has one row
-- per (company_id, division_abbreviation). Support form will show only divisions
-- mapped to the selected company. "Other" is added for every company.
-- ============================================================================
--
-- *** TO DELETE PREVIOUS UPLOADED DIVISIONS (run this first when re-uploading) ***
-- This removes all division rows. Tickets that reference division_id will keep the
-- UUID but the division row will be gone (you may want to set those ticket division_id
-- to NULL if you need clean references). Companies are NOT deleted.
--
--   DELETE FROM public.divisions;
--
-- Optional: also reset companies (only if you want to re-insert companies from this script):
--   DELETE FROM public.divisions;
--   DELETE FROM public.companies;
--
-- ============================================================================

-- 1) Temp table with your CSV data (company_name, division_abbreviations)
CREATE TEMP TABLE IF NOT EXISTS company_division_csv (
  company_name TEXT,
  division_abbreviations TEXT
);

-- Clear and load (division_abbreviations: single code or comma-separated, no outer quotes in SQL)
TRUNCATE company_division_csv;
INSERT INTO company_division_csv (company_name, division_abbreviations) VALUES
('Vraj Metaliks Pvt. Ltd.', 'SID'),
('Agrawal Sponge Pvt. Ltd.', 'SID'),
('MVK Industries Pvt. Ltd.', 'PP'),
('Agroha Steel and Power Pvt. Ltd.', 'RM,SMS,CCM,RAW,SID,PP'),
('Amiya Steel Pvt. Ltd.', 'SID'),
('Indo East Corporation Pvt. Ltd.', 'FAB'),
('Sri Venkatesh Iron & Alloys (India) Ltd.', 'SID'),
('Anjanisuta Steels Pvt. Ltd.', 'FUR'),
('Balajee Mini Steels & Re Rolling Pvt. Ltd.', 'SMS,CCM,RM'),
('Balmukund Sponge Iron Pvt. Ltd.', 'SID,SMS,CCM,MBF,RLM2,SNT'),
('Brahmaputra Metallics Ltd.', 'CPP,SMS,DRI,General,Fabrication'),
('Bharat Hitech (Cements) Pvt Ltd', 'CMT'),
('Black Rock Steels Pvt Ltd', 'RM'),
('B. R Sponge & Power Ltd.', 'SID'),
('Maa Mangla Ispat Pvt. Ltd.', 'SID,PP,SMS,RM,PM'),
('Maa Shakambari Steel Ltd.', 'SID,PP,SMS,RM'),
('Maa Mangla Ispat Pvt. Ltd. (Unit.2)', 'SID'),
('GM Iron & Steel Pvt. Ltd.', 'SID,PP,CCM,SMS,RM'),
('GM Iron & Steel Company Limited Badampahar', 'MIN'),
('Crescent Foundry Co Pvt.Ltd.', 'FDY'),
('Dadiji Steels Manufacture & Trade Pvt Ltd', 'CCM,RM,SMS'),
('Niranjan Metallic Limited', 'SID'),
('Dhanbad Fuels Ltd.', 'SID,MNH'),
('Hitech Plastochem Udyog Pvt. Ltd.', 'HDP'),
('Maan Concast Pvt. Ltd.', 'CCM,SML'),
('Maan Steel & Power Ltd.', 'SID,PP,CCM,RM'),
('Mark Steels P Ltd.', 'SID,SMS'),
('Singhal Enterprises(Jharsuguda)Pvt Ltd', 'SID'),
('Coffers Metallics Pvt. Ltd.', 'SID'),
('Vraj Iron & Steels Ltd (Bilaspur)', 'SID'),
('Rashmi Sponge Iron & Power Industries Pvt. Ltd.', 'SID,SMS,CCM,PP'),
('Vraj Iron & Steels Ltd. (Siltara)', 'SID,PP,RM,SMS'),
('Gopal Sponge & Power Pvt. Ltd.', 'SID'),
('Pratishtha Polypack Pvt. Ltd.', 'HDP'),
('Shilphy Steels Pvt. Ltd.', 'SID'),
('Rausheena Udyog Ltd.', 'FDY'),
('Shakambari Overseas Trade Pvt. Ltd.', 'FDY'),
('Spintech Tubes Pvt. Ltd.', 'TM,PLT,SID,PP,SMS,COM'),
('Suprime Cement Pvt. Ltd.', 'CMT'),
('Parasnath Rolling Mills Ltd.', 'SMS,CCM,RM'),
('Govinda Polytex India Pvt. Ltd.', 'HDP'),
('Shri Varu Polytex Pvt. Ltd.', 'HDP'),
('Sky Alloys and Power Pvt Ltd', 'PP,RAW,RM,SID,SMS,CCM,FRO,DRI,Ferro'),
('Sky Steel & Power Pvt. Ltd.', 'PP,SID'),
('Ugen Ferro Alloys Pvt. Ltd.', 'FRO'),
('Surendra Mining Industries Pvt. Ltd.', 'PP,SMS,SID'),
('Vighneshwar Ispat Pvt. Ltd.', 'RLM,Furnace,CCM,Common'),
('Mangal Sponge & Steel Pvt. Ltd.', 'SID,PP,SMS,RM'),
('HSR', 'RM'),
('Maruti Ferrous Pvt Ltd', 'RM,SMS'),
('Karni Kripa Power Pvt Ltd.', 'PP,SID,SMS'),
('Ghankun Steels Pvt Ltd', 'PP,SID,SMS'),
('Sunil Ispat & Power Pvt Ltd', 'PP,SID,FRO'),
('Nutan Ispat & Power Ltd', 'SID,SMS,PP,TMT,FDY'),
('Hariom ingots and power private limited', 'CCM,RM,SMS,EPX'),
('Hi.Tech Power & Steel Ltd.', 'SID,PP,RM,SMS,FRO'),
('Jay Iron & Steels Ltd.', 'SID'),
('Plascom Industries LLP', 'HDP'),
('Flexicom Industries Pvt. Ltd.', 'HDP'),
('Salagram Power', 'SID,SMS,PP,RM,FRO'),
('Shikhara Steels Private Limited', 'SMS,RM'),
('Super Iron Foundry', 'FDY'),
('Orissa Concrete & Allied Industries Ltd', 'RS'),
('Govind Steel Co Ltd', 'CI,DI,GEN'),
('Dinesh Brothers Pvt. Ltd.', 'DI'),
('Vaswani Industries Limited', 'SID,SMS,PP'),
('Kodarma Chemical Pvt. Ltd.', 'AUTO,CHEM,GEN'),
('Kodarma Petrohemicals Pvt. Ltd.', 'Petrochemical'),
('Roopgarh Power & Alloys Ltd.', 'PP'),
('Bihar Foundry & Casting Limited', 'DRI,Power,SMS,FAD,CLU'),
('B R Refinery LLP', 'Refinery');

-- 2) Insert companies (ignore if name already exists)
INSERT INTO public.companies (name)
SELECT DISTINCT company_name FROM company_division_csv
ON CONFLICT (name) DO NOTHING;

-- 3) Insert divisions: one row per company per abbreviation (trimmed)
INSERT INTO public.divisions (company_id, name)
SELECT c.id, trim(unnest(string_to_array(cdc.division_abbreviations, ',')))
FROM company_division_csv cdc
JOIN public.companies c ON c.name = cdc.company_name
ON CONFLICT (company_id, name) DO NOTHING;

-- 4) Add "Other" division for every company (so users can choose Other and specify in division_other)
INSERT INTO public.divisions (company_id, name)
SELECT id, 'Other' FROM public.companies
ON CONFLICT (company_id, name) DO NOTHING;

-- Optional: show counts
-- SELECT (SELECT count(*) FROM public.companies) AS companies_count, (SELECT count(*) FROM public.divisions) AS divisions_count;
