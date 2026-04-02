-- =========================================================
-- OPTIM.KI SaaS - DATABASE SCHEMA (New Version)
-- Optimized for: Subscriptions (Free, Pro, Pro Max), 
-- Pay-per-feature, and User-based Quotas.
-- =========================================================

-- 1. PROFILES: Extend Auth table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'promax'
  is_lifetime BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USER QUOTAS: Manage usage limits
CREATE TABLE IF NOT EXISTS public.user_quotas (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  plan_creation_count INT DEFAULT 0,
  plan_limit INT DEFAULT 5, -- Free: 5, Pro: 50, ProMax: 9999
  reset_date TIMESTAMPTZ DEFAULT (now() + interval '1 month'),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. UNLOCKED FEATURES: Individual feature purchases
CREATE TABLE IF NOT EXISTS public.user_unlocked_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  feature_id TEXT NOT NULL, -- e.g., 'PORTER_ANALYZER', 'BRAND_VAULT'
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature_id)
);

-- 4. BRANDS: Centralized Brand Identity
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  target_audience JSONB,
  brand_voice TEXT,
  identity_data JSONB, -- Logos, Colors, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MARKETING PLANS: Unified table for all AI Generations
CREATE TABLE IF NOT EXISTS public.marketing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'SWOT', 'AIDA', 'IMC', 'UTM', 'PRICING', etc.
  name TEXT, -- Human-readable name for history
  input_data JSONB,
  generated_output JSONB,
  is_favorited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TRANSACTIONS/LOGS: For audit and payment tracking
CREATE TABLE IF NOT EXISTS public.user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  amount DECIMAL(12,2),
  currency TEXT DEFAULT 'VND',
  description TEXT,
  status TEXT, -- 'pending', 'completed', 'failed'
  external_id TEXT, -- Payment gateway ID (SePay, PayOS, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlocked_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Quotas Policies
CREATE POLICY "Users can view their own quotas" ON public.user_quotas FOR SELECT USING (auth.uid() = user_id);

-- Unlocked Features Policies
CREATE POLICY "Users can view their own unlocked features" ON public.user_unlocked_features FOR SELECT USING (auth.uid() = user_id);

-- Brands Policies
CREATE POLICY "Users can manage their own brands" ON public.brands FOR ALL USING (auth.uid() = user_id);

-- Marketing Plans Policies
CREATE POLICY "Users can manage their own plans" ON public.marketing_plans FOR ALL USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view their own transactions" ON public.user_transactions FOR SELECT USING (auth.uid() = user_id);

-- =========================================================
-- FUNCTIONS & TRIGGERS
-- =========================================================

-- Function to handle profile creation on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  INSERT INTO public.user_quotas (user_id, plan_limit)
  VALUES (new.id, 5); -- Default limit for Free tier
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating 'updated_at' columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_brands_modtime BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
