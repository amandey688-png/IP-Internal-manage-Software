-- KPI daily work log — Supabase checks when "Save" fails from Akash Dashboard
--
-- The FastAPI backend uses ONE Supabase key from env (see backend/app/supabase_client.py).
-- If SUPABASE_SERVICE_ROLE_KEY is set, PostgREST uses the service role and RLS is bypassed
-- for server-side writes — this is the supported setup.
--
-- If that key is missing, the client falls back to SUPABASE_ANON_KEY. Requests then run as
-- the anon role without an end-user JWT, so policies like auth.uid() = user_id will fail
-- and upserts return permission / RLS errors. Fix: add the service_role JWT to the API
-- host environment and redeploy (do not expose it in the browser).
--
-- Run the queries below in Supabase SQL Editor to verify schema + owner id.

-- 1) Table and unique constraint (required for upsert on user_id, work_date)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'kpi_daily_work_log'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.kpi_daily_work_log'::regclass;

-- 2) Akash profile used as kpi_daily_work_log.user_id (must match auth.users.id)
select up.id as profile_id, up.full_name, au.email
from public.user_profiles up
left join auth.users au on au.id = up.id
where up.full_name ilike '%akash%'
order by up.created_at nulls last
limit 5;

-- 3) Optional: confirm RLS is on (expected). Service role from API still bypasses RLS.
select relrowsecurity as rls_enabled
from pg_class
where oid = 'public.kpi_daily_work_log'::regclass;
