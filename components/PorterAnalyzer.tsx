import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import {
    Target, Sparkles, Loader2, Swords, DoorOpen, Users, Truck, Shuffle,
    History, Save, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Minus, ArrowUpRight, ArrowDownRight, Factory, Lightbulb
} from 'lucide-react';
import { PorterAnalysisInput, PorterAnalysisResult, PorterForce, IndustryVerdict, UserPosition } from '../types';
import { generatePorterAnalysis } from '../services/geminiService';
import { PorterService, SavedPorterAnalysis } from '../services/porterService';
import toast, { Toaster } from 'react-hot-toast';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const FORCE_ICONS: Record<string, LucideIcon> = {
    'Competitive Rivalry': Swords,
    'Threat of New Entrants': DoorOpen,
    'Bargaining Power of Buyers': Users,
    'Bargaining Power of Suppliers': Truck,
    'Threat of Substitutes': Shuffle
};

const VERDICT_CONFIG: Record<IndustryVerdict, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    'Blue Ocean': { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: <TrendingUp size={20} strokeWidth={1.25} /> },
    'Attractive': { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: <TrendingUp size={20} strokeWidth={1.25} /> },
    'Moderate': { color: '#a16207', bg: '#fefce8', border: '#fde047', icon: <AlertTriangle size={20} strokeWidth={1.25} /> },
    'Unattractive': { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: <TrendingDown size={20} strokeWidth={1.25} /> },
    'Red Ocean': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: <TrendingDown size={20} strokeWidth={1.25} /> }
};

const TREND_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    'Increasing': { icon: <ArrowUpRight size={12} strokeWidth={1.25} />, color: '#b91c1c', bg: '#fef2f2', label: 'Tăng' },
    'Stable': { icon: <Minus size={12} strokeWidth={1.25} />, color: '#57534e', bg: '#f5f5f4', label: 'Ổn định' },
    'Decreasing': { icon: <ArrowDownRight size={12} strokeWidth={1.25} />, color: '#15803d', bg: '#f0fdf4', label: 'Giảm' }
};

const PorterAnalyzer: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<PorterAnalysisInput>();
    const [analysisData, setAnalysisData] = useState<PorterAnalysisResult | null>(null);
    const [currentInput, setCurrentInput] = useState<PorterAnalysisInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedAnalyses, setSavedAnalyses] = useState<SavedPorterAnalysis[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [competitorInput, setCompetitorInput] = useState('');
    const [userPosition, setUserPosition] = useState<UserPosition>('new_entrant');

    useEffect(() => {
        loadSavedAnalyses();
    }, []);

    const loadSavedAnalyses = async () => {
        const analyses = await PorterService.getAnalyses();
        setSavedAnalyses(analyses);
    };

    const onSubmit = async (data: PorterAnalysisInput) => {
        if (competitorInput.trim()) {
            data.competitors = competitorInput.split(',').map(c => c.trim()).filter(c => c);
        }
        data.userPosition = userPosition;

        setIsGenerating(true);
        setAnalysisData(null);
        setCurrentInput(data);

        try {
            const result = await generatePorterAnalysis(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setAnalysisData(result);
                toast.success('Phân tích Porter hoàn tất!', {
                    icon: '🎯',
                    style: { borderRadius: '12px', background: '#fafaf9', border: '1px solid #e7e5e4' }
                });
            } else {
                toast.error('Không thể phân tích.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi.');
            console.error(error);
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!analysisData || !currentInput) return;

        const newAnalysis: SavedPorterAnalysis = {
            id: Date.now().toString(),
            input: currentInput,
            data: analysisData,
            timestamp: Date.now()
        };

        const success = await PorterService.saveAnalysis(newAnalysis);

        if (success) {
            await loadSavedAnalyses();
            toast.success('Đã lưu phân tích!', { icon: '💾' });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoad = (analysis: SavedPorterAnalysis) => {
        setAnalysisData(analysis.data);
        setCurrentInput(analysis.input);
        reset(analysis.input);
        setCompetitorInput(analysis.input.competitors?.join(', ') || '');
        setUserPosition(analysis.input.userPosition || 'new_entrant');
        setShowHistory(false);
        toast.success('Đã tải phân tích!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await PorterService.deleteAnalysis(id);
        if (success) {
            await loadSavedAnalyses();
            toast.success('Đã xóa!', { icon: '🗑️' });
        }
    };

    const handleNew = () => {
        setAnalysisData(null);
        setCurrentInput(null);
        setCompetitorInput('');
        setUserPosition('new_entrant');
        reset();
        toast.success('Sẵn sàng phân tích mới!', { icon: '✨' });
    };

    const radarData = analysisData?.forces.map(force => ({
        force: force.name.replace('Bargaining Power of ', '').replace('Threat of ', ''),
        score: force.score,
        fullMark: 10
    })) || [];

    const getScoreColor = (score: number) => {
        if (score <= 3) return '#15803d';
        if (score <= 6) return '#a16207';
        if (score <= 8) return '#c2410c';
        return '#b91c1c';
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-center" />

            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Target size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Phân tích Porter
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        Porter&apos;s Precision Analyzer
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Industry Structure &amp; Competitive Strategy Analysis
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${showHistory
                            ? 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                            : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                            }`}
                    >
                        <History size={17} strokeWidth={1.25} /> Lịch sử ({savedAnalyses.length})
                    </button>
                    {analysisData && (
                        <>
                            <button
                                type="button"
                                onClick={handleNew}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                            >
                                <Plus size={17} strokeWidth={1.25} /> Tạo mới
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                            >
                                <Save size={17} strokeWidth={1.25} /> Lưu
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div
                className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5"
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,260px) minmax(0,380px) 1fr' : 'minmax(0,380px) 1fr' }}
            >
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                    Lịch sử phân tích
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedAnalyses.length}</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedAnalyses.map((analysis) => (
                                <div
                                    key={analysis.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleLoad(analysis)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLoad(analysis)}
                                    className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <p className="line-clamp-1 text-sm font-medium text-stone-900">{analysis.input.industry}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(analysis.id); }}
                                            className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            aria-label="Xóa"
                                        >
                                            <Trash2 size={14} strokeWidth={1.25} />
                                        </button>
                                    </div>
                                    <p className="mb-2 text-xs font-normal text-stone-500">{analysis.input.location}</p>
                                    <span
                                        className="inline-block rounded-full border px-2 py-0.5 text-xs font-medium"
                                        style={{
                                            backgroundColor: VERDICT_CONFIG[analysis.data.overall_verdict]?.bg,
                                            color: VERDICT_CONFIG[analysis.data.overall_verdict]?.color,
                                            borderColor: VERDICT_CONFIG[analysis.data.overall_verdict]?.border
                                        }}
                                    >
                                        {analysis.data.overall_verdict}
                                    </span>
                                </div>
                            ))}
                            {savedAnalyses.length === 0 && (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có phân tích nào</div>
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                        <Factory size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                        Thông tin Ngành
                    </h2>
                    <p className="mb-6 text-sm font-normal leading-relaxed text-stone-500">
                        Nhập thông tin để phân tích cạnh tranh
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Ngành kinh doanh *</label>
                            <input
                                {...register('industry', { required: 'Bắt buộc' })}
                                placeholder="VD: Quán Cafe, Thời trang, Fintech..."
                                className={inputClass}
                            />
                            {errors.industry && <p className="mt-1 text-xs text-red-600">{errors.industry.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Phân khúc (Niche)</label>
                            <input
                                {...register('niche')}
                                placeholder="VD: Cao cấp, Bình dân, Premium..."
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Địa điểm *</label>
                            <input
                                {...register('location', { required: 'Bắt buộc' })}
                                placeholder="VD: Quận 1 TP.HCM, Hà Nội..."
                                className={inputClass}
                            />
                            {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Mô hình kinh doanh *</label>
                            <select
                                {...register('businessModel', { required: 'Bắt buộc' })}
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value="">-- Chọn --</option>
                                <option value="B2C">B2C (Bán cho người tiêu dùng)</option>
                                <option value="B2B">B2B (Bán cho doanh nghiệp)</option>
                                <option value="B2B2C">B2B2C (Kết hợp)</option>
                            </select>
                            {errors.businessModel && <p className="mt-1 text-xs text-red-600">{errors.businessModel.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Vị thế của bạn *</label>
                            <select
                                value={userPosition}
                                onChange={(e) => setUserPosition(e.target.value as UserPosition)}
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value="new_entrant">New Entrant (Người mới)</option>
                                <option value="challenger">Challenger (Kẻ thách thức)</option>
                                <option value="niche_player">Niche Player (Chuyên gia ngách)</option>
                                <option value="market_leader">Market Leader (Dẫn đầu)</option>
                            </select>
                            <p className="mt-1 text-xs font-normal text-stone-400">Chiến lược điều chỉnh theo vị thế</p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Đối thủ chính (tùy chọn)</label>
                            <input
                                value={competitorInput}
                                onChange={(e) => setCompetitorInput(e.target.value)}
                                placeholder="VD: Starbucks, Highlands, Phúc Long..."
                                className={inputClass}
                            />
                            <p className="mt-1 text-xs font-normal text-stone-400">Phân cách bằng dấu phẩy</p>
                        </div>

                        <div className="rounded-2xl border border-amber-100 bg-[#FFF9EB]/90 p-4">
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-800">
                                <Lightbulb size={16} strokeWidth={1.25} className="text-amber-700/80 shrink-0" aria-hidden />
                                Gợi ý nhập liệu
                            </h3>
                            <p className="text-xs font-normal leading-relaxed text-stone-600">
                                Càng cụ thể (địa lý, phân khúc, đối thủ), phân tích 5 lực càng sát thực tế ngành của bạn.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" strokeWidth={1.25} />
                                    <span>{thinkingStep || 'Đang phân tích...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} strokeWidth={1.25} />
                                    Phân tích Porter&apos;s Precision
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!analysisData && !isGenerating && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                <Target size={28} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-base font-medium text-stone-700">Porter&apos;s Precision Analysis</p>
                            <p className="mt-1 text-center text-sm font-normal text-stone-500">Nhập thông tin để phân tích ngành</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center">
                            <div className="relative mb-6 h-12 w-12">
                                <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-stone-800" />
                            </div>
                            <p className="text-sm font-medium text-stone-800">{thinkingStep}</p>
                        </div>
                    )}

                    {analysisData && !isGenerating && (
                        <div className="mx-auto max-w-5xl space-y-5">
                            <div
                                className={`${cardClass} flex flex-wrap items-start gap-5 p-5 md:flex-nowrap`}
                                style={{ borderColor: VERDICT_CONFIG[analysisData.overall_verdict]?.border }}
                            >
                                <div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                                    style={{
                                        backgroundColor: VERDICT_CONFIG[analysisData.overall_verdict]?.bg,
                                        borderColor: VERDICT_CONFIG[analysisData.overall_verdict]?.border,
                                        color: VERDICT_CONFIG[analysisData.overall_verdict]?.color
                                    }}
                                >
                                    {VERDICT_CONFIG[analysisData.overall_verdict]?.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-3">
                                        <h2
                                            className="text-lg font-medium tracking-tight"
                                            style={{ color: VERDICT_CONFIG[analysisData.overall_verdict]?.color }}
                                        >
                                            {analysisData.overall_verdict}
                                        </h2>
                                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-700">
                                            Score: {analysisData.total_threat_score}/50
                                        </span>
                                    </div>
                                    <p className="text-sm font-normal leading-relaxed text-stone-600">{analysisData.verdict_description}</p>
                                </div>
                            </div>

                            <div className={`${cardClass} p-5 md:p-6`}>
                                <h3 className="mb-4 text-sm font-medium tracking-tight text-stone-900">
                                    Biểu đồ Radar — Mức độ đe dọa
                                </h3>
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#e7e5e4" />
                                            <PolarAngleAxis dataKey="force" tick={{ fontSize: 11, fill: '#57534e' }} />
                                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fill: '#78716c' }} />
                                            <Radar
                                                name="Threat Score"
                                                dataKey="score"
                                                stroke="#292524"
                                                fill="#292524"
                                                fillOpacity={0.12}
                                                strokeWidth={2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="mt-2 text-center text-xs font-normal text-stone-400">
                                    Vùng phủ càng rộng → Ngành càng khốc liệt
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {analysisData.forces.map((force, idx) => {
                                    const IconComp = FORCE_ICONS[force.name] || Target;
                                    return (
                                        <div key={idx} className={`${cardClass} p-4`}>
                                            <div className="mb-3 flex items-center justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50/80">
                                                        <IconComp size={18} strokeWidth={1.25} className="text-stone-700" />
                                                    </div>
                                                    <p className="text-xs font-medium leading-snug text-stone-800">{force.name_vi}</p>
                                                </div>
                                                <div className="flex shrink-0 items-baseline gap-0.5">
                                                    <span className="text-lg font-semibold tabular-nums" style={{ color: getScoreColor(force.score) }}>
                                                        {force.score}
                                                    </span>
                                                    <span className="text-xs text-stone-400">/10</span>
                                                </div>
                                            </div>

                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <span
                                                    className="rounded-md border px-2 py-0.5 text-xs font-medium"
                                                    style={{
                                                        backgroundColor: force.status === 'Extreme' ? '#fef2f2' :
                                                            force.status === 'High' ? '#fff7ed' :
                                                                force.status === 'Medium' ? '#fefce8' : '#f0fdf4',
                                                        color: force.status === 'Extreme' ? '#b91c1c' :
                                                            force.status === 'High' ? '#c2410c' :
                                                                force.status === 'Medium' ? '#a16207' : '#15803d',
                                                        borderColor: force.status === 'Extreme' ? '#fecaca' :
                                                            force.status === 'High' ? '#fed7aa' :
                                                                force.status === 'Medium' ? '#fde047' : '#bbf7d0'
                                                    }}
                                                >
                                                    {force.status}
                                                </span>
                                                {force.trend && TREND_CONFIG[force.trend] && (
                                                    <span
                                                        className="flex cursor-help items-center gap-1 rounded-md border border-stone-200 px-2 py-0.5 text-xs font-medium"
                                                        style={{
                                                            backgroundColor: TREND_CONFIG[force.trend].bg,
                                                            color: TREND_CONFIG[force.trend].color
                                                        }}
                                                        title={force.trend_reason || `Xu hướng: ${TREND_CONFIG[force.trend].label}`}
                                                    >
                                                        {TREND_CONFIG[force.trend].icon}
                                                        {TREND_CONFIG[force.trend].label}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Yếu tố quyết định</p>
                                                <ul className="space-y-1">
                                                    {force.determinants.slice(0, 3).map((d, i) => (
                                                        <li key={i} className="flex items-start gap-1.5 text-xs font-normal text-stone-600">
                                                            <span className="text-stone-300" aria-hidden>•</span>
                                                            {d}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                                                <p className="mb-1 text-[11px] font-medium text-stone-800">Strategic Action</p>
                                                <p className="text-xs font-normal leading-relaxed text-stone-700">{force.strategic_action}</p>
                                            </div>

                                            {force.data_source && (
                                                <p className="mt-2 text-xs font-normal italic text-stone-400">Nguồn: {force.data_source}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PorterAnalyzer;
