/*
# Open all tables to anon + authenticated (admin mode support)

## Why
The app has an "admin mode" that grants access without a Supabase login session.
When admin mode is active, the frontend talks to Supabase with the anon key,
so `auth.uid()` returns NULL and every `authenticated`-only policy blocks all
reads and writes — the app looks empty even though the data is still in the
database.

## Changes
- For every public table, replace the four existing `authenticated`-only
  CRUD policies with `TO anon, authenticated` equivalents using `USING (true)`
  / `WITH CHECK (true)`.
- This is a single-tenant app (one admin / one operator), so all data is
  intentionally shared across the anon + authenticated roles.
- No table structures, columns, or data are modified — only policies.

## Tables affected (all public tables):
profiles, companies, contracts, contract_flows, contract_checklist,
contract_timeline, contract_invoices, suppliers, bid_pages, wallet_transactions,
capital_sources, capital_providers, investors, insurers, investment_pools,
investments, pool_participations, opportunities, private_bids,
private_bidding_applications, risk_assessments, documents, tools_links,
notifications, ai_chats, ai_messages
*/

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles','companies','contracts','contract_flows','contract_checklist',
    'contract_timeline','contract_invoices','suppliers','bid_pages','wallet_transactions',
    'capital_sources','capital_providers','investors','insurers','investment_pools',
    'investments','pool_participations','opportunities','private_bids',
    'private_bidding_applications','risk_assessments','documents','tools_links',
    'notifications','ai_chats','ai_messages'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'select_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (true);', 'select_all', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'insert_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK (true);', 'insert_all', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'update_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', 'update_all', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'delete_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING (true);', 'delete_all', t);
  END LOOP;
END $$;
