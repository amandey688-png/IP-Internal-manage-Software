-- Optional: set onboarding_client_payment_ageing.company_id for reporting / joins.
-- The FastAPI Payment Ageing endpoint now matches sheet rows to companies.name using
-- normalize_company_name + token Jaccard + company_id, so this script is NOT required
-- for the grid to show quarter days.
--
-- Use this if other tools need a stable FK on company_id. Extend the VALUES list with
-- (seed_company_name, companies.id) pairs from your Supabase companies table.

UPDATE public.onboarding_client_payment_ageing AS a
SET company_id = m.cid
FROM (
  VALUES
    ('Black Rock Steel & Power Pvt Ltd', '30b06f0e-a677-4727-8602-dbcda4727189'::uuid),
    ('Agrawal Sponge Pvt. Ltd.', '9ef5d94b-2709-4ff8-9d4a-213e828c8eeb'::uuid),
    ('Agroha Steel and Power Pvt. Ltd.', '094455c2-a897-49db-9aa3-f5aeec22dca9'::uuid),
    ('Bharat Hitech (Cements) Pvt Ltd', '0da111f5-5f41-4637-b3b8-3c9a06f336d1'::uuid),
    ('Amiya Steel Pvt. Ltd.', '13477ce5-421b-4a08-ac9d-d9db16960b2d'::uuid),
    ('Coffers Metallics Pvt. Ltd.', '210379be-d763-46d5-9a8d-bd05df77de6a'::uuid)
) AS m(seed_name, cid)
WHERE trim(a.company_name) = trim(m.seed_name);
