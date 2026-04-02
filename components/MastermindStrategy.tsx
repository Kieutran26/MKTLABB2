import React, { useState, useEffect } from 'react';
import {
    Brain, Target, Compass, ArrowRight, Loader2, Sparkles, Map, Heart, Lightbulb, Users,
    CalendarDays, History, X, Save, Check, Rocket, Diamond, Lock, ChevronRight, Edit3, Plus,
    Zap, Crown, BarChart3, Trash2
} from 'lucide-react';
import { generateMastermindStrategy } from '../services/geminiService';
import MastermindStrategyEditorial from './MastermindStrategyEditorial';
import FeatureHeader from './FeatureHeader';
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
    
    const handleDeleteStrategy = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Bạn có chắc chắn muốn xóa chiến lược này?")) return;
        
        try {
            await MastermindService.deleteMastermindStrategy(id);
            const updated = availableStrategies.filter(s => s.id !== id);
            setAvailableStrategies(updated);
            localStorage.setItem('mktlab_mastermind_history', JSON.stringify(updated));
            showToast("Đã xóa chiến lược", "success");
        } catch (error) {
            showToast("Lỗi khi xóa chiến lược", "error");
        }
    };

    const handleClearAllStrategies = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử chiến lược? Hành động này không thể hoàn tác.")) return;
        
        try {
            // Primarily clear local for speed/ux
            setAvailableStrategies([]);
            localStorage.removeItem('mktlab_mastermind_history');
            
            // Note: Service doesn't have clearAll, so we rely on local/cache management
            // Realistically for this solopreneur tool, local clear is what's expected.
            showToast("Đã xóa toàn bộ lịch sử", "success");
        } catch (error) {
            showToast("Lỗi khi xóa lịch sử", "error");
        }
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
                <FeatureHeader 
                    icon={Lightbulb}
                    eyebrow="AI-POWERED STRATEGIC FRAMEWORK"
                    title="Mastermind Strategy"
                    subline="Đối thoại cùng AI → Xây dựng chiến lược đa kênh chuyên nghiệp."
                >
                    <div className="inline-flex gap-1 rounded-2xl border border-stone-200 bg-stone-50/30 p-1 mr-2 shadow-sm">
                         <button onClick={() => setActiveTab('manual')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5' : 'text-stone-400 hover:text-stone-600'}`}>
                             <Edit3 size={14} /> Thủ công
                         </button>
                         <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5' : 'text-stone-400 hover:text-stone-600'}`}>
                             <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                         </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 text-stone-600 shadow-sm transition-colors hover:bg-stone-50"
                        title={`Lịch sử (${availableStrategies.length})`}
                        aria-label={`Lịch sử, ${availableStrategies.length} chiến lược đã lưu`}
                    >
                        <History size={18} strokeWidth={1.5} />
                    </button>

                    <button onClick={() => { setStep(1); setStrategyResult(null); setViewMode('create'); }} className="px-6 py-2.5 rounded-2xl bg-stone-950 text-white text-sm font-medium hover:bg-stone-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95">
                        <Plus size={18} strokeWidth={2.5} /> Tạo kế hoạch
                    </button>
                </FeatureHeader>

                <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-8 xl:px-10">
                    <div className="w-full max-w-none">
                        {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                            <div className="ms-vault-centered" style={{ padding: 0 }}>
                                <div className="ms-vault-card">
                                    {/* ── LEFT: Content ─────────────────────────────── */}
                                    <div className="ms-vault-content">
                                        <div className="ms-vault-upper">
                                            <div className="ms-vault-eyebrow">
                                                <Crown size={10} strokeWidth={2.5} className="ms-vault-crown-icon" />
                                                <span>Pro Max Exclusive</span>
                                            </div>
                                            <h3 className="ms-vault-title">Unlock Brand DNA<br />with AI Precision</h3>
                                            <p className="ms-vault-desc">
                                                AI kết nối Persona, Thị trường & DNA — chiến lược chuẩn đến từng pixel.
                                            </p>

                                            {/* ── Benefits Strip ─────────────────────── */}
                                            <div className="ms-vault-benefits">
                                                <div className="ms-vault-benefit-item">
                                                    <div className="ms-vault-benefit-icon"><Brain size={12} strokeWidth={2} /></div>
                                                    <span>AI Brand-Aware · Persona chính xác · Phân tích sâu</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── CTA ───────────────────────────────── */}
                                        <div className="ms-vault-footer">
                                            <button className="ms-vault-cta">
                                                <Zap size={14} strokeWidth={2.5} className="ms-vault-cta-icon" />
                                                Nâng cấp Pro Max
                                                <ChevronRight size={16} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── RIGHT: Visual ───────────────────────────── */}
                                    <div className="ms-vault-visual">
                                        <div className="ms-vault-glow" />
                                        <div className="ms-vault-dna">
                                            {[40, 70, 45, 90, 60, 80, 50, 75, 40, 65, 55, 85].map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="ms-vault-dna-bar"
                                                    style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }}
                                                />
                                            ))}
                                        </div>
                                        <div className="ms-vault-lock-wrap">
                                            <div className="ms-vault-lock-circle">
                                                <span className="ms-vault-lock-icon" aria-hidden>
                                                    <Lock size={22} strokeWidth={1.5} />
                                                </span>
                                            </div>
                                            <div className="ms-vault-lock-text">Brand Vault</div>
                                        </div>
                                        <div className="ms-vault-corner ms-vault-corner-tl" />
                                        <div className="ms-vault-corner ms-vault-corner-br" />
                                    </div>
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
                        <div className="bg-white rounded-3xl w-full max-w-lg h-[65vh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden">
                            <header className="px-6 py-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                                <div className="flex flex-col">
                                    <h3 className="font-semibold text-stone-900">Lịch sử chiến lược</h3>
                                    <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">{availableStrategies.length} kế hoạch đã lưu</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {availableStrategies.length > 0 && (
                                        <button 
                                            onClick={handleClearAllStrategies}
                                            className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-tight"
                                        >
                                            Xóa tất cả
                                        </button>
                                    )}
                                    <button onClick={() => setShowHistory(false)} className="rounded-full p-2 hover:bg-white transition-colors">
                                        <X size={20} className="text-stone-400" />
                                    </button>
                                </div>
                            </header>
                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {availableStrategies.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                                        <History size={48} strokeWidth={1} className="mb-4 opacity-20" />
                                        <div className="text-sm">Chưa có lịch sử chiến lược.</div>
                                    </div>
                                ) : (
                                    availableStrategies.map(s => (
                                        <div 
                                            key={s.id} 
                                            onClick={() => loadStrategy(s)} 
                                            className="group relative w-full text-left p-4 rounded-2xl border border-stone-100 hover:border-stone-300 bg-stone-50/50 hover:bg-white transition-all cursor-pointer"
                                        >
                                            <div className="pr-10">
                                                <div className="font-medium text-stone-900 group-hover:text-black line-clamp-1">{s.name}</div>
                                                <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-2">
                                                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                                                    <span>·</span>
                                                    <span className="uppercase">{s.brandId === 'manual' ? 'Thủ công' : 'Brand Vault'}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteStrategy(e, s.id)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-stone-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Xóa kế hoạch"
                                            >
                                                <Trash2 size={16} strokeWidth={2} />
                                            </button>
                                        </div>
                                    ))
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