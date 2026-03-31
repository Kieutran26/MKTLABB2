import React, { useState, useEffect } from 'react';
import { PricingAnalyzerInput, PricingAnalyzerResult } from '../types';
import { analyzePricingStrategy } from '../services/geminiService';
import { PricingAnalyzerService, SavedPricingAnalysis } from '../services/pricingAnalyzerService';
import toast, { Toaster } from 'react-hot-toast';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Lightbulb,
    BarChart3,
    Loader2,
    AlertCircle,
    Save,
    History,
    Trash2,
    Plus,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
    BarChart,
    Bar,
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

const PricingAnalyzer: React.FC<Props> = ({ isActive }) => {
    const [input, setInput] = useState<PricingAnalyzerInput>({
        productName: '',
        industry: '',
        cogs: 0,
        targetPrice: 0,
        competitorMin: 0,
        competitorMax: 0,
        positioning: 'mainstream',
        fixedCosts: 0,
        pricingGoal: '',
    });
    const [result, setResult] = useState<PricingAnalyzerResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState('');

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedPricingAnalysis[]>([]);

    // Expanded card states
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    // Load history on mount
    useEffect(() => {
        const loadHistory = async () => {
            const analyses = await PricingAnalyzerService.getPricingAnalyses();
            setSavedAnalyses(analyses);
        };
        loadHistory();
    }, []);

    const handleAnalyze = async () => {
        if (!input.productName || !input.industry || !input.cogs || !input.targetPrice || !input.competitorMin || !input.competitorMax) {
            setError('Vui lòng nhập đầy đủ thông tin bắt buộc (Tên sản phẩm, Ngành hàng, COGS, Giá bán, Giá đối thủ)');
            return;
        }

        if (input.cogs >= input.targetPrice) {
            setError('Giá vốn phải nhỏ hơn giá bán');
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
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) {
            toast.error('Chưa có dữ liệu để lưu!');
            return;
        }

        const newAnalysis: SavedPricingAnalysis = {
            id: Date.now().toString(),
            name: `${input.productName} - ${new Date().toLocaleDateString()}`,
            input,
            result,
            createdAt: Date.now()
        };

        const success = await PricingAnalyzerService.savePricingAnalysis(newAnalysis);

        if (success) {
            const analyses = await PricingAnalyzerService.getPricingAnalyses();
            setSavedAnalyses(analyses);
            toast.success('Đã lưu Pricing Analysis!', {
                icon: '💾',
                duration: 3000,
                style: {
                    borderRadius: '12px',
                    background: '#F0FDF4',
                    color: '#166534',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid #BBF7D0'
                }
            });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoad = (analysis: SavedPricingAnalysis) => {
        setInput(analysis.input);
        setResult(analysis.result);
        setShowHistory(false);
        toast.success('Đã tải Pricing Analysis!');
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const success = await PricingAnalyzerService.deletePricingAnalysis(id);

        if (success) {
            const analyses = await PricingAnalyzerService.getPricingAnalyses();
            setSavedAnalyses(analyses);
            toast.success('Đã xóa!');
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleNew = () => {
        setResult(null);
        setError(null);
        setProgress('');
        setInput({
            productName: '',
            industry: '',
            cogs: 0,
            targetPrice: 0,
            competitorMin: 0,
            competitorMax: 0,
            positioning: 'mainstream',
            fixedCosts: 0,
            pricingGoal: '',
        });
        setExpandedCard(null);
        toast.success('Tạo phân tích mới');
    };

    // Score gauge color
    const getScoreColor = (score: number): string => {
        if (score >= 70) return '#10b981'; // emerald-500
        if (score >= 40) return '#f59e0b'; // amber-500
        return '#ef4444'; // red-500
    };

    // Custom Tooltip for charts
    const PriceTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-lg z-50">
                    <div className="font-bold text-slate-900 mb-1">{label}</div>
                    <div className="text-sm text-emerald-600 font-bold">
                        {Number(payload[0].value).toLocaleString('vi-VN')}đ
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!isActive) return null;

    // Prepare market comparison chart data
    const chartData = result ? [
        { name: 'Đối thủ thấp', value: input.competitorMin, color: '#cbd5e1' },
        { name: 'Trung bình', value: result.market_position_analysis.market_avg, color: '#94a3b8' },
        { name: 'Của bạn', value: input.targetPrice, color: '#0f766e' },
        { name: 'Đối thủ cao', value: input.competitorMax, color: '#64748b' },
    ] : [];

    return (
        <div className="w-full h-full overflow-hidden bg-slate-50/30 relative flex">
            <Toaster position="top-center" />

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    Pricing Analyzer
                                </h1>
                                <p className="text-slate-500">
                                    Phân tích chiến lược giá cả sản phẩm chuyên sâu
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleNew}
                                className="p-2.5 text-slate-600 hover:bg-white hover:text-emerald-600 bg-white/50 border border-slate-200 rounded-xl transition-all"
                                title="Tạo mới"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!result}
                                className="p-2.5 text-slate-600 hover:bg-white hover:text-emerald-600 bg-white/50 border border-slate-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Lưu"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="p-2.5 text-slate-600 hover:bg-white hover:text-emerald-600 bg-white/50 border border-slate-200 rounded-xl transition-all"
                                title="Lịch sử"
                            >
                                <History className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Input Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                                    Thông tin Giá
                                </h2>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Tên sản phẩm *
                                        </label>
                                        <input
                                            type="text"
                                            value={input.productName}
                                            onChange={(e) => setInput({ ...input, productName: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                            placeholder="VD: Cà phê Arabica Premium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Ngành hàng *
                                        </label>
                                        <input
                                            type="text"
                                            value={input.industry}
                                            onChange={(e) => setInput({ ...input, industry: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                            placeholder="VD: F&B, Fashion, SaaS..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Giá vốn (COGS) *
                                            </label>
                                            <input
                                                type="number"
                                                value={input.cogs || ''}
                                                onChange={(e) => setInput({ ...input, cogs: Number(e.target.value) })}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                                placeholder="200000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Giá bán mục tiêu *
                                            </label>
                                            <input
                                                type="number"
                                                value={input.targetPrice || ''}
                                                onChange={(e) => setInput({ ...input, targetPrice: Number(e.target.value) })}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                                placeholder="500000"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Đối thủ thấp nhất *
                                            </label>
                                            <input
                                                type="number"
                                                value={input.competitorMin || ''}
                                                onChange={(e) => setInput({ ...input, competitorMin: Number(e.target.value) })}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                                placeholder="300000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Đối thủ cao nhất *
                                            </label>
                                            <input
                                                type="number"
                                                value={input.competitorMax || ''}
                                                onChange={(e) => setInput({ ...input, competitorMax: Number(e.target.value) })}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                                placeholder="600000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Định vị thương hiệu *
                                        </label>
                                        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100/80 p-1">
                                            {(['budget', 'mainstream', 'premium'] as const).map((pos) => (
                                                <button
                                                    key={pos}
                                                    type="button"
                                                    onClick={() => setInput({ ...input, positioning: pos })}
                                                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                                                        input.positioning === pos
                                                            ? 'bg-white font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-slate-200'
                                                            : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                    }`}
                                                >
                                                    {pos === 'budget' ? 'Budget' : pos === 'mainstream' ? 'Mainstream' : 'Premium'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Chi phí cố định (Tùy chọn)
                                        </label>
                                        <input
                                            type="number"
                                            value={input.fixedCosts || ''}
                                            onChange={(e) => setInput({ ...input, fixedCosts: e.target.value ? Number(e.target.value) : undefined })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                            placeholder="VD: 50000000"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Mục tiêu định giá (Tùy chọn)
                                        </label>
                                        <input
                                            type="text"
                                            value={input.pricingGoal || ''}
                                            onChange={(e) => setInput({ ...input, pricingGoal: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                            placeholder="VD: Tối đa hóa lợi nhuận..."
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className="w-full mt-6 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {progress || 'Đang phân tích...'}
                                        </>
                                    ) : (
                                        <>
                                            <BarChart3 className="w-5 h-5" />
                                            Phân tích Giá
                                        </>
                                    )}
                                </button>

                                {error && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats Legend */}
                            {result && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                                        Chỉ số Nhanh
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Biên lợi nhuận:</span>
                                            <span className="text-lg font-black text-emerald-600">
                                                {result.financial_analysis.gross_margin_percent}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Price Index:</span>
                                            <span className="text-lg font-black text-slate-900">
                                                {result.market_position_analysis.price_index}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Đánh giá:</span>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                result.verdict.status === 'Optimal' ? 'bg-emerald-100 text-emerald-700' :
                                                result.verdict.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {result.verdict.status === 'Optimal' ? 'Tối ưu' :
                                                 result.verdict.status === 'Warning' ? 'Cần điều chỉnh' : 'Vấn đề'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Area */}
                        <div className="lg:col-span-2 space-y-6">
                            {result ? (
                                <>
                                    {/* Score Card */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                                                style={{ backgroundColor: `${getScoreColor(result.verdict.score)}20` }}
                                            >
                                                <span
                                                    className="text-3xl font-black"
                                                    style={{ color: getScoreColor(result.verdict.score) }}
                                                >
                                                    {result.verdict.score}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {result.verdict.status === 'Optimal' ? (
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                                    ) : result.verdict.status === 'Warning' ? (
                                                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                                                    ) : (
                                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                                    )}
                                                    <h3 className="text-lg font-bold text-slate-900">
                                                        {result.verdict.status === 'Optimal' ? 'Hợp lý' :
                                                         result.verdict.status === 'Warning' ? 'Cần điều chỉnh' : 'Vấn đề nghiêm trọng'}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-slate-600">{result.verdict.summary}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Market Comparison Chart */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 text-center">
                                            So sánh với Thị trường
                                        </h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={chartData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                                <XAxis
                                                    type="number"
                                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                    tickLine={false}
                                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                    tickLine={false}
                                                    width={100}
                                                />
                                                <Tooltip content={<PriceTooltip />} />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[0, 6, 6, 0]}
                                                    barSize={32}
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <React.Fragment key={`cell-${index}`}>
                                                            {entry.name === 'Của bạn' ? (
                                                                <Bar
                                                                    dataKey="value"
                                                                    fill="#0f766e"
                                                                    radius={[0, 6, 6, 0]}
                                                                    barSize={32}
                                                                />
                                                            ) : (
                                                                <Bar
                                                                    dataKey="value"
                                                                    fill={entry.color}
                                                                    radius={[0, 6, 6, 0]}
                                                                    barSize={32}
                                                                />
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div className="text-center text-xs text-slate-500 mt-4">
                                            Giá được hiển thị theo đơn vị nghìn đồng (k)
                                        </div>
                                    </div>

                                    {/* Expandable Cards */}
                                    <div className="space-y-4">
                                        {/* Financial Analysis Card */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            <button
                                                onClick={() => setExpandedCard(expandedCard === 'financial' ? null : 'financial')}
                                                className="w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                    <DollarSign className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="font-black text-lg text-slate-900">Phân tích Tài chính</div>
                                                    <div className="text-sm text-slate-500">Biên lợi nhuận & Break-even</div>
                                                </div>
                                                <div
                                                    className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                                                    style={{ backgroundColor: getScoreColor(result.verdict.score) }}
                                                >
                                                    {result.financial_analysis.gross_margin_percent}%
                                                </div>
                                                {expandedCard === 'financial' ? (
                                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                )}
                                            </button>

                                            {expandedCard === 'financial' && (
                                                <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
                                                    <div className="pt-4">
                                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                            Đánh giá Biên lợi nhuận
                                                        </div>
                                                        <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">
                                                            {result.financial_analysis.assessment}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                            Break-even Point
                                                        </div>
                                                        <div className="text-sm text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                                                            {result.financial_analysis.break_even_point}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Market Position Card */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            <button
                                                onClick={() => setExpandedCard(expandedCard === 'market' ? null : 'market')}
                                                className="w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="font-black text-lg text-slate-900">Vị thế Thị trường</div>
                                                    <div className="text-sm text-slate-500">Price Index & So sánh</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {result.market_position_analysis.price_index > 1 ? (
                                                        <TrendingUp className="w-4 h-4 text-amber-600" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                                                    )}
                                                    <span className="text-lg font-black text-slate-900">
                                                        {result.market_position_analysis.price_index}
                                                    </span>
                                                </div>
                                                {expandedCard === 'market' ? (
                                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                )}
                                            </button>

                                            {expandedCard === 'market' && (
                                                <div className="px-6 pb-6 border-t border-slate-100">
                                                    <div className="pt-4">
                                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                            Bình luận Phân tích
                                                        </div>
                                                        <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">
                                                            {result.market_position_analysis.comment}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 rounded-xl p-4">
                                                            <div className="text-xs text-slate-500 mb-1">Trung bình thị trường</div>
                                                            <div className="text-xl font-black text-slate-900">
                                                                {result.market_position_analysis.market_avg.toLocaleString('vi-VN')}đ
                                                            </div>
                                                        </div>
                                                        <div className="bg-emerald-50 rounded-xl p-4">
                                                            <div className="text-xs text-emerald-600 mb-1">Giá của bạn</div>
                                                            <div className="text-xl font-black text-emerald-700">
                                                                {input.targetPrice.toLocaleString('vi-VN')}đ
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Strategic Solutions Card */}
                                        {result.strategic_solutions.length > 0 && (
                                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedCard(expandedCard === 'solutions' ? null : 'solutions')}
                                                    className="w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                                        <Lightbulb className="w-6 h-6 text-amber-600" />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-black text-lg text-slate-900">Giải pháp Chiến lược</div>
                                                        <div className="text-sm text-slate-500">
                                                            {result.strategic_solutions.length} đề xuất
                                                        </div>
                                                    </div>
                                                    {expandedCard === 'solutions' ? (
                                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </button>

                                                {expandedCard === 'solutions' && (
                                                    <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
                                                        <div className="pt-4 space-y-3">
                                                            {result.strategic_solutions.map((solution, idx) => (
                                                                <div key={idx} className="bg-slate-50 rounded-xl p-4">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <span className="font-bold text-slate-900">{solution.type}</span>
                                                                    </div>
                                                                    <div className="text-sm text-slate-700">{solution.advice}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center h-[500px] flex flex-col items-center justify-center">
                                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                                        <DollarSign className="w-12 h-12 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                                        Chưa có dữ liệu phân tích
                                    </h3>
                                    <p className="text-slate-400 font-medium max-w-md mx-auto">
                                        Nhập thông tin giá sản phẩm và nhấn "Phân tích Giá" để AI phân tích chiến lược giá cả.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* History Sidebar */}
            <div
                className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
                    showHistory ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <History className="w-4 h-4" /> Lịch sử Phân tích
                        </h3>
                        <button
                            onClick={() => setShowHistory(false)}
                            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {savedAnalyses.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 text-sm">
                                Chưa có phân tích nào được lưu
                            </div>
                        ) : (
                            savedAnalyses.map((analysis) => (
                                <div
                                    key={analysis.id}
                                    onClick={() => handleLoad(analysis)}
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-800 text-sm line-clamp-1">
                                            {analysis.name}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(analysis.id, e)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-emerald-600 font-medium">
                                        {analysis.result?.verdict?.status || 'Đã phân tích'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-2">
                                        <History className="w-3 h-3" />
                                        {new Date(analysis.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Overlay for History Sidebar */}
            {showHistory && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setShowHistory(false)}
                />
            )}
        </div>
    );
};

export default PricingAnalyzer;
