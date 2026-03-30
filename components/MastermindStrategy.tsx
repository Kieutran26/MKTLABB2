import React, { useState, useEffect } from 'react';
import { Brain, Target, Compass, ArrowRight, Loader2, Sparkles, Map, Heart, Lightbulb, Users, CalendarDays, BarChart, History, X, Save, Edit3, Check, Rocket } from 'lucide-react'; import { generateMastermindStrategy } from '../services/geminiService';
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
            <div className="max-w-4xl mx-auto pt-10 px-6 pb-20">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Brain className="text-indigo-600" strokeWidth={1.5} />
                            Mastermind Strategy
                        </h2>
                        <p className="text-slate-500 mt-1">Xây dựng chiến lược nội dung tổng thể dựa trên kết nối con người.</p>

                        {!useManual && <div className="mt-4"><BrandSelector /></div>}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setUseManual(false)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!useManual ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Brand Vault
                            </button>
                            <button
                                onClick={() => setUseManual(true)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${useManual ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Thủ công
                            </button>
                        </div>
                        <button
                            onClick={() => setShowHistory(true)}
                            className="text-slate-500 hover:text-indigo-600 text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <History size={16} /> Lịch sử
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                    {/* Step Indicators */}
                    <div className="flex border-b border-slate-100">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex-1 p-4 text-center text-sm font-bold border-b-2 transition-colors ${step === i ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                                Giai đoạn {i}
                            </div>
                        ))}
                    </div>

                    <div className="p-8 min-h-[400px]">
                        {/* STEP 1: CONTEXT */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-indigo-500" /> Thấu hiểu (The Context)</h3>

                                {useManual ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4 p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30">
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Chủ thể (Brand)</div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Tên thương hiệu</label>
                                                <input
                                                    className="w-full p-2.5 bg-white border border-indigo-100 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                                    placeholder="VD: OptiMKT"
                                                    value={manualBrandName}
                                                    onChange={e => setManualBrandName(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Tầm nhìn & Sứ mệnh</label>
                                                <textarea
                                                    className="w-full p-2.5 bg-white border border-indigo-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 h-20 resize-none"
                                                    placeholder="Chúng tôi muốn trở thành..."
                                                    value={manualBrandVision}
                                                    onChange={e => setManualBrandVision(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Giá trị cốt lõi</label>
                                                <textarea
                                                    className="w-full p-2.5 bg-white border border-indigo-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 h-16 resize-none"
                                                    placeholder="VD: Tận tâm, Sáng tạo, Bền vững..."
                                                    value={manualBrandValues}
                                                    onChange={e => setManualBrandValues(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-5 rounded-2xl border border-pink-100 bg-pink-50/30">
                                            <div className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">Đối tượng (Audience)</div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Tên nhóm khách hàng</label>
                                                <input
                                                    className="w-full p-2.5 bg-white border border-pink-100 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-100"
                                                    placeholder="VD: GenZ yêu môi trường"
                                                    value={manualAudienceName}
                                                    onChange={e => setManualAudienceName(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Nỗi đau (Pain Points)</label>
                                                <textarea
                                                    className="w-full p-2.5 bg-white border border-pink-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-100 h-16 resize-none"
                                                    placeholder="Họ đang gặp khó khăn gì?"
                                                    value={manualAudiencePain}
                                                    onChange={e => setManualAudiencePain(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Mong muốn (Motivations)</label>
                                                <input
                                                    className="w-full p-2.5 bg-white border border-pink-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
                                                    placeholder="Họ khao khát điều gì?"
                                                    value={manualAudienceDesire}
                                                    onChange={e => setManualAudienceDesire(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Hành vi (Behaviors)</label>
                                                <input
                                                    className="w-full p-2.5 bg-white border border-pink-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
                                                    placeholder="Thói quen online, sở thích..."
                                                    value={manualAudienceBehavior}
                                                    onChange={e => setManualAudienceBehavior(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    !currentBrand ? (
                                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">Vui lòng chọn Brand ở trên để tiếp tục.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Chủ thể (Brand)</div>
                                                <div className="font-bold text-slate-800 text-lg mb-1">{currentBrand.identity.name}</div>
                                                <p className="text-sm text-slate-600 line-clamp-3">{currentBrand.strategy.vision}</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Đối tượng (Audience)</label>
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {availablePersonas.map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => setSelectedPersona(p)}
                                                            className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${selectedPersona?.id === p.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-indigo-200'}`}
                                                        >
                                                            <img src={p.avatarUrl} className="w-10 h-10 rounded-full bg-white" />
                                                            <div>
                                                                <div className="font-bold text-sm text-slate-800">{p.fullname}</div>
                                                                <div className="text-xs text-slate-500">{p.jobTitle}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {availablePersonas.length === 0 && <div className="text-sm text-slate-400 italic">Chưa có Persona nào. Hãy tạo ở module Persona Builder.</div>}
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
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Target className="text-red-500" /> Mục tiêu (The Goal)</h3>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Objective (Mục tiêu chuyển đổi)</label>
                                    <textarea
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-24 resize-none"
                                        placeholder="VD: Chuyển đổi từ 'Biết' sang 'Tin tưởng'. Tăng tỉ lệ đăng ký dùng thử..."
                                        value={objective}
                                        onChange={e => setObjective(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Perception (Nhận thức mong muốn)</label>
                                    <textarea
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-24 resize-none"
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
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Compass className="text-blue-500" /> Định hướng (The Direction)</h3>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tone & Style (Giọng điệu & Phong cách)</label>
                                    <input
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                        placeholder="VD: Hài hước, Châm biếm, Nghiêm túc, Chuyên gia..."
                                        value={tone}
                                        onChange={e => setTone(e.target.value)}
                                    />
                                </div>

                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800">
                                    💡 AI sẽ tổng hợp thông tin từ 3 giai đoạn để xây dựng chiến lược "Human Connection" hoàn chỉnh.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 flex justify-between bg-slate-50">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Quay lại</button>
                        ) : <div></div>}

                        {step < 3 ? (
                            <button onClick={() => setStep(step + 1)} disabled={!useManual && step === 1 && !selectedPersona} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50">
                                Tiếp theo <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                Lập Chiến lược
                            </button>
                        )}
                    </div>
                </div>

                {/* History Modal */}
                {showHistory && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in border border-slate-100 flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> Lịch sử Chiến lược</h3>
                                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                                {historyList.length === 0 ? <div className="text-center py-10 text-slate-400">Chưa có chiến lược nào.</div> : historyList.map(s => (
                                    <div key={s.id} onClick={() => loadStrategy(s)} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 cursor-pointer transition-all">
                                        <div className="font-bold text-slate-800 mb-1">{s.name}</div>
                                        <div className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                ))}
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
            <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
                <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('create')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowRight size={24} strokeWidth={1.5} className="rotate-180" />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 truncate max-w-md">{strategyResult.name}</h2>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all text-sm"
                        >
                            <Save size={16} /> Lưu
                        </button>
                        <button onClick={handleDeploy} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all text-sm">
                            <CalendarDays size={16} /> Deploy to Calendar
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto space-y-8 pb-20">

                        {/* BLOCK 1: THE CORE */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                {/* Brand Side */}
                                <div className="text-center w-48">
                                    <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
                                        <Sparkles className="text-indigo-600" size={32} />
                                    </div>
                                    <div className="font-bold text-slate-800">Brand Truth</div>
                                </div>

                                {/* The Bridge */}
                                <div className="flex-1 text-center relative">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Insight & Connection</div>
                                    <div className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                                        "{result.coreMessage}"
                                    </div>
                                    <div className="mt-4 text-sm text-slate-500 bg-slate-50 inline-block px-4 py-2 rounded-full border border-slate-100">
                                        {result.insight}
                                    </div>
                                </div>

                                {/* Audience Side */}
                                <div className="text-center w-48">
                                    <div className="w-20 h-20 mx-auto bg-pink-100 rounded-full flex items-center justify-center mb-3">
                                        <Heart className="text-pink-600" size={32} />
                                    </div>
                                    <div className="font-bold text-slate-800">Customer Pain</div>
                                </div>
                            </div>
                        </div>

                        {/* BLOCK 2: THE BRAIN */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-lg">
                                <h4 className="font-bold text-slate-400 uppercase text-xs mb-4 flex items-center gap-2"><Target size={14} /> Objective</h4>
                                <p className="text-lg font-medium leading-relaxed">{strategyResult.objective}</p>
                            </div>
                            <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                <h4 className="font-bold text-slate-400 uppercase text-xs mb-4 flex items-center gap-2"><Lightbulb size={14} /> Key Messages</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {result.keyMessages.map((msg, i) => (
                                        <div key={i} className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-yellow-900 font-medium text-sm">
                                            {msg}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* BLOCK 3: THE ART */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Sparkles className="text-purple-500" size={24} /> The Art (Creative Angles)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                                    <h4 className="font-bold text-slate-700 mb-3 border-b pb-2">Visual & Mood</h4>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                        {result.contentAngles.visual.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                                    <h4 className="font-bold text-slate-700 mb-3 border-b pb-2">Storytelling</h4>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                        {result.contentAngles.story.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                                    <h4 className="font-bold text-slate-700 mb-3 border-b pb-2">Action & Activation</h4>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                        {result.contentAngles.action.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* BLOCK 4: THE MAP */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Map className="text-green-500" size={24} /> The Map (Channel Strategy)
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(result.channelStrategy).map(([channel, weight]) => (
                                    <div key={channel} className="flex items-center gap-4">
                                        <div className="w-32 font-bold text-slate-700">{channel}</div>
                                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${weight}%` }}></div>
                                        </div>
                                        <div className="w-12 text-right font-mono text-slate-500 font-bold">{weight}%</div>
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
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4 group">
                                    <Rocket className="h-8 w-8 text-purple-600 group-hover:-translate-y-1 transition-transform duration-300" strokeWidth={2} />
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-1">Chiến lược sẵn sàng!</h3>
                                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4">Dữ liệu đã được chuẩn bị</p>

                                <p className="text-[15px] text-slate-500 mb-8 px-2 leading-relaxed">
                                    Tuyệt vời! AI sẽ tự động dán thông tin chiến lược vừa tạo vào <span className="font-semibold text-slate-700">Smart Content Calendar</span> ngay bây giờ.
                                </p>

                                {/* Primary Button */}
                                <button
                                    onClick={confirmDeploy}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#545BE8] px-4 py-3.5 text-[15px] font-bold text-white shadow-sm hover:bg-[#4349c2] transition-colors mb-3"
                                >
                                    Mở Lịch Nội Dung <ArrowRight size={18} />
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