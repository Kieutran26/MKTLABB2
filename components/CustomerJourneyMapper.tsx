import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Map, Sparkles, Loader2, Save, History, Trash2, X, Plus, ArrowRight, Copy, CheckCircle2, Lightbulb, Target, Hammer, BarChart3, ChevronDown, ChevronUp, Zap, Brain, ShieldAlert, HelpCircle, Megaphone, AlertTriangle, XCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { JourneyService, SavedJourney } from '../services/journeyService';
import { JourneyStage } from '../types';
import { generateCustomerJourney, JourneyMapperInput, validateJourneyInput, JourneyValidationResult } from '../services/geminiService';
import toast, { Toaster } from 'react-hot-toast';
import FeatureHeader from './FeatureHeader';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const textareaClass = `${inputClass} resize-none`;

const STAGE_LABELS = ['Awareness', 'Consideration', 'Conversion', 'Retention', 'Loyalty'];

const STAGE_COLORS = [
    { bg: 'bg-white', border: 'border-stone-200/90 border-l-[3px] border-l-stone-800', text: 'text-stone-900', accent: 'bg-stone-900', light: 'bg-stone-100' },
    { bg: 'bg-white', border: 'border-stone-200/90 border-l-[3px] border-l-amber-600/45', text: 'text-stone-900', accent: 'bg-stone-900', light: 'bg-stone-100' },
    { bg: 'bg-white', border: 'border-stone-200/90 border-l-[3px] border-l-emerald-600/45', text: 'text-stone-900', accent: 'bg-stone-900', light: 'bg-stone-100' },
    { bg: 'bg-white', border: 'border-stone-200/90 border-l-[3px] border-l-sky-600/45', text: 'text-stone-900', accent: 'bg-stone-900', light: 'bg-stone-100' },
    { bg: 'bg-white', border: 'border-stone-200/90 border-l-[3px] border-l-rose-500/45', text: 'text-stone-900', accent: 'bg-stone-900', light: 'bg-stone-100' },
];

const PSYCHOLOGICAL_DRIVERS: Record<string, { color: string }> = {
    FOMO: { color: 'border border-stone-200 bg-stone-50 text-stone-800' },
    Trust: { color: 'border border-stone-200 bg-stone-50 text-stone-800' },
    Greed: { color: 'border border-stone-200 bg-stone-50 text-stone-800' },
    Pride: { color: 'border border-stone-200 bg-stone-50 text-stone-800' },
    Fear: { color: 'border border-stone-200 bg-stone-50 text-stone-800' },
    Curiosity: { color: 'border border-stone-200 bg-stone-50 text-stone-800' },
    Security: { color: 'border border-stone-200 bg-stone-50 text-stone-800' },
    Belonging: { color: 'border border-stone-200 bg-stone-50 text-stone-800' },
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
        PASS: { bg: 'bg-emerald-50/80', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-600', title: 'Dữ liệu hợp lệ' },
        WARNING: { bg: 'bg-amber-50/80', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-600', title: 'Cảnh báo' },
        FAIL: { bg: 'bg-rose-50/80', border: 'border-rose-200', icon: XCircle, iconColor: 'text-rose-600', title: 'Dữ liệu không hợp lệ' },
    };
    const config = statusConfig[result.validation_status];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-xl ${config.border} ${config.bg}`}>
                <div className="mb-4 flex items-center gap-3">
                    <Icon size={26} strokeWidth={1.25} className={config.iconColor} />
                    <h3 className="font-sans text-lg font-medium tracking-tight text-stone-900">{config.title}</h3>
                </div>

                <p className="mb-4 text-sm font-normal leading-relaxed text-stone-700">{result.message_to_user}</p>

                {result.corrected_suggestion && (
                    <div className="mb-4 rounded-xl border border-stone-200 bg-white p-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Đề xuất sửa</span>
                        <p className="text-sm font-medium text-stone-800">{result.corrected_suggestion}</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {result.validation_status === 'FAIL' ? (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 rounded-full bg-stone-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                        >
                            Quay lại sửa
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 rounded-full border border-stone-200 bg-white py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-stone-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                            >
                                <Sparkles size={16} strokeWidth={1.25} />
                                {result.validation_status === 'WARNING' ? 'Tiếp tục' : 'Tạo Journey Map'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const ContentIdeaCard: React.FC<{ idea: string }> = ({ idea }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(idea);
        setCopied(true);
        toast.success('Đã copy!', { icon: '📋', duration: 1500 });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group flex items-center gap-2 rounded-lg border border-stone-200/90 bg-white px-3 py-2 transition-all hover:border-stone-300">
            <Lightbulb size={12} strokeWidth={1.25} className="shrink-0 text-stone-400" />
            <span className="line-clamp-1 flex-1 text-xs font-normal text-stone-700">{idea}</span>
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
const JourneyStageCard: React.FC<{ stage: JourneyStage; index: number; isLast: boolean }> = ({
    stage,
    index,
    isLast,
}) => {
    const colors = STAGE_COLORS[index] || STAGE_COLORS[0];
    const [expanded, setExpanded] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const hasNewFormat = stage.mindset && stage.barriers && stage.solutions;

    return (
        <div className="flex items-stretch">
            <div className={`flex min-w-[320px] max-w-[360px] flex-1 flex-col rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${colors.bg} ${colors.border}`}>
                <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700">
                        {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-semibold tracking-tight ${colors.text}`}>{stage.stage}</h3>
                        {stage.stage_goal && (
                            <p className="mt-0.5 text-[10px] font-normal text-stone-500">{stage.stage_goal}</p>
                        )}
                    </div>
                </div>

                {/* Layer 1: Customer Mindset */}
                {hasNewFormat && stage.mindset ? (
                    <div className="mb-2 rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                        <div className="mb-2 flex items-center gap-1.5">
                            <Brain size={10} strokeWidth={1.25} className="text-stone-500" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">Mindset</span>
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
                    <div className="mb-2 rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                        <p className="text-xs font-normal italic text-stone-700">&ldquo;{stage.customer_mindset}&rdquo;</p>
                    </div>
                )}

                {/* Layer 2: Barriers (Red) */}
                {hasNewFormat && stage.barriers && stage.barriers.length > 0 && (
                    <div className="mb-2 rounded-xl border border-rose-100 bg-rose-50/50 p-2.5">
                        <div className="mb-1.5 flex items-center gap-1.5">
                            <ShieldAlert size={10} strokeWidth={1.25} className="text-rose-600/80" />
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-rose-900/80">Brick Wall</span>
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
                    <div className="mb-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
                        <div className="mb-1.5 flex items-center gap-1.5">
                            <Hammer size={10} strokeWidth={1.25} className="text-emerald-700/70" />
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-900/80">Hammer</span>
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
                                <Megaphone size={10} strokeWidth={1.25} className="text-stone-500" />
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-stone-500">Action Items ({stage.action_items.length})</span>
                            </div>
                            {showActions ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                        </button>
                        {showActions && (
                            <div className="space-y-2">
                                {stage.action_items.map((item: any, idx: number) => {
                                    const driver = PSYCHOLOGICAL_DRIVERS[item.psychological_driver as keyof typeof PSYCHOLOGICAL_DRIVERS] || PSYCHOLOGICAL_DRIVERS.Curiosity;
                                    return (
                                        <div key={idx} className="rounded-lg border border-stone-200/90 bg-white p-2.5">
                                            <div className="mb-1.5 flex items-center gap-2">
                                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${driver.color}`}>
                                                    {item.psychological_driver}
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
                            <BarChart3 size={10} strokeWidth={1.25} className="text-stone-500" />
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-stone-500">KPIs</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {stage.kpis.slice(0, 4).map((kpi, idx) => (
                                <div key={idx} className="rounded-lg border border-stone-200 bg-stone-50/80 p-1.5">
                                    <div className="text-[9px] font-semibold text-stone-700">{kpi.metric}</div>
                                    <div className="text-[10px] font-semibold text-stone-900">{kpi.target}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Message */}
                <div className={`${colors.accent} text-white rounded-xl p-2.5 mb-2`}>
                    <div className="mb-1 flex items-center gap-1.5">
                        <Target size={10} strokeWidth={1.25} />
                        <span className="text-[9px] font-semibold uppercase tracking-wide opacity-90">Key Message</span>
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
                        <Lightbulb size={10} strokeWidth={1.25} className="text-stone-400" />
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-stone-500">Content Ideas ({stage.content_ideas?.length || 0})</span>
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
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-stone-50">
                        <ArrowRight size={14} strokeWidth={1.25} className="text-stone-400" />
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
                    style: { borderRadius: '12px', background: '#fafaf9', border: '1px solid #e7e5e4' }
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
        <div className="flex min-h-full flex-col bg-[#FCFDFC] font-sans">
            <Toaster position="top-center" />

            {validationResult && validationResult.validation_status !== 'PASS' && (
                <ValidationModal
                    result={validationResult}
                    onConfirm={handleValidationConfirm}
                    onCancel={handleValidationCancel}
                />
            )}

            <FeatureHeader
                icon={Map}
                eyebrow="CUSTOMER EXPERIENCE & JOURNEY DESIGN"
                title="Customer Journey Mapper V3"
                subline="Phân tích tâm lý & Hành trình khách hàng 5 giai đoạn."
            >
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex size-10 items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-medium transition-all ${
                            showHistory
                                ? 'bg-stone-900 text-white shadow-md'
                                : 'border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50'
                            }`}
                        title={`Lịch sử (${savedJourneys.length})`}
                        aria-label={`Mở lịch sử hành trình, ${savedJourneys.length} hành trình đã lưu`}
                    >
                        <History size={17} strokeWidth={1.5} />
                    </button>
                {journeyData && (
                    <>
                        <button
                            type="button"
                            onClick={handleNew}
                            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
                        >
                            <Plus size={17} strokeWidth={1.5} /> Tạo mới
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-95"
                        >
                            <Save size={17} strokeWidth={2} /> Lưu kết quả
                        </button>
                    </>
                )}
            </FeatureHeader>

            <div
                className="grid flex-1 gap-4 p-4 md:p-6 md:pt-5"
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,400px) 1fr' : 'minmax(0,400px) 1fr' }}
            >
                {showHistory && (
                    <div className={`${cardClass} flex flex-col h-fit sticky top-6`}>
                        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                            <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                <History size={18} strokeWidth={1.25} className="text-stone-400" />
                                Lịch sử
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowHistory(false)}
                                className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                aria-label="Đóng"
                            >
                                <X size={18} strokeWidth={1.25} />
                            </button>
                        </div>
                        <div className="space-y-2 p-4">
                            {savedJourneys.length === 0 ? (
                                <div className="py-10 text-center text-sm text-stone-400">
                                    <History size={24} strokeWidth={1.25} className="mx-auto mb-2 opacity-40" />
                                    Chưa có lịch sử
                                </div>
                            ) : (
                                savedJourneys.map((item) => (
                                    <div
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                        onClick={() => handleLoad(item)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoad(item)}
                                    >
                                        <div className="mb-1 flex items-start justify-between gap-2">
                                            <h4 className="line-clamp-1 text-sm font-medium text-stone-900">{item.input.productBrand}</h4>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                aria-label="Xóa"
                                            >
                                                <Trash2 size={14} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-stone-400">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} h-fit border-r-0 md:border-r md:border-sky-200/40 md:pr-1`}>
                    <div className="p-6 md:p-8">
                        <div className="mb-6">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-700">
                                    1
                                </span>
                                <h2 className="font-sans text-lg font-medium tracking-tight text-stone-900">Deep Dive Context</h2>
                            </div>
                            <p className="pl-9 text-sm font-normal text-stone-500">Càng chi tiết, AI càng tạo strategy cụ thể.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Sản phẩm / Thương hiệu *</label>
                                <input
                                    {...register('productBrand', { required: 'Bắt buộc' })}
                                    placeholder="VD: Phần mềm KiotViet"
                                    className={inputClass}
                                />
                                {errors.productBrand && <p className="mt-1 text-xs text-red-600">{errors.productBrand.message}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Target Audience *</label>
                                <textarea
                                    {...register('targetAudience', { required: 'Bắt buộc' })}
                                    placeholder="VD: Chủ shop 25-45 tuổi, quản lý bằng Excel..."
                                    rows={2}
                                    className={textareaClass}
                                />
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-medium text-stone-800">USP (Điểm bán độc đáo)</label>
                                    <HelpCircle size={14} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                </div>
                                <input
                                    {...register('usp')}
                                    placeholder="VD: Giao 2h, Công nghệ Đức độc quyền"
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs font-normal text-stone-400">Dùng trong Consideration để đánh đối thủ</p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Pain Point khách hàng</label>
                                <input
                                    {...register('painPoint')}
                                    placeholder="VD: Sợ kem trộn không rõ nguồn gốc"
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs font-normal text-stone-400">Dùng để tạo Hook trong Awareness</p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Đối thủ cạnh tranh</label>
                                <input
                                    {...register('competitor')}
                                    placeholder="VD: Sapo, Haravan, MISA"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Phân khúc giá</label>
                                <div className="grid grid-cols-3 gap-1 rounded-xl border border-stone-200 bg-stone-100/80 p-1">
                                    {[
                                        { value: 'low', label: 'Low', desc: 'Impulse' },
                                        { value: 'mid', label: 'Mid', desc: 'Cân nhắc' },
                                        { value: 'high', label: 'High', desc: 'Consultative' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setValue('priceSegment', opt.value as 'low' | 'mid' | 'high')}
                                            className={`rounded-lg py-2 text-center transition-all ${priceSegment === opt.value
                                                ? 'border border-stone-200 bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                                                : 'text-stone-500 hover:text-stone-700'
                                                }`}
                                        >
                                            <div className="text-xs font-semibold">{opt.label}</div>
                                            <div className="text-[10px] font-normal text-stone-400">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Mục tiêu chuyển đổi *</label>
                                <input
                                    {...register('conversionGoal', { required: 'Bắt buộc' })}
                                    placeholder="VD: Đăng ký dùng thử 14 ngày"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Kênh tiếp cận *</label>
                                <input
                                    {...register('channels', { required: 'Bắt buộc' })}
                                    placeholder="VD: Facebook, TikTok, Google Ads"
                                    className={inputClass}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isGenerating || isValidating}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isValidating ? (
                                    <>
                                        <ShieldCheck size={18} strokeWidth={1.25} className="animate-pulse" />
                                        <span>Đang kiểm tra dữ liệu...</span>
                                    </>
                                ) : isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" strokeWidth={1.25} />
                                        <span>{thinkingStep || 'Đang xử lý...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} strokeWidth={1.25} />
                                        Tạo 5-Stage Journey Map
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className={`${cardClass} h-fit overflow-x-auto`}>
                    <div className="p-6 md:p-8">
                        {!journeyData && !isGenerating && (
                            <div className="flex min-h-[280px] flex-col items-center justify-center text-stone-400">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                    <Map size={28} strokeWidth={1.25} className="text-stone-300" />
                                </div>
                                <p className="text-base font-medium text-stone-700">5-Stage Journey Map</p>
                                <p className="mt-1 text-center text-sm font-normal text-stone-500">
                                    Awareness → Consideration → Conversion → Retention → Loyalty
                                </p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="flex min-h-[280px] flex-col items-center justify-center">
                                <div className="relative mb-6 h-14 w-14">
                                    <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
                                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-stone-800" />
                                </div>
                                <p className="mb-1 text-sm font-medium text-stone-800">{thinkingStep}</p>
                                <p className="text-xs font-normal text-stone-500">Đang xây dựng Psychological Battle Plan...</p>
                            </div>
                        )}

                        {journeyData && !isGenerating && (
                            <div className="min-w-max">
                                <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-stone-200 pb-3">
                                    {STAGE_LABELS.map((name, idx) => (
                                        <div key={name} className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-[10px] font-semibold text-stone-600">
                                                {idx + 1}
                                            </span>
                                            <span className={`text-[10px] font-semibold ${STAGE_COLORS[idx]?.text ?? 'text-stone-800'}`}>{name}</span>
                                        </div>
                                    ))}
                                </div>

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
        </div>
    );
};

export default CustomerJourneyMapper;
