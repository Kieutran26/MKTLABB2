import { getGeminiClient } from '../lib/geminiClient';
import { supabase } from '../lib/supabase';
import { IMCPlan, IMCStrategicFoundation, IMCExecutionPhase } from '../types';

const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
] as any;

// ═══════════════════════════════════════════════════════════════
// PLANNING MODES & TYPES
// ═══════════════════════════════════════════════════════════════

export type PlanningMode = 'BUDGET_DRIVEN' | 'GOAL_DRIVEN' | 'AUDIT';
export type CampaignFocus = 'BRANDING' | 'CONVERSION';
export type ChannelType = 'PAID_MEDIA' | 'CRM' | 'CONTENT' | 'TOOLS';

// ═══════════════════════════════════════════════════════════════
// ASSET CHECKLIST - User's Current Status
// ═══════════════════════════════════════════════════════════════

export interface AssetChecklist {
    has_website: boolean;        // Controls Remarketing/SEO
    has_customer_list: boolean;  // Controls CRM/Email/SMS
    has_creative_assets: boolean; // Affects Production budget ratio
}

// ═══════════════════════════════════════════════════════════════
// CHANNEL ALLOCATION BREAKDOWN
// ═══════════════════════════════════════════════════════════════

export interface ChannelAllocation {
    channel_name: string;
    channel_type: ChannelType;
    phase: 'AWARE' | 'TRIGGER' | 'CONVERT';
    total_allocation: number;
    media_spend: number;
    production_cost: number;
    platform_fee?: number;
    estimated_kpi: {
        metric: string;      // "Clicks" | "Messages" | "Impressions" | "Reach"
        value: number;
        unit_cost: number;
    };
    action_item: string;
    warning?: string;
}

export interface BudgetDistribution {
    total_budget: number;
    production_budget: number;
    media_budget: number;
    production_ratio: number;
    channels: ChannelAllocation[];
    warnings: string[];
    disabled_channels: string[];  // Channels disabled due to missing assets
}

export interface IMCInput {
    brand: string;
    product: string;
    industry: string;
    timeline_weeks: number;
    // Planning Mode
    planning_mode: PlanningMode;
    campaign_focus: CampaignFocus;
    // Flexible inputs
    budget?: number;
    revenue_target?: number;
    product_price: number;
    // Asset Checklist
    assets?: AssetChecklist;
    /** Bối cảnh thương hiệu / đối tượng (wizard bước 2 & 3) — đưa vào prompt AI */
    brand_vision_mission?: string;
    audience_name?: string;
    audience_pain_desire?: string;
    // Bước 3 Strategic Context
    usp?: string;
    competitors?: string;
    tone?: string;
    past_campaigns?: string;
}

export interface FeasibilityResult {
    is_feasible: boolean;
    implied_roas: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMPOSSIBLE';
    warning_message?: string;
    recommendation?: string;
}

export interface CalculatedMetrics {
    total_budget: number;
    media_spend: number;
    production_budget: number;
    estimated_traffic: number;
    estimated_orders: number;
    estimated_revenue: number;
    implied_roas: number;
    feasibility: FeasibilityResult;
    budget_distribution?: BudgetDistribution;
}

// INDUSTRY BENCHMARKS (5-Year Expert Constants)
// ═══════════════════════════════════════════════════════════════

const BENCHMARKS = {
    // Base ROAS by campaign focus
    ROAS_BRANDING: 1.5,
    ROAS_CONVERSION: 3.0,

    // Cost metrics (Vietnam averages)
    CPC: 4_000,
    CPM: 50_000,

    // Conversion funnel
    CONVERSION_RATE_BRANDING: 0.01,
    CONVERSION_RATE_CONVERSION: 0.02,

    // Budget splits (will be dynamic based on budget tier)
    PRODUCTION_RATIO: 0.25,
    MEDIA_RATIO: 0.75,

    // Minimums
    MIN_PRODUCTION_BUDGET: 2_000_000,
    MIN_TOTAL_BUDGET: 20_000_000,
    MIN_CHANNEL_BUDGET: 2_000_000,  // Warning threshold per channel

    // ROAS thresholds
    ROAS_REALISTIC_MAX: 5.0,
    ROAS_OPTIMISTIC_MAX: 8.0,
    ROAS_IMPOSSIBLE: 10.0,
};

// ═══════════════════════════════════════════════════════════════
// CHANNEL COST BENCHMARKS (Performance Marketing Standards)
// ═══════════════════════════════════════════════════════════════

const CHANNEL_COSTS = {
    'Meta Ads (Prospecting)': { cpc: 8_000, cpm: 40_000, production_ratio: 0.20 },
    'Meta Ads (Retargeting)': { cpc: 15_000, cpm: 80_000, production_ratio: 0.15 },
    'Google Ads (Search)': { cpc: 20_000, cpm: null, production_ratio: 0.10 },
    'Google Ads (Display)': { cpc: 5_000, cpm: 30_000, production_ratio: 0.20 },
    'TikTok Ads': { cpc: 6_000, cpm: 50_000, production_ratio: 0.25 },
    'YouTube Ads': { cpc: 10_000, cpm: 60_000, production_ratio: 0.30 },
    'Zalo OA/ZNS': { cost_per_message: 500, production_ratio: 0.15 },
    'SMS Marketing': { cost_per_message: 800, production_ratio: 0.10 },
    'Email Marketing': { cost_per_send: 50, production_ratio: 0.25 },
    'KOL/Influencer': { flat_fee: true, production_ratio: 0.40 },
    'PR/Content': { flat_fee: true, production_ratio: 0.60 },
};

// Industry-specific channel recommendations
const INDUSTRY_CHANNELS: Record<string, { aware: string[]; trigger: string[]; convert: string[] }> = {
    'B2B': {
        aware: ['LinkedIn Ads', 'PR Industry News', 'Webinar Announcements'],
        trigger: ['Whitepaper Downloads', 'Case Study', 'Email Nurturing', 'LinkedIn Articles'],
        convert: ['Demo Booking', 'Proposal Request', 'Sales Outreach']
    },
    'FMCG': {
        aware: ['YouTube Masthead', 'OOH Billboards', 'TV Spots', 'TikTok Reach'],
        trigger: ['KOL Reviews', 'Facebook Group Seeding', 'Minigames', 'Sampling'],
        convert: ['Shopee/Lazada Flash Sale', 'Remarketing', 'POS Promotions']
    },
    'Tech': {
        aware: ['Tech Blog PR', 'YouTube Pre-roll', 'Google Display'],
        trigger: ['Product Demo Videos', 'Tech Review Sites', 'Community Forums'],
        convert: ['Free Trial', 'App Install Ads', 'Referral Program']
    },
    'Fashion': {
        aware: ['Instagram Reels', 'TikTok Trending', 'Fashion Magazine'],
        trigger: ['Influencer Try-on', 'Pinterest Boards', 'User Reviews'],
        convert: ['Website Flash Sale', 'Livestream Shopping', 'Limited Edition']
    },
    'Default': {
        aware: ['Facebook/TikTok Ads', 'PR Báo chí', 'OOH'],
        trigger: ['KOL Content', 'Social Seeding', 'Interactive Ads'],
        convert: ['E-commerce', 'Remarketing', 'Referral']
    }
};

// ═══════════════════════════════════════════════════════════════
// EXPERT CALCULATION LOGIC
// ═══════════════════════════════════════════════════════════════

export const IMCService = {

    /**
     * Get conversion rate based on campaign focus
     */
    getConversionRate(focus: CampaignFocus): number {
        return focus === 'BRANDING'
            ? BENCHMARKS.CONVERSION_RATE_BRANDING
            : BENCHMARKS.CONVERSION_RATE_CONVERSION;
    },

    /**
     * Get base ROAS based on campaign focus
     */
    getBaseROAS(focus: CampaignFocus): number {
        return focus === 'BRANDING'
            ? BENCHMARKS.ROAS_BRANDING
            : BENCHMARKS.ROAS_CONVERSION;
    },

    /**
     * MODE A: Budget-Driven Calculation
     * "I have 50M VND" → Estimate potential revenue
     */
    calculateFromBudget(budget: number, productPrice: number, focus: CampaignFocus): CalculatedMetrics {
        const conversionRate = this.getConversionRate(focus);

        // Split budget
        let productionBudget = budget * BENCHMARKS.PRODUCTION_RATIO;
        if (productionBudget < BENCHMARKS.MIN_PRODUCTION_BUDGET) {
            productionBudget = BENCHMARKS.MIN_PRODUCTION_BUDGET;
        }
        const mediaSpend = budget - productionBudget;

        // Calculate funnel
        const estimatedTraffic = Math.floor(mediaSpend / BENCHMARKS.CPC);
        const estimatedOrders = Math.floor(estimatedTraffic * conversionRate);
        const estimatedRevenue = estimatedOrders * productPrice;
        const impliedRoas = budget > 0 ? estimatedRevenue / budget : 0;

        return {
            total_budget: budget,
            media_spend: mediaSpend,
            production_budget: productionBudget,
            estimated_traffic: estimatedTraffic,
            estimated_orders: estimatedOrders,
            estimated_revenue: estimatedRevenue,
            implied_roas: impliedRoas,
            feasibility: this.assessFeasibility(impliedRoas)
        };
    },

    /**
     * MODE B: Goal-Driven Calculation
     * "I want 500M Revenue" → Calculate required budget
     */
    calculateFromTarget(revenueTarget: number, productPrice: number, focus: CampaignFocus): CalculatedMetrics {
        const conversionRate = this.getConversionRate(focus);

        // Reverse funnel calculation
        const requiredOrders = Math.ceil(revenueTarget / productPrice);
        const requiredTraffic = Math.ceil(requiredOrders / conversionRate);
        const requiredMediaSpend = requiredTraffic * BENCHMARKS.CPC;

        // Gross up for production
        let totalBudget = requiredMediaSpend / BENCHMARKS.MEDIA_RATIO;
        const productionBudget = Math.max(
            totalBudget * BENCHMARKS.PRODUCTION_RATIO,
            BENCHMARKS.MIN_PRODUCTION_BUDGET
        );

        // Recalculate if production was bumped up
        if (productionBudget === BENCHMARKS.MIN_PRODUCTION_BUDGET) {
            totalBudget = requiredMediaSpend + productionBudget;
        }

        const impliedRoas = totalBudget > 0 ? revenueTarget / totalBudget : 0;

        return {
            total_budget: totalBudget,
            media_spend: requiredMediaSpend,
            production_budget: productionBudget,
            estimated_traffic: requiredTraffic,
            estimated_orders: requiredOrders,
            estimated_revenue: revenueTarget,
            implied_roas: impliedRoas,
            feasibility: this.assessFeasibility(impliedRoas)
        };
    },

    /**
     * MODE C: Audit Mode
     * "I have 20M but want 500M Revenue" → Feasibility check
     */
    auditPlan(budget: number, revenueTarget: number, productPrice: number, focus: CampaignFocus): CalculatedMetrics {
        const conversionRate = this.getConversionRate(focus);
        const impliedRoas = revenueTarget / budget;

        // What you CAN achieve with this budget
        const realistic = this.calculateFromBudget(budget, productPrice, focus);

        // What you NEED to achieve the target
        const required = this.calculateFromTarget(revenueTarget, productPrice, focus);

        // Gap analysis
        const budgetGap = required.total_budget - budget;
        const revenueGap = revenueTarget - realistic.estimated_revenue;

        const feasibility = this.assessFeasibility(impliedRoas);

        if (impliedRoas > BENCHMARKS.ROAS_IMPOSSIBLE) {
            feasibility.recommendation = `Để đạt mục tiêu ${this.formatVND(revenueTarget)}, bạn cần tăng ngân sách lên ${this.formatVND(required.total_budget)} hoặc giảm mục tiêu xuống ${this.formatVND(realistic.estimated_revenue)}.`;
        } else if (impliedRoas > BENCHMARKS.ROAS_OPTIMISTIC_MAX) {
            feasibility.recommendation = `ROAS ${impliedRoas.toFixed(1)}x là khả thi nhưng rủi ro cao. Khuyến nghị tăng ngân sách thêm ${this.formatVND(budgetGap * 0.5)} để giảm rủi ro.`;
        }

        return {
            total_budget: budget,
            media_spend: realistic.media_spend,
            production_budget: realistic.production_budget,
            estimated_traffic: realistic.estimated_traffic,
            estimated_orders: realistic.estimated_orders,
            estimated_revenue: realistic.estimated_revenue,
            implied_roas: impliedRoas,
            feasibility
        };
    },

    /**
     * Assess feasibility based on implied ROAS
     */
    assessFeasibility(roas: number): FeasibilityResult {
        if (roas > BENCHMARKS.ROAS_IMPOSSIBLE) {
            return {
                is_feasible: false,
                implied_roas: roas,
                risk_level: 'IMPOSSIBLE',
                warning_message: `⚠️ CẢNH BÁO: ROAS ${roas.toFixed(1)}x là KHÔNG KHẢ THI. Không có chiến dịch nào đạt được mức này với sản phẩm mới.`
            };
        }
        if (roas > BENCHMARKS.ROAS_OPTIMISTIC_MAX) {
            return {
                is_feasible: false,
                implied_roas: roas,
                risk_level: 'HIGH',
                warning_message: `⚠️ RỦI RO CAO: ROAS ${roas.toFixed(1)}x yêu cầu tối ưu hoàn hảo. Chỉ 5% chiến dịch đạt được.`
            };
        }
        if (roas > BENCHMARKS.ROAS_REALISTIC_MAX) {
            return {
                is_feasible: true,
                implied_roas: roas,
                risk_level: 'MEDIUM',
                warning_message: `⚡ KHẢ THI NHƯNG THÁCH THỨC: ROAS ${roas.toFixed(1)}x đòi hỏi tối ưu tốt.`
            };
        }
        return {
            is_feasible: true,
            implied_roas: roas,
            risk_level: 'LOW',
            warning_message: `✅ KẾ HOẠCH LÀNH MẠNH: ROAS ${roas.toFixed(1)}x là mục tiêu thực tế và an toàn.`
        };
    },

    /**
     * Format VND currency
     */
    formatVND(amount: number): string {
        if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + ' tỷ';
        if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(0) + ' triệu';
        if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'K';
        return amount.toLocaleString('vi-VN') + ' VND';
    },

    /**
     * Get industry-specific channels
     */
    getIndustryChannels(industry: string): { aware: string[]; trigger: string[]; convert: string[] } {
        const key = Object.keys(INDUSTRY_CHANNELS).find(k =>
            industry.toLowerCase().includes(k.toLowerCase())
        ) || 'Default';
        return INDUSTRY_CHANNELS[key];
    },

    /**
     * Get Production/Media ratio based on budget tier and asset status
     */
    getProductionRatio(budget: number, hasCreativeAssets: boolean): number {
        let baseRatio: number;

        if (budget < 50_000_000) {
            baseRatio = 0.30;  // Small budget: 30% production
        } else if (budget < 100_000_000) {
            baseRatio = 0.25;  // Medium budget: 25% production
        } else {
            baseRatio = 0.15;  // Large budget: 15% production
        }

        // If no creative assets, increase production budget
        if (!hasCreativeAssets) {
            baseRatio += 0.10;
        }

        return Math.min(baseRatio, 0.40); // Cap at 40%
    },

    /**
     * Calculate detailed budget distribution with channel breakdown
     */
    calculateBudgetDistribution(
        budget: number,
        focus: CampaignFocus,
        industry: string,
        assets: AssetChecklist = { has_website: true, has_customer_list: true, has_creative_assets: true }
    ): BudgetDistribution {
        const warnings: string[] = [];
        const disabledChannels: string[] = [];
        const channels: ChannelAllocation[] = [];

        // Step 1: Calculate Production/Media split
        const productionRatio = this.getProductionRatio(budget, assets.has_creative_assets);
        const productionBudget = Math.round(budget * productionRatio);
        const mediaBudget = budget - productionBudget;

        // Step 2: Define channel allocation based on focus
        const channelConfig = focus === 'CONVERSION'
            ? [
                // Conversion-focused allocation
                { name: 'Meta Ads (Retargeting)', type: 'PAID_MEDIA' as ChannelType, phase: 'CONVERT' as const, share: 0.25, requires: 'website' },
                { name: 'Meta Ads (Prospecting)', type: 'PAID_MEDIA' as ChannelType, phase: 'AWARE' as const, share: 0.20, requires: null },
                { name: 'Google Ads (Search)', type: 'PAID_MEDIA' as ChannelType, phase: 'CONVERT' as const, share: 0.15, requires: null },
                { name: 'Zalo OA/ZNS', type: 'CRM' as ChannelType, phase: 'TRIGGER' as const, share: 0.20, requires: 'customer_list' },
                { name: 'Email Marketing', type: 'CRM' as ChannelType, phase: 'TRIGGER' as const, share: 0.10, requires: 'customer_list' },
                { name: 'KOL/Influencer', type: 'CONTENT' as ChannelType, phase: 'TRIGGER' as const, share: 0.10, requires: null },
            ]
            : [
                // Branding-focused allocation
                { name: 'TikTok Ads', type: 'PAID_MEDIA' as ChannelType, phase: 'AWARE' as const, share: 0.25, requires: null },
                { name: 'YouTube Ads', type: 'PAID_MEDIA' as ChannelType, phase: 'AWARE' as const, share: 0.20, requires: null },
                { name: 'Meta Ads (Prospecting)', type: 'PAID_MEDIA' as ChannelType, phase: 'AWARE' as const, share: 0.20, requires: null },
                { name: 'KOL/Influencer', type: 'CONTENT' as ChannelType, phase: 'TRIGGER' as const, share: 0.20, requires: null },
                { name: 'PR/Content', type: 'CONTENT' as ChannelType, phase: 'TRIGGER' as const, share: 0.15, requires: null },
            ];

        // Step 3: Filter and allocate channels
        let availableShare = 1.0;
        const filteredConfig = channelConfig.filter(ch => {
            if (ch.requires === 'website' && !assets.has_website) {
                disabledChannels.push(`${ch.name} (Cần có Website)`);
                return false;
            }
            if (ch.requires === 'customer_list' && !assets.has_customer_list) {
                disabledChannels.push(`${ch.name} (Cần có Customer List)`);
                return false;
            }
            return true;
        });

        // Redistribute disabled shares
        const totalActiveShare = filteredConfig.reduce((sum, ch) => sum + ch.share, 0);

        // Step 4: Create channel allocations with KPIs
        filteredConfig.forEach(ch => {
            const normalizedShare = ch.share / totalActiveShare;
            const totalAllocation = Math.round(mediaBudget * normalizedShare);

            // Get channel-specific costs
            const costConfig = CHANNEL_COSTS[ch.name as keyof typeof CHANNEL_COSTS] || { cpc: 8000, production_ratio: 0.20 };
            const channelProductionRatio = (costConfig as any).production_ratio || 0.20;
            const channelProductionCost = Math.round(totalAllocation * channelProductionRatio);
            const channelMediaSpend = totalAllocation - channelProductionCost;

            // Calculate KPIs
            let kpi: { metric: string; value: number; unit_cost: number };
            let actionItem: string;

            if ('cost_per_message' in costConfig) {
                const msgCost = (costConfig as any).cost_per_message;
                kpi = { metric: 'Messages', value: Math.floor(channelMediaSpend / msgCost), unit_cost: msgCost };
                actionItem = `Segment danh sách khách hàng và tạo template ${ch.name === 'Zalo OA/ZNS' ? 'ZNS' : 'tin nhắn'}.`;
            } else if ('cost_per_send' in costConfig) {
                const sendCost = (costConfig as any).cost_per_send;
                kpi = { metric: 'Emails', value: Math.floor(channelMediaSpend / sendCost), unit_cost: sendCost };
                actionItem = 'Thiết kế email template và automation flow.';
            } else if ('flat_fee' in costConfig) {
                kpi = { metric: 'Reach (Est.)', value: Math.floor(channelMediaSpend / 50), unit_cost: 0 };
                actionItem = ch.name.includes('KOL')
                    ? 'Brief KOL và thương lượng hợp đồng.'
                    : 'Lên kế hoạch PR và content calendar.';
            } else {
                const cpc = (costConfig as any).cpc || 8000;
                kpi = { metric: 'Clicks', value: Math.floor(channelMediaSpend / cpc), unit_cost: cpc };
                actionItem = ch.name.includes('Retargeting')
                    ? 'Setup Pixel và tạo Custom Audience từ 30 ngày gần nhất.'
                    : `Tạo ad creatives và targeting audience cho ${ch.name}.`;
            }

            // Check for fragmented budget warning
            let warning: string | undefined;
            if (totalAllocation < BENCHMARKS.MIN_CHANNEL_BUDGET) {
                warning = `⚠️ Budget quá thấp (${this.formatVND(totalAllocation)}). Cân nhắc gộp vào kênh khác.`;
                warnings.push(`${ch.name}: ${warning}`);
            }

            channels.push({
                channel_name: ch.name,
                channel_type: ch.type,
                phase: ch.phase,
                total_allocation: totalAllocation,
                media_spend: channelMediaSpend,
                production_cost: channelProductionCost,
                estimated_kpi: kpi,
                action_item: actionItem,
                warning
            });
        });

        return {
            total_budget: budget,
            production_budget: productionBudget,
            media_budget: mediaBudget,
            production_ratio: productionRatio,
            channels,
            warnings,
            disabled_channels: disabledChannels
        };
    },

    /**
     * Validate Golden Thread - Check alignment between 3 objectives
     */
    validateGoldenThread(foundation: IMCStrategicFoundation): string[] {
        const warnings: string[] = [];
        const { business_obj, marketing_obj, communication_obj } = foundation;

        const businessLower = business_obj.toLowerCase();
        const marketingLower = marketing_obj.toLowerCase();
        const commLower = communication_obj.toLowerCase();

        if ((businessLower.includes('doanh thu') || businessLower.includes('revenue')) &&
            !marketingLower.includes('trial') && !marketingLower.includes('switch') &&
            !marketingLower.includes('mua') && !marketingLower.includes('chuyển đổi') &&
            !marketingLower.includes('dùng thử')) {
            warnings.push('⚠️ Business Objective về doanh thu nhưng Marketing Objective chưa rõ hành vi mua hàng.');
        }

        if (commLower.length < 20) {
            warnings.push('⚠️ Communication Objective quá chung chung. Cần xác định rõ thay đổi nhận thức cụ thể.');
        }

        return warnings;
    },

    /**
     * Generate comprehensive IMC V2 strategy using Gemini AI
     */
    async generateIMCPlan(input: IMCInput): Promise<IMCPlan | null> {
        try {
            const ai = getGeminiClient();
            if (!ai) {
                alert('Chưa cấu hình Gemini. Thêm VITE_GEMINI_API_KEY vào .env và khởi động lại ứng dụng');
                return null;
            }

            const industryChannels = this.getIndustryChannels(input.industry);
            const focusLabel = input.campaign_focus === 'BRANDING' ? 'Nhận diện thương hiệu' : 'Chuyển đổi doanh số';

            const systemPrompt = `Bạn là Giám đốc Marketing cấp cao với 15 năm kinh nghiệm xây dựng và thực thi chiến dịch IMC cho các thương hiệu tại Việt Nam và Đông Nam Á.

NHIỆM VỤ: Xây dựng kế hoạch IMC chặt chẽ, cực kỳ chi tiết, mang tính thực thi cao và dựa trên dữ liệu thật.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (STRICT JSON)
═══════════════════════════════════════════════════════════════

{
  "campaign_name": "Tên chiến dịch (ngắn gọn, memorable)",
  "strategic_foundation": {
    "business_obj": "Mục tiêu kinh doanh cụ thể",
    "marketing_obj": "Mục tiêu marketing cụ thể",
    "communication_obj": "Mục tiêu truyền thông cụ thể",
    "big_idea": "Concept trung tâm kết nối toàn bộ chiến dịch",
    "taglines": ["Tagline 1", "Tagline 2", "Tagline 3"],
    "competitive_angle": "Khoảng trắng truyền thông và tại sao idea này khác biệt",
    "message_architecture": {
      "brand_message": "Thông điệp thương hiệu",
      "campaign_message": "Thông điệp chiến dịch",
      "aware_message": "Thông điệp giai đoạn Aware",
      "trigger_message": "Thông điệp giai đoạn Trigger",
      "convert_message": "Thông điệp giai đoạn Convert"
    }
  },
  "imc_execution": [
    {
      "phase": "AWARE",
      "objective_detail": "Mục tiêu cụ thể của giai đoạn",
      "key_hook": "Key Hook cụ thể, dùng ngay được",
      "channels": ["Kênh 1", "Kênh 2"],
      "budget_allocation": "35%",
      "kpis": { "metric": "Reach & Views", "target": "Con số dự kiến" },
      "media_mix": [
        { "channel": "Tên kênh", "share": "45%", "amount": "XXX VND", "rationale": "Lý do chọn", "kpi": "KPI cụ thể" }
      ],
      "weekly_checkpoint": "KPI checkpoint và dấu hiệu thất bại/cần điều chỉnh",
      "execution_details": {
        "week_range": "Tuần 1-3",
        "start_week": 1,
        "end_week": 3,
        "budget_split": {
          "production": number,
          "media": number,
          "production_percent": "30%",
          "media_percent": "70%"
        },
        "content_items": [
          {"type": "Video TikTok", "quantity": 5, "estimated_cost": "15tr", "notes": "Ghi chú sản xuất"}
        ]
      }
    }
  ],
  "scenarios": [
    { "name": "Conservative", "probability": "70%", "leads": "X", "revenue": "Y VND", "roas": "Zx", "roi": "W%" },
    { "name": "Realistic", "probability": "50%", "leads": "X", "revenue": "Y VND", "roas": "Zx", "roi": "W%" },
    { "name": "Ambitious", "probability": "20%", "leads": "X", "revenue": "Y VND", "roas": "Zx", "roi": "W%" }
  ],
  "expert_notes": {
    "key_success_factor": "Yếu tố sống còn",
    "risks": [
      { "issue": "Rủi ro 1", "mitigation": "Cách phòng tránh" }
    ],
    "opportunity": "Cơ hội đang bị bỏ ngỏ",
    "frank_advice": "Lời khuyên thẳng thắn của CMO"
  }
}`;

            const planningModeLabel = input.planning_mode === 'BUDGET_DRIVEN' ? 'Tôi có Ngân sách' 
                                     : input.planning_mode === 'GOAL_DRIVEN' ? 'Tôi có Mục tiêu' 
                                     : 'Kiểm tra Khả thi';

            const userPrompt = `DỰ LIỆU ĐẦU VÀO CHI TIẾT:

▌ THÔNG TIN CHIẾN DỊCH
- Thương hiệu          : ${input.brand}
- Ngành hàng           : ${input.industry}
- Sản phẩm chủ đạo     : ${input.product}
- Giá bán (AOV)        : ${this.formatVND(input.product_price)}
- Ngân sách tổng       : ${this.formatVND(metrics.total_budget)}
- Chế độ               : ${planningModeLabel}

▌ MỤC TIÊU & ĐỐI TƯỢNG
- Mục tiêu chiến dịch  : ${focusLabel}
- KPI kỳ vọng          : Doanh thu ${this.formatVND(metrics.estimated_revenue)} · Đơn hàng ${metrics.estimated_orders}
- Timeline             : ${input.timeline_weeks} tuần
- Đối tượng mục tiêu   : ${input.audience_name || 'Chưa cung cấp'} · Pain point: ${input.audience_pain_desire || 'Chưa cung cấp'}
- Số liệu baseline     : Traffic: ${metrics.estimated_traffic.toLocaleString()} · ROAS: ${metrics.implied_roas.toFixed(1)}x

▌ BỐI CẢNH & CẠNH TRANH
- USP / Điểm khác biệt : ${input.usp || 'Chưa cung cấp'}
- Đối thủ chính        : ${input.competitors || 'Chưa cung cấp'}
- Tone & Tính cách     : ${input.tone || 'Chưa cung cấp'}
- Lịch sử chiến dịch   : ${input.past_campaigns || 'Chưa cung cấp'}

═══════════════════════════════════════════════════════════════
YÊU CẦU THỰC HIỆN:
1. Thực hiện Bước 0: Kiểm tra sự logic giữa Ngân sách và KPI kỳ vọng (Golden Thread Warnings).
2. Xây dựng Chiến lược Strategic Foundation (Phần 1) với Big Idea và Competitive Angle độc đáo.
3. Lập kế hoạch Execution Model (Phần 2) chi tiết qua 3 giai đoạn. Từng giai đoạn phải có BẢNG MEDIA MIX (% và VND chính xác từ ngân sách tổng).
4. Phân bổ Production Budget vs Media Budget hợp lý.
5. Xây dựng Kịch bản dự báo (Phần 3) chính xác dựa trên baseline.
6. Đưa ra lời khuyên gia chuyên CMO (Phần 4).

Lưu ý quan trọng: Ngôn ngữ Tiếng Việt, văn phong chuyên nghiệp Agency, dữ liệu phải thực tế với tình trạng ${metrics.feasibility.risk_level}.`;

            const ctxVision = (input.brand_vision_mission || '').trim();
            const ctxAudience = (input.audience_name || '').trim();
            const ctxPain = (input.audience_pain_desire || '').trim();
            const contextBlock =
                ctxVision || ctxAudience || ctxPain
                    ? `
BỐI CẢNH BỔ SUNG (từ người dùng):
- Tầm nhìn & giá trị thương hiệu: ${ctxVision || 'Không cung cấp'}
- Tên / mô tả khách hàng mục tiêu: ${ctxAudience || 'Không cung cấp'}
- Nỗi đau & khao khát: ${ctxPain || 'Không cung cấp'}
`
                    : '';

            const prompt = `Tạo kế hoạch IMC cho:
- Thương hiệu: ${input.brand}
- Sản phẩm: ${input.product}
- Giá sản phẩm (AOV): ${this.formatVND(input.product_price)}
- Ngành: ${input.industry}
- Timeline: ${input.timeline_weeks} tuần
- Campaign Focus: ${focusLabel}
${contextBlock}
Các con số đã được tính toán sẵn ở trên. Hãy tạo chiến lược phù hợp với các metrics này.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `${userPrompt}\n\n${prompt}`,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS,
                },
            });

            const text = response.text || "{}";
            const parsed = JSON.parse(text);

            // Validate Golden Thread
            const warnings = this.validateGoldenThread(parsed.strategic_foundation);

            // Add feasibility warning if applicable
            if (metrics.feasibility.warning_message) {
                warnings.unshift(metrics.feasibility.warning_message);
            }

            // Create IMC Plan object
            const imcPlan: IMCPlan = {
                id: Date.now().toString(),
                campaign_name: parsed.campaign_name,
                brand: input.brand,
                product: input.product,
                industry: input.industry,
                total_budget: metrics.total_budget,
                timeline_weeks: input.timeline_weeks,
                strategic_foundation: parsed.strategic_foundation,
                imc_execution: parsed.imc_execution || [],
                validation_warnings: warnings.length > 0 ? warnings : undefined,
                created_at: Date.now()
            };

            return imcPlan;
        } catch (error) {
            console.error('Error generating IMC plan:', error);
            return null;
        }
    },

    /**
     * Save IMC plan to Supabase & LocalStorage (Fallback)
     */
    async savePlan(plan: IMCPlan): Promise<boolean> {
        const STORAGE_KEY = 'mktlab_imc_plans';
        let supabaseSuccess = false;
        let localSuccess = false;

        // 1. Try Supabase
        try {
            const dbPlan = {
                id: plan.id,
                campaign_name: plan.campaign_name,
                brand: plan.brand,
                product: plan.product,
                industry: plan.industry,
                total_budget: Math.round(plan.total_budget || 0),
                timeline_weeks: plan.timeline_weeks,
                strategic_foundation: plan.strategic_foundation,
                imc_execution: plan.imc_execution,
                validation_warnings: plan.validation_warnings || null,
                created_at: new Date(plan.created_at).toISOString()
            };

            const { error } = await supabase
                .from('imc_plans')
                .upsert(dbPlan, { onConflict: 'id' });

            if (!error) {
                supabaseSuccess = true;
            } else {
                console.warn('Supabase save failed, relying on localStorage:', error);
            }
        } catch (error) {
            console.error('Error in Supabase savePlan:', error);
        }

        // 2. Always Save to LocalStorage
        try {
            const localPlansRaw = localStorage.getItem(STORAGE_KEY);
            let localPlans: IMCPlan[] = localPlansRaw ? JSON.parse(localPlansRaw) : [];
            
            // Remove existing version of the same plan if any
            localPlans = localPlans.filter(p => p.id !== plan.id);
            
            // Add new version to the top
            localPlans.unshift(plan);
            
            // Limit to 50 plans
            if (localPlans.length > 50) localPlans = localPlans.slice(0, 50);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localPlans));
            localSuccess = true;
        } catch (error) {
            console.error('Error in LocalStorage savePlan:', error);
        }

        return supabaseSuccess || localSuccess;
    },

    /**
     * Get all saved IMC plans from both sources
     */
    async getPlans(): Promise<IMCPlan[]> {
        const STORAGE_KEY = 'mktlab_imc_plans';
        let supabasePlans: IMCPlan[] = [];
        let localPlans: IMCPlan[] = [];

        // 1. Get from Supabase
        try {
            const { data, error } = await supabase
                .from('imc_plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                supabasePlans = data.map(item => ({
                    id: item.id,
                    campaign_name: item.campaign_name,
                    brand: item.brand,
                    product: item.product,
                    industry: item.industry || '',
                    total_budget: item.total_budget,
                    timeline_weeks: item.timeline_weeks,
                    strategic_foundation: item.strategic_foundation,
                    imc_execution: item.imc_execution,
                    validation_warnings: item.validation_warnings,
                    created_at: new Date(item.created_at).getTime()
                }));
            }
        } catch (error) {
            console.error('Error fetching Supabase plans:', error);
        }

        // 2. Get from LocalStorage
        try {
            const localPlansRaw = localStorage.getItem(STORAGE_KEY);
            if (localPlansRaw) {
                localPlans = JSON.parse(localPlansRaw);
            }
        } catch (error) {
            console.error('Error fetching LocalStorage plans:', error);
        }

        // 3. Merge and deduplicate
        const planMap = new Map<string, IMCPlan>();
        
        // Add local plans first (often more recent/up-to-date)
        localPlans.forEach(p => planMap.set(p.id, p));
        
        // Add/Overwrite with Supabase plans
        supabasePlans.forEach(p => planMap.set(p.id, p));

        // Convert back to array and sort by created_at descending
        return Array.from(planMap.values()).sort((a, b) => b.created_at - a.created_at);
    },

    /**
     * Delete IMC plan from both sources
     */
    async deletePlan(id: string): Promise<boolean> {
        const STORAGE_KEY = 'mktlab_imc_plans';
        let supabaseSuccess = false;
        let localSuccess = false;

        // 1. Delete from Supabase
        try {
            const { error } = await supabase
                .from('imc_plans')
                .delete()
                .eq('id', id);
            
            if (!error) supabaseSuccess = true;
        } catch (error) {
            console.error('Error deleting from Supabase:', error);
        }

        // 2. Delete from LocalStorage
        try {
            const localPlansRaw = localStorage.getItem(STORAGE_KEY);
            if (localPlansRaw) {
                let localPlans: IMCPlan[] = JSON.parse(localPlansRaw);
                const filtered = localPlans.filter(p => p.id !== id);
                if (filtered.length !== localPlans.length) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                }
                localSuccess = true;
            }
        } catch (error) {
            console.error('Error deleting from LocalStorage:', error);
        }

        return supabaseSuccess || localSuccess;
    }
};
