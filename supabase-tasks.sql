-- To-Do List - Supabase Schema
-- Homepage task management feature

DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for your auth setup)
CREATE POLICY "Allow all operations on tasks" 
  ON tasks 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
