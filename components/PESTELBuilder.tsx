import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Globe, Sparkles, Loader2, Landmark, TrendingUp, Users, Cpu, Leaf, Scale,
    History, Save, Plus, Trash2, AlertCircle, CheckCircle, HelpCircle, Flag
} from 'lucide-react';
import { PESTELBuilderInput, PESTELBuilderResult, PESTELFactorGroup, PESTELItem } from '../types';
import { generatePESTELAnalysis } from '../services/geminiService';
import { PESTELService, SavedPESTEL } from '../services/pestelService';
import toast, { Toaster } from 'react-hot-toast';

// PESTEL Category Configuration
const PESTEL_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    Political: { icon: <Landmark size={20} />, color: '#6366f1', bgColor: '#eef2ff' },
    Economic: { icon: <TrendingUp size={20} />, color: '#10b981', bgColor: '#ecfdf5' },
    Social: { icon: <Users size={20} />, color: '#f59e0b', bgColor: '#fffbeb' },
    Technological: { icon: <Cpu size={20} />, color: '#3b82f6', bgColor: '#eff6ff' },
    Environmental: { icon: <Leaf size={20} />, color: '#22c55e', bgColor: '#f0fdf4' },
    Legal: { icon: <Scale size={20} />, color: '#8b5cf6', bgColor: '#f5f3ff' }
};

const PESTELBuilder: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<PESTELBuilderInput>();
    const [pestelData, setPestelData] = useState<PESTELBuilderResult | null>(null);
    const [currentInput, setCurrentInput] = useState<PESTELBuilderInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedReports, setSavedReports] = useState<SavedPESTEL[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    useEffect(() => {
        loadSavedReports();
    }, []);

    const loadSavedReports = async () => {
        const reports = await PESTELService.getReports();
        setSavedReports(reports);
    };

    const onSubmit = async (data: PESTELBuilderInput) => {
        setIsGenerating(true);
        setPestelData(null);
        setCurrentInput(data);

        try {
            const result = await generatePESTELAnalysis(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setPestelData(result);
                toast.success('Phân tích PESTEL hoàn tất!', {
                    icon: '🌍',
                    style: { borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }
                });
            } else {
                toast.error('Không thể phân tích PESTEL.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi.');
            console.error(error);
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = async () => {
        if (!pestelData || !currentInput) return;

        const newReport: SavedPESTEL = {
            id: Date.now().toString(),
            input: currentInput,
            data: pestelData,
            timestamp: Date.now()
        };

        const success = await PESTELService.saveReport(newReport);

        if (success) {
            await loadSavedReports();
            toast.success('Đã lưu báo cáo PESTEL!', {
                icon: '💾',
                style: { borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }
            });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoad = (report: SavedPESTEL) => {
        setPestelData(report.data);
        setCurrentInput(report.input);
        reset(report.input);
        setShowHistory(false);
        toast.success('Đã tải báo cáo!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await PESTELService.deleteReport(id);

        if (success) {
            await loadSavedReports();
            toast.success('Đã xóa!', { icon: '🗑️' });
        } else {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleNew = () => {
        setPestelData(null);
        setCurrentInput(null);
        setExpandedCategory(null);
        reset();
        toast.success('Sẵn sàng phân tích mới!', { icon: '✨' });
    };

    // Impact dot color based on direction and score
    const getImpactDot = (item: PESTELItem) => {
        if (item.impact_direction === 'Positive') return 'bg-green-500';
        if (item.impact_direction === 'Negative') return 'bg-red-500';
        return 'bg-yellow-500';
    };

    // Verification status icon
    const getVerificationIcon = (status: string) => {
        if (status === 'Verified') return <CheckCircle size={14} className="text-green-600" />;
        if (status === 'Estimated') return <HelpCircle size={14} className="text-yellow-600" />;
        return <AlertCircle size={14} className="text-red-500" />;
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden font-sans" style={{ backgroundColor: '#F9FAFB' }}>
            <Toaster position="top-center" />

            {/* Header - Soft UI */}
            <div className="bg-white px-8 py-4 flex justify-between items-center shrink-0"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#F9FAFB', color: '#1F2937' }}>
                        <Globe size={22} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold" style={{ color: '#1F2937' }}>PESTEL Builder</h1>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Macroeconomic Environment Analysis</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl transition-all text-sm font-medium hover:bg-slate-50"
                        style={{ borderColor: '#E5E7EB', color: '#374151' }}
                    >
                        <History size={16} /> Lịch sử ({savedReports.length})
                    </button>
                    {pestelData && (
                        <>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl transition-all text-sm font-medium hover:bg-slate-50"
                                style={{ borderColor: '#E5E7EB', color: '#374151' }}
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium text-white"
                                style={{ backgroundColor: '#1F2937' }}
                            >
                                <Save size={16} /> Lưu báo cáo
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '280px 360px 1fr' : '360px 1fr' }}>
                {/* HISTORY SIDEBAR */}
                {showHistory && (
                    <div className="bg-white p-6 overflow-y-auto h-full" style={{ borderRight: '1px solid #F3F4F6' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold" style={{ color: '#1F2937' }}>Lịch sử Báo cáo</h3>
                            <span className="text-xs" style={{ color: '#9CA3AF' }}>{savedReports.length} mục</span>
                        </div>
                        <div className="space-y-3">
                            {savedReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-3.5 rounded-xl border transition-all cursor-pointer group hover:border-slate-300"
                                    style={{ backgroundColor: '#FFFFFF', borderColor: '#F3F4F6' }}
                                    onClick={() => handleLoad(report)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="text-sm font-medium line-clamp-1" style={{ color: '#1F2937' }}>
                                            {report.input.industry}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(report.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-all hover:text-red-500"
                                            style={{ color: '#9CA3AF' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{report.input.location}</p>
                                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                                        {new Date(report.timestamp).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            ))}
                            {savedReports.length === 0 && (
                                <div className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>
                                    Chưa có báo cáo nào được lưu
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* LEFT: Form Panel */}
                <div className="bg-white p-8 overflow-y-auto h-full" style={{ borderRight: '1px solid #F3F4F6' }}>
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg">🌍</span>
                            <h2 className="text-base font-semibold" style={{ color: '#1F2937' }}>Thông tin Doanh nghiệp</h2>
                        </div>
                        <p className="text-sm pl-9" style={{ color: '#9CA3AF' }}>Nhập đủ 3 tham số ngữ cảnh bắt buộc</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Industry */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                                Ngành hàng (Industry) *
                            </label>
                            <input
                                {...register('industry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: Bất động sản nghỉ dưỡng, F&B, Fintech..."
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    color: '#1F2937'
                                }}
                            />
                            {errors.industry && <p className="text-xs text-red-500 mt-1.5">{errors.industry.message}</p>}
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                                Thị trường (Location) *
                            </label>
                            <input
                                {...register('location', { required: 'Vui lòng nhập thị trường' })}
                                placeholder="VD: Việt Nam - Đà Nẵng, TP.HCM, Toàn quốc..."
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    color: '#1F2937'
                                }}
                            />
                            {errors.location && <p className="text-xs text-red-500 mt-1.5">{errors.location.message}</p>}
                        </div>

                        {/* Business Scale */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                                Quy mô Doanh nghiệp (Business Scale) *
                            </label>
                            <select
                                {...register('businessScale', { required: 'Vui lòng chọn quy mô' })}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all cursor-pointer"
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    color: '#1F2937'
                                }}
                            >
                                <option value="">-- Chọn quy mô --</option>
                                <option value="Startup">Startup (Khởi nghiệp)</option>
                                <option value="SME">SME (Doanh nghiệp vừa và nhỏ)</option>
                                <option value="Enterprise">Enterprise (Doanh nghiệp lớn)</option>
                                <option value="Multinational">Multinational (Tập đoàn đa quốc gia)</option>
                            </select>
                            {errors.businessScale && <p className="text-xs text-red-500 mt-1.5">{errors.businessScale.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-3.5 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
                            style={{ backgroundColor: '#1F2937' }}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang phân tích...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Phân tích PESTEL
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info Box */}
                    <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <h3 className="text-sm font-medium mb-2" style={{ color: '#166534' }}>📋 Anti-Hallucination Protocol:</h3>
                        <ul className="text-xs space-y-1" style={{ color: '#15803D' }}>
                            <li>• P/L: Trích dẫn Luật, Nghị định cụ thể</li>
                            <li>• E: Số liệu GDP, CPI, Lãi suất %</li>
                            <li>• S/T: Hành vi tiêu dùng thực tế</li>
                            <li>• Không có nguồn → Đánh dấu "Unverified"</li>
                        </ul>
                    </div>
                </div>

                {/* RIGHT: Results Grid */}
                <div className="p-8 overflow-auto h-full" style={{ backgroundColor: '#F9FAFB' }}>
                    {!pestelData && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center" style={{ color: '#9CA3AF' }}>
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4"
                                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Globe size={28} strokeWidth={1.5} style={{ color: '#D1D5DB' }} />
                            </div>
                            <p className="text-base font-medium" style={{ color: '#374151' }}>PESTEL Analysis</p>
                            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Nhập thông tin để bắt đầu phân tích</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-14 h-14 mb-6">
                                <div className="absolute inset-0 rounded-full" style={{ border: '4px solid #F3F4F6' }}></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                                    style={{ borderTopColor: '#1F2937' }}></div>
                            </div>
                            <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>{thinkingStep}</p>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>Đang áp dụng Citation or Doubt Protocol...</p>
                        </div>
                    )}

                    {pestelData && !isGenerating && (
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-1" style={{ color: '#1F2937' }}>{pestelData.context}</h2>
                                <p className="text-sm" style={{ color: '#6B7280' }}>
                                    {pestelData.data_freshness} • Tạo lúc {new Date(pestelData.generated_at).toLocaleString('vi-VN')}
                                </p>
                            </div>

                            {/* PESTEL Grid - 3x2 */}
                            <div className="grid grid-cols-3 gap-4">
                                {pestelData.pestel_factors.map((factor: PESTELFactorGroup) => {
                                    const config = PESTEL_CONFIG[factor.category] || PESTEL_CONFIG.Political;
                                    const isExpanded = expandedCategory === factor.category;

                                    return (
                                        <div
                                            key={factor.category}
                                            className={`bg-white rounded-2xl p-5 cursor-pointer transition-all ${isExpanded ? 'col-span-3' : ''}`}
                                            style={{
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                                border: isExpanded ? `2px solid ${config.color}` : '1px solid transparent'
                                            }}
                                            onClick={() => setExpandedCategory(isExpanded ? null : factor.category)}
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: config.bgColor, color: config.color }}>
                                                    {config.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-semibold" style={{ color: '#1F2937' }}>
                                                        {factor.category_vi}
                                                    </h3>
                                                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                                                        {factor.items.length} yếu tố
                                                    </p>
                                                </div>
                                                {/* Impact Dots Summary */}
                                                <div className="flex gap-1">
                                                    {factor.items.slice(0, 3).map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`w-2.5 h-2.5 rounded-full ${getImpactDot(item)}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Preview (collapsed) */}
                                            {!isExpanded && factor.items.length > 0 && (
                                                <div className="space-y-2">
                                                    {factor.items.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-2">
                                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getImpactDot(item)}`} />
                                                            <div className="flex-1 flex items-center gap-2">
                                                                <p className="text-xs line-clamp-1" style={{ color: '#4B5563' }}>
                                                                    {item.factor}
                                                                </p>
                                                                {item.is_priority && (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium shrink-0"
                                                                        style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                                                        <Flag size={10} /> Ưu tiên
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {factor.items.length > 2 && (
                                                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                                                            +{factor.items.length - 2} yếu tố khác...
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Expanded View */}
                                            {isExpanded && (
                                                <div className="space-y-4 mt-4">
                                                    {factor.items.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-4 rounded-xl"
                                                            style={{ backgroundColor: '#F9FAFB' }}
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <div className={`w-3 h-3 rounded-full shrink-0 ${getImpactDot(item)}`} />
                                                                    <h4 className="text-sm font-medium" style={{ color: '#1F2937' }}>
                                                                        {item.factor}
                                                                    </h4>
                                                                    {item.is_priority && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                                                            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                                                            <Flag size={11} /> High Priority
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {getVerificationIcon(item.verification_status)}
                                                                    <span className="text-xs px-2 py-0.5 rounded-full"
                                                                        style={{
                                                                            backgroundColor: item.verification_status === 'Verified' ? '#DCFCE7' :
                                                                                item.verification_status === 'Estimated' ? '#FEF9C3' : '#FEE2E2',
                                                                            color: item.verification_status === 'Verified' ? '#166534' :
                                                                                item.verification_status === 'Estimated' ? '#854D0E' : '#991B1B'
                                                                        }}>
                                                                        {item.verification_status}
                                                                    </span>
                                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                                        style={{
                                                                            backgroundColor: '#F3F4F6',
                                                                            color: '#374151'
                                                                        }}>
                                                                        {item.impact_score}/10
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm mb-3" style={{ color: '#4B5563' }}>
                                                                {item.detail}
                                                            </p>
                                                            {item.source && (
                                                                <p className="text-xs italic mb-2" style={{ color: '#9CA3AF' }}>
                                                                    📎 {item.source}
                                                                </p>
                                                            )}
                                                            <div className="p-3 rounded-lg" style={{ backgroundColor: '#EEF2FF' }}>
                                                                <p className="text-xs font-medium" style={{ color: '#4338CA' }}>
                                                                    💡 Khuyến nghị: {item.actionable_insight}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-xs" style={{ color: '#6B7280' }}>Cơ hội (Positive)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <span className="text-xs" style={{ color: '#6B7280' }}>Trung lập (Neutral)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-xs" style={{ color: '#6B7280' }}>Thách thức (Negative)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                                        style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                        <Flag size={10} /> High Priority
                                    </span>
                                    <span className="text-xs" style={{ color: '#6B7280' }}>Ưu tiên xử lý (≥8/10)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PESTELBuilder;
