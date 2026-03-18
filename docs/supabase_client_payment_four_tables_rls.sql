-- =============================================================================
-- RLS for these 4 tables (remove UNRESTRICTED / lock down anon access):
--   onboarding_client_payment_followups
--   onboarding_client_payment_intercept
--   onboarding_client_payment_discontinuation
--   onboarding_client_payment_receive
--
-- Run once in Supabase SQL Editor (PRODUCTION).
--
-- FastAPI uses SERVICE ROLE → bypasses RLS → your app keeps working.
-- Anon key + PostgREST: no policies below = no row access (secure).
-- =============================================================================

alter table public.onboarding_client_payment_followups enable row level security;
alter table public.onboarding_client_payment_intercept enable row level security;
alter table public.onboarding_client_payment_discontinuation enable row level security;
alter table public.onboarding_client_payment_receive enable row level security;

-- With RLS on and NO policies for `anon` / `authenticated`, those roles cannot
-- read or write via Supabase Data API. Only service_role (backend) + table owner
-- (e.g. SQL Editor as postgres) can access.

-- ---------------------------------------------------------------------------
-- OPTIONAL — only if you use Supabase JS from the browser with logged-in users
-- and need direct table access. Otherwise skip (more secure without these).
-- ---------------------------------------------------------------------------
/*
create policy "followups_auth_rw"
  on public.onboarding_client_payment_followups for all to authenticated
  using (true) with check (true);

create policy "intercept_auth_rw"
  on public.onboarding_client_payment_intercept for all to authenticated
  using (true) with check (true);

create policy "discontinuation_auth_rw"
  on public.onboarding_client_payment_discontinuation for all to authenticated
  using (true) with check (true);

create policy "receive_auth_rw"
  on public.onboarding_client_payment_receive for all to authenticated
  using (true) with check (true);
*/
