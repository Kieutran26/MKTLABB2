import React, { useState, useRef, useEffect } from 'react';
import { BrandPositioningInput, BrandPositioningResult } from '../types';
import { buildBrandPositioning } from '../services/geminiService';
import { BrandPositioningService, SavedBrandPositioning } from '../services/brandPositioningService';
import {
    Compass, AlertTriangle, RefreshCw, Sparkles, Target, MessageSquare, Quote,
    Shield, Mountain, Lightbulb, Crown, Heart, Smile, Users, Palette, Wand2,
    Search, Swords, Sun, Download, Building2, Tag, FileText, CheckCircle, Save, History, X, Trash2
} from 'lucide-react';
import { Toast, ToastType } from './Toast';

interface Props {
    isActive: boolean;
}

// Archetype data with icons
const ARCHETYPE_ICONS: Record<string, React.ReactNode> = {
    'innocent': <Sun className="w-8 h-8" />,
    'sage': <Lightbulb className="w-8 h-8" />,
    'explorer': <Search className="w-8 h-8" />,
    'outlaw': <Swords className="w-8 h-8" />,
    'magician': <Wand2 className="w-8 h-8" />,
    'hero': <Mountain className="w-8 h-8" />,
    'lover': <Heart className="w-8 h-8" />,
    'jester': <Smile className="w-8 h-8" />,
    'everyman': <Users className="w-8 h-8" />,
    'caregiver': <Shield className="w-8 h-8" />,
    'ruler': <Crown className="w-8 h-8" />,
    'creator': <Palette className="w-8 h-8" />,
};

const getArchetypeIcon = (archetype: string): React.ReactNode => {
    const lower = archetype.toLowerCase();
    for (const key of Object.keys(ARCHETYPE_ICONS)) {
        if (lower.includes(key)) return ARCHETYPE_ICONS[key];
    }
    return <Compass className="w-8 h-8" />;
};

const getArchetypeColor = (archetype: string): string => {
    const lower = archetype.toLowerCase();
    if (lower.includes('innocent')) return 'from-sky-50 to-sky-100 border-sky-200 text-sky-700';
    if (lower.includes('sage')) return 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700';
    if (lower.includes('explorer')) return 'from-amber-50 to-amber-100 border-amber-200 text-amber-700';
    if (lower.includes('outlaw')) return 'from-slate-50 to-slate-100 border-slate-300 text-slate-800';
    if (lower.includes('magician')) return 'from-purple-50 to-purple-100 border-purple-200 text-purple-700';
    if (lower.includes('hero')) return 'from-rose-50 to-rose-100 border-rose-200 text-rose-700';
    if (lower.includes('lover')) return 'from-pink-50 to-pink-100 border-pink-200 text-pink-700';
    if (lower.includes('jester')) return 'from-orange-50 to-orange-100 border-orange-200 text-orange-700';
    if (lower.includes('everyman')) return 'from-stone-50 to-stone-100 border-stone-200 text-stone-700';
    if (lower.includes('caregiver')) return 'from-teal-50 to-teal-100 border-teal-200 text-teal-700';
    if (lower.includes('ruler')) return 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800';
    if (lower.includes('creator')) return 'from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-700';
    return 'from-slate-50 to-slate-100 border-slate-200 text-slate-700';
};

const BrandPositioningBuilder: React.FC<Props> = ({ isActive }) => {
    const [input, setInput] = useState<BrandPositioningInput>({
        brandName: '',
        products: '',
        targetCustomers: '',
        competitors: '',
        visionMission: ''
    });
    const [result, setResult] = useState<BrandPositioningResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');
    const canvasRef = useRef<HTMLDivElement>(null);

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [savedPositionings, setSavedPositionings] = useState<SavedBrandPositioning[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Load history on mount
    useEffect(() => {
        const loadHistory = async () => {
            const positionings = await BrandPositioningService.getBrandPositionings();
            setSavedPositionings(positionings);
        };
        loadHistory();
    }, []);

    if (!isActive) return null;

    const handleBuild = async () => {
        if (!input.brandName || !input.products || !input.targetCustomers) {
            setError('Vui lòng điền đầy đủ: Tên thương hiệu, Sản phẩm, Khách hàng mục tiêu');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await buildBrandPositioning(input, (step) => setLoadingStep(step));
            if (data) {
                setResult(data);
            } else {
                setError('Không thể xây dựng Brand Canvas. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi trong quá trình xử lý.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!canvasRef.current || !result) return;

        try {
            // Dynamic import for better performance
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(canvasRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${input.brandName}_Brand_Guidelines.pdf`);
        } catch (err) {
            console.error('PDF Export Error:', err);
            setError('Không thể xuất PDF. Vui lòng thử lại.');
        }
    };

    const handleSave = async () => {
        if (!result) {
            setToast({ message: 'Chưa có dữ liệu để lưu!', type: 'error' });
            return;
        }

        const newPositioning: SavedBrandPositioning = {
            id: Date.now().toString(),
            name: `${input.brandName} - ${new Date().toLocaleDateString()}`,
            input,
            result,
            createdAt: Date.now()
        };

        const success = await BrandPositioningService.saveBrandPositioning(newPositioning);

        if (success) {
            const positionings = await BrandPositioningService.getBrandPositionings();
            setSavedPositionings(positionings);
            setToast({ message: 'Đã lưu Brand Positioning!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi lưu!', type: 'error' });
        }
    };

    const handleLoad = (positioning: SavedBrandPositioning) => {
        setInput(positioning.input);
        setResult(positioning.result);
        setShowHistory(false);
        setToast({ message: 'Đã tải Brand Positioning!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        const success = await BrandPositioningService.deleteBrandPositioning(id);

        if (success) {
            const positionings = await BrandPositioningService.getBrandPositionings();
            setSavedPositionings(positionings);
            setToast({ message: 'Đã xóa!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi xóa!', type: 'error' });
        }
    };

    return (
        <div className="w-full p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Compass className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Brand Positioning Builder</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Xây dựng bộ khung định vị thương hiệu chuẩn MBA</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {result && (
                        <>
                            <button
                                onClick={handleSave}
                                className="group bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold transition-all"
                            >
                                <Save size={16} className="group-hover:scale-110 transition-transform" />
                                Lưu
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Tải PDF
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="group bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold transition-all"
                    >
                        <History size={16} className="group-hover:scale-110 transition-transform" />
                        Lịch sử
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Panel: Input */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
                            <h2 className="font-bold text-slate-800 text-lg">Thông tin Thương hiệu</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Tên Thương hiệu
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                                    placeholder="VD: OptiMKT, LegalTech..."
                                    value={input.brandName}
                                    onChange={(e) => setInput({ ...input, brandName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" />
                                    Sản phẩm / Dịch vụ
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all outline-none resize-none h-20"
                                    placeholder="Mô tả ngắn về sản phẩm/dịch vụ chính..."
                                    value={input.products}
                                    onChange={(e) => setInput({ ...input, products: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    Khách hàng Mục tiêu
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all outline-none resize-none h-20"
                                    placeholder="VD: Startup công nghệ, 25-35 tuổi, cần pháp lý nhanh..."
                                    value={input.targetCustomers}
                                    onChange={(e) => setInput({ ...input, targetCustomers: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5" />
                                    Đối thủ Cạnh tranh
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                                    placeholder="VD: Brand A, Brand B, Brand C..."
                                    value={input.competitors}
                                    onChange={(e) => setInput({ ...input, competitors: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Tầm nhìn / Sứ mệnh (Tùy chọn)
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all outline-none resize-none h-20"
                                    placeholder="VD: Trở thành nền tảng pháp lý #1 cho Startup Việt Nam..."
                                    value={input.visionMission}
                                    onChange={(e) => setInput({ ...input, visionMission: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mt-5 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p className="leading-snug">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleBuild}
                            disabled={loading}
                            className="w-full mt-6 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 hover:-translate-y-0.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2.5 text-base group"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    {loadingStep || 'Đang xử lý...'}
                                </>
                            ) : (
                                <>
                                    <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
                                    Xây dựng Brand Canvas
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Results - Brand Canvas */}
                <div className="xl:col-span-8 space-y-6">
                    {!result ? (
                        <div className="h-full min-h-[600px] bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors flex flex-col items-center justify-center text-slate-400 group cursor-default p-8">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-500">
                                <Compass className="w-10 h-10 text-slate-300 group-hover:text-teal-500 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 mb-2">Brand Canvas</h3>
                            <p className="text-slate-500 max-w-sm text-center leading-relaxed mb-6">
                                Điền thông tin thương hiệu để AI xây dựng bộ khung định vị chuẩn MBA với Archetype, USP, UVP và Positioning Statement.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {['Archetype', 'USP', 'UVP', 'RTB', 'Positioning'].map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-500 border border-slate-200">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div ref={canvasRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                            {/* Brand Canvas Header */}
                            <div className="text-center border-b border-slate-100 pb-6">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{input.brandName}</h2>
                                <p className="text-slate-500 mt-1">Brand Strategy Canvas</p>
                            </div>

                            {/* Grid Layout - A4 Style */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Archetype Card */}
                                <div className={`col-span-1 md:col-span-2 rounded-2xl border-2 p-6 bg-gradient-to-br ${getArchetypeColor(result.brand_identity.archetype)}`}>
                                    <div className="flex items-start gap-5">
                                        <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center shadow-sm">
                                            {getArchetypeIcon(result.brand_identity.archetype)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Brand Archetype</div>
                                            <h3 className="text-xl font-bold mb-2">{result.brand_identity.archetype}</h3>
                                            <p className="text-sm opacity-90 leading-relaxed mb-4">{result.brand_identity.archetype_desc}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {result.brand_identity.tone_of_voice.map((tone, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-white/60 rounded-full text-xs font-bold uppercase tracking-wide">
                                                        {tone}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* USP Card */}
                                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-rose-100 rounded-lg">
                                            <Target className="w-4 h-4 text-rose-600" />
                                        </div>
                                        <h4 className="font-bold text-slate-800">USP (Unique Selling Proposition)</h4>
                                    </div>
                                    <p className="text-slate-700 font-medium leading-relaxed">{result.strategic_pillars.usp}</p>
                                    <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sự khác biệt so với đối thủ</div>
                                </div>

                                {/* UVP Card */}
                                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <Sparkles className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <h4 className="font-bold text-slate-800">UVP (Unique Value Proposition)</h4>
                                    </div>
                                    <p className="text-slate-700 font-medium leading-relaxed">{result.strategic_pillars.uvp}</p>
                                    <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Giá trị mang lại cho khách hàng</div>
                                </div>

                                {/* RTB Card */}
                                <div className="col-span-1 md:col-span-2 rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Shield className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <h4 className="font-bold text-slate-800">RTB (Reason to Believe)</h4>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-auto">Bằng chứng</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {result.strategic_pillars.rtb.map((rtb, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                {rtb}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Messaging Pillars */}
                                <div className="col-span-1 md:col-span-2 rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <MessageSquare className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <h4 className="font-bold text-slate-800">Messaging Pillars</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {result.messaging_pillars.map((pillar, idx) => (
                                            <div key={idx} className="p-4 bg-white rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                    <h5 className="font-bold text-slate-800 text-sm">{pillar.pillar_name}</h5>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed">{pillar.key_message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Positioning Statement */}
                                <div className="col-span-1 md:col-span-2 rounded-2xl border-2 border-teal-200 p-8 bg-teal-50/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-teal-100 rounded-lg">
                                            <Quote className="w-4 h-4 text-teal-600" />
                                        </div>
                                        <h4 className="font-bold text-teal-800">Positioning Statement</h4>
                                    </div>
                                    <p className="text-teal-900 text-lg font-semibold leading-relaxed italic">
                                        "{result.positioning_statement}"
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center pt-6 border-t border-slate-100">
                                <p className="text-xs text-slate-400">
                                    Generated by OptiMKT Brand Positioning Builder • Powered by Gemini 1.5 Pro
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in border border-slate-100 flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> Lịch sử Brand Positioning</h3>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3">
                            {savedPositionings.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Chưa có Brand Positioning nào.</div>
                            ) : savedPositionings.map(positioning => (
                                <div key={positioning.id} className="p-4 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-slate-50 transition-all group">
                                    <div className="flex items-start gap-3">
                                        <button onClick={() => handleLoad(positioning)} className="flex-1 text-left">
                                            <div className="font-bold text-slate-800 mb-1">{positioning.name}</div>
                                            <div className="text-xs text-slate-400 mb-2">{new Date(positioning.createdAt).toLocaleDateString('vi-VN')}</div>
                                            <div className="text-xs text-teal-600 font-bold">{positioning.result.brand_identity.archetype}</div>
                                        </button>
                                        <button onClick={() => handleDelete(positioning.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default BrandPositioningBuilder;
