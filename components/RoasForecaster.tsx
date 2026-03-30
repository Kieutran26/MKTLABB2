import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, MousePointer2, ShoppingCart, Percent, Box, Copy, AlertCircle, TrendingDown, Save, History, X, Trash2, Clock, Check, AlertTriangle, Building2, Megaphone, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Toast, ToastType } from './Toast';
import { RoasService } from '../services/roasService';
import { RoasScenario } from '../types';

// ═══════════════════════════════════════════════════════════════
// INDUSTRY BENCHMARKS (Performance Marketing Auditor Data)
// Based on 10+ years of Vietnam e-commerce optimization
// ═══════════════════════════════════════════════════════════════

interface BenchmarkRange {
    cpc: { min: number; max: number; avg: number };
    cr: { min: number; max: number; avg: number };
}

const INDUSTRY_BENCHMARKS: Record<string, BenchmarkRange> = {
    'Thời trang': {
        cpc: { min: 2000, max: 15000, avg: 6000 },
        cr: { min: 0.5, max: 5, avg: 2 }
    },
    'Bất động sản': {
        cpc: { min: 20000, max: 100000, avg: 50000 },
        cr: { min: 0.1, max: 1.5, avg: 0.5 }
    },
    'F&B': {
        cpc: { min: 1500, max: 8000, avg: 3500 },
        cr: { min: 1, max: 8, avg: 3 }
    },
    'Mỹ phẩm': {
        cpc: { min: 3000, max: 12000, avg: 6000 },
        cr: { min: 0.5, max: 4, avg: 1.8 }
    },
    'Công nghệ': {
        cpc: { min: 10000, max: 50000, avg: 25000 },
        cr: { min: 0.3, max: 3, avg: 1.2 }
    },
    'Giáo dục': {
        cpc: { min: 5000, max: 30000, avg: 12000 },
        cr: { min: 0.5, max: 2.5, avg: 1 }
    },
    'Nội thất': {
        cpc: { min: 8000, max: 40000, avg: 18000 },
        cr: { min: 0.3, max: 2, avg: 0.8 }
    },
    'Khác': {
        cpc: { min: 2000, max: 30000, avg: 8000 },
        cr: { min: 0.5, max: 5, avg: 2 }
    },
};

const CHANNELS = [
    'Meta Ads',
    'Google Ads',
    'TikTok Ads',
    'Zalo Ads',
    'Shopee Ads',
    'Lazada Ads',
    'YouTube Ads',
    'Khác'
];

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface RealityWarning {
    type: 'error' | 'warning' | 'info';
    message: string;
    field: 'cpc' | 'cr' | 'general';
}

interface Metrics {
    clicks: number;
    orders: number;
    revenue: number;
    adsCost: number;
    productCost: number;
    platformCost: number;
    totalCost: number;
    netProfit: number;
    roas: number;
    roi: number;
    breakEvenCR: number;
    breakEvenRoas: number;
    grossMargin: number;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const RoasForecaster: React.FC = () => {
    // Input States
    const [industry, setIndustry] = useState('Thời trang');
    const [channel, setChannel] = useState('Meta Ads');
    const [budget, setBudget] = useState(10000000); // 10tr
    const [cpc, setCpc] = useState(5000); // 5k
    const [conversionRate, setConversionRate] = useState(2.0); // 2%
    const [aov, setAov] = useState(500000); // 500k
    const [cogs, setCogs] = useState(200000); // 200k
    const [platformFeeRate, setPlatformFeeRate] = useState(5); // 5%

    // UI States
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [scenarioName, setScenarioName] = useState('');
    const [history, setHistory] = useState<RoasScenario[]>([]);

    // Calculated States
    const [metrics, setMetrics] = useState<Metrics>({
        clicks: 0,
        orders: 0,
        revenue: 0,
        adsCost: 0,
        productCost: 0,
        platformCost: 0,
        totalCost: 0,
        netProfit: 0,
        roas: 0,
        roi: 0,
        breakEvenCR: 0,
        breakEvenRoas: 0,
        grossMargin: 0
    });

    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Initial Load - Migrate from localStorage and load from Supabase
    useEffect(() => {
        const loadScenarios = async () => {
            // Try to migrate from localStorage first (one-time)
            const localKey = 'eng_app_roas_scenarios';
            const localData = localStorage.getItem(localKey);
            if (localData) {
                const migrated = await RoasService.migrateFromLocalStorage();
                if (migrated > 0) {
                    setToast({ message: `Đã migrate ${migrated} kịch bản lên cloud!`, type: 'success' });
                }
            }

            // Load from Supabase
            const scenarios = await RoasService.getScenarios();
            setHistory(scenarios);
        };
        loadScenarios();
    }, []);

    // ═══════════════════════════════════════════════════════════
    // FORMATTERS (moved before useMemo hooks that use them)
    // ═══════════════════════════════════════════════════════════

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('vi-VN').format(val);
    };

    // ═══════════════════════════════════════════════════════════
    // REALITY CHECK: Validate inputs against industry benchmarks
    // ═══════════════════════════════════════════════════════════

    const realityWarnings = useMemo<RealityWarning[]>(() => {
        const warnings: RealityWarning[] = [];
        const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['Khác'];

        // CPC Check
        if (cpc < benchmark.cpc.min) {
            warnings.push({
                type: 'warning',
                field: 'cpc',
                message: `⚠️ CPC ${formatCurrency(cpc)} thấp hơn mức trung bình ngành ${industry} (${formatCurrency(benchmark.cpc.min)}-${formatCurrency(benchmark.cpc.max)}). Traffic có thể kém chất lượng.`
            });
        } else if (cpc > benchmark.cpc.max * 1.2) {
            warnings.push({
                type: 'warning',
                field: 'cpc',
                message: `⚠️ CPC ${formatCurrency(cpc)} cao hơn benchmark ngành. Cần tối ưu targeting hoặc creative.`
            });
        }

        // CR Check - Critical for unrealistic scenarios
        if (conversionRate > benchmark.cr.max * 1.5) {
            warnings.push({
                type: 'error',
                field: 'cr',
                message: `🚨 PHI THỰC TẾ: CR ${conversionRate}% không khả thi cho ngành ${industry}. Mức thực tế: ${benchmark.cr.min}-${benchmark.cr.max}%. Hãy điều chỉnh xuống ${benchmark.cr.avg}% để dự báo chính xác hơn.`
            });
        } else if (conversionRate > benchmark.cr.max) {
            warnings.push({
                type: 'warning',
                field: 'cr',
                message: `⚠️ CR ${conversionRate}% cao hơn mức trung bình ngành ${industry} (${benchmark.cr.avg}%). Chỉ khả thi với chiến dịch retargeting hoặc khách hàng warm.`
            });
        } else if (conversionRate < benchmark.cr.min) {
            warnings.push({
                type: 'info',
                field: 'cr',
                message: `💡 CR ${conversionRate}% thấp hơn mức min ngành. Có thể tăng lên ${benchmark.cr.avg}% với chiến lược landing page tối ưu.`
            });
        }

        return warnings;
    }, [industry, cpc, conversionRate]);

    // ═══════════════════════════════════════════════════════════
    // CALCULATION LOGIC (Performance Marketing Auditor Formula)
    // ═══════════════════════════════════════════════════════════

    useEffect(() => {
        const clicks = Math.floor(budget / (cpc > 0 ? cpc : 1));
        const orders = Math.floor(clicks * (conversionRate / 100));
        const revenue = orders * aov;

        // Cost breakdown (following user's formula)
        const adsCost = budget;
        const productCost = orders * cogs;
        const platformCost = revenue * (platformFeeRate / 100); // Platform fee on revenue

        // Total cost = Ads + COGS + Platform Fee
        const totalCost = adsCost + productCost + platformCost;

        // Net Profit = Revenue - Total Cost
        const netProfit = revenue - totalCost;

        // ROAS = Revenue / Ads Cost
        const roas = budget > 0 ? revenue / budget : 0;

        // ROI = (Net Profit / Total Cost) * 100
        const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

        // Gross Margin = (AOV - COGS) / AOV
        const grossMargin = aov > 0 ? (aov - cogs) / aov : 0;

        // Break-even CR = CPC / (Profit per order after platform fee)
        // Profit per order = AOV * (1 - platformFee) - COGS
        const profitPerOrder = aov * (1 - platformFeeRate / 100) - cogs;
        const breakEvenCR = profitPerOrder > 0 ? (cpc / profitPerOrder) * 100 : 999;

        // Break-even ROAS = 1 / (Gross Margin * (1 - Platform Fee))
        const effectiveMargin = grossMargin * (1 - platformFeeRate / 100);
        const breakEvenRoas = effectiveMargin > 0 ? 1 / effectiveMargin : 999;

        setMetrics({
            clicks,
            orders,
            revenue,
            adsCost,
            productCost,
            platformCost,
            totalCost,
            netProfit,
            roas,
            roi,
            breakEvenCR,
            breakEvenRoas,
            grossMargin
        });
    }, [budget, cpc, conversionRate, aov, cogs, platformFeeRate]);

    // ═══════════════════════════════════════════════════════════
    // RISK ASSESSMENT
    // ═══════════════════════════════════════════════════════════

    const riskAssessment = useMemo(() => {
        const hasErrors = realityWarnings.some(w => w.type === 'error');
        const hasWarnings = realityWarnings.some(w => w.type === 'warning');

        if (metrics.netProfit < 0) {
            const lossPercent = Math.abs(metrics.netProfit / budget * 100).toFixed(1);
            return {
                level: 'critical' as const,
                title: '❌ RỦI RO CAO - LỖ VỐN',
                message: `Kịch bản này dự kiến LỖ ${formatCurrency(Math.abs(metrics.netProfit))} (${lossPercent}% ngân sách). Cần tăng CR lên ${metrics.breakEvenCR.toFixed(2)}% hoặc giảm CPC/COGS để hòa vốn.`,
                color: 'red'
            };
        }

        if (hasErrors) {
            return {
                level: 'high' as const,
                title: '⚠️ CẢNH BÁO - DỮ LIỆU KHÔNG THỰC TẾ',
                message: 'Các thông số đầu vào vượt quá benchmark ngành. Kết quả dự báo có thể không phản ánh đúng thực tế. Xem xét điều chỉnh theo gợi ý.',
                color: 'amber'
            };
        }

        if (metrics.roas < metrics.breakEvenRoas * 1.2) {
            return {
                level: 'medium' as const,
                title: '⚡ CẦN CHÚ Ý - BIÊN LỢI NHUẬN MỎNG',
                message: `ROAS ${metrics.roas.toFixed(2)}x chỉ cao hơn điểm hòa vốn ${metrics.breakEvenRoas.toFixed(2)}x một chút. Bất kỳ biến động nào về CPC/CR đều có thể gây lỗ.`,
                color: 'yellow'
            };
        }

        if (hasWarnings) {
            return {
                level: 'moderate' as const,
                title: '💡 KHẢ QUAN - CÓ DƯ ĐỊA TỐI ƯU',
                message: `Lợi nhuận ròng ${formatCurrency(metrics.netProfit)} với ROI ${metrics.roi.toFixed(1)}%. Có thể tăng ngân sách nếu duy trì được hiệu suất.`,
                color: 'blue'
            };
        }

        return {
            level: 'low' as const,
            title: '✅ AN TOÀN - KẾ HOẠCH LÀNH MẠNH',
            message: `Dự kiến lãi ${formatCurrency(metrics.netProfit)} với ROI ${metrics.roi.toFixed(1)}% và ROAS ${metrics.roas.toFixed(2)}x. Đây là kịch bản khả thi và an toàn.`,
            color: 'green'
        };
    }, [metrics, realityWarnings, budget, formatCurrency]);

    // ═══════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════

    const handleCopyScenario = () => {
        const text = `
📊 DỰ BÁO NGÂN SÁCH & ROAS (Performance Marketing Auditor)
══════════════════════════════════════════════════════════
ĐẦU VÀO:
- Ngành hàng: ${industry}
- Kênh: ${channel}
- Ngân sách: ${formatCurrency(budget)}
- CPC: ${formatCurrency(cpc)}
- Tỷ lệ chuyển đổi: ${conversionRate}%
- AOV: ${formatCurrency(aov)}
- Giá vốn/SP: ${formatCurrency(cogs)}
- Phí sàn/dự phòng: ${platformFeeRate}%

KẾT QUẢ DỰ KIẾN:
┌─────────────────────┬──────────────────┐
│ Traffic (Clicks)    │ ${formatNumber(metrics.clicks).padStart(16)} │
│ Đơn hàng            │ ${formatNumber(metrics.orders).padStart(16)} │
│ Doanh thu           │ ${formatCurrency(metrics.revenue).padStart(16)} │
├─────────────────────┼──────────────────┤
│ Chi phí Ads         │ ${formatCurrency(metrics.adsCost).padStart(16)} │
│ Chi phí hàng hóa    │ ${formatCurrency(metrics.productCost).padStart(16)} │
│ Phí sàn (${platformFeeRate}%)       │ ${formatCurrency(metrics.platformCost).padStart(16)} │
│ TỔNG CHI PHÍ        │ ${formatCurrency(metrics.totalCost).padStart(16)} │
├─────────────────────┼──────────────────┤
│ LỢI NHUẬN RÒNG      │ ${formatCurrency(metrics.netProfit).padStart(16)} │
│ ROI                 │ ${(metrics.roi.toFixed(1) + '%').padStart(16)} │
│ ROAS                │ ${(metrics.roas.toFixed(2) + 'x').padStart(16)} │
│ Break-even ROAS     │ ${(metrics.breakEvenRoas.toFixed(2) + 'x').padStart(16)} │
└─────────────────────┴──────────────────┘

📋 NHẬN ĐỊNH: ${riskAssessment.title}
${riskAssessment.message}
══════════════════════════════════════════════════════════
`;
        navigator.clipboard.writeText(text);
        setToast({ message: "Đã sao chép báo cáo chi tiết vào clipboard!", type: "success" });
    };

    const handleSaveScenario = async () => {
        if (!scenarioName.trim()) {
            setToast({ message: "Vui lòng nhập tên kịch bản", type: "error" });
            return;
        }

        const newScenario: RoasScenario = {
            id: Date.now().toString(),
            name: scenarioName,
            createdAt: Date.now(),
            inputs: { budget, cpc, conversionRate, aov, cogs },
            results: {
                revenue: metrics.revenue,
                netProfit: metrics.netProfit,
                roas: metrics.roas
            }
        };

        const success = await RoasService.saveScenario(newScenario);
        if (success) {
            setHistory([newScenario, ...history]);
            setShowSaveModal(false);
            setScenarioName('');
            setToast({ message: "Đã lưu kịch bản lên cloud!", type: "success" });
        } else {
            setToast({ message: "Lưu thất bại!", type: "error" });
        }
    };

    const handleLoadScenario = (scenario: RoasScenario) => {
        setBudget(scenario.inputs.budget);
        setCpc(scenario.inputs.cpc);
        setConversionRate(scenario.inputs.conversionRate);
        setAov(scenario.inputs.aov);
        setCogs(scenario.inputs.cogs);
        setShowHistoryModal(false);
        setToast({ message: `Đã tải kịch bản: ${scenario.name}`, type: "success" });
    };

    const handleDeleteScenario = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa kịch bản này?")) {
            const success = await RoasService.deleteScenario(id);
            if (success) {
                setHistory(prev => prev.filter(h => h.id !== id));
                setToast({ message: "Đã xóa!", type: "success" });
            } else {
                setToast({ message: "Xóa thất bại!", type: "error" });
            }
        }
    };

    // Chart Data
    const chartData = [
        { name: 'Chi phí Ads', value: metrics.adsCost, color: '#94a3b8' },
        { name: 'Chi phí hàng', value: metrics.productCost, color: '#f59e0b' },
        { name: 'Phí sàn', value: metrics.platformCost, color: '#6366f1' },
        { name: 'Doanh thu', value: metrics.revenue, color: '#3b82f6' },
        { name: 'Lợi nhuận', value: metrics.netProfit, color: metrics.netProfit >= 0 ? '#22c55e' : '#ef4444' }
    ];

    return (
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <TrendingUp className="text-green-600" strokeWidth={1.5} />
                        Dự tính Ngân sách & ROAS
                    </h2>
                    <p className="text-slate-500 mt-1">Performance Marketing Auditor • Kiểm toán hiệu suất quảng cáo</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                    >
                        <History size={18} strokeWidth={1.5} /> Lịch sử
                    </button>
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                    >
                        <Save size={18} strokeWidth={1.5} /> Lưu
                    </button>
                    <button
                        onClick={handleCopyScenario}
                        className="bg-indigo-600 text-white border border-indigo-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                    >
                        <Copy size={18} strokeWidth={1.5} /> Copy
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- INPUT PARAMETERS (Left) --- */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-6">

                        {/* NEW: Industry & Channel Selection */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Building2 size={14} /> Ngành hàng & Kênh
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ngành hàng</label>
                                    <select
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                        {Object.keys(INDUSTRY_BENCHMARKS).map(ind => (
                                            <option key={ind} value={ind}>{ind}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Kênh QC</label>
                                    <select
                                        value={channel}
                                        onChange={(e) => setChannel(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                        {CHANNELS.map(ch => (
                                            <option key={ch} value={ch}>{ch}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Benchmark hint */}
                            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                                📊 Benchmark {industry}: CPC {formatCurrency(INDUSTRY_BENCHMARKS[industry]?.cpc.avg || 0)} • CR {INDUSTRY_BENCHMARKS[industry]?.cr.avg || 0}%
                            </div>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        {/* Group 1: Ad Costs */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <DollarSign size={14} /> Chi phí Quảng cáo
                            </h3>

                            {/* Budget Input */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tổng Ngân sách (VNĐ)</label>
                                <input
                                    type="number"
                                    className="w-full bg-transparent text-2xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
                                    placeholder="0"
                                    value={budget === 0 ? '' : budget}
                                    onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                                />
                                <input
                                    type="range" min="1000000" max="100000000" step="500000"
                                    value={budget}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                                />
                            </div>

                            {/* CPC Input */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><MousePointer2 size={14} /> CPC trung bình</label>
                                    <span className="text-sm font-medium text-slate-600">{formatCurrency(cpc)}</span>
                                </div>
                                <input
                                    type="range" min="500" max="100000" step="100"
                                    value={cpc}
                                    onChange={(e) => setCpc(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors font-medium text-slate-700"
                                        value={cpc}
                                        onChange={(e) => setCpc(Math.max(1, Number(e.target.value)))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        {/* Group 2: Sales Performance */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ShoppingCart size={14} /> Hiệu suất Bán hàng
                            </h3>

                            {/* CR Input */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Percent size={14} /> Tỷ lệ chuyển đổi (CR)</label>
                                    <span className="text-sm font-medium text-slate-600">{conversionRate}%</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="15" step="0.1"
                                    value={conversionRate}
                                    onChange={(e) => setConversionRate(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <input
                                        type="number" step="0.1"
                                        className="w-24 p-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors font-medium text-slate-700"
                                        value={conversionRate}
                                        onChange={(e) => setConversionRate(Math.max(0, Number(e.target.value)))}
                                    />
                                    <div className="text-xs text-slate-500 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                        Hòa vốn: <strong>{metrics.breakEvenCR.toFixed(2)}%</strong>
                                    </div>
                                </div>
                            </div>

                            {/* AOV Input */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700">Giá trị đơn hàng (AOV)</label>
                                    <span className="text-sm font-medium text-slate-600">{formatCurrency(aov)}</span>
                                </div>
                                <input
                                    type="range" min="100000" max="10000000" step="50000"
                                    value={aov}
                                    onChange={(e) => setAov(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors font-medium text-slate-700"
                                        value={aov}
                                        onChange={(e) => setAov(Math.max(0, Number(e.target.value)))}
                                    />
                                </div>
                            </div>

                            {/* COGS Input */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Box size={14} /> Giá vốn (COGS)</label>
                                    <span className="text-sm font-medium text-slate-600">{formatCurrency(cogs)}</span>
                                </div>
                                <input
                                    type="range" min="0" max={aov} step="10000"
                                    value={cogs}
                                    onChange={(e) => setCogs(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors font-medium text-slate-700"
                                        value={cogs}
                                        onChange={(e) => setCogs(Math.max(0, Number(e.target.value)))}
                                    />
                                </div>
                            </div>

                            {/* Platform Fee Input - NEW */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                        <Target size={14} /> Phí sàn/Dự phòng
                                    </label>
                                    <span className="text-sm font-medium text-slate-600">{platformFeeRate}% doanh thu</span>
                                </div>
                                <input
                                    type="range" min="0" max="15" step="0.5"
                                    value={platformFeeRate}
                                    onChange={(e) => setPlatformFeeRate(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">Bao gồm: phí thanh toán, phí sàn TMĐT, hoàn hàng...</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FORECAST DASHBOARD (Right) --- */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Reality Check Warnings - NEW */}
                    {realityWarnings.length > 0 && (
                        <div className="space-y-2">
                            {realityWarnings.map((warning, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-xl flex items-start gap-3 text-sm ${warning.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
                                        warning.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                                            'bg-blue-50 border border-blue-200 text-blue-700'
                                        }`}
                                >
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                    <span>{warning.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Traffic (Clicks)</div>
                            <div className="text-2xl font-bold text-slate-800">{formatNumber(metrics.clicks)}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Đơn hàng (Orders)</div>
                            <div className="text-2xl font-bold text-indigo-600">{formatNumber(metrics.orders)}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">ROAS</div>
                            <div className={`text-2xl font-bold ${metrics.roas >= metrics.breakEvenRoas * 1.5 ? 'text-green-600' : metrics.roas >= metrics.breakEvenRoas ? 'text-yellow-600' : 'text-red-500'}`}>
                                {metrics.roas.toFixed(2)}x
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Hòa vốn: {metrics.breakEvenRoas.toFixed(2)}x</div>
                        </div>
                    </div>

                    {/* Revenue & Profit Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Doanh thu</div>
                                <div className="text-xl font-bold text-slate-800">{formatCurrency(metrics.revenue)}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng chi phí</div>
                                <div className="text-xl font-bold text-slate-600">{formatCurrency(metrics.totalCost)}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Lợi nhuận ròng</div>
                                <div className={`text-xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.netProfit > 0 ? '+' : ''}{formatCurrency(metrics.netProfit)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">ROI</div>
                                <div className={`text-xl font-bold ${metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.roi.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cost Breakdown Table - NEW */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">📊 Chi tiết Chi phí</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            <div className="flex justify-between p-3 hover:bg-slate-50">
                                <span className="text-sm text-slate-600">Chi phí Ads</span>
                                <span className="text-sm font-bold text-slate-800">{formatCurrency(metrics.adsCost)}</span>
                            </div>
                            <div className="flex justify-between p-3 hover:bg-slate-50">
                                <span className="text-sm text-slate-600">Chi phí hàng hóa ({metrics.orders} đơn × {formatCurrency(cogs)})</span>
                                <span className="text-sm font-bold text-slate-800">{formatCurrency(metrics.productCost)}</span>
                            </div>
                            <div className="flex justify-between p-3 hover:bg-slate-50">
                                <span className="text-sm text-slate-600">Phí sàn/dự phòng ({platformFeeRate}% doanh thu)</span>
                                <span className="text-sm font-bold text-purple-600">{formatCurrency(metrics.platformCost)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-slate-50 font-bold">
                                <span className="text-sm text-slate-700">TỔNG CHI PHÍ</span>
                                <span className="text-sm text-slate-900">{formatCurrency(metrics.totalCost)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft h-[300px] flex flex-col">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Biểu đồ So sánh</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact" }).format(value)}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        formatter={(value: number) => [formatCurrency(value), '']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <ReferenceLine y={0} stroke="#cbd5e1" />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Risk Assessment - NEW */}
                    <div className={`p-5 rounded-2xl flex items-start gap-4 ${riskAssessment.color === 'red' ? 'bg-red-50 border border-red-200' :
                        riskAssessment.color === 'amber' ? 'bg-amber-50 border border-amber-200' :
                            riskAssessment.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
                                riskAssessment.color === 'blue' ? 'bg-blue-50 border border-blue-200' :
                                    'bg-green-50 border border-green-200'
                        }`}>
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${riskAssessment.color === 'red' ? 'bg-red-500' :
                            riskAssessment.color === 'amber' ? 'bg-amber-500' :
                                riskAssessment.color === 'yellow' ? 'bg-yellow-500' :
                                    riskAssessment.color === 'blue' ? 'bg-blue-500' :
                                        'bg-green-500'
                            } text-white`}>
                            {riskAssessment.level === 'critical' || riskAssessment.level === 'high' ?
                                <TrendingDown size={20} /> : <TrendingUp size={20} />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${riskAssessment.color === 'red' ? 'text-red-800' :
                                riskAssessment.color === 'amber' ? 'text-amber-800' :
                                    riskAssessment.color === 'yellow' ? 'text-yellow-800' :
                                        riskAssessment.color === 'blue' ? 'text-blue-800' :
                                            'text-green-800'
                                }`}>{riskAssessment.title}</h4>
                            <p className={`text-sm mt-1 ${riskAssessment.color === 'red' ? 'text-red-700' :
                                riskAssessment.color === 'amber' ? 'text-amber-700' :
                                    riskAssessment.color === 'yellow' ? 'text-yellow-700' :
                                        riskAssessment.color === 'blue' ? 'text-blue-700' :
                                            'text-green-700'
                                }`}>{riskAssessment.message}</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Lưu Kịch Bản</h3>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-indigo-500" placeholder="Tên kịch bản (VD: Tháng 10 - Tăng Budget)..." value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} autoFocus />
                        <div className="flex gap-3">
                            <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors">Hủy</button>
                            <button onClick={handleSaveScenario} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> Lịch sử Kịch bản</h3>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3">
                            {history.length === 0 ? <div className="text-center py-10 text-slate-400">Chưa có kịch bản nào được lưu.</div> : history.map(h => (
                                <div key={h.id} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-md transition-all bg-white cursor-pointer group" onClick={() => handleLoadScenario(h)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-800 text-lg">{h.name}</div>
                                        <button onClick={(e) => handleDeleteScenario(e, h.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                        <Clock size={12} /> {new Date(h.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-slate-100 p-2 rounded-lg">Budget: <b>{formatCurrency(h.inputs.budget)}</b></div>
                                        <div className={`p-2 rounded-lg ${h.results.netProfit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>Lãi: <b>{formatCurrency(h.results.netProfit)}</b></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default RoasForecaster;