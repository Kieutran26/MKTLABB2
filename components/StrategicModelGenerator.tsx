import React, { useState, useRef, useEffect } from 'react';
import { Target, Download, Loader2, Sparkles, Grid, Filter, LayoutTemplate, HelpCircle, CheckCircle2, Edit3, X, Check, Layers, Package, DollarSign, MapPin, Megaphone, Save, History, Trash2 } from 'lucide-react';
import { generateStrategicModel, generateAllStrategicModels, StrategicModelData } from '../services/geminiService';
import { StrategicModelService, SavedStrategicModel } from '../services/strategicModelService';
import { toPng } from 'html-to-image';
import { Toast, ToastType } from './Toast';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';

const MODELS = [
    { id: 'SWOT', name: 'SWOT Analysis', icon: Grid, desc: 'Điểm mạnh, Yếu, Cơ hội, Thách thức' },
    { id: 'AIDA', name: 'Mô hình AIDA', icon: Filter, desc: 'Attention, Interest, Desire, Action' },
    { id: '4P', name: 'Marketing Mix 4P', icon: LayoutTemplate, desc: 'Product, Price, Place, Promotion' },
    { id: '5W1H', name: '5W1H Method', icon: HelpCircle, desc: 'Who, What, Where, When, Why, How' },
    { id: 'SMART', name: 'Mục tiêu SMART', icon: CheckCircle2, desc: 'Specific, Measurable, Achievable...' },
];

const StrategicModelGenerator: React.FC = () => {
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

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [savedModels, setSavedModels] = useState<SavedStrategicModel[]>([]);

    useEffect(() => {
        if (currentBrand && !useManual) {
            setProductInfo(`${currentBrand.identity.name} - ${currentBrand.strategy.vision}`);
        } else if (!useManual) {
            setProductInfo('');
        }
    }, [currentBrand, useManual]);

    // Load history on mount
    useEffect(() => {
        const loadHistory = async () => {
            const models = await StrategicModelService.getStrategicModels();
            setSavedModels(models);
        };
        loadHistory();
    }, []);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const getContext = () => {
        if (useManual) {
            return `Brand Name: ${manualBrandName || 'Unknown'}.`;
        } else if (currentBrand) {
            return `Brand: ${currentBrand.identity.name}. Target Audience: ${currentBrand.audience.demographics.join(', ')}. Core Values: ${currentBrand.strategy.coreValues.join(', ')}.`;
        }
        return "";
    };

    const handleGenerateSingle = async () => {
        if (!productInfo.trim()) {
            showToast("Vui lòng nhập thông tin sản phẩm", "error");
            return;
        }

        setIsGenerating(true);
        try {
            const data = await generateStrategicModel(productInfo, selectedModel, getContext());
            setResults(prev => ({ ...prev, [selectedModel]: data }));
        } catch (error) {
            showToast("Lỗi khi tạo mô hình.", "error");
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

    // --- CRITICAL FIX: EXPORT FUNCTION ---
    const handleDownload = async () => {
        if (!captureRef.current) return;

        try {
            const element = captureRef.current;

            // Force capture full scroll height
            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                width: element.scrollWidth,
                height: element.scrollHeight, // Capture full height even if hidden by overflow
                style: {
                    height: 'auto', // Override CSS height to auto for capture
                    overflow: 'visible', // Ensure no clipping
                    transform: 'none' // Reset transform to avoid offset
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
        // Check if at least one model has been generated
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

    // --- VISUAL COMPONENTS ---


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

    const EditableList = ({ items, title, colorClass, icon: Icon }: { items: any, title: string, colorClass: string, icon?: React.ElementType }) => {
        const listItems = toArray(items);
        return (
            <div className={`p-5 rounded-2xl h-full border-t-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col ${colorClass}`}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    {Icon && <Icon size={18} className="opacity-80" />}
                    <h4 className="font-bold uppercase text-sm tracking-wide">{title}</h4>
                </div>
                <ul className="space-y-3 flex-1">
                    {listItems.length > 0 ? listItems.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700 leading-relaxed flex gap-2" contentEditable suppressContentEditableWarning>
                            <span className="text-slate-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                            <span>{item}</span>
                        </li>
                    )) : <li className="text-sm text-slate-400 italic">Chưa có dữ liệu</li>}
                </ul>
            </div>
        );
    };

    // --- RENDERERS ---

    const renderSWOT = (data: any) => (
        <div className="grid grid-cols-2 gap-6 h-auto min-h-[500px]">
            <div className="bg-green-50/50 rounded-2xl p-2"><EditableList items={data.strengths} title="Strengths (Điểm mạnh)" colorClass="border-green-500 text-green-800" /></div>
            <div className="bg-red-50/50 rounded-2xl p-2"><EditableList items={data.weaknesses} title="Weaknesses (Điểm yếu)" colorClass="border-red-500 text-red-800" /></div>
            <div className="bg-blue-50/50 rounded-2xl p-2"><EditableList items={data.opportunities} title="Opportunities (Cơ hội)" colorClass="border-blue-500 text-blue-800" /></div>
            <div className="bg-orange-50/50 rounded-2xl p-2"><EditableList items={data.threats} title="Threats (Thách thức)" colorClass="border-orange-500 text-orange-800" /></div>
        </div>
    );

    const renderAIDA = (data: any) => (
        <div className="flex flex-col items-center space-y-4 w-full max-w-4xl mx-auto py-8">
            {['attention', 'interest', 'desire', 'action'].map((stage, idx) => {
                const widthPercent = 100 - (idx * 15);
                const colors = ['bg-rose-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
                return (
                    <div key={stage} className="w-full flex justify-center drop-shadow-xl filter">
                        <div
                            className={`${colors[idx]} text-white p-6 rounded-3xl text-center relative group transition-all hover:scale-[1.02] flex flex-col justify-center min-h-[120px]`}
                            style={{ width: `${widthPercent}%`, maxWidth: '800px', minWidth: '300px' }}
                        >
                            <div className="font-black uppercase text-sm opacity-80 mb-2 tracking-widest border-b border-white/20 pb-1 mx-auto inline-block">{stage}</div>
                            <div className="text-base font-medium leading-relaxed px-4" contentEditable suppressContentEditableWarning>
                                {toString(data[stage])}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // --- RE-DESIGNED 4P MARKETING MIX ---
    const render4P = (data: any) => {
        const pillars = [
            { key: 'product', title: 'Product (Sản phẩm)', color: 'border-blue-500 text-blue-700', icon: Package },
            { key: 'price', title: 'Price (Giá cả)', color: 'border-green-500 text-green-700', icon: DollarSign },
            { key: 'place', title: 'Place (Phân phối)', color: 'border-orange-500 text-orange-700', icon: MapPin },
            { key: 'promotion', title: 'Promotion (Xúc tiến)', color: 'border-red-500 text-red-700', icon: Megaphone }
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-auto min-h-[500px]">
                {pillars.map((p) => (
                    <div key={p.key} className="h-full">
                        <EditableList
                            items={data[p.key]}
                            title={p.title}
                            colorClass={p.color}
                            icon={p.icon}
                        />
                    </div>
                ))}
            </div>
        );
    };

    // --- RE-DESIGNED 5W1H (HONEYCOMB / RADIAL GRID) ---
    const render5W1H = (data: any) => {
        const items = [
            { k: 'who', t: 'WHO', c: 'bg-blue-50 border-blue-200' },
            { k: 'what', t: 'WHAT', c: 'bg-purple-50 border-purple-200' },
            { k: 'where', t: 'WHERE', c: 'bg-green-50 border-green-200' },
            { k: 'when', t: 'WHEN', c: 'bg-yellow-50 border-yellow-200' },
            { k: 'why', t: 'WHY', c: 'bg-orange-50 border-orange-200' },
            { k: 'how', t: 'HOW', c: 'bg-red-50 border-red-200' },
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto">
                {items.map((w) => (
                    <div key={w.k} className={`rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col ${w.c}`}>
                        <div className="px-4 py-3 font-black text-slate-700 text-center text-lg border-b border-black/5 uppercase tracking-widest bg-white/50">
                            {w.t}
                        </div>
                        <div className="p-5 flex-1">
                            <ul className="text-sm text-slate-700 space-y-2 list-none">
                                {toArray(data[w.k]).map((item: string, i: number) => (
                                    <li key={i} className="flex gap-2" contentEditable suppressContentEditableWarning>
                                        <span className="text-slate-400 font-bold">•</span> {item}
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
        <div className="space-y-4">
            {[
                { k: 'specific', t: 'Specific (Cụ thể)', c: 'bg-blue-50 border-blue-200 text-blue-900' },
                { k: 'measurable', t: 'Measurable (Đo lường)', c: 'bg-green-50 border-green-200 text-green-900' },
                { k: 'achievable', t: 'Achievable (Khả thi)', c: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
                { k: 'relevant', t: 'Relevant (Liên quan)', c: 'bg-orange-50 border-orange-200 text-orange-900' },
                { k: 'time_bound', t: 'Time-bound (Thời hạn)', c: 'bg-red-50 border-red-200 text-red-900' },
            ].map((item) => (
                <div key={item.k} className={`p-5 rounded-2xl border ${item.c} flex flex-col md:flex-row items-start gap-4 transition-all hover:shadow-md`}>
                    <div className="font-bold w-40 shrink-0 pt-1 uppercase text-xs tracking-wider border-b md:border-b-0 md:border-r border-black/10 pb-2 md:pb-0 md:pr-4">
                        {item.t}
                    </div>
                    <div className="flex-1 text-sm font-medium leading-relaxed" contentEditable suppressContentEditableWarning>
                        {toString(data[item.k])}
                    </div>
                </div>
            ))}
        </div>
    );

    const currentResult = results[selectedModel];

    return (
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
            {/* ... (Header and Input Area - Unchanged) ... */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Target className="text-blue-600" strokeWidth={1.5} />
                        Strategic Model Generator
                    </h2>
                    <p className="text-slate-500 mt-1">Tạo các khung chiến lược marketing chuẩn (SWOT, AIDA...) bằng AI.</p>
                    {!useManual && <div className="mt-4"><BrandSelector /></div>}
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button onClick={() => setUseManual(false)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!useManual ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Brand Vault</button>
                        <button onClick={() => setUseManual(true)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${useManual ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Thủ công</button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="group bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold transition-all"
                        >
                            <Save size={16} className="group-hover:scale-110 transition-transform" />
                            Lưu
                        </button>
                        <button
                            onClick={() => setShowHistory(true)}
                            className="group bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold transition-all"
                        >
                            <History size={16} className="group-hover:scale-110 transition-transform" />
                            Lịch sử
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Mô hình</label>
                        <div className="space-y-2">
                            {MODELS.map(m => {
                                const hasData = results[m.id] !== null;
                                return (
                                    <button key={m.id} onClick={() => setSelectedModel(m.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative ${selectedModel === m.id ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}>
                                        <div className={`p-1.5 rounded-lg ${selectedModel === m.id ? 'bg-white' : 'bg-slate-100'} ${!hasData && 'opacity-50'}`}><m.icon size={16} /></div>
                                        <div className={`${!hasData && 'opacity-60'}`}><div className="font-bold text-sm">{m.name}</div></div>
                                        {hasData && <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={16} />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div className="md:col-span-3 flex flex-col gap-4">
                        {useManual && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tên Thương hiệu (Manual)</label>
                                <div className="relative"><Edit3 className="absolute left-3 top-3 text-slate-400" size={16} /><input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-bold text-slate-700" placeholder="Nhập tên thương hiệu..." value={manualBrandName} onChange={e => setManualBrandName(e.target.value)} /></div>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-bold text-slate-700 mb-2">{useManual ? 'Mô tả Sản phẩm / Dịch vụ chi tiết' : `Thông tin Sản phẩm (${currentBrand ? currentBrand.identity.name : 'Chưa chọn Brand'})`}</label>
                            <textarea className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none mb-4 text-slate-800 min-h-[120px]" placeholder="Mô tả sản phẩm, đối tượng khách hàng, mục tiêu..." value={productInfo} onChange={e => setProductInfo(e.target.value)} />
                            <div className="self-end flex gap-3">
                                <button onClick={handleGenerateAll} disabled={isGenerating} className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-blue-600 transition-all disabled:opacity-70"><Layers size={18} /> Phân tích Toàn diện (All)</button>
                                <button onClick={handleGenerateSingle} disabled={isGenerating} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-70 transition-all">{isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Tạo {selectedModel}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {currentResult ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-800">Kết quả Phân tích ({selectedModel})</h3>
                        <button onClick={handleDownload} className="text-slate-500 hover:text-blue-600 flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <Download size={18} /> Tải ảnh PNG (Full)
                        </button>
                    </div>

                    <div
                        ref={captureRef}
                        className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-200"
                    >
                        <div className="mb-10 pb-8 border-b border-slate-100">
                            <h2 className="text-4xl font-black text-slate-800 text-center mb-4 uppercase tracking-tight">{MODELS.find(m => m.id === selectedModel)?.name}</h2>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-4xl mx-auto shadow-inner">
                                <p className="text-center text-slate-600 italic text-base leading-relaxed">"{currentResult.summary}"</p>
                            </div>
                        </div>

                        {/* DYNAMIC RENDERER */}
                        {selectedModel === 'SWOT' && renderSWOT(currentResult.data)}
                        {selectedModel === 'AIDA' && renderAIDA(currentResult.data)}
                        {selectedModel === '4P' && render4P(currentResult.data)}
                        {selectedModel === '5W1H' && render5W1H(currentResult.data)}
                        {selectedModel === 'SMART' && renderSMART(currentResult.data)}

                        <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                            <Sparkles size={12} /> Generated by OptiMKT AI Strategy Engine
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center animate-in fade-in zoom-in">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4"><Target size={40} className="text-slate-300" strokeWidth={1} /></div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có dữ liệu cho {selectedModel}</h3>
                    <p className="text-slate-500 max-w-md mb-6">Hãy nhập thông tin sản phẩm và bấm nút tạo để AI phân tích chiến lược cho mô hình này.</p>
                    <button onClick={handleGenerateSingle} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">Tạo phân tích {selectedModel} ngay</button>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in border border-slate-100 flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> Lịch sử Strategic Models</h3>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                            {savedModels.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Chưa có Strategic Model nào.</div>
                            ) : savedModels.map(model => {
                                const modelCount = Object.values(model.results).filter(r => r !== null).length;
                                return (
                                    <div key={model.id} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all group">
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => handleLoad(model)} className="flex-1 text-left">
                                                <div className="font-bold text-slate-800 mb-1">{model.name}</div>
                                                <div className="text-xs text-slate-400 mb-2">{new Date(model.createdAt).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-xs text-blue-600 font-bold">{modelCount} model(s) generated</div>
                                            </button>
                                            <button onClick={() => handleDelete(model.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default StrategicModelGenerator;