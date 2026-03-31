import React, { useState, useEffect } from 'react';
import { PenTool, Facebook, Instagram, Linkedin, AtSign, Video, Search, CheckSquare, Square, Sparkles, Copy, Check, Loader2, History, Trash2, Clock, X, Edit3, ShieldCheck, Save } from 'lucide-react';
import { generateMultiPlatformContent } from '../services/geminiService';
import { ContentGeneratorService } from '../services/contentGeneratorService';
import { ContentHistoryRecord } from '../types';
import { Toast, ToastType } from './Toast';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';

const cardClass =
  'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'threads', label: 'Threads', icon: AtSign },
  { id: 'tiktok', label: 'TikTok', icon: Video },
  { id: 'seo', label: 'SEO Web', icon: Search },
];

interface ContentGeneratorProps {
  initialData?: { topic?: string; context?: string } | null;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ initialData }) => {
  const { currentBrand } = useBrand();

  const [sampleContent, setSampleContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [useManualMode, setUseManualMode] = useState(false);
  const [manualBrandName, setManualBrandName] = useState('');
  const [manualTone, setManualTone] = useState('');
  const [manualAudience, setManualAudience] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ContentHistoryRecord[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (showHistory) {
        const historyData = await ContentGeneratorService.getContentHistory();
        setHistory(historyData);
      }
    };
    loadHistory();
  }, [showHistory]);

  useEffect(() => {
    if (initialData) {
      let content = '';
      if (initialData.topic) content += `TOPIC: ${initialData.topic} \n`;
      if (initialData.context) content += `\nCONTEXT: \n${initialData.context} `;

      if (content) {
        setSampleContent(content);
        if (selectedPlatforms.length === 0) {
          setSelectedPlatforms(['facebook']);
        }
      }
    }
  }, [initialData]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPlatforms.length === PLATFORMS.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(PLATFORMS.map((p) => p.id));
    }
  };

  const handleGenerate = async () => {
    if (!sampleContent.trim() || selectedPlatforms.length === 0) {
      setToast({ message: 'Vui lòng nhập nội dung và chọn ít nhất một nền tảng.', type: 'error' });
      return;
    }

    if (useManualMode && (!manualBrandName.trim() || !manualTone.trim())) {
      setToast({ message: 'Vui lòng nhập Tên thương hiệu và Giọng văn khi dùng chế độ thủ công.', type: 'error' });
      return;
    }
    if (!useManualMode && !currentBrand) {
      setToast({ message: 'Vui lòng chọn Brand từ Vault hoặc chuyển sang chế độ thủ công.', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setResults({});

    let contextPrompt = '';

    if (useManualMode) {
      contextPrompt = `
        BRAND GUIDELINES(MANUAL INPUT):
- Brand Name: ${manualBrandName}
- Tone of Voice: ${manualTone}
- Target Audience: ${manualAudience || 'General Audience'}
        
        Ensure the generated content aligns perfectly with this ad-hoc brand identity.
        `;
    } else if (currentBrand) {
      contextPrompt = `
        BRAND GUIDELINES(STRICTLY FOLLOW):
- Brand Name: ${currentBrand.identity.name}
- Tone of Voice: ${currentBrand.strategy.toneOfVoice || 'Professional yet engaging'}
- Target Audience: ${currentBrand.audience.demographics || 'General Audience'}
- Core Values: ${currentBrand.strategy.coreValues || 'Quality, Innovation'}
- Mission: ${currentBrand.strategy.mission}
        
        Ensure the generated content aligns perfectly with this brand identity.
        `;
    }

    const fullPrompt = `${contextPrompt} \n\nORIGINAL CONTENT / TOPIC: \n"${sampleContent}"`;

    try {
      const generatedData = await generateMultiPlatformContent(fullPrompt, selectedPlatforms);
      setResults(generatedData);

      const newRecord: ContentHistoryRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        originalContent: sampleContent,
        selectedPlatforms: selectedPlatforms,
        results: generatedData,
      };
      await ContentGeneratorService.addContentHistory(newRecord);
      setToast({ message: 'Đã tạo content!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Có lỗi xảy ra khi tạo content!', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadHistory = (record: ContentHistoryRecord) => {
    setSampleContent(record.originalContent);
    setSelectedPlatforms(record.selectedPlatforms);
    setResults(record.results);
    setShowHistory(false);
    setToast({ message: 'Đã tải bản ghi.', type: 'success' });
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Xóa lịch sử này?')) {
      const success = await ContentGeneratorService.deleteContentHistory(id);
      if (success) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
        setToast({ message: 'Đã xóa!', type: 'success' });
      }
    }
  };

  const handleSaveManual = async () => {
    if (Object.keys(results).length === 0) {
      setToast({ message: 'Chưa có kết quả để lưu!', type: 'error' });
      return;
    }

    const newRecord: ContentHistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      originalContent: sampleContent,
      selectedPlatforms: selectedPlatforms,
      results: results,
    };

    const success = await ContentGeneratorService.addContentHistory(newRecord);
    if (success) {
      setToast({ message: 'Đã lưu content!', type: 'success' });
    } else {
      setToast({ message: 'Lỗi khi lưu!', type: 'error' });
    }
  };

  const handleCopy = (content: any, id: string) => {
    let textToCopy = '';

    if (typeof content === 'string') {
      textToCopy = content;
    } else if (typeof content === 'object' && content !== null) {
      const parts = [];
      if (content.title_tag) parts.push(`Title: ${content.title_tag} `);
      if (content.meta_description) parts.push(`Meta Description: ${content.meta_description} `);
      if (content.paragraph) parts.push(`Content: \n${content.paragraph} `);

      if (parts.length > 0) {
        textToCopy = parts.join('\n\n');
      } else {
        textToCopy = JSON.stringify(content, null, 2);
      }
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
      <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-stone-400">
            <PenTool size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">Omnichannel Content</span>
          </div>
          <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">Viết Content Đa Nền Tảng</h1>
          <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
            Tối ưu nội dung theo từng kênh, gắn với Brand Vault hoặc nhập thủ công.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!useManualMode && currentBrand && (
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50/80 px-3 py-1 text-xs font-medium text-stone-700">
                <Sparkles size={12} strokeWidth={1.25} /> Brand: {currentBrand.identity.name}
              </span>
            )}
            {useManualMode && (
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
                <Edit3 size={12} strokeWidth={1.25} /> Chế độ thủ công
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 md:items-end">
          <div className="grid w-full max-w-[360px] grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-stone-50/50 p-1">
            <button
              type="button"
              onClick={() => setUseManualMode(false)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all ${
                !useManualMode
                  ? 'bg-white font-semibold text-stone-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-stone-200'
                  : 'font-medium text-stone-500 hover:bg-white hover:text-stone-700'
              }`}
            >
              <ShieldCheck size={16} strokeWidth={1.25} /> Brand Vault
            </button>
            <button
              type="button"
              onClick={() => setUseManualMode(true)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all ${
                useManualMode
                  ? 'bg-white font-semibold text-stone-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-stone-200'
                  : 'font-medium text-stone-500 hover:bg-white hover:text-stone-700'
              }`}
            >
              <Edit3 size={16} strokeWidth={1.25} /> Thủ công
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                showHistory
                  ? 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                  : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
              }`}
            >
              <History size={17} strokeWidth={1.25} /> Lịch sử
            </button>
            {Object.keys(results).length > 0 && (
              <button
                type="button"
                onClick={handleSaveManual}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
              >
                <Save size={17} strokeWidth={1.25} /> Lưu
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5"
        style={{ gridTemplateColumns: showHistory ? 'minmax(0,280px) minmax(0,420px) 1fr' : 'minmax(0,420px) 1fr' }}
      >
        {showHistory && (
          <div className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
            <div className="border-b border-stone-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-stone-900">
                  <Clock size={18} strokeWidth={1.25} className="text-stone-400" />
                  Lịch sử
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                  aria-label="Đóng"
                >
                  <X size={18} strokeWidth={1.25} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {history.length === 0 ? (
                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có lịch sử.</div>
              ) : (
                history.map((record) => (
                  <div
                    key={record.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleLoadHistory(record)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoadHistory(record)}
                    className="group cursor-pointer rounded-2xl border border-stone-200/90 p-3 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium text-stone-900">{record.originalContent}</p>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistory(e, record.id)}
                        className="shrink-0 rounded-lg p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                        aria-label="Xóa"
                      >
                        <Trash2 size={14} strokeWidth={1.25} />
                      </button>
                    </div>
                    <p className="mb-2 text-xs text-stone-400">{new Date(record.timestamp).toLocaleString('vi-VN')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {record.selectedPlatforms.map((pId) => {
                        const p = PLATFORMS.find((pl) => pl.id === pId);
                        if (!p) return null;
                        const Icon = p.icon;
                        return (
                          <span
                            key={pId}
                            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600"
                          >
                            <Icon size={12} strokeWidth={1.25} /> {p.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
          <h2 className="mb-6 text-lg font-medium tracking-tight text-stone-900">Thông tin & nền tảng</h2>

          <div className="space-y-8">
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">1. Thiết lập ngữ cảnh</h3>
              {useManualMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Tên thương hiệu</label>
                    <input
                      className={inputClass}
                      placeholder="VD: OptiMKT..."
                      value={manualBrandName}
                      onChange={(e) => setManualBrandName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Giọng văn (Tone)</label>
                    <input
                      className={inputClass}
                      placeholder="VD: Chuyên nghiệp, Hài hước..."
                      value={manualTone}
                      onChange={(e) => setManualTone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Đối tượng</label>
                    <input
                      className={inputClass}
                      placeholder="VD: Gen Z, nhân viên văn phòng..."
                      value={manualAudience}
                      onChange={(e) => setManualAudience(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Chọn Brand từ Vault</label>
                  <BrandSelector />
                  {!currentBrand && (
                    <p className="mt-2 text-xs font-medium text-rose-600">Vui lòng chọn Brand để tiếp tục.</p>
                  )}
                </div>
              )}
            </section>

            <section className="border-t border-stone-100 pt-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">2. Nội dung mẫu / ý tưởng</h3>
              <textarea
                className={`${inputClass} min-h-[150px] resize-y`}
                placeholder="Paste bài viết gốc, link sản phẩm, hoặc ý tưởng chính của bạn vào đây..."
                value={sampleContent}
                onChange={(e) => setSampleContent(e.target.value)}
              />
            </section>

            <section className="border-t border-stone-100 pt-8">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">3. Chọn nền tảng</h3>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100"
                >
                  {selectedPlatforms.length === PLATFORMS.length ? (
                    <CheckSquare size={16} strokeWidth={1.25} className="text-stone-800" />
                  ) : (
                    <Square size={16} strokeWidth={1.25} />
                  )}
                  Chọn tất cả
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50/80'
                      }`}
                    >
                      <Icon size={18} strokeWidth={1.25} className={isSelected ? 'text-white' : 'text-stone-500'} />
                      <span>{platform.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.25} />
                Đang viết content...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" strokeWidth={1.25} />
                Tạo content ngay
              </>
            )}
          </button>
        </div>

        <div className={`${cardClass} min-h-0 overflow-y-auto p-6 md:p-8`}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">4. Kết quả</h2>

          {Object.keys(results).length === 0 && !isGenerating && (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-stone-400">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80">
                <PenTool size={28} strokeWidth={1.25} className="text-stone-300" />
              </div>
              <p className="max-w-xs text-center text-sm font-normal">Nhập nội dung và chọn nền tảng để bắt đầu.</p>
            </div>
          )}

          {isGenerating && (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-stone-400">
              <div className="relative mb-8 h-14 w-14">
                <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-800 animate-spin"></div>
              </div>
              <p className="mb-2 text-sm font-semibold text-stone-600">AI đang tối ưu cho từng nền tảng...</p>
              <p className="text-sm font-normal text-stone-400">Vui lòng chờ trong giây lát.</p>
            </div>
          )}

          {Object.keys(results).length > 0 && !isGenerating && (
            <div className="space-y-4">
              {PLATFORMS.map((p) => {
                const content = results[p.id];
                if (!content) return null;
                const Icon = p.icon;

                return (
                  <div key={p.id} className="rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-5 py-3.5">
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-stone-800">
                        <Icon size={17} strokeWidth={1.25} className="text-stone-500" />
                        {p.label}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(content, p.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          copiedId === p.id
                            ? 'border-stone-300 bg-stone-100 text-stone-600'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50/80'
                        }`}
                      >
                        {copiedId === p.id ? (
                          <><Check size={13} strokeWidth={1.25} /> Đã copy</>
                        ) : (
                          <><Copy size={13} strokeWidth={1.25} /> Copy</>
                        )}
                      </button>
                    </div>

                    <div className="p-5">
                      {typeof content === 'string' ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{content}</p>
                      ) : (
                        <div className="space-y-3">
                          {content.title_tag && (
                            <div>
                              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Title Tag</div>
                              <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm font-bold text-stone-900">{content.title_tag}</div>
                            </div>
                          )}
                          {content.meta_description && (
                            <div>
                              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Meta Description</div>
                              <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm text-stone-600 leading-relaxed">{content.meta_description}</div>
                            </div>
                          )}
                          {content.paragraph && (
                            <div>
                              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Optimized Content</div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{content.paragraph}</p>
                            </div>
                          )}
                          {!content.title_tag && !content.meta_description && !content.paragraph && (
                            <pre className="overflow-x-auto rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-xs text-stone-700">{JSON.stringify(content, null, 2)}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ContentGenerator;
