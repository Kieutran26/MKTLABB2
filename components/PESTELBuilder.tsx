import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
    BarChart3,
    Calendar,
    Globe,
    Shield,
    TrendingUp,
    Users,
    Cpu,
    Leaf,
    Landmark,
    Loader2,
    Sparkles,
    History,
    Plus,
    Diamond,
    Save,
    Target,
    Trash2,
    Pencil,
} from 'lucide-react';
import { generatePESTELAnalysis } from '../services/geminiService';
import { PESTELInput, PESTELResult, PESTELFactorGroup } from '../types';
import FeatureHeader from './FeatureHeader';
import {
    WS_PRIMARY_CTA,
    WS_SAVE_ICON_BTN,
    WS_SEGMENT_SHELL,
    wsHistoryToggleClass,
    wsWorkspaceTabClass,
} from './workspace-toolbar-classes';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { StpOptimizerField } from './stp-optimizer-field';
import { useBrand } from './BrandContext';
import { PESTELService, SavedPESTEL } from '../services/pestelService';
import { useToast } from './Toast';
import ProMaxAdviceGate from './ProMaxAdviceGate';
import { stripPestelCmoAdviceBox } from '../utils/stripPestelCmoAdviceBox';
import BrandSelector from './BrandSelector';
import BrandVaultUpsellCard from './BrandVaultUpsellCard';
import './pestel-report-editorial.css';

const PESTEL_ICONS: Record<string, any> = {
    Political: PoliticalIcon,
    Economic: TrendingUp,
    Social: Users,
    Technological: Cpu,
    Environmental: Leaf,
    Legal: Shield
};

function PoliticalIcon(props: any) {
    return <Landmark {...props} />;
}

const FORM_TABS = [
    { id: 1, line: 'NHÓM 1', sub: 'Bối cảnh cơ bản' },
    { id: 2, line: 'NHÓM 2', sub: 'Thông tin doanh nghiệp' }
];

const PESTEL_DEFAULTS: PESTELInput = {
    industry: '',
    location: '',
    businessScale: '',
    businessModel: '',
    mainProductService: '',
    currentConcern: '',
    futurePlan: '',
    knownEventsPolicies: ''
};

const PESTELBuilder: React.FC = () => {
    const { user, tier } = useAuth();
    const toast = useToast();
    const { register, handleSubmit, watch, reset } = useForm<PESTELInput>({
        defaultValues: PESTEL_DEFAULTS
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [pestelData, setPestelData] = useState<PESTELResult | null>(null);
    const [thinkingStep, setThinkingStep] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [savedReports, setSavedReports] = useState<SavedPESTEL[]>([]);
    const [formTab, setFormTab] = useState(1);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [profile, setProfile] = useState<any>(null);
    const [currentInput, setCurrentInput] = useState<PESTELInput | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
    }, [user]);

    const loadHistory = async () => {
        const reports = await PESTELService.getReports();
        setSavedReports(reports);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const onSubmit = async (data: PESTELInput) => {
        setIsGenerating(true);
        setCurrentInput(data);
        setThinkingStep('Đang khởi tạo radar vĩ mô...');
        
        try {
            const result = await generatePESTELAnalysis(data, (step) => setThinkingStep(step));
            if (result) {
                const reportId = Date.now().toString();
                const newReport: SavedPESTEL = {
                    id: reportId,
                    timestamp: Date.now(),
                    input: data,
                    data: result
                };
                
                setPestelData(result);
                
                // Save using service (Local + Supabase)
                const success = await PESTELService.saveReport(newReport);
                await loadHistory();
                if (success) {
                    toast.success('Bản phân tích đã được tự động lưu.');
                }
            }
        } catch (error) {
            console.error('PESTEL Generation error:', error);
            toast.error('Có lỗi xảy ra khi tạo bản phân tích.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!pestelData || !currentInput) {
            toast.error('Chưa có dữ liệu để lưu bản thảo.');
            return;
        }

        setIsSaving(true);
        try {
            const reportId = Date.now().toString();
            const reportToSave: SavedPESTEL = {
                id: reportId,
                timestamp: Date.now(),
                input: currentInput,
                data: pestelData
            };

            const success = await PESTELService.saveReport(reportToSave);
            if (success) {
                toast.success('Đã lưu bản phân tích PESTEL thành công.');
                await loadHistory();
            } else {
                toast.error('Không thể lưu bản phân tích vào hệ thống.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc muốn xóa bản phân tích này?')) {
            const success = await PESTELService.deleteReport(id);
            if (success) {
                toast.success('Đã xóa bản phân tích.');
                await loadHistory();
            }
        }
    };

    const handleLoadReport = (report: SavedPESTEL) => {
        setPestelData(report.data);
        setCurrentInput(report.input);
        reset(report.input);
        setShowHistory(false);
    };

    const handleReset = () => {
        reset(PESTEL_DEFAULTS);
        setPestelData(null);
        setFormTab(1);
        setCurrentInput(null);
    };

    const cardClass = 'rounded-3xl border border-stone-200/60 bg-white shadow-sm';
    const showPestelOutput = !!(pestelData || isGenerating);

    /** Pro Max: Supabase profile hoặc AuthContext (dev: window.__authTier('promax')) */
    const isPromax =
        profile?.subscription_tier === 'promax' || tier === 'promax';

    const pestelHtmlForDisplay = useMemo(() => {
        if (!pestelData?.html_report) return { html: '', showAdviceGate: false };
        if (isPromax) return { html: pestelData.html_report, showAdviceGate: false };
        const { html, hadCmoBlock } = stripPestelCmoAdviceBox(pestelData.html_report);
        return { html, showAdviceGate: hadCmoBlock };
    }, [pestelData?.html_report, isPromax, tier, profile?.subscription_tier]);
    const inputClass = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400';
    
    // Check if required fields are filled
    const watchAll = watch();
    const filledRequiredCount = [
        watchAll.industry, watchAll.location, watchAll.businessScale, 
        watchAll.businessModel, watchAll.mainProductService
    ].filter(Boolean).length;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC]">
            <FeatureHeader
                icon={Globe}
                eyebrow="MACRO ENVIRONMENT SCAN"
                title="PESTEL Builder"
                subline="Quét radar kinh tế vĩ mô: Chính trị, Kinh tế, Xã hội, Công nghệ, Môi trường, Pháp lý."
            >
                <div className={WS_SEGMENT_SHELL}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        className={wsWorkspaceTabClass(activeTab === 'manual')}
                    >
                        <Pencil size={14} /> Thủ công
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('vault')}
                        className={wsWorkspaceTabClass(activeTab === 'vault')}
                    >
                        <Diamond size={14} className={isPromax ? 'text-amber-500 fill-amber-500' : 'text-stone-400'} /> Brand Vault
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className={wsHistoryToggleClass(showHistory)}
                    title={`Lịch sử (${savedReports.length})`}
                    aria-pressed={showHistory}
                    aria-label={`Mở lịch sử phân tích PESTEL, ${savedReports.length} bản đã lưu`}
                >
                    <History size={17} strokeWidth={1.5} />
                </button>

                {pestelData && (
                    <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={isSaving}
                        className={WS_SAVE_ICON_BTN}
                        aria-label="Lưu vào lịch sử"
                        title="Lưu vào lịch sử"
                    >
                        {isSaving ? (
                            <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                        ) : (
                            <Save size={18} strokeWidth={2} />
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleReset}
                    className={WS_PRIMARY_CTA}
                >
                    <Plus size={18} strokeWidth={2.5} /> Tạo kế hoạch
                </button>
            </FeatureHeader>

            <div
                className={`flex min-h-0 flex-1 flex-col pb-3 sm:pb-4 lg:pb-4 ${
                    showPestelOutput && !showHistory
                        ? 'px-0 pt-0 sm:pt-0 lg:pt-0 overflow-hidden'
                        : 'px-4 pt-5 sm:pt-6 lg:px-8 lg:pt-7 xl:px-10 overflow-y-auto'
                }`}
            >
                {showHistory ? (
                    <div className="flex-1 overflow-y-auto px-0 pb-2">
                        <div className={`${cardClass} p-6 md:p-8`}>
                            <h2 className="mb-8 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                <History size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                Lịch sử phân tích PESTEL ({savedReports.length})
                            </h2>
                            {savedReports.length === 0 ? (
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
                                    {savedReports.map((m) => {
                                        const factorCount = m.data?.pestel_factors?.length ?? 6;
                                        return (
                                            <div
                                                key={m.id}
                                                role="button"
                                                tabIndex={0}
                                                className="cursor-pointer rounded-2xl border border-stone-200/90 p-5 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                                onClick={() => handleLoadReport(m)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleLoadReport(m)}
                                            >
                                                <div className="mb-3 flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="line-clamp-2 font-medium text-stone-900">
                                                            {m.input.industry || 'Không tên'}
                                                        </h3>
                                                        <p className="mt-1 line-clamp-2 text-sm font-normal text-stone-500">
                                                            {m.input.location || '—'} • {m.input.businessScale || m.input.businessModel || '—'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => void handleDeleteReport(e, m.id)}
                                                        className="shrink-0 rounded-lg p-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                        aria-label="Xóa bản phân tích"
                                                    >
                                                        <Trash2 size={16} strokeWidth={1.25} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs font-normal text-stone-500">
                                                    <span className="flex items-center gap-1">
                                                        <Target size={12} strokeWidth={1.25} />
                                                        {factorCount} yếu tố
                                                    </span>
                                                    <span className="flex min-w-0 max-w-full items-center gap-1">
                                                        <BarChart3 size={12} strokeWidth={1.25} className="shrink-0" />
                                                        <span className="truncate">
                                                            {m.input.businessModel || m.data?.data_freshness || 'Radar vĩ mô'}
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
                ) : !(pestelData || isGenerating) ? (
                    activeTab === 'vault' && !isPromax ? (
                        <div className="mx-auto mt-6 w-full max-w-[1180px] pb-2">
                            <BrandVaultUpsellCard
                                description="Quét radar PESTEL chính xác và nhất quán hơn khi AI học DNA thương hiệu từ Vault của bạn."
                                benefits={[
                                    'Các trụ P-E-S-T-E-L bám ngành, địa bàn và quy mô đã lưu trong Vault — giảm mơ hồ so với nhập tay rời rạc',
                                    'AI đọc sứ mệnh, tầm nhìn và USP từ Vault để ưu tiên yếu tố vĩ mô có tác động thật với doanh nghiệp bạn',
                                    'Tự điền bối cảnh từ thương hiệu — tạo báo cáo PESTEL nhanh, đồng bộ DNA',
                                    'Kết quả phù hợp chiến lược và thông điệp thương hiệu bạn đang xây',
                                ]}
                            />
                        </div>
                    ) : (
                        <div className={`${cardClass} flex flex-col transition-all duration-500 max-w-[1180px] mx-auto w-full`}>
                            {activeTab === 'vault' && isPromax && (
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
                                        className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-3 text-center transition-colors ${formTab === t.id ? 'border-b-2 border-stone-900 text-stone-900' : 'border-b-2 border-transparent text-stone-400 hover:text-stone-600'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t.line}</span>
                                        <span className="hidden text-[9px] font-medium leading-tight text-stone-500 sm:block">{t.sub}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="overflow-y-auto p-5 md:p-6">
                                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                                    <div className="space-y-5 px-5 md:px-6 py-5 md:py-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 shrink-0 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 text-sm font-medium">{formTab}</div>
                                                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">{FORM_TABS.find(t => t.id === formTab)?.sub}</h3>
                                            </div>
                                            <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                                                Bắt buộc · {filledRequiredCount}/5
                                            </div>
                                        </div>

                                        {formTab === 1 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <StpOptimizerField
                                                    title="Ngành hàng"
                                                    badge="required"
                                                    subtitle="Yếu tố PESTEL khác nhau hoàn toàn giữa các ngành."
                                                    guideline="Ngành cụ thể càng tốt — không chỉ là 'kinh doanh' hay 'dịch vụ'."
                                                    example="VD: Bất động sản nghỉ dưỡng · F&B chuỗi · Fintech · Giáo dục trực tuyến"
                                                >
                                                    <input {...register('industry', { required: true })} className={inputClass} placeholder="Ngành / vertical" />
                                                </StpOptimizerField>

                                                <StpOptimizerField
                                                    title="Thị trường / Địa lý"
                                                    badge="required"
                                                    subtitle="Luật pháp, chính trị, kinh tế khác nhau theo từng quốc gia/vùng."
                                                    guideline="Thị trường đang hoặc sắp hoạt động."
                                                    example="VD: Việt Nam · TP.HCM + Hà Nội · Đông Nam Á"
                                                >
                                                    <input {...register('location', { required: true })} className={inputClass} placeholder="Địa bàn / quốc gia / vùng" />
                                                </StpOptimizerField>

                                                <StpOptimizerField
                                                    title="Quy mô doanh nghiệp"
                                                    badge="required"
                                                    subtitle="Startup và tập đoàn bị ảnh hưởng khác nhau bởi cùng một yếu tố vĩ mô."
                                                    guideline="Giai đoạn phát triển hiện tại của doanh nghiệp."
                                                    example="VD: Startup (1-3 năm) · SME (3-10 năm) · Enterprise"
                                                >
                                                    <input {...register('businessScale', { required: true })} className={inputClass} placeholder="Quy mô hiện tại" />
                                                </StpOptimizerField>

                                                <StpOptimizerField
                                                    title="Mô hình kinh doanh"
                                                    badge="required"
                                                    subtitle="B2B/B2C/B2B2C có chuỗi cung ứng và rủi ro pháp lý khác nhau."
                                                    guideline="Cách doanh nghiệp tạo ra và phân phối giá trị."
                                                    example="VD: B2C online · B2B SaaS · Marketplace · Franchise"
                                                >
                                                    <input {...register('businessModel', { required: true })} className={inputClass} placeholder="Mô hình vận hành" />
                                                </StpOptimizerField>
                                            </div>
                                        )}

                                        {formTab === 2 && (
                                            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <StpOptimizerField
                                                    fullWidth
                                                    title="Sản phẩm / Dịch vụ chính"
                                                    badge="required"
                                                    subtitle="AI cần biết bạn bán gì để xác định yếu tố PESTEL nào ảnh hưởng trực tiếp."
                                                    guideline="Mô tả ngắn sản phẩm/dịch vụ, kênh phân phối, nguồn cung ứng chính."
                                                    example="VD: Nền tảng đặt tour du lịch cao cấp, làm việc with 50 khách sạn 5 sao, thanh toán qua ví điện tử"
                                                >
                                                    <textarea {...register('mainProductService', { required: true })} className="w-full h-24 rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 focus:border-stone-300 focus:outline-none" placeholder="Mô tả chi tiết sản phẩm..." />
                                                </StpOptimizerField>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <StpOptimizerField
                                                        title="Mối lo ngại lớn nhất"
                                                        badge="important"
                                                        subtitle="Giúp AI ưu tiên yếu tố PESTEL nào cần phân tích sâu hơn."
                                                        guideline="Điều gì đang làm bạn lo lắng nhất về môi trường bên ngoài?"
                                                        example="VD: Luật dữ liệu mới · Lạm phát tăng · Đối thủ nước ngoài vào"
                                                    >
                                                        <input {...register('currentConcern')} className={inputClass} placeholder="Nỗi lo hiện tại..." />
                                                    </StpOptimizerField>

                                                    <StpOptimizerField
                                                        title="Kế hoạch 12-24 tháng"
                                                        badge="important"
                                                        subtitle="PESTEL phải phục vụ quyết định chiến lược — biết kế hoạch thì AI mới tư vấn đúng."
                                                        guideline="Dự định mở rộng, ra mắt sản phẩm mới, gọi vốn, hay duy trì ổn định?"
                                                        example="VD: Mở rộng sang Hà Nội, gọi vốn Series A, ra mắt app v2"
                                                    >
                                                        <input {...register('futurePlan')} className={inputClass} placeholder="Mục tiêu sắp tới..." />
                                                    </StpOptimizerField>
                                                </div>

                                                <StpOptimizerField
                                                    fullWidth
                                                    title="Sự kiện / chính sách đã biết"
                                                    badge="optional"
                                                    subtitle="Nếu user đã biết sự kiện cụ thể → AI phân tích sâu hơn thay vì chỉ nêu tổng quát."
                                                    guideline="Chính sách, luật mới, xu hướng thị trường bạn đã biết."
                                                    example="VD: Nghị định 13/2023 về bảo vệ dữ liệu · Thuế VAT tăng"
                                                >
                                                    <input {...register('knownEventsPolicies')} className={inputClass} placeholder="Nhập luật, chính sách hoặc sự kiện cụ thể..." />
                                                </StpOptimizerField>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex pt-6 shrink-0 ${formTab === 1 ? 'justify-end' : 'justify-between'}`}>
                                        {formTab === 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => setFormTab(2)}
                                                className="flex items-center justify-center px-6 py-2.5 bg-stone-950 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95"
                                            >
                                                Kế tiếp
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormTab(1)}
                                                    className="px-6 py-2.5 border border-stone-200 text-stone-600 rounded-full text-sm font-medium hover:bg-stone-50 transition-all active:scale-95"
                                                >
                                                    Quay lại
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isGenerating}
                                                    className="flex items-center justify-center h-10 w-[161.648px] bg-stone-950 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                                >
                                                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : 'Phân tích PESTEL'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex h-full min-h-0 min-w-0 w-full flex-1 animate-in fade-in slide-in-from-right-4 overflow-y-auto border-0 bg-[#faf9f6] p-0 shadow-none duration-500">
                        {!pestelData ? (
                            <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center text-stone-300 opacity-50">
                                <div className="text-center space-y-6">
                                    <div className="relative mx-auto w-24 h-24">
                                        <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-stone-900 rounded-full border-t-transparent animate-spin" />
                                        <Globe size={40} className="absolute inset-0 m-auto text-stone-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-stone-900 animate-pulse">{thinkingStep || 'Đang quét radar kinh tế vĩ mô...'}</p>
                                        <p className="text-[11px] text-stone-400">Quá trình này có thể mất 15-30 giây để đạt độ chính xác cao nhất.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in zoom-in-95 w-full">
                                {pestelData.html_report ? (
                                    <div className="w-full min-h-0 bg-[#faf9f6]">
                                        <div
                                            className="pestel-report-host w-full min-h-0 bg-[#faf9f6]"
                                            dangerouslySetInnerHTML={{ __html: pestelHtmlForDisplay.html }}
                                        />
                                        {!isPromax && pestelHtmlForDisplay.showAdviceGate && (
                                            <div className="pestel-promax-advice-gate w-full px-4 pb-10 pt-1 sm:px-6">
                                                <ProMaxAdviceGate
                                                    subscriptionTier={isPromax ? 'promax' : profile?.subscription_tier ?? tier}
                                                    benefits={[
                                                        'Insight chiến lược, rủi ro & cơ hội bị bỏ lỡ',
                                                        'Lộ trình hành động 30 · 60 · 90 ngày',
                                                    ]}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Fallback: cùng scope .pestel-report để dùng pestel-report-editorial.css */
                                    <div className="pestel-report w-full min-h-0 bg-[#faf9f6]">
                                    <div className="page">
                                        {/* Header */}
                                        <div className="doc-header">
                                            <div>
                                                <div className="eyebrow">PESTEL Builder · Macro Scan</div>
                                                <div className="doc-title">{pestelData.pestel_context || pestelData.context}</div>
                                            </div>
                                            <div className="doc-tags">
                                                <span className="tag" style={{ background: '#f2f0eb', color: '#3a3935' }}>
                                                    {pestelData.data_freshness || 'Q2 · 2026'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Section head */}
                                        <div className="sh" style={{ animationDelay: '.1s', marginBottom: '1.5rem' }}>
                                            <div className="sh-dot" style={{ background: '#1a3a5c' }}></div>
                                            <span className="sh-title">6 yếu tố PESTEL</span>
                                        </div>

                                        {/* Factor grid */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
                                            {pestelData.pestel_factors.map((f: PESTELFactorGroup, i: number) => {
                                                const catColors: Record<string, string> = {
                                                    Political: '#1a3a5c', Economic: '#1a5c3a', Social: '#c17f2a',
                                                    Technological: '#5c1a5c', Environmental: '#2a7f3a', Legal: '#8a1a1a'
                                                };
                                                const col = catColors[f.category] || '#3a3935';
                                                const maxScore = f.items.reduce((m, it) => Math.max(m, it.impact_score), 0);
                                                const maxItem = f.items.find(it => it.impact_score === maxScore) || f.items[0];
                                                const primaryDir = maxItem?.impact_direction === 'Positive' ? 'Cơ hội' :
                                                    maxItem?.impact_direction === 'Negative' ? 'Rủi ro' : 'Trung lập';
                                                return (
                                                    <div key={i} className="factor" style={{ animationDelay: `${0.1 + i * 0.03}s` }}>
                                                        <div className="factor-head">
                                                            <div className="factor-letter" style={{ color: col }}>{f.category[0]}</div>
                                                            <div className="factor-name">{f.category} <span>{f.category_vi || ''}</span></div>
                                                            <div className="factor-badges">
                                                                <span className="impact-badge" style={{ background: `${col}18`, color: col }}>
                                                                    Tác động {maxScore}/10
                                                                </span>
                                                                <span className="level-badge" style={{ background: `${col}18`, color: col }}>
                                                                    {primaryDir}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="factor-body">
                                                            <div className="fb-col">
                                                                <div className="fb-label">Tóm tắt</div>
                                                                {f.items.slice(0, 2).map((item, ii) => (
                                                                    <div key={ii} style={{ marginBottom: '6px', fontSize: '12px', color: '#3a3935' }}>
                                                                        · {item.factor}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="fb-col">
                                                                <div className="fb-label">Chi tiết</div>
                                                                {(f.items[0]?.detail || '').slice(0, 200)}
                                                            </div>
                                                            <div className="fb-col">
                                                                <div className="fb-label">Phân loại</div>
                                                                {f.items.slice(0, 2).map((item, ii) => (
                                                                    <div key={ii} style={{ marginBottom: '4px' }}>
                                                                        <span className="opp-tag" style={{
                                                                            background: item.impact_direction === 'Positive' ? 'rgba(26,92,58,.1)' :
                                                                                item.impact_direction === 'Negative' ? 'rgba(138,26,26,.1)' : 'rgba(193,127,42,.1)',
                                                                            color: item.impact_direction === 'Positive' ? '#1a5c3a' :
                                                                                item.impact_direction === 'Negative' ? '#8a1a1a' : '#c17f2a'
                                                                        }}>
                                                                            {item.impact_score}/10
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="fb-col">
                                                                <div className="fb-label">Hành động</div>
                                                                {f.items.slice(0, 2).map((item, ii) => (
                                                                    <div key={ii} className="action-item">
                                                                        <div className="action-dot"></div>
                                                                        <span style={{ fontSize: '11px', color: '#3a3935' }}>{item.actionable_insight?.slice(0, 80)}…</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PESTELBuilder;
