import React, { useState, useEffect } from 'react';
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
        if (!analysisData || !currentInput) return;
        const newAnalysis: SavedPorterAnalysis = {
            id: Date.now().toString(),
            input: currentInput,
            data: analysisData,
            timestamp: Date.now(),
        };
        if (await PorterService.saveAnalysis(newAnalysis)) {
            await loadSavedAnalyses();
            toast.success('Đã lưu');
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
        analysisData?.forces.map((force) => ({
            force: force.name.replace('Bargaining Power of ', '').replace('Threat of ', ''),
            score: force.score,
            fullMark: 10,
        })) || [];

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
                className="grid min-h-0 flex-1 gap-6 overflow-hidden p-6"
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

                <div className="mx-auto flex h-full min-h-0 min-w-0 w-full max-w-[1178px] flex-col gap-6 overflow-y-auto overscroll-y-contain">
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
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
                            {activeTab === 'vault' && profile?.subscription_tier === 'promax' && (
                                <div className="border-b border-stone-200 bg-stone-50/50 px-5 py-4">
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
                                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                            Phân tích Porter&apos;s Precision
                                        </button>
                                    </>
                                )}
                            </div>
                            {thinkingStep ? (
                                <p className="px-5 pb-3 text-center text-[10px] italic text-stone-400">{thinkingStep}</p>
                            ) : null}
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

                            <div className="h-[350px] max-w-3xl rounded-3xl border border-stone-100 bg-stone-50/20 p-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#e7e5e4" />
                                        <PolarAngleAxis dataKey="force" tick={{ fontSize: 10, fill: '#666' }} />
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
                                    return (
                                        <div key={i} className="rounded-2xl border border-stone-100 p-6 transition-all hover:border-stone-300">
                                            <div className="mb-4 flex items-start justify-between">
                                                <div className="rounded-lg bg-stone-50 p-2 text-stone-900">
                                                    <Icon size={20} />
                                                </div>
                                                <div
                                                    className="text-xl font-bold italic"
                                                    style={{
                                                        color: f.score > 7 ? '#ef4444' : f.score > 4 ? '#f59e0b' : '#10b981',
                                                    }}
                                                >
                                                    {f.score}
                                                    <span className="text-xs font-normal text-stone-300">/10</span>
                                                </div>
                                            </div>
                                            <h4 className="mb-2 text-sm font-bold text-stone-900">{f.name_vi}</h4>
                                            <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-stone-500">{f.strategic_action}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {f.determinants.slice(0, 3).map((d, di) => (
                                                    <span
                                                        key={di}
                                                        className="rounded-md border border-stone-100 bg-stone-50 px-2 py-1 text-[9px] text-stone-400"
                                                    >
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default PorterAnalyzer;
