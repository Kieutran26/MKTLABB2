import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
    Target,
    Loader2,
    History,
    Save,
    Diamond,
    ChevronRight,
    Pencil,
    Plus,
    Check,
    Calendar,
    BarChart3,
    TrendingUp,
    Trash2,
    Sparkles,
} from 'lucide-react';
import { PorterAnalysisInput, PorterAnalysisResult } from '../types';
import { generatePorterAnalysis } from '../services/geminiService';
import { PorterService, SavedPorterAnalysis } from '../services/porterService';
import toast, { Toaster } from 'react-hot-toast';
import FeatureHeader from './FeatureHeader';
import { WS_PRIMARY_CTA, WS_SEGMENT_SHELL, wsHistoryToggleClass, wsWorkspaceTabClass } from './workspace-toolbar-classes';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';
import { StpOptimizerField } from './stp-optimizer-field';
import EditorialPorterReport from './EditorialPorterReport';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-stone-400';
const textareaClass = `${inputClass} min-h-[100px] resize-y`;

const PORTER_DEFAULTS: PorterAnalysisInput = {
    nganh_hang: '',
    thi_truong: '',
    vi_the: '',
    mo_hinh: '',
    san_pham_usp: '',
    doi_thu: '',
    nha_cung_cap: '',
    khach_hang: '',
    san_pham_thay_the: '',
    rao_can_gia_nhap: '',
    muc_tieu: '',
    ke_hoach: '',
};

const FORM_TABS = [
    { id: 1 as const, line: 'NHÓM 1', sub: 'Bối cảnh ngành & DN' },
    { id: 2 as const, line: 'NHÓM 2', sub: 'Dữ liệu 5 lực lượng' },
    { id: 3 as const, line: 'NHÓM 3', sub: 'Mục tiêu phân tích' },
];

function migrateLegacyPorterInput(raw: unknown): PorterAnalysisInput {
    const o = raw as Record<string, unknown>;
    if (o && typeof o.nganh_hang === 'string') {
        return o as unknown as PorterAnalysisInput;
    }
    const industry = typeof o?.industry === 'string' ? o.industry : '';
    const location = typeof o?.location === 'string' ? o.location : '';
    const mo = typeof o?.businessModel === 'string' ? o.businessModel : '';
    const pos = typeof o?.userPosition === 'string' ? o.userPosition : '';
    const comps = Array.isArray(o?.competitors) ? (o.competitors as string[]).filter(Boolean).join(', ') : '';
    return {
        ...PORTER_DEFAULTS,
        nganh_hang: industry,
        thi_truong: location,
        vi_the: pos,
        mo_hinh: mo,
        doi_thu: comps,
    };
}

const PorterAnalyzer: React.FC = () => {
    const { user, tier } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [formTab, setFormTab] = useState<1 | 2 | 3>(1);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<PorterAnalysisInput>({ defaultValues: PORTER_DEFAULTS });

    const [analysisData, setAnalysisData] = useState<PorterAnalysisResult | null>(null);
    const [currentInput, setCurrentInput] = useState<PorterAnalysisInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedAnalyses, setSavedAnalyses] = useState<SavedPorterAnalysis[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const watchG1 = watch(['nganh_hang', 'thi_truong', 'vi_the', 'mo_hinh', 'san_pham_usp']);
    const filledG1 = watchG1.filter(Boolean).length;
    const watchG2 = watch(['doi_thu', 'nha_cung_cap', 'khach_hang', 'san_pham_thay_the', 'rao_can_gia_nhap']);
    const filledG2 = watchG2.filter(Boolean).length;
    const watchG3 = watch(['muc_tieu', 'ke_hoach']);
    const filledG3 = watchG3.filter(Boolean).length;

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        void loadUser();
        void loadSavedAnalyses();
    }, [user]);

    useEffect(() => {
        if (activeTab !== 'vault' || !currentBrand) return;
        const b = currentBrand;
        const parts = [b.strategy.mission, b.strategy.vision].filter(Boolean).join(' · ');
        setValue('nganh_hang', (b as { industry?: string }).industry || '');
        setValue('san_pham_usp', parts.slice(0, 800));
    }, [activeTab, currentBrand, setValue]);

    const loadSavedAnalyses = async () => {
        const analyses = await PorterService.getAnalyses();
        setSavedAnalyses(analyses);
    };

    const onSubmit = async (data: PorterAnalysisInput) => {
        setIsGenerating(true);
        setAnalysisData(null);
        const vaultNote =
            activeTab === 'vault' && currentBrand
                ? `[Brand Vault — ${currentBrand.identity.name}. Tầm nhìn: ${currentBrand.strategy.vision}]\n`
                : '';
        const payload: PorterAnalysisInput = {
            ...data,
            nganh_hang: vaultNote + data.nganh_hang,
        };
        setCurrentInput(data);
        try {
            const result = await generatePorterAnalysis(payload, setThinkingStep);
            if (result) {
                setAnalysisData(result);
                toast.success('Hoàn tất phân tích Porter');
            }
        } catch {
            toast.error('Phân tích thất bại');
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!analysisData || !currentInput) {
            toast.error('Chưa có dữ liệu để lưu');
            return;
        }
        const newAnalysis: SavedPorterAnalysis = {
            id: crypto.randomUUID(),
            input: currentInput,
            data: analysisData,
            timestamp: Date.now(),
        };
        const saved = await PorterService.saveAnalysis(newAnalysis);
        if (saved) {
            await loadSavedAnalyses();
            setIsSaved(true);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            savedTimerRef.current = setTimeout(() => setIsSaved(false), 2500);
        } else {
            toast.error('Lưu thất bại');
        }
    };

    const handleLoad = (analysis: SavedPorterAnalysis) => {
        setAnalysisData(analysis.data);
        const migratedInput = migrateLegacyPorterInput(analysis.input);
        setCurrentInput(migratedInput);
        reset(migratedInput);
        setShowHistory(false);
        setFormTab(1);
    };

    const handleCreatePlan = () => {
        reset(PORTER_DEFAULTS);
        setAnalysisData(null);
        setCurrentInput(null);
        setFormTab(1);
        setShowHistory(false);
    };

    const handleDeleteAnalysis = async (id: string) => {
        if (window.confirm('Bạn có chắc muốn xóa bản phân tích này?')) {
            const success = await PorterService.deleteAnalysis(id);
            if (success) {
                toast.success('Đã xóa bản phân tích.');
                await loadSavedAnalyses();
            }
        }
    };

    const historyTitle = (inp: PorterAnalysisInput) =>
        inp.nganh_hang?.trim() || inp.thi_truong?.trim() || 'Phân tích Porter';

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-right" />
            <FeatureHeader
                icon={Target}
                eyebrow="COMPETITIVE INTENSITY ANALYSIS"
                title="Porter's Precision"
                subline="Phân tích 5 lực lượng cạnh tranh — form chuẩn STP Optimizer."
            >
                <div className={WS_SEGMENT_SHELL}>
                    <button type="button" onClick={() => setActiveTab('manual')} className={wsWorkspaceTabClass(activeTab === 'manual')}>
                        <Pencil size={14} /> Thủ công
                    </button>
                    <button type="button" onClick={() => setActiveTab('vault')} className={wsWorkspaceTabClass(activeTab === 'vault')}>
                        <Diamond size={14} className={profile?.subscription_tier === 'promax' ? 'fill-amber-500 text-amber-500' : 'text-stone-400'} />
                        Brand Vault
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className={wsHistoryToggleClass(showHistory)}
                    aria-pressed={showHistory}
                    title={`Lịch sử (${savedAnalyses.length})`}
                    aria-label={`Mở lịch sử phân tích Porter, ${savedAnalyses.length} bản đã lưu`}
                >
                    <History size={17} strokeWidth={1.5} />
                </button>
                <button
                    type="button"
                    onClick={handleCreatePlan}
                    disabled={isGenerating}
                    className={`${WS_PRIMARY_CTA} disabled:pointer-events-none disabled:opacity-50`}
                    title="Làm mới form và bắt đầu phân tích mới"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    Tạo kế hoạch
                </button>
            </FeatureHeader>

            <div
                className={`flex min-h-0 flex-1 flex-col pb-3 sm:pb-4 lg:pb-4 ${
                    analysisData && !showHistory
                        ? 'px-0 pt-0 sm:pt-0 lg:pt-0 overflow-hidden'
                        : 'px-4 pt-5 sm:pt-6 lg:px-8 lg:pt-7 xl:px-10 overflow-y-auto'
                }`}
            >
                {showHistory ? (
                    <div className="flex-1 overflow-y-auto px-0 pb-2">
                        <div className={`${cardClass} p-6 md:p-8`}>
                            <h2 className="mb-8 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                <History size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                Lịch sử phân tích Porter ({savedAnalyses.length})
                            </h2>
                            {savedAnalyses.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Sparkles size={40} strokeWidth={1.25} className="mx-auto mb-4 text-stone-300" />
                                    <p className="text-base font-normal text-stone-600">Chưa có bản phân tích nào</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowHistory(false)}
                                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
                                    >
                                        <Plus size={17} strokeWidth={1.25} /> Tạo mới
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {savedAnalyses.map((m) => {
                                        const totalThreat = m.data?.total_threat_score ?? 0;
                                        const verdict = m.data?.overall_verdict ?? '';
                                        return (
                                            <div
                                                key={m.id}
                                                role="button"
                                                tabIndex={0}
                                                className="cursor-pointer rounded-2xl border border-stone-200/90 p-5 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                                onClick={() => handleLoad(m)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleLoad(m)}
                                            >
                                                <div className="mb-3 flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="line-clamp-2 font-medium text-stone-900">
                                                            {historyTitle(m.input)}
                                                        </h3>
                                                        <p className="mt-1 line-clamp-2 text-sm font-normal text-stone-500">
                                                            {verdict || '—'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void handleDeleteAnalysis(m.id);
                                                        }}
                                                        className="shrink-0 rounded-lg p-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                        aria-label="Xóa bản phân tích"
                                                    >
                                                        <Trash2 size={16} strokeWidth={1.25} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs font-normal text-stone-500">
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp size={12} strokeWidth={1.25} />
                                                        Threat {totalThreat}/50
                                                    </span>
                                                    <span className="flex min-w-0 max-w-full items-center gap-1">
                                                        <BarChart3 size={12} strokeWidth={1.25} className="shrink-0" />
                                                        <span className="truncate">
                                                            5 lực lượng
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="mt-3 border-t border-stone-100 pt-3 text-xs font-normal text-stone-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} strokeWidth={1.25} aria-hidden />
                                                        {new Date(m.timestamp).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : !analysisData ? (
                        <div className={`${cardClass} flex flex-col overflow-hidden`}>
                            {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                                <div className="space-y-6 p-8 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm">
                                        <Diamond size={32} />
                                    </div>
                                    <h2 className="text-xl font-medium">Porter Intensity Pro</h2>
                                    <p className="text-sm leading-relaxed text-stone-500">
                                        Phân tích 5 lực bám Brand Vault — nâng cấp Pro Max để đồng bộ DNA thương hiệu.
                                    </p>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 font-medium text-white"
                                    >
                                        Access Pro Max <ChevronRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                                    {activeTab === 'vault' && profile?.subscription_tier === 'promax' && (
                                        <div className="border-b border-stone-200 bg-stone-50/50 px-5 py-4 shrink-0">
                                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Nguồn Brand Vault</p>
                                            <BrandSelector />
                                        </div>
                                    )}

                                    <div className="flex shrink-0 border-b border-stone-200 bg-stone-50/50">
                                        {FORM_TABS.map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setFormTab(t.id)}
                                                className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-3 text-center transition-colors ${
                                                    formTab === t.id
                                                        ? 'border-b-2 border-stone-900 text-stone-900'
                                                        : 'border-b-2 border-transparent text-stone-400 hover:text-stone-600'
                                                }`}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t.line}</span>
                                                <span className="hidden text-[9px] font-medium leading-tight text-stone-500 sm:block">{t.sub}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-5 md:p-6">
                                        {formTab === 1 && (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-900">
                                                            1
                                                        </div>
                                                        <h2 className="text-base font-medium tracking-tight text-stone-900">Bối cảnh ngành &amp; doanh nghiệp</h2>
                                                    </div>
                                                    <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 sm:pt-1">
                                                        Đã điền {filledG1}/5 · Bắt buộc 4
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                                    <StpOptimizerField title="Ngành hàng cụ thể" badge="required">
                                                        <input {...register('nganh_hang', { required: 'Bắt buộc' })} className={inputClass} placeholder="Ngành / vertical" />
                                                        {errors.nganh_hang && <p className="mt-1 text-[11px] text-rose-600">{errors.nganh_hang.message}</p>}
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Thị trường địa lý" badge="required">
                                                        <input {...register('thi_truong', { required: 'Bắt buộc' })} className={inputClass} placeholder="Địa bàn / quốc gia" />
                                                        {errors.thi_truong && <p className="mt-1 text-[11px] text-rose-600">{errors.thi_truong.message}</p>}
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Vị thế hiện tại" badge="required">
                                                        <input {...register('vi_the', { required: 'Bắt buộc' })} className={inputClass} placeholder="Vị thế của bạn" />
                                                        {errors.vi_the && <p className="mt-1 text-[11px] text-rose-600">{errors.vi_the.message}</p>}
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Mô hình kinh doanh" badge="important">
                                                        <input {...register('mo_hinh')} className={inputClass} placeholder="Mô hình vận hành" />
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Sản phẩm / USP" badge="required" fullWidth>
                                                        <textarea {...register('san_pham_usp', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Điểm mạnh & khác biệt…" />
                                                        {errors.san_pham_usp && <p className="mt-1 text-[11px] text-rose-600">{errors.san_pham_usp.message}</p>}
                                                    </StpOptimizerField>
                                                </div>
                                            </div>
                                        )}

                                        {formTab === 2 && (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-900">
                                                            2
                                                        </div>
                                                        <h2 className="text-base font-medium tracking-tight text-stone-900">Dữ liệu 5 lực lượng</h2>
                                                    </div>
                                                    <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 sm:pt-1">
                                                        Đã điền {filledG2}/5 · Bắt buộc 3
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                                    <StpOptimizerField title="Đối thủ trực tiếp" badge="required">
                                                        <textarea {...register('doi_thu', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Liệt kê đối thủ…" />
                                                        {errors.doi_thu && <p className="mt-1 text-[11px] text-rose-600">{errors.doi_thu.message}</p>}
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Nhà cung cấp" badge="important">
                                                        <textarea {...register('nha_cung_cap')} className={textareaClass} placeholder="Mức độ phụ thuộc…" />
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Khách hàng" badge="required">
                                                        <textarea {...register('khach_hang', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Hành vi & quyền lực khách hàng…" />
                                                        {errors.khach_hang && <p className="mt-1 text-[11px] text-rose-600">{errors.khach_hang.message}</p>}
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Sản phẩm thay thế" badge="required">
                                                        <textarea {...register('san_pham_thay_the', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Giải pháp thay thế…" />
                                                        {errors.san_pham_thay_the && <p className="mt-1 text-[11px] text-rose-600">{errors.san_pham_thay_the.message}</p>}
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Rào cản gia nhập" badge="important" fullWidth>
                                                        <textarea {...register('rao_can_gia_nhap')} className={textareaClass} placeholder="Khó khăn cho người mới…" />
                                                    </StpOptimizerField>
                                                </div>
                                            </div>
                                        )}

                                        {formTab === 3 && (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-900">
                                                            3
                                                        </div>
                                                        <h2 className="text-base font-medium tracking-tight text-stone-900">Mục tiêu & Kế hoạch</h2>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                                    <StpOptimizerField title="Vấn đề hiện tại" fullWidth>
                                                        <textarea {...register('muc_tieu')} className={textareaClass} placeholder="Vấn đề cần tập trung…" />
                                                    </StpOptimizerField>
                                                    <StpOptimizerField title="Kế hoạch 12 tháng" badge="required" fullWidth>
                                                        <textarea {...register('ke_hoach', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Mục tiêu chiến lược…" />
                                                        {errors.ke_hoach && <p className="mt-1 text-[11px] text-rose-600">{errors.ke_hoach.message}</p>}
                                                    </StpOptimizerField>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex shrink-0 border-t border-stone-100 bg-white px-5 py-4 ${formTab === 1 ? 'justify-end' : 'justify-between'}`}>
                                        {formTab !== 1 && (
                                            <button type="button" onClick={() => setFormTab((formTab - 1) as any)} className="rounded-full border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-600">
                                                Quay lại
                                            </button>
                                        )}
                                        {formTab !== 3 ? (
                                            <button type="button" onClick={() => setFormTab((formTab + 1) as any)} className="rounded-full bg-stone-950 px-6 py-2.5 text-sm font-medium text-white">
                                                Kế tiếp
                                            </button>
                                        ) : (
                                            <button type="submit" disabled={isGenerating} className="flex h-10 min-w-[240px] items-center justify-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-medium text-white shadow-md disabled:opacity-50">
                                                {isGenerating && <Loader2 size={18} className="animate-spin" />}
                                                Phân tích Porter's Precision
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col animate-in fade-in slide-in-from-right-4 overflow-hidden duration-500 relative bg-[#faf9f6]">
                            <div className="flex p-4 shrink-0 justify-end z-10">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 backdrop-blur-sm transition-all duration-300 shadow-sm ${
                                        isSaved
                                            ? 'border-emerald-300/80 bg-emerald-50/80'
                                            : 'border-stone-200 bg-white/80 hover:border-stone-300 hover:bg-white'
                                    }`}
                                    aria-label="Lưu kết quả"
                                >
                                    <span
                                        className="relative inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center"
                                        aria-hidden
                                    >
                                        <span
                                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSaved ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                                        >
                                            <Check size={17} strokeWidth={1.15} className="text-emerald-500" />
                                        </span>
                                        <span
                                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSaved ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                                        >
                                            <Save size={17} strokeWidth={1.15} className="text-stone-500" />
                                        </span>
                                    </span>
                                    <span className={`text-[13px] font-extralight tracking-wide transition-colors duration-300 ${isSaved ? 'text-emerald-600' : 'text-stone-600'}`}>
                                        {isSaved ? 'Đã lưu' : 'Lưu'}
                                    </span>
                                </button>
                            </div>
                            <div className="flex-1 min-h-0 -mt-14 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
                                <EditorialPorterReport
                                    data={analysisData!}
                                    nganh_hang={currentInput?.nganh_hang}
                                    thi_truong={currentInput?.thi_truong}
                                    subscriptionTier={
                                        (profile?.subscription_tier as 'free' | 'pro' | 'promax') ?? tier
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
        </div>
    );
};

export default PorterAnalyzer;
