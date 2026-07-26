/*
# ArcaBid Core Schema

## Overview
Multi-tenant schema for ArcaBid, a government-contracting OS with roles:
contractor, investor, insurer, admin. All tables are owner-scoped via
auth.uid() with RLS enabled.

## New Tables
- profiles, companies, contracts, contract_checklist, contract_timeline,
  contract_invoices, wallet_transactions, suppliers, capital_providers,
  investors, opportunities, investment_pools, pool_participations,
  investments, insurers, risk_assessments, ai_chats, ai_messages,
  documents, notifications.

## Security
- RLS enabled on every table.
- Owner-scoped CRUD policies (auth.uid() = user_id) for user-facing tables.
- Child tables scoped through parent ownership.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  avatar_url text,
  email text,
  phone text,
  address text,
  state text,
  country text DEFAULT 'United States',
  licenses text,
  specialty text,
  digital_signature text,
  electronic_signature text,
  role text NOT NULL DEFAULT 'contractor',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  dba text,
  ein text,
  reseller_permit text,
  naics_codes text,
  psc_codes text,
  uei text,
  duns text,
  sam_registration boolean DEFAULT false,
  sam_expiration date,
  cage_code text,
  small_business boolean DEFAULT false,
  minority_owned boolean DEFAULT false,
  woman_owned boolean DEFAULT false,
  veteran_owned boolean DEFAULT false,
  eight_a boolean DEFAULT false,
  hubzone boolean DEFAULT false,
  wosb boolean DEFAULT false,
  edwosb boolean DEFAULT false,
  sdvosb boolean DEFAULT false,
  iso_certifications text,
  licenses text,
  website text,
  email text,
  phone text,
  address text,
  operating_states text,
  years_in_operation int,
  employee_count int,
  financial_capacity numeric,
  credit_lines numeric,
  insurance text,
  bonding_capacity numeric,
  bank_reference text,
  past_performance text,
  capability_statement text,
  certifications text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- contracts
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  title text NOT NULL,
  agency text,
  solicitation_number text,
  contract_number text,
  type text,
  product text,
  service text,
  naics text,
  psc text,
  status text NOT NULL DEFAULT 'pending',
  publication_date date,
  due_date date,
  award_date date,
  delivery_date date,
  payment_date date,
  delivery_address text,
  delivery_city text,
  delivery_state text,
  delivery_zip text,
  quantity numeric,
  unit_price numeric,
  total_value numeric,
  profit_pct numeric,
  fixed_profit numeric,
  costs numeric,
  margin numeric,
  supplier text,
  tracking text,
  government_client text,
  contract_officer text,
  co_email text,
  cor text,
  subcontractors text,
  notes text,
  tags text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- contract_checklist
CREATE TABLE IF NOT EXISTS contract_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  label text NOT NULL,
  done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- contract_timeline
CREATE TABLE IF NOT EXISTS contract_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event text NOT NULL,
  event_date date,
  created_at timestamptz DEFAULT now()
);

-- contract_invoices
CREATE TABLE IF NOT EXISTS contract_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  invoice_number text,
  amount numeric,
  status text DEFAULT 'pending',
  due_date date,
  paid_date date,
  created_at timestamptz DEFAULT now()
);

-- wallet_transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  type text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'completed',
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  type text,
  website text,
  contact text,
  email text,
  phone text,
  net_terms int,
  states text,
  products text,
  notes text,
  rating int DEFAULT 0,
  favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- capital_providers
CREATE TABLE IF NOT EXISTS capital_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text,
  amount_min numeric,
  amount_max numeric,
  interest_rate text,
  term text,
  requirements text,
  website text,
  contact text,
  notes text,
  favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- investors
CREATE TABLE IF NOT EXISTS investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  whatsapp text,
  email text,
  address text,
  company text,
  available_capital numeric,
  max_capital numeric,
  interests text,
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  product text,
  service text,
  total_value numeric,
  capital_required numeric,
  expected_award_date date,
  estimated_return_time text,
  split_model text,
  split_detail text,
  estimated_profit numeric,
  risk text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

-- investment_pools
CREATE TABLE IF NOT EXISTS investment_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target numeric,
  capital_required numeric,
  capital_raised numeric DEFAULT 0,
  participants int DEFAULT 0,
  status text DEFAULT 'open',
  close_date date,
  estimated_return text,
  participation_structure text,
  terms text,
  documents text,
  created_at timestamptz DEFAULT now()
);

-- pool_participations
CREATE TABLE IF NOT EXISTS pool_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES investment_pools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  signed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- investments (applications to opportunities or pools)
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  pool_id uuid REFERENCES investment_pools(id) ON DELETE CASCADE,
  investor_id uuid REFERENCES investors(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  signed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- insurers
CREATE TABLE IF NOT EXISTS insurers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  available_capital numeric,
  max_capital numeric,
  allowed_sectors text,
  commission numeric,
  risk_level text,
  history text,
  contact text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- risk_assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  max_bid_capacity numeric,
  recommended_capacity numeric,
  available_capital numeric,
  committed_capital numeric,
  risk_level text,
  recommendation text,
  created_at timestamptz DEFAULT now()
);

-- ai_chats
CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  folder text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ai_messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  folder text,
  tags text,
  file_url text,
  version text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profiles: user owns their own profile row (id = auth.uid())
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Generic owner-scoped CRUD for user_id tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','contracts','wallet_transactions','suppliers','capital_providers',
    'investors','opportunities','investments','insurers','investment_pools',
    'pool_participations','risk_assessments','ai_chats','documents','notifications'
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

-- ai_messages: scoped through ai_chats ownership
DROP POLICY IF EXISTS "select_own_messages" ON ai_messages;
CREATE POLICY "select_own_messages" ON ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_chats WHERE ai_chats.id = ai_messages.chat_id AND ai_chats.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_messages" ON ai_messages;
CREATE POLICY "insert_own_messages" ON ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM ai_chats WHERE ai_chats.id = ai_messages.chat_id AND ai_chats.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_messages" ON ai_messages;
CREATE POLICY "delete_own_messages" ON ai_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_chats WHERE ai_chats.id = ai_messages.chat_id AND ai_chats.user_id = auth.uid()));

-- contract children: scoped through contracts ownership
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user ON ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user ON opportunities(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'contractor'),
          NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
