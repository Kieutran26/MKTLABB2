import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Target, Sparkles, Loader2, Swords, DoorOpen, Users, Truck, Shuffle,
    History, Save, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Minus, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { PorterAnalysisInput, PorterAnalysisResult, PorterForce, IndustryVerdict, UserPosition } from '../types';
import { generatePorterAnalysis } from '../services/geminiService';
import { PorterService, SavedPorterAnalysis } from '../services/porterService';
import toast, { Toaster } from 'react-hot-toast';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

// Force Configuration
const FORCE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
    'Competitive Rivalry': { icon: <Swords size={18} />, color: '#ef4444' },
    'Threat of New Entrants': { icon: <DoorOpen size={18} />, color: '#f97316' },
    'Bargaining Power of Buyers': { icon: <Users size={18} />, color: '#eab308' },
    'Bargaining Power of Suppliers': { icon: <Truck size={18} />, color: '#22c55e' },
    'Threat of Substitutes': { icon: <Shuffle size={18} />, color: '#6366f1' }
};

// Verdict Colors
const VERDICT_CONFIG: Record<IndustryVerdict, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    'Blue Ocean': { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', icon: <TrendingUp size={20} /> },
    'Attractive': { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <TrendingUp size={20} /> },
    'Moderate': { color: '#ca8a04', bg: '#fefce8', border: '#fef08a', icon: <AlertTriangle size={20} /> },
    'Unattractive': { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: <TrendingDown size={20} /> },
    'Red Ocean': { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <TrendingDown size={20} /> }
};

// Trend Indicator Config
const TREND_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    'Increasing': { icon: <ArrowUpRight size={12} />, color: '#dc2626', bg: '#fef2f2', label: 'Tăng' },
    'Stable': { icon: <Minus size={12} />, color: '#6b7280', bg: '#f9fafb', label: 'Ổn định' },
    'Decreasing': { icon: <ArrowDownRight size={12} />, color: '#16a34a', bg: '#f0fdf4', label: 'Giảm' }
};

const PorterAnalyzer: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PorterAnalysisInput>();
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
                    style: { borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb' }
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
        if (score <= 3) return '#16a34a';
        if (score <= 6) return '#ca8a04';
        if (score <= 8) return '#ea580c';
        return '#dc2626';
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            <Toaster position="top-center" />

            {/* Header - Clean & Minimal */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Target size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">Porter's Precision Analyzer</h1>
                        <p className="text-xs text-gray-500">Strategic Competition Engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors">
                        <History size={14} /> Lịch sử ({savedAnalyses.length})
                    </button>
                    {analysisData && (
                        <>
                            <button onClick={handleNew}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors">
                                <Plus size={14} /> Tạo mới
                            </button>
                            <button onClick={handleSave}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                                <Save size={14} /> Lưu
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '240px 320px 1fr' : '320px 1fr' }}>
                {/* History Sidebar */}
                {showHistory && (
                    <div className="bg-white border-r border-gray-200 p-4 overflow-y-auto">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lịch sử phân tích</h3>
                        <div className="space-y-2">
                            {savedAnalyses.map((analysis) => (
                                <div key={analysis.id}
                                    className="p-3 rounded-lg border border-gray-200 cursor-pointer group hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                                    onClick={() => handleLoad(analysis)}>
                                    <div className="flex items-start justify-between mb-1">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                            {analysis.input.industry}
                                        </p>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(analysis.id); }}
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">{analysis.input.location}</p>
                                    <div className="mt-2">
                                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                                            style={{
                                                backgroundColor: VERDICT_CONFIG[analysis.data.overall_verdict]?.bg,
                                                color: VERDICT_CONFIG[analysis.data.overall_verdict]?.color,
                                                border: `1px solid ${VERDICT_CONFIG[analysis.data.overall_verdict]?.border}`
                                            }}>
                                            {analysis.data.overall_verdict}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {savedAnalyses.length === 0 && (
                                <p className="text-center text-sm text-gray-400 py-8">
                                    Chưa có phân tích nào
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Form Panel */}
                <div className="bg-white border-r border-gray-200 p-5 overflow-y-auto">
                    <div className="mb-5">
                        <h2 className="text-sm font-semibold text-gray-900 mb-1">Thông tin Ngành</h2>
                        <p className="text-xs text-gray-500">Nhập thông tin để phân tích cạnh tranh</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Industry */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Ngành kinh doanh *
                            </label>
                            <input
                                {...register('industry', { required: 'Bắt buộc' })}
                                placeholder="VD: Quán Cafe, Thời trang, Fintech..."
                                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            />
                            {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry.message}</p>}
                        </div>

                        {/* Niche */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Phân khúc (Niche)
                            </label>
                            <input
                                {...register('niche')}
                                placeholder="VD: Cao cấp, Bình dân, Premium..."
                                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Địa điểm *
                            </label>
                            <input
                                {...register('location', { required: 'Bắt buộc' })}
                                placeholder="VD: Quận 1 TP.HCM, Hà Nội..."
                                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            />
                            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
                        </div>

                        {/* Business Model */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Mô hình kinh doanh *
                            </label>
                            <select
                                {...register('businessModel', { required: 'Bắt buộc' })}
                                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer bg-white">
                                <option value="">-- Chọn --</option>
                                <option value="B2C">B2C (Bán cho người tiêu dùng)</option>
                                <option value="B2B">B2B (Bán cho doanh nghiệp)</option>
                                <option value="B2B2C">B2B2C (Kết hợp)</option>
                            </select>
                            {errors.businessModel && <p className="text-xs text-red-500 mt-1">{errors.businessModel.message}</p>}
                        </div>

                        {/* User Position */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Vị thế của bạn *
                            </label>
                            <select
                                value={userPosition}
                                onChange={(e) => setUserPosition(e.target.value as UserPosition)}
                                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer bg-white">
                                <option value="new_entrant">🚀 New Entrant (Người mới)</option>
                                <option value="challenger">⚔️ Challenger (Kẻ thách thức)</option>
                                <option value="niche_player">🎯 Niche Player (Chuyên gia ngách)</option>
                                <option value="market_leader">👑 Market Leader (Dẫn đầu)</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Chiến lược điều chỉnh theo vị thế</p>
                        </div>

                        {/* Competitors */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Đối thủ chính (tùy chọn)
                            </label>
                            <input
                                value={competitorInput}
                                onChange={(e) => setCompetitorInput(e.target.value)}
                                placeholder="VD: Starbucks, Highlands, Phúc Long..."
                                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-400 mt-1">Phân cách bằng dấu phẩy</p>
                        </div>

                        <button type="submit" disabled={isGenerating}
                            className="w-full py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2">
                            {isGenerating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang phân tích...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    <span className="text-sm">Phân tích Porter's 5 Forces</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results Area */}
                <div className="bg-gray-50 p-6 overflow-auto">
                    {!analysisData && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-4">
                                <Target size={28} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Porter's Five Forces</p>
                            <p className="text-xs text-gray-400 mt-1">Nhập thông tin để phân tích ngành</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-12 h-12 mb-4">
                                <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 animate-spin"></div>
                            </div>
                            <p className="text-sm text-gray-600">{thinkingStep}</p>
                        </div>
                    )}

                    {analysisData && !isGenerating && (
                        <div className="max-w-5xl mx-auto space-y-5">
                            {/* Verdict Banner */}
                            <div className="p-5 rounded-xl bg-white border flex items-center gap-5"
                                style={{ borderColor: VERDICT_CONFIG[analysisData.overall_verdict]?.border }}>
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                                    style={{
                                        backgroundColor: VERDICT_CONFIG[analysisData.overall_verdict]?.bg,
                                        color: VERDICT_CONFIG[analysisData.overall_verdict]?.color
                                    }}>
                                    {VERDICT_CONFIG[analysisData.overall_verdict]?.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-lg font-bold"
                                            style={{ color: VERDICT_CONFIG[analysisData.overall_verdict]?.color }}>
                                            {analysisData.overall_verdict}
                                        </h2>
                                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                                            Score: {analysisData.total_threat_score}/50
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {analysisData.verdict_description}
                                    </p>
                                </div>
                            </div>

                            {/* Radar Chart */}
                            <div className="p-5 rounded-xl bg-white border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                    Biểu đồ Radar - Mức độ Đe dọa
                                </h3>
                                <div style={{ width: '100%', height: 320 }}>
                                    <ResponsiveContainer>
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="force" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <Radar
                                                name="Threat Score"
                                                dataKey="score"
                                                stroke="#6366f1"
                                                fill="#6366f1"
                                                fillOpacity={0.2}
                                                strokeWidth={2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    Vùng phủ càng rộng → Ngành càng khốc liệt
                                </p>
                            </div>

                            {/* Force Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {analysisData.forces.map((force, idx) => {
                                    const config = FORCE_CONFIG[force.name] || { icon: <Target size={18} />, color: '#6366f1' };
                                    return (
                                        <div key={idx} className="p-4 rounded-xl bg-white border border-gray-200">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: `${config.color}10`, color: config.color }}>
                                                        {config.icon}
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-600">
                                                        {force.name_vi}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-lg font-bold" style={{ color: getScoreColor(force.score) }}>
                                                        {force.score}
                                                    </span>
                                                    <span className="text-xs text-gray-400">/10</span>
                                                </div>
                                            </div>

                                            {/* Status Badge + Trend */}
                                            <div className="mb-3 flex items-center gap-2 flex-wrap">
                                                <span className="text-xs px-2 py-0.5 rounded font-medium"
                                                    style={{
                                                        backgroundColor: force.status === 'Extreme' ? '#fef2f2' :
                                                            force.status === 'High' ? '#fff7ed' :
                                                                force.status === 'Medium' ? '#fefce8' : '#f0fdf4',
                                                        color: force.status === 'Extreme' ? '#dc2626' :
                                                            force.status === 'High' ? '#ea580c' :
                                                                force.status === 'Medium' ? '#ca8a04' : '#16a34a'
                                                    }}>
                                                    {force.status}
                                                </span>
                                                {force.trend && TREND_CONFIG[force.trend] && (
                                                    <span
                                                        className="text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 cursor-help"
                                                        style={{
                                                            backgroundColor: TREND_CONFIG[force.trend].bg,
                                                            color: TREND_CONFIG[force.trend].color
                                                        }}
                                                        title={force.trend_reason || `Xu hướng: ${TREND_CONFIG[force.trend].label}`}>
                                                        {TREND_CONFIG[force.trend].icon}
                                                        {TREND_CONFIG[force.trend].label}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Determinants */}
                                            <div className="mb-3">
                                                <p className="text-xs font-medium text-gray-700 mb-1">Yếu tố quyết định:</p>
                                                <ul className="space-y-1">
                                                    {force.determinants.slice(0, 3).map((d, i) => (
                                                        <li key={i} className="text-xs text-gray-500 flex items-start gap-1">
                                                            <span className="text-gray-300">•</span> {d}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Strategic Action */}
                                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                                    🎯 Strategic Action:
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {force.strategic_action}
                                                </p>
                                            </div>

                                            {/* Data Source */}
                                            {force.data_source && (
                                                <p className="text-xs italic text-gray-400 mt-2">
                                                    📎 {force.data_source}
                                                </p>
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
