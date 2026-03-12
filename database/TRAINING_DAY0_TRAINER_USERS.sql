-- ============================================================================
-- Training: Trainer dropdown & Day 0 Checklist trainer name
-- Run in Supabase SQL Editor so "Trainer" dropdown shows all users and
-- trainer name appears in Day 0 Checklist.
-- ============================================================================

-- 1) Ensure user_profiles has is_active (used by /training/users to list users)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Set existing rows to active if NULL
UPDATE public.user_profiles SET is_active = TRUE WHERE is_active IS NULL;

-- 2) Ensure every auth user has a profile (so they appear in Trainer dropdown)
-- Option A: If user_profiles has role_id (references roles table)
INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'User'),
  (SELECT id FROM public.roles ORDER BY name LIMIT 1),
  TRUE
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = au.id)
  AND EXISTS (SELECT 1 FROM public.roles LIMIT 1);

-- Option B: If role_id is nullable or you prefer to set it later, run instead:
-- INSERT INTO public.user_profiles (id, full_name, is_active)
-- SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', 'User'), TRUE
-- FROM auth.users au
-- WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = au.id)
-- ON CONFLICT (id) DO NOTHING;

-- 3) Verify: list users that will appear in Trainer dropdown
SELECT id, full_name, is_active
FROM public.user_profiles
ORDER BY full_name;

-- 4) Day 0 Checklist trainer is stored in training_day0_checklist.data->>'trainer_user_id'
--    (UUID of user_profiles.id). No extra table needed; trainer name is resolved by the app
--    from user_profiles when loading the checklist.
