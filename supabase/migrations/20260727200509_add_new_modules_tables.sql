/*
# Add new module tables: bid_pages, private_bidding_applications, contract_flows + supplier enhancements

1. Supplier enhancements
   - Add category, tags, address, status columns if missing

2. New Tables
   - `bid_pages`: Directory of bidding platforms/websites (free/paid/mixed)
   - `private_bidding_applications`: Form submissions for Done-For-You bidding service
   - `contract_flows`: AI-powered contract analysis sessions with cost/compliance data

3. Security
   - RLS enabled on all new tables with authenticated-user ownership policies (4 policies each)
*/

-- Enhance suppliers table with missing fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='category') THEN
    ALTER TABLE suppliers ADD COLUMN category text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='tags') THEN
    ALTER TABLE suppliers ADD COLUMN tags text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='address') THEN
    ALTER TABLE suppliers ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='status') THEN
    ALTER TABLE suppliers ADD COLUMN status text DEFAULT 'activo';
  END IF;
END $$;

-- Bid Pages table
CREATE TABLE IF NOT EXISTS bid_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  type text DEFAULT 'free',
  category text,
  contract_types text,
  country_state text,
  subscription_price numeric,
  notes text,
  tags text,
  status text DEFAULT 'activa',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bid_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bid_pages" ON bid_pages;
CREATE POLICY "select_own_bid_pages" ON bid_pages FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bid_pages" ON bid_pages;
CREATE POLICY "insert_own_bid_pages" ON bid_pages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bid_pages" ON bid_pages;
CREATE POLICY "update_own_bid_pages" ON bid_pages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bid_pages" ON bid_pages;
CREATE POLICY "delete_own_bid_pages" ON bid_pages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Private Bidding Applications table
CREATE TABLE IF NOT EXISTS private_bidding_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  company_name text,
  phone text,
  email text,
  website text,
  product_service text,
  industry text,
  registered_gov boolean DEFAULT false,
  sam_active boolean DEFAULT false,
  has_ein boolean DEFAULT false,
  prior_experience boolean DEFAULT false,
  max_invest numeric,
  min_contract numeric,
  states text,
  contract_type text,
  wholesale_capacity boolean DEFAULT false,
  has_suppliers boolean DEFAULT false,
  notes text,
  plan_selected text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE private_bidding_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pba" ON private_bidding_applications;
CREATE POLICY "select_own_pba" ON private_bidding_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pba" ON private_bidding_applications;
CREATE POLICY "insert_own_pba" ON private_bidding_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_pba" ON private_bidding_applications;
CREATE POLICY "update_own_pba" ON private_bidding_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_pba" ON private_bidding_applications;
CREATE POLICY "delete_own_pba" ON private_bidding_applications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Contract Flows table
CREATE TABLE IF NOT EXISTS contract_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_name text,
  contract_type text DEFAULT 'producto',
  status text DEFAULT 'nuevo',
  input_text text,
  extracted_data jsonb DEFAULT '{}',
  suppliers_data jsonb DEFAULT '[]',
  cost_analysis jsonb DEFAULT '{}',
  compliance_data jsonb DEFAULT '{}',
  quote_data jsonb DEFAULT '{}',
  recommended_price numeric,
  estimated_cost numeric,
  estimated_profit numeric,
  margin numeric,
  compliance_level text,
  close_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contract_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_flows" ON contract_flows;
CREATE POLICY "select_own_flows" ON contract_flows FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_flows" ON contract_flows;
CREATE POLICY "insert_own_flows" ON contract_flows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_flows" ON contract_flows;
CREATE POLICY "update_own_flows" ON contract_flows FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_flows" ON contract_flows;
CREATE POLICY "delete_own_flows" ON contract_flows FOR DELETE TO authenticated USING (auth.uid() = user_id);
