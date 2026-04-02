-- English Learning Feature Migration
-- Tables: vocab_sets, words, translation_history, learning_plans

-- Table 1: Vocab Sets
DROP TABLE IF EXISTS vocab_sets CASCADE;
CREATE TABLE vocab_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Words
DROP TABLE IF EXISTS words CASCADE;
CREATE TABLE words (
  id TEXT PRIMARY KEY,
  set_id TEXT REFERENCES vocab_sets(id) ON DELETE CASCADE,
  english TEXT NOT NULL,
  vietnamese TEXT NOT NULL,
  example TEXT,
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_words_set_id ON words(set_id);
CREATE INDEX idx_words_starred ON words(starred) WHERE starred = true;

-- Table 3: Translation History
DROP TABLE IF EXISTS translation_history CASCADE;
CREATE TABLE translation_history (
  id TEXT PRIMARY KEY,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: Learning Plans
DROP TABLE IF EXISTS learning_plans CASCADE;
CREATE TABLE learning_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;

-- Permissive policies for all tables
CREATE POLICY "Allow all operations on vocab_sets" ON vocab_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on words" ON words FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on translation_history" ON translation_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on learning_plans" ON learning_plans FOR ALL USING (true) WITH CHECK (true);
