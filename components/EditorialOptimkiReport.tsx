import React, { useEffect, useRef } from 'react';
import { OptimkiResult } from '../types';
import { Download, Copy, Share2, Check } from 'lucide-react';
import './optimki-report-editorial.css';

interface EditorialOptimkiReportProps {
  result: OptimkiResult;
}

export const EditorialOptimkiReport: React.FC<EditorialOptimkiReportProps> = ({ result }) => {
  const [copied, setCopied] = React.useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [result]);

  const handleCopy = () => {
    if (reportRef.current) {
      const text = reportRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportHtml = () => {
    const blob = new Blob([result.html_report], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OptiMKI_${result.brand_name}_${result.model_type}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="optimki-report-container">
      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-[#0f0f0d] text-white rounded-full shadow-2xl z-50 border border-white/10 backdrop-blur-md">
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/10 rounded-full transition-colors text-xs font-medium"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Đã sao chép' : 'Sao chép văn bản'}
        </button>
        <div className="w-[1px] h-4 bg-white/20" />
        <button 
          onClick={handleExportHtml}
          className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/10 rounded-full transition-colors text-xs font-medium"
        >
          <Download size={14} />
          Xuất HTML
        </button>
        <div className="w-[1px] h-4 bg-white/20" />
        <button className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/10 rounded-full transition-colors text-xs font-medium opacity-50 cursor-not-allowed">
          <Share2 size={14} />
          Chia sẻ
        </button>
      </div>

      {/* The Actual Report */}
      <div 
        ref={reportRef}
        className="optimki-report"
        dangerouslySetInnerHTML={{ __html: result.html_report }} 
      />

      {/* Decorative Brand Tag */}
      <div className="max-width-[960px] mx-auto mt-8 px-10 flex justify-between items-center opacity-30 select-none pointer-events-none">
        <div className="text-[10px] uppercase tracking-widest font-medium">Opti M.KI Strategy Engine</div>
        <div className="text-[10px] uppercase tracking-widest font-medium">© 2026 ClaudeKit Marketing</div>
      </div>
    </div>
  );
};
