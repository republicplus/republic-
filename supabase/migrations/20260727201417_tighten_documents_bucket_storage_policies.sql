/*
# Tighten documents bucket storage policies

## Overview
The `documents` storage bucket previously had a broad SELECT policy allowing
`anon` (public, unauthenticated) clients to list and read ALL files in the
bucket. Public buckets do not need a SELECT policy on `storage.objects` for
object URL access — signed/public URLs work without it — and the broad policy
exposed more data than intended (anyone could enumerate every document).

## Changes
1. Drop the old "Public can read documents" SELECT policy.
2. Create a new authenticated-only SELECT policy so only signed-in users can
   list/read files in the `documents` bucket.
3. Leave the existing INSERT and DELETE policies (authenticated-only) unchanged.

## Security
- SELECT on `storage.objects` for `documents` is now restricted to
  `authenticated` users only. `anon` can no longer list or read objects.
- Public/signed URLs still work for direct object access without a SELECT
  policy; this only removes the ability to enumerate the bucket contents.
*/

DROP POLICY IF EXISTS "Public can read documents" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated can read documents" ON storage.objects;
CREATE POLICY "Authenticated can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
