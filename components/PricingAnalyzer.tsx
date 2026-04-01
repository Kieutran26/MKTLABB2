import React, { useState, useEffect } from 'react';
import { PricingAnalyzerInput, PricingAnalyzerResult } from '../types';
import { analyzePricingStrategy } from '../services/geminiService';
import { PricingAnalyzerService, SavedPricingAnalysis } from '../services/pricingAnalyzerService';
import toast, { Toaster } from 'react-hot-toast';
import {
    DollarSign, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle2, Lightbulb, BarChart3, Loader2,
    AlertCircle, Save, History, Trash2, Plus,
    X, ChevronDown, ChevronUp, RotateCcw, ArrowLeft,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, TooltipProps,
} from 'recharts';

interface Props {
    isActive: boolean;
}

interface SavedPricingAnalysis {
    id: string;
    name: string;
    input: PricingAnalyzerInput;
    result: PricingAnalyzerResult;
    createdAt: number;
}

// ── Shared editorial styles ────────────────────────────────────────────────
const pageWrap =
    'min-h-screen bg-[#FCFDFC] font-sans text-stone-900';

const cardBase =
    'overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const iconWrap =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200/90 bg-stone-50 text-stone-600';

const iconWrapSm =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200/90 bg-stone-50 text-stone-500';

const labelCls =
    'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500';

const inputCls =
    'w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-200/60 transition-all outline-none';

const btnBordered =
    'inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed';

const btnGhost =
    'inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50 hover:text-stone-800';

// ── Chart Tooltip ───────────────────────────────────────────────────────────
const PriceTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-[0_4px_16px_rgba(15,23,42,0.1)]">
                <p className="mb-0.5 text-xs font-semibold text-stone-500">{label}</p>
                <p className="text-base font-bold text-stone-900">
                    {Number(payload[0].value).toLocaleString('vi-VN')}đ
                </p>
            </div>
        );
    }
    return null;
};

// ── Score colour ─────────────────────────────────────────────────────────────
const scoreColour = (s: number) =>
    s >= 70 ? '#16a34a' : s >= 40 ? '#d97706' : '#dc2626';

const verdictLabel = (s: string) =>
    s === 'Optimal' ? 'Tối ưu' : s === 'Warning' ? 'Cần điều chỉnh' : 'Vấn đề';

const verdictBg = (s: string) =>
    s === 'Optimal' ? 'bg-green-50 text-green-700' : s === 'Warning' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';

const PricingAnalyzer: React.FC<Props> = ({ isActive }) => {
    const [input, setInput] = useState<PricingAnalyzerInput>({
        productName: '', industry: '', cogs: 0, targetPrice: 0,
        competitorMin: 0, competitorMax: 0, positioning: 'mainstream',
        fixedCosts: 0, pricingGoal: '',
    });
    const [result, setResult] = useState<PricingAnalyzerResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedPricingAnalysis[]>([]);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    useEffect(() => {
        PricingAnalyzerService.getPricingAnalyses().then(setSavedAnalyses);
    }, []);

    const handleAnalyze = async () => {
        if (!input.productName || !input.industry || !input.cogs || !input.targetPrice || !input.competitorMin || !input.competitorMax) {
            setError('Vui lòng nhập đầy đủ thông tin bắt buộc: Tên sản phẩm, Ngành hàng, COGS, Giá bán, Giá đối thủ.');
            return;
        }
        if (input.cogs >= input.targetPrice) {
            setError('Giá vốn phải nhỏ hơn giá bán.');
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysis = await analyzePricingStrategy(input, setProgress);
            if (analysis) {
                setResult(analysis);
                toast.success('Phân tích thành công!');
            } else {
                setError('Không thể phân tích. Vui lòng thử lại.');
            }
        } catch {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) { toast.error('Chưa có dữ liệu để lưu!'); return; }
        const newAnalysis: SavedPricingAnalysis = {
            id: Date.now().toString(),
            name: `${input.productName} — ${new Date().toLocaleDateString('vi-VN')}`,
            input, result, createdAt: Date.now(),
        };
        const ok = await PricingAnalyzerService.savePricingAnalysis(newAnalysis);
        if (ok) {
            const analyses = await PricingAnalyzerService.getPricingAnalyses();
            setSavedAnalyses(analyses);
            toast.success('Đã lưu phân tích.', {
                duration: 3000,
                style: {
                    borderRadius: '12px',
                    background: '#FAFAF8',
                    color: '#292524',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid #E7E5E4',
                },
            });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoad = (a: SavedPricingAnalysis) => {
        setInput(a.input);
        setResult(a.result);
        setShowHistory(false);
        toast.success('Đã tải phân tích.');
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const ok = await PricingAnalyzerService.deletePricingAnalysis(id);
        if (ok) {
            const analyses = await PricingAnalyzerService.getPricingAnalyses();
            setSavedAnalyses(analyses);
            toast.success('Đã xóa.');
        } else toast.error('Lỗi khi xóa!');
    };

    const handleNew = () => {
        setResult(null); setError(null); setProgress('');
        setInput({ productName: '', industry: '', cogs: 0, targetPrice: 0, competitorMin: 0, competitorMax: 0, positioning: 'mainstream', fixedCosts: 0, pricingGoal: '' });
        setExpandedCard(null);
    };

    // Chart data
    const chartData = result ? [
        { name: 'Đối thủ thấp', value: input.competitorMin },
        { name: 'Trung bình', value: result.market_position_analysis.market_avg },
        { name: 'Của bạn', value: input.targetPrice },
        { name: 'Đối thủ cao', value: input.competitorMax },
    ] : [];

    const verdicts: Record<string, string> = {
        'Optimal': 'Tối ưu',
        'Warning': 'Cần điều chỉnh',
        'Critical': 'Vấn đề',
    };

    if (!isActive) return null;

    return (
        <div className={pageWrap}>
            <Toaster position="top-center" />

            {/* ── Page ───────────────────────────────────────────────── */}
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">

                {/* ── Header ──────────────────────────────────────────── */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                            Phân tích chiến lược
                        </p>
                        <h1 className="text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">
                            Pricing Analyzer
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleNew} className={btnGhost} title="Tạo mới">
                            <RotateCcw size={15} strokeWidth={1.5} />
                            Tạo mới
                        </button>
                        <button type="button" onClick={handleSave} disabled={!result} className={btnGhost} title="Lưu">
                            <Save size={15} strokeWidth={1.5} />
                            Lưu
                        </button>
                        <button type="button" onClick={() => setShowHistory(true)} className={btnGhost} title="Lịch sử">
                            <History size={15} strokeWidth={1.5} />
                            Lịch sử
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

                    {/* ── Left: Input Form ─────────────────────────────── */}
                    <div className="lg:col-span-1 space-y-5">
                        <div className={cardBase}>
                            <div className="flex items-center gap-3.5 border-b border-stone-200/90 px-5 py-4 sm:px-6 sm:py-5">
                                <div className={iconWrap}>
                                    <BarChart3 size={22} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h2 className="font-medium tracking-tight text-stone-900">Thông tin Giá</h2>
                                    <p className="mt-0.5 text-sm text-stone-500">Nhập dữ liệu sản phẩm & thị trường</p>
                                </div>
                            </div>

                            <div className="space-y-5 p-5 sm:px-6 sm:py-6">

                                <div>
                                    <label className={labelCls}>Tên sản phẩm *</label>
                                    <input type="text" value={input.productName}
                                        onChange={(e) => setInput({ ...input, productName: e.target.value })}
                                        className={inputCls} placeholder="VD: Cà phê Arabica Premium" />
                                </div>

                                <div>
                                    <label className={labelCls}>Ngành hàng *</label>
                                    <input type="text" value={input.industry}
                                        onChange={(e) => setInput({ ...input, industry: e.target.value })}
                                        className={inputCls} placeholder="VD: F&B, SaaS, Fashion..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Giá vốn (COGS) *</label>
                                        <input type="number" value={input.cogs || ''}
                                            onChange={(e) => setInput({ ...input, cogs: Number(e.target.value) })}
                                            className={inputCls} placeholder="200.000" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Giá bán mục tiêu *</label>
                                        <input type="number" value={input.targetPrice || ''}
                                            onChange={(e) => setInput({ ...input, targetPrice: Number(e.target.value) })}
                                            className={inputCls} placeholder="500.000" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Đối thủ thấp nhất *</label>
                                        <input type="number" value={input.competitorMin || ''}
                                            onChange={(e) => setInput({ ...input, competitorMin: Number(e.target.value) })}
                                            className={inputCls} placeholder="300.000" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Đối thủ cao nhất *</label>
                                        <input type="number" value={input.competitorMax || ''}
                                            onChange={(e) => setInput({ ...input, competitorMax: Number(e.target.value) })}
                                            className={inputCls} placeholder="700.000" />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Định vị thương hiệu *</label>
                                    <div className="inline-flex w-full rounded-xl border border-stone-200/90 bg-stone-50 p-1">
                                        {(['budget', 'mainstream', 'premium'] as const).map((pos) => (
                                            <button key={pos} type="button"
                                                onClick={() => setInput({ ...input, positioning: pos })}
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                                    input.positioning === pos
                                                        ? 'bg-white font-semibold text-stone-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/90'
                                                        : 'text-stone-500 hover:text-stone-700'
                                                }`}
                                            >
                                                {pos === 'budget' ? 'Budget' : pos === 'mainstream' ? 'Mainstream' : 'Premium'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Chi phí cố định (Tùy chọn)</label>
                                    <input type="number" value={input.fixedCosts || ''}
                                        onChange={(e) => setInput({ ...input, fixedCosts: e.target.value ? Number(e.target.value) : undefined })}
                                        className={inputCls} placeholder="VD: 50.000.000" />
                                </div>

                                <div>
                                    <label className={labelCls}>Mục tiêu định giá (Tùy chọn)</label>
                                    <input type="text" value={input.pricingGoal || ''}
                                        onChange={(e) => setInput({ ...input, pricingGoal: e.target.value })}
                                        className={inputCls} placeholder="VD: Tối đa hóa lợi nhuận..." />
                                </div>

                                {error && (
                                    <div className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-stone-500" strokeWidth={1.5} />
                                        <p className="text-sm text-stone-600">{error}</p>
                                    </div>
                                )}

                                <button type="button" onClick={handleAnalyze} disabled={loading}
                                    className="w-full rounded-xl border border-stone-900 bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-colors hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            {progress || 'Đang phân tích...'}
                                        </span>
                                    ) : (
                                        'Phân tích Chiến lược Giá'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Quick stats */}
                        {result && (
                            <div className={cardBase}>
                                <div className="border-b border-stone-200/90 px-5 py-4 sm:px-6">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Chỉ số Nhanh
                                    </h3>
                                </div>
                                <div className="divide-y divide-stone-100">
                                    <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
                                        <span className="text-sm text-stone-600">Biên lợi nhuận</span>
                                        <span className="text-base font-semibold text-stone-900">
                                            {result.financial_analysis.gross_margin_percent}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
                                        <span className="text-sm text-stone-600">Price Index</span>
                                        <span className="text-base font-semibold text-stone-900">
                                            {result.market_position_analysis.price_index}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
                                        <span className="text-sm text-stone-600">Đánh giá</span>
                                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${verdictBg(result.verdict.status)}`}>
                                            {verdicts[result.verdict.status] || result.verdict.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Results ───────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-5">

                        {result ? (
                            <>
                                {/* Score Card */}
                                <div className={cardBase}>
                                    <div className="flex items-center gap-5 p-6 sm:p-8">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-stone-200/90 text-2xl font-bold text-stone-900"
                                            style={{ borderColor: `${scoreColour(result.verdict.score)}30`, color: scoreColour(result.verdict.score) }}>
                                            {result.verdict.score}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-1 flex items-center gap-2">
                                                {result.verdict.status === 'Optimal'
                                                    ? <CheckCircle2 size={18} className="text-green-600" strokeWidth={1.5} />
                                                    : result.verdict.status === 'Warning'
                                                        ? <AlertTriangle size={18} className="text-amber-600" strokeWidth={1.5} />
                                                        : <AlertCircle size={18} className="text-red-600" strokeWidth={1.5} />}
                                                <h3 className="font-semibold tracking-tight text-stone-900">
                                                    {verdicts[result.verdict.status] || result.verdict.status}
                                                </h3>
                                            </div>
                                            <p className="text-sm leading-relaxed text-stone-500">{result.verdict.summary}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Market Chart */}
                                <div className={cardBase}>
                                    <div className="border-b border-stone-200/90 px-5 py-4 sm:px-6 sm:py-5">
                                        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                            So sánh với Thị trường
                                        </h3>
                                    </div>
                                    <div className="p-5 sm:p-6">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={chartData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                                                <XAxis type="number"
                                                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: '500' }}
                                                    tickLine={false}
                                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                                <YAxis type="category" dataKey="name"
                                                    tick={{ fill: '#78716c', fontSize: 12, fontWeight: '500' }}
                                                    tickLine={false} width={110} />
                                                <Tooltip content={<PriceTooltip />} cursor={{ fill: '#fafaf9' }} />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28} fill="#a8a29e">
                                                    {chartData.map((entry, i) => (
                                                        <Bar key={i} dataKey="value" fill={entry.name === 'Của bạn' ? '#57534e' : '#d6d3d1'} radius={[0, 4, 4, 0]} barSize={28} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <p className="mt-4 text-center text-xs text-stone-400">
                                            Đơn vị: nghìn đồng (k)
                                        </p>
                                    </div>
                                </div>

                                {/* Expandable Analysis Cards */}
                                <div className="space-y-4">

                                    {/* Financial */}
                                    <div className={cardBase}>
                                        <button type="button"
                                            onClick={() => setExpandedCard(expandedCard === 'financial' ? null : 'financial')}
                                            className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-stone-50/70 sm:p-6"
                                            aria-expanded={expandedCard === 'financial'}>
                                            <div className={iconWrapSm}>
                                                <DollarSign size={18} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium tracking-tight text-stone-900">Phân tích Tài chính</p>
                                                <p className="mt-0.5 text-sm text-stone-500">Biên lãi nhuận &amp; Break-even</p>
                                            </div>
                                            <span className="shrink-0 text-base font-semibold text-stone-900">
                                                {result.financial_analysis.gross_margin_percent}%
                                            </span>
                                            {expandedCard === 'financial'
                                                ? <ChevronUp size={18} className="shrink-0 text-stone-400" strokeWidth={1.5} />
                                                : <ChevronDown size={18} className="shrink-0 text-stone-400" strokeWidth={1.5} />}
                                        </button>
                                        {expandedCard === 'financial' && (
                                            <div className="divide-y divide-stone-100 border-t border-stone-200/90">
                                                <div className="px-5 py-5 sm:px-6 sm:py-6">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Đánh giá Biên lợi nhuận</p>
                                                    <p className="text-sm leading-relaxed text-stone-700">{result.financial_analysis.assessment}</p>
                                                </div>
                                                <div className="px-5 py-5 sm:px-6 sm:py-6">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Break-even Point</p>
                                                    <p className="text-sm font-medium text-stone-700">{result.financial_analysis.break_even_point}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Market Position */}
                                    <div className={cardBase}>
                                        <button type="button"
                                            onClick={() => setExpandedCard(expandedCard === 'market' ? null : 'market')}
                                            className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-stone-50/70 sm:p-6"
                                            aria-expanded={expandedCard === 'market'}>
                                            <div className={iconWrapSm}>
                                                <TrendingUp size={18} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium tracking-tight text-stone-900">Vị thế Thị trường</p>
                                                <p className="mt-0.5 text-sm text-stone-500">Price Index &amp; So sánh</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {result.market_position_analysis.price_index > 1
                                                    ? <TrendingUp size={14} className="text-amber-600" strokeWidth={1.5} />
                                                    : <TrendingDown size={14} className="text-green-600" strokeWidth={1.5} />}
                                                <span className="text-base font-semibold text-stone-900">
                                                    {result.market_position_analysis.price_index}
                                                </span>
                                            </div>
                                            {expandedCard === 'market'
                                                ? <ChevronUp size={18} className="shrink-0 text-stone-400" strokeWidth={1.5} />
                                                : <ChevronDown size={18} className="shrink-0 text-stone-400" strokeWidth={1.5} />}
                                        </button>
                                        {expandedCard === 'market' && (
                                            <div className="divide-y divide-stone-100 border-t border-stone-200/90">
                                                <div className="px-5 py-5 sm:px-6 sm:py-6">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Bình luận Phân tích</p>
                                                    <p className="text-sm leading-relaxed text-stone-700">{result.market_position_analysis.comment}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 p-5 sm:px-6 sm:py-6">
                                                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4">
                                                        <p className="mb-1 text-xs text-stone-500">Trung bình thị trường</p>
                                                        <p className="text-lg font-semibold text-stone-900">
                                                            {result.market_position_analysis.market_avg.toLocaleString('vi-VN')}đ
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4">
                                                        <p className="mb-1 text-xs text-stone-500">Giá của bạn</p>
                                                        <p className="text-lg font-semibold text-stone-900">
                                                            {input.targetPrice.toLocaleString('vi-VN')}đ
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Strategic Solutions */}
                                    {result.strategic_solutions.length > 0 && (
                                        <div className={cardBase}>
                                            <button type="button"
                                                onClick={() => setExpandedCard(expandedCard === 'solutions' ? null : 'solutions')}
                                                className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-stone-50/70 sm:p-6"
                                                aria-expanded={expandedCard === 'solutions'}>
                                                <div className={iconWrapSm}>
                                                    <Lightbulb size={18} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium tracking-tight text-stone-900">Giải pháp Chiến lược</p>
                                                    <p className="mt-0.5 text-sm text-stone-500">
                                                        {result.strategic_solutions.length} đề xuất
                                                    </p>
                                                </div>
                                                {expandedCard === 'solutions'
                                                    ? <ChevronUp size={18} className="shrink-0 text-stone-400" strokeWidth={1.5} />
                                                    : <ChevronDown size={18} className="shrink-0 text-stone-400" strokeWidth={1.5} />}
                                            </button>
                                            {expandedCard === 'solutions' && (
                                                <div className="divide-y divide-stone-100 border-t border-stone-200/90">
                                                    {result.strategic_solutions.map((sol, i) => (
                                                        <div key={i} className="px-5 py-5 sm:px-6 sm:py-6">
                                                            <div className="mb-2 flex items-center gap-2.5">
                                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100 text-xs font-semibold text-stone-600">
                                                                    {i + 1}
                                                                </span>
                                                                <span className="text-sm font-semibold text-stone-900">{sol.type}</span>
                                                            </div>
                                                            <p className="text-sm leading-relaxed text-stone-600">{sol.advice}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* ── Empty State ─────────────────────────────── */
                            <div className={`${cardBase} flex flex-col items-center justify-center py-24 px-8 text-center`}>
                                <div className={iconWrap + ' mb-5'}>
                                    <DollarSign size={24} strokeWidth={1.5} />
                                </div>
                                <h3 className="mb-2 text-lg font-medium tracking-tight text-stone-900">
                                    Chưa có phân tích nào
                                </h3>
                                <p className="max-w-sm text-sm leading-relaxed text-stone-500">
                                    Nhập thông tin giá sản phẩm bên trái và nhấn <strong>Phân tích Chiến lược Giá</strong> để AI phân tích chiến lược định giá.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── History Drawer ───────────────────────────────────────── */}
            {showHistory && (
                <>
                    <div className="fixed inset-0 z-30 bg-black/15"
                        onClick={() => setShowHistory(false)} />
                    <aside className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06),-8px_0_40px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center justify-between border-b border-stone-200/90 px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <History size={16} className="text-stone-500" strokeWidth={1.5} />
                                <h2 className="text-sm font-semibold text-stone-900">Lịch sử Phân tích</h2>
                            </div>
                            <button type="button" onClick={() => setShowHistory(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
                                <X size={16} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            {savedAnalyses.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center text-center">
                                    <History size={24} className="mb-2 text-stone-300" strokeWidth={1.5} />
                                    <p className="text-sm text-stone-400">Chưa có phân tích nào được lưu.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {savedAnalyses.map((a) => (
                                        <div key={a.id}
                                            onClick={() => handleLoad(a)}
                                            className="group relative cursor-pointer rounded-xl border border-stone-200 bg-stone-50/60 p-4 transition-colors hover:border-stone-300 hover:bg-stone-50">
                                            <div className="mb-1 flex items-start justify-between gap-2">
                                                <p className="line-clamp-1 text-sm font-medium text-stone-900">{a.name}</p>
                                                <button type="button"
                                                    onClick={(e) => handleDelete(a.id, e)}
                                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-stone-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
                                                    <Trash2 size={13} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                            <p className="mb-1.5 text-xs font-medium text-stone-500">
                                                {verdicts[a.result?.verdict?.status] || a.result?.verdict?.status || '—'}
                                            </p>
                                            <p className="flex items-center gap-1 text-[11px] text-stone-400">
                                                <History size={10} strokeWidth={1.5} />
                                                {new Date(a.createdAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
};

export default PricingAnalyzer;
