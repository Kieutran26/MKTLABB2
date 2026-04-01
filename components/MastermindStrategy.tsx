import React, { useState, useEffect } from 'react';
import {
    Brain, Target, Compass, ArrowRight, Loader2, Sparkles, Map, Heart, Lightbulb, Users,
    CalendarDays, History, X, Save, Check, Rocket,
} from 'lucide-react';
import { generateMastermindStrategy } from '../services/geminiService';
import { MastermindService } from '../services/mastermindService';
import { StorageService } from '../services/storageService';
import { useBrand } from './BrandContext';
import { MastermindStrategy, Persona } from '../types';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';

interface MastermindStrategyProps {
    onDeployToCalendar?: (strategy: MastermindStrategy) => void;
}

const MastermindStrategyComponent: React.FC<MastermindStrategyProps> = ({ onDeployToCalendar }) => {
    const { currentBrand } = useBrand();

    // UI State
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [viewMode, setViewMode] = useState<'create' | 'dashboard'>('create');
    const [showHistory, setShowHistory] = useState(false);

    const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
    const [showDeploySuccessModal, setShowDeploySuccessModal] = useState(false);

    // Manual Mode State
    const [useManual, setUseManual] = useState(false);

    // Manual Inputs - Brand
    const [manualBrandName, setManualBrandName] = useState('');
    const [manualBrandVision, setManualBrandVision] = useState('');
    const [manualBrandValues, setManualBrandValues] = useState('');

    // Manual Inputs - Audience
    const [manualAudienceName, setManualAudienceName] = useState('');
    const [manualAudiencePain, setManualAudiencePain] = useState('');
    const [manualAudienceDesire, setManualAudienceDesire] = useState('');
    const [manualAudienceBehavior, setManualAudienceBehavior] = useState('');

    // Data State
    const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

    // Form Inputs
    const [objective, setObjective] = useState('');
    const [perception, setPerception] = useState('');
    const [tone, setTone] = useState('');

    // Results
    const [strategyResult, setStrategyResult] = useState<MastermindStrategy | null>(null);
    const [historyList, setHistoryList] = useState<MastermindStrategy[]>([]);

    useEffect(() => {
        if (currentBrand) {
            setAvailablePersonas(StorageService.getPersonasByBrand(currentBrand.id));
        } else {
            setAvailablePersonas([]);
        }

        const loadHistory = async () => {
            const strategies = await MastermindService.getMastermindStrategies();
            setHistoryList(strategies);
        };
        loadHistory();
    }, [currentBrand]);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const handleGenerate = async () => {
        // Validation
        if (!useManual) {
            if (!currentBrand || !selectedPersona) {
                showToast("Vui lòng chọn Brand và Persona, hoặc chuyển sang chế độ thủ công.", "error");
                return;
            }
        } else {
            if (!manualBrandName || !manualBrandVision || !manualAudienceName || !manualAudiencePain) {
                showToast("Vui lòng nhập đầy đủ thông tin Brand và Audience.", "error");
                return;
            }
        }

        setIsGenerating(true);

        let brandInfo = "";
        let audienceInfo = "";
        let strategyName = "";
        let brandId = "";
        let personaId = "";

        if (useManual) {
            brandInfo = `Name: ${manualBrandName}. Vision/Mission: ${manualBrandVision}. Core Values: ${manualBrandValues}.`;
            audienceInfo = `Target Audience: ${manualAudienceName}. Pain Points: ${manualAudiencePain}. Motivations/Desires: ${manualAudienceDesire}. Behaviors: ${manualAudienceBehavior}.`;
            strategyName = `${manualBrandName} x ${manualAudienceName}`;
            brandId = "manual";
            personaId = "manual";
        } else if (currentBrand && selectedPersona) {
            brandInfo = `Name: ${currentBrand.identity.name}. Vision: ${currentBrand.strategy.vision}. Core Values: ${currentBrand.strategy.coreValues.join(', ')}`;
            audienceInfo = `Name: ${selectedPersona.fullname}. Bio: ${selectedPersona.bio}. Pain Points: ${selectedPersona.frustrations.join(', ')}. Motivations: ${selectedPersona.motivations.join(', ')}`;
            strategyName = `${currentBrand.identity.name} x ${selectedPersona.fullname}`;
            brandId = currentBrand.id;
            personaId = selectedPersona.id;
        }

        const result = await generateMastermindStrategy(brandInfo, audienceInfo, objective, perception, tone);

        if (result) {
            const newStrategy: MastermindStrategy = {
                id: Date.now().toString(),
                name: strategyName,
                brandId,
                personaId,
                objective,
                perception,
                tone,
                result: result,
                createdAt: Date.now()
            };

            setStrategyResult(newStrategy);

            const success = await MastermindService.saveMastermindStrategy(newStrategy);
            if (success) {
                const strategies = await MastermindService.getMastermindStrategies();
                setHistoryList(strategies);
            }

            setViewMode('dashboard');
        } else {
            showToast("Lỗi khi tạo chiến lược. Vui lòng thử lại.", "error");
        }

        setIsGenerating(false);
    };

    const loadStrategy = (strategy: MastermindStrategy) => {
        setStrategyResult(strategy);
        setViewMode('dashboard');
        setShowHistory(false);
    };

    const handleDeploy = () => {
        if (strategyResult) {
            // Thay vì gọi callback ngay, ta hiển thị modal thông báo trước
            setShowDeploySuccessModal(true);
        }
    };

    // Hàm thực hiện hành động chuyển sang Calendar (gắn vào nút trong modal)
    const confirmDeploy = () => {
        if (strategyResult && onDeployToCalendar) {
            onDeployToCalendar(strategyResult);
            setShowDeploySuccessModal(false);
        }
    };

    const handleSave = async () => {
        if (strategyResult) {
            const success = await MastermindService.saveMastermindStrategy(strategyResult);

            if (success) {
                const strategies = await MastermindService.getMastermindStrategies();
                setHistoryList(strategies);
                setShowSaveSuccessModal(true);
            } else {
                showToast('Lỗi khi lưu chiến lược!', 'error');
            }
        }
    };

    // --- RENDERERS ---

    if (viewMode === 'create') {
        return (
            <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC]">
                <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 lg:flex-row lg:items-start lg:justify-between md:px-8">
                        <div className="max-w-2xl">
                            <div className="mb-2 flex items-center gap-2 text-stone-400">
                                <Brain size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                    Chiến lược nội dung
                                </span>
                            </div>
                            <h2 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                                Mastermind Strategy
                            </h2>
                            <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                                Xây dựng chiến lược nội dung tổng thể dựa trên kết nối con người.
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3">
                            <div className="flex items-center gap-1 rounded-full border border-stone-200/90 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                <button
                                    type="button"
                                    onClick={() => setUseManual(false)}
                                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${!useManual ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
                                >
                                    Brand Vault
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUseManual(true)}
                                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${useManual ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
                                >
                                    Thủ công
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowHistory(true)}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-stone-300 hover:bg-stone-50/80"
                            >
                                <History size={17} strokeWidth={1.25} /> Lịch sử ({historyList.length})
                            </button>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto px-5 py-8 md:px-10">
                        <div className="mx-auto max-w-6xl">
                    
                    {!useManual && (
                        <div className="mb-10 mx-auto max-w-xl">
                            <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                <BrandSelector />
                            </div>
                        </div>
                    )}

                    <article className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex border-b border-stone-100">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`flex-1 border-b-2 py-4 text-center text-sm font-medium transition-colors ${step === i ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400'}`}
                            >
                                Giai đoạn {i}
                            </div>
                        ))}
                    </div>

                    <div className="min-h-[400px] p-8 md:p-10">
                        {/* STEP 1: CONTEXT */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right">
                                <h3 className="flex items-center gap-2.5 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <Users className="text-stone-400" size={20} strokeWidth={1.25} aria-hidden />
                                    Thấu hiểu <span className="font-normal text-stone-400">(The Context)</span>
                                </h3>

                                {useManual ? (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-4 rounded-2xl border border-stone-200/90 bg-stone-50/50 p-6">
                                            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">Chủ thể (Brand)</div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-stone-500">Tên thương hiệu</label>
                                                <input
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="VD: OptiMKT"
                                                    value={manualBrandName}
                                                    onChange={e => setManualBrandName(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-stone-500">Tầm nhìn & Sứ mệnh</label>
                                                <textarea
                                                    className="h-20 w-full resize-none rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="Chúng tôi muốn trở thành..."
                                                    value={manualBrandVision}
                                                    onChange={e => setManualBrandVision(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-stone-500">Giá trị cốt lõi</label>
                                                <textarea
                                                    className="h-16 w-full resize-none rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="VD: Tận tâm, Sáng tạo, Bền vững..."
                                                    value={manualBrandValues}
                                                    onChange={e => setManualBrandValues(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">Đối tượng (Audience)</div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-stone-500">Tên nhóm khách hàng</label>
                                                <input
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="VD: GenZ yêu môi trường"
                                                    value={manualAudienceName}
                                                    onChange={e => setManualAudienceName(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-stone-500">Nỗi đau (Pain Points)</label>
                                                <textarea
                                                    className="h-16 w-full resize-none rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="Họ đang gặp khó khăn gì?"
                                                    value={manualAudiencePain}
                                                    onChange={e => setManualAudiencePain(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-stone-500">Mong muốn (Motivations)</label>
                                                <input
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="Họ khao khát điều gì?"
                                                    value={manualAudienceDesire}
                                                    onChange={e => setManualAudienceDesire(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-stone-500">Hành vi (Behaviors)</label>
                                                <input
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="Thói quen online, sở thích..."
                                                    value={manualAudienceBehavior}
                                                    onChange={e => setManualAudienceBehavior(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    !currentBrand ? (
                                        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-4 text-center text-sm font-normal text-rose-800">
                                            Vui lòng chọn Brand ở trên để tiếp tục.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-6">
                                                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">Chủ thể (Brand)</div>
                                                <div className="mb-1 text-lg font-medium tracking-tight text-stone-900">{currentBrand.identity.name}</div>
                                                <p className="line-clamp-3 text-sm font-normal leading-relaxed text-stone-600">{currentBrand.strategy.vision}</p>
                                            </div>

                                            <div>
                                                <label className="mb-3 block text-sm font-medium text-stone-800">Đối tượng (Audience)</label>
                                                <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-1">
                                                    {availablePersonas.map((p) => (
                                                        <button
                                                            type="button"
                                                            key={p.id}
                                                            onClick={() => setSelectedPersona(p)}
                                                            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all ${selectedPersona?.id === p.id ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-200' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/80'}`}
                                                        >
                                                            <img src={p.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full bg-white object-cover" />
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-medium text-stone-900">{p.fullname}</div>
                                                                <div className="truncate text-xs font-normal text-stone-500">{p.jobTitle}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {availablePersonas.length === 0 && (
                                                        <div className="text-sm font-normal italic text-stone-400">Chưa có Persona nào. Hãy tạo ở module Persona Builder.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        {/* STEP 2: GOAL */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right">
                                <h3 className="flex items-center gap-2.5 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <Target className="text-stone-400" size={20} strokeWidth={1.25} aria-hidden />
                                    Mục tiêu <span className="font-normal text-stone-400">(The Goal)</span>
                                </h3>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Objective (Mục tiêu chuyển đổi)</label>
                                    <textarea
                                        className="h-24 w-full resize-none rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                        placeholder="VD: Chuyển đổi từ 'Biết' sang 'Tin tưởng'. Tăng tỉ lệ đăng ký dùng thử..."
                                        value={objective}
                                        onChange={e => setObjective(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Perception (Nhận thức mong muốn)</label>
                                    <textarea
                                        className="h-24 w-full resize-none rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                        placeholder="VD: Khách hàng nghĩ về thương hiệu như một người bạn đồng hành tin cậy, không phải người bán hàng..."
                                        value={perception}
                                        onChange={e => setPerception(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 3: DIRECTION */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right">
                                <h3 className="flex items-center gap-2.5 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <Compass className="text-stone-400" size={20} strokeWidth={1.25} aria-hidden />
                                    Định hướng <span className="font-normal text-stone-400">(The Direction)</span>
                                </h3>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Tone & Style (Giọng điệu & Phong cách)</label>
                                    <input
                                        className="w-full rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                        placeholder="VD: Hài hước, Châm biếm, Nghiêm túc, Chuyên gia..."
                                        value={tone}
                                        onChange={e => setTone(e.target.value)}
                                    />
                                </div>

                                <div className="rounded-2xl border border-stone-200/90 bg-stone-50/70 p-4 text-sm font-normal leading-relaxed text-stone-600">
                                    AI sẽ tổng hợp thông tin từ 3 giai đoạn để xây dựng chiến lược “Human Connection” hoàn chỉnh.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between border-t border-stone-100 bg-stone-50/40 px-6 py-5 md:px-10">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="rounded-full px-5 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                            >
                                Quay lại
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                disabled={!useManual && step === 1 && !selectedPersona}
                                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:opacity-40"
                            >
                                Tiếp theo <ArrowRight size={16} strokeWidth={1.25} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} strokeWidth={1.25} />}
                                Lập chiến lược
                            </button>
                        )}
                    </div>
                    </article>
                        </div>
                    </div>

                {/* History Modal */}
                {showHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4 backdrop-blur-[2px]">
                        <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
                                <h3 className="flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} aria-hidden /> Lịch sử chiến lược
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowHistory(false)}
                                    className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                    aria-label="Đóng"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="custom-scrollbar space-y-2 overflow-y-auto p-6">
                                {historyList.length === 0 ? (
                                    <div className="py-12 text-center text-sm font-normal text-stone-400">Chưa có chiến lược nào.</div>
                                ) : (
                                    historyList.map((s) => (
                                        <button
                                            type="button"
                                            key={s.id}
                                            onClick={() => loadStrategy(s)}
                                            className="w-full cursor-pointer rounded-xl border border-stone-100 p-4 text-left transition-all hover:border-stone-200 hover:bg-stone-50/80"
                                        >
                                            <div className="mb-0.5 font-medium text-stone-900">{s.name}</div>
                                            <div className="text-xs font-normal text-stone-400">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        );
    }



    // DASHBOARD VIEW
    if (viewMode === 'dashboard' && strategyResult) {
        const { result } = strategyResult;

        return (
            <div className="flex h-screen flex-col overflow-hidden border-b border-stone-200/70 bg-[#FCFDFC]">
                <header className="z-20 flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                    <div className="flex min-w-0 items-start gap-4">
                        <button
                            type="button"
                            onClick={() => setViewMode('create')}
                            className="mt-1 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                            aria-label="Quay lại"
                        >
                            <ArrowRight size={22} strokeWidth={1.25} className="rotate-180" />
                        </button>
                        <div className="max-w-2xl">
                            <div className="mb-2 flex items-center gap-2 text-stone-400">
                                <Brain size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                    Chiến lược nội dung
                                </span>
                            </div>
                            <h2 className="font-sans text-2xl font-normal tracking-tight text-stone-900">
                                {strategyResult.name}
                            </h2>
                            <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500">
                                Phân tích kết nối con người dựa trên thông tin đã nhập
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowHistory(true)}
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-stone-300 hover:bg-stone-50/80"
                        >
                            <History size={17} strokeWidth={1.25} /> Lịch sử ({historyList.length})
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-stone-300 hover:bg-stone-50/80"
                        >
                            <Save size={17} strokeWidth={1.25} /> Lưu
                        </button>
                        <button
                            type="button"
                            onClick={handleDeploy}
                            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                        >
                            <CalendarDays size={17} strokeWidth={1.25} /> Deploy to Calendar
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-8 md:px-10">
                    <div className="mx-auto max-w-6xl space-y-8 pb-20">

                        {/* BLOCK 1: THE CORE */}
                        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-10">
                            <div className="absolute left-0 top-0 h-px w-full bg-stone-200" aria-hidden />
                            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                                <div className="w-48 text-center">
                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
                                        <Sparkles className="text-stone-600" size={28} strokeWidth={1.25} />
                                    </div>
                                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-400">Brand Truth</div>
                                </div>

                                <div className="relative flex-1 text-center">
                                    <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">Insight & Connection</div>
                                    <div className="font-sans text-2xl font-normal leading-snug tracking-tight text-stone-900 md:text-3xl">
                                        &ldquo;{result.coreMessage}&rdquo;
                                    </div>
                                    <div className="mt-4 inline-block rounded-full border border-stone-100 bg-stone-50/80 px-4 py-2 text-sm font-normal text-stone-600">
                                        {result.insight}
                                    </div>
                                </div>

                                <div className="w-48 text-center">
                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                                        <Heart className="text-stone-600" size={28} strokeWidth={1.25} />
                                    </div>
                                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-400">Customer Pain</div>
                                </div>
                            </div>
                        </div>

                        {/* BLOCK 2: THE BRAIN */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="rounded-2xl border border-stone-200/90 bg-stone-900 p-6 text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                                <h4 className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">
                                    <Target size={14} strokeWidth={1.25} /> Objective
                                </h4>
                                <p className="text-base font-normal leading-relaxed text-stone-100">{strategyResult.objective}</p>
                            </div>
                            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-2">
                                <h4 className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">
                                    <Lightbulb size={14} strokeWidth={1.25} /> Key Messages
                                </h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                                    {result.keyMessages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className="rounded-2xl border border-stone-100 bg-stone-50/80 p-4 text-sm font-normal leading-relaxed text-stone-800"
                                        >
                                            {msg}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* BLOCK 3: THE ART */}
                        <div>
                            <h3 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                <Sparkles className="text-stone-400" size={22} strokeWidth={1.25} />
                                The Art <span className="font-normal text-stone-400">(Creative Angles)</span>
                            </h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                    <h4 className="mb-3 border-b border-stone-100 pb-2 text-sm font-medium text-stone-900">Visual & Mood</h4>
                                    <ul className="list-inside list-disc space-y-2 text-sm font-normal leading-relaxed text-stone-600">
                                        {result.contentAngles.visual.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                    <h4 className="mb-3 border-b border-stone-100 pb-2 text-sm font-medium text-stone-900">Storytelling</h4>
                                    <ul className="list-inside list-disc space-y-2 text-sm font-normal leading-relaxed text-stone-600">
                                        {result.contentAngles.story.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                    <h4 className="mb-3 border-b border-stone-100 pb-2 text-sm font-medium text-stone-900">Action & Activation</h4>
                                    <ul className="list-inside list-disc space-y-2 text-sm font-normal leading-relaxed text-stone-600">
                                        {result.contentAngles.action.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* BLOCK 4: THE MAP */}
                        <div className="rounded-2xl border border-stone-200/90 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <h3 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                <Map className="text-stone-400" size={22} strokeWidth={1.25} />
                                The Map <span className="font-normal text-stone-400">(Channel Strategy)</span>
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(result.channelStrategy).map(([channel, weight]) => (
                                    <div key={channel} className="flex items-center gap-4">
                                        <div className="w-28 shrink-0 text-sm font-medium text-stone-800 md:w-36">{channel}</div>
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                                            <div className="h-full rounded-full bg-stone-800" style={{ width: `${weight}%` }} />
                                        </div>
                                        <div className="w-10 shrink-0 text-right font-mono text-xs font-medium text-stone-500">{weight}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Save Success Modal - Clean Minimal Style */}
                {showSaveSuccessModal && (
                    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[24px] p-6 max-w-[400px] w-full shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">

                            {/* Close Icon */}
                            <button
                                onClick={() => setShowSaveSuccessModal(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <X size={20} />
                            </button>

                            <div className="pt-2">
                                {/* Check Icon */}
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4 group">
                                    <Check className="h-8 w-8 text-emerald-600 group-hover:scale-110 transition-transform duration-300" strokeWidth={3} />
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-1">Đã lưu thành công!</h3>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4">Saved to History</p>

                                <p className="text-[15px] text-slate-500 mb-8 px-2 leading-relaxed">
                                    Chiến lược của bạn đã được lưu trữ an toàn. Bạn có thể xem lại bất cứ lúc nào trong mục <span className="font-semibold text-slate-700">Lịch sử</span>.
                                </p>

                                {/* Primary Button */}
                                <button
                                    onClick={() => setShowSaveSuccessModal(false)}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-4 py-3.5 text-[15px] font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
                                >
                                    Tuyệt vời
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Deploy Success Modal - Clean Minimal Style */}
                {showDeploySuccessModal && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[24px] p-6 max-w-[400px] w-full shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">

                            {/* Close Icon */}
                            <button
                                onClick={() => setShowDeploySuccessModal(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <X size={20} />
                            </button>

                            <div className="pt-2">
                                {/* Rocket Icon - Clean Style */}
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 group">
                                    <Rocket className="h-8 w-8 text-stone-700 transition-transform duration-300 group-hover:-translate-y-1" strokeWidth={1.75} />
                                </div>

                                <h3 className="mb-1 text-xl font-semibold tracking-tight text-stone-900">Chiến lược sẵn sàng!</h3>
                                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">Dữ liệu đã được chuẩn bị</p>

                                <p className="text-[15px] text-slate-500 mb-8 px-2 leading-relaxed">
                                    Tuyệt vời! AI sẽ tự động dán thông tin chiến lược vừa tạo vào <span className="font-semibold text-slate-700">Smart Content Calendar</span> ngay bây giờ.
                                </p>

                                {/* Primary Button */}
                                <button
                                    onClick={confirmDeploy}
                                    className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-stone-900 px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-stone-800"
                                >
                                    Mở Lịch Nội Dung <ArrowRight size={18} strokeWidth={1.25} />
                                </button>

                                {/* Secondary Action */}
                                <button
                                    onClick={() => setShowDeploySuccessModal(false)}
                                    className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors py-2"
                                >
                                    Ở lại đây
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default MastermindStrategyComponent;