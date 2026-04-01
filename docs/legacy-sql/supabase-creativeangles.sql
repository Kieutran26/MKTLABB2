-- Creative Angle Explorer - Supabase Schema
-- Performance Creative V2 feature

DROP TABLE IF EXISTS creative_angles CASCADE;

CREATE TABLE creative_angles (
  id TEXT PRIMARY KEY,
  name TEXT,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_creative_angles_created_at ON creative_angles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE creative_angles ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth required for this tool)
CREATE POLICY "Allow all on creative_angles"
  ON creative_angles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
