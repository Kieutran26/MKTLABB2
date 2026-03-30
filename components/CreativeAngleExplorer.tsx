import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from './Toast';
import { Lightbulb, Filter, Copy, Maximize2, Save, Trash2, Plus, Sparkles } from 'lucide-react';
import { CreativeAngleInput, CreativeAngle, CreativeAngleResult } from '../types';
import { generateCreativeAngles } from '../services/geminiService';
import { CreativeAngleService, SavedAngleSet } from '../services/creativeAngleService';

const CreativeAngleExplorer: React.FC = () => {
    const { register, handleSubmit, reset } = useForm<CreativeAngleInput>();
    const toast = useToast();
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
                    toast.success(`Đã migrate ${migrated} bản ghi lên cloud!`);
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
                toast.success(`Đã tạo ${angles.totalAngles || angles.total_angles} Concept Cards!`);
            } else {
                toast.error('Không thể tạo angles. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi tạo angles.');
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
            toast.success('Đã lưu lên cloud! ☁️');
        } else {
            toast.error(`Lỗi khi lưu: ${errorMessage || 'Không xác định'}`);
            console.error('Save failed:', errorMessage);
        }
    };

    const handleLoad = (set: SavedAngleSet) => {
        setResult(set.result);
        setCurrentInput(set.input);
        reset(set.input);
        setShowHistory(false);
        toast.success('Đã tải!');
    };

    const handleDelete = async (id: string) => {
        const success = await CreativeAngleService.deleteAngleSet(id);
        if (success) {
            setSavedSets(prev => prev.filter(s => s.id !== id));
            toast.success('Đã xóa!');
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleNew = () => {
        setResult(null);
        setCurrentInput(null);
        reset();
        toast.success('Sẵn sàng tạo angles mới!');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã copy!');
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
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-lg font-medium text-slate-900">Creative Angle Explorer</h1>
                        <p className="text-sm text-slate-500">Cỗ máy sinh 20-50 góc tiếp cận quảng cáo độc đáo</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all flex items-center gap-2 ${showHistory
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        History ({savedSets.length})
                    </button>
                    {result && (
                        <>
                            <button
                                onClick={handleSave}
                                className="px-3 py-2 text-sm font-medium bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                            <button
                                onClick={handleNew}
                                className="px-3 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                New
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* History Sidebar */}
                {showHistory && (
                    <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto">
                        <div className="p-4 border-b border-slate-200">
                            <h3 className="font-medium text-slate-900">Saved Angle Sets</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            {savedSets.map((set) => (
                                <div
                                    key={set.id}
                                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-slate-900 text-sm truncate">{set.input.productName}</h4>
                                            <p className="text-xs text-slate-500">{set.result.totalAngles} angles</p>
                                            <p className="text-xs text-slate-400">{new Date(set.timestamp).toLocaleString('vi-VN')}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(set.id)}
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleLoad(set)}
                                        className="w-full px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                    >
                                        Load
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '380px 1fr' }}>
                    {/* Form Section */}
                    <div className="bg-white border-r border-slate-200 overflow-y-auto p-6">
                        <div className="mb-4">
                            <h2 className="text-sm font-medium text-slate-700">Performance Creative V2</h2>
                            <p className="text-xs text-slate-500 mt-1">Tạo Concept Card cho Video ngắn, Reels, TikTok</p>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Product Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                    <span className="text-rose-500">*</span> Tên sản phẩm
                                </label>
                                <input
                                    {...register('productName', { required: true })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                    placeholder="VD: Áo thun cotton cao cấp"
                                />
                            </div>

                            {/* USP / Key Features */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                    <span className="text-rose-500">*</span> Tính năng cốt lõi (USP)
                                </label>
                                <textarea
                                    {...register('keyFeatures', { required: true })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm"
                                    placeholder="VD: Bền màu sau 50 lần giặt, Giá chỉ 199k"
                                />
                                <p className="text-[10px] text-amber-600 mt-1">⚠️ AI chỉ sử dụng các tính năng bạn nhập, không tự bịa thêm</p>
                            </div>

                            {/* Pain Points */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                    Nỗi đau khách hàng (Pain Point)
                                </label>
                                <textarea
                                    {...register('painPoints')}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm"
                                    placeholder="VD: Mua áo rẻ tiền bị phai màu sau 2 lần giặt"
                                />
                            </div>

                            {/* Target Audience */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                    Đối tượng mục tiêu
                                </label>
                                <input
                                    {...register('targetAudience')}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                    placeholder="VD: Gen Z, Nam 18-25 tuổi, yêu thích thời trang"
                                />
                            </div>

                            {/* Brand Vibe & Format Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                        Phong cách Brand
                                    </label>
                                    <select
                                        {...register('brandVibe')}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                                    >
                                        <option value="fun">🎉 Vui vẻ / Trẻ trung</option>
                                        <option value="premium">✨ Sang trọng / Premium</option>
                                        <option value="meme">🤣 Bựa / Meme</option>
                                        <option value="minimalist">🌿 Minimalist / Tối giản</option>
                                        <option value="professional">💼 Chuyên nghiệp</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                        Định dạng mong muốn
                                    </label>
                                    <select
                                        {...register('desiredFormat')}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                                    >
                                        <option value="video_short">📱 Video ngắn (TikTok/Reels)</option>
                                        <option value="carousel">📸 Carousel Ads</option>
                                        <option value="static">🖼️ Ảnh tĩnh</option>
                                        <option value="meme">🎭 Ảnh chế / Meme</option>
                                        <option value="mixed">🔀 Đa dạng (Mix)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Angle Count */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                    Số lượng Concept Cards (5-15)
                                </label>
                                <input
                                    {...register('desiredAngleCount')}
                                    type="number"
                                    min="5"
                                    max="15"
                                    defaultValue="8"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Mỗi card là 1 kịch bản tóm tắt production-ready</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isGenerating}
                                className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {thinkingStep || 'Đang tạo Concept Cards...'}
                                    </>
                                ) : (
                                    <>
                                        <Lightbulb className="w-5 h-5" />
                                        Generate Concept Cards
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Results Section */}
                    <div className="overflow-hidden flex flex-col bg-slate-50">
                        {result ? (
                            <>
                                {/* Filter Bar */}
                                <div className="bg-white border-b border-slate-200 p-4">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm font-medium text-slate-700">Filters:</span>
                                        </div>

                                        <select
                                            value={filterFramework}
                                            onChange={(e) => setFilterFramework(e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            {hookTypes.map(fw => <option key={fw} value={fw}>{fw}</option>)}
                                        </select>

                                        <select
                                            value={filterFormat}
                                            onChange={(e) => setFilterFormat(e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            {formats.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
                                        </select>

                                        <select
                                            value={filterEmotion}
                                            onChange={(e) => setFilterEmotion(e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            {emotions.map(emo => <option key={emo} value={emo}>{emo}</option>)}
                                        </select>

                                        <span className="ml-auto text-sm text-slate-500">
                                            {filteredAngles.length} / {result.totalAngles} angles
                                        </span>
                                    </div>
                                </div>

                                {/* Angle Cards Grid */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredAngles.map((angle) => (
                                            <div
                                                key={angle.id}
                                                className="bg-white rounded-xl border border-slate-100 p-5 hover:border-amber-200 transition-all shadow-sm hover:shadow-md group"
                                            >
                                                {/* Framework Badge */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide bg-slate-50 text-slate-600 rounded-md uppercase border border-slate-100">
                                                        {angle.framework}
                                                    </span>
                                                    {angle.emotionTag && (
                                                        <span className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                                                            {angle.emotionTag}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Angle Name */}
                                                <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 text-base group-hover:text-amber-700 transition-colors">{angle.angleName}</h3>

                                                {/* Hook Text */}
                                                <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">{angle.hookText}</p>

                                                {/* Visual Direction Preview */}
                                                <div className="mb-4 p-3 bg-slate-50/50 rounded-lg text-xs text-slate-500 line-clamp-2 border border-slate-100 italic">
                                                    <span className="not-italic mr-1">🎨</span> {angle.visualDirection}
                                                </div>

                                                {/* Format Badge */}
                                                <div className="mb-3">
                                                    <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                                                        {angle.suggestedFormat}
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setExpandedAngle(angle)}
                                                        className="flex-1 px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Maximize2 className="w-3 h-3" />
                                                        Expand
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(`${angle.angleName}\n\n${angle.hookText}\n\n${angle.adCopyOutline}\n\nVisual: ${angle.visualDirection}`)}
                                                        className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <Lightbulb className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-sm">Nhập thông tin sản phẩm và Generate để bắt đầu</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expand Modal */}
            {expandedAngle && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all" onClick={() => setExpandedAngle(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl ring-1 ring-slate-900/5" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-6 flex items-start justify-between z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{expandedAngle.angleName}</h2>
                                <div className="flex gap-2">
                                    <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide bg-slate-50 text-slate-600 rounded-md uppercase border border-slate-100">
                                        {expandedAngle.framework}
                                    </span>
                                    {expandedAngle.emotionTag && (
                                        <span className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                                            {expandedAngle.emotionTag}
                                        </span>
                                    )}
                                    <span className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                                        {expandedAngle.suggestedFormat}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setExpandedAngle(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Hook Text</h3>
                                <p className="text-slate-800 text-lg font-medium leading-relaxed">{expandedAngle.hookText}</p>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Ad Copy Outline</h3>
                                <div className="text-slate-600 whitespace-pre-wrap leading-7 bg-slate-50 rounded-xl p-5 border border-slate-100 text-sm">
                                    {expandedAngle.adCopyOutline}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Visual Direction</h3>
                                <div className="text-slate-600 whitespace-pre-wrap leading-relaxed flex gap-3 items-start bg-blue-50/30 rounded-xl p-4 border border-blue-50">
                                    <span className="text-lg">🎨</span>
                                    <span className="text-sm">{expandedAngle.visualDirection}</span>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white pt-4 pb-0">
                                <button
                                    onClick={() => {
                                        copyToClipboard(`${expandedAngle.angleName}\n\n${expandedAngle.hookText}\n\n${expandedAngle.adCopyOutline}\n\nVisual: ${expandedAngle.visualDirection}`);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy All Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreativeAngleExplorer;
