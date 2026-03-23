-- Verify Payment Action (Dashboard) data for Master Admin.
-- Run in Supabase SQL Editor after CLIENT_PAYMENT_INTERCEPT_TAG2.sql.

-- 1) Columns exist (should return rows with column names)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'onboarding_client_payment_intercept'
  AND column_name IN (
    'tagged_user_id',
    'tagged_user_2_id',
    'tagged_user_2_name',
    'tagged_user_2_email',
    'payment_action_submitted_at',
    'payment_action_2_submitted_at',
    'payment_action_2_person',
    'payment_action_2_remarks'
  )
ORDER BY column_name;

-- 2) Intercepts that SHOULD appear in Payment Action (pending T1 — no T1 payment action yet)
SELECT
  i.client_payment_id,
  p.company_name,
  p.invoice_number,
  p.reference_no,
  i.tagged_user_name,
  i.tagged_user_email,
  'pending T1'::text AS dashboard_step
FROM public.onboarding_client_payment_intercept i
JOIN public.onboarding_client_payment p ON p.id = i.client_payment_id
WHERE i.tagged_user_id IS NOT NULL
  AND i.payment_action_submitted_at IS NULL
ORDER BY i.created_at DESC
LIMIT 50;

-- 3) Pending T2 (T1 done, Tag2 set, T2 payment action not done)
SELECT
  i.client_payment_id,
  p.company_name,
  p.invoice_number,
  p.reference_no,
  i.tagged_user_name AS t1_name,
  i.tagged_user_2_name AS t2_name,
  i.tagged_user_2_email AS t2_email,
  'pending T2'::text AS dashboard_step
FROM public.onboarding_client_payment_intercept i
JOIN public.onboarding_client_payment p ON p.id = i.client_payment_id
WHERE i.tagged_user_id IS NOT NULL
  AND i.payment_action_submitted_at IS NOT NULL
  AND (i.tagged_user_2_id IS NOT NULL OR NULLIF(TRIM(COALESCE(i.tagged_user_2_name, '')), '') IS NOT NULL OR NULLIF(TRIM(COALESCE(i.tagged_user_2_email, '')), '') IS NOT NULL)
  AND i.payment_action_2_submitted_at IS NULL
ORDER BY i.updated_at DESC NULLS LAST
LIMIT 50;

-- 4) Completed T2 flows (shown as read-only "Done" on dashboard — last 100 by T2 submit time)
SELECT
  i.client_payment_id,
  p.company_name,
  p.invoice_number,
  p.reference_no,
  i.tagged_user_name AS t1_name,
  i.tagged_user_2_name AS t2_name,
  i.payment_action_2_submitted_at,
  'completed'::text AS dashboard_step
FROM public.onboarding_client_payment_intercept i
JOIN public.onboarding_client_payment p ON p.id = i.client_payment_id
WHERE i.tagged_user_id IS NOT NULL
  AND i.payment_action_submitted_at IS NOT NULL
  AND (i.tagged_user_2_id IS NOT NULL OR NULLIF(TRIM(COALESCE(i.tagged_user_2_name, '')), '') IS NOT NULL OR NULLIF(TRIM(COALESCE(i.tagged_user_2_email, '')), '') IS NOT NULL)
  AND i.payment_action_2_submitted_at IS NOT NULL
ORDER BY i.payment_action_2_submitted_at DESC NULLS LAST
LIMIT 100;
