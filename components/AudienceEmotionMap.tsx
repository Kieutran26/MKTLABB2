import React, { useState, useEffect } from 'react';
import { AudienceEmotionMapInput, AudienceEmotionMapResult } from '../types';
import { analyzeEmotionalJourney } from '../services/geminiService';
import { EmotionMapService, SavedEmotionMap } from '../services/emotionMapService';
import toast, { Toaster } from 'react-hot-toast';
import {
    Heart,
    TrendingUp,
    Lightbulb,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    Save,
    History,
    Trash2,
    Plus,
    X,
    Map
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
} from 'recharts';

interface Props {
    isActive: boolean;
}



const AudienceEmotionMap: React.FC<Props> = ({ isActive }) => {
    const [input, setInput] = useState<AudienceEmotionMapInput>({
        industry: '',
        productCategory: '',
        targetAudience: '',
        painPoint: '',
        positioning: '',
    });
    const [result, setResult] = useState<AudienceEmotionMapResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState('');
    const [expandedStage, setExpandedStage] = useState<string | null>(null);

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [savedMaps, setSavedMaps] = useState<SavedEmotionMap[]>([]);


    useEffect(() => {
        const loadMaps = async () => {
            const maps = await EmotionMapService.getEmotionMaps();
            setSavedMaps(maps);
        };
        loadMaps();
    }, []);

    const handleAnalyze = async () => {
        if (!input.industry || !input.painPoint) {
            setError('Vui lòng nhập Ngành hàng và Vấn đề chính (Pain Point)');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const analysis = await analyzeEmotionalJourney(input, setProgress);

        if (analysis) {
            setResult(analysis);
            toast.success('Phân tích thành công!');
        } else {
            setError('Không thể phân tích. Vui lòng thử lại.');
        }

        setLoading(false);
        setProgress('');
    };

    const handleSave = async () => {
        if (!result) return;
        const newMap: SavedEmotionMap = {
            id: Date.now().toString(),
            input: { ...input },
            result: { ...result },
            timestamp: Date.now(),
        };

        const success = await EmotionMapService.saveEmotionMap(newMap);

        if (success) {
            const maps = await EmotionMapService.getEmotionMaps();
            setSavedMaps(maps);
            toast.success('Đã lưu bản đồ cảm xúc!', {
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

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const success = await EmotionMapService.deleteEmotionMap(id);

        if (success) {
            const maps = await EmotionMapService.getEmotionMaps();
            setSavedMaps(maps);
            toast.success('Đã xóa bản lưu!');
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleLoad = (map: SavedEmotionMap) => {
        setInput(map.input);
        setResult(map.result);
        setShowHistory(false);
        toast.success('Đã tải lại bản đồ!');
    };

    const handleNew = () => {
        setInput({
            industry: '',
            productCategory: '',
            targetAudience: '',
            painPoint: '',
            positioning: '',
        });
        setResult(null);
        setError(null);
        toast.success('Tạo bản đồ mới');
    };

    // Custom Tooltip for Recharts
    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as EmotionStage;
            return (
                <div className="bg-white border-2 border-pink-200 rounded-xl p-4 shadow-lg z-50">
                    <div className="text-2xl mb-2">{data.emoji}</div>
                    <div className="font-bold text-slate-900 mb-1">{data.stage}</div>
                    <div className="text-sm text-pink-600 font-bold">
                        {data.dominant_emotion}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Intensity: {data.intensity_score}/10
                    </div>
                </div>
            );
        }
        return null;
    };

    // Get emotion color based on intensity
    const getEmotionColor = (intensity: number): string => {
        if (intensity >= 8) return '#ef4444'; // red-500
        if (intensity >= 6) return '#f59e0b'; // amber-500
        return '#10b981'; // emerald-500
    };

    if (!isActive) return null;

    return (
        <div className="w-full h-full overflow-hidden bg-slate-50/30 relative flex">
            <Toaster position="top-center" />

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100">
                                <Heart className="w-6 h-6 text-pink-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    Audience Emotion Map
                                </h1>
                                <p className="text-slate-500">
                                    Bản đồ cảm xúc khách hàng qua 4 giai đoạn với Plutchik's Wheel
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleNew}
                                className="p-2.5 text-slate-600 hover:bg-white hover:text-pink-600 bg-white/50 border border-slate-200 rounded-xl transition-all"
                                title="Tạo mới"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!result}
                                className="p-2.5 text-slate-600 hover:bg-white hover:text-pink-600 bg-white/50 border border-slate-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Lưu"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="p-2.5 text-slate-600 hover:bg-white hover:text-pink-600 bg-white/50 border border-slate-200 rounded-xl transition-all"
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
                                    <TrendingUp className="w-5 h-5 text-pink-600" />
                                    Thông tin Phân tích
                                </h2>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Ngành hàng *
                                        </label>
                                        <input
                                            type="text"
                                            value={input.industry}
                                            onChange={(e) => setInput({ ...input, industry: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition-all outline-none"
                                            placeholder="VD: Trang trí nhà cửa, Thời trang..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Vấn đề / Nhu cầu chính (Pain Point) *
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={input.painPoint}
                                            onChange={(e) => setInput({ ...input, painPoint: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition-all outline-none resize-none"
                                            placeholder="VD: Phòng ngủ lộn xộn, khó ngủ, thiếu cảm hứng..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Danh mục sản phẩm (Tùy chọn)
                                        </label>
                                        <input
                                            type="text"
                                            value={input.productCategory || ''}
                                            onChange={(e) => setInput({ ...input, productCategory: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition-all outline-none"
                                            placeholder="VD: Đồ decor phòng ngủ"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Đối tượng khách hàng (Tùy chọn)
                                        </label>
                                        <input
                                            type="text"
                                            value={input.targetAudience || ''}
                                            onChange={(e) => setInput({ ...input, targetAudience: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition-all outline-none"
                                            placeholder="VD: Gen Z, 18-25 tuổi"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Định vị thương hiệu (Tùy chọn)
                                        </label>
                                        <select
                                            value={input.positioning || ''}
                                            onChange={(e) => setInput({ ...input, positioning: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition-all outline-none appearance-none"
                                        >
                                            <option value="">-- Chọn định vị --</option>
                                            <option value="budget">Giá rẻ / Bình dân (Budget)</option>
                                            <option value="mainstream">Phổ thông (Mainstream)</option>
                                            <option value="premium">Cao cấp (Premium)</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className="w-full mt-6 px-6 py-3.5 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {progress || 'Đang phân tích...'}
                                        </>
                                    ) : (
                                        <>
                                            <Heart className="w-5 h-5" />
                                            Phân tích Cảm xúc
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

                            {/* Legend */}
                            {result && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                                        4 Giai đoạn Cảm xúc
                                    </h3>
                                    <div className="space-y-3">
                                        {result.emotion_journey.map((stage, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="text-2xl">{stage.emoji}</div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-900 text-sm">{stage.stage}</div>
                                                    <div className="text-xs text-slate-500">{stage.dominant_emotion}</div>
                                                </div>
                                                <div
                                                    className="px-2 py-1 rounded-lg text-xs font-bold text-white"
                                                    style={{ backgroundColor: getEmotionColor(stage.intensity_score) }}
                                                >
                                                    {stage.intensity_score}/10
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Emotional Wave Chart & Stage Cards */}
                        <div className="lg:col-span-2 space-y-6">
                            {result ? (
                                <>
                                    {/* Wave Chart */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 text-center">
                                            Đường cong Cảm xúc (Emotional Wave)
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={result.emotion_journey}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="stage"
                                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    domain={[0, 10]}
                                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'Intensity',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        style: { fill: '#64748b', fontSize: 12, fontWeight: 600 },
                                                    }}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="intensity_score"
                                                    stroke="#ec4899"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#ec4899', r: 8, strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 10 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Stage Cards */}
                                    <div className="space-y-4">
                                        {result.emotion_journey.map((stage, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                                            >
                                                {/* Stage Header */}
                                                <button
                                                    onClick={() =>
                                                        setExpandedStage(expandedStage === stage.stage ? null : stage.stage)
                                                    }
                                                    className="w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="text-4xl">{stage.emoji}</div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-black text-lg text-slate-900">{stage.stage}</div>
                                                        <div className="text-sm text-pink-600 font-bold">
                                                            {stage.dominant_emotion}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                                                        style={{ backgroundColor: getEmotionColor(stage.intensity_score) }}
                                                    >
                                                        {stage.intensity_score}/10
                                                    </div>
                                                    {expandedStage === stage.stage ? (
                                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </button>

                                                {/* Expanded Content */}
                                                {expandedStage === stage.stage && (
                                                    <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
                                                        <div className="pt-4">
                                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                                Trigger (Tình huống kích hoạt)
                                                            </div>
                                                            <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">
                                                                {stage.trigger}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                                Internal Monologue (Độc thoại nội tâm)
                                                            </div>
                                                            <div className="text-sm text-slate-700 italic bg-amber-50 p-3 rounded-xl border border-amber-200">
                                                                "{stage.internal_monologue}"
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                                Recommended Tone (Giọng văn phù hợp)
                                                            </div>
                                                            <div className="inline-block px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-sm font-bold text-purple-700">
                                                                {stage.recommended_tone}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                                                Content Hook Example
                                                            </div>
                                                            <div className="text-sm text-slate-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                                                {stage.content_hook}
                                                            </div>
                                                        </div>

                                                        {/* Copywriting Tips */}
                                                        {(stage.keywords_to_use || stage.keywords_to_avoid) && (
                                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                                {stage.keywords_to_use && stage.keywords_to_use.length > 0 && (
                                                                    <div>
                                                                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1">
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                            Nên dùng
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {stage.keywords_to_use.map((keyword, kidx) => (
                                                                                <span
                                                                                    key={kidx}
                                                                                    className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg"
                                                                                >
                                                                                    {keyword}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {stage.keywords_to_avoid && stage.keywords_to_avoid.length > 0 && (
                                                                    <div>
                                                                        <div className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1">
                                                                            <XCircle className="w-4 h-4" />
                                                                            Nên tránh
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {stage.keywords_to_avoid.map((keyword, kidx) => (
                                                                                <span
                                                                                    key={kidx}
                                                                                    className="px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg"
                                                                                >
                                                                                    {keyword}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center h-[500px] flex flex-col items-center justify-center">
                                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                                        <Heart className="w-12 h-12 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                                        Chưa có dữ liệu phân tích
                                    </h3>
                                    <p className="text-slate-400 font-medium max-w-md mx-auto">
                                        Nhập ngành hàng và Pain Point của khách hàng, AI sẽ vẽ biểu đồ cảm xúc chi tiết theo mô hình Plutchik.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* History Sidebar */}
            <div
                className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${showHistory ? 'translate-x-0' : 'translate-x-full'
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
                        {savedMaps.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 text-sm">
                                Chưa có bản đồ nào được lưu
                            </div>
                        ) : (
                            savedMaps.map((map) => (
                                <div
                                    key={map.id}
                                    onClick={() => handleLoad(map)}
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-pink-400 hover:shadow-md cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-800 text-sm line-clamp-1">
                                            {map.input.industry}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(map.id, e)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-2 line-clamp-1">
                                        {map.input.painPoint}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <History className="w-3 h-3" />
                                        {new Date(map.timestamp).toLocaleString('vi-VN')}
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

export default AudienceEmotionMap;
