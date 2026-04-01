-- ============================================
-- EMAIL DESIGNS TABLE
-- For Visual Email Builder templates
-- ============================================

DROP TABLE IF EXISTS email_designs CASCADE;
CREATE TABLE email_designs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  doc JSONB NOT NULL,  -- stores EmailDocument (blocks + settings)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on email_designs" ON email_designs FOR ALL USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_email_designs_updated_at ON email_designs(updated_at DESC);
