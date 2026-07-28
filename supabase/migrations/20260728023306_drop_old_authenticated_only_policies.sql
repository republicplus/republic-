/*
# Remove old authenticated-only policies

## Why
After adding the new `TO anon, authenticated` policies, the old
`authenticated`-only policies remain and are redundant. While having both
does not break anything (PostgreSQL ORs them), removing them keeps the policy
set clean and avoids confusion.

## Changes
- Drops every remaining `authenticated`-only policy from all public tables.
- No data or schema is affected.
*/

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles::text = '{authenticated}'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
