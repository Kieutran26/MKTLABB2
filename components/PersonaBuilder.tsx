import React, { useState, useEffect, useCallback } from 'react';
import {Plus, Trash2, Save, ChevronLeft, Sliders, Target, Frown, Heart, MessageSquare, Users, Eye, Diamond, Lock, Check, ChevronRight, Pencil} from 'lucide-react';
import { Persona, PersonalityTrait } from '../types';
import { StorageService } from '../services/storageService';
import { useBrand } from './BrandContext';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import FeatureHeader from './FeatureHeader';
import BrandVaultUpsellCard from './BrandVaultUpsellCard';
import {
    WS_PRIMARY_CTA_AUTO,
    WS_SEGMENT_SHELL,
    wsWorkspaceTabClass,
} from './workspace-toolbar-classes';

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';
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
                    <input type="range" min="0" max="100" value={trait.value} onChange={handleChange} className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-stone-800 bg-stone-200" />
                ) : (
                    <div className="relative h-2 w-full overflow-hidden rounded-lg bg-stone-200">
                        <div className={`absolute top-0 left-0 h-full rounded-lg ${getColor(trait.value)}`} style={{ width: `${trait.value}%` }} />
                        <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-stone-400 bg-white shadow-sm" style={{ left: `${trait.value}%`, marginLeft: '-6px' }} />
                    </div>
                )}
                <div className={`w-9 shrink-0 rounded-lg py-1 text-center text-xs font-semibold ${isEditing ? 'bg-stone-100 text-stone-700' : 'text-stone-500'}`}>{trait.value}</div>
            </div>
        </div>
    );
};

const PersonaBuilder: React.FC = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'detail' | 'edit'>('list');
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
    const [viewingPersona, setViewingPersona] = useState<Persona | null>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUserData();
    }, [user]);

    useEffect(() => {
        refreshPersonas();
    }, [activeTab, currentBrand]);

    const refreshPersonas = () => {
        const allPersonas = StorageService.getPersonas();
        if (activeTab === 'vault' && currentBrand) {
            const brandPersonas = allPersonas.filter(p => p.brandId === currentBrand.id);
            setPersonas(brandPersonas);
        } else {
            const manualPersonas = allPersonas.filter(p => p.brandId === 'manual');
            setPersonas(manualPersonas);
        }
    };

    const showToast = (message: string, type: ToastType = 'info') => setToast({ message, type });

    const handleCreateNew = () => {
        const brandId = activeTab === 'manual' ? 'manual' : (currentBrand?.id || 'manual');
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

    const handleView = (persona: Persona) => {
        setViewingPersona(persona);
        setViewMode('detail');
    };

    const handleEdit = (persona: Persona) => {
        setEditingPersona({ ...persona });
        setViewingPersona(null);
        setViewMode('edit');
    };

    const handleSave = () => {
        if (!editingPersona) return;
        if (!editingPersona.fullname.trim()) {
            showToast("Vui lòng nhập tên Persona", "error");
            return;
        }
        StorageService.savePersona(editingPersona);
        refreshPersonas();
        setViewMode('list');
        showToast("Đã lưu Persona thành công", "success");
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa hồ sơ khách hàng này?")) {
            StorageService.deletePersona(id);
            refreshPersonas();
            setViewMode('list');
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
        const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));

        return (
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="group flex gap-2">
                        <div className={`mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass} bg-opacity-10`}>
                            <Icon size={14} />
                        </div>
                        <input className={inputClass} value={item} onChange={e => updateItem(idx, e.target.value)} placeholder={placeholder} />
                        <button onClick={() => removeItem(idx)} className="mt-2 text-stone-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                    </div>
                ))}
                <button onClick={addItem} className="text-xs text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"><Plus size={12} /> Thêm dòng</button>
            </div>
        );
    };

    if (viewMode === 'list') {
        return (
            <div className="min-h-full bg-[#FCFDFC] font-sans">
                <FeatureHeader
                    icon={Users}
                    eyebrow="AUDIENCE INSIGHTS & PERSONA DESIGN"
                    title="Persona Builder"
                    subline="Vẽ chân dung khách hàng mục tiêu bằng AI Insight."
                >
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
                        onClick={handleCreateNew}
                        className={WS_PRIMARY_CTA_AUTO}
                    >
                        <Plus size={18} strokeWidth={2.5} /> Thêm Persona
                    </button>
                </FeatureHeader>

                <div className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="mx-auto w-full max-w-[1180px] p-4 md:p-6">
                            <BrandVaultUpsellCard
                                title="Persona từ Brand Vault"
                                description="AI sẽ tự động phác họa chân dung khách hàng dựa trên dữ liệu sản phẩm và DNA thương hiệu của bạn."
                                benefits={[
                                    "Phân tích tâm lý học chuyên sâu",
                                    "Dự báo hành vi mua hàng chính xác",
                                    "Gợi ý thông điệp cá nhân hóa",
                                    "Xác định kênh truyền thông tiềm năng"
                                ]}
                            />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'vault' && (
                                <div className="mb-8 p-6 rounded-2xl border border-stone-200 bg-white shadow-sm">
                                     <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-400">Chọn thương hiệu từ Vault</h2>
                                     <BrandSelector />
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {personas.length === 0 ? (
                                    <div className={`${cardClass} col-span-full flex min-h-[320px] flex-col items-center justify-center p-12 text-center`}>
                                        <Users size={48} strokeWidth={1} className="mb-4 text-stone-300" />
                                        <p className="text-base font-medium text-stone-700 uppercase tracking-widest">Chưa có Persona nào</p>
                                        <button onClick={handleCreateNew} className="mt-6 text-sm font-medium text-stone-900 underline underline-offset-4">Tạo hồ sơ đầu tiên →</button>
                                    </div>
                                ) : (
                                    personas.map(persona => (
                                        <div key={persona.id} onClick={() => handleView(persona)} className={`${cardClass} group flex flex-col items-center p-6 text-center cursor-pointer hover:border-stone-400 transition-all`}>
                                            <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-stone-100 shadow-sm"><img src={persona.avatarUrl} className="h-full w-full object-cover" /></div>
                                            <h3 className="font-medium text-stone-900">{persona.fullname}</h3>
                                            <p className="text-sm text-stone-600 mb-4">{persona.jobTitle || 'Nghề nghiệp tự do'}</p>
                                            <p className="text-xs text-stone-400 italic line-clamp-2">&ldquo;{persona.bio || 'Tiểu sử đang cập nhật…'}&rdquo;</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (viewMode === 'detail' && viewingPersona) {
        return (
            <div className="flex h-full flex-col bg-[#FCFDFC] font-sans">
                <header className="border-b border-stone-200 px-5 py-4">
                    <div className="mx-auto flex max-w-6xl items-center justify-between">
                        <button onClick={() => setViewMode('list')} className="flex items-center gap-2 text-stone-500 hover:text-stone-900"><ChevronLeft size={20} /> Quay lại</button>
                        <div className="flex gap-2">
                             <button onClick={() => handleEdit(viewingPersona)} className="px-4 py-2 rounded-full border border-stone-200 text-sm font-medium hover:bg-stone-50">Sửa</button>
                             <button onClick={(e) => handleDelete(e, viewingPersona.id)} className="px-4 py-2 rounded-full border border-stone-200 text-sm font-medium hover:bg-rose-50 hover:text-rose-600">Xóa</button>
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8 mx-auto w-full max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-6">
                            <div className={`${cardClass} p-8 text-center`}>
                                <img src={viewingPersona.avatarUrl} className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-stone-50 shadow-sm" />
                                <h2 className="text-xl font-medium">{viewingPersona.fullname}</h2>
                                <p className="text-sm text-stone-500 mb-6">{viewingPersona.jobTitle}</p>
                                <div className="p-4 rounded-xl bg-stone-50 text-sm italic text-stone-600">&ldquo;{viewingPersona.bio}&rdquo;</div>
                            </div>
                            <div className={`${cardClass} p-8`}>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-6">Tính cách</h3>
                                {viewingPersona.personality.map((trait, idx) => <PersonalitySliderDisplay key={idx} trait={trait} isEditing={false} />)}
                            </div>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                            <div className={`${cardClass} p-8`}><h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Target size={16} /> Mục tiêu</h4><ul className="space-y-2">{viewingPersona.goals.map((g, i) => <li key={i} className="text-sm text-stone-600 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />{g}</li>)}</ul></div>
                            <div className={`${cardClass} p-8`}><h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Frown size={16} /> Nỗi đau</h4><ul className="space-y-2">{viewingPersona.frustrations.map((f, i) => <li key={i} className="text-sm text-stone-600 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />{f}</li>)}</ul></div>
                            <div className={`${cardClass} p-8`}><h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Heart size={16} /> Động lực</h4><ul className="space-y-2">{viewingPersona.motivations.map((m, i) => <li key={i} className="text-sm text-stone-600 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />{m}</li>)}</ul></div>
                            <div className={`${cardClass} p-8`}><h4 className="text-sm font-bold mb-4 flex items-center gap-2"><MessageSquare size={16} /> Kênh ưu thích</h4><div className="flex flex-wrap gap-2">{viewingPersona.preferredChannels.map((c, i) => <span key={i} className="px-3 py-1 rounded-full bg-stone-100 text-[11px] font-medium">{c}</span>)}</div></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!editingPersona) return null;

    return (
        <div className="flex h-full flex-col bg-[#FCFDFC] font-sans overflow-hidden">
            <header className="h-16 shrink-0 border-b border-stone-200 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')}><ChevronLeft size={20} /></button>
                    <h2 className="font-medium">{editingPersona.id ? 'Sửa Persona' : 'Tạo mới'}</h2>
                </div>
                <button onClick={handleSave} className="px-5 py-2 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"><Save size={16} /> Lưu hồ sơ</button>
            </header>
            <div className="flex-1 overflow-y-auto p-10">
                <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-8">
                         <div className={`${cardClass} p-8 text-center`}>
                             <div className="w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-6 border-4 border-stone-50 relative group cursor-pointer shadow-sm">
                                  <img src={editingPersona.avatarUrl} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 p-2">
                                       {DEFAULT_AVATARS.slice(0, 4).map((url, i) => <img key={i} src={url} onClick={() => setEditingPersona({...editingPersona, avatarUrl: url})} className="w-6 h-6 rounded-full border border-white/50" />)}
                                  </div>
                             </div>
                             <div className="space-y-4 text-left">
                                 <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Tên hiển thị</label><input className={inputClass} value={editingPersona.fullname} onChange={e => setEditingPersona({...editingPersona, fullname: e.target.value})} /></div>
                                 <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Nghề nghiệp</label><input className={inputClass} value={editingPersona.jobTitle} onChange={e => setEditingPersona({...editingPersona, jobTitle: e.target.value})} /></div>
                                 <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Tiểu sử</label><textarea rows={4} className={textareaClass} value={editingPersona.bio} onChange={e => setEditingPersona({...editingPersona, bio: e.target.value})} /></div>
                             </div>
                         </div>
                         <div className={`${cardClass} p-8`}>
                             <h3 className="text-xs font-bold uppercase text-stone-400 mb-6 tracking-widest">Tính cách (Tâm lý học)</h3>
                             {editingPersona.personality.map((trait, idx) => <PersonalitySliderDisplay key={idx} trait={trait} isEditing={true} onChange={(val) => handleSliderChange(idx, val)} />)}
                         </div>
                    </div>
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 h-fit">
                         <div className={`${cardClass} p-8`}><h4 className="text-sm font-bold mb-6">Mục tiêu</h4><ListInput items={editingPersona.goals} onChange={(val) => setEditingPersona({...editingPersona, goals: val})} placeholder="Cần đạt được gì…" icon={Target} colorClass="bg-stone-100" /></div>
                         <div className={`${cardClass} p-8`}><h4 className="text-sm font-bold mb-6">Nỗi đau</h4><ListInput items={editingPersona.frustrations} onChange={(val) => setEditingPersona({...editingPersona, frustrations: val})} placeholder="Điều gì gây khó khăn…" icon={Frown} colorClass="bg-stone-100" /></div>
                         <div className={`${cardClass} p-8`}><h4 className="text-sm font-bold mb-6">Động lực</h4><ListInput items={editingPersona.motivations} onChange={(val) => setEditingPersona({...editingPersona, motivations: val})} placeholder="Lý do mua hàng…" icon={Heart} colorClass="bg-stone-100" /></div>
                         <div className={`${cardClass} p-8`}><h4 className="text-sm font-bold mb-6">Tiếp cận</h4><ListInput items={editingPersona.preferredChannels} onChange={(val) => setEditingPersona({...editingPersona, preferredChannels: val})} placeholder="Facebook, Google…" icon={MessageSquare} colorClass="bg-stone-100" /></div>
                    </div>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export const getPersonaContext = (persona: Persona): string => {
    if (!persona) return "";
    const traits = persona.personality.map(p => p.value < 40 ? p.leftLabel : (p.value > 60 ? p.rightLabel : "")).filter(s => s).join(", ");
    return `PERSONA: ${persona.fullname} (${persona.ageRange}), ${persona.jobTitle}. BIO: ${persona.bio}. GOALS: ${persona.goals.join(", ")}. PAIN POINTS: ${persona.frustrations.join(", ")}. MOTIVATIONS: ${persona.motivations.join(", ")}. TRAITS: ${traits}. CHANNELS: ${persona.preferredChannels.join(", ")}`;
};

export default PersonaBuilder;
