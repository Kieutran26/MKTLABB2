import React, { useState, useEffect } from 'react';
import { AdsHealthInput, AdsHealthResult } from '../types';
import { checkAdsHealth } from '../services/geminiService';
import { AdsHealthService, SavedAdsHealthAnalysis } from '../services/adsHealthService';
import { Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, Scissors, RefreshCw, Layout, Monitor, Globe, Save, Trash2, FolderOpen, Stethoscope } from 'lucide-react';

interface Props {
    isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const smallInputClass = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 transition-all';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const AdsHealthChecker: React.FC<Props> = ({ isActive }) => {
    const [input, setInput] = useState<AdsHealthInput>({
        platform: 'Facebook Ads',
        industry: '',
        dataMode: 'paste',
        manualMetrics: {
            spend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            // V3 Business Metrics
            revenue: 0,
            duration: 0,
            frequency: 0,
            reach: 0
        },
        rawText: ''
    });
    const [result, setResult] = useState<AdsHealthResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');

    // Persistence state
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAdsHealthAnalysis[]>([]);
    const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [analysisName, setAnalysisName] = useState('');
    const [saveError, setSaveError] = useState('');

    // Load saved analyses on mount
    useEffect(() => {
        loadSavedAnalyses();
    }, []);

    if (!isActive) return null;

    const loadSavedAnalyses = async () => {
        const analyses = await AdsHealthService.getAdsHealthAnalyses();
        setSavedAnalyses(analyses);
    };

    const handleLoadAnalysis = (analysisId: string) => {
        if (!analysisId) {
            // Clear selection
            setSelectedAnalysisId('');
            setInput({
                platform: 'Facebook Ads',
                industry: '',
                dataMode: 'paste',
                manualMetrics: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, duration: 0, frequency: 0, reach: 0 },
                rawText: ''
            });
            setResult(null);
            return;
        }

        const analysis = savedAnalyses.find(a => a.id === analysisId);
        if (analysis) {
            setSelectedAnalysisId(analysisId);
            setInput(analysis.input);
            setResult(analysis.result);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!analysisName.trim()) {
            setSaveError('Vui lòng nhập tên cho phân tích');
            return;
        }

        if (!result) {
            setSaveError('Không có kết quả để lưu');
            return;
        }

        const newAnalysis: SavedAdsHealthAnalysis = {
            id: Date.now().toString(),
            name: analysisName.trim(),
            input: input,
            result: result,
            createdAt: Date.now()
        };

        const success = await AdsHealthService.saveAdsHealthAnalysis(newAnalysis);
        if (success) {
            setShowSaveModal(false);
            setAnalysisName('');
            setSaveError('');
            await loadSavedAnalyses();
        } else {
            setSaveError('Lỗi khi lưu phân tích');
        }
    };

    const handleDeleteAnalysis = async () => {
        if (!selectedAnalysisId) return;

        const success = await AdsHealthService.deleteAdsHealthAnalysis(selectedAnalysisId);
        if (success) {
            setSelectedAnalysisId('');
            setInput({
                platform: 'Facebook Ads',
                industry: '',
                dataMode: 'paste',
                manualMetrics: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, duration: 0, frequency: 0, reach: 0 },
                rawText: ''
            });
            setResult(null);
            await loadSavedAnalyses();
        }
    };

    const handleAnalyze = async () => {
        if (!input.industry) {
            setError('Vui lòng nhập ngành hàng của bạn (VD: Thời trang, Bất động sản)');
            return;
        }
        if (input.dataMode === 'paste' && !input.rawText) {
            setError('Vui lòng dán dữ liệu chiến dịch của bạn');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await checkAdsHealth(input, (step) => {
                if (step.includes('Initializing')) setLoadingStep('Khởi động bác sĩ AI...');
                else if (step.includes('Analyzing')) setLoadingStep('Đang phân tích metrics & benchmark...');
                else if (step.includes('Formulating')) setLoadingStep('Đang lập phác đồ điều trị...');
                else setLoadingStep(step);
            });
            if (data) {
                setResult(data);
            } else {
                setError('Không thể phân tích dữ liệu. Vui lòng thử lại với metrics rõ ràng hơn.');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi trong quá trình phân tích.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-rose-600 bg-rose-50 border-rose-200';
    };

    const getTrafficLight = (assessment: string) => {
        const lower = assessment.toLowerCase();
        // Good: Tốt, Rẻ, Cao (CTR/CR), Thấp (CPM/CPC - usually context dependent but 'Tốt' covers most)
        if (lower.includes('tốt') || lower.includes('rẻ') || lower.includes('good')) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
        if (lower.includes('cao') && (lower.includes('ctr') || lower.includes('cr') || lower.includes('conversion'))) return <CheckCircle className="w-4 h-4 text-emerald-500" />;

        // Warning
        if (lower.includes('cảnh báo') || lower.includes('warning') || lower.includes('trung bình')) return <AlertTriangle className="w-4 h-4 text-amber-500" />;

        // Bad: Thấp (CTR/CR), Cao (CPM/CPC), Đắt
        return <XCircle className="w-4 h-4 text-rose-500" />;
    };

    const getActionIcon = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('trim') || lower.includes('cắt giảm')) return <Scissors className="w-5 h-5 text-rose-500" />;
        if (lower.includes('refresh') || lower.includes('làm mới') || lower.includes('sáng tạo')) return <RefreshCw className="w-5 h-5 text-blue-500" />;
        if (lower.includes('structure') || lower.includes('cấu trúc')) return <Layout className="w-5 h-5 text-purple-500" />;
        if (lower.includes('scale') || lower.includes('mở rộng') || lower.includes('tăng ngân sách')) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
        return <Activity className="w-5 h-5 text-stone-500" />;
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* Header */}
            <div className="z-10 flex shrink-0 items-center justify-between border-b border-stone-200/70 bg-[#FCFDFC] px-8 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                        <Activity size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Marketing Analytics</p>
                        <h1 className="text-lg font-normal tracking-tight text-stone-900">Chẩn đoán Sức khỏe Ads</h1>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setInput({
                                platform: 'Facebook Ads',
                                industry: '',
                                dataMode: 'paste',
                                manualMetrics: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, duration: 0, frequency: 0, reach: 0 },
                                rawText: ''
                            });
                            setResult(null);
                            setSelectedAnalysisId('');
                            setError('');
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                    >
                        <Activity className="w-4 h-4" />
                        Tạo mới
                    </button>
                    {result && (
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                        >
                            <Save className="w-4 h-4" />
                            Lưu
                        </button>
                    )}
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                    >
                        <FolderOpen className="w-4 h-4" />
                        Lịch sử ({savedAnalyses.length})
                    </button>
                </div>
            </div>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '440px 1fr' }}>
                {/* Left Panel: Input */}
                <div className="h-full overflow-y-auto border-r border-stone-200/80 bg-white p-6">
                    <div className={`${cardClass} p-6`}>
                        <div className="mb-6 flex items-center gap-2">
                            <span className="h-6 w-1 rounded-full bg-stone-400"></span>
                            <h2 className="text-lg font-medium text-stone-900">Thiết lập Phân tích</h2>
                        </div>

                        <div className="mb-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Nền tảng</label>
                                <div className="relative">
                                    <select
                                        className="w-full cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 transition-all"
                                        value={input.platform}
                                        onChange={(e) => setInput({ ...input, platform: e.target.value })}
                                    >
                                        <option value="Facebook Ads">Facebook Ads</option>
                                        <option value="Google Ads">Google Ads</option>
                                        <option value="TikTok Ads">TikTok Ads</option>
                                        <option value="LinkedIn Ads">LinkedIn Ads</option>
                                    </select>
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                                        <Monitor className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Ngành hàng</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        placeholder="VD: Thời trang, Bất động sản..."
                                        value={input.industry}
                                        onChange={(e) => setInput({ ...input, industry: e.target.value })}
                                    />
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-stone-100 pt-6">
                            <div className="mb-5 flex cursor-help items-center gap-2" title="Chọn cách nhập dữ liệu">
                                <span className="h-6 w-1 rounded-full bg-stone-400"></span>
                                <h2 className="text-lg font-medium text-stone-900">Dữ liệu Đầu vào</h2>
                            </div>

                            <div className="mb-5 flex gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1.5">
                                <button
                                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${input.dataMode === 'paste' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-black/5' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'}`}
                                    onClick={() => setInput({ ...input, dataMode: 'paste' })}
                                >
                                    Ads Manager (Excel)
                                </button>
                                <button
                                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${input.dataMode === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-black/5' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'}`}
                                    onClick={() => setInput({ ...input, dataMode: 'manual' })}
                                >
                                    Nhập Thủ công
                                </button>
                            </div>

                            {input.dataMode === 'paste' ? (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                    <textarea
                                        className="h-44 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-mono text-stone-700 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 transition-all"
                                        placeholder={`Paste dữ liệu từ Excel/Ads Manager vào đây...\nVí dụ:\nCampaign A\t5,000,000\t50,000\t1,200\t50`}
                                        value={input.rawText}
                                        onChange={(e) => setInput({ ...input, rawText: e.target.value })}
                                    />
                                    <p className="ml-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-stone-400"></span>
                                        Hỗ trợ copy trực tiếp cột số liệu từ Ads Manager
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                                    {/* Core Metrics */}
                                    <div>
                                        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                                            <span className="h-2 w-2 rounded-full bg-stone-500"></span>
                                            Hiệu suất Phễu (Funnel)
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'Chi tiêu (Spend)', key: 'spend', placeholder: 'VD: 5000000' },
                                                { label: 'Hiển thị (Impressions)', key: 'impressions', placeholder: 'VD: 100000' },
                                                { label: 'Lượt nhấp (Clicks)', key: 'clicks', placeholder: 'VD: 2000' },
                                                { label: 'Chuyển đổi (Conversions)', key: 'conversions', placeholder: 'VD: 50' }
                                            ].map((field) => {
                                                const currentValue = input.manualMetrics?.[field.key as keyof typeof input.manualMetrics] || 0;
                                                return (
                                                    <div key={field.key} className="space-y-1">
                                                        <label className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">{field.label}</label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            className={smallInputClass}
                                                            placeholder={field.placeholder}
                                                            value={currentValue === 0 ? '' : currentValue}
                                                            onChange={(e) => {
                                                                const cleanValue = e.target.value.replace(/^0+(?=\d)/, '').replace(/[^0-9]/g, '');
                                                                const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
                                                                setInput({ ...input, manualMetrics: { ...input.manualMetrics!, [field.key]: numValue } });
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Business Metrics - V3 */}
                                    <div>
                                        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                            Hiệu quả Kinh doanh (Profit-First)
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'Doanh thu (Revenue)', key: 'revenue', placeholder: 'VD: 25000000' },
                                                { label: 'Thời gian chạy (ngày)', key: 'duration', placeholder: 'VD: 7' },
                                                { label: 'Tần suất (Frequency)', key: 'frequency', placeholder: 'VD: 1.8', isDecimal: true },
                                                { label: 'Tiếp cận (Reach)', key: 'reach', placeholder: 'Hoặc nhập Reach' }
                                            ].map((field) => {
                                                const currentValue = input.manualMetrics?.[field.key as keyof typeof input.manualMetrics] || 0;
                                                return (
                                                    <div key={field.key} className="space-y-1">
                                                        <label className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">{field.label}</label>
                                                        <input
                                                            type="text"
                                                            inputMode={field.isDecimal ? "decimal" : "numeric"}
                                                            className={smallInputClass}
                                                            placeholder={field.placeholder}
                                                            value={currentValue === 0 ? '' : currentValue}
                                                            onChange={(e) => {
                                                                let numValue: number;
                                                                if (field.isDecimal) {
                                                                    // Allow decimal for frequency
                                                                    const cleanValue = e.target.value.replace(/[^0-9.]/g, '');
                                                                    numValue = cleanValue === '' ? 0 : parseFloat(cleanValue) || 0;
                                                                } else {
                                                                    const cleanValue = e.target.value.replace(/^0+(?=\d)/, '').replace(/[^0-9]/g, '');
                                                                    numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
                                                                }
                                                                setInput({ ...input, manualMetrics: { ...input.manualMetrics!, [field.key]: numValue } });
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="ml-1 mt-2 text-[10px] text-stone-400">Nhập Frequency HOẶC Reach. Nếu có Reach, hệ thống tự tính Frequency.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <p className="leading-snug">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-stone-900 py-4 text-base font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                    {loadingStep || 'Đang phân tích...'}
                                </>
                            ) : (
                                <>
                                    <Stethoscope className="h-5 w-5" />
                                    Chẩn đoán Chiến dịch
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="h-full overflow-auto bg-stone-100/60 p-6">
                    {!result ? (
                        <div className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white text-stone-400">
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200 bg-white">
                                <Activity className="h-8 w-8 text-stone-300" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-stone-600">Chưa có dữ liệu phân tích</h3>
                            <p className="max-w-xs text-center leading-relaxed text-stone-400">
                                Nhập thông tin chiến dịch ở cột bên trái để AI tiến hành khám sức khỏe tổng quát.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                            {/* Health Score Card */}
                            <div className={`${cardClass} relative overflow-hidden p-8`}>
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Activity className="h-40 w-40" />
                                </div>
                                <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start">
                                    <div className={`shrink-0 flex h-32 w-32 items-center justify-center rounded-full border-[6px] bg-white shadow-sm ${getScoreColor(result.health_score).replace('bg-', 'border-').split(' ')[2]}`}>
                                        <div className="text-center">
                                            <span className={`text-4xl font-bold tracking-tighter ${getScoreColor(result.health_score).split(' ')[0]}`}>{result.health_score}</span>
                                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Điểm Sức khỏe</div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm ${getScoreColor(result.health_score)}`}>
                                            Trạng thái: {result.status}
                                        </div>
                                        <h3 className="mb-3 text-2xl font-semibold text-stone-900">{result.diagnosis.primary_issue}</h3>
                                        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 leading-relaxed text-sm font-medium text-stone-700">
                                            "{result.diagnosis.explanation}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Analysis */}
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {Object.entries(result.metrics_analysis).map(([key, metric]: [string, any]) => (
                                    <div key={key} className={`${cardClass} p-5 transition-all hover:-translate-y-0.5`}>
                                        <div className="mb-3 flex items-start justify-between">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{key}</span>
                                            {getTrafficLight(metric.assessment)}
                                        </div>
                                        <div className="mb-1 text-2xl font-semibold text-stone-900 tracking-tight">
                                            {typeof metric.value === 'number' && (key === 'ctr' || key === 'cr') ? (metric.value * 100).toFixed(2) + '%' : metric.value.toLocaleString()}
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-xs text-stone-500">
                                            <span className="font-medium text-stone-700">{metric.assessment}</span>
                                            {metric.benchmark && <span className="opacity-70 text-[10px]">vs {metric.benchmark}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Actionable Steps */}
                            <div className={`${cardClass} overflow-hidden`}>
                                <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-6 py-5 backdrop-blur-sm">
                                    <h3 className="flex items-center gap-2.5 font-medium text-stone-900">
                                        <div className="rounded-lg bg-stone-100 p-1.5">
                                            <CheckCircle className="h-4 w-4 text-stone-600" />
                                        </div>
                                        Phác đồ Điều trị
                                    </h3>
                                    <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-500 shadow-sm">
                                        {result.actionable_steps.length} BƯỚC
                                    </span>
                                </div>
                                <div className="divide-y divide-stone-100">
                                    {result.actionable_steps.map((step, idx) => (
                                        <div key={idx} className="flex gap-5 p-6 transition-colors hover:bg-stone-50/50">
                                            <div className="mt-1 shrink-0">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm transition-transform group-hover:scale-110">
                                                    {getActionIcon(step.action)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="inline-block rounded-md bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-700 transition-colors group-hover:bg-stone-200">{step.action}</span>
                                                </div>
                                                <p className="leading-relaxed text-sm font-medium text-stone-600">{step.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="mx-4 w-full max-w-md rounded-2xl border border-stone-200/90 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="mb-4 border-b border-stone-100 bg-stone-50/60 rounded-t-2xl p-4">
                            <h3 className="text-lg font-medium text-stone-900">Lưu Phân tích</h3>
                            <p className="text-sm text-stone-500">Đặt tên để dễ quản lý sau này</p>
                        </div>

                        <div className="p-6 pt-4 space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500 ml-1">
                                    Tên phân tích
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="VD: Chiến dịch Facebook - Tháng 12"
                                    value={analysisName}
                                    onChange={(e) => setAnalysisName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSaveAnalysis()}
                                    autoFocus
                                />
                            </div>

                            {saveError && (
                                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-600">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <p>{saveError}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowSaveModal(false);
                                        setAnalysisName('');
                                        setSaveError('');
                                    }}
                                    className="flex-1 rounded-xl border border-stone-200 py-3 text-sm font-medium text-stone-500 transition-all hover:bg-stone-50"
                                >
                                    Bỏ qua
                                </button>
                                <button
                                    onClick={handleSaveAnalysis}
                                    className="flex-1 rounded-xl bg-stone-900 py-3 text-sm font-medium text-white transition-all hover:bg-stone-800 flex items-center justify-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Lưu lại
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="mx-4 flex w-full max-w-3xl flex-col rounded-2xl border border-stone-200/90 bg-white shadow-2xl animate-in zoom-in-95 duration-300 max-h-[80vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-stone-100 p-3">
                                    <FolderOpen className="h-6 w-6 text-stone-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-stone-900">Lịch sử Phân tích</h3>
                                    <p className="text-sm text-stone-500">{savedAnalyses.length} phân tích đã lưu</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="rounded-lg p-2 transition-colors hover:bg-stone-100"
                            >
                                <XCircle className="h-5 w-5 text-stone-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-6">
                            {savedAnalyses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
                                        <FolderOpen className="h-10 w-10 text-stone-300" />
                                    </div>
                                    <h4 className="mb-2 text-lg font-medium text-stone-600">Chưa có phân tích nào</h4>
                                    <p className="max-w-sm text-stone-500">
                                        Các phân tích bạn lưu sẽ hiển thị ở đây để bạn có thể xem lại bất cứ lúc nào.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {savedAnalyses.map((analysis) => (
                                        <div
                                            key={analysis.id}
                                            className="group rounded-xl border border-stone-200 bg-stone-50 p-4 transition-all hover:border-stone-300 hover:bg-stone-100/50"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="mb-1 truncate font-medium text-stone-900">
                                                        {analysis.name}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                                                        <span className="flex items-center gap-1">
                                                            <Monitor className="h-3 w-3" />
                                                            {analysis.input.platform}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            {analysis.input.industry}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Activity className="h-3 w-3" />
                                                            Điểm: {analysis.result.health_score}
                                                        </span>
                                                        <span>
                                                            {new Date(analysis.createdAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <button
                                                        onClick={() => {
                                                            handleLoadAnalysis(analysis.id);
                                                            setShowHistoryModal(false);
                                                        }}
                                                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all hover:bg-stone-800"
                                                        title="Tải phân tích này"
                                                    >
                                                        <FolderOpen className="h-3.5 w-3.5" />
                                                        Tải
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Xóa "${analysis.name}"?`)) {
                                                                const success = await AdsHealthService.deleteAdsHealthAnalysis(analysis.id);
                                                                if (success) {
                                                                    await loadSavedAnalyses();
                                                                    if (selectedAnalysisId === analysis.id) {
                                                                        setSelectedAnalysisId('');
                                                                        setInput({
                                                                            platform: 'Facebook Ads',
                                                                            industry: '',
                                                                            dataMode: 'paste',
                                                                            manualMetrics: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, duration: 0, frequency: 0, reach: 0 },
                                                                            rawText: ''
                                                                        });
                                                                        setResult(null);
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                        className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-stone-100 p-6">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-full rounded-xl bg-stone-100 py-3 text-sm font-medium text-stone-600 transition-all hover:bg-stone-200"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdsHealthChecker;
