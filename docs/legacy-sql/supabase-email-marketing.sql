-- ============================================
-- EMAIL MARKETING SYSTEM - SUPABASE SCHEMA
-- Complete database for email marketing
-- ============================================

-- 1. CUSTOMER LISTS
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

-- 2. SUBSCRIBERS (Customers in lists)
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
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on subscribers" ON subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_subscribers_list_id ON subscribers(list_id);
CREATE INDEX idx_subscribers_email ON subscribers(email);

-- 3. CUSTOM FIELD DEFINITIONS
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

-- 4. EMAIL CAMPAIGNS
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
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on email_campaigns" ON email_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaigns_list_id ON email_campaigns(list_id);

-- 5. CAMPAIGN ANALYTICS (Aggregate stats per campaign)
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

-- 6. EMAIL EVENTS (Individual tracking events)
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
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on email_events" ON email_events FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_events_campaign ON email_events(campaign_id);
CREATE INDEX idx_events_subscriber ON email_events(subscriber_id);
CREATE INDEX idx_events_type ON email_events(event_type);

-- 7. UNSUBSCRIBE RECORDS
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

-- 8. CLOUDINARY CONFIG (Optional)
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
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE status = 'scheduled';
