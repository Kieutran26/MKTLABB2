-- Add this SQL to create brand_positionings table
-- Run in Supabase SQL Editor after other tables

DROP TABLE IF EXISTS brand_positionings CASCADE;
CREATE TABLE brand_positionings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_positionings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on brand_positionings" ON brand_positionings FOR ALL USING (true) WITH CHECK (true);
