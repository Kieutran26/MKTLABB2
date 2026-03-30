-- To-Do List Feature Migration
-- Table: todos

-- Drop existing table completely to avoid UUID conflicts
DROP TABLE IF EXISTS todos CASCADE;

-- Create with TEXT id (not UUID)
CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_priority ON todos(priority);

-- Disable RLS (no auth yet)
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
