import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, ChevronLeft, Sliders, Target, Frown, Heart, MessageSquare, Users, Eye, Diamond, Lock, Check, ChevronRight } from 'lucide-react';
import { Persona, PersonalityTrait } from '../types';
import { StorageService } from '../services/storageService';
import { useBrand } from './BrandContext';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';

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
            <div className="min-h-full bg-[#FCFDFC] font-sans pb-20">
                <header className="border-b border-stone-200 bg-[#FCFDFC] px-5 py-5 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-stone-400">
                                <Users size={20} strokeWidth={1.25} />
                                <span className="text-[11px] font-medium uppercase tracking-[0.2em]">Customer Profile</span>
                            </div>
                            <h1 className="text-2xl font-normal tracking-tight md:text-3xl">Persona Builder</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex gap-1 rounded-xl border border-stone-200 bg-stone-50/50 p-1 shadow-sm mr-2">
                                <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}>✍️ Thủ công</button>
                                <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}>
                                    <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                                </button>
                            </div>
                            <button onClick={handleCreateNew} className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors"><Plus size={18} /> Thêm Persona</button>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="mb-12 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-10 md:p-14">
                                    <div className="mb-6 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-600"><Diamond size={32} /></div>
                                    <h2 className="mb-4 text-3xl font-medium tracking-tight text-stone-900">Persona từ Brand Vault</h2>
                                    <p className="mb-8 text-lg text-stone-500">AI sẽ tự động phác họa chân dung khách hàng dựa trên dữ liệu sản phẩm và DNA thương hiệu của bạn.</p>
                                    <ul className="mb-10 space-y-4 text-sm">
                                        {["Phân tích tâm lý học chuyên sâu", "Dự báo hành vi mua hàng chính xác", "Gợi ý thông điệp cá nhân hóa", "Xác định kênh truyền thông tiềm năng"].map((text, i) => (
                                            <li key={i} className="flex items-center gap-3 text-stone-700">
                                                <div className="rounded-full bg-emerald-50 p-1 text-emerald-600"><Check size={14} strokeWidth={3} /></div>
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="flex items-center gap-2 rounded-2xl bg-stone-900 px-8 py-4 font-medium text-white shadow-lg transition-transform hover:scale-105">Nâng cấp Pro Max <ChevronRight size={18} /></button>
                                </div>
                                <div className="relative flex items-center justify-center bg-stone-50 p-10 overflow-hidden">
                                     <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] scale-150"><Users size={400} /></div>
                                     <div className="relative z-10 w-full max-w-sm space-y-4 p-6 blur-[2px] grayscale opacity-40">
                                         <div className="h-6 w-1/2 rounded bg-stone-300" />
                                         <div className="h-32 rounded-xl bg-white shadow-sm" />
                                         <div className="grid grid-cols-2 gap-2"><div className="h-20 rounded-lg bg-stone-200" /> <div className="h-20 rounded-lg bg-stone-200" /></div>
                                     </div>
                                     <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 p-8 shadow-2xl backdrop-blur">
                                         <Lock size={48} className="text-stone-400" />
                                     </div>
                                </div>
                            </div>
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
            <div className="flex h-screen flex-col bg-[#FCFDFC] font-sans">
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
        <div className="flex h-screen flex-col bg-[#FCFDFC] font-sans overflow-hidden">
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
