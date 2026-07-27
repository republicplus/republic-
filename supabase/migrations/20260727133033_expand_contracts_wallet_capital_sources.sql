/*
# Expand contracts + wallet_transactions + add capital_sources table

## Overview
1. Add detailed fields to `contracts` per the ArcaBid CRM spec:
   priority, bid_value, capital_required, estimated_cost, estimated_profit,
   start_date, delivery_contact, delivery_phone, delivery_method,
   supplier_secondary, quote_status, purchase_order_created,
   capital_source, investor_id, insured_capital, financing_approved,
   health_score, responsible, risk_notes, next_steps.
2. Expand `wallet_transactions` with: company, contract_id (exists), category,
   client_supplier, payment_method, document_url, notes.
3. New table `capital_sources` for tracking capital sources (own, credit line,
   investor, financing) with available amount.
*/

-- ========== contracts additions ==========
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS priority text DEFAULT 'media';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS bid_value numeric;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS capital_required numeric;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS estimated_cost numeric;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS estimated_profit numeric;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS delivery_contact text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS delivery_phone text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS delivery_method text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_secondary text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS quote_status text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS purchase_order_created boolean DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS capital_source text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS investor_id uuid;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS insured_capital numeric;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS financing_approved boolean DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS responsible text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS risk_notes text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS next_steps text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS unit_of_measure text;

-- ========== wallet_transactions additions ==========
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS client_supplier text;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS notes text;

-- ========== capital_sources table ==========
CREATE TABLE IF NOT EXISTS capital_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'own',
  available_amount numeric DEFAULT 0,
  max_amount numeric,
  interest_rate text,
  term text,
  contact text,
  email text,
  phone text,
  notes text,
  source_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE capital_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON capital_sources;
CREATE POLICY "select_own" ON capital_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own" ON capital_sources;
CREATE POLICY "insert_own" ON capital_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own" ON capital_sources;
CREATE POLICY "update_own" ON capital_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own" ON capital_sources;
CREATE POLICY "delete_own" ON capital_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_capital_sources_user ON capital_sources(user_id);
