import React, { useReducer, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FileCheck, Sparkles, Download, CheckCircle2, Circle, ChevronDown, ChevronRight, Loader2, Clock, Users, Wrench, AlertCircle, Save, History, Trash2, X, Plus } from 'lucide-react';
import { SOPData } from '../types';
import { generateSOP, SOPInput } from '../services/geminiService';
import { SOPService, SavedSOP } from '../services/sopService';
import toast, { Toaster } from 'react-hot-toast';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const FREQUENCIES = [
    { value: 'one_time', label: 'Một lần' },
    { value: 'daily', label: 'Hàng ngày' },
    { value: 'weekly', label: 'Hàng tuần' },
    { value: 'monthly', label: 'Hàng tháng' },
    { value: 'quarterly', label: 'Hàng quý' },
];

const ROLES = [
    { value: 'account_manager', label: 'Account Manager' },
    { value: 'content_writer', label: 'Content Writer' },
    { value: 'designer', label: 'Designer' },
    { value: 'media_buyer', label: 'Media Buyer' },
    { value: 'social_media', label: 'Social Media Manager' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'team', label: 'Toàn team' },
];

type SOPAction =
    | { type: 'LOAD_SOP'; payload: SOPData }
    | { type: 'TOGGLE_STEP'; phaseIndex: number; stepId: number }
    | { type: 'TOGGLE_PHASE'; phaseIndex: number };

const sopReducer = (state: SOPData | null, action: SOPAction): SOPData | null => {
    switch (action.type) {
        case 'LOAD_SOP':
            return action.payload;

        case 'TOGGLE_STEP': {
            if (!state) return null;
            const newPhases = state.phases.map((phase, idx) => {
                if (idx !== action.phaseIndex) return phase;

                return {
                    ...phase,
                    steps: phase.steps.map(step =>
                        step.id === action.stepId
                            ? { ...step, completed: !step.completed }
                            : step
                    ),
                    collapsed: phase.steps.every(s =>
                        s.id === action.stepId ? !s.completed : s.completed
                    )
                };
            });

            return { ...state, phases: newPhases };
        }

        case 'TOGGLE_PHASE': {
            if (!state) return null;
            const newPhases = state.phases.map((phase, idx) =>
                idx === action.phaseIndex
                    ? { ...phase, collapsed: !phase.collapsed }
                    : phase
            );
            return { ...state, phases: newPhases };
        }

        default:
            return state;
    }
};



const SOPBuilder: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<SOPInput>();
    const [sopState, dispatch] = useReducer(sopReducer, null);
    const [currentInput, setCurrentInput] = useState<SOPInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [showHistory, setShowHistory] = useState(false);
    const [savedSOPs, setSavedSOPs] = useState<SavedSOP[]>([]);
    const sopRef = useRef<HTMLDivElement>(null);


    // Load saved SOPs from Supabase
    React.useEffect(() => {
        const loadSOPs = async () => {
            const sops = await SOPService.getSOPs();
            setSavedSOPs(sops);
        };
        loadSOPs();
    }, []);

    const onSubmit = async (data: SOPInput) => {
        setIsGenerating(true);
        setCurrentInput(data);

        try {
            const result = await generateSOP(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                dispatch({ type: 'LOAD_SOP', payload: result });
                toast.success('SOP đã được tạo!', {
                    icon: '✅',
                    style: { borderRadius: '12px', background: '#F0FDF4', color: '#166534', fontWeight: 600, fontSize: '14px' }
                });
            } else {
                toast.error('Không thể tạo SOP.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi.');
            console.error(error);
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSaveSOP = async () => {
        if (!sopState || !currentInput) return;

        const newSOP: SavedSOP = {
            id: Date.now().toString(),
            input: currentInput,
            data: sopState,
            timestamp: Date.now()
        };

        const success = await SOPService.saveSOP(newSOP);

        if (success) {
            const sops = await SOPService.getSOPs();
            setSavedSOPs(sops);
            toast.success('Đã lưu SOP!', {
                icon: '💾',
                style: { borderRadius: '12px', background: '#EFF6FF', color: '#1E40AF', fontWeight: 600, fontSize: '14px' }
            });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoadSOP = (sop: SavedSOP) => {
        dispatch({ type: 'LOAD_SOP', payload: sop.data });
        setCurrentInput(sop.input);
        reset(sop.input);
        setShowHistory(false);
        toast.success('Đã tải SOP!', { icon: '📂' });
    };

    const handleDeleteSOP = async (id: string) => {
        const success = await SOPService.deleteSOP(id);

        if (success) {
            const sops = await SOPService.getSOPs();
            setSavedSOPs(sops);
            toast.success('Đã xóa!', { icon: '🗑️' });
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleNew = () => {
        dispatch({ type: 'LOAD_SOP', payload: null as any });
        setCurrentInput(null);
        reset();
        toast.success('Sẵn sàng tạo SOP mới!', { icon: '✨' });
    };

    const handleExportPDF = async () => {
        if (!sopRef.current || !sopState) return;

        toast.loading('Đang tạo PDF...', { id: 'pdf' });

        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: `${sopState.sop_title}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        try {
            await html2pdf().set(opt).from(sopRef.current).save();
            toast.success('Đã xuất PDF!', { id: 'pdf', icon: '📄' });
        } catch (err) {
            toast.error('Lỗi xuất PDF', { id: 'pdf' });
            console.error(err);
        }
    };

    const getProgress = () => {
        if (!sopState) return { completed: 0, total: 0, percentage: 0 };

        let completed = 0;
        let total = 0;

        sopState.phases.forEach(phase => {
            phase.steps.forEach(step => {
                total++;
                if (step.completed) completed++;
            });
        });

        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    };

    const progress = getProgress();

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#10b981]/10 text-[#10b981] rounded-xl flex items-center justify-center">
                        <FileCheck size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">SOP Builder</h1>
                        <p className="text-xs text-slate-500 font-medium">Tạo quy trình chuẩn tự động</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                    >
                        <History size={16} /> Lịch sử ({savedSOPs.length})
                    </button>
                    {sopState && (
                        <>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                onClick={handleSaveSOP}
                                className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all text-sm"
                            >
                                <Save size={16} /> Lưu SOP
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
                <div className="w-[380px] bg-white border-r border-slate-200 p-8 overflow-y-auto">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <h2 className="text-base font-bold text-slate-800">Thông tin quy trình</h2>
                        </div>
                        <p className="text-sm text-slate-500 pl-9">Mô tả công việc cần chuẩn hóa</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pl-2">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tên quy trình</label>
                            <input
                                {...register('processName', { required: 'Vui lòng nhập tên quy trình' })}
                                placeholder="VD: Launch Campaign Facebook Ads"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none transition-all"
                            />
                            {errors.processName && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.processName.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Vai trò thực hiện chính</label>
                            <div className="relative group">
                                <select
                                    {...register('primaryRole', { required: 'Vui lòng chọn vai trò' })}
                                    className="w-full px-4 py-3.5 pr-11 bg-gradient-to-br from-white to-emerald-50/30 border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981] hover:border-slate-300 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:shadow-md"
                                >
                                    <option value="" className="text-slate-400">👤 Chọn vai trò...</option>
                                    {ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#10b981] transition-transform group-hover:scale-110">
                                    <ChevronRight size={18} className="rotate-90" strokeWidth={2.5} />
                                </div>
                            </div>
                            {errors.primaryRole && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.primaryRole.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tần suất thực hiện</label>
                            <div className="relative group">
                                <select
                                    {...register('frequency', { required: 'Vui lòng chọn tần suất' })}
                                    className="w-full px-4 py-3.5 pr-11 bg-gradient-to-br from-white to-emerald-50/30 border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981] hover:border-slate-300 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:shadow-md"
                                >
                                    <option value="" className="text-slate-400">📅 Chọn tần suất...</option>
                                    {FREQUENCIES.map(freq => <option key={freq.value} value={freq.value}>{freq.label}</option>)}
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#10b981] transition-transform group-hover:scale-110">
                                    <ChevronRight size={18} className="rotate-90" strokeWidth={2.5} />
                                </div>
                            </div>
                            {errors.frequency && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.frequency.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                🛠️ Công cụ sẵn có
                            </label>
                            <input
                                {...register('tools')}
                                placeholder="VD: Google Sheet, Trello, Canva, Slack, Meta Business Suite..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none transition-all"
                            />
                            <p className="text-xs text-slate-400 mt-1">AI sẽ tích hợp các công cụ này vào từng bước</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">🎯 Kết quả mong muốn</label>
                            <textarea
                                {...register('goalOutput')}
                                placeholder="VD: Có file báo cáo PDF, Đã được sếp duyệt, 100 leads mới..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none transition-all resize-none"
                            />
                            <p className="text-xs text-slate-400 mt-1">AI sẽ tạo Definition of Done dựa trên kết quả này</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Phạm vi (Tùy chọn)</label>
                            <input
                                {...register('scope')}
                                placeholder="VD: Chỉ áp dụng cho team Marketing, Toàn công ty..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-[14px] shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang xử lý...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Tạo SOP Tự Động
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* HISTORY SIDEBAR */}
                {showHistory && (
                    <div className="w-[350px] bg-white border-r border-slate-200 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <History size={18} className="text-[#10b981]" />
                                Lịch sử SOP
                            </h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        {savedSOPs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <History size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Chưa có SOP nào được lưu</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedSOPs.map((sop) => (
                                    <div
                                        key={sop.id}
                                        className="group bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-[#10b981]/30 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => handleLoadSOP(sop)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                                                {sop.data.sop_title}
                                            </h4>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSOP(sop.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                            {sop.input.processName}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(sop.timestamp).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT: SOP Checklist */}
                <div className="flex-1 p-10 overflow-y-auto bg-slate-50">
                    {!sopState && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                                <FileCheck size={32} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600">SOP Checklist</p>
                            <p className="text-sm text-slate-400 mt-1">Điền thông tin để tạo quy trình chuẩn</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-16 h-16 mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#10b981] animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-[#10b981] mb-2 uppercase tracking-wide">{thinkingStep}</p>
                            <p className="text-sm text-slate-400">AI đang xây dựng quy trình...</p>
                        </div>
                    )}

                    {sopState && !isGenerating && (
                        <div ref={sopRef} className="max-w-4xl mx-auto space-y-6">
                            <div className="bg-white border border-slate-200 border-l-4 border-l-[#10b981] p-8 rounded-2xl shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">SOP Title</div>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{sopState.sop_title}</h2>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Thời gian</div>
                                        <div className="flex items-center gap-2 text-[#10b981] font-bold">
                                            <Clock size={16} />
                                            <span>{sopState.estimated_time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiến độ</span>
                                        <span className="text-sm font-bold text-[#10b981]">{progress.completed}/{progress.total} ({progress.percentage}%)</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] transition-all duration-500"
                                            style={{ width: `${progress.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {sopState.phases.map((phase, phaseIndex) => {
                                const phaseSteps = phase.steps;
                                const completedSteps = phaseSteps.filter(s => s.completed).length;
                                const phaseProgress = phaseSteps.length > 0 ? Math.round((completedSteps / phaseSteps.length) * 100) : 0;
                                const isPhaseComplete = completedSteps === phaseSteps.length && phaseSteps.length > 0;

                                return (
                                    <div key={phaseIndex} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        <button
                                            onClick={() => dispatch({ type: 'TOGGLE_PHASE', phaseIndex })}
                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isPhaseComplete ? 'bg-[#10b981] text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {phaseIndex + 1}
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-sm font-bold text-slate-800">{phase.phase_name}</h3>
                                                    <p className="text-xs text-slate-500">{completedSteps}/{phaseSteps.length} bước hoàn thành ({phaseProgress}%)</p>
                                                </div>
                                            </div>
                                            <div className="text-slate-400">
                                                {phase.collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </button>

                                        {!phase.collapsed && (
                                            <div className="px-6 pb-6 space-y-3">
                                                {phase.steps.map((step) => (
                                                    <div
                                                        key={step.id}
                                                        className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${step.completed
                                                            ? 'bg-emerald-50 border-emerald-200'
                                                            : 'bg-slate-50 border-slate-200 hover:border-[#10b981]/30 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <button
                                                            onClick={() => dispatch({ type: 'TOGGLE_STEP', phaseIndex, stepId: step.id })}
                                                            className="shrink-0 mt-0.5"
                                                        >
                                                            {step.completed ? (
                                                                <CheckCircle2 size={24} className="text-[#10b981]" />
                                                            ) : (
                                                                <Circle size={24} className="text-slate-300 group-hover:text-[#10b981] transition-colors" />
                                                            )}
                                                        </button>

                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[15px] font-medium mb-3 leading-relaxed ${step.completed ? 'text-slate-500 line-through' : 'text-slate-800'
                                                                }`}>
                                                                {step.action}
                                                            </p>

                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                                                                    <Users size={12} className="text-indigo-500" />
                                                                    <span className="text-xs font-bold text-slate-600">{step.role}</span>
                                                                </div>

                                                                {step.tools.map((tool, idx) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                                                                        <Wrench size={12} className="text-orange-500" />
                                                                        <span className="text-xs font-semibold text-slate-600">{tool}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {step.critical_note && (
                                                                <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                                                    <p className="text-xs text-amber-800 leading-relaxed">{step.critical_note}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SOPBuilder;
