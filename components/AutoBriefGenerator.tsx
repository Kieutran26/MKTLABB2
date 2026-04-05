import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Sparkles, FileText, Download, Loader2, History, Save, Trash2, X, Plus, Edit3, Check, Target, Users, Megaphone, TrendingUp, Calendar, BarChart3, ChevronRight } from 'lucide-react';
import { BriefData } from '../types';
import { generateAutoBrief, AutoBriefInput } from '../services/geminiService';
import { BriefService, SavedBrief } from '../services/briefService';
import { Toast, ToastType } from './Toast';
import FeatureHeader from './FeatureHeader';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const INDUSTRIES = [
    { value: 'fnb', label: 'F&B / Ẩm thực' },
    { value: 'fashion', label: 'Thời trang' },
    { value: 'beauty', label: 'Làm đẹp / Mỹ phẩm' },
    { value: 'health', label: 'Sức khỏe / Fitness' },
    { value: 'tech', label: 'Công nghệ / SaaS' },
    { value: 'education', label: 'Giáo dục' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'real_estate', label: 'Bất động sản' },
    { value: 'b2b', label: 'B2B' },
    { value: 'other', label: 'Khác' },
];

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const EditableBlock = ({
    label,
    value,
    onChange,
    icon: Icon,
    multiline = false
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    icon?: any;
    multiline?: boolean;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
        onChange(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    return (
        <div className="group relative rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-300 hover:border-stone-300">
            <div className="flex items-start gap-4">
                {Icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-500">
                        <Icon size={18} strokeWidth={1.25} />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</div>
                    {isEditing ? (
                        <div className="space-y-3">
                            {multiline ? (
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full resize-none rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-800 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-200/80"
                                    rows={4}
                                    autoFocus
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-800 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-200/80"
                                    autoFocus
                                />
                            )}
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-800">
                                    <Check size={12} /> Lưu
                                </button>
                                <button onClick={handleCancel} className="rounded-lg border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50">
                                    Hủy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="cursor-pointer text-[15px] leading-relaxed text-stone-700 transition-colors hover:text-stone-900"
                            onClick={() => setIsEditing(true)}
                        >
                            {value || <span className="text-sm italic text-stone-300">Chưa có nội dung...</span>}
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="rounded-lg p-2 text-stone-300 opacity-0 transition-all hover:bg-stone-100 hover:text-stone-700 group-hover:opacity-100"
                    >
                        <Edit3 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};



const AutoBriefGenerator: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<AutoBriefInput>();
    const [briefData, setBriefData] = useState<BriefData | null>(null);
    const [currentInput, setCurrentInput] = useState<AutoBriefInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [showHistory, setShowHistory] = useState(false);
    const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
    const briefRef = useRef<HTMLDivElement>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);


    React.useEffect(() => {
        const loadBriefs = async () => {
            const briefs = await BriefService.getBriefs();
            setSavedBriefs(briefs);
        };
        loadBriefs();
    }, []);

    const onSubmit = async (data: AutoBriefInput) => {
        setIsGenerating(true);
        setBriefData(null);
        setCurrentInput(data);

        try {
            const result = await generateAutoBrief(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setBriefData(result);
                setToast({ message: 'Brief đã được tạo!', type: 'success' });
            } else {
                setToast({ message: 'Không thể tạo brief.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Đã xảy ra lỗi.', type: 'error' });
            console.error(error);
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSaveBrief = async () => {
        if (!briefData || !currentInput) return;

        const newBrief: SavedBrief = {
            id: Date.now().toString(),
            input: currentInput,
            data: briefData,
            timestamp: Date.now()
        };

        const success = await BriefService.saveBrief(newBrief);

        if (success) {
            const briefs = await BriefService.getBriefs();
            setSavedBriefs(briefs);
            setToast({ message: 'Đã lưu Brief!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi lưu!', type: 'error' });
        }
    };

    const handleNew = () => {
        setBriefData(null);
        setCurrentInput(null);
        reset();
        setToast({ message: 'Sẵn sàng tạo Brief mới!', type: 'success' });
    };

    const handleLoadBrief = (brief: SavedBrief) => {
        setBriefData(brief.data);
        setCurrentInput(brief.input);
        reset(brief.input);
        setShowHistory(false);
        setToast({ message: 'Đã tải Brief!', type: 'success' });
    };

    const handleDeleteBrief = async (id: string) => {
        const success = await BriefService.deleteBrief(id);

        if (success) {
            const briefs = await BriefService.getBriefs();
            setSavedBriefs(briefs);
            setToast({ message: 'Đã xóa!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi xóa!', type: 'error' });
        }
    };

    const handleExportPDF = async () => {
        if (!briefRef.current || !briefData) return;

        setToast({ message: 'Đang tạo PDF...', type: 'info' });

        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: `${briefData.project_name || 'Marketing_Brief'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        try {
            await html2pdf().set(opt).from(briefRef.current).save();
            setToast({ message: 'Đã xuất PDF!', type: 'success' });
        } catch (err) {
            setToast({ message: 'Lỗi xuất PDF', type: 'error' });
            console.error(err);
        }
    };

    const updateBriefField = (path: string, value: string) => {
        if (!briefData) return;
        const keys = path.split('.');
        const newData = { ...briefData };
        let current: any = newData;
        for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
        current[keys[keys.length - 1]] = value;
        setBriefData(newData);
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <FeatureHeader
                icon={FileText}
                eyebrow="CAMPAIGN PLANNING"
                title="Auto Brief Generator"
                subline="Lập kế hoạch Marketing tự động — Xây dựng campaign brief chuyên nghiệp chỉ trong vài giây."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-95 ${showHistory ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                    >
                        <History size={18} strokeWidth={2} />
                    </button>
                    {briefData && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleNew}
                                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveBrief}
                                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-stone-900 px-5 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-95 shadow-sm"
                            >
                                <Save size={16} /> Lưu Brief
                            </button>
                            <button
                                type="button"
                                onClick={handleExportPDF}
                                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95"
                            >
                                <Download size={16} /> Xuất PDF
                            </button>
                        </div>
                    )}
                </div>
            </FeatureHeader>

            <div
                className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5"
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,420px) 1fr' : 'minmax(0,420px) 1fr' }}
            >
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" />
                                    Lịch sử Brief
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedBriefs.length} mục</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedBriefs.length === 0 ? (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">
                                    Chưa có Brief nào được lưu.
                                </div>
                            ) : (
                                savedBriefs.map((brief) => (
                                    <div
                                        key={brief.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleLoadBrief(brief)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoadBrief(brief)}
                                        className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <p className="line-clamp-1 text-sm font-medium text-stone-900">{brief.data.project_name}</p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteBrief(brief.id);
                                                }}
                                                className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                aria-label="Xóa"
                                            >
                                                <Trash2 size={14} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        <p className="mb-1 text-xs font-normal text-stone-500 line-clamp-1">
                                            {brief.input.productBrand} • {brief.input.industry}
                                        </p>
                                        <p className="text-xs font-normal text-stone-400">
                                            {new Date(brief.timestamp).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 text-lg font-medium tracking-tight text-stone-900">
                        <FileText size={20} strokeWidth={1.25} className="text-stone-400" />
                        Thông tin dự án
                    </h2>
                    <p className="mb-6 text-sm font-normal text-stone-500">
                        Cung cấp thông tin đầu vào để AI phân tích.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Sản phẩm / Thương hiệu *</label>
                            <input
                                {...register('productBrand', { required: 'Vui lòng nhập tên sản phẩm' })}
                                placeholder="VD: Cafe giảm cân SlimX"
                                className={inputClass}
                            />
                            {errors.productBrand && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.productBrand.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Ngành hàng *</label>
                            <div className="relative">
                                <select
                                    {...register('industry', { required: 'Vui lòng chọn ngành hàng' })}
                                    className={`${inputClass} appearance-none pr-11`}
                                >
                                    <option value="" className="text-stone-400">Chọn ngành hàng...</option>
                                    {INDUSTRIES.map(ind => <option key={ind.value} value={ind.value}>{ind.label}</option>)}
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                    <ChevronRight size={18} className="rotate-90" strokeWidth={1.25} />
                                </div>
                            </div>
                            {errors.industry && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.industry.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Mục tiêu Campaign *</label>
                            <textarea
                                {...register('goal', { required: 'Vui lòng nhập mục tiêu' })}
                                placeholder="VD: Bán 10,000 hộp trong tháng đầu..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                            {errors.goal && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.goal.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Đối tượng mục tiêu *</label>
                            <textarea
                                {...register('targetAudience', { required: 'Vui lòng nhập đối tượng' })}
                                placeholder="VD: Dân văn phòng 25-40 tuổi..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                            {errors.targetAudience && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.targetAudience.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">USP / Điểm khác biệt (Tùy chọn)</label>
                            <textarea
                                {...register('usp')}
                                placeholder="VD: Công thức độc quyền từ Nhật Bản, không chứa Paraben..."
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Ngân sách (Rất quan trọng)
                            </label>
                            <select
                                {...register('budget')}
                                className={`${inputClass} appearance-none`}
                            >
                                <option value="">Chọn mức ngân sách...</option>
                                <option value="20 triệu">{'<'} 50 triệu (Micro) - Chỉ Organic/Seeding</option>
                                <option value="100 triệu">50-200 triệu (Nhỏ) - Paid + Micro-KOL</option>
                                <option value="300 triệu">200-500 triệu (Trung) - KOC Army + Photoshoot</option>
                                <option value="700 triệu">500tr-1 tỷ (Lớn) - Macro-KOL + Event</option>
                                <option value="2 tỷ">{'>'} 1 tỷ (Enterprise) - TVC + Celebrity</option>
                            </select>
                            <p className="mt-1 text-xs text-stone-500">AI sẽ lọc bỏ chiến thuật không phù hợp với ngân sách.</p>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Thời gian chiến dịch</label>
                            <select
                                {...register('duration')}
                                className={`${inputClass} appearance-none`}
                            >
                                <option value="">Chọn thời gian...</option>
                                <option value="1 tháng">1 tháng (Sprint)</option>
                                <option value="3 tháng">3 tháng (Quarter)</option>
                                <option value="6 tháng">6 tháng (Half-year)</option>
                                <option value="1 năm">1 năm (Annual)</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Mandatories / Cấm kỵ (Tùy chọn)</label>
                            <textarea
                                {...register('mandatories')}
                                placeholder="VD: Không dùng hình ảnh người nổi tiếng, Phải có logo ở mọi ấn phẩm, Không nhắc đến đối thủ X..."
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang xử lý...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} strokeWidth={1.25} />
                                    Tạo Brief Tự Động
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!briefData && !isGenerating && (
                        <div className="flex min-h-[360px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80">
                                <FileText size={30} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-sm font-normal text-center max-w-xs">
                                Điền thông tin bên trái để bắt đầu.
                            </p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex min-h-[360px] flex-col items-center justify-center">
                            <div className="relative mb-8 h-14 w-14">
                                <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-800 animate-spin"></div>
                            </div>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">{thinkingStep}</p>
                            <p className="text-sm font-normal text-stone-400">AI đang phân tích dữ liệu...</p>
                        </div>
                    )}

                    {briefData && !isGenerating && (
                        <div ref={briefRef} className="space-y-8">
                            <div className="rounded-2xl border border-stone-200 p-5">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Campaign Name</div>
                                <h2 className="text-3xl font-bold text-stone-900 tracking-tight">{briefData.project_name}</h2>
                            </div>

                            <EditableBlock
                                label="Phân tích bối cảnh"
                                value={briefData.context_analysis}
                                onChange={(val) => updateBriefField('context_analysis', val)}
                                icon={BarChart3}
                                multiline
                            />

                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                    <Target size={14} className="text-stone-400" /> Mục tiêu
                                </h3>
                                <EditableBlock label="Business Goal" value={briefData.objectives?.business || ''} onChange={(val) => updateBriefField('objectives.business', val)} />
                                <EditableBlock label="Marketing Goal" value={briefData.objectives?.marketing || ''} onChange={(val) => updateBriefField('objectives.marketing', val)} />
                                <EditableBlock label="Communication Goal" value={briefData.objectives?.communication || ''} onChange={(val) => updateBriefField('objectives.communication', val)} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                    <Users size={14} className="text-stone-400" /> Đối tượng
                                </h3>
                                <EditableBlock label="Demographic" value={briefData.target_persona?.demographic || ''} onChange={(val) => updateBriefField('target_persona.demographic', val)} />
                                <EditableBlock label="Psychographic" value={briefData.target_persona?.psychographic || ''} onChange={(val) => updateBriefField('target_persona.psychographic', val)} />
                                <EditableBlock label="Core Insight" value={briefData.target_persona?.insight || ''} onChange={(val) => updateBriefField('target_persona.insight', val)} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                    <Megaphone size={14} className="text-stone-400" /> Chiến lược
                                </h3>
                                <EditableBlock label="Core Message" value={briefData.strategy?.core_message || ''} onChange={(val) => updateBriefField('strategy.core_message', val)} />
                                <EditableBlock label="Key Hook" value={briefData.strategy?.key_hook || ''} onChange={(val) => updateBriefField('strategy.key_hook', val)} />
                                <EditableBlock label="Tone & Mood" value={briefData.strategy?.tone_mood || ''} onChange={(val) => updateBriefField('strategy.tone_mood', val)} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                    <Calendar size={14} className="text-stone-400" /> Timeline
                                </h3>
                                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-5">
                                    {briefData.execution_plan?.map((phase, idx) => (
                                        <div key={idx} className="mb-3 last:mb-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold text-stone-700">{phase.phase}</span>
                                                <ChevronRight size={12} className="text-stone-400" />
                                                <span className="text-xs text-stone-500">{phase.channel}</span>
                                            </div>
                                            <p className="text-sm text-stone-600 pl-4">{phase.activity}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                    <TrendingUp size={14} className="text-stone-400" /> KPIs
                                </h3>
                                <EditableBlock label="Success Metrics" value={briefData.kpis_deliverables?.success_metrics || ''} onChange={(val) => updateBriefField('kpis_deliverables.success_metrics', val)} />
                                <EditableBlock label="Estimated Reach" value={briefData.kpis_deliverables?.estimated_reach || ''} onChange={(val) => updateBriefField('kpis_deliverables.estimated_reach', val)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AutoBriefGenerator;

