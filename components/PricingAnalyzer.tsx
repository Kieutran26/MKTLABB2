import React, { useState, useEffect } from 'react';
import { PricingAnalyzerInput, PricingAnalyzerResult } from '../types';
import { analyzePricingStrategy } from '../services/geminiService';
import { PricingAnalyzerService, SavedPricingAnalysis } from '../services/pricingAnalyzerService';
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
    X,
    Trash2
} from 'lucide-react';
import { Toast, ToastType } from './Toast';

interface Props {
    isActive: boolean;
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

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedPricingAnalysis[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Load history on mount
    useEffect(() => {
        const loadHistory = async () => {
            const analyses = await PricingAnalyzerService.getPricingAnalyses();
            setSavedAnalyses(analyses);
        };
        loadHistory();
    }, []);
    const [progress, setProgress] = useState('');

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
            setToast({ message: 'Chưa có dữ liệu để lưu!', type: 'error' });
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
            setToast({ message: 'Đã lưu Pricing Analysis!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi lưu!', type: 'error' });
        }
    };

    const handleLoad = (analysis: SavedPricingAnalysis) => {
        setInput(analysis.input);
        setResult(analysis.result);
        setShowHistory(false);
        setToast({ message: 'Đã tải Pricing Analysis!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        const success = await PricingAnalyzerService.deletePricingAnalysis(id);

        if (success) {
            const analyses = await PricingAnalyzerService.getPricingAnalyses();
            setSavedAnalyses(analyses);
            setToast({ message: 'Đã xóa!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi xóa!', type: 'error' });
        }
    };

    // Meter Gauge Component
    const MeterGauge: React.FC<{ score: number }> = ({ score }) => {
        const angle = (score / 100) * 180 - 90; // -90 to 90 degrees

        return (
            <div className="relative w-64 h-40 mx-auto mb-4">
                {/* Background Arc */}
                <svg className="w-full h-32" viewBox="0 0 200 100">
                    {/* Red Zone (0-40) */}
                    <path
                        d="M 20 90 A 80 80 0 0 1 60 20"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeLinecap="round"
                    />
                    {/* Green Zone (40-70) */}
                    <path
                        d="M 60 20 A 80 80 0 0 1 140 20"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeLinecap="round"
                    />
                    {/* Orange Zone (70-100) */}
                    <path
                        d="M 140 20 A 80 80 0 0 1 180 90"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="20"
                        strokeLinecap="round"
                    />

                    {/* Needle */}
                    <line
                        x1="100"
                        y1="90"
                        x2="100"
                        y2="30"
                        stroke="#1e293b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform={`rotate(${angle} 100 90)`}
                    />
                    <circle cx="100" cy="90" r="6" fill="#1e293b" />
                </svg>

                {/* Labels - positioned below the gauge */}
                <div className="absolute bottom-0 left-4 text-xs font-bold text-red-600">Quá rẻ</div>
                <div className="absolute bottom-0 right-4 text-xs font-bold text-amber-600">Quá đắt</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-600">Tối ưu</div>
            </div>
        );
    };

    if (!isActive) return null;

    return (
        <div className="w-full h-full overflow-auto bg-slate-50/30 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pricing Analyzer</h2>
                            <p className="text-slate-500 text-sm mt-0.5">Phân tích chiến lược giá cả sản phẩm chuyên sâu</p>
                        </div>
                        <div className="flex gap-2 ml-auto">
                            {result && (
                                <button
                                    onClick={handleSave}
                                    className="group bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold transition-all"
                                >
                                    <Save size={16} className="group-hover:scale-110 transition-transform" />
                                    Lưu
                                </button>
                            )}
                            <button
                                onClick={() => setShowHistory(true)}
                                className="group bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold transition-all"
                            >
                                <History size={16} className="group-hover:scale-110 transition-transform" />
                                Lịch sử
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-emerald-600" />
                                Thông tin Giá
                            </h2>

                            <div className="space-y-5">
                                {/* Product Name & Industry */}
                                <div className="grid grid-cols-2 gap-4">
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
                                            Giá đối thủ thấp nhất *
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
                                            Giá đối thủ cao nhất *
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
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['budget', 'mainstream', 'premium'] as const).map((pos) => (
                                            <button
                                                key={pos}
                                                onClick={() => setInput({ ...input, positioning: pos })}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${input.positioning === pos
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                                        placeholder="VD: 50000000 (để tính break-even)"
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
                                        placeholder="VD: Tối đa hóa lợi nhuận, Tăng thị phần..."
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
                    </div>

                    {/* Analysis Dashboard */}
                    <div className="space-y-6">
                        {result ? (
                            <>
                                {/* Verdict Card */}
                                <div className={`rounded-2xl border-2 p-6 shadow-lg ${result.verdict.status === 'Optimal' ? 'bg-emerald-50 border-emerald-300' :
                                    result.verdict.status === 'Warning' ? 'bg-amber-50 border-amber-300' :
                                        'bg-red-50 border-red-300'
                                    }`}>
                                    <div className="flex items-start gap-4">
                                        {result.verdict.status === 'Optimal' ? (
                                            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                                        ) : result.verdict.status === 'Warning' ? (
                                            <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-black text-slate-900">
                                                    {result.verdict.status === 'Optimal' ? 'Hợp lý' :
                                                        result.verdict.status === 'Warning' ? 'Cần điều chỉnh' :
                                                            'Vấn đề nghiêm trọng'}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.verdict.status === 'Optimal' ? 'bg-emerald-600 text-white' :
                                                    result.verdict.status === 'Warning' ? 'bg-amber-600 text-white' :
                                                        'bg-red-600 text-white'
                                                    }`}>
                                                    {result.verdict.score}/100
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700">{result.verdict.summary}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Meter Gauge */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
                                        Đồng hồ đo Giá
                                    </h3>
                                    <MeterGauge score={result.verdict.score} />
                                    <div className="text-center mt-4">
                                        <div className="text-3xl font-black text-slate-900">{result.verdict.score}</div>
                                        <div className="text-xs text-slate-500">Điểm tổng hợp</div>
                                    </div>
                                </div>

                                {/* Comparison Chart */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                                        So sánh với Thị trường
                                    </h3>
                                    <div className="space-y-3">
                                        {(() => {
                                            // Calculate max value for proper scaling
                                            const maxValue = Math.max(
                                                input.competitorMin,
                                                input.competitorMax,
                                                input.targetPrice,
                                                result.market_position_analysis.market_avg
                                            );

                                            return (
                                                <>
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="text-slate-500">Đối thủ thấp nhất</span>
                                                            <span className="font-bold text-slate-700">{input.competitorMin.toLocaleString('vi-VN')}đ</span>
                                                        </div>
                                                        <div className="h-8 bg-slate-200 rounded-lg" style={{ width: `${(input.competitorMin / maxValue) * 100}%` }}></div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="font-bold text-emerald-600">Giá của bạn</span>
                                                            <span className="font-bold text-emerald-600">{input.targetPrice.toLocaleString('vi-VN')}đ</span>
                                                        </div>
                                                        <div className="h-8 bg-emerald-500 rounded-lg shadow-sm" style={{ width: `${(input.targetPrice / maxValue) * 100}%` }}></div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="text-slate-500">Trung bình thị trường</span>
                                                            <span className="font-bold text-slate-700">{result.market_position_analysis.market_avg.toLocaleString('vi-VN')}đ</span>
                                                        </div>
                                                        <div className="h-8 border-2 border-dashed border-slate-400 rounded-lg" style={{ width: `${(result.market_position_analysis.market_avg / maxValue) * 100}%` }}></div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="text-slate-500">Đối thủ cao nhất</span>
                                                            <span className="font-bold text-slate-700">{input.competitorMax.toLocaleString('vi-VN')}đ</span>
                                                        </div>
                                                        <div className="h-8 bg-slate-200 rounded-lg" style={{ width: `${(input.competitorMax / maxValue) * 100}%` }}></div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Financial Metrics */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                                        Phân tích Tài chính
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Biên lợi nhuận gộp:</span>
                                            <span className={`text-lg font-black ${result.financial_analysis.gross_margin_percent >= 50 ? 'text-emerald-600' :
                                                result.financial_analysis.gross_margin_percent >= 30 ? 'text-amber-600' :
                                                    'text-red-600'
                                                }`}>
                                                {result.financial_analysis.gross_margin_percent}%
                                            </span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <div className="text-xs font-bold text-slate-500 mb-1">Đánh giá:</div>
                                            <div className="text-sm text-slate-700">{result.financial_analysis.assessment}</div>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <div className="text-xs font-bold text-slate-500 mb-1">Break-even:</div>
                                            <div className="text-sm text-slate-700">{result.financial_analysis.break_even_point}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Market Position */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                                        Vị thế Cạnh tranh
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Price Index:</span>
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
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <div className="text-sm text-slate-700">{result.market_position_analysis.comment}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Strategic Solutions */}
                                {result.strategic_solutions.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-amber-500" />
                                            Giải pháp Chiến lược
                                        </h3>
                                        <div className="space-y-3">
                                            {result.strategic_solutions.map((solution, idx) => (
                                                <div key={idx} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                                    <div className="font-bold text-amber-900 text-sm mb-1">{solution.type}</div>
                                                    <div className="text-sm text-slate-700">{solution.advice}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
                                <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium">
                                    Điền thông tin giá và nhấn "Phân tích Giá"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in border border-slate-100 flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> Lịch sử Pricing Analysis</h3>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3">
                            {savedAnalyses.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Chưa có Pricing Analysis nào.</div>
                            ) : savedAnalyses.map(analysis => (
                                <div key={analysis.id} className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-slate-50 transition-all group">
                                    <div className="flex items-start gap-3">
                                        <button onClick={() => handleLoad(analysis)} className="flex-1 text-left">
                                            <div className="font-bold text-slate-800 mb-1">{analysis.name}</div>
                                            <div className="text-xs text-slate-400 mb-2">{new Date(analysis.createdAt).toLocaleDateString('vi-VN')}</div>
                                            <div className="text-xs text-emerald-600 font-bold">{analysis.result.verdict.verdict_status}</div>
                                        </button>
                                        <button onClick={() => handleDelete(analysis.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16} />
                                        </button>
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

export default PricingAnalyzer;
