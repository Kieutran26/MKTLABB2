import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Globe, Sparkles, Loader2, Landmark, TrendingUp, Users, Cpu, Leaf, Scale, History, Save, Plus, Trash2, Diamond, Lock, ChevronRight } from 'lucide-react';
import { PESTELBuilderInput, PESTELBuilderResult, PESTELFactorGroup } from '../types';
import { generatePESTELAnalysis } from '../services/geminiService';
import { PESTELService, SavedPESTEL } from '../services/pestelService';
import toast, { Toaster } from 'react-hot-toast';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const PESTEL_ICONS: Record<string, any> = { Political: Landmark, Economic: TrendingUp, Social: Users, Technological: Cpu, Environmental: Leaf, Legal: Scale };

const PESTELBuilder: React.FC = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PESTELBuilderInput>();
    const [pestelData, setPestelData] = useState<PESTELBuilderResult | null>(null);
    const [currentInput, setCurrentInput] = useState<PESTELBuilderInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedReports, setSavedReports] = useState<SavedPESTEL[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
        loadSavedReports();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'vault' && currentBrand) {
            setValue('industry', currentBrand.industry || '');
            setValue('businessScale', 'SME');
        }
    }, [activeTab, currentBrand, setValue]);

    const loadSavedReports = async () => {
        const reports = await PESTELService.getReports();
        setSavedReports(reports);
    };

    const onSubmit = async (data: PESTELBuilderInput) => {
        setIsGenerating(true);
        setPestelData(null);
        setCurrentInput(data);
        try {
            const context = activeTab === 'vault' && currentBrand 
                ? `ANALYZE FOR BRAND: ${currentBrand.identity.name}, VISION: ${currentBrand.strategy.vision}. `
                : '';
            const result = await generatePESTELAnalysis({...data, industry: context + data.industry}, setThinkingStep);
            if (result) {
                setPestelData(result);
                toast.success('PESTEL Analysis complete!');
            }
        } catch (error) {
            toast.error('Analysis failed');
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!pestelData || !currentInput) return;
        const newReport: SavedPESTEL = { id: Date.now().toString(), input: currentInput, data: pestelData, timestamp: Date.now() };
        if (await PESTELService.saveReport(newReport)) {
            await loadSavedReports();
            toast.success('Saved!');
        }
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-right" />
            <header className="flex shrink-0 border-b border-stone-200/70 bg-[#FCFDFC] px-8 py-5 justify-between items-center">
                 <div>
                    <div className="flex items-center gap-2 text-stone-400 mb-1"><Globe size={18} /><span className="text-[10px] font-bold uppercase tracking-widest">Environment Scan</span></div>
                    <h1 className="text-xl font-medium text-stone-900 leading-none">PESTEL Builder</h1>
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
                        <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 px-2">Saved PESTEL</h3>
                        {savedReports.map(m => <div key={m.id} onClick={() => { setPestelData(m.data); setCurrentInput(m.input); reset(m.input); setShowHistory(false); }} className="p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-300 cursor-pointer transition-all"><div className="font-medium text-sm text-stone-900 truncate">{m.input.industry}</div><div className="text-[10px] text-stone-400 mt-2">{m.input.location} • {new Date(m.timestamp).toLocaleDateString()}</div></div>)}
                    </div>
                )}

                <div className={`${cardClass} overflow-y-auto p-8 space-y-6`}>
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="p-8 rounded-3xl border border-stone-200 bg-stone-50/50 text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                            <h2 className="text-xl font-medium">PESTEL Intelligence Pro</h2>
                            <p className="text-sm text-stone-500 leading-relaxed">Quét radar kinh tế vĩ mô dựa trên quy mô và ngành hàng trong Vault của bạn.</p>
                            <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2">Get Pro Max Now <ChevronRight size={18} /></button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {activeTab === 'vault' && <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Brand Source</label><BrandSelector /></div>}
                            <div className="space-y-4">
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Industry *</label><input {...register('industry', { required: true })} className={inputClass} placeholder="VD: Bất động sản nghỉ dưỡng" /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Location *</label><input {...register('location', { required: true })} className={inputClass} placeholder="VD: Việt Nam" /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Business Scale *</label><select {...register('businessScale', { required: true })} className={inputClass}><option value="Startup">Startup</option><option value="SME">SME</option><option value="Enterprise">Enterprise</option></select></div>
                            </div>
                            <button type="submit" disabled={isGenerating} className="w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">{isGenerating ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Deep Scan Environment</>}</button>
                        </form>
                    )}
                </div>

                <div className={`${cardClass} overflow-y-auto p-8`}>
                    {!pestelData ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50"><Globe size={48} className="mb-4" /><p className="text-sm font-medium">Phân tích môi trường vĩ mô</p></div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in zoom-in-95">
                             <div className="flex justify-between items-start">
                                <div><h2 className="text-2xl font-medium text-stone-900">{pestelData.context}</h2><p className="text-stone-400 text-sm">Macro Scan Analysis • {pestelData.data_freshness}</p></div>
                                <button onClick={handleSave} className="p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-stone-300"><Save size={18} /></button>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                {pestelData.pestel_factors.map((f: PESTELFactorGroup, i: number) => {
                                    const Icon = PESTEL_ICONS[f.category] || Landmark;
                                    return <div key={i} className="p-6 rounded-2xl border border-stone-100 bg-white">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-stone-50 p-2 rounded-lg"><Icon size={20} /></div>
                                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">{f.category_vi}</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {f.items.slice(0, 3).map((item, ii) => (
                                                <div key={ii} className="pb-4 border-b border-stone-50 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-xs font-bold text-stone-800 flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${item.impact_direction === 'Positive' ? 'bg-emerald-500' : item.impact_direction === 'Negative' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                            {item.factor}
                                                        </p>
                                                        <span className="text-[10px] font-bold text-stone-400">{item.impact_score}/10</span>
                                                    </div>
                                                    <p className="text-[11px] text-stone-500 leading-relaxed mb-2">{item.detail}</p>
                                                    <div className="bg-stone-50 p-2 rounded-lg"><p className="text-[10px] font-medium text-stone-900 italic">💡 {item.actionable_insight}</p></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                })}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PESTELBuilder;
