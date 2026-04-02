-- Plan Management Feature
-- Table: plans

DROP TABLE IF EXISTS plans CASCADE;

CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  website TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'VNĐ',
  email TEXT,
  payment_date DATE,
  next_payment_date DATE NOT NULL,
  card_info TEXT,
  billing_cycle TEXT DEFAULT 'monthly',
  icon TEXT DEFAULT 'global',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_next_payment ON plans(next_payment_date);

-- Disable RLS for now (utility feature)
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
