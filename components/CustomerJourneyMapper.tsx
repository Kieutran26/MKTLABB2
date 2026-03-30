import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Map, Sparkles, Loader2, Save, History, Trash2, X, Plus, ArrowRight, Copy, CheckCircle2, Lightbulb, Target, Hammer, BarChart3, ChevronDown, ChevronUp, Zap, Brain, ShieldAlert, HelpCircle, Megaphone, AlertTriangle, XCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { JourneyService, SavedJourney } from '../services/journeyService';
import { JourneyStage } from '../types';
import { generateCustomerJourney, JourneyMapperInput, validateJourneyInput, JourneyValidationResult } from '../services/geminiService';
import toast, { Toaster } from 'react-hot-toast';

const STAGE_EMOJIS = ['🤯', '🤔', '🤩', '🔄', '🥰'];
const STAGE_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', light: 'bg-blue-100' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500', light: 'bg-amber-100' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500', light: 'bg-emerald-100' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500', light: 'bg-purple-100' },
    { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', accent: 'bg-pink-500', light: 'bg-pink-100' },
];

const PSYCHOLOGICAL_DRIVERS = {
    'FOMO': { color: 'bg-orange-100 text-orange-700', icon: '⏰' },
    'Trust': { color: 'bg-blue-100 text-blue-700', icon: '🛡️' },
    'Greed': { color: 'bg-yellow-100 text-yellow-700', icon: '💰' },
    'Pride': { color: 'bg-purple-100 text-purple-700', icon: '👑' },
    'Fear': { color: 'bg-red-100 text-red-700', icon: '😨' },
    'Curiosity': { color: 'bg-cyan-100 text-cyan-700', icon: '🔍' },
    'Security': { color: 'bg-green-100 text-green-700', icon: '🔒' },
    'Belonging': { color: 'bg-indigo-100 text-indigo-700', icon: '🤝' },
};

// Validation Result Modal
const ValidationModal = ({
    result,
    onConfirm,
    onCancel
}: {
    result: JourneyValidationResult;
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    const statusConfig = {
        PASS: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-500', title: '✅ Dữ liệu hợp lệ' },
        WARNING: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', title: '⚠️ Cảnh báo' },
        FAIL: { bg: 'bg-rose-50', border: 'border-rose-200', icon: XCircle, iconColor: 'text-rose-500', title: '❌ Dữ liệu không hợp lệ' },
    };
    const config = statusConfig[result.validation_status];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${config.bg} ${config.border} border rounded-2xl p-6 max-w-md w-full shadow-xl`}>
                <div className="flex items-center gap-3 mb-4">
                    <Icon size={28} className={config.iconColor} />
                    <h3 className="text-lg font-bold text-slate-800">{config.title}</h3>
                </div>

                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{result.message_to_user}</p>

                {result.corrected_suggestion && (
                    <div className="bg-white rounded-lg p-3 mb-4 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Đề xuất sửa:</span>
                        <p className="text-sm font-medium text-slate-700">{result.corrected_suggestion}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    {result.validation_status === 'FAIL' ? (
                        <button
                            onClick={onCancel}
                            className="flex-1 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                        >
                            Quay lại sửa
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} />
                                {result.validation_status === 'WARNING' ? 'Tiếp tục' : 'Tạo Journey Map'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const ContentIdeaCard = ({ idea }: { idea: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(idea);
        setCopied(true);
        toast.success('Đã copy!', { icon: '📋', duration: 1500 });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 hover:shadow-sm transition-all">
            <Lightbulb size={12} className="text-amber-500 shrink-0" />
            <span className="text-xs text-slate-600 flex-1 line-clamp-1">{idea}</span>
            <button
                onClick={handleCopy}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-green-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            </button>
        </div>
    );
};

// 5-Stage Journey Card
const JourneyStageCard = ({ stage, index, isLast }: { stage: JourneyStage; index: number; isLast: boolean }) => {
    const colors = STAGE_COLORS[index] || STAGE_COLORS[0];
    const emoji = STAGE_EMOJIS[index] || '📍';
    const [expanded, setExpanded] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const hasNewFormat = stage.mindset && stage.barriers && stage.solutions;

    return (
        <div className="flex items-stretch">
            <div className={`flex-1 ${colors.bg} ${colors.border} border rounded-2xl p-4 min-w-[320px] max-w-[360px]`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1">
                        <h3 className={`text-sm font-bold ${colors.text}`}>{stage.stage}</h3>
                        {stage.stage_goal && (
                            <p className="text-[10px] text-slate-500 mt-0.5">{stage.stage_goal}</p>
                        )}
                    </div>
                </div>

                {/* Layer 1: Customer Mindset */}
                {hasNewFormat && stage.mindset ? (
                    <div className="bg-white/70 rounded-xl p-3 mb-2 border border-white">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Brain size={10} className="text-purple-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mindset</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-start gap-2">
                                <span className="text-[9px] font-bold text-slate-400 w-12 shrink-0">Doing:</span>
                                <span className="text-[10px] text-slate-600">{stage.mindset.doing}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-[9px] font-bold text-slate-400 w-12 shrink-0">Feeling:</span>
                                <span className="text-[10px] text-slate-600">{stage.mindset.feeling}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-[9px] font-bold text-slate-400 w-12 shrink-0">Thinking:</span>
                                <span className="text-[10px] text-slate-600 italic">"{stage.mindset.thinking}"</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/70 rounded-xl p-3 mb-2 border border-white">
                        <p className="text-xs text-slate-600 italic">"{stage.customer_mindset}"</p>
                    </div>
                )}

                {/* Layer 2: Barriers (Red) */}
                {hasNewFormat && stage.barriers && stage.barriers.length > 0 && (
                    <div className="bg-rose-50 rounded-xl p-2.5 mb-2 border border-rose-200">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <ShieldAlert size={10} className="text-rose-500" />
                            <span className="text-[9px] font-bold text-rose-500 uppercase">Brick Wall</span>
                        </div>
                        <div className="space-y-0.5">
                            {stage.barriers.slice(0, 3).map((barrier, idx) => (
                                <div key={idx} className="flex items-start gap-1">
                                    <span className="text-rose-400 text-[9px]">✕</span>
                                    <span className="text-[10px] text-rose-700">{barrier}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Layer 3: Solutions (Green) */}
                {hasNewFormat && stage.solutions && stage.solutions.length > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-2.5 mb-2 border border-emerald-200">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Hammer size={10} className="text-emerald-500" />
                            <span className="text-[9px] font-bold text-emerald-500 uppercase">Hammer</span>
                        </div>
                        <div className="space-y-0.5">
                            {stage.solutions.slice(0, 3).map((solution, idx) => (
                                <div key={idx} className="flex items-start gap-1">
                                    <span className="text-emerald-400 text-[9px]">✓</span>
                                    <span className="text-[10px] text-emerald-700">{solution}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Items with Psychological Drivers */}
                {stage.action_items && stage.action_items.length > 0 && (
                    <div className="mb-2">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="flex items-center gap-1.5 w-full justify-between mb-1.5"
                        >
                            <div className="flex items-center gap-1.5">
                                <Megaphone size={10} className="text-indigo-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Action Items ({stage.action_items.length})</span>
                            </div>
                            {showActions ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                        </button>
                        {showActions && (
                            <div className="space-y-2">
                                {stage.action_items.map((item: any, idx: number) => {
                                    const driver = PSYCHOLOGICAL_DRIVERS[item.psychological_driver as keyof typeof PSYCHOLOGICAL_DRIVERS] || PSYCHOLOGICAL_DRIVERS.Curiosity;
                                    return (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${driver.color}`}>
                                                    {driver.icon} {item.psychological_driver}
                                                </span>
                                                <span className="text-[9px] text-slate-400">{item.format}</span>
                                            </div>
                                            <div className={`text-[10px] font-bold ${colors.text} mb-1`}>{item.touchpoint}</div>
                                            <p className="text-[10px] text-slate-600 italic">"{item.trigger_message}"</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* KPIs */}
                {hasNewFormat && stage.kpis && stage.kpis.length > 0 && (
                    <div className="mb-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <BarChart3 size={10} className="text-indigo-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">KPIs</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {stage.kpis.slice(0, 4).map((kpi, idx) => (
                                <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-lg p-1.5">
                                    <div className="text-[9px] font-bold text-indigo-700">{kpi.metric}</div>
                                    <div className="text-[10px] font-bold text-indigo-900">{kpi.target}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Message */}
                <div className={`${colors.accent} text-white rounded-xl p-2.5 mb-2`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <Target size={10} />
                        <span className="text-[9px] font-bold uppercase opacity-80">Key Message</span>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed">{stage.key_message}</p>
                </div>

                {/* Critical Action */}
                {hasNewFormat && stage.critical_action && (
                    <button className={`w-full py-2 ${colors.light} ${colors.text} rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity mb-2`}>
                        <Zap size={12} />
                        {stage.critical_action}
                    </button>
                )}

                {/* Content Ideas (Collapsible) */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 w-full justify-between"
                >
                    <div className="flex items-center gap-1.5">
                        <Lightbulb size={10} className="text-amber-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Content Ideas ({stage.content_ideas?.length || 0})</span>
                    </div>
                    {expanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                </button>
                {expanded && stage.content_ideas && (
                    <div className="space-y-1 mt-2">
                        {stage.content_ideas.map((idea, idx) => (
                            <ContentIdeaCard key={idx} idea={idea} />
                        ))}
                    </div>
                )}
            </div>

            {/* Arrow Connector */}
            {!isLast && (
                <div className="flex items-center px-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <ArrowRight size={14} className="text-slate-400" />
                    </div>
                </div>
            )}
        </div>
    );
};

const CustomerJourneyMapper: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<JourneyMapperInput>({
        defaultValues: {
            priceSegment: 'mid',
            involvementLevel: 'medium'
        }
    });
    const [journeyData, setJourneyData] = useState<JourneyStage[] | null>(null);
    const [currentInput, setCurrentInput] = useState<JourneyMapperInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [showHistory, setShowHistory] = useState(false);
    const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);

    // Validation state
    const [validationResult, setValidationResult] = useState<JourneyValidationResult | null>(null);
    const [pendingInput, setPendingInput] = useState<JourneyMapperInput | null>(null);

    const priceSegment = watch('priceSegment');

    React.useEffect(() => {
        const loadJourneys = async () => {
            const journeys = await JourneyService.getJourneys();
            setSavedJourneys(journeys);
        };
        loadJourneys();
    }, []);

    // Step 1: Validate input first
    const onSubmit = async (data: JourneyMapperInput) => {
        setIsValidating(true);
        setThinkingStep('Đang kiểm tra dữ liệu...');

        try {
            const validation = await validateJourneyInput(data);
            setValidationResult(validation);
            setPendingInput(data);

            // Auto-proceed if PASS
            if (validation.validation_status === 'PASS') {
                await generateJourneyMap(data);
            }
            // Show modal for WARNING or FAIL
        } catch (error) {
            console.error(error);
            toast.error('Lỗi kiểm tra dữ liệu');
        } finally {
            setIsValidating(false);
            setThinkingStep('');
        }
    };

    // Step 2: Generate journey map after validation
    const generateJourneyMap = async (data: JourneyMapperInput) => {
        setValidationResult(null);
        setIsGenerating(true);
        setJourneyData(null);
        setCurrentInput(data);

        try {
            const result = await generateCustomerJourney(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setJourneyData(result);
                toast.success(`Journey Map ${result.length} giai đoạn đã sẵn sàng!`, {
                    icon: '🗺️',
                    style: { borderRadius: '12px', background: '#F0FDF4', color: '#166534', fontWeight: 600, fontSize: '14px' }
                });
            } else {
                toast.error('Không thể tạo Journey Map.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi.');
            console.error(error);
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleValidationConfirm = () => {
        if (pendingInput) {
            generateJourneyMap(pendingInput);
        }
    };

    const handleValidationCancel = () => {
        setValidationResult(null);
        setPendingInput(null);
    };

    const handleSave = async () => {
        if (!journeyData || !currentInput) return;

        const newJourney: SavedJourney = {
            id: Date.now().toString(),
            input: currentInput,
            data: journeyData,
            timestamp: Date.now()
        };

        const success = await JourneyService.saveJourney(newJourney);

        if (success) {
            const journeys = await JourneyService.getJourneys();
            setSavedJourneys(journeys);
            toast.success('Đã lưu!', { icon: '💾' });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleNew = () => {
        setJourneyData(null);
        setCurrentInput(null);
        reset({ priceSegment: 'mid', involvementLevel: 'medium' });
        toast.success('Sẵn sàng tạo Journey Map mới!', { icon: '✨' });
    };

    const handleLoad = (item: SavedJourney) => {
        setJourneyData(item.data);
        setCurrentInput(item.input);
        reset(item.input);
        setShowHistory(false);
        toast.success('Đã tải!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await JourneyService.deleteJourney(id);
        if (success) {
            const journeys = await JourneyService.getJourneys();
            setSavedJourneys(journeys);
            toast.success('Đã xóa!', { icon: '🗑️' });
        }
    };

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            {/* Validation Modal */}
            {validationResult && validationResult.validation_status !== 'PASS' && (
                <ValidationModal
                    result={validationResult}
                    onConfirm={handleValidationConfirm}
                    onCancel={handleValidationCancel}
                />
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Map size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-800">Customer Journey Mapper V3</h1>
                        <p className="text-[10px] text-slate-500 font-medium">5-Stage Model • Psychological Drivers • Action Items</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all text-xs"
                    >
                        <History size={14} /> ({savedJourneys.length})
                    </button>
                    {journeyData && (
                        <>
                            <button onClick={handleNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all text-xs">
                                <Plus size={14} /> Mới
                            </button>
                            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-all text-xs">
                                <Save size={14} /> Lưu
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '360px 280px 1fr' : '360px 1fr' }}>
                {/* LEFT: Form */}
                <div className="bg-white border-r border-slate-200 p-6 overflow-y-auto h-full">
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                            <h2 className="text-sm font-bold text-slate-800">Deep Dive Context</h2>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-7">Càng chi tiết, AI càng tạo strategy cụ thể.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pl-1">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Sản phẩm / Thương hiệu *</label>
                            <input
                                {...register('productBrand', { required: 'Bắt buộc' })}
                                placeholder="VD: Phần mềm KiotViet"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                            {errors.productBrand && <p className="text-[10px] text-red-500 mt-1">{errors.productBrand.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Audience *</label>
                            <textarea
                                {...register('targetAudience', { required: 'Bắt buộc' })}
                                placeholder="VD: Chủ shop 25-45 tuổi, quản lý bằng Excel..."
                                rows={2}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                            />
                        </div>

                        {/* NEW: USP */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700">USP (Điểm bán độc đáo)</label>
                                <HelpCircle size={12} className="text-slate-400" />
                            </div>
                            <input
                                {...register('usp')}
                                placeholder="VD: Giao 2h, Công nghệ Đức độc quyền"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Dùng trong Consideration để đánh đối thủ</p>
                        </div>

                        {/* NEW: Pain Point */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pain Point khách hàng</label>
                            <input
                                {...register('painPoint')}
                                placeholder="VD: Sợ kem trộn không rõ nguồn gốc"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Dùng để tạo Hook trong Awareness</p>
                        </div>

                        {/* Competitor */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Đối thủ cạnh tranh</label>
                            <input
                                {...register('competitor')}
                                placeholder="VD: Sapo, Haravan, MISA"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        {/* Price Segment */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Phân khúc giá</label>
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                                {[
                                    { value: 'low', label: 'Low', desc: 'Impulse' },
                                    { value: 'mid', label: 'Mid', desc: 'Cân nhắc' },
                                    { value: 'high', label: 'High', desc: 'Consultative' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setValue('priceSegment', opt.value as any)}
                                        className={`py-2 rounded-lg text-center transition-all ${priceSegment === opt.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        <div className="text-xs font-bold">{opt.label}</div>
                                        <div className="text-[9px] text-slate-400">{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Mục tiêu chuyển đổi *</label>
                            <input
                                {...register('conversionGoal', { required: 'Bắt buộc' })}
                                placeholder="VD: Đăng ký dùng thử 14 ngày"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Kênh tiếp cận *</label>
                            <input
                                {...register('channels', { required: 'Bắt buộc' })}
                                placeholder="VD: Facebook, TikTok, Google Ads"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating || isValidating}
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isValidating ? (
                                <>
                                    <ShieldCheck size={16} className="animate-pulse" />
                                    <span className="text-sm">Đang kiểm tra dữ liệu...</span>
                                </>
                            ) : isGenerating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang xử lý...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Tạo 5-Stage Journey Map
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* HISTORY SIDEBAR */}
                {showHistory && (
                    <div className="bg-white border-r border-slate-200 p-4 overflow-y-auto h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-800">Lịch sử</h3>
                            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X size={16} className="text-slate-400" />
                            </button>
                        </div>
                        {savedJourneys.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <History size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Chưa có lịch sử</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {savedJourneys.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-indigo-500/30 cursor-pointer"
                                        onClick={() => handleLoad(item)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.input.productBrand}</h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={12} className="text-red-500" />
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-slate-400">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT: Journey Map */}
                <div className="p-6 overflow-auto bg-slate-50 h-full">
                    {!journeyData && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                                <Map size={28} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-base font-bold text-slate-600">5-Stage Journey Map</p>
                            <p className="text-xs text-slate-400 mt-1">Awareness → Consideration → Conversion → Retention → Loyalty</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-14 h-14 mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-indigo-600 mb-1">{thinkingStep}</p>
                            <p className="text-xs text-slate-400">Đang xây dựng Psychological Battle Plan...</p>
                        </div>
                    )}

                    {journeyData && !isGenerating && (
                        <div className="min-w-max">
                            {/* Stage Legend */}
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                                {['Awareness', 'Consideration', 'Conversion', 'Retention', 'Loyalty'].map((name, idx) => (
                                    <div key={name} className="flex items-center gap-1.5">
                                        <span className="text-lg">{STAGE_EMOJIS[idx]}</span>
                                        <span className={`text-[10px] font-bold ${STAGE_COLORS[idx].text}`}>{name}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Horizontal Flow */}
                            <div className="flex items-stretch gap-0">
                                {journeyData.map((stage, idx) => (
                                    <JourneyStageCard
                                        key={idx}
                                        stage={stage}
                                        index={idx}
                                        isLast={idx === journeyData.length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerJourneyMapper;
