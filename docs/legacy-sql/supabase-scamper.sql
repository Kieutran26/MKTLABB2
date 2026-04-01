-- SCAMPER Ideation - Supabase Schema
-- Design Thinking V2 feature

DROP TABLE IF EXISTS scamper_sessions CASCADE;
CREATE TABLE scamper_sessions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  problem TEXT,
  target_audience TEXT,
  constraints TEXT,
  results JSONB NOT NULL,
  saved_ideas JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_scamper_sessions_created_at ON scamper_sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE scamper_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for your auth setup)
CREATE POLICY "Allow all operations on scamper_sessions" 
  ON scamper_sessions 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
