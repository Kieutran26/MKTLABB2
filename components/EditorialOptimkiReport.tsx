import React, { useEffect, useMemo, useRef } from 'react';
import { OptimkiResult } from '../types';
import { Download, Copy, Share2, Check } from 'lucide-react';
import './optimki-report-editorial.css';

interface EditorialOptimkiReportProps {
  result: OptimkiResult;
}

function normalizeOptimkiReportHtml(html: string): string {
  return html;
}

/**
 * Model trả về file HTML đầy đủ (<!DOCTYPE>…</html>).
 * 1. Extract <style>...</style> từ <head> (model inline CSS).
 * 2. Trả nội dung <body> để inject.
 * Nếu model HTML không có <style> trong <head>, scoped CSS từ optimki-report-editorial.css
 * sẽ lo việc định kiểu (vì .optimki-report đã có đầy đủ class như reference).
 */
function extractBodyInnerForPreview(html: string): string {
  const t = html.trim();
  if (!/<body[\s>]/i.test(t)) return html;
  const bodyMatch = t.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1].trim() : html;
}

export const EditorialOptimkiReport: React.FC<EditorialOptimkiReportProps> = ({ result }) => {
  const [copied, setCopied] = React.useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /**
   * Model returns a full HTML document string (with <!DOCTYPE>, <html>, <head>, <body>).
   * Render it in an <iframe> with srcdoc so:
   *   (a) Full document structure — <style>, CSS variables, fonts — render correctly.
   *   (b) Host React tree styles cannot pollute the report.
   *   (c) Report styles cannot leak out.
   */
  const srcdoc = useMemo(() => {
    const raw = result.html_report.trim();
    return normalizeOptimkiReportHtml(raw);
  }, [result.html_report]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [result]);

  const handleCopy = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const body = iframe.contentWindow.document.body;
    const text = body?.textContent ?? '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportHtml = () => {
    const blob = new Blob([srcdoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OptiMKI_${result.brand_name}_${result.model_type}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="optimki-report-container">
      {/* Full-isolation iframe — model HTML renders here with its own styles */}
      <iframe
        ref={iframeRef}
        title="Opti M.KI Report"
        className="optimki-iframe"
        srcDoc={srcdoc}
        sandbox="allow-same-origin"
        loading="lazy"
      />

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

      {/* Decorative Brand Tag */}
      <div className="mx-auto mt-8 flex w-full max-w-full items-center justify-between px-4 opacity-30 select-none pointer-events-none sm:px-6">
        <div className="text-[10px] uppercase tracking-widest font-medium">Opti M.KI Strategy Engine</div>
        <div className="text-[10px] uppercase tracking-widest font-medium">© 2026 ClaudeKit Marketing</div>
      </div>
    </div>
  );
};
