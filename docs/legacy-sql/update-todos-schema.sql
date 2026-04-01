-- Update todos table to include deadline and note
-- This matches the ToDoTask interface in types.ts

ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS note TEXT;

-- Re-verify indexes if needed (existing todos table usually has these)
CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todos(deadline);
