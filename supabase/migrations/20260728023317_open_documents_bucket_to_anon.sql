/*
# Open documents storage bucket to anon + authenticated

## Why
Admin mode uses the anon key, so document uploads/downloads fail under the
old `authenticated`-only storage policies.

## Changes
- Replace the two `authenticated`-only storage policies on `storage.objects`
  for the `documents` bucket with `TO anon, authenticated` equivalents.
- The bucket is already public, so reads work; this fixes inserts (uploads)
  and deletes.
*/

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete documents" ON storage.objects;

CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can delete documents"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'documents');
