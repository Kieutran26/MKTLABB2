import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Layers, Sparkles, Loader2, Target, Users, Award, AlertTriangle, History, Save, Plus, Trash2, ChevronRight, Zap } from 'lucide-react';
import { STPInput, STPResult, STPSegment } from '../types';
import { generateSTPAnalysis } from '../services/geminiService';
import { STPService, SavedSTP } from '../services/stpService';
import toast, { Toaster } from 'react-hot-toast';

const STPModelGenerator: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<STPInput>();
    const [stpData, setStpData] = useState<STPResult | null>(null);
    const [currentInput, setCurrentInput] = useState<STPInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [savedItems, setSavedItems] = useState<SavedSTP[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [activeTab, setActiveTab] = useState<'segmentation' | 'targeting' | 'positioning'>('segmentation');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const items = await STPService.getSTPHistory();
        setSavedItems(items);
    };

    const onSubmit = async (data: STPInput) => {
        setIsGenerating(true);
        setStpData(null);
        setCurrentInput(data);

        try {
            const result = await generateSTPAnalysis(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setStpData(result);
                if (result.validationStatus === 'PASS') {
                    toast.success('Phân tích STP hoàn tất!', {
                        icon: '🎯',
                        style: { borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }
                    });
                }
            } else {
                toast.error('Không thể phân tích STP.');
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
        if (!stpData || !currentInput) return;

        const newItem: SavedSTP = {
            id: Date.now().toString(),
            input: currentInput,
            data: stpData,
            timestamp: Date.now()
        };

        const success = await STPService.saveSTP(newItem);

        if (success) {
            await loadHistory();
            toast.success('Đã lưu STP Analysis!', { icon: '💾' });
        } else {
            toast.error('Lỗi khi lưu!');
        }
    };

    const handleLoad = (item: SavedSTP) => {
        setStpData(item.data);
        setCurrentInput(item.input);
        reset(item.input);
        setShowHistory(false);
        toast.success('Đã tải STP Analysis!', { icon: '📂' });
    };

    const handleDelete = async (id: string) => {
        const success = await STPService.deleteSTP(id);
        if (success) {
            await loadHistory();
            toast.success('Đã xóa!', { icon: '🗑️' });
        }
    };

    const handleNew = () => {
        setStpData(null);
        setCurrentInput(null);
        reset();
        toast.success('Sẵn sàng phân tích mới!', { icon: '✨' });
    };

    // Segment Card Component
    const SegmentCard = ({ segment, index }: { segment: STPSegment; index: number }) => (
        <div className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-all">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-semibold text-sm">
                    {index + 1}
                </div>
                <h4 className="text-base font-semibold text-slate-900">{segment.name}</h4>
            </div>
            <p className="text-sm text-slate-600 mb-4">{segment.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Demographics</p>
                    <p className="text-sm text-slate-700">{segment.demographics}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Psychographics</p>
                    <p className="text-sm text-slate-700">{segment.psychographics}</p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Quy mô ước tính</p>
                <p className="text-sm font-medium text-slate-800">{segment.size_estimate}</p>
            </div>

            <div className="space-y-2">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Nhu cầu</p>
                    <div className="flex flex-wrap gap-1">
                        {segment.needs.map((need, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">{need}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Hành vi</p>
                    <div className="flex flex-wrap gap-1">
                        {segment.behaviors.map((behavior, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md">{behavior}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                        <Layers size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">STP Model Generator</h1>
                        <p className="text-xs text-slate-400">Segmentation - Targeting - Positioning</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all text-sm"
                    >
                        <History size={16} /> Lịch sử ({savedItems.length})
                    </button>
                    {stpData && stpData.validationStatus !== 'FAIL' && (
                        <>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all text-sm"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all text-sm"
                            >
                                <Save size={16} /> Lưu
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '280px 400px 1fr' : '400px 1fr' }}>
                {/* History Sidebar */}
                {showHistory && (
                    <div className="bg-white border-r border-slate-100 p-5 overflow-y-auto h-full">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-semibold text-slate-900">Lịch sử STP</h3>
                            <span className="text-xs text-slate-400">{savedItems.length} mục</span>
                        </div>
                        <div className="space-y-2">
                            {savedItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleLoad(item)}
                                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.input.productBrand}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">{item.input.industry}</p>
                                    <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString('vi-VN')}</p>
                                </div>
                            ))}
                            {savedItems.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">Chưa có STP nào được lưu</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Form Panel */}
                <div className="bg-white border-r border-slate-100 p-6 overflow-y-auto h-full">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-slate-700 text-lg">📊</span>
                            <h2 className="text-base font-semibold text-slate-900">Thông tin phân tích</h2>
                        </div>
                        <p className="text-sm text-slate-400 pl-9">Nhập thông tin CHI TIẾT để có kết quả chính xác</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Required Fields */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Sản phẩm / Thương hiệu *</label>
                            <input
                                {...register('productBrand', { required: 'Vui lòng nhập tên sản phẩm/thương hiệu' })}
                                placeholder="VD: Highlands Coffee, Vinamilk, Grab..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                            />
                            {errors.productBrand && <p className="text-xs text-red-500 mt-1">{errors.productBrand.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngành hàng *</label>
                            <input
                                {...register('industry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: F&B, FMCG, E-commerce, Real Estate..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                            />
                            {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả sản phẩm *</label>
                            <textarea
                                {...register('productDescription', { required: 'Vui lòng mô tả sản phẩm' })}
                                placeholder="Mô tả chi tiết về sản phẩm/dịch vụ, đặc điểm, USP..."
                                rows={3}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all resize-none"
                            />
                            {errors.productDescription && <p className="text-xs text-red-500 mt-1">{errors.productDescription.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Khoảng giá *</label>
                                <input
                                    {...register('priceRange', { required: 'Vui lòng nhập khoảng giá' })}
                                    placeholder="VD: 50K-100K VNĐ"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Thị trường *</label>
                                <input
                                    {...register('targetMarket', { required: 'Vui lòng nhập thị trường' })}
                                    placeholder="VD: Việt Nam, TP.HCM"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Optional Fields */}
                        <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Thông tin bổ sung (tuỳ chọn)</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Đối thủ cạnh tranh</label>
                                    <input
                                        {...register('competitorNames')}
                                        placeholder="VD: Starbucks, The Coffee House, Phúc Long..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Khách hàng hiện tại</label>
                                    <input
                                        {...register('currentCustomers')}
                                        placeholder="VD: Nhân viên văn phòng 25-35 tuổi TP.HCM"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang phân tích...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Phân tích STP
                                </>
                            )}
                        </button>
                    </form>

                    {/* Framework Info */}
                    <div className="mt-5 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h3 className="text-sm font-medium text-slate-800 mb-2">📚 STP Framework:</h3>
                        <ul className="text-xs text-slate-600 space-y-1">
                            <li>• <strong>Segmentation:</strong> Chia thị trường thành các phân khúc</li>
                            <li>• <strong>Targeting:</strong> Chọn phân khúc mục tiêu phù hợp nhất</li>
                            <li>• <strong>Positioning:</strong> Định vị thương hiệu trong tâm trí khách hàng</li>
                        </ul>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="p-6 overflow-auto bg-slate-50 h-full">
                    {!stpData && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 rounded-lg bg-white border border-slate-100 flex items-center justify-center mb-4">
                                <Target size={28} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-base font-medium text-slate-600">STP Analysis</p>
                            <p className="text-sm text-slate-400 mt-1">Nhập thông tin để bắt đầu phân tích</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-12 h-12 mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-900 animate-spin"></div>
                            </div>
                            <p className="text-sm font-medium text-slate-700 mb-1">{thinkingStep}</p>
                            <p className="text-xs text-slate-400">Đang phân tích STP Framework...</p>
                        </div>
                    )}

                    {/* Validation Error */}
                    {stpData && stpData.validationStatus === 'FAIL' && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="max-w-md bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                                <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle size={28} className="text-amber-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-amber-800 mb-2">Cần thêm thông tin</h3>
                                <p className="text-sm text-amber-700">{stpData.clarificationMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Results Display */}
                    {stpData && !isGenerating && stpData.validationStatus !== 'FAIL' && (
                        <div className="max-w-5xl mx-auto">
                            {/* Warning Banner */}
                            {stpData.validationStatus === 'WARNING' && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">Lưu ý</p>
                                        <p className="text-sm text-amber-700">{stpData.clarificationMessage}</p>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-1 mb-6 bg-white border border-slate-100 p-1 rounded-lg w-fit">
                                {(['segmentation', 'targeting', 'positioning'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab
                                                ? 'bg-slate-900 text-white'
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {tab === 'segmentation' && <Users size={16} />}
                                        {tab === 'targeting' && <Target size={16} />}
                                        {tab === 'positioning' && <Award size={16} />}
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Segmentation Tab */}
                            {activeTab === 'segmentation' && (
                                <div>
                                    <div className="mb-5">
                                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Phân khúc thị trường</h2>
                                        <p className="text-sm text-slate-500">{stpData.segmentation.analysis_approach}</p>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {stpData.segmentation.segments.map((segment, idx) => (
                                            <SegmentCard key={idx} segment={segment} index={idx} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Targeting Tab */}
                            {activeTab === 'targeting' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 mb-5">Thị trường mục tiêu</h2>

                                    <div className="bg-white border border-slate-100 rounded-xl p-6 mb-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                <Target size={20} className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">{stpData.targeting.primary_segment}</h3>
                                                <p className="text-sm text-slate-500">Phân khúc được chọn</p>
                                            </div>
                                            <div className="ml-auto px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                                                Market Fit: {stpData.targeting.market_fit_score}%
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-700 mb-4">{stpData.targeting.selection_rationale}</p>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-slate-50 rounded-lg p-4">
                                                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Tiềm năng tăng trưởng</p>
                                                <p className="text-sm text-slate-800">{stpData.targeting.growth_potential}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-4">
                                                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Khả năng tiếp cận</p>
                                                <p className="text-sm text-slate-800">{stpData.targeting.accessibility}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Rủi ro</p>
                                            <div className="space-y-2">
                                                {stpData.targeting.risks.map((risk, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                                                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                                        {risk}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Positioning Tab */}
                            {activeTab === 'positioning' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 mb-5">Định vị thương hiệu</h2>

                                    {/* Positioning Statement */}
                                    <div className="bg-white border-2 border-indigo-100 rounded-xl p-6 mb-6">
                                        <p className="text-xs font-medium text-indigo-600 uppercase mb-2">Positioning Statement</p>
                                        <p className="text-lg font-medium text-slate-900 leading-relaxed">{stpData.positioning.positioning_statement}</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white border border-slate-100 rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Zap size={18} className="text-amber-500" />
                                                <p className="text-sm font-semibold text-slate-900">Unique Value Proposition</p>
                                            </div>
                                            <p className="text-sm text-slate-700">{stpData.positioning.unique_value_proposition}</p>
                                        </div>
                                        <div className="bg-white border border-slate-100 rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Award size={18} className="text-violet-500" />
                                                <p className="text-sm font-semibold text-slate-900">Brand Essence</p>
                                            </div>
                                            <p className="text-lg font-bold text-violet-600">{stpData.positioning.brand_essence}</p>
                                            <p className="text-sm text-slate-500 mt-1">{stpData.positioning.competitive_frame}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white border border-slate-100 rounded-xl p-5">
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-3">Key Differentiators</p>
                                            <div className="space-y-2">
                                                {stpData.positioning.key_differentiators.map((diff, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                                                        <ChevronRight size={16} className="text-emerald-500" />
                                                        {diff}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-100 rounded-xl p-5">
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-3">Reasons to Believe</p>
                                            <div className="space-y-2">
                                                {stpData.positioning.reasons_to_believe.map((rtb, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                                                        <ChevronRight size={16} className="text-blue-500" />
                                                        {rtb}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Plan */}
                                    <div className="bg-slate-900 text-white rounded-xl p-6">
                                        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                                            🚀 Action Plan
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 uppercase mb-2">Hành động ngay</p>
                                                <ul className="space-y-1.5">
                                                    {stpData.actionPlan.immediate_actions.map((action, idx) => (
                                                        <li key={idx} className="text-sm text-slate-200 flex items-start gap-2">
                                                            <span className="text-emerald-400">•</span>
                                                            {action}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 uppercase mb-2">Kênh Marketing</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {stpData.actionPlan.marketing_channels.map((channel, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-slate-800 rounded-md text-xs">{channel}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 uppercase mb-2">Messaging Hooks</p>
                                                <ul className="space-y-1.5">
                                                    {stpData.actionPlan.messaging_hooks.map((hook, idx) => (
                                                        <li key={idx} className="text-sm text-amber-300 italic">"{hook}"</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
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
