-- Auto Brief Generator - Supabase Schema
-- Budget-conscious V2 feature

DROP TABLE IF EXISTS auto_briefs CASCADE;
CREATE TABLE auto_briefs (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  brief_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_auto_briefs_created_at ON auto_briefs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE auto_briefs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for your auth setup)
CREATE POLICY "Allow all operations on auto_briefs" 
  ON auto_briefs 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
