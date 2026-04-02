import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Toast, ToastType } from './Toast';
import { Lightbulb, Sparkles, Copy, Maximize2, Save, Trash2, Plus, Filter, X, Video } from 'lucide-react';
import { CreativeAngleInput, CreativeAngle, CreativeAngleResult } from '../types';
import { generateCreativeAngles } from '../services/geminiService';
import { CreativeAngleService, SavedAngleSet } from '../services/creativeAngleService';
import FeatureHeader from './FeatureHeader';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const CreativeAngleExplorer: React.FC = () => {
    const { register, handleSubmit, reset } = useForm<CreativeAngleInput>();
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState('');
    const [result, setResult] = useState<CreativeAngleResult | null>(null);
    const [currentInput, setCurrentInput] = useState<CreativeAngleInput | null>(null);

    // Filters
    const [filterFramework, setFilterFramework] = useState<string>('All');
    const [filterFormat, setFilterFormat] = useState<string>('All');
    const [filterEmotion, setFilterEmotion] = useState<string>('All');

    // Expand modal
    const [expandedAngle, setExpandedAngle] = useState<CreativeAngle | null>(null);

    // History - now from Supabase
    const [savedSets, setSavedSets] = useState<SavedAngleSet[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load from Supabase on mount
    useEffect(() => {
        const loadData = async () => {
            // Try to migrate from localStorage first (one-time)
            const localData = localStorage.getItem('creative_angle_history');
            if (localData) {
                const migrated = await CreativeAngleService.migrateFromLocalStorage();
                if (migrated > 0) {
                    setToast({ message: `Đã migrate ${migrated} bản ghi lên cloud!`, type: 'success' });
                }
            }

            // Load from Supabase
            const data = await CreativeAngleService.getAngleSets();
            setSavedSets(data);
        };
        loadData();
    }, []);

    const onSubmit = async (data: CreativeAngleInput) => {
        setIsGenerating(true);
        setResult(null);
        setCurrentInput(data);

        try {
            // Explicitly cast keyFeatures to string for processing, then split into array
            const featuresInput = data.keyFeatures as unknown as string;
            const processedData = {
                ...data,
                keyFeatures: typeof featuresInput === 'string'
                    ? featuresInput.split(',').map(s => s.trim()).filter(Boolean)
                    : []
            };

            const angles = await generateCreativeAngles(processedData, (step) => {
                setThinkingStep(step);
            });

            if (angles) {
                setResult(angles);
                setToast({ message: `Đã tạo ${angles.totalAngles || angles.total_angles} Concept Cards!`, type: 'success' });
            } else {
                setToast({ message: 'Không thể tạo angles. Vui lòng thử lại.', type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setToast({ message: 'Có lỗi xảy ra khi tạo angles.', type: 'error' });
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!result || !currentInput) return;

        const newSet: SavedAngleSet = {
            id: Date.now().toString(),
            name: currentInput.productName,
            input: currentInput,
            result: result,
            timestamp: Date.now()
        };

        const { success, errorMessage } = await CreativeAngleService.saveAngleSet(newSet);
        if (success) {
            setSavedSets(prev => [newSet, ...prev]);
            setToast({ message: 'Đã lưu lên cloud!', type: 'success' });
        } else {
            setToast({ message: `Lỗi khi lưu: ${errorMessage || 'Không xác định'}`, type: 'error' });
            console.error('Save failed:', errorMessage);
        }
    };

    const handleLoad = (set: SavedAngleSet) => {
        setResult(set.result);
        setCurrentInput(set.input);
        reset(set.input);
        setShowHistory(false);
        setToast({ message: 'Đã tải!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        const success = await CreativeAngleService.deleteAngleSet(id);
        if (success) {
            setSavedSets(prev => prev.filter(s => s.id !== id));
            setToast({ message: 'Đã xóa!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi xóa!', type: 'error' });
        }
    };

    const handleNew = () => {
        setResult(null);
        setCurrentInput(null);
        reset();
        setToast({ message: 'Sẵn sàng tạo angles mới!', type: 'success' });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setToast({ message: 'Đã copy!', type: 'success' });
    };

    // Filter logic
    const filteredAngles = result?.angles.filter(angle => {
        if (filterFramework !== 'All' && angle.framework !== filterFramework) return false;
        if (filterFormat !== 'All' && angle.suggestedFormat !== filterFormat) return false;
        if (filterEmotion !== 'All' && angle.emotionTag !== filterEmotion) return false;
        return true;
    }) || [];

    // V2 Hook Types and Filters
    const hookTypes = ['All', 'Negative Hook', 'ASMR', 'Story-telling', 'Challenge', 'POV', 'Before-After', 'Unboxing', 'Tutorial', 'Reaction', 'Meme'];
    const formats = ['All', 'Video ngắn (TikTok/Reels)', 'Carousel Ads', 'Ảnh tĩnh', 'Ảnh chế/Meme'];
    const emotions = ['All', 'FOMO', 'Vanity', 'Greed', 'Laziness', 'Curiosity', 'Fear', 'Joy', 'Surprise'];

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <FeatureHeader
                icon={Video}
                eyebrow="CONTENT ARCHITECTURE & HOOK GENERATION"
                title="Creative Angle Explorer"
                subline="Tạo 20-50 góc tiếp cận quảng cáo production-ready."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-2xl transition-all ${
                            showHistory
                                ? 'bg-stone-950 text-white shadow-md active:scale-95'
                                : 'border border-stone-200 bg-white text-stone-600 shadow-sm hover:border-stone-300 hover:bg-stone-50'
                        }`}
                        title={`Lịch sử (${savedSets.length})`}
                        aria-label={`Mở lịch sử, ${savedSets.length} bộ đã lưu`}
                    >
                        <Sparkles size={16} strokeWidth={1.5} />
                    </button>
                    {result && (
                        <>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
                            >
                                <Save size={16} strokeWidth={1.5} /> Lưu
                            </button>
                            <button
                                type="button"
                                onClick={handleNew}
                                className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-95"
                            >
                                <Plus size={16} strokeWidth={2} /> Tạo mới
                            </button>
                        </>
                    )}
                </div>
            </FeatureHeader>

            <div
                className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5"
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,380px) 1fr' : 'minmax(0,380px) 1fr' }}
            >
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <Sparkles size={18} strokeWidth={1.25} className="text-stone-400" />
                                    Saved Angle Sets
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedSets.length} mục</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedSets.length === 0 ? (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">
                                    Chưa có Concept nào được lưu.
                                </div>
                            ) : (
                                savedSets.map((set) => (
                                    <div
                                        key={set.id}
                                        className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="line-clamp-1 text-sm font-medium text-stone-900">{set.input.productName}</p>
                                                <p className="text-xs text-stone-400">{set.result.totalAngles} angles</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(set.id)}
                                                className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                aria-label="Xóa"
                                            >
                                                <Trash2 size={14} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        <p className="text-xs font-normal text-stone-400">
                                            {new Date(set.timestamp).toLocaleDateString('vi-VN')}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleLoad(set)}
                                            className="mt-2 w-full rounded-lg bg-stone-900 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-800"
                                        >
                                            Tải
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Form Section */}
                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 text-lg font-medium tracking-tight text-stone-900">
                        <Lightbulb size={20} strokeWidth={1.25} className="text-stone-400" />
                        Performance Creative V2
                    </h2>
                    <p className="mb-6 text-sm font-normal text-stone-500">
                        Tạo Concept Card cho Video ngắn, Reels, TikTok
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Product Name */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                <span className="text-rose-500">*</span> Tên sản phẩm
                            </label>
                            <input
                                {...register('productName', { required: true })}
                                className={inputClass}
                                placeholder="VD: Áo thun cotton cao cấp"
                            />
                        </div>

                        {/* USP / Key Features */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                <span className="text-rose-500">*</span> Tính năng cốt lõi (USP)
                            </label>
                            <textarea
                                {...register('keyFeatures', { required: true })}
                                rows={3}
                                className={`${inputClass} resize-none`}
                                placeholder="VD: Bền màu sau 50 lần giặt, Giá chỉ 199k"
                            />
                            <p className="mt-1.5 text-xs text-stone-400">AI chỉ sử dụng các tính năng bạn nhập, không tự bịa thêm</p>
                        </div>

                        {/* Pain Points */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Nỗi đau khách hàng (Pain Point)
                            </label>
                            <textarea
                                {...register('painPoints')}
                                rows={2}
                                className={`${inputClass} resize-none`}
                                placeholder="VD: Mua áo rẻ tiền bị phai màu sau 2 lần giặt"
                            />
                        </div>

                        {/* Target Audience */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Đối tượng mục tiêu
                            </label>
                            <input
                                {...register('targetAudience')}
                                className={inputClass}
                                placeholder="VD: Gen Z, Nam 18-25 tuổi, yêu thích thời trang"
                            />
                        </div>

                        {/* Brand Vibe & Format Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                    Phong cách Brand
                                </label>
                                <select
                                    {...register('brandVibe')}
                                    className={inputClass}
                                >
                                    <option value="fun">Vui vẻ / Trẻ trung</option>
                                    <option value="premium">Sang trọng / Premium</option>
                                    <option value="meme">Bựa / Meme</option>
                                    <option value="minimalist">Minimalist / Tối giản</option>
                                    <option value="professional">Chuyên nghiệp</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                    Định dạng mong muốn
                                </label>
                                <select
                                    {...register('desiredFormat')}
                                    className={inputClass}
                                >
                                    <option value="video_short">Video ngắn (TikTok/Reels)</option>
                                    <option value="carousel">Carousel Ads</option>
                                    <option value="static">Ảnh tĩnh</option>
                                    <option value="meme">Ảnh chế / Meme</option>
                                    <option value="mixed">Đa dạng (Mix)</option>
                                </select>
                            </div>
                        </div>

                        {/* Angle Count */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Số lượng Concept Cards (5-15)
                            </label>
                            <input
                                {...register('desiredAngleCount')}
                                type="number"
                                min="5"
                                max="15"
                                defaultValue="8"
                                className={inputClass}
                            />
                            <p className="mt-1.5 text-xs text-stone-400">Mỗi card là 1 kịch bản tóm tắt production-ready</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    {thinkingStep || 'Đang tạo Concept Cards...'}
                                </>
                            ) : (
                                <>
                                    <Lightbulb className="h-5 w-5" />
                                    Generate Concept Cards
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                <div className={`${cardClass} min-h-0 overflow-hidden flex flex-col`}>
                    {result ? (
                        <>
                            {/* Filter Bar */}
                            <div className="border-b border-stone-100 px-5 py-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} strokeWidth={1.25} className="text-stone-400" />
                                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Filters:</span>
                                    </div>

                                    <select
                                        value={filterFramework}
                                        onChange={(e) => setFilterFramework(e.target.value)}
                                        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                    >
                                        {hookTypes.map(fw => <option key={fw} value={fw}>{fw}</option>)}
                                    </select>

                                    <select
                                        value={filterFormat}
                                        onChange={(e) => setFilterFormat(e.target.value)}
                                        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                    >
                                        {formats.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
                                    </select>

                                    <select
                                        value={filterEmotion}
                                        onChange={(e) => setFilterEmotion(e.target.value)}
                                        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                    >
                                        {emotions.map(emo => <option key={emo} value={emo}>{emo}</option>)}
                                    </select>

                                    <span className="ml-auto text-xs font-medium text-stone-400">
                                        {filteredAngles.length} / {result.totalAngles} angles
                                    </span>
                                </div>
                            </div>

                            {/* Angle Cards Grid */}
                            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredAngles.map((angle) => (
                                        <div
                                            key={angle.id}
                                            className="rounded-2xl border border-stone-200/90 bg-white p-5 transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] group"
                                        >
                                            {/* Framework Badge */}
                                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                                <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-600">
                                                    {angle.framework}
                                                </span>
                                                {angle.emotionTag && (
                                                    <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600">
                                                        {angle.emotionTag}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Angle Name */}
                                            <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-stone-900 group-hover:text-stone-700 transition-colors">{angle.angleName}</h3>

                                            {/* Hook Text */}
                                            <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-stone-500">{angle.hookText}</p>

                                            {/* Visual Direction Preview */}
                                            <div className="mb-4 rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                                                <p className="text-xs italic leading-relaxed text-stone-400 line-clamp-2">
                                                    <span className="mr-1 font-normal not-italic">🎨</span>
                                                    {angle.visualDirection}
                                                </p>
                                            </div>

                                            {/* Format Badge */}
                                            <div className="mb-4">
                                                <span className="inline-flex items-center rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-medium text-white">
                                                    {angle.suggestedFormat}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedAngle(angle)}
                                                    className="flex-1 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 flex items-center justify-center gap-1"
                                                >
                                                    <Maximize2 size={12} />
                                                    Expand
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(`${angle.angleName}\n\n${angle.hookText}\n\n${angle.adCopyOutline}\n\nVisual: ${angle.visualDirection}`)}
                                                    className="rounded-lg p-2 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-600"
                                                >
                                                    <Copy size={14} strokeWidth={1.25} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80">
                                <Lightbulb size={30} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-sm font-normal text-center max-w-xs px-4">
                                Nhập thông tin sản phẩm và Generate để bắt đầu
                            </p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 flex min-h-[360px] flex-col items-center justify-center bg-white/80">
                            <div className="relative mb-8 h-14 w-14">
                                <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-800 animate-spin"></div>
                            </div>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">{thinkingStep}</p>
                            <p className="text-sm font-normal text-stone-400">Đang sinh Concept Cards...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Expand Modal */}
            {expandedAngle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm transition-all" onClick={() => setExpandedAngle(null)}>
                    <div className={`${cardClass} max-h-[90vh] w-full max-w-2xl overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-stone-100 bg-white/90 px-6 py-5 backdrop-blur-md">
                            <div>
                                <h2 className="mb-3 text-xl font-semibold leading-tight text-stone-900">{expandedAngle.angleName}</h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-600">
                                        {expandedAngle.framework}
                                    </span>
                                    {expandedAngle.emotionTag && (
                                        <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600">
                                            {expandedAngle.emotionTag}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center rounded-full bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white">
                                        {expandedAngle.suggestedFormat}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExpandedAngle(null)}
                                className="rounded-full p-1.5 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-600"
                            >
                                <X size={20} strokeWidth={1.25} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">Hook Text</h3>
                                <p className="text-lg font-medium leading-relaxed text-stone-800">{expandedAngle.hookText}</p>
                            </div>

                            <div className="border-t border-stone-100 pt-6">
                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">Ad Copy Outline</h3>
                                <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-600 whitespace-pre-wrap">
                                    {expandedAngle.adCopyOutline}
                                </div>
                            </div>

                            <div className="border-t border-stone-100 pt-6">
                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">Visual Direction</h3>
                                <div className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-600">
                                    <span className="text-lg">🎨</span>
                                    <span>{expandedAngle.visualDirection}</span>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white pt-4 pb-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        copyToClipboard(`${expandedAngle.angleName}\n\n${expandedAngle.hookText}\n\n${expandedAngle.adCopyOutline}\n\nVisual: ${expandedAngle.visualDirection}`);
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-stone-200 transition-colors hover:bg-stone-800"
                                >
                                    <Copy size={17} strokeWidth={1.25} />
                                    Copy All Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default CreativeAngleExplorer;
