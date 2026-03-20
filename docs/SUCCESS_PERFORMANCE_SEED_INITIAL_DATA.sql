-- =============================================================================
-- Success / Performance Monitoring – INITIAL 49 POC rows (deduped by company name)
-- Reference: SUCC-0001 … SUCC-0049 (fixed in seed; new API rows use same pattern)
-- =============================================================================
-- BEFORE RUN:
--   • public.companies: names must match EXACTLY (trimmed) or fix VALUES below
--   • Table public.performance_monitoring exists (SUCCESS_PERFORMANCE_MONITORING.sql)
--   • reference_no is UNIQUE globally
-- =============================================================================
-- Dedup: if two rows share the same trimmed company name, keeps the lowest SL No.
-- =============================================================================

-- Optional: align DB function (if you use triggers / raw SQL inserts) with app logic
CREATE OR REPLACE FUNCTION public.generate_performance_reference(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference_no FROM LENGTH('SUCC-') + 1) AS INT)
  ), 0) + 1
  INTO next_num
  FROM public.performance_monitoring
  WHERE reference_no ~* '^SUCC-[0-9]+$';

  RETURN 'SUCC-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  r       RECORD;
  cid     UUID;
  ref_no  TEXT;
  n       INT;  -- next SUCC number (contiguous for rows actually inserted)
BEGIN
  SELECT COALESCE(MAX(
    CAST(regexp_replace(reference_no, '^SUCC-', '') AS INT)
  ), 0)
  INTO n
  FROM public.performance_monitoring
  WHERE reference_no ~* '^SUCC-[0-9]+$';

  FOR r IN
    WITH raw(sl_no, company_name, contact) AS (
      VALUES
        (1,  'Govinda Polytex India Private Limited',               '8178295688'),
        (2,  'Shri Varu Polytex Pvt Ltd',                           '8178295688'),
        (3,  'M/s. Singhal Enterprises (Jharsuguda) Pvt. Ltd',      '9174581273'),
        (4,  'Shikhara Steels Private Limited',                      '9160488227'),
        (5,  'Hi-Tech Power & Steel Ltd.',                          '8770798713'),
        (6,  'MVK Industries Pvt Ltd',                              '7024225560'),
        (7,  'Agrawal Sponge Pvt Ltd',                              '7024225560'),
        (8,  'Vraj Metaliks Pvt. Ltd.',                             '7024225560'),
        (9,  'Salagram Power & Steel Pvt Ltd',                      '9748484455'),
        (10, 'Bharat Hi-Tech (Cements) Pvt. Ltd',                   '9064413340'),
        (11, 'Ugen Ferro Alloys Pvt. Ltd.',                         '9593820619'),
        (12, 'Agroha Steel and Power Pvt Ltd',                      '8817859070'),
        (13, 'Rausheena Udyog Limited',                             '6295995176'),
        (14, 'Surendra Mining Industries Pvt. Ltd.',                '7978993391'),
        (15, 'Hariom Ingots & Power Pvt. Ltd.',                     '9300479903'),
        (16, 'Hariom Coatings Pvt. Ltd.',                           '9300479903'),
        (17, 'Balmukund Sponge & Iron Pvt Ltd',                     '7739315375'),
        (18, 'M/s Balajee Mini Steels & Re Rolling Pvt Ltd',        '7739315375'),
        (19, 'Dadijee Steel',                                       '9924893989'),
        (20, 'Niranjan Metallic Limited',                           '9924893989'),
        (21, 'Sky Alloys and Power Pvt Ltd',                        '9007309032'),
        (22, 'Sky Steel & Power Pvt Ltd',                           '7024330099'),
        (23, 'Super Iron Foundry Ltd',                              '7602570787'),
        (24, 'Govind Steel Co Ltd',                                 '9339765824'),
        (25, 'Dinesh Brothers Pvt. Ltd.',                           '9007047240'),
        (26, 'Maa Mangla Ispat Pvt. Ltd',                           '7077702104'),
        (27, 'M/s. Maa Mangla Ispat Pvt Ltd (UNIT-2)',              '7077702104'),
        (28, 'Maa Shakambari Steel Ltd.',                           '7077702104'),
        (29, 'B.R.Sponge & Power Ltd.',                             '7077702104'),
        (30, 'Vighneshwar Ispat Pvt.Ltd',                           '6266501567'),
        (31, 'BlackRock Steel & Power Pvt. Ltd',                    '9039012622'),
        (32, 'Jay Iron And Steels Limited',                        '9583239544'),
        (33, 'Pratishtha Polypack Private Limited',                 '8479998798'),
        (34, 'Plascom Industries LLP',                              '9903247793'),
        (35, 'Flexicom Industries Pvt. Ltd.',                      '9903247793'),
        (36, 'Orissa Concrete & Allied Industries Ltd',             '9770628746, 9340765324'),
        (37, 'Indo East Corporation Private Limited',               '9903446042, 9830025633'),
        (38, 'Dhanbad Fuels Private Limited',                       '9903923045, 9903923062'),
        (39, 'Maan Steel & Power Limited',                          '9903923045, 9903923062'),
        (40, 'Maan Concast Private Limited',                        '9903923045, 9903923062'),
        (41, 'Hitech Plastochem Udyog Pvt Ltd',                     '9903923045, 9903923062'),
        (42, 'Mangal Sponge and Steel Pvt. Ltd.',                   '6260234039'),
        (43, 'Coffers Metallics Private Limited',                   '9406080543'),
        (44, 'Roopgarh Power & Alloys Pvt. Ltd.',                   '9109199338'),
        (45, 'Sri Venkatesh Iron',                                  '7070002736'),
        (46, 'Anjanisuta Steels Private Limited',                  '7070002736'),
        (47, 'Orissa Concrete & Allied Industries Ltd(New)',       '9131746226'),
        (48, 'Kodarma Chemical Pvt. Ltd.',                         '9348728262'),
        (49, 'Brahmaputra Metallics Ltd.',                          '7739315375')
    ),
    dedup AS (
      SELECT DISTINCT ON (trim(lower(company_name)))
        sl_no,
        trim(company_name) AS company_name,
        trim(contact) AS contact
      FROM raw
      ORDER BY trim(lower(company_name)), sl_no
    ),
    numbered AS (
      SELECT
        company_name,
        contact,
        ROW_NUMBER() OVER (ORDER BY sl_no)::INT AS seq
      FROM dedup
    )
    SELECT * FROM numbered ORDER BY seq
  LOOP
    SELECT c.id INTO cid
    FROM public.companies c
    WHERE trim(c.name) = trim(r.company_name)
    LIMIT 1;

    IF cid IS NULL THEN
      RAISE NOTICE 'SKIP (no company): % | ref %', r.company_name, ref_no;
      CONTINUE;
    END IF;

    LOOP
      n := n + 1;
      ref_no := 'SUCC-' || LPAD(n::TEXT, 4, '0');
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.performance_monitoring pm WHERE pm.reference_no = ref_no
      );
    END LOOP;

    INSERT INTO public.performance_monitoring (
      company_id,
      message_owner,
      response,
      contact,
      reference_no,
      completion_status,
      created_by,
      created_at
    ) VALUES (
      cid,
      'yes',
      '',
      r.contact,
      ref_no,
      'in_progress',
      NULL,
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'Success seed finished. Last SUCC number used: %', n;
END $$;

-- List view (should show SUCC-0001 … after seed)
-- SELECT reference_no, contact, completion_status, company_id
-- FROM public.performance_monitoring
-- WHERE reference_no LIKE 'SUCC-%'
-- ORDER BY reference_no;
