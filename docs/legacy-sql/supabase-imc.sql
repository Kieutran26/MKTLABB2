-- IMC Planner V2 - Strategic Framework Migration
-- IMPORTANT: Run this to fix UUID error

-- Step 1: Drop old table completely
DROP TABLE IF EXISTS imc_plans CASCADE;

-- Step 2: Create fresh table with TEXT id (not UUID)
CREATE TABLE imc_plans (
  id TEXT PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  product TEXT NOT NULL,
  industry TEXT,
  total_budget BIGINT NOT NULL,
  timeline_weeks INTEGER DEFAULT 8,
  strategic_foundation JSONB NOT NULL,
  imc_execution JSONB NOT NULL,
  validation_warnings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_imc_brand ON imc_plans(brand);
CREATE INDEX idx_imc_industry ON imc_plans(industry);
CREATE INDEX idx_imc_budget ON imc_plans(total_budget);
CREATE INDEX idx_imc_created ON imc_plans(created_at DESC);

-- Step 4: Disable RLS
ALTER TABLE imc_plans DISABLE ROW LEVEL SECURITY;

-- Step 5: Verify table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'imc_plans';
