-- =============================================================================
-- Invoice company master — Add / Edit Invoice "Company Name" dropdown
-- Run in Supabase SQL Editor (safe to re-run).
-- Requires: public.companies (id uuid, name text UNIQUE)
-- Backend: GET /companies/for-invoice
-- =============================================================================

INSERT INTO public.companies (name)
SELECT trim(v)
FROM (
  VALUES
    ('Agroha Steel and Power Pvt. Ltd.'),
    ('Amiya Steel Pvt. Ltd.'),
    ('Anjanisuta Steels Private Limited'),
    ('B R Refinery LLP'),
    ('B. R Sponge & Power Ltd.'),
    ('Balajee Mini Steels & Re Rolling Pvt. Ltd.'),
    ('Balmukund Cement & Roofing (P) Ltd.'),
    ('Balmukund Sponge Iron Pvt. Ltd.'),
    ('Bharat Hitech (Cements) Pvt Ltd'),
    ('Bihar Foundry & Casting Limited'),
    ('Black Rock Steel & Power Pvt Ltd'),
    ('Brahmaputra Metallics Ltd.'),
    ('Coffers Metallics Pvt. Ltd.'),
    ('Crescent Foundry Co Pvt.Ltd.'),
    ('Dadiji Steel Manufacture & Trading Pvt Ltd'),
    ('Dhanbad Fuels Ltd.'),
    ('Dinesh Brothers Pvt. Ltd.'),
    ('Ferro Metals'),
    ('Flexicom Industries Pvt. Ltd.'),
    ('GM Iron & Steel Pvt. Ltd.'),
    ('GM Iron & Steels Ltd. Badampahar'),
    ('Gopal Sponge & Power Pvt. Ltd.'),
    ('Govind Steel Co. Ltd.'),
    ('Govinda Polytex India Pvt. Ltd.'),
    ('Hariom Ingots & Power Pvt. Ltd.'),
    ('Hi-Tech Power & Steel Ltd.'),
    ('Hitech Plastochem Udyog Pvt. Ltd.'),
    ('Indo East Corporation Pvt. Ltd.'),
    ('Jay Iron & Steels Ltd.'),
    ('Karni Kripa Power Pvt Ltd'),
    ('Kedia Carbon Pvt. Ltd.'),
    ('Kodarma Chemical Pvt. Ltd.'),
    ('Kodarma Petrochemicals Pvt. Ltd.'),
    ('Maa Mangla Ispat Pvt. Ltd 2'),
    ('Maa Mangla Ispat Pvt. Ltd.'),
    ('Maa Shakambari Steel Ltd.'),
    ('Maan Concast Pvt. Ltd.'),
    ('Maan Steel & Power Ltd.'),
    ('Mangal Sponge & Steel Pvt. Ltd.'),
    ('Mark Steels P Ltd.'),
    ('Maruti Ferrous Private Limited'),
    ('MVK Industries Pvt. Ltd.'),
    ('Niranjan Metalliks Ltd.'),
    ('Nutan Ispat & Power Ltd'),
    ('Odissa Concrete & Allied Industries Limited'),
    ('Orissa Concrete & Allied Industries Ltd. (Raipur)'),
    ('Plascom Industries LLP'),
    ('Pratishtha Polypack Pvt. Ltd.'),
    ('Rashmi Sponge Iron & Power Industries Pvt. Ltd.'),
    ('Rausheena Udyog Ltd.'),
    ('Roopgarh Power & Alloys Pvt. Ltd.'),
    ('Salagram Power & Steels Ltd.'),
    ('Shakambari Overseas Trade Pvt. Ltd.'),
    ('Shikhara Steels Pvt. Ltd.'),
    ('Shilphy Steels Pvt. Ltd.'),
    ('Shree Parashnath Re-Roolling Mills Ltd.'),
    ('Shri Varu Polytex Pvt. Ltd.'),
    ('Singhal Enterprises(Jharsuguda)Pvt Ltd'),
    ('Sky Alloys and Power Pvt Ltd'),
    ('Sky Steel & Power Pvt. Ltd'),
    ('Spintech Tubes Pvt. Ltd.'),
    ('Sri Venkatesh Iron & Alloys (India) Ltd.'),
    ('Super Iron Foundry'),
    ('Suprime Cement Pvt. Ltd.'),
    ('Surendra Mining Industries Pvt. Ltd.'),
    ('Ugen Ferro Alloys Pvt. Ltd.'),
    ('Utkal Hydrocarbon Pvt. Ltd.'),
    ('Vaswani Industries Limited'),
    ('Vighneshwar Ispat Pvt. Ltd.'),
    ('Vraj Iron & Steels Ltd. (Siltara Div)'),
    ('Vraj Iron & Steels Ltd. Bilaspur'),
    ('Vraj Metaliks Pvt. Ltd.')
) AS t(v)
WHERE trim(v) <> ''
ON CONFLICT (name) DO NOTHING;

-- Preview: each master name should match a companies row (normalized)
WITH master AS (
  SELECT trim(v) AS expected_name
  FROM (
    VALUES
      ('Agroha Steel and Power Pvt. Ltd.'),
      ('Amiya Steel Pvt. Ltd.'),
      ('Anjanisuta Steels Private Limited'),
      ('B R Refinery LLP'),
      ('B. R Sponge & Power Ltd.'),
      ('Balajee Mini Steels & Re Rolling Pvt. Ltd.'),
      ('Balmukund Cement & Roofing (P) Ltd.'),
      ('Balmukund Sponge Iron Pvt. Ltd.'),
      ('Bharat Hitech (Cements) Pvt Ltd'),
      ('Bihar Foundry & Casting Limited'),
      ('Black Rock Steel & Power Pvt Ltd'),
      ('Brahmaputra Metallics Ltd.'),
      ('Coffers Metallics Pvt. Ltd.'),
      ('Crescent Foundry Co Pvt.Ltd.'),
      ('Dadiji Steel Manufacture & Trading Pvt Ltd'),
      ('Dhanbad Fuels Ltd.'),
      ('Dinesh Brothers Pvt. Ltd.'),
      ('Ferro Metals'),
      ('Flexicom Industries Pvt. Ltd.'),
      ('GM Iron & Steel Pvt. Ltd.'),
      ('GM Iron & Steels Ltd. Badampahar'),
      ('Gopal Sponge & Power Pvt. Ltd.'),
      ('Govind Steel Co. Ltd.'),
      ('Govinda Polytex India Pvt. Ltd.'),
      ('Hariom Ingots & Power Pvt. Ltd.'),
      ('Hi-Tech Power & Steel Ltd.'),
      ('Hitech Plastochem Udyog Pvt. Ltd.'),
      ('Indo East Corporation Pvt. Ltd.'),
      ('Jay Iron & Steels Ltd.'),
      ('Karni Kripa Power Pvt Ltd'),
      ('Kedia Carbon Pvt. Ltd.'),
      ('Kodarma Chemical Pvt. Ltd.'),
      ('Kodarma Petrochemicals Pvt. Ltd.'),
      ('Maa Mangla Ispat Pvt. Ltd 2'),
      ('Maa Mangla Ispat Pvt. Ltd.'),
      ('Maa Shakambari Steel Ltd.'),
      ('Maan Concast Pvt. Ltd.'),
      ('Maan Steel & Power Ltd.'),
      ('Mangal Sponge & Steel Pvt. Ltd.'),
      ('Mark Steels P Ltd.'),
      ('Maruti Ferrous Private Limited'),
      ('MVK Industries Pvt. Ltd.'),
      ('Niranjan Metalliks Ltd.'),
      ('Nutan Ispat & Power Ltd'),
      ('Odissa Concrete & Allied Industries Limited'),
      ('Orissa Concrete & Allied Industries Ltd. (Raipur)'),
      ('Plascom Industries LLP'),
      ('Pratishtha Polypack Pvt. Ltd.'),
      ('Rashmi Sponge Iron & Power Industries Pvt. Ltd.'),
      ('Rausheena Udyog Ltd.'),
      ('Roopgarh Power & Alloys Pvt. Ltd.'),
      ('Salagram Power & Steels Ltd.'),
      ('Shakambari Overseas Trade Pvt. Ltd.'),
      ('Shikhara Steels Pvt. Ltd.'),
      ('Shilphy Steels Pvt. Ltd.'),
      ('Shree Parashnath Re-Roolling Mills Ltd.'),
      ('Shri Varu Polytex Pvt. Ltd.'),
      ('Singhal Enterprises(Jharsuguda)Pvt Ltd'),
      ('Sky Alloys and Power Pvt Ltd'),
      ('Sky Steel & Power Pvt. Ltd'),
      ('Spintech Tubes Pvt. Ltd.'),
      ('Sri Venkatesh Iron & Alloys (India) Ltd.'),
      ('Super Iron Foundry'),
      ('Suprime Cement Pvt. Ltd.'),
      ('Surendra Mining Industries Pvt. Ltd.'),
      ('Ugen Ferro Alloys Pvt. Ltd.'),
      ('Utkal Hydrocarbon Pvt. Ltd.'),
      ('Vaswani Industries Limited'),
      ('Vighneshwar Ispat Pvt. Ltd.'),
      ('Vraj Iron & Steels Ltd. (Siltara Div)'),
      ('Vraj Iron & Steels Ltd. Bilaspur'),
      ('Vraj Metaliks Pvt. Ltd.')
  ) AS t(v)
),
norm AS (
  SELECT
    expected_name,
    lower(
      trim(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(coalesce(expected_name, ''), '[-–—]', ' ', 'g'),
              '[()\[\]{}]', ' ',
              'g'
            ),
            '[.,]', ' ',
            'g'
          ),
          '\s+',
          ' ',
          'g'
        )
      )
    ) AS nk
  FROM master
)
SELECT
  m.expected_name,
  c.id AS company_id,
  c.name AS matched_in_db,
  CASE WHEN c.id IS NULL THEN 'MISSING — check spelling or alias' ELSE 'ok' END AS status
FROM norm m
LEFT JOIN LATERAL (
  SELECT id, name
  FROM public.companies c
  WHERE lower(
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(coalesce(c.name, ''), '[-–—]', ' ', 'g'),
            '[()\[\]{}]', ' ',
            'g'
          ),
          '[.,]', ' ',
          'g'
        ),
        '\s+',
        ' ',
        'g'
      )
    )
  ) = m.nk
  LIMIT 1
) c ON true
ORDER BY m.expected_name;
