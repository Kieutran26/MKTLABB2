
import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, History, Loader2, Copy, Sparkles, Trash2 } from 'lucide-react';
import { translateText } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { TranslationRecord } from '../types';

const neoBtn =
  'transition-[transform,box-shadow] duration-100 ease-out hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2';

const TranslationView: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState<'en_vi' | 'vi_en'>('en_vi');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TranslationRecord[]>([]);

  useEffect(() => {
    if (showHistory) {
      setHistory(StorageService.getHistory());
    }
  }, [showHistory]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    const from = direction === 'en_vi' ? 'en' : 'vi';
    const to = direction === 'en_vi' ? 'vi' : 'en';

    const result = await translateText(sourceText, from, to);
    setTranslatedText(result);
    setIsLoading(false);

    StorageService.addHistory({
      id: Date.now().toString(),
      sourceText,
      translatedText: result,
      fromLang: from,
      toLang: to,
      timestamp: Date.now()
    });
  };

  const swapLanguages = () => {
    setDirection(prev => prev === 'en_vi' ? 'vi_en' : 'en_vi');
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6">
        <div>
          <h2 className="text-2xl font-black text-black flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black bg-[#FEF3C7] text-[#B45309] shadow-[2px_2px_0_0_#000]"
              aria-hidden
            >
              <Sparkles size={22} strokeWidth={2.25} />
            </span>
            Dịch thuật AI
          </h2>
          <p className="text-slate-600 font-semibold text-sm mt-2">
            Dịch văn bản nhanh chóng với công nghệ Gemini
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-full border border-black bg-white px-5 py-2.5 text-sm font-bold text-black shadow-[2px_2px_0_0_#000] ${neoBtn}`}
        >
          <History size={18} strokeWidth={2.25} />
          <span>Lịch sử</span>
        </button>
      </div>

      <div className="rounded-[20px] bg-white p-6 shadow-[3px_3px_0_0_#000] md:p-8">
        <div className="flex h-[min(450px,70vh)] flex-col items-stretch gap-6 md:flex-row">

          <div className="group flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-xl border border-black bg-white focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2">
            <div className="flex items-center justify-between border-b border-black bg-[#F5F5F0] px-4 py-3">
              <span className="text-xs font-black uppercase tracking-wide text-black">
                {direction === 'en_vi' ? 'Tiếng Anh (English)' : 'Tiếng Việt'}
              </span>
              {sourceText && (
                <button
                  type="button"
                  onClick={() => setSourceText('')}
                  className="text-xs font-bold text-slate-500 hover:text-red-600"
                >
                  Xóa
                </button>
              )}
            </div>
            <textarea
              className="min-h-0 flex-1 w-full resize-none border-none bg-white p-5 text-base font-semibold leading-relaxed text-slate-800 placeholder:text-slate-400 focus:ring-0"
              placeholder="Nhập văn bản cần dịch..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTranslate();
                }
              }}
            />
          </div>

          <div className="flex flex-row items-center justify-center gap-4 md:w-auto md:flex-col md:justify-center">
            <button
              type="button"
              onClick={swapLanguages}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black bg-white text-black shadow-[2px_2px_0_0_#000] ${neoBtn}`}
              title="Chuyển đổi ngôn ngữ"
            >
              <ArrowRightLeft size={20} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={handleTranslate}
              disabled={isLoading || !sourceText}
              className={`flex min-w-[140px] items-center justify-center gap-2 rounded-xl border border-black bg-[#48b9a7] px-6 py-3 text-sm font-black text-white shadow-[2px_2px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0_0_#000] ${neoBtn}`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} strokeWidth={2.25} /> : 'Dịch ngay'}
            </button>
          </div>

          <div className="relative flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-xl border border-black bg-white">
            <div className="flex items-center justify-between border-b border-black bg-[#EDE9FE] px-4 py-3">
              <span className="text-xs font-black uppercase tracking-wide text-[#5B21B6]">
                {direction === 'en_vi' ? 'Tiếng Việt' : 'Tiếng Anh (English)'}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5 text-base font-semibold leading-relaxed text-slate-800">
              {translatedText ? (
                <div className="whitespace-pre-wrap">{translatedText}</div>
              ) : (
                <span className="mt-16 flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-400 md:mt-20">
                  <Sparkles size={16} strokeWidth={2.25} className="shrink-0 text-[#48b9a7]" />
                  Bản dịch sẽ hiện ở đây...
                </span>
              )}
            </div>
            {translatedText && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(translatedText)}
                className={`absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl border border-black bg-white text-black shadow-[2px_2px_0_0_#000] ${neoBtn}`}
                title="Sao chép"
              >
                <Copy size={18} strokeWidth={2.25} />
              </button>
            )}
          </div>

        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-black bg-white shadow-[4px_4px_0_0_#000]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="translation-history-title"
          >
            <div className="flex items-center justify-between gap-3 border-b border-black px-6 py-4">
              <h3 id="translation-history-title" className="text-lg font-black text-black">
                Lịch sử dịch
              </h3>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa tất cả lịch sử?')) {
                        StorageService.clearAllHistory();
                        setHistory([]);
                      }
                    }}
                    className={`flex items-center gap-1 rounded-lg border border-black bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-[2px_2px_0_0_#000] ${neoBtn}`}
                  >
                    <Trash2 size={14} strokeWidth={2} />
                    Xóa tất cả
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border border-black bg-[#F5F5F0] text-lg font-black leading-none text-black shadow-[2px_2px_0_0_#000] ${neoBtn}`}
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {history.length === 0 ? (
                <p className="py-10 text-center text-sm font-semibold text-slate-500">Chưa có lịch sử dịch.</p>
              ) : (
                history.map((record) => (
                  <div
                    key={record.id}
                    className="group rounded-xl border border-black bg-white p-5 shadow-[2px_2px_0_0_#000]"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600">
                      <span className="rounded-full border border-black bg-[#F5F5F0] px-2.5 py-1 font-black text-black">
                        {record.fromLang === 'en' ? 'Anh → Việt' : 'Việt → Anh'}
                      </span>
                      <div className="flex items-center gap-3">
                        <span>{new Date(record.timestamp).toLocaleString('vi-VN')}</span>
                        <button
                          type="button"
                          onClick={() => {
                            StorageService.deleteHistory(record.id);
                            setHistory(prev => prev.filter(h => h.id !== record.id));
                          }}
                          className="rounded-lg p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Xóa mục này"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <p className="mb-2 font-bold text-slate-900">{record.sourceText}</p>
                    <div className="my-2 h-px bg-black/10" />
                    <p className="font-semibold text-[#047857]">{record.translatedText}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationView;
