import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ShieldCheck, Image as ImageIcon, Palette, Type, Users, Target, Rocket, Wand2, Copy, Check, ChevronLeft, Save, ListPlus, X, LayoutList, Clock, Loader2 } from 'lucide-react';
import { useBrand } from './BrandContext';
import { Brand, BrandColor, BrandLogo } from '../types';
import { Toast, ToastType } from './Toast';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// --- SUB-COMPONENT: LIST EDITOR (Moved outside to prevent re-render/focus issues) ---
interface ListEditorProps {
    items: string[];
    title: string;
    placeholder: string;
    icon?: React.ElementType;
    onAdd: () => void;
    onUpdate: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    onAiSuggest: () => void;
    isGenerating: boolean;
}

const ListEditor: React.FC<ListEditorProps> = ({
    items, title, placeholder, icon: Icon,
    onAdd, onUpdate, onRemove, onAiSuggest, isGenerating
}) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {Icon && <Icon className="text-indigo-500" size={20} strokeWidth={1.5} />} {title}
            </label>
            <button
                onClick={onAiSuggest}
                disabled={isGenerating}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition-colors"
            >
                <Wand2 size={12} /> AI Suggest
            </button>
        </div>
        <div className="space-y-2">
            {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 group">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold mt-2 shrink-0">
                        {idx + 1}
                    </div>
                    <textarea
                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none h-[46px]"
                        value={item}
                        onChange={(e) => onUpdate(idx, e.target.value)}
                        placeholder={placeholder}
                    />
                    <button
                        onClick={() => onRemove(idx)}
                        className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all h-[46px]"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            <button
                onClick={onAdd}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 mt-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <Plus size={16} /> Thêm ý mới
            </button>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const BrandVault: React.FC = () => {
    const { brands, refreshBrands, switchBrand, saveBrand, deleteBrand, isLoading } = useBrand();
    const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
    const [activeTab, setActiveTab] = useState<'identity' | 'strategy' | 'audience'>('identity');
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    // Helper to safely migrate old data structure to new list-based one
    const migrateBrandData = (brand: any): Brand => {
        return {
            ...brand,
            identity: {
                ...brand.identity,
                logos: brand.identity.logos || [
                    // Migrate old single logos to new array if needed
                    ...(brand.identity.logoMain ? [{ id: 'main', url: brand.identity.logoMain, variantName: 'Logo Chính' }] : []),
                    ...(brand.identity.logoIcon ? [{ id: 'icon', url: brand.identity.logoIcon, variantName: 'Icon' }] : [])
                ]
            },
            strategy: {
                ...brand.strategy,
                coreValues: Array.isArray(brand.strategy.coreValues) ? brand.strategy.coreValues : (brand.strategy.coreValues ? [brand.strategy.coreValues] : []),
                shortTermGoals: brand.strategy.shortTermGoals || [],
                longTermGoals: brand.strategy.longTermGoals || [],
                targetObjectives: brand.strategy.targetObjectives || [],
            },
            audience: {
                demographics: Array.isArray(brand.audience.demographics) ? brand.audience.demographics : (brand.audience.demographics ? [brand.audience.demographics] : []),
                psychographics: Array.isArray(brand.audience.psychographics) ? brand.audience.psychographics : (brand.audience.psychographics ? [brand.audience.psychographics] : []),
                painPoints: Array.isArray(brand.audience.painPoints) ? brand.audience.painPoints : (brand.audience.painPoints ? [brand.audience.painPoints] : []),
            }
        };
    };

    const handleCreateNew = () => {
        const newBrand: Brand = {
            id: Date.now().toString(),
            identity: {
                name: 'Brand Mới',
                logoMain: null,
                logoIcon: null,
                logos: [
                    { id: '1', url: '', variantName: 'Logo Chính' },
                    { id: '2', url: '', variantName: 'Logo Âm bản (Trắng)' },
                    { id: '3', url: '', variantName: 'Icon / Favicon' }
                ],
                colors: [{ type: 'Primary', code: '#4F46E5' }, { type: 'Secondary', code: '#1E293B' }],
                fontFamily: 'Inter'
            },
            strategy: {
                vision: '',
                mission: '',
                coreValues: [],
                toneOfVoice: '',
                shortTermGoals: [],
                longTermGoals: [],
                targetObjectives: []
            },
            audience: {
                demographics: [],
                psychographics: [],
                painPoints: []
            },
            createdAt: Date.now()
        };
        setEditingBrand(newBrand);
        setViewMode('edit');
        setActiveTab('identity');
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(migrateBrandData(JSON.parse(JSON.stringify(brand)))); // Deep copy & Migrate
        setViewMode('edit');
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa thương hiệu này? Dữ liệu liên quan có thể bị ảnh hưởng.")) {
            const success = await deleteBrand(id);
            if (success) {
                showToast("Đã xóa thương hiệu", "success");
            } else {
                showToast("Lỗi khi xóa thương hiệu", "error");
            }
        }
    };

    const handleSave = async () => {
        if (!editingBrand) return;
        if (!editingBrand.identity.name.trim()) {
            showToast("Vui lòng nhập tên thương hiệu", "error");
            return;
        }

        setIsSaving(true);

        // Update main logo legacy field for backward compatibility
        const mainLogo = editingBrand.identity.logos.find(l => l.url);
        const updatedBrand = {
            ...editingBrand,
            identity: {
                ...editingBrand.identity,
                logoMain: mainLogo ? mainLogo.url : null
            }
        };

        const success = await saveBrand(updatedBrand);
        setIsSaving(false);

        if (success) {
            setViewMode('list');
            showToast("Đã lưu thương hiệu thành công", "success");
        } else {
            showToast("Lỗi khi lưu thương hiệu", "error");
        }
    };

    // --- HANDLERS FOR LOGOS ---

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, logoId: string) => {
        const file = e.target.files?.[0];
        if (!file || !editingBrand) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const newLogos = editingBrand.identity.logos.map(l =>
                l.id === logoId ? { ...l, url: base64 } : l
            );
            setEditingBrand({
                ...editingBrand,
                identity: { ...editingBrand.identity, logos: newLogos }
            });
        };
        reader.readAsDataURL(file);
    };

    const addLogoVariant = () => {
        if (!editingBrand) return;
        const newLogo: BrandLogo = {
            id: Date.now().toString(),
            url: '',
            variantName: 'New Variant'
        };
        setEditingBrand({
            ...editingBrand,
            identity: {
                ...editingBrand.identity,
                logos: [...editingBrand.identity.logos, newLogo]
            }
        });
    };

    const updateLogoName = (id: string, name: string) => {
        if (!editingBrand) return;
        setEditingBrand({
            ...editingBrand,
            identity: {
                ...editingBrand.identity,
                logos: editingBrand.identity.logos.map(l => l.id === id ? { ...l, variantName: name } : l)
            }
        });
    };

    const removeLogo = (id: string) => {
        if (!editingBrand) return;
        setEditingBrand({
            ...editingBrand,
            identity: {
                ...editingBrand.identity,
                logos: editingBrand.identity.logos.filter(l => l.id !== id)
            }
        });
    };

    // --- HANDLERS FOR COLORS ---

    const handleColorChange = (index: number, key: 'type' | 'code', value: string) => {
        if (!editingBrand) return;
        const newColors = [...editingBrand.identity.colors];
        newColors[index] = { ...newColors[index], [key]: value };
        setEditingBrand({
            ...editingBrand,
            identity: { ...editingBrand.identity, colors: newColors }
        });
    };

    const addColor = () => {
        if (!editingBrand) return;
        setEditingBrand({
            ...editingBrand,
            identity: {
                ...editingBrand.identity,
                colors: [...editingBrand.identity.colors, { type: 'Accent', code: '#000000' }]
            }
        });
    };

    const removeColor = (index: number) => {
        if (!editingBrand) return;
        const newColors = editingBrand.identity.colors.filter((_, i) => i !== index);
        setEditingBrand({
            ...editingBrand,
            identity: { ...editingBrand.identity, colors: newColors }
        });
    };

    // --- HANDLERS FOR LIST ITEMS (Strategy & Audience) ---

    const addListItem = (section: 'strategy' | 'audience', field: string) => {
        if (!editingBrand) return;
        const currentList = (editingBrand as any)[section][field] as string[];
        setEditingBrand({
            ...editingBrand,
            [section]: {
                ...(editingBrand as any)[section],
                [field]: [...currentList, '']
            }
        });
    };

    const updateListItem = (section: 'strategy' | 'audience', field: string, index: number, value: string) => {
        if (!editingBrand) return;
        const currentList = [...(editingBrand as any)[section][field]] as string[];
        currentList[index] = value;
        setEditingBrand({
            ...editingBrand,
            [section]: {
                ...(editingBrand as any)[section],
                [field]: currentList
            }
        });
    };

    const removeListItem = (section: 'strategy' | 'audience', field: string, index: number) => {
        if (!editingBrand) return;
        const currentList = [...(editingBrand as any)[section][field]] as string[];
        currentList.splice(index, 1);
        setEditingBrand({
            ...editingBrand,
            [section]: {
                ...(editingBrand as any)[section],
                [field]: currentList
            }
        });
    };

    const handleAiGenerate = async (promptType: string, targetField: string, section: 'strategy' | 'audience', isList: boolean = false) => {
        if (!editingBrand) return;
        setIsGenerating(true);
        try {
            let prompt = "";
            const brandName = editingBrand.identity.name;

            if (isList) {
                prompt = `Generate a list of 5 ${promptType} for a brand named "${brandName}". 
                Return ONLY the items separated by newlines. No numbering. No markdown.`;
            } else {
                prompt = `Write a ${promptType} for brand "${brandName}". Keep it concise and inspiring. Return ONLY text.`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text?.trim() || "";

            if (isList) {
                const items = text.split('\n').filter(i => i.trim().length > 0);
                setEditingBrand({
                    ...editingBrand,
                    [section]: {
                        ...(editingBrand as any)[section],
                        [targetField]: items
                    }
                });
            } else {
                setEditingBrand({
                    ...editingBrand,
                    [section]: {
                        ...(editingBrand as any)[section],
                        [targetField]: text
                    }
                });
            }
        } catch (e) {
            showToast("Lỗi AI generation", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast(`Copied: ${text}`, "success");
    };

    // --- RENDER ---

    if (viewMode === 'list') {
        return (
            <div className="max-w-6xl mx-auto pt-10 px-6 pb-20">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <ShieldCheck className="text-indigo-600" strokeWidth={1.5} />
                            Brand Vault
                        </h2>
                        <p className="text-slate-500 mt-1">Quản lý tài sản và hồ sơ đa thương hiệu.</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        <Plus size={20} strokeWidth={1.5} /> Thêm Thương hiệu
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brands.length === 0 ? (
                        <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                                <ShieldCheck size={40} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có thương hiệu nào</h3>
                            <button onClick={handleCreateNew} className="text-indigo-600 font-bold hover:underline">Tạo hồ sơ đầu tiên &rarr;</button>
                        </div>
                    ) : (
                        brands.map(brand => {
                            // Fallback for main logo display
                            const displayLogo = brand.identity.logos?.[0]?.url || brand.identity.logoMain;

                            return (
                                <div
                                    key={brand.id}
                                    onClick={() => handleEdit(brand)}
                                    className="group bg-white rounded-3xl border border-slate-200 shadow-soft hover:shadow-xl transition-all cursor-pointer overflow-hidden p-6 flex flex-col relative"
                                >
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => handleDelete(e, brand.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={18} strokeWidth={1.5} />
                                        </button>
                                    </div>

                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 mb-4 overflow-hidden flex items-center justify-center">
                                        {displayLogo ? (
                                            <img src={displayLogo} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <ShieldCheck size={32} className="text-slate-300" strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-800 mb-1">{brand.identity.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{brand.strategy.vision || 'Chưa có thông tin chiến lược.'}</p>

                                    <div className="flex gap-2 mt-auto">
                                        {brand.identity.colors.slice(0, 4).map((c, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border border-slate-100 shadow-sm" style={{ backgroundColor: c.code }} title={c.type}></div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        );
    }

    // EDIT VIEW
    if (!editingBrand) return null;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ChevronLeft size={24} strokeWidth={1.5} />
                    </button>
                    <input
                        className="font-bold text-xl text-slate-800 bg-transparent border-none focus:ring-0 placeholder:text-slate-300 w-64"
                        value={editingBrand.identity.name}
                        onChange={(e) => setEditingBrand({ ...editingBrand, identity: { ...editingBrand.identity, name: e.target.value } })}
                        placeholder="Tên thương hiệu..."
                    />
                </div>
                <button
                    onClick={handleSave}
                    className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <Save size={18} strokeWidth={1.5} /> Lưu thay đổi
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Tabs Sidebar */}
                <div className="w-64 bg-white border-r border-slate-200 flex flex-col pt-6">
                    {[
                        { id: 'identity', label: 'Visual Identity', icon: Palette },
                        { id: 'strategy', label: 'Chiến lược', icon: Rocket },
                        { id: 'audience', label: 'Thị trường', icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-6 py-4 border-l-4 transition-all
                                ${activeTab === tab.id
                                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold'
                                    : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}`}
                        >
                            <tab.icon size={20} strokeWidth={1.5} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-10">
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">

                        {/* TAB: IDENTITY */}
                        {activeTab === 'identity' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Logos */}
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <ImageIcon className="text-slate-400" /> Thư viện Logo
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {editingBrand.identity.logos.map((logo) => (
                                            <div key={logo.id} className="relative group">
                                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors relative h-48 flex items-center justify-center bg-slate-50/30 overflow-hidden">
                                                    {logo.url ? (
                                                        <img src={logo.url} className="max-w-full max-h-full object-contain" alt={logo.variantName} />
                                                    ) : (
                                                        <div className="text-slate-400 flex flex-col items-center pointer-events-none">
                                                            <ImageIcon size={32} strokeWidth={1} className="mb-2" />
                                                            <span className="text-xs font-medium">Click để tải ảnh</span>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        accept="image/*"
                                                        onChange={(e) => handleLogoUpload(e, logo.id)}
                                                    />

                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => removeLogo(logo.id)}
                                                        className="absolute top-2 right-2 bg-white p-1.5 rounded-full text-slate-400 hover:text-red-500 shadow-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <input
                                                    className="w-full mt-2 text-center text-sm font-bold text-slate-600 bg-transparent border border-transparent hover:border-slate-200 rounded px-2 focus:border-indigo-300 focus:outline-none"
                                                    value={logo.variantName}
                                                    onChange={(e) => updateLogoName(logo.id, e.target.value)}
                                                    placeholder="Tên phiên bản..."
                                                />
                                            </div>
                                        ))}

                                        {/* Add New Logo Button */}
                                        <button
                                            onClick={addLogoVariant}
                                            className="border-2 border-dashed border-indigo-200 rounded-2xl p-4 text-center hover:bg-indigo-50 transition-colors h-48 flex flex-col items-center justify-center text-indigo-500 group"
                                        >
                                            <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="font-bold">Thêm Logo</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Colors */}
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Palette className="text-slate-400" /> Bảng màu (Color Palette)
                                    </h3>
                                    <div className="space-y-3">
                                        {editingBrand.identity.colors.map((color, index) => (
                                            <div key={index} className="flex gap-4 items-center group">
                                                <div className="relative w-12 h-12 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer transition-transform hover:scale-105">
                                                    <div className="absolute inset-0" style={{ backgroundColor: color.code }}></div>
                                                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={color.code} onChange={(e) => handleColorChange(index, 'code', e.target.value)} />
                                                </div>
                                                <input
                                                    className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700"
                                                    value={color.code.toUpperCase()}
                                                    readOnly
                                                    onClick={() => copyToClipboard(color.code)}
                                                />
                                                <input
                                                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm"
                                                    placeholder="Tên màu (Primary, Secondary...)"
                                                    value={color.type}
                                                    onChange={(e) => handleColorChange(index, 'type', e.target.value)}
                                                />
                                                <button onClick={() => removeColor(index)} className="p-3 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={addColor} className="mt-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                                            <Plus size={16} /> Thêm màu
                                        </button>
                                    </div>
                                </div>

                                {/* Typography */}
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Type className="text-slate-400" /> Typography
                                    </h3>
                                    <input
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        placeholder="Tên Font chữ chủ đạo (VD: Inter, Roboto...)"
                                        value={editingBrand.identity.fontFamily}
                                        onChange={(e) => setEditingBrand({ ...editingBrand, identity: { ...editingBrand.identity, fontFamily: e.target.value } })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB: STRATEGY */}
                        {activeTab === 'strategy' && (
                            <div className="space-y-8 animate-fade-in">

                                {/* Vision & Mission (Text Areas) */}
                                {[
                                    { key: 'vision', label: 'Tầm nhìn (Vision)', ph: 'Mục tiêu dài hạn của thương hiệu...' },
                                    { key: 'mission', label: 'Sứ mệnh (Mission)', ph: 'Lý do thương hiệu tồn tại...' },
                                ].map((item) => (
                                    <div key={item.key} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-lg font-bold text-slate-800">{item.label}</label>
                                            <button
                                                onClick={() => handleAiGenerate(item.key, item.key, 'strategy', false)}
                                                disabled={isGenerating}
                                                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition-colors"
                                            >
                                                <Wand2 size={12} /> AI Writer
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed min-h-[100px] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                            placeholder={item.ph}
                                            value={(editingBrand.strategy as any)[item.key]}
                                            onChange={(e) => setEditingBrand({
                                                ...editingBrand,
                                                strategy: { ...editingBrand.strategy, [item.key]: e.target.value }
                                            })}
                                        />
                                    </div>
                                ))}

                                {/* Strategy Lists */}
                                <ListEditor
                                    items={editingBrand.strategy.coreValues}
                                    onAdd={() => addListItem('strategy', 'coreValues')}
                                    onUpdate={(idx, val) => updateListItem('strategy', 'coreValues', idx, val)}
                                    onRemove={(idx) => removeListItem('strategy', 'coreValues', idx)}
                                    onAiSuggest={() => handleAiGenerate("Giá trị cốt lõi", "coreValues", "strategy", true)}
                                    isGenerating={isGenerating}
                                    title="Giá trị Cốt lõi"
                                    placeholder="VD: Tận tâm, Sáng tạo..."
                                    icon={ListPlus}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ListEditor
                                        items={editingBrand.strategy.shortTermGoals}
                                        onAdd={() => addListItem('strategy', 'shortTermGoals')}
                                        onUpdate={(idx, val) => updateListItem('strategy', 'shortTermGoals', idx, val)}
                                        onRemove={(idx) => removeListItem('strategy', 'shortTermGoals', idx)}
                                        onAiSuggest={() => handleAiGenerate("Mục tiêu ngắn hạn", "shortTermGoals", "strategy", true)}
                                        isGenerating={isGenerating}
                                        title="Chiến lược Ngắn hạn"
                                        placeholder="Mục tiêu 6-12 tháng..."
                                        icon={Clock}
                                    />
                                    <ListEditor
                                        items={editingBrand.strategy.longTermGoals}
                                        onAdd={() => addListItem('strategy', 'longTermGoals')}
                                        onUpdate={(idx, val) => updateListItem('strategy', 'longTermGoals', idx, val)}
                                        onRemove={(idx) => removeListItem('strategy', 'longTermGoals', idx)}
                                        onAiSuggest={() => handleAiGenerate("Mục tiêu dài hạn", "longTermGoals", "strategy", true)}
                                        isGenerating={isGenerating}
                                        title="Chiến lược Dài hạn"
                                        placeholder="Mục tiêu 3-5 năm..."
                                        icon={Rocket}
                                    />
                                </div>

                                <ListEditor
                                    items={editingBrand.strategy.targetObjectives}
                                    onAdd={() => addListItem('strategy', 'targetObjectives')}
                                    onUpdate={(idx, val) => updateListItem('strategy', 'targetObjectives', idx, val)}
                                    onRemove={(idx) => removeListItem('strategy', 'targetObjectives', idx)}
                                    onAiSuggest={() => handleAiGenerate("Mục tiêu cụ thể", "targetObjectives", "strategy", true)}
                                    isGenerating={isGenerating}
                                    title="Mục tiêu Cụ thể (Objectives)"
                                    placeholder="VD: Đạt 1 triệu users..."
                                    icon={Target}
                                />

                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                    <label className="text-lg font-bold text-slate-800 mb-4 block">Giọng văn (Tone of Voice)</label>
                                    <input
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        placeholder="VD: Chuyên nghiệp, Thân thiện, Hài hước..."
                                        value={editingBrand.strategy.toneOfVoice}
                                        onChange={(e) => setEditingBrand({
                                            ...editingBrand,
                                            strategy: { ...editingBrand.strategy, toneOfVoice: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB: AUDIENCE */}
                        {activeTab === 'audience' && (
                            <div className="space-y-8 animate-fade-in">
                                <ListEditor
                                    items={editingBrand.audience.demographics}
                                    onAdd={() => addListItem('audience', 'demographics')}
                                    onUpdate={(idx, val) => updateListItem('audience', 'demographics', idx, val)}
                                    onRemove={(idx) => removeListItem('audience', 'demographics', idx)}
                                    onAiSuggest={() => handleAiGenerate("Nhân khẩu học", "demographics", "audience", true)}
                                    isGenerating={isGenerating}
                                    title="Nhân khẩu học (Demographics)"
                                    placeholder="Độ tuổi, giới tính, thu nhập, vị trí..."
                                    icon={Users}
                                />

                                <ListEditor
                                    items={editingBrand.audience.psychographics}
                                    onAdd={() => addListItem('audience', 'psychographics')}
                                    onUpdate={(idx, val) => updateListItem('audience', 'psychographics', idx, val)}
                                    onRemove={(idx) => removeListItem('audience', 'psychographics', idx)}
                                    onAiSuggest={() => handleAiGenerate("Tâm lý học hành vi", "psychographics", "audience", true)}
                                    isGenerating={isGenerating}
                                    title="Tâm lý học & Hành vi"
                                    placeholder="Sở thích, thói quen, lối sống..."
                                    icon={Target}
                                />

                                <ListEditor
                                    items={editingBrand.audience.painPoints}
                                    onAdd={() => addListItem('audience', 'painPoints')}
                                    onUpdate={(idx, val) => updateListItem('audience', 'painPoints', idx, val)}
                                    onRemove={(idx) => removeListItem('audience', 'painPoints', idx)}
                                    onAiSuggest={() => handleAiGenerate("Nỗi đau khách hàng", "painPoints", "audience", true)}
                                    isGenerating={isGenerating}
                                    title="Nỗi đau khách hàng (Pain Points)"
                                    placeholder="Vấn đề họ gặp phải..."
                                    icon={LayoutList}
                                />
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default BrandVault;