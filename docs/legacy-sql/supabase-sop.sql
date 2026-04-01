-- SOP Builder - Supabase Schema
-- Lean Management V2 feature

DROP TABLE IF EXISTS sops CASCADE;
CREATE TABLE sops (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  sop_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_sops_created_at ON sops(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for your auth setup)
CREATE POLICY "Allow all operations on sops" 
  ON sops 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
