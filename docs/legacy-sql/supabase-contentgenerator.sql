-- Add this SQL to create content_history table (FIXED)
-- Content Generator feature #13

DROP TABLE IF EXISTS content_history CASCADE;
CREATE TABLE content_history (
  id TEXT PRIMARY KEY,
  original_content TEXT NOT NULL,
  selected_platforms JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on content_history" ON content_history FOR ALL USING (true) WITH CHECK (true);
