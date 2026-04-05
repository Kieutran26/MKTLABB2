export interface Word {
  id: string;
  term: string; // English
  definition: string; // Vietnamese
  starred: boolean;
  setId: string;
}

export interface VocabSet {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface TranslationRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  fromLang: 'en' | 'vi';
  toLang: 'en' | 'vi';
  timestamp: number;
}

export interface Plan {
  id: string;
  website: string;
  price: number;
  currency: string;
  email: string;
  paymentDate: string; // YYYY-MM-DD (Original start/payment date)
  nextPaymentDate: string; // YYYY-MM-DD
  cardInfo: string; // e.g. "Visa **** 1234"
  billingCycle: 'monthly' | 'yearly';
  icon: string; // Icon identifier
}

export interface SavedPrompt {
  id: string;
  aiModel: string; // e.g. Gemini, GPT-4, Midjourney
  title: string; // "Chi tiết" - What is this prompt for?
  content: string; // The actual prompt text
  createdAt: number;
}

export interface ToDoTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  note?: string;
}

// IMC Planner V2 Types - Strategic Framework

// 3-Layer Strategic Foundation
export interface IMCStrategicFoundation {
  business_obj: string;      // Revenue/Market share target (e.g., "Tăng 20% doanh thu Q4")
  marketing_obj: string;     // Behavior change: Trial/Switch/Repeat/Increase Basket
  communication_obj: string; // Perception change in consumer's mind
  competitive_angle?: {
    competitor_says: string;
    we_say_differently: string;
    gap_we_occupy: string;
    positioning_strategy?: string;
  };
}

// KPI structure for each phase
export interface IMCPhaseKPI {
  metric: string;  // e.g., "Reach & View", "Engagement Rate", "Orders & Shares"
  target: string;  // e.g., "5,000,000 Reach", "50,000 Interactions"
}

// 3-Phase Execution Model
export type IMCPhaseType = 'AWARE' | 'TRIGGER' | 'CONVERT';

// Budget Split structure (Production vs Media)
export interface IMCBudgetSplit {
  production: number;     // Production cost (30%)
  media: number;          // Media/Distribution cost (70%)
  production_percent: string;
  media_percent: string;
}

// Content Volume Estimation
export interface IMCContentItem {
  type: string;           // e.g., "Video TikTok", "Bài Post FB", "Landing Page"
  quantity: number;
  estimated_cost: string; // e.g., "5M VND"
  notes?: string;         // e.g., "Quay bằng điện thoại, low-cost"
}

// Execution Deep-dive details
export interface IMCExecutionDetails {
  week_range: string;           // e.g., "Tuần 1-3"
  start_week: number;
  end_week: number;
  budget_split: IMCBudgetSplit;
  content_items: IMCContentItem[];
}

export interface IMCExecutionPhase {
  phase: IMCPhaseType;
  objective_detail: string;    // What this phase aims to achieve
  key_hook: string;            // The attention-grabbing message
  channels: string[];          // Marketing channels for this phase
  budget_allocation: string;   // Percentage like "40%"
  kpis: IMCPhaseKPI;
  // Deep-dive fields
  execution_details?: IMCExecutionDetails;
  weekly_checkpoint?: {
    week_indicator: string;     // e.g., "Cuối tuần 2"
    target_metric: string;      // e.g., "Đạt 100 leads"
    if_reached: string;         // e.g., "Tiếp tục triển khai theo kế hoạch"
    if_not_reached: string;     // Contingency plan e.g., "Cắt kênh FB, dồn ngân sách vào Search"
  };
}

// Main IMC Plan V2 Interface
export interface IMCPlan {
  id: string;
  campaign_name: string;
  brand: string;
  product: string;
  industry: string;
  total_budget: number;
  timeline_weeks: number;
  strategic_foundation: IMCStrategicFoundation;
  imc_execution: IMCExecutionPhase[];
  validation_warnings?: string[];  // Golden Thread validation warnings
  // Extended CMO-grade fields
  golden_thread_warnings?: string[];
  kpi_dashboard?: {
    primary_kpis: string[];
    secondary_kpis: string[];
    vanity_metrics_to_avoid: string[];
  };
  revenue_projection?: {
    formula: string;
    reach: string;
    ctr: string;
    conversion_rate: string;
    aov: string;
    projected_revenue: string;
    breakeven_orders: string;
  };
  scenarios?: Array<{
    name: string;
    probability: string;
    condition?: string;
    leads: string;
    revenue: string;
    roas: string;
    roi: string;
  }>;
  expert_notes?: {
    key_success_factor: string;
    risks: Array<{ issue: string; mitigation: string }>;
    opportunity: string;
    frank_advice: string;
  };
  created_at: number;
}

// Legacy types for backward compatibility
export interface IMCActivity {
  channel_type: 'Paid' | 'Owned' | 'Earned' | 'Shared';
  channel_name: string;
  tactic: string;
  kpi: string;
}

export interface IMCPhase {
  phase_name: string;
  objective: string;
  budget_allocation: string;
  duration_weeks: number;
  activities: IMCActivity[];
}

export interface IMCChannelMatrix {
  paid: string[];
  owned: string[];
  earned: string[];
  shared: string[];
}



export interface ContentHistoryRecord {
  id: string;
  timestamp: number;
  originalContent: string;
  selectedPlatforms: string[];
  results: Record<string, any>;
}

// --- Key Visuals Types ---
export interface KeyVisualImage {
  id: string;
  url: string; // Base64 or URL
  prompt: string;
  style: string;
  createdAt: number;
}

export interface KeyVisualProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  // Inputs
  aspectRatio: string;
  description: string;

  // New Fields
  concept?: string;
  mood?: string;
  referenceImage?: string; // Base64 (Style reference)
  productAssets?: string[]; // Array of Base64 (Supporting assets)
  placementInstructions?: string;

  productImage?: string; // Base64 (Main Hero)
  productNote?: string;

  // Typography & Copy
  mainHeading?: string;
  mainHeadingStyle?: string;
  mainHeadingEffect?: string; // New: Neon, Metallic, etc.
  subHeading?: string;
  subHeadingEffect?: string; // New
  contentText?: string; // New: Body text
  contentTextEffect?: string; // New
  cta?: string; // New: Call to action text
  ctaEffect?: string; // New: Button style/effect

  images: KeyVisualImage[];
}

// --- Frame Visual Types ---
export interface StoryFrame {
  id: string;
  script: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface StoryboardProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  style: string;
  frames: StoryFrame[];
}

// --- Email Builder Types ---
export interface EmailTemplateConfig {
  logo: string | null;
  title: string;
  contentHtml: string;
  showFooter: boolean;
  btnText: string;
  btnUrl: string;
  footerText: string;
  activeLayout: 'modern' | 'minimal' | 'corporate';
  primaryColor: string;
  backgroundColor: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  createdAt: number;
  config: EmailTemplateConfig;
}

export interface EmailHistoryRecord {
  id: string;
  timestamp: number;
  title: string;
  html: string;
}

// --- Email Builder V2: Block-based Drag-and-Drop Types ---
export type EmailBlockType = 'heading' | 'text' | 'image' | 'button' | 'spacer' | 'divider' | 'social' | 'link' | 'row2' | 'row3' | 'column2' | 'column3' | 'html' | 'video' | 'header' | 'footer' | 'product' | 'unsubscribe' | 'product-grid' | 'coupon' | 'cart-reminder' | 'order-summary' | 'property-card' | 'features' | 'location' | 'job-listing' | 'benefits';

export interface EmailBlockBase {
  id: string;
  type: EmailBlockType;
}

export interface HeadingBlock extends EmailBlockBase {
  type: 'heading';
  content: string;
  level: 'h1' | 'h2' | 'h3';
  alignment: 'left' | 'center' | 'right';
  color: string;
}

export interface TextBlock extends EmailBlockBase {
  type: 'text';
  content: string;
  alignment: 'left' | 'center' | 'right';
}

export interface ImageBlock extends EmailBlockBase {
  type: 'image';
  src: string;
  alt: string;
  width: 'full' | 'medium' | 'small';
  alignment: 'left' | 'center' | 'right';
  link?: string;
}

export interface ButtonBlock extends EmailBlockBase {
  type: 'button';
  label: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  alignment: 'left' | 'center' | 'right';
}

export interface SpacerBlock extends EmailBlockBase {
  type: 'spacer';
  height: number;
}

export interface DividerBlock extends EmailBlockBase {
  type: 'divider';
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

export interface SocialPlatform {
  name: string;
  url: string;
}

export interface SocialBlock extends EmailBlockBase {
  type: 'social';
  platforms: SocialPlatform[];
  alignment: 'left' | 'center' | 'right';
}

export interface LinkBlock extends EmailBlockBase {
  type: 'link';
  text: string;
  url: string;
  alignment: 'left' | 'center' | 'right';
  color: string;
}

export interface Row2Block extends EmailBlockBase {
  type: 'row2';
  children: [EmailBlock[], EmailBlock[]];
}

export interface Row3Block extends EmailBlockBase {
  type: 'row3';
  children: [EmailBlock[], EmailBlock[], EmailBlock[]];
}

export interface Column2Block extends EmailBlockBase {
  type: 'column2';
  children: [EmailBlock[], EmailBlock[]];
}

export interface Column3Block extends EmailBlockBase {
  type: 'column3';
  children: [EmailBlock[], EmailBlock[], EmailBlock[]];
}

export interface HtmlBlock extends EmailBlockBase {
  type: 'html';
  content: string;
}

export interface VideoBlock extends EmailBlockBase {
  type: 'video';
  url: string;
  thumbnail?: string;
  alt: string;
  alignment: 'left' | 'center' | 'right';
}

export interface HeaderBlock extends EmailBlockBase {
  type: 'header';
  logoSrc: string;
  companyName: string;
  tagline: string;
  showMenu: boolean;
  layout: 'inline' | 'stacked';
  colors: {
    background: string;
    companyName: string;
    tagline: string;
    menu: string;
  };
  navLinks: { text: string; url: string }[];
  alignment: 'left' | 'center' | 'right';
}

export interface FooterBlock extends EmailBlockBase {
  type: 'footer';
  content: string; // Keeping for backward compatibility or generic text
  logoUrl?: string;
  companyName?: string;
  companyEmail?: string;
  phone?: string;
  address: string;
  socialLinks: SocialPlatform[];
  socialIconStyle?: 'circle' | 'rounded' | 'square';
  socialIconSize?: 'small' | 'medium' | 'large';
  copyrightText?: string;
  privacyUrl?: string;
  termsUrl?: string;
  unsubscribeText?: string;
  unsubscribeUrl?: string;
  backgroundColor: string;
  alignment: 'left' | 'center' | 'right';
}

export interface ProductBlock extends EmailBlockBase {
  type: 'product';
  productImage: string;
  title: string;
  price: string;
  description: string;
  url: string;
  buttonText: string;
  buttonColor: string;
  backgroundColor: string;
  originalPrice?: string;
  currency?: string;
  // New fields
  rating?: number;
  reviewCount?: number;
  badge?: string;
  discount?: string;
  inStock?: boolean;
  titleFontSize?: number;
  colors?: {
    text?: string;
    price?: string;
    buttonText?: string;
    badge?: string;
  };
}

export interface UnsubscribeBlock extends EmailBlockBase {
  type: 'unsubscribe';
  text: string; // Description
  linkText: string;
  url: string;
  alignment: 'left' | 'center' | 'right';
  fontSize?: number;
  colors?: {
    text?: string;
    link?: string;
    background?: string;
  };
}

// E-commerce
export interface ProductGridBlock extends EmailBlockBase {
  type: 'product-grid';
  products: { id: string; image: string; title: string; price: string; originalPrice?: string; url: string }[];
  backgroundColor: string;

  // Title Settings
  title?: string;
  columns?: 2 | 3;
  titleAlignment?: 'left' | 'center' | 'right';
  titleFontSize?: number;
  titleFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  titleFontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  titleColors?: {
    text: string;
    background: string;
  };
  titleIcon?: string;

  // Card Settings
  cardBackgroundColor?: string;
  cardBorderColor?: string;
  cardBorderWidth?: number;
  cardBorderRadius?: number;
  cardPadding?: number;

  // Text Colors
  productNameColor?: string;
  priceColor?: string;
  oldPriceColor?: string;

  // Image Settings
  imageShape?: 'rectangle' | 'circle'; // "Chữ nhật" vs "Tròn" (though circle usually implies aspect ratio, here it might just be high border radius or mask)
  imageHeight?: number;
  imageBorderRadius?: number;
}

export interface CouponBlock extends EmailBlockBase {
  type: 'coupon';
  code: string;
  discount: string; // Act as Badge text
  description: string;
  backgroundColor: string;
  borderColor: string;
  alignment: 'left' | 'center' | 'right';
  expirationDate?: string;
  codeColor?: string;
  badgeColor?: string;
  iconUrl?: string;
}



export interface OrderSummaryBlock extends EmailBlockBase {
  type: 'order-summary';
  title: string;
  orderId: string;
  items: { name: string; qty: number; price: string }[];
  subtotal: string;
  shippingFee: string;
  total: string;
  // Styling
  backgroundColor: string;
  borderColor: string;
  fontFamily: string;
  titleAlignment: 'left' | 'center' | 'right';
  titleFontSize: number;
  titleFontWeight: string;
  titleFontStyle: string;
  titleColor: string;
  totalColor: string;
  iconUrl?: string;
  iconColor?: string; // Icon Text/Foreground Color
  iconBackgroundColor?: string;
  shippingAddress?: string; // Keeping for backward compatibility or optional use
  shippingLabel?: string;
}



export type EmailBlock = HeadingBlock | TextBlock | ImageBlock | ButtonBlock | SpacerBlock | DividerBlock | SocialBlock | LinkBlock | Row2Block | Row3Block | Column2Block | Column3Block | HtmlBlock | VideoBlock | HeaderBlock | FooterBlock | ProductBlock | UnsubscribeBlock | ProductGridBlock | CouponBlock | OrderSummaryBlock;

export interface EmailDocumentSettings {
  backgroundColor: string;
  contentWidth: number;
  fontFamily: string;
  primaryColor: string;
}

export interface EmailDocument {
  blocks: EmailBlock[];
  settings: EmailDocumentSettings;
}

// Saved Email Design (for Visual Email Builder templates)
export interface SavedEmailDesign {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  doc: EmailDocument;
}

// --- UTM Builder Types ---
export interface UtmRecord {
  id: string;
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  finalUrl: string;
  shortUrl?: string;
  createdAt: number;
}

export interface UtmPreset {
  id: string;
  name: string; // e.g. "Facebook Ads Traffic"
  source: string; // e.g. "facebook"
  medium: string; // e.g. "cpc"
}

// --- ROAS Forecaster Types ---
export interface RoasScenario {
  id: string;
  name: string;
  createdAt: number;
  inputs: {
    budget: number;
    cpc: number;
    conversionRate: number;
    aov: number;
    cogs: number;
  };
  results: {
    revenue: number;
    netProfit: number;
    roas: number;
  };
}

// --- Brand Vault Types ---
export interface BrandColor {
  type: string; // Primary, Secondary, Accent
  code: string; // Hex
}

export interface BrandLogo {
  id: string;
  url: string; // Base64
  variantName: string; // e.g. "Logo chính", "Logo trắng", "Icon"
}

export interface Brand {
  id: string;
  identity: {
    name: string;
    logoMain: string | null;
    logoIcon: string | null;
    logos: BrandLogo[];
    colors: BrandColor[];
    fontFamily: string;
  };
  strategy: {
    vision: string;
    mission: string;
    coreValues: string[];
    toneOfVoice: string;
    shortTermGoals: string[];
    longTermGoals: string[];
    targetObjectives: string[];
  };
  audience: {
    demographics: string[];
    psychographics: string[];
    painPoints: string[];
  };
  createdAt: number;
}

// --- Rival Radar Types ---
export interface CompetitorAd {
  id: string;
  imageUrl: string; // Uploaded Base64 or link
  copyText: string; // Ad copy / caption
  platform: string; // Facebook, Google, etc.
  dateSaved: number;
}

export interface Competitor {
  id: string;
  name: string;
  website: string;
  logoUrl: string; // Favicon or OG Image
  brandColor: string; // Extracted or Manual
  usp: string; // Meta description
  strengths: string[]; // SWOT
  weaknesses: string[]; // SWOT
  adArchive: CompetitorAd[];
  createdAt: number;
}

// --- Persona Builder Types ---
export interface PersonalityTrait {
  leftLabel: string; // e.g. Introvert
  rightLabel: string; // e.g. Extrovert
  value: number; // 0-100
}

export interface Persona {
  id: string;
  brandId: string; // Linked to a Brand
  fullname: string;
  avatarUrl: string; // Base64 or URL
  ageRange: string;
  jobTitle: string;
  bio: string;

  // Psychographics
  goals: string[];
  frustrations: string[];
  motivations: string[]; // e.g. Price, Quality, Speed
  preferredChannels: string[]; // e.g. FB, LinkedIn

  // Sliders
  personality: PersonalityTrait[];

  createdAt: number;
}

// --- Mindmap Generator Types ---
export interface MindmapProject {
  id: string;
  name: string;
  nodes: any[]; // ReactFlow Nodes
  edges: any[]; // ReactFlow Edges
  viewport?: { x: number, y: number, zoom: number };
  createdAt: number;
  updatedAt: number;
}

// --- SCAMPER Tool Types ---
export interface ScamperSession {
  id: string;
  topic: string;
  context: string;
  results: {
    substitute: string[];
    combine: string[];
    adapt: string[];
    modify: string[];
    putToAnotherUse: string[];
    eliminate: string[];
    reverse: string[];
  };
  savedIdeas: string[];
  createdAt: number;
}

// --- Strategic Model Generator Types ---
export interface StrategicModelData {
  model_type: string;
  data: Record<string, string[] | string>;
  summary: string;
}

// --- Smart Content Calendar Types ---
export interface ContentPlanItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  pillar: string;
  angle: string;
  format: 'Video' | 'Image' | 'Text' | 'Carousel';
  status: 'Idea' | 'Drafting' | 'Published';
  content_brief: string;
  channel?: string; // Facebook, TikTok, etc.
}

export interface ContentPillar {
  name: string;
  weight: number; // Percentage 0-100
  color: string;
}

export interface CalendarProject {
  id: string;
  name: string;
  brandId: string;
  overallStrategy: string;
  pillars: ContentPillar[];
  events: ContentPlanItem[];
  createdAt: number;
  updatedAt: number;
}

// --- Mastermind Strategy Types ---
export interface MastermindStrategy {
  id: string;
  name: string;
  brandId: string;
  personaId: string;

  // Context
  objective: string;
  perception: string;
  tone: string;

  // AI Output
  result: {
    insight: string;
    coreMessage: string;
    keyMessages: string[];
    
    brand_context?: {
      persona: {
        demographics: string;
        psychographics: string;
        behaviors: string;
        journey: string;
      };
      pain_gain: {
        ranked_pains: Array<{ content: string; impact: 'High' | 'Med' | 'Low'; message_link: string }>;
        top_gains: string[];
      };
      positioning: {
        current_state: string;
        differentiator: string;
        competitive_map: {
          x_axis: string; // e.g. "Price Low-High"
          y_axis: string; // e.g. "Mass-Premium"
          brand_position: { x: number; y: number; label: string };
          competitors: Array<{ x: number; y: number; label: string }>;
          description: string;
        };
      };
    };
    
    strategic_goals?: {
      smart_goals: Array<{ goal: string; metric: string; baseline: string; target: string; deadline: string; owner: string }>;
      kpi_dashboard: string[];
      resource_allocation: {
        budget_split: Record<string, { percent: string; rationale: string; kpi: string }>;
        workforce: string;
      };
      roadmap_90day: {
        months: Array<{
          month_name: string;
          priority: string;
          actions: string[];
          kpi: string;
          owner: string;
        }>;
      };
    };
    
    tone_of_voice?: {
      personality: {
        adjectives: string[];
        human_persona: string;
      };
      spectrum: {
        formal_casual: string;
        serious_playful: string;
        authority_friendly: string;
        traditional_modern: string;
      };
      writing_rules: {
        always: string[];
        never: string[];
        word_pairs: Array<{ do: string; dont: string }>;
      };
      channel_examples: {
        social: string;
        tiktok: string;
        email: string;
      };
    };
    
    action_plan?: {
      quick_wins: string[];
      risks: string[];
      expert_advice: {
        the_must_do: string;
        common_pitfall: string;
        hidden_opportunity: string;
      };
    };
    
    conclusion?: {
      summary: string;
      positioning_statement: string;
      final_notes: string;
    };

    contentAngles: {
      text: string[];
      visual: string[];
      story: string[];
      data: string[];
      action: string[];
      weekly_distribution: string; // e.g. "3 Visual : 2 Story : 1 Action"
      sample_week_schedule: string;
      real_examples?: {
        facebook_caption: string;
        tiktok_hook: string;
        specific_cta: string;
      };
    };
    channelStrategy: Record<string, number>; 
    htmlOutput?: string; // HTML Output from gemini generateMastermindStrategy
  };
  createdAt: number;
}

export type ViewState = 'HOME' | 'HOME_DASHBOARD' | 'LANDING_INTRO' | 'FEATURES_GUIDE' | 'LEARN_SELECT' | 'LEARN_SESSION' | 'VOCAB_MANAGER' | 'STARRED' | 'PLAN_CALENDAR' | 'PLAN_LIST' | 'PROMPTS' | 'TODO' | 'CONTENT_WRITER' | 'VISUAL_EMAIL' | 'KEY_VISUALS_LIST' | 'KEY_VISUALS_CREATE' | 'FRAME_VISUAL' | 'UTM_BUILDER' | 'MOCKUP_GENERATOR' | 'AB_TESTING' | 'ROAS_FORECASTER' | 'BRAND_VAULT' | 'RIVAL_RADAR' | 'PERSONA_BUILDER' | 'MINDMAP_GENERATOR' | 'SCAMPER_TOOL' | 'STRATEGIC_MODELS' | 'SMART_CALENDAR' | 'MASTERMIND_STRATEGY' | 'SMART_SALARY' | 'AUTO_BRIEF' | 'SOP_BUILDER' | 'HOOK_GENERATOR' | 'CUSTOMER_JOURNEY_MAPPER' | 'BUDGET_ALLOCATOR' | 'INSIGHT_FINDER' | 'CREATIVE_ANGLE_EXPLORER' | 'ADS_HEALTH_CHECKER' | 'BRAND_POSITIONING_BUILDER' | 'PRICING_ANALYZER' | 'AUDIENCE_EMOTION_MAP' | 'IMC_PLANNER' | 'MARKETING_KNOWLEDGE' | 'PESTEL_BUILDER' | 'PORTER_ANALYZER' | 'NEWS_AGGREGATOR' | 'TOOLKIT' | 'STP_MODEL' | 'LOGIN';

// --- STP MODEL GENERATOR ---
export interface STPInput {
  productBrand: string;
  industry: string;
  productDescription: string;
  priceRange: string;
  targetMarket: string;
  competitorNames?: string;
  currentCustomers?: string;
  /** Lý do khách mua (ưu tiên insight phân khúc) */
  purchaseReason?: string;
  /** Lý do khách không mua / rào cản */
  nonPurchaseReason?: string;
  /** Mục tiêu STP của người dùng */
  stpGoal?: string;
  /** USP / điểm mạnh có thể chứng minh */
  uspStrength?: string;
}

export interface STPSegment {
  name: string;
  description: string;
  demographics: string;
  psychographics: string;
  size_estimate: string;
  needs: string[];
  behaviors: string[];
}

export interface STPTarget {
  primary_segment: string;
  selection_rationale: string;
  market_fit_score: number;
  growth_potential: string;
  accessibility: string;
  risks: string[];
  secondary_segments?: string[];
  segments_to_avoid?: string[];
  targeting_matrix?: Array<{
    segment_name: string;
    size_score: number;
    accessibility_score: number;
    competition_score: number;
    usp_fit_score: number;
    total_score: number;
    rationale: string;
  }>;
}

export interface STPPosition {
  positioning_statement: string;
  unique_value_proposition: string;
  key_differentiators: string[];
  brand_essence: string;
  competitive_frame: string;
  reasons_to_believe: string[];
  matrix_2x2?: {
    x_axis: string;
    y_axis: string;
    brand_position: { x: number; y: number };
    competitors: Array<{ name: string; x: number; y: number }>;
  };
  channel_messages?: Array<{ channel: string; message: string }>;
  perceptual_map_text?: string;
}

export interface STPResult {
  validationStatus: 'PASS' | 'FAIL' | 'WARNING';
  clarificationMessage?: string;

  segmentation: {
    analysis_approach: string;
    segments: STPSegment[];
  };
  targeting: STPTarget;
  positioning: STPPosition;

  actionPlan: {
    immediate_actions: string[];
    marketing_channels: string[];
    messaging_hooks: string[];
  };

  strategy?: {
    top_insights: string[];
    strategic_risks: Array<{ issue: string; mitigation: string }>;
    opportunities: string[];
    ai_knowledge_gaps: string[];
  };

  cmo_advice?: CMOAdvice;
}

export interface CMOAdvice {
  most_important: {
    factor: string;
    why_matters: string;
    evidence: string;
  };
  biggest_pitfall: {
    mistake: string;
    consequence: string;
    instead_do: string;
  };
  missed_opportunity: {
    gap: string;
    evidence: string;
    how_to_exploit_90days: string;
  };
  one_thing: {
    action: string;
    why_leverage: string;
    kpi_year1: string;
  };
  action_30_60_90: {
    month1: {
      phase: string;
      items: string[];
      reason: string;
    };
    month2: {
      phase: string;
      items: string[];
      kpis: string[];
    };
    month3: {
      phase: string;
      items: string[];
      goals: string[];
    };
  };
  ai_unknowns: string[];
  final_positioning_quote: string;
}


// --- AUTO BRIEF GENERATOR ---
export interface BriefObjectives {
  business: string;
  marketing: string;
  communication: string;
}

export interface BriefPersona {
  demographic: string;
  psychographic: string;
  insight: string;
}

export interface BriefStrategy {
  core_message: string;
  key_hook: string;
  tone_mood: string;
}

export interface BriefExecutionPhase {
  phase: string;
  activity: string;
  channel: string;
}

export interface BriefKPIs {
  estimated_reach: string;
  success_metrics: string;
  required_content_pieces: string[];
}

export interface BriefData {
  project_name: string;
  context_analysis: string;
  objectives: BriefObjectives;
  target_persona: BriefPersona;
  strategy: BriefStrategy;
  execution_plan: BriefExecutionPhase[];
  kpis_deliverables: BriefKPIs;
}

// --- SOP BUILDER ---
export interface SOPStep {
  id: number;
  action: string;
  role: string;
  tools: string[];
  critical_note?: string;
  completed: boolean;
}

export interface SOPPhase {
  phase_name: string;
  steps: SOPStep[];
  collapsed: boolean;
}

export interface SOPData {
  sop_title: string;
  estimated_time: string;
  phases: SOPPhase[];
}

export enum StudyMode {
  FLASHCARD = 'FLASHCARD',
  QUIZ = 'QUIZ', // Multiple choice
  WRITING = 'WRITING'
}

// --- HOOK GENERATOR (The Hook Matrix) ---
export interface HookAnalysis {
  identified_pain_point: string;
  identified_desire: string;
}

export interface VideoHook {
  style: string;
  hook_text: string;
  visual_cue: string;
  psychology_trigger: string;
}

export interface LandingPageHook {
  style: string;
  headline: string;
  sub_headline: string;
  psychology_trigger: string;
}

export interface EmailHook {
  style: string;
  subject_line: string;
  preview_text: string;
  psychology_trigger: string;
}

export interface SocialHook {
  style: string;
  hook_text: string;
  hashtag_suggestion: string;
  psychology_trigger: string;
}

export interface HookGeneratorResult {
  analysis: HookAnalysis;
  hooks: {
    video_shorts: VideoHook[];
    landing_page: LandingPageHook[];
    email: EmailHook[];
    social_post: SocialHook[];
  };
}

// --- CUSTOMER JOURNEY MAPPER ---
export interface JourneyStage {
  stage: string;
  stage_goal: string;            // Goal of this stage

  // Layer 1: Customer Mindset (Enhanced)
  mindset: {
    doing: string;         // What they're physically doing
    feeling: string;       // Emotional state with emoji
    thinking: string;      // Inner thoughts/questions
  };

  // Layer 2: The "Brick Wall" (Pain Points/Barriers)
  barriers: string[];      // What stops them from moving forward

  // Layer 3: The "Hammer" (Solutions/Triggers)
  solutions: string[];     // Tactics to break the barrier

  // Layer 4: Touchpoints & Formats (Specific)
  touchpoints: {
    channel: string;       // e.g., "Facebook Reels"
    format: string;        // e.g., "Problem/Solution format"
    action: string;        // e.g., "Show pain point, introduce solution"
  }[];

  // Layer 5: Success Metrics (KPIs)
  kpis: {
    metric: string;        // e.g., "CTR", "Conversion Rate"
    target: string;        // e.g., ">2%", "15-20%"
    description: string;   // What it measures
  }[];

  // NEW: Detailed Action Items with Psychological Drivers
  action_items: {
    touchpoint: string;           // Specific channel (e.g., "Group Seeding", "Shopee Live")
    trigger_message: string;      // The exact headline or hook
    psychological_driver: string; // Emotion: FOMO, Trust, Greed, Pride, Fear, Curiosity
    format: string;               // Video Short, Long-form Blog, Infographic, DM
  }[];

  // Critical Action for stage
  critical_action: string;

  // Legacy fields for backward compatibility
  customer_mindset: string;
  emotional_state: string;
  key_message: string;
  content_ideas: string[];
}

// --- BUDGET ALLOCATOR ---
export interface ChannelAllocation {
  channel: string;
  percentage: number;
  amount: number;
  role: string;
  rationale: string;
}

export interface BudgetAllocationResult {
  total_budget: number;
  strategy_name: string;
  allocation: ChannelAllocation[];
  estimated_result: {
    clicks: string;
    conversions: string;
  };
}

export interface BudgetAllocatorInput {
  totalBudget: number;
  kpi: 'sales' | 'awareness' | 'retention' | 'custom';
  industry: string;
}

// --- INSIGHT FINDER ---
export interface PainPoint {
  level: 'Surface' | 'Deep';
  content: string;
}

export interface MotivationsJTBD {
  functional: string;
  emotional: string;
  social: string;
}

export interface Barrier {
  type: 'Trust Barrier' | 'Effort Barrier' | 'Price Barrier';
  content: string;
}

export interface BuyingBehavior {
  search_channel: string;
  decision_driver: string;
  deal_breaker: string;
}

export interface DeepInsights {
  pain_points: PainPoint[];
  motivations_jtbd: MotivationsJTBD;
  barriers: Barrier[];
  buying_behavior: BuyingBehavior;
}

// 3-Hit Combo Structure for Campaign-Ready Insights
export interface InsightThreeHitCombo {
  // Layer 1: The Truth
  truth: {
    whatTheySay: string;      // Surface-level desire: "I want [Product] to be cheaper/better"
    currentBehavior: string;  // What they're currently doing to solve the problem
  };
  // Layer 2: The Tension (MOST IMPORTANT)
  tension: {
    wantX: string;            // "I want to X..."
    butAfraid: string;        // "BUT I'm afraid of Y..."
    insight: string;          // Full insight statement combining both
  };
  // Layer 3: The Discovery  
  discovery: {
    unspokenMotivation: string;  // The real motivation they won't say out loud
    notAbout: string;            // "Actually, it's not about [Product Feature]"
    itsAbout: string;            // "It's about [Emotional Reward]"
  };
}

// Creative Implications for actionable strategy
export interface CreativeImplications {
  coreMessage: string;        // Single sentence brand promise
  visualKey: string;          // Symbolic image description (e.g., "Person standing alone in crowd but glowing")
  triggerWords: string[];     // Power words: "Dám" (Dare), "Chất" (Cool), "Riêng" (Unique)
}

export interface InsightFinderResult {
  industry: string;
  // NEW: 3-Hit Combo structure
  threeHitCombo: InsightThreeHitCombo;
  // NEW: Creative Implications (The "So What?")
  creativeImplications: CreativeImplications;
  // Keep existing for backward compatibility
  deep_insights: DeepInsights;
  emotional_intensity: {
    level: number;
    description: string;
  };
  // NEW: Validation status for anti-hallucination
  validationStatus?: 'VALID' | 'NEEDS_CLARIFICATION';
  clarificationMessage?: string;
}

export interface InsightFinderInput {
  productIndustry: string;
  targetAudience: string;
  // NEW: Context Layer for specificity
  specificSegment?: string;       // e.g., "Gen Z Students", "Office Workers", "New Moms"
  usageOccasion?: string;         // e.g., "When hanging out with friends", "Late night alone"
  currentHabitCompetitor?: string; // e.g., "Currently using Product X"
  context?: string;               // Keep for backward compatibility
}
// --- CREATIVE ANGLE EXPLORER ---
export interface CreativeAngleInput {
  productName: string;
  productDescription?: string;
  targetAudience?: string;
  keyFeatures?: string[] | string;
  desiredAngleCount?: number; // 5-15
  // V2 Performance Creative fields
  painPoints?: string;
  brandVibe?: 'fun' | 'premium' | 'meme' | 'minimalist' | 'professional';
  desiredFormat?: 'video_short' | 'carousel' | 'static' | 'meme' | 'mixed';
}

export interface CreativeAngle {
  id: number;
  framework: string;
  angleName: string;
  hookText: string;
  adCopyOutline: string;
  visualDirection: string;
  suggestedFormat: string;
  emotionTag?: string;
  // V2 Concept Card fields
  hookType?: string;
  headlineOverlay?: string;
  scriptOutline?: {
    opening_0_3s: string;
    body: string;
    cta: string;
  };
}

export interface CreativeAngleResult {
  productContext: string;
  totalAngles: number;
  angles: CreativeAngle[];
}

export interface AdsHealthInput {
  platform: string;
  industry: string;
  dataMode: 'manual' | 'paste';
  manualMetrics?: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    // New V3 fields for Profit-First analysis
    duration?: number;      // Days running
    frequency?: number;     // Times shown per person
    reach?: number;         // Unique people reached (alternative to frequency)
    revenue?: number;       // Total revenue/conversion value
  };
  rawText?: string;
}

export interface AdsHealthResult {
  health_score: number;
  status: 'Tốt' | 'Cần theo dõi' | 'Nguy kịch' | 'Good' | 'Warning' | 'Critical';
  metrics_analysis: {
    cpm: { value: number; assessment: string; benchmark?: string };
    ctr: { value: number; assessment: string; benchmark?: string };
    cpc: { value: number; assessment: string };
    cr: { value: number; assessment: string };
    cpa?: { value: number; assessment: string };
    // New V3 metrics for Profit-First analysis
    roas?: { value: number; assessment: string };
    aov?: { value: number; assessment: string };
    frequency?: { value: number; assessment: string };
  };
  diagnosis: {
    primary_issue: string;
    explanation: string;
    // New V3: Root cause category
    root_cause?: 'creative_fatigue' | 'audience_exhaustion' | 'low_profitability' | 'scale_opportunity' | 'tracking_issue';
  };
  actionable_steps: Array<{
    action: string;
    detail: string;
    priority?: 'urgent' | 'high' | 'medium' | 'low';
  }>;
  break_even_roas?: number;
}

// --- BRAND POSITIONING BUILDER ---
export interface BrandPositioningInput {
  brandName: string;
  products: string;
  targetCustomers: string;
  competitors: string;
  visionMission?: string;
}

export interface BrandPositioningResult {
  brand_identity: {
    archetype: string;
    archetype_desc: string;
    tone_of_voice: string[];
  };
  strategic_pillars: {
    usp: string;
    uvp: string;
    rtb: string[];
  };
  messaging_pillars: Array<{
    pillar_name: string;
    key_message: string;
  }>;
  positioning_statement: string;
}

// --- PRICING ANALYZER ---
export interface PricingAnalyzerInput {
  productName: string;
  industry: string;
  cogs: number;
  targetPrice: number;
  competitorMin: number;
  competitorMax: number;
  positioning: 'budget' | 'mainstream' | 'premium';
  fixedCosts?: number;
  pricingGoal?: string;
}

export interface PricingVerdict {
  status: 'Optimal' | 'Warning' | 'Critical';
  score: number;
  summary: string;
}

export interface FinancialAnalysis {
  gross_margin_percent: number;
  break_even_point: string;
  assessment: string;
}

export interface MarketPositionAnalysis {
  your_price: number;
  market_avg: number;
  price_index: number;
  comment: string;
}

export interface StrategicSolution {
  type: string;
  advice: string;
}

export interface PricingAnalyzerResult {
  verdict: PricingVerdict;
  financial_analysis: FinancialAnalysis;
  market_position_analysis: MarketPositionAnalysis;
  strategic_solutions: StrategicSolution[];
}

// --- AUDIENCE EMOTION MAP ---
export interface AudienceEmotionMapInput {
  industry: string;
  productCategory?: string;
  targetAudience?: string;
  painPoint: string;
  positioning?: string;
}

export interface EmotionStage {
  stage: 'Awareness' | 'Journey' | 'Buy' | 'Loyal';
  dominant_emotion: string;
  intensity_score: number;
  trigger: string;
  internal_monologue: string;
  recommended_tone: string;
  content_hook: string;
  emoji?: string;
  keywords_to_use?: string[];
  keywords_to_avoid?: string[];
}

export interface AudienceEmotionMapResult {
  industry: string;
  emotion_journey: EmotionStage[];
}

// --- PESTEL BUILDER ---
export type PESTELCategory = 'Political' | 'Economic' | 'Social' | 'Technological' | 'Environmental' | 'Legal';
export type VerificationStatus = 'Verified' | 'Estimated' | 'Unverified';
export type ImpactDirection = 'Positive' | 'Negative' | 'Neutral';

export interface PESTELItem {
  factor: string;
  detail: string;
  impact_direction: ImpactDirection;
  impact_score: number; // 1-10
  actionable_insight: string;
  verification_status: VerificationStatus;
  source?: string; // Citation for P/L factors
  is_priority?: boolean; // High Priority flag for critical items
}

export interface PESTELFactorGroup {
  category: PESTELCategory;
  category_vi: string;
  items: PESTELItem[];
}

export interface PESTELBuilderInput {
  industry: string;
  location: string;
  businessScale: string;
  businessModel: string;
  mainProductService: string;
  currentConcern: string;
  futurePlan: string;
  knownEventsPolicies?: string;
}

export interface PESTELBuilderResult {
  context: string;
  pestel_context?: string; // New: Summary context
  html_report?: string;    // New: Editorial Minimalism report
  pestel_factors: PESTELFactorGroup[];
  generated_at: string;
  data_freshness: string;
}

export type PESTELInput = PESTELBuilderInput;
export type PESTELResult = PESTELBuilderResult;

// --- PORTER'S FIVE FORCES ---
export type ForceStatus = 'Low' | 'Medium' | 'High' | 'Extreme';
export type IndustryVerdict = 'Blue Ocean' | 'Attractive' | 'Moderate' | 'Unattractive' | 'Red Ocean';
export type UserPosition = 'New Entrant' | 'Market Leader' | 'Challenger' | 'Niche Player';
export type TrendDirection = 'Increasing' | 'Stable' | 'Decreasing';

export interface PorterForce {
  name: string;
  name_vi: string;
  score: number; // 1-10
  status: ForceStatus;
  determinants: string[];
  strategic_action: string;
  data_source?: string;
  trend: TrendDirection; // Xu hướng 1-3 năm tới
  trend_reason?: string; // Lý do dự báo xu hướng
}

/** Kết quả phân tích Porter Advice - phần Advice */
export interface PorterAdvice {
  /** Chiến lược cạnh tranh được chọn */
  recommended_strategy: 'Cost Leadership' | 'Differentiation' | 'Focus/Niche';
  /** Lý do chọn chiến lược này */
  strategy_rationale: string;
  /** 2 rủi ro nếu thực thi sai */
  strategy_risks: string[];
  /** Lực nguy hiểm nhất */
  biggest_threat: {
    force_name: string;
    score: number;
    reason: string;
    consequence: string;
    defensive_action: string;
  };
  /** Lực lợi thế nhất */
  biggest_opportunity: {
    force_name: string;
    score: number;
    reason: string;
    exploitation_plan: string;
  };
  /** Điều quan trọng nhất phải làm đúng */
  critical_must_do: {
    factor: string;
    why_leverage: string;
    consequence_if_wrong: string;
  };
  /** Cạm bẫy lớn nhất cần tránh */
  biggest_pitfall: {
    mistake: string;
    example_consequence: string;
    recommended_alternative: string;
  };
  /** Cơ hội đang bị bỏ ngỏ */
  untapped_opportunity: {
    gap: string;
    how_to_capture: string;
  };
  /** Hành động 30-60-90 ngày */
  action_plan: {
    month_1: string[]; // Phòng thủ & Nền tảng
    month_2: string[]; // Tấn công & Khác biệt hóa
    month_3: string[]; // Tối ưu & Đánh giá
  };
  /** Những gì AI không biết (ít nhất 4 điều) */
  unknowns: string[];
  /** Câu nhận định cuối cùng */
  final_verdict: string;
}

/** Dữ liệu form Porter's Precision — map 1:1 với prompt AI */
export interface PorterAnalysisInput {
  nganh_hang: string;
  thi_truong: string;
  vi_the: string;
  mo_hinh: string;
  san_pham_usp: string;
  doi_thu: string;
  nha_cung_cap: string;
  khach_hang: string;
  san_pham_thay_the: string;
  rao_can_gia_nhap: string;
  muc_tieu: string;
  ke_hoach: string;
}

export interface PorterAnalysisResult {
  industry_context: string;
  overall_verdict: IndustryVerdict;
  verdict_description: string;
  total_threat_score: number; // Tổng điểm / 50
  forces: PorterForce[];
  advice: PorterAdvice; // Phần Advice
  generated_at: string;
}



