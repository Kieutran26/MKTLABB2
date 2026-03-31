import React, { useState } from 'react';
import { ArrowRightLeft, Loader2, Copy, Languages } from 'lucide-react';
import { translateText } from '../services/geminiService';

const TranslationView: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState<'en_vi' | 'vi_en'>('en_vi');

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    const from = direction === 'en_vi' ? 'en' : 'vi';
    const to = direction === 'en_vi' ? 'vi' : 'en';

    const result = await translateText(sourceText, from, to);
    setTranslatedText(result);
    setIsLoading(false);
  };

  const swapLanguages = () => {
    setDirection(prev => (prev === 'en_vi' ? 'vi_en' : 'en_vi'));
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10 max-w-2xl md:mb-12">
        <div className="mb-4 flex items-center gap-3 text-stone-400">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600"
            aria-hidden
          >
            <Languages size={20} strokeWidth={1.25} />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
            AI
          </span>
        </div>
        <h1 className="font-sans text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
          Dịch thuật AI
        </h1>
        <p className="mt-4 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
          Dịch nội dung nhanh chóng với sức mạnh của AI
        </p>
      </header>

      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300/90">
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Cột nguồn */}
          <div className="flex flex-1 flex-col p-8 md:p-10">
            <span className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">
              {direction === 'en_vi' ? 'Tiếng Anh (English)' : 'Tiếng Việt'}
            </span>
            <textarea
              className="min-h-[220px] w-full flex-1 resize-none border-0 bg-transparent p-0 text-[1rem] font-normal leading-relaxed text-stone-700 placeholder:text-stone-400 focus:ring-0"
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

          <div className="mx-8 block h-px bg-stone-100 md:hidden" />
          <div className="hidden w-px self-stretch bg-stone-100 md:my-8 md:block" />

          {/* Cột đích */}
          <div className="relative flex flex-1 flex-col p-8 md:p-10">
            <span className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">
              {direction === 'en_vi' ? 'Tiếng Việt' : 'Tiếng Anh (English)'}
            </span>
            <div className="min-h-[220px] flex-1 overflow-y-auto text-[1rem] font-normal leading-relaxed text-stone-700">
              {translatedText ? (
                <div className="whitespace-pre-wrap">{translatedText}</div>
              ) : (
                <p className="text-stone-400">Bản dịch sẽ xuất hiện ở đây...</p>
              )}
            </div>

            <div className="absolute -left-5 top-1/2 z-10 hidden -translate-y-1/2 md:block">
              <button
                type="button"
                onClick={swapLanguages}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200/90 bg-white text-stone-500 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors hover:border-stone-300 hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
                title="Đổi chiều dịch"
              >
                <ArrowRightLeft size={16} strokeWidth={1.25} />
              </button>
            </div>

            {translatedText ? (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(translatedText)}
                className="absolute bottom-8 right-8 flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                title="Sao chép"
              >
                <Copy size={16} strokeWidth={1.25} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex justify-center border-t border-stone-100 px-8 py-6 md:px-10">
          <button
            type="button"
            onClick={handleTranslate}
            disabled={isLoading || !sourceText.trim()}
            className="min-w-[140px] rounded-full border border-stone-200/90 bg-white px-8 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50/80 hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-stone-100 disabled:text-stone-400 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Đang dịch...
              </span>
            ) : (
              'Dịch thuật'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationView;
