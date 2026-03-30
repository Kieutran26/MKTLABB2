import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Zap, Video, Mail, Globe, MessageSquare, Sparkles, Copy, Save, History, Trash2, X, Plus, Loader2, Eye, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { HookGeneratorResult, VideoHook, LandingPageHook, EmailHook, SocialHook } from '../types';
import { generateHooks, HookInput } from '../services/geminiService';
import { HookService, SavedHookSet } from '../services/hookService';
import toast, { Toaster } from 'react-hot-toast';

type TabType = 'video' | 'social' | 'email' | 'web';

const PSYCHOLOGY_TRIGGERS: Record<string, { label: string; color: string; description: string }> = {
    'Fear of Loss': { label: 'Sợ mất mát', color: 'red', description: 'Kích hoạt nỗi sợ bỏ lỡ cơ hội hoặc mất điều quan trọng' },
    'Risk Reversal': { label: 'Đảo ngược rủi ro', color: 'green', description: 'Loại bỏ rào cản tâm lý bằng cam kết/bảo hành' },
    'Curiosity Gap': { label: 'Khoảng trống tò mò', color: 'purple', description: 'Tạo cảm giác thiếu thông tin, muốn tìm hiểu thêm' },
    'Contrarian': { label: 'Đi ngược xu hướng', color: 'orange', description: 'Thách thức niềm tin phổ biến để gây chú ý' },
    'Social Proof': { label: 'Bằng chứng xã hội', color: 'blue', description: 'Sử dụng hành vi đám đông để tạo niềm tin' },
    'Urgency': { label: 'Tính cấp bách', color: 'red', description: 'Tạo áp lực thời gian để thúc đẩy hành động' },
    'Exclusivity': { label: 'Độc quyền', color: 'amber', description: 'Cảm giác đặc biệt, chỉ dành cho số ít' },
    'Authority': { label: 'Uy tín chuyên gia', color: 'indigo', description: 'Sử dụng uy tín để tạo niềm tin' },
};

const PsychologyTag = ({ trigger }: { trigger: string }) => {
    const info = PSYCHOLOGY_TRIGGERS[trigger] || { label: trigger, color: 'slate', description: '' };
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative inline-block">
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full cursor-help bg-${info.color}-50 text-${info.color}-600 border border-${info.color}-200`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <Info size={10} />
                {info.label}
            </span>
            {showTooltip && (
                <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl z-50">
                    <div className="font-bold mb-1">{trigger}</div>
                    <div className="text-slate-300">{info.description}</div>
                    <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
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
        toast.success('Đã copy!', { icon: '📋', duration: 1500 });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-50 text-green-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
        >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
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
                toast.success('Hooks đã được tạo!', {
                    icon: '⚡',
                    style: { borderRadius: '12px', background: '#F0FDF4', color: '#166534', fontWeight: 600, fontSize: '14px' }
                });
            } else {
                toast.error('Không thể tạo hooks.');
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
        if (!hookData || !currentInput) return;

        const newSet: SavedHookSet = {
            id: Date.now().toString(),
            input: currentInput,
            data: hookData,
            timestamp: Date.now()
        };

        const success = await HookService.saveHookSet(newSet);

        if (success) {
            const hooks = await HookService.getHookSets();
            setSavedHooks(hooks);
            toast.success('Đã lưu!', { icon: '💾' });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleNew = () => {
        setHookData(null);
        setCurrentInput(null);
        reset();
        toast.success('Sẵn sàng tạo hooks mới!', { icon: '✨' });
    };

    const handleLoad = (item: SavedHookSet) => {
        setHookData(item.data);
        setCurrentInput(item.input);
        reset(item.input);
        setShowHistory(false);
        toast.success('Đã tải!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await HookService.deleteHookSet(id);

        if (success) {
            const hooks = await HookService.getHookSets();
            setSavedHooks(hooks);
            toast.success('Đã xóa!', { icon: '🗑️' });
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const tabs = [
        { id: 'video' as TabType, label: 'Video', icon: Video, count: hookData?.hooks.video_shorts?.length || 0 },
        { id: 'social' as TabType, label: 'Social', icon: MessageSquare, count: hookData?.hooks.social_post?.length || 0 },
        { id: 'email' as TabType, label: 'Email', icon: Mail, count: hookData?.hooks.email?.length || 0 },
        { id: 'web' as TabType, label: 'Web', icon: Globe, count: hookData?.hooks.landing_page?.length || 0 },
    ];

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                        <Zap size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Hook Generator</h1>
                        <p className="text-xs text-slate-500 font-medium">The Hook Matrix • Tâm lý học hành vi</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                    >
                        <History size={16} /> Lịch sử ({savedHooks.length})
                    </button>
                    {hookData && (
                        <>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all text-sm"
                            >
                                <Save size={16} /> Lưu
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Form */}
                <div className="w-[380px] bg-white border-r border-slate-200 p-8 overflow-y-auto">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <h2 className="text-base font-bold text-slate-800">Thông tin Hook</h2>
                        </div>
                        <p className="text-sm text-slate-500 pl-9">AI sẽ phân tích insight và tạo hooks theo công thức chuyên sâu.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pl-2">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Topic / Sản phẩm</label>
                            <input
                                {...register('topic', { required: 'Vui lòng nhập topic' })}
                                placeholder="VD: Kem chống nắng kiềm dầu"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                            />
                            {errors.topic && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.topic.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
                            <textarea
                                {...register('targetAudience', { required: 'Vui lòng nhập target audience' })}
                                placeholder="VD: Nữ 18-35 tuổi, da dầu, hay trang điểm, sống tại thành thị..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none"
                            />
                            {errors.targetAudience && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.targetAudience.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">USP / Features (Tùy chọn)</label>
                            <textarea
                                {...register('usp')}
                                placeholder="VD: SPF 50+, không gây bết dính, kiềm dầu 8h, chiết xuất trà xanh..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Platform (Tùy chọn)</label>
                            <input
                                {...register('platform')}
                                placeholder="VD: TikTok, Facebook, Instagram, Email..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-[14px] shadow-lg shadow-amber-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang xử lý...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Tạo Hooks
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* HISTORY SIDEBAR */}
                {showHistory && (
                    <div className="w-[320px] bg-white border-r border-slate-200 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <History size={18} className="text-amber-500" />
                                Lịch sử
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        {savedHooks.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <History size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Chưa có lịch sử</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedHooks.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-amber-500/30 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => handleLoad(item)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.input.topic}</h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT: Results */}
                <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
                    {!hookData && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                                <Zap size={32} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600">Hook Generator</p>
                            <p className="text-sm text-slate-400 mt-1">Nhập thông tin để tạo hooks chuyên nghiệp</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-16 h-16 mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-amber-600 mb-2 uppercase tracking-wide">{thinkingStep}</p>
                            <p className="text-sm text-slate-400">Đang áp dụng Hook Matrix...</p>
                        </div>
                    )}

                    {hookData && !isGenerating && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Analysis Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">🔍 Insight Analysis</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                        <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Pain Point</div>
                                        <p className="text-sm text-red-800 font-medium">{hookData.analysis.identified_pain_point}</p>
                                    </div>
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                        <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">Desire</div>
                                        <p className="text-sm text-green-800 font-medium">{hookData.analysis.identified_desire}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id
                                            ? 'bg-amber-500 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200'
                                                }`}>{tab.count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Hook Cards */}
                            <div className="space-y-4">
                                {activeTab === 'video' && hookData.hooks.video_shorts?.map((hook, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{hook.style}</span>
                                                <h4 className="text-xl font-black text-slate-800 mt-1">{hook.hook_text}</h4>
                                            </div>
                                            <CopyButton text={hook.hook_text} />
                                        </div>

                                        {/* Visual Cue - Highlighted */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Eye size={14} className="text-amber-600" />
                                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Visual Cue</span>
                                            </div>
                                            <p className="text-sm text-amber-800 font-medium">{hook.visual_cue}</p>
                                        </div>

                                        <PsychologyTag trigger={hook.psychology_trigger} />
                                    </div>
                                ))}

                                {activeTab === 'web' && hookData.hooks.landing_page?.map((hook, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{hook.style}</span>
                                                <h4 className="text-xl font-black text-slate-800 mt-1">{hook.headline}</h4>
                                            </div>
                                            <CopyButton text={hook.headline} />
                                        </div>
                                        <p className="text-sm text-slate-600 mb-4">{hook.sub_headline}</p>
                                        <PsychologyTag trigger={hook.psychology_trigger} />
                                    </div>
                                ))}

                                {activeTab === 'email' && hookData.hooks.email?.map((hook, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{hook.style}</span>
                                                <h4 className="text-xl font-black text-slate-800 mt-1">{hook.subject_line}</h4>
                                            </div>
                                            <CopyButton text={hook.subject_line} />
                                        </div>
                                        <p className="text-sm text-slate-500 italic mb-4">Preview: {hook.preview_text}</p>
                                        <PsychologyTag trigger={hook.psychology_trigger} />
                                    </div>
                                ))}

                                {activeTab === 'social' && hookData.hooks.social_post?.map((hook, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{hook.style}</span>
                                                <h4 className="text-xl font-black text-slate-800 mt-1">{hook.hook_text}</h4>
                                            </div>
                                            <CopyButton text={hook.hook_text} />
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {hook.hashtag_suggestion?.split(' ').map((tag, i) => (
                                                <span key={i} className="text-xs text-blue-600 font-medium">{tag}</span>
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
        </div>
    );
};

export default HookGenerator;
