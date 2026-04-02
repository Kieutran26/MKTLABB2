-- Add this SQL to create pricing_analyses table
-- Pricing Analyzer feature #12

DROP TABLE IF EXISTS pricing_analyses CASCADE;
CREATE TABLE pricing_analyses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pricing_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on pricing_analyses" ON pricing_analyses FOR ALL USING (true) WITH CHECK (true);
