-- Add this SQL to create ab_tests table
-- A/B Testing Calculator feature

DROP TABLE IF EXISTS ab_tests CASCADE;
CREATE TABLE ab_tests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ab_tests" ON ab_tests FOR ALL USING (true) WITH CHECK (true);
