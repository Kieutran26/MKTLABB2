import React, { useState, useEffect } from 'react';
import {
    Brain, Target, Compass, ArrowRight, Loader2, Sparkles, Map, Heart, Lightbulb, Users,
    CalendarDays, History, X, Save, Check, Rocket, Diamond, Lock, ChevronRight
} from 'lucide-react';
import { generateMastermindStrategy } from '../services/geminiService';
import MastermindStrategyEditorial from './MastermindStrategyEditorial';
import { MastermindService } from '../services/mastermindService';
import { StorageService } from '../services/storageService';
import { useBrand } from './BrandContext';
import { MastermindStrategy, Persona } from '../types';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';
import { EditorialFieldHint } from './mastermind-editorial-field-hint';
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

                <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-8 xl:px-10">
                    <div className="w-full max-w-none">
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
                            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                                <div className="flex bg-stone-50/50 border-b border-stone-200">
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
                                                        <div className="relative">
                                                            <input className="w-full p-3 pr-10 rounded-xl border border-stone-200 text-sm" placeholder="Tên thương hiệu..." value={manualBrandName} onChange={e => setManualBrandName(e.target.value)} />
                                                            <EditorialFieldHint title="Gợi ý" anchor="input">
                                                                <em className="text-stone-600 not-italic">Ví dụ:</em> Cà phê Highlands, Spa Thư Giãn Hà Nội, Studio Ảnh Ánh Sáng.
                                                            </EditorialFieldHint>
                                                        </div>
                                                        <div className="relative">
                                                            <textarea className="w-full p-3 pr-10 pt-3 h-32 rounded-xl border border-stone-200 text-sm" placeholder="Tầm nhìn & Giá trị (Vision & Mission)..." value={manualBrandVision} onChange={e => setManualBrandVision(e.target.value)} />
                                                            <EditorialFieldHint title="Tầm nhìn & giá trị" anchor="textarea">
                                                                Mô tả định hướng dài hạn của thương hiệu và lời hứa cốt lõi với khách hàng — điều bạn không đổi dù chiến thuật có thay đổi.
                                                            </EditorialFieldHint>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-bold uppercase text-stone-400">Đối tượng</label>
                                                        <div className="relative">
                                                            <input className="w-full p-3 pr-10 rounded-xl border border-stone-200 text-sm" placeholder="Tên khách hàng mục tiêu..." value={manualAudienceName} onChange={e => setManualAudienceName(e.target.value)} />
                                                            <EditorialFieldHint title="Persona ngắn" anchor="input">
                                                                Đặt tên gọi nhớ cho nhóm khách chính; có thể kèm tuổi, nghề, mức thu nhập hoặc bối cảnh sinh hoạt.
                                                            </EditorialFieldHint>
                                                        </div>
                                                        <div className="relative">
                                                            <textarea className="w-full p-3 pr-10 pt-3 h-32 rounded-xl border border-stone-200 text-sm" placeholder="Nỗi đau & Khao khát (Pain & Desire)..." value={manualAudiencePain} onChange={e => setManualAudiencePain(e.target.value)} />
                                                            <EditorialFieldHint title="Pain & desire" anchor="textarea">
                                                                Nỗi đau: vấn đề thực tế khiến họ bận tâm. Khao khát: kết quả hoặc cảm xúc họ muốn đạt được khi chọn thương hiệu của bạn.
                                                            </EditorialFieldHint>
                                                        </div>
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
                                                <div>
                                                    <div className="mb-2 flex items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-stone-700">Mục tiêu kinh doanh</label>
                                                        <EditorialFieldHint anchor="label" title="Mục tiêu kinh doanh">
                                                            Bạn muốn marketing giúp doanh nghiệp đạt được điều gì trong 3–6 tháng tới?{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> Tăng 30% doanh thu · Mở rộng sang thị trường Hà Nội · Tăng tỷ lệ khách quay lại.
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <textarea className="w-full p-4 h-24 rounded-xl border border-stone-200 text-sm" placeholder="VD: Tăng 20% doanh thu..." value={objective} onChange={e => setObjective(e.target.value)} />
                                                </div>
                                                <div>
                                                    <div className="mb-2 flex items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-stone-700">Kỳ vọng cụ thể</label>
                                                        <EditorialFieldHint anchor="label" popoverAlign="right" title="Kỳ vọng cụ thể">
                                                            Con số cụ thể bạn muốn đạt được — càng có số liệu thật càng tốt.{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> 500 leads/tháng · 1.000 followers mới · 50 đơn hàng/tuần · 200 lượt đăng ký.
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <textarea className="w-full p-4 h-24 rounded-xl border border-stone-200 text-sm" placeholder="VD: 1000 lead mới trong 1 tháng..." value={perception} onChange={e => setPerception(e.target.value)} />
                                                </div>
                                                <div>
                                                    <div className="mb-2 flex items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-stone-700">Nguồn lực hiện có</label>
                                                        <EditorialFieldHint anchor="label" title="Nguồn lực hiện có">
                                                            Team hiện tại gồm mấy người làm marketing? Ngân sách tháng/quý là bao nhiêu?{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> 2 người content + 1 người chạy ads · Ngân sách 30tr/tháng · Có sẵn studio chụp hình.
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <textarea className="w-full p-4 h-24 rounded-xl border border-stone-200 text-sm" placeholder="VD: Đội ngũ 3 người, ngân sách 50tr..." value={resources} onChange={e => setResources(e.target.value)} />
                                                </div>
                                                <div>
                                                    <div className="mb-2 flex items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-stone-700">Timeline thực hiện</label>
                                                        <EditorialFieldHint anchor="label" popoverAlign="right" title="Timeline">
                                                            Chiến dịch kéo dài bao lâu? Có deadline hay sự kiện cụ thể nào không?{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> 3 tháng (tháng 4–6) · Ra mắt sản phẩm mới ngày 1/5 · Cần kết quả trước mùa hè.
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <textarea className="w-full p-4 h-24 rounded-xl border border-stone-200 text-sm" placeholder="VD: Chiến dịch 3 tháng, bắt đầu từ..." value={timeline} onChange={e => setTimeline(e.target.value)} />
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-red-600">Số liệu hiện tại (Bắt buộc - Followers, Reach, Leads...)</label>
                                                        <EditorialFieldHint anchor="label" title="Baseline bắt buộc">
                                                            Điền số thật bạn đang có — AI cần điểm xuất phát để đặt mục tiêu thực tế, không phải đoán mò.{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> 3.200 followers · Reach 15.000/tháng · 20 leads/tháng · Conversion rate 2% · 8 đơn/tuần.
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <input className="w-full p-4 rounded-xl border border-red-100 bg-red-50/10 text-sm focus:border-red-400 focus:ring-red-400" placeholder="VD: 5k Followers, 10k Reach/tháng, 50 Leads... (Nếu để trống AI sẽ cảnh báo)" value={baselineMetrics} onChange={e => setBaselineMetrics(e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {step === 3 && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex items-center gap-3"><Compass className="text-stone-400" /> <h3 className="text-lg font-medium">Tactics: Thiết lập giọng điệu & Kênh</h3></div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <div className="mb-2 flex items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-stone-700">Tính cách thương hiệu (Tone)</label>
                                                        <EditorialFieldHint anchor="label" title="Tone of voice">
                                                            Nếu thương hiệu là một người, họ nói chuyện như thế nào?{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> Chuyên gia tự tin · Người bạn thân gần gũi · Người thầy truyền cảm hứng · Sang trọng và lịch thiệp.
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="VD: Truyền cảm hứng, Chuyên gia..." value={tone} onChange={e => setTone(e.target.value)} />
                                                </div>
                                                <div>
                                                    <div className="mb-2 flex items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-stone-700">Cảm xúc muốn tạo ra</label>
                                                        <EditorialFieldHint anchor="label" popoverAlign="right" title="Cảm xúc">
                                                            Khi khách hàng xem content của bạn, bạn muốn họ cảm thấy gì?{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> An tâm & tin tưởng · Hứng khởi muốn thử ngay · Tự hào khi dùng thương hiệu này · Được thấu hiểu.
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="VD: Khát khao, Tin tưởng, Tò mò..." value={emotion} onChange={e => setEmotion(e.target.value)} />
                                                </div>
                                                <div>
                                                    <div className="mb-2 flex items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-stone-700">Kênh truyền thông chính</label>
                                                        <EditorialFieldHint anchor="label" title="Kênh">
                                                            Liệt kê các kênh bạn đang dùng hoặc sẽ dùng — theo thứ tự ưu tiên.{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> Facebook (chính) · TikTok (phụ) · Email · Zalo OA · Website.
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="VD: Facebook, TikTok, YouTube..." value={channels} onChange={e => setChannels(e.target.value)} />
                                                </div>
                                                <div>
                                                    <div className="mb-2 flex items-center gap-1.5">
                                                        <label className="text-xs font-semibold text-stone-700">Đối thủ cạnh tranh</label>
                                                        <EditorialFieldHint anchor="label" popoverAlign="right" title="Đối thủ">
                                                            Ai đang cạnh tranh trực tiếp với bạn? Bạn nghĩ họ đang làm tốt điều gì?{' '}
                                                            <em className="text-stone-600 not-italic">Ví dụ:</em> Thương hiệu A (mạnh về giá) · Thương hiệu B (content đẹp) · Thương hiệu C (cộng đồng lớn).
                                                        </EditorialFieldHint>
                                                    </div>
                                                    <input className="w-full p-4 rounded-xl border border-stone-200 text-sm" placeholder="Liệt kê top 3 đối thủ..." value={competitors} onChange={e => setCompetitors(e.target.value)} />
                                                </div>
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

                <div className="flex-1 overflow-y-auto">
                    <MastermindStrategyEditorial strategy={strategyResult} />
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