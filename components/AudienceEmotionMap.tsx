import React, { useState, useEffect } from 'react';
import { AudienceEmotionMapInput, AudienceEmotionMapResult } from '../types';
import { analyzeEmotionalJourney } from '../services/geminiService';
import { EmotionMapService, SavedEmotionMap } from '../services/emotionMapService';
import { Toast, ToastType } from './Toast';
import FeatureHeader from './FeatureHeader';
import {
    WS_SEGMENT_SHELL,
    wsHistoryToggleClass,
    wsWorkspaceTabClass,
} from './workspace-toolbar-classes';
import {Heart, Map, Lightbulb, Loader2, AlertCircle, ChevronDown, ChevronUp, CheckCircle2, XCircle, Save, History as HistoryIcon, Trash2, Plus, BarChart3, Diamond, Lock, ChevronRight, Check, Pencil, Sparkles} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';
import BrandVaultUpsellCard from './BrandVaultUpsellCard';

interface Props {
}

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const AudienceEmotionMap: React.FC<Props> = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [input, setInput] = useState<AudienceEmotionMapInput>({
        industry: '',
        productCategory: '',
        targetAudience: '',
        painPoint: '',
        positioning: '',
    });
    const [result, setResult] = useState<AudienceEmotionMapResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState('');
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [savedMaps, setSavedMaps] = useState<SavedEmotionMap[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
        const loadMaps = async () => {
            const maps = await EmotionMapService.getEmotionMaps();
            setSavedMaps(maps);
        };
        loadMaps();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'vault' && currentBrand) {
            setInput(prev => ({
                ...prev,
                industry: prev.industry, // Industry not in Brand interface
                productCategory: currentBrand.identity.name || prev.productCategory,
                targetAudience: currentBrand.audience.demographics.join(', ') || prev.targetAudience
            }));
        }
    }, [activeTab, currentBrand]);

    const handleAnalyze = async () => {
        if (!input.industry || !input.painPoint) {
            setError('Vui lòng nhập Ngành hàng và Pain Point');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const context = activeTab === 'vault' && currentBrand 
                ? `BRAND: ${currentBrand.identity.name}, VISION: ${currentBrand.strategy.vision}`
                : '';
            const analysis = await analyzeEmotionalJourney({...input, positioning: context || input.positioning}, setProgress);
            if (analysis) setResult(analysis);
        } catch (err) {
            setError('Lỗi phân tích.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        const newMap: SavedEmotionMap = { id: Date.now().toString(), input, result, timestamp: Date.now() };
        const success = await EmotionMapService.saveEmotionMap(newMap);
        if (success) {
            setSavedMaps(await EmotionMapService.getEmotionMaps());
            setToast({ message: 'Đã lưu!', type: 'success' });
        }
    };

    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white border-2 border-stone-200 rounded-xl p-4 shadow-lg z-50">
                    <div className="text-2xl mb-2">{data.emoji}</div>
                    <div className="font-semibold text-stone-900 mb-1">{data.stage}</div>
                    <div className="text-sm text-stone-600">{data.dominant_emotion}</div>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <FeatureHeader
                icon={Heart}
                eyebrow="AUDIENCE PSYCHOLOGY MAP"
                title="Audience Emotion Map"
                subline="Vẽ bản đồ hành trình cảm xúc và tâm lý khách hàng để tối ưu điểm chạm nội dung."
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
                        <HistoryIcon size={17} strokeWidth={1.5} />
                    </button>
                </div>
            </FeatureHeader>

            <div className="flex-1 grid overflow-hidden p-6 gap-6" style={{ gridTemplateColumns: showHistory ? '280px 380px 1fr' : '380px 1fr' }}>
                {showHistory && (
                    <div className={`${cardClass} overflow-y-auto p-4 space-y-3 bg-stone-50/30`}>
                        <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 px-2">Bản đồ đã lưu</h3>
                        {savedMaps.map(m => <div key={m.id} onClick={() => {setResult(m.result); setInput(m.input); setShowHistory(false);}} className="p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-300 cursor-pointer transition-all"><div className="font-medium text-sm text-stone-900 underline truncate">{m.input.industry}</div><div className="text-[10px] text-stone-400 mt-2">{new Date(m.timestamp).toLocaleDateString()}</div></div>)}
                    </div>
                )}

                <div className={`${cardClass} overflow-y-auto p-8 space-y-6`}>
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="mx-auto w-full max-w-[1180px] p-4 md:p-6 pb-12">
                            <BrandVaultUpsellCard
                                title="Emotional Insights Pro"
                                description="Kết nối cảm xúc khách hàng với thông điệp thương hiệu từ Vault để tạo ra nội dung chạm đến trái tim."
                                benefits={[
                                    "Phác họa hành trình cảm xúc khách hàng chuẩn xác",
                                    "Tự động đề xuất Nội dung công kích Nỗi đau (Pain points)",
                                    "Khám phá các 'Sự thật ngầm hiểu' (Insights) độc quyền",
                                    "Xác định thời điểm then chốt để chuyển đổi hành vi"
                                ]}
                            />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'vault' && <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Thương hiệu</label><BrandSelector /></div>}
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Ngành hàng</label><input className={inputClass} value={input.industry} onChange={e => setInput({...input, industry: e.target.value})} placeholder="VD: Mỹ phẩm cao cấp" /></div>
                                <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Pain Point chính</label><textarea className={`${inputClass} h-24 resize-none`} value={input.painPoint} onChange={e => setInput({...input, painPoint: e.target.value})} placeholder="Vấn đề lớn nhất khách hàng đang gặp?" /></div>
                                <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Đối tượng</label><input className={inputClass} value={input.targetAudience} onChange={e => setInput({...input, targetAudience: e.target.value})} placeholder="VD: Mẹ bỉm sữa bận rộn" /></div>
                            </div>
                            <button onClick={handleAnalyze} disabled={loading} className="w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" size={20} /> : <><Heart size={20} /> Vẽ bản đồ cảm xúc</>}</button>
                        </>
                    )}
                </div>

                <div className={`${cardClass} overflow-y-auto p-8`}>
                     {!result ? (
                         <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50"><Heart size={48} className="mb-4" /><p className="text-sm font-medium">Bản đồ cảm xúc sẽ hiển thị tại đây</p></div>
                     ) : (
                         <div className="space-y-8">
                             <div className="p-6 rounded-2xl border border-stone-100 bg-stone-50/20">
                                 <ResponsiveContainer width="100%" height={250}><LineChart data={result.emotion_journey}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" /><XAxis dataKey="stage" tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} /><YAxis domain={[0, 10]} hide /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="intensity_score" stroke="#1c1917" strokeWidth={3} dot={{r: 6, fill: '#1c1917'}} /></LineChart></ResponsiveContainer>
                             </div>
                             <div className="grid grid-cols-2 gap-4">{result.emotion_journey.map((s, i) => <div key={i} className="p-5 rounded-2xl border border-stone-100 hover:border-stone-300 transition-all bg-white"><div className="flex items-center gap-3 mb-3"><span className="text-2xl">{s.emoji}</span><div><div className="text-xs font-bold uppercase text-stone-400">{s.stage}</div><div className="text-sm font-bold text-stone-900">{s.dominant_emotion}</div></div></div><p className="text-xs text-stone-500 italic mb-3">"{s.internal_monologue}"</p><div className="pt-3 border-t border-stone-50"><div className="text-[10px] font-bold text-stone-400 uppercase mb-1">Hook</div><p className="text-xs text-stone-700">{s.content_hook}</p></div></div>)}</div>
                             <div className="flex justify-center pt-4"><button onClick={handleSave} className="px-8 py-3 bg-white border border-stone-200 rounded-full text-sm font-medium hover:bg-stone-50 flex items-center gap-2 shadow-sm"><Save size={16} /> Lưu kết quả</button></div>
                         </div>
                     )}
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AudienceEmotionMap;
