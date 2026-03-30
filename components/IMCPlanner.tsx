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

    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case 'AWARE': return 'from-blue-500 to-cyan-500';
            case 'TRIGGER': return 'from-orange-500 to-amber-500';
            case 'CONVERT': return 'from-green-500 to-emerald-500';
            default: return 'from-slate-500 to-slate-600';
        }
    };

    const getPhaseBgColor = (phase: string) => {
        switch (phase) {
            case 'AWARE': return 'bg-blue-50 border-blue-200';
            case 'TRIGGER': return 'bg-orange-50 border-orange-200';
            case 'CONVERT': return 'bg-green-50 border-green-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

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

    return (
        <>
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                                <Lightbulb className="text-indigo-600" />
                                IMC Planner V2
                            </h1>
                            <p className="text-slate-500 mt-2">
                                Strategic Framework: 3 Lớp Mục tiêu → 3 Giai đoạn Thực thi
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleResetForm}
                                className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${viewMode === 'create'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                                    }`}
                            >
                                <Plus size={18} />
                                Tạo mới
                            </button>
                            <button
                                onClick={() => setViewMode('history')}
                                className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${viewMode === 'history'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                                    }`}
                            >
                                <History size={18} />
                                Lịch sử ({savedPlans.length})
                            </button>
                        </div>
                    </div>

                    {/* History View */}
                    {viewMode === 'history' ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <History size={24} className="text-indigo-600" />
                                Lịch sử chiến lược ({savedPlans.length})
                            </h2>

                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : savedPlans.length === 0 ? (
                                <div className="text-center py-12">
                                    <Sparkles size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-lg font-medium text-slate-600">Chưa có chiến lược nào</p>
                                    <button onClick={handleResetForm} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl">
                                        <Plus size={18} className="inline mr-2" /> Tạo mới
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {savedPlans.map(plan => (
                                        <div
                                            key={plan.id}
                                            className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all"
                                            onClick={() => handleViewPlan(plan)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-800 line-clamp-1">{plan.campaign_name}</h3>
                                                    <p className="text-sm text-slate-500 mt-1">{plan.brand} • {plan.industry}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <DollarSign size={12} />
                                                    {(plan.total_budget / 1_000_000).toFixed(0)}M
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {plan.timeline_weeks} tuần
                                                </span>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                                                {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    ) : viewMode === 'detail' && currentPlan ? (
                        /* Detail View - Strategic Triangle */
                        <div className="space-y-6">
                            {/* Top Actions Bar */}
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={handleResetForm}
                                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                    Quay lại
                                </button>

                                <button
                                    onClick={handleSave}
                                    disabled={saving || saved}
                                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${saved
                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            Đang lưu...
                                        </>
                                    ) : saved ? (
                                        <>
                                            <Check size={18} />
                                            Đã lưu
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Lưu vào Database
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Campaign Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6">
                                <h2 className="text-3xl font-bold mb-2">{currentPlan.campaign_name}</h2>
                                <div className="flex items-center gap-4 text-white/80">
                                    <span>{currentPlan.brand}</span>
                                    <span>•</span>
                                    <span>{currentPlan.product}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Building2 size={14} /> {currentPlan.industry}</span>
                                </div>
                            </div>

                            {/* Validation Warnings */}
                            {currentPlan.validation_warnings && currentPlan.validation_warnings.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                                        <AlertTriangle size={18} />
                                        Golden Thread Warnings
                                    </div>
                                    <ul className="space-y-1 text-sm text-amber-600">
                                        {currentPlan.validation_warnings.map((warning, i) => (
                                            <li key={i}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Strategic Foundation - 3 Cards */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Target size={20} className="text-indigo-600" />
                                    Strategic Foundation (Kim chỉ nam)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Business Objective */}
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                        <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                                            <DollarSign size={18} />
                                            Business Objective
                                        </div>
                                        <p className="text-sm text-emerald-800">{currentPlan.strategic_foundation.business_obj}</p>
                                    </div>
                                    {/* Marketing Objective */}
                                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                                            <TrendingUp size={18} />
                                            Marketing Objective
                                        </div>
                                        <p className="text-sm text-blue-800">{currentPlan.strategic_foundation.marketing_obj}</p>
                                    </div>
                                    {/* Communication Objective */}
                                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                                        <div className="flex items-center gap-2 text-purple-700 font-bold mb-2">
                                            <Megaphone size={18} />
                                            Communication Objective
                                        </div>
                                        <p className="text-sm text-purple-800">{currentPlan.strategic_foundation.communication_obj}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Execution Table - 3 Phases */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Zap size={20} className="text-indigo-600" />
                                    Execution Model (3 Giai đoạn)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {currentPlan.imc_execution.map((phase, index) => (
                                        <div key={index} className={`rounded-xl border ${getPhaseBgColor(phase.phase)}`}>
                                            <div className="p-5">
                                                {/* Phase Header */}
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getPhaseColor(phase.phase)} text-white font-bold text-sm mb-4`}>
                                                    {getPhaseIcon(phase.phase)}
                                                    {phase.phase}
                                                </div>

                                                {/* Objective */}
                                                <p className="text-xs text-slate-500 mb-2">{phase.objective_detail}</p>

                                                {/* Key Hook */}
                                                <div className="mb-4">
                                                    <div className="text-xs font-medium text-slate-500 mb-1">Key Hook:</div>
                                                    <p className="text-sm font-bold text-slate-800 italic">"{phase.key_hook}"</p>
                                                </div>

                                                {/* Channels */}
                                                <div className="mb-4">
                                                    <div className="text-xs font-medium text-slate-500 mb-2">Channels:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {phase.channels.map((ch, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-slate-700 border">
                                                                {ch}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Budget */}
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-500">Budget</span>
                                                        <span className="font-bold text-slate-700">{phase.budget_allocation}</span>
                                                    </div>
                                                    <div className="h-2 bg-white rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${getPhaseColor(phase.phase)}`}
                                                            style={{ width: phase.budget_allocation }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* KPI */}
                                                <div className="p-2 bg-white rounded-lg border mb-3">
                                                    <div className="text-xs text-slate-500">{phase.kpis.metric}</div>
                                                    <div className="text-sm font-bold text-slate-800">{phase.kpis.target}</div>
                                                </div>

                                                {/* Expand Button */}
                                                {phase.execution_details && (
                                                    <button
                                                        onClick={() => togglePhaseExpand(index)}
                                                        className="w-full py-2 px-3 bg-white rounded-lg border text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
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
                                                <div className="border-t border-slate-200 bg-white/80 p-4 rounded-b-xl">
                                                    {/* Timeline */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                            <Calendar size={14} />
                                                            Tuần triển khai
                                                        </div>
                                                        <div className="text-sm font-medium text-indigo-600">
                                                            {phase.execution_details.week_range}
                                                        </div>
                                                    </div>

                                                    {/* Budget Split */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                            <DollarSign size={14} />
                                                            Phân bổ ngân sách
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                                                                <div className="text-xs text-amber-600">Production</div>
                                                                <div className="text-sm font-bold text-amber-700">
                                                                    {formatVND(phase.execution_details.budget_split.production)} VND
                                                                </div>
                                                                <div className="text-xs text-amber-500">
                                                                    {phase.execution_details.budget_split.production_percent}
                                                                </div>
                                                            </div>
                                                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                                                                <div className="text-xs text-blue-600">Media</div>
                                                                <div className="text-sm font-bold text-blue-700">
                                                                    {formatVND(phase.execution_details.budget_split.media)} VND
                                                                </div>
                                                                <div className="text-xs text-blue-500">
                                                                    {phase.execution_details.budget_split.media_percent}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content Items */}
                                                    <div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                            <Package size={14} />
                                                            Hạng mục cần làm
                                                        </div>
                                                        <div className="space-y-2">
                                                            {phase.execution_details.content_items.map((item, i) => (
                                                                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                                            {item.quantity}
                                                                        </span>
                                                                        <span className="text-slate-700">{item.type}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-slate-600">{item.estimated_cost}</span>
                                                                        {item.notes && (
                                                                            <div className="text-xs text-slate-400 italic">{item.notes}</div>
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

                            {/* Aggregation Bar */}
                            <div className="bg-slate-800 text-white rounded-xl p-4 flex justify-around items-center">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{calculateAggregation(currentPlan).totalBudget}</div>
                                    <div className="text-xs text-slate-400">Tổng ngân sách</div>
                                </div>
                                <div className="h-8 w-px bg-slate-600"></div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{calculateAggregation(currentPlan).phases}</div>
                                    <div className="text-xs text-slate-400">Giai đoạn</div>
                                </div>
                                <div className="h-8 w-px bg-slate-600"></div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{calculateAggregation(currentPlan).timeline}</div>
                                    <div className="text-xs text-slate-400">Thời gian</div>
                                </div>
                            </div>
                        </div>

                    ) : (
                        /* Create View - Form with Planning Modes */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Input Form */}
                            <div className="space-y-6">
                                {/* Planning Mode Toggle */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Scale size={20} className="text-indigo-600" />
                                        Chế độ Lập kế hoạch
                                    </h2>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PLANNING_MODES.map(mode => (
                                            <button
                                                key={mode.value}
                                                onClick={() => setPlanningMode(mode.value)}
                                                className={`p-3 rounded-xl border-2 transition-all text-left ${planningMode === mode.value
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <mode.icon size={20} className={planningMode === mode.value ? 'text-indigo-600' : 'text-slate-400'} />
                                                <div className="font-medium text-sm mt-2">{mode.label}</div>
                                                <div className="text-xs text-slate-500 mt-1">{mode.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Briefcase size={20} className="text-indigo-600" />
                                        Thông tin cơ bản
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Thương hiệu *</label>
                                                <input
                                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                                    placeholder="VD: Coca-Cola"
                                                    value={brand}
                                                    onChange={e => setBrand(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Sản phẩm *</label>
                                                <input
                                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                                    placeholder="VD: Nước ngọt có gas"
                                                    value={product}
                                                    onChange={e => setProduct(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Ngành hàng *</label>
                                                <select
                                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                                    value={industry}
                                                    onChange={e => setIndustry(e.target.value)}
                                                >
                                                    {INDUSTRIES.map(ind => (
                                                        <option key={ind.value} value={ind.value}>{ind.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Giá sản phẩm (AOV) *</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                                    placeholder="VD: 50000"
                                                    value={productPrice}
                                                    onChange={e => setProductPrice(e.target.value)}
                                                />
                                                <p className="text-xs text-slate-400 mt-1">Giá trung bình mỗi đơn hàng</p>
                                            </div>
                                        </div>

                                        {/* Campaign Focus Toggle */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Mục tiêu chiến dịch</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setCampaignFocus('BRANDING')}
                                                    className={`p-3 rounded-xl border-2 text-sm font-medium ${campaignFocus === 'BRANDING'
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-slate-200 text-slate-600'
                                                        }`}
                                                >
                                                    🎨 Branding / Awareness
                                                </button>
                                                <button
                                                    onClick={() => setCampaignFocus('CONVERSION')}
                                                    className={`p-3 rounded-xl border-2 text-sm font-medium ${campaignFocus === 'CONVERSION'
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-slate-200 text-slate-600'
                                                        }`}
                                                >
                                                    💰 Sales / Conversion
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Asset Checklist */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Package size={20} className="text-indigo-600" />
                                        Asset Checklist
                                    </h2>
                                    <p className="text-xs text-slate-500 mb-4">Điều chỉnh channels dựa trên tài sản hiện có</p>

                                    <div className="space-y-3">
                                        {/* Website Toggle */}
                                        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Monitor size={18} className={hasWebsite ? 'text-green-600' : 'text-slate-400'} />
                                                <div>
                                                    <div className="text-sm font-medium">Website</div>
                                                    <div className="text-xs text-slate-500">Bật Remarketing, Google Ads</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setHasWebsite(!hasWebsite)}
                                                className={`w-12 h-6 rounded-full transition-colors ${hasWebsite ? 'bg-green-500' : 'bg-slate-300'} relative`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasWebsite ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </label>

                                        {/* Customer List Toggle */}
                                        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Database size={18} className={hasCustomerList ? 'text-green-600' : 'text-slate-400'} />
                                                <div>
                                                    <div className="text-sm font-medium">Customer List</div>
                                                    <div className="text-xs text-slate-500">Bật CRM, Email, SMS, Zalo</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setHasCustomerList(!hasCustomerList)}
                                                className={`w-12 h-6 rounded-full transition-colors ${hasCustomerList ? 'bg-green-500' : 'bg-slate-300'} relative`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasCustomerList ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </label>

                                        {/* Creative Assets Toggle */}
                                        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Image size={18} className={hasCreativeAssets ? 'text-green-600' : 'text-slate-400'} />
                                                <div>
                                                    <div className="text-sm font-medium">Creative Assets</div>
                                                    <div className="text-xs text-slate-500">Có Video/Ảnh sẵn</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setHasCreativeAssets(!hasCreativeAssets)}
                                                className={`w-12 h-6 rounded-full transition-colors ${hasCreativeAssets ? 'bg-green-500' : 'bg-slate-300'} relative`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasCreativeAssets ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </label>
                                    </div>

                                    {/* Disabled channels warning */}
                                    {budgetDistribution && budgetDistribution.disabled_channels.length > 0 && (
                                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="text-xs font-medium text-amber-800 mb-1">Channels bị tắt:</div>
                                            <ul className="text-xs text-amber-700 space-y-1">
                                                {budgetDistribution.disabled_channels.map((ch, i) => (
                                                    <li key={i}>• {ch}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Financial Inputs - Dynamic based on Planning Mode */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <DollarSign size={20} className="text-indigo-600" />
                                        {planningMode === 'BUDGET_DRIVEN' ? 'Ngân sách' :
                                            planningMode === 'GOAL_DRIVEN' ? 'Mục tiêu Doanh thu' : 'Kiểm tra Khả thi'}
                                    </h2>
                                    <div className="space-y-4">
                                        {/* Budget Input - for BUDGET_DRIVEN and AUDIT */}
                                        {(planningMode === 'BUDGET_DRIVEN' || planningMode === 'AUDIT') && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    💰 Ngân sách (VNĐ) *
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                                    placeholder="VD: 100000000"
                                                    value={budget}
                                                    onChange={e => setBudget(e.target.value)}
                                                />
                                                <p className="text-xs text-slate-400 mt-1">Tối thiểu 20 triệu VND</p>
                                            </div>
                                        )}

                                        {/* Revenue Target - for GOAL_DRIVEN and AUDIT */}
                                        {(planningMode === 'GOAL_DRIVEN' || planningMode === 'AUDIT') && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    🎯 Mục tiêu Doanh thu (VNĐ) *
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                                    placeholder="VD: 500000000"
                                                    value={revenueTarget}
                                                    onChange={e => setRevenueTarget(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {/* Timeline */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                📅 Thời gian: {timeline} tuần
                                            </label>
                                            <input
                                                type="range"
                                                min="4"
                                                max="24"
                                                value={timeline}
                                                onChange={e => setTimeline(parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>4 tuần</span>
                                                <span>24 tuần</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {generating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Đang tạo chiến lược...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={20} />
                                            Generate Strategic IMC
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Right: Preview/Instructions */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Lightbulb size={20} className="text-amber-500" />
                                    {previewMetrics ? 'Ước tính Hiệu suất' : 'Strategic Framework'}
                                </h2>

                                {previewMetrics ? (
                                    /* Live Preview Metrics */
                                    <div className="space-y-4">
                                        {/* Feasibility Status */}
                                        <div className={`p-4 rounded-xl border ${previewMetrics.feasibility.risk_level === 'LOW' ? 'bg-green-50 border-green-200' :
                                            previewMetrics.feasibility.risk_level === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
                                                previewMetrics.feasibility.risk_level === 'HIGH' ? 'bg-orange-50 border-orange-200' :
                                                    'bg-red-50 border-red-200'
                                            }`}>
                                            <div className="text-sm font-medium">{previewMetrics.feasibility.warning_message}</div>
                                            {previewMetrics.feasibility.recommendation && (
                                                <p className="text-xs mt-2 text-slate-600">{previewMetrics.feasibility.recommendation}</p>
                                            )}
                                        </div>

                                        {/* Key Metrics Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-slate-50 rounded-xl text-center">
                                                <div className="text-xs text-slate-500">Tổng ngân sách</div>
                                                <div className="text-lg font-bold text-slate-800">
                                                    {IMCService.formatVND(previewMetrics.total_budget)}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl text-center">
                                                <div className="text-xs text-slate-500">Media Spend</div>
                                                <div className="text-lg font-bold text-blue-600">
                                                    {IMCService.formatVND(previewMetrics.media_spend)}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl text-center">
                                                <div className="text-xs text-slate-500">Est. Traffic</div>
                                                <div className="text-lg font-bold text-indigo-600">
                                                    {previewMetrics.estimated_traffic.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl text-center">
                                                <div className="text-xs text-slate-500">Est. Orders</div>
                                                <div className="text-lg font-bold text-purple-600">
                                                    {previewMetrics.estimated_orders.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Revenue & ROAS */}
                                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-xs text-indigo-600">Est. Revenue</div>
                                                    <div className="text-xl font-bold text-indigo-700">
                                                        {IMCService.formatVND(previewMetrics.estimated_revenue)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-indigo-600">ROAS</div>
                                                    <div className={`text-2xl font-bold ${previewMetrics.implied_roas >= 3 ? 'text-green-600' :
                                                        previewMetrics.implied_roas >= 2 ? 'text-amber-600' :
                                                            'text-red-600'
                                                        }`}>
                                                        {previewMetrics.implied_roas.toFixed(1)}x
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Benchmarks */}
                                        <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-500">
                                            <div className="font-medium text-slate-700 mb-1">Industry Benchmarks:</div>
                                            <div>• CPC: 4,000 VND | CR: {campaignFocus === 'CONVERSION' ? '2%' : '1%'}</div>
                                            <div>• Target ROAS: {campaignFocus === 'CONVERSION' ? '3.0x' : '1.5x'}</div>
                                        </div>

                                        {/* Budget Distribution Breakdown */}
                                        {budgetDistribution && (
                                            <div className="mt-4 space-y-3">
                                                <div className="text-sm font-bold text-slate-700">💰 Budget Split</div>

                                                {/* Stacked Bar */}
                                                <div className="h-6 rounded-lg overflow-hidden flex">
                                                    <div
                                                        className="bg-purple-500 flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ width: `${budgetDistribution.production_ratio * 100}%` }}
                                                    >
                                                        {Math.round(budgetDistribution.production_ratio * 100)}%
                                                    </div>
                                                    <div
                                                        className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ width: `${(1 - budgetDistribution.production_ratio) * 100}%` }}
                                                    >
                                                        {Math.round((1 - budgetDistribution.production_ratio) * 100)}%
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>🎨 Production: {IMCService.formatVND(budgetDistribution.production_budget)}</span>
                                                    <span>📺 Media: {IMCService.formatVND(budgetDistribution.media_budget)}</span>
                                                </div>

                                                {/* Channel Breakdown */}
                                                <div className="text-sm font-bold text-slate-700 mt-4">📊 Channel Allocation</div>
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {budgetDistribution.channels.map((ch, i) => (
                                                        <div
                                                            key={i}
                                                            className={`p-3 rounded-lg border text-xs ${ch.warning ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="font-medium text-slate-800">{ch.channel_name}</div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-indigo-600">{IMCService.formatVND(ch.total_allocation)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 mb-2">
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                                    Media: {IMCService.formatVND(ch.media_spend)}
                                                                </span>
                                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                                                    Sản xuất: {IMCService.formatVND(ch.production_cost)}
                                                                </span>
                                                            </div>
                                                            <div className="text-slate-600 mb-1">
                                                                Est. {ch.estimated_kpi.metric}: <strong>{ch.estimated_kpi.value.toLocaleString()}</strong>
                                                                {ch.estimated_kpi.unit_cost > 0 && ` @ ${IMCService.formatVND(ch.estimated_kpi.unit_cost)}`}
                                                            </div>
                                                            <div className="text-indigo-600 italic">{ch.action_item}</div>
                                                            {ch.warning && (
                                                                <div className="mt-1 text-amber-700 font-medium">{ch.warning}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Default Instructions */
                                    <div className="space-y-4 text-sm text-slate-600">
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <h4 className="font-bold text-slate-800 mb-2">📊 Nhập Giá sản phẩm</h4>
                                            <p className="text-xs">Điền giá sản phẩm (AOV) để xem ước tính hiệu suất realtime.</p>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <h4 className="font-bold text-slate-800 mb-2">🎯 3 Chế độ Lập kế hoạch</h4>
                                            <ul className="mt-2 space-y-1 text-xs">
                                                <li><span className="font-medium text-indigo-600">Budget-Driven:</span> Có ngân sách → Ước tính doanh thu</li>
                                                <li><span className="font-medium text-indigo-600">Goal-Driven:</span> Có mục tiêu → Tính ngân sách cần</li>
                                                <li><span className="font-medium text-indigo-600">Audit:</span> Nhập cả hai → Đánh giá khả thi</li>
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                            <h4 className="font-bold text-amber-800 mb-2">⚠️ Feasibility Check</h4>
                                            <p className="text-amber-700 text-xs">
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
            {toast && (
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
        </>
    );
};

export default IMCPlanner;
