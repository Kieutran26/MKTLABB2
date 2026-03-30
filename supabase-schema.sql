-- ============================================
-- OPTIMKT - COMPLETE SUPABASE SCHEMA
-- All database tables for migrated features
-- ============================================

-- ===========================================
-- MIGRATED FEATURES (Already implemented)
-- ===========================================

-- 1. BRAND VAULT TABLE
DROP TABLE IF EXISTS brands CASCADE;
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  core_values JSONB,
  target_audience JSONB,
  brand_personality JSONB,
  visual_identity JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on brands" ON brands FOR ALL USING (true) WITH CHECK (true);


-- 2. SAVED PROMPTS TABLE
DROP TABLE IF EXISTS prompts CASCADE;
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  ai_model TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on prompts" ON prompts FOR ALL USING (true) WITH CHECK (true);


-- 3. CUSTOMER JOURNEY TABLE
DROP TABLE IF EXISTS customer_journeys CASCADE;
CREATE TABLE customer_journeys (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  journey_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE customer_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on customer_journeys" ON customer_journeys FOR ALL USING (true) WITH CHECK (true);


-- 4. EMOTION MAPS TABLE
DROP TABLE IF EXISTS emotion_maps CASCADE;
CREATE TABLE emotion_maps (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE emotion_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on emotion_maps" ON emotion_maps FOR ALL USING (true) WITH CHECK (true);


-- 5. AUTO BRIEFS TABLE
DROP TABLE IF EXISTS auto_briefs CASCADE;
CREATE TABLE auto_briefs (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  brief_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE auto_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on auto_briefs" ON auto_briefs FOR ALL USING (true) WITH CHECK (true);


-- ===========================================
-- READY TO MIGRATE (SQL schemas prepared)
-- ===========================================

-- 6. SOP BUILDER TABLE
DROP TABLE IF EXISTS sops CASCADE;
CREATE TABLE sops (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  sop_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on sops" ON sops FOR ALL USING (true) WITH CHECK (true);


-- 7. HOOK GENERATOR TABLE
DROP TABLE IF EXISTS hook_sets CASCADE;
CREATE TABLE hook_sets (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  hooks_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hook_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on hook_sets" ON hook_sets FOR ALL USING (true) WITH CHECK (true);


-- 8. INSIGHT FINDER TABLE
DROP TABLE IF EXISTS insights CASCADE;
CREATE TABLE insights (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  insight_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on insights" ON insights FOR ALL USING (true) WITH CHECK (true);


-- 9. MASTERMIND STRATEGY TABLE
DROP TABLE IF EXISTS mastermind_strategies CASCADE;
CREATE TABLE mastermind_strategies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  objective TEXT NOT NULL,
  perception TEXT NOT NULL,
  tone TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mastermind_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on mastermind_strategies" ON mastermind_strategies FOR ALL USING (true) WITH CHECK (true);


-- 10. STRATEGIC MODEL GENERATOR TABLE
DROP TABLE IF EXISTS strategic_models CASCADE;
CREATE TABLE strategic_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  product_info TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE strategic_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on strategic_models" ON strategic_models FOR ALL USING (true) WITH CHECK (true);


-- ===========================================
-- NO SAVE FEATURE (No migration needed)
-- ===========================================
-- Pricing Analyzer - No localStorage/save feature
-- Persona Builder - Uses BrandContext, not localStorage


-- ============================================
-- MIGRATION STATUS
-- ============================================
-- ✅ Migrated & Ready (10 tables): brands, prompts, customer_journeys, emotion_maps, auto_briefs, sops, hook_sets, insights, mastermind_strategies, strategic_models
-- 
-- Total tables: 10
-- All RLS policies enabled with permissive access
-- ============================================
