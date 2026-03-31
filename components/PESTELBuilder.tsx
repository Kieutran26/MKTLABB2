import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import {
    Globe, Sparkles, Loader2, Landmark, TrendingUp, Users, Cpu, Leaf, Scale,
    History, Save, Plus, Trash2, AlertCircle, CheckCircle, HelpCircle, Flag, Briefcase, Lightbulb
} from 'lucide-react';
import { PESTELBuilderInput, PESTELBuilderResult, PESTELFactorGroup, PESTELItem } from '../types';
import { generatePESTELAnalysis } from '../services/geminiService';
import { PESTELService, SavedPESTEL } from '../services/pestelService';
import toast, { Toaster } from 'react-hot-toast';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const PESTEL_ICONS: Record<string, LucideIcon> = {
    Political: Landmark,
    Economic: TrendingUp,
    Social: Users,
    Technological: Cpu,
    Environmental: Leaf,
    Legal: Scale
};

const PESTELBuilder: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<PESTELBuilderInput>();
    const [pestelData, setPestelData] = useState<PESTELBuilderResult | null>(null);
    const [currentInput, setCurrentInput] = useState<PESTELBuilderInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedReports, setSavedReports] = useState<SavedPESTEL[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    useEffect(() => {
        loadSavedReports();
    }, []);

    const loadSavedReports = async () => {
        const reports = await PESTELService.getReports();
        setSavedReports(reports);
    };

    const onSubmit = async (data: PESTELBuilderInput) => {
        setIsGenerating(true);
        setPestelData(null);
        setCurrentInput(data);

        try {
            const result = await generatePESTELAnalysis(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setPestelData(result);
                toast.success('Phân tích PESTEL hoàn tất!', {
                    icon: '🌍',
                    style: { borderRadius: '12px', background: '#fafaf9', border: '1px solid #e7e5e4' }
                });
            } else {
                toast.error('Không thể phân tích PESTEL.');
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
        if (!pestelData || !currentInput) return;

        const newReport: SavedPESTEL = {
            id: Date.now().toString(),
            input: currentInput,
            data: pestelData,
            timestamp: Date.now()
        };

        const success = await PESTELService.saveReport(newReport);

        if (success) {
            await loadSavedReports();
            toast.success('Đã lưu báo cáo PESTEL!', {
                icon: '💾',
                style: { borderRadius: '12px', background: '#fafaf9', border: '1px solid #e7e5e4' }
            });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoad = (report: SavedPESTEL) => {
        setPestelData(report.data);
        setCurrentInput(report.input);
        reset(report.input);
        setShowHistory(false);
        toast.success('Đã tải báo cáo!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await PESTELService.deleteReport(id);

        if (success) {
            await loadSavedReports();
            toast.success('Đã xóa!', { icon: '🗑️' });
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleNew = () => {
        setPestelData(null);
        setCurrentInput(null);
        setExpandedCategory(null);
        reset();
        toast.success('Sẵn sàng phân tích mới!', { icon: '✨' });
    };

    const getImpactDot = (item: PESTELItem) => {
        if (item.impact_direction === 'Positive') return 'bg-emerald-500';
        if (item.impact_direction === 'Negative') return 'bg-rose-500';
        return 'bg-amber-500';
    };

    const getVerificationIcon = (status: string) => {
        if (status === 'Verified') return <CheckCircle size={14} strokeWidth={1.25} className="text-emerald-600" />;
        if (status === 'Estimated') return <HelpCircle size={14} strokeWidth={1.25} className="text-amber-600" />;
        return <AlertCircle size={14} strokeWidth={1.25} className="text-rose-600" />;
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-center" />

            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Globe size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Phân tích PESTEL
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        PESTEL Builder
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Macroeconomic Environment Analysis
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
                        <History size={17} strokeWidth={1.25} /> Lịch sử ({savedReports.length})
                    </button>
                    {pestelData && (
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
                                <Save size={17} strokeWidth={1.25} /> Lưu báo cáo
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div
                className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5"
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,380px) 1fr' : 'minmax(0,380px) 1fr' }}
            >
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                    Lịch sử báo cáo
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedReports.length} mục</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedReports.map((report) => (
                                <div
                                    key={report.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleLoad(report)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLoad(report)}
                                    className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <p className="line-clamp-1 text-sm font-medium text-stone-900">{report.input.industry}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(report.id);
                                            }}
                                            className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            aria-label="Xóa"
                                        >
                                            <Trash2 size={14} strokeWidth={1.25} />
                                        </button>
                                    </div>
                                    <p className="mb-1 text-xs font-normal text-stone-500">{report.input.location}</p>
                                    <p className="text-xs font-normal text-stone-400">
                                        {new Date(report.timestamp).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            ))}
                            {savedReports.length === 0 && (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có báo cáo nào được lưu</div>
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                        <Briefcase size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                        Thông tin Doanh nghiệp
                    </h2>
                    <p className="mb-6 text-sm font-normal leading-relaxed text-stone-500">
                        Nhập đủ 3 tham số ngữ cảnh bắt buộc
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Ngành hàng (Industry) *</label>
                            <input
                                {...register('industry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: Bất động sản nghỉ dưỡng, F&B, Fintech..."
                                className={inputClass}
                            />
                            {errors.industry && <p className="mt-1 text-xs text-red-600">{errors.industry.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Thị trường (Location) *</label>
                            <input
                                {...register('location', { required: 'Vui lòng nhập thị trường' })}
                                placeholder="VD: Việt Nam - Đà Nẵng, TP.HCM, Toàn quốc..."
                                className={inputClass}
                            />
                            {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800">Quy mô Doanh nghiệp (Business Scale) *</label>
                            <select
                                {...register('businessScale', { required: 'Vui lòng chọn quy mô' })}
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value="">-- Chọn quy mô --</option>
                                <option value="Startup">Startup (Khởi nghiệp)</option>
                                <option value="SME">SME (Doanh nghiệp vừa và nhỏ)</option>
                                <option value="Enterprise">Enterprise (Doanh nghiệp lớn)</option>
                                <option value="Multinational">Multinational (Tập đoàn đa quốc gia)</option>
                            </select>
                            {errors.businessScale && <p className="mt-1 text-xs text-red-600">{errors.businessScale.message}</p>}
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
                                    Phân tích PESTEL
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-950">
                            <Lightbulb size={16} strokeWidth={1.25} className="text-amber-700/80 shrink-0" aria-hidden />
                            Anti-Hallucination Protocol
                        </h3>
                        <ul className="space-y-1 text-xs font-normal leading-relaxed text-amber-900/85">
                            <li>P/L: Trích dẫn Luật, Nghị định cụ thể</li>
                            <li>E: Số liệu GDP, CPI, Lãi suất %</li>
                            <li>S/T: Hành vi tiêu dùng thực tế</li>
                            <li>Không có nguồn → Đánh dấu &quot;Unverified&quot;</li>
                        </ul>
                    </div>
                </div>

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!pestelData && !isGenerating && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                <Globe size={28} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-base font-medium text-stone-700">PESTEL Analysis</p>
                            <p className="mt-1 text-sm font-normal text-stone-500">Nhập thông tin để bắt đầu phân tích</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center">
                            <div className="relative mb-6 h-14 w-14">
                                <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-stone-800" />
                            </div>
                            <p className="mb-1 text-sm font-medium text-stone-800">{thinkingStep}</p>
                            <p className="text-xs font-normal text-stone-500">Đang áp dụng Citation or Doubt Protocol...</p>
                        </div>
                    )}

                    {pestelData && !isGenerating && (
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-6">
                                <h2 className="mb-1 font-sans text-xl font-medium tracking-tight text-stone-900 md:text-2xl">{pestelData.context}</h2>
                                <p className="text-sm font-normal text-stone-500">
                                    {pestelData.data_freshness} • Tạo lúc {new Date(pestelData.generated_at).toLocaleString('vi-VN')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {pestelData.pestel_factors.map((factor: PESTELFactorGroup) => {
                                    const IconComponent = PESTEL_ICONS[factor.category] || Landmark;
                                    const isExpanded = expandedCategory === factor.category;

                                    return (
                                        <div
                                            key={factor.category}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setExpandedCategory(isExpanded ? null : factor.category)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setExpandedCategory(isExpanded ? null : factor.category);
                                                }
                                            }}
                                            className={`cursor-pointer p-5 transition-all ${cardClass} ${isExpanded ? 'col-span-1 border-stone-900 ring-1 ring-stone-200 sm:col-span-2 lg:col-span-3' : 'hover:border-stone-300/90'}`}
                                        >
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50/80">
                                                    <IconComponent size={20} strokeWidth={1.25} className="text-stone-700" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-medium tracking-tight text-stone-900">{factor.category_vi}</h3>
                                                    <p className="text-xs font-normal text-stone-500">{factor.items.length} yếu tố</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    {factor.items.slice(0, 3).map((item, idx) => (
                                                        <div key={idx} className={`h-2.5 w-2.5 shrink-0 rounded-full ${getImpactDot(item)}`} />
                                                    ))}
                                                </div>
                                            </div>

                                            {!isExpanded && factor.items.length > 0 && (
                                                <div className="space-y-2">
                                                    {factor.items.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-2">
                                                            <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getImpactDot(item)}`} />
                                                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                                                <p className="line-clamp-1 text-xs font-normal text-stone-700">{item.factor}</p>
                                                                {item.is_priority && (
                                                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-900">
                                                                        <Flag size={10} strokeWidth={1.25} /> Ưu tiên
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {factor.items.length > 2 && (
                                                        <p className="text-xs font-normal text-stone-400">+{factor.items.length - 2} yếu tố khác...</p>
                                                    )}
                                                </div>
                                            )}

                                            {isExpanded && (
                                                <div className="mt-4 space-y-4">
                                                    {factor.items.map((item, idx) => (
                                                        <div key={idx} className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                                                            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                                    <div className={`h-3 w-3 shrink-0 rounded-full ${getImpactDot(item)}`} />
                                                                    <h4 className="text-sm font-medium text-stone-900">{item.factor}</h4>
                                                                    {item.is_priority && (
                                                                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-900">
                                                                            <Flag size={11} strokeWidth={1.25} /> High Priority
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {getVerificationIcon(item.verification_status)}
                                                                    <span
                                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.verification_status === 'Verified'
                                                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                                                                            : item.verification_status === 'Estimated'
                                                                                ? 'border border-amber-200 bg-amber-50 text-amber-900'
                                                                                : 'border border-rose-200 bg-rose-50 text-rose-900'
                                                                            }`}
                                                                    >
                                                                        {item.verification_status}
                                                                    </span>
                                                                    <span className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-xs font-medium text-stone-800">
                                                                        {item.impact_score}/10
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="mb-3 text-sm font-normal leading-relaxed text-stone-700">{item.detail}</p>
                                                            {item.source && (
                                                                <p className="mb-2 text-xs font-normal italic text-stone-500">Nguồn: {item.source}</p>
                                                            )}
                                                            <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                                                <p className="text-xs font-medium text-stone-800">
                                                                    <span className="text-stone-500">Khuyến nghị: </span>
                                                                    {item.actionable_insight}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-normal text-stone-600">Cơ hội (Positive)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                                    <span className="text-xs font-normal text-stone-600">Trung lập (Neutral)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                                    <span className="text-xs font-normal text-stone-600">Thách thức (Negative)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-900">
                                        <Flag size={10} strokeWidth={1.25} /> High Priority
                                    </span>
                                    <span className="text-xs font-normal text-stone-600">Ưu tiên xử lý (≥8/10)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PESTELBuilder;
