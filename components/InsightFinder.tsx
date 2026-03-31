import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Brain, Sparkles, Loader2, Search, TrendingUp, AlertTriangle, DollarSign, Users, History, Save, Plus, Trash2,
    MapPin, Lightbulb, Zap, Target, Clock
} from 'lucide-react';
import { InsightFinderResult, InsightFinderInput } from '../types';
import { generateDeepInsights } from '../services/geminiService';
import { InsightService, SavedInsight } from '../services/insightService';
import toast, { Toaster } from 'react-hot-toast';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const textareaClass =
    `${inputClass} resize-none`;
const InsightFinder: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<InsightFinderInput>();
    const [insightData, setInsightData] = useState<InsightFinderResult | null>(null);
    const [currentInput, setCurrentInput] = useState<InsightFinderInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('insight_finder_history');
        if (saved) {
            setSavedInsights(JSON.parse(saved));
        }
    }, []);

    const onSubmit = async (data: InsightFinderInput) => {
        setIsGenerating(true);
        setInsightData(null);
        setCurrentInput(data);

        try {
            const result = await generateDeepInsights(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setInsightData(result);
                toast.success('Deep Insights phân tích xong!', {
                    icon: '🧠',
                    style: { borderRadius: '12px', background: '#fafaf9', border: '1px solid #e7e5e4' }
                });
            } else {
                toast.error('Không thể phân tích insight.');
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
        if (!insightData || !currentInput) return;

        const newInsight: SavedInsight = {
            id: Date.now().toString(),
            input: currentInput,
            data: insightData,
            timestamp: Date.now()
        };

        const success = await InsightService.saveInsight(newInsight);

        if (success) {
            const insights = await InsightService.getInsights();
            setSavedInsights(insights);
            toast.success('Đã lưu Insight!', {
                icon: '💾',
                style: { borderRadius: '12px', background: '#fafaf9', border: '1px solid #e7e5e4' }
            });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoad = (insight: SavedInsight) => {
        setInsightData(insight.data);
        setCurrentInput(insight.input);
        reset(insight.input);
        setShowHistory(false);
        toast.success('Đã tải Insight!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await InsightService.deleteInsight(id);

        if (success) {
            const insights = await InsightService.getInsights();
            setSavedInsights(insights);
            toast.success('Đã xóa!', { icon: '🗑️' });
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleNew = () => {
        setInsightData(null);
        setCurrentInput(null);
        reset();
        toast.success('Sẵn sàng phân tích mới!', { icon: '✨' });
    };

    const getEmotionalBg = (level: number) => {
        if (level <= 3) return 'bg-emerald-50 border border-emerald-100';
        if (level <= 6) return 'bg-amber-50 border border-amber-100';
        if (level <= 9) return 'bg-orange-50 border border-orange-100';
        return 'bg-rose-50 border border-rose-100';
    };

    const getEmotionalText = (level: number) => {
        if (level <= 3) return 'text-emerald-800';
        if (level <= 6) return 'text-amber-900';
        if (level <= 9) return 'text-orange-900';
        return 'text-rose-900';
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-center" />

            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Brain size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Consumer Psychology
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        Insight Finder
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Consumer Psychology Research
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
                        <History size={17} strokeWidth={1.25} /> Lịch sử ({savedInsights.length})
                    </button>
                    {insightData && (
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
                                <Save size={17} strokeWidth={1.25} /> Lưu Insight
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div
                className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5"
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,400px) 1fr' : 'minmax(0,400px) 1fr' }}
            >
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                    Lịch sử Insights
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedInsights.length} mục</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedInsights.map((insight) => (
                                <div
                                    key={insight.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleLoad(insight)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLoad(insight)}
                                    className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <p className="line-clamp-1 text-sm font-medium text-stone-900">{insight.data.industry}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(insight.id);
                                            }}
                                            className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            aria-label="Xóa"
                                        >
                                            <Trash2 size={14} strokeWidth={1.25} />
                                        </button>
                                    </div>
                                    <p className="mb-1 text-xs font-normal text-stone-500">
                                        Level: {insight.data.emotional_intensity.level}/10 — {insight.data.emotional_intensity.description}
                                    </p>
                                    <p className="text-xs font-normal text-stone-400">
                                        {new Date(insight.timestamp).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            ))}
                            {savedInsights.length === 0 && (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có insight nào được lưu</div>
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                        <Search size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                        Phân tích Insight
                    </h2>
                    <p className="mb-6 text-sm font-normal leading-relaxed text-stone-500">
                        Tìm &ldquo;Friction&rdquo; — mâu thuẫn tâm lý thực sự
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Ngành hàng / Sản phẩm *</label>
                            <input
                                {...register('productIndustry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: Gym fitness, Skincare, Real Estate..."
                                className={inputClass}
                            />
                            {errors.productIndustry && <p className="mt-1 text-xs text-red-600">{errors.productIndustry.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Target Audience *</label>
                            <textarea
                                {...register('targetAudience', { required: 'Vui lòng nhập target audience' })}
                                placeholder="VD: Nữ 25-35 tuổi, da dầu, hay trang điểm, sống tại thành thị..."
                                rows={2}
                                className={textareaClass}
                            />
                            {errors.targetAudience && <p className="mt-1 text-xs text-red-600">{errors.targetAudience.message}</p>}
                        </div>

                        <div className="border-t border-stone-100 pt-5">
                            <p className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                                <MapPin size={14} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                Context layer (tùy chọn)
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Specific Segment</label>
                                    <input
                                        {...register('specificSegment')}
                                        placeholder="VD: Gen Z Students, Office Workers, New Moms..."
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Bối cảnh sử dụng (Usage Occasion)</label>
                                    <input
                                        {...register('usageOccasion')}
                                        placeholder="VD: Khi đi chơi với bạn bè, Đêm khuya một mình..."
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Thói quen / Đối thủ hiện tại</label>
                                    <input
                                        {...register('currentHabitCompetitor')}
                                        placeholder="VD: Đang dùng The Ordinary, Highlands Coffee..."
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" strokeWidth={1.25} />
                                    <span>{thinkingStep || 'Đang phân tích...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} strokeWidth={1.25} />
                                    Tìm Friction &amp; Insight
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-950">
                            <Lightbulb size={16} strokeWidth={1.25} className="text-amber-700/80 shrink-0" aria-hidden />
                            3-Hit Combo Framework
                        </h3>
                        <ul className="space-y-1 text-xs font-normal leading-relaxed text-amber-900/85">
                            <li><span className="font-medium text-amber-950">The Truth:</span> Họ nói gì &amp; đang làm gì</li>
                            <li><span className="font-medium text-amber-950">The Tension:</span> &ldquo;Muốn X, NHƯNG sợ Y&rdquo;</li>
                            <li><span className="font-medium text-amber-950">The Discovery:</span> Động lực thầm kín</li>
                        </ul>
                    </div>
                </div>

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!insightData && !isGenerating && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                <Search size={28} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-base font-medium text-stone-700">Consumer Insight Research</p>
                            <p className="mt-1 text-sm font-normal text-stone-500">Nhập ngành hàng để tìm &ldquo;Friction&rdquo;</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center">
                            <div className="relative mb-6 h-12 w-12">
                                <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-stone-800" />
                            </div>
                            <p className="mb-1 text-sm font-medium text-stone-800">{thinkingStep}</p>
                            <p className="text-xs font-normal text-stone-500">Đang tìm &ldquo;Friction&rdquo; và mâu thuẫn tâm lý...</p>
                        </div>
                    )}

                    {insightData && insightData.validationStatus === 'NEEDS_CLARIFICATION' && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center">
                            <div className="max-w-md rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100/80">
                                    <AlertTriangle size={28} strokeWidth={1.25} className="text-amber-700" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium tracking-tight text-amber-950">Cần thêm thông tin</h3>
                                <p className="text-sm font-normal leading-relaxed text-amber-900/90">{insightData.clarificationMessage}</p>
                            </div>
                        </div>
                    )}

                    {insightData && !isGenerating && insightData.validationStatus !== 'NEEDS_CLARIFICATION' && (
                        <div className="mx-auto max-w-6xl">
                            <h2 className="mb-1 font-sans text-2xl font-medium tracking-tight text-stone-900">{insightData.industry}</h2>
                            <p className="mb-6 text-sm font-normal text-stone-500">Consumer Psychology Analysis</p>

                            {insightData.threeHitCombo && (
                                <div className="mb-8">
                                    <h3 className="mb-4 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                        <Target size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                        3-Hit Combo Insight
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                        <div className={`${cardClass} p-5`}>
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <Search size={16} strokeWidth={1.25} className="text-stone-500" />
                                                <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-800">The Truth</h4>
                                                <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-600">Sự thật hiển nhiên</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">What They Say</p>
                                                    <p className="text-sm font-normal italic leading-relaxed text-stone-700">&ldquo;{insightData.threeHitCombo.truth.whatTheySay}&rdquo;</p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Current Behavior</p>
                                                    <p className="text-sm font-normal text-stone-800">{insightData.threeHitCombo.truth.currentBehavior}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-stone-900 bg-stone-900 p-5 text-stone-50 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-stone-200">
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <Zap size={16} strokeWidth={1.25} className="text-amber-200/90" />
                                                <h4 className="text-xs font-semibold uppercase tracking-[0.08em]">The Tension</h4>
                                                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-medium text-stone-200">Mâu thuẫn tâm lý</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                                    <p className="text-sm font-medium text-emerald-100/95">&ldquo;Tôi muốn {insightData.threeHitCombo.tension.wantX}&rdquo;</p>
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-200/90">Nhưng</span>
                                                </div>
                                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                                    <p className="text-sm font-medium text-rose-100/95">&ldquo;Tôi sợ {insightData.threeHitCombo.tension.butAfraid}&rdquo;</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 border-t border-white/15 pt-3">
                                                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-400">Full Insight</p>
                                                <p className="text-sm font-normal leading-relaxed text-stone-100">{insightData.threeHitCombo.tension.insight}</p>
                                            </div>
                                        </div>

                                        <div className={`${cardClass} p-5`}>
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <Lightbulb size={16} strokeWidth={1.25} className="text-stone-500" />
                                                <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-800">The Discovery</h4>
                                                <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-600">Deep Insight</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Unspoken Motivation</p>
                                                    <p className="text-sm font-normal text-stone-800">{insightData.threeHitCombo.discovery.unspokenMotivation}</p>
                                                </div>
                                                <div className="rounded-lg border border-stone-200 border-l-[3px] border-l-stone-800 bg-stone-50/80 p-3">
                                                    <p className="text-xs font-normal text-stone-400 line-through">{insightData.threeHitCombo.discovery.notAbout}</p>
                                                    <p className="mt-1 text-sm font-medium text-stone-900">→ {insightData.threeHitCombo.discovery.itsAbout}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {insightData.creativeImplications && (
                                <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50/60 p-6">
                                    <h3 className="mb-4 flex flex-wrap items-center gap-2 text-base font-medium tracking-tight text-amber-950">
                                        <Sparkles size={18} strokeWidth={1.25} className="text-amber-700/80" />
                                        Creative Implications
                                        <span className="text-xs font-normal text-amber-800/80">&ldquo;So What?&rdquo; — Chiến lược sáng tạo</span>
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className={`${cardClass} p-4`}>
                                            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Core Message</p>
                                            <p className="text-sm font-medium text-stone-900">{insightData.creativeImplications.coreMessage}</p>
                                        </div>
                                        <div className={`${cardClass} p-4`}>
                                            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Visual Key</p>
                                            <p className="text-sm font-normal italic text-stone-700">&ldquo;{insightData.creativeImplications.visualKey}&rdquo;</p>
                                        </div>
                                        <div className={`${cardClass} p-4`}>
                                            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Trigger Words</p>
                                            <div className="flex flex-wrap gap-2">
                                                {insightData.creativeImplications.triggerWords?.map((word, idx) => (
                                                    <span key={idx} className="rounded-full border border-stone-200 bg-stone-900 px-3 py-1 text-xs font-medium text-white">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`${cardClass} mb-6 p-6`}>
                                <h3 className="mb-4 flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                                    <TrendingUp size={18} strokeWidth={1.25} className="text-stone-500" />
                                    Emotional Intensity Scale
                                </h3>
                                <div className="relative">
                                    <div className={`flex h-10 w-full items-center justify-between rounded-xl px-4 text-sm font-medium ${getEmotionalBg(insightData.emotional_intensity.level)} ${getEmotionalText(insightData.emotional_intensity.level)}`}>
                                        <span>Mild</span>
                                        <span>Frustrated</span>
                                        <span>Distress</span>
                                        <span>Desperate</span>
                                    </div>
                                    <div
                                        className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-stone-200 bg-white text-xs font-bold text-stone-700 shadow-sm"
                                        style={{ left: `calc(${(insightData.emotional_intensity.level - 1) * 10}% + 0.25rem)` }}
                                    >
                                        {insightData.emotional_intensity.level}
                                    </div>
                                </div>
                                <p className="mt-4 text-center text-sm font-medium text-stone-800">
                                    Level {insightData.emotional_intensity.level}/10 — {insightData.emotional_intensity.description}
                                </p>
                            </div>

                            <div className="mb-6">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                                    <AlertTriangle size={18} strokeWidth={1.25} className="text-stone-500" />
                                    Iceberg Pain Points
                                    <span className="text-xs font-normal text-stone-400">(Hover để lật)</span>
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {insightData.deep_insights.pain_points.map((pain, idx) => (
                                        <div key={idx} className="flip-card h-44">
                                            <div className="flip-card-inner">
                                                <div className={`flip-card-front flex flex-col justify-between rounded-xl border-2 p-5 ${pain.level === 'Surface'
                                                    ? 'border-sky-100 bg-sky-50/40'
                                                    : 'border-stone-200 bg-stone-50/80'
                                                    }`}>
                                                    <div>
                                                        <div className={`mb-3 inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${pain.level === 'Surface'
                                                            ? 'border-sky-200 bg-white text-sky-900'
                                                            : 'border-stone-300 bg-stone-900 text-white'
                                                            }`}>
                                                            {pain.level === 'Surface' ? 'Surface Pain' : 'Deep Insight'}
                                                        </div>
                                                        <p className={`text-sm font-medium ${pain.level === 'Surface' ? 'text-sky-950' : 'text-stone-800'}`}>
                                                            {pain.level === 'Surface' ? pain.content : 'Tâm lý thầm kín →'}
                                                        </p>
                                                    </div>
                                                    {pain.level === 'Deep' && (
                                                        <p className="text-xs font-normal italic text-stone-400">Hover để xem insight sâu</p>
                                                    )}
                                                </div>

                                                <div className={`flip-card-back flex flex-col justify-center rounded-xl border-2 p-5 ${pain.level === 'Deep'
                                                    ? 'border-stone-800 bg-stone-900 text-stone-50'
                                                    : 'border-sky-100 bg-sky-50/40 text-sky-950'
                                                    }`}>
                                                    <p className="text-sm font-normal leading-relaxed">{pain.content}</p>
                                                    {pain.level === 'Deep' && (
                                                        <p className="mt-3 text-xs font-normal italic text-stone-400">Insight thường chỉ lộ khi ẩn danh</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                                    <Users size={18} strokeWidth={1.25} className="text-stone-500" />
                                    Jobs-To-Be-Done Framework
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className={`${cardClass} p-5`}>
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50/80 text-stone-700">
                                            <Target size={18} strokeWidth={1.25} />
                                        </div>
                                        <h4 className="mb-2 text-sm font-medium text-stone-900">Functional Job</h4>
                                        <p className="text-sm font-normal text-stone-600">{insightData.deep_insights.motivations_jtbd.functional}</p>
                                    </div>

                                    <div className={`${cardClass} p-5`}>
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50/80 text-stone-700">
                                            <Sparkles size={18} strokeWidth={1.25} />
                                        </div>
                                        <h4 className="mb-2 text-sm font-medium text-stone-900">Emotional Job</h4>
                                        <p className="text-sm font-normal text-stone-600">{insightData.deep_insights.motivations_jtbd.emotional}</p>
                                    </div>

                                    <div className={`${cardClass} p-5`}>
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50/80 text-stone-700">
                                            <Users size={18} strokeWidth={1.25} />
                                        </div>
                                        <h4 className="mb-2 text-sm font-medium text-stone-900">Social Job</h4>
                                        <p className="text-sm font-normal text-stone-600">{insightData.deep_insights.motivations_jtbd.social}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                                    <AlertTriangle size={18} strokeWidth={1.25} className="text-stone-500" />
                                    Barriers &amp; Frictions
                                </h3>
                                <div className="space-y-3">
                                    {insightData.deep_insights.barriers.map((barrier, idx) => (
                                        <div key={idx} className={`${cardClass} border-l-[3px] border-l-rose-300/90 p-4`}>
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-600">
                                                    {barrier.type === 'Trust Barrier' ? <AlertTriangle size={16} strokeWidth={1.25} /> : barrier.type === 'Effort Barrier' ? <Clock size={16} strokeWidth={1.25} /> : <DollarSign size={16} strokeWidth={1.25} />}
                                                </div>
                                                <div>
                                                    <h4 className="mb-1 text-sm font-medium text-stone-900">{barrier.type}</h4>
                                                    <p className="text-sm font-normal text-stone-600">{barrier.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`${cardClass} p-6`}>
                                <h3 className="mb-4 flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                                    <DollarSign size={18} strokeWidth={1.25} className="text-stone-500" />
                                    Buying Behavior Journey
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <h4 className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Search Channel</h4>
                                        <p className="text-sm font-medium text-stone-900">{insightData.deep_insights.buying_behavior.search_channel}</p>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Decision Driver</h4>
                                        <p className="text-sm font-medium text-stone-900">{insightData.deep_insights.buying_behavior.decision_driver}</p>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">Deal Breaker</h4>
                                        <p className="text-sm font-medium text-stone-900">{insightData.deep_insights.buying_behavior.deal_breaker}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Flip Card CSS */}
            <style>{`
                .flip-card {
                    perspective: 1000px;
                }
                .flip-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.6s;
                    transform-style: preserve-3d;
                }
                .flip-card:hover .flip-card-inner {
                    transform: rotateY(180deg);
                }
                .flip-card-front, .flip-card-back {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                }
                .flip-card-back {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    );
};

export default InsightFinder;
