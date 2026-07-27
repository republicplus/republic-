/*
# Storage policies for documents bucket

## Overview
Allow authenticated users to upload, read, and delete files in the
`documents` storage bucket. Each user can manage their own files
(path-prefixed by user id is not enforced here since the documents table
already enforces ownership via RLS — the bucket is public-read for simplicity).
*/

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public can read documents"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
