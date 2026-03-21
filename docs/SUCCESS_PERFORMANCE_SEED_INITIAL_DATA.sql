-- =============================================================================
-- Success / Performance Monitoring – FULL SEED (49 POC + Training + Features)
-- Company names aligned with “Training” sheet (Call POC / Message POC / etc.)
-- Reference: SUCC-0001 = Govinda (oldest) … SUCC-0049 = last row (newest on top in UI)
-- =============================================================================
-- BEFORE RUN:
--   • Tables: performance_monitoring, performance_training, ticket_features, feature_list, companies
--   • reference_no UNIQUE; performance_training UNIQUE(performance_id)
--   • feature_list must contain standard names (Indent, Gate Pass, Issue, …)
-- =============================================================================
-- If the UI only showed ~14 rows:
--   1) Backend used to filter completion_status=in_progress and EXCLUDED rows where status was NULL
--      (fixed in app: NULL is treated as active). Or run: UPDATE performance_monitoring SET
--      completion_status = 'in_progress' WHERE completion_status IS NULL;
--   2) Only 14 companies existed in public.companies — PART 0 below creates missing names first.
-- =============================================================================
-- PART 0: Ensure all 49 company names exist (so PART 1 never SKIPs for “no company”)
-- PART 1: performance_monitoring rows
-- PART 2: performance_training + ticket_features (matched by company name)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_performance_reference(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference_no FROM 6) AS INT)
  ), 0) + 1
  INTO next_num
  FROM public.performance_monitoring
  WHERE reference_no ~* '^SUCC-[0-9]+$'
    AND LENGTH(reference_no) > 5;

  RETURN 'SUCC-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- PART 0: Insert missing companies (no UNIQUE on name required; uses NOT EXISTS)
-- Uses (name) only — works when companies has no is_active column (your production schema).
-- -----------------------------------------------------------------------------
INSERT INTO public.companies (name)
SELECT x.nm
FROM (
  VALUES
    ('Govinda Polytex India Private Limited'),
    ('Shri Varu Polytex Pvt Ltd'),
    ('M/s. Singhal Enterprises (Jharsuguda) Pvt. Ltd'),
    ('Shikhara Steels Private Limited'),
    ('Hi-Tech Power & Steel Ltd.'),
    ('MVK Industries Pvt Ltd'),
    ('Agrawal Sponge Pvt Ltd'),
    ('Vraj Metaliks Pvt. Ltd.'),
    ('Salagram Power & Steel Pvt Ltd'),
    ('Bharat Hi-Tech (Cements) Pvt. Ltd'),
    ('Ugen Ferro Alloys Pvt. Ltd.'),
    ('Agroha Steel and Power Pvt Ltd'),
    ('Rausheena Udyog Limited'),
    ('Surendra Mining Industries Pvt. Ltd.'),
    ('Hariom Ingots & Power Pvt. Ltd.'),
    ('Hariom Coatings Pvt. Ltd.'),
    ('Balmukund Sponge & Iron Pvt Ltd'),
    ('M/s Balajee Mini Steels & Re Rolling Pvt Ltd'),
    ('Dadijee Steel'),
    ('Niranjan Metallic Limited'),
    ('Sky Alloys and Power Pvt Ltd'),
    ('Sky Steel & Power Pvt Ltd'),
    ('Super Iron Foundry Ltd'),
    ('Govind Steel Co Ltd'),
    ('Dinesh Brothers Pvt. Ltd.'),
    ('Maa Mangla Ispat Pvt. Ltd'),
    ('M/s. Maa Mangla Ispat Pvt Ltd (UNIT-2)'),
    ('Maa Shakambari Steel Ltd.'),
    ('B.R.Sponge & Power Ltd.'),
    ('Vighneshwar Ispat Pvt.Ltd'),
    ('BlackRock Steel & Power Pvt. Ltd'),
    ('Jay Iron And Steels Limited'),
    ('Pratishtha Polypack Private Limited'),
    ('Plascom Industries LLP'),
    ('Flexicom Industries Pvt. Ltd.'),
    ('Orissa Concrete & Allied Industries Ltd'),
    ('Indo East Corporation Private Limited'),
    ('Dhanbad Fuels Private Limited'),
    ('Maan Steel & Power Limited'),
    ('Maan Concast Private Limited'),
    ('Hitech Plastochem Udyog Pvt Ltd'),
    ('Mangal Sponge and Steel Pvt. Ltd.'),
    ('Coffers Metallics Private Limited'),
    ('Roopgarh Power & Alloys Pvt. Ltd.'),
    ('Sri Venkatesh Iron'),
    ('Anjanisuta Steels Private Limited'),
    ('Orissa Concrete & Allied Industries Ltd(New)'),
    ('Kodarma Chemical Pvt. Ltd.'),
    ('Brahmaputra Metallics Ltd.')
) AS x(nm)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.companies c
  WHERE lower(trim(c.name)) = lower(trim(x.nm))
);

-- -----------------------------------------------------------------------------
-- PART 1: Insert 49 POC rows (no dedup; case-insensitive company match + auto-create)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r         RECORD;
  cid       UUID;
  ref_no    TEXT;
  n         INT;
  inserted  INT := 0;
  skipped   INT := 0;
  ts_base   TIMESTAMPTZ := NOW();
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference_no FROM 6) AS INT)
  ), 0)
  INTO n
  FROM public.performance_monitoring
  WHERE reference_no ~* '^SUCC-[0-9]+$'
    AND LENGTH(reference_no) > 5;

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
    )
    SELECT sl_no, trim(company_name) AS company_name, trim(contact) AS contact
    FROM raw
    ORDER BY sl_no
  LOOP
    cid := NULL;

    SELECT c.id INTO cid
    FROM public.companies c
    WHERE trim(c.name) = trim(r.company_name)
    LIMIT 1;

    IF cid IS NULL THEN
      SELECT c.id INTO cid
      FROM public.companies c
      WHERE lower(trim(c.name)) = lower(trim(r.company_name))
      LIMIT 1;
    END IF;

    IF cid IS NULL THEN
      BEGIN
        INSERT INTO public.companies (name)
        VALUES (trim(r.company_name))
        RETURNING id INTO cid;
      EXCEPTION
        WHEN unique_violation THEN
          SELECT c.id INTO cid
          FROM public.companies c
          WHERE lower(trim(c.name)) = lower(trim(r.company_name))
          LIMIT 1;
        WHEN OTHERS THEN
          RAISE NOTICE 'SKIP (company insert failed): % — %', r.company_name, SQLERRM;
      END;
    END IF;

    IF cid IS NULL THEN
      RAISE NOTICE 'SKIP (no company_id): %', r.company_name;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    LOOP
      n := n + 1;
      ref_no := 'SUCC-' || LPAD(n::TEXT, 4, '0');
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.performance_monitoring pm WHERE pm.reference_no = ref_no
      );
    END LOOP;

    BEGIN
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
        ts_base + (r.sl_no::double precision * interval '1 second')
      );
      inserted := inserted + 1;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'SKIP duplicate reference_no % (already seeded?)', ref_no;
        skipped := skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE 'PART1 done. Inserted PM: %, skipped: %, last SUCC n: %', inserted, skipped, n;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2: Training rows + Feature Committed for Use (ticket_features)
-- Matches feature_list.name (case-insensitive; trims trailing . and spaces)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r        RECORD;
  pm_id    UUID;
  tr_id    UUID;
  rec_tok  RECORD;
  fn_norm  TEXT;
  got_feat BOOLEAN;
BEGIN
  FOR r IN
    WITH t AS (
      SELECT *
      FROM (
        VALUES
          -- company_name | schedule_date | remarks | features_csv
          ('Govinda Polytex India Private Limited',
            '2025-08-05'::date, 'Training on Call',
            'Gate Pass, Work Order, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Shri Varu Polytex Pvt Ltd',
            '2025-08-05'::date, 'Training on call',
            'Gate Pass, Work Order, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('M/s. Singhal Enterprises (Jharsuguda) Pvt. Ltd',
            '2025-08-01'::date, 'Training on call',
            'Item Approval, RFQ, QC, Gate Pass, Vendor Approval, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Shikhara Steels Private Limited',
            '2025-08-04'::date, 'Training on call',
            'Item Approval, RFQ, QC, Gate Pass, CC in Issue, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Hi-Tech Power & Steel Ltd.',
            '2025-08-26'::date, 'Training on call',
            'Reorder Level, Work Order, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('MVK Industries Pvt Ltd',
            '2025-08-01'::date, NULL,
            'Reorder Level, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Agrawal Sponge Pvt Ltd',
            '2025-08-01'::date, NULL,
            'Item Approval, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Vraj Metaliks Pvt. Ltd.',
            '2025-08-01'::date, NULL,
            'Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Salagram Power & Steel Pvt Ltd',
            '2025-08-04'::date, NULL,
            'Reorder Level, Gate Pass, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Bharat Hi-Tech (Cements) Pvt. Ltd',
            '2025-08-01'::date, NULL,
            'Item Approval, Reorder Level, CC in Issue, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor, CC In Issue'),
          ('Ugen Ferro Alloys Pvt. Ltd.',
            '2025-08-05'::date, 'Training on call',
            'Item Approval, Reorder Level, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Agroha Steel and Power Pvt Ltd',
            '2025-08-06'::date, 'Training on call',
            'Item Approval, Reorder Level, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Rausheena Udyog Limited',
            '2025-08-01'::date, 'Training on call',
            'Gate Pass, Location in Stock, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor, Scrap'),
          ('Surendra Mining Industries Pvt. Ltd.',
            '2025-08-07'::date, 'Training on call',
            'Item Approval, RFQ, QC, Gate Pass, Work Order, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor, Reorder Level'),
          ('Hariom Ingots & Power Pvt. Ltd.',
            '2025-08-04'::date, 'Training on call',
            'Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Hariom Coatings Pvt. Ltd.',
            '2025-08-04'::date, 'Training on call',
            'Work Order, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Balmukund Sponge & Iron Pvt Ltd',
            '2025-08-07'::date, 'Training on call',
            'Gate Pass, Work Order, Location in Stock, Physical Stock Taking, Payment Management, Budget, Scrap'),
          ('M/s Balajee Mini Steels & Re Rolling Pvt Ltd',
            '2025-08-07'::date, 'Training on call',
            'Gate Pass, Work Order, Location in Stock, Physical Stock Taking, Payment Management, Budget, Scrap, Work Order'),
          ('Dadijee Steel',
            '2025-08-05'::date, 'Training on call',
            'Reorder Level, Gate Pass, Work Order, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Niranjan Metallic Limited',
            '2025-08-05'::date, 'Training on call',
            'Reorder Level, Gate Pass, Work Order, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Sky Alloys and Power Pvt Ltd',
            '2025-08-08'::date, 'Training on call',
            'Item Approval, Reorder Level, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Sky Steel & Power Pvt Ltd',
            '2025-08-08'::date, 'Training on call',
            'Item Approval, Reorder Level, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Super Iron Foundry Ltd',
            '2025-08-04'::date, 'Training on call',
            'Reorder Level, RFQ, QC, Gate Pass, CC in Issue, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Govind Steel Co Ltd',
            '2025-08-04'::date, 'Training on call',
            'Reorder Level, RFQ, QC, Gate Pass, Work Order, CC in Issue, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Dinesh Brothers Pvt. Ltd.',
            '2025-08-25'::date, 'Training on call',
            'Reorder Level, RFQ, QC, Gate Pass, Work Order, CC in Issue, Location in Stock, Negotiation, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Maa Mangla Ispat Pvt. Ltd',
            '2025-09-23'::date, 'Training on call',
            'Gate Pass, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('M/s. Maa Mangla Ispat Pvt Ltd (UNIT-2)',
            '2025-09-23'::date, 'Training on call',
            'Gate Pass, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Maa Shakambari Steel Ltd.',
            '2025-09-23'::date, 'Training on call',
            'Gate Pass, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('B.R.Sponge & Power Ltd.',
            '2025-09-23'::date, 'Training on call',
            'Negotiation, Physical Stock Taking, Payment Management, Budget, Mandatory Vendor'),
          ('Vighneshwar Ispat Pvt.Ltd',
            '2025-10-03'::date, 'Training on call',
            'Reorder Level, QC, Gate Pass, Work Order, CC in Issue, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('BlackRock Steel & Power Pvt. Ltd',
            '2025-10-17'::date, 'Training on call',
            'Item Approval, Reorder Level, CC in Issue, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Jay Iron And Steels Limited',
            NULL::date, NULL,
            'Item Approval, RFQ, QC, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Pratishtha Polypack Private Limited',
            NULL::date, NULL,
            'Item Approval, RFQ, QC, Gate Pass, Work Order, CC in Issue, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Plascom Industries LLP',
            '2025-12-30'::date, 'Training on call',
            'Gate Pass, Work Order, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Flexicom Industries Pvt. Ltd.',
            '2025-12-30'::date, 'Training on call',
            'Gate Pass, Work Order, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Orissa Concrete & Allied Industries Ltd',
            NULL::date, NULL,
            'Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Indo East Corporation Private Limited',
            NULL::date, NULL,
            'Item Approval, Reorder Level, Location in Stock, Negotiation, Physical Stock Taking, Budget, Scrap, Mandatory Vendor'),
          ('Dhanbad Fuels Private Limited',
            NULL::date, NULL,
            'Work Order, Negotiation, Physical Stock Taking, Budget, Scrap, Mandatory Vendor'),
          ('Maan Steel & Power Limited',
            NULL::date, NULL,
            'Work Order, Negotiation, Physical Stock Taking, Budget, Scrap, Mandatory Vendor'),
          ('Maan Concast Private Limited',
            NULL::date, NULL,
            'Gate Pass, Work Order, Location in Stock, Negotiation, Physical Stock Taking, Budget, Scrap, Mandatory Vendor'),
          ('Hitech Plastochem Udyog Pvt Ltd',
            NULL::date, NULL,
            'RFQ, QC, Gate Pass, Work Order, Location in Stock, Negotiation, Physical Stock Taking, Budget, Mandatory Vendor'),
          ('Mangal Sponge and Steel Pvt. Ltd.',
            NULL::date, NULL,
            'Reorder Level, CC in Issue, Location in Stock, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Coffers Metallics Private Limited',
            '2026-01-30'::date, 'Training on call',
            'Issue, Reorder Level, RFQ, QC, Gate Pass, Work Order, CC in Issue, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Roopgarh Power & Alloys Pvt. Ltd.',
            '2025-11-25'::date, 'Training on call',
            'Reorder Level, Gate Pass, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Sri Venkatesh Iron',
            NULL::date, NULL,
            'Item Approval, Gate Pass, Work Order, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Anjanisuta Steels Private Limited',
            NULL::date, NULL,
            'Item Approval, Reorder Level, Gate Pass, Work Order, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Orissa Concrete & Allied Industries Ltd(New)',
            '2026-01-08'::date, 'Training on call',
            'CC in Issue, Location in Stock, Negotiation, Physical Stock Taking, Payment Management, Budget, Scrap, Mandatory Vendor'),
          ('Kodarma Chemical Pvt. Ltd.',
            '2026-02-25'::date, 'Training on call',
            'Item Approval, Reorder Level, Physical Stock Taking, Budget, Scrap, Payment Management, Mandatory Vendor'),
          ('Brahmaputra Metallics Ltd.',
            NULL::date, NULL,
            'Reorder Level, Location in Stock, Physical Stock Taking, Budget, Scrap, Payment Management, Mandatory Vendor')
      ) AS v(company_name, schedule_date, remarks, features_csv)
    )
    SELECT * FROM t
  LOOP
    pm_id := NULL;
    SELECT pm.id INTO pm_id
    FROM public.performance_monitoring pm
    JOIN public.companies c ON c.id = pm.company_id
    WHERE lower(trim(c.name)) = lower(trim(r.company_name))
    ORDER BY pm.created_at DESC
    LIMIT 1;

    IF pm_id IS NULL THEN
      RAISE NOTICE 'PART2 skip (no PM row for company): %', r.company_name;
      CONTINUE;
    END IF;

    INSERT INTO public.performance_training (
      performance_id,
      call_poc,
      message_poc,
      message_owner,
      training_schedule_date,
      training_status,
      remarks
    ) VALUES (
      pm_id,
      'yes',
      'yes',
      'yes',
      r.schedule_date,
      'yes',
      NULLIF(trim(r.remarks), '')
    )
    ON CONFLICT (performance_id) DO UPDATE SET
      call_poc = EXCLUDED.call_poc,
      message_poc = EXCLUDED.message_poc,
      message_owner = EXCLUDED.message_owner,
      training_schedule_date = EXCLUDED.training_schedule_date,
      training_status = EXCLUDED.training_status,
      remarks = EXCLUDED.remarks,
      updated_at = NOW()
    RETURNING id INTO tr_id;

    DELETE FROM public.ticket_features WHERE training_id = tr_id;

    FOR rec_tok IN
      SELECT trim(unnest(string_to_array(r.features_csv, ','))) AS fn
    LOOP
      IF rec_tok.fn IS NULL OR rec_tok.fn = '' THEN
        CONTINUE;
      END IF;

      fn_norm := lower(regexp_replace(trim(rec_tok.fn), '\s+', ' ', 'g'));
      fn_norm := regexp_replace(fn_norm, '[\.,]+$', '');

      SELECT EXISTS (
        SELECT 1
        FROM public.feature_list fl
        WHERE lower(regexp_replace(trim(fl.name), '\s+', ' ', 'g')) = fn_norm
           OR lower(regexp_replace(trim(fl.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(rec_tok.fn), '\s+', ' ', 'g'))
      ) INTO got_feat;

      IF NOT got_feat THEN
        RAISE NOTICE 'Unmatched feature name for %: [%]', r.company_name, rec_tok.fn;
        CONTINUE;
      END IF;

      INSERT INTO public.ticket_features (training_id, feature_id)
      SELECT tr_id, fl.id
      FROM public.feature_list fl
      WHERE lower(regexp_replace(trim(fl.name), '\s+', ' ', 'g')) = fn_norm
         OR lower(regexp_replace(trim(fl.name), '\s+', ' ', 'g'))
            = lower(regexp_replace(trim(rec_tok.fn), '\s+', ' ', 'g'))
      LIMIT 1
      ON CONFLICT (training_id, feature_id) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'PART2 training + ticket_features seed finished.';
END $$;

-- Verify
-- SELECT pm.reference_no, c.name, pt.training_schedule_date, pt.remarks,
--        (SELECT COUNT(*) FROM ticket_features tf WHERE tf.training_id = pt.id) AS feature_cnt
-- FROM performance_monitoring pm
-- JOIN companies c ON c.id = pm.company_id
-- LEFT JOIN performance_training pt ON pt.performance_id = pm.id
-- WHERE pm.reference_no ~ '^SUCC-[0-9]+$'
-- ORDER BY pm.reference_no DESC;
