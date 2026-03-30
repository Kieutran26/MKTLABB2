import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
    PieChart, DollarSign, Sparkles, Loader2, Save, History, Trash2, X, Plus, TrendingUp,
    Monitor, Database, Image, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, Cell } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { BudgetAllocatorService, SavedAllocation } from '../services/budgetAllocatorService';

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
        <div className={`bg-white border rounded-xl overflow-hidden transition-all ${channel.warning ? 'border-amber-300' : 'border-slate-200'}`}>
            {/* Header */}
            <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">{channel.channel}</h3>
                            <p className="text-xs text-indigo-600">{channel.role}</p>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                        <div>
                            <div className="text-lg font-bold text-slate-900">{formatVND(channel.totalAllocation)}</div>
                            <div className="text-xs text-slate-500">
                                Est. {channel.estimatedKpi.value.toLocaleString()} {channel.estimatedKpi.metric}
                            </div>
                        </div>
                        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                </div>

                {/* Stacked Mini Bar */}
                <div className="mt-3 h-2 rounded-full overflow-hidden flex">
                    <div
                        className="h-full"
                        style={{ width: `${(channel.mediaSpend / channel.totalAllocation) * 100}%`, backgroundColor: color }}
                    ></div>
                    <div
                        className="h-full bg-purple-300"
                        style={{ width: `${(channel.productionCost / channel.totalAllocation) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Media: {formatVND(channel.mediaSpend)}</span>
                    <span>Sản xuất: {formatVND(channel.productionCost)}</span>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                    {/* Unit Cost */}
                    {channel.estimatedKpi.unitCost > 0 && (
                        <div className="text-xs text-slate-600">
                            Đơn giá: <strong>{formatVND(channel.estimatedKpi.unitCost)}</strong> / {channel.estimatedKpi.metric.replace('s', '')}
                        </div>
                    )}

                    {/* Action Item */}
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <div className="text-xs font-bold text-indigo-700 mb-1">📋 Action Item:</div>
                        <p className="text-xs text-indigo-600">{channel.actionItem}</p>
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

    // Asset Checklist
    const [hasWebsite, setHasWebsite] = useState(true);
    const [hasCustomerList, setHasCustomerList] = useState(true);
    const [hasCreativeAssets, setHasCreativeAssets] = useState(true);

    const watchedKpi = watch('kpi');
    const watchedBudget = watch('totalBudget');

    // Load saved allocations from Supabase
    useEffect(() => {
        const loadAllocations = async () => {
            // Try to migrate from localStorage first (one-time)
            const localData = localStorage.getItem('budget_allocator_v2_history');
            if (localData) {
                const migrated = await BudgetAllocatorService.migrateFromLocalStorage();
                if (migrated > 0) {
                    toast.success(`Đã migrate ${migrated} bản ghi lên cloud!`, { icon: '☁️' });
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

        toast.success('Phân bổ ngân sách hoàn tất!', {
            icon: '💰',
            style: { borderRadius: '12px', background: '#F0FDF4', color: '#166534', fontWeight: 600 }
        });
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
            toast.success('Đã lưu lên cloud!', { icon: '☁️' });
        } else {
            toast.error('Lưu thất bại!', { icon: '❌' });
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
        toast.success('Đã tải!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await BudgetAllocatorService.deleteAllocation(id);
        if (success) {
            const updated = savedAllocations.filter(s => s.id !== id);
            setSavedAllocations(updated);
            toast.success('Đã xóa!', { icon: '🗑️' });
        } else {
            toast.error('Xóa thất bại!', { icon: '❌' });
        }
    };

    const handleNew = () => {
        setResult(null);
        setCurrentInput(null);
        setHasWebsite(true);
        setHasCustomerList(true);
        setHasCreativeAssets(true);
        reset();
        toast.success('Sẵn sàng phân bổ mới!', { icon: '✨' });
    };

    // Chart data for stacked bar
    const chartData = result?.channels.map(ch => ({
        name: ch.channel.replace(' Ads', '').replace(' Marketing', ''),
        Media: ch.mediaSpend,
        'Sản xuất': ch.productionCost,
        fill: CHANNEL_COLORS[ch.channel as keyof typeof CHANNEL_COLORS] || '#6366f1'
    })) || [];

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center">
                        <PieChart size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Budget Allocator V2</h1>
                        <p className="text-xs text-slate-500 font-medium">Split-Budget Model • Media vs Production</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                    >
                        <History size={16} /> Lịch sử ({savedAllocations.length})
                    </button>
                    {result && (
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                        >
                            <Plus size={16} /> Tạo mới
                        </button>
                    )}
                    {/* Save button - always visible */}
                    <button
                        onClick={handleSave}
                        disabled={!result}
                        className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition-all text-sm ${result
                                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <Save size={16} /> Lưu
                    </button>
                </div>
            </div>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '420px 280px 1fr' : '420px 1fr' }}>
                {/* LEFT: Form */}
                <div className="bg-white border-r border-slate-200 p-6 overflow-y-auto h-full">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Budget Input */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">💰 Ngân sách tổng (VND)</label>
                            <input
                                {...register('totalBudget', {
                                    required: 'Vui lòng nhập ngân sách',
                                    min: { value: 10_000_000, message: 'Tối thiểu 10 triệu VND' }
                                })}
                                type="number"
                                placeholder="VD: 50000000"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            />
                            {errors.totalBudget && <p className="text-xs text-red-500 mt-1">{errors.totalBudget.message}</p>}

                            {/* Live Preview Ratio */}
                            {previewRatio !== null && (
                                <div className="mt-2 p-2 bg-purple-50 rounded-lg text-xs text-purple-700">
                                    📊 Preview: Production {Math.round(previewRatio * 100)}% | Media {Math.round((1 - previewRatio) * 100)}%
                                </div>
                            )}
                        </div>

                        {/* Asset Checklist */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                📋 Asset Checklist
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">Điều chỉnh channels dựa trên tài sản hiện có</p>

                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-2 bg-white rounded-lg cursor-pointer hover:bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Monitor size={16} className={hasWebsite ? 'text-green-600' : 'text-slate-400'} />
                                        <span className="text-sm">Website</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasWebsite(!hasWebsite)}
                                        className={`w-10 h-5 rounded-full transition-colors ${hasWebsite ? 'bg-green-500' : 'bg-slate-300'} relative`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hasWebsite ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </label>

                                <label className="flex items-center justify-between p-2 bg-white rounded-lg cursor-pointer hover:bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Database size={16} className={hasCustomerList ? 'text-green-600' : 'text-slate-400'} />
                                        <span className="text-sm">Customer List</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasCustomerList(!hasCustomerList)}
                                        className={`w-10 h-5 rounded-full transition-colors ${hasCustomerList ? 'bg-green-500' : 'bg-slate-300'} relative`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hasCustomerList ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </label>

                                <label className="flex items-center justify-between p-2 bg-white rounded-lg cursor-pointer hover:bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Image size={16} className={hasCreativeAssets ? 'text-green-600' : 'text-slate-400'} />
                                        <span className="text-sm">Creative Assets</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasCreativeAssets(!hasCreativeAssets)}
                                        className={`w-10 h-5 rounded-full transition-colors ${hasCreativeAssets ? 'bg-green-500' : 'bg-slate-300'} relative`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hasCreativeAssets ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </label>
                            </div>
                        </div>

                        {/* KPI Selection */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">🎯 Mục tiêu (KPI)</label>
                            <div className="space-y-2">
                                {[
                                    { value: 'sales', label: 'Chuyển đổi/Doanh số', desc: 'Performance - Ra số nhanh' },
                                    { value: 'awareness', label: 'Nhận diện thương hiệu', desc: 'Branding - Tăng độ nhận biết' },
                                    { value: 'retention', label: 'Giữ chân khách hàng', desc: 'Retention - Chăm sóc khách cũ' },
                                ].map(kpi => (
                                    <label key={kpi.value} className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                                        <input
                                            {...register('kpi', { required: 'Vui lòng chọn KPI' })}
                                            type="radio"
                                            value={kpi.value}
                                            className="mt-0.5 w-4 h-4 text-purple-600"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-800">{kpi.label}</div>
                                            <div className="text-xs text-slate-500">{kpi.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {errors.kpi && <p className="text-xs text-red-500 mt-1">{errors.kpi.message}</p>}
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">🏢 Ngành hàng</label>
                            <input
                                {...register('industry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: Thời trang, F&B, B2B..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            />
                            {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isCalculating}
                            className="w-full py-3.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
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
                    <div className="bg-white border-r border-slate-200 p-4 overflow-y-auto h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <History size={16} className="text-purple-500" />
                                Lịch sử
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X size={16} className="text-slate-400" />
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
                                        className="group p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors"
                                        onClick={() => handleLoad(item)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{formatVND(item.result.totalBudget)}</div>
                                                <div className="text-xs text-slate-500">{item.input.industry}</div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={12} className="text-red-500" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT: Results */}
                <div className="p-6 overflow-auto bg-slate-50 h-full">
                    {!result && !isCalculating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                                <DollarSign size={28} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-base font-bold text-slate-600">Budget Allocator V2</p>
                            <p className="text-sm text-slate-400 mt-1">Nhập thông tin để phân bổ ngân sách</p>
                        </div>
                    )}

                    {isCalculating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-14 h-14 mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-purple-600">Đang tính toán...</p>
                        </div>
                    )}

                    {result && !isCalculating && (
                        <div className="max-w-5xl mx-auto space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{result.strategyName}</h2>
                                    <p className="text-sm text-slate-500">
                                        Tổng: <span className="font-bold text-slate-800">{formatVND(result.totalBudget)}</span>
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-center">
                                        <div className="text-xs text-purple-600">Sản xuất</div>
                                        <div className="text-lg font-bold text-purple-700">{Math.round(result.productionRatio * 100)}%</div>
                                        <div className="text-xs text-purple-500">{formatVND(result.productionBudget)}</div>
                                    </div>
                                    <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
                                        <div className="text-xs text-blue-600">Media</div>
                                        <div className="text-lg font-bold text-blue-700">{Math.round((1 - result.productionRatio) * 100)}%</div>
                                        <div className="text-xs text-blue-500">{formatVND(result.mediaBudget)}</div>
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
                                <div className="p-4 bg-slate-100 rounded-xl">
                                    <div className="text-xs font-bold text-slate-700 mb-3">🚫 Channels không được phân bổ:</div>
                                    <div className="space-y-2">
                                        {result.disabledChannels.map((ch, i) => (
                                            <div key={i} className="p-3 bg-white rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-slate-700">{ch.name}</span>
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded">0 VND</span>
                                                </div>
                                                <p className="text-xs text-slate-500 italic">{ch.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stacked Bar Chart */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">📊 Media vs Sản xuất theo Channel</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={chartData} layout="vertical">
                                        <XAxis type="number" tickFormatter={(v) => formatVND(v)} />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(value) => formatVND(value as number)} />
                                        <Legend />
                                        <Bar dataKey="Media" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="Sản xuất" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Channel Cards */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3">📋 Chi tiết theo Channel</h3>
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
        </div>
    );
};

export default BudgetAllocator;
