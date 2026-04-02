import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import {Target, Sparkles, Loader2, Swords, DoorOpen, Users, Truck, Shuffle, History, Save, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Minus, ArrowUpRight, ArrowDownRight, Factory, Lightbulb, Diamond, Lock, ChevronRight, Pencil} from 'lucide-react';
import { PorterAnalysisInput, PorterAnalysisResult, UserPosition } from '../types';
import { generatePorterAnalysis } from '../services/geminiService';
import { PorterService, SavedPorterAnalysis } from '../services/porterService';
import toast, { Toaster } from 'react-hot-toast';
import FeatureHeader from './FeatureHeader';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const FORCE_ICONS: Record<string, LucideIcon> = {
    'Competitive Rivalry': Swords,
    'Threat of New Entrants': DoorOpen,
    'Bargaining Power of Buyers': Users,
    'Bargaining Power of Suppliers': Truck,
    'Threat of Substitutes': Shuffle
};

const VERDICT_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    'Blue Ocean': { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: <TrendingUp size={20} strokeWidth={1.25} /> },
    'Attractive': { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: <TrendingUp size={20} strokeWidth={1.25} /> },
    'Moderate': { color: '#a16207', bg: '#fefce8', border: '#fde047', icon: <AlertTriangle size={20} strokeWidth={1.25} /> },
    'Unattractive': { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: <TrendingDown size={20} strokeWidth={1.25} /> },
    'Red Ocean': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: <TrendingDown size={20} strokeWidth={1.25} /> }
};

const PorterAnalyzer: React.FC = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PorterAnalysisInput>();
    const [analysisData, setAnalysisData] = useState<PorterAnalysisResult | null>(null);
    const [currentInput, setCurrentInput] = useState<PorterAnalysisInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedAnalyses, setSavedAnalyses] = useState<SavedPorterAnalysis[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [userPosition, setUserPosition] = useState<UserPosition>('new_entrant');

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
        loadSavedAnalyses();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'vault' && currentBrand) {
            setValue('industry', currentBrand.industry || '');
            setValue('niche', currentBrand.identity.name || '');
        }
    }, [activeTab, currentBrand, setValue]);

    const loadSavedAnalyses = async () => {
        const analyses = await PorterService.getAnalyses();
        setSavedAnalyses(analyses);
    };

    const onSubmit = async (data: PorterAnalysisInput) => {
        data.userPosition = userPosition;
        setIsGenerating(true);
        setAnalysisData(null);
        setCurrentInput(data);
        try {
            const context = activeTab === 'vault' && currentBrand 
                ? `ANALYZE FOR BRAND: ${currentBrand.identity.name}, VISION: ${currentBrand.strategy.vision}. `
                : '';
            const result = await generatePorterAnalysis({...data, industry: context + data.industry}, setThinkingStep);
            if (result) {
                setAnalysisData(result);
                toast.success('Analysis complete!');
            }
        } catch (error) {
            toast.error('Analysis failed');
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!analysisData || !currentInput) return;
        const newAnalysis: SavedPorterAnalysis = { id: Date.now().toString(), input: currentInput, data: analysisData, timestamp: Date.now() };
        if (await PorterService.saveAnalysis(newAnalysis)) {
            await loadSavedAnalyses();
            toast.success('Saved!');
        }
    };

    const handleLoad = (analysis: SavedPorterAnalysis) => {
        setAnalysisData(analysis.data);
        setCurrentInput(analysis.input);
        reset(analysis.input);
        setShowHistory(false);
    };

    const radarData = analysisData?.forces.map(force => ({
        force: force.name.replace('Bargaining Power of ', '').replace('Threat of ', ''),
        score: force.score,
        fullMark: 10
    })) || [];

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-right" />
            <FeatureHeader
                icon={Target}
                eyebrow="COMPETITIVE INTENSITY ANALYSIS"
                title="Porter's Precision"
                subline="Phân tích 5 lực lượng cạnh tranh để xác định sức hấp dẫn của ngành."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <div className="inline-flex gap-1 rounded-2xl border border-stone-200 bg-stone-50/50 p-1 shadow-sm mr-2">
                        <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}><Pencil size={14} /> Thủ công</button>
                        <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}>
                            <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                        </button>
                    </div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-95 ${showHistory ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
                    >
                        <History size={18} strokeWidth={2} />
                    </button>
                </div>
            </FeatureHeader>

            <div className="flex-1 grid overflow-hidden p-6 gap-6" style={{ gridTemplateColumns: showHistory ? '260px 400px 1fr' : '400px 1fr' }}>
                {showHistory && (
                    <div className={`${cardClass} overflow-y-auto p-4 space-y-3 bg-stone-50/30`}>
                        <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 px-2">Saved Analyses</h3>
                        {savedAnalyses.map(m => <div key={m.id} onClick={() => handleLoad(m)} className="p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-300 cursor-pointer transition-all"><div className="font-medium text-sm text-stone-900 truncate">{m.input.industry}</div><div className="text-[10px] text-stone-400 mt-2">{m.data.overall_verdict} • {new Date(m.timestamp).toLocaleDateString()}</div></div>)}
                    </div>
                )}

                <div className={`${cardClass} overflow-y-auto p-8 space-y-6`}>
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="p-8 rounded-3xl border border-stone-200 bg-stone-50/50 text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                            <h2 className="text-xl font-medium">Porter Intensity Pro</h2>
                            <p className="text-sm text-stone-500 leading-relaxed">Phân tích thực trạng cạnh tranh và rào cản ngành dựa trên định vị thương hiệu của bạn trong Vault.</p>
                            <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2">Access Pro Max <ChevronRight size={18} /></button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {activeTab === 'vault' && <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Brand Source</label><BrandSelector /></div>}
                            <div className="space-y-4">
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Industry *</label><input {...register('industry', { required: true })} className={inputClass} placeholder="VD: Fintech, E-commerce" /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Location *</label><input {...register('location', { required: true })} className={inputClass} placeholder="VD: Việt Nam, Global" /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Vị thế</label><select value={userPosition} onChange={e => setUserPosition(e.target.value as UserPosition)} className={inputClass}><option value="new_entrant">New Entrant</option><option value="challenger">Challenger</option><option value="market_leader">Market Leader</option></select></div>
                            </div>
                            <button type="submit" disabled={isGenerating} className="w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">{isGenerating ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Analyze Competitive Forces</>}</button>
                            <p className="text-center text-[10px] text-stone-400 italic">Thinking: {thinkingStep || 'Ready'}</p>
                        </form>
                    )}
                </div>

                <div className={`${cardClass} overflow-y-auto p-8`}>
                    {!analysisData ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50"><Factory size={48} className="mb-4" /><p className="text-sm font-medium">Kết quả phân tích 5 lực Porter</p></div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in zoom-in-95">
                             <div className="flex justify-between items-start">
                                <div><h2 className="text-2xl font-medium text-stone-900">{analysisData.overall_verdict}</h2><p className="text-stone-400 text-sm">Industry Verdict: {analysisData.total_threat_score}/50 Total Threat</p></div>
                                <button onClick={handleSave} className="p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-stone-300"><Save size={18} /></button>
                             </div>

                             <div className="p-8 rounded-3xl border border-stone-100 bg-stone-50/20 h-[350px]">
                                <ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid stroke="#e7e5e4" /><PolarAngleAxis dataKey="force" tick={{fontSize: 10, fill: '#666'}} /><PolarRadiusAxis domain={[0, 10]} hide /><Radar name="Force Intensity" dataKey="score" stroke="#1c1917" fill="#1c1917" fillOpacity={0.1} strokeWidth={2} /></RadarChart></ResponsiveContainer>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                {analysisData.forces.map((f, i) => {
                                    const Icon = FORCE_ICONS[f.name] || Target;
                                    return <div key={i} className="p-6 rounded-2xl border border-stone-100 hover:border-stone-300 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-stone-50 p-2 rounded-lg text-stone-900"><Icon size={20} /></div>
                                            <div className="text-xl font-bold italic" style={{color: f.score > 7 ? '#ef4444' : f.score > 4 ? '#f59e0b' : '#10b981'}}>{f.score}<span className="text-xs text-stone-300 font-normal">/10</span></div>
                                        </div>
                                        <h4 className="text-sm font-bold text-stone-900 mb-2">{f.name_vi}</h4>
                                        <p className="text-xs text-stone-500 leading-relaxed mb-4 line-clamp-2">{f.strategic_action}</p>
                                        <div className="flex flex-wrap gap-1">{f.determinants.slice(0, 2).map((d, di) => <span key={di} className="text-[9px] px-2 py-1 bg-stone-50 text-stone-400 rounded-md border border-stone-100">{d}</span>)}</div>
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

export default PorterAnalyzer;
