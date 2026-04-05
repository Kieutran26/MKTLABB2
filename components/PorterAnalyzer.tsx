import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import {
    Target,
    Sparkles,
    Loader2,
    Swords,
    DoorOpen,
    Users,
    Truck,
    Shuffle,
    History,
    Save,
    Diamond,
    ChevronRight,
    Pencil,
    Plus,
    TrendingUp,
    TrendingDown,
    Minus,
    Info,
} from 'lucide-react';
import { PorterAnalysisInput, PorterAnalysisResult } from '../types';
import { generatePorterAnalysis } from '../services/geminiService';
import { PorterService, SavedPorterAnalysis } from '../services/porterService';
import toast, { Toaster } from 'react-hot-toast';
import FeatureHeader from './FeatureHeader';
import { WS_PRIMARY_CTA, WS_SEGMENT_SHELL, wsHistoryToggleClass, wsWorkspaceTabClass } from './workspace-toolbar-classes';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';
import { StpOptimizerField } from './stp-optimizer-field';

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

const FORCE_ICONS: Record<string, LucideIcon> = {
    'Competitive Rivalry': Swords,
    'Threat of New Entrants': DoorOpen,
    'Bargaining Power of Buyers': Users,
    'Bargaining Power of Suppliers': Truck,
    'Threat of Substitutes': Shuffle,
};

const STATUS_COLORS: Record<string, string> = {
    Low: 'text-emerald-600 bg-emerald-50',
    Medium: 'text-amber-600 bg-amber-50',
    High: 'text-orange-600 bg-orange-50',
    Extreme: 'text-red-600 bg-red-50',
};

const TREND_ICONS: Record<string, { icon: LucideIcon; color: string; label: string }> = {
    Increasing: { icon: TrendingUp, color: 'text-red-500', label: 'Tăng' },
    Stable: { icon: Minus, color: 'text-stone-400', label: 'Ổn định' },
    Decreasing: { icon: TrendingDown, color: 'text-emerald-500', label: 'Giảm' },
};

interface TooltipState {
    visible: boolean;
    content: string;
    x: number;
    y: number;
}

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
    const { user } = useAuth();
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
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, content: '', x: 0, y: 0 });
    const [expandedCard, setExpandedCard] = useState<number | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const showTooltip = (content: string, event: React.MouseEvent) => {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setTooltip({
            visible: true,
            content,
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
        });
    };

    const hideTooltip = () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 });
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
                hideTooltip();
            }
        };
        if (tooltip.visible) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [tooltip.visible]);

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
            toast.success('Đã lưu');
        } else {
            toast.error('Lưu thất bại');
        }
    };

    const handleLoad = (analysis: SavedPorterAnalysis) => {
        setAnalysisData(analysis.data);
        setCurrentInput(migrateLegacyPorterInput(analysis.input));
        reset(migrateLegacyPorterInput(analysis.input));
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

    const radarData =
        analysisData?.forces.map((force) => {
            const shortLabels: Record<string, string> = {
                'Competitive Rivalry': 'Cạnh tranh',
                'Threat of New Entrants': 'Đối thủ mới',
                'Bargaining Power of Buyers': 'Người mua',
                'Bargaining Power of Suppliers': 'Nhà cung cấp',
                'Threat of Substitutes': 'Sp thay thế',
            };
            return {
                force: shortLabels[force.name] || force.name.replace('Bargaining Power of ', '').replace('Threat of ', ''),
                score: force.score,
                fullMark: 10,
            };
        }) || [];

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
                className="grid min-h-0 flex-1 gap-6 overflow-auto p-6"
                style={{ gridTemplateColumns: showHistory ? '260px minmax(0,1fr)' : 'minmax(0,1fr)' }}
            >
                {showHistory && (
                    <div className={`${cardClass} min-h-0 space-y-3 overflow-y-auto bg-stone-50/30 p-4`}>
                        <h3 className="mb-4 px-2 text-[10px] font-bold uppercase text-stone-400">Lịch sử</h3>
                        {savedAnalyses.map((m) => (
                            <div
                                key={m.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleLoad(m)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLoad(m)}
                                className="cursor-pointer rounded-xl border border-stone-100 bg-white p-4 transition-all hover:border-stone-300"
                            >
                                <div className="truncate text-sm font-medium text-stone-900">{historyTitle(m.input)}</div>
                                <div className="mt-2 text-[10px] text-stone-400">
                                    {m.data.overall_verdict} • {new Date(m.timestamp).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mx-auto flex min-h-0 min-w-0 w-full max-w-[1178px] flex-col">
                <div className={`${cardClass} flex min-h-0 flex-1 flex-col overflow-hidden`}>
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
                        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
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

                            <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
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
                                            <StpOptimizerField
                                                title="Ngành hàng cụ thể"
                                                badge="required"
                                                subtitle="Porter's Five Forces khác nhau hoàn toàn giữa các ngành — càng cụ thể càng chính xác."
                                                guideline="Tên ngành chi tiết, không chỉ là «kinh doanh» hay «dịch vụ»."
                                                example="VD: Fintech cho vay tiêu dùng · Chuỗi F&B cao cấp · SaaS HR."
                                            >
                                                <input {...register('nganh_hang', { required: 'Bắt buộc' })} className={inputClass} placeholder="Ngành / vertical" />
                                                {errors.nganh_hang && <p className="mt-1 text-[11px] text-rose-600">{errors.nganh_hang.message}</p>}
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Thị trường địa lý"
                                                badge="required"
                                                subtitle="Cường độ cạnh tranh và rào cản gia nhập khác nhau theo từng thị trường."
                                                guideline="Thị trường đang hoặc sắp hoạt động."
                                                example="VD: Việt Nam · TP.HCM · Đông Nam Á."
                                            >
                                                <input {...register('thi_truong', { required: 'Bắt buộc' })} className={inputClass} placeholder="Địa bàn / quốc gia" />
                                                {errors.thi_truong && <p className="mt-1 text-[11px] text-rose-600">{errors.thi_truong.message}</p>}
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Vị thế hiện tại"
                                                badge="required"
                                                subtitle="New Entrant vs. Incumbent có chiến lược đối phó 5 lực hoàn toàn khác nhau."
                                                guideline="Bạn đang ở đâu trong ngành hiện tại?"
                                                example="VD: New Entrant · Challenger · Market Leader · Niche Player."
                                            >
                                                <input {...register('vi_the', { required: 'Bắt buộc' })} className={inputClass} placeholder="Vị thế của bạn" />
                                                {errors.vi_the && <p className="mt-1 text-[11px] text-rose-600">{errors.vi_the.message}</p>}
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Mô hình kinh doanh"
                                                badge="important"
                                                subtitle="B2B/B2C ảnh hưởng trực tiếp đến bargaining power của khách hàng và nhà cung cấp."
                                                guideline="Cách tạo ra và phân phối giá trị."
                                                example="VD: B2C marketplace · B2B SaaS · D2C · Franchise."
                                            >
                                                <input {...register('mo_hinh')} className={inputClass} placeholder="Mô hình vận hành" />
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Sản phẩm / Dịch vụ & USP"
                                                badge="required"
                                                fullWidth
                                                subtitle="AI cần biết bạn bán gì và điểm mạnh thực sự để đánh giá sức cạnh tranh trong từng lực."
                                                guideline="Mô tả ngắn sản phẩm/dịch vụ và điểm khác biệt so với đối thủ."
                                                example='VD: "Nền tảng HR SaaS cho SME, giá 500k/tháng, triển khai trong 1 ngày…"'
                                            >
                                                <textarea {...register('san_pham_usp', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Mô tả & USP…" />
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
                                            <StpOptimizerField
                                                title="Đối thủ trực tiếp"
                                                badge="required"
                                                subtitle="Không có dữ liệu đối thủ thật → AI không thể đánh giá cường độ cạnh tranh thực tế."
                                                guideline="Tên 2–5 đối thủ chính và điểm mạnh của họ (nếu biết)."
                                                example="VD: Base.vn (tính năng), MISA (thương hiệu), FastWork (giá)."
                                            >
                                                <textarea {...register('doi_thu', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Liệt kê đối thủ…" />
                                                {errors.doi_thu && <p className="mt-1 text-[11px] text-rose-600">{errors.doi_thu.message}</p>}
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Nhà cung cấp chính"
                                                badge="important"
                                                subtitle="Supplier power = khả năng họ tăng giá hoặc cắt hợp đồng ảnh hưởng đến bạn."
                                                guideline="Bạn phụ thuộc vào ai để vận hành? Mức độ phụ thuộc cao hay thấp?"
                                                example="VD: AWS (cloud, khó chuyển) · nhà in bao bì (nhiều lựa chọn)."
                                            >
                                                <textarea {...register('nha_cung_cap')} className={textareaClass} placeholder="Nhà cung cấp & mức phụ thuộc…" />
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Đặc điểm khách hàng"
                                                badge="required"
                                                subtitle="Buyer power phụ thuộc số lựa chọn thay thế và chi phí chuyển đổi."
                                                guideline="Khách hàng của bạn là ai? Họ có dễ chuyển sang đối thủ không?"
                                                example="VD: SME 10–100 nhân sự, nhạy cảm giá, data dễ export."
                                            >
                                                <textarea {...register('khach_hang', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Chân dung & hành vi mua…" />
                                                {errors.khach_hang && <p className="mt-1 text-[11px] text-rose-600">{errors.khach_hang.message}</p>}
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Sản phẩm thay thế"
                                                badge="required"
                                                subtitle="Threat of substitutes — thứ làm khách không cần sản phẩm của bạn."
                                                guideline="Giải pháp thay thế đang tồn tại hoặc có thể xuất hiện."
                                                example="VD: Excel tự làm, outsource, Google Sheets + Zalo quản lý thủ công."
                                            >
                                                <textarea
                                                    {...register('san_pham_thay_the', { required: 'Bắt buộc' })}
                                                    className={textareaClass}
                                                    placeholder="Substitutes…"
                                                />
                                                {errors.san_pham_thay_the && (
                                                    <p className="mt-1 text-[11px] text-rose-600">{errors.san_pham_thay_the.message}</p>
                                                )}
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Rào cản gia nhập ngành"
                                                badge="important"
                                                fullWidth
                                                subtitle="Rào cản thấp → nhiều đối thủ mới → cạnh tranh khốc liệt."
                                                guideline="Vốn, pháp lý, công nghệ, thương hiệu… ngăn người mới vào ra sao?"
                                                example="VD: Vốn ban đầu thấp, không giấy phép đặc biệt, nhưng 12–18 tháng để build trust SME."
                                            >
                                                <textarea {...register('rao_can_gia_nhap')} className={textareaClass} placeholder="Rào cản gia nhập…" />
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
                                                <h2 className="text-base font-medium tracking-tight text-stone-900">Mục tiêu phân tích</h2>
                                            </div>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 sm:pt-1">
                                                Đã điền {filledG3}/2 · Bắt buộc 1
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                            <StpOptimizerField
                                                title="Mục tiêu dùng Porter's"
                                                badge="important"
                                                fullWidth
                                                subtitle="Mục tiêu khác nhau → AI tập trung vào lực lượng khác nhau."
                                                guideline="Bạn muốn dùng phân tích này để ra quyết định gì?"
                                                example="VD: Đánh giá mở rộng sang Fintech · Tìm lợi thế cạnh tranh."
                                            >
                                                <textarea {...register('muc_tieu')} className={textareaClass} placeholder="Mục tiêu phân tích…" />
                                            </StpOptimizerField>

                                            <StpOptimizerField
                                                title="Kế hoạch 12 tháng tới"
                                                badge="required"
                                                fullWidth
                                                subtitle="Porter phải phục vụ quyết định chiến lược — AI đánh giá các lực ủng hộ hay cản trở kế hoạch."
                                                guideline="Dự định lớn nhất trong năm tới."
                                                example="VD: Ra mắt 3 dòng sản phẩm mới; chinh phục 10% thị phần."
                                            >
                                                <textarea {...register('ke_hoach', { required: 'Bắt buộc' })} className={textareaClass} placeholder="Kế hoạch 12 tháng…" />
                                                {errors.ke_hoach && <p className="mt-1 text-[11px] text-rose-600">{errors.ke_hoach.message}</p>}
                                            </StpOptimizerField>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div
                                className={`flex shrink-0 border-t border-stone-100 bg-white px-5 py-4 ${
                                    formTab === 1 ? 'justify-end' : 'justify-between'
                                }`}
                            >
                                {formTab === 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setFormTab(2)}
                                        className="flex items-center justify-center rounded-full bg-stone-950 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-95"
                                    >
                                        Kế tiếp
                                    </button>
                                )}
                                {formTab === 2 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setFormTab(1)}
                                            className="rounded-full border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 active:scale-95"
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormTab(3)}
                                            className="flex items-center justify-center rounded-full bg-stone-950 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-95"
                                        >
                                            Kế tiếp
                                        </button>
                                    </>
                                )}
                                {formTab === 3 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setFormTab(2)}
                                            className="rounded-full border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 active:scale-95"
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isGenerating}
                                            className="flex h-10 min-w-[240px] items-center justify-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-95 disabled:opacity-50"
                                        >
                                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : null}
                                            Phân tích Porter&apos;s Precision
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    )}
                </div>

                {analysisData && (
                    <div className={`${cardClass} p-6 md:p-8`}>
                        <div className="animate-in fade-in zoom-in-95 space-y-8">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-medium text-stone-900">{analysisData.overall_verdict}</h2>
                                    <p className="text-sm text-stone-400">Tổng điểm đe dọa: {analysisData.total_threat_score}/50</p>
                                    <p className="mt-2 text-sm text-stone-600">{analysisData.verdict_description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="shrink-0 rounded-xl border border-stone-100 bg-stone-50 p-3 hover:border-stone-300"
                                    aria-label="Lưu"
                                >
                                    <Save size={18} />
                                </button>
                            </div>

                            {/* Bảng tóm tắt 5 lực */}
                            <div className="overflow-hidden rounded-2xl border border-stone-200">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-stone-50">
                                            <th className="px-4 py-3 text-left font-semibold text-stone-600">Lực lượng</th>
                                            <th className="px-3 py-3 text-center font-semibold text-stone-600">Điểm</th>
                                            <th className="px-3 py-3 text-center font-semibold text-stone-600">Mức độ</th>
                                            <th className="px-3 py-3 text-center font-semibold text-stone-600">Xu hướng</th>
                                            <th className="px-4 py-3 text-left font-semibold text-stone-600">Hành động chiến lược</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {analysisData.forces.map((f, i) => {
                                            const Icon = FORCE_ICONS[f.name] || Target;
                                            const trend = TREND_ICONS[f.trend] || TREND_ICONS['Stable'];
                                            const TrendIcon = trend.icon;
                                            return (
                                                <tr key={i} className="hover:bg-stone-50/50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Icon size={14} className="text-stone-400" />
                                                            <span className="font-medium text-stone-700">{f.name_vi}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span
                                                            className="text-base font-bold"
                                                            style={{
                                                                color: f.score > 7 ? '#ef4444' : f.score > 4 ? '#f59e0b' : '#10b981',
                                                            }}
                                                        >
                                                            {f.score}
                                                        </span>
                                                        <span className="text-stone-300">/10</span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[f.status]}`}>
                                                            {f.status === 'Extreme' ? 'Cực đại' :
                                                             f.status === 'High' ? 'Cao' :
                                                             f.status === 'Medium' ? 'Trung bình' : 'Thấp'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <TrendIcon size={12} className={trend.color} />
                                                            <span className={`text-[10px] ${trend.color}`}>{trend.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="line-clamp-2 text-stone-500">{f.strategic_action}</p>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="h-[350px] max-w-3xl rounded-3xl border border-stone-100 bg-stone-50/20 p-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#e7e5e4" />
                                        <PolarAngleAxis
                                            dataKey="force"
                                            tick={{ fontSize: 11, fill: '#44403c' }}
                                            tickFormatter={(value) => {
                                                const labels: Record<string, string> = {
                                                    'Competitive Rivalry': 'Cạnh tranh',
                                                    'Threat of New Entrants': 'Đối thủ mới',
                                                    'Bargaining Power of Buyers': 'Người mua',
                                                    'Bargaining Power of Suppliers': 'Nhà cung cấp',
                                                    'Threat of Substitutes': 'Thay thế',
                                                };
                                                return labels[value] || value;
                                            }}
                                        />
                                        <PolarRadiusAxis domain={[0, 10]} hide />
                                        <Radar
                                            name="Cường độ lực"
                                            dataKey="score"
                                            stroke="#1c1917"
                                            fill="#1c1917"
                                            fillOpacity={0.1}
                                            strokeWidth={2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                {analysisData.forces.map((f, i) => {
                                    const Icon = FORCE_ICONS[f.name] || Target;
                                    const isExpanded = expandedCard === i;
                                    return (
                                        <div
                                            key={i}
                                            className={`rounded-2xl border p-5 transition-all hover:border-stone-300 ${
                                                f.score > 7 ? 'border-red-200 bg-red-50/30' :
                                                f.score > 4 ? 'border-amber-200 bg-amber-50/30' :
                                                'border-emerald-200 bg-emerald-50/30'
                                            }`}
                                        >
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="rounded-lg bg-white p-2 shadow-sm">
                                                        <Icon size={18} className="text-stone-700" />
                                                    </div>
                                                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">{f.name}</span>
                                                </div>
                                                <div
                                                    className="text-2xl font-bold"
                                                    style={{
                                                        color: f.score > 7 ? '#ef4444' : f.score > 4 ? '#f59e0b' : '#10b981',
                                                    }}
                                                >
                                                    {f.score}
                                                    <span className="text-xs font-normal text-stone-300">/10</span>
                                                </div>
                                            </div>
                                            <h4 className="mb-2 text-sm font-semibold text-stone-900">{f.name_vi}</h4>

                                            {/* Determinants */}
                                            <div className="mb-3 flex flex-wrap gap-1">
                                                {f.determinants.slice(0, 3).map((d, di) => (
                                                    <span
                                                        key={di}
                                                        className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[9px] text-stone-500"
                                                    >
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Strategic Action - với tooltip */}
                                            <div className="relative">
                                                <div className="flex items-start gap-1.5">
                                                    <Info size={12} className="mt-0.5 shrink-0 text-stone-400" />
                                                    <p
                                                        className={`text-xs leading-relaxed text-stone-600 ${!isExpanded && 'line-clamp-2'}`}
                                                        onMouseEnter={(e) => showTooltip(f.strategic_action, e)}
                                                        onMouseLeave={hideTooltip}
                                                    >
                                                        {f.strategic_action}
                                                    </p>
                                                </div>
                                                {f.strategic_action.length > 120 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedCard(isExpanded ? null : i)}
                                                        className="mt-2 text-[10px] font-medium text-stone-400 hover:text-stone-600"
                                                    >
                                                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Trend indicator */}
                                            <div className="mt-3 flex items-center gap-1 border-t border-stone-100 pt-3">
                                                {(() => {
                                                    const trend = TREND_ICONS[f.trend] || TREND_ICONS['Stable'];
                                                    const TrendIcon = trend.icon;
                                                    return (
                                                        <>
                                                            <TrendIcon size={12} className={trend.color} />
                                                            <span className={`text-[10px] ${trend.color}`}>
                                                                Xu hướng: {trend.label}
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PHẦN ADVICE - CMO Expert Note */}
                            {analysisData.advice && (
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-stone-900">CMO Expert Note</h3>
                                            <p className="text-xs text-stone-500">Chiến lược & Hành động ưu tiên</p>
                                        </div>
                                    </div>

                                    {/* Strategy Card */}
                                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-xs font-medium uppercase tracking-wider text-amber-600">Chiến lược đề xuất</span>
                                            <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                                                {analysisData.advice.recommended_strategy}
                                            </span>
                                        </div>
                                        <p className="text-sm text-stone-700">{analysisData.advice.strategy_rationale}</p>
                                        {analysisData.advice.strategy_risks.length > 0 && (
                                            <div className="mt-3 rounded-lg bg-white/60 p-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Rủi ro nếu thực thi sai</p>
                                                <ul className="mt-1 space-y-1">
                                                    {analysisData.advice.strategy_risks.map((risk, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                                                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                                                            {risk}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Threat & Opportunity Grid */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* Biggest Threat */}
                                        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                                                    <TrendingUp size={16} className="text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium uppercase tracking-wider text-red-500">Lực nguy hiểm nhất</p>
                                                    <p className="text-sm font-semibold text-stone-900">
                                                        {analysisData.advice.biggest_threat.force_name} — {analysisData.advice.biggest_threat.score}/10
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-xs text-stone-600">
                                                <p><span className="font-medium text-stone-700">Tại sao:</span> {analysisData.advice.biggest_threat.reason}</p>
                                                <p><span className="font-medium text-stone-700">Hậu quả 6 tháng:</span> {analysisData.advice.biggest_threat.consequence}</p>
                                                <p className="rounded-lg bg-white/80 p-2"><span className="font-medium text-red-600">Hành động ưu tiên:</span> {analysisData.advice.biggest_threat.defensive_action}</p>
                                            </div>
                                        </div>

                                        {/* Biggest Opportunity */}
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                                    <TrendingDown size={16} className="text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">Lực lợi thế nhất</p>
                                                    <p className="text-sm font-semibold text-stone-900">
                                                        {analysisData.advice.biggest_opportunity.force_name} — {analysisData.advice.biggest_opportunity.score}/10
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-xs text-stone-600">
                                                <p><span className="font-medium text-stone-700">Tại sao:</span> {analysisData.advice.biggest_opportunity.reason}</p>
                                                <p className="rounded-lg bg-white/80 p-2"><span className="font-medium text-emerald-600">Khai thác 30-60 ngày:</span> {analysisData.advice.biggest_opportunity.exploitation_plan}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Critical & Pitfall Grid */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* Critical Must Do */}
                                        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                                    <Target size={14} />
                                                </div>
                                                <p className="text-xs font-semibold text-violet-700">Điều quan trọng nhất phải làm đúng</p>
                                            </div>
                                            <div className="space-y-2 text-xs text-stone-600">
                                                <p><span className="font-medium text-stone-700">Yếu tố:</span> {analysisData.advice.critical_must_do.factor}</p>
                                                <p><span className="font-medium text-stone-700">Tại sao leverage:</span> {analysisData.advice.critical_must_do.why_leverage}</p>
                                                <p className="rounded-lg bg-white/80 p-2 text-red-600"><span className="font-medium">Nếu sai:</span> {analysisData.advice.critical_must_do.consequence_if_wrong}</p>
                                            </div>
                                        </div>

                                        {/* Biggest Pitfall */}
                                        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                                                    <Info size={14} />
                                                </div>
                                                <p className="text-xs font-semibold text-rose-700">Cạm bẫy lớn nhất cần tránh</p>
                                            </div>
                                            <div className="space-y-2 text-xs text-stone-600">
                                                <p><span className="font-medium text-stone-700">Sai lầm:</span> {analysisData.advice.biggest_pitfall.mistake}</p>
                                                <p><span className="font-medium text-stone-700">Hậu quả:</span> {analysisData.advice.biggest_pitfall.example_consequence}</p>
                                                <p className="rounded-lg bg-white/80 p-2 text-emerald-600"><span className="font-medium">Nên làm:</span> {analysisData.advice.biggest_pitfall.recommended_alternative}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Untappted Opportunity */}
                                    <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-5">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                                                <Diamond size={14} />
                                            </div>
                                            <p className="text-xs font-semibold text-cyan-700">Cơ hội đang bị bỏ ngỏ</p>
                                        </div>
                                        <div className="flex items-start gap-2 text-xs text-stone-600">
                                            <p className="flex-1"><span className="font-medium text-stone-700">Khoảng trắng:</span> {analysisData.advice.untapped_opportunity.gap}</p>
                                            <p className="flex-1"><span className="font-medium text-cyan-700">90 ngày:</span> {analysisData.advice.untapped_opportunity.how_to_capture}</p>
                                        </div>
                                    </div>

                                    {/* Action Plan 30-60-90 */}
                                    <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5">
                                        <div className="mb-4 flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-200 text-stone-600">
                                                <Target size={14} />
                                            </div>
                                            <p className="text-sm font-semibold text-stone-900">Action Priority — 30 · 60 · 90 ngày</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {/* Month 1 */}
                                            <div className="rounded-xl bg-white p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-amber-600">Tháng 1</span>
                                                    <span className="text-[9px] font-medium uppercase tracking-wider text-stone-400">Phòng thủ</span>
                                                </div>
                                                <ul className="space-y-2">
                                                    {analysisData.advice.action_plan.month_1.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-1.5 text-xs text-stone-600">
                                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            {/* Month 2 */}
                                            <div className="rounded-xl bg-white p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-orange-600">Tháng 2</span>
                                                    <span className="text-[9px] font-medium uppercase tracking-wider text-stone-400">Tấn công</span>
                                                </div>
                                                <ul className="space-y-2">
                                                    {analysisData.advice.action_plan.month_2.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-1.5 text-xs text-stone-600">
                                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            {/* Month 3 */}
                                            <div className="rounded-xl bg-white p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-emerald-600">Tháng 3</span>
                                                    <span className="text-[9px] font-medium uppercase tracking-wider text-stone-400">Tối ưu</span>
                                                </div>
                                                <ul className="space-y-2">
                                                    {analysisData.advice.action_plan.month_3.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-1.5 text-xs text-stone-600">
                                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unknowns */}
                                    {analysisData.advice.unknowns.length > 0 && (
                                        <div className="rounded-2xl border border-stone-200 bg-white p-5">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                                                    <Info size={14} />
                                                </div>
                                                <p className="text-xs font-semibold text-stone-500">Những gì AI không biết (cần xác nhận thêm)</p>
                                            </div>
                                            <ul className="space-y-1.5">
                                                {analysisData.advice.unknowns.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-stone-500">
                                                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-stone-400" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Final Verdict */}
                                    {analysisData.advice.final_verdict && (
                                        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6 text-center">
                                            <p className="text-sm font-medium leading-relaxed text-white">
                                                {analysisData.advice.final_verdict}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default PorterAnalyzer;
