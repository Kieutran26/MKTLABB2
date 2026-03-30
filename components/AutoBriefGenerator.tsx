import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Sparkles, FileText, Download, Loader2, History, Save, Trash2, X, Plus, Edit3, Check, Target, Users, Megaphone, TrendingUp, Calendar, BarChart3, ChevronRight } from 'lucide-react';
import { BriefData } from '../types';
import { generateAutoBrief, AutoBriefInput } from '../services/geminiService';
import { BriefService, SavedBrief } from '../services/briefService';
import toast, { Toaster } from 'react-hot-toast';
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

const EditableBlock = ({
    label,
    value,
    onChange,
    icon: Icon,
    multiline = false,
    accentColor = 'indigo'
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    icon?: any;
    multiline?: boolean;
    accentColor?: string;
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
        <div className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#545BE8]/30 hover:shadow-md transition-all duration-300">
            <div className="flex items-start gap-4">
                {Icon && (
                    <div className={`w-10 h-10 rounded-xl bg-${accentColor}-50 text-${accentColor}-600 flex items-center justify-center shrink-0`}>
                        <Icon size={18} strokeWidth={2} />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
                    {isEditing ? (
                        <div className="space-y-3">
                            {multiline ? (
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-[#545BE8]/20 focus:border-[#545BE8] outline-none resize-none"
                                    rows={4}
                                    autoFocus
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-[#545BE8]/20 focus:border-[#545BE8] outline-none"
                                    autoFocus
                                />
                            )}
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="px-4 py-1.5 bg-[#545BE8] text-white text-xs font-bold rounded-lg hover:bg-[#4349c2] transition-colors flex items-center gap-1">
                                    <Check size={12} /> Lưu
                                </button>
                                <button onClick={handleCancel} className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
                                    Hủy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="text-[15px] text-slate-700 leading-relaxed cursor-pointer hover:text-slate-900 transition-colors"
                            onClick={() => setIsEditing(true)}
                        >
                            {value || <span className="text-slate-300 italic text-sm">Chưa có nội dung...</span>}
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-[#545BE8] hover:bg-[#545BE8]/5 rounded-lg transition-all"
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
                toast.success('Brief đã được tạo!', {
                    icon: '✨',
                    style: { borderRadius: '12px', background: '#F0FDF4', color: '#166534', fontWeight: 600, fontSize: '14px' }
                });
            } else {
                toast.error('Không thể tạo brief.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi.');
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
            toast.success('Đã lưu Brief!', {
                icon: '💾',
                style: { borderRadius: '12px', background: '#EFF6FF', color: '#1E40AF', fontWeight: 600, fontSize: '14px' }
            });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleNew = () => {
        setBriefData(null);
        setCurrentInput(null);
        reset();
        toast.success('Sẵn sàng tạo Brief mới!', { icon: '✨' });
    };

    const handleLoadBrief = (brief: SavedBrief) => {
        setBriefData(brief.data);
        setCurrentInput(brief.input);
        reset(brief.input);
        setShowHistory(false);
        toast.success('Đã tải Brief!', { icon: '📂' });
    };

    const handleDeleteBrief = async (id: string) => {
        const success = await BriefService.deleteBrief(id);

        if (success) {
            const briefs = await BriefService.getBriefs();
            setSavedBriefs(briefs);
            toast.success('Đã xóa!', { icon: '🗑️' });
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleExportPDF = async () => {
        if (!briefRef.current || !briefData) return;

        toast.loading('Đang tạo PDF...', { id: 'pdf' });

        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: `${briefData.project_name || 'Marketing_Brief'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        try {
            await html2pdf().set(opt).from(briefRef.current).save();
            toast.success('Đã xuất PDF!', { id: 'pdf', icon: '📄' });
        } catch (err) {
            toast.error('Lỗi xuất PDF', { id: 'pdf' });
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
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#545BE8]/10 text-[#545BE8] rounded-xl flex items-center justify-center">
                        <FileText size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Auto Brief Generator</h1>
                        <p className="text-xs text-slate-500 font-medium">Lập kế hoạch Marketing tự động</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                    >
                        <History size={16} /> Lịch sử ({savedBriefs.length})
                    </button>
                    {briefData && (
                        <>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                onClick={handleSaveBrief}
                                className="flex items-center gap-2 px-4 py-2 bg-[#545BE8] hover:bg-[#4349C8] text-white font-bold rounded-xl transition-all text-sm"
                            >
                                <Save size={16} /> Lưu Brief
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                            >
                                <Download size={16} /> Xuất PDF
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-[400px] bg-white border-r border-slate-200 p-8 overflow-y-auto">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <h2 className="text-base font-bold text-slate-800">Thông tin dự án</h2>
                        </div>
                        <p className="text-sm text-slate-500 pl-9">Cung cấp thông tin đầu vào để AI phân tích.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pl-2">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Sản phẩm / Thương hiệu</label>
                            <input
                                {...register('productBrand', { required: 'Vui lòng nhập tên sản phẩm' })}
                                placeholder="VD: Cafe giảm cân SlimX"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#545BE8]/20 focus:border-[#545BE8] outline-none transition-all"
                            />
                            {errors.productBrand && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.productBrand.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ngành hàng</label>
                            <div className="relative group">
                                <select
                                    {...register('industry', { required: 'Vui lòng chọn ngành hàng' })}
                                    className="w-full px-4 py-3.5 pr-11 bg-gradient-to-br from-white to-slate-50/50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#545BE8]/30 focus:border-[#545BE8] hover:border-slate-300 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:shadow-md"
                                >
                                    <option value="" className="text-slate-400">🎯 Chọn ngành hàng...</option>
                                    {INDUSTRIES.map(ind => <option key={ind.value} value={ind.value}>{ind.label}</option>)}
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#545BE8] transition-transform group-hover:scale-110">
                                    <ChevronRight size={18} className="rotate-90" strokeWidth={2.5} />
                                </div>
                            </div>
                            {errors.industry && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.industry.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mục tiêu Campaign</label>
                            <textarea
                                {...register('goal', { required: 'Vui lòng nhập mục tiêu' })}
                                placeholder="VD: Bán 10,000 hộp trong tháng đầu..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#545BE8]/20 focus:border-[#545BE8] outline-none transition-all resize-none"
                            />
                            {errors.goal && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.goal.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Đối tượng mục tiêu</label>
                            <textarea
                                {...register('targetAudience', { required: 'Vui lòng nhập đối tượng' })}
                                placeholder="VD: Dân văn phòng 25-40 tuổi..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#545BE8]/20 focus:border-[#545BE8] outline-none transition-all resize-none"
                            />
                            {errors.targetAudience && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.targetAudience.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">USP / Điểm khác biệt (Tùy chọn)</label>
                            <textarea
                                {...register('usp')}
                                placeholder="VD: Công thức độc quyền từ Nhật Bản, không chứa Paraben..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#545BE8]/20 focus:border-[#545BE8] outline-none transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                💰 Ngân sách (RẤT QUAN TRỌNG)
                            </label>
                            <select
                                {...register('budget')}
                                className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#545BE8]/30 focus:border-[#545BE8] outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">💰 Chọn mức ngân sách...</option>
                                <option value="20 triệu">{'<'} 50 triệu (Micro) - Chỉ Organic/Seeding</option>
                                <option value="100 triệu">50-200 triệu (Nhỏ) - Paid + Micro-KOL</option>
                                <option value="300 triệu">200-500 triệu (Trung) - KOC Army + Photoshoot</option>
                                <option value="700 triệu">500tr-1 tỷ (Lớn) - Macro-KOL + Event</option>
                                <option value="2 tỷ">{'>'} 1 tỷ (Enterprise) - TVC + Celebrity</option>
                            </select>
                            <p className="text-xs text-amber-600 mt-1">⚠️ AI sẽ lọc bỏ chiến thuật viển vông nếu ngân sách không khớp</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">⏱️ Thời gian chiến dịch</label>
                            <select
                                {...register('duration')}
                                className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#545BE8]/30 focus:border-[#545BE8] outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">⏱️ Chọn thời gian...</option>
                                <option value="1 tháng">1 tháng (Sprint)</option>
                                <option value="3 tháng">3 tháng (Quarter)</option>
                                <option value="6 tháng">6 tháng (Half-year)</option>
                                <option value="1 năm">1 năm (Annual)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">🚫 Mandatories / Cấm kỵ (Tùy chọn)</label>
                            <textarea
                                {...register('mandatories')}
                                placeholder="VD: Không dùng hình ảnh người nổi tiếng, Phải có logo ở mọi ấn phẩm, Không nhắc đến đối thủ X..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#545BE8]/20 focus:border-[#545BE8] outline-none transition-all resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-3.5 bg-[#545BE8] hover:bg-[#4349c2] text-white font-bold rounded-[14px] shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang xử lý...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Tạo Brief Tự Động
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {showHistory && (
                    <div className="w-[350px] bg-white border-r border-slate-200 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <History size={18} className="text-[#545BE8]" />
                                Lịch sử Brief
                            </h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        {savedBriefs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <History size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Chưa có Brief nào được lưu</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedBriefs.map((brief) => (
                                    <div
                                        key={brief.id}
                                        className="group bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-[#545BE8]/30 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => handleLoadBrief(brief)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                                                {brief.data.project_name}
                                            </h4>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteBrief(brief.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                            {brief.input.productBrand} • {brief.input.industry}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(brief.timestamp).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 p-10 overflow-y-auto bg-slate-50">
                    {!briefData && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                                <FileText size={32} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600">Brief Preview</p>
                            <p className="text-sm text-slate-400 mt-1">Điền thông tin bên trái để bắt đầu</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-16 h-16 mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#545BE8] animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-[#545BE8] mb-2 uppercase tracking-wide">{thinkingStep}</p>
                            <p className="text-sm text-slate-400">AI đang phân tích dữ liệu...</p>
                        </div>
                    )}

                    {briefData && !isGenerating && (
                        <div ref={briefRef} className="max-w-4xl mx-auto space-y-8 p-8 bg-white rounded-2xl">
                            <div className="border-l-4 border-l-[#545BE8] pl-6">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Campaign Name</div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{briefData.project_name}</h2>
                            </div>

                            <EditableBlock
                                label="Phân tích bối cảnh"
                                value={briefData.context_analysis}
                                onChange={(val) => updateBriefField('context_analysis', val)}
                                icon={BarChart3}
                                multiline
                            />

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Target size={16} className="text-[#545BE8]" /> Mục tiêu
                                </h3>
                                <EditableBlock label="Business Goal" value={briefData.objectives?.business || ''} onChange={(val) => updateBriefField('objectives.business', val)} />
                                <EditableBlock label="Marketing Goal" value={briefData.objectives?.marketing || ''} onChange={(val) => updateBriefField('objectives.marketing', val)} />
                                <EditableBlock label="Communication Goal" value={briefData.objectives?.communication || ''} onChange={(val) => updateBriefField('objectives.communication', val)} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Users size={16} className="text-[#545BE8]" /> Đối tượng
                                </h3>
                                <EditableBlock label="Demographic" value={briefData.target_persona?.demographic || ''} onChange={(val) => updateBriefField('target_persona.demographic', val)} />
                                <EditableBlock label="Psychographic" value={briefData.target_persona?.psychographic || ''} onChange={(val) => updateBriefField('target_persona.psychographic', val)} />
                                <EditableBlock label="Core Insight" value={briefData.target_persona?.insight || ''} onChange={(val) => updateBriefField('target_persona.insight', val)} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Megaphone size={16} className="text-[#545BE8]" /> Chiến lược
                                </h3>
                                <EditableBlock label="Core Message" value={briefData.strategy?.core_message || ''} onChange={(val) => updateBriefField('strategy.core_message', val)} />
                                <EditableBlock label="Key Hook" value={briefData.strategy?.key_hook || ''} onChange={(val) => updateBriefField('strategy.key_hook', val)} />
                                <EditableBlock label="Tone & Mood" value={briefData.strategy?.tone_mood || ''} onChange={(val) => updateBriefField('strategy.tone_mood', val)} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Calendar size={16} className="text-[#545BE8]" /> Timeline
                                </h3>
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    {briefData.execution_plan?.map((phase, idx) => (
                                        <div key={idx} className="mb-3 last:mb-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-[#545BE8]">{phase.phase}</span>
                                                <ChevronRight size={12} className="text-slate-400" />
                                                <span className="text-xs text-slate-500">{phase.channel}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 pl-4">{phase.activity}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <TrendingUp size={16} className="text-[#545BE8]" /> KPIs
                                </h3>
                                <EditableBlock label="Success Metrics" value={briefData.kpis_deliverables?.success_metrics || ''} onChange={(val) => updateBriefField('kpis_deliverables.success_metrics', val)} />
                                <EditableBlock label="Estimated Reach" value={briefData.kpis_deliverables?.estimated_reach || ''} onChange={(val) => updateBriefField('kpis_deliverables.estimated_reach', val)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutoBriefGenerator;

