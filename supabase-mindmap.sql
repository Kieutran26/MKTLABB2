-- Mindmap AI - Supabase Schema
-- Knowledge Architect V2 feature

DROP TABLE IF EXISTS mindmaps CASCADE;
CREATE TABLE mindmaps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  viewport JSONB,
  goal TEXT,
  audience TEXT,
  depth INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_mindmaps_updated_at ON mindmaps(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for your auth setup)
CREATE POLICY "Allow all operations on mindmaps" 
  ON mindmaps 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
