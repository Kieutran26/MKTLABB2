import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  LayoutGrid,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
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

type ParsedSectionKind = 'swot' | 'aida' | '4p' | '5w1h' | 'smart' | 'timeline' | 'generic';

type ParsedSection = {
  number?: string;
  label?: string;
  title: string;
  kind: ParsedSectionKind;
  paragraphs: string[];
  cards: ParsedCard[];
  verdict?: string;
};

const SIDEBAR_BG = '#FCFDFC';
const NAV_TEXT = '#4A4A4A';
const BORDER_SUBTLE = '#E8E5E1';
const SWOT_BORDER = '#1c1917';
const SWOT_SOFT = 'rgba(28, 25, 23, 0.10)';
const SWOT_SOFT_TEXT = 'rgba(28, 25, 23, 0.78)';
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

function normalizeLine(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/^\W+|\W+$/g, '').trim();
}

function shouldMergeWithPrevious(previous: string, current: string): boolean {
  if (!previous || !current) return false;

  const startsLowercase = /^[a-zà-ỹ]/.test(current);
  const startsMidToken = /^[a-zà-ỹ]/.test(current) && /[A-Za-zÀ-ỹ]$/.test(previous);
  const previousLooksIncomplete = /[a-zà-ỹ,\-–—]$/i.test(previous) && !/[.!?…:]$/.test(previous);

  return startsLowercase || startsMidToken || previousLooksIncomplete;
}

function mergeBrokenLines(lines: string[]): string[] {
  const merged: string[] = [];

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    if (!line) continue;

    const previous = merged[merged.length - 1];
    if (previous && shouldMergeWithPrevious(previous, line)) {
      merged[merged.length - 1] = normalizeLine(`${previous} ${line}`);
    } else {
      merged.push(line);
    }
  }

  return merged;
}

function splitStrategicLines(raw: string): string[] {
  const text = normalizeLine(raw);
  if (!text) return [];

  const matches = Array.from(
    text.matchAll(/([A-ZÀ-ỴĂÂĐÊÔƠƯ][^—]{2,80})\s+—\s+/g)
  );

  if (matches.length < 2) return [text];

  const segments: string[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const segment = normalizeLine(text.slice(start, end));
    if (segment) segments.push(segment);
  }

  return segments.length > 0 ? segments : [text];
}

function splitByBulletIndicators(text: string): string[] {
  const bulletPattern = /(?:^|[;\n])\s*([A-ZÀ-Ỵ][^;\n]{3,120}(?:[.!?…]|$))/g;
  const matches = Array.from(text.matchAll(bulletPattern));

  if (matches.length >= 2) {
    const lines: string[] = [];
    for (const match of matches) {
      const line = normalizeLine(match[1] ?? '');
      if (line && line.length > 5) lines.push(line);
    }
    if (lines.length >= 2) return lines;
  }

  const semicolonParts = text.split(/;\s*/).map((p) => normalizeLine(p)).filter((p) => p.length > 5);
  if (semicolonParts.length >= 2) return semicolonParts;

  const lineBreaks = text.split(/\n/).map((l) => normalizeLine(l)).filter((l) => l.length > 5);
  if (lineBreaks.length >= 2) return lineBreaks;

  return [];
}

function linesFromNode(node: Element, titleSelector?: string, badgeSelector?: string): string[] {
  const itemSelectors = [
    '.mki-swot-item',
    '.swot-item',
    '.mki-aida-step p',
    '.mki-4p-card p',
    '.mki-5w1h-card p',
    '.mki-smart-g p',
  ].join(', ');

  const structuredItems = Array.from(node.querySelectorAll(itemSelectors))
    .map((item) => normalizeLine(textOf(item)))
    .filter(Boolean);
  if (structuredItems.length > 0) return structuredItems;

  const listItems = Array.from(node.querySelectorAll('li'))
    .map((item) => normalizeLine(textOf(item)))
    .filter(Boolean);
  if (listItems.length > 0) return listItems;

  const clone = node.cloneNode(true) as Element;
  if (titleSelector) clone.querySelector(titleSelector)?.remove();
  if (badgeSelector) clone.querySelector(badgeSelector)?.remove();

  const paragraphs = Array.from(clone.querySelectorAll('p'))
    .map((p) => normalizeLine(textOf(p)))
    .filter(Boolean);
  if (paragraphs.length > 0) return paragraphs;

  const raw = normalizeLine(textOf(clone));
  const strategicSplit = splitStrategicLines(raw);
  if (strategicSplit.length > 1) return strategicSplit;

  const bulletSplit = splitByBulletIndicators(raw);
  if (bulletSplit.length > 1) return bulletSplit;

  return [raw];
}

function parseCards(
  container: Element,
  cardSelector: string,
  titleSelector: string,
  badgeSelector?: string
): ParsedCard[] {
  return Array.from(container.querySelectorAll(cardSelector))
    .map((card) => {
      const title = textOf(card.querySelector(titleSelector)) || 'Nội dung';
      const badge = badgeSelector ? textOf(card.querySelector(badgeSelector)) : undefined;
      const lines = linesFromNode(card, titleSelector, badgeSelector).filter(
        (line) => line !== title && line !== badge
      );
      return { badge, title, lines };
    })
    .filter((card) => card.title || card.lines.length > 0);
}

function normalizeAidaCards(cards: ParsedCard[]): ParsedCard[] {
  return cards.map((card) => {
    const badge = (card.badge ?? '').trim().toUpperCase();
    const fallbackTitle = badge === 'A'
      ? card.lines.some((line) => /action/i.test(line))
        ? 'Action'
        : 'Attention'
      : AIDA_TITLE_MAP[badge];

    const title = card.title === 'Nội dung' || card.title === 'Ná»™i dung'
      ? fallbackTitle || card.title
      : card.title;

    const titlePattern = title ? new RegExp(`^${badge}?\\s*${title}\\s*[•·\\-–—:]?\\s*`, 'i') : null;

    const nextLines = card.lines
      .map((line) => {
        const normalized = normalizeLine(line);
        if (!normalized) return '';

        if (titlePattern) {
          const cleaned = normalized.replace(titlePattern, '').trim();
          return cleaned || normalized;
        }

        return normalized;
      })
      .filter(Boolean);

    return {
      ...card,
      title: title || card.title,
      lines: nextLines,
    };
  });
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
    addClassAliases(doc, '.swot-list, .mki-swot-list', ['mki-swot-list']);
    addClassAliases(doc, '.swot-item, .mki-swot-item', ['mki-swot-item']);
    addClassAliases(doc, '.swot-icon, .swot-tick, .mki-swot-icon', ['mki-swot-icon']);

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
              kind: 'generic',
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

      let kind: ParsedSectionKind = 'generic';
      let cards: ParsedCard[] = [];

      const swot = section.querySelector('.mki-swot');
      const aida = section.querySelector('.mki-aida');
      const fourp = section.querySelector('.mki-4p');
      const fivew = section.querySelector('.mki-5w1h');
      const smart = section.querySelector('.mki-smart');
      const timeline = section.querySelector('.mki-timeline');

      if (swot) {
        kind = 'swot';
        cards = parseCards(swot, '.mki-swot-cell', '.mki-swot-label', '.mki-swot-letter');
      } else if (aida) {
        kind = 'aida';
        cards = parseCards(aida, '.mki-aida-step', '.mki-aida-name', '.mki-aida-letter');
      } else if (fourp) {
        kind = '4p';
        cards = parseCards(fourp, '.mki-4p-card', '.mki-4p-name', '.mki-4p-letter');
      } else if (fivew) {
        kind = '5w1h';
        cards = parseCards(fivew, '.mki-5w1h-card', '.mki-5w1h-name', '.mki-5w1h-q');
      } else if (smart) {
        kind = 'smart';
        cards = parseCards(smart, '.mki-smart-g', '.mki-smart-name', '.mki-smart-letter');
      } else if (timeline) {
        kind = 'timeline';
        cards = parseCards(timeline, '.mki-tl', '.mki-tl');
      }

      if (kind === 'generic' && title) {
        const detectedKind = detectKindFromTitle(title);
        if (detectedKind) kind = detectedKind;
      }

      const paragraphs = Array.from(
        section.querySelectorAll(':scope > p, :scope > .em-prose p, :scope > .fallback-prose p')
      )
        .map((p) => normalizeLine(textOf(p)))
        .filter(Boolean);

      const verdict = normalizeLine(textOf(section.querySelector('.mki-verdict'))) || undefined;

      return { number, label, title, kind, paragraphs, cards, verdict };
    });
  } catch {
    const text = extractPlainTextFromReportHtml(raw);
    return text
      ? [
          {
            number: '01',
            label: 'PHÂN TÍCH',
            title: 'Báo cáo chiến lược',
            kind: 'generic',
            paragraphs: [text],
            cards: [],
          },
        ]
      : [];
  }
}

function parseSwotBucketsFromAnalysis(analysis: string): Record<'S' | 'W' | 'O' | 'T', string[]> | null {
  const raw = analysis?.trim() ?? '';
  if (!raw) return null;

  const compact = raw.replace(/\r/g, '');
  const headingPattern =
    /(?:^|\n)(?:##?\s*)?(strengths|điểm mạnh|weaknesses|điểm yếu|opportunities|cơ hội|threats|thách thức)\s*[:\-]?\s*/gi;

  const matches = Array.from(compact.matchAll(headingPattern));
  if (matches.length < 2) return null;

  const buckets: Record<'S' | 'W' | 'O' | 'T', string[]> = { S: [], W: [], O: [], T: [] };

  const keyOf = (label: string): 'S' | 'W' | 'O' | 'T' | null => {
    const value = label.toLowerCase();
    if (value.includes('strength') || value.includes('điểm mạnh')) return 'S';
    if (value.includes('weakness') || value.includes('điểm yếu')) return 'W';
    if (value.includes('opportunit') || value.includes('cơ hội')) return 'O';
    if (value.includes('threat') || value.includes('thách thức')) return 'T';
    return null;
  };

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const start = (current.index ?? 0) + current[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? compact.length : compact.length;
    const key = keyOf(current[1] ?? '');
    if (!key) continue;

    const chunk = compact.slice(start, end).trim();
    if (!chunk) continue;

    const lines = chunk
      .split(/\n+/)
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed) return [];
        const bulletSplit = trimmed.split(/\s*(?:•|-|\*|\d+\.)\s+/).filter(Boolean);
        return bulletSplit.length > 1 ? bulletSplit : [trimmed];
      })
      .map((line) => normalizeLine(line))
      .filter(Boolean);

    const merged = mergeBrokenLines(lines);
    const normalized = merged.length > 0 ? merged : mergeBrokenLines(splitStrategicLines(chunk));
    if (normalized.length > 0) buckets[key].push(...normalized);
  }

  const total = buckets.S.length + buckets.W.length + buckets.O.length + buckets.T.length;
  return total > 0 ? buckets : null;
}

function parse5w1hBucketsFromAnalysis(analysis: string): Record<'What' | 'Why' | 'Who' | 'When' | 'Where' | 'How', string[]> | null {
  const raw = analysis?.trim() ?? '';
  if (!raw) return null;

  const compact = raw.replace(/\r/g, '');
  const headingPattern =
    /(?:^|\n)(?:##?\s*)?(what|cái gì|why|tại sao|who|ai|when|khi nào|where|ở đâu|how|làm sao)\s*[:\-]?\s*/gi;

  const matches = Array.from(compact.matchAll(headingPattern));
  if (matches.length < 2) return null;

  const bucketKeys = ['What', 'Why', 'Who', 'When', 'Where', 'How'] as const;
  const buckets: Record<typeof bucketKeys[number], string[]> = {
    What: [], Why: [], Who: [], When: [], Where: [], How: []
  };

  const keyOf = (label: string): typeof bucketKeys[number] | null => {
    const value = label.toLowerCase();
    if (value.includes('what') || value.includes('gì')) return 'What';
    if (value.includes('why') || value.includes('sao')) return 'Why';
    if (value.includes('who') || value.includes('ai')) return 'Who';
    if (value.includes('when') || value.includes('nào')) return 'When';
    if (value.includes('where') || value.includes('đâu')) return 'Where';
    if (value.includes('how') || value.includes('làm')) return 'How';
    return null;
  };

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const start = (current.index ?? 0) + current[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? compact.length : compact.length;
    const key = keyOf(current[1] ?? '');
    if (!key) continue;

    const chunk = compact.slice(start, end).trim();
    if (!chunk) continue;

    const lines = chunk
      .split(/\n+/)
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed) return [];
        const bulletSplit = trimmed.split(/\s*(?:•|-|\*|\d+\.)\s+/).filter(Boolean);
        return bulletSplit.length > 1 ? bulletSplit : [trimmed];
      })
      .map((line) => normalizeLine(line))
      .filter(Boolean);

    const merged = mergeBrokenLines(lines);
    const normalized = merged.length > 0 ? merged : mergeBrokenLines(splitStrategicLines(chunk));
    if (normalized.length > 0) buckets[key].push(...normalized);
  }

  const total = Object.values(buckets).reduce((sum, arr) => sum + arr.length, 0);
  return total > 0 ? buckets : null;
}

function modelTypeToKind(modelType: string): ParsedSectionKind | null {
  const mt = modelType.toLowerCase();
  if (mt === 'swot') return 'swot';
  if (mt === 'aida') return 'aida';
  if (mt === '4p') return '4p';
  if (mt === '5w1h') return '5w1h';
  if (mt === 'smart') return 'smart';
  if (mt === 'tat_ca' || mt === 'all') return 'generic';
  return null;
}

function detectKindFromTitle(title: string): ParsedSectionKind | null {
  const t = title.toLowerCase();
  if (t.includes('swot')) return 'swot';
  if (t.includes('aida')) return 'aida';
  if (t.includes('4p') || t.includes('four p')) return '4p';
  if (t.includes('5w1h') || t.includes('what why who when where how')) return '5w1h';
  if (t.includes('smart')) return 'smart';
  if (t.includes('timeline') || t.includes('lịch')) return 'timeline';
  return null;
}

function createBucketsForKind(kind: ParsedSectionKind): Record<string, string[]> | null {
  switch (kind) {
    case 'swot':
      return { S: [], W: [], O: [], T: [] };
    case '5w1h':
      return { What: [], Why: [], Who: [], When: [], Where: [], How: [] };
    default:
      return null;
  }
}

function createCardsFromBuckets(
  buckets: Record<string, string[]>,
  kind: 'swot' | '5w1h'
): ParsedCard[] {
  const swotTitles: Record<string, string> = {
    S: 'Điểm mạnh',
    W: 'Điểm yếu',
    O: 'Cơ hội',
    T: 'Thách thức',
  };

  const fivewTitles: Record<string, string> = {
    What: 'Cái gì',
    Why: 'Tại sao',
    Who: 'Ai',
    When: 'Khi nào',
    Where: 'Ở đâu',
    How: 'Làm sao',
  };

  const titles = kind === 'swot' ? swotTitles : fivewTitles;

  return Object.entries(buckets)
    .filter(([_, lines]) => lines.length > 0)
    .map(([key, lines]) => ({
      badge: key,
      title: titles[key] || key,
      lines,
    }));
}

function hydrateSectionsFromAnalysis(
  sections: ParsedSection[],
  analysis: string,
  modelType: string
): ParsedSection[] {
  const expectedKind = modelTypeToKind(modelType);

  if (expectedKind === 'swot' || expectedKind === '5w1h') {
    const buckets =
      expectedKind === 'swot'
        ? parseSwotBucketsFromAnalysis(analysis)
        : parse5w1hBucketsFromAnalysis(analysis);

    if (!buckets) return sections;

    const totalBuckets = Object.values(buckets).reduce((sum, arr) => sum + arr.length, 0);
    if (totalBuckets === 0) return sections;

    return sections.map((section) => {
      if (section.kind !== expectedKind) {
        const detectedKind = detectKindFromTitle(section.title);
        if (detectedKind !== expectedKind) return section;
      }

      let cards = section.cards;

      if (cards.length === 0) {
        cards = createCardsFromBuckets(buckets, expectedKind);
        return { ...section, cards };
      }

      const nextCards = cards.map((card) => {
        const badgeKey = (card.badge ?? '').replace(/^\d+\s*/, '').trim();
        const bucketLines = buckets[badgeKey];
        if (!bucketLines || bucketLines.length === 0) return card;
        return { ...card, lines: bucketLines };
      });

      const hasAllBuckets = Object.keys(buckets).every((key) => {
        const matchingCard = nextCards.find((c) => c.badge?.includes(key));
        return matchingCard && matchingCard.lines.length > 0;
      });

      if (hasAllBuckets) {
        return { ...section, cards: nextCards };
      }

      return { ...section, cards: nextCards };
    });
  }

  return sections;
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
    SWOT: '#0f766e',
    AIDA: '#0284c7',
    '4P': '#d97706',
    '5W1H': '#7c3aed',
    SMART: '#dc2626',
    tat_ca: '#111827',
  };
  return colors[model] || '#111827';
}

function getAccentColor(index: number): string {
  const accents = ['#0284c7', '#059669', '#d97706', '#7c3aed'];
  return accents[index % accents.length];
}

function getSectionGridClass(kind: ParsedSectionKind, cardCount: number): string {
  if (kind === 'swot') return 'grid-cols-1 xl:grid-cols-2';
  if (kind === 'aida') return 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-4';
  if (kind === '4p') return 'grid-cols-1 xl:grid-cols-2';
  if (kind === '5w1h') return 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3';
  if (kind === 'smart') return 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-5';
  if (kind === 'timeline') return 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-4';
  if (cardCount >= 4) return 'grid-cols-1 md:grid-cols-2';
  return 'grid-cols-1';
}

function getSwotTone(badge?: string) {
  return {
    line: SWOT_BORDER,
    pillBg: '#f5f5f4',
    pillText: '#44403c',
    watermark: '#e7e5e4',
    panelBg: 'transparent',
    iconBg: '#f1f5f9',
    iconText: '#57534e',
  };
}

function sortSwotCards(cards: ParsedCard[]): ParsedCard[] {
  const order = ['S', 'W', 'O', 'T'];
  return [...cards].sort((a, b) => {
    const ai = order.indexOf((a.badge ?? '').toUpperCase());
    const bi = order.indexOf((b.badge ?? '').toUpperCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function sortAidaCards(cards: ParsedCard[]): ParsedCard[] {
  const orderMap: Record<string, number> = {
    ATTENTION: 0,
    INTEREST: 1,
    DESIRE: 2,
    ACTION: 3,
  };

  return [...cards].sort((a, b) => {
    const ai = orderMap[getAidaDisplayTitle(a).toUpperCase()] ?? 99;
    const bi = orderMap[getAidaDisplayTitle(b).toUpperCase()] ?? 99;
    return ai - bi;
  });
}

function getAidaDisplayTitle(card: ParsedCard): string {
  const rawTitle = (card.title ?? '').trim();
  if (rawTitle && rawTitle.toLowerCase() !== 'nội dung' && rawTitle.toLowerCase() !== 'ná»™i dung') {
    return rawTitle;
  }

  const firstLine = normalizeLine(card.lines[0] ?? '');
  if (/action/i.test(firstLine)) return 'Action';
  if (/attention/i.test(firstLine)) return 'Attention';
  if (/interest/i.test(firstLine)) return 'Interest';
  if (/desire/i.test(firstLine)) return 'Desire';

  const badge = (card.badge ?? '').trim().toUpperCase();
  if (badge === 'I') return 'Interest';
  if (badge === 'D') return 'Desire';
  if (badge === 'A') return /action/i.test(firstLine) ? 'Action' : 'Attention';

  return rawTitle || 'Nội dung';
}

function getAidaDisplayLines(card: ParsedCard): string[] {
  const title = getAidaDisplayTitle(card);
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefixPattern = new RegExp(`^[AIDA]?\\s*${escapedTitle}\\s*[•·:\\-–—]?\\s*`, 'i');

  return card.lines
    .map((line) => {
      const normalized = normalizeLine(line);
      if (!normalized) return '';
      const cleaned = normalized.replace(prefixPattern, '').trim();
      return cleaned || normalized;
    })
    .filter(Boolean);
}

function SwotMatrix({ cards }: { cards: ParsedCard[] }) {
  const orderedCards = sortSwotCards(cards);

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent xl:grid-cols-2"
      style={{ borderColor: SWOT_BORDER }}
    >
      {orderedCards.map((card, index) => {
        const tone = getSwotTone(card.badge);
        const isLeft = index % 2 === 0;
        const isTop = index < 2;

        return (
          <article
            key={`swot-${card.badge}-${card.title}-${index}`}
            className={`relative min-h-[220px] p-4 xl:p-5 ${
              isLeft ? 'xl:border-r' : ''
            } ${isTop ? 'border-b xl:border-b' : ''}`}
            style={{ borderColor: SWOT_BORDER, backgroundColor: tone.panelBg }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: tone.line }}
            />

            <div
              className="pointer-events-none absolute right-5 top-8 select-none text-[72px] font-semibold leading-none tracking-[-0.08em] opacity-60"
              style={{ color: tone.watermark }}
            >
              {card.badge}
            </div>

            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-3">
                {card.badge ? (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
                    style={{ backgroundColor: tone.pillBg, color: tone.pillText }}
                  >
                    {card.badge}
                  </div>
                ) : null}

                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
                  {card.title}
                </div>
              </div>

              <div className="space-y-3.5 pr-6">
                {card.lines.map((line, lineIndex) => (
                  <div key={`swot-line-${index}-${lineIndex}`} className="flex items-start gap-4">
                    <div
                      className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ backgroundColor: tone.iconBg, color: tone.iconText }}
                    >
                      {card.badge === 'S' ? '✓' : card.badge === 'W' ? '×' : card.badge === 'O' ? '+' : '!'}
                    </div>
                    <span className="text-[13px] leading-6 text-stone-600">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AidaMatrix({ cards }: { cards: ParsedCard[] }) {
  const orderedCards = sortAidaCards(cards);

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent md:grid-cols-2 2xl:grid-cols-4"
      style={{ borderColor: SWOT_BORDER }}
    >
      {orderedCards.map((card, index) => {
        const isLastColumn = index === orderedCards.length - 1;
        const displayTitle = getAidaDisplayTitle(card);
        const displayLines = getAidaDisplayLines(card);

        return (
          <article
            key={`aida-${card.badge}-${card.title}-${index}`}
            className={`relative min-h-[220px] p-4 xl:p-5 ${
              !isLastColumn ? 'border-b md:border-b 2xl:border-b-0 2xl:border-r' : ''
            }`}
            style={{ borderColor: SWOT_BORDER }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: SWOT_BORDER }}
            />

            <div
              className="pointer-events-none absolute right-5 top-7 select-none text-[68px] font-semibold leading-none tracking-[-0.08em] opacity-60"
              style={{ color: '#1c19171c' }}
            >
              {card.badge}
            </div>

            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                {card.badge ? (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
                    style={{ backgroundColor: SWOT_SOFT, color: SWOT_SOFT_TEXT }}
                  >
                    {card.badge}
                  </div>
                ) : null}

                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
                  {displayTitle}
                </div>
              </div>

              <div className="space-y-3 pr-5">
                {displayLines.map((line, lineIndex) => (
                  <div key={`aida-line-${index}-${lineIndex}`} className="flex items-start gap-3.5">
                    <div
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: SWOT_BORDER }}
                    />
                    <span className="text-[13px] leading-6 text-stone-600">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SectionBlock({ section, index }: { section: ParsedSection; index: number }) {
  const accentColor = getAccentColor(index);
  const usesEditorialTone = section.kind === 'swot' || section.kind === 'aida';
  const sectionChipBg = usesEditorialTone ? SWOT_SOFT : `${accentColor}15`;
  const sectionChipText = usesEditorialTone ? SWOT_SOFT_TEXT : accentColor;

  return (
    <section
      className="overflow-hidden bg-transparent"
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ backgroundColor: sectionChipBg, color: sectionChipText }}
        >
          {section.number ?? String(index + 1).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: `${NAV_TEXT}99` }}>
            {section.label ?? 'MÔ HÌNH CHIẾN LƯỢC'}
          </div>
          <div className="text-[14px] font-semibold text-stone-900">{section.title}</div>
        </div>
      </div>

      <div className="border-t px-0 pb-0 pt-3.5" style={{ borderColor: BORDER_SUBTLE }}>
        {section.paragraphs.length > 0 && (
          <div className="mb-4 space-y-2.5">
            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={`paragraph-${pIndex}`} className="text-[11px] leading-5 text-stone-600">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {section.verdict && (
          <div
            className="mb-4 rounded-xl p-3.5 text-[12px] font-medium leading-5 text-stone-800"
            style={{
              backgroundColor: `${accentColor}10`,
              borderLeft: `4px solid ${accentColor}`,
            }}
          >
            {section.verdict}
          </div>
        )}

        {section.cards.length > 0 && section.kind === 'swot' && (
          <SwotMatrix cards={section.cards} />
        )}

        {section.cards.length > 0 && section.kind === 'aida' && (
          <AidaMatrix cards={section.cards} />
        )}

        {section.cards.length > 0 && section.kind !== 'swot' && section.kind !== 'aida' && (
          <div className={`grid gap-3 ${getSectionGridClass(section.kind, section.cards.length)}`}>
            {section.cards.map((card, cardIndex) => (
              <div
                key={`${section.title}-${card.title}-${cardIndex}`}
                className="rounded-xl border p-3.5"
                style={{ borderColor: BORDER_SUBTLE, backgroundColor: SIDEBAR_BG }}
              >
                <div className="mb-2.5 flex items-center gap-2.5">
                  {card.badge && (
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold"
                      style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                    >
                      {card.badge}
                    </div>
                  )}
                  <div className="text-[13px] font-semibold text-stone-900">{card.title}</div>
                </div>

                <div className="space-y-2">
                  {card.lines.map((line, lineIndex) => (
                    <div key={`${card.title}-line-${lineIndex}`} className="flex items-start gap-3">
                      <div
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="text-[10.5px] leading-5 text-stone-500">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
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
  const parsedSections = useMemo(
    () => hydrateSectionsFromAnalysis(
      parseOptimkiSections(result.html_report ?? ''),
      result.analysis_content ?? '',
      result.model_type
    ),
    [result.html_report, result.analysis_content, result.model_type]
  );
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
                <div className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-stone-900">
                  <ModelIcon size={15} strokeWidth={1.8} style={{ color: modelColor }} />
                  {result.brand_name}
                </div>
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
                  {isRendering ? renderStep ?? 'Render...' : 'Render lại'}
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 pt-5">
            <div className="space-y-4">
              {parsedSections.map((section, index) => (
                <SectionBlock key={`${section.title}-${index}`} section={section} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
