
import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, History, Loader2, Copy, Sparkles, Trash2 } from 'lucide-react';
import { translateText } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { TranslationRecord } from '../types';

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
    <div className="max-w-5xl mx-auto pt-10 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            Dịch thuật AI
            <Sparkles size={24} strokeWidth={1.5} className="text-yellow-400" />
          </h2>
          <p className="text-slate-500 mt-1">Dịch văn bản nhanh chóng với công nghệ Gemini</p>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 font-medium hover:text-indigo-600"
        >
          <History size={18} strokeWidth={1.5} />
          <span>Lịch sử</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
        <div className="flex flex-col md:flex-row gap-6 items-stretch h-[450px]">

          {/* Source Input */}
          <div className="flex-1 flex flex-col bg-slate-50 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all overflow-hidden group">
            <div className="px-4 py-3 bg-white border-b border-slate-100 flex justify-between items-center">
              <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
                {direction === 'en_vi' ? 'Tiếng Anh (English)' : 'Tiếng Việt'}
              </span>
              {sourceText && (
                <button onClick={() => setSourceText('')} className="text-slate-400 hover:text-red-400 text-xs font-medium">Xóa</button>
              )}
            </div>
            <textarea
              className="flex-1 w-full p-5 bg-transparent border-none focus:ring-0 resize-none text-lg text-slate-800 leading-relaxed placeholder:text-slate-300"
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

          {/* Controls */}
          <div className="flex md:flex-col justify-center items-center gap-4">
            <button
              onClick={swapLanguages}
              className="p-3 rounded-full bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95 hover:shadow-md"
              title="Chuyển đổi ngôn ngữ"
            >
              <ArrowRightLeft size={20} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !sourceText}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px] disabled:shadow-none"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} strokeWidth={1.5} /> : 'Dịch ngay'}
            </button>
          </div>

          {/* Target Output */}
          <div className="flex-1 flex flex-col bg-indigo-50/30 rounded-2xl border border-indigo-100/50 overflow-hidden relative group">
            <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100/50 flex justify-between items-center">
              <span className="font-semibold text-indigo-500 text-xs uppercase tracking-wider">
                {direction === 'en_vi' ? 'Tiếng Việt' : 'Tiếng Anh (English)'}
              </span>
            </div>
            <div className="flex-1 w-full p-5 text-lg text-slate-800 leading-relaxed overflow-y-auto">
              {translatedText ? (
                <div className="whitespace-pre-wrap">{translatedText}</div>
              ) : (
                <span className="text-indigo-300/60 italic flex items-center gap-2 mt-20 justify-center">
                  <Sparkles size={16} strokeWidth={1.5} /> Bản dịch sẽ hiện ở đây...
                </span>
              )}
            </div>
            {translatedText && (
              <button
                onClick={() => navigator.clipboard.writeText(translatedText)}
                className="absolute bottom-4 right-4 p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-all hover:scale-105"
                title="Sao chép"
              >
                <Copy size={18} strokeWidth={1.5} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-fade-in border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Lịch sử dịch</h3>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa tất cả lịch sử?')) {
                        StorageService.clearAllHistory();
                        setHistory([]);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                    Xóa tất cả
                  </button>
                )}
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-slate-400 py-10">Chưa có lịch sử dịch.</p>
              ) : (
                history.map((record) => (
                  <div key={record.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
                    <div className="flex justify-between text-xs text-slate-400 mb-3">
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-medium">
                        {record.fromLang === 'en' ? 'Anh → Việt' : 'Việt → Anh'}
                      </span>
                      <div className="flex items-center gap-3">
                        <span>{new Date(record.timestamp).toLocaleString('vi-VN')}</span>
                        <button
                          onClick={() => {
                            StorageService.deleteHistory(record.id);
                            setHistory(prev => prev.filter(h => h.id !== record.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 rounded hover:bg-red-50"
                          title="Xóa mục này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="font-medium text-slate-800 mb-2">{record.sourceText}</p>
                    <div className="h-px bg-slate-50 my-2"></div>
                    <p className="text-indigo-700">{record.translatedText}</p>
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
