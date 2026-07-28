/*
# Expand contract_flows with full analysis sections

## Why
The Contract Analyzer panel needs to persist structured AI analysis across six
sections: executive analysis, technical requirements, supplier review,
financial analysis, and risk/final decision. The existing table only stores
extracted_data, cost_analysis, compliance_data. We add dedicated JSONB columns
for each new section plus key scalar fields used by the panel header.

## Changes to `contract_flows`
- `solicitation_number` text — solicitation / bid number
- `agency` text — contracting agency
- `naics` text — NAICS code
- `due_date` date — proposal due date
- `award_date` date — estimated award date
- `delivery_date` date — delivery date
- `total_value` numeric — estimated contract value
- `executive_analysis` jsonb — AI executive summary block
- `technical_requirements` jsonb — scope + compliance checklist
- `supplier_review` jsonb — supplier and execution review
- `financial_analysis` jsonb — financial analysis block
- `risk_decision` jsonb — risk and final decision block

## Security
- No new tables. RLS already enabled with owner-scoped policies.
- No policy changes needed.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='solicitation_number') THEN
    ALTER TABLE contract_flows ADD COLUMN solicitation_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='agency') THEN
    ALTER TABLE contract_flows ADD COLUMN agency text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='naics') THEN
    ALTER TABLE contract_flows ADD COLUMN naics text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='due_date') THEN
    ALTER TABLE contract_flows ADD COLUMN due_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='award_date') THEN
    ALTER TABLE contract_flows ADD COLUMN award_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='delivery_date') THEN
    ALTER TABLE contract_flows ADD COLUMN delivery_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='total_value') THEN
    ALTER TABLE contract_flows ADD COLUMN total_value numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='executive_analysis') THEN
    ALTER TABLE contract_flows ADD COLUMN executive_analysis jsonb DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='technical_requirements') THEN
    ALTER TABLE contract_flows ADD COLUMN technical_requirements jsonb DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='supplier_review') THEN
    ALTER TABLE contract_flows ADD COLUMN supplier_review jsonb DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='financial_analysis') THEN
    ALTER TABLE contract_flows ADD COLUMN financial_analysis jsonb DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_flows' AND column_name='risk_decision') THEN
    ALTER TABLE contract_flows ADD COLUMN risk_decision jsonb DEFAULT '{}';
  END IF;
END $$;