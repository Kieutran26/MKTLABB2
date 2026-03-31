import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldCheck, Image as ImageIcon, Palette, Type, Users, Target, Rocket, Wand2, ChevronLeft, Save, ListPlus, LayoutList, Clock } from 'lucide-react';
import { useBrand } from './BrandContext';
import { Brand, BrandColor, BrandLogo } from '../types';
import { Toast, ToastType } from './Toast';
import { getGeminiClient } from '../lib/geminiClient';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const textareaClass = `${inputClass} resize-none`;

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
    <div className={`${cardClass} p-6 md:p-8`}>
        <div className="mb-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                {Icon && <Icon className="text-stone-400" size={20} strokeWidth={1.25} />} {title}
            </label>
            <button
                type="button"
                onClick={onAiSuggest}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80 disabled:opacity-50"
            >
                <Wand2 size={12} strokeWidth={1.25} /> AI Suggest
            </button>
        </div>
        <div className="space-y-2">
            {items.map((item, idx) => (
                <div key={idx} className="group flex gap-2">
                    <div className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-500">
                        {idx + 1}
                    </div>
                    <textarea
                        className={`${textareaClass} h-[46px] min-h-[46px]`}
                        value={item}
                        onChange={(e) => onUpdate(idx, e.target.value)}
                        placeholder={placeholder}
                    />
                    <button
                        type="button"
                        onClick={() => onRemove(idx)}
                        className="h-[46px] rounded-lg p-2 text-stone-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    >
                        <Trash2 size={16} strokeWidth={1.25} />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={onAdd}
                className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-800"
            >
                <Plus size={16} strokeWidth={1.25} /> Thêm ý mới
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
        const ai = getGeminiClient();
        if (!ai) {
            showToast('Thêm VITE_GEMINI_API_KEY vào .env.local (Google AI Studio).', 'error');
            return;
        }
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
            <div className="min-h-full bg-[#FCFDFC] font-sans pb-20">
                <header className="border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:px-8">
                    <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-2 flex items-center gap-2 text-stone-400">
                                <ShieldCheck size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                    Brand system
                                </span>
                            </div>
                            <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                                Brand Vault
                            </h1>
                            <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                                Quản lý tài sản và hồ sơ đa thương hiệu.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCreateNew}
                            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                        >
                            <Plus size={18} strokeWidth={1.25} /> Thêm Thương hiệu
                        </button>
                    </div>
                </header>

                <div className="mx-auto max-w-6xl px-5 pt-8 md:px-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {brands.length === 0 ? (
                            <div className={`${cardClass} col-span-full flex min-h-[320px] flex-col items-center justify-center p-12 text-center md:p-16`}>
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                    <ShieldCheck size={28} strokeWidth={1.25} className="text-stone-300" />
                                </div>
                                <p className="text-base font-medium text-stone-700">Chưa có thương hiệu nào</p>
                                <p className="mt-1 max-w-sm text-sm font-normal text-stone-500">
                                    Tạo hồ sơ đầu tiên để lưu logo, màu sắc và chiến lược thương hiệu.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleCreateNew}
                                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                                >
                                    Tạo hồ sơ đầu tiên
                                    <span aria-hidden className="text-stone-400">→</span>
                                </button>
                            </div>
                        ) : (
                            brands.map(brand => {
                                const displayLogo = brand.identity.logos?.[0]?.url || brand.identity.logoMain;

                                return (
                                    <div
                                        key={brand.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleEdit(brand)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEdit(brand)}
                                        className={`${cardClass} group relative flex cursor-pointer flex-col overflow-hidden p-6 transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]`}
                                    >
                                        <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(e, brand.id)}
                                                className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 size={18} strokeWidth={1.25} />
                                            </button>
                                        </div>

                                        <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-stone-100 bg-stone-50/80">
                                            {displayLogo ? (
                                                <img src={displayLogo} alt="Logo" className="h-full w-full object-cover" />
                                            ) : (
                                                <ShieldCheck size={28} className="text-stone-300" strokeWidth={1.25} />
                                            )}
                                        </div>
                                        <h3 className="mb-1 text-lg font-medium tracking-tight text-stone-900">{brand.identity.name}</h3>
                                        <p className="mb-4 line-clamp-2 h-10 text-sm font-normal text-stone-500">
                                            {brand.strategy.vision || 'Chưa có thông tin chiến lược.'}
                                        </p>

                                        <div className="mt-auto flex gap-2">
                                            {brand.identity.colors.slice(0, 4).map((c, i) => (
                                                <div
                                                    key={i}
                                                    className="h-6 w-6 rounded-full border border-stone-200 shadow-sm"
                                                    style={{ backgroundColor: c.code }}
                                                    title={c.type}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // EDIT VIEW
    if (!editingBrand) return null;

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <div className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-stone-200/70 bg-[#FCFDFC] px-4 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100/80 hover:text-stone-800"
                        aria-label="Quay lại danh sách"
                    >
                        <ChevronLeft size={22} strokeWidth={1.25} />
                    </button>
                    <input
                        className="min-w-0 max-w-[min(100%,20rem)] border-none bg-transparent font-sans text-lg font-medium tracking-tight text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-0 md:max-w-md"
                        value={editingBrand.identity.name}
                        onChange={(e) => setEditingBrand({ ...editingBrand, identity: { ...editingBrand.identity, name: e.target.value } })}
                        placeholder="Tên thương hiệu..."
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 md:px-5 md:py-2.5"
                >
                    <Save size={17} strokeWidth={1.25} /> {isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="flex w-60 shrink-0 flex-col border-r border-stone-200/80 bg-white pt-4 md:w-64">
                    {[
                        { id: 'identity', label: 'Visual Identity', icon: Palette },
                        { id: 'strategy', label: 'Chiến lược', icon: Rocket },
                        { id: 'audience', label: 'Thị trường', icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as 'identity' | 'strategy' | 'audience')}
                            className={`flex items-center gap-3 border-l-[3px] px-5 py-3.5 text-left text-sm transition-all md:px-6 md:py-4
                                ${activeTab === tab.id
                                    ? 'border-stone-900 bg-stone-50/80 font-medium text-stone-900'
                                    : 'border-transparent font-normal text-stone-500 hover:bg-stone-50/50 hover:text-stone-800'}`}
                        >
                            <tab.icon size={19} strokeWidth={1.25} className="shrink-0 text-stone-400" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">

                        {/* TAB: IDENTITY */}
                        {activeTab === 'identity' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Logos */}
                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h3 className="mb-6 flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                                        <ImageIcon className="text-stone-400" size={20} strokeWidth={1.25} /> Thư viện Logo
                                    </h3>

                                    <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                                        {editingBrand.identity.logos.map((logo) => (
                                            <div key={logo.id} className="group relative">
                                                <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 p-4 text-center transition-colors hover:border-stone-300 hover:bg-stone-50/80">
                                                    {logo.url ? (
                                                        <img src={logo.url} className="max-w-full max-h-full object-contain" alt={logo.variantName} />
                                                    ) : (
                                                        <div className="pointer-events-none flex flex-col items-center text-stone-400">
                                                            <ImageIcon size={28} strokeWidth={1.25} className="mb-2" />
                                                            <span className="text-xs font-normal">Click để tải ảnh</span>
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
                                                        type="button"
                                                        onClick={() => removeLogo(logo.id)}
                                                        className="absolute right-2 top-2 z-20 rounded-full bg-white p-1.5 text-stone-400 opacity-0 shadow-sm transition-opacity hover:text-rose-600 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={14} strokeWidth={1.25} />
                                                    </button>
                                                </div>
                                                <input
                                                    className="mt-2 w-full rounded-lg border border-transparent bg-transparent px-2 text-center text-sm font-medium text-stone-700 hover:border-stone-200 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                                    value={logo.variantName}
                                                    onChange={(e) => updateLogoName(logo.id, e.target.value)}
                                                    placeholder="Tên phiên bản..."
                                                />
                                            </div>
                                        ))}

                                        {/* Add New Logo Button */}
                                        <button
                                            type="button"
                                            onClick={addLogoVariant}
                                            className="group flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white p-4 text-center text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                                        >
                                            <Plus size={28} strokeWidth={1.25} className="mb-2 transition-transform group-hover:scale-105" />
                                            <span className="text-sm font-medium">Thêm Logo</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Colors */}
                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h3 className="mb-6 flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                                        <Palette className="text-stone-400" size={20} strokeWidth={1.25} /> Bảng màu (Color Palette)
                                    </h3>
                                    <div className="space-y-3">
                                        {editingBrand.identity.colors.map((color, index) => (
                                            <div key={index} className="group flex items-center gap-4">
                                                <div className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-stone-200 shadow-sm transition-transform hover:scale-105">
                                                    <div className="absolute inset-0" style={{ backgroundColor: color.code }}></div>
                                                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={color.code} onChange={(e) => handleColorChange(index, 'code', e.target.value)} />
                                                </div>
                                                <input
                                                    className="w-32 cursor-pointer rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm font-medium text-stone-800"
                                                    value={color.code.toUpperCase()}
                                                    readOnly
                                                    onClick={() => copyToClipboard(color.code)}
                                                />
                                                <input
                                                    className={inputClass}
                                                    placeholder="Tên màu (Primary, Secondary...)"
                                                    value={color.type}
                                                    onChange={(e) => handleColorChange(index, 'type', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeColor(index)}
                                                    className="rounded-xl p-3 text-stone-300 opacity-0 transition-colors hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} strokeWidth={1.25} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addColor}
                                            className="mt-2 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                                        >
                                            <Plus size={16} strokeWidth={1.25} /> Thêm màu
                                        </button>
                                    </div>
                                </div>

                                {/* Typography */}
                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <h3 className="mb-6 flex items-center gap-2 text-base font-medium tracking-tight text-stone-900">
                                        <Type className="text-stone-400" size={20} strokeWidth={1.25} /> Typography
                                    </h3>
                                    <input
                                        className={inputClass}
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
                                    <div key={item.key} className={`${cardClass} p-6 md:p-8`}>
                                        <div className="mb-4 flex items-center justify-between">
                                            <label className="text-base font-medium tracking-tight text-stone-900">{item.label}</label>
                                            <button
                                                type="button"
                                                onClick={() => handleAiGenerate(item.key, item.key, 'strategy', false)}
                                                disabled={isGenerating}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80 disabled:opacity-50"
                                            >
                                                <Wand2 size={12} strokeWidth={1.25} /> AI Writer
                                            </button>
                                        </div>
                                        <textarea
                                            className={`${textareaClass} min-h-[100px] leading-relaxed`}
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

                                <div className={`${cardClass} p-6 md:p-8`}>
                                    <label className="mb-4 block text-base font-medium tracking-tight text-stone-900">Giọng văn (Tone of Voice)</label>
                                    <input
                                        className={inputClass}
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