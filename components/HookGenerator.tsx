import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Zap,
    Video,
    Mail,
    Globe,
    MessageSquare,
    Copy,
    Save,
    History,
    Trash2,
    Plus,
    Loader2,
    Eye,
    CheckCircle2,
    Info,
} from 'lucide-react';
import { HookGeneratorResult, VideoHook, LandingPageHook, EmailHook, SocialHook } from '../types';
import { generateHooks, HookInput } from '../services/geminiService';
import { HookService, SavedHookSet } from '../services/hookService';
import { Toast, ToastType } from './Toast';
import FeatureHeader from './FeatureHeader';

type TabType = 'video' | 'social' | 'email' | 'web';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const PSYCHOLOGY_TRIGGERS: Record<string, { label: string; description: string }> = {
    'Fear of Loss': { label: 'Sợ mất mát', description: 'Kích hoạt nỗi sợ bỏ lỡ cơ hội hoặc mất điều quan trọng' },
    'Risk Reversal': { label: 'Đảo ngược rủi ro', description: 'Loại bỏ rào cản tâm lý bằng cam kết/bảo hành' },
    'Curiosity Gap': { label: 'Khoảng trống tò mò', description: 'Tạo cảm giác thiếu thông tin, muốn tìm hiểu thêm' },
    'Contrarian': { label: 'Đi ngược xu hướng', description: 'Thách thức niềm tin phổ biến để gây chú ý' },
    'Social Proof': { label: 'Bằng chứng xã hội', description: 'Sử dụng hành vi đám đông để tạo niềm tin' },
    'Urgency': { label: 'Tính cấp bách', description: 'Tạo áp lực thời gian để thúc đẩy hành động' },
    'Exclusivity': { label: 'Độc quyền', description: 'Cảm giác đặc biệt, chỉ dành cho số ít' },
    'Authority': { label: 'Uy tín chuyên gia', description: 'Sử dụng uy tín để tạo niềm tin' },
};

const PsychologyTag = ({ trigger }: { trigger: string }) => {
    const info = PSYCHOLOGY_TRIGGERS[trigger] || { label: trigger, description: '' };
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative inline-block">
            <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full cursor-help bg-stone-100 border border-stone-200 text-stone-600"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <Info size={10} />
                {info.label}
            </span>
            {showTooltip && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-stone-200 bg-white p-3 shadow-lg z-50">
                    <div className="font-semibold text-sm text-stone-900 mb-1">{trigger}</div>
                    <div className="text-xs text-stone-500 leading-relaxed">{info.description}</div>
                </div>
            )}
        </div>
    );
};

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`shrink-0 rounded-lg p-2 transition-all ${
                copied
                    ? 'bg-stone-100 text-stone-600'
                    : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
        >
            {copied ? <CheckCircle2 size={15} strokeWidth={1.25} /> : <Copy size={15} strokeWidth={1.25} />}
        </button>
    );
};

const HookGenerator: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<HookInput>();
    const [hookData, setHookData] = useState<HookGeneratorResult | null>(null);
    const [currentInput, setCurrentInput] = useState<HookInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [activeTab, setActiveTab] = useState<TabType>('video');
    const [showHistory, setShowHistory] = useState(false);
    const [savedHooks, setSavedHooks] = useState<SavedHookSet[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    React.useEffect(() => {
        const loadHooks = async () => {
            const hooks = await HookService.getHookSets();
            setSavedHooks(hooks);
        };
        loadHooks();
    }, []);

    const onSubmit = async (data: HookInput) => {
        setIsGenerating(true);
        setHookData(null);
        setCurrentInput(data);

        try {
            const result = await generateHooks(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setHookData(result);
                setToast({ message: 'Hooks đã được tạo!', type: 'success' });
            } else {
                setToast({ message: 'Không thể tạo hooks.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Đã xảy ra lỗi.', type: 'error' });
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!hookData || !currentInput) return;

        const newSet: SavedHookSet = {
            id: Date.now().toString(),
            input: currentInput,
            data: hookData,
            timestamp: Date.now(),
        };

        const success = await HookService.saveHookSet(newSet);

        if (success) {
            const hooks = await HookService.getHookSets();
            setSavedHooks(hooks);
            setToast({ message: 'Đã lưu!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi lưu!', type: 'error' });
        }
    };

    const handleNew = () => {
        setHookData(null);
        setCurrentInput(null);
        reset();
        setToast({ message: 'Sẵn sàng tạo hooks mới!', type: 'success' });
    };

    const handleLoad = (item: SavedHookSet) => {
        setHookData(item.data);
        setCurrentInput(item.input);
        reset(item.input);
        setShowHistory(false);
        setToast({ message: 'Đã tải!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        const success = await HookService.deleteHookSet(id);
        if (success) {
            const hooks = await HookService.getHookSets();
            setSavedHooks(hooks);
            setToast({ message: 'Đã xóa!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi xóa!', type: 'error' });
        }
    };

    const tabs = [
        { id: 'video' as TabType, label: 'Video', icon: Video, count: hookData?.hooks.video_shorts?.length || 0 },
        { id: 'social' as TabType, label: 'Social', icon: MessageSquare, count: hookData?.hooks.social_post?.length || 0 },
        { id: 'email' as TabType, label: 'Email', icon: Mail, count: hookData?.hooks.email?.length || 0 },
        { id: 'web' as TabType, label: 'Web', icon: Globe, count: hookData?.hooks.landing_page?.length || 0 },
    ];

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <FeatureHeader
                icon={Zap}
                eyebrow="CONTENT STRATEGY"
                title="Hook Generator"
                subline="Tạo hooks theo Hook Matrix — Tâm lý học hành vi giúp thu hút sự chú ý ngay lập tức."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-95 ${showHistory ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                    >
                        <History size={18} strokeWidth={2} />
                    </button>
                    {hookData && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleNew}
                                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-stone-900 px-5 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-95 shadow-sm"
                            >
                                <Save size={16} /> Lưu
                            </button>
                        </div>
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
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" />
                                    Lịch sử Hooks
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedHooks.length} mục</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedHooks.length === 0 ? (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">
                                    Chưa có Hook nào được lưu.
                                </div>
                            ) : (
                                savedHooks.map((item) => (
                                    <div
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleLoad(item)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoad(item)}
                                        className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <p className="line-clamp-1 text-sm font-medium text-stone-900">{item.input.topic}</p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id);
                                                }}
                                                className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                aria-label="Xóa"
                                            >
                                                <Trash2 size={14} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        <p className="text-xs font-normal text-stone-400">
                                            {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 text-lg font-medium tracking-tight text-stone-900">
                        <Zap size={20} strokeWidth={1.25} className="text-stone-400" />
                        Thông tin Hook
                    </h2>
                    <p className="mb-6 text-sm font-normal text-stone-500">
                        AI phân tích insight và tạo hooks theo công thức chuyên sâu.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Topic / Sản phẩm *</label>
                            <input
                                type="text"
                                {...register('topic', { required: 'Vui lòng nhập topic' })}
                                placeholder="VD: Kem chống nắng kiềm dầu"
                                className={inputClass}
                            />
                            {errors.topic && (
                                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.topic.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Target Audience *</label>
                            <textarea
                                rows={3}
                                {...register('targetAudience', { required: 'Vui lòng nhập target audience' })}
                                placeholder="VD: Nữ 18-35 tuổi, da dầu, hay trang điểm, sống tại thành thị..."
                                className={`${inputClass} resize-none`}
                            />
                            {errors.targetAudience && (
                                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.targetAudience.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">USP / Features (Tùy chọn)</label>
                            <textarea
                                rows={2}
                                {...register('usp')}
                                placeholder="VD: SPF 50+, không gây bết dính, kiềm dầu 8h, chiết xuất trà xanh..."
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Platform (Tùy chọn)</label>
                            <input
                                type="text"
                                {...register('platform')}
                                placeholder="VD: TikTok, Facebook, Instagram, Email..."
                                className={inputClass}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {thinkingStep || 'Đang xử lý...'}
                                </>
                            ) : (
                                <>
                                    <Zap className="h-5 w-5" />
                                    Tạo Hooks
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!hookData && !isGenerating && (
                        <div className="flex min-h-[360px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80">
                                <Zap size={30} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-sm font-normal text-center max-w-xs">
                                Nhập thông tin sản phẩm và nhấn "Tạo Hooks" để bắt đầu
                            </p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex min-h-[360px] flex-col items-center justify-center">
                            <div className="relative mb-8 h-14 w-14">
                                <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-800 animate-spin"></div>
                            </div>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">{thinkingStep}</p>
                            <p className="text-sm font-normal text-stone-400">Đang áp dụng Hook Matrix...</p>
                        </div>
                    )}

                    {hookData && !isGenerating && (
                        <div className="space-y-5">
                            {/* Insight Analysis Card */}
                            <div className="rounded-2xl border border-stone-200 p-5">
                                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                    Insight Analysis
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
                                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Pain Point</div>
                                        <p className="text-sm text-stone-800 leading-relaxed">{hookData.analysis.identified_pain_point}</p>
                                    </div>
                                    <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
                                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Desire</div>
                                        <p className="text-sm text-stone-800 leading-relaxed">{hookData.analysis.identified_desire}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 rounded-2xl border border-stone-200 bg-stone-50/50 p-1.5">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-white font-semibold text-stone-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-stone-200'
                                                : 'font-medium text-stone-500 hover:bg-white hover:text-stone-700'
                                        }`}
                                    >
                                        <tab.icon size={15} strokeWidth={1.25} />
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                                activeTab === tab.id
                                                    ? 'bg-stone-100 text-stone-600'
                                                    : 'bg-stone-200 text-stone-500'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Hook Cards */}
                            <div className="space-y-3">
                                {activeTab === 'video' && hookData.hooks.video_shorts?.map((hook, idx) => (
                                    <div key={idx} className="rounded-2xl border border-stone-200 p-5 transition-all hover:border-stone-300">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 mb-1">{hook.style}</div>
                                                <h4 className="text-lg font-bold text-stone-900 leading-snug">{hook.hook_text}</h4>
                                            </div>
                                            <CopyButton text={hook.hook_text} />
                                        </div>

                                        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 mb-3">
                                            <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                                                <Eye size={12} strokeWidth={1.25} />
                                                Visual Cue
                                            </div>
                                            <p className="text-sm text-stone-700 leading-relaxed">{hook.visual_cue}</p>
                                        </div>

                                        <PsychologyTag trigger={hook.psychology_trigger} />
                                    </div>
                                ))}

                                {activeTab === 'web' && hookData.hooks.landing_page?.map((hook, idx) => (
                                    <div key={idx} className="rounded-2xl border border-stone-200 p-5 transition-all hover:border-stone-300">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 mb-1">{hook.style}</div>
                                                <h4 className="text-lg font-bold text-stone-900 leading-snug">{hook.headline}</h4>
                                            </div>
                                            <CopyButton text={hook.headline} />
                                        </div>
                                        <p className="mb-3 text-sm text-stone-600 leading-relaxed">{hook.sub_headline}</p>
                                        <PsychologyTag trigger={hook.psychology_trigger} />
                                    </div>
                                ))}

                                {activeTab === 'email' && hookData.hooks.email?.map((hook, idx) => (
                                    <div key={idx} className="rounded-2xl border border-stone-200 p-5 transition-all hover:border-stone-300">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 mb-1">{hook.style}</div>
                                                <h4 className="text-lg font-bold text-stone-900 leading-snug">{hook.subject_line}</h4>
                                            </div>
                                            <CopyButton text={hook.subject_line} />
                                        </div>
                                        <p className="mb-3 text-sm italic text-stone-500">Preview: {hook.preview_text}</p>
                                        <PsychologyTag trigger={hook.psychology_trigger} />
                                    </div>
                                ))}

                                {activeTab === 'social' && hookData.hooks.social_post?.map((hook, idx) => (
                                    <div key={idx} className="rounded-2xl border border-stone-200 p-5 transition-all hover:border-stone-300">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 mb-1">{hook.style}</div>
                                                <h4 className="text-lg font-bold text-stone-900 leading-snug">{hook.hook_text}</h4>
                                            </div>
                                            <CopyButton text={hook.hook_text} />
                                        </div>
                                        <div className="mb-3 flex flex-wrap gap-1">
                                            {hook.hashtag_suggestion?.split(' ').map((tag, i) => (
                                                <span key={i} className="text-xs font-medium text-stone-500">{tag}</span>
                                            ))}
                                        </div>
                                        <PsychologyTag trigger={hook.psychology_trigger} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default HookGenerator;
