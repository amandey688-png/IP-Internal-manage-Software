-- =============================================================================
-- Delete Payment Ageing rows where ALL quarter_days are null (blank grid)
-- Use when duplicate company names left an empty seed row in Supabase.
--
-- PREVIEW first (SELECT). Then run DELETE.
-- =============================================================================

-- Preview rows that would be removed (no non-null day in the JSON array)
SELECT id, company_name, quarter_days
FROM public.onboarding_client_payment_ageing
WHERE quarter_days IS NULL
   OR quarter_days = '[]'::jsonb
   OR NOT EXISTS (
     SELECT 1
     FROM jsonb_array_elements(quarter_days) AS e
     WHERE e IS NOT NULL
   );

-- Uncomment to delete:
/*
DELETE FROM public.onboarding_client_payment_ageing
WHERE quarter_days IS NULL
   OR quarter_days = '[]'::jsonb
   OR NOT EXISTS (
     SELECT 1
     FROM jsonb_array_elements(quarter_days) AS e
     WHERE e IS NOT NULL
   );
*/
