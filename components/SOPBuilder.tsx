import React, { useReducer, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FileCheck, Sparkles, Download, CheckCircle2, Circle, ChevronDown, ChevronRight, Loader2, Clock, Users, Wrench, AlertCircle, Save, History, Trash2, X, Plus } from 'lucide-react';
import { SOPData } from '../types';
import { generateSOP, SOPInput } from '../services/geminiService';
import { SOPService, SavedSOP } from '../services/sopService';
import { Toast, ToastType } from './Toast';
import FeatureHeader from './FeatureHeader';
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

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

type SOPAction =
    | { type: 'LOAD_SOP'; payload: SOPData }
    | { type: 'RESET_SOP' }
    | { type: 'TOGGLE_STEP'; phaseIndex: number; stepId: number }
    | { type: 'TOGGLE_PHASE'; phaseIndex: number };

const sopReducer = (state: SOPData | null, action: SOPAction): SOPData | null => {
    switch (action.type) {
        case 'LOAD_SOP':
            return action.payload;
        case 'RESET_SOP':
            return null;
        case 'TOGGLE_STEP': {
            if (!state) return null;
            const newPhases = state.phases.map((phase, idx) => {
                if (idx !== action.phaseIndex) return phase;
                return {
                    ...phase,
                    steps: phase.steps.map((step) =>
                        step.id === action.stepId ? { ...step, completed: !step.completed } : step
                    ),
                    collapsed: phase.steps.every((s) => (s.id === action.stepId ? !s.completed : s.completed)),
                };
            });
            return { ...state, phases: newPhases };
        }
        case 'TOGGLE_PHASE': {
            if (!state) return null;
            const newPhases = state.phases.map((phase, idx) =>
                idx === action.phaseIndex ? { ...phase, collapsed: !phase.collapsed } : phase
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
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const sopRef = useRef<HTMLDivElement>(null);

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
            const result = await generateSOP(data, (step) => setThinkingStep(step));
            if (result) {
                dispatch({ type: 'LOAD_SOP', payload: result });
                setToast({ message: 'SOP đã được tạo!', type: 'success' });
            } else {
                setToast({ message: 'Không thể tạo SOP.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Đã xảy ra lỗi.', type: 'error' });
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
            timestamp: Date.now(),
        };
        const success = await SOPService.saveSOP(newSOP);
        if (success) {
            const sops = await SOPService.getSOPs();
            setSavedSOPs(sops);
            setToast({ message: 'Đã lưu SOP!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi lưu!', type: 'error' });
        }
    };

    const handleLoadSOP = (sop: SavedSOP) => {
        dispatch({ type: 'LOAD_SOP', payload: sop.data });
        setCurrentInput(sop.input);
        reset(sop.input);
        setShowHistory(false);
        setToast({ message: 'Đã tải SOP!', type: 'success' });
    };

    const handleDeleteSOP = async (id: string) => {
        const success = await SOPService.deleteSOP(id);
        if (success) {
            const sops = await SOPService.getSOPs();
            setSavedSOPs(sops);
            setToast({ message: 'Đã xóa!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi xóa!', type: 'error' });
        }
    };

    const handleNew = () => {
        dispatch({ type: 'RESET_SOP' });
        setCurrentInput(null);
        reset();
        setToast({ message: 'Sẵn sàng tạo SOP mới!', type: 'success' });
    };

    const handleExportPDF = async () => {
        if (!sopRef.current || !sopState) return;
        setToast({ message: 'Đang tạo PDF...', type: 'info' });
        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: `${sopState.sop_title}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        };
        try {
            await html2pdf().set(opt).from(sopRef.current).save();
            setToast({ message: 'Đã xuất PDF!', type: 'success' });
        } catch (err) {
            setToast({ message: 'Lỗi xuất PDF', type: 'error' });
            console.error(err);
        }
    };

    const getProgress = () => {
        if (!sopState) return { completed: 0, total: 0, percentage: 0 };
        let completed = 0;
        let total = 0;
        sopState.phases.forEach((phase) => {
            phase.steps.forEach((step) => {
                total++;
                if (step.completed) completed++;
            });
        });
        return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };

    const progress = getProgress();

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <FeatureHeader
                icon={FileCheck}
                eyebrow="OPERATIONS"
                title="SOP Builder"
                subline="Tạo quy trình chuẩn (SOP) tự động — Chuẩn hóa các bước thực hiện công việc cho toàn đội ngũ."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-95 ${showHistory ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                    >
                        <History size={18} strokeWidth={2} />
                    </button>
                    {sopState && (
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
                                onClick={handleSaveSOP}
                                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-stone-900 px-5 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-95 shadow-sm"
                            >
                                <Save size={16} /> Lưu SOP
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

            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5" style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,380px) 1fr' : 'minmax(0,380px) 1fr' }}>
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" />
                                    Lịch sử SOP
                                </h3>
                                <span className="text-xs font-normal text-stone-400">{savedSOPs.length} mục</span>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedSOPs.length === 0 ? (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có SOP nào được lưu.</div>
                            ) : (
                                savedSOPs.map((sop) => (
                                    <div key={sop.id} role="button" tabIndex={0} onClick={() => handleLoadSOP(sop)} onKeyDown={(e) => e.key === 'Enter' && handleLoadSOP(sop)} className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <p className="line-clamp-1 text-sm font-medium text-stone-900">{sop.data.sop_title}</p>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteSOP(sop.id); }} className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100">
                                                <Trash2 size={14} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        <p className="mb-1 text-xs font-normal text-stone-500 line-clamp-1">{sop.input.processName}</p>
                                        <p className="text-xs font-normal text-stone-400">{new Date(sop.timestamp).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <h2 className="mb-2 flex items-center gap-2 text-lg font-medium tracking-tight text-stone-900">
                        <FileCheck size={20} strokeWidth={1.25} className="text-stone-400" />
                        Thông tin quy trình
                    </h2>
                    <p className="mb-6 text-sm font-normal text-stone-500">Mô tả công việc cần chuẩn hóa</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Tên quy trình *</label>
                            <input {...register('processName', { required: 'Vui lòng nhập tên quy trình' })} placeholder="VD: Launch Campaign Facebook Ads" className={inputClass} />
                            {errors.processName && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.processName.message}</p>}
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Vai trò thực hiện chính *</label>
                            <div className="relative">
                                <select {...register('primaryRole', { required: 'Vui lòng chọn vai trò' })} className={`${inputClass} appearance-none pr-10`}>
                                    <option value="">Chọn vai trò...</option>
                                    {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                                </select>
                                <ChevronRight size={16} strokeWidth={1.25} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-stone-400" />
                            </div>
                            {errors.primaryRole && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.primaryRole.message}</p>}
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Tần suất thực hiện *</label>
                            <div className="relative">
                                <select {...register('frequency', { required: 'Vui lòng chọn tần suất' })} className={`${inputClass} appearance-none pr-10`}>
                                    <option value="">Chọn tần suất...</option>
                                    {FREQUENCIES.map((freq) => <option key={freq.value} value={freq.value}>{freq.label}</option>)}
                                </select>
                                <ChevronRight size={16} strokeWidth={1.25} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-stone-400" />
                            </div>
                            {errors.frequency && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.frequency.message}</p>}
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Công cụ sẵn có</label>
                            <input {...register('tools')} placeholder="VD: Google Sheet, Trello, Canva, Slack..." className={inputClass} />
                            <p className="mt-1 text-xs text-stone-400">AI sẽ tích hợp các công cụ này vào từng bước.</p>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Kết quả mong muốn</label>
                            <textarea {...register('goalOutput')} placeholder="VD: Có file báo cáo PDF, đã được sếp duyệt, 100 leads mới..." rows={2} className={`${inputClass} resize-none`} />
                            <p className="mt-1 text-xs text-stone-400">AI sẽ tạo Definition of Done dựa trên kết quả này.</p>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Phạm vi (Tùy chọn)</label>
                            <input {...register('scope')} placeholder="VD: Chỉ áp dụng cho team Marketing, Toàn công ty..." className={inputClass} />
                        </div>
                        <button type="submit" disabled={isGenerating} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60">
                            {isGenerating ? (<><Loader2 size={18} className="animate-spin" />{thinkingStep || 'Đang xử lý...'}</>) : (<><Sparkles size={18} strokeWidth={1.25} />Tạo SOP Tự Động</>)}
                        </button>
                    </form>
                </div>

                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!sopState && !isGenerating && (
                        <div className="flex min-h-[360px] flex-col items-center justify-center text-stone-400">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80">
                                <FileCheck size={30} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <p className="text-sm font-normal text-center max-w-xs">Điền thông tin để tạo quy trình chuẩn.</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex min-h-[360px] flex-col items-center justify-center">
                            <div className="relative mb-8 h-14 w-14">
                                <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-800 animate-spin"></div>
                            </div>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">{thinkingStep}</p>
                            <p className="text-sm font-normal text-stone-400">AI đang xây dựng quy trình...</p>
                        </div>
                    )}

                    {sopState && !isGenerating && (
                        <div ref={sopRef} className="space-y-5">
                            <div className="rounded-2xl border border-stone-200 p-5">
                                <div className="mb-4 flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">SOP Title</div>
                                        <h2 className="text-3xl font-bold tracking-tight text-stone-900 leading-tight">{sopState.sop_title}</h2>
                                    </div>
                                    <div className="text-right">
                                        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Thời gian</div>
                                        <div className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-semibold text-stone-700">
                                            <Clock size={14} strokeWidth={1.25} />
                                            <span>{sopState.estimated_time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Tiến độ</span>
                                        <span className="text-sm font-semibold text-stone-700">{progress.completed}/{progress.total} ({progress.percentage}%)</span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
                                        <div className="h-full bg-stone-700 transition-all duration-500" style={{ width: `${progress.percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {sopState.phases.map((phase, phaseIndex) => {
                                const phaseSteps = phase.steps;
                                const completedSteps = phaseSteps.filter((s) => s.completed).length;
                                const phaseProgress = phaseSteps.length > 0 ? Math.round((completedSteps / phaseSteps.length) * 100) : 0;
                                const isPhaseComplete = completedSteps === phaseSteps.length && phaseSteps.length > 0;
                                return (
                                    <div key={phaseIndex} className="overflow-hidden rounded-2xl border border-stone-200">
                                        <button type="button" onClick={() => dispatch({ type: 'TOGGLE_PHASE', phaseIndex })} className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-stone-50/70">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${isPhaseComplete ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                                                    {phaseIndex + 1}
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-sm font-semibold text-stone-900">{phase.phase_name}</h3>
                                                    <p className="text-xs text-stone-500">{completedSteps}/{phaseSteps.length} bước hoàn thành ({phaseProgress}%)</p>
                                                </div>
                                            </div>
                                            <div className="text-stone-400">{phase.collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}</div>
                                        </button>
                                        {!phase.collapsed && (
                                            <div className="space-y-3 border-t border-stone-100 px-5 pb-5 pt-4">
                                                {phase.steps.map((step) => (
                                                    <div key={step.id} className={`group flex items-start gap-4 rounded-xl border p-4 transition-all ${step.completed ? 'border-stone-300 bg-stone-50/80' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                                                        <button type="button" onClick={() => dispatch({ type: 'TOGGLE_STEP', phaseIndex, stepId: step.id })} className="mt-0.5 shrink-0">
                                                            {step.completed ? <CheckCircle2 size={22} className="text-stone-700" /> : <Circle size={22} className="text-stone-300 transition-colors group-hover:text-stone-500" />}
                                                        </button>
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`mb-3 text-[15px] leading-relaxed ${step.completed ? 'line-through text-stone-500' : 'text-stone-800'}`}>{step.action}</p>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1">
                                                                    <Users size={12} className="text-stone-500" />
                                                                    <span className="text-xs font-semibold text-stone-600">{step.role}</span>
                                                                </div>
                                                                {step.tools.map((tool, idx) => (
                                                                    <div key={idx} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1">
                                                                        <Wrench size={12} className="text-stone-500" />
                                                                        <span className="text-xs font-medium text-stone-600">{tool}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {step.critical_note && (
                                                                <div className="mt-3 flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                                                                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-stone-500" />
                                                                    <p className="text-xs leading-relaxed text-stone-700">{step.critical_note}</p>
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

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SOPBuilder;
