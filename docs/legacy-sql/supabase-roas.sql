-- ROAS Forecaster - Database Schema
-- Run this SQL in Supabase SQL Editor

-- Step 1: Create table
DROP TABLE IF EXISTS roas_scenarios CASCADE;

CREATE TABLE roas_scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  inputs JSONB NOT NULL,      -- {budget, cpc, conversionRate, aov, cogs}
  results JSONB NOT NULL,     -- {revenue, netProfit, roas}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for common queries
CREATE INDEX idx_roas_name ON roas_scenarios(name);
CREATE INDEX idx_roas_created ON roas_scenarios(created_at DESC);

-- Step 3: Enable RLS (permissive for now)
ALTER TABLE roas_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on roas_scenarios" 
  ON roas_scenarios FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roas_scenarios';
