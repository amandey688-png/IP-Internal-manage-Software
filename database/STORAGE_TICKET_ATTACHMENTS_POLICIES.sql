-- ============================================================================
-- File: STORAGE_TICKET_ATTACHMENTS_POLICIES.sql
-- Storage RLS policies for bucket "ticket-attachments"
-- Run in Supabase SQL Editor (Storage → Policies, or SQL Editor).
-- Set bucket file size limit to 5 MB in Dashboard: Storage → Buckets →
--   ticket-attachments → Edit / Settings → File size limit = 5 MB.
-- Safe to run multiple times: DROP IF EXISTS avoids "already exists" errors.
-- ============================================================================

DROP POLICY IF EXISTS "ticket-attachments: Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "ticket-attachments: Allow anon uploads" ON storage.objects;
DROP POLICY IF EXISTS "ticket-attachments: Allow public read" ON storage.objects;

-- Policy 1: Allow authenticated users to UPLOAD (INSERT).
CREATE POLICY "ticket-attachments: Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- Policy 1b: Allow anon (anon key) to UPLOAD. Use when service_role is sb_secret_
-- and Storage API only accepts JWT; backend then uses anon key (eyJ...) for uploads.
CREATE POLICY "ticket-attachments: Allow anon uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'ticket-attachments');

-- Policy 2: Allow public READ (SELECT) so attachment links work for everyone.
-- Required for public bucket URLs returned to the app.
CREATE POLICY "ticket-attachments: Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ticket-attachments');

-- ============================================================================
-- Optional: Allow UPDATE/DELETE for owners (e.g. replace or remove own file).
-- Uncomment if your app needs to update/delete attachments.
-- ============================================================================
-- CREATE POLICY "ticket-attachments: Allow owner update"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'ticket-attachments' AND (auth.uid())::text = owner)
-- WITH CHECK (bucket_id = 'ticket-attachments');

-- CREATE POLICY "ticket-attachments: Allow owner delete"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'ticket-attachments' AND (auth.uid())::text = owner);

-- ============================================================================
-- DONE. In Supabase Dashboard (Storage → Buckets → ticket-attachments):
--   1. Set bucket to PUBLIC (so "View" opens the document in browser)
--   2. Optionally set File size limit = 5 or 10 MB
-- See SUPABASE_ATTACHMENT_VIEW_FIX.md if "View" does not open the file.
-- ============================================================================
