import React, { useState, useEffect } from 'react';
import {
    Brain, Target, Compass, ArrowRight, Loader2, Sparkles, Map, Heart, Lightbulb, Users,
    CalendarDays, History, X, Save, Check, Rocket, Diamond, Lock, ChevronRight
} from 'lucide-react';
import { generateMastermindStrategy } from '../services/geminiService';
import { MastermindService } from '../services/mastermindService';
import { StorageService } from '../services/storageService';
import { useBrand } from './BrandContext';
import { MastermindStrategy, Persona } from '../types';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';

interface MastermindStrategyProps {
    onDeployToCalendar?: (strategy: MastermindStrategy) => void;
}

const MastermindStrategyComponent: React.FC<MastermindStrategyProps> = ({ onDeployToCalendar }) => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();

    // UI State
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [viewMode, setViewMode] = useState<'create' | 'dashboard'>('create');
    const [showHistory, setShowHistory] = useState(false);

    const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
    const [showDeploySuccessModal, setShowDeploySuccessModal] = useState(false);

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
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
    }, [user]);

    useEffect(() => {
        if (currentBrand && activeTab === 'vault') {
            setAvailablePersonas(StorageService.getPersonasByBrand(currentBrand.id));
        } else {
            setAvailablePersonas([]);
            setSelectedPersona(null);
        }

        const loadHistory = async () => {
            const strategies = await MastermindService.getMastermindStrategies();
            setHistoryList(strategies);
        };
        loadHistory();
    }, [currentBrand, activeTab]);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const handleGenerate = async () => {
        if (activeTab === 'vault' && (!currentBrand || !selectedPersona)) {
            showToast("Vui lòng chọn Brand và Persona", "error");
            return;
        }
        if (activeTab === 'manual' && (!manualBrandName || !manualAudienceName)) {
            showToast("Vui lòng nhập tên Brand và Đối tượng", "error");
            return;
        }

        setIsGenerating(true);
        let brandInfo = activeTab === 'manual' 
          ? `Name: ${manualBrandName}. Vision: ${manualBrandVision}. Values: ${manualBrandValues}`
          : `Name: ${currentBrand?.identity.name}. Vision: ${currentBrand?.strategy.vision}. Values: ${currentBrand?.strategy.coreValues.join(', ')}`;
        
        let audienceInfo = activeTab === 'manual'
          ? `Name: ${manualAudienceName}. Pain: ${manualAudiencePain}. Desire: ${manualAudienceDesire}`
          : `Name: ${selectedPersona?.fullname}. Bio: ${selectedPersona?.bio}. Pain: ${selectedPersona?.frustrations.join(', ')}`;

        try {
            const result = await generateMastermindStrategy(brandInfo, audienceInfo, objective, perception, tone);
            if (result) {
                const newStrategy: MastermindStrategy = {
                    id: Date.now().toString(),
                    name: activeTab === 'manual' ? `${manualBrandName} x ${manualAudienceName}` : `${currentBrand?.identity.name} x ${selectedPersona?.fullname}`,
                    brandId: activeTab === 'manual' ? 'manual' : currentBrand!.id,
                    personaId: activeTab === 'manual' ? 'manual' : selectedPersona!.id,
                    objective, perception, tone, result,
                    createdAt: Date.now()
                };
                setStrategyResult(newStrategy);
                await MastermindService.saveMastermindStrategy(newStrategy);
                setViewMode('dashboard');
            }
        } catch (e) {
            showToast("Lỗi khi tạo chiến lược", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const loadStrategy = (strategy: MastermindStrategy) => {
        setStrategyResult(strategy);
        setViewMode('dashboard');
        setShowHistory(false);
    };

    const confirmDeploy = () => {
        if (strategyResult && onDeployToCalendar) {
            onDeployToCalendar(strategyResult);
            setShowDeploySuccessModal(false);
        }
    };

    if (viewMode === 'create') {
        return (
            <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC]">
                <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-8 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2 text-stone-400">
                             <Brain size={18} strokeWidth={1.25} />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Strategy Engine</span>
                        </div>
                        <h2 className="text-xl font-medium text-stone-900 leading-none">Mastermind Strategy</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="inline-flex gap-1 rounded-xl border border-stone-200 bg-stone-50/50 p-1 shadow-sm mr-2">
                             <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500'}`}>✍️ Thủ công</button>
                             <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500'}`}>
                                 <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                             </button>
                        </div>
                        <button onClick={() => setShowHistory(true)} className="px-4 py-2 rounded-full border border-stone-200 text-sm font-medium hover:bg-stone-50 transition-colors flex items-center gap-2"><History size={16} /> Lịch sử</button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 py-8">
                    <div className="mx-auto max-w-5xl">
                        {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                            <div className="rounded-3xl border border-stone-200 bg-white shadow-xl overflow-hidden grid grid-cols-2">
                                <div className="p-12 space-y-6">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                                    <h3 className="text-2xl font-medium">Strategic Mastermind Pro</h3>
                                    <p className="text-stone-500 leading-relaxed">AI sẽ kết nối Persona, Thị trường và DNA thương hiệu từ Vault để tạo ra chiến lược Content "Bách phát bách trúng".</p>
                                    <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2">Nâng cấp Pro Max <ChevronRight size={18} /></button>
                                </div>
                                <div className="bg-stone-50 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-5 flex items-center justify-center"><Brain size={300} /></div>
                                    <div className="p-8 bg-white/80 rounded-3xl shadow-2xl backdrop-blur-md opacity-40 grayscale blur-[2px] scale-90">
                                         <div className="h-4 w-32 bg-stone-200 mb-4" />
                                         <div className="h-2 w-full bg-stone-100 mb-2" />
                                         <div className="h-2 w-2/3 bg-stone-100" />
                                    </div>
                                    <Lock size={48} className="absolute text-stone-300" />
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                                <div className="flex bg-stone-50/50 border-b border-stone-100">
                                    {[1, 2, 3].map(i => <div key={i} className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-widest transition-all ${step === i ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}>Giai đoạn {i}</div>)}
                                </div>
                                
                                <div className="flex-1 p-10">
                                    {step === 1 && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex items-center gap-3"><Users className="text-stone-400" /> <h3 className="text-lg font-medium">Context: Thấu hiểu thực tế</h3></div>
                                            {activeTab === 'manual' ? (
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-bold uppercase text-stone-400">Thương hiệu</label>
                                                        <input className="w-full p-3 rounded-xl border border-stone-200 text-sm" placeholder="Tên thương hiệu..." value={manualBrandName} onChange={e => setManualBrandName(e.target.value)} />
                                                        <textarea className="w-full p-3 h-24 rounded-xl border border-stone-200 text-sm" placeholder="Tầm nhìn & Giá trị..." value={manualBrandVision} onChange={e => setManualBrandVision(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-bold uppercase text-stone-400">Đối tượng</label>
                                                        <input className="w-full p-3 rounded-xl border border-stone-200 text-sm" placeholder="Tên khách hàng..." value={manualAudienceName} onChange={e => setManualAudienceName(e.target.value)} />
                                                        <textarea className="w-full p-3 h-24 rounded-xl border border-stone-200 text-sm" placeholder="Nỗi đau & Khao khát..." value={manualAudiencePain} onChange={e => setManualAudiencePain(e.target.value)} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-10">
                                                    <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-3 block">Chọn Brand</label><BrandSelector /></div>
                                                    <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-3 block">Chọn Persona</label><div className="space-y-2">{availablePersonas.map(p => <button key={p.id} onClick={() => setSelectedPersona(p)} className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${selectedPersona?.id === p.id ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 hover:bg-stone-50'}`}><img src={p.avatarUrl} className="w-8 h-8 rounded-full" /> <span className="text-sm font-medium">{p.fullname}</span></button>)}</div></div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {step === 2 && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex items-center gap-3"><Target className="text-stone-400" /> <h3 className="text-lg font-medium">Goal: Mục tiêu thực tế</h3></div>
                                            <div className="space-y-6">
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Objective (Mục tiêu thay đổi)</label><textarea className="w-full p-4 h-28 rounded-xl border border-stone-200 text-sm" placeholder="Khách hàng sẽ thay đổi hành vi gì sau khi xem Content?" value={objective} onChange={e => setObjective(e.target.value)} /></div>
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Perception (Nhận thức mong muốn)</label><textarea className="w-full p-4 h-28 rounded-xl border border-stone-200 text-sm" placeholder="Họ sẽ nhớ gì về chúng ta?" value={perception} onChange={e => setPerception(e.target.value)} /></div>
                                            </div>
                                        </div>
                                    )}
                                    {step === 3 && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 text-center py-10">
                                            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6"><Compass size={40} className="text-stone-800" /></div>
                                            <h3 className="text-2xl font-medium">Sẵn sàng lập chiến lược</h3>
                                            <p className="text-stone-500 max-w-md mx-auto">AI sẽ kết hợp toàn bộ bối cảnh để tạo ra các Creative Angle và Kế hoạch phân phối đa kênh.</p>
                                            <div className="max-w-sm mx-auto pt-6"><label className="text-xs font-semibold text-stone-700 mb-2 block text-left">Giọng điệu (Tone of Voice)</label><input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="VD: Truyền cảm hứng, Chuyên gia, Gần gũi..." value={tone} onChange={e => setTone(e.target.value)} /></div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-10 py-6 border-t border-stone-100 bg-stone-50/30 flex justify-between">
                                    {step > 1 ? <button onClick={() => setStep(step-1)} className="px-6 py-2 text-stone-500 font-medium hover:text-stone-900 transition-colors">Quay lại</button> : <div />}
                                    <button onClick={step < 3 ? () => setStep(step+1) : handleGenerate} className="px-10 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all flex items-center gap-2">
                                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : (step < 3 ? 'Kế tiếp' : 'Xây dựng chiến lược')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-lg h-[60vh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden">
                            <header className="p-6 border-b border-stone-100 flex justify-between items-center"><h3 className="font-medium">Lịch sử chiến lược</h3><button onClick={() => setShowHistory(false)}><X size={20} className="text-stone-300" /></button></header>
                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {historyList.map(s => <button key={s.id} onClick={() => loadStrategy(s)} className="w-full text-left p-4 rounded-2xl border border-stone-100 hover:border-stone-300 bg-stone-50/50 transition-all">
                                    <div className="font-medium text-stone-900">{s.name}</div>
                                    <div className="text-[10px] text-stone-400 mt-1">{new Date(s.createdAt).toLocaleDateString()}</div>
                                </button>)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (viewMode === 'dashboard' && strategyResult) {
        const { result } = strategyResult;
        return (
            <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC]">
                <header className="z-20 flex shrink-0 border-b border-stone-200/70 bg-[#FCFDFC] px-8 py-5 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('create')} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ArrowRight size={20} className="rotate-180" /></button>
                        <div><h2 className="text-xl font-medium">{strategyResult.name}</h2><p className="text-xs text-stone-400 mt-0.5">Chiến lược tổng thể Mastermind</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleSave} className="px-5 py-2.5 rounded-full border border-stone-200 text-sm font-medium hover:bg-stone-50 flex items-center gap-2"><Save size={16} /> Lưu</button>
                        <button onClick={handleDeploy} className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 flex items-center gap-2"><CalendarDays size={16} /> Deploy to Calendar</button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10">
                    <div className="mx-auto max-w-6xl space-y-8 pb-10">
                        <div className="p-10 rounded-3xl border border-stone-200 bg-white shadow-sm flex items-center justify-between gap-10">
                             <div className="flex-1 text-center border-r border-stone-100 pr-10"><div className="text-[10px] font-bold uppercase text-amber-500 mb-2">Core Message</div><div className="text-2xl font-medium text-stone-900">"{result.coreMessage}"</div></div>
                             <div className="flex-1 text-center"><div className="text-[10px] font-bold uppercase text-emerald-500 mb-2">Strategic Insight</div><p className="text-stone-600 leading-relaxed italic">{result.insight}</p></div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                             <div className="p-6 rounded-2xl bg-stone-900 text-white"><div className="text-[10px] font-bold uppercase text-stone-500 mb-4 tracking-widest">Objective</div><p className="text-stone-100 leading-relaxed">{strategyResult.objective}</p></div>
                             <div className="col-span-2 p-6 rounded-2xl border border-stone-200 bg-white"><div className="text-[10px] font-bold uppercase text-stone-400 mb-4 tracking-widest">Key Messages</div><div className="grid grid-cols-3 gap-4">{result.keyMessages.map((m, i) => <div key={i} className="p-4 rounded-xl bg-stone-50 text-sm text-stone-700 leading-relaxed font-medium">{m}</div>)}</div></div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            {['visual', 'story', 'action'].map(key => (
                                <div key={key} className="p-6 rounded-2xl border border-stone-100 bg-white shadow-sm">
                                    <div className="text-[10px] font-bold uppercase text-stone-400 mb-4 tracking-widest">{key}</div>
                                    <ul className="space-y-3">{result.contentAngles[key as keyof typeof result.contentAngles].map((item, i) => <li key={i} className="text-sm text-stone-600 flex gap-2"><div className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" /> {item}</li>)}</ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {showDeploySuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
                            <button onClick={() => setShowDeploySuccessModal(false)} className="absolute top-4 right-4 text-stone-400"><X size={20} /></button>
                            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6 text-stone-800 font-bold"><Rocket size={32} /></div>
                            <h3 className="text-xl font-medium mb-2">Chiến lược sẵn sàng!</h3>
                            <p className="text-sm text-stone-500 leading-relaxed mb-8">AI sẽ tự động chuyển dữ liệu Mastermind này sang Smart Content Calendar để lập kế hoạch chi tiết.</p>
                            <button onClick={confirmDeploy} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2">Mở Smart Calendar <ArrowRight size={18} /></button>
                        </div>
                    </div>
                )}
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        );
    }

    return null;
};

export default MastermindStrategyComponent;