-- ============================================================================
-- FIX: Create user_profiles for existing auth users (e.g. aman@industryprime.com)
-- ============================================================================
-- Run this in Supabase SQL Editor if login fails with "Invalid email or password"
-- or "User profile not found"
-- ============================================================================

-- Create user_profiles for ALL auth.users that don't have one
INSERT INTO public.user_profiles (id, full_name, role_id, is_active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
  COALESCE(
    (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1),
    (SELECT id FROM public.roles ORDER BY created_at LIMIT 1)
  ),
  TRUE
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Verify: Should show your user
-- SELECT up.*, au.email FROM public.user_profiles up JOIN auth.users au ON au.id = up.id;
