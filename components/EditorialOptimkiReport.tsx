import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OptimkiResult } from '../types';
import { Download, Copy, Share2, Check, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';
import './optimki-report-editorial.css';

interface EditorialOptimkiReportProps {
  result: OptimkiResult;
  /** Gọi lại phase 2 render HTML — nhận (brand_name, model_type, analysis_content, suggestion). */
  onRenderHtml?: (payload: Pick<OptimkiResult, 'brand_name' | 'model_type' | 'suggestion'> & { analysis_content: string }) => Promise<OptimkiResult | null>;
  /** Đang loading render lại. */
  isRendering?: boolean;
  /** Bước hiện tại khi render lại. */
  renderStep?: string;
}

/**
 * Design System v6 - BlueVigor Editorial Minimalism
 * Fonts: Cormorant Garamond (display) + Archivo (body)
 * Colors: Black/Warm White base + Green/Amber/Navy/Red accents
 * Supports masthead, section numbers, swot-infographic, aida-funnel, gauges, timeline
 */
const OPTIMKI_DESIGN_V6_INJECTION = `
<style data-optimki-v6>

  :root {
    --ink: #304f74;
    --ink-2: #3a3935;
    --ink-3: #8a887f;
    --ink-4: #b8b6ae;
    --paper: #faf9f6;
    --paper-2: #f2f0eb;
    --paper-3: #e8e5de;
    --accent: #1a5c3a;
    --accent-w: #c17f2a;
    --accent-b: #1a3a5c;
    --rule: rgba(15,15,13,0.1);
    --green: #1a5c3a;
    --green-light: #f0f7f4;
    --amber: #b5621a;
    --amber-light: #fdf8f0;
    --navy: #1a3358;
    --navy-light: #f1f4f8;
    --red: #8a1a1a;
    --red-light: #fdf3f3;
    --display: 'Playfair Display', Georgia, serif;
    --sans: 'DM Sans', system-ui, sans-serif;
    --body: 'DM Sans', sans-serif;
  }
  .page { padding: 0 2.5rem 6rem !important; background: var(--paper) !important; color: var(--ink) !important; font-family: var(--body) !important; }
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .a{opacity:0;animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}

  /* MASTHEAD */
  .masthead{border-bottom:1px solid var(--rule);padding:3.5rem 0 2.5rem;margin-bottom:4rem;display:grid;grid-template-columns:1fr auto;align-items:end;gap:2rem;}
  .masthead-kicker{font-family:var(--sans);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin-bottom:1.25rem;display:flex;align-items:center;gap:10px;}
  .masthead-kicker::before{content:'';display:block;width:24px;height:1px;background:var(--ink-4)}
  .masthead-title{font-family:var(--display);font-size:60px;font-weight:400;line-height:1.1;letter-spacing:-.01em;color:var(--ink);}
  .masthead-title em{color:var(--accent);font-style:italic;font-weight:400}
  .masthead-meta{text-align:right;font-family:var(--sans);font-size:10px;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;line-height:2;font-weight:600;}
  .masthead-meta strong{color:var(--ink);display:block;font-size:14px;letter-spacing:0;text-transform:none;font-family:var(--display);font-weight:400;font-style:italic}

  /* SECTION HEADING */
  .sec-head{display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;}
  .sec-num{font-family:var(--display);font-size:72px;line-height:.85;color:var(--paper-3);font-weight:400;flex-shrink:0;letter-spacing:-.02em;}
  .sec-label{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin-bottom:3px;}
  .sec-title{font-family:var(--display);font-size:22px;font-weight:400;color:var(--ink);line-height:1.2;}
  .section{margin-bottom:5rem}
  .divider{height:1px;background:var(--rule);margin:3rem 0}

  /* SWOT INFOGRAPHIC */
  .swot-infographic { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 0 !important; border: 1px solid var(--rule) !important; margin-bottom: 2rem !important; border-radius: 3px !important; overflow: hidden !important; background: #fff !important; }
  .swot-q { padding: 2rem 2rem 2.5rem !important; position: relative !important; }
  .swot-q:nth-child(1) { border-right: 1px solid var(--rule) !important; border-bottom: 1px solid var(--rule) !important; }
  .swot-q:nth-child(2) { border-bottom: 1px solid var(--rule) !important; }
  .swot-q:nth-child(3) { border-right: 1px solid var(--rule) !important; }
  .swot-q-accent { display: none !important; }
  .swot-q-letter { font-family: var(--display) !important; font-size: 80px !important; font-weight: 300 !important; line-height: .9 !important; opacity: .07 !important; position: absolute !important; right: 1.5rem !important; top: 1.25rem !important; }
  .swot-q:nth-child(1) .swot-q-letter { color: var(--green) !important; }
  .swot-q:nth-child(2) .swot-q-letter { color: var(--red) !important; }
  .swot-q:nth-child(3) .swot-q-letter { color: var(--amber) !important; }
  .swot-q:nth-child(4) .swot-q-letter { color: var(--navy) !important; }
  .swot-q-label { font-family: var(--sans) !important; font-size: 8px !important; letter-spacing: .2em !important; text-transform: uppercase !important; font-weight: 700 !important; margin-bottom: 1.25rem !important; display: block !important; position: relative !important; z-index: 1 !important; color: var(--ink-3) !important; }
  .swot-items { display: flex !important; flex-direction: column !important; gap: .625rem !important; position: relative !important; z-index: 1 !important; }
  .swot-item { display: flex !important; gap: .75rem !important; align-items: baseline !important; font-size: 11.5px !important; color: var(--ink-2) !important; line-height: 1.65 !important; }
  .swot-tick { flex-shrink: 0 !important; width: 6px !important; height: 6px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; position: relative !important; top: 5px !important; }
  .swot-q:nth-child(1) .swot-tick { background: var(--green) !important; }
  .swot-q:nth-child(2) .swot-tick { background: var(--red) !important; }
  .swot-q:nth-child(3) .swot-tick { background: var(--amber) !important; }
  .swot-q:nth-child(4) .swot-tick { background: var(--navy) !important; }
  .swot-tick svg { display: none !important; }

  /* AIDA FUNNEL */
  .aida-funnel{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:2rem;position:relative; border: 1px solid var(--rule); border-radius: 3px; overflow: hidden; background: #fff;}
  .aida-step{padding:2rem 1.5rem;border-right:1px solid var(--rule);position:relative;overflow:hidden;}
  .aida-step:last-child{border-right:none;}
  .aida-step-bar{position:absolute;top:0;left:0;right:0;height:4px; opacity: 0.1;}
  .aida-step-letter{font-family:var(--display);font-size:64px;font-weight:400;line-height:1;margin-bottom:.25rem;display:block;letter-spacing:-.02em; color: var(--paper-3);}
  .aida-step-name{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-bottom:1.25rem;}
  .aida-hook{font-family:var(--display);font-size:13px;font-style:italic;color:var(--ink);margin-bottom:.875rem;line-height:1.4;}
  .aida-desc{font-size:11.5px;color:var(--ink-2);line-height:1.65;}
  .aida-example{background:var(--paper-2);color:var(--ink);padding:1.5rem 1.75rem;margin-bottom:2rem;border:1px solid var(--rule);border-radius: 3px;}
  .aida-ex-kicker{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-bottom:.875rem;}
  .aida-ex-body{font-size:13px;line-height:1.8;color:var(--ink-2);}
  .aida-ex-body strong{color:var(--ink);font-weight:600;}

  /* 4P MATRIX */
  .fourp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0;border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .fourp-card{padding:1.75rem 2rem;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);position:relative;}
  .fourp-card:nth-child(2){border-right:none}
  .fourp-card:nth-child(3),.fourp-card:nth-child(4){border-bottom:none}
  .fourp-card:nth-child(4){border-right:none}
  .fourp-number{font-family:var(--display);font-size:11px;font-style:italic;color:var(--ink-4);margin-bottom:.375rem;}
  .fourp-name{font-family:var(--display);font-size:28px;font-weight:400;margin-bottom:.25rem;letter-spacing:-.01em; color: var(--ink);}
  .fourp-priority{font-family:var(--sans);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--rule);font-weight:600;}
  .pbar{display:flex;gap:3px;margin-top:.375rem}
  .pbar-seg{width:18px;height:3px;border-radius:1px;background:var(--paper-3)}
  .fourp-body{list-style:none;font-size:11.5px;color:var(--ink-2);line-height:1.65;}
  .fourp-body li{padding-left:1.25rem;position:relative;margin-bottom:.375rem}
  .fourp-body li::before{content:'→';position:absolute;left:0;color:var(--ink-4);font-size:10px;top:2px}
  .fourp-body strong{color:var(--ink);font-weight:600;}

  /* 5W1H */
  .w1h-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .w1h-card{padding:1.75rem 1.75rem;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);position:relative;overflow:hidden;}
  .w1h-card:nth-child(3){border-right:none}
  .w1h-card:nth-child(4),.w1h-card:nth-child(5),.w1h-card:nth-child(6){border-bottom:none}
  .w1h-card:nth-child(6){border-right:none}
  .w1h-ghost{position:absolute;right:-.25rem;top:-.75rem;font-family:var(--display);font-size:90px;font-weight:400;opacity:.08;line-height:1;pointer-events:none;color:var(--paper-3);}
  .w1h-q{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-bottom:.25rem;}
  .w1h-name{font-family:var(--display);font-size:18px;font-weight:400;color:var(--ink);margin-bottom:1.25rem;line-height:1.2;}
  .w1h-items{list-style:none;font-size:11.5px;color:var(--ink-2);line-height:1.65}
  .w1h-items li{padding-left:1rem;position:relative;margin-bottom:.375rem}
  .w1h-items li::before{content:'·';position:absolute;left:0;color:var(--ink-4)}
  .w1h-items strong{color:var(--ink);font-weight:600;}

  /* SMART & TIMELINE */
  .smart-quote-block{font-family:var(--display);font-size:clamp(22px,3vw,32px);font-weight:400;font-style:italic;color:var(--ink);padding:1.5rem 1.75rem;border:1px solid var(--rule);border-radius:3px;line-height:1.3;margin-bottom:2.5rem; position: relative;}
  .smart-quote-block::before{content:'\\201C';font-family:var(--display);font-size:64px;color:var(--accent);opacity:.15;position:absolute;top:-8px;left:12px;line-height:1}
  .smart-gauges{display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .smart-g{padding:1.75rem 1.25rem;border-right:1px solid var(--rule);text-align:center;position:relative;}
  .smart-g:last-child{border-right:none}
  .gauge-wrap{width:80px;height:80px;margin:0 auto .875rem;position:relative;}
  .gauge-wrap svg{width:80px;height:80px}
  .gauge-bg{fill:none;stroke:var(--paper-3);stroke-width:6}
  .gauge-fill{fill:none;stroke-width:6;stroke-linecap:round;transition:stroke-dashoffset .8s ease; stroke: var(--accent);}
  .gauge-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:18px;font-weight:400;color:var(--ink);}
  .smart-g-name{font-family:var(--sans);font-size:8px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--ink-4);margin-bottom:.875rem;}
  .smart-statement{background:var(--paper-2);color:var(--ink);padding:1.5rem 1.75rem;border:1px solid var(--rule);border-radius:3px;margin-bottom:2rem;font-family:var(--display);font-size:15px;line-height:1.7;font-style:italic;}
  .smart-statement strong{color:var(--accent);font-weight:600;}
  .timeline-wrap{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--rule); border-radius: 3px; overflow: hidden; background: #fff;}
  .tl-phase{padding:1.75rem 1.75rem 2rem;border-right:1px solid var(--rule);position:relative;}
  .tl-phase:last-child{border-right:none}
  .tl-accent{position:absolute;top:0;left:0;right:0;height:4px; opacity: 0.1; background: var(--accent);}
  .tl-month-tag{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-bottom:.375rem;margin-top:.5rem;}
  .tl-phase-title{font-family:var(--display);font-size:17px;font-weight:400;color:var(--ink);margin-bottom:1.25rem;line-height:1.3;}
  .tl-items{display:flex;flex-direction:column;gap:.625rem}
  .tl-item{display:flex;gap:.75rem;align-items:flex-start;font-size:11.5px;color:var(--ink-2);line-height:1.55;}
  .tl-dot{width:4px;height:4px;border-radius:50%;background:var(--ink-4);flex-shrink:0;margin-top:6px}

  /* SYNTHESIS / TOP 3 */
  .top3-block{border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .top3-head{padding:.875rem 1.75rem;background:var(--paper-2);color:var(--ink);font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;}
  .top3-item{display:grid;grid-template-columns:80px 1fr;gap:0;border-top:1px solid var(--rule);align-items:stretch;}
  .top3-num{font-family:var(--display);font-size:48px;font-weight:400;color:var(--paper-3);line-height:1;display:flex;align-items:center;justify-content:center;border-right:1px solid var(--rule);padding:1.25rem;letter-spacing:-.02em;}
  .top3-content{padding:1.25rem 1.75rem;font-size:12.5px;color:var(--ink-2);line-height:1.7;}
  .top3-content strong{color:var(--ink);font-weight:600}

  /* CMO SECTION */
  .cmo-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2.5rem;}
  .cmo-title{font-family:var(--display);font-size:32px;font-weight:400;letter-spacing:-.01em; color: var(--ink);}
  .cmo-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .cmo-card{padding:2rem 2rem;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);}
  .cmo-card:nth-child(2){border-right:none}
  .cmo-card:nth-child(3),.cmo-card:nth-child(4){border-bottom:none}
  .cmo-card:nth-child(4){border-right:none}
  .cmo-card-title{font-family:var(--display);font-size:20px;font-weight:400;margin-bottom:1rem;line-height:1.2; color: var(--ink);}
  .cmo-card.highlight{background:var(--paper-2);}
  .cmo-card.danger{border-left:3px solid #8a1a1a;}
  .cmo-card.opp{border-left:3px solid var(--accent-w);}
  
  .verdict{font-family:var(--display);font-size:18px;font-style:italic;font-weight:400;color:var(--ink);line-height:1.4;padding:1.5rem 1.75rem;border:1px solid var(--rule);background:var(--paper-2);border-radius:3px;margin-bottom:2rem;}
  
  .missing-block{border-top:1px dashed var(--rule);padding-top:1.25rem;margin-top:1.25rem;}
  .missing-label{font-family:var(--sans);font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:500;color:var(--ink-4);margin-bottom:.75rem;}
  
  .stats-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--rule);margin-top:3rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .stat{padding:1.75rem 2rem;border-right:1px solid var(--rule);position:relative;}
  .stat:last-child{border-right:none}
  .stat-value{font-family:var(--display);font-size:42px;font-weight:400;line-height:1;margin-bottom:.375rem;letter-spacing:-.02em; color: var(--ink);}
  .stat-label{font-family:var(--sans);font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-3);font-weight:600;}

  /* Global Typography rules */
  * { font-weight: 400 !important; }
  strong, b, .swot-label, .sec-label, .masthead-meta, .aida-step-name, .fourp-priority, .w1h-q, .smart-g-name, .tl-month-tag, .top3-head, .missing-label, .stat-label { font-weight: 600 !important; }
  .sec-title, .fourp-name, .w1h-name, .tl-phase-title, .cmo-card-title { font-weight: 400 !important; }
  h1, h2, h3, h4, h5, h6, .doc-title, .masthead-title, .sec-num, .stat-value, .top3-num { font-weight: 400 !important; }

  @media(max-width:768px){
    .masthead{grid-template-columns:1fr}
    .swot-infographic,.aida-funnel,.fourp-grid,.smart-gauges,.timeline-wrap,.cmo-grid{grid-template-columns:1fr}
    .stats-bar{grid-template-columns:1fr 1fr}
  }

</style>
`;

function normalizeOptimkiReportHtml(html: string): string {
  let processed = html.trim();
  if (!processed) return '';

  // 1. Strip any existing V6 injection if present to avoid duplicates
  processed = processed.replace(/<style data-optimki-v6>[\s\S]*?<\/style>/gi, '');

  // 2. Ensure we have a proper shell if missing
  if (!/<!DOCTYPE/i.test(processed) && !/<html/i.test(processed)) {
    processed = `<div class='page'>${processed}</div>`;
  }

  // 3. Inject the CSS (V6 BlueVigor)
  if (/<head>/i.test(processed)) {
    processed = processed.replace(/<head>/i, `<head>${OPTIMKI_DESIGN_V6_INJECTION}`);
  } else if (/<html/i.test(processed)) {
    processed = processed.replace(/<html[^>]*>/i, `$&<head>${OPTIMKI_DESIGN_V6_INJECTION}</head>`);
  } else {
    // Fragment mode
    processed = `${OPTIMKI_DESIGN_V6_INJECTION}${processed}`;
  }

  // 4. Retroactively fix SWOT punctuation (Colon to Dash)
  processed = processed.replace(
    /(<strong>[^<]+<\/strong>)\s*[:：]/gi,
    '$1 —'
  ).replace(
    /(<strong>[^<]+):<\/strong>/gi,
    '$1</strong> —'
  );

  // 5. Normalize old class names to new BlueVigor format
  processed = processed.replace(/class='swot-grid'/g, "class='swot-infographic'");
  processed = processed.replace(/class="swot-grid"/g, "class='swot-infographic'");
  processed = processed.replace(/class='swot-cell/g, "class='swot-q");
  processed = processed.replace(/class="swot-cell/g, "class='swot-q");
  processed = processed.replace(/class='swot-icon'/g, "class='swot-tick'");
  processed = processed.replace(/class="swot-icon"/g, "class='swot-tick'");

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

/** Đủ dài để gọi phase-2 render (tránh payload rỗng). */
const MIN_RERENDER_TEXT_LEN = 80;

/**
 * Lấy plain text từ HTML báo cáo — dùng khi không có analysis_content (lịch sử cũ / JSON thiếu trường).
 */
function extractPlainTextFromReportHtml(html: string): string {
  const raw = html?.trim() ?? '';
  if (!raw) return '';
  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const text = doc.body?.textContent ?? '';
    return text.replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

/**
 * Ưu tiên analysis_content; nếu thiếu hoặc quá ngắn thì trích text từ html_report.
 */
function getAnalysisTextForReRender(result: OptimkiResult): string {
  const ac = result.analysis_content?.trim() ?? '';
  const fromHtml = extractPlainTextFromReportHtml(result.html_report ?? '');
  if (ac.length >= MIN_RERENDER_TEXT_LEN) return ac;
  if (fromHtml.length >= MIN_RERENDER_TEXT_LEN) return fromHtml;
  if (ac.length > 0) return ac;
  return fromHtml;
}

export const EditorialOptimkiReport: React.FC<EditorialOptimkiReportProps> = ({
  result,
  onRenderHtml,
  isRendering,
  renderStep,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const analysisTextForReRender = useMemo(
    () => getAnalysisTextForReRender(result),
    [result.analysis_content, result.html_report]
  );
  const canReRender = Boolean(onRenderHtml && analysisTextForReRender.length >= MIN_RERENDER_TEXT_LEN);

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

  const handleReRender = async () => {
    if (!onRenderHtml || isRendering) return;
    const payloadText = analysisTextForReRender;
    if (payloadText.length < MIN_RERENDER_TEXT_LEN) {
      toast.warning(
        'Không đủ nội dung để render lại',
        'Cần bản phân tích gốc hoặc HTML báo cáo có chữ. Hãy chạy phân tích mới hoặc kiểm tra file đã lưu.'
      );
      return;
    }
    await onRenderHtml({
      brand_name: result.brand_name,
      model_type: result.model_type,
      analysis_content: payloadText,
      suggestion: result.suggestion,
    });
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
        <button
          type="button"
          onClick={() => void handleReRender()}
          disabled={isRendering || !canReRender}
          title={
            !onRenderHtml
              ? 'Không có handler render'
              : analysisTextForReRender.length < MIN_RERENDER_TEXT_LEN
                ? 'Cần ít nhất vài chục ký tự phân tích hoặc nội dung chữ trong HTML báo cáo'
                : !result.analysis_content?.trim()
                  ? 'Sẽ dùng văn bản trích từ HTML hiện tại làm nguồn render lại'
                  : undefined
          }
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors text-xs font-medium ${
            isRendering ? 'cursor-not-allowed opacity-50' : canReRender ? 'hover:bg-white/10' : 'cursor-not-allowed opacity-50'
          }`}
        >
          {isRendering ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {isRendering ? (renderStep ?? 'Đang render...') : 'Render lại HTML'}
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
