import React, { useState, useEffect } from 'react';
import { AdsHealthInput, AdsHealthResult } from '../types';
import { checkAdsHealth } from '../services/geminiService';
import { AdsHealthService, SavedAdsHealthAnalysis } from '../services/adsHealthService';
import {Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, Scissors, RefreshCw, Layout, Monitor, Globe, Save, Trash2, FolderOpen, Stethoscope, Diamond, Lock, ChevronRight, Check, Pencil, History as HistoryIcon} from 'lucide-react';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';
import FeatureHeader from './FeatureHeader';
import {
    WS_SEGMENT_SHELL,
    wsHistoryToggleClass,
    wsWorkspaceTabClass,
} from './workspace-toolbar-classes';

interface Props {}

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';
const smallInputClass = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 transition-all';

const AdsHealthChecker: React.FC<Props> = () => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [input, setInput] = useState<AdsHealthInput>({
        platform: 'Facebook Ads',
        industry: '',
        dataMode: 'paste',
        manualMetrics: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, duration: 0, frequency: 0, reach: 0 },
        rawText: ''
    });
    const [result, setResult] = useState<AdsHealthResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAdsHealthAnalysis[]>([]);
    const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [analysisName, setAnalysisName] = useState('');
    const [saveError, setSaveError] = useState('');

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
        // currentBrand.industry is not defined in the interface, skipping auto-fill for now
    }, [activeTab, currentBrand]);

    const loadSavedAnalyses = async () => {
        const analyses = await AdsHealthService.getAdsHealthAnalyses();
        setSavedAnalyses(analyses);
    };

    const handleLoadAnalysis = (analysisId: string) => {
        if (!analysisId) {
            setSelectedAnalysisId('');
            setInput({
                platform: 'Facebook Ads',
                industry: '',
                dataMode: 'paste',
                manualMetrics: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, duration: 0, frequency: 0, reach: 0 },
                rawText: ''
            });
            setResult(null);
            return;
        }
        const analysis = savedAnalyses.find(a => a.id === analysisId);
        if (analysis) {
            setSelectedAnalysisId(analysisId);
            setInput(analysis.input);
            setResult(analysis.result);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!analysisName.trim() || !result) {
            setSaveError('Vui lòng nhập tên');
            return;
        }
        const newAnalysis: SavedAdsHealthAnalysis = {
            id: Date.now().toString(),
            name: analysisName.trim(),
            input: input,
            result: result,
            createdAt: Date.now()
        };
        const success = await AdsHealthService.saveAdsHealthAnalysis(newAnalysis);
        if (success) {
            setShowSaveModal(false);
            setAnalysisName('');
            setSaveError('');
            await loadSavedAnalyses();
        }
    };

    const handleAnalyze = async () => {
        if (!input.industry) {
            setError('Vui lòng nhập ngành hàng');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await checkAdsHealth(input, (step) => {
                if (step.includes('Initializing')) setLoadingStep('Khởi động bác sĩ AI...');
                else if (step.includes('Analyzing')) setLoadingStep('Đang phân tích metrics...');
                else setLoadingStep('Đang lập phác đồ...');
            });
            if (data) setResult(data);
        } catch (err) {
            setError('Lỗi phân tích.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-rose-600 bg-rose-50 border-rose-200';
    };

    const getActionIcon = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('trim')) return <Scissors className="w-5 h-5 text-rose-500" />;
        if (lower.includes('refresh')) return <RefreshCw className="w-5 h-5 text-blue-500" />;
        if (lower.includes('scale')) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
        return <Activity className="w-5 h-5 text-stone-500" />;
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <FeatureHeader
                icon={Activity}
                eyebrow="MARKETING ANALYTICS"
                title="Ads Health Checker"
                subline="Phân tích sức khỏe quảng cáo — Chẩn đoán và tối ưu hiệu suất chiến dịch của bạn."
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
                        onClick={() => setShowHistoryModal(true)}
                        className={wsHistoryToggleClass(showHistoryModal)}
                        title="Lịch sử"
                        aria-label="Mở lịch sử chẩn đoán"
                        aria-pressed={showHistoryModal}
                    >
                        <HistoryIcon size={17} strokeWidth={1.5} />
                    </button>
                </div>
            </FeatureHeader>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '440px 1fr' }}>
                <div className="h-full overflow-y-auto border-r border-stone-200/80 bg-white p-6">
                    {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                        <div className="p-8 rounded-3xl border border-stone-200 bg-stone-50/50 text-center space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                            <h2 className="text-xl font-medium text-stone-900">Health Check pro-max</h2>
                            <p className="text-sm text-stone-500 leading-relaxed">AI sẽ tự động nạp DNA thương hiệu, tệp khách hàng từ Vault để đưa ra phân tích chính xác hơn 100% so với bản Free.</p>
                            <button className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">Nâng cấp <ChevronRight size={18} /></button>
                            <div className="pt-4 space-y-3">
                                {["Tự động nhận diện Benchmark ngành", "Phác đồ điều trị cá nhân hóa", "Lưu trữ không giới hạn", "Export báo cáo PDF Pro"].map((t, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-stone-600"><Check size={14} className="text-emerald-500" /> {t}</div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={`${cardClass} p-6 space-y-6`}>
                            {activeTab === 'vault' && (
                                <div className="space-y-4 pb-4 border-b border-stone-100">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Thương hiệu mục tiêu</label>
                                    <BrandSelector />
                                </div>
                            )}
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Cài đặt phân tích</label><div className="space-y-3">
                                    <select className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm focus:bg-white" value={input.platform} onChange={e => setInput({...input, platform: e.target.value})}><option>Facebook Ads</option><option>Google Ads</option><option>TikTok Ads</option></select>
                                    <input className={inputClass} placeholder="Ngành hàng (vd: Mỹ phẩm)" value={input.industry} onChange={e => setInput({...input, industry: e.target.value})} />
                                </div></div>
                                <div><label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Dữ liệu chiến dịch</label><div className="flex gap-1 p-1 bg-stone-50 rounded-xl mb-3">
                                    <button onClick={() => setInput({...input, dataMode: 'paste'})} className={`flex-1 py-2 text-xs font-medium rounded-lg ${input.dataMode === 'paste' ? 'bg-white shadow-sm' : 'text-stone-500'}`}>Dán Ads Manager</button>
                                    <button onClick={() => setInput({...input, dataMode: 'manual'})} className={`flex-1 py-2 text-xs font-medium rounded-lg ${input.dataMode === 'manual' ? 'bg-white shadow-sm' : 'text-stone-500'}`}>Nhập số liệu</button>
                                </div>
                                {input.dataMode === 'paste' ? <textarea className="w-full h-40 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs font-mono" placeholder="Paste số liệu từ cột Excel..." value={input.rawText} onChange={e => setInput({...input, rawText: e.target.value})} /> : <div className="grid grid-cols-2 gap-3">{['spend','impressions','clicks','conversions'].map(m => <input key={m} className={smallInputClass} placeholder={m} type="number" onChange={e => setInput({...input, manualMetrics: {...input.manualMetrics!, [m]: Number(e.target.value)}})} />)}</div>}</div>
                            </div>
                            <button onClick={handleAnalyze} disabled={loading} className="w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 disabled:bg-stone-300 transition-colors flex items-center justify-center gap-2">{loading ? <RefreshCw className="animate-spin w-5 h-5" /> : <><Stethoscope size={18} /> Khám sức khỏe Ads</>}</button>
                        </div>
                    )}
                </div>

                <div className="h-full overflow-y-auto bg-stone-50 p-8">
                    {!result ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-200 rounded-3xl bg-white"><Activity size={48} className="mb-4 opacity-20" /><p className="text-sm">Chưa có dữ liệu chẩn đoán</p></div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className={`${cardClass} p-8 flex gap-8 items-center`}>
                                <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center text-2xl font-bold ${getScoreColor(result.health_score).replace('bg-', 'border-')}`}>{result.health_score}</div>
                                <div><div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-2 ${getScoreColor(result.health_score)}`}>{result.status}</div><h2 className="text-xl font-medium">{result.diagnosis.primary_issue}</h2><p className="text-sm text-stone-500 mt-1">{result.diagnosis.explanation}</p></div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">{Object.entries(result.metrics_analysis).map(([k, m]: [any, any]) => <div key={k} className={`${cardClass} p-4`}><div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold uppercase text-stone-400">{k}</span></div><div className="text-lg font-medium">{m.value}</div><div className="text-[10px] text-stone-500 mt-1">{m.assessment}</div></div>)}</div>
                            <div className={`${cardClass} overflow-hidden`}><div className="bg-stone-50 p-4 border-b border-stone-100 font-medium">Bản phác đồ điều trị</div><div className="divide-y divide-stone-100">{result.actionable_steps.map((s, i) => <div key={i} className="p-6 flex gap-4"> {getActionIcon(s.action)} <div><div className="text-xs font-bold uppercase text-stone-400 mb-1">{s.action}</div><p className="text-sm text-stone-600">{s.detail}</p></div> </div>)}</div></div>
                            <div className="flex justify-center"><button onClick={() => setShowSaveModal(true)} className="px-8 py-3 bg-white border border-stone-200 rounded-full text-sm font-medium hover:bg-stone-50 shadow-sm flex items-center gap-2"><Save size={16} /> Lưu báo cáo chẩn đoán</button></div>
                        </div>
                    )}
                </div>
            </div>

            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-sm border border-stone-200 shadow-2xl">
                        <h3 className="text-lg font-medium mb-2">Lưu kết quả</h3>
                        <p className="text-xs text-stone-500 mb-6">Đặt tên cho lần chẩn đoán này</p>
                        <input className={inputClass} value={analysisName} onChange={e => setAnalysisName(e.target.value)} placeholder="Tên báo cáo..." autoFocus />
                        <div className="flex gap-3 mt-8">
                             <button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 text-sm font-medium border border-stone-200 rounded-xl hover:bg-stone-50">Hủy</button>
                             <button onClick={handleSaveAnalysis} className="flex-1 py-3 text-sm font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800">Lưu lại</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl h-[70vh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden">
                        <header className="p-6 border-b border-stone-100 flex justify-between items-center"><h3 className="font-medium">Lịch sử chẩn đoán</h3><button onClick={() => setShowHistoryModal(false)}><XCircle size={20} className="text-stone-300" /></button></header>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {savedAnalyses.map(a => <div key={a.id} onClick={() => {handleLoadAnalysis(a.id); setShowHistoryModal(false);}} className="p-4 border border-stone-100 rounded-2xl bg-stone-50 hover:bg-white hover:border-stone-300 cursor-pointer transition-all flex justify-between items-center"><div><div className="font-medium">{a.name}</div><div className="text-[10px] text-stone-400 mt-1">{a.input.platform} · {new Date(a.createdAt).toLocaleDateString()}</div></div><CheckCircle size={18} className="text-emerald-500" /></div>)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdsHealthChecker;
