-- =============================================================================
-- User section permissions — explicit grants only (no default access)
-- =============================================================================
-- Table: public.user_section_permissions (user_id, section_key, can_view, can_edit)
-- Rules:
--   * No row for (user_id, section_key) => no View and no Edit for that section.
--   * New app sections must be added to backend SECTION_KEYS + frontend PERMISSION_SECTION_KEYS;
--     existing users get no access until a Master Admin checks the boxes.
--
-- Optional: tighten DB default so accidental inserts without app logic default to deny.
-- =============================================================================

ALTER TABLE IF EXISTS public.user_section_permissions
  ALTER COLUMN can_view SET DEFAULT false;

COMMENT ON TABLE public.user_section_permissions IS
  'Explicit section ACL: missing row means no access. Backend deletes rows when both can_view and can_edit are false.';

-- =============================================================================
-- Optional one-time backfill: grant "user" role accounts at least Dashboard view
-- (Uncomment and run only if you locked out normal users after switching to explicit defaults.)
-- =============================================================================
-- INSERT INTO public.user_section_permissions (user_id, section_key, can_view, can_edit, updated_at)
-- SELECT up.id, 'dashboard', true, false, NOW()
-- FROM public.user_profiles up
-- JOIN public.roles r ON r.id = up.role_id AND lower(r.name) = 'user'
-- ON CONFLICT (user_id, section_key) DO UPDATE SET can_view = true, can_edit = false, updated_at = NOW();
