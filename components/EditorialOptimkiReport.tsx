import React, { useEffect, useMemo, useRef } from 'react';
import { OptimkiResult } from '../types';
import { Download, Copy, Share2, Check } from 'lucide-react';
import './optimki-report-editorial.css';

interface EditorialOptimkiReportProps {
  result: OptimkiResult;
}

/** 
 * Design System v5 - Premium Editorial SWOT Redesign
 * Supports icon-based bullets, decorative letters, and themed cell borders.
 * Includes legacy fallbacks for older report structures.
 */
const OPTIMKI_DESIGN_V5_INJECTION = `
<style data-optimki-v5>
  :root {
    --ink: #0f0f0d; --paper: #faf9f6; 
    --accent: #1a5c3a; --danger: #8a1a1a; --accent-w: #c17f2a; --accent-b: #1a3a5c;
    --rule: rgba(15,15,13,0.1);
    --serif: 'Playfair Display', Georgia, serif;
    --sans: 'DM Sans', system-ui, sans-serif;
  }
  .page { padding: 1.5rem 100px 6rem !important; }
  
  /* SWOT — 2×2 kem / viền đậm / icon tròn đặc (khớp reference UI) */
  .swot-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    grid-auto-rows: minmax(0, auto) !important;
    gap: 0 !important;
    border: 1px solid rgba(15, 15, 13, 0.38) !important;
    border-radius: 4px !important;
    overflow: hidden !important;
    margin-bottom: 1.5rem !important;
    background: #f8f6f1 !important;
  }
  .swot-cell {
    padding: 1.35rem 1.2rem 1.45rem !important;
    position: relative !important;
    border-right: 1px solid rgba(15, 15, 13, 0.32) !important;
    border-bottom: 1px solid rgba(15, 15, 13, 0.32) !important;
    min-height: 0 !important;
    background: #f8f6f1 !important;
  }
  .swot-cell:nth-child(2), .swot-cell.weakness, .swot-cell:nth-child(4), .swot-cell.threat { border-right: none !important; }
  .swot-cell:nth-child(3), .swot-cell:nth-child(4), .swot-cell.opportunity, .swot-cell.threat { border-bottom: none !important; }

  .swot-cell:nth-child(1), .swot-cell.strength { border-top: 4px solid var(--accent) !important; }
  .swot-cell:nth-child(2), .swot-cell.weakness { border-top: 4px solid #7a1f24 !important; }
  .swot-cell:nth-child(3), .swot-cell.opportunity { border-top: 4px solid #c9a227 !important; }
  .swot-cell:nth-child(4), .swot-cell.threat { border-top: 4px solid #1a3a5c !important; }

  .swot-letter {
    position: absolute !important;
    top: 0.75rem !important;
    right: 1rem !important;
    font-family: var(--serif) !important;
    font-size: 4.85rem !important;
    line-height: 1 !important;
    opacity: 0.1 !important;
    color: var(--ink) !important;
    pointer-events: none !important;
    z-index: 0 !important;
  }

  .swot-label {
    font-size: 10px !important;
    letter-spacing: 0.14em !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
    font-family: var(--sans) !important;
    margin-bottom: 1.05rem !important;
    display: block !important;
    position: relative !important;
    z-index: 1 !important;
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    transform: none !important;
  }
  .swot-cell:nth-child(1) .swot-label, .swot-cell.strength .swot-label { color: var(--accent) !important; }
  .swot-cell:nth-child(2) .swot-label, .swot-cell.weakness .swot-label { color: #7a1f24 !important; }
  .swot-cell:nth-child(3) .swot-label, .swot-cell.opportunity .swot-label { color: #a67c00 !important; }
  .swot-cell:nth-child(4) .swot-label, .swot-cell.threat .swot-label { color: var(--accent-b) !important; }

  .swot-item {
    display: flex !important;
    gap: 11px !important;
    margin-bottom: 0.95rem !important;
    font-size: 12.5px !important;
    line-height: 1.62 !important;
    align-items: flex-start !important;
    position: relative !important;
    z-index: 1 !important;
  }
  .swot-item:last-child { margin-bottom: 0 !important; }
  .swot-item > span { color: #3a3935 !important; }

  .swot-icon {
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    border-radius: 50% !important;
    flex-shrink: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    color: #fff !important;
    position: relative !important;
    top: 2px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  }
  .swot-cell:nth-child(1) .swot-icon, .swot-cell.strength .swot-icon { background: var(--accent) !important; color: #fff !important; }
  .swot-cell:nth-child(2) .swot-icon, .swot-cell.weakness .swot-icon { background: #7a1f24 !important; color: #fff !important; }
  .swot-cell:nth-child(3) .swot-icon, .swot-cell.opportunity .swot-icon { background: #b8860b !important; color: #fff !important; }
  .swot-cell:nth-child(4) .swot-icon, .swot-cell.threat .swot-icon { background: #1a3a5c !important; color: #fff !important; }

  /* Legacy: chỉ có .swot-dot → tròn đặc + ký hiệu trắng */
  .swot-item > .swot-dot {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    border-radius: 50% !important;
    position: relative !important;
    top: 2px !important;
    flex-shrink: 0 !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  }
  .swot-cell:nth-child(1) .swot-dot, .swot-cell.strength .swot-dot { background: var(--accent) !important; }
  .swot-cell:nth-child(2) .swot-dot, .swot-cell.weakness .swot-dot { background: #7a1f24 !important; }
  .swot-cell:nth-child(3) .swot-dot, .swot-cell.opportunity .swot-dot { background: #b8860b !important; }
  .swot-cell:nth-child(4) .swot-dot, .swot-cell.threat .swot-dot { background: #1a3a5c !important; }
  .swot-cell:nth-child(1) .swot-dot::after, .swot-cell.strength .swot-dot::after { content: '✓' !important; color: #fff !important; font-size: 9px !important; font-weight: 700 !important; line-height: 1 !important; }
  .swot-cell:nth-child(2) .swot-dot::after, .swot-cell.weakness .swot-dot::after { content: '✕' !important; color: #fff !important; font-size: 8px !important; font-weight: 700 !important; line-height: 1 !important; }
  .swot-cell:nth-child(3) .swot-dot::after, .swot-cell.opportunity .swot-dot::after { content: '+' !important; color: #fff !important; font-size: 11px !important; font-weight: 700 !important; line-height: 1 !important; }
  .swot-cell:nth-child(4) .swot-dot::after, .swot-cell.threat .swot-dot::after { content: '!' !important; color: #fff !important; font-size: 10px !important; font-weight: 700 !important; line-height: 1 !important; }

  .swot-item strong { color: var(--ink) !important; font-weight: 600 !important; }

  /* Global Weight Policy */
  * { font-weight: 400 !important; }
  strong, b, .swot-label { font-weight: 600 !important; }
  h1, h2, h3, h4, h5, h6, .doc-title, .sh-title, .fb-val, .tag { font-weight: 400 !important; }
</style>
`;

function normalizeOptimkiReportHtml(html: string): string {
  let processed = html;

  // 1. Inject the new CSS (V5) into <head>
  if (/<\/head>/i.test(processed)) {
    processed = processed.replace(/<\/head>/i, `${OPTIMKI_DESIGN_V5_INJECTION}</head>`);
  } else {
    processed = `${OPTIMKI_DESIGN_V5_INJECTION}${processed}`;
  }

  // 2. Retroactively fix SWOT punctuation (Colon to Dash)
  processed = processed.replace(
    /(<strong>[^<]+<\/strong>)\s*[:：]/gi,
    '$1 —'
  ).replace(
    /(<strong>[^<]+):<\/strong>/gi,
    '$1</strong> —'
  );

  return processed;
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
        sandbox="allow-scripts allow-same-origin"
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
