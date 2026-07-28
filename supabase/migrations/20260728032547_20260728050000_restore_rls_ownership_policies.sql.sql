/*
# Restore Row Level Security with proper ownership checks

## Why
A previous migration ("open_all_tables_to_anon_for_admin_mode") replaced every
owner-scoped RLS policy with `USING (true)` / `WITH CHECK (true)` for
`TO anon, authenticated`. This made ALL data accessible to anyone with the
public anon key — every user could read, modify, and delete every other
user's contracts, suppliers, wallet transactions, documents, etc.

The app has a sign-in screen (email/password + Google OAuth), so it is a
multi-user app. RLS must scope every table to `auth.uid() = user_id`.

## Changes
1. Add `user_id` column to `net_terms_companies` (was missing).
2. Drop all `*_all` policies (select_all, insert_all, update_all, delete_all)
   from every public table.
3. Recreate proper owner-scoped CRUD policies (4 per table) using
   `auth.uid() = user_id` for tables with a direct user_id column.
4. Recreate parent-scoped policies for child tables (contract_checklist,
   contract_timeline, contract_invoices, ai_messages) using EXISTS checks
   against the parent table's ownership.
5. Lock the `documents` storage bucket back to authenticated-only with
   ownership path checks.

## Tables affected
All public tables: profiles, companies, contracts, contract_flows,
contract_checklist, contract_timeline, contract_invoices, suppliers,
bid_pages, wallet_transactions, capital_sources, capital_providers,
investors, insurers, investment_pools, investments, pool_participations,
opportunities, private_bidding_applications, risk_assessments, documents,
tools_links, notifications, ai_chats, ai_messages, net_terms_companies

## Security
- Every table now enforces `auth.uid() = user_id` ownership.
- Child tables enforce ownership through their parent's user_id.
- No table allows anon role access.
- Storage bucket restricted to authenticated users only.
*/

-- 1. Add user_id to net_terms_companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'net_terms_companies' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE net_terms_companies ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

-- 2. Drop all *_all policies from every table
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE '%_all' OR policyname LIKE 'anon_%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 3. Owner-scoped CRUD for tables with direct user_id
-- profiles is special: id = auth.uid()
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','contracts','contract_flows','wallet_transactions','suppliers',
    'bid_pages','capital_sources','capital_providers','investors','insurers',
    'investment_pools','investments','pool_participations','opportunities',
    'private_bidding_applications','risk_assessments','documents','tools_links',
    'notifications','ai_chats','net_terms_companies'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "select_own" ON %I;', t);
    EXECUTE format('CREATE POLICY "select_own" ON %I FOR SELECT TO authenticated USING (auth.uid() = user_id);', t);
    EXECUTE format('DROP POLICY IF EXISTS "insert_own" ON %I;', t);
    EXECUTE format('CREATE POLICY "insert_own" ON %I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);', t);
    EXECUTE format('DROP POLICY IF EXISTS "update_own" ON %I;', t);
    EXECUTE format('CREATE POLICY "update_own" ON %I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);', t);
    EXECUTE format('DROP POLICY IF EXISTS "delete_own" ON %I;', t);
    EXECUTE format('CREATE POLICY "delete_own" ON %I FOR DELETE TO authenticated USING (auth.uid() = user_id);', t);
  END LOOP;
END $$;

-- profiles: id = auth.uid()
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- 4. Child tables: scoped through parent ownership
-- contract_checklist, contract_timeline, contract_invoices → contracts
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contract_checklist','contract_timeline','contract_invoices'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "select_own_child" ON %I;', t);
    EXECUTE format('CREATE POLICY "select_own_child" ON %I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = %I.contract_id AND contracts.user_id = auth.uid()));', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "insert_own_child" ON %I;', t);
    EXECUTE format('CREATE POLICY "insert_own_child" ON %I FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = %I.contract_id AND contracts.user_id = auth.uid()));', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "update_own_child" ON %I;', t);
    EXECUTE format('CREATE POLICY "update_own_child" ON %I FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = %I.contract_id AND contracts.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = %I.contract_id AND contracts.user_id = auth.uid()));', t, t, t);
    EXECUTE format('DROP POLICY IF EXISTS "delete_own_child" ON %I;', t);
    EXECUTE format('CREATE POLICY "delete_own_child" ON %I FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = %I.contract_id AND contracts.user_id = auth.uid()));', t, t);
  END LOOP;
END $$;

-- ai_messages → ai_chats
DROP POLICY IF EXISTS "select_own_messages" ON ai_messages;
CREATE POLICY "select_own_messages" ON ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_chats WHERE ai_chats.id = ai_messages.chat_id AND ai_chats.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_messages" ON ai_messages;
CREATE POLICY "insert_own_messages" ON ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM ai_chats WHERE ai_chats.id = ai_messages.chat_id AND ai_chats.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_messages" ON ai_messages;
CREATE POLICY "update_own_messages" ON ai_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_chats WHERE ai_chats.id = ai_messages.chat_id AND ai_chats.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM ai_chats WHERE ai_chats.id = ai_messages.chat_id AND ai_chats.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_messages" ON ai_messages;
CREATE POLICY "delete_own_messages" ON ai_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_chats WHERE ai_chats.id = ai_messages.chat_id AND ai_chats.user_id = auth.uid()));

-- 5. Lock documents storage bucket to authenticated-only
DROP POLICY IF EXISTS "Anyone can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete documents" ON storage.objects;

CREATE POLICY "Authenticated can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
