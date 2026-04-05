import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {Brain, Sparkles, Loader2, Search, TrendingUp, AlertTriangle, DollarSign, Users, History, Save, Plus, Trash2, MapPin, Lightbulb, Zap, Target, Clock, Diamond, Lock, ChevronRight, Pencil} from 'lucide-react';
import { InsightFinderResult, InsightFinderInput } from '../types';
import { generateDeepInsights } from '../services/geminiService';
import { InsightService, SavedInsight } from '../services/insightService';
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

const InsightFinder: React.FC = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<InsightFinderInput>();
    const [insightData, setInsightData] = useState<InsightFinderResult | null>(null);
    const [currentInput, setCurrentInput] = useState<InsightFinderInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
        const loadInsights = async () => {
            const insights = await InsightService.getInsights();
            setSavedInsights(insights);
        };
        loadInsights();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'vault' && currentBrand) {
            setValue('productIndustry', currentBrand.industry || '');
            setValue('targetAudience', currentBrand.audience.demographics.join(', ') || '');
        }
    }, [activeTab, currentBrand, setValue]);

    const onSubmit = async (data: InsightFinderInput) => {
        setIsGenerating(true);
        setInsightData(null);
        setCurrentInput(data);
        try {
            const context = activeTab === 'vault' && currentBrand 
                ? `Analyze based on BRAND: ${currentBrand.identity.name}, DNA: ${currentBrand.identity.brandStory}. `
                : '';
            const result = await generateDeepInsights({...data, productIndustry: context + data.productIndustry}, (step) => setThinkingStep(step));
            if (result) {
                setInsightData(result);
                toast.success('Insights found!');
            }
        } catch (error) {
            toast.error('Error finding insights');
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!insightData || !currentInput) return;
        const newInsight: SavedInsight = { id: Date.now().toString(), input: currentInput, data: insightData, timestamp: Date.now() };
        if (await InsightService.saveInsight(newInsight)) {
            setSavedInsights(await InsightService.getInsights());
            toast.success('Insight saved!');
        }
    };

    const handleLoad = (insight: SavedInsight) => {
        setInsightData(insight.data);
        setCurrentInput(insight.input);
        reset(insight.input);
        setShowHistory(false);
    };

    const getEmotionalBg = (level: number) => {
        if (level <= 3) return 'bg-emerald-50 border border-emerald-100';
        if (level <= 6) return 'bg-amber-50 border border-amber-100';
        if (level <= 9) return 'bg-orange-50 border border-orange-100';
        return 'bg-rose-50 border border-rose-100';
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <Toaster position="top-right" />
            <FeatureHeader
                icon={Brain}
                eyebrow="PSYCHOLOGY & INSIGHT RESEARCH"
                title="Insight Finder"
                subline="Tìm thấy 'điểm chạm tâm lý' đắt giá nhất bằng cách kết nối tệp khách hàng với AI."
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

            <div className="flex-1 grid overflow-hidden p-6 gap-6" style={{ gridTemplateColumns: showHistory ? '280px 400px 1fr' : '400px 1fr' }}>
                {showHistory && (
                    <div className={`${cardClass} overflow-y-auto p-4 space-y-3 bg-stone-50/30`}>
                        <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 px-2">History</h3>
                        {savedInsights.map(m => <div key={m.id} onClick={() => handleLoad(m)} className="p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-300 cursor-pointer transition-all"><div className="font-medium text-sm text-stone-900 truncate">{m.data.industry}</div><div className="text-[10px] text-stone-400 mt-2">Level {m.data.emotional_intensity.level} • {new Date(m.timestamp).toLocaleDateString()}</div></div>)}
                    </div>
                )}

                <div className={`${cardClass} overflow-y-auto p-8 space-y-6`}>
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="p-8 rounded-3xl border border-stone-200 bg-stone-50/50 text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                            <h2 className="text-xl font-medium">Deep Insight Pro</h2>
                            <p className="text-sm text-stone-500 leading-relaxed">Tìm thấy "điểm chạm tâm lý" đắt giá nhất bằng cách kết nối tệp khách hàng từ Vault với thuật toán Emotional Intelligence.</p>
                            <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2">Get Pro Max Access <ChevronRight size={18} /></button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {activeTab === 'vault' && <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Brand Source</label><BrandSelector /></div>}
                            <div className="space-y-4">
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Ngành hàng / Sản phẩm *</label><input {...register('productIndustry', { required: true })} className={inputClass} placeholder="VD: High-end Furniture" /></div>
                                <div><label className="text-xs font-semibold text-stone-700 mb-2 block">Target Audience *</label><textarea {...register('targetAudience', { required: true })} className="w-full p-3 h-24 rounded-xl border border-stone-200 text-sm" placeholder="Mô tả tệp khách hàng..." /></div>
                                <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Bối cảnh sử dụng</label><input {...register('usageOccasion')} className={inputClass} placeholder="VD: Khi mới mua nhà" /></div>
                            </div>
                            <button type="submit" disabled={isGenerating} className="w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">{isGenerating ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /> Tìm Friction & Insight</>}</button>
                            <div className="text-center"><p className="text-[10px] text-stone-400 italic">Thinking: {thinkingStep || 'Ready to analyze'}</p></div>
                        </form>
                    )}
                </div>

                <div className={`${cardClass} overflow-y-auto p-8`}>
                    {!insightData ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50"><Search size={48} className="mb-4" /><p className="text-sm font-medium">Insights sẽ hiển thị tại đây</p></div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in zoom-in-95">
                             <div className="flex justify-between items-start">
                                <div><h2 className="text-2xl font-medium text-stone-900">{insightData.industry}</h2><p className="text-stone-400 text-sm">Consumer Insight Report</p></div>
                                <button onClick={handleSave} className="p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-stone-300"><Save size={18} /></button>
                             </div>

                             <div className="grid grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-stone-900 text-white"><div className="text-[10px] font-bold uppercase text-stone-500 mb-4 tracking-widest">The Truth</div><p className="text-sm italic leading-relaxed">"{insightData.threeHitCombo.truth.whatTheySay}"</p></div>
                                <div className="p-6 rounded-2xl bg-stone-50 ring-1 ring-stone-900"><div className="text-[10px] font-bold uppercase text-stone-900 mb-4 tracking-widest">The Tension</div><div className="text-sm font-bold text-stone-900 mb-2">Want {insightData.threeHitCombo.tension.wantX}</div><div className="text-stone-400 text-xs mb-2">BUT AFRAID</div><div className="text-sm font-bold text-rose-600">{insightData.threeHitCombo.tension.butAfraid}</div></div>
                                <div className="p-6 rounded-2xl border border-stone-200"><div className="text-[10px] font-bold uppercase text-amber-500 mb-4 tracking-widest">The Discovery</div><p className="text-sm font-medium">{insightData.threeHitCombo.discovery.itsAbout}</p></div>
                             </div>

                             <div className="p-6 rounded-2xl border border-stone-100 bg-stone-50/30">
                                 <div className="text-[10px] font-bold uppercase text-stone-400 mb-4">Emotional Intensity</div>
                                 <div className={`h-2 w-full rounded-full bg-stone-100 relative mb-4`}><div className={`absolute top-0 left-0 h-full rounded-full bg-stone-900 transition-all`} style={{width: `${insightData.emotional_intensity.level * 10}%`}} /></div>
                                 <p className="text-sm font-medium text-stone-700">Level {insightData.emotional_intensity.level}/10: {insightData.emotional_intensity.description}</p>
                             </div>

                             <div className="grid grid-cols-2 gap-6">
                                 {insightData.deep_insights.pain_points.map((p, i) => <div key={i} className="p-6 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-colors">
                                     <div className={`text-[10px] font-bold uppercase mb-2 ${p.level === 'Deep' ? 'text-stone-900' : 'text-stone-400'}`}>{p.level} Pain</div>
                                     <p className="text-sm text-stone-700 leading-relaxed font-medium">{p.content}</p>
                                 </div>)}
                             </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .flip-card { perspective: 1000px; }
                .flip-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
                .flip-card:hover .flip-card-inner { transform: rotateY(180deg); }
                .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; }
                .flip-card-back { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default InsightFinder;
