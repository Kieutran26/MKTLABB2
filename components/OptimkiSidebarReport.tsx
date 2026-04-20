import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, Loader2, RefreshCw, ChevronRight, ChevronDown, LayoutGrid, Target, Users, MessageSquare, TrendingUp, Sparkles } from 'lucide-react';
import { OptimkiResult } from '../types';
import { useToast } from './Toast';

interface OptimkiSidebarReportProps {
  result: OptimkiResult;
  onRenderHtml?: (
    payload: Pick<OptimkiResult, 'brand_name' | 'model_type' | 'suggestion'> & {
      analysis_content: string;
    }
  ) => Promise<OptimkiResult | null>;
  isRendering?: boolean;
  renderStep?: string;
}

type ParsedCard = {
  badge?: string;
  title: string;
  lines: string[];
};

type ParsedSection = {
  number?: string;
  label?: string;
  title: string;
  paragraphs: string[];
  cards: ParsedCard[];
  verdict?: string;
};

const SIDEBAR_BG = '#FCFDFC';
const NAV_TEXT = '#4A4A4A';
const BORDER_SUBTLE = '#E8E5E1';

const MIN_RERENDER_TEXT_LEN = 80;

function extractPlainTextFromReportHtml(html: string): string {
  const raw = html?.trim() ?? '';
  if (!raw) return '';

  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    return (doc.body?.textContent ?? '').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

function getAnalysisTextForReRender(result: OptimkiResult): string {
  const analysis = result.analysis_content?.trim() ?? '';
  const fromHtml = extractPlainTextFromReportHtml(result.html_report ?? '');
  if (analysis.length >= MIN_RERENDER_TEXT_LEN) return analysis;
  if (fromHtml.length >= MIN_RERENDER_TEXT_LEN) return fromHtml;
  return analysis || fromHtml;
}

function addClassAliases(doc: Document, selectors: string, classNames: string[]) {
  doc.querySelectorAll(selectors).forEach((node) => {
    classNames.forEach((className) => node.classList.add(className));
  });
}

function textOf(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function linesFromNode(node: Element): string[] {
  const items = Array.from(node.querySelectorAll('li'))
    .map((item) => textOf(item))
    .filter(Boolean);

  if (items.length > 0) return items;

  const paragraphs = Array.from(node.querySelectorAll('p'))
    .map((p) => textOf(p))
    .filter(Boolean);

  if (paragraphs.length > 0) return paragraphs;

  const raw = textOf(node);
  return raw ? [raw] : [];
}

function parseCards(container: Element, cardSelector: string, titleSelector: string, badgeSelector?: string): ParsedCard[] {
  return Array.from(container.querySelectorAll(cardSelector))
    .map((card) => {
      const title = textOf(card.querySelector(titleSelector)) || 'Nội dung';
      const badge = badgeSelector ? textOf(card.querySelector(badgeSelector)) : undefined;
      const lines = linesFromNode(card).filter((line) => line !== title && line !== badge);
      return { badge, title, lines };
    })
    .filter((card) => card.title || card.lines.length > 0);
}

function parseOptimkiSections(html: string): ParsedSection[] {
  const raw = html?.trim() ?? '';
  if (!raw) return [];

  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');

    addClassAliases(doc, '.section, .em-section, .mki-section', ['mki-section']);
    addClassAliases(doc, '.sec-head, .section-header, .em-section-header, .mki-sec-head', ['mki-sec-head']);
    addClassAliases(doc, '.sec-num, .mki-sec-num', ['mki-sec-num']);
    addClassAliases(doc, '.sec-label, .mki-sec-label', ['mki-sec-label']);
    addClassAliases(doc, '.sec-title, .mki-sec-title', ['mki-sec-title']);

    addClassAliases(doc, '.swot-infographic, .swot-grid, .em-swot, .mki-swot', ['mki-swot']);
    addClassAliases(doc, '.swot-cell, .swot-q, .em-swot-cell, .mki-swot-cell', ['mki-swot-cell']);
    addClassAliases(doc, '.swot-letter, .swot-q-letter, .mki-swot-letter', ['mki-swot-letter']);
    addClassAliases(doc, '.swot-label, .swot-q-label, .mki-swot-label', ['mki-swot-label']);

    addClassAliases(doc, '.aida-funnel, .em-aida, .mki-aida', ['mki-aida']);
    addClassAliases(doc, '.aida-step, .em-aida-step, .mki-aida-step', ['mki-aida-step']);
    addClassAliases(doc, '.aida-letter, .mki-aida-letter', ['mki-aida-letter']);
    addClassAliases(doc, '.aida-name, .mki-aida-name', ['mki-aida-name']);

    addClassAliases(doc, '.fourp-grid, .mki-4p', ['mki-4p']);
    addClassAliases(doc, '.fourp-card, .mki-4p-card', ['mki-4p-card']);
    addClassAliases(doc, '.fourp-letter, .mki-4p-letter', ['mki-4p-letter']);
    addClassAliases(doc, '.fourp-name, .mki-4p-name', ['mki-4p-name']);

    addClassAliases(doc, '.w1h-grid, .mki-5w1h', ['mki-5w1h']);
    addClassAliases(doc, '.w1h-card, .mki-5w1h-card', ['mki-5w1h-card']);
    addClassAliases(doc, '.w1h-q, .mki-5w1h-q', ['mki-5w1h-q']);
    addClassAliases(doc, '.w1h-name, .mki-5w1h-name', ['mki-5w1h-name']);

    addClassAliases(doc, '.smart-gauges, .mki-smart', ['mki-smart']);
    addClassAliases(doc, '.smart-g, .mki-smart-g', ['mki-smart-g']);
    addClassAliases(doc, '.smart-letter, .mki-smart-letter', ['mki-smart-letter']);
    addClassAliases(doc, '.smart-name, .mki-smart-name', ['mki-smart-name']);
    addClassAliases(doc, '.smart-statement, .verdict, .mki-verdict', ['mki-verdict']);

    addClassAliases(doc, '.timeline-wrap, .mki-timeline', ['mki-timeline']);
    addClassAliases(doc, '.tl-phase, .tl, .mki-tl', ['mki-tl']);

    const sections = Array.from(doc.querySelectorAll('.mki-section'));
    if (sections.length === 0) {
      const text = extractPlainTextFromReportHtml(raw);
      return text
        ? [
            {
              number: '01',
              label: 'PHÂN TÍCH',
              title: 'Báo cáo chiến lược',
              paragraphs: [text],
              cards: [],
            },
          ]
        : [];
    }

    return sections.map((section, index) => {
      const title = textOf(section.querySelector('.mki-sec-title')) || `Phần ${index + 1}`;
      const label = textOf(section.querySelector('.mki-sec-label')) || 'MÔ HÌNH CHIẾN LƯỢC';
      const number = textOf(section.querySelector('.mki-sec-num')) || String(index + 1).padStart(2, '0');

      let cards: ParsedCard[] = [];
      const swot = section.querySelector('.mki-swot');
      const aida = section.querySelector('.mki-aida');
      const fourp = section.querySelector('.mki-4p');
      const fivew = section.querySelector('.mki-5w1h');
      const smart = section.querySelector('.mki-smart');
      const timeline = section.querySelector('.mki-timeline');

      if (swot) cards = parseCards(swot, '.mki-swot-cell', '.mki-swot-label', '.mki-swot-letter');
      else if (aida) cards = parseCards(aida, '.mki-aida-step', '.mki-aida-name', '.mki-aida-letter');
      else if (fourp) cards = parseCards(fourp, '.mki-4p-card', '.mki-4p-name', '.mki-4p-letter');
      else if (fivew) cards = parseCards(fivew, '.mki-5w1h-card', '.mki-5w1h-name', '.mki-5w1h-q');
      else if (smart) cards = parseCards(smart, '.mki-smart-g', '.mki-smart-name', '.mki-smart-letter');
      else if (timeline) cards = parseCards(timeline, '.mki-tl', '.mki-tl');

      const paragraphs = Array.from(section.querySelectorAll(':scope > p, :scope > .em-prose p, :scope > .fallback-prose p'))
        .map((p) => textOf(p))
        .filter(Boolean);

      const verdict = textOf(section.querySelector('.mki-verdict')) || undefined;

      return {
        number,
        label,
        title,
        paragraphs,
        cards,
        verdict,
      };
    });
  } catch {
    const text = extractPlainTextFromReportHtml(raw);
    return text
      ? [
          {
            number: '01',
            label: 'PHÂN TÍCH',
            title: 'Báo cáo chiến lược',
            paragraphs: [text],
            cards: [],
          },
        ]
      : [];
  }
}

function getModelLabel(model: string): string {
  const labels: Record<string, string> = {
    SWOT: 'SWOT Analysis',
    AIDA: 'AIDA Framework',
    '4P': 'Marketing Mix 4P',
    '5W1H': '5W1H Action Plan',
    SMART: 'SMART Goals',
    tat_ca: 'Full Strategy',
  };

  return labels[model] || model;
}

function getModelIcon(model: string) {
  const icons: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
    SWOT: Target,
    AIDA: Users,
    '4P': LayoutGrid,
    '5W1H': MessageSquare,
    SMART: TrendingUp,
    tat_ca: Sparkles,
  };
  return icons[model] || Target;
}

function getModelColor(model: string): string {
  const colors: Record<string, string> = {
    SWOT: '#059669',
    AIDA: '#0284c7',
    '4P': '#d97706',
    '5W1H': '#7c3aed',
    SMART: '#dc2626',
    tat_ca: '#4A4A4A',
  };
  return colors[model] || '#4A4A4A';
}

function getAccentColor(index: number): string {
  const accents = [
    '#0284c7',
    '#059669',
    '#d97706',
    '#7c3aed',
  ];
  return accents[index % accents.length];
}

function SectionAccordion({ section, index, defaultOpen = true }: { section: ParsedSection; index: number; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const accentColor = getAccentColor(index);

  return (
    <div
      className="overflow-hidden rounded-2xl border transition-all"
      style={{
        borderColor: BORDER_SUBTLE,
        backgroundColor: '#fff',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-black/[0.03]"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold"
          style={{ backgroundColor: accentColor + '15', color: accentColor }}
        >
          {section.number ?? String(index + 1).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: NAV_TEXT + '99' }}>
            {section.label ?? 'MÔ HÌNH CHIẾN LƯỢC'}
          </div>
          <div className="text-[15px] font-semibold" style={{ color: '#2C2C2C' }}>
            {section.title}
          </div>
        </div>
        {expanded ? (
          <ChevronDown size={18} strokeWidth={1.5} style={{ color: NAV_TEXT + '80' }} />
        ) : (
          <ChevronRight size={18} strokeWidth={1.5} style={{ color: NAV_TEXT + '80' }} />
        )}
      </button>

      {expanded && (
        <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: BORDER_SUBTLE }}>
          {section.paragraphs.length > 0 && (
            <div className="mb-5 space-y-3">
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={`paragraph-${pIndex}`} className="text-[13px] leading-7 text-stone-600">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {section.verdict && (
            <div
              className="mb-5 rounded-xl p-4 text-[14px] font-medium leading-relaxed"
              style={{
                backgroundColor: accentColor + '10',
                color: '#2C2C2C',
                borderLeft: `4px solid ${accentColor}`,
              }}
            >
              {section.verdict}
            </div>
          )}

          {section.cards.length > 0 && (
            <div className="space-y-3">
              {section.cards.map((card, cardIndex) => (
                <div
                  key={`card-${cardIndex}`}
                  className="rounded-xl border p-4 transition-all"
                  style={{ borderColor: BORDER_SUBTLE, backgroundColor: SIDEBAR_BG }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    {card.badge && (
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold"
                        style={{ backgroundColor: accentColor + '20', color: accentColor }}
                      >
                        {card.badge}
                      </div>
                    )}
                    <div className="text-[14px] font-semibold" style={{ color: '#2C2C2C' }}>
                      {card.title}
                    </div>
                  </div>
                  <div className="space-y-2 pl-0">
                    {card.lines.map((line, lineIndex) => (
                      <div key={`line-${lineIndex}`} className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
                        <span className="text-[12px] leading-6 text-stone-500">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const OptimkiSidebarReport: React.FC<OptimkiSidebarReportProps> = ({
  result,
  onRenderHtml,
  isRendering,
  renderStep,
}) => {
  const toast = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const analysisTextForReRender = useMemo(
    () => getAnalysisTextForReRender(result),
    [result.analysis_content, result.html_report]
  );
  const parsedSections = useMemo(() => parseOptimkiSections(result.html_report ?? ''), [result.html_report]);
  const canReRender = Boolean(onRenderHtml && analysisTextForReRender.length >= MIN_RERENDER_TEXT_LEN);
  const formattedDate = useMemo(
    () =>
      new Date(result.generated_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [result.generated_at]
  );

  const ModelIcon = getModelIcon(result.model_type);
  const modelColor = getModelColor(result.model_type);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [result]);

  const handleCopy = async () => {
    const text = reportRef.current?.textContent?.trim() ?? '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleExportHtml = () => {
    const text = reportRef.current?.innerText?.trim() ?? '';
    const content = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opti M.KI - ${result.brand_name}</title>
</head>
<body style="font-family:Segoe UI,Arial,sans-serif;padding:32px;line-height:1.7;color:#1c1917;background:#fcfdfc;white-space:pre-wrap;">${text}</body>
</html>`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OptiMKI_${result.brand_name.replace(/\s+/g, '_')}_${result.model_type}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReRender = async () => {
    if (!onRenderHtml || isRendering) return;
    if (analysisTextForReRender.length < MIN_RERENDER_TEXT_LEN) {
      toast.error('Không đủ nội dung để render lại');
      return;
    }

    await onRenderHtml({
      brand_name: result.brand_name,
      model_type: result.model_type,
      analysis_content: analysisTextForReRender,
      suggestion: result.suggestion,
    });
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        color: NAV_TEXT,
        backgroundColor: SIDEBAR_BG,
      }}
    >
      <div ref={reportRef} className="flex-1 overflow-y-auto">
        <div className="w-full py-3">
          <div className="w-full border-b border-stone-200/60">
            <div className="flex items-center justify-between px-6 pb-3">
              <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold tracking-tight text-stone-600">
                {getModelLabel(result.model_type)}
              </span>
              <div className="text-[16px] font-bold tracking-tight text-stone-900">{result.brand_name}</div>
              <div className="text-[14px] text-stone-400">· {formattedDate}</div>
            </div>

              <div className="flex items-center gap-2">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors hover:bg-black/[0.05]"
                  style={{ color: NAV_TEXT }}
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} className="opacity-70" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
                <div className="mx-1 h-3.5 w-px bg-stone-200" />
                <button
                  type="button"
                  onClick={handleExportHtml}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors hover:bg-black/[0.05]"
                  style={{ color: NAV_TEXT }}
                >
                  <Download size={13} className="opacity-70" />
                  Xuất HTML
                </button>
              </div>
              
              <div className="h-4 w-px bg-stone-200" />
              
              <button
                type="button"
                onClick={() => void handleReRender()}
                disabled={isRendering || !canReRender}
                  className="inline-flex h-7 min-w-[100px] items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRendering ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {isRendering ? (renderStep ?? 'Render...') : 'Render lại'}
              </button>
              </div>
          </div>
          </div>

          <div className="px-6 pt-5">
            {parsedSections.map((section, index) => (
              <div key={`section-${index}`} className="mb-4">
                <SectionAccordion
                  section={section}
                  index={index}
                  defaultOpen={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
