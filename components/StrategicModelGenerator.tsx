import React, { useState, useRef, useEffect } from 'react';
import {Target, Download, Loader2, Sparkles, Grid, Filter, LayoutTemplate, HelpCircle, CheckCircle2, Edit3, X, Check, Layers, Package, DollarSign, MapPin, Megaphone, Save, History, Trash2, Lock, Diamond, ChevronRight, Zap, Pencil} from 'lucide-react';
import { generateStrategicModel, generateAllStrategicModels, StrategicModelData } from '../services/geminiService';
import { StrategicModelService, SavedStrategicModel } from '../services/strategicModelService';
import { toPng } from 'html-to-image';
import { Toast, ToastType } from './Toast';
import FeatureHeader from './FeatureHeader';
import {
    WS_SAVE_ICON_BTN,
    WS_SEGMENT_SHELL,
    wsHistoryToggleClass,
    wsWorkspaceTabClass,
} from './workspace-toolbar-classes';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const textareaClass =
    'w-full rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 resize-none';

const MODELS = [
    { id: 'SWOT', name: 'SWOT Analysis', icon: Grid, desc: 'Điểm mạnh, Yếu, Cơ hội, Thách thức' },
    { id: 'AIDA', name: 'Mô hình AIDA', icon: Filter, desc: 'Attention, Interest, Desire, Action' },
    { id: '4P', name: 'Marketing Mix 4P', icon: LayoutTemplate, desc: 'Product, Price, Place, Promotion' },
    { id: '5W1H', name: '5W1H Method', icon: HelpCircle, desc: 'Who, What, Where, When, Why, How' },
    { id: 'SMART', name: 'Mục tiêu SMART', icon: CheckCircle2, desc: 'Specific, Measurable, Achievable...' },
];

const StrategicModelGenerator: React.FC = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [productInfo, setProductInfo] = useState('');
    const [selectedModel, setSelectedModel] = useState('SWOT');
    const [isGenerating, setIsGenerating] = useState(false);

    const [results, setResults] = useState<Record<string, StrategicModelData | null>>({
        SWOT: null,
        AIDA: null,
        '4P': null,
        '5W1H': null,
        SMART: null
    });

    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const captureRef = useRef<HTMLDivElement>(null);

    const [useManual, setUseManual] = useState(false);
    const [manualBrandName, setManualBrandName] = useState('');

    const [showHistory, setShowHistory] = useState(false);
    const [savedModels, setSavedModels] = useState<SavedStrategicModel[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [quota, setQuota] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');

    useEffect(() => {
        if (currentBrand && !useManual) {
            setProductInfo(`${currentBrand.identity.name} - ${currentBrand.strategy.vision}`);
        } else if (!useManual) {
            setProductInfo('');
        }
    }, [currentBrand, useManual]);

    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            const q = await saasService.getUserQuota(user.uid);
            setProfile(p);
            setQuota(q);
        };

        const loadHistory = async () => {
            const models = await StrategicModelService.getStrategicModels();
            setSavedModels(models);
        };
        
        loadUserData();
        loadHistory();
    }, [user]);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const getContext = () => {
        if (activeTab === 'manual') {
            return `Brand Name: ${manualBrandName || 'Unknown'}.`;
        } else if (currentBrand) {
            return `
                Thương hiệu: ${currentBrand.identity.name}. 
                Lĩnh vực: ${currentBrand.industry}. 
                Tầm nhìn: ${currentBrand.strategy.vision}. 
                Giá trị cốt lõi: ${currentBrand.strategy.coreValues.join(', ')}. 
                Phân khúc khách hàng: ${currentBrand.audience.demographics.join(', ')}.
                Nghiên cứu thị trường: ${currentBrand.market?.trends?.join(', ') || ''}
            `;
        }
        return "";
    };

    const handleGenerateSingle = async () => {
        if (!productInfo.trim()) {
            showToast("Vui lòng nhập thông tin sản phẩm", "error");
            return;
        }

        if (!user) {
            showToast("Vui lòng đăng nhập để sử dụng tính năng này", "error");
            return;
        }

        setIsGenerating(true);
        try {
            // Logic check quota/tier would go here if we want to block BEFORE generation
            // For now, let's just generate and then save which increments quota
            const data = await generateStrategicModel(productInfo, selectedModel, getContext());
            
            // Save to DB and check quota via the RPC function
            const savedData = await saasService.saveMarketingPlan(
                user.uid,
                selectedModel,
                `${selectedModel} Analysis - ${new Date().toLocaleDateString()}`,
                { productInfo, context: getContext() },
                data,
                currentBrand?.id
            );

            if (!savedData) {
                showToast("Hết lượt dùng hoặc lỗi lưu trữ. Vui lòng nâng cấp gói!", "error");
                setIsGenerating(false);
                return;
            }

            setResults(prev => ({ ...prev, [selectedModel]: data }));
            showToast(`Đã tạo xong ${selectedModel}!`, "success");
        } catch (error: any) {
            if (error.message?.includes('QUOTA_EXCEEDED')) {
                showToast("Bạn đã hết lượt dùng gói Free. Vui lòng nâng cấp!", "error");
            } else {
                showToast("Lỗi khi tạo mô hình.", "error");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAll = async () => {
        if (!productInfo.trim()) {
            showToast("Vui lòng nhập thông tin sản phẩm", "error");
            return;
        }

        setIsGenerating(true);
        try {
            const allData = await generateAllStrategicModels(productInfo, getContext());
            setResults(prev => ({ ...prev, ...allData }));
            showToast("Đã tạo xong tất cả mô hình!", "success");
        } catch (error) {
            showToast("Lỗi khi tạo toàn bộ mô hình.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!captureRef.current) return;

        try {
            const element = captureRef.current;

            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                width: element.scrollWidth,
                height: element.scrollHeight,
                style: {
                    height: 'auto',
                    overflow: 'visible',
                    transform: 'none'
                }
            });

            const link = document.createElement('a');
            link.download = `strategy-${selectedModel}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            showToast("Đã tải ảnh thành công (Full Size)", "success");
        } catch (err) {
            console.error("Export Error:", err);
            showToast("Lỗi khi xuất ảnh", "error");
        }
    };

    const handleSave = async () => {
        const hasData = Object.values(results).some(r => r !== null);
        if (!hasData) {
            showToast("Chưa có dữ liệu để lưu!", "error");
            return;
        }

        const modelName = useManual
            ? `${manualBrandName || 'Unknown'} - ${new Date().toLocaleDateString()}`
            : `${currentBrand?.identity.name || 'Unknown'} - ${new Date().toLocaleDateString()}`;

        const newModel: SavedStrategicModel = {
            id: Date.now().toString(),
            name: modelName,
            brandId: useManual ? 'manual' : (currentBrand?.id || 'unknown'),
            productInfo,
            results,
            createdAt: Date.now()
        };

        const success = await StrategicModelService.saveStrategicModel(newModel);

        if (success) {
            const models = await StrategicModelService.getStrategicModels();
            setSavedModels(models);
            showToast("Đã lưu Strategic Models!", "success");
        } else {
            showToast("Lỗi khi lưu!", "error");
        }
    };

    const handleLoad = (model: SavedStrategicModel) => {
        setResults(model.results);
        setProductInfo(model.productInfo);
        setShowHistory(false);
        showToast("Đã tải Strategic Models!", "success");
    };

    const handleDelete = async (id: string) => {
        const success = await StrategicModelService.deleteStrategicModel(id);

        if (success) {
            const models = await StrategicModelService.getStrategicModels();
            setSavedModels(models);
            showToast("Đã xóa!", "success");
        } else {
            showToast("Lỗi khi xóa!", "error");
        }
    };

    const toArray = (input: any): string[] => {
        if (Array.isArray(input)) return input;
        if (typeof input === 'string') return [input];
        return [];
    };

    const toString = (input: any): string => {
        if (typeof input === 'string') return input;
        if (Array.isArray(input)) return input.join('. ');
        return '';
    };

    const EditableList = ({ items, title, accentClass, icon: Icon }: { items: any; title: string; accentClass: string; icon?: React.ElementType }) => {
        const listItems = toArray(items);
        return (
            <div className={`flex h-full flex-col rounded-2xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${accentClass}`}>
                <div className="mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                    {Icon && <Icon size={18} strokeWidth={1.25} className="text-stone-500" />}
                    <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-800">{title}</h4>
                </div>
                <ul className="flex flex-1 flex-col space-y-3">
                    {listItems.length > 0 ? listItems.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed text-stone-700" contentEditable suppressContentEditableWarning>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" aria-hidden />
                            <span>{item}</span>
                        </li>
                    )) : <li className="text-sm italic text-stone-400">Chưa có dữ liệu</li>}
                </ul>
            </div>
        );
    };

    const renderSWOT = (data: any) => (
        <div className="grid min-h-[500px] grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/20 p-1">
                <EditableList items={data.strengths} title="Strengths (Điểm mạnh)" accentClass="border-t-2 border-t-emerald-600/50" />
            </div>
            <div className="rounded-2xl border border-rose-100/80 bg-rose-50/20 p-1">
                <EditableList items={data.weaknesses} title="Weaknesses (Điểm yếu)" accentClass="border-t-2 border-t-rose-600/50" />
            </div>
            <div className="rounded-2xl border border-sky-100/80 bg-sky-50/20 p-1">
                <EditableList items={data.opportunities} title="Opportunities (Cơ hội)" accentClass="border-t-2 border-t-sky-600/50" />
            </div>
            <div className="rounded-2xl border border-amber-100/80 bg-amber-50/20 p-1">
                <EditableList items={data.threats} title="Threats (Thách thức)" accentClass="border-t-2 border-t-amber-600/50" />
            </div>
        </div>
    );

    const renderAIDA = (data: any) => (
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-3 py-6">
            {['attention', 'interest', 'desire', 'action'].map((stage, idx) => {
                const widthPercent = 100 - (idx * 15);
                return (
                    <div key={stage} className="flex w-full justify-center">
                        <div
                            className="flex min-h-[100px] flex-col justify-center rounded-2xl border border-stone-200/90 bg-stone-900 px-6 py-5 text-center text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all hover:border-stone-600"
                            style={{ width: `${widthPercent}%`, maxWidth: '800px', minWidth: '280px' }}
                        >
                            <div className="mx-auto mb-2 inline-block border-b border-white/15 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-300">
                                {stage}
                            </div>
                            <div className="text-sm font-normal leading-relaxed text-stone-100" contentEditable suppressContentEditableWarning>
                                {toString(data[stage])}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const render4P = (data: any) => {
        const pillars = [
            { key: 'product', title: 'Product (Sản phẩm)', accent: 'border-t-stone-700/40', icon: Package },
            { key: 'price', title: 'Price (Giá cả)', accent: 'border-t-stone-600/40', icon: DollarSign },
            { key: 'place', title: 'Place (Phân phối)', accent: 'border-t-stone-500/40', icon: MapPin },
            { key: 'promotion', title: 'Promotion (Xúc tiến)', accent: 'border-t-stone-800/40', icon: Megaphone }
        ];

        return (
            <div className="grid min-h-[500px] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {pillars.map((p) => (
                    <div key={p.key} className="h-full rounded-2xl border border-stone-100 bg-stone-50/30 p-1">
                        <EditableList items={data[p.key]} title={p.title} accentClass={p.accent} icon={p.icon} />
                    </div>
                ))}
            </div>
        );
    };

    const render5W1H = (data: any) => {
        const items = [
            { k: 'who', t: 'WHO' },
            { k: 'what', t: 'WHAT' },
            { k: 'where', t: 'WHERE' },
            { k: 'when', t: 'WHEN' },
            { k: 'why', t: 'WHY' },
            { k: 'how', t: 'HOW' },
        ];

        return (
            <div className="grid h-auto grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((w) => (
                    <div key={w.k} className={`${cardClass} flex h-full flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 bg-stone-50/50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-stone-700">
                            {w.t}
                        </div>
                        <div className="flex-1 p-4">
                            <ul className="list-none space-y-2 text-sm text-stone-700">
                                {toArray(data[w.k]).map((item: string, i: number) => (
                                    <li key={i} className="flex gap-2" contentEditable suppressContentEditableWarning>
                                        <span className="font-medium text-stone-300">•</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderSMART = (data: any) => (
        <div className="space-y-3">
            {[
                { k: 'specific', t: 'Specific (Cụ thể)' },
                { k: 'measurable', t: 'Measurable (Đo lường)' },
                { k: 'achievable', t: 'Achievable (Khả thi)' },
                { k: 'relevant', t: 'Relevant (Liên quan)' },
                { k: 'time_bound', t: 'Time-bound (Thời hạn)' },
            ].map((item) => (
                <div key={item.k} className={`${cardClass} flex flex-col items-start gap-4 p-5 transition-all md:flex-row`}>
                    <div className="w-full shrink-0 border-b border-stone-100 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-stone-600 md:w-44 md:border-b-0 md:border-r md:pb-0 md:pr-4">
                        {item.t}
                    </div>
                    <div className="flex-1 text-sm font-normal leading-relaxed text-stone-800" contentEditable suppressContentEditableWarning>
                        {toString(data[item.k])}
                    </div>
                </div>
            ))}
        </div>
    );

    const currentResult = results[selectedModel];

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC]">
            <FeatureHeader
                icon={Target}
                eyebrow="AI-POWERED STRATEGIC FRAMEWORK"
                title="Strategic Model Generator"
                subline="Phân tích SWOT, AIDA, 4P bằng AI thông minh."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <div className={WS_SEGMENT_SHELL}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('manual')}
                            className={wsWorkspaceTabClass(activeTab === 'manual')}
                        >
                            <Pencil size={14} /> Thủ công
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('vault')}
                            className={wsWorkspaceTabClass(activeTab === 'vault')}
                        >
                            <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} />
                            Brand Vault
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        className={WS_SAVE_ICON_BTN}
                        aria-label="Lưu"
                        title="Lưu"
                    >
                        <Save size={18} strokeWidth={2} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className={wsHistoryToggleClass(showHistory)}
                        aria-pressed={showHistory}
                        title="Lịch sử"
                        aria-label="Mở lịch sử mô hình chiến lược"
                    >
                        <History size={17} strokeWidth={1.5} />
                    </button>
                </div>
            </FeatureHeader>

            <div className="flex-1 overflow-y-auto px-5 py-8 md:px-10">
                <div className="mx-auto max-w-7xl">
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="mb-12 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-10 md:p-14">
                                    <div className="mb-6 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-600">
                                        <Diamond size={32} />
                                    </div>
                                    <h2 className="mb-4 text-3xl font-medium tracking-tight text-stone-900">Tính năng Brand Vault</h2>
                                    <p className="mb-8 text-lg text-stone-500">
                                        Kết nối trực tiếp với "DNA Thương hiệu" của bạn để tạo ra những chiến lược marketing chính xác vượt trội.
                                    </p>
                                    <ul className="mb-10 space-y-4">
                                        {[
                                            "Tự động đồng bộ Tầm nhìn & Giá trị cốt lõi",
                                            "Phân tích sâu khách hàng mục tiêu đã lưu",
                                            "Đề xuất chiến lược khớp 100% với Brand Voice",
                                            "Tiết kiệm 90% thời gian nhập dữ liệu thủ công"
                                        ].map((text, i) => (
                                            <li key={i} className="flex items-center gap-3 text-stone-700">
                                                <div className="rounded-full bg-emerald-50 p-1 text-emerald-600">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="flex items-center gap-2 rounded-2xl bg-stone-900 px-8 py-4 font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
                                        Nâng cấp Pro Max ngay <ChevronRight size={18} />
                                    </button>
                                </div>
                                <div className="relative flex items-center justify-center bg-stone-50 p-10 overflow-hidden">
                                     <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                                        <Target size={400} />
                                     </div>
                                     <div className={`${cardClass} relative z-10 w-full max-w-sm rotate-2 scale-95 p-6 blur-[1px] grayscale opacity-50`}>
                                         <div className="mb-4 h-4 w-1/2 rounded bg-stone-200" />
                                         <div className="mb-2 h-3 w-full rounded bg-stone-100" />
                                         <div className="mb-8 h-3 w-2/3 rounded bg-stone-100" />
                                         <div className="grid grid-cols-2 gap-4">
                                             <div className="h-24 rounded-xl bg-stone-100" />
                                             <div className="h-24 rounded-xl bg-stone-100" />
                                         </div>
                                     </div>
                                     <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/80 p-6 shadow-2xl backdrop-blur-md">
                                         <Lock size={40} className="text-stone-400" />
                                     </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'vault' && (
                                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <BrandSelector />
                                </div>
                            )}

                        <div className="mb-12">
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-0">
                                <div className="border-stone-200/80 lg:col-span-4 lg:border-r lg:pr-10">
                                    <label className="mb-4 block text-xs font-semibold uppercase tracking-widest text-stone-500">Mô hình phân tích</label>
                                    <div className="space-y-2.5">
                                        {MODELS.map(m => {
                                            const hasData = results[m.id] !== null;
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => setSelectedModel(m.id)}
                                                    className={`group relative flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${selectedModel === m.id
                                                        ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                                                        : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                                                        }`}
                                                >
                                                    <div className={`rounded-xl border p-2 transition-colors ${selectedModel === m.id ? 'border-white/20 bg-white/10 text-white' : 'border-stone-100 bg-stone-50 text-stone-600 group-hover:bg-white'}`}>
                                                        <m.icon size={18} strokeWidth={1.25} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className={`text-sm font-medium ${selectedModel === m.id ? 'text-white' : 'text-stone-900'}`}>{m.name}</div>
                                                        <div className={`truncate text-[11px] ${selectedModel === m.id ? 'text-white/60' : 'text-stone-400'}`}>{m.desc}</div>
                                                    </div>
                                                    {hasData && (
                                                        <div className={`rounded-full p-1 ${selectedModel === m.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            <Check size={12} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6 lg:col-span-8 lg:pl-10">
                                    {activeTab === 'manual' && (
                                        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-500">Tên thương hiệu</label>
                                            <div className="relative">
                                                <Edit3 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-300" strokeWidth={1.25} />
                                                <input
                                                    className="w-full rounded-2xl border border-stone-200 bg-white py-4 pl-12 pr-4 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                                                    placeholder="Ví dụ: Blue Vigor Travel"
                                                    value={manualBrandName}
                                                    onChange={e => setManualBrandName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-1 flex-col">
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-500">
                                            {activeTab === 'manual' ? 'Dịch vụ / Sản phẩm chi tiết' : `Sản phẩm (${currentBrand ? currentBrand.identity.name : 'Vui lòng chọn Brand'})`}
                                        </label>
                                        <textarea
                                            className="min-h-[160px] w-full resize-none rounded-2xl border border-stone-200 bg-white p-5 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                                            placeholder="Phân tích chuyên sâu hơn bằng cách mô tả chi tiết sản phẩm, đối tượng khách hàng mục tiêu..."
                                            value={productInfo}
                                            onChange={e => setProductInfo(e.target.value)}
                                        />
                                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={handleGenerateAll}
                                                disabled={isGenerating}
                                                className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-600 shadow-sm transition-all hover:bg-stone-50 disabled:opacity-50"
                                            >
                                                <Layers size={18} strokeWidth={1.25} /> Tất cả mô hình
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleGenerateSingle}
                                                disabled={isGenerating}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-8 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-stone-800 hover:shadow-xl active:scale-95 disabled:opacity-50"
                                            >
                                                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                                Tạo {selectedModel}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </>
                    )}

                {currentResult ? (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-sans text-lg font-medium tracking-tight text-stone-900 md:text-xl">
                                Kết quả phân tích ({selectedModel})
                            </h3>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50"
                            >
                                <Download size={18} strokeWidth={1.25} /> Tải ảnh PNG (full)
                            </button>
                        </div>

                        <div ref={captureRef} className={`${cardClass} p-8 md:p-10`}>
                            <div className="mb-8 border-b border-stone-100 pb-8">
                                <h2 className="mb-4 text-center font-sans text-2xl font-medium tracking-tight text-stone-900 md:text-3xl">
                                    {MODELS.find(m => m.id === selectedModel)?.name}
                                </h2>
                                <div className="mx-auto max-w-4xl rounded-2xl border border-stone-100 bg-stone-50/50 p-6">
                                    <p className="text-center text-base font-normal italic leading-relaxed text-stone-600">
                                        &ldquo;{currentResult.summary}&rdquo;
                                    </p>
                                </div>
                            </div>

                            {selectedModel === 'SWOT' && renderSWOT(currentResult.data)}
                            {selectedModel === 'AIDA' && renderAIDA(currentResult.data)}
                            {selectedModel === '4P' && render4P(currentResult.data)}
                            {selectedModel === '5W1H' && render5W1H(currentResult.data)}
                            {selectedModel === 'SMART' && renderSMART(currentResult.data)}

                            <div className="mt-10 flex items-center justify-center gap-2 border-t border-stone-100 pt-6 text-center text-xs font-normal text-stone-400">
                                <Sparkles size={12} strokeWidth={1.25} /> Generated by OptiMKT AI Strategy Engine
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`${cardClass} flex min-h-[280px] flex-col items-center justify-center border-dashed border-stone-200/90 px-6 py-16 text-center`}>
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                            <Target size={32} strokeWidth={1.25} className="text-stone-300" />
                        </div>
                        <h3 className="text-base font-medium text-stone-800">Chưa có dữ liệu cho {selectedModel}</h3>
                        <p className="mt-1 max-w-md text-sm font-normal text-stone-500">
                            Hãy nhập thông tin sản phẩm và bấm tạo để AI phân tích chiến lược cho mô hình này.
                        </p>
                        <button
                            type="button"
                            onClick={handleGenerateSingle}
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                        >
                            Tạo phân tích {selectedModel} ngay
                        </button>
                    </div>
                )}

                {showHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
                        <div className={`${cardClass} flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden shadow-xl`}>
                            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
                                <h3 className="flex items-center gap-2 font-sans text-lg font-medium tracking-tight text-stone-900">
                                    <History size={20} strokeWidth={1.25} className="text-stone-400" />
                                    Lịch sử Strategic Models
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowHistory(false)}
                                    className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                    aria-label="Đóng"
                                >
                                    <X size={20} strokeWidth={1.25} />
                                </button>
                            </div>
                            <div className="custom-scrollbar space-y-2 overflow-y-auto p-6">
                                {savedModels.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-stone-400">Chưa có Strategic Model nào.</div>
                                ) : (
                                    savedModels.map(model => {
                                        const modelCount = Object.values(model.results).filter(r => r !== null).length;
                                        return (
                                            <div key={model.id} className="group rounded-2xl border border-stone-200/90 p-4 transition-all hover:border-stone-300 hover:bg-stone-50/50">
                                                <div className="flex items-start gap-3">
                                                    <button type="button" onClick={() => handleLoad(model)} className="min-w-0 flex-1 text-left">
                                                        <div className="font-medium text-stone-900">{model.name}</div>
                                                        <div className="mt-1 text-xs text-stone-400">{new Date(model.createdAt).toLocaleDateString('vi-VN')}</div>
                                                        <div className="mt-2 text-xs font-medium text-stone-600">{modelCount} mô hình đã tạo</div>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(model.id)}
                                                        className="shrink-0 rounded-lg p-2 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                        aria-label="Xóa"
                                                    >
                                                        <Trash2 size={16} strokeWidth={1.25} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                </div>
            </div>
        </div>
    );
};

export default StrategicModelGenerator;
