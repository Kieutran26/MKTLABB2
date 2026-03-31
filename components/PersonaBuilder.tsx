import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, ChevronLeft, Sliders, Target, Frown, Heart, MessageSquare, Users, Eye } from 'lucide-react';
import { Persona, PersonalityTrait } from '../types';
import { StorageService } from '../services/storageService';
import { useBrand } from './BrandContext';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const textareaClass = `${inputClass} resize-none`;

const DEFAULT_TRAITS: PersonalityTrait[] = [
    { leftLabel: 'Hướng nội', rightLabel: 'Hướng ngoại', value: 50 },
    { leftLabel: 'Cảm tính', rightLabel: 'Lý trí', value: 50 },
    { leftLabel: 'Tiết kiệm', rightLabel: 'Hào phóng', value: 50 },
    { leftLabel: 'Truyền thống', rightLabel: 'Hiện đại', value: 50 },
];

const DEFAULT_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Caitlyn',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Eliza',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka'
];

// Extract Slider to avoid re-rendering parent on every move
const PersonalitySliderDisplay: React.FC<{
    trait: PersonalityTrait;
    isEditing: boolean;
    onChange?: (val: number) => void;
}> = ({ trait, isEditing, onChange }) => {
    const getColor = (val: number) => {
        if (val < 30) return 'bg-stone-800';
        if (val < 70) return 'bg-stone-500';
        return 'bg-stone-900';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) onChange(Number(e.target.value));
    };

    return (
        <div className="mb-4">
            <div className="mb-2 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                <span>{trait.leftLabel}</span>
                <span>{trait.rightLabel}</span>
            </div>
            <div className="flex items-center gap-3">
                {isEditing ? (
                    <input
                        type="range"
                        min="0" max="100"
                        value={trait.value}
                        onChange={handleChange}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-stone-800 bg-stone-200"
                    />
                ) : (
                    <div className="relative h-2 w-full overflow-hidden rounded-lg bg-stone-200">
                        <div
                            className={`absolute top-0 left-0 h-full rounded-lg ${getColor(trait.value)}`}
                            style={{ width: `${trait.value}%` }}
                        />
                        <div
                            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-stone-400 bg-white shadow-sm"
                            style={{ left: `${trait.value}%`, marginLeft: '-6px' }}
                        />
                    </div>
                )}
                <div className={`w-9 shrink-0 rounded-lg py-1 text-center text-xs font-semibold ${isEditing ? 'bg-stone-100 text-stone-700' : 'text-stone-500'}`}>
                    {trait.value}
                </div>
            </div>
        </div>
    );
};

const PersonaBuilder: React.FC = () => {
    const { currentBrand } = useBrand();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'detail' | 'edit'>('list');
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
    const [viewingPersona, setViewingPersona] = useState<Persona | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Manual Brand State
    const [useManualBrand, setUseManualBrand] = useState(false);

    useEffect(() => {
        refreshPersonas();
    }, [currentBrand]);

    const refreshPersonas = () => {
        const allPersonas = StorageService.getPersonas();
        if (currentBrand) {
            const brandPersonas = allPersonas.filter(p => p.brandId === currentBrand.id);
            const manualPersonas = allPersonas.filter(p => p.brandId === 'manual');
            setPersonas([...brandPersonas, ...manualPersonas]);
        } else {
            setPersonas(allPersonas);
        }
    };

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const handleCreateNew = () => {
        const brandId = useManualBrand ? 'manual' : (currentBrand?.id || 'manual');
        const newPersona: Persona = {
            id: Date.now().toString(),
            brandId: brandId,
            fullname: 'New Persona',
            avatarUrl: DEFAULT_AVATARS[0],
            ageRange: '25-34',
            jobTitle: '',
            bio: '',
            goals: [],
            frustrations: [],
            motivations: [],
            preferredChannels: [],
            personality: JSON.parse(JSON.stringify(DEFAULT_TRAITS)),
            createdAt: Date.now()
        };
        setEditingPersona(newPersona);
        setViewMode('edit');
    };

    const handleEdit = (persona: Persona) => {
        setEditingPersona({ ...persona });
        setViewingPersona(null);
        setViewMode('edit');
        if (persona.brandId === 'manual') {
            setUseManualBrand(true);
        } else {
            setUseManualBrand(false);
        }
    };

    const handleView = (persona: Persona) => {
        setViewingPersona(persona);
        setViewMode('detail');
    };

    const handleSave = () => {
        if (!editingPersona) return;
        if (!editingPersona.fullname.trim()) {
            showToast("Vui lòng nhập tên Persona", "error");
            return;
        }

        const finalPersona = {
            ...editingPersona,
            brandId: useManualBrand ? 'manual' : (currentBrand?.id || 'manual')
        };

        StorageService.savePersona(finalPersona);
        refreshPersonas();
        setViewMode('list');
        showToast("Đã lưu Persona thành công", "success");
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa hồ sơ khách hàng này?")) {
            StorageService.deletePersona(id);
            refreshPersonas();
            if (viewingPersona?.id === id) {
                setViewMode('list');
                setViewingPersona(null);
            }
            showToast("Đã xóa Persona", "success");
        }
    };

    const handleSliderChange = useCallback((index: number, value: number) => {
        setEditingPersona(prev => {
            if (!prev) return null;
            const newPersonality = [...prev.personality];
            newPersonality[index] = { ...newPersonality[index], value };
            return { ...prev, personality: newPersonality };
        });
    }, []);

    // --- Helper Components ---
    const ListInput: React.FC<{
        items: string[];
        onChange: (items: string[]) => void;
        placeholder: string;
        icon: React.ElementType;
        colorClass: string;
    }> = ({ items, onChange, placeholder, icon: Icon, colorClass }) => {
        const addItem = () => onChange([...items, '']);
        const updateItem = (idx: number, val: string) => {
            const newItems = [...items];
            newItems[idx] = val;
            onChange(newItems);
        };
        const removeItem = (idx: number) => {
            onChange(items.filter((_: string, i: number) => i !== idx));
        };

        return (
            <div className="space-y-2">
                {items.map((item: string, idx: number) => (
                    <div key={idx} className="group flex gap-2">
                        <div className={`mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
                            <Icon size={14} strokeWidth={1.25} />
                        </div>
                        <input
                            className={inputClass}
                            value={item}
                            onChange={e => updateItem(idx, e.target.value)}
                            placeholder={placeholder}
                        />
                        <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="mt-2 rounded-lg px-2 text-stone-300 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                        >
                            <Trash2 size={14} strokeWidth={1.25} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addItem}
                    className="mt-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-800"
                >
                    <Plus size={12} strokeWidth={1.25} /> Thêm dòng
                </button>
            </div>
        );
    };

    // ========================
    // LIST VIEW
    // ========================
    if (viewMode === 'list') {
        return (
            <div className="min-h-full bg-[#FCFDFC] font-sans pb-20">
                <header className="border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-2 flex items-center gap-2 text-stone-400">
                                <Users size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                    Customer Profile
                                </span>
                            </div>
                            <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                                Persona Builder
                            </h1>
                            <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                                Xây dựng chân dung khách hàng cho thương hiệu.
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                <input
                                    type="checkbox"
                                    id="manualBrand"
                                    checked={useManualBrand}
                                    onChange={(e) => setUseManualBrand(e.target.checked)}
                                    className="h-4 w-4 rounded border-stone-300 text-stone-800 focus:ring-stone-200/80"
                                />
                                <label htmlFor="manualBrand" className="cursor-pointer text-sm font-medium text-stone-600">Chế độ thủ công</label>
                            </label>
                            {!useManualBrand && (
                                <div className="rounded-full border border-stone-200 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                    <BrandSelector />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleCreateNew}
                                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                            >
                                <Plus size={18} strokeWidth={1.25} /> Thêm Persona
                            </button>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {personas.length === 0 ? (
                            <div className={`${cardClass} col-span-full flex min-h-[320px] flex-col items-center justify-center p-12 text-center md:p-16`}>
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                    <Users size={28} strokeWidth={1.25} className="text-stone-300" />
                                </div>
                                <p className="text-base font-medium text-stone-700">Chưa có hồ sơ khách hàng nào.</p>
                                <p className="mt-1 max-w-sm text-sm font-normal text-stone-500">
                                    Tạo hồ sơ đầu tiên để xây dựng chân dung khách hàng mục tiêu.
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
                            personas.map(persona => (
                                <div
                                    key={persona.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleView(persona)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleView(persona)}
                                    className={`${cardClass} group relative flex cursor-pointer flex-col items-center overflow-hidden p-6 text-center transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]`}
                                >
                                    {persona.brandId === 'manual' && (
                                        <span className="absolute left-4 top-4 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500 ring-1 ring-stone-200">
                                            Manual
                                        </span>
                                    )}

                                    <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-stone-100 bg-stone-50 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-transform duration-300 group-hover:scale-105">
                                        <img src={persona.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                    </div>

                                    <h3 className="mb-1 text-base font-medium tracking-tight text-stone-900">{persona.fullname}</h3>
                                    <p className="mb-1 text-sm font-normal text-stone-600">{persona.jobTitle || <span className="italic text-stone-400">Chưa có chức danh</span>}</p>
                                    <span className="mb-4 rounded-md bg-stone-50 px-2 py-1 text-xs font-medium text-stone-500">{persona.ageRange} tuổi</span>

                                    <div className="mt-auto w-full border-t border-stone-100 pt-4 text-left">
                                        <p className="line-clamp-3 text-xs font-normal italic text-stone-500">
                                            &ldquo;{persona.bio || 'Chưa có tiểu sử…'}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ========================
    // DETAIL VIEW (Full Page)
    // ========================
    if (viewMode === 'detail' && viewingPersona) {
        return (
            <div className="flex min-h-full flex-col bg-[#FCFDFC] font-sans pb-20">
                <header className="border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-4 md:px-8">
                    <div className="mx-auto flex max-w-6xl items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100/80 hover:text-stone-800"
                                aria-label="Quay lại"
                            >
                                <ChevronLeft size={22} strokeWidth={1.25} />
                            </button>
                            <div>
                                <h1 className="font-sans text-lg font-medium tracking-tight text-stone-900">
                                    {viewingPersona.fullname}
                                </h1>
                                <p className="text-xs font-normal text-stone-500">{viewingPersona.jobTitle} · {viewingPersona.ageRange} tuổi</p>
                            </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <button
                                type="button"
                                onClick={() => handleEdit(viewingPersona)}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                            >
                                <Eye size={16} strokeWidth={1.25} /> Chỉnh sửa
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleDelete(e, viewingPersona.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                                <Trash2 size={16} strokeWidth={1.25} /> Xóa
                            </button>
                        </div>
                    </div>
                </header>

                <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* LEFT: Identity Card */}
                        <div className="lg:col-span-4">
                            <div className={`${cardClass} p-6 md:p-8`}>
                                <div className="mb-6 flex flex-col items-center text-center">
                                    <div className="mb-4 h-28 w-28 overflow-hidden rounded-2xl border-4 border-stone-100 bg-stone-50 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                                        <img src={viewingPersona.avatarUrl} className="h-full w-full object-cover" alt="Avatar" />
                                    </div>
                                    <h2 className="text-xl font-medium tracking-tight text-stone-900">{viewingPersona.fullname}</h2>
                                    <p className="text-sm font-normal text-stone-600">{viewingPersona.jobTitle}</p>
                                    <span className="mt-1 rounded-md bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-500">{viewingPersona.ageRange} tuổi</span>
                                </div>

                                <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4 text-sm italic leading-relaxed text-stone-700">
                                    &ldquo;{viewingPersona.bio || 'Chưa có tiểu sử…'}&rdquo;
                                </div>
                            </div>

                            {/* Personality */}
                            <div className={`${cardClass} mt-6 p-6 md:p-8`}>
                                <h3 className="mb-5 flex items-center gap-2 border-b border-stone-100 pb-3 text-base font-medium tracking-tight text-stone-900">
                                    <Sliders size={18} strokeWidth={1.25} className="text-stone-400" /> Tính cách
                                </h3>
                                <div className="space-y-2">
                                    {viewingPersona.personality.map((trait, idx) => (
                                        <PersonalitySliderDisplay key={idx} trait={trait} isEditing={false} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Psychographics */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className={`${cardClass} p-6 md:p-8`}>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                                            <Target size={16} strokeWidth={1.25} className="text-stone-400" /> Mục tiêu & Mong muốn
                                        </h4>
                                        {viewingPersona.goals.length > 0 ? (
                                            <ul className="space-y-1.5">
                                                {viewingPersona.goals.map((g, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                                        {g}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm italic text-stone-400">Chưa nhập</p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                                            <Frown size={16} strokeWidth={1.25} className="text-stone-400" /> Nỗi đau & Thách thức
                                        </h4>
                                        {viewingPersona.frustrations.length > 0 ? (
                                            <ul className="space-y-1.5">
                                                {viewingPersona.frustrations.map((g, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                                                        {g}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm italic text-stone-400">Chưa nhập</p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                                            <Heart size={16} strokeWidth={1.25} className="text-stone-400" /> Động lực mua hàng
                                        </h4>
                                        {viewingPersona.motivations.length > 0 ? (
                                            <ul className="space-y-1.5">
                                                {viewingPersona.motivations.map((g, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                                        {g}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm italic text-stone-400">Chưa nhập</p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                                            <MessageSquare size={16} strokeWidth={1.25} className="text-stone-400" /> Kênh tiếp cận
                                        </h4>
                                        {viewingPersona.preferredChannels.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {viewingPersona.preferredChannels.map((g, i) => (
                                                    <span key={i} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm italic text-stone-400">Chưa nhập</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================
    // EDIT MODE
    // ========================
    if (!editingPersona) return null;

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <div className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-stone-200/70 bg-[#FCFDFC] px-4 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100/80 hover:text-stone-800"
                        aria-label="Quay lại"
                    >
                        <ChevronLeft size={22} strokeWidth={1.25} />
                    </button>
                    <h2 className="min-w-0 truncate text-lg font-medium tracking-tight text-stone-900">
                        {editingPersona.id ? 'Chỉnh sửa Persona' : 'Tạo Persona Mới'}
                        {useManualBrand && (
                            <span className="ml-2 rounded px-2 py-0.5 text-xs font-normal normal-case tracking-normal text-stone-500 ring-1 ring-stone-200">
                                Thủ công
                            </span>
                        )}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 md:px-5 md:py-2.5"
                >
                    <Save size={17} strokeWidth={1.25} /> Lưu hồ sơ
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12">

                    {/* LEFT COL: Identity & Bio */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className={`${cardClass} p-6 text-center md:p-8`}>
                            <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-2xl border-4 border-stone-100 bg-stone-50 shadow-[0_1px_2px_rgba(15,23,42,0.05)] relative group">
                                <img src={editingPersona.avatarUrl} className="h-full w-full object-cover" alt="Avatar" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                                    <div className="grid grid-cols-4 gap-1 p-2">
                                        {DEFAULT_AVATARS.map((url, i) => (
                                            <div
                                                key={i}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setEditingPersona({ ...editingPersona, avatarUrl: url })}
                                                onKeyDown={(e) => e.key === 'Enter' && setEditingPersona({ ...editingPersona, avatarUrl: url })}
                                                className="h-6 w-6 overflow-hidden rounded-full border-2 border-white/50 transition-transform hover:scale-125"
                                            >
                                                <img src={url} className="h-full w-full" alt="" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 text-left">
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Họ và tên</label>
                                    <input
                                        className={inputClass}
                                        value={editingPersona.fullname}
                                        onChange={e => setEditingPersona({ ...editingPersona, fullname: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Chức danh / Nghề nghiệp</label>
                                    <input
                                        className={inputClass}
                                        value={editingPersona.jobTitle}
                                        onChange={e => setEditingPersona({ ...editingPersona, jobTitle: e.target.value })}
                                        placeholder="VD: Marketing Manager, Startup Founder…"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Độ tuổi</label>
                                    <input
                                        className={inputClass}
                                        value={editingPersona.ageRange}
                                        onChange={e => setEditingPersona({ ...editingPersona, ageRange: e.target.value })}
                                        placeholder="VD: 25-34"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Tiểu sử / Câu chuyện</label>
                                    <textarea
                                        className={`${textareaClass} leading-relaxed`}
                                        rows={4}
                                        value={editingPersona.bio}
                                        onChange={e => setEditingPersona({ ...editingPersona, bio: e.target.value })}
                                        placeholder="Mô tả ngắn về cuộc sống, hoàn cảnh…"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personality Sliders */}
                        <div className={`${cardClass} p-6 md:p-8`}>
                            <h3 className="mb-5 flex items-center gap-2 border-b border-stone-100 pb-3 text-base font-medium tracking-tight text-stone-900">
                                <Sliders size={18} strokeWidth={1.25} className="text-stone-400" /> Tính cách
                            </h3>
                            <div className="space-y-2">
                                {editingPersona.personality.map((trait, idx) => (
                                    <PersonalitySliderDisplay
                                        key={idx}
                                        trait={trait}
                                        isEditing={true}
                                        onChange={(val) => handleSliderChange(idx, val)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: Psychographics */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-900">
                                    <Target size={16} strokeWidth={1.25} className="text-stone-400" /> Mục tiêu & Mong muốn
                                </h3>
                                <ListInput
                                    items={editingPersona.goals}
                                    onChange={(val: string[]) => setEditingPersona({ ...editingPersona, goals: val })}
                                    placeholder="Họ muốn đạt được gì…"
                                    icon={Target}
                                    colorClass="text-stone-600 bg-stone-600"
                                />
                            </div>

                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-900">
                                    <Frown size={16} strokeWidth={1.25} className="text-stone-400" /> Nỗi đau & Thách thức
                                </h3>
                                <ListInput
                                    items={editingPersona.frustrations}
                                    onChange={(val: string[]) => setEditingPersona({ ...editingPersona, frustrations: val })}
                                    placeholder="Điều gì làm họ khó chịu…"
                                    icon={Frown}
                                    colorClass="text-stone-600 bg-stone-600"
                                />
                            </div>

                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-900">
                                    <Heart size={16} strokeWidth={1.25} className="text-stone-400" /> Động lực mua hàng
                                </h3>
                                <ListInput
                                    items={editingPersona.motivations}
                                    onChange={(val: string[]) => setEditingPersona({ ...editingPersona, motivations: val })}
                                    placeholder="Giá cả, Chất lượng, hay Tốc độ…"
                                    icon={Heart}
                                    colorClass="text-stone-600 bg-stone-600"
                                />
                            </div>

                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-900">
                                    <MessageSquare size={16} strokeWidth={1.25} className="text-stone-400" /> Kênh tiếp cận
                                </h3>
                                <ListInput
                                    items={editingPersona.preferredChannels}
                                    onChange={(val: string[]) => setEditingPersona({ ...editingPersona, preferredChannels: val })}
                                    placeholder="Facebook, Email, TikTok…"
                                    icon={MessageSquare}
                                    colorClass="text-stone-600 bg-stone-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

// Helper to extract context for AI
export const getPersonaContext = (persona: Persona): string => {
    if (!persona) return "";

    const traits = persona.personality.map(p => {
        if (p.value < 40) return p.leftLabel;
        if (p.value > 60) return p.rightLabel;
        return "";
    }).filter(s => s).join(", ");

    return `
    TARGET AUDIENCE PERSONA:
    - Name: ${persona.fullname} (${persona.ageRange}), ${persona.jobTitle}
    - Bio: ${persona.bio}
    - Goals: ${persona.goals.join(", ")}
    - Pain Points: ${persona.frustrations.join(", ")}
    - Key Motivations: ${persona.motivations.join(", ")}
    - Personality Traits: ${traits}
    - Preferred Channels: ${persona.preferredChannels.join(", ")}
    `;
};

export default PersonaBuilder;
