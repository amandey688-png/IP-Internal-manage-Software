-- =============================================================================
-- Raised Invoices → public.onboarding_client_payment
-- Run in Supabase SQL Editor (service role bypasses RLS).
--
-- • timestamp      → clock_timestamp() (auto at insert time)
-- • reference_no   → INV/COMP/#### auto (continues from max existing INV/COMP/nnnn)
-- • company_name   → canonical name from public.companies.name
-- • company_id     → public.companies.id (matched by normalized name + optional aliases)
--
-- Schema: docs/SUPABASE_CLIENT_PAYMENT_CORE.sql
--   invoice_amount: digits only (no commas/decimals)
--   genre: M / Q / HY / Y
-- =============================================================================

-- 1) Optional: link to master companies (safe to re-run)
ALTER TABLE public.onboarding_client_payment
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_onboarding_client_payment_company_id
  ON public.onboarding_client_payment (company_id);

-- Normalize for matching (strips extra spaces, removes "." so Pvt. ≈ Pvt)
CREATE OR REPLACE FUNCTION public._ocp_match_company_key(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT lower(
    trim(
      regexp_replace(
        regexp_replace(coalesce(t, ''), '\s+', ' ', 'g'),
        '\.',
        '',
        'g'
      )
    )
  );
$$;

-- 2) Optional aliases: use when sheet text still does not match any companies.name
--    (e.g. "Siltara Div" vs "Siltara)"). Hint = value in staging below; exact = companies.name
DROP TABLE IF EXISTS _tmp_invoice_company_aliases;
CREATE TEMP TABLE _tmp_invoice_company_aliases (
  company_name_hint text PRIMARY KEY,
  companies_name_exact text NOT NULL
);

-- Uncomment and edit to match YOUR public.companies.name values:
-- INSERT INTO _tmp_invoice_company_aliases (company_name_hint, companies_name_exact) VALUES
--   ('Vraj Iron & Steels Ltd. (Siltara Div)', 'Vraj Iron & Steels Ltd. (Siltara)'),
--   ('Shree Parashnath Re-Roolling Mills Ltd.', 'Parasnath Rolling Mills Ltd.');

-- 3) PREVIEW — must return 6 rows with non-null company_id. Fix aliases or companies.name if not.
WITH stg AS (
  SELECT * FROM (VALUES
    (date '2026-02-01', '7560', 'ITPL/25-26/320', 'M', 'Maan Concast Pvt. Ltd.'),
    (date '2026-03-01', '22680', 'ITPL/25-26/326', 'M', 'Vraj Iron & Steels Ltd. (Siltara Div)'),
    (date '2026-03-01', '21240', 'ITPL/25-26/328', 'M', 'Shree Parashnath Re-Roolling Mills Ltd.'),
    (date '2026-03-01', '7560', 'ITPL/25-26/329', 'M', 'Maan Concast Pvt. Ltd.'),
    (date '2026-03-01', '47200', 'ITPL/25-26/332', 'Q', 'Bhagwati Power & Steel Ltd'),
    (date '2026-03-01', '10620', 'ITPL/25-26/333', 'Q', 'Vazron Industries Pvt. Ltd.')
  ) AS t(invoice_date, invoice_amount, invoice_number, genre, company_name_hint)
),
resolved AS (
  SELECT
    stg.*,
    COALESCE(a.companies_name_exact, stg.company_name_hint) AS match_name
  FROM stg
  LEFT JOIN _tmp_invoice_company_aliases a ON a.company_name_hint = stg.company_name_hint
)
SELECT
  r.invoice_number,
  r.company_name_hint,
  c.id AS company_id,
  c.name AS company_name_in_db
FROM resolved r
LEFT JOIN LATERAL (
  SELECT id, name
  FROM public.companies c
  WHERE public._ocp_match_company_key(c.name) = public._ocp_match_company_key(r.match_name)
  LIMIT 1
) c ON true
ORDER BY r.invoice_number;

-- 4) INSERT — run only after step 3 shows all 6 rows matched (company_id not null)
WITH base AS (
  SELECT COALESCE(
    MAX(
      (substring(reference_no FROM '^INV/COMP/([0-9]+)$'))::int
    ),
    0
  ) AS n
  FROM public.onboarding_client_payment
  WHERE reference_no ~ '^INV/COMP/[0-9]+$'
),
stg AS (
  SELECT * FROM (VALUES
    (date '2026-02-01', '7560', 'ITPL/25-26/320', 'M', 'Maan Concast Pvt. Ltd.'),
    (date '2026-03-01', '22680', 'ITPL/25-26/326', 'M', 'Vraj Iron & Steels Ltd. (Siltara Div)'),
    (date '2026-03-01', '21240', 'ITPL/25-26/328', 'M', 'Shree Parashnath Re-Roolling Mills Ltd.'),
    (date '2026-03-01', '7560', 'ITPL/25-26/329', 'M', 'Maan Concast Pvt. Ltd.'),
    (date '2026-03-01', '47200', 'ITPL/25-26/332', 'Q', 'Bhagwati Power & Steel Ltd'),
    (date '2026-03-01', '10620', 'ITPL/25-26/333', 'Q', 'Vazron Industries Pvt. Ltd.')
  ) AS t(invoice_date, invoice_amount, invoice_number, genre, company_name_hint)
),
resolved AS (
  SELECT
    stg.*,
    COALESCE(a.companies_name_exact, stg.company_name_hint) AS match_name
  FROM stg
  LEFT JOIN _tmp_invoice_company_aliases a ON a.company_name_hint = stg.company_name_hint
)
INSERT INTO public.onboarding_client_payment (
  timestamp,
  reference_no,
  company_name,
  company_id,
  invoice_date,
  invoice_amount,
  invoice_number,
  genre,
  stage,
  payment_received_date
)
SELECT
  clock_timestamp(),
  'INV/COMP/' || lpad((base.n + row_number() OVER (ORDER BY r.invoice_number))::text, 4, '0'),
  c.name,
  c.id,
  r.invoice_date,
  r.invoice_amount,
  r.invoice_number,
  r.genre,
  NULL,
  NULL
FROM resolved r
INNER JOIN LATERAL (
  SELECT id, name
  FROM public.companies c
  WHERE public._ocp_match_company_key(c.name) = public._ocp_match_company_key(r.match_name)
  LIMIT 1
) c ON true
CROSS JOIN base;

-- Optional: drop helper if you do not want it in the DB
-- DROP FUNCTION IF EXISTS public._ocp_match_company_key(text);

-- 5) Re-run cleanup (optional)
-- DELETE FROM public.onboarding_client_payment
-- WHERE invoice_number IN (
--   'ITPL/25-26/320','ITPL/25-26/326','ITPL/25-26/328','ITPL/25-26/329',
--   'ITPL/25-26/332','ITPL/25-26/333'
-- );
