/*
# Add RLS policies to private_bids

## Why
The `private_bids` table has RLS enabled but no policies, which blocks all
access — no user can read or write their own private bid applications.

## Changes
- Add 4 owner-scoped CRUD policies (select/insert/update/delete) using
  `auth.uid() = user_id`, scoped to `TO authenticated`.

## Security
- Each authenticated user can only access their own private bid rows.
- No anon access.
*/

DROP POLICY IF EXISTS "select_own" ON private_bids;
CREATE POLICY "select_own" ON private_bids FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own" ON private_bids;
CREATE POLICY "insert_own" ON private_bids FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own" ON private_bids;
CREATE POLICY "update_own" ON private_bids FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own" ON private_bids;
CREATE POLICY "delete_own" ON private_bids FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
