import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
    PieChart, DollarSign, Sparkles, Loader2, Save, History, Trash2, X, Plus, TrendingUp,
    Monitor, Database, Image, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, Cell } from 'recharts';
import { BudgetAllocatorService, SavedAllocation } from '../services/budgetAllocatorService';
import { Toast, ToastType } from './Toast';
import FeatureHeader from './FeatureHeader';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

interface AssetChecklist {
    hasWebsite: boolean;
    hasCustomerList: boolean;
    hasCreativeAssets: boolean;
}

interface ChannelBreakdown {
    channel: string;
    role: string;
    phase: 'AWARE' | 'TRIGGER' | 'CONVERT';
    totalAllocation: number;
    mediaSpend: number;
    productionCost: number;
    platformFee?: number;
    estimatedKpi: {
        metric: string;
        value: number;
        unitCost: number;
    };
    actionItem: string;
    warning?: string;
}

interface BudgetDistributionResult {
    totalBudget: number;
    productionBudget: number;
    mediaBudget: number;
    productionRatio: number;
    channels: ChannelBreakdown[];
    warnings: string[];
    disabledChannels: DisabledChannel[];
    strategyName: string;
}

// Smart tooltip interface for disabled channels
interface DisabledChannel {
    name: string;
    reason: string;
}

interface BudgetAllocatorInput {
    totalBudget: number;
    kpi: 'sales' | 'awareness' | 'retention' | 'custom';
    customKpi?: string;
    industry: string;
}

// Note: SavedAllocation, AssetChecklist, BudgetDistributionResult, etc.
// are now imported from '../services/budgetAllocatorService'

// ═══════════════════════════════════════════════════════════════
// BENCHMARKS & CONSTANTS (Senior Performance Marketing Director)
// ═══════════════════════════════════════════════════════════════

const CHANNEL_COSTS = {
    'Meta Ads (Prospecting)': { cpc: 8_000, production_ratio: 0.20 },
    'Meta Ads (Retargeting)': { cpc: 15_000, production_ratio: 0.15 },
    'Google Ads (Search)': { cpc: 20_000, production_ratio: 0.10 },
    'Google Ads (Display)': { cpc: 5_000, production_ratio: 0.20 },
    'TikTok Ads': { cpc: 6_000, production_ratio: 0.25 },
    'YouTube Ads': { cpc: 10_000, production_ratio: 0.30 },
    'Zalo OA/ZNS': { cost_per_message: 500, production_ratio: 0.15 },
    'SMS Marketing': { cost_per_message: 800, production_ratio: 0.10 },
    'Email Marketing': { cost_per_send: 50, production_ratio: 0.25 },
    'KOL/Influencer': { flat_fee: true, production_ratio: 0.40 },
};

const MIN_CHANNEL_BUDGET = 2_000_000;

const CHANNEL_COLORS = {
    'Meta Ads (Prospecting)': '#8b5cf6',
    'Meta Ads (Retargeting)': '#7c3aed',
    'Google Ads (Search)': '#f59e0b',
    'Google Ads (Display)': '#fbbf24',
    'TikTok Ads': '#ec4899',
    'YouTube Ads': '#ef4444',
    'Zalo OA/ZNS': '#3b82f6',
    'SMS Marketing': '#06b6d4',
    'Email Marketing': '#10b981',
    'KOL/Influencer': '#6366f1',
};

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

// ═══════════════════════════════════════════════════════════════
// CALCULATION LOGIC
// ═══════════════════════════════════════════════════════════════

const getProductionRatio = (budget: number, hasCreativeAssets: boolean): number => {
    let baseRatio: number;

    if (budget < 50_000_000) {
        baseRatio = 0.30;  // Small budget: 30% production
    } else if (budget < 100_000_000) {
        baseRatio = 0.25;  // Medium budget: 25% production
    } else {
        baseRatio = 0.15;  // Large budget: 15% production
    }

    if (!hasCreativeAssets) {
        baseRatio += 0.10;
    }

    return Math.min(baseRatio, 0.40);
};

const formatVND = (amount: number): string => {
    if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + ' tỷ';
    if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(0) + ' triệu';
    if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'K';
    return amount.toLocaleString('vi-VN') + ' VND';
};

const calculateBudgetDistribution = (
    budget: number,
    kpi: string,
    industry: string,
    assets: AssetChecklist
): BudgetDistributionResult => {
    const warnings: string[] = [];
    const disabledChannels: DisabledChannel[] = [];
    const channels: ChannelBreakdown[] = [];

    // ═══════════════════════════════════════════════════════════════
    // COLD START PROBLEM - Asset Dependency Check
    // ═══════════════════════════════════════════════════════════════

    const isZeroDataUser = !assets.hasWebsite || !assets.hasCustomerList;
    const hasNoWebsite = !assets.hasWebsite;
    const hasNoCustomerList = !assets.hasCustomerList;

    // Step 1: Calculate Production/Media split
    const productionRatio = getProductionRatio(budget, assets.hasCreativeAssets);
    const productionBudget = Math.round(budget * productionRatio);
    const mediaBudget = budget - productionBudget;

    // Step 2: Define base channel allocation based on KPI
    type ChannelConfig = {
        name: string;
        role: string;
        phase: 'AWARE' | 'TRIGGER' | 'CONVERT';
        baseShare: number;
        requires: 'website' | 'customer_list' | null;
        isProspecting?: boolean;
        isRetargeting?: boolean;
        isCRM?: boolean;
    };

    let channelConfig: ChannelConfig[] = [];
    let strategyName = '';

    if (kpi === 'sales') {
        strategyName = 'Performance-First Strategy';
        channelConfig = [
            { name: 'Meta Ads (Prospecting)', role: 'New Audience Acquisition', phase: 'AWARE', baseShare: 0.30, requires: null, isProspecting: true },
            { name: 'Google Ads (Search)', role: 'High-Intent Capture', phase: 'CONVERT', baseShare: 0.25, requires: null, isProspecting: true },
            { name: 'Meta Ads (Retargeting)', role: 'Conversion Driver', phase: 'CONVERT', baseShare: 0.20, requires: 'website', isRetargeting: true },
            { name: 'Zalo OA/ZNS', role: 'CRM Push', phase: 'TRIGGER', baseShare: 0.15, requires: 'customer_list', isCRM: true },
            { name: 'Email Marketing', role: 'Nurture Flow', phase: 'TRIGGER', baseShare: 0.10, requires: 'customer_list', isCRM: true },
        ];
    } else if (kpi === 'awareness') {
        strategyName = 'Reach & Frequency Strategy';
        channelConfig = [
            { name: 'TikTok Ads', role: 'Viral Reach', phase: 'AWARE', baseShare: 0.35, requires: null, isProspecting: true },
            { name: 'YouTube Ads', role: 'Brand Storytelling', phase: 'AWARE', baseShare: 0.25, requires: null, isProspecting: true },
            { name: 'Meta Ads (Prospecting)', role: 'Social Reach', phase: 'AWARE', baseShare: 0.25, requires: null, isProspecting: true },
            { name: 'KOL/Influencer', role: 'Trust Builder', phase: 'TRIGGER', baseShare: 0.15, requires: null },
        ];
    } else if (kpi === 'retention') {
        strategyName = 'Customer Loyalty Strategy';
        channelConfig = [
            { name: 'Zalo OA/ZNS', role: 'Direct CRM', phase: 'TRIGGER', baseShare: 0.30, requires: 'customer_list', isCRM: true },
            { name: 'Email Marketing', role: 'Loyalty Nurture', phase: 'TRIGGER', baseShare: 0.25, requires: 'customer_list', isCRM: true },
            { name: 'SMS Marketing', role: 'Flash Alerts', phase: 'CONVERT', baseShare: 0.15, requires: 'customer_list', isCRM: true },
            { name: 'Meta Ads (Retargeting)', role: 'Win-back', phase: 'CONVERT', baseShare: 0.20, requires: 'website', isRetargeting: true },
            { name: 'Meta Ads (Prospecting)', role: 'Lookalike Expansion', phase: 'AWARE', baseShare: 0.10, requires: null, isProspecting: true },
        ];
    } else {
        strategyName = 'Balanced Multi-Channel Strategy';
        channelConfig = [
            { name: 'Meta Ads (Prospecting)', role: 'Top Funnel', phase: 'AWARE', baseShare: 0.30, requires: null, isProspecting: true },
            { name: 'Google Ads (Search)', role: 'Intent Capture', phase: 'CONVERT', baseShare: 0.25, requires: null, isProspecting: true },
            { name: 'TikTok Ads', role: 'Engagement', phase: 'TRIGGER', baseShare: 0.20, requires: null, isProspecting: true },
            { name: 'Zalo OA/ZNS', role: 'CRM', phase: 'TRIGGER', baseShare: 0.15, requires: 'customer_list', isCRM: true },
            { name: 'Meta Ads (Retargeting)', role: 'Conversion', phase: 'CONVERT', baseShare: 0.10, requires: 'website', isRetargeting: true },
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO A: "ZERO DATA" USER - Cold Start Problem Fix
    // ═══════════════════════════════════════════════════════════════

    let redistributedShare = 0;
    const activeChannels: (ChannelConfig & { adjustedShare: number })[] = [];

    channelConfig.forEach(ch => {
        let adjustedShare = ch.baseShare;
        let isDisabled = false;
        let disableReason = '';

        // Rule 1: CRM channels require customer list - Force to 0%
        if (ch.isCRM && hasNoCustomerList) {
            isDisabled = true;
            disableReason = `Không phân bổ budget vì bạn chưa có Customer List. Hãy tập trung acquire khách hàng qua Meta/Google trước.`;
            redistributedShare += ch.baseShare;
        }

        // Rule 2: Website retargeting without website - Cap at 10% max (engagement only)
        if (ch.isRetargeting && hasNoWebsite) {
            if (ch.baseShare > 0.10) {
                redistributedShare += ch.baseShare - 0.10;
                adjustedShare = 0.10;
                warnings.push(`${ch.name}: Giảm xuống 10% (chỉ retarget engagement, không có web traffic)`);
            }
            // Change role to engagement-only
            ch.role = 'Engagement Retargeting (No Web)';
        }

        if (isDisabled) {
            disabledChannels.push({
                name: ch.name,
                reason: disableReason
            });
        } else {
            activeChannels.push({ ...ch, adjustedShare });
        }
    });

    // ═══════════════════════════════════════════════════════════════
    // REDISTRIBUTE BUDGET TO PROSPECTING CHANNELS
    // ═══════════════════════════════════════════════════════════════

    const prospectingChannels = activeChannels.filter(ch => ch.isProspecting);
    const totalProspectingShare = prospectingChannels.reduce((sum, ch) => sum + ch.adjustedShare, 0);

    if (redistributedShare > 0 && prospectingChannels.length > 0) {
        // Redistribute proportionally to prospecting channels
        prospectingChannels.forEach(ch => {
            const proportion = ch.adjustedShare / totalProspectingShare;
            ch.adjustedShare += redistributedShare * proportion;
        });

        if (redistributedShare > 0.1) {
            warnings.push(`Đã chuyển ${Math.round(redistributedShare * 100)}% budget từ CRM/Retargeting sang Prospecting để xây dựng traffic pool`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO B: ECOMMERCE READY - Prospecting > Retargeting Ratio
    // ═══════════════════════════════════════════════════════════════

    if (assets.hasWebsite) {
        const retargetingChannels = activeChannels.filter(ch => ch.isRetargeting);
        const totalRetargetingShare = retargetingChannels.reduce((sum, ch) => sum + ch.adjustedShare, 0);
        const currentProspectingShare = prospectingChannels.reduce((sum, ch) => sum + ch.adjustedShare, 0);

        // Enforce: Prospecting should be at least 60% of (Prospecting + Retargeting)
        const combinedShare = currentProspectingShare + totalRetargetingShare;
        const minProspectingRatio = 0.6;

        if (combinedShare > 0 && currentProspectingShare / combinedShare < minProspectingRatio) {
            warnings.push(`⚠️ Cân bằng lại: Prospecting phải > 60% so với Retargeting (hiện tại ${Math.round(currentProspectingShare / combinedShare * 100)}%)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // NORMALIZE SHARES & CREATE CHANNEL ALLOCATIONS
    // ═══════════════════════════════════════════════════════════════

    const totalActiveShare = activeChannels.reduce((sum, ch) => sum + ch.adjustedShare, 0);

    activeChannels.forEach(ch => {
        const normalizedShare = ch.adjustedShare / totalActiveShare;
        let totalAllocation = Math.round(mediaBudget * normalizedShare);

        // Get channel-specific costs (with adjustments)
        let costConfig = { ...CHANNEL_COSTS[ch.name as keyof typeof CHANNEL_COSTS] } || { cpc: 8000, production_ratio: 0.20 };

        // ═══════════════════════════════════════════════════════════
        // REFINED COST ESTIMATIONS
        // ═══════════════════════════════════════════════════════════

        // Retargeting CPC is 0.6x of Prospecting (higher CTR)
        if (ch.isRetargeting && 'cpc' in costConfig) {
            (costConfig as any).cpc = Math.round((costConfig as any).cpc * 0.6);
        }

        // Email Marketing: Cap tool cost at 2M, rest is content
        if (ch.name === 'Email Marketing') {
            const toolCost = Math.min(totalAllocation * 0.3, 2_000_000);
            const contentCost = totalAllocation - toolCost;
            // Adjust production ratio based on this split
            (costConfig as any).production_ratio = contentCost / totalAllocation;
        }

        const channelProductionRatio = (costConfig as any).production_ratio || 0.20;
        const channelProductionCost = Math.round(totalAllocation * channelProductionRatio);
        const channelMediaSpend = totalAllocation - channelProductionCost;

        // Calculate KPIs
        let kpiData: { metric: string; value: number; unitCost: number };
        let actionItem: string;

        if ('cost_per_message' in costConfig) {
            const msgCost = (costConfig as any).cost_per_message;
            kpiData = { metric: 'Messages', value: Math.floor(channelMediaSpend / msgCost), unitCost: msgCost };
            actionItem = `Segment khách hàng theo "Last Purchased Date" và tạo ${ch.name === 'Zalo OA/ZNS' ? 'ZNS template' : 'tin nhắn'}.`;
        } else if ('cost_per_send' in costConfig || ch.name === 'Email Marketing') {
            const sendCost = 50; // per email
            kpiData = { metric: 'Emails', value: Math.floor(channelMediaSpend / sendCost), unitCost: sendCost };
            actionItem = 'Setup Mailchimp/Klaviyo subscription (1-2M) + Email templates & automation flow.';
        } else if ('flat_fee' in costConfig) {
            kpiData = { metric: 'Reach (Est.)', value: Math.floor(channelMediaSpend / 50), unitCost: 0 };
            actionItem = 'Brief KOL, thương lượng hợp đồng và timeline content.';
        } else {
            const cpc = (costConfig as any).cpc || 8000;
            kpiData = { metric: 'Clicks', value: Math.floor(channelMediaSpend / cpc), unitCost: cpc };

            if (ch.isRetargeting) {
                actionItem = hasNoWebsite
                    ? 'Retarget engagement từ fanpage/video views (không có web traffic).'
                    : 'Setup Pixel events và tạo Custom Audience từ 30 ngày gần nhất.';
            } else {
                actionItem = `Tạo ad creatives, LAL audiences và targeting cho ${ch.name}.`;
            }
        }

        // Warning for fragmented budget
        let warning: string | undefined;
        if (totalAllocation < MIN_CHANNEL_BUDGET) {
            warning = `⚠️ Budget ${formatVND(totalAllocation)} quá thấp (<2M). Cân nhắc gộp vào kênh khác.`;
            warnings.push(`${ch.name}: ${warning}`);
        }

        channels.push({
            channel: ch.name,
            role: ch.role,
            phase: ch.phase,
            totalAllocation,
            mediaSpend: channelMediaSpend,
            productionCost: channelProductionCost,
            estimatedKpi: kpiData,
            actionItem,
            warning
        });
    });

    return {
        totalBudget: budget,
        productionBudget,
        mediaBudget,
        productionRatio,
        channels,
        warnings,
        disabledChannels,
        strategyName
    };
};

// ═══════════════════════════════════════════════════════════════
// CHANNEL CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

const ChannelCard = ({ channel }: { channel: ChannelBreakdown }) => {
    const [expanded, setExpanded] = useState(false);
    const color = CHANNEL_COLORS[channel.channel as keyof typeof CHANNEL_COLORS] || '#6366f1';

    return (
        <div className={`overflow-hidden rounded-2xl border bg-white transition-all ${channel.warning ? 'border-amber-300' : 'border-stone-200/90'}`}>
            {/* Header */}
            <div
                className="cursor-pointer p-4 transition-colors hover:bg-stone-50/60"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <div>
                            <h3 className="text-sm font-medium text-stone-900">{channel.channel}</h3>
                            <p className="text-xs text-stone-500">{channel.role}</p>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                        <div>
                            <div className="text-lg font-semibold text-stone-900">{formatVND(channel.totalAllocation)}</div>
                            <div className="text-xs text-stone-500">
                                Est. {channel.estimatedKpi.value.toLocaleString()} {channel.estimatedKpi.metric}
                            </div>
                        </div>
                        {expanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                    </div>
                </div>

                {/* Stacked Mini Bar */}
                <div className="mt-3 h-2 rounded-full overflow-hidden flex">
                    <div
                        className="h-full"
                        style={{ width: `${(channel.mediaSpend / channel.totalAllocation) * 100}%`, backgroundColor: color }}
                    ></div>
                    <div
                        className="h-full bg-stone-300"
                        style={{ width: `${(channel.productionCost / channel.totalAllocation) * 100}%` }}
                    ></div>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-stone-500">
                    <span>Media: {formatVND(channel.mediaSpend)}</span>
                    <span>Sản xuất: {formatVND(channel.productionCost)}</span>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="space-y-3 border-t border-stone-100 px-4 pb-4 pt-3">
                    {/* Unit Cost */}
                    {channel.estimatedKpi.unitCost > 0 && (
                        <div className="text-xs text-stone-600">
                            Đơn giá: <strong>{formatVND(channel.estimatedKpi.unitCost)}</strong> / {channel.estimatedKpi.metric.replace('s', '')}
                        </div>
                    )}

                    {/* Action Item */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Action Item</div>
                        <p className="text-xs text-stone-700">{channel.actionItem}</p>
                    </div>

                    {/* Warning */}
                    {channel.warning && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">{channel.warning}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const BudgetAllocator: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<BudgetAllocatorInput & { customKpi?: string }>();
    const [result, setResult] = useState<BudgetDistributionResult | null>(null);
    const [currentInput, setCurrentInput] = useState<BudgetAllocatorInput | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [savedAllocations, setSavedAllocations] = useState<SavedAllocation[]>([]);
    const [toastState, setToastState] = useState<{ message: string; type: ToastType } | null>(null);

    // Asset Checklist
    const [hasWebsite, setHasWebsite] = useState(true);
    const [hasCustomerList, setHasCustomerList] = useState(true);
    const [hasCreativeAssets, setHasCreativeAssets] = useState(true);

    const watchedKpi = watch('kpi');
    const watchedBudget = watch('totalBudget');
    const showToast = (message: string, type: ToastType = 'info') => setToastState({ message, type });

    // Load saved allocations from Supabase
    useEffect(() => {
        const loadAllocations = async () => {
            // Try to migrate from localStorage first (one-time)
            const localData = localStorage.getItem('budget_allocator_v2_history');
            if (localData) {
                const migrated = await BudgetAllocatorService.migrateFromLocalStorage();
                if (migrated > 0) {
                    showToast(`Đã migrate ${migrated} bản ghi lên cloud!`, 'success');
                }
            }

            // Load from Supabase
            const allocations = await BudgetAllocatorService.getAllocations();
            setSavedAllocations(allocations);
        };
        loadAllocations();
    }, []);

    // Live preview of production ratio
    const previewRatio = useMemo(() => {
        const budget = parseFloat(String(watchedBudget)) || 0;
        if (budget <= 0) return null;
        return getProductionRatio(budget, hasCreativeAssets);
    }, [watchedBudget, hasCreativeAssets]);

    const onSubmit = async (data: BudgetAllocatorInput) => {
        setIsCalculating(true);

        // Simulate brief loading
        await new Promise(r => setTimeout(r, 500));

        const assets: AssetChecklist = {
            hasWebsite,
            hasCustomerList,
            hasCreativeAssets
        };

        const distribution = calculateBudgetDistribution(
            data.totalBudget,
            data.kpi === 'custom' ? 'custom' : data.kpi,
            data.industry,
            assets
        );

        setResult(distribution);
        setCurrentInput(data);
        setIsCalculating(false);

        showToast('Phân bổ ngân sách hoàn tất!', 'success');
    };

    const handleSave = async () => {
        if (!result || !currentInput) return;

        const newAllocation: SavedAllocation = {
            id: Date.now().toString(),
            input: currentInput,
            assets: { hasWebsite, hasCustomerList, hasCreativeAssets },
            result,
            timestamp: Date.now()
        };

        const success = await BudgetAllocatorService.saveAllocation(newAllocation);
        if (success) {
            const updated = [newAllocation, ...savedAllocations];
            setSavedAllocations(updated);
            showToast('Đã lưu lên cloud!', 'success');
        } else {
            showToast('Lưu thất bại!', 'error');
        }
    };

    const handleLoad = (item: SavedAllocation) => {
        setResult(item.result);
        setCurrentInput(item.input);
        setHasWebsite(item.assets.hasWebsite);
        setHasCustomerList(item.assets.hasCustomerList);
        setHasCreativeAssets(item.assets.hasCreativeAssets);
        reset(item.input);
        setShowHistory(false);
        showToast('Đã tải!', 'success');
    };

    const handleDelete = async (id: string) => {
        const success = await BudgetAllocatorService.deleteAllocation(id);
        if (success) {
            const updated = savedAllocations.filter(s => s.id !== id);
            setSavedAllocations(updated);
            showToast('Đã xóa!', 'success');
        } else {
            showToast('Xóa thất bại!', 'error');
        }
    };

    const handleNew = () => {
        setResult(null);
        setCurrentInput(null);
        setHasWebsite(true);
        setHasCustomerList(true);
        setHasCreativeAssets(true);
        reset();
        showToast('Sẵn sàng phân bổ mới!', 'success');
    };

    // Chart data for stacked bar
    const chartData = result?.channels.map(ch => ({
        name: ch.channel.replace(' Ads', '').replace(' Marketing', ''),
        Media: ch.mediaSpend,
        'Sản xuất': ch.productionCost,
        fill: CHANNEL_COLORS[ch.channel as keyof typeof CHANNEL_COLORS] || '#6366f1'
    })) || [];

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">

            <FeatureHeader
                icon={PieChart}
                eyebrow="FINANCIAL PLANNING"
                title="Budget Allocator"
                subline="Tối ưu hóa ngân sách quảng cáo — Phân bổ ngân sách dựa trên hiệu suất và mục tiêu kinh doanh."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-95 ${showHistory ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                        title={`Lịch sử (${savedAllocations.length})`}
                        aria-label={`Mở lịch sử phân bổ ngân sách, ${savedAllocations.length} phân bổ đã lưu`}
                    >
                        <History size={18} strokeWidth={2} />
                    </button>
                    {result && (
                        <button
                            onClick={handleNew}
                            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95"
                        >
                            <Plus size={16} /> Tạo mới
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!result}
                        className={`inline-flex h-10 items-center gap-2 rounded-2xl px-5 text-sm font-medium shadow-sm transition-all active:scale-95 ${result
                                ? 'bg-stone-900 text-white hover:bg-stone-800'
                                : 'cursor-not-allowed bg-stone-100 text-stone-400'
                            }`}
                    >
                        <Save size={16} /> Lưu
                    </button>
                </div>
            </FeatureHeader>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '420px 280px 1fr' : '420px 1fr' }}>
                {/* LEFT: Form */}
                <div className="h-full overflow-y-auto border-r border-stone-200/80 bg-white p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Budget Input */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Ngân sách tổng (VND)</label>
                            <input
                                {...register('totalBudget', {
                                    required: 'Vui lòng nhập ngân sách',
                                    min: { value: 10_000_000, message: 'Tối thiểu 10 triệu VND' }
                                })}
                                type="number"
                                placeholder="VD: 50000000"
                                className={inputClass}
                            />
                            {errors.totalBudget && <p className="text-xs text-red-500 mt-1">{errors.totalBudget.message}</p>}

                            {/* Live Preview Ratio */}
                            {previewRatio !== null && (
                                <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-600">
                                    📊 Preview: Production {Math.round(previewRatio * 100)}% | Media {Math.round((1 - previewRatio) * 100)}%
                                </div>
                            )}
                        </div>

                        {/* Asset Checklist */}
                        <div className={`${cardClass} p-4`}>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-900">
                                📋 Asset Checklist
                            </h3>
                            <p className="mb-4 text-xs text-stone-500">Điều chỉnh channels dựa trên tài sản hiện có</p>

                            <div className="space-y-2">
                                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-100 bg-white p-2 hover:bg-stone-50">
                                    <div className="flex items-center gap-2">
                                        <Monitor size={16} className={hasWebsite ? 'text-stone-700' : 'text-stone-400'} />
                                        <span className="text-sm">Website</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasWebsite(!hasWebsite)}
                                        className={`relative h-5 w-10 rounded-full transition-colors ${hasWebsite ? 'bg-stone-900' : 'bg-stone-300'}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hasWebsite ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </label>

                                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-100 bg-white p-2 hover:bg-stone-50">
                                    <div className="flex items-center gap-2">
                                        <Database size={16} className={hasCustomerList ? 'text-stone-700' : 'text-stone-400'} />
                                        <span className="text-sm">Customer List</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasCustomerList(!hasCustomerList)}
                                        className={`relative h-5 w-10 rounded-full transition-colors ${hasCustomerList ? 'bg-stone-900' : 'bg-stone-300'}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hasCustomerList ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </label>

                                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-100 bg-white p-2 hover:bg-stone-50">
                                    <div className="flex items-center gap-2">
                                        <Image size={16} className={hasCreativeAssets ? 'text-stone-700' : 'text-stone-400'} />
                                        <span className="text-sm">Creative Assets</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasCreativeAssets(!hasCreativeAssets)}
                                        className={`relative h-5 w-10 rounded-full transition-colors ${hasCreativeAssets ? 'bg-stone-900' : 'bg-stone-300'}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hasCreativeAssets ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </label>
                            </div>
                        </div>

                        {/* KPI Selection */}
                        <div>
                            <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-stone-500">Mục tiêu (KPI)</label>
                            <div className="space-y-2">
                                {[
                                    { value: 'sales', label: 'Chuyển đổi/Doanh số', desc: 'Performance - Ra số nhanh' },
                                    { value: 'awareness', label: 'Nhận diện thương hiệu', desc: 'Branding - Tăng độ nhận biết' },
                                    { value: 'retention', label: 'Giữ chân khách hàng', desc: 'Retention - Chăm sóc khách cũ' },
                                ].map(kpi => (
                                    <label key={kpi.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/40">
                                        <input
                                            {...register('kpi', { required: 'Vui lòng chọn KPI' })}
                                            type="radio"
                                            value={kpi.value}
                                            className="mt-0.5 h-4 w-4 text-stone-700"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-stone-800">{kpi.label}</div>
                                            <div className="text-xs text-stone-500">{kpi.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {errors.kpi && <p className="text-xs text-red-500 mt-1">{errors.kpi.message}</p>}
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Ngành hàng</label>
                            <input
                                {...register('industry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: Thời trang, F&B, B2B..."
                                className={inputClass}
                            />
                            {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isCalculating}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:opacity-70"
                        >
                            {isCalculating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Đang tính toán...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Phân bổ ngân sách
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* HISTORY SIDEBAR */}
                {showHistory && (
                    <div className="h-full overflow-y-auto border-r border-stone-200/80 bg-white p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center gap-2 text-sm font-medium text-stone-900">
                                <History size={16} className="text-stone-400" />
                                Lịch sử
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="rounded-lg p-1 hover:bg-stone-100">
                                <X size={16} className="text-stone-400" />
                            </button>
                        </div>

                        {savedAllocations.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <History size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Chưa có lịch sử</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {savedAllocations.map(item => (
                                    <div
                                        key={item.id}
                                        className="group cursor-pointer rounded-xl border border-stone-200/90 bg-white p-3 transition-colors hover:bg-stone-50"
                                        onClick={() => handleLoad(item)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-sm font-semibold text-stone-800">{formatVND(item.result.totalBudget)}</div>
                                                <div className="text-xs text-stone-500">{item.input.industry}</div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="rounded p-1 opacity-0 hover:bg-red-50 group-hover:opacity-100"
                                            >
                                                <Trash2 size={12} className="text-red-500" />
                                            </button>
                                        </div>
                                        <p className="mt-1 text-[10px] text-stone-400">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT: Results */}
                <div className="h-full overflow-auto bg-stone-100/60 p-6">
                    {!result && !isCalculating && (
                        <div className="flex h-full flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200 bg-white">
                                <DollarSign size={28} strokeWidth={1.5} className="text-stone-300" />
                            </div>
                            <p className="text-base font-medium text-stone-600">Budget Allocator V2</p>
                            <p className="mt-1 text-sm text-stone-400">Nhập thông tin để phân bổ ngân sách</p>
                        </div>
                    )}

                    {isCalculating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-14 h-14 mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-700 animate-spin"></div>
                            </div>
                            <p className="text-sm font-semibold text-stone-600">Đang tính toán...</p>
                        </div>
                    )}

                    {result && !isCalculating && (
                        <div className="max-w-5xl mx-auto space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-stone-900">{result.strategyName}</h2>
                                    <p className="text-sm text-stone-500">
                                        Tổng: <span className="font-semibold text-stone-800">{formatVND(result.totalBudget)}</span>
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-center">
                                        <div className="text-xs text-stone-500">Sản xuất</div>
                                        <div className="text-lg font-semibold text-stone-800">{Math.round(result.productionRatio * 100)}%</div>
                                        <div className="text-xs text-stone-500">{formatVND(result.productionBudget)}</div>
                                    </div>
                                    <div className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-center">
                                        <div className="text-xs text-stone-500">Media</div>
                                        <div className="text-lg font-semibold text-stone-800">{Math.round((1 - result.productionRatio) * 100)}%</div>
                                        <div className="text-xs text-stone-500">{formatVND(result.mediaBudget)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Warnings */}
                            {result.warnings.length > 0 && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2">
                                        <AlertTriangle size={16} />
                                        Cảnh báo
                                    </div>
                                    <ul className="text-xs text-amber-600 space-y-1">
                                        {result.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Disabled Channels with Smart Tooltips */}
                            {result.disabledChannels.length > 0 && (
                                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Channels không được phân bổ</div>
                                    <div className="space-y-2">
                                        {result.disabledChannels.map((ch, i) => (
                                            <div key={i} className="rounded-lg border border-stone-200 bg-white p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-stone-700">{ch.name}</span>
                                                    <span className="rounded bg-stone-200 px-2 py-0.5 text-[10px] text-stone-600">0 VND</span>
                                                </div>
                                                <p className="text-xs italic text-stone-500">{ch.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stacked Bar Chart */}
                            <div className={`${cardClass} p-6`}>
                                <h3 className="mb-4 text-sm font-medium text-stone-900">📊 Media vs Sản xuất theo Channel</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={chartData} layout="vertical">
                                        <XAxis type="number" tickFormatter={(v) => formatVND(v)} />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(value) => formatVND(value as number)} />
                                        <Legend />
                                        <Bar dataKey="Media" stackId="a" fill="#57534e" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="Sản xuất" stackId="a" fill="#a8a29e" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Channel Cards */}
                            <div>
                                <h3 className="mb-3 text-sm font-medium text-stone-900">📋 Chi tiết theo Channel</h3>
                                <div className="space-y-3">
                                    {result.channels.map((ch, i) => (
                                        <ChannelCard key={i} channel={ch} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {toastState && (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                    onClose={() => setToastState(null)}
                />
            )}
        </div>
    );
};

export default BudgetAllocator;
