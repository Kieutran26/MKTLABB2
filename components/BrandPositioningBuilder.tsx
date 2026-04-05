import React, { useState, useEffect } from 'react';
import {Compass, Sparkles, Loader2, Target, History, Save, Diamond, Lock, ChevronRight, Building2, Tag, Users, Shield, MessageSquare, Quote, Pencil} from 'lucide-react';
import { BrandPositioningInput, BrandPositioningResult } from '../types';
import { buildBrandPositioning } from '../services/geminiService';
import { BrandPositioningService, SavedBrandPositioning } from '../services/brandPositioningService';
import toast, { Toaster } from 'react-hot-toast';
import FeatureHeader from './FeatureHeader';
import {
    WS_SEGMENT_SHELL,
    wsHistoryToggleClass,
    wsWorkspaceTabClass,
} from './workspace-toolbar-classes';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';
const textareaClass = `${inputClass} resize-none`;

const BrandPositioningBuilder: React.FC = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [input, setInput] = useState<BrandPositioningInput>({ brandName: '', products: '', targetCustomers: '', competitors: '', visionMission: '' });
    const [result, setResult] = useState<BrandPositioningResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [savedPositionings, setSavedPositionings] = useState<SavedBrandPositioning[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
        loadHistory();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'vault' && currentBrand) {
            setInput({
                brandName: currentBrand.identity.name || '',
                products: currentBrand.industry || '',
                targetCustomers: currentBrand.audience.demographics.join(', ') || '',
                competitors: currentBrand.strategy.competitors.join(', ') || '',
                visionMission: currentBrand.strategy.vision || ''
            });
        }
    }, [activeTab, currentBrand]);

    const loadHistory = async () => {
        const positionings = await BrandPositioningService.getBrandPositionings();
        setSavedPositionings(positionings);
    };

    const handleBuild = async () => {
        setLoading(true);
        setResult(null);
        try {
            const context = activeTab === 'vault' && currentBrand 
                ? `ANALYZE FOR BRAND: ${currentBrand.identity.name}, DNA: ${currentBrand.identity.brandStory}. `
                : '';
            const data = await buildBrandPositioning({...input, brandName: context + input.brandName}, setLoadingStep);
            if (data) {
                setResult(data);
                toast.success('Brand positioning built!');
            }
        } catch (err) {
            toast.error('Building failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        const newPositioning: SavedBrandPositioning = { id: Date.now().toString(), name: `${input.brandName} - ${new Date().toLocaleDateString()}`, input, result, createdAt: Date.now() };
        if (await BrandPositioningService.saveBrandPositioning(newPositioning)) {
            await loadHistory();
            toast.success('Saved!');
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-right" />
            <FeatureHeader
                icon={Target}
                eyebrow="BRAND STRATEGY & IDENTITY"
                title="Positioning Builder"
                subline="Xác lập định vị độc tôn của thương hiệu dựa trên DNA và cốt lõi doanh nghiệp."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <div className={WS_SEGMENT_SHELL}>
                        <button type="button" onClick={() => setActiveTab('manual')} className={wsWorkspaceTabClass(activeTab === 'manual')}>
                            <Pencil size={14} /> Thủ công
                        </button>
                        <button type="button" onClick={() => setActiveTab('vault')} className={wsWorkspaceTabClass(activeTab === 'vault')}>
                            <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={wsHistoryToggleClass(showHistory)}
                        aria-pressed={showHistory}
                    >
                        <History size={17} strokeWidth={1.5} />
                    </button>
                </div>
            </FeatureHeader>

            <div className="flex-1 grid overflow-hidden p-6 gap-6" style={{ gridTemplateColumns: showHistory ? '260px 400px 1fr' : '400px 1fr' }}>
                {showHistory && (
                    <div className={`${cardClass} overflow-y-auto p-4 space-y-3 bg-stone-50/30`}>
                        <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 px-2">Saved History</h3>
                        {savedPositionings.map(m => <div key={m.id} onClick={() => { setInput(m.input); setResult(m.result); setShowHistory(false); }} className="p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-300 cursor-pointer transition-all"><div className="font-medium text-sm text-stone-900 truncate">{m.input.brandName}</div><div className="text-[10px] text-stone-400 mt-2">{m.result.brand_identity.archetype} • {new Date(m.createdAt).toLocaleDateString()}</div></div>)}
                    </div>
                )}

                <div className={`${cardClass} overflow-y-auto p-8 space-y-6`}>
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="p-8 rounded-3xl border border-stone-200 bg-stone-50/50 text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                            <h2 className="text-xl font-medium">Positioning Identity Pro</h2>
                            <p className="text-sm text-stone-500 leading-relaxed">Xác lập định vị độc tôn của thương hiệu dựa trên DNA và cốt lõi doanh nghiệp trong Vault.</p>
                            <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2">Get Pro Max Access <ChevronRight size={18} /></button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activeTab === 'vault' && <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Brand Source</label><BrandSelector /></div>}
                            <div className="space-y-4">
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Brand Name *</label><input type="text" className={inputClass} value={input.brandName} onChange={e => setInput({...input, brandName: e.target.value})} /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Product/Service *</label><textarea className={textareaClass} value={input.products} onChange={e => setInput({...input, products: e.target.value})} /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Target Audience *</label><textarea className={textareaClass} value={input.targetCustomers} onChange={e => setInput({...input, targetCustomers: e.target.value})} /></div>
                            </div>
                            <button onClick={handleBuild} disabled={loading} className="w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">{loading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Build Strategic Canvas</>}</button>
                        </div>
                    )}
                </div>

                <div className={`${cardClass} overflow-y-auto p-8`}>
                    {!result ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50"><Compass size={48} className="mb-4" /><p className="text-sm font-medium">Brand Canvas sẽ hiển thị tại đây</p></div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in zoom-in-95">
                             <div className="flex justify-between items-start">
                                <div><h2 className="text-2xl font-medium text-stone-900">{input.brandName}</h2><p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{result.brand_identity.archetype}</p></div>
                                <button onClick={handleSave} className="p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-stone-300"><Save size={18} /></button>
                             </div>

                             <div className="p-8 rounded-3xl border border-stone-100 bg-stone-50/30">
                                 <p className="text-[10px] font-bold uppercase text-stone-400 mb-4">Archetype Essence</p>
                                 <p className="text-base text-stone-700 leading-relaxed italic">"{result.brand_identity.archetype_desc}"</p>
                                 <div className="flex flex-wrap gap-2 mt-4">{result.brand_identity.tone_of_voice.map((t, i) => <span key={i} className="text-[10px] px-3 py-1 bg-white text-stone-500 rounded-full border border-stone-100 font-bold uppercase">{t}</span>)}</div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-2xl border border-stone-100 bg-white"><p className="text-[10px] font-bold uppercase text-stone-400 mb-2">USP (Difference)</p><p className="text-sm font-medium text-stone-900">{result.strategic_pillars.usp}</p></div>
                                <div className="p-6 rounded-2xl border border-stone-100 bg-white"><p className="text-[10px] font-bold uppercase text-stone-400 mb-2">UVP (Value)</p><p className="text-sm font-medium text-stone-900">{result.strategic_pillars.uvp}</p></div>
                             </div>

                             <div className="p-8 rounded-3xl border border-stone-900 bg-stone-900 text-white">
                                 <p className="text-[10px] font-bold uppercase text-stone-500 mb-4">Positioning Statement</p>
                                 <p className="text-lg font-medium leading-relaxed italic">"{result.positioning_statement}"</p>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                 {result.messaging_pillars.map((p, i) => (
                                     <div key={i} className="p-6 rounded-2xl border border-stone-100"><p className="text-xs font-bold text-stone-900 mb-2">{p.pillar_name}</p><p className="text-xs text-stone-500">{p.key_message}</p></div>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandPositioningBuilder;
