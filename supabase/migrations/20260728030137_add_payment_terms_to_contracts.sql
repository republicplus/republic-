/*
# Add payment_terms to contracts

1. Modified Tables
- `contracts`: adds `payment_terms` text column (e.g. "Net 30", "Net 60", "Net 90") to track when payment is expected after delivery/invoicing.
2. Security
- No policy changes — existing RLS already covers the new column.
*/

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_terms text;
