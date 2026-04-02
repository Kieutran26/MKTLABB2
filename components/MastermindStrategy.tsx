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
import { ImcPlannerEditorialField } from './imc-planner-editorial-field';
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
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-900">
                                                        1
                                                    </div>
                                                    <h2 className="text-lg font-medium tracking-tight text-stone-900">1. Context: Chi tiết thương hiệu</h2>
                                                </div>
                                                <p className="text-xs font-medium text-stone-400 sm:pt-2">Yêu cầu · 2 trường</p>
                                            </div>
                                            {activeTab === 'manual' ? (
                                                <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
                                                    <ImcPlannerEditorialField
                                                        title="Tên thương hiệu"
                                                        required
                                                        hint="Tên thương hiệu hoặc sản phẩm cần lập chiến lược."
                                                        example="VD: Cà phê Highlands, Spa Thư Giãn Hà Nội, Studio Ảnh Ánh Sáng."
                                                    >
                                                        <input
                                                            className="w-full rounded-xl border border-stone-200 p-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                            placeholder="Tên thương hiệu..."
                                                            value={manualBrandName}
                                                            onChange={(e) => setManualBrandName(e.target.value)}
                                                        />
                                                    </ImcPlannerEditorialField>

                                                    <ImcPlannerEditorialField
                                                        title="Tầm nhìn & Giá trị"
                                                        required
                                                        hint="Mô tả định hướng dài hạn và lời hứa cốt lõi với khách hàng."
                                                    >
                                                        <textarea
                                                            className="h-32 w-full resize-y rounded-xl border border-stone-200 p-3 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                            placeholder="Vision & Mission..."
                                                            value={manualBrandVision}
                                                            onChange={(e) => setManualBrandVision(e.target.value)}
                                                        />
                                                    </ImcPlannerEditorialField>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
                                                    <ImcPlannerEditorialField
                                                        title="Chọn Brand"
                                                        required
                                                        hint="Chọn thương hiệu từ Brand Vault để AI lấy dữ liệu DNA."
                                                    >
                                                        <BrandSelector />
                                                    </ImcPlannerEditorialField>

                                                    <ImcPlannerEditorialField
                                                        title="Chọn Persona"
                                                        required
                                                        hint="Chọn chân dung khách hàng mục tiêu đã lưu trong Vault."
                                                    >
                                                        <div className="space-y-2">
                                                            {availablePersonas.map((p) => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => setSelectedPersona(p)}
                                                                    className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all ${selectedPersona?.id === p.id ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 hover:bg-stone-50'}`}
                                                                >
                                                                    <img src={p.avatarUrl} className="h-8 w-8 rounded-full" alt={p.fullname} />
                                                                    <span className="text-sm font-medium">{p.fullname}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </ImcPlannerEditorialField>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {step === 2 && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-900">
                                                        2
                                                    </div>
                                                    <h2 className="text-lg font-medium tracking-tight text-stone-900">Mục tiêu & Đối tượng</h2>
                                                </div>
                                                <p className="text-xs font-medium text-stone-400 sm:pt-2">Yêu cầu · 5 trường</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
                                                <ImcPlannerEditorialField
                                                    title="Mục tiêu chiến dịch"
                                                    required
                                                    hint="Chiến dịch này nhằm đạt điều gì — chọn 1 mục tiêu chính để AI tập trung"
                                                    example="Awareness · Lead Generation · Sales · Retention · Launch sản phẩm mới"
                                                >
                                                    <textarea
                                                        className="h-24 w-full resize-y rounded-xl border border-stone-200 p-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="Chọn mục tiêu chính..."
                                                        value={objective}
                                                        onChange={(e) => setObjective(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>

                                                <ImcPlannerEditorialField
                                                    title="KPI kỳ vọng"
                                                    required
                                                    hint="Con số cụ thể muốn đạt — AI dùng để tính ngược ngân sách và phân bổ kênh"
                                                    example="VD: 1,000 leads · 50 đơn hàng · 2,000,000 reach · 50,000 app installs"
                                                >
                                                    <textarea
                                                        className="h-24 w-full resize-y rounded-xl border border-stone-200 p-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: 1000 leads..."
                                                        value={perception}
                                                        onChange={(e) => setPerception(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>

                                                <ImcPlannerEditorialField
                                                    title="Timeline chiến dịch"
                                                    required
                                                    hint="Thời gian bắt đầu và kết thúc — ảnh hưởng đến cách phân bổ ngân sách theo giai đoạn"
                                                    example="VD: 3 tháng (4/2026 - 6/2026) · 6 tuần · Ra mắt ngày 1/5"
                                                >
                                                    <textarea
                                                        className="h-24 w-full resize-y rounded-xl border border-stone-200 p-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: 3 tháng (T4-T6)..."
                                                        value={timeline}
                                                        onChange={(e) => setTimeline(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>

                                                <ImcPlannerEditorialField
                                                    title="Đối tượng mục tiêu"
                                                    required
                                                    hint="Ai là người sẽ nhận thông điệp — càng cụ thể càng tốt"
                                                    example="VD: Nam 25-35 tuổi, đi làm văn phòng, thu nhập 15-25tr, dùng smartphone"
                                                >
                                                    <textarea
                                                        className="h-24 w-full resize-y rounded-xl border border-stone-200 p-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="Mô tả đối tượng mục tiêu..."
                                                        value={resources}
                                                        onChange={(e) => setResources(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>

                                                <div className="col-span-full">
                                                    <ImcPlannerEditorialField
                                                        title="Số liệu baseline hiện tại"
                                                        required
                                                        hint="Điểm xuất phát thực tế — nếu để trống AI sẽ không thể đặt target có ý nghĩa"
                                                        example="VD: 5,000 followers · Reach 20,000/tháng · 30 leads/tháng · Conversion rate 1.5% · Doanh thu hiện tại 80tr/tháng"
                                                    >
                                                        <input
                                                            className="w-full rounded-xl border border-red-100 bg-red-50/10 p-4 text-sm text-stone-900 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                                            placeholder="VD: 5k Followers, 10k Reach/tháng..."
                                                            value={baselineMetrics}
                                                            onChange={(e) => setBaselineMetrics(e.target.value)}
                                                        />
                                                    </ImcPlannerEditorialField>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {step === 3 && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-900">
                                                        3
                                                    </div>
                                                    <h2 className="text-lg font-medium tracking-tight text-stone-900">Tactics: Thiết lập giọng điệu & Kênh</h2>
                                                </div>
                                                <p className="text-xs font-medium text-stone-400 sm:pt-2">Yêu cầu · 3 trường</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
                                                <ImcPlannerEditorialField
                                                    title="Tính cách thương hiệu"
                                                    required
                                                    hint="Nếu thương hiệu là một người, họ nói chuyện như thế nào?"
                                                    example="VD: Chuyên gia tự tin · Người bạn gần gũi · Người thầy truyền cảm hứng."
                                                >
                                                    <input
                                                        className="w-full rounded-xl border border-stone-200 p-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: Truyền cảm hứng, Chuyên gia..."
                                                        value={tone}
                                                        onChange={(e) => setTone(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>

                                                <ImcPlannerEditorialField
                                                    title="Cảm xúc muốn tạo ra"
                                                    required
                                                    hint="Khi khách hàng xem content, bạn muốn họ cảm thấy gì?"
                                                    example="VD: An tâm & tin tưởng · Hứng khởi muốn thử ngay · Được thấu hiểu."
                                                >
                                                    <input
                                                        className="w-full rounded-xl border border-stone-200 p-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: Khát khao, Tin tưởng, Tò mò..."
                                                        value={emotion}
                                                        onChange={(e) => setEmotion(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>

                                                <ImcPlannerEditorialField
                                                    title="Kênh truyền thông chính"
                                                    required
                                                    hint="Liệt kê các kênh bạn đang dùng hoặc sẽ dùng — theo thứ tự ưu tiên."
                                                    example="VD: Facebook (chính) · TikTok (phụ) · Email · Zalo OA."
                                                >
                                                    <input
                                                        className="w-full rounded-xl border border-stone-200 p-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: Facebook, TikTok, YouTube..."
                                                        value={channels}
                                                        onChange={(e) => setChannels(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>

                                                <ImcPlannerEditorialField
                                                    title="Đối thủ cạnh tranh"
                                                    hint="Những bên đang phục vụ cùng nhóm khách hàng và giải quyết cùng nỗi đau."
                                                    example="VD: Phúc Long · AHA Coffee · Trung Nguyên."
                                                >
                                                    <input
                                                        className="w-full rounded-xl border border-stone-200 p-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: Đối thủ A, Đối thủ B..."
                                                        value={competitors}
                                                        onChange={(e) => setCompetitors(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
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