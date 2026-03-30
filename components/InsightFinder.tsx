import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Brain, Sparkles, Loader2, Search, TrendingUp, AlertTriangle, DollarSign, Users, History, Save, Plus, Trash2 } from 'lucide-react';
import { InsightFinderResult, InsightFinderInput } from '../types';
import { generateDeepInsights } from '../services/geminiService';
import { InsightService, SavedInsight } from '../services/insightService';
import toast, { Toaster } from 'react-hot-toast';



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
                    style: { borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }
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
                style: { borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0' }
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
        if (level <= 3) return 'bg-green-100';
        if (level <= 6) return 'bg-yellow-100';
        if (level <= 9) return 'bg-orange-100';
        return 'bg-red-100';
    };

    const getEmotionalText = (level: number) => {
        if (level <= 3) return 'text-green-700';
        if (level <= 6) return 'text-yellow-700';
        if (level <= 9) return 'text-orange-700';
        return 'text-red-700';
    };

    const getEmotionalEmoji = (level: number) => {
        if (level <= 3) return '😐';
        if (level <= 6) return '😤';
        if (level <= 9) return '😫';
        return '😱';
    };

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                        <Brain size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Insight Finder</h1>
                        <p className="text-xs text-slate-400">Consumer Psychology Research</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all text-sm"
                    >
                        <History size={16} /> Lịch sử ({savedInsights.length})
                    </button>
                    {insightData && (
                        <>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all text-sm"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all text-sm"
                            >
                                <Save size={16} /> Lưu Insight
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '300px 380px 1fr' : '380px 1fr' }}>
                {/* HISTORY SIDEBAR */}
                {showHistory && (
                    <div className="bg-white border-r border-slate-100 p-6 overflow-y-auto h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold text-slate-900">Lịch sử Insights</h3>
                            <span className="text-xs text-slate-400">{savedInsights.length} mục</span>
                        </div>
                        <div className="space-y-3">
                            {savedInsights.map((insight) => (
                                <div
                                    key={insight.id}
                                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
                                    onClick={() => handleLoad(insight)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{insight.data.industry}</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(insight.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">Level: {insight.data.emotional_intensity.level}/10 - {insight.data.emotional_intensity.description}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(insight.timestamp).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            ))}
                            {savedInsights.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    Chưa có insight nào được lưu
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* LEFT: Form */}
                <div className="bg-white border-r border-slate-100 p-8 overflow-y-auto h-full">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-slate-700 text-lg">🧠</span>
                            <h2 className="text-base font-semibold text-slate-900">Phân tích Insight</h2>
                        </div>
                        <p className="text-sm text-slate-400 pl-9">Tìm "Friction" – mâu thuẫn tâm lý thực sự</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Required Fields */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Ngành hàng / Sản phẩm *</label>
                            <input
                                {...register('productIndustry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: Gym fitness, Skincare, Real Estate..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                            />
                            {errors.productIndustry && <p className="text-xs text-red-500 mt-1.5">{errors.productIndustry.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience *</label>
                            <textarea
                                {...register('targetAudience', { required: 'Vui lòng nhập target audience' })}
                                placeholder="VD: Nữ 25-35 tuổi, da dầu, hay trang điểm, sống tại thành thị..."
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all resize-none"
                            />
                            {errors.targetAudience && <p className="text-xs text-red-500 mt-1.5">{errors.targetAudience.message}</p>}
                        </div>

                        {/* NEW: Context Layer Fields */}
                        <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">📍 Context Layer (Tùy chọn)</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Specific Segment</label>
                                    <input
                                        {...register('specificSegment')}
                                        placeholder="VD: Gen Z Students, Office Workers, New Moms..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Bối cảnh sử dụng (Usage Occasion)</label>
                                    <input
                                        {...register('usageOccasion')}
                                        placeholder="VD: Khi đi chơi với bạn bè, Đêm khuya một mình..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Thói quen / Đối thủ hiện tại</label>
                                    <input
                                        {...register('currentHabitCompetitor')}
                                        placeholder="VD: Đang dùng The Ordinary, Highlands Coffee..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang phân tích...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Tìm Friction & Insight
                                </>
                            )}
                        </button>
                    </form>

                    {/* Framework Info - Updated */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                        <h3 className="text-sm font-medium text-purple-800 mb-2">🎯 3-Hit Combo Framework:</h3>
                        <ul className="text-xs text-purple-700 space-y-1">
                            <li>• <strong>The Truth:</strong> Họ nói gì & đang làm gì</li>
                            <li>• <strong>The Tension:</strong> "Muốn X, NHƯNG sợ Y"</li>
                            <li>• <strong>The Discovery:</strong> Động lực thầm kín</li>
                        </ul>
                    </div>
                </div>

                {/* RIGHT: Results */}
                <div className="p-8 overflow-auto bg-slate-50 h-full">
                    {!insightData && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 rounded-lg bg-white border border-slate-100 flex items-center justify-center mb-4">
                                <Search size={28} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-base font-medium text-slate-600">Consumer Insight Research</p>
                            <p className="text-sm text-slate-400 mt-1">Nhập ngành hàng để tìm "Friction"</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-12 h-12 mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-900 animate-spin"></div>
                            </div>
                            <p className="text-sm font-medium text-slate-700 mb-1">{thinkingStep}</p>
                            <p className="text-xs text-slate-400">Đang tìm "Friction" và mâu thuẫn tâm lý...</p>
                        </div>
                    )}

                    {/* VALIDATION ERROR / CLARIFICATION MESSAGE */}
                    {insightData && insightData.validationStatus === 'NEEDS_CLARIFICATION' && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="max-w-md bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                                <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle size={28} className="text-amber-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-amber-800 mb-2">Cần thêm thông tin</h3>
                                <p className="text-sm text-amber-700">{insightData.clarificationMessage}</p>
                            </div>
                        </div>
                    )}

                    {insightData && !isGenerating && insightData.validationStatus !== 'NEEDS_CLARIFICATION' && (
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-2xl font-semibold text-slate-900 mb-1">{insightData.industry}</h2>
                            <p className="text-sm text-slate-400 mb-6">Consumer Psychology Analysis</p>

                            {/* === NEW: 3-HIT COMBO SECTION === */}
                            {insightData.threeHitCombo && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        🎯 3-Hit Combo Insight
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        {/* Layer 1: The Truth */}
                                        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-lg">🔍</span>
                                                <h4 className="text-sm font-bold text-slate-800">THE TRUTH</h4>
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Sự thật hiển nhiên</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">What They Say</p>
                                                    <p className="text-sm text-slate-700 italic">"{insightData.threeHitCombo.truth.whatTheySay}"</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Current Behavior</p>
                                                    <p className="text-sm text-slate-700">{insightData.threeHitCombo.truth.currentBehavior}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Layer 2: The Tension - HIGHLIGHTED */}
                                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow ring-2 ring-purple-400 ring-offset-2">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-lg">⚡</span>
                                                <h4 className="text-sm font-bold">THE TENSION</h4>
                                                <span className="text-xs px-2 py-0.5 bg-white/20 rounded">Mâu thuẫn tâm lý</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="bg-white/10 rounded-lg p-3">
                                                    <p className="text-sm font-medium text-green-200">"Tôi muốn {insightData.threeHitCombo.tension.wantX}"</p>
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <span className="text-xs font-bold text-amber-300 uppercase">NHƯNG</span>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-3">
                                                    <p className="text-sm font-medium text-red-200">"Tôi sợ {insightData.threeHitCombo.tension.butAfraid}"</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-white/20">
                                                <p className="text-xs font-medium text-purple-200 uppercase mb-1">Full Insight</p>
                                                <p className="text-sm font-medium">{insightData.threeHitCombo.tension.insight}</p>
                                            </div>
                                        </div>

                                        {/* Layer 3: The Discovery */}
                                        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-lg">💡</span>
                                                <h4 className="text-sm font-bold text-slate-800">THE DISCOVERY</h4>
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Deep Insight</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Unspoken Motivation</p>
                                                    <p className="text-sm text-slate-700">{insightData.threeHitCombo.discovery.unspokenMotivation}</p>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-3 border-l-4 border-indigo-400">
                                                    <p className="text-xs text-slate-500 line-through">{insightData.threeHitCombo.discovery.notAbout}</p>
                                                    <p className="text-sm font-medium text-indigo-700 mt-1">→ {insightData.threeHitCombo.discovery.itsAbout}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === NEW: CREATIVE IMPLICATIONS === */}
                            {insightData.creativeImplications && (
                                <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
                                    <h3 className="text-base font-bold text-amber-800 mb-4 flex items-center gap-2">
                                        💡 Creative Implications
                                        <span className="text-xs font-normal text-amber-600">"So What?" - Chiến lược sáng tạo</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg p-4 border border-amber-100">
                                            <p className="text-xs font-medium text-amber-600 uppercase mb-2">Core Message</p>
                                            <p className="text-sm font-semibold text-slate-800">{insightData.creativeImplications.coreMessage}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-amber-100">
                                            <p className="text-xs font-medium text-amber-600 uppercase mb-2">Visual Key</p>
                                            <p className="text-sm text-slate-700 italic">"{insightData.creativeImplications.visualKey}"</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-amber-100">
                                            <p className="text-xs font-medium text-amber-600 uppercase mb-2">Trigger Words</p>
                                            <div className="flex flex-wrap gap-2">
                                                {insightData.creativeImplications.triggerWords?.map((word, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Emotional Intensity Scale */}
                            <div className="bg-white rounded-lg p-6 border border-slate-100 mb-6">
                                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-slate-600" />
                                    Emotional Intensity Scale
                                </h3>
                                <div className="relative">
                                    <div className={`w-full h-10 ${getEmotionalBg(insightData.emotional_intensity.level)} rounded-lg flex items-center justify-between px-4 ${getEmotionalText(insightData.emotional_intensity.level)} font-medium text-sm`}>
                                        <span>😐 Mild</span>
                                        <span>😤 Frustrated</span>
                                        <span>😫 Distress</span>
                                        <span>😱 Desperate</span>
                                    </div>
                                    <div className="absolute top-1/2 -translate-y-1/2 bg-white border-2 border-slate-200 rounded-full w-10 h-10 flex items-center justify-center text-xl shadow" style={{ left: `${(insightData.emotional_intensity.level - 1) * 10}%` }}>
                                        {getEmotionalEmoji(insightData.emotional_intensity.level)}
                                    </div>
                                </div>
                                <p className="text-center mt-4 text-sm font-medium text-slate-700">
                                    Level {insightData.emotional_intensity.level}/10 - {insightData.emotional_intensity.description}
                                </p>
                            </div>

                            {/* PAIN POINTS - FLIP CARDS */}
                            <div className="mb-6">
                                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-slate-600" />
                                    Iceberg Pain Points
                                    <span className="text-xs text-slate-400 font-normal">(Hover to flip)</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {insightData.deep_insights.pain_points.map((pain, idx) => (
                                        <div key={idx} className="flip-card h-44">
                                            <div className="flip-card-inner">
                                                {/* Front Side */}
                                                <div className={`flip-card-front ${pain.level === 'Surface' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'} border-2 rounded-lg p-5 flex flex-col justify-between`}>
                                                    <div>
                                                        <div className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium mb-3 ${pain.level === 'Surface' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                                                            {pain.level === 'Surface' ? '🌊 Surface Pain' : '🧊 Deep Insight'}
                                                        </div>
                                                        <p className={`text-sm font-medium ${pain.level === 'Surface' ? 'text-blue-900' : 'text-purple-900'}`}>
                                                            {pain.level === 'Surface' ? pain.content : 'Tâm lý thầm kín →'}
                                                        </p>
                                                    </div>
                                                    {pain.level === 'Deep' && (
                                                        <p className="text-xs text-slate-400 italic">Hover to reveal deep insight</p>
                                                    )}
                                                </div>

                                                {/* Back Side - For Deep cards */}
                                                <div className={`flip-card-back ${pain.level === 'Deep' ? 'bg-purple-700' : 'bg-blue-50'} border-2 ${pain.level === 'Deep' ? 'border-purple-600' : 'border-blue-100'} rounded-lg p-5 flex flex-col justify-center ${pain.level === 'Deep' ? 'text-white' : 'text-blue-900'}`}>
                                                    <p className="text-sm font-medium leading-relaxed">{pain.content}</p>
                                                    {pain.level === 'Deep' && (
                                                        <p className="text-xs opacity-75 mt-3 italic">💡 Insight chỉ họ nói khi ẩn danh</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* JTBD Framework */}
                            <div className="mb-6">
                                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Users size={18} className="text-slate-600" />
                                    Jobs-To-Be-Done Framework
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white border border-slate-100 rounded-lg p-5">
                                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-3">
                                            ⚙️
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-900 mb-2">Functional Job</h4>
                                        <p className="text-sm text-slate-600">{insightData.deep_insights.motivations_jtbd.functional}</p>
                                    </div>

                                    <div className="bg-white border border-slate-100 rounded-lg p-5">
                                        <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center mb-3">
                                            ❤️
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-900 mb-2">Emotional Job</h4>
                                        <p className="text-sm text-slate-600">{insightData.deep_insights.motivations_jtbd.emotional}</p>
                                    </div>

                                    <div className="bg-white border border-slate-100 rounded-lg p-5">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3">
                                            👥
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-900 mb-2">Social Job</h4>
                                        <p className="text-sm text-slate-600">{insightData.deep_insights.motivations_jtbd.social}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Barriers */}
                            <div className="mb-6">
                                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-slate-600" />
                                    Barriers & Frictions
                                </h3>
                                <div className="space-y-3">
                                    {insightData.deep_insights.barriers.map((barrier, idx) => (
                                        <div key={idx} className="bg-white border-l-4 border-red-400 rounded-r-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">
                                                    {barrier.type === 'Trust Barrier' ? '🔒' : barrier.type === 'Effort Barrier' ? '⏱️' : '💰'}
                                                </span>
                                                <div>
                                                    <h4 className="text-sm font-medium text-slate-900 mb-1">{barrier.type}</h4>
                                                    <p className="text-sm text-slate-600">{barrier.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Buying Behavior */}
                            <div className="bg-white rounded-lg p-6 border border-slate-100">
                                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <DollarSign size={18} className="text-slate-600" />
                                    Buying Behavior Journey
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Search Channel</h4>
                                        <p className="text-sm text-slate-800 font-medium">{insightData.deep_insights.buying_behavior.search_channel}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Decision Driver</h4>
                                        <p className="text-sm text-slate-800 font-medium">{insightData.deep_insights.buying_behavior.decision_driver}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Deal Breaker</h4>
                                        <p className="text-sm text-slate-800 font-medium">{insightData.deep_insights.buying_behavior.deal_breaker}</p>
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
