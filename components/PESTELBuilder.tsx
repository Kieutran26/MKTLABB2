import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
    Globe, Shield, TrendingUp, Users, Cpu, Leaf, Landmark, Loader2, Sparkles, 
    History, ChevronRight, Plus, Diamond, Save, ArrowRight
} from 'lucide-react';
import { generatePESTELAnalysis } from '../services/geminiService';
import { PESTELInput, PESTELResult, PESTELFactorGroup } from '../types';
import FeatureHeader from './FeatureHeader';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';
import { StpOptimizerField } from './stp-optimizer-field';
import { useBrand } from './BrandContext';
import { PESTELService, SavedPESTEL } from '../services/pestelService';
import { useToast } from './Toast';

const PESTEL_ICONS: Record<string, any> = {
    Political: PoliticalIcon,
    Economic: TrendingUp,
    Social: Users,
    Technological: Cpu,
    Environmental: Leaf,
    Legal: Shield
};

function PoliticalIcon(props: any) {
    return <Landmark {...props} />;
}

const FORM_TABS = [
    { id: 1, line: 'NHÓM 1', sub: 'Bối cảnh cơ bản' },
    { id: 2, line: 'NHÓM 2', sub: 'Thông tin doanh nghiệp' }
];

const PESTEL_DEFAULTS: PESTELInput = {
    industry: '',
    location: '',
    businessScale: '',
    businessModel: '',
    mainProductService: '',
    currentConcern: '',
    futurePlan: '',
    knownEventsPolicies: ''
};

const REPORT_STYLES = `
.pestel-report {
    max-width: 1000px;
    margin: 0 auto;
    font-family: 'Inter', system-ui, sans-serif;
    color: #1c1917;
    line-height: 1.6;
}

.doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1.5px solid #e7e5e4;
    padding-bottom: 2rem;
    margin-bottom: 3rem;
}

.doc-eyebrow {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #a8a29e;
    margin-bottom: 0.5rem;
}

.doc-title {
    font-size: 32px;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    color: #1c1917;
}

.doc-title em {
    font-style: italic;
    color: #78716c;
}

.doc-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}

.doc-date {
    font-size: 13px;
    font-weight: 600;
    color: #44403c;
}

.doc-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    background: #f5f5f4;
    padding: 2px 8px;
    border-radius: 4px;
    color: #78716c;
}

.pestel-summary {
    background: #fafaf9;
    border: 1px solid #e7e5e4;
    border-radius: 24px;
    padding: 2rem;
    margin-bottom: 4rem;
}

.ps-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #78716c;
    margin-bottom: 1.5rem;
}

.ps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.ps-item {
    display: flex;
    gap: 1rem;
}

.ps-num {
    font-size: 18px;
    font-weight: 700;
    color: #d6d3d1;
    font-family: 'Outfit', sans-serif;
}

.ps-text {
    font-size: 14px;
    font-weight: 500;
    color: #44403c;
    line-height: 1.5;
}

.pestel-factor-card {
    margin-bottom: 3.5rem;
}

.pf-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.pf-icon {
    font-size: 20px;
}

.pf-title {
    font-size: 18px;
    font-weight: 600;
    color: #1c1917;
    letter-spacing: -0.01em;
}

.pf-tree {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-left: 1rem;
    border-left: 1.5px solid #f5f5f4;
}

.tree-item {
    display: flex;
    gap: 2rem;
}

.tree-label {
    flex: 0 0 100px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #a8a29e;
    margin-top: 0.25rem;
}

.tree-content {
    flex: 1;
    font-size: 14.5px;
    color: #44403c;
}

.tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
    margin-right: 0.75rem;
}

.tag.positive { background: #ecfdf5; color: #059669; }
.tag.negative { background: #fff1f2; color: #e11d48; }
.tag.neutral { background: #fffbeb; color: #d97706; }

.score {
    font-size: 12px;
    font-weight: 500;
    color: #a8a29e;
    font-style: italic;
}

.timeline-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 4px;
    margin-left: 0.75rem;
    background: #f5f5f4;
    color: #78716c;
}

.timeline-tag.short { color: #e11d48; background: #fff1f2; }
.timeline-tag.mid { color: #d97706; background: #fffbeb; }
.timeline-tag.long { color: #059669; background: #ecfdf5; }

.pestel-matrix-v2 {
    margin: 4rem 0;
}

.or-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.or-card {
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 24px;
    padding: 2rem;
}

.or-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.or-label.ops { color: #059669; }
.or-label.risks { color: #e11d48; }

.or-list {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
}

.or-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.or-title {
    font-size: 14.5px;
    font-weight: 600;
    color: #1c1917;
    line-height: 1.4;
}

.or-origin {
    font-size: 11px;
    font-weight: 500;
    color: #a8a29e;
    font-style: italic;
}

.or-action {
    font-size: 13.5px;
    color: #44403c;
    line-height: 1.6;
    padding-left: 1rem;
    border-left: 1.5px solid #f5f5f4;
}

.unknowns-box {
    background: #fafaf9;
    border: 1px dashed #d6d3d1;
    border-radius: 24px;
    padding: 2.5rem;
    margin-top: 4rem;
}

.uk-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #78716c;
    margin-bottom: 1.25rem;
}

.uk-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.uk-item {
    font-size: 13.5px;
    color: #44403c;
    display: flex;
    gap: 0.75rem;
    line-height: 1.5;
}

.uk-dash {
    color: #d6d3d1;
}

.pestel-matrix {
    margin: 5rem 0;
}

.section-head {
    margin-bottom: 2rem;
}

.section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #78716c;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e7e5e4;
}

.matrix-table {
    width: 100%;
    border-collapse: collapse;
    caption-side: bottom;
}

.matrix-table th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #a8a29e;
    padding: 1rem;
    border-bottom: 1px solid #f5f5f4;
}

.matrix-table td {
    padding: 1.25rem 1rem;
    font-size: 13.5px;
    border-bottom: 1px solid #f5f5f4;
    color: #44403c;
}

.prio-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 4px;
}

.prio-tag.high { background: #1c1917; color: #fff; }
.prio-tag.med { background: #78716c; color: #fff; }
.prio-tag.low { background: #e7e5e4; color: #78716c; }

.cmo-advice-box {
    background: #1c1917;
    color: #fff;
    border-radius: 32px;
    padding: 3rem;
    margin-top: 5rem;
}

.cmo-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
}

.cmo-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #78716c;
}

.cmo-sig {
    font-family: 'Outfit', sans-serif;
    font-style: italic;
    color: #44403c;
    font-size: 13px;
}

.cmo-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.advice-item {
    display: flex;
    gap: 1.5rem;
}

.advice-num {
    font-size: 20px;
    font-weight: 400;
    font-family: 'Outfit', sans-serif;
    color: #44403c;
    min-width: 24px;
}

.advice-text {
    font-size: 15px;
    line-height: 1.6;
    color: #d6d3d1;
}

.advice-text strong {
    color: #fff;
    font-weight: 600;
}
`;

const PESTELBuilder: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { register, handleSubmit, watch, reset } = useForm<PESTELInput>({
        defaultValues: PESTEL_DEFAULTS
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [pestelData, setPestelData] = useState<PESTELResult | null>(null);
    const [thinkingStep, setThinkingStep] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [savedReports, setSavedReports] = useState<SavedPESTEL[]>([]);
    const [formTab, setFormTab] = useState(1);
    const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
    const [profile, setProfile] = useState<any>(null);
    const [currentInput, setCurrentInput] = useState<PESTELInput | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const p = await saasService.getUserProfile(user.uid);
            setProfile(p);
        };
        loadUser();
    }, [user]);

    const loadHistory = async () => {
        const reports = await PESTELService.getReports();
        setSavedReports(reports);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const onSubmit = async (data: PESTELInput) => {
        setIsGenerating(true);
        setCurrentInput(data);
        setThinkingStep('Đang khởi tạo radar vĩ mô...');
        
        try {
            const result = await generatePESTELAnalysis(data, (step) => setThinkingStep(step));
            if (result) {
                const reportId = Date.now().toString();
                const newReport: SavedPESTEL = {
                    id: reportId,
                    timestamp: Date.now(),
                    input: data,
                    data: result
                };
                
                setPestelData(result);
                
                // Save using service (Local + Supabase)
                const success = await PESTELService.saveReport(newReport);
                await loadHistory();
                if (success) {
                    toast.success('Bản phân tích đã được tự động lưu.');
                }
            }
        } catch (error) {
            console.error('PESTEL Generation error:', error);
            toast.error('Có lỗi xảy ra khi tạo bản phân tích.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!pestelData || !currentInput) {
            toast.error('Chưa có dữ liệu để lưu bản thảo.');
            return;
        }
        
        const reportId = Date.now().toString();
        const reportToSave: SavedPESTEL = {
            id: reportId,
            timestamp: Date.now(),
            input: currentInput,
            data: pestelData
        };

        const success = await PESTELService.saveReport(reportToSave);
        if (success) {
            toast.success('Đã lưu bản phân tích PESTEL thành công.');
            await loadHistory();
        } else {
            toast.error('Không thể lưu bản phân tích vào hệ thống.');
        }
    };

    const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc muốn xóa bản phân tích này?')) {
            const success = await PESTELService.deleteReport(id);
            if (success) {
                toast.success('Đã xóa bản phân tích.');
                await loadHistory();
            }
        }
    };

    const handleLoadReport = (report: SavedPESTEL) => {
        setPestelData(report.data);
        setCurrentInput(report.input);
        reset(report.input);
        setShowHistory(false);
    };

    const handleReset = () => {
        reset(PESTEL_DEFAULTS);
        setPestelData(null);
        setFormTab(1);
        setCurrentInput(null);
    };

    const cardClass = 'rounded-3xl border border-stone-200/60 bg-white shadow-sm';
    const inputClass = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400';
    
    // Check if required fields are filled
    const watchAll = watch();
    const filledRequiredCount = [
        watchAll.industry, watchAll.location, watchAll.businessScale, 
        watchAll.businessModel, watchAll.mainProductService
    ].filter(Boolean).length;

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC]">
            <FeatureHeader
                icon={Globe}
                eyebrow="MACRO ENVIRONMENT SCAN"
                title="PESTEL Builder"
                subline="Quét radar kinh tế vĩ mô: Chính trị, Kinh tế, Xã hội, Công nghệ, Môi trường, Pháp lý."
            >
                <div className="flex items-center gap-2">
                    <div className="inline-flex gap-1 rounded-full border border-stone-200 bg-stone-50/30 p-1 mr-2 shadow-sm">
                        <button onClick={() => setActiveTab('manual')} className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5' : 'text-stone-400 hover:text-stone-600'}`}>
                            Thủ công
                        </button>
                        <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5' : 'text-stone-400 hover:text-stone-600'}`}>
                            <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-all ${showHistory ? 'bg-stone-900 text-white shadow-md border-stone-900' : 'border-stone-200 text-stone-600 shadow-sm hover:bg-stone-50'}`}
                        title="Lịch sử phân tích"
                    >
                        <History size={18} strokeWidth={1.5} />
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 h-10 w-[161.648px] bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 shadow-sm"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Tạo kế hoạch
                    </button>
                </div>
            </FeatureHeader>

            <div
                className="flex-1 grid overflow-hidden p-6 gap-6"
                style={{
                    gridTemplateColumns: showHistory ? '280px 1fr' : '1fr'
                }}
            >
                {showHistory && (
                    <div className={`${cardClass} overflow-y-auto p-4 space-y-3 bg-stone-50/30`}>
                        <h3 className="text-[10px] font-bold uppercase text-stone-400 mb-4 px-2">Saved PESTEL</h3>
                        {savedReports.length === 0 ? (
                            <div className="text-center py-8 text-stone-400 text-xs italic">Chưa có bản lưu nào.</div>
                        ) : (
                            savedReports.map(m => (
                                <div key={m.id} onClick={() => handleLoadReport(m)} className="group relative p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-300 cursor-pointer transition-all">
                                    <div className="font-medium text-sm text-stone-900 truncate pr-6">{m.input.industry}</div>
                                    <div className="text-[10px] text-stone-400 mt-2">{m.input.location} • {new Date(m.timestamp).toLocaleDateString()}</div>
                                    <button 
                                        onClick={(e) => handleDeleteReport(e, m.id)}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-rose-500 transition-all"
                                    >
                                        <Plus size={14} className="rotate-45" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {!(pestelData || isGenerating) ? (
                    <div className={`${cardClass} flex flex-col overflow-hidden transition-all duration-500 max-w-[1180px] mx-auto w-full`}>
                        <div className="flex shrink-0 border-b border-stone-200 bg-stone-50/50">
                            {FORM_TABS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setFormTab(t.id)}
                                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-3 text-center transition-colors ${formTab === t.id ? 'border-b-2 border-stone-900 text-stone-900' : 'border-b-2 border-transparent text-stone-400 hover:text-stone-600'}`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t.line}</span>
                                    <span className="hidden text-[9px] font-medium leading-tight text-stone-500 sm:block">{t.sub}</span>
                                </button>
                            ))}
                        </div>

                        <div className="overflow-y-auto p-5 md:p-6">
                            {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                                <div className="p-8 rounded-3xl border border-stone-200 bg-stone-50/50 text-center space-y-6 mt-10">
                                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                                    <h2 className="text-xl font-medium">PESTEL Intelligence Pro</h2>
                                    <p className="text-sm text-stone-500 leading-relaxed">Quét radar kinh tế vĩ mô dựa trên quy mô và ngành hàng trong Vault của bạn.</p>
                                    <button type="button" className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2">Get Pro Max Now <ChevronRight size={18} /></button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 flex flex-col">
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 text-xs font-medium">{formTab}</div>
                                                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">{FORM_TABS.find(t => t.id === formTab)?.sub}</h3>
                                            </div>
                                            <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                                                Bắt buộc · {filledRequiredCount}/5
                                            </div>
                                        </div>

                                        {formTab === 1 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <StpOptimizerField
                                                    title="Ngành hàng"
                                                    badge="required"
                                                    subtitle="Yếu tố PESTEL khác nhau hoàn toàn giữa các ngành."
                                                    guideline="Ngành cụ thể càng tốt — không chỉ là 'kinh doanh' hay 'dịch vụ'."
                                                    example="VD: Bất động sản nghỉ dưỡng · F&B chuỗi · Fintech · Giáo dục trực tuyến"
                                                >
                                                    <input {...register('industry', { required: true })} className={inputClass} placeholder="Ngành / vertical" />
                                                </StpOptimizerField>

                                                <StpOptimizerField
                                                    title="Thị trường / Địa lý"
                                                    badge="required"
                                                    subtitle="Luật pháp, chính trị, kinh tế khác nhau theo từng quốc gia/vùng."
                                                    guideline="Thị trường đang hoặc sắp hoạt động."
                                                    example="VD: Việt Nam · TP.HCM + Hà Nội · Đông Nam Á"
                                                >
                                                    <input {...register('location', { required: true })} className={inputClass} placeholder="Địa bàn / quốc gia / vùng" />
                                                </StpOptimizerField>

                                                <StpOptimizerField
                                                    title="Quy mô doanh nghiệp"
                                                    badge="required"
                                                    subtitle="Startup và tập đoàn bị ảnh hưởng khác nhau bởi cùng một yếu tố vĩ mô."
                                                    guideline="Giai đoạn phát triển hiện tại của doanh nghiệp."
                                                    example="VD: Startup (1-3 năm) · SME (3-10 năm) · Enterprise"
                                                >
                                                    <input {...register('businessScale', { required: true })} className={inputClass} placeholder="Quy mô hiện tại" />
                                                </StpOptimizerField>

                                                <StpOptimizerField
                                                    title="Mô hình kinh doanh"
                                                    badge="required"
                                                    subtitle="B2B/B2C/B2B2C có chuỗi cung ứng và rủi ro pháp lý khác nhau."
                                                    guideline="Cách doanh nghiệp tạo ra và phân phối giá trị."
                                                    example="VD: B2C online · B2B SaaS · Marketplace · Franchise"
                                                >
                                                    <input {...register('businessModel', { required: true })} className={inputClass} placeholder="Mô hình vận hành" />
                                                </StpOptimizerField>
                                            </div>
                                        )}

                                        {formTab === 2 && (
                                            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <StpOptimizerField
                                                    fullWidth
                                                    title="Sản phẩm / Dịch vụ chính"
                                                    badge="required"
                                                    subtitle="AI cần biết bạn bán gì để xác định yếu tố PESTEL nào ảnh hưởng trực tiếp."
                                                    guideline="Mô tả ngắn sản phẩm/dịch vụ, kênh phân phối, nguồn cung ứng chính."
                                                    example="VD: Nền tảng đặt tour du lịch cao cấp, làm việc with 50 khách sạn 5 sao, thanh toán qua ví điện tử"
                                                >
                                                    <textarea {...register('mainProductService', { required: true })} className="w-full h-24 rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 focus:border-stone-300 focus:outline-none" placeholder="Mô tả chi tiết sản phẩm..." />
                                                </StpOptimizerField>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <StpOptimizerField
                                                        title="Mối lo ngại lớn nhất"
                                                        badge="important"
                                                        subtitle="Giúp AI ưu tiên yếu tố PESTEL nào cần phân tích sâu hơn."
                                                        guideline="Điều gì đang làm bạn lo lắng nhất về môi trường bên ngoài?"
                                                        example="VD: Luật dữ liệu mới · Lạm phát tăng · Đối thủ nước ngoài vào"
                                                    >
                                                        <input {...register('currentConcern')} className={inputClass} placeholder="Nỗi lo hiện tại..." />
                                                    </StpOptimizerField>

                                                    <StpOptimizerField
                                                        title="Kế hoạch 12-24 tháng"
                                                        badge="important"
                                                        subtitle="PESTEL phải phục vụ quyết định chiến lược — biết kế hoạch thì AI mới tư vấn đúng."
                                                        guideline="Dự định mở rộng, ra mắt sản phẩm mới, gọi vốn, hay duy trì ổn định?"
                                                        example="VD: Mở rộng sang Hà Nội, gọi vốn Series A, ra mắt app v2"
                                                    >
                                                        <input {...register('futurePlan')} className={inputClass} placeholder="Mục tiêu sắp tới..." />
                                                    </StpOptimizerField>
                                                </div>

                                                <StpOptimizerField
                                                    fullWidth
                                                    title="Sự kiện / chính sách đã biết"
                                                    badge="optional"
                                                    subtitle="Nếu user đã biết sự kiện cụ thể → AI phân tích sâu hơn thay vì chỉ nêu tổng quát."
                                                    guideline="Chính sách, luật mới, xu hướng thị trường bạn đã biết."
                                                    example="VD: Nghị định 13/2023 về bảo vệ dữ liệu · Thuế VAT tăng"
                                                >
                                                    <input {...register('knownEventsPolicies')} className={inputClass} placeholder="Nhập luật, chính sách hoặc sự kiện cụ thể..." />
                                                </StpOptimizerField>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex pt-6 shrink-0 ${formTab === 1 ? 'justify-end' : 'justify-between'}`}>
                                        {formTab === 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => setFormTab(2)}
                                                className="flex items-center justify-center px-6 py-2.5 bg-stone-950 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95"
                                            >
                                                Kế tiếp
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormTab(1)}
                                                    className="px-6 py-2.5 border border-stone-200 text-stone-600 rounded-full text-sm font-medium hover:bg-stone-50 transition-all active:scale-95"
                                                >
                                                    Quay lại
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isGenerating}
                                                    className="flex items-center justify-center h-10 w-[161.648px] bg-stone-950 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                                >
                                                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : 'Phân tích PESTEL'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`${cardClass} flex-1 h-full overflow-y-auto p-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full`}>
                        {!pestelData ? (
                            <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50">
                                <div className="text-center space-y-6">
                                    <div className="relative mx-auto w-24 h-24">
                                        <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-stone-900 rounded-full border-t-transparent animate-spin" />
                                        <Globe size={40} className="absolute inset-0 m-auto text-stone-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-stone-900 animate-pulse">{thinkingStep || 'Đang quét radar kinh tế vĩ mô...'}</p>
                                        <p className="text-[11px] text-stone-400">Quá trình này có thể mất 15-30 giây để đạt độ chính xác cao nhất.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in zoom-in-95">
                                <style dangerouslySetInnerHTML={{ __html: REPORT_STYLES }} />
                                <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-6">
                                    <div className="max-w-2xl">
                                        <h2 className="text-3xl font-serif text-stone-900 leading-tight">
                                            {pestelData.pestel_context || pestelData.context}
                                        </h2>
                                        <p className="text-stone-400 text-xs italic tracking-widest mt-2 uppercase">
                                            Macro Scan Intelligence • {pestelData.data_freshness}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={handleSave} 
                                            className="h-10 px-4 bg-white border border-stone-200 rounded-full hover:border-stone-400 shadow-sm transition-all flex items-center gap-2 text-sm font-medium text-stone-700" 
                                            title="Lưu vào Cloud"
                                        >
                                            <Save size={16} /> Lưu bản thảo
                                        </button>
                                        <button 
                                            onClick={handleReset} 
                                            className="h-10 px-6 bg-stone-900 text-white rounded-full hover:bg-stone-800 shadow-lg transition-all text-sm font-medium flex items-center gap-2"
                                        >
                                            <Plus size={16} /> Phân tích mới
                                        </button>
                                    </div>
                                </div>

                                {pestelData.html_report ? (
                                    <div 
                                        className="pestel-report-container pt-4 pb-20"
                                        dangerouslySetInnerHTML={{ __html: pestelData.html_report }} 
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {pestelData.pestel_factors.map((f: PESTELFactorGroup, i: number) => {
                                            const Icon = PESTEL_ICONS[f.category] || Landmark;
                                            return (
                                                <div key={i} className="p-6 rounded-2xl border border-stone-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-5 border-b border-stone-50 pb-3">
                                                        <div className="bg-stone-50 p-2 rounded-xl text-stone-900 shadow-inner"><Icon size={18} /></div>
                                                        <h3 className="text-[11px] font-bold text-stone-900 uppercase tracking-[0.15em]">{f.category_vi}</h3>
                                                    </div>
                                                    <div className="space-y-5">
                                                        {f.items.slice(0, 4).map((item, ii) => (
                                                            <div key={ii} className="group relative">
                                                                <div className="flex justify-between items-start mb-1.5">
                                                                      <div className="flex items-center gap-2">
                                                                           <span className={`w-2 h-2 rounded-full shrink-0 ${item.impact_direction === 'Positive' ? 'bg-emerald-500' : item.impact_direction === 'Negative' ? 'bg-rose-500' : 'bg-amber-500'}`} title={item.impact_direction} />
                                                                           <p className="text-[13px] font-bold text-stone-900 leading-tight">
                                                                                 {item.factor}
                                                                                 {item.is_priority && <span className="ml-2 text-[10px] bg-rose-50 text-rose-600 px-1.5 py-px rounded font-bold uppercase tracking-wider">Ưu tiên</span>}
                                                                           </p>
                                                                      </div>
                                                                      <span className="text-[11px] font-serif font-bold text-stone-400 opacity-60 px-2 py-0.5 bg-stone-50 rounded italic">{item.impact_score}/10</span>
                                                                </div>
                                                                <p className="text-[12px] text-stone-500 leading-relaxed pl-4 mb-3 border-l border-stone-100 italic">{item.detail}</p>
                                                                <div className="bg-stone-50/80 p-3 rounded-xl border border-white shadow-sm">
                                                                    <p className="text-[11px] font-semibold text-stone-900 flex items-start gap-2">
                                                                        <Sparkles size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                                                        <span>{item.actionable_insight}</span>
                                                                    </p>
                                                                    {item.source && (
                                                                        <p className="text-[9px] text-stone-400 mt-2 font-mono uppercase tracking-tighter opacity-80 border-t border-stone-100/50 pt-1.5">Nguồn: {item.source}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PESTELBuilder;
