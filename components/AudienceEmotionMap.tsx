import React, { useState, useEffect } from 'react';
import { AudienceEmotionMapInput, AudienceEmotionMapResult } from '../types';
import { analyzeEmotionalJourney } from '../services/geminiService';
import { EmotionMapService, SavedEmotionMap } from '../services/emotionMapService';
import { Toast, ToastType } from './Toast';
import {
    Heart,
    Map,
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
    BarChart3
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

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

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
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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
        setProgress('');

        try {
            const analysis = await analyzeEmotionalJourney(input, setProgress);
            if (analysis) {
                setResult(analysis);
                setToast({ message: 'Phân tích thành công!', type: 'success' });
            } else {
                setError('Không thể phân tích. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setProgress('');
        }
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
            setToast({ message: 'Đã lưu bản đồ cảm xúc!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi lưu!', type: 'error' });
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await EmotionMapService.deleteEmotionMap(id);
        if (success) {
            const maps = await EmotionMapService.getEmotionMaps();
            setSavedMaps(maps);
            setToast({ message: 'Đã xóa!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi xóa!', type: 'error' });
        }
    };

    const handleLoad = (map: SavedEmotionMap) => {
        setInput(map.input);
        setResult(map.result);
        setShowHistory(false);
        setToast({ message: 'Đã tải bản đồ!', type: 'success' });
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
        setProgress('');
        setToast({ message: 'Sẵn sàng tạo bản đồ mới!', type: 'success' });
    };

    // Custom Tooltip for Recharts
    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as EmotionStage;
            return (
                <div className="bg-white border-2 border-stone-200 rounded-xl p-4 shadow-lg z-50">
                    <div className="text-2xl mb-2">{data.emoji}</div>
                    <div className="font-semibold text-stone-900 mb-1">{data.stage}</div>
                    <div className="text-sm text-stone-600 font-medium">
                        {data.dominant_emotion}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                        Intensity: {data.intensity_score}/10
                    </div>
                </div>
            );
        }
        return null;
    };

    // Get emotion color based on intensity
    const getEmotionColor = (intensity: number): string => {
        if (intensity >= 8) return '#e7e5e4'; // stone-300 - high intensity
        if (intensity >= 6) return '#d6d3d1'; // stone-300
        return '#a8a29e'; // stone-400
    };

    if (!isActive) return null;

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Heart size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Consumer Psychology
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        Audience Emotion Map
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Bản đồ cảm xúc khách hàng qua 4 giai đoạn với Plutchik's Wheel
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                            showHistory
                                ? 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                                : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                        }`}
                    >
                        <History size={17} strokeWidth={1.25} /> Lịch sử ({savedMaps.length})
                    </button>
                    {result && (
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
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,380px) 1fr' : 'minmax(0,380px) 1fr' }}
            >
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" />
                                    Lịch sử Emotion Map
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedMaps.length} mục</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedMaps.length === 0 ? (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">
                                    Chưa có bản đồ nào được lưu.
                                </div>
                            ) : (
                                savedMaps.map((map) => (
                                    <div
                                        key={map.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleLoad(map)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoad(map)}
                                        className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <p className="line-clamp-1 text-sm font-medium text-stone-900">{map.input.industry}</p>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(map.id, e)}
                                                className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                aria-label="Xóa"
                                            >
                                                <Trash2 size={14} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        <p className="mb-1 text-xs font-normal text-stone-500 line-clamp-1">
                                            {map.input.painPoint}
                                        </p>
                                        <p className="text-xs font-normal text-stone-400">
                                            {new Date(map.timestamp).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 text-lg font-medium tracking-tight text-stone-900">
                        <Map size={20} strokeWidth={1.25} className="text-stone-400" />
                        Thông tin Phân tích
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Ngành hàng *</label>
                            <input
                                type="text"
                                value={input.industry}
                                onChange={(e) => setInput({ ...input, industry: e.target.value })}
                                className={inputClass}
                                placeholder="VD: Trang trí nhà cửa, Thời trang..."
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Vấn đề / Nhu cầu chính (Pain Point) *</label>
                            <textarea
                                rows={2}
                                value={input.painPoint}
                                onChange={(e) => setInput({ ...input, painPoint: e.target.value })}
                                className={`${inputClass} resize-none`}
                                placeholder="VD: Phòng ngủ lộn xộn, khó ngủ, thiếu cảm hứng..."
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Danh mục sản phẩm (Tùy chọn)</label>
                            <input
                                type="text"
                                value={input.productCategory || ''}
                                onChange={(e) => setInput({ ...input, productCategory: e.target.value })}
                                className={inputClass}
                                placeholder="VD: Đồ decor phòng ngủ"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Đối tượng khách hàng (Tùy chọn)</label>
                            <input
                                type="text"
                                value={input.targetAudience || ''}
                                onChange={(e) => setInput({ ...input, targetAudience: e.target.value })}
                                className={inputClass}
                                placeholder="VD: Gen Z, 18-25 tuổi"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Định vị thương hiệu (Tùy chọn)</label>
                            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-stone-100/80 p-1">
                                {(['budget', 'mainstream', 'premium'] as const).map((pos) => (
                                    <button
                                        key={pos}
                                        type="button"
                                        onClick={() => setInput({ ...input, positioning: pos })}
                                        className={`rounded-xl px-4 py-2 text-sm transition-all ${
                                            input.positioning === pos
                                                ? 'bg-white font-semibold text-stone-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-stone-200'
                                                : 'font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                                        }`}
                                    >
                                        {pos === 'budget' ? 'Budget' : pos === 'mainstream' ? 'Mainstream' : 'Premium'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                {progress || 'Đang phân tích...'}
                            </>
                        ) : (
                            <>
                                <Heart className="h-5 w-5" />
                                Phân tích Cảm xúc
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                            <p className="text-sm text-rose-700">{error}</p>
                        </div>
                    )}

                    {/* Legend */}
                    {result && (
                        <div className="mt-6 rounded-2xl border border-stone-200 p-5">
                            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                4 Giai đoạn Cảm xúc
                            </h3>
                            <div className="space-y-3">
                                {result.emotion_journey.map((stage, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="text-2xl">{stage.emoji}</div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-stone-900 text-sm">{stage.stage}</div>
                                            <div className="text-xs text-stone-500">{stage.dominant_emotion}</div>
                                        </div>
                                        <div
                                            className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white"
                                        >
                                            {stage.intensity_score}/10
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!result ? (
                        <div className="flex min-h-[360px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80">
                                <Heart size={30} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-sm font-normal text-center max-w-xs">Nhập ngành hàng và Pain Point để bắt đầu phân tích</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Wave Chart */}
                            <div className="rounded-2xl border border-stone-200 p-5">
                                <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 text-center">
                                    Đường cong Cảm xúc (Emotional Wave)
                                </h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={result.emotion_journey}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                                        <XAxis
                                            dataKey="stage"
                                            tick={{ fill: '#78716c', fontSize: 12, fontWeight: 600 }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={[0, 10]}
                                            tick={{ fill: '#78716c', fontSize: 12 }}
                                            tickLine={false}
                                            label={{
                                                value: 'Intensity',
                                                angle: -90,
                                                position: 'insideLeft',
                                                style: { fill: '#a8a29e', fontSize: 11, fontWeight: 600 },
                                            }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="intensity_score"
                                            stroke="#292524"
                                            strokeWidth={2.5}
                                            dot={{ fill: '#292524', r: 7, strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 10 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Stage Cards */}
                            {result.emotion_journey.map((stage, idx) => (
                                <div key={idx} className="rounded-2xl border border-stone-200 overflow-hidden">
                                    <button
                                        onClick={() =>
                                            setExpandedStage(expandedStage === stage.stage ? null : stage.stage)
                                        }
                                        className="w-full p-5 flex items-center gap-4 hover:bg-stone-50/60 transition-colors"
                                    >
                                        <div className="text-3xl">{stage.emoji}</div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-stone-900">{stage.stage}</div>
                                            <div className="text-sm text-stone-600 font-medium">
                                                {stage.dominant_emotion}
                                            </div>
                                        </div>
                                        <div className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white">
                                            {stage.intensity_score}/10
                                        </div>
                                        {expandedStage === stage.stage ? (
                                            <ChevronUp className="h-5 w-5 text-stone-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-stone-400" />
                                        )}
                                    </button>

                                    {expandedStage === stage.stage && (
                                        <div className="border-t border-stone-100 p-5 space-y-4">
                                            <div>
                                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                                    Trigger (Tình huống kích hoạt)
                                                </div>
                                                <div className="text-sm text-stone-700 bg-stone-50/80 p-3 rounded-xl">
                                                    {stage.trigger}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                                    Internal Monologue (Độc thoại nội tâm)
                                                </div>
                                                <div className="text-sm text-stone-700 italic bg-stone-50/80 p-3 rounded-xl border border-stone-200">
                                                    "{stage.internal_monologue}"
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                                    Recommended Tone (Giọng văn phù hợp)
                                                </div>
                                                <div className="inline-block px-4 py-2 bg-stone-100/80 border border-stone-200 rounded-xl text-sm font-semibold text-stone-700">
                                                    {stage.recommended_tone}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                                    <Lightbulb size={14} className="text-stone-400" />
                                                    Content Hook Example
                                                </div>
                                                <div className="text-sm text-stone-700 bg-stone-50/80 p-3 rounded-xl border border-stone-200">
                                                    {stage.content_hook}
                                                </div>
                                            </div>

                                            {(stage.keywords_to_use?.length || stage.keywords_to_avoid?.length) && (
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    {stage.keywords_to_use && stage.keywords_to_use.length > 0 && (
                                                        <div>
                                                            <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Nên dùng
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {stage.keywords_to_use.map((keyword, kidx) => (
                                                                    <span
                                                                        key={kidx}
                                                                        className="px-3 py-1 bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium rounded-lg"
                                                                    >
                                                                        {keyword}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {stage.keywords_to_avoid && stage.keywords_to_avoid.length > 0 && (
                                                        <div>
                                                            <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
                                                                <XCircle className="h-4 w-4" />
                                                                Nên tránh
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {stage.keywords_to_avoid.map((keyword, kidx) => (
                                                                    <span
                                                                        key={kidx}
                                                                        className="px-3 py-1 bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium rounded-lg"
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
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AudienceEmotionMap;
