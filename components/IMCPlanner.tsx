import React, { useState, useEffect } from 'react';
import {
    Lightbulb, TrendingUp, DollarSign, Calendar, Sparkles, Check, Trash2, Target,
    Users, Megaphone, Globe, Plus, History, ArrowLeft, AlertTriangle, Briefcase,
    Eye, Zap, ShoppingCart, Building2, ChevronDown, ChevronUp, Package, Film, FileText, Save,
    Wallet, Scale, Monitor, Database, Image
} from 'lucide-react';
import { IMCService, IMCInput, PlanningMode, CampaignFocus, CalculatedMetrics, AssetChecklist, BudgetDistribution } from '../services/imcService';
import { IMCPlan, IMCExecutionPhase } from '../types';

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
        loadPlans();
    }, []);

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

        // Calculate budget distribution if we have a budget
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

        // Validate based on planning mode
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
        setSaved(true); // Already saved if loading from history
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

    // Toggle expand/collapse for phase details
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

    // Format number to VND
    const formatVND = (num: number) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
        return num.toString();
    };

    // Calculate total KPIs from execution phases
    const calculateAggregation = (plan: IMCPlan) => {
        const totalBudget = plan.total_budget;
        return {
            totalBudget: (totalBudget / 1_000_000).toFixed(0) + 'M VND',
            phases: plan.imc_execution.length,
            timeline: plan.timeline_weeks + ' tuần'
        };
    };

    const cardClass =
        'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC]">
            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 lg:flex-row lg:items-start lg:justify-between md:px-8">
                        <div className="max-w-2xl">
                            <div className="mb-2 flex items-center gap-2 text-stone-400">
                                <Lightbulb size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                    Lập kế hoạch IMC
                                </span>
                            </div>
                            <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                                IMC Planner V2
                            </h1>
                            <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                                Strategic Framework: 3 lớp mục tiêu → 3 giai đoạn thực thi.
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setViewMode('history')}
                                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${viewMode === 'history'
                                    ? 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                                    : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                                    }`}
                            >
                                <History size={17} strokeWidth={1.25} /> Lịch sử ({savedPlans.length})
                            </button>
                            <button
                                type="button"
                                onClick={handleResetForm}
                                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${viewMode === 'create'
                                    ? 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                                    : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                                    }`}
                            >
                                <Plus size={17} strokeWidth={1.25} /> Tạo mới
                            </button>
                        </div>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-8 md:px-10">
                <div className="mx-auto max-w-7xl">
                    
                    {/* History View */}
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
                                                    aria-label="Xóa"
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
                        /* Detail View - Strategic Triangle */
                        <div className="space-y-8">
                            {/* Top Actions Bar */}
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
                                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${saved
                                        ? 'border border-stone-200 bg-stone-100 text-stone-800'
                                        : 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                                        }`}
                                >
                                    {saving ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Đang lưu...
                                        </>
                                    ) : saved ? (
                                        <>
                                            <Check size={17} strokeWidth={1.25} />
                                            Đã lưu
                                        </>
                                    ) : (
                                        <>
                                            <Save size={17} strokeWidth={1.25} />
                                            Lưu vào Database
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Campaign Header */}
                            <header className="mb-10 flex flex-col gap-4 border-b border-stone-200/70 pb-6 lg:mb-12 lg:flex-row lg:items-start lg:justify-between">
                                <div className="max-w-2xl">
                                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                                        <Lightbulb size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                            Kế hoạch chiến dịch
                                        </span>
                                    </div>
                                    <h2 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                                        {currentPlan.campaign_name}
                                    </h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-normal text-stone-500">
                                        <span>{currentPlan.brand}</span>
                                        <span className="text-stone-300" aria-hidden>•</span>
                                        <span>{currentPlan.product}</span>
                                        <span className="text-stone-300" aria-hidden>•</span>
                                        <span className="inline-flex items-center gap-1">
                                            <Building2 size={14} strokeWidth={1.25} /> {currentPlan.industry}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('history')}
                                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-stone-300 hover:bg-stone-50/80"
                                    >
                                        <History size={17} strokeWidth={1.25} /> Lịch sử ({savedPlans.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving || saved}
                                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all shadow-sm ${saved
                                            ? 'border border-stone-200 bg-stone-100 text-stone-800 cursor-not-allowed'
                                            : 'bg-stone-900 text-white hover:bg-stone-800'
                                            }`}
                                    >
                                        {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : (saved ? <Check size={17} /> : <Save size={17} />)}
                                        {saving ? 'Đang lưu...' : (saved ? 'Đã lưu' : 'Lưu chiến dịch')}
                                    </button>
                                </div>
                            </header>

                            {/* Validation Warnings */}
                            {currentPlan.validation_warnings && currentPlan.validation_warnings.length > 0 && (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900">
                                        <AlertTriangle size={17} strokeWidth={1.25} />
                                        Golden Thread Warnings
                                    </div>
                                    <ul className="space-y-1 text-sm font-normal text-amber-800/90">
                                        {currentPlan.validation_warnings.map((warning, i) => (
                                            <li key={i}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Strategic Foundation - 3 Cards */}
                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <Target size={20} strokeWidth={1.25} className="text-stone-400" />
                                    Strategic Foundation <span className="font-normal text-stone-400">(Kim chỉ nam)</span>
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-5">
                                        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                                            <DollarSign size={16} strokeWidth={1.25} />
                                            Business Objective
                                        </div>
                                        <p className="text-sm font-normal leading-relaxed text-stone-800">
                                            {currentPlan.strategic_foundation.business_obj}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                                            <TrendingUp size={16} strokeWidth={1.25} />
                                            Marketing Objective
                                        </div>
                                        <p className="text-sm font-normal leading-relaxed text-stone-800">
                                            {currentPlan.strategic_foundation.marketing_obj}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-5">
                                        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                                            <Megaphone size={16} strokeWidth={1.25} />
                                            Communication Objective
                                        </div>
                                        <p className="text-sm font-normal leading-relaxed text-stone-800">
                                            {currentPlan.strategic_foundation.communication_obj}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Execution Table - 3 Phases */}
                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <Zap size={20} strokeWidth={1.25} className="text-stone-400" />
                                    Execution Model <span className="font-normal text-stone-400">(3 giai đoạn)</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {currentPlan.imc_execution.map((phase, index) => (
                                        <div key={index} className={`rounded-xl border ${getPhaseBgColor(phase.phase)}`}>
                                            <div className="p-5">
                                                {/* Phase Header */}
                                                <div
                                                    className={`mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white ${getPhaseColor(phase.phase)}`}
                                                >
                                                    {getPhaseIcon(phase.phase)}
                                                    {phase.phase}
                                                </div>

                                                {/* Objective */}
                                                <p className="mb-2 text-xs font-normal text-stone-500">{phase.objective_detail}</p>

                                                {/* Key Hook */}
                                                <div className="mb-4">
                                                    <div className="mb-1 text-xs font-medium text-stone-500">Key Hook:</div>
                                                    <p className="text-sm font-medium italic text-stone-900">&ldquo;{phase.key_hook}&rdquo;</p>
                                                </div>

                                                {/* Channels */}
                                                <div className="mb-4">
                                                    <div className="mb-2 text-xs font-medium text-stone-500">Channels:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {phase.channels.map((ch, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded border border-stone-200 bg-stone-50/80 px-2 py-0.5 text-xs font-normal text-stone-700"
                                                            >
                                                                {ch}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Budget */}
                                                <div className="mb-3">
                                                    <div className="mb-1 flex justify-between text-xs">
                                                        <span className="text-stone-500">Budget</span>
                                                        <span className="font-medium text-stone-800">{phase.budget_allocation}</span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                                                        <div
                                                            className={`h-full ${getPhaseColor(phase.phase)}`}
                                                            style={{ width: phase.budget_allocation }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* KPI */}
                                                <div className="mb-3 rounded-lg border border-stone-100 bg-stone-50/50 p-2">
                                                    <div className="text-xs text-stone-500">{phase.kpis.metric}</div>
                                                    <div className="text-sm font-medium text-stone-900">{phase.kpis.target}</div>
                                                </div>

                                                {/* Expand Button */}
                                                {phase.execution_details && (
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePhaseExpand(index)}
                                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
                                                    >
                                                        {expandedPhases.has(index) ? (
                                                            <>
                                                                <ChevronUp size={14} />
                                                                Thu gọn
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown size={14} />
                                                                Xem chi tiết Tuần & Hạng mục
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Expanded Details Panel */}
                                            {phase.execution_details && expandedPhases.has(index) && (
                                                <div className="rounded-b-xl border-t border-stone-100 bg-stone-50/40 p-4">
                                                    <div className="mb-4">
                                                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-stone-800">
                                                            <Calendar size={14} strokeWidth={1.25} />
                                                            Tuần triển khai
                                                        </div>
                                                        <div className="text-sm font-medium text-stone-900">
                                                            {phase.execution_details.week_range}
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-stone-800">
                                                            <DollarSign size={14} strokeWidth={1.25} />
                                                            Phân bổ ngân sách
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="rounded-lg border border-stone-200 bg-white p-2">
                                                                <div className="text-xs text-stone-500">Production</div>
                                                                <div className="text-sm font-medium text-stone-900">
                                                                    {formatVND(phase.execution_details.budget_split.production)} VND
                                                                </div>
                                                                <div className="text-xs text-stone-400">
                                                                    {phase.execution_details.budget_split.production_percent}
                                                                </div>
                                                            </div>
                                                            <div className="rounded-lg border border-stone-200 bg-white p-2">
                                                                <div className="text-xs text-stone-500">Media</div>
                                                                <div className="text-sm font-medium text-stone-900">
                                                                    {formatVND(phase.execution_details.budget_split.media)} VND
                                                                </div>
                                                                <div className="text-xs text-stone-400">
                                                                    {phase.execution_details.budget_split.media_percent}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-stone-800">
                                                            <Package size={14} strokeWidth={1.25} />
                                                            Hạng mục cần làm
                                                        </div>
                                                        <div className="space-y-2">
                                                            {phase.execution_details.content_items.map((item, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center justify-between rounded-lg border border-stone-100 bg-white p-2 text-xs"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-800">
                                                                            {item.quantity}
                                                                        </span>
                                                                        <span className="text-stone-700">{item.type}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-stone-600">{item.estimated_cost}</span>
                                                                        {item.notes && (
                                                                            <div className="text-xs italic text-stone-400">{item.notes}</div>
                                                                        )}
                                                                    </div>
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

                            <div className="flex items-center justify-around rounded-2xl border border-stone-800 bg-stone-900 p-6 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
                                <div className="text-center">
                                    <div className="text-2xl font-normal tracking-tight">
                                        {calculateAggregation(currentPlan).totalBudget}
                                    </div>
                                    <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-400">
                                        Tổng ngân sách
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-stone-600" aria-hidden />
                                <div className="text-center">
                                    <div className="text-2xl font-normal tracking-tight">
                                        {calculateAggregation(currentPlan).phases}
                                    </div>
                                    <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-400">
                                        Giai đoạn
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-stone-600" aria-hidden />
                                <div className="text-center">
                                    <div className="text-2xl font-normal tracking-tight">
                                        {calculateAggregation(currentPlan).timeline}
                                    </div>
                                    <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-400">
                                        Thời gian
                                    </div>
                                </div>
                            </div>
                        </div>

                    ) : (
                        /* Create View - Form with Planning Modes */
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
                            <div className="space-y-8">
                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h2 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                        <Scale size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                        Chế độ lập kế hoạch
                                    </h2>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        {PLANNING_MODES.map((mode) => (
                                            <button
                                                key={mode.value}
                                                type="button"
                                                onClick={() => setPlanningMode(mode.value)}
                                                className={`rounded-2xl border p-4 text-left transition-all ${planningMode === mode.value
                                                    ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-200'
                                                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                                                    }`}
                                            >
                                                <mode.icon
                                                    size={20}
                                                    strokeWidth={1.25}
                                                    className={planningMode === mode.value ? 'text-stone-800' : 'text-stone-400'}
                                                />
                                                <div className="mt-2 text-sm font-medium text-stone-900">{mode.label}</div>
                                                <div className="mt-1 text-xs font-normal leading-relaxed text-stone-500">{mode.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h2 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                        <Briefcase size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                        Thông tin cơ bản
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-stone-800">Thương hiệu *</label>
                                                <input
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="VD: Coca-Cola"
                                                    value={brand}
                                                    onChange={(e) => setBrand(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-stone-800">Sản phẩm *</label>
                                                <input
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="VD: Nước ngọt có gas"
                                                    value={product}
                                                    onChange={(e) => setProduct(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-stone-800">Ngành hàng *</label>
                                                <select
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    value={industry}
                                                    onChange={(e) => setIndustry(e.target.value)}
                                                >
                                                    {INDUSTRIES.map((ind) => (
                                                        <option key={ind.value} value={ind.value}>
                                                            {ind.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-stone-800">Giá sản phẩm (AOV) *</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="VD: 50000"
                                                    value={productPrice}
                                                    onChange={(e) => setProductPrice(e.target.value)}
                                                />
                                                <p className="mt-1 text-xs font-normal text-stone-400">Giá trung bình mỗi đơn hàng</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-stone-800">Mục tiêu chiến dịch</label>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCampaignFocus('BRANDING')}
                                                    className={`rounded-2xl border p-3 text-left text-sm font-medium transition-all ${campaignFocus === 'BRANDING'
                                                        ? 'border-stone-900 bg-stone-50 text-stone-900 ring-1 ring-stone-200'
                                                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                                                        }`}
                                                >
                                                    Branding / Awareness
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCampaignFocus('CONVERSION')}
                                                    className={`rounded-2xl border p-3 text-left text-sm font-medium transition-all ${campaignFocus === 'CONVERSION'
                                                        ? 'border-stone-900 bg-stone-50 text-stone-900 ring-1 ring-stone-200'
                                                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                                                        }`}
                                                >
                                                    Sales / Conversion
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h2 className="mb-2 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                        <Package size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                        Asset checklist
                                    </h2>
                                    <p className="mb-6 text-xs font-normal text-stone-500">
                                        Điều chỉnh kênh dựa trên tài sản hiện có
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-100 bg-stone-50/60 p-3 transition-colors hover:bg-stone-50">
                                            <div className="flex items-center gap-3">
                                                <Monitor
                                                    size={18}
                                                    strokeWidth={1.25}
                                                    className={hasWebsite ? 'text-stone-800' : 'text-stone-400'}
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-stone-900">Website</div>
                                                    <div className="text-xs font-normal text-stone-500">Remarketing, Google Ads</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setHasWebsite(!hasWebsite)}
                                                className={`relative h-6 w-12 rounded-full transition-colors ${hasWebsite ? 'bg-stone-800' : 'bg-stone-300'}`}
                                                aria-pressed={hasWebsite}
                                            >
                                                <span
                                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${hasWebsite ? 'right-1' : 'left-1'}`}
                                                />
                                            </button>
                                        </div>

                                        <div className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-100 bg-stone-50/60 p-3 transition-colors hover:bg-stone-50">
                                            <div className="flex items-center gap-3">
                                                <Database
                                                    size={18}
                                                    strokeWidth={1.25}
                                                    className={hasCustomerList ? 'text-stone-800' : 'text-stone-400'}
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-stone-900">Customer list</div>
                                                    <div className="text-xs font-normal text-stone-500">CRM, Email, SMS, Zalo</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setHasCustomerList(!hasCustomerList)}
                                                className={`relative h-6 w-12 rounded-full transition-colors ${hasCustomerList ? 'bg-stone-800' : 'bg-stone-300'}`}
                                                aria-pressed={hasCustomerList}
                                            >
                                                <span
                                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${hasCustomerList ? 'right-1' : 'left-1'}`}
                                                />
                                            </button>
                                        </div>

                                        <div className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-100 bg-stone-50/60 p-3 transition-colors hover:bg-stone-50">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    size={18}
                                                    strokeWidth={1.25}
                                                    className={hasCreativeAssets ? 'text-stone-800' : 'text-stone-400'}
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-stone-900">Creative assets</div>
                                                    <div className="text-xs font-normal text-stone-500">Video / ảnh sẵn có</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setHasCreativeAssets(!hasCreativeAssets)}
                                                className={`relative h-6 w-12 rounded-full transition-colors ${hasCreativeAssets ? 'bg-stone-800' : 'bg-stone-300'}`}
                                                aria-pressed={hasCreativeAssets}
                                            >
                                                <span
                                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${hasCreativeAssets ? 'right-1' : 'left-1'}`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {budgetDistribution && budgetDistribution.disabled_channels.length > 0 && (
                                        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                                            <div className="mb-1 text-xs font-medium text-amber-900">Kênh bị tắt:</div>
                                            <ul className="space-y-1 text-xs font-normal text-amber-800/90">
                                                {budgetDistribution.disabled_channels.map((ch, i) => (
                                                    <li key={i}>• {ch}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h2 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                        <DollarSign size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                        {planningMode === 'BUDGET_DRIVEN'
                                            ? 'Ngân sách'
                                            : planningMode === 'GOAL_DRIVEN'
                                              ? 'Mục tiêu doanh thu'
                                              : 'Kiểm tra khả thi'}
                                    </h2>
                                    <div className="space-y-4">
                                        {(planningMode === 'BUDGET_DRIVEN' || planningMode === 'AUDIT') && (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-stone-800">Ngân sách (VNĐ) *</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="VD: 100000000"
                                                    value={budget}
                                                    onChange={(e) => setBudget(e.target.value)}
                                                />
                                                <p className="mt-1 text-xs font-normal text-stone-400">Tối thiểu 20 triệu VND</p>
                                            </div>
                                        )}

                                        {(planningMode === 'GOAL_DRIVEN' || planningMode === 'AUDIT') && (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-stone-800">Mục tiêu doanh thu (VNĐ) *</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    placeholder="VD: 500000000"
                                                    value={revenueTarget}
                                                    onChange={(e) => setRevenueTarget(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-stone-800">
                                                Thời gian: {timeline} tuần
                                            </label>
                                            <input
                                                type="range"
                                                min="4"
                                                max="24"
                                                value={timeline}
                                                onChange={(e) => setTimeline(parseInt(e.target.value, 10))}
                                                className="w-full accent-stone-800"
                                            />
                                            <div className="flex justify-between text-xs font-normal text-stone-400">
                                                <span>4 tuần</span>
                                                <span>24 tuần</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {generating ? (
                                        <>
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Đang tạo chiến lược...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={19} strokeWidth={1.25} />
                                            Generate Strategic IMC
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className={`${cardClass} h-fit p-6 md:p-8`}>
                                <h2 className="mb-6 flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <Lightbulb size={20} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                    {previewMetrics ? 'Ước tính hiệu suất' : 'Strategic Framework'}
                                </h2>

                                {previewMetrics ? (
                                    <div className="space-y-5">
                                        <div
                                            className={`rounded-2xl border p-4 ${previewMetrics.feasibility.risk_level === 'LOW'
                                                ? 'border-stone-200 bg-stone-50/80'
                                                : previewMetrics.feasibility.risk_level === 'MEDIUM'
                                                  ? 'border-amber-100 bg-amber-50/70'
                                                  : previewMetrics.feasibility.risk_level === 'HIGH'
                                                    ? 'border-orange-100 bg-orange-50/70'
                                                    : 'border-rose-100 bg-rose-50/70'
                                                }`}
                                        >
                                            <div className="text-sm font-medium text-stone-900">
                                                {previewMetrics.feasibility.warning_message}
                                            </div>
                                            {previewMetrics.feasibility.recommendation && (
                                                <p className="mt-2 text-xs font-normal text-stone-600">
                                                    {previewMetrics.feasibility.recommendation}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3 text-center">
                                                <div className="text-xs font-normal text-stone-500">Tổng ngân sách</div>
                                                <div className="text-lg font-medium text-stone-900">
                                                    {IMCService.formatVND(previewMetrics.total_budget)}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3 text-center">
                                                <div className="text-xs font-normal text-stone-500">Media spend</div>
                                                <div className="text-lg font-medium text-stone-900">
                                                    {IMCService.formatVND(previewMetrics.media_spend)}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3 text-center">
                                                <div className="text-xs font-normal text-stone-500">Est. traffic</div>
                                                <div className="text-lg font-medium text-stone-900">
                                                    {previewMetrics.estimated_traffic.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3 text-center">
                                                <div className="text-xs font-normal text-stone-500">Est. orders</div>
                                                <div className="text-lg font-medium text-stone-900">
                                                    {previewMetrics.estimated_orders.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="text-xs font-normal text-stone-500">Est. revenue</div>
                                                    <div className="text-xl font-medium text-stone-900">
                                                        {IMCService.formatVND(previewMetrics.estimated_revenue)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-normal text-stone-500">ROAS</div>
                                                    <div
                                                        className={`text-2xl font-medium ${previewMetrics.implied_roas >= 3
                                                            ? 'text-stone-900'
                                                            : previewMetrics.implied_roas >= 2
                                                              ? 'text-stone-600'
                                                              : 'text-stone-500'
                                                            }`}
                                                    >
                                                        {previewMetrics.implied_roas.toFixed(1)}x
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-3 text-xs font-normal text-stone-600">
                                            <div className="mb-1 font-medium text-stone-800">Industry benchmarks</div>
                                            <div>• CPC: 4,000 VND | CR: {campaignFocus === 'CONVERSION' ? '2%' : '1%'}</div>
                                            <div>• Target ROAS: {campaignFocus === 'CONVERSION' ? '3.0x' : '1.5x'}</div>
                                        </div>

                                        {/* Budget Distribution Breakdown */}
                                        {budgetDistribution && (
                                            <div className="mt-2 space-y-4">
                                                <div className="text-sm font-medium text-stone-800">Budget split</div>

                                                <div className="flex h-6 overflow-hidden rounded-lg">
                                                    <div
                                                        className="flex items-center justify-center bg-stone-700 text-xs font-medium text-white"
                                                        style={{ width: `${budgetDistribution.production_ratio * 100}%` }}
                                                    >
                                                        {Math.round(budgetDistribution.production_ratio * 100)}%
                                                    </div>
                                                    <div
                                                        className="flex items-center justify-center bg-stone-400 text-xs font-medium text-white"
                                                        style={{ width: `${(1 - budgetDistribution.production_ratio) * 100}%` }}
                                                    >
                                                        {Math.round((1 - budgetDistribution.production_ratio) * 100)}%
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs font-normal text-stone-500">
                                                    <span>Production: {IMCService.formatVND(budgetDistribution.production_budget)}</span>
                                                    <span>Media: {IMCService.formatVND(budgetDistribution.media_budget)}</span>
                                                </div>

                                                <div className="text-sm font-medium text-stone-800">Channel allocation</div>
                                                <div className="custom-scrollbar max-h-64 space-y-2 overflow-y-auto">
                                                    {budgetDistribution.channels.map((ch, i) => (
                                                        <div
                                                            key={i}
                                                            className={`rounded-xl border p-3 text-xs ${ch.warning ? 'border-amber-100 bg-amber-50/60' : 'border-stone-100 bg-stone-50/50'
                                                                }`}
                                                        >
                                                            <div className="mb-2 flex items-start justify-between gap-2">
                                                                <div className="font-medium text-stone-900">{ch.channel_name}</div>
                                                                <div className="text-right font-medium text-stone-900">
                                                                    {IMCService.formatVND(ch.total_allocation)}
                                                                </div>
                                                            </div>
                                                            <div className="mb-2 flex flex-wrap gap-2">
                                                                <span className="rounded border border-stone-200 bg-white px-2 py-0.5 text-stone-700">
                                                                    Media: {IMCService.formatVND(ch.media_spend)}
                                                                </span>
                                                                <span className="rounded border border-stone-200 bg-white px-2 py-0.5 text-stone-700">
                                                                    Sản xuất: {IMCService.formatVND(ch.production_cost)}
                                                                </span>
                                                            </div>
                                                            <div className="mb-1 text-stone-600">
                                                                Est. {ch.estimated_kpi.metric}:{' '}
                                                                <strong className="text-stone-900">{ch.estimated_kpi.value.toLocaleString()}</strong>
                                                                {ch.estimated_kpi.unit_cost > 0 && ` @ ${IMCService.formatVND(ch.estimated_kpi.unit_cost)}`}
                                                            </div>
                                                            <div className="italic text-stone-600">{ch.action_item}</div>
                                                            {ch.warning && (
                                                                <div className="mt-1 font-medium text-amber-900">{ch.warning}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-sm font-normal text-stone-600">
                                        <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-5">
                                            <h4 className="mb-2 font-medium text-stone-900">Nhập giá sản phẩm</h4>
                                            <p className="text-xs leading-relaxed">
                                                Điền giá sản phẩm (AOV) để xem ước tính hiệu suất theo thời gian thực.
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-5">
                                            <h4 className="mb-2 font-medium text-stone-900">Ba chế độ lập kế hoạch</h4>
                                            <ul className="mt-2 space-y-2 text-xs leading-relaxed">
                                                <li>
                                                    <span className="font-medium text-stone-900">Budget-driven:</span> Có ngân sách → ước tính doanh thu.
                                                </li>
                                                <li>
                                                    <span className="font-medium text-stone-900">Goal-driven:</span> Có mục tiêu → tính ngân sách cần.
                                                </li>
                                                <li>
                                                    <span className="font-medium text-stone-900">Audit:</span> Nhập cả hai → đánh giá khả thi.
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                                            <h4 className="mb-2 font-medium text-amber-950">Feasibility check</h4>
                                            <p className="text-xs leading-relaxed text-amber-900/90">
                                                Hệ thống sẽ cảnh báo nếu ROAS mục tiêu không khả thi (&gt;8x).
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {toast && toast.show && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <div className={`px-5 py-4 rounded-2xl shadow-lg border flex items-center gap-3 ${toast.type === 'success'
                            ? 'bg-white border-emerald-200 text-emerald-700'
                            : 'bg-white border-red-200 text-red-700'
                            }`}>
                            {toast.type === 'success' ? (
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Check size={16} className="text-emerald-600" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle size={16} className="text-red-600" />
                                </div>
                            )}
                            <span className="text-sm font-medium">{toast.message}</span>
                            <button
                                onClick={() => setToast(null)}
                                className="ml-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
};

export default IMCPlanner;
