import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Layers, Sparkles, Loader2, Target, Users, Award, AlertTriangle, History, Save, Plus, Trash2, ChevronRight, Zap, BarChart3 } from 'lucide-react';
import { STPInput, STPResult, STPSegment } from '../types';
import { generateSTPAnalysis } from '../services/geminiService';
import { STPService, SavedSTP } from '../services/stpService';
import toast, { Toaster } from 'react-hot-toast';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const SegmentCard: React.FC<{ segment: STPSegment; index: number }> = ({ segment, index }) => (
        <div className={`${cardClass} p-5 transition-all hover:border-stone-300/90`}>
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50/80 text-sm font-medium text-stone-700">
                    {index + 1}
                </div>
                <h4 className="text-base font-medium tracking-tight text-stone-900">{segment.name}</h4>
            </div>
            <p className="mb-4 text-sm font-normal leading-relaxed text-stone-600">{segment.description}</p>

            <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Demographics</p>
                    <p className="text-sm font-normal text-stone-800">{segment.demographics}</p>
                </div>
                <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Psychographics</p>
                    <p className="text-sm font-normal text-stone-800">{segment.psychographics}</p>
                </div>
            </div>

            <div className="mb-3 rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Quy mô ước tính</p>
                <p className="text-sm font-medium text-stone-900">{segment.size_estimate}</p>
            </div>

            <div className="space-y-2">
                <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Nhu cầu</p>
                    <div className="flex flex-wrap gap-1.5">
                        {segment.needs.map((need, i) => (
                            <span key={i} className="rounded-lg border border-stone-200 bg-stone-50/80 px-2 py-1 text-xs font-normal text-stone-700">{need}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Hành vi</p>
                    <div className="flex flex-wrap gap-1.5">
                        {segment.behaviors.map((behavior, i) => (
                            <span key={i} className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-normal text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">{behavior}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
);

const STPModelGenerator: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<STPInput>();
    const [stpData, setStpData] = useState<STPResult | null>(null);
    const [currentInput, setCurrentInput] = useState<STPInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedItems, setSavedItems] = useState<SavedSTP[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [activeTab, setActiveTab] = useState<'segmentation' | 'targeting' | 'positioning'>('segmentation');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const items = await STPService.getSTPHistory();
        setSavedItems(items);
    };

    const onSubmit = async (data: STPInput) => {
        setIsGenerating(true);
        setStpData(null);
        setCurrentInput(data);

        try {
            const result = await generateSTPAnalysis(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setStpData(result);
                if (result.validationStatus === 'PASS') {
                    toast.success('Phân tích STP hoàn tất!', {
                        icon: '🎯',
                        style: { borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }
                    });
                }
            } else {
                toast.error('Không thể phân tích STP.');
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
        if (!stpData || !currentInput) return;

        const newItem: SavedSTP = {
            id: Date.now().toString(),
            input: currentInput,
            data: stpData,
            timestamp: Date.now()
        };

        const success = await STPService.saveSTP(newItem);

        if (success) {
            await loadHistory();
            toast.success('Đã lưu STP Analysis!', { icon: '💾' });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoad = (item: SavedSTP) => {
        setStpData(item.data);
        setCurrentInput(item.input);
        reset(item.input);
        setShowHistory(false);
        toast.success('Đã tải STP Analysis!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await STPService.deleteSTP(id);
        if (success) {
            await loadHistory();
            toast.success('Đã xóa!', { icon: '🗑️' });
        }
    };

    const handleNew = () => {
        setStpData(null);
        setCurrentInput(null);
        reset();
        toast.success('Sẵn sàng phân tích mới!', { icon: '✨' });
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-center" />

            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Layers size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Phân tích STP
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        STP Model Generator
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Segmentation — Targeting — Positioning
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${showHistory
                            ? 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                            : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                            }`}
                    >
                        <History size={17} strokeWidth={1.25} /> Lịch sử ({savedItems.length})
                    </button>
                    {stpData && stpData.validationStatus !== 'FAIL' && (
                        <>
                            <button
                                type="button"
                                onClick={handleNew}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                            >
                                <Plus size={17} strokeWidth={1.25} /> Tạo mới
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                            >
                                <Save size={17} strokeWidth={1.25} /> Lưu
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div
                className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5"
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,400px) 1fr' : 'minmax(0,400px) 1fr' }}
            >
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                    Lịch sử STP
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedItems.length} mục</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedItems.map((item) => (
                                <div
                                    key={item.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleLoad(item)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLoad(item)}
                                    className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <p className="line-clamp-1 text-sm font-medium text-stone-900">{item.input.productBrand}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            aria-label="Xóa"
                                        >
                                            <Trash2 size={14} strokeWidth={1.25} />
                                        </button>
                                    </div>
                                    <p className="mb-1 text-xs font-normal text-stone-500">{item.input.industry}</p>
                                    <p className="text-xs font-normal text-stone-400">{new Date(item.timestamp).toLocaleDateString('vi-VN')}</p>
                                </div>
                            ))}
                            {savedItems.length === 0 && (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có STP nào được lưu</div>
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                        <BarChart3 size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                        Thông tin phân tích
                    </h2>
                    <p className="mb-6 text-sm font-normal leading-relaxed text-stone-500">
                        Nhập thông tin chi tiết để có kết quả chính xác
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Sản phẩm / Thương hiệu *</label>
                            <input
                                {...register('productBrand', { required: 'Vui lòng nhập tên sản phẩm/thương hiệu' })}
                                placeholder="VD: Highlands Coffee, Vinamilk, Grab..."
                                className={inputClass}
                            />
                            {errors.productBrand && <p className="mt-1 text-xs text-red-600">{errors.productBrand.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Ngành hàng *</label>
                            <input
                                {...register('industry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: F&B, FMCG, E-commerce, Real Estate..."
                                className={inputClass}
                            />
                            {errors.industry && <p className="mt-1 text-xs text-red-600">{errors.industry.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Mô tả sản phẩm *</label>
                            <textarea
                                {...register('productDescription', { required: 'Vui lòng mô tả sản phẩm' })}
                                placeholder="Mô tả chi tiết về sản phẩm/dịch vụ, đặc điểm, USP..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                            {errors.productDescription && <p className="mt-1 text-xs text-red-600">{errors.productDescription.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Khoảng giá *</label>
                                <input
                                    {...register('priceRange', { required: 'Vui lòng nhập khoảng giá' })}
                                    placeholder="VD: 50K-100K VNĐ"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-800">Thị trường *</label>
                                <input
                                    {...register('targetMarket', { required: 'Vui lòng nhập thị trường' })}
                                    placeholder="VD: Việt Nam, TP.HCM"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="border-t border-stone-100 pt-5">
                            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                                Thông tin bổ sung (tuỳ chọn)
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Đối thủ cạnh tranh</label>
                                    <input
                                        {...register('competitorNames')}
                                        placeholder="VD: Starbucks, The Coffee House, Phúc Long..."
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Khách hàng hiện tại</label>
                                    <input
                                        {...register('currentCustomers')}
                                        placeholder="VD: Nhân viên văn phòng 25-35 tuổi TP.HCM"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" strokeWidth={1.25} />
                                    <span>{thinkingStep || 'Đang phân tích...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} strokeWidth={1.25} />
                                    Phân tích STP
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-stone-100 bg-stone-50/60 p-4">
                        <h3 className="mb-2 text-sm font-medium text-stone-800">STP Framework</h3>
                        <ul className="space-y-1.5 text-xs font-normal leading-relaxed text-stone-600">
                            <li><span className="font-medium text-stone-800">Segmentation:</span> Chia thị trường thành các phân khúc</li>
                            <li><span className="font-medium text-stone-800">Targeting:</span> Chọn phân khúc mục tiêu phù hợp nhất</li>
                            <li><span className="font-medium text-stone-800">Positioning:</span> Định vị thương hiệu trong tâm trí khách hàng</li>
                        </ul>
                    </div>
                </div>

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!stpData && !isGenerating && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                <Target size={28} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-base font-medium text-stone-700">STP Analysis</p>
                            <p className="mt-1 text-sm font-normal text-stone-500">Nhập thông tin để bắt đầu phân tích</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center">
                            <div className="relative mb-6 h-12 w-12">
                                <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-stone-800" />
                            </div>
                            <p className="mb-1 text-sm font-medium text-stone-800">{thinkingStep}</p>
                            <p className="text-xs font-normal text-stone-500">Đang phân tích STP Framework...</p>
                        </div>
                    )}

                    {stpData && stpData.validationStatus === 'FAIL' && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center">
                            <div className="max-w-md rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100/80">
                                    <AlertTriangle size={28} strokeWidth={1.25} className="text-amber-700" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium tracking-tight text-amber-950">Cần thêm thông tin</h3>
                                <p className="text-sm font-normal leading-relaxed text-amber-900/90">{stpData.clarificationMessage}</p>
                            </div>
                        </div>
                    )}

                    {stpData && !isGenerating && stpData.validationStatus !== 'FAIL' && (
                        <div className="mx-auto max-w-5xl">
                            {stpData.validationStatus === 'WARNING' && (
                                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                                    <AlertTriangle size={20} strokeWidth={1.25} className="mt-0.5 shrink-0 text-amber-700" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-900">Lưu ý</p>
                                        <p className="mt-0.5 text-sm font-normal leading-relaxed text-amber-900/90">{stpData.clarificationMessage}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mb-6 inline-flex w-full max-w-full flex-wrap gap-1 rounded-2xl border border-stone-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:w-fit">
                                {(['segmentation', 'targeting', 'positioning'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab
                                            ? 'bg-stone-900 text-white shadow-sm'
                                            : 'text-stone-600 hover:bg-stone-50/80'
                                            }`}
                                    >
                                        {tab === 'segmentation' && <Users size={16} strokeWidth={1.25} />}
                                        {tab === 'targeting' && <Target size={16} strokeWidth={1.25} />}
                                        {tab === 'positioning' && <Award size={16} strokeWidth={1.25} />}
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'segmentation' && (
                                <div>
                                    <div className="mb-5">
                                        <h2 className="mb-2 font-sans text-xl font-medium tracking-tight text-stone-900 md:text-2xl">Phân khúc thị trường</h2>
                                        <p className="text-sm font-normal leading-relaxed text-stone-500">{stpData.segmentation.analysis_approach}</p>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {stpData.segmentation.segments.map((segment, idx) => (
                                            <SegmentCard key={idx} segment={segment} index={idx} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'targeting' && (
                                <div>
                                    <h2 className="mb-5 font-sans text-xl font-medium tracking-tight text-stone-900 md:text-2xl">Thị trường mục tiêu</h2>

                                    <div className={`${cardClass} mb-6 p-6`}>
                                        <div className="mb-4 flex flex-wrap items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50/80">
                                                <Target size={20} strokeWidth={1.25} className="text-stone-700" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-medium tracking-tight text-stone-900">{stpData.targeting.primary_segment}</h3>
                                                <p className="text-sm font-normal text-stone-500">Phân khúc được chọn</p>
                                            </div>
                                            <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-1.5 text-sm font-medium text-stone-800">
                                                Market Fit: {stpData.targeting.market_fit_score}%
                                            </div>
                                        </div>
                                        <p className="mb-4 text-sm font-normal leading-relaxed text-stone-800">{stpData.targeting.selection_rationale}</p>

                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-4">
                                                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Tiềm năng tăng trưởng</p>
                                                <p className="text-sm font-normal text-stone-900">{stpData.targeting.growth_potential}</p>
                                            </div>
                                            <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-4">
                                                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Khả năng tiếp cận</p>
                                                <p className="text-sm font-normal text-stone-900">{stpData.targeting.accessibility}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Rủi ro</p>
                                            <div className="space-y-2">
                                                {stpData.targeting.risks.map((risk, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-sm font-normal text-rose-900/90">
                                                        <AlertTriangle size={16} strokeWidth={1.25} className="mt-0.5 shrink-0 text-rose-600" />
                                                        {risk}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'positioning' && (
                                <div>
                                    <h2 className="mb-5 font-sans text-xl font-medium tracking-tight text-stone-900 md:text-2xl">Định vị thương hiệu</h2>

                                    <div className="mb-6 rounded-2xl border border-stone-900/10 bg-stone-50/40 p-6 ring-1 ring-stone-200/80">
                                        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">Positioning Statement</p>
                                        <p className="text-lg font-normal leading-relaxed text-stone-900">{stpData.positioning.positioning_statement}</p>
                                    </div>

                                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <div className={`${cardClass} p-5`}>
                                            <div className="mb-3 flex items-center gap-2">
                                                <Zap size={18} strokeWidth={1.25} className="text-stone-500" />
                                                <p className="text-sm font-medium text-stone-900">Unique Value Proposition</p>
                                            </div>
                                            <p className="text-sm font-normal leading-relaxed text-stone-700">{stpData.positioning.unique_value_proposition}</p>
                                        </div>
                                        <div className={`${cardClass} p-5`}>
                                            <div className="mb-3 flex items-center gap-2">
                                                <Award size={18} strokeWidth={1.25} className="text-stone-500" />
                                                <p className="text-sm font-medium text-stone-900">Brand Essence</p>
                                            </div>
                                            <p className="text-lg font-medium tracking-tight text-stone-900">{stpData.positioning.brand_essence}</p>
                                            <p className="mt-1 text-sm font-normal text-stone-500">{stpData.positioning.competitive_frame}</p>
                                        </div>
                                    </div>

                                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <div className={`${cardClass} p-5`}>
                                            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Key Differentiators</p>
                                            <div className="space-y-2">
                                                {stpData.positioning.key_differentiators.map((diff, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm font-normal text-stone-800">
                                                        <ChevronRight size={16} strokeWidth={1.25} className="shrink-0 text-stone-400" />
                                                        {diff}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={`${cardClass} p-5`}>
                                            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">Reasons to Believe</p>
                                            <div className="space-y-2">
                                                {stpData.positioning.reasons_to_believe.map((rtb, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm font-normal text-stone-800">
                                                        <ChevronRight size={16} strokeWidth={1.25} className="shrink-0 text-stone-400" />
                                                        {rtb}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
                                        <h3 className="mb-4 flex items-center gap-2 text-base font-medium tracking-tight">
                                            <Sparkles size={18} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                            Action Plan
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                            <div>
                                                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Hành động ngay</p>
                                                <ul className="space-y-1.5">
                                                    {stpData.actionPlan.immediate_actions.map((action, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm font-normal text-stone-200">
                                                            <span className="text-stone-500" aria-hidden>•</span>
                                                            {action}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Kênh Marketing</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {stpData.actionPlan.marketing_channels.map((channel, idx) => (
                                                        <span key={idx} className="rounded-lg border border-stone-600 bg-stone-800/80 px-2 py-1 text-xs font-normal text-stone-200">{channel}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">Messaging Hooks</p>
                                                <ul className="space-y-1.5">
                                                    {stpData.actionPlan.messaging_hooks.map((hook, idx) => (
                                                        <li key={idx} className="text-sm font-normal italic text-stone-300">&ldquo;{hook}&rdquo;</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default STPModelGenerator;
