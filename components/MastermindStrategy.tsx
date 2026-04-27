import React, { useState, useEffect, useRef } from 'react';
import {
    Brain, Target, Compass, ArrowRight, Loader2, Sparkles, Map as LucideMap, Heart, Lightbulb, Users,
    CalendarDays, History, X, Save, Check, Rocket, Diamond, Lock, ChevronRight, Edit3, Plus, Pencil, Trash2, Calendar, Download, RefreshCw
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { generateMastermindStrategy } from '../services/geminiService';
import MastermindStrategyOptiReport from './MastermindStrategyOptiReport';
import FeatureHeader from './FeatureHeader';
import {
    WS_PRIMARY_CTA,
    WS_SEGMENT_SHELL,
    wsHistoryToggleClass,
    wsWorkspaceTabClass,
} from './workspace-toolbar-classes';
import { MastermindService } from '../services/mastermindService';
import { StorageService } from '../services/storageService';
import { useBrand } from './BrandContext';
import { MastermindStrategy, Persona } from '../types';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';
import { ImcPlannerEditorialField } from './imc-planner-editorial-field';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';

interface MastermindStrategyProps {
    onDeployToCalendar?: (strategy: MastermindStrategy) => void;
}

const MastermindStrategyComponent: React.FC<MastermindStrategyProps> = ({ onDeployToCalendar }) => {
    const { user, tier } = useAuth();
    const { currentBrand } = useBrand();
    const reportContentRef = useRef<HTMLDivElement>(null);

    // UI State
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [viewMode, setViewMode] = useState<'create' | 'dashboard' | 'history'>('create');
    const [availableStrategies, setAvailableStrategies] = useState<MastermindStrategy[]>([]);

    const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
    const [showDeploySuccessModal, setShowDeploySuccessModal] = useState(false);

    useEffect(() => {
        // Load from DB first
        const loadHistory = async () => {
            try {
                const dbHistory = await MastermindService.getMastermindStrategies();
                
                // Fallback / Merge with LocalStorage
                const localHistoryRaw = localStorage.getItem('eng_app_mastermind_strategies');
                const localHistory: MastermindStrategy[] = localHistoryRaw ? JSON.parse(localHistoryRaw) : [];
                
                // Merge and remove duplicates by ID
                const mergedMap = new Map<string, MastermindStrategy>();
                localHistory.forEach((s: MastermindStrategy) => mergedMap.set(s.id, s));
                dbHistory.forEach((s: MastermindStrategy) => mergedMap.set(s.id, s));
                
                const finalHistory = Array.from(mergedMap.values() as IterableIterator<MastermindStrategy>).sort((a,b) => b.createdAt - a.createdAt);
                setAvailableStrategies(finalHistory);
            } catch (e) {
                // If DB fails, just show Local
                const localHistoryRaw = localStorage.getItem('eng_app_mastermind_strategies');
                const localHistory: MastermindStrategy[] = localHistoryRaw ? JSON.parse(localHistoryRaw) : [];
                setAvailableStrategies(localHistory.sort((a: MastermindStrategy, b: MastermindStrategy) => b.createdAt - a.createdAt));
            }
        };
        loadHistory();
    }, [user, viewMode]);

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
    const [isEditingStrategyName, setIsEditingStrategyName] = useState(false);
    const [draftStrategyName, setDraftStrategyName] = useState('');

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

    useEffect(() => {
        setDraftStrategyName(strategyResult?.name ?? '');
        setIsEditingStrategyName(false);
    }, [strategyResult?.id, strategyResult?.name]);

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
            const result = await generateMastermindStrategy(brandInfo, audienceInfo, goalInfo, vibeInfo, tone, tier);
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
                const localRaw = localStorage.getItem('eng_app_mastermind_strategies');
                const local: MastermindStrategy[] = localRaw ? JSON.parse(localRaw) : [];
                const updatedLocal = [newStrategy, ...local].slice(0, 50); // Keep top 50
                localStorage.setItem('eng_app_mastermind_strategies', JSON.stringify(updatedLocal));
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
    };

    const updateStrategyCache = (updatedStrategy: MastermindStrategy) => {
        setStrategyResult(updatedStrategy);
        setAvailableStrategies((prev) =>
            prev.map((strategy) => strategy.id === updatedStrategy.id ? updatedStrategy : strategy)
        );

        const localRaw = localStorage.getItem('eng_app_mastermind_strategies');
        const local: MastermindStrategy[] = localRaw ? JSON.parse(localRaw) : [];
        const nextLocal = local.some((strategy) => strategy.id === updatedStrategy.id)
            ? local.map((strategy) => strategy.id === updatedStrategy.id ? updatedStrategy : strategy)
            : [updatedStrategy, ...local];

        localStorage.setItem('eng_app_mastermind_strategies', JSON.stringify(nextLocal.slice(0, 50)));
    };

    const handleCommitStrategyName = () => {
        if (!strategyResult) return;

        const nextName = draftStrategyName.trim();
        if (!nextName) {
            setDraftStrategyName(strategyResult.name);
            setIsEditingStrategyName(false);
            showToast("Tên chiến lược không được để trống", "error");
            return;
        }

        if (nextName !== strategyResult.name) {
            updateStrategyCache({ ...strategyResult, name: nextName });
        }

        setIsEditingStrategyName(false);
    };

    const handleDeleteStrategy = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa chiến lược này?')) return;
        
        try {
            await MastermindService.deleteMastermindStrategy(id);
            
            // Update Local state
            const updated = availableStrategies.filter(s => s.id !== id);
            setAvailableStrategies(updated);
            
            // Update LocalStorage
            localStorage.setItem('eng_app_mastermind_strategies', JSON.stringify(updated));
            
            showToast("Đã xóa chiến lược", "info");
        } catch (e) {
            showToast("Lỗi khi xóa chiến lược", "error");
        }
    };

    const handleSave = async () => {
        if (!strategyResult) return;
        try {
            // Save to DB
            await MastermindService.saveMastermindStrategy(strategyResult);
            
            // Also ensure it's in LocalStorage for redundancy
            const localRaw = localStorage.getItem('eng_app_mastermind_strategies');
            const local: MastermindStrategy[] = localRaw ? JSON.parse(localRaw) : [];
            if (!local.find(s => s.id === strategyResult.id)) {
                localStorage.setItem('eng_app_mastermind_strategies', JSON.stringify([strategyResult, ...local]));
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

    const handleExportPng = async () => {
        if (!reportContentRef.current || !strategyResult) return;

        try {
            const element = reportContentRef.current;
            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#FCFDFC',
                width: element.scrollWidth,
                height: element.scrollHeight,
                style: {
                    height: 'auto',
                    overflow: 'visible',
                    transform: 'none',
                },
            });

            const link = document.createElement('a');
            link.download = `mastermind-strategy-${strategyResult.id}.png`;
            link.href = dataUrl;
            link.click();
            showToast("Đã xuất PNG thành công", "success");
        } catch (error) {
            console.error('Mastermind export PNG error:', error);
            showToast("Lỗi khi xuất PNG", "error");
        }
    };

    const buildRerenderPayload = (strategy: MastermindStrategy) => {
        const result = strategy.result;
        const smartGoal = result.strategic_goals?.smart_goals?.[0];
        const roadmapMonths = result.strategic_goals?.roadmap_90day?.months ?? [];
        const budgetSplit = result.strategic_goals?.resource_allocation?.budget_split ?? {};
        const rankedPains = (result.brand_context?.pain_gain?.ranked_pains ?? [])
            .map((item: any) => item?.content)
            .filter(Boolean)
            .slice(0, 3);
        const topGains = (result.brand_context?.pain_gain?.top_gains ?? [])
            .filter(Boolean)
            .slice(0, 3);

        return {
            brandInfo: [
                `Tên thương hiệu: ${strategy.name}.`,
                result.brand_context?.positioning?.current_state ? `Bối cảnh thương hiệu: ${result.brand_context.positioning.current_state}.` : '',
                result.coreMessage ? `Thông điệp cốt lõi hiện tại: ${result.coreMessage}.` : '',
                result.brand_context?.positioning?.differentiator ? `Điểm khác biệt: ${result.brand_context.positioning.differentiator}.` : '',
            ].filter(Boolean).join(' '),
            audienceInfo: [
                `Tên khách hàng: ${result.brand_context?.persona?.demographics || 'Khách hàng mục tiêu hiện tại'}.`,
                result.brand_context?.persona?.behaviors ? `Hành vi: ${result.brand_context.persona.behaviors}.` : '',
                result.brand_context?.persona?.psychographics ? `Tâm lý: ${result.brand_context.persona.psychographics}.` : '',
                result.brand_context?.persona?.journey ? `Hành trình: ${result.brand_context.persona.journey}.` : '',
                rankedPains.length ? `Nỗi đau: ${rankedPains.join(', ')}.` : '',
                topGains.length ? `Khao khát: ${topGains.join(', ')}.` : '',
            ].filter(Boolean).join(' '),
            goalInfo: [
                `Mục tiêu kinh doanh: ${strategy.objective || smartGoal?.goal || result.conclusion?.summary || 'Tăng trưởng bền vững'}.`,
                strategy.perception ? `Kỳ vọng cụ thể: ${strategy.perception}.` : '',
                smartGoal?.baseline ? `Số liệu hiện tại (Baseline): ${smartGoal.baseline}.` : '',
                smartGoal?.target ? `Mục tiêu 90 ngày: ${smartGoal.target}.` : '',
                roadmapMonths.length
                    ? `Lộ trình 90 ngày: ${roadmapMonths.map((month: any) => `${month.month_name}: ${(month.actions ?? []).filter(Boolean).join(', ')}`).join(' | ')}.`
                    : '',
            ].filter(Boolean).join(' '),
            vibeInfo: [
                strategy.tone ? `Tính cách thương hiệu: ${strategy.tone}.` : '',
                result.insight ? `Insight chiến lược: ${result.insight}.` : '',
                Object.keys(budgetSplit).length
                    ? `Kênh truyền thông chính: ${Object.entries(budgetSplit)
                        .map(([channel, data]: [string, any]) => `${channel} ${data?.percent || ''}`.trim())
                        .join(', ')}.`
                    : '',
                result.brand_context?.positioning?.competitive_map?.description
                    ? `Bối cảnh cạnh tranh: ${result.brand_context.positioning.competitive_map.description}.`
                    : '',
            ].filter(Boolean).join(' '),
        };
    };

    const handleRegenerateReport = async () => {
        if (!strategyResult || isRerendering) return;

        try {
            setIsRerendering(true);
            const payload = buildRerenderPayload(strategyResult);
            const rerenderedResult = await generateMastermindStrategy(
                payload.brandInfo,
                payload.audienceInfo,
                payload.goalInfo,
                payload.vibeInfo,
                strategyResult.tone || tone,
                tier
            );

            if (!rerenderedResult) {
                showToast("Không kết nối được AI server.", "error");
                return;
            }

            const updatedStrategy: MastermindStrategy = {
                ...strategyResult,
                result: rerenderedResult,
            };

            updateStrategyCache(updatedStrategy);
            showToast("Đã render lại báo cáo", "success");
        } catch (error) {
            console.error('Mastermind rerender error:', error);
            showToast("Không kết nối được AI server.", "error");
        } finally {
            setIsRerendering(false);
        }
    };

    const confirmDeploy = () => {
        if (strategyResult && onDeployToCalendar) {
            onDeployToCalendar(strategyResult);
            setShowDeploySuccessModal(false);
            showToast("Đã chuyển dữ liệu sang Calendar", "success");
        }
    };

    if (viewMode === 'create' || viewMode === 'history') {
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
                             <Pencil size={14} /> Thủ công
                         </button>
                         <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5' : 'text-stone-400 hover:text-stone-600'}`}>
                             <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                         </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setViewMode(viewMode === 'history' ? 'create' : 'history')}
                        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border transition-all ${viewMode === 'history' ? 'bg-stone-900 text-white shadow-md border-stone-900' : 'border-stone-200 text-stone-600 shadow-sm hover:bg-stone-50'}`}
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
                        {viewMode === 'history' ? (
                            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 md:p-8 shadow-sm">
                                <h2 className="mb-8 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <History size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                    Lịch sử chiến lược ({availableStrategies.length})
                                </h2>

                                {availableStrategies.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Sparkles size={40} strokeWidth={1.25} className="mx-auto mb-4 text-stone-300" />
                                        <p className="text-base font-normal text-stone-600">Chưa có chiến lược nào</p>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('create')}
                                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
                                        >
                                            <Plus size={17} strokeWidth={1.25} /> Tạo mới
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {availableStrategies.map((s) => (
                                            <div
                                                key={s.id}
                                                role="button"
                                                tabIndex={0}
                                                className="group cursor-pointer rounded-2xl border border-stone-200/90 p-5 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                                onClick={() => loadStrategy(s)}
                                            >
                                                <div className="mb-3 flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="line-clamp-1 font-medium text-stone-900 group-hover:text-stone-950 transition-colors">{s.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${s.brandId === 'manual' ? 'text-stone-400' : 'text-amber-500'}`}>
                                                                {s.brandId === 'manual' ? 'Manual Input' : 'Brand Vault'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteStrategy(s.id);
                                                        }}
                                                        className="shrink-0 rounded-lg p-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                        title="Xóa chiến lược"
                                                    >
                                                        <Trash2 size={16} strokeWidth={1.5} />
                                                    </button>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-normal text-stone-400">
                                                        <Calendar size={12} strokeWidth={1.5} />
                                                        {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                                                    </div>
                                                    <ChevronRight size={14} className="text-stone-300 transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                            <div className="ms-editorial-wrapper" style={{ padding: 0 }}>
                                <div className="ms-vault-card">
                                    <div className="ms-vault-content">
                                        <div className="ms-vault-upper">
                                            <div className="ms-vault-label">
                                                <Diamond size={11} strokeWidth={2.25} className="ms-vault-label-diamond" aria-hidden />
                                                Brand Vault Access
                                            </div>
                                            <h3 className="ms-vault-title">Strategic Mastermind Pro</h3>
                                            <p className="ms-vault-desc">
                                                AI sẽ kết nối Persona, Thị trường và DNA thương hiệu từ Vault để tạo ra chiến lược Content "Bách phát bách trúng".
                                            </p>
                                        </div>

                                        <div className="ms-vault-benefits">
                                            {[
                                                "Kết nối AI DNA: Đồng bộ Persona & DNA từ Vault",
                                                "Chiến lược đa kênh: Tối ưu nội dung toàn hệ sinh thái",
                                                "Insight thị trường: Phân tích đối thủ & xu hướng",
                                                "Quyền riêng tư: Bảo mật dữ liệu chiến lược tuyệt đối"
                                            ].map((benefit, bIdx) => (
                                                <div key={bIdx} className="ms-vault-benefit-item">
                                                    <div className="ms-vault-benefit-icon"><Check size={14} strokeWidth={3} /></div>
                                                    <span>{benefit}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button className="ms-vault-cta">
                                            Nâng cấp Pro Max <ChevronRight size={18} />
                                        </button>
                                    </div>
                                    <div className="ms-vault-visual">
                                        <div className="ms-vault-dna">
                                            {[40, 70, 45, 90, 60, 80, 50, 75, 40, 65].map((h, i) => (
                                                <div 
                                                    key={i} 
                                                    className="ms-vault-dna-bar" 
                                                    style={{ height: `${h}px`, opacity: 0.1 + (i % 3) * 0.1 }} 
                                                />
                                            ))}
                                        </div>
                                        <div className="ms-vault-lock-circle">
                                            <Lock size={32} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden flex flex-col">
                                <div className="flex bg-stone-50/50 border-b border-stone-200 h-[41px]">
                                    {[1, 2, 3].map(i => (
                                        <div 
                                            key={i} 
                                            className={`flex-1 h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${step === i ? 'text-stone-900 border-b-2 border-stone-900 bg-white' : 'text-stone-400 font-medium'}`}
                                        >
                                            Giai đoạn {i}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex-1 px-8 py-6">
                                    {step === 1 && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-900 shadow-sm">
                                                        1
                                                    </div>
                                                    <h3 className="text-[16px] font-medium tracking-tight text-stone-900">Thấu hiểu thực tế</h3>
                                                </div>
                                                {activeTab === 'manual' && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Yêu cầu · 4 trường</span>
                                                )}
                                            </div>
                                            {activeTab === 'manual' ? (
                                                <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                                                    <div className="flex flex-col gap-y-4">
                                                        <ImcPlannerEditorialField
                                                            title="Thương hiệu"
                                                            required
                                                            hint="Tên thương hiệu / sản phẩm cần lập chiến lược."
                                                            example="VD: Coca-Cola, Spa Thư Giãn, App MoMo"
                                                        >
                                                            <input
                                                                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                                placeholder="Nhập tên thương hiệu…"
                                                                value={manualBrandName}
                                                                onChange={(e) => setManualBrandName(e.target.value)}
                                                            />
                                                        </ImcPlannerEditorialField>
                                                        <ImcPlannerEditorialField
                                                            title="Tầm nhìn & Giá trị"
                                                            required
                                                            hint="Mô tả định hướng dài hạn và lời hứa cốt lõi với khách hàng."
                                                            example="VD: Mang lại sự an tâm tuyệt đối qua từng bữa ăn sạch."
                                                        >
                                                            <textarea
                                                                rows={3}
                                                                className="min-h-[4.5rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-[13px] leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                                placeholder="Vision & Mission…"
                                                                value={manualBrandVision}
                                                                onChange={(e) => setManualBrandVision(e.target.value)}
                                                            />
                                                        </ImcPlannerEditorialField>
                                                    </div>
                                                    <div className="flex flex-col gap-y-4">
                                                        <ImcPlannerEditorialField
                                                            title="Đối tượng"
                                                            required
                                                            hint="Đặt tên ngắn gọn cho nhóm khách hàng mục tiêu."
                                                            example="VD: Mẹ bỉm sữa hiện đại (25-35 tuổi)"
                                                        >
                                                            <input
                                                                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                                placeholder="Tên khách hàng mục tiêu…"
                                                                value={manualAudienceName}
                                                                onChange={(e) => setManualAudienceName(e.target.value)}
                                                            />
                                                        </ImcPlannerEditorialField>
                                                        <ImcPlannerEditorialField
                                                            title="Nỗi đau & Khao khát"
                                                            required
                                                            hint="Vấn đề họ bận tâm và kết quả họ muốn đạt được."
                                                            example="VD: Lo lắng thực phẩm bẩn nhưng không có thời gian đi chợ."
                                                        >
                                                            <textarea
                                                                rows={3}
                                                                className="min-h-[4.5rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-[13px] leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                                placeholder="Pain & Desire…"
                                                                value={manualAudiencePain}
                                                                onChange={(e) => setManualAudiencePain(e.target.value)}
                                                            />
                                                        </ImcPlannerEditorialField>
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
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-900 shadow-sm">
                                                        2
                                                    </div>
                                                    <h3 className="text-[16px] font-medium tracking-tight text-stone-900">Mục tiêu chiến lược</h3>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Quan trọng · 5 trường</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:grid-rows-3 md:gap-x-8">
                                                <ImcPlannerEditorialField
                                                    title="Mục tiêu kinh doanh"
                                                    required
                                                    hint="Mục tiêu cốt lõi bạn muốn đạt được trong 3-6 tháng tới."
                                                    example="VD: Tăng 30% doanh thu · Tăng tỷ lệ khách quay lại."
                                                >
                                                    <textarea
                                                        rows={3}
                                                        className="min-h-[4rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="Mục tiêu kinh doanh…"
                                                        value={objective}
                                                        onChange={(e) => setObjective(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
                                                <ImcPlannerEditorialField
                                                    title="Kỳ vọng cụ thể"
                                                    required
                                                    hint="Con số cụ thể muốn đạt được — càng thực tế càng tốt."
                                                    example="VD: 500 leads/tháng · 50 đơn hàng/tuần."
                                                >
                                                    <textarea
                                                        rows={3}
                                                        className="min-h-[4rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: 1000 lead mới trong 1 tháng…"
                                                        value={perception}
                                                        onChange={(e) => setPerception(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
                                                <ImcPlannerEditorialField
                                                    title="Nguồn lực hiện có"
                                                    required
                                                    hint="Team hiện tại và ngân sách dự kiến."
                                                    example="VD: 2 người content + 1 chạy ads · Ngân sách 30tr/tháng."
                                                >
                                                    <textarea
                                                        rows={3}
                                                        className="min-h-[4rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="Nguồn lực và ngân sách…"
                                                        value={resources}
                                                        onChange={(e) => setResources(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
                                                <ImcPlannerEditorialField
                                                    title="Timeline thực hiện"
                                                    required
                                                    hint="Thời gian triển khai hoặc sự kiện/deadline cụ thể."
                                                    example="VD: 3 tháng (tháng 4-6) · Ra mắt ngày 1/5."
                                                >
                                                    <textarea
                                                        rows={3}
                                                        className="min-h-[4rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: Chiến dịch 3 tháng, bắt đầu từ…"
                                                        value={timeline}
                                                        onChange={(e) => setTimeline(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
                                                <div className="col-span-1 md:col-span-2">
                                                    <ImcPlannerEditorialField
                                                        title="Số liệu hiện tại (Baseline)"
                                                        required
                                                        hint="Điểm xuất phát thực tế (Followers, Reach, Leads...) để AI đặt target khả thi."
                                                        example="VD: 3.200 followers · Reach 15.000/tháng · 20 leads/tháng."
                                                    >
                                                        <input
                                                            className="w-full rounded-xl border border-rose-100 bg-rose-50/20 px-3 py-2 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-rose-300"
                                                            placeholder="VD: 5k Followers, 10k Reach/tháng, 50 Leads... (Bắt buộc)"
                                                            value={baselineMetrics}
                                                            onChange={(e) => setBaselineMetrics(e.target.value)}
                                                        />
                                                    </ImcPlannerEditorialField>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {step === 3 && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-900 shadow-sm">
                                                        3
                                                    </div>
                                                    <h3 className="text-[16px] font-medium tracking-tight text-stone-900">Giọng điệu & Kênh</h3>
                                                </div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Hoàn thiện · 4 trường</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-8">
                                                <ImcPlannerEditorialField
                                                    title="Tính cách thương hiệu"
                                                    required
                                                    hint="Nếu thương hiệu là một người, họ sẽ nói chuyện như thế nào?"
                                                    example="VD: Người bạn thân gần gũi · Chuyên gia tự tin · Người thầy truyền cảm hứng."
                                                >
                                                    <textarea
                                                        rows={3}
                                                        className="min-h-[4rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] leading-snug text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: Chuyên nghiệp, đáng tin…"
                                                        value={tone}
                                                        onChange={(e) => setTone(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
                                                <ImcPlannerEditorialField
                                                    title="Cảm xúc muốn tạo ra"
                                                    required
                                                    hint="Khi xem content, bạn muốn khách hàng cảm thấy gì?"
                                                    example="VD: An tâm & tin tưởng · Hứng khởi muốn thử ngay · Được thấu hiểu."
                                                >
                                                    <input
                                                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: Tin tưởng, Khát khao…"
                                                        value={emotion}
                                                        onChange={(e) => setEmotion(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
                                                <ImcPlannerEditorialField
                                                    title="Kênh truyền thông chính"
                                                    required
                                                    hint="Liệt kê các kênh sẽ sử dụng theo thứ tự ưu tiên."
                                                    example="VD: Facebook Ads (chính) · TikTok Organic · Email Marketing."
                                                >
                                                    <input
                                                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="VD: Facebook, TikTok, Website…"
                                                        value={channels}
                                                        onChange={(e) => setChannels(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
                                                <ImcPlannerEditorialField
                                                    title="Đối thủ cạnh tranh"
                                                    required
                                                    hint="Top đối thủ trực tiếp và điểm họ đang làm tốt."
                                                    example="VD: Brand A (mạnh giá) · Brand B (content đẹp) · Brand C (ads mạnh)."
                                                >
                                                    <input
                                                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400"
                                                        placeholder="Liệt kê đối thủ chính…"
                                                        value={competitors}
                                                        onChange={(e) => setCompetitors(e.target.value)}
                                                    />
                                                </ImcPlannerEditorialField>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-8 py-4 border-t border-stone-100 bg-stone-50/20 flex justify-between items-center shrink-0">
                                    {step > 1 ? (
                                        <button 
                                            onClick={() => setStep(step-1)} 
                                            className="rounded-full border border-stone-200 bg-white px-8 h-10 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 shadow-sm flex items-center"
                                        >
                                            Quay lại
                                        </button>
                                    ) : <div />}
                                    <button 
                                        onClick={step < 3 ? () => setStep(step+1) : handleGenerate} 
                                        className="px-10 h-10 bg-stone-950 text-white rounded-full font-medium hover:bg-stone-800 transition-all flex items-center gap-2 shadow-lg shadow-stone-200/50"
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : (step < 3 ? 'Kế tiếp' : 'Xây dựng chiến lược')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        );
    }

    if (viewMode === 'dashboard' && strategyResult) {
        const formattedDate = new Date(strategyResult.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        return (
            <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC]">
                <div className="flex-1 overflow-y-auto">
                    <FeatureHeader
                        icon={Brain}
                        eyebrow="STRATEGIC MASTERMIND"
                        title="Mastermind Strategy"
                        subline="Xây dựng strategic vision, persona direction và kế hoạch 90 ngày bằng AI."
                    >
                        <div className="flex shrink-0 items-center justify-end gap-2">
                            <div className={WS_SEGMENT_SHELL}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab('manual');
                                        setViewMode('create');
                                    }}
                                    className={wsWorkspaceTabClass(activeTab === 'manual')}
                                >
                                    <Pencil size={14} /> Thủ công
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab('vault');
                                        setViewMode('create');
                                    }}
                                    className={wsWorkspaceTabClass(activeTab === 'vault')}
                                >
                                    <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setViewMode('history')}
                                className={wsHistoryToggleClass(viewMode === 'history')}
                                aria-label="Open history"
                            >
                                <History size={17} strokeWidth={1.5} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('create')}
                                className={WS_PRIMARY_CTA}
                            >
                                <Plus size={18} strokeWidth={2.5} /> Tạo mới
                            </button>
                        </div>
                    </FeatureHeader>

                    <div className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#FCFDFC]/95 backdrop-blur">
                        <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-3 px-6 py-2.5">
                            <div className="flex min-w-0 flex-wrap items-center gap-3">
                                <div className="flex min-w-0 items-center gap-2 text-[16px] font-bold tracking-tight text-stone-900">
                                    {isEditingStrategyName ? (
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="text"
                                                value={draftStrategyName}
                                                onChange={(e) => setDraftStrategyName(e.target.value)}
                                                onBlur={handleCommitStrategyName}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleCommitStrategyName();
                                                    }
                                                    if (e.key === 'Escape') {
                                                        setDraftStrategyName(strategyResult.name);
                                                        setIsEditingStrategyName(false);
                                                    }
                                                }}
                                                className="h-8 min-w-[220px] max-w-[420px] rounded-lg border border-stone-200 bg-white px-3 text-[15px] font-semibold text-stone-900 outline-none transition-colors focus:border-stone-400"
                                                aria-label="Edit strategy name"
                                            />
                                            <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={handleCommitStrategyName}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-black/[0.05] hover:text-stone-900"
                                                aria-label="Confirm strategy name"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="truncate">{strategyResult.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingStrategyName(true)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-black/[0.05] hover:text-stone-900"
                                                aria-label="Edit strategy name"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="text-[14px] text-stone-400">· {formattedDate}</div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-stone-600 transition-colors hover:bg-black/[0.05]"
                                >
                                    <Save size={13} className="opacity-70" />
                                    Lưu
                                </button>

                                <div className="h-4 w-px bg-stone-200" />

                                <button
                                    type="button"
                                    onClick={() => void handleExportPng()}
                                    className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-stone-600 transition-colors hover:bg-black/[0.05]"
                                >
                                    <Download size={13} className="opacity-70" />
                                    Xuất PNG
                                </button>

                                <div className="h-4 w-px bg-stone-200" />

                                <button
                                    type="button"
                                    onClick={handleRegenerateReport}
                                    disabled={isRerendering}
                                    className="inline-flex h-7 min-w-[148px] items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-stone-800 disabled:opacity-70"
                                >
                                    {isRerendering ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
                                    {isRerendering ? 'Đang render...' : 'Render lại'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div ref={reportContentRef} className="px-6 pt-5">
                        <MastermindStrategyOptiReport strategy={strategyResult} subscriptionTier={tier} />
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
