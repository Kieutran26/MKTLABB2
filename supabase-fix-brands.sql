-- Fix Brand Vault Schema
-- Run this to update the brands table with missing columns

-- Drop existing table and recreate with correct schema
DROP TABLE IF EXISTS brands CASCADE;

CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  
  -- Identity fields
  name TEXT NOT NULL,
  logo_url TEXT,
  logos JSONB,
  colors JSONB,
  font_family TEXT,
  
  -- Strategy fields
  vision TEXT,
  mission TEXT,
  core_values JSONB,
  tone_of_voice TEXT,
  short_term_goals JSONB,
  long_term_goals JSONB,
  target_objectives JSONB,
  
  -- Audience fields
  demographics JSONB,
  psychographics JSONB,
  pain_points JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on brands" ON brands FOR ALL USING (true) WITH CHECK (true);
