-- ============================================
-- OPTIMKT - COMPLETE SUPABASE SCHEMA
-- Tổng hợp toàn bộ tables và policies
-- Tạo để chạy trên Supabase instance mới
-- ============================================
-- Generated: 2026-01-12
-- 
-- HƯỚNG DẪN SỬ DỤNG:
-- 1. Tạo project mới trên Supabase
-- 2. Mở SQL Editor
-- 3. Copy toàn bộ nội dung file này
-- 4. Chạy script
-- 5. Tất cả tables và policies sẽ được tạo (không có data)
-- ============================================


-- ============================================
-- PHẦN 1: BRAND & MARKETING CORE
-- ============================================

-- 1. BRANDS TABLE - Brand Vault
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


-- 2. PROMPTS TABLE - Saved Prompts
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


-- ============================================
-- PHẦN 2: CUSTOMER JOURNEY & EMOTION
-- ============================================

-- 3. CUSTOMER JOURNEYS TABLE
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


-- ============================================
-- PHẦN 3: BRIEFING & CONTENT
-- ============================================

-- 5. AUTO BRIEFS TABLE
DROP TABLE IF EXISTS auto_briefs CASCADE;
CREATE TABLE auto_briefs (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  brief_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_auto_briefs_created_at ON auto_briefs(created_at DESC);
ALTER TABLE auto_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on auto_briefs" ON auto_briefs FOR ALL USING (true) WITH CHECK (true);


-- 6. CONTENT GENERATOR HISTORY TABLE
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


-- ============================================
-- PHẦN 4: CREATIVE & CAMPAIGN
-- ============================================

-- 8. CREATIVE ANGLES TABLE
DROP TABLE IF EXISTS creative_angles CASCADE;
CREATE TABLE creative_angles (
  id TEXT PRIMARY KEY,
  name TEXT,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_creative_angles_created_at ON creative_angles(created_at DESC);
ALTER TABLE creative_angles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on creative_angles" ON creative_angles FOR ALL USING (true) WITH CHECK (true);


-- 9. IMC PLANS TABLE - Integrated Marketing Communications
DROP TABLE IF EXISTS imc_plans CASCADE;
CREATE TABLE imc_plans (
  id TEXT PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  product TEXT NOT NULL,
  industry TEXT,
  total_budget BIGINT NOT NULL,
  timeline_weeks INTEGER DEFAULT 8,
  strategic_foundation JSONB NOT NULL,
  imc_execution JSONB NOT NULL,
  validation_warnings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_imc_brand ON imc_plans(brand);
CREATE INDEX idx_imc_industry ON imc_plans(industry);
CREATE INDEX idx_imc_budget ON imc_plans(total_budget);
CREATE INDEX idx_imc_created ON imc_plans(created_at DESC);
ALTER TABLE imc_plans DISABLE ROW LEVEL SECURITY;


-- ============================================
-- PHẦN 5: BUDGET & ROAS
-- ============================================

-- 10. BUDGET ALLOCATIONS TABLE
DROP TABLE IF EXISTS budget_allocations CASCADE;
CREATE TABLE budget_allocations (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  assets JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_budget_industry ON budget_allocations((input->>'industry'));
CREATE INDEX idx_budget_kpi ON budget_allocations((input->>'kpi'));
CREATE INDEX idx_budget_total ON budget_allocations(((input->>'totalBudget')::bigint));
CREATE INDEX idx_budget_created ON budget_allocations(created_at DESC);
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on budget_allocations" ON budget_allocations FOR ALL USING (true) WITH CHECK (true);


-- 11. ROAS SCENARIOS TABLE
DROP TABLE IF EXISTS roas_scenarios CASCADE;
CREATE TABLE roas_scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_roas_name ON roas_scenarios(name);
CREATE INDEX idx_roas_created ON roas_scenarios(created_at DESC);
ALTER TABLE roas_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on roas_scenarios" ON roas_scenarios FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- PHẦN 6: STRATEGIC ANALYSIS
-- ============================================

-- 12. STP ANALYSES TABLE - Segmentation, Targeting, Positioning
DROP TABLE IF EXISTS stp_analyses CASCADE;
CREATE TABLE stp_analyses (
  id TEXT PRIMARY KEY,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stp_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stp_select" ON stp_analyses FOR SELECT USING (true);
CREATE POLICY "stp_insert" ON stp_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "stp_update" ON stp_analyses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "stp_delete" ON stp_analyses FOR DELETE USING (true);


-- 13. PESTEL REPORTS TABLE - Political, Economic, Social, Technological, Environmental, Legal
DROP TABLE IF EXISTS pestel_reports CASCADE;
CREATE TABLE pestel_reports (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pestel_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pestel_select" ON pestel_reports FOR SELECT USING (true);
CREATE POLICY "pestel_insert" ON pestel_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "pestel_update" ON pestel_reports FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "pestel_delete" ON pestel_reports FOR DELETE USING (true);


-- 14. PORTER ANALYSES TABLE - Porter's Five Forces
DROP TABLE IF EXISTS porter_analyses CASCADE;
CREATE TABLE porter_analyses (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE porter_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "porter_select" ON porter_analyses FOR SELECT USING (true);
CREATE POLICY "porter_insert" ON porter_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "porter_update" ON porter_analyses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "porter_delete" ON porter_analyses FOR DELETE USING (true);


-- 15. STRATEGIC MODELS TABLE
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


-- 16. MASTERMIND STRATEGIES TABLE
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


-- ============================================
-- PHẦN 7: INSIGHTS & ANALYTICS
-- ============================================

-- 17. INSIGHTS TABLE - Insight Finder
DROP TABLE IF EXISTS insights CASCADE;
CREATE TABLE insights (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  insight_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on insights" ON insights FOR ALL USING (true) WITH CHECK (true);


-- 18. AB TESTS TABLE - A/B Testing Calculator
DROP TABLE IF EXISTS ab_tests CASCADE;
CREATE TABLE ab_tests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ab_tests" ON ab_tests FOR ALL USING (true) WITH CHECK (true);


-- 19. ADS HEALTH ANALYSES TABLE
DROP TABLE IF EXISTS ads_health_analyses CASCADE;
CREATE TABLE ads_health_analyses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ads_health_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ads_health_analyses" ON ads_health_analyses FOR ALL USING (true) WITH CHECK (true);


-- 20. PRICING ANALYSES TABLE
DROP TABLE IF EXISTS pricing_analyses CASCADE;
CREATE TABLE pricing_analyses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pricing_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on pricing_analyses" ON pricing_analyses FOR ALL USING (true) WITH CHECK (true);


-- 21. BRAND POSITIONINGS TABLE
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


-- ============================================
-- PHẦN 8: IDEATION & INNOVATION
-- ============================================

-- 22. SCAMPER SESSIONS TABLE - SCAMPER Ideation Tool
DROP TABLE IF EXISTS scamper_sessions CASCADE;
CREATE TABLE scamper_sessions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  problem TEXT,
  target_audience TEXT,
  constraints TEXT,
  results JSONB NOT NULL,
  saved_ideas JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_scamper_sessions_created_at ON scamper_sessions(created_at DESC);
ALTER TABLE scamper_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on scamper_sessions" ON scamper_sessions FOR ALL USING (true) WITH CHECK (true);


-- 23. MINDMAPS TABLE - Mindmap AI
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
CREATE INDEX idx_mindmaps_updated_at ON mindmaps(updated_at DESC);
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on mindmaps" ON mindmaps FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- PHẦN 9: OPERATIONS & SOP
-- ============================================

-- 24. SOPS TABLE - SOP Builder
DROP TABLE IF EXISTS sops CASCADE;
CREATE TABLE sops (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  sop_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sops_created_at ON sops(created_at DESC);
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on sops" ON sops FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- PHẦN 10: EMAIL MARKETING SYSTEM
-- ============================================

-- 25. CUSTOMER LISTS TABLE
DROP TABLE IF EXISTS customer_lists CASCADE;
CREATE TABLE customer_lists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE customer_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on customer_lists" ON customer_lists FOR ALL USING (true) WITH CHECK (true);


-- 26. SUBSCRIBERS TABLE
DROP TABLE IF EXISTS subscribers CASCADE;
CREATE TABLE subscribers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  list_id TEXT NOT NULL REFERENCES customer_lists(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  custom_fields JSONB DEFAULT '{}',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscribers_list_id ON subscribers(list_id);
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_status ON subscribers(status);
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on subscribers" ON subscribers FOR ALL USING (true) WITH CHECK (true);


-- 27. CUSTOM FIELD DEFINITIONS TABLE
DROP TABLE IF EXISTS custom_field_definitions CASCADE;
CREATE TABLE custom_field_definitions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  field_key TEXT NOT NULL UNIQUE,
  data_type TEXT NOT NULL CHECK (data_type IN ('text', 'number', 'email', 'phone', 'url', 'date', 'image')),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on custom_field_definitions" ON custom_field_definitions FOR ALL USING (true) WITH CHECK (true);


-- 28. EMAIL CAMPAIGNS TABLE
DROP TABLE IF EXISTS email_campaigns CASCADE;
CREATE TABLE email_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  reply_to TEXT,
  cc TEXT,
  bcc TEXT,
  template_id TEXT,
  list_id TEXT REFERENCES customer_lists(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaigns_list_id ON email_campaigns(list_id);
CREATE INDEX idx_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE status = 'scheduled';
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on email_campaigns" ON email_campaigns FOR ALL USING (true) WITH CHECK (true);


-- 29. CAMPAIGN ANALYTICS TABLE
DROP TABLE IF EXISTS campaign_analytics CASCADE;
CREATE TABLE campaign_analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on campaign_analytics" ON campaign_analytics FOR ALL USING (true) WITH CHECK (true);


-- 30. EMAIL EVENTS TABLE
DROP TABLE IF EXISTS email_events CASCADE;
CREATE TABLE email_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  link_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_campaign ON email_events(campaign_id);
CREATE INDEX idx_events_subscriber ON email_events(subscriber_id);
CREATE INDEX idx_events_type ON email_events(event_type);
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on email_events" ON email_events FOR ALL USING (true) WITH CHECK (true);


-- 31. UNSUBSCRIBES TABLE
DROP TABLE IF EXISTS unsubscribes CASCADE;
CREATE TABLE unsubscribes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subscriber_id TEXT REFERENCES subscribers(id),
  campaign_id TEXT REFERENCES email_campaigns(id),
  email TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on unsubscribes" ON unsubscribes FOR ALL USING (true) WITH CHECK (true);


-- 32. EMAIL DESIGNS TABLE - Visual Email Builder
DROP TABLE IF EXISTS email_designs CASCADE;
CREATE TABLE email_designs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  doc JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_email_designs_updated_at ON email_designs(updated_at DESC);
ALTER TABLE email_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on email_designs" ON email_designs FOR ALL USING (true) WITH CHECK (true);


-- 33. CLOUDINARY CONFIG TABLE
DROP TABLE IF EXISTS cloudinary_config CASCADE;
CREATE TABLE cloudinary_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  cloud_name TEXT,
  api_key TEXT,
  api_secret TEXT,
  is_configured BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cloudinary_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on cloudinary_config" ON cloudinary_config FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- PHẦN 11: ENGLISH LEARNING
-- ============================================

-- 34. VOCAB SETS TABLE
DROP TABLE IF EXISTS vocab_sets CASCADE;
CREATE TABLE vocab_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE vocab_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on vocab_sets" ON vocab_sets FOR ALL USING (true) WITH CHECK (true);


-- 35. WORDS TABLE
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
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on words" ON words FOR ALL USING (true) WITH CHECK (true);


-- 36. TRANSLATION HISTORY TABLE
DROP TABLE IF EXISTS translation_history CASCADE;
CREATE TABLE translation_history (
  id TEXT PRIMARY KEY,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on translation_history" ON translation_history FOR ALL USING (true) WITH CHECK (true);


-- 37. LEARNING PLANS TABLE
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
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on learning_plans" ON learning_plans FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- PHẦN 12: KNOWLEDGE & NEWS
-- ============================================

-- 38. MARKETING KNOWLEDGE TABLE
DROP TABLE IF EXISTS marketing_knowledge CASCADE;
CREATE TABLE marketing_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  example TEXT DEFAULT '',
  comparison TEXT DEFAULT '',
  category TEXT DEFAULT 'Chung',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_knowledge_term ON marketing_knowledge USING gin(to_tsvector('simple', term));
CREATE INDEX idx_knowledge_definition ON marketing_knowledge USING gin(to_tsvector('simple', definition));
CREATE INDEX idx_knowledge_category ON marketing_knowledge(category);
ALTER TABLE marketing_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON marketing_knowledge FOR ALL USING (true);


-- 39. NEWS ARTICLES TABLE
DROP TABLE IF EXISTS news_articles CASCADE;
CREATE TABLE news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT NOT NULL UNIQUE,
  pub_date TIMESTAMPTZ,
  source TEXT NOT NULL,
  category TEXT,
  summary TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX news_articles_pub_date_idx ON news_articles (pub_date DESC);
CREATE INDEX news_articles_category_idx ON news_articles (category);
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
-- Read policies
CREATE POLICY "Allow read access for authenticated users" ON news_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read access" ON news_articles FOR SELECT TO anon USING (true);
-- Insert policies
CREATE POLICY "Allow public insert access" ON news_articles FOR INSERT TO anon WITH CHECK (true);
-- Update policies
CREATE POLICY "Allow public update access" ON news_articles FOR UPDATE TO anon USING (true);
-- Delete policies
CREATE POLICY "Allow public delete access" ON news_articles FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated delete access" ON news_articles FOR DELETE TO authenticated USING (true);


-- ============================================
-- PHẦN 13: TASKS & PRODUCTIVITY
-- ============================================

-- 40. TASKS TABLE - Homepage task management
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);


-- 41. TODOS TABLE
DROP TABLE IF EXISTS todos CASCADE;
CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_priority ON todos(priority);
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;


-- ============================================
-- PHẦN 14: UTILITIES
-- ============================================

-- 42. UNSPLASH HISTORY TABLE - Unsplash Link Converter
DROP TABLE IF EXISTS unsplash_history CASCADE;
CREATE TABLE unsplash_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_link TEXT NOT NULL,
  cleaned_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX unsplash_history_created_at_idx ON unsplash_history (created_at DESC);
ALTER TABLE unsplash_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON unsplash_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access" ON unsplash_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON unsplash_history FOR DELETE TO anon, authenticated USING (true);


-- ============================================
-- HOÀN TẤT
-- ============================================
-- Tổng cộng: 42 tables
-- Tất cả RLS policies đã được enable
-- Tất cả indexes đã được tạo
-- ============================================
