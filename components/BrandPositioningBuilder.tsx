import React, { useState, useRef, useEffect } from 'react';
import { BrandPositioningInput, BrandPositioningResult } from '../types';
import { buildBrandPositioning } from '../services/geminiService';
import { BrandPositioningService, SavedBrandPositioning } from '../services/brandPositioningService';
import {
    Compass, AlertTriangle, RefreshCw, Sparkles, Target, MessageSquare, Quote,
    Shield, Mountain, Lightbulb, Crown, Heart, Smile, Users, Palette, Wand2,
    Search, Swords, Sun, Download, Building2, Tag, CheckCircle, Save, History, X, Trash2
} from 'lucide-react';
import { Toast, ToastType } from './Toast';

interface Props {
    isActive: boolean;
}

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const textareaClass = `${inputClass} resize-none`;

// Archetype data with icons
const ARCHETYPE_ICONS: Record<string, React.ReactNode> = {
    'innocent': <Sun className="w-7 h-7" strokeWidth={1.25} />,
    'sage': <Lightbulb className="w-7 h-7" strokeWidth={1.25} />,
    'explorer': <Search className="w-7 h-7" strokeWidth={1.25} />,
    'outlaw': <Swords className="w-7 h-7" strokeWidth={1.25} />,
    'magician': <Wand2 className="w-7 h-7" strokeWidth={1.25} />,
    'hero': <Mountain className="w-7 h-7" strokeWidth={1.25} />,
    'lover': <Heart className="w-7 h-7" strokeWidth={1.25} />,
    'jester': <Smile className="w-7 h-7" strokeWidth={1.25} />,
    'everyman': <Users className="w-7 h-7" strokeWidth={1.25} />,
    'caregiver': <Shield className="w-7 h-7" strokeWidth={1.25} />,
    'ruler': <Crown className="w-7 h-7" strokeWidth={1.25} />,
    'creator': <Palette className="w-7 h-7" strokeWidth={1.25} />,
};

const getArchetypeIcon = (archetype: string): React.ReactNode => {
    const lower = archetype.toLowerCase();
    for (const key of Object.keys(ARCHETYPE_ICONS)) {
        if (lower.includes(key)) return ARCHETYPE_ICONS[key];
    }
    return <Compass className="w-7 h-7" strokeWidth={1.25} />;
};

const getArchetypeColor = (archetype: string): string => {
    const lower = archetype.toLowerCase();
    if (lower.includes('innocent')) return 'from-sky-50 to-sky-100 border-sky-200 text-sky-700';
    if (lower.includes('sage')) return 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700';
    if (lower.includes('explorer')) return 'from-amber-50 to-amber-100 border-amber-200 text-amber-700';
    if (lower.includes('outlaw')) return 'from-stone-50 to-stone-100 border-stone-300 text-stone-800';
    if (lower.includes('magician')) return 'from-purple-50 to-purple-100 border-purple-200 text-purple-700';
    if (lower.includes('hero')) return 'from-rose-50 to-rose-100 border-rose-200 text-rose-700';
    if (lower.includes('lover')) return 'from-pink-50 to-pink-100 border-pink-200 text-pink-700';
    if (lower.includes('jester')) return 'from-orange-50 to-orange-100 border-orange-200 text-orange-700';
    if (lower.includes('everyman')) return 'from-stone-50 to-stone-100 border-stone-200 text-stone-700';
    if (lower.includes('caregiver')) return 'from-teal-50 to-teal-100 border-teal-200 text-teal-700';
    if (lower.includes('ruler')) return 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800';
    if (lower.includes('creator')) return 'from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-700';
    return 'from-stone-50 to-stone-100 border-stone-200 text-stone-700';
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

    const [showHistory, setShowHistory] = useState(false);
    const [savedPositionings, setSavedPositionings] = useState<SavedBrandPositioning[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* Header */}
            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Compass size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Brand Strategy
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        Brand Positioning Builder
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Xây dựng bộ khung định vị thương hiệu chuẩn MBA
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${showHistory
                            ? 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                            : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                            }`}
                    >
                        <History size={17} strokeWidth={1.25} /> Lịch sử ({savedPositionings.length})
                    </button>
                    {result && (
                        <>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                            >
                                <Save size={17} strokeWidth={1.25} /> Lưu
                            </button>
                            <button
                                type="button"
                                onClick={handleExportPDF}
                                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                            >
                                <Download size={17} strokeWidth={1.25} /> Tải PDF
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="grid min-h-0 flex-1 gap-6 overflow-hidden p-4 md:p-6 md:pt-5"
                style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,380px) 1fr' : 'minmax(0,380px) 1fr' }}
            >
                {/* History Column */}
                {showHistory && (
                    <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                                    <History size={18} strokeWidth={1.25} className="text-stone-400" aria-hidden />
                                    Lịch sử
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowHistory(false)}
                                    className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                                >
                                    <X size={16} strokeWidth={1.25} />
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {savedPositionings.length === 0 ? (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có Brand Positioning nào.</div>
                            ) : savedPositionings.map(positioning => (
                                <div
                                    key={positioning.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleLoad(positioning)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLoad(positioning)}
                                    className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                >
                                    <div className="mb-1.5 flex items-start justify-between gap-2">
                                        <p className="line-clamp-1 text-sm font-medium text-stone-900">{positioning.name}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(positioning.id); }}
                                            className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            aria-label="Xóa"
                                        >
                                            <Trash2 size={14} strokeWidth={1.25} />
                                        </button>
                                    </div>
                                    <p className="mb-1 text-xs font-normal text-stone-500">
                                        {new Date(positioning.createdAt).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p className="text-xs font-medium text-stone-600">{positioning.result.brand_identity.archetype}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Column */}
                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    <div className="mb-6 flex items-center gap-2 border-b border-stone-100 pb-4">
                        <div className="h-5 w-0.5 rounded-full bg-stone-800" aria-hidden />
                        <h2 className="text-base font-medium tracking-tight text-stone-900">Thông tin Thương hiệu</h2>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                                <Building2 size={13} strokeWidth={1.25} /> Tên Thương hiệu
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="VD: OptiMKT, LegalTech…"
                                value={input.brandName}
                                onChange={(e) => setInput({ ...input, brandName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                                <Tag size={13} strokeWidth={1.25} /> Sản phẩm / Dịch vụ
                            </label>
                            <textarea
                                className={`${textareaClass} h-20`}
                                placeholder="Mô tả ngắn về sản phẩm/dịch vụ chính…"
                                value={input.products}
                                onChange={(e) => setInput({ ...input, products: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                                <Users size={13} strokeWidth={1.25} /> Khách hàng Mục tiêu
                            </label>
                            <textarea
                                className={`${textareaClass} h-20`}
                                placeholder="VD: Startup công nghệ, 25-35 tuổi, cần pháp lý nhanh…"
                                value={input.targetCustomers}
                                onChange={(e) => setInput({ ...input, targetCustomers: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                                <Target size={13} strokeWidth={1.25} /> Đối thủ Cạnh tranh
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="VD: Brand A, Brand B, Brand C…"
                                value={input.competitors}
                                onChange={(e) => setInput({ ...input, competitors: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                                <Sparkles size={13} strokeWidth={1.25} /> Tầm nhìn / Sứ mệnh (Tùy chọn)
                            </label>
                            <textarea
                                className={`${textareaClass} h-20`}
                                placeholder="VD: Trở thành nền tảng pháp lý #1 cho Startup Việt Nam…"
                                value={input.visionMission}
                                onChange={(e) => setInput({ ...input, visionMission: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4">
                            <AlertTriangle size={18} strokeWidth={1.25} className="mt-0.5 shrink-0 text-rose-600" />
                            <p className="text-sm font-normal leading-relaxed text-rose-700">{error}</p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleBuild}
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-stone-900 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <RefreshCw size={18} strokeWidth={1.25} className="animate-spin" />
                                {loadingStep || 'Đang xử lý…'}
                            </>
                        ) : (
                            <>
                                <Compass size={18} strokeWidth={1.25} />
                                Xây dựng Brand Canvas
                            </>
                        )}
                    </button>
                </div>

                {/* Results Column */}
                <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
                    {!result ? (
                        <div className="flex min-h-[400px] flex-col items-center justify-center">
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                <Compass size={28} strokeWidth={1.25} className="text-stone-300" />
                            </div>
                            <h3 className="mb-2 text-base font-medium text-stone-700">Brand Canvas</h3>
                            <p className="mb-6 max-w-xs text-center text-sm font-normal text-stone-500 leading-relaxed">
                                Điền thông tin thương hiệu để AI xây dựng bộ khung định vị chuẩn MBA với Archetype, USP, UVP và Positioning Statement.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {['Archetype', 'USP', 'UVP', 'RTB', 'Positioning'].map(tag => (
                                    <span key={tag} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div ref={canvasRef}>
                            {/* Brand Canvas Header */}
                            <div className="border-b border-stone-100 pb-6 text-center">
                                <h2 className="text-3xl font-black tracking-tight text-stone-900">{input.brandName}</h2>
                                <p className="mt-1 text-sm font-normal text-stone-500">Brand Strategy Canvas</p>
                            </div>

                            {/* Grid Layout */}
                            <div className="grid grid-cols-1 gap-6 pt-6">
                                {/* Archetype Card */}
                                <div className={`rounded-2xl border-2 p-6 bg-gradient-to-br ${getArchetypeColor(result.brand_identity.archetype)}`}>
                                    <div className="flex items-start gap-5">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                                            {getArchetypeIcon(result.brand_identity.archetype)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider opacity-60">Brand Archetype</div>
                                            <h3 className="mb-2 text-xl font-bold">{result.brand_identity.archetype}</h3>
                                            <p className="mb-4 text-sm leading-relaxed opacity-90">{result.brand_identity.archetype_desc}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {result.brand_identity.tone_of_voice.map((tone, idx) => (
                                                    <span key={idx} className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                                                        {tone}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* USP Card */}
                                <div className={`${cardClass} p-6`}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
                                            <Target size={16} strokeWidth={1.25} className="text-stone-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-stone-900">USP</h4>
                                            <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">Unique Selling Proposition</p>
                                        </div>
                                    </div>
                                    <p className="leading-relaxed text-stone-700">{result.strategic_pillars.usp}</p>
                                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Sự khác biệt so với đối thủ</p>
                                </div>

                                {/* UVP Card */}
                                <div className={`${cardClass} p-6`}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
                                            <Sparkles size={16} strokeWidth={1.25} className="text-stone-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-stone-900">UVP</h4>
                                            <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">Unique Value Proposition</p>
                                        </div>
                                    </div>
                                    <p className="leading-relaxed text-stone-700">{result.strategic_pillars.uvp}</p>
                                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Giá trị mang lại cho khách hàng</p>
                                </div>

                                {/* RTB Card */}
                                <div className={`${cardClass} p-6`}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
                                            <Shield size={16} strokeWidth={1.25} className="text-stone-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-stone-900">RTB</h4>
                                            <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">Reason to Believe</p>
                                        </div>
                                        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-stone-400">Bằng chứng</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {result.strategic_pillars.rtb.map((rtb, idx) => (
                                            <div key={idx} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-2 text-sm font-medium text-stone-700">
                                                <CheckCircle size={15} strokeWidth={1.25} className="shrink-0 text-stone-400" />
                                                {rtb}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Messaging Pillars */}
                                <div className={`${cardClass} p-6`}>
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
                                            <MessageSquare size={16} strokeWidth={1.25} className="text-stone-500" />
                                        </div>
                                        <h4 className="font-semibold text-stone-900">Messaging Pillars</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {result.messaging_pillars.map((pillar, idx) => (
                                            <div key={idx} className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white text-[11px] font-bold text-stone-600">
                                                        {idx + 1}
                                                    </span>
                                                    <h5 className="text-sm font-semibold text-stone-900">{pillar.pillar_name}</h5>
                                                </div>
                                                <p className="text-sm leading-relaxed text-stone-600">{pillar.key_message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Positioning Statement */}
                                <div className={`${cardClass} border-2 border-stone-300 p-8`}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
                                            <Quote size={16} strokeWidth={1.25} className="text-stone-500" />
                                        </div>
                                        <h4 className="font-semibold text-stone-900">Positioning Statement</h4>
                                    </div>
                                    <p className="text-lg font-semibold leading-relaxed italic text-stone-800">
                                        &ldquo;{result.positioning_statement}&rdquo;
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 border-t border-stone-100 pt-6 text-center">
                                <p className="text-xs text-stone-400">
                                    Generated by MKTLAB Brand Positioning Builder
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default BrandPositioningBuilder;
