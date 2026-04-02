import React, { useState, useEffect } from 'react';
import {Lightbulb, TrendingUp, DollarSign, Calendar, Sparkles, Check, Trash2, Target, Users, Megaphone, Globe, Plus, History, ArrowLeft, AlertTriangle, Briefcase, Eye, ShoppingCart, Building2, ChevronDown, ChevronUp, Package, Film, FileText, Save, Wallet, Scale, Monitor, Database, Image, Lock, Diamond, ChevronRight, Zap, Pencil, X} from 'lucide-react';
import { IMCService, IMCInput, PlanningMode, CampaignFocus, CalculatedMetrics, AssetChecklist, BudgetDistribution } from '../services/imcService';
import { IMCPlan, IMCExecutionPhase } from '../types';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';
import FeatureHeader from './FeatureHeader';
import { saasService } from '../services/saasService';

type ViewMode = 'create' | 'history' | 'detail';

const INDUSTRIES = [
    { value: 'FMCG', label: 'FMCG (Hàng tiêu dùng nhanh)' },
    { value: 'B2B', label: 'B2B (Doanh nghiệp)' },
    { value: 'Tech', label: 'Technology (Công nghệ)' },
    { value: 'Fashion', label: 'Fashion (Thời trang)' },
    { value: 'F&B', label: 'F&B (Ẩm thực)' },
    { value: 'Healthcare', label: 'Healthcare (Y tế/Sức khỏe)' },
    { value: 'Education', label: 'Education (Giáo dục)' },
    { value: 'Real Estate', label: 'Real Estate (Bất động sản)' },
];

const PLANNING_MODES = [
    { value: 'BUDGET_DRIVEN' as PlanningMode, label: 'Tôi có Ngân sách', icon: Wallet, desc: 'Hệ thống ước tính doanh thu khả thi' },
    { value: 'GOAL_DRIVEN' as PlanningMode, label: 'Tôi có Mục tiêu', icon: Target, desc: 'Hệ thống tính ngân sách cần thiết' },
    { value: 'AUDIT' as PlanningMode, label: 'Kiểm tra Khả thi', icon: Scale, desc: 'Nhập cả hai để đánh giá tính khả thi' },
];

const IMCPlanner: React.FC = () => {
    const [savedPlans, setSavedPlans] = useState<IMCPlan[]>([]);
    const [currentPlan, setCurrentPlan] = useState<IMCPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('create');
    const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [quota, setQuota] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');

    // Toast notification state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Form inputs - Basic
    const [brand, setBrand] = useState('');
    const [product, setProduct] = useState('');
    const [timeline, setTimeline] = useState(8);
    const [industry, setIndustry] = useState('FMCG');

    // Form inputs - Planning Mode
    const [planningMode, setPlanningMode] = useState<PlanningMode>('BUDGET_DRIVEN');
    const [campaignFocus, setCampaignFocus] = useState<CampaignFocus>('CONVERSION');
    const [budget, setBudget] = useState('');
    const [revenueTarget, setRevenueTarget] = useState('');
    const [productPrice, setProductPrice] = useState('');

    // Asset Checklist
    const [hasWebsite, setHasWebsite] = useState(true);
    const [hasCustomerList, setHasCustomerList] = useState(true);
    const [hasCreativeAssets, setHasCreativeAssets] = useState(true);

    // Preview metrics & budget distribution
    const [previewMetrics, setPreviewMetrics] = useState<CalculatedMetrics | null>(null);
    const [budgetDistribution, setBudgetDistribution] = useState<BudgetDistribution | null>(null);

    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            const q = await saasService.getUserQuota(user.uid);
            setProfile(p);
            setQuota(q);
        };

        loadPlans();
        loadUserData();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'vault' && currentBrand) {
            setBrand(currentBrand.identity.name);
            setIndustry(currentBrand.industry || 'Tech');
        }
    }, [activeTab, currentBrand]);

    // Calculate preview when inputs change
    useEffect(() => {
        calculatePreview();
    }, [planningMode, budget, revenueTarget, productPrice, campaignFocus, hasWebsite, hasCustomerList, hasCreativeAssets, industry]);

    const loadPlans = async () => {
        setLoading(true);
        const plans = await IMCService.getPlans();
        setSavedPlans(plans);
        setLoading(false);
    };

    const calculatePreview = () => {
        const priceNum = parseFloat(productPrice) || 0;
        const budgetNum = parseFloat(budget) || 0;
        const targetNum = parseFloat(revenueTarget) || 0;

        const assets: AssetChecklist = {
            has_website: hasWebsite,
            has_customer_list: hasCustomerList,
            has_creative_assets: hasCreativeAssets
        };

        if (priceNum <= 0) {
            setPreviewMetrics(null);
            setBudgetDistribution(null);
            return;
        }

        let metrics: CalculatedMetrics | null = null;
        let effectiveBudget = budgetNum;

        switch (planningMode) {
            case 'BUDGET_DRIVEN':
                if (budgetNum > 0) {
                    metrics = IMCService.calculateFromBudget(budgetNum, priceNum, campaignFocus);
                    effectiveBudget = budgetNum;
                }
                break;
            case 'GOAL_DRIVEN':
                if (targetNum > 0) {
                    metrics = IMCService.calculateFromTarget(targetNum, priceNum, campaignFocus);
                    effectiveBudget = metrics?.total_budget || 0;
                }
                break;
            case 'AUDIT':
                if (budgetNum > 0 && targetNum > 0) {
                    metrics = IMCService.auditPlan(budgetNum, targetNum, priceNum, campaignFocus);
                    effectiveBudget = budgetNum;
                }
                break;
        }

        setPreviewMetrics(metrics);

        if (effectiveBudget > 0) {
            const distribution = IMCService.calculateBudgetDistribution(
                effectiveBudget,
                campaignFocus,
                industry,
                assets
            );
            setBudgetDistribution(distribution);
        } else {
            setBudgetDistribution(null);
        }
    };

    const handleGenerate = async () => {
        if (!brand || !product || !productPrice || !industry) {
            showToast('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        const priceNum = parseFloat(productPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
            showToast('Giá sản phẩm không hợp lệ!', 'error');
            return;
        }

        const budgetNum = parseFloat(budget) || undefined;
        const targetNum = parseFloat(revenueTarget) || undefined;

        if (planningMode === 'BUDGET_DRIVEN' && !budgetNum) {
            showToast('Vui lòng nhập ngân sách!', 'error');
            return;
        }
        if (planningMode === 'GOAL_DRIVEN' && !targetNum) {
            showToast('Vui lòng nhập mục tiêu doanh thu!', 'error');
            return;
        }
        if (planningMode === 'AUDIT' && (!budgetNum || !targetNum)) {
            showToast('Vui lòng nhập cả ngân sách và mục tiêu!', 'error');
            return;
        }

        setGenerating(true);
        setSaved(false);

        const input: IMCInput = {
            brand,
            product,
            industry,
            timeline_weeks: timeline,
            planning_mode: planningMode,
            campaign_focus: campaignFocus,
            budget: budgetNum,
            revenue_target: targetNum,
            product_price: priceNum
        };

        const plan = await IMCService.generateIMCPlan(input);
        if (plan) {
            setCurrentPlan(plan);
            setViewMode('detail');
            showToast('Đã tạo kế hoạch thành công!', 'success');
        } else {
            showToast('Tạo kế hoạch thất bại. Vui lòng thử lại.', 'error');
        }
        setGenerating(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Xóa kế hoạch này?')) {
            const success = await IMCService.deletePlan(id);
            if (success) {
                await loadPlans();
                if (currentPlan?.id === id) {
                    setCurrentPlan(null);
                    setViewMode('create');
                }
            }
        }
    };

    const handleResetForm = () => {
        setBrand('');
        setProduct('');
        setBudget('');
        setRevenueTarget('');
        setProductPrice('');
        setTimeline(8);
        setIndustry('FMCG');
        setPlanningMode('BUDGET_DRIVEN');
        setCampaignFocus('CONVERSION');
        setHasWebsite(true);
        setHasCustomerList(true);
        setHasCreativeAssets(true);
        setPreviewMetrics(null);
        setBudgetDistribution(null);
        setCurrentPlan(null);
        setSaved(false);
        setViewMode('create');
    };

    const handleViewPlan = (plan: IMCPlan) => {
        setCurrentPlan(plan);
        setSaved(true);
        setViewMode('detail');
    };

    const handleSave = async () => {
        if (!currentPlan) return;

        setSaving(true);
        const success = await IMCService.savePlan(currentPlan);
        if (success) {
            setSaved(true);
            await loadPlans();
            showToast('Đã lưu kế hoạch thành công!', 'success');
        } else {
            showToast('Lưu thất bại. Vui lòng chạy SQL schema trong Supabase.', 'error');
        }
        setSaving(false);
    };

    const getPhaseIcon = (phase: string) => {
        switch (phase) {
            case 'AWARE': return <Eye size={20} />;
            case 'TRIGGER': return <Zap size={20} />;
            case 'CONVERT': return <ShoppingCart size={20} />;
            default: return <Target size={20} />;
        }
    };

    const getPhaseColor = (_phase: string) => 'bg-stone-900';
    const getPhaseBgColor = (_phase: string) => 'bg-white border-stone-200/90';

    const togglePhaseExpand = (index: number) => {
        setExpandedPhases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const formatVND = (num: number) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
        return num.toString();
    };

    const calculateAggregation = (plan: IMCPlan) => {
        const totalBudget = plan.total_budget;
        return {
            totalBudget: (totalBudget / 1_000_000).toFixed(0) + 'M VND',
            phases: plan.imc_execution.length,
            timeline: plan.timeline_weeks + ' tuần'
        };
    };

    const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC]">
            <FeatureHeader
                icon={Target}
                eyebrow="INTEGRATED MARKETING COMMUNICATIONS (IMC)"
                title="IMC Planner V2"
                subline="3 lớp mục tiêu → 3 giai đoạn thực thi."
            >
                {quota && (
                    <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-[10px] font-medium text-stone-600 mr-2">
                        <Zap size={10} className="text-amber-500 fill-amber-500" />
                        {quota.plan_limit - quota.plan_creation_count} lượt kế hoạch
                    </div>
                )}

                <div className="inline-flex gap-1 rounded-2xl border border-stone-200 bg-stone-50/30 p-1 mr-2 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'manual'
                            ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5'
                            : 'text-stone-400 hover:text-stone-600'
                            }`}
                    >
                        <Pencil size={14} /> Thủ công
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('vault')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'vault'
                            ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5'
                            : 'text-stone-400 hover:text-stone-600'
                            }`}
                    >
                        <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} />
                        Brand Vault
                    </button>
                </div>
                
                <button
                    type="button"
                    onClick={() => setViewMode('history')}
                    className={`inline-flex size-10 shrink-0 items-center justify-center rounded-2xl transition-all ${viewMode === 'history'
                        ? 'bg-stone-900 text-white shadow-md'
                        : 'border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50'
                        }`}
                    title={`Lịch sử (${savedPlans.length})`}
                    aria-label={`Mở lịch sử kế hoạch IMC, ${savedPlans.length} kế hoạch đã lưu`}
                >
                    <History size={17} strokeWidth={1.5} />
                </button>
                
                <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-95"
                >
                    <Plus size={18} strokeWidth={2.5} /> Tạo kế hoạch
                </button>
            </FeatureHeader>

            <div className="flex-1 overflow-y-auto px-5 py-8 md:px-10">
                <div className="mx-auto max-w-7xl">
                    {viewMode === 'history' ? (
                        <div className={`${cardClass} p-6 md:p-8`}>
                            <h2 className="mb-8 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                <History size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                Lịch sử chiến lược ({savedPlans.length})
                            </h2>
                            {loading ? (
                                <div className="py-16 text-center">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
                                </div>
                            ) : savedPlans.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Sparkles size={40} strokeWidth={1.25} className="mx-auto mb-4 text-stone-300" />
                                    <p className="text-base font-normal text-stone-600">Chưa có chiến lược nào</p>
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
                                    >
                                        <Plus size={17} strokeWidth={1.25} /> Tạo mới
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {savedPlans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            role="button"
                                            tabIndex={0}
                                            className="cursor-pointer rounded-2xl border border-stone-200/90 p-5 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                            onClick={() => handleViewPlan(plan)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleViewPlan(plan)}
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="line-clamp-1 font-medium text-stone-900">{plan.campaign_name}</h3>
                                                    <p className="mt-1 text-sm font-normal text-stone-500">
                                                        {plan.brand} • {plan.industry}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(plan.id);
                                                    }}
                                                    className="shrink-0 rounded-lg p-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.25} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-normal text-stone-500">
                                                <span className="flex items-center gap-1">
                                                    <DollarSign size={12} strokeWidth={1.25} />
                                                    {(plan.total_budget / 1_000_000).toFixed(0)}M
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} strokeWidth={1.25} />
                                                    {plan.timeline_weeks} tuần
                                                </span>
                                            </div>
                                            <div className="mt-3 border-t border-stone-100 pt-3 text-xs font-normal text-stone-400">
                                                {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : viewMode === 'detail' && currentPlan ? (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={handleResetForm}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
                                >
                                    <ArrowLeft size={18} strokeWidth={1.25} />
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving || saved}
                                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${saved
                                        ? 'border border-stone-200 bg-stone-100 text-stone-800'
                                        : 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                                        }`}
                                >
                                    {saving ? 'Đang lưu...' : saved ? 'Đã lưu' : 'Lưu vào Database'}
                                </button>
                            </div>
                            <header className="mb-10 flex flex-col gap-4 border-b border-stone-200/70 pb-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="max-w-2xl">
                                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                                        <Lightbulb size={20} strokeWidth={1.25} className="shrink-0" />
                                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">Kế hoạch chiến dịch</span>
                                    </div>
                                    <h2 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">{currentPlan.campaign_name}</h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-normal text-stone-500">
                                        <span>{currentPlan.brand}</span>
                                        <span className="text-stone-300">•</span>
                                        <span>{currentPlan.product}</span>
                                        <span className="text-stone-300">•</span>
                                        <span className="inline-flex items-center gap-1"><Building2 size={14} /> {currentPlan.industry}</span>
                                    </div>
                                </div>
                            </header>

                            {currentPlan.validation_warnings && currentPlan.validation_warnings.length > 0 && (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900">
                                        <AlertTriangle size={17} strokeWidth={1.25} /> Golden Thread Warnings
                                    </div>
                                    <ul className="space-y-1 text-sm font-normal text-amber-800/90">
                                        {currentPlan.validation_warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <Target size={20} className="text-stone-400" /> Strategic Foundation
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5">
                                        <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-stone-500">Business Objective</div>
                                        <p className="text-sm text-stone-800">{currentPlan.strategic_foundation.business_obj}</p>
                                    </div>
                                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                                        <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-stone-500">Marketing Objective</div>
                                        <p className="text-sm text-stone-800">{currentPlan.strategic_foundation.marketing_obj}</p>
                                    </div>
                                    <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5">
                                        <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-stone-500">Communication Objective</div>
                                        <p className="text-sm text-stone-800">{currentPlan.strategic_foundation.communication_obj}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <Zap size={20} className="text-stone-400" /> Execution Model
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {currentPlan.imc_execution.map((phase, index) => (
                                        <div key={index} className={`rounded-xl border ${getPhaseBgColor(phase.phase)} p-5`}>
                                            <div className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-stone-900">
                                                {getPhaseIcon(phase.phase)} {phase.phase}
                                            </div>
                                            <p className="mb-2 text-xs text-stone-500">{phase.objective_detail}</p>
                                            <div className="mb-4">
                                                <div className="text-xs font-medium text-stone-500 italic">Key Hook:</div>
                                                <p className="text-sm font-medium text-stone-900">&ldquo;{phase.key_hook}&rdquo;</p>
                                            </div>
                                            <div className="mb-4 flex flex-wrap gap-1">
                                                {phase.channels.map((ch, i) => <span key={i} className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-700">{ch}</span>)}
                                            </div>
                                            <div className="mb-3 rounded-lg border border-stone-100 bg-stone-50 p-2">
                                                <div className="text-xs text-stone-500">{phase.kpis.metric}</div>
                                                <div className="text-sm font-medium text-stone-900">{phase.kpis.target}</div>
                                            </div>
                                            {phase.execution_details && (
                                                <button onClick={() => togglePhaseExpand(index)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">
                                                    {expandedPhases.has(index) ? 'Thu gọn' : 'Xem chi tiết'}
                                                </button>
                                            )}
                                            {phase.execution_details && expandedPhases.has(index) && (
                                                <div className="mt-4 space-y-4 border-t border-stone-100 pt-4 animate-in slide-in-from-top-2">
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Week Range</div>
                                                        <div className="text-sm font-medium text-stone-900">{phase.execution_details.week_range}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Budget Split</div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="p-2 rounded bg-stone-50 border border-stone-100">
                                                                <div className="text-[9px] text-stone-400 uppercase">Production</div>
                                                                <div className="text-xs font-bold">{formatVND(phase.execution_details.budget_split.production)}</div>
                                                            </div>
                                                            <div className="p-2 rounded bg-stone-50 border border-stone-100">
                                                                <div className="text-[9px] text-stone-400 uppercase">Media</div>
                                                                <div className="text-xs font-bold">{formatVND(phase.execution_details.budget_split.media)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Content Items</div>
                                                        <div className="space-y-1.5">
                                                            {phase.execution_details.content_items.map((item, i) => (
                                                                <div key={i} className="flex justify-between items-center p-2 rounded bg-white border border-stone-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-5 h-5 flex items-center justify-center rounded bg-stone-100 text-[10px] font-bold">{item.quantity}</span>
                                                                        <span className="text-xs text-stone-700">{item.type}</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-stone-400">{item.estimated_cost}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-around rounded-2xl bg-stone-900 p-6 text-white shadow-xl">
                                <div className="text-center">
                                    <div className="text-2xl font-light tracking-tight">{calculateAggregation(currentPlan).totalBudget}</div>
                                    <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-400">Ngân sách</div>
                                </div>
                                <div className="h-8 w-px bg-stone-700" />
                                <div className="text-center">
                                    <div className="text-2xl font-light tracking-tight">{calculateAggregation(currentPlan).phases}</div>
                                    <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-400">Giai đoạn</div>
                                </div>
                                <div className="h-8 w-px bg-stone-700" />
                                <div className="text-center">
                                    <div className="text-2xl font-light tracking-tight">{calculateAggregation(currentPlan).timeline}</div>
                                    <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-400">Thời gian</div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="mb-12 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-10 md:p-14">
                                    <div className="mb-6 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-600"><Diamond size={32} /></div>
                                    <h2 className="mb-4 text-3xl font-medium tracking-tight text-stone-900">Tính năng Brand Vault</h2>
                                    <p className="mb-8 text-lg text-stone-500">Kế hoạch IMC sẽ chính xác hơn gấp 5 lần khi AI được học về DNA thương hiệu của bạn.</p>
                                    <ul className="mb-10 space-y-4 text-sm">
                                        {["Kết nối đa kênh dự trên giá trị cốt lõi", "Phân bổ ngân sách tối ưu theo đặc thù ngành", "Tự động viết Key Hook theo Brand Voice", "Sẵn sàng hạng mục triển khai cho Team sản xuất"].map((text, i) => (
                                            <li key={i} className="flex items-center gap-3 text-stone-700">
                                                <div className="rounded-full bg-emerald-50 p-1 text-emerald-600"><Check size={14} strokeWidth={3} /></div>
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="flex items-center gap-2 rounded-2xl bg-stone-900 px-8 py-4 font-medium text-white shadow-lg transition-transform hover:scale-105">Mở khóa quy trình Pro Max <ChevronRight size={18} /></button>
                                </div>
                                <div className="relative flex items-center justify-center bg-stone-50 p-10 overflow-hidden">
                                     <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] scale-150"><Lightbulb size={400} /></div>
                                     <div className="relative z-10 w-full max-w-sm space-y-4 p-6 blur-[2px] grayscale opacity-40">
                                         <div className="h-6 w-1/2 rounded bg-stone-300" />
                                         <div className="h-24 rounded-xl bg-white shadow-sm" />
                                         <div className="grid grid-cols-3 gap-2"><div className="h-16 rounded-lg bg-stone-200" /> <div className="h-16 rounded-lg bg-stone-200" /> <div className="h-16 rounded-lg bg-stone-200" /></div>
                                     </div>
                                     <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 p-8 shadow-2xl backdrop-blur">
                                         <Lock size={48} className="text-stone-400" />
                                     </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                                {activeTab === 'vault' && (
                                    <div className="mb-10 p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
                                        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-400">Lấy dữ liệu từ Brand Vault</h2>
                                        <BrandSelector />
                                    </div>
                                )}
                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h2 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                        <Scale size={20} strokeWidth={1.25} className="text-stone-400" /> Chế độ lập kế hoạch
                                    </h2>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        {PLANNING_MODES.map((mode) => (
                                            <button key={mode.value} type="button" onClick={() => setPlanningMode(mode.value)} className={`rounded-2xl border p-4 text-left transition-all ${planningMode === mode.value ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-200' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'}`}>
                                                <mode.icon size={20} strokeWidth={1.25} className={planningMode === mode.value ? 'text-stone-800' : 'text-stone-400'} />
                                                <div className="mt-2 text-sm font-medium text-stone-900">{mode.label}</div>
                                                <div className="mt-1 text-[10px] font-normal leading-relaxed text-stone-500">{mode.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h2 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900"><Briefcase size={20} className="text-stone-400" /> Thông tin chiến dịch</h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-xs font-bold uppercase text-stone-400 tracking-wider">Thương hiệu *</label>
                                                <input disabled={activeTab === 'vault'} className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:border-stone-400 outline-none transition-all disabled:bg-stone-50 disabled:text-stone-500" placeholder="VD: Coca-Cola" value={brand} onChange={(e) => setBrand(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-xs font-bold uppercase text-stone-400 tracking-wider">Ngành hàng *</label>
                                                <select disabled={activeTab === 'vault'} className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:border-stone-400 outline-none transition-all disabled:bg-stone-50 disabled:text-stone-500" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                                                    {INDUSTRIES.map(ind => <option key={ind.value} value={ind.value}>{ind.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-xs font-bold uppercase text-stone-400 tracking-wider">Sản phẩm chủ đạo *</label>
                                                <input className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:border-stone-400 outline-none transition-all" placeholder="VD: Nước ngọt Zero" value={product} onChange={(e) => setProduct(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-xs font-bold uppercase text-stone-400 tracking-wider">Giá bán (AOV) *</label>
                                                <input type="number" className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:border-stone-400 outline-none transition-all" placeholder="VND" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-4 pt-4 border-t border-stone-100">
                                            {planningMode !== 'GOAL_DRIVEN' && (
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-bold uppercase text-stone-400 tracking-wider text-center">Ngân sách dự kiến (VND)</label>
                                                    <input type="number" className="w-full rounded-2xl border-2 border-stone-200 bg-white p-4 text-center text-xl font-light focus:border-stone-900 outline-none transition-all" placeholder="VD: 50,000,000" value={budget} onChange={(e) => setBudget(e.target.value)} />
                                                </div>
                                            )}
                                            {planningMode !== 'BUDGET_DRIVEN' && (
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-bold uppercase text-stone-400 tracking-wider text-center">Mục tiêu doanh thu (VND)</label>
                                                    <input type="number" className="w-full rounded-2xl border-2 border-stone-200 bg-white p-4 text-center text-xl font-light focus:border-stone-900 outline-none transition-all" placeholder="VD: 500,000,000" value={revenueTarget} onChange={(e) => setRevenueTarget(e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={handleGenerate} disabled={generating} className="w-full h-14 mt-6 rounded-2xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
                                            {generating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang tính toán...</> : <><Sparkles size={20} /> Lập kế hoạch IMC</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:sticky lg:top-0 h-fit space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
                                <div className={`${cardClass} p-8 bg-stone-900 text-white border-none shadow-2xl overflow-hidden relative`}>
                                     <div className="absolute -right-20 -top-20 w-64 h-64 bg-stone-800 rounded-full opacity-50 blur-3xl" />
                                     <h3 className="text-lg font-light mb-6 relative z-10 opacity-70">Sơ đồ tổng quan chiến dịch</h3>
                                     {previewMetrics ? (
                                         <div className="space-y-8 relative z-10">
                                              <div className="grid grid-cols-2 gap-6">
                                                  <div>
                                                      <div className="text-[10px] font-bold uppercase text-stone-500 mb-1">Dự phóng doanh thu</div>
                                                      <div className="text-2xl font-light">{formatVND(previewMetrics.est_revenue)} VND</div>
                                                  </div>
                                                  <div>
                                                      <div className="text-[10px] font-bold uppercase text-stone-500 mb-1">Dự phóng ROAS</div>
                                                      <div className="text-2xl font-light">{previewMetrics.roas.toFixed(2)}x</div>
                                                  </div>
                                              </div>
                                              <div>
                                                  <div className="text-[10px] font-bold uppercase text-stone-500 mb-3">Tỷ lệ chuyển đổi phễu</div>
                                                  <div className="space-y-3">
                                                      <div className="relative h-2 bg-stone-800 rounded-full overflow-hidden">
                                                          <div className="absolute inset-0 bg-white" style={{ width: '100%', opacity: 0.1 }} />
                                                          <div className="absolute inset-0 bg-white" style={{ width: '60%', opacity: 0.2 }} />
                                                          <div className="absolute inset-0 bg-white" style={{ width: '15%', opacity: 0.4 }} />
                                                      </div>
                                                      <div className="flex justify-between text-[10px] text-stone-500 font-medium">
                                                          <div>{previewMetrics.reach.toLocaleString()} Awareness</div>
                                                          <div>{previewMetrics.leads.toLocaleString()} Leads</div>
                                                          <div>{previewMetrics.conversions.toLocaleString()} Sales</div>
                                                      </div>
                                                  </div>
                                              </div>
                                              {budgetDistribution && (
                                                  <div className="pt-6 border-t border-white/10 space-y-4">
                                                      <div className="text-[10px] font-bold uppercase text-stone-500">Phân bổ đa kênh</div>
                                                      <div className="grid gap-2">
                                                          {budgetDistribution.channels.slice(0, 4).map((ch, i) => (
                                                              <div key={i} className="flex justify-between items-center text-xs">
                                                                  <div className="flex items-center gap-2">
                                                                      <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />
                                                                      <span className="opacity-70">{ch.channel_name}</span>
                                                                  </div>
                                                                  <span className="font-mono">{formatVND(ch.total_allocation)}</span>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              )}
                                         </div>
                                     ) : (
                                         <div className="py-20 text-center relative z-10 opacity-30 select-none">
                                            <Database size={48} strokeWidth={1} className="mx-auto mb-4" />
                                            <p className="text-sm">Vui lòng nhập giá sản phẩm để xem dự báo</p>
                                         </div>
                                     )}
                                </div>
                                <div className="p-6 rounded-2xl border border-amber-100 bg-amber-50/30 text-[11px] text-amber-800 leading-relaxed font-medium">
                                    Mẹo: Gói Pro Max cho phép AI tự động tính toán Media Mix dựa trên hành vi khách hàng thật trong Brand Vault của bạn.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {toast && toast.show && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-right-4">
                    <div className={`px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 ${toast.type === 'success' ? 'bg-white border-emerald-100' : 'bg-white border-red-100'}`}>
                        {toast.type === 'success' ? <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Check size={16} strokeWidth={3} /></div> : <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600"><AlertTriangle size={16} strokeWidth={3} /></div>}
                        <span className="text-xs font-semibold text-stone-700">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 hover:opacity-50"><X size={14} /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IMCPlanner;
