-- Budget Allocator V2 - Database Schema
-- Run this SQL in Supabase SQL Editor

-- Step 1: Create table
DROP TABLE IF EXISTS budget_allocations CASCADE;

CREATE TABLE budget_allocations (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,      -- BudgetAllocatorInput: totalBudget, kpi, industry
  assets JSONB NOT NULL,     -- AssetChecklist: hasWebsite, hasCustomerList, hasCreativeAssets
  result JSONB NOT NULL,     -- BudgetDistributionResult: channels, warnings, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for common queries
CREATE INDEX idx_budget_industry ON budget_allocations((input->>'industry'));
CREATE INDEX idx_budget_kpi ON budget_allocations((input->>'kpi'));
CREATE INDEX idx_budget_total ON budget_allocations(((input->>'totalBudget')::bigint));
CREATE INDEX idx_budget_created ON budget_allocations(created_at DESC);

-- Step 3: Enable RLS (permissive for now)
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on budget_allocations" 
  ON budget_allocations FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'budget_allocations';
