-- Add this SQL to create ads_health_analyses table
-- Ads Health Checker feature

DROP TABLE IF EXISTS ads_health_analyses CASCADE;
CREATE TABLE ads_health_analyses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ads_health_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ads_health_analyses" ON ads_health_analyses FOR ALL USING (true) WITH CHECK (true);
