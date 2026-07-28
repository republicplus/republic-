/*
# Create net_terms_companies table

1. New Tables
- `net_terms_companies`: Companies that offer payment terms (Net 30, Net 60, Net 90, etc.)
  - `id` (uuid, primary key)
  - `company_name` (text, required) — name of the company
  - `contact_name` (text) — contact person
  - `contact_email` (text)
  - `contact_phone` (text)
  - `payment_terms` (text) — e.g. "Net 30", "Net 60", "Net 90"
  - `credit_limit` (numeric) — credit limit in dollars
  - `available_balance` (numeric) — current available balance
  - `category` (text) — e.g. "Materials", "Equipment", "Services"
  - `notes` (text)
  - `status` (text, default 'active') — active / paused / inactive
  - `created_at` (timestamptz)
2. Security
- Enable RLS on `net_terms_companies`.
- Allow anon + authenticated CRUD (admin-mode app, no ownership scoping).
*/

CREATE TABLE IF NOT EXISTS net_terms_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  payment_terms text DEFAULT 'Net 30',
  credit_limit numeric DEFAULT 0,
  available_balance numeric DEFAULT 0,
  category text,
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE net_terms_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_net_terms" ON net_terms_companies;
CREATE POLICY "anon_select_net_terms" ON net_terms_companies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_net_terms" ON net_terms_companies;
CREATE POLICY "anon_insert_net_terms" ON net_terms_companies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_net_terms" ON net_terms_companies;
CREATE POLICY "anon_update_net_terms" ON net_terms_companies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_net_terms" ON net_terms_companies;
CREATE POLICY "anon_delete_net_terms" ON net_terms_companies FOR DELETE
  TO anon, authenticated USING (true);
