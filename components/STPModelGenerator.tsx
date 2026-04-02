import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Layers, Sparkles, Loader2, Target, Users, Award, AlertTriangle, History, Save, Plus, Trash2, ChevronRight, Zap, BarChart3, Diamond, Lock } from 'lucide-react';
import { STPInput, STPResult, STPSegment } from '../types';
import { generateSTPAnalysis } from '../services/geminiService';
import { STPService, SavedSTP } from '../services/stpService';
import toast, { Toaster } from 'react-hot-toast';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const SegmentCard: React.FC<{ segment: STPSegment; index: number }> = ({ segment, index }) => (
    <div className={`${cardClass} p-5 transition-all hover:border-stone-300/90`}>
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50/80 text-sm font-medium text-stone-700">{index + 1}</div>
            <h4 className="text-base font-medium tracking-tight text-stone-900">{segment.name}</h4>
        </div>
        <p className="mb-4 text-sm font-normal text-stone-600">{segment.description}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div><p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Demographics</p><p className="text-sm text-stone-800">{segment.demographics}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Psychographics</p><p className="text-sm text-stone-800">{segment.psychographics}</p></div>
        </div>
    </div>
);

const STPModelGenerator: React.FC = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [outputTab, setOutputTab] = useState<'segmentation' | 'targeting' | 'positioning'>('segmentation');
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<STPInput>();
    const [stpData, setStpData] = useState<STPResult | null>(null);
    const [currentInput, setCurrentInput] = useState<STPInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedItems, setSavedItems] = useState<SavedSTP[]>([]);
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
            setValue('productBrand', currentBrand.identity.name || '');
            setValue('industry', currentBrand.industry || '');
            setValue('productDescription', currentBrand.identity.brandStory || '');
        }
    }, [activeTab, currentBrand, setValue]);

    const loadHistory = async () => {
        const items = await STPService.getSTPHistory();
        setSavedItems(items);
    };

    const onSubmit = async (data: STPInput) => {
        setIsGenerating(true);
        setStpData(null);
        setCurrentInput(data);
        try {
            const context = activeTab === 'vault' && currentBrand 
                ? `BRAND: ${currentBrand.identity.name}, VISION: ${currentBrand.strategy.vision}. `
                : '';
            const result = await generateSTPAnalysis({...data, productBrand: context + data.productBrand}, setThinkingStep);
            if (result) {
                setStpData(result);
                toast.success('STP Analysis complete!');
            }
        } catch (error) {
            toast.error('Analysis failed');
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!stpData || !currentInput) return;
        const newItem: SavedSTP = { id: Date.now().toString(), input: currentInput, data: stpData, timestamp: Date.now() };
        if (await STPService.saveSTP(newItem)) {
            await loadHistory();
            toast.success('Saved!');
        }
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-right" />
            <header className="flex shrink-0 border-b border-stone-200/70 bg-[#FCFDFC] px-8 py-5 justify-between items-center">
                 <div>
                    <div className="flex items-center gap-2 text-stone-400 mb-1"><Layers size={18} /><span className="text-[10px] font-bold uppercase tracking-widest">Market Strategy</span></div>
                    <h1 className="text-xl font-medium text-stone-900 leading-none">STP Optimizer</h1>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="inline-flex gap-1 rounded-xl border border-stone-200 bg-stone-50/50 p-1 shadow-sm mr-2">
                        <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500'}`}>✍️ Thủ công</button>
                        <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500'}`}>
                            <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                        </button>
                    </div>
                    <button onClick={() => setShowHistory(!showHistory)} className="px-4 py-2 rounded-full border border-stone-200 text-sm font-medium hover:bg-stone-50 flex items-center gap-2"><History size={16} /> Lịch sử</button>
                 </div>
            </header>

            <div className="flex-1 grid overflow-hidden p-6 gap-6" style={{ gridTemplateColumns: showHistory ? '260px 400px 1fr' : '400px 1fr' }}>
                {showHistory && (
                    <div className={`${cardClass} overflow-y-auto p-4 space-y-3 bg-stone-50/30`}>
                        <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 px-2">Saved Models</h3>
                        {savedItems.map(m => <div key={m.id} onClick={() => { setStpData(m.data); setCurrentInput(m.input); reset(m.input); setShowHistory(false); }} className="p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-300 cursor-pointer transition-all"><div className="font-medium text-sm text-stone-900 truncate">{m.input.productBrand}</div><div className="text-[10px] text-stone-400 mt-2">{m.input.industry} • {new Date(m.timestamp).toLocaleDateString()}</div></div>)}
                    </div>
                )}

                <div className={`${cardClass} overflow-y-auto p-8 space-y-6`}>
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="p-8 rounded-3xl border border-stone-200 bg-stone-50/50 text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                            <h2 className="text-xl font-medium">STP Precision Pro</h2>
                            <p className="text-sm text-stone-500 leading-relaxed">Tự động phân lớp thị trường và xác định tọa độ định vị dựa trên bản sắc thương hiệu trong Vault của bạn.</p>
                            <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2">Upgrade to Pro Max <ChevronRight size={18} /></button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {activeTab === 'vault' && <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Brand Source</label><BrandSelector /></div>}
                            <div className="space-y-4">
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Brand Name *</label><input {...register('productBrand', { required: true })} className={inputClass} placeholder="VD: Vinfast e34" /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Industry *</label><input {...register('industry', { required: true })} className={inputClass} placeholder="VD: EV Cars" /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Description *</label><textarea {...register('productDescription', { required: true })} className="w-full p-3 h-24 rounded-xl border border-stone-200 text-sm" placeholder="Mô tả sản phẩm..." /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Price Range</label><input {...register('priceRange')} className={inputClass} placeholder="VD: 500M-700M" /></div>
                                    <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Market</label><input {...register('targetMarket')} className={inputClass} placeholder="VD: Việt Nam" /></div>
                                </div>
                            </div>
                            <button type="submit" disabled={isGenerating} className="w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">{isGenerating ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Generate STP Model</>}</button>
                        </form>
                    )}
                </div>

                <div className={`${cardClass} overflow-y-auto p-8`}>
                    {!stpData ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50"><BarChart3 size={48} className="mb-4" /><p className="text-sm font-medium">Bản đồ STP sẽ hiển thị tại đây</p></div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in zoom-in-95">
                             <div className="flex justify-between items-start">
                                <div><h2 className="text-2xl font-medium text-stone-900">{stpData.positioning.brand_essence}</h2><p className="text-stone-400 text-sm">Strategic Position: {stpData.targeting.primary_segment}</p></div>
                                <button onClick={handleSave} className="p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-stone-300"><Save size={18} /></button>
                             </div>

                             <div className="flex gap-2 p-1 bg-stone-100 rounded-xl w-fit">
                                 {(['segmentation', 'targeting', 'positioning'] as const).map(t => (
                                     <button key={t} onClick={() => setOutputTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${outputTab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>{t}</button>
                                 ))}
                             </div>

                             {outputTab === 'segmentation' && (
                                 <div className="grid grid-cols-2 gap-4">
                                     {stpData.segmentation.segments.map((s, i) => <SegmentCard key={i} segment={s} index={i} />)}
                                 </div>
                             )}

                             {outputTab === 'targeting' && (
                                 <div className="p-8 rounded-3xl border border-stone-900 bg-stone-900 text-white space-y-6">
                                     <div><p className="text-[10px] font-bold uppercase text-stone-500 mb-2">Bullseye Targeting</p><h3 className="text-2xl font-medium">{stpData.targeting.primary_segment}</h3></div>
                                     <p className="text-stone-300 leading-relaxed font-light italic">"{stpData.targeting.selection_rationale}"</p>
                                     <div className="grid grid-cols-2 gap-6 pt-4 border-t border-stone-800">
                                         <div><p className="text-[10px] font-bold uppercase text-stone-500 mb-2">Market Fit</p><p className="text-2xl font-medium">{stpData.targeting.market_fit_score}%</p></div>
                                         <div><p className="text-[10px] font-bold uppercase text-stone-500 mb-2">Growth Potential</p><p className="text-sm">{stpData.targeting.growth_potential}</p></div>
                                     </div>
                                 </div>
                             )}

                             {outputTab === 'positioning' && (
                                 <div className="space-y-6">
                                     <div className="p-8 rounded-3xl border border-stone-100 bg-stone-50/50">
                                         <p className="text-[10px] font-bold uppercase text-stone-400 mb-4">The Position Statement</p>
                                         <p className="text-xl italic font-medium leading-relaxed text-stone-800">"{stpData.positioning.positioning_statement}"</p>
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="p-6 rounded-2xl border border-stone-100 bg-white"><p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Unique Value</p><p className="text-sm font-medium text-stone-900">{stpData.positioning.unique_value_proposition}</p></div>
                                         <div className="p-6 rounded-2xl border border-stone-100 bg-white"><p className="text-[10px] font-bold uppercase text-stone-400 mb-2">RTB (Truth)</p><div className="space-y-1">{stpData.positioning.reasons_to_believe.map((r, i) => <p key={i} className="text-xs text-stone-600">• {r}</p>)}</div></div>
                                     </div>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default STPModelGenerator;
