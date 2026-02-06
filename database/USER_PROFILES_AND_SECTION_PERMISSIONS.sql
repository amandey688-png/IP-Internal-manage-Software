-- ============================================================================
-- File: USER_PROFILES_AND_SECTION_PERMISSIONS.sql
-- USER_PROFILES: display_name (Name of User ID) + user_section_permissions
-- Run in Supabase SQL Editor after SETUP_COMPLETE.sql / FRESH_SETUP.sql
-- ============================================================================

-- 1. Add display_name to user_profiles (optional; if used, view can COALESCE with role_name)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

COMMENT ON COLUMN public.user_profiles.display_name IS 'Optional custom display name; users_view shows role name (role_id name) as Name of User ID.';

-- 2. Section permissions: per-user view/edit for app sections (Master Admin only can edit)
CREATE TABLE IF NOT EXISTS public.user_section_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_user_section_permissions_user ON public.user_section_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_section_permissions_section ON public.user_section_permissions(section_key);

COMMENT ON TABLE public.user_section_permissions IS 'Per-user view/edit permissions for app sections; used when Master Admin edits a user.';

-- 3. Recreate users_view: display_name = role name (role_id name) for "Name of User ID"
DROP VIEW IF EXISTS public.users_view;

CREATE VIEW public.users_view AS
SELECT
    up.id,
    au.email,
    up.full_name,
    r.name AS display_name,   -- Name of User ID = role name (role_id name), not full_name
    up.role_id,
    r.name AS role_name,
    up.is_active,
    up.created_at
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
JOIN public.roles r ON r.id = up.role_id;

COMMENT ON VIEW public.users_view IS 'display_name and role_name both expose role name (role_id); use for "Name of User ID" in UI.';

-- ============================================================================
-- DONE. After this:
-- - Backend can read/write user_profiles.display_name and user_section_permissions
-- - Frontend "Name of User ID" shows role name (role_id name), not full_name
-- ============================================================================


-- ============================================================================
-- HOW TO TEST (file: USER_PROFILES_AND_SECTION_PERMISSIONS.sql)
-- Run in Supabase SQL Editor after the script above.
-- ============================================================================

-- 1. Check roles exist
-- SELECT id, name FROM public.roles ORDER BY name;

-- 2. Check user_profiles and roles join
-- SELECT up.id, up.full_name, up.role_id, r.name AS role_name
-- FROM public.user_profiles up
-- JOIN public.roles r ON r.id = up.role_id
-- LIMIT 10;

-- 3. Verify users_view: display_name must equal role name (not full_name)
--    Each row: full_name = person name, display_name = role name (e.g. Admin, User)
-- SELECT id, email, full_name, display_name, role_id, role_name
-- FROM public.users_view
-- ORDER BY email;

-- 4. Quick assertion: display_name should match role_name in the view
-- SELECT id, email, full_name, display_name, role_name,
--        (display_name = role_name) AS display_name_is_role_name
-- FROM public.users_view;
-- (display_name_is_role_name should be TRUE for all rows)

-- 5. Optional: test section permissions table exists and is empty or has data
-- SELECT * FROM public.user_section_permissions LIMIT 5;
-- ============================================================================
