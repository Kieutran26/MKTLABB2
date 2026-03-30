import React, { useState, useEffect } from 'react';
import { PenTool, Facebook, Instagram, Linkedin, AtSign, Video, Search, CheckSquare, Square, Sparkles, Copy, Check, Loader2, History, Trash2, Clock, X, Edit3, ShieldCheck, Save } from 'lucide-react';
import { generateMultiPlatformContent } from '../services/geminiService';
import { ContentGeneratorService } from '../services/contentGeneratorService';
import { ContentHistoryRecord } from '../types';
import { Toast, ToastType } from './Toast';
import { useBrand } from './BrandContext';
import BrandSelector from './BrandSelector';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
  { id: 'threads', label: 'Threads', icon: AtSign, color: 'text-black', bg: 'bg-stone-100' },
  { id: 'tiktok', label: 'TikTok', icon: Video, color: 'text-black', bg: 'bg-stone-100' },
  { id: 'seo', label: 'SEO Web', icon: Search, color: 'text-green-600', bg: 'bg-green-50' },
];

interface ContentGeneratorProps {
  initialData?: { topic?: string; context?: string } | null;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ initialData }) => {
  // --- Context ---
  const { currentBrand } = useBrand();

  const [sampleContent, setSampleContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Mode State
  const [useManualMode, setUseManualMode] = useState(false);
  const [manualBrandName, setManualBrandName] = useState('');
  const [manualTone, setManualTone] = useState('');
  const [manualAudience, setManualAudience] = useState('');

  // History States
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

  // Handle Initial Data injection
  useEffect(() => {
    if (initialData) {
      let content = "";
      if (initialData.topic) content += `TOPIC: ${initialData.topic} \n`;
      if (initialData.context) content += `\nCONTEXT: \n${initialData.context} `;

      if (content) {
        setSampleContent(content);
        // Optionally select a default platform if none selected
        if (selectedPlatforms.length === 0) {
          setSelectedPlatforms(['facebook']);
        }
      }
    }
  }, [initialData]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPlatforms.length === PLATFORMS.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(PLATFORMS.map(p => p.id));
    }
  };

  const handleGenerate = async () => {
    if (!sampleContent.trim() || selectedPlatforms.length === 0) return;

    // Validation for Manual Mode
    if (useManualMode && (!manualBrandName.trim() || !manualTone.trim())) {
      alert("Vui lòng nhập Tên thương hiệu và Giọng văn khi dùng chế độ thủ công.");
      return;
    }
    // Validation for Brand Mode
    if (!useManualMode && !currentBrand) {
      alert("Vui lòng chọn Brand Vault hoặc chuyển sang chế độ thủ công.");
      return;
    }

    setIsGenerating(true);
    setResults({}); // Clear previous results

    // Prepare Context Prompt based on Mode
    let contextPrompt = "";

    if (useManualMode) {
      // MANUAL MODE PROMPT
      contextPrompt = `
        BRAND GUIDELINES(MANUAL INPUT):
- Brand Name: ${manualBrandName}
- Tone of Voice: ${manualTone}
- Target Audience: ${manualAudience || "General Audience"}
        
        Ensure the generated content aligns perfectly with this ad - hoc brand identity.
        `;
    } else if (currentBrand) {
      // BRAND VAULT MODE PROMPT
      contextPrompt = `
        BRAND GUIDELINES(STRICTLY FOLLOW):
- Brand Name: ${currentBrand.identity.name}
- Tone of Voice: ${currentBrand.strategy.toneOfVoice || "Professional yet engaging"}
- Target Audience: ${currentBrand.audience.demographics || "General Audience"}
- Core Values: ${currentBrand.strategy.coreValues || "Quality, Innovation"}
- Mission: ${currentBrand.strategy.mission}
        
        Ensure the generated content aligns perfectly with this brand identity.
        `;
    }

    // Combine original content with brand context
    const fullPrompt = `${contextPrompt} \n\nORIGINAL CONTENT / TOPIC: \n"${sampleContent}"`;

    try {
      // We pass the enhanced prompt to the service
      const generatedData = await generateMultiPlatformContent(fullPrompt, selectedPlatforms);
      setResults(generatedData);

      // Auto-save to history
      const newRecord: ContentHistoryRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        originalContent: sampleContent,
        selectedPlatforms: selectedPlatforms,
        results: generatedData
      };
      await ContentGeneratorService.addContentHistory(newRecord);

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
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Xóa lịch sử này?")) {
      const success = await ContentGeneratorService.deleteContentHistory(id);
      if (success) {
        setHistory(prev => prev.filter(h => h.id !== id));
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
      results: results
    };

    const success = await ContentGeneratorService.addContentHistory(newRecord);
    if (success) {
      setToast({ message: 'Đã lưu content!', type: 'success' });
    } else {
      setToast({ message: 'Lỗi khi lưu!', type: 'error' });
    }
  };

  const handleCopy = (content: any, id: string) => {
    let textToCopy = "";

    if (typeof content === 'string') {
      textToCopy = content;
    } else if (typeof content === 'object' && content !== null) {
      // Format object content (like SEO) into a readable string
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
    <div className="max-w-6xl mx-auto pt-10 px-4 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
        <div className="flex-1">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800 mb-3">
            <PenTool className="text-slate-700" strokeWidth={1.5} />
            Viết Content Đa Nền Tảng
          </h2>

          {/* Context Indicator */}
          <div className="flex items-center gap-2">
            {!useManualMode && currentBrand && (
              <div className="text-sm text-indigo-600 font-medium flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-lg">
                <Sparkles size={14} /> Brand: {currentBrand.identity.name}
              </div>
            )}
            {useManualMode && (
              <div className="text-sm text-slate-600 font-medium flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                <Edit3 size={14} /> Chế độ Thủ công
              </div>
            )}
          </div>
        </div>

        {/* Actions Container */}
        <div className="flex flex-col gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setUseManualMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${!useManualMode ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ShieldCheck size={16} /> Brand Vault
            </button>
            <button
              onClick={() => setUseManualMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${useManualMode ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Edit3 size={16} /> Thủ công
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {Object.keys(results).length > 0 && (
              <button
                onClick={handleSaveManual}
                className="group bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold transition-all"
              >
                <Save size={16} className="group-hover:scale-110 transition-transform" />
                Lưu
              </button>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Input Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* 1. Context Setup (Dynamic based on Mode) */}
          <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 animate-in fade-in slide-in-from-left-4">
            <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide border-b border-slate-100 pb-2">
              1. Thiết lập Ngữ cảnh
            </label>

            {useManualMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tên Thương hiệu</label>
                  <input
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
                    placeholder="VD: OptiMKT..."
                    value={manualBrandName}
                    onChange={e => setManualBrandName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Giọng văn (Tone of Voice)</label>
                  <input
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
                    placeholder="VD: Chuyên nghiệp, Hài hước..."
                    value={manualTone}
                    onChange={e => setManualTone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Đối tượng (Audience)</label>
                  <input
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
                    placeholder="VD: GenZ, Nhân viên văn phòng..."
                    value={manualAudience}
                    onChange={e => setManualAudience(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Chọn Brand từ Vault</label>
                <BrandSelector />
                {!currentBrand && <p className="text-xs text-red-500 mt-2">Vui lòng chọn Brand để tiếp tục.</p>}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              2. Nhập Content Mẫu / Ý tưởng
            </label>
            <textarea
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 min-h-[150px] resize-y text-slate-800 transition-all"
              placeholder="Paste bài viết gốc, link sản phẩm, hoặc ý tưởng chính của bạn vào đây..."
              value={sampleContent}
              onChange={(e) => setSampleContent(e.target.value)}
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                3. Chọn Nền Tảng
              </label>
              <button
                onClick={toggleSelectAll}
                className="text-sm font-medium flex items-center gap-2 hover:bg-slate-100 px-2 py-1 rounded transition-colors text-slate-600"
              >
                {selectedPlatforms.length === PLATFORMS.length ? <CheckSquare size={16} strokeWidth={1.5} className="text-indigo-600" /> : <Square size={16} strokeWidth={1.5} />}
                <span>Chọn tất cả</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map(platform => {
                const isSelected = selectedPlatforms.includes(platform.id);
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left font-medium text-sm
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                  >
                    <Icon size={20} strokeWidth={1.5} className={isSelected ? 'text-white' : platform.color} />
                    <span>{platform.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !sampleContent || selectedPlatforms.length === 0}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 disabled:shadow-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={24} strokeWidth={1.5} /> Đang viết content...
              </>
            ) : (
              <>
                <Sparkles size={24} strokeWidth={1.5} /> Tạo Content Ngay
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-7">
          <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">
            4. Kết Quả
          </label>

          <div className="space-y-6">
            {Object.keys(results).length === 0 && !isGenerating && (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white/50">
                Nhập nội dung và chọn nền tảng để bắt đầu.
              </div>
            )}

            {isGenerating && (
              <div className="p-12 text-center">
                <div className="inline-block animate-bounce mb-2">
                  <Sparkles size={32} className="text-yellow-400" strokeWidth={1.5} />
                </div>
                <p className="text-slate-500 font-medium">AI đang suy nghĩ và tối ưu hóa cho từng nền tảng...</p>
              </div>
            )}

            {PLATFORMS.map(p => {
              const content = results[p.id];
              if (!content) return null;

              return (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                  <div className={`px - 4 py - 3 border - b border - slate - 100 flex justify - between items - center ${p.bg} `}>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <p.icon size={18} strokeWidth={1.5} className={p.color} />
                      {p.label}
                    </div>
                    <button
                      onClick={() => handleCopy(content, p.id)}
                      className="flex items-center gap-1 text-xs font-bold uppercase px-3 py-1.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
                    >
                      {copiedId === p.id ? <Check size={14} strokeWidth={1.5} className="text-green-600" /> : <Copy size={14} strokeWidth={1.5} />}
                      {copiedId === p.id ? 'Đã copy' : 'Copy'}
                    </button>
                  </div>

                  <div className="p-6 text-slate-700 leading-relaxed">
                    {typeof content === 'string' ? (
                      <div className="whitespace-pre-wrap">{content}</div>
                    ) : (
                      /* Handle Object Rendering (e.g., SEO structure) */
                      <div className="space-y-4">
                        {content.title_tag && (
                          <div>
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Title Tag</div>
                            <div className="font-bold text-lg bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-800">{content.title_tag}</div>
                          </div>
                        )}
                        {content.meta_description && (
                          <div>
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Meta Description</div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">{content.meta_description}</div>
                          </div>
                        )}
                        {content.paragraph && (
                          <div>
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Optimized Content</div>
                            <div className="whitespace-pre-wrap">{content.paragraph}</div>
                          </div>
                        )}
                        {/* Fallback for unknown object structure */}
                        {!content.title_tag && !content.meta_description && !content.paragraph && (
                          <pre className="text-xs bg-slate-50 p-2 rounded">{JSON.stringify(content, null, 2)}</pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Lịch sử tạo content</h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700">
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-slate-400 py-10">Chưa có lịch sử.</p>
              ) : (
                history.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => handleLoadHistory(record)}
                    className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={14} strokeWidth={1.5} />
                        <span>{new Date(record.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteHistory(e, record.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium text-slate-800 line-clamp-2">{record.originalContent}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {record.selectedPlatforms.map(pId => {
                        const p = PLATFORMS.find(pl => pl.id === pId);
                        if (!p) return null;
                        const Icon = p.icon;
                        return (
                          <div key={pId} className={`flex items - center gap - 1 text - [10px] font - bold uppercase px - 2 py - 1 rounded - md border ${p.bg} ${p.color} border - transparent`}>
                            <Icon size={12} strokeWidth={1.5} /> {p.label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ContentGenerator;