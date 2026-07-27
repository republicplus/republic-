/*
# Remove SELECT listing policy from documents bucket

## Overview
The `documents` bucket still allowed any authenticated client to LIST all
files in the bucket via a broad SELECT policy on `storage.objects`. Public
buckets do not need a SELECT policy for object URL access — public/signed
URLs resolve without it — and the broad policy let any signed-in user
enumerate every document, exposing more data than intended.

## Changes
1. Drop the "Authenticated can read documents" SELECT policy entirely.
2. No replacement SELECT policy: direct object access via public/signed URLs
   continues to work; only the ability to list bucket contents is removed.
3. INSERT and DELETE policies (authenticated-only) are unchanged.

## Security
- `storage.objects` for `documents` no longer has any SELECT policy, so no
  client (anon or authenticated) can list bucket contents.
- Direct object URL access is unaffected — URLs still resolve to the object.
*/

DROP POLICY IF EXISTS "Authenticated can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can read documents" ON storage.objects;
