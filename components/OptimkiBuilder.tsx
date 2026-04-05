import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Sparkles, 
  History, 
  Plus, 
  Loader2, 
  Target, 
  Layout, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Pencil, 
  Diamond 
} from 'lucide-react';
import { generateOptimkiAnalysis } from '../services/geminiService';
import { OptimkiInput, OptimkiResult, OptimkiModelType } from '../types';
import FeatureHeader from './FeatureHeader';
import { 
  WS_PRIMARY_CTA, 
  WS_SEGMENT_SHELL, 
  wsHistoryToggleClass, 
  wsWorkspaceTabClass 
} from './workspace-toolbar-classes';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import { useToast } from './Toast';
import { StpOptimizerField } from './stp-optimizer-field';
import { EditorialOptimkiReport } from './EditorialOptimkiReport';
import BrandSelector from './BrandSelector';
import BrandVaultUpsellCard from './BrandVaultUpsellCard';

const FORM_GROUPS = [
  { id: 1, title: 'CĂN BẢN', subtitle: 'Thông tin thương hiệu' },
  { id: 2, title: 'NỘI LỰC', subtitle: 'Sản phẩm & Đối thủ' },
  { id: 3, title: 'THỰC THI', subtitle: 'Thị trường & Kế hoạch' }
];

const OPTIMKI_DEFAULTS: OptimkiInput = {
  ten_thuong_hieu: '',
  nganh_hang: '',
  mo_ta: '',
  diem_manh_yeu: '',
  doi_thu: '',
  noi_dau_khao_khat: '',
  kenh: '',
  muc_tieu: '',
  so_lieu_ngan_sach: '',
  thoi_gian_dia_diem: '',
  mo_hinh: 'tat_ca'
};

const FIELD_PRIORITIES: Record<OptimkiModelType, Record<string, 'core' | 'recommended' | null>> = {
  SWOT: {
    mo_ta: 'core',
    diem_manh_yeu: 'core',
    doi_thu: 'core',
    noi_dau_khao_khat: 'recommended',
  },
  AIDA: {
    mo_ta: 'core',
    noi_dau_khao_khat: 'core',
    kenh: 'core',
    muc_tieu: 'recommended',
  },
  '4P': {
    mo_ta: 'core',
    kenh: 'core',
    so_lieu_ngan_sach: 'core',
    diem_manh_yeu: 'recommended',
  },
  '5W1H': {
    mo_ta: 'core',
    muc_tieu: 'core',
    thoi_gian_dia_diem: 'core',
    kenh: 'recommended',
    so_lieu_ngan_sach: 'recommended',
  },
  SMART: {
    muc_tieu: 'core',
    so_lieu_ngan_sach: 'core',
    thoi_gian_dia_diem: 'core',
    mo_ta: 'recommended',
  },
  tat_ca: {
    mo_ta: 'core',
    diem_manh_yeu: 'core',
    noi_dau_khao_khat: 'core',
    muc_tieu: 'core',
  },
  chua_chon: {}
};

const OptimkiBuilder: React.FC = () => {
  const { tier } = useAuth();
  const toast = useToast();
  const { currentBrand } = useBrand();
  
  const { register, handleSubmit, watch, reset, setValue } = useForm<OptimkiInput>({
    defaultValues: OPTIMKI_DEFAULTS
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<OptimkiResult | null>(null);
  const [thinkingStep, setThinkingStep] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
  const [currentGroup, setCurrentGroup] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [isModelSelected, setIsModelSelected] = useState(false);

  const isPromax = tier === 'promax';
  const selectedModel = watch('mo_hinh');

  const modelOptions: { value: OptimkiModelType; title: string; subtitle: string; icon: any }[] = [
    { value: 'tat_ca', title: 'Tất cả mô hình', subtitle: 'Phân tích tổng thể Blueprint chiến lược (SWOT, AIDA, 4P, 5W1H, SMART).', icon: Sparkles },
    { value: 'SWOT', title: 'Mô hình SWOT', subtitle: 'Đánh giá nội lực và thị trường: Điểm mạnh, Điểm yếu, Cơ hội và Thách thức.', icon: Target },
    { value: 'AIDA', title: 'Mô hình AIDA', subtitle: 'Tối ưu hành trình khách hàng: Awareness, Interest, Desire, Action.', icon: Users },
    { value: '4P', title: 'Marketing Mix 4P', subtitle: 'Chiến thuật phối hợp: Product, Price, Place, Promotion.', icon: Layout },
    { value: '5W1H', title: 'Kế hoạch 5W1H', subtitle: 'Kế hoạch hành động cụ thể: Who, What, Where, When, Why, How.', icon: MessageSquare },
    { value: 'SMART', title: 'Mục tiêu SMART', subtitle: 'Xác định KPI đo lường: Specific, Measurable, Achievable, Relevant, Time-bound.', icon: TrendingUp },
  ];

  const renderPriorityBadge = (fieldName: string) => {
    const priority = FIELD_PRIORITIES[selectedModel]?.[fieldName];
    if (!priority) return null;

    const config = {
        core: { label: `Quan trọng với ${selectedModel === 'tat_ca' ? 'Kế hoạch' : selectedModel}`, style: "bg-stone-900 text-white shadow-sm" },
        recommended: { label: `Khuyên dùng`, style: "border border-stone-200 text-stone-500" }
    };

    const active = config[priority];

    return (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-500 ${active.style}`}>
            {active.label}
        </span>
    );
  };

  // Sync with active brand from Vault
  useEffect(() => {
    if (activeTab === 'vault' && currentBrand) {
      setValue('ten_thuong_hieu', currentBrand.identity.name);
      setValue('nganh_hang', currentBrand.identity.fontFamily || ''); 
      setValue('mo_ta', currentBrand.strategy.vision + '\n' + currentBrand.strategy.mission);
      setValue('diem_manh_yeu', currentBrand.strategy.coreValues.join(', '));
      setValue('noi_dau_khao_khat', currentBrand.audience.painPoints.join(', '));
      setValue('muc_tieu', currentBrand.strategy.shortTermGoals.join(', '));
    }
  }, [activeTab, currentBrand, setValue]);

  const selectModel = (val: OptimkiModelType) => {
    setValue('mo_hinh', val);
    setIsModelSelected(true);
    setCurrentGroup(1);
  };

  const onSubmit = async (data: OptimkiInput) => {
    setIsGenerating(true);
    setThinkingStep('Khởi động bộ não chiến lược...');
    
    try {
      const res = await generateOptimkiAnalysis(data, (step) => setThinkingStep(step));
      if (res) {
        setResult(res);
        toast.success('Đã hoàn thành phân tích chiến lược!');
      } else {
        toast.error('Không thể tạo bản phân tích. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    reset(OPTIMKI_DEFAULTS);
    setResult(null);
    setCurrentGroup(1);
    setIsModelSelected(false);
  };

  const inputClass = "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20";
  const areaClass = "w-full rounded-xl border border-stone-200 bg-white p-3 text-[13px] text-stone-900 outline-none transition-all placeholder:text-stone-300 focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 min-h-[80px] resize-none";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
      <FeatureHeader
        icon={Target}
        eyebrow="STRATEGIC MODEL GENERATOR"
        title="Opti M.KI Engine"
        subline="Phân tích SWOT, AIDA, 4P, 5W1H và SMART bằng AI với độ chính xác cao."
      >
        <div className="flex shrink-0 items-center justify-end gap-2">
          <div className={WS_SEGMENT_SHELL}>
            <button
              onClick={() => setActiveTab('manual')}
              className={wsWorkspaceTabClass(activeTab === 'manual')}
            >
              <Pencil size={14} /> Thủ công
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={wsWorkspaceTabClass(activeTab === 'vault')}
            >
              <Diamond size={14} className={isPromax ? 'text-amber-500 fill-amber-500' : 'text-stone-400'} /> Brand Vault
            </button>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={wsHistoryToggleClass(showHistory)}
          >
            <History size={17} strokeWidth={1.5} />
          </button>

          <button onClick={handleReset} className={WS_PRIMARY_CTA}>
            <Plus size={18} strokeWidth={2.5} /> Tạo mới
          </button>
        </div>
      </FeatureHeader>

      <div className="min-w-0 flex-1 w-full overflow-y-auto">
        {result ? (
          <EditorialOptimkiReport result={result} />
        ) : isGenerating ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-stone-900 rounded-full border-t-transparent animate-spin" />
              <Sparkles size={32} className="absolute inset-0 m-auto text-stone-200" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-stone-900 animate-pulse">{thinkingStep}</h3>
              <p className="text-sm text-stone-400 max-w-xs">Bộ não AI đang tổng hợp dữ liệu để xuất bản báo cáo Editorial độc bản.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-[1000px] mx-auto w-full px-4 py-8 lg:px-8">
            {activeTab === 'vault' && !isPromax ? (
              <BrandVaultUpsellCard 
                description="Kết nối Opti M.KI với Brand Vault để AI thấu hiểu sâu sắc DNA thương hiệu của bạn."
                benefits={[
                    'Tự động điền 10 trường dữ liệu từ hồ sơ Vault đã lưu',
                    'Phân tích SWOT bám sát thực tế nội lực doanh nghiệp',
                    'AIDA và 4P nhất quán với Tone of Voice của thương hiệu',
                    'Tiết kiệm 15 phút nhập liệu mỗi lần phân tích'
                ]}
              />
            ) : !isModelSelected ? (
                /* MODEL SELECTION GRID (STAGE 0) */
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2 max-w-xl mx-auto">
                        <h2 className="text-2xl font-serif text-stone-900">Chiến lược bắt đầu từ mô hình đúng</h2>
                        <p className="text-sm text-stone-500">Chọn mô hình bạn muốn AI tập trung phân tích sâu nhất cho thương hiệu của mình.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {modelOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => selectModel(opt.value)}
                                className="group relative flex flex-col items-start p-6 bg-white border border-stone-200 rounded-2xl text-left transition-all hover:border-stone-900 hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1"
                            >
                                <div className="p-3 bg-stone-50 rounded-xl mb-4 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                                    <opt.icon size={22} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">{opt.title}</h3>
                                <p className="text-xs leading-relaxed text-stone-400 group-hover:text-stone-600 transition-colors">{opt.subtitle}</p>
                                
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300">
                                    <Plus size={16} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm transition-all duration-500">
                {/* Form Progress Header */}
                <div className="flex border-b border-stone-100 bg-stone-50/50">
                  {FORM_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setCurrentGroup(g.id)}
                      className={`flex-1 py-4 px-2 text-center border-b-2 transition-all ${
                        currentGroup === g.id 
                          ? 'border-stone-900 text-stone-900' 
                          : 'border-transparent text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-widest">{g.title}</div>
                      <div className="text-[9px] font-medium opacity-60 hidden sm:block">{g.subtitle}</div>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 lg:p-8 space-y-8">
                  {activeTab === 'vault' && isPromax && (
                    <div className="mb-8 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 ml-1">Đang sử dụng dữ liệu từ</div>
                      <BrandSelector />
                    </div>
                  )}

                  {/* GROUP 1: BASIC INFO */}
                  {currentGroup === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <StpOptimizerField badge="none" title={<div className="flex items-center">Tên thương hiệu {renderPriorityBadge('ten_thuong_hieu')}</div>} subtitle="Tên gọi chính thức của dự án/thương hiệu.">
                        <input {...register('ten_thuong_hieu', { required: true })} className={inputClass} placeholder="VD: OptiM.KI Coffee" />
                      </StpOptimizerField>
                      
                      <StpOptimizerField badge="none" title={<div className="flex items-center">Ngành hàng {renderPriorityBadge('nganh_hang')}</div>} subtitle="Lĩnh vực hoạt động chính.">
                        <input {...register('nganh_hang', { required: true })} className={inputClass} placeholder="VD: F&B, Giáo dục, SaaS..." />
                      </StpOptimizerField>

                      <StpOptimizerField badge="none" title={<div className="flex items-center">Mô tả sản phẩm {renderPriorityBadge('mo_ta')}</div>} fullWidth subtitle="Bạn bán gì? Dành cho ai? Điểm đặc biệt nhất là gì?">
                        <textarea {...register('mo_ta', { required: true })} className={areaClass} placeholder="Mô tả ngắn gọn về sản phẩm và chân dung khách hàng mục tiêu..." />
                      </StpOptimizerField>

                      <div className="md:col-span-2 p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-stone-200 text-stone-900">
                                {React.createElement(modelOptions.find(o => o.value === watch().mo_hinh)?.icon || Sparkles, { size: 18, strokeWidth: 1.5 })}
                            </div>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-1">Mô hình đã chọn</div>
                                <div className="text-xs font-semibold text-stone-900">{modelOptions.find(o => o.value === watch().mo_hinh)?.title}</div>
                            </div>
                         </div>
                         <button 
                            type="button" 
                            onClick={() => setIsModelSelected(false)}
                            className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                         >
                            Thay đổi
                         </button>
                      </div>
                    </div>
                  )}

                  {/* GROUP 2: INTERNAL & COMPETITION */}
                  {currentGroup === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <StpOptimizerField badge="none" title={<div className="flex items-center">Điểm mạnh & Điểm yếu {renderPriorityBadge('diem_manh_yeu')}</div>} fullWidth subtitle="Liệt kê các sự thật về doanh nghiệp bạn hiện tại.">
                        <textarea {...register('diem_manh_yeu')} className={areaClass} placeholder="Mạnh: Giá tốt, Đội ngũ giỏi. Yếu: Chưa có app, Marketing mờ nhạt..." />
                      </StpOptimizerField>

                      <StpOptimizerField badge="none" title={<div className="flex items-center">Đối thủ & Khác biệt {renderPriorityBadge('doi_thu')}</div>} fullWidth subtitle="Ai là đối thủ chính? Bạn khác họ ở điểm nào?">
                        <textarea {...register('doi_thu')} className={areaClass} placeholder="Đối thủ: Brand X, Brand Y. Khác biệt: Dịch vụ cá nhân hóa 24/7..." />
                      </StpOptimizerField>

                      <StpOptimizerField badge="none" title={<div className="flex items-center">Nỗi đau & Khao khát {renderPriorityBadge('noi_dau_khao_khat')}</div>} fullWidth subtitle="Khách hàng đang gặp vấn đề gì mà bạn có thể giải quyết?">
                        <textarea {...register('noi_dau_khao_khat')} className={areaClass} placeholder="Lo sợ bị lừa, Muốn tiết kiệm thời gian, Thích sự sang trọng..." />
                      </StpOptimizerField>
                    </div>
                  )}

                  {/* GROUP 3: EXECUTION & PLAN */}
                  {currentGroup === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <StpOptimizerField badge="none" title={<div className="flex items-center">Mục tiêu (3-6 tháng) {renderPriorityBadge('muc_tieu')}</div>} fullWidth subtitle="Bạn muốn đạt được điều gì cụ thể nhất?">
                        <textarea {...register('muc_tieu')} className={areaClass} placeholder="Tăng 20% doanh thu, Có 1000 khách hàng mới, Mở thêm 2 chi nhánh..." />
                      </StpOptimizerField>

                      <StpOptimizerField badge="none" title={<div className="flex items-center">Kênh truyền thông {renderPriorityBadge('kenh')}</div>} subtitle="Bạn đang hoặc định phân phối ở đâu?">
                        <input {...register('kenh')} className={inputClass} placeholder="Facebook, TikTok, Website, Cửa hàng vật lý..." />
                      </StpOptimizerField>

                      <StpOptimizerField badge="none" title={<div className="flex items-center">Ngân sách (VNĐ) {renderPriorityBadge('so_lieu_ngan_sach')}</div>} subtitle="Khoảng ngân sách dự kiến (nếu có).">
                        <input {...register('so_lieu_ngan_sach')} className={inputClass} placeholder="VD: 50tr/tháng, 1 tỷ/năm..." />
                      </StpOptimizerField>

                      <StpOptimizerField badge="none" title={<div className="flex items-center">Thời gian & Địa điểm {renderPriorityBadge('thoi_gian_dia_diem')}</div>} fullWidth subtitle="Bối cảnh không gian và thời gian triển khai.">
                        <input {...register('thoi_gian_dia_diem')} className={inputClass} placeholder="VD: Quý 3/2026 tại Hà Nội và các tỉnh lân cận..." />
                      </StpOptimizerField>
                    </div>
                  )}

                  {/* Form Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                    <button
                        type="button"
                        onClick={() => {
                            if (currentGroup === 1) setIsModelSelected(false);
                            else setCurrentGroup(prev => prev - 1);
                        }}
                        className="px-6 py-2.5 border border-stone-200 text-stone-500 rounded-full text-sm font-medium hover:bg-stone-50 transition-all font-serif italic"
                    >
                        Quay lại
                    </button>

                    {currentGroup < 3 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentGroup(prev => prev + 1)}
                        className="px-8 py-2.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-900/10"
                      >
                        Tiếp theo
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-8 py-2.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-900/10 disabled:opacity-50"
                      >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        Phân tích Chiến lược
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimkiBuilder;
