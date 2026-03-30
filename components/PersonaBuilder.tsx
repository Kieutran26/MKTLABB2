import React, { useState, useEffect, useCallback } from 'react';
import { User, Plus, Trash2, Edit2, Save, ChevronLeft, Sliders, Target, Frown, Heart, MessageSquare, Users, Check, X, Eye } from 'lucide-react';
import { Persona, PersonalityTrait } from '../types';
import { StorageService } from '../services/storageService';
import { useBrand } from './BrandContext';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';

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
const PersonalitySliderDisplay = ({ trait, isEditing, onChange }: { trait: PersonalityTrait, isEditing: boolean, onChange?: (val: number) => void }) => {
    // Color calculation from Red (0) to Blue (100) via Purple
    const getColor = (val: number) => {
        if (val < 30) return 'bg-rose-500';
        if (val < 70) return 'bg-purple-500';
        return 'bg-indigo-500';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) onChange(Number(e.target.value));
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase">
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
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                ) : (
                    <div className="w-full h-2 bg-slate-200 rounded-lg overflow-hidden relative">
                        <div 
                            className={`h-full absolute top-0 left-0 rounded-lg ${getColor(trait.value)}`} 
                            style={{ width: `${trait.value}%` }} 
                        ></div>
                        {/* Marker dot */}
                        <div 
                            className="w-3 h-3 bg-white border-2 border-slate-400 rounded-full absolute top-1/2 -translate-y-1/2 -ml-1.5 shadow-sm"
                            style={{ left: `${trait.value}%` }}
                        ></div>
                    </div>
                )}
                <div className={`w-10 text-center text-xs font-bold py-1 rounded ${isEditing ? 'bg-slate-100 text-slate-700' : 'text-slate-500'}`}>
                    {trait.value}
                </div>
            </div>
        </div>
    );
};

const PersonaBuilder: React.FC = () => {
    const { currentBrand } = useBrand();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'edit' | 'detail'>('list');
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
    const [viewingPersona, setViewingPersona] = useState<Persona | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Manual Brand State
    const [useManualBrand, setUseManualBrand] = useState(false);
    const [manualBrandName, setManualBrandName] = useState('');

    useEffect(() => {
        refreshPersonas();
    }, [currentBrand]);

    const refreshPersonas = () => {
        // If a brand is selected in context, show only its personas. 
        // Otherwise show all (or could filter differently)
        const allPersonas = StorageService.getPersonas();
        if (currentBrand) {
            const brandPersonas = allPersonas.filter(p => p.brandId === currentBrand.id);
            // Also include manual personas if we consider them "global" or detached
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
            personality: JSON.parse(JSON.stringify(DEFAULT_TRAITS)), // Deep copy
            createdAt: Date.now()
        };
        setEditingPersona(newPersona);
        setViewMode('edit');
    };

    const handleEdit = (persona: Persona) => {
        setEditingPersona({ ...persona });
        setViewingPersona(null);
        setViewMode('edit');
        // Check if this persona is manual
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
        
        // Ensure brand ID is correct based on manual toggle
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
    const ListInput = ({ items, onChange, placeholder, icon: Icon, colorClass }: any) => {
        const addItem = () => onChange([...items, '']);
        const updateItem = (idx: number, val: string) => {
            const newItems = [...items];
            newItems[idx] = val;
            onChange(newItems);
        };
        const removeItem = (idx: number) => {
            const newItems = items.filter((_: any, i: number) => i !== idx);
            onChange(newItems);
        };

        return (
            <div className="space-y-2">
                {items.map((item: string, idx: number) => (
                    <div key={idx} className="flex gap-2 group">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass} bg-opacity-10 text-opacity-100 shrink-0 mt-1`}>
                            <Icon size={14} />
                        </div>
                        <input 
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            value={item}
                            onChange={e => updateItem(idx, e.target.value)}
                            placeholder={placeholder}
                        />
                        <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                <button onClick={addItem} className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 mt-1">
                    <Plus size={12} /> Thêm dòng
                </button>
            </div>
        );
    };

    // --- RENDERERS ---

    if (viewMode === 'list') {
        return (
            <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Users className="text-indigo-600" strokeWidth={1.5} />
                            Persona Builder
                        </h2>
                        <p className="text-slate-500 mt-1">Xây dựng chân dung khách hàng cho thương hiệu.</p>
                        
                        {!useManualBrand && (
                             <div className="mt-4">
                                <BrandSelector />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3 items-center self-start">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                             <input 
                                type="checkbox" 
                                id="manualBrand" 
                                checked={useManualBrand} 
                                onChange={(e) => setUseManualBrand(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                             />
                             <label htmlFor="manualBrand" className="text-sm text-slate-600 font-medium cursor-pointer">Chế độ thủ công</label>
                        </div>
                        <button 
                            onClick={handleCreateNew}
                            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        >
                            <Plus size={20} strokeWidth={1.5} /> Thêm Persona
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {personas.length === 0 ? (
                        <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                            <Users size={48} className="mx-auto text-slate-300 mb-4" strokeWidth={1}/>
                            <p className="text-slate-500">Chưa có hồ sơ khách hàng nào.</p>
                            <button onClick={handleCreateNew} className="text-indigo-600 font-bold hover:underline mt-2">Tạo hồ sơ đầu tiên</button>
                        </div>
                    ) : (
                        personas.map(persona => (
                            <div 
                                key={persona.id}
                                onClick={() => handleView(persona)}
                                className="group bg-white rounded-3xl border border-slate-200 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden relative flex flex-col items-center p-6 text-center"
                            >
                                {persona.brandId === 'manual' && (
                                    <span className="absolute top-4 left-4 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Manual</span>
                                )}
                                
                                <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 border-4 border-white shadow-md overflow-hidden group-hover:scale-110 transition-transform duration-300">
                                    <img src={persona.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                
                                <h3 className="font-bold text-lg text-slate-800">{persona.fullname}</h3>
                                <p className="text-sm text-indigo-600 font-medium mb-1">{persona.jobTitle}</p>
                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{persona.ageRange} tuổi</span>

                                <div className="mt-4 w-full pt-4 border-t border-slate-50 text-left">
                                    <p className="text-xs text-slate-500 line-clamp-3 italic">"{persona.bio || 'Chưa có tiểu sử...'}"</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // DETAIL VIEW (Modal)
    if (viewMode === 'detail' && viewingPersona) {
        return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-slate-100 relative">
                    <button 
                        onClick={() => setViewMode('list')} 
                        className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10"
                    >
                        <X size={20} strokeWidth={1.5}/>
                    </button>

                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Profile Header */}
                            <div className="md:w-1/3 flex flex-col items-center text-center space-y-4 border-r border-slate-100 pr-8">
                                <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
                                    <img src={viewingPersona.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{viewingPersona.fullname}</h2>
                                    <p className="text-indigo-600 font-medium">{viewingPersona.jobTitle}</p>
                                    <span className="text-sm text-slate-500">{viewingPersona.ageRange} tuổi</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic leading-relaxed w-full text-left">
                                    "{viewingPersona.bio}"
                                </div>
                                <div className="w-full pt-4">
                                    <button 
                                        onClick={() => handleEdit(viewingPersona)} 
                                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={16}/> Chỉnh sửa Hồ sơ
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, viewingPersona.id)} 
                                        className="w-full py-3 mt-2 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16}/> Xóa Hồ sơ
                                    </button>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="md:w-2/3 space-y-8">
                                {/* Personality */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <Sliders size={20} className="text-indigo-500"/> Tính cách
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {viewingPersona.personality.map((trait, idx) => (
                                            <PersonalitySliderDisplay key={idx} trait={trait} isEditing={false} />
                                        ))}
                                    </div>
                                </div>

                                {/* Psychographics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
                                        <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2"><Target size={16}/> Mục tiêu</h4>
                                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                            {viewingPersona.goals.length > 0 ? viewingPersona.goals.map((g,i) => <li key={i}>{g}</li>) : <span className="text-slate-400 italic">Chưa nhập</span>}
                                        </ul>
                                    </div>
                                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
                                        <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2"><Frown size={16}/> Nỗi đau</h4>
                                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                            {viewingPersona.frustrations.length > 0 ? viewingPersona.frustrations.map((g,i) => <li key={i}>{g}</li>) : <span className="text-slate-400 italic">Chưa nhập</span>}
                                        </ul>
                                    </div>
                                    <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100">
                                        <h4 className="font-bold text-yellow-700 mb-3 flex items-center gap-2"><Heart size={16}/> Động lực</h4>
                                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                            {viewingPersona.motivations.length > 0 ? viewingPersona.motivations.map((g,i) => <li key={i}>{g}</li>) : <span className="text-slate-400 italic">Chưa nhập</span>}
                                        </ul>
                                    </div>
                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                        <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2"><MessageSquare size={16}/> Kênh</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingPersona.preferredChannels.length > 0 ? viewingPersona.preferredChannels.map((g,i) => (
                                                <span key={i} className="bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-bold">{g}</span>
                                            )) : <span className="text-slate-400 italic">Chưa nhập</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // EDITOR MODE
    if (!editingPersona) return null;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
             <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ChevronLeft size={24} strokeWidth={1.5} />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800">
                        {editingPersona.id ? 'Chỉnh sửa Persona' : 'Tạo Persona Mới'}
                        {useManualBrand && <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-normal">Thủ công</span>}
                    </h2>
                </div>
                <button 
                    onClick={handleSave} 
                    className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <Save size={18} strokeWidth={1.5}/> Lưu hồ sơ
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COL: Identity & Bio */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                            <div className="w-32 h-32 mx-auto rounded-full bg-slate-100 mb-4 border-4 border-white shadow-lg overflow-hidden relative group">
                                <img src={editingPersona.avatarUrl} className="w-full h-full object-cover" />
                                {/* Avatar Selection Overlay */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <div className="grid grid-cols-4 gap-1 p-2">
                                        {DEFAULT_AVATARS.map((url, i) => (
                                            <div key={i} onClick={() => setEditingPersona({...editingPersona, avatarUrl: url})} className="w-6 h-6 rounded-full overflow-hidden bg-white border border-white/50 hover:scale-125 transition-transform">
                                                <img src={url} className="w-full h-full"/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 text-left">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Họ và tên</label>
                                    <input 
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                                        value={editingPersona.fullname}
                                        onChange={e => setEditingPersona({...editingPersona, fullname: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Chức danh / Nghề nghiệp</label>
                                    <input 
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                        value={editingPersona.jobTitle}
                                        onChange={e => setEditingPersona({...editingPersona, jobTitle: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Độ tuổi</label>
                                    <input 
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                        value={editingPersona.ageRange}
                                        onChange={e => setEditingPersona({...editingPersona, ageRange: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tiểu sử / Câu chuyện</label>
                                    <textarea 
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 h-32 resize-none focus:border-indigo-500 focus:outline-none leading-relaxed"
                                        value={editingPersona.bio}
                                        onChange={e => setEditingPersona({...editingPersona, bio: e.target.value})}
                                        placeholder="Mô tả ngắn về cuộc sống, hoàn cảnh..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personality Sliders */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Sliders size={20} className="text-indigo-500"/> Tính cách
                            </h3>
                            <div className="space-y-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                                    <Target className="text-green-500" size={20}/> Mục tiêu & Mong muốn
                                </h3>
                                <ListInput 
                                    items={editingPersona.goals} 
                                    onChange={(val: string[]) => setEditingPersona({...editingPersona, goals: val})}
                                    placeholder="Họ muốn đạt được gì..."
                                    icon={Check}
                                    colorClass="text-green-600 bg-green-600"
                                />
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                                    <Frown className="text-red-500" size={20}/> Nỗi đau & Thách thức
                                </h3>
                                <ListInput 
                                    items={editingPersona.frustrations} 
                                    onChange={(val: string[]) => setEditingPersona({...editingPersona, frustrations: val})}
                                    placeholder="Điều gì làm họ khó chịu..."
                                    icon={X} 
                                    colorClass="text-red-600 bg-red-600"
                                />
                            </div>
                            
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-yellow-600 mb-4 flex items-center gap-2">
                                    <Heart className="text-yellow-500" size={20}/> Động lực mua hàng
                                </h3>
                                <ListInput 
                                    items={editingPersona.motivations} 
                                    onChange={(val: string[]) => setEditingPersona({...editingPersona, motivations: val})}
                                    placeholder="Giá cả, Chất lượng, hay Tốc độ..."
                                    icon={Check}
                                    colorClass="text-yellow-600 bg-yellow-600"
                                />
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
                                    <MessageSquare className="text-blue-500" size={20}/> Kênh tiếp cận
                                </h3>
                                <ListInput 
                                    items={editingPersona.preferredChannels} 
                                    onChange={(val: string[]) => setEditingPersona({...editingPersona, preferredChannels: val})}
                                    placeholder="Facebook, Email, TikTok..."
                                    icon={Check}
                                    colorClass="text-blue-600 bg-blue-600"
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