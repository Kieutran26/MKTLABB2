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
    const [availableStrategies, setAvailableStrategies] = useState<MastermindStrategy[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
    const [showDeploySuccessModal, setShowDeploySuccessModal] = useState(false);

    useEffect(() => {
        // Load from DB first
        const loadHistory = async () => {
            try {
                const dbHistory = await MastermindService.getMastermindStrategies();
                
                // Fallback / Merge with LocalStorage
                const localHistoryRaw = localStorage.getItem('mktlab_mastermind_history');
                const localHistory: MastermindStrategy[] = localHistoryRaw ? JSON.parse(localHistoryRaw) : [];
                
                // Merge and remove duplicates by ID
                const mergedMap = new Map();
                localHistory.forEach((s: MastermindStrategy) => mergedMap.set(s.id, s));
                dbHistory.forEach((s: MastermindStrategy) => mergedMap.set(s.id, s));
                
                const finalHistory = Array.from(mergedMap.values() as IterableIterator<MastermindStrategy>).sort((a,b) => b.createdAt - a.createdAt);
                setAvailableStrategies(finalHistory);
            } catch (e) {
                // If DB fails, just show Local
                const localHistoryRaw = localStorage.getItem('mktlab_mastermind_history');
                const localHistory: MastermindStrategy[] = localHistoryRaw ? JSON.parse(localHistoryRaw) : [];
                setAvailableStrategies(localHistory.sort((a: MastermindStrategy, b: MastermindStrategy) => b.createdAt - a.createdAt));
            }
        };
        loadHistory();
    }, []);

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
    const [resources, setResources] = useState('');
    const [timeline, setTimeline] = useState('');
    const [baselineMetrics, setBaselineMetrics] = useState('');
    const [tone, setTone] = useState('');
    const [emotion, setEmotion] = useState('');
    const [channels, setChannels] = useState('');
    const [competitors, setCompetitors] = useState('');

    // Results
    const [strategyResult, setStrategyResult] = useState<MastermindStrategy | null>(null);

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
          ? `Tên thương hiệu: ${manualBrandName}. Tầm nhìn & Giá trị: ${manualBrandVision}.`
          : `Thương hiệu (Vault): ${currentBrand?.identity.name}. Tầm nhìn: ${currentBrand?.strategy.vision}. Giá trị cốt lõi: ${currentBrand?.strategy.coreValues.join(', ')}.`;
        
        let audienceInfo = activeTab === 'manual'
          ? `Tên khách hàng: ${manualAudienceName}. Nỗi đau & Khao khát: ${manualAudiencePain}`
          : `Persona (Vault): ${selectedPersona?.fullname}. Thói quen: ${selectedPersona?.bio}. Nỗi đau: ${selectedPersona?.frustrations.join(', ')}. Khao khát: ${selectedPersona?.goals.join(', ')}.`;

        let baselineStr = baselineMetrics.trim() ? baselineMetrics : "[Trống - Yêu cầu bổ sung để xác nhận target thực tế]";
        let goalInfo = `Mục tiêu kinh doanh: ${objective}. Kỳ vọng cụ thể: ${perception}. Nguồn lực hiện có: ${resources}. Timeline thực hiện: ${timeline}. Số liệu hiện tại (Baseline): ${baselineStr}`;
        let vibeInfo = `Tính cách thương hiệu: ${tone}. Cảm xúc muốn tạo ra: ${emotion}. Kênh truyền thông chính: ${channels}. Đối thủ cạnh tranh: ${competitors}.`;

        try {
            const result = await generateMastermindStrategy(brandInfo, audienceInfo, goalInfo, vibeInfo, tone);
            if (result) {
                const newStrategy: MastermindStrategy = {
                    id: Date.now().toString(),
                    name: `Chiến lược ${manualBrandName || currentBrand?.identity.name || 'Mới'} - ${new Date().toLocaleDateString('vi-VN')}`,
                    brandId: currentBrand?.id || 'manual',
                    personaId: selectedPersona?.id || 'manual',
                    objective,
                    perception,
                    tone,
                    result,
                    createdAt: Date.now()
                };
                setStrategyResult(newStrategy);
                
                // Temp save to LocalStorage
                const localRaw = localStorage.getItem('mktlab_mastermind_history');
                const local: MastermindStrategy[] = localRaw ? JSON.parse(localRaw) : [];
                const updatedLocal = [newStrategy, ...local].slice(0, 50); // Keep top 50
                localStorage.setItem('mktlab_mastermind_history', JSON.stringify(updatedLocal));
                setAvailableStrategies(updatedLocal);

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

    const handleSave = async () => {
        if (!strategyResult) return;
        try {
            // Save to DB
            await MastermindService.saveMastermindStrategy(strategyResult);
            
            // Also ensure it's in LocalStorage for redundancy
            const localRaw = localStorage.getItem('mktlab_mastermind_history');
            const local: MastermindStrategy[] = localRaw ? JSON.parse(localRaw) : [];
            if (!local.find(s => s.id === strategyResult.id)) {
                localStorage.setItem('mktlab_mastermind_history', JSON.stringify([strategyResult, ...local]));
            }
            
            showToast("Đã lưu chiến lược thành công", "success");
        } catch (e) {
            // If DB fails, inform user but confirm Local exists
            showToast("Lưu DB lỗi, nhưng đã lưu tạm vào Local Storage", "info");
        }
    };

    const handleDeploy = () => {
        setShowDeploySuccessModal(true);
    };

    const confirmDeploy = () => {
        if (strategyResult && onDeployToCalendar) {
            onDeployToCalendar(strategyResult);
            setShowDeploySuccessModal(false);
            showToast("Đã chuyển dữ liệu sang Calendar", "success");
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
                                                        <textarea className="w-full p-3 h-32 rounded-xl border border-stone-200 text-sm" placeholder="Tầm nhìn & Giá trị (Vision & Mission)..." value={manualBrandVision} onChange={e => setManualBrandVision(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-bold uppercase text-stone-400">Đối tượng</label>
                                                        <input className="w-full p-3 rounded-xl border border-stone-200 text-sm" placeholder="Tên khách hàng mục tiêu..." value={manualAudienceName} onChange={e => setManualAudienceName(e.target.value)} />
                                                        <textarea className="w-full p-3 h-32 rounded-xl border border-stone-200 text-sm" placeholder="Nỗi đau & Khao khát (Pain & Desire)..." value={manualAudiencePain} onChange={e => setManualAudiencePain(e.target.value)} />
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
                                            <div className="flex items-center gap-3"><Target className="text-stone-400" /> <h3 className="text-lg font-medium">Goal: Mục tiêu chiến lược</h3></div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Mục tiêu kinh doanh</label><textarea className="w-full p-4 h-24 rounded-xl border border-stone-200 text-sm" placeholder="VD: Tăng 20% doanh thu..." value={objective} onChange={e => setObjective(e.target.value)} /></div>
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Kỳ vọng cụ thể</label><textarea className="w-full p-4 h-24 rounded-xl border border-stone-200 text-sm" placeholder="VD: 1000 lead mới trong 1 tháng..." value={perception} onChange={e => setPerception(e.target.value)} /></div>
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Nguồn lực hiện có</label><textarea className="w-full p-4 h-24 rounded-xl border border-stone-200 text-sm" placeholder="VD: Đội ngũ 3 người, ngân sách 50tr..." value={resources} onChange={e => setResources(e.target.value)} /></div>
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Timeline thực hiện</label><textarea className="w-full p-4 h-24 rounded-xl border border-stone-200 text-sm" placeholder="VD: Chiến dịch 3 tháng, bắt đầu từ..." value={timeline} onChange={e => setTimeline(e.target.value)} /></div>
                                                <div className="col-span-2"><label className="text-xs font-semibold text-red-600 mb-2 block">Số liệu hiện tại (Bắt buộc - Followers, Reach, Leads...)</label><input className="w-full p-4 rounded-xl border border-red-100 bg-red-50/10 text-sm focus:border-red-400 focus:ring-red-400" placeholder="VD: 5k Followers, 10k Reach/tháng, 50 Leads... (Nếu để trống AI sẽ cảnh báo)" value={baselineMetrics} onChange={e => setBaselineMetrics(e.target.value)} /></div>
                                            </div>
                                        </div>
                                    )}
                                    {step === 3 && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex items-center gap-3"><Compass className="text-stone-400" /> <h3 className="text-lg font-medium">Tactics: Thiết lập giọng điệu & Kênh</h3></div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Tính cách thương hiệu (Tone)</label><input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="VD: Truyền cảm hứng, Chuyên gia..." value={tone} onChange={e => setTone(e.target.value)} /></div>
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Cảm xúc muốn tạo ra</label><input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="VD: Khát khao, Tin tưởng, Tò mò..." value={emotion} onChange={e => setEmotion(e.target.value)} /></div>
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Kênh truyền thông chính</label><input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="VD: Facebook, TikTok, YouTube..." value={channels} onChange={e => setChannels(e.target.value)} /></div>
                                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Đối thủ cạnh tranh</label><input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="Liệt kê top 3 đối thủ..." value={competitors} onChange={e => setCompetitors(e.target.value)} /></div>
                                            </div>
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
                                {availableStrategies.length === 0 ? (
                                    <div className="text-center text-stone-500">Chưa có lịch sử chiến lược.</div>
                                ) : (
                                    availableStrategies.map(s => <button key={s.id} onClick={() => loadStrategy(s)} className="w-full text-left p-4 rounded-2xl border border-stone-100 hover:border-stone-300 bg-stone-50/50 transition-all">
                                        <div className="font-medium text-stone-900">{s.name}</div>
                                        <div className="text-[10px] text-stone-400 mt-1">{new Date(s.createdAt).toLocaleDateString()}</div>
                                    </button>)
                                )}
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
                    <div className="mx-auto max-w-5xl space-y-24 pb-32">
                        {result.htmlOutput ? (
                            <div dangerouslySetInnerHTML={{ __html: result.htmlOutput }} className="w-full bg-white text-stone-900 rounded-sm shadow-sm" />
                        ) : (
                            <>
                        {/* Section 1: Executive Summary & Core Concept */}
                        <div className="space-y-12">
                             <div className="border-b-2 border-stone-200 pb-4 flex justify-between items-end">
                                 <div>
                                     <div className="text-[10px] font-bold tracking-[0.2em] text-blue-400 mb-2">01 / BRAND FOUNDATION</div>
                                     <h3 className="text-3xl font-serif text-stone-800 tracking-tight">Core Strategy</h3>
                                 </div>
                                 <div className="text-right max-w-md hidden md:block">
                                     <p className="text-xs text-stone-400 italic">"The essence of the brand distilled into actionable insights and core messaging."</p>
                                 </div>
                             </div>
                             
                             <div className="grid grid-cols-12 gap-8 md:gap-16 items-start">
                                 <div className="col-span-12 md:col-span-8 space-y-8">
                                     <div className="text-[10px] font-bold uppercase text-stone-400 tracking-[0.15em]">Core Message</div>
                                     <h2 className="text-4xl md:text-5xl font-serif text-stone-900 leading-[1.1] tracking-tighter">
                                         "{result.coreMessage}"
                                     </h2>
                                     <p className="text-stone-600 leading-relaxed text-lg font-serif">{result.conclusion?.summary}</p>
                                 </div>
                                 <div className="col-span-12 md:col-span-4 border-l border-stone-200 pl-8 space-y-6">
                                     <div className="text-[10px] font-bold uppercase text-stone-400 tracking-[0.15em]">Expert Insight</div>
                                     <p className="text-stone-900 leading-relaxed font-medium italic text-sm">
                                         {result.insight}
                                     </p>
                                     <div className="space-y-4 pt-6 border-t border-stone-200">
                                         <div className="text-[10px] font-bold uppercase text-stone-400 tracking-[0.15em]">Key Messages</div>
                                         <ul className="space-y-3">
                                             {result.keyMessages.map((m, i) => (
                                                 <li key={i} className="text-xs font-medium text-stone-800 flex gap-3"><span className="text-stone-300 font-serif italic">{String(i+1).padStart(2, '0')}</span> {m}</li>
                                             ))}
                                         </ul>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* Section 2: Consumer Insight & Competitive Edge */}
                        <div className="space-y-12">
                             <div className="border-b border-rose-100 pb-4">
                                 <div className="text-[10px] font-bold tracking-[0.2em] text-rose-400 mb-2">02 / MARKET & AUDIENCE</div>
                                 <h3 className="text-2xl font-serif text-stone-800 tracking-tight">Competitive Landscape</h3>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 divide-y md:divide-y-0 md:divide-x divide-rose-50">
                                 {/* Persona Column */}
                                 <div className="space-y-10 md:pr-12">
                                     <div>
                                         <div className="text-[10px] font-bold text-stone-400 tracking-widest uppercase mb-4">Target Persona</div>
                                         <div className="text-sm text-stone-600 leading-relaxed font-serif italic border-l-2 border-stone-200 pl-4">{result.brand_context?.persona.psychographics}</div>
                                     </div>
                                     <div>
                                         <div className="text-[10px] font-bold text-stone-400 tracking-widest uppercase mb-4">Buying Behavior</div>
                                         <div className="text-sm text-stone-700 font-medium">{result.brand_context?.persona.behaviors}</div>
                                     </div>
                                     <div className="pt-4 space-y-4">
                                         <div className="text-[10px] font-bold text-stone-400 tracking-widest uppercase mb-4">Pain Points & Triggers</div>
                                         <div className="space-y-3">
                                             {result.brand_context?.pain_gain.ranked_pains.map((p, i) => (
                                                 <div key={i} className="group relative pl-4 border-l border-stone-100 hover:border-rose-200 transition-colors">
                                                     <div className="flex items-center gap-2 mb-1">
                                                         <span className={`text-[9px] font-bold uppercase tracking-wider ${p.impact === 'High' ? 'text-rose-500' : p.impact === 'Med' ? 'text-amber-500' : 'text-blue-400'}`}>[{p.impact} Impact]</span>
                                                     </div>
                                                     <p className="text-xs font-semibold text-stone-700 mb-1 leading-snug">{p.content}</p>
                                                     <p className="text-[10px] text-stone-400 italic font-serif">→ {p.message_link}</p>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 </div>

                                 {/* Competitive Space Column */}
                                 {result.brand_context?.positioning && (
                                     <div className="md:pl-12 space-y-10">
                                         <div>
                                             <div className="text-[10px] font-bold text-rose-400 tracking-widest uppercase mb-4">Brand Differentiator</div>
                                             <p className="text-lg font-serif text-stone-800 leading-snug">"{result.brand_context.positioning.differentiator}"</p>
                                         </div>
                                         <div className="bg-rose-50/50 p-6 border border-rose-100/50 space-y-4 relative">
                                             <div className="absolute top-0 right-0 p-4 opacity-[0.02]"><Map size={80} className="text-rose-900" /></div>
                                             <div className="text-[10px] font-bold text-rose-400 tracking-widest uppercase">2x2 Matrix Definition</div>
                                             <p className="text-xs text-stone-600 leading-relaxed font-medium relative z-10">{result.brand_context.positioning.competitive_map.description}</p>
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>

                        {/* Section 3: Strategic Goals & Roadmap */}
                        <div className="space-y-12">
                             <div className="border-b border-emerald-100 pb-4">
                                 <div className="text-[10px] font-bold tracking-[0.2em] text-emerald-500 mb-2">03 / EXECUTION & METRICS</div>
                                 <h3 className="text-2xl font-serif text-stone-800 tracking-tight">90-Day Tactical Roadmap</h3>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-stone-100">
                                 {result.strategic_goals?.roadmap_90day.months.map((m, i) => (
                                     <div key={i} className="p-8 border-r border-b border-stone-100 space-y-8 bg-white/50 hover:bg-stone-50/50 transition-colors">
                                         <div className="flex justify-between items-baseline border-b border-stone-50 pb-4">
                                             <div className="text-sm font-serif font-bold text-stone-700 tracking-widest uppercase">{m.month_name}</div>
                                             <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest border border-stone-100 px-2 py-0.5 rounded-sm">{m.owner}</span>
                                         </div>
                                         <div className="space-y-5">
                                             <div className="text-sm font-bold text-stone-800 leading-snug">{m.priority}</div>
                                             <ul className="space-y-3">
                                                 {m.actions.map((a, j) => <li key={j} className="text-xs text-stone-600 flex gap-3 leading-relaxed"><span className="text-stone-300 font-serif italic">{j+1}.</span> {a}</li>)}
                                             </ul>
                                         </div>
                                         <div className="pt-6 border-t border-stone-100">
                                             <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Target KPI</div>
                                             <div className="text-sm font-bold text-emerald-600">{m.kpi}</div>
                                         </div>
                                     </div>
                                 ))}
                             </div>

                             <div className="bg-emerald-50/50 border border-emerald-100/50 p-8 md:p-12">
                                 <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-8">SMART Metrics Breakdown</div>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                     {result.strategic_goals?.smart_goals.slice(0, 4).map((g, i) => (
                                         <div key={i} className="space-y-3 border-l border-emerald-200/50 pl-4">
                                             <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{g.goal}</div>
                                             <div className="text-sm text-stone-500 font-serif">{g.baseline} <span className="text-emerald-300 mx-1 font-sans">→</span> <span className="text-emerald-700 font-bold font-sans">{g.target}</span></div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>

                        {/* Section 4: Media Tactics & Content Distribution */}
                        <div className="space-y-12">
                             <div className="border-b border-amber-100 pb-4">
                                 <div className="text-[10px] font-bold tracking-[0.2em] text-amber-500 mb-2">04 / DISTRIBUTION & ANGLES</div>
                                 <h3 className="text-2xl font-serif text-stone-800 tracking-tight">Content Strategy</h3>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                 {/* Left: Channel Allocation */}
                                 <div className="md:col-span-4 space-y-8">
                                     <div className="text-[10px] font-bold uppercase text-stone-400 tracking-[0.15em] border-b border-stone-100 pb-3">Channel Allocation</div>
                                     <div className="space-y-6">
                                         {Object.entries(result.strategic_goals?.resource_allocation.budget_split || {}).map(([name, data]: [string, any]) => (
                                             <div key={name} className="space-y-3 group">
                                                 <div className="flex justify-between items-baseline text-sm font-bold border-b border-stone-100 pb-2 group-hover:border-amber-200 transition-colors">
                                                     <span className="uppercase tracking-widest text-stone-700">{name}</span>
                                                     <span className="text-stone-400 font-serif">{data.percent}</span>
                                                 </div>
                                                 <p className="text-[11px] text-stone-500 leading-relaxed font-serif italic">"{data.rationale}"</p>
                                                 <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{data.kpi}</div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Right: Content Angles & Examples */}
                                 <div className="md:col-span-8 space-y-12 md:pl-8 md:border-l border-stone-100">
                                     <div className="space-y-8">
                                         <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-stone-100 pb-3 gap-2">
                                             <div className="text-[10px] font-bold uppercase text-stone-400 tracking-[0.15em]">Content Angles</div>
                                             <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{result.contentAngles.weekly_distribution}</div>
                                         </div>
                                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                             {['visual', 'story', 'action'].map(key => (
                                                 <div key={key} className="space-y-4">
                                                     <div className="text-[10px] font-bold uppercase text-stone-600 tracking-widest">{key}</div>
                                                     <ul className="space-y-2">
                                                         {result.contentAngles[key as keyof typeof result.contentAngles] && Array.isArray(result.contentAngles[key as keyof typeof result.contentAngles]) ? (result.contentAngles[key as keyof typeof result.contentAngles] as string[]).map((item, i) => <li key={i} className="text-xs text-stone-500 leading-relaxed pl-2 border-l border-stone-100"> {item}</li>) : null}
                                                     </ul>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>

                                     {/* Editorial Treatment for Real Examples */}
                                     {result.contentAngles.real_examples && (
                                         <div className="border border-stone-100 p-8 space-y-8 bg-stone-50/50 relative">
                                             <div className="absolute top-0 left-8 -translate-y-1/2 bg-stone-50 px-2">
                                                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Real Execution
                                                </div>
                                             </div>
                                             <div className="grid grid-cols-1 gap-8">
                                                 <div className="space-y-3">
                                                     <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Facebook Extended Copy</div>
                                                     <p className="text-sm font-serif text-stone-700 leading-loose border-l-2 border-amber-300 pl-6 whitespace-pre-wrap">{result.contentAngles.real_examples.facebook_caption}</p>
                                                 </div>
                                                 <div className="space-y-3">
                                                     <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">TikTok Hook Sequence</div>
                                                     <p className="text-sm font-serif text-stone-700 leading-loose border-l-2 border-amber-300 pl-6 whitespace-pre-wrap">{result.contentAngles.real_examples.tiktok_hook}</p>
                                                 </div>
                                                 <div className="space-y-3">
                                                     <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Call-To-Action (CTA)</div>
                                                     <p className="text-sm text-stone-800 leading-loose font-bold pl-6 uppercase tracking-wider">{result.contentAngles.real_examples.specific_cta}</p>
                                                 </div>
                                             </div>
                                         </div>
                                     )}

                                     <div className="bg-white p-6 border-l-4 border-stone-200 border-y border-r border-stone-100 shadow-sm">
                                         <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Sample 1-Week Schedule</div>
                                         <p className="text-xs text-stone-600 leading-relaxed font-serif whitespace-pre-wrap">{result.contentAngles.sample_week_schedule}</p>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* Section 5: Tone of Voice & Expert Advice */}
                        <div className="space-y-12 pt-12 mt-12 border-t-[3px] border-stone-100">
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                 {/* Left: Tone of Voice */}
                                 {result.tone_of_voice && (
                                     <div className="md:col-span-4 space-y-8">
                                         <div className="text-[10px] font-bold tracking-[0.2em] text-indigo-400 pb-4 border-b border-stone-100">05 / TONE OF VOICE</div>
                                         <div className="text-xl font-serif text-stone-800 tracking-tight leading-snug">
                                             "{result.tone_of_voice.personality.human_persona}"
                                         </div>
                                         <div className="space-y-6 pt-6">
                                             {[
                                                 { label: 'Formal / Casual', val: parseInt(result.tone_of_voice.spectrum.formal_casual) },
                                                 { label: 'Serious / Playful', val: parseInt(result.tone_of_voice.spectrum.serious_playful) },
                                                 { label: 'Authority / Friendly', val: parseInt(result.tone_of_voice.spectrum.authority_friendly) },
                                             ].map(s => (
                                                 <div key={s.label} className="space-y-2">
                                                     <div className="flex justify-between text-[9px] uppercase tracking-widest text-stone-400 font-bold"><span>■ {s.label.split('/')[0]}</span><span>{s.label.split('/')[1]} ■</span></div>
                                                     <div className="h-[2px] bg-stone-100 relative shadow-inner">
                                                         <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-indigo-300" style={{ left: `calc(${s.val}% - 3px)` }}></div>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}

                                 {/* Right: CMO Advice */}
                                 <div className="md:col-span-8 space-y-8 md:pl-12 md:border-l border-stone-100">
                                     <div className="text-[10px] font-bold tracking-[0.2em] text-indigo-400 pb-4 border-b border-stone-100 flex justify-between">
                                         <span>06 / EXPERT DIRECTIVES</span>
                                         <span className="text-stone-500">FROM THE CMO'S DESK</span>
                                     </div>
                                     
                                     {result.action_plan?.expert_advice && (
                                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                             <div className="space-y-4">
                                                 <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">The Must-Do</div>
                                                 <p className="text-xs font-medium text-stone-800 leading-relaxed font-serif">{result.action_plan.expert_advice.the_must_do}</p>
                                             </div>
                                             <div className="space-y-4">
                                                 <div className="text-[10px] font-bold text-rose-300 uppercase tracking-widest border-b border-stone-100 pb-2">Common Pitfall</div>
                                                 <p className="text-xs font-medium text-stone-400 line-through leading-relaxed font-serif">{result.action_plan.expert_advice.common_pitfall}</p>
                                             </div>
                                             <div className="space-y-4">
                                                 <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-stone-100 pb-2">Hidden Opportunity</div>
                                                 <p className="text-xs font-bold text-stone-800 leading-relaxed font-serif">{result.action_plan.expert_advice.hidden_opportunity}</p>
                                             </div>
                                         </div>
                                     )}
                                     
                                     <div className="p-10 mt-12 bg-stone-50/50 border border-stone-100 relative overflow-hidden">
                                         <div className="absolute -top-4 -right-4 text-[120px] font-serif text-indigo-100 opacity-50">"</div>
                                         <div className="text-[10px] font-bold text-stone-400 uppercase mb-6 tracking-[0.2em] relative z-10">Final Positioning Statement</div>
                                         <p className="text-2xl md:text-3xl font-serif text-stone-800 leading-snug tracking-tight relative z-10">"{result.conclusion?.positioning_statement}"</p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                        </>
                        )}
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