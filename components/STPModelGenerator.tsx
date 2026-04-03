import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Layers, Sparkles, Loader2, History, Save, ChevronRight, BarChart3, Diamond, Lock, Pencil } from 'lucide-react';
import { STPInput, STPResult, STPSegment } from '../types';
import { generateSTPAnalysis } from '../services/geminiService';
import { STPService, SavedSTP } from '../services/stpService';
import toast, { Toaster } from 'react-hot-toast';
import FeatureHeader from './FeatureHeader';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';
import { StpOptimizerField } from './stp-optimizer-field';

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const formCardClass =
    'rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400 disabled:bg-stone-50 disabled:text-stone-500';
const textareaClass =
    'min-h-[7rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400';

const STP_DEFAULTS: STPInput = {
    productBrand: '',
    industry: '',
    productDescription: '',
    priceRange: '',
    targetMarket: '',
    competitorNames: '',
    currentCustomers: '',
    purchaseReason: '',
    nonPurchaseReason: '',
    stpGoal: '',
    uspStrength: '',
};

const FORM_TABS = [
    { id: 1 as const, line: 'Nhóm 1', sub: 'Thương hiệu & sản phẩm' },
    { id: 2 as const, line: 'Nhóm 2', sub: 'Dữ liệu khách hàng (nếu có)' },
    { id: 3 as const, line: 'Nhóm 3', sub: 'Cạnh tranh & mục tiêu' },
];

const SegmentCard: React.FC<{ segment: STPSegment; index: number }> = ({ segment, index }) => (
    <div className={`${cardClass} p-5 transition-all hover:border-stone-300/90`}>
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50/80 text-sm font-medium text-stone-700">
                {index + 1}
            </div>
            <h4 className="text-base font-medium tracking-tight text-stone-900">{segment.name}</h4>
        </div>
        <p className="mb-4 text-sm font-normal text-stone-600">{segment.description}</p>
        <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Demographics</p>
                <p className="text-sm text-stone-800">{segment.demographics}</p>
            </div>
            <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Psychographics</p>
                <p className="text-sm text-stone-800">{segment.psychographics}</p>
            </div>
        </div>
    </div>
);

const STPModelGenerator: React.FC = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [formTab, setFormTab] = useState<1 | 2 | 3>(1);
    const [outputTab, setOutputTab] = useState<'segmentation' | 'targeting' | 'positioning'>('segmentation');
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<STPInput>({
        defaultValues: STP_DEFAULTS,
    });
    const [stpData, setStpData] = useState<STPResult | null>(null);
    const [currentInput, setCurrentInput] = useState<STPInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedItems, setSavedItems] = useState<SavedSTP[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
        loadHistory();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'vault' && currentBrand) {
            setValue('productBrand', currentBrand.identity.name || '');
            const { mission, vision, toneOfVoice, targetObjectives } = currentBrand.strategy;
            const descParts = [
                mission && `Sứ mệnh: ${mission}`,
                vision && `Tầm nhìn: ${vision}`,
                toneOfVoice && `Giọng điệu: ${toneOfVoice}`,
                targetObjectives?.length ? `Mục tiêu: ${targetObjectives.join(' · ')}` : '',
            ].filter(Boolean);
            setValue('productDescription', descParts.join('\n\n'));
            setValue('industry', '');
        }
    }, [activeTab, currentBrand, setValue]);

    const loadHistory = async () => {
        const items = await STPService.getSTPHistory();
        setSavedItems(items);
    };

    const mergeInput = (data: STPInput): STPInput => ({
        ...STP_DEFAULTS,
        ...data,
    });

    const onSubmit = async (data: STPInput) => {
        const merged = mergeInput(data);
        setIsGenerating(true);
        setStpData(null);
        setCurrentInput(merged);
        try {
            const context =
                activeTab === 'vault' && currentBrand
                    ? `BRAND: ${currentBrand.identity.name}, VISION: ${currentBrand.strategy.vision}. `
                    : '';
            const result = await generateSTPAnalysis(
                { ...merged, productBrand: context + merged.productBrand },
                setThinkingStep
            );
            if (result) {
                setStpData(result);
                toast.success('Phân tích STP hoàn tất!');
            }
        } catch {
            toast.error('Phân tích thất bại');
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!stpData || !currentInput) return;
        const newItem: SavedSTP = {
            id: Date.now().toString(),
            input: currentInput,
            data: stpData,
            timestamp: Date.now(),
        };
        if (await STPService.saveSTP(newItem)) {
            await loadHistory();
            toast.success('Đã lưu!');
        }
    };

    const openHistoryItem = (m: SavedSTP) => {
        setStpData(m.data);
        setCurrentInput(m.input);
        reset(mergeInput(m.input));
        setShowHistory(false);
        setFormTab(1);
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-right" />
            <FeatureHeader
                icon={Layers}
                eyebrow="PRECISION MARKET SEGMENTATION"
                title="STP Optimizer"
                subline="Phân lớp thị trường, xác định mục tiêu và tọa độ định vị."
            >
                <div className="mr-2 flex shrink-0 items-center justify-end gap-2">
                    <div className="inline-flex gap-1 rounded-2xl border border-stone-200 bg-stone-50/50 p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setActiveTab('manual')}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            <Pencil size={14} className="inline" /> Thủ công
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('vault')}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            <Diamond
                                size={14}
                                className={profile?.subscription_tier === 'promax' ? 'fill-amber-500 text-amber-500' : 'text-stone-400'}
                            />
                            Brand Vault
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-95 ${showHistory ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                        aria-pressed={showHistory}
                    >
                        <History size={18} strokeWidth={2} />
                    </button>
                </div>
            </FeatureHeader>

            <div
                className={`grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:gap-6 lg:p-6 ${
                    stpData 
                        ? (showHistory ? 'xl:grid-cols-[minmax(0,260px)_minmax(420px,1fr)_minmax(280px,1.2fr)]' : 'xl:grid-cols-[minmax(420px,1fr)_minmax(280px,1.2fr)]') 
                        : (showHistory ? 'xl:grid-cols-[minmax(0,260px)_1fr]' : 'grid-cols-1 items-start')
                }`}
            >
                {showHistory && (
                    <aside
                        className={`${cardClass} order-1 max-h-[36vh] min-h-0 space-y-3 overflow-y-auto bg-stone-50/30 p-4 xl:max-h-none`}
                    >
                        <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Lịch sử</h3>
                        {savedItems.length === 0 && (
                            <p className="px-2 text-xs text-stone-500">Chưa có bản phân tích đã lưu.</p>
                        )}
                        {savedItems.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => openHistoryItem(m)}
                                className="w-full cursor-pointer rounded-xl border border-stone-100 bg-white p-4 text-left transition-all hover:border-stone-300"
                            >
                                <div className="truncate text-sm font-medium text-stone-900">{m.input.productBrand}</div>
                                <div className="mt-2 text-[10px] text-stone-400">
                                    {m.input.industry} · {new Date(m.timestamp).toLocaleDateString('vi-VN')}
                                </div>
                            </button>
                        ))}
                    </aside>
                )}

                <div
                    className={`${formCardClass} order-2 flex flex-col overflow-hidden ${!stpData ? 'mx-auto w-full max-w-[1182px] h-fit' : 'min-h-0 flex-1 min-w-0'} ${showHistory ? '' : 'xl:col-start-1'}`}
                >
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="space-y-6 p-8 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm">
                                <Diamond size={32} />
                            </div>
                            <h2 className="text-xl font-medium">STP Precision Pro</h2>
                            <p className="text-sm leading-relaxed text-stone-500">
                                Tự động phân lớp thị trường và xác định tọa độ định vị dựa trên bản sắc thương hiệu trong Vault của bạn.
                            </p>
                            <button
                                type="button"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 font-medium text-white"
                            >
                                Nâng cấp Pro Max <ChevronRight size={18} />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
                            {activeTab === 'vault' && profile?.subscription_tier === 'promax' && (
                                <div className="border-b border-stone-200/60 bg-white/50 px-5 py-4">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Nguồn Brand Vault</p>
                                    <BrandSelector />
                                </div>
                            )}

                            <div className="flex shrink-0 border-b border-stone-200/80 bg-white/50">
                                {FORM_TABS.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setFormTab(t.id)}
                                        className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-3 text-center transition-colors ${formTab === t.id ? 'border-b-2 border-stone-900 text-stone-900' : 'border-b-2 border-transparent text-stone-400 hover:text-stone-600'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{t.line}</span>
                                        <span className="hidden text-[9px] font-medium leading-tight text-stone-500 sm:block">{t.sub}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 md:px-8 md:py-6">
                                {formTab === 1 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 grid grid-cols-1 gap-x-8 gap-y-3.5 duration-300 md:grid-cols-2">
                                        <StpOptimizerField
                                            title="Tên thương hiệu / Sản phẩm"
                                            badge="required"
                                            subtitle="Tên cụ thể sẽ được phân tích STP"
                                            example="VD: VinFast VF8 · Highlands Coffee · App Momo"
                                            hintExtra="Nhập đúng tên thương hiệu hoặc sản phẩm để AI map ngữ cảnh."
                                        >
                                            <input
                                                {...register('productBrand', { required: 'Bắt buộc' })}
                                                className={inputClass}
                                                placeholder="Tên thương hiệu hoặc sản phẩm"
                                            />
                                            {errors.productBrand && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.productBrand.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Ngành hàng"
                                            badge="required"
                                            subtitle="Lĩnh vực kinh doanh cụ thể — ảnh hưởng đến cách AI phân khúc thị trường"
                                            example="VD: Xe điện · F&B · Fintech · FMCG · Làm đẹp"
                                        >
                                            <input
                                                {...register('industry', { required: 'Bắt buộc' })}
                                                className={inputClass}
                                                placeholder="Ngành / vertical"
                                            />
                                            {errors.industry && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.industry.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Mô tả sản phẩm / dịch vụ"
                                            badge="required"
                                            fullWidth
                                            subtitle="AI cần hiểu sản phẩm làm gì, giải quyết vấn đề gì để phân khúc đúng"
                                            guideline="Tính năng chính, lợi ích cốt lõi, điểm khác biệt so với sản phẩm thông thường"
                                            example='VD: "Xe điện 7 chỗ, phạm vi 400km/sạc, màn hình 15 inch, giá 1.2 tỷ, sản xuất tại Việt Nam"'
                                        >
                                            <textarea
                                                {...register('productDescription', { required: 'Bắt buộc' })}
                                                className={textareaClass}
                                                placeholder="Mô tả chi tiết…"
                                            />
                                            {errors.productDescription && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.productDescription.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Khoảng giá bán"
                                            badge="required"
                                            subtitle="Giá quyết định phân khúc thu nhập — không có giá thì không thể xác định target"
                                            guideline="Giá cụ thể hoặc khoảng giá. Nếu có nhiều tier thì liệt kê hết"
                                            example="VD: 500M-700M · 45,000đ/ly · 99,000đ/tháng"
                                        >
                                            <input
                                                {...register('priceRange', { required: 'Bắt buộc' })}
                                                className={inputClass}
                                                placeholder="Khoảng giá hoặc bảng giá ngắn"
                                            />
                                            {errors.priceRange && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.priceRange.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Thị trường địa lý"
                                            badge="required"
                                            subtitle="Hành vi tiêu dùng khác nhau hoàn toàn giữa Hà Nội, TP.HCM, tỉnh thành"
                                            guideline="Khu vực đang hoặc sẽ kinh doanh"
                                            example="VD: TP.HCM · Toàn quốc · Hà Nội + TP.HCM · Đông Nam Á"
                                        >
                                            <input
                                                {...register('targetMarket', { required: 'Bắt buộc' })}
                                                className={inputClass}
                                                placeholder="Địa bàn / quốc gia / vùng"
                                            />
                                            {errors.targetMarket && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.targetMarket.message}</p>
                                            )}
                                        </StpOptimizerField>
                                    </div>
                                )}

                                {formTab === 2 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 grid grid-cols-1 gap-x-8 gap-y-3.5 duration-300 md:grid-cols-2">
                                        <StpOptimizerField
                                            title="Mô tả khách hàng đang mua"
                                            badge="important"
                                            fullWidth
                                            subtitle="Đây là dữ liệu thực nhất — AI sẽ ưu tiên phân tích từ đây thay vì giả định"
                                            guideline="Ai đang thực sự bỏ tiền mua? Độ tuổi, giới tính, nghề nghiệp, thu nhập, hành vi"
                                            example='VD: "Chủ yếu nam 30–45 tuổi, kỹ sư IT hoặc kinh doanh, thu nhập 30–60tr, sống TP.HCM, quan tâm công nghệ và môi trường"'
                                        >
                                            <textarea
                                                {...register('currentCustomers')}
                                                className={textareaClass}
                                                placeholder="Nếu chưa có dữ liệu, có thể để trống"
                                            />
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Lý do khách mua"
                                            badge="important"
                                            subtitle="Lý do mua = insight phân khúc — AI không được tự suy diễn nếu không có dữ liệu này"
                                            guideline="Khách hàng nói lý do gì khi mua? Feedback, review, survey nếu có"
                                            example='VD: "Tiết kiệm xăng · Thích công nghệ · Muốn thể hiện đẳng cấp · Vì môi trường"'
                                        >
                                            <textarea
                                                {...register('purchaseReason')}
                                                className={textareaClass}
                                                placeholder="Ghi nhận từ khách / đội sales / khảo sát"
                                            />
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Lý do khách KHÔNG mua"
                                            badge="important"
                                            subtitle="Rào cản = ranh giới phân khúc — biết ai không mua thì mới biết ai sẽ mua"
                                            guideline="Phản hồi tiêu cực, lý do từ chối, lo ngại phổ biến"
                                            example='VD: "Sợ hết pin · Không tin thương hiệu Việt · Giá quá cao · Thiếu trạm sạc"'
                                        >
                                            <textarea
                                                {...register('nonPurchaseReason')}
                                                className={textareaClass}
                                                placeholder="Objection / concern thường gặp"
                                            />
                                        </StpOptimizerField>
                                    </div>
                                )}

                                {formTab === 3 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 grid grid-cols-1 gap-x-8 gap-y-3.5 duration-300 md:grid-cols-2">
                                        <StpOptimizerField
                                            title="Đối thủ trực tiếp"
                                            badge="required"
                                            subtitle="Không biết đối thủ đang chiếm phân khúc nào thì không thể định vị được"
                                            guideline="Top 2–3 đối thủ và phân khúc họ đang nhắm"
                                            example='VD: "Toyota Corolla Cross (gia đình trung lưu) · Tesla Model Y (công nghệ cao cấp)"'
                                        >
                                            <textarea
                                                {...register('competitorNames', { required: 'Bắt buộc' })}
                                                className={textareaClass}
                                                placeholder="Liệt kê đối thủ + gợi ý phân khúc họ"
                                            />
                                            {errors.competitorNames && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.competitorNames.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="Mục tiêu STP của bạn"
                                            badge="required"
                                            subtitle="AI cần biết bạn muốn dùng STP để làm gì — chiến lược khác nhau tùy mục tiêu"
                                            guideline="Mở rộng phân khúc mới · Tập trung phân khúc hiện tại · Ra mắt sản phẩm mới · Repositioning"
                                            example='VD: "Muốn tìm phân khúc mới chưa khai thác" · "Muốn đánh sâu hơn vào phân khúc hiện tại"'
                                        >
                                            <textarea
                                                {...register('stpGoal', { required: 'Bắt buộc' })}
                                                className={textareaClass}
                                                placeholder="Mục tiêu ngắn gọn"
                                            />
                                            {errors.stpGoal && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.stpGoal.message}</p>
                                            )}
                                        </StpOptimizerField>

                                        <StpOptimizerField
                                            title="USP / Điểm mạnh thực sự"
                                            badge="required"
                                            fullWidth
                                            subtitle="Positioning phải dựa trên điểm mạnh CÓ THẬT — không phải điều bạn muốn mà là điều bạn thực sự có"
                                            guideline="Điều bạn làm tốt hơn đối thủ một cách khách quan — có thể chứng minh được"
                                            example='VD: "Pin 400km thật sự (không phải quảng cáo) · Dịch vụ sau bán hàng 24/7 · Giá thấp hơn Tesla 40% với tính năng tương đương"'
                                        >
                                            <textarea
                                                {...register('uspStrength', { required: 'Bắt buộc' })}
                                                className={textareaClass}
                                                placeholder="Chỉ nêu điểm có bằng chứng / có thể verify"
                                            />
                                            {errors.uspStrength && (
                                                <p className="mt-1 text-[11px] text-rose-600">{errors.uspStrength.message}</p>
                                            )}
                                        </StpOptimizerField>
                                    </div>
                                )}
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-stone-200/60 bg-white/40 px-5 py-4 md:px-6">
                                <div className="flex min-w-0 flex-1 items-center gap-4 text-[11px] text-stone-500">
                                    {formTab > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setFormTab((t) => (t > 1 ? ((t - 1) as 1 | 2 | 3) : t))}
                                            className="h-10 rounded-full border border-stone-200 bg-white px-6 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                                        >
                                            Quay lại
                                        </button>
                                    )}
                                    {isGenerating && thinkingStep ? <span className="italic">{thinkingStep}</span> : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {formTab < 3 && (
                                        <button
                                            type="button"
                                            onClick={() => setFormTab((t) => (t < 3 ? ((t + 1) as 1 | 2 | 3) : t))}
                                            className="h-10 rounded-full bg-stone-900 px-8 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                                        >
                                            Kế tiếp
                                        </button>
                                    )}
                                    {formTab === 3 && (
                                        <button
                                            type="submit"
                                            disabled={isGenerating}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-stone-950 px-10 text-sm font-medium text-white transition-colors hover:bg-stone-900 disabled:opacity-60"
                                        >
                                            {isGenerating && <Loader2 size={18} className="animate-spin" />}
                                            {isGenerating ? 'Đang phân tích...' : 'Phân tích STP'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {stpData && (
                    <div
                        className={`${cardClass} order-3 min-h-[280px] min-w-0 overflow-y-auto p-6 md:p-8 xl:min-h-0 ${showHistory ? '' : 'xl:col-start-2'}`}
                    >
                        <div className="animate-in fade-in zoom-in-95 space-y-8">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-medium text-stone-900">{stpData.positioning.brand_essence}</h2>
                                    <p className="text-sm text-stone-400">Vị thế: {stpData.targeting.primary_segment}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="shrink-0 rounded-xl border border-stone-100 bg-stone-50 p-3 hover:border-stone-300"
                                    aria-label="Lưu phân tích"
                                >
                                    <Save size={18} />
                                </button>
                            </div>

                            <div className="flex w-fit gap-2 rounded-xl bg-stone-100 p-1">
                                {(['segmentation', 'targeting', 'positioning'] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setOutputTab(t)}
                                        className={`rounded-lg px-4 py-2 text-xs font-bold uppercase transition-all ${outputTab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {outputTab === 'segmentation' && (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {stpData.segmentation.segments.map((s, i) => (
                                        <SegmentCard key={i} segment={s} index={i} />
                                    ))}
                                </div>
                            )}

                            {outputTab === 'targeting' && (
                                <div className="space-y-6 rounded-3xl border border-stone-900 bg-stone-900 p-8 text-white">
                                    <div>
                                        <p className="mb-2 text-[10px] font-bold uppercase text-stone-500">Bullseye Targeting</p>
                                        <h3 className="text-2xl font-medium">{stpData.targeting.primary_segment}</h3>
                                    </div>
                                    <p className="font-light italic leading-relaxed text-stone-300">
                                        &ldquo;{stpData.targeting.selection_rationale}&rdquo;
                                    </p>
                                    <div className="grid grid-cols-2 gap-6 border-t border-stone-800 pt-4">
                                        <div>
                                            <p className="mb-2 text-[10px] font-bold uppercase text-stone-500">Market Fit</p>
                                            <p className="text-2xl font-medium">{stpData.targeting.market_fit_score}%</p>
                                        </div>
                                        <div>
                                            <p className="mb-2 text-[10px] font-bold uppercase text-stone-500">Growth Potential</p>
                                            <p className="text-sm">{stpData.targeting.growth_potential}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {outputTab === 'positioning' && (
                                <div className="space-y-6">
                                    <div className="rounded-3xl border border-stone-100 bg-stone-50/50 p-8">
                                        <p className="mb-4 text-[10px] font-bold uppercase text-stone-400">The Position Statement</p>
                                        <p className="text-xl font-medium italic leading-relaxed text-stone-800">
                                            &ldquo;{stpData.positioning.positioning_statement}&rdquo;
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-stone-100 bg-white p-6">
                                            <p className="mb-2 text-[10px] font-bold uppercase text-stone-400">Unique Value</p>
                                            <p className="text-sm font-medium text-stone-900">{stpData.positioning.unique_value_proposition}</p>
                                        </div>
                                        <div className="rounded-2xl border border-stone-100 bg-white p-6">
                                            <p className="mb-2 text-[10px] font-bold uppercase text-stone-400">RTB (Truth)</p>
                                            <div className="space-y-2">
                                                {stpData.positioning.reasons_to_believe.map((r, i) => (
                                                    <p key={i} className="flex items-start gap-2 text-xs text-stone-600">
                                                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-300" aria-hidden />
                                                        <span>{r}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default STPModelGenerator;
