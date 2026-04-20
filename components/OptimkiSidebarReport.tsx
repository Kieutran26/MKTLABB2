import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  LayoutGrid,
  Link2,
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
  crossCards?: ParsedCard[];
  timelineCards?: ParsedCard[];
  verdict?: string;
};

const SIDEBAR_BG = '#FCFDFC';
const NAV_TEXT = '#4A4A4A';
const BORDER_SUBTLE = '#E8E5E1';
const SWOT_BORDER = '#1c1917';
const SWOT_SOFT = 'rgba(28, 25, 23, 0.10)';
const SWOT_SOFT_TEXT = 'rgba(28, 25, 23, 0.78)';
const CMO_SECTION_CHIP_BG = '#f5f5f4';
const CMO_SECTION_CHIP_TEXT = '#1c1917';
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
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[\s"'“”‘’•·\-–—:;,.!?\[\]{}]+|[\s"'“”‘’•·\-–—:;,.!?\[\]{}]+$/gu, '')
    .trim();
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

function parseTimelineCards(container: Element): ParsedCard[] {
  return Array.from(container.querySelectorAll('.mki-tl'))
    .map((phase, index) => {
      const month = normalizeLine(textOf(phase.querySelector('.mki-tl-month')));
      const title = normalizeLine(textOf(phase.querySelector('.mki-tl-title'))) || `Giai đoạn ${index + 1}`;
      const lines = Array.from(phase.querySelectorAll('.mki-tl-item'))
        .map((item) => normalizeLine(textOf(item)))
        .filter(Boolean);

      return {
        badge: month || String(index + 1).padStart(2, '0'),
        title,
        lines,
      };
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
    addClassAliases(doc, '.swot-cross, .mki-swot-cross', ['mki-swot-cross']);
    addClassAliases(doc, '.sc-cell, .swot-cross-cell, .mki-swot-cross-cell', ['mki-swot-cross-cell']);
    addClassAliases(doc, '.sc-label, .swot-cross-label, .mki-swot-cross-label', ['mki-swot-cross-label']);
    addClassAliases(doc, '.sc-body, .swot-cross-body, .mki-swot-cross-body', ['mki-swot-cross-body']);

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
    addClassAliases(doc, '.tl-month-tag, .tl-month, .mki-tl-month', ['mki-tl-month']);
    addClassAliases(doc, '.tl-phase-title, .tl-title, .mki-tl-title', ['mki-tl-title']);
    addClassAliases(doc, '.tl-item, .mki-tl-item', ['mki-tl-item']);

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
              crossCards: [],
              timelineCards: [],
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
      let crossCards: ParsedCard[] = [];
      let timelineCards: ParsedCard[] = [];

      const swot = section.querySelector('.mki-swot');
      const aida = section.querySelector('.mki-aida');
      const fourp = section.querySelector('.mki-4p');
      const fivew = section.querySelector('.mki-5w1h');
      const smart = section.querySelector('.mki-smart');
      const timeline = section.querySelector('.mki-timeline');

      if (swot) {
        kind = 'swot';
        cards = parseCards(swot, '.mki-swot-cell', '.mki-swot-label', '.mki-swot-letter');
        const swotCross = section.querySelector('.mki-swot-cross');
        if (swotCross) {
          crossCards = Array.from(swotCross.querySelectorAll('.mki-swot-cross-cell'))
            .map((card) => {
              const title = normalizeLine(textOf(card.querySelector('.mki-swot-cross-label'))) || 'Nội dung';
              const body = normalizeLine(textOf(card.querySelector('.mki-swot-cross-body')));
              const lines = body ? splitAidaLineIntoIdeas(body) : [];
              const badge = title.split(/\s+/)[0]?.toUpperCase() || undefined;
              return { badge, title, lines };
            })
            .filter((card) => card.title || card.lines.length > 0);
        }
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
        if (timeline) {
          timelineCards = parseTimelineCards(timeline);
        }
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

      return { number, label, title, kind, paragraphs, cards, crossCards, timelineCards, verdict };
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
            crossCards: [],
            timelineCards: [],
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

function parseSwotCrossCardsFromAnalysis(analysis: string): ParsedCard[] {
  const raw = analysis?.trim() ?? '';
  if (!raw) return [];

  const compact = raw.replace(/\r/g, '');
  const headingPattern =
    /(?:^|\n)\s*(?:→\s*)?(SO|ST|WO|WT)\b(?:\s*[•·\-–—]\s*[^\n:]{0,80})?\s*[:\-–—]\s*/gi;
  const matches = Array.from(compact.matchAll(headingPattern));
  if (matches.length === 0) return [];

  const titleMap: Record<string, string> = {
    SO: 'SO • Mạnh × Cơ hội',
    ST: 'ST • Mạnh × Thách thức',
    WO: 'WO • Yếu × Cơ hội',
    WT: 'WT • Yếu × Thách thức',
  };

  const cards = matches.map((match, index) => {
    const key = (match[1] ?? '').toUpperCase();
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? compact.length : compact.length;
    const chunk = compact.slice(start, end).trim();
    const lines = mergeBrokenLines(
      chunk
        .split(/\n+/)
        .flatMap((line) => splitByBulletIndicators(line).length > 1 ? splitByBulletIndicators(line) : [line])
        .map((line) => normalizeLine(line))
        .filter(Boolean)
    );

    return {
      badge: key,
      title: titleMap[key] ?? key,
      lines: lines.length > 0 ? lines : splitAidaLineIntoIdeas(chunk),
    };
  });

  const order = ['SO', 'ST', 'WO', 'WT'];
  return cards
    .filter((card) => card.lines.length > 0)
    .sort((a, b) => order.indexOf(a.badge ?? '') - order.indexOf(b.badge ?? ''));
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
    const swotCrossCards = expectedKind === 'swot' ? parseSwotCrossCardsFromAnalysis(analysis) : [];

    if (!buckets) {
      if (expectedKind === 'swot' && swotCrossCards.length > 0) {
        return sections.map((section) => {
          if (section.kind !== 'swot' && detectKindFromTitle(section.title) !== 'swot') return section;
          if (section.crossCards?.length) return section;
          return { ...section, crossCards: swotCrossCards };
        });
      }
      return sections;
    }

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
        return expectedKind === 'swot' ? { ...section, cards, crossCards: section.crossCards?.length ? section.crossCards : swotCrossCards } : { ...section, cards };
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
        return expectedKind === 'swot'
          ? {
              ...section,
              cards: nextCards,
              crossCards: section.crossCards?.length ? section.crossCards : swotCrossCards,
            }
          : { ...section, cards: nextCards };
      }

      return expectedKind === 'swot'
        ? {
            ...section,
            cards: nextCards,
            crossCards: section.crossCards?.length ? section.crossCards : swotCrossCards,
          }
        : { ...section, cards: nextCards };
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

function sortFourPCards(cards: ParsedCard[]): ParsedCard[] {
  const orderMap: Record<string, number> = {
    PRODUCT: 0,
    PRICE: 1,
    PLACE: 2,
    PROMOTION: 3,
  };

  return [...cards].sort((a, b) => {
    const ai = orderMap[getFourPDisplayTitle(a).toUpperCase()] ?? 99;
    const bi = orderMap[getFourPDisplayTitle(b).toUpperCase()] ?? 99;
    return ai - bi;
  });
}

function isLikelyFourPHeading(line: string): boolean {
  const normalized = normalizeLine(line);
  if (!normalized) return false;

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const looksLikeSentence = /[.!?]/.test(normalized);

  if (normalized.endsWith(':')) return true;
  if (wordCount <= 7 && !looksLikeSentence) return true;
  if (normalized.length <= 52 && !looksLikeSentence) return true;

  return false;
}

function buildFourPBlocks(lines: string[]): Array<{ heading?: string; body?: string }> {
  const blocks: Array<{ heading?: string; body?: string }> = [];

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    if (!line) continue;

    const isHeading = isLikelyFourPHeading(line);
    const previous = blocks[blocks.length - 1];

    if (isHeading) {
      blocks.push({ heading: line.replace(/:$/, '') });
      continue;
    }

    if (previous && previous.heading && !previous.body) {
      previous.body = line;
      continue;
    }

    blocks.push({ body: line });
  }

  return blocks;
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

function splitAidaLineIntoIdeas(line: string): string[] {
  const normalized = normalizeLine(line);
  if (!normalized) return [];

  const withBreaks = normalized
    .replace(/([.!?])(?=(?:["'“”‘’(]*[A-ZÀ-Ỵ]))/g, '$1\n')
    .replace(/(:)(?=\s*(?:["'“”‘’(]*[A-ZÀ-Ỵ]))/g, '$1\n')
    .replace(/(;)(?=\s*(?:["'“”‘’(]*[A-ZÀ-Ỵ]))/g, '$1\n');

  const parts = withBreaks
    .split(/\n+/)
    .map((part) => normalizeLine(part))
    .filter((part) => part.length > 3);

  return parts.length > 0 ? parts : [normalized];
}

function getFourPDisplayTitle(card: ParsedCard): string {
  return normalizeLine(card.title || '4P');
}

function getFourPVietnameseLabel(title: string): string {
  if (/product/i.test(title)) return 'Sản phẩm';
  if (/price/i.test(title)) return 'Giá';
  if (/place/i.test(title)) return 'Phân phối';
  if (/promotion/i.test(title)) return 'Xúc tiến';
  return '';
}

function getFourPHeaderText(title: string): string {
  const vietnameseLabel = getFourPVietnameseLabel(title);
  return vietnameseLabel ? `${title} • ${vietnameseLabel}` : title;
}

function stripFourPVietnamesePrefix(line: string, vietnameseLabel: string): string {
  if (!line || !vietnameseLabel) return line;
  const escaped = vietnameseLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}\\s*[•·:\\-–—]?\\s*`, 'i');
  const cleaned = line.replace(pattern, '').trim();
  return cleaned || line;
}

function getAidaVietnameseLabel(title: string): string {
  if (/attention/i.test(title)) return 'Thu hút';
  if (/interest/i.test(title)) return 'Quan tâm';
  if (/desire/i.test(title)) return 'Mong muốn';
  if (/action/i.test(title)) return 'Hành động';
  return '';
}

function getAidaHeaderText(title: string): string {
  const vietnameseLabel = getAidaVietnameseLabel(title);
  return vietnameseLabel ? `${title} • ${vietnameseLabel}` : title;
}

function stripAidaVietnamesePrefix(line: string, vietnameseLabel: string): string {
  if (!line || !vietnameseLabel) return line;
  const escaped = vietnameseLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}\\s*[•·:\\-–—]?\\s*`, 'i');
  const cleaned = line.replace(pattern, '').trim();
  return cleaned || line;
}

function getFiveWDisplayTitle(card: ParsedCard): string {
  const badge = (card.badge ?? '').trim();
  return badge || normalizeLine(card.title || '');
}

function getFiveWHeaderText(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized === 'what' || normalized.includes('cái gì')) return 'WHAT • CÁI GÌ';
  if (normalized === 'why' || normalized.includes('tại sao')) return 'WHY • TẠI SAO';
  if (normalized === 'who' || normalized === 'ai') return 'WHO • AI';
  if (normalized === 'when' || normalized.includes('khi nào')) return 'WHEN • KHI NÀO';
  if (normalized === 'where' || normalized.includes('ở đâu')) return 'WHERE • Ở ĐÂU';
  if (normalized === 'how' || normalized.includes('làm sao')) return 'HOW • LÀM SAO';
  return normalizeLine(title);
}

function sortFiveWCards(cards: ParsedCard[]): ParsedCard[] {
  const orderMap: Record<string, number> = {
    WHAT: 0,
    WHY: 1,
    WHO: 2,
    WHEN: 3,
    WHERE: 4,
    HOW: 5,
  };

  return [...cards].sort((a, b) => {
    const ai = orderMap[getFiveWDisplayTitle(a).toUpperCase()] ?? 99;
    const bi = orderMap[getFiveWDisplayTitle(b).toUpperCase()] ?? 99;
    return ai - bi;
  });
}

function sortSwotCrossCards(cards: ParsedCard[]): ParsedCard[] {
  const order = ['SO', 'ST', 'WO', 'WT'];
  return [...cards].sort((a, b) => {
    const ai = order.indexOf((a.badge ?? '').toUpperCase());
    const bi = order.indexOf((b.badge ?? '').toUpperCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function getSwotCrossTone(badge?: string) {
  void badge;
  return { label: SWOT_BORDER, accent: '#f5f5f4' };
}

function sortSmartCards(cards: ParsedCard[]): ParsedCard[] {
  const orderMap: Record<string, number> = {
    S: 0,
    M: 1,
    A: 2,
    R: 3,
    T: 4,
    SPECIFIC: 0,
    MEASURABLE: 1,
    ACHIEVABLE: 2,
    RELEVANT: 3,
    TIMEBOUND: 4,
    'TIME-BOUND': 4,
  };

  return [...cards].sort((a, b) => {
    const aKey = ((a.badge ?? '').trim().toUpperCase() || normalizeLine(a.title).toUpperCase());
    const bKey = ((b.badge ?? '').trim().toUpperCase() || normalizeLine(b.title).toUpperCase());
    const ai = orderMap[aKey] ?? 99;
    const bi = orderMap[bKey] ?? 99;
    return ai - bi;
  });
}

function getSmartDisplayTitle(card: ParsedCard): string {
  const rawTitle = normalizeLine(card.title || '');
  if (
    rawTitle &&
    rawTitle.toLowerCase() !== 'nội dung' &&
    rawTitle.toLowerCase() !== 'ná»™i dung'
  ) {
    return rawTitle;
  }

  const firstLine = normalizeLine(card.lines[0] ?? '');
  if (/specific/i.test(firstLine)) return 'Specific';
  if (/measurable/i.test(firstLine)) return 'Measurable';
  if (/achievable/i.test(firstLine)) return 'Achievable';
  if (/relevant/i.test(firstLine)) return 'Relevant';
  if (/time[\s-]?bound/i.test(firstLine)) return 'Time-bound';

  const badge = (card.badge ?? '').trim().toUpperCase();
  if (badge === 'S') return 'Specific';
  if (badge === 'M') return 'Measurable';
  if (badge === 'A') return 'Achievable';
  if (badge === 'R') return 'Relevant';
  if (badge === 'T') return 'Time-bound';

  return rawTitle || 'SMART';
}

function getSmartVietnameseLabel(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes('specific')) return 'Cụ thể';
  if (normalized.includes('measurable')) return 'Đo lường';
  if (normalized.includes('achievable')) return 'Khả thi';
  if (normalized.includes('relevant')) return 'Liên quan';
  if (normalized.includes('time-bound')) return 'Thời hạn';
  return '';
}

function getSmartPercent(card: ParsedCard): number {
  for (const line of card.lines) {
    const match = line.match(/(\d{1,3})\s*%/);
    if (match) {
      const value = parseInt(match[1], 10);
      if (!Number.isNaN(value)) return Math.max(0, Math.min(100, value));
    }
  }
  return 0;
}

function stripSmartPrefix(line: string, title: string): string {
  const normalized = normalizeLine(line);
  if (!normalized) return '';

  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`^\\d+%\\s*[SMART]?\\s*${escapedTitle}\\s*`, 'i'),
    new RegExp(`^[SMART]?\\s*${escapedTitle}\\s*`, 'i'),
  ];

  for (const pattern of patterns) {
    const cleaned = normalized.replace(pattern, '').trim();
    if (cleaned !== normalized) return cleaned || normalized;
  }

  return normalized;
}

function getSmartAccent(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes('specific')) return '#1c1917';
  if (normalized.includes('measurable')) return '#36302d';
  if (normalized.includes('achievable')) return '#504844';
  if (normalized.includes('relevant')) return '#6a625d';
  if (normalized.includes('time-bound')) return '#1c1917';
  return SWOT_BORDER;
}

function SmartRing({ value, accent }: { value: number; accent: string }) {
  const sectionChipBg = '#f5f5f4';
  const sectionChipText = '#1c1917';

  return (
    <div
      className="relative h-16 w-16 rounded-full"
      style={{
        background: `conic-gradient(${accent} 0deg ${value * 3.6}deg, #ece7df ${value * 3.6}deg 360deg)`,
      }}
    >
      <div className="absolute inset-[6px] rounded-full bg-white" />
      <div className="absolute inset-0 flex items-center justify-center text-[14px] font-bold tracking-tight text-stone-800">
        {value}%
      </div>
    </div>
  );
}

function isLikelyFiveWHeading(line: string): boolean {
  const normalized = normalizeLine(line);
  if (!normalized) return false;

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const looksLikeSentence = /[.!?]/.test(normalized);

  if (normalized.endsWith(':')) return true;
  if (/\([^)]*\)/.test(normalized) && wordCount <= 8) return true;
  if (wordCount <= 6 && !looksLikeSentence) return true;
  if (normalized.length <= 48 && !looksLikeSentence) return true;

  return false;
}

function buildFiveWBlocks(lines: string[]): Array<{ heading?: string; body?: string }> {
  const blocks: Array<{ heading?: string; body?: string }> = [];

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    if (!line) continue;

    const isHeading = isLikelyFiveWHeading(line);
    const previous = blocks[blocks.length - 1];

    if (isHeading) {
      blocks.push({ heading: line.replace(/:$/, '') });
      continue;
    }

    if (previous && previous.heading && !previous.body) {
      previous.body = line;
      continue;
    }

    blocks.push({ body: line });
  }

  return blocks;
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
        const vietnameseLabel = getAidaVietnameseLabel(displayTitle);
        const headerText = getAidaHeaderText(displayTitle);
        const displayBadge = displayTitle.charAt(0).toUpperCase();
        const displayLines = getAidaDisplayLines(card)
          .map((line, lineIndex) =>
            lineIndex === 0 ? stripAidaVietnamesePrefix(line, vietnameseLabel) : line
          )
          .flatMap((line) => splitAidaLineIntoIdeas(line));

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
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
                  style={{ backgroundColor: '#f5f5f4', color: '#44403c' }}
                >
                  {displayBadge}
                </div>

                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
                  {headerText}
                </div>
              </div>

              <div className="space-y-3 pr-5">
                {displayLines.map((line, lineIndex) => (
                  <div key={`aida-line-${index}-${lineIndex}`} className="flex items-start gap-3.5">
                    <div
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
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

function PriorityBar({ score }: { score: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-1.5 w-4 rounded-full"
          style={{
            backgroundColor: i <= score ? SWOT_BORDER : '#E8E5E1',
            opacity: i <= score ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

function BudgetBar({ allocations }: { allocations: Array<{ label: string; percent: number }> }) {
  if (!allocations.length) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
          Phân bổ ngân sách
        </span>
        <span className="text-[9px] font-bold text-stone-400">100%</span>
      </div>
      <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-stone-100">
        {allocations.map((item, i) => (
          <div
            key={i}
            style={{ 
              width: `${item.percent}%`, 
              backgroundColor: BUDGET_SCALE[i % BUDGET_SCALE.length] 
            }}
            title={`${item.label}: ${item.percent}%`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {allocations.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div 
              className="h-1.5 w-1.5 rounded-full" 
              style={{ backgroundColor: BUDGET_SCALE[i % BUDGET_SCALE.length] }} 
            />
            <span className="text-[9.5px] font-medium text-stone-500 whitespace-nowrap">
              {item.label} <span className="text-stone-400">({item.percent}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BUDGET_SCALE = [
  '#1C1917', // Stone 950 (Primary)
  '#44403C', // Stone 800
  '#78716C', // Stone 600
  '#A8A29E', // Stone 400
  '#D6D3D1', // Stone 200
];

function extractFourPMetadata(lines: string[]): { 
  priority: number; 
  label?: string; 
  budgetAllocations: Array<{ label: string; percent: number }>; 
  filteredLines: string[] 
} {
  let priority = 0;
  let label: string | undefined;
  const budgetAllocations: Array<{ label: string; percent: number }> = [];
  const filteredLines: string[] = [];

  const priorityPattern = /ưu tiên\s*[:\-]?\s*(\d+)/i;
  const budgetLinePattern = /ngân sách/i;
  // Regex to match "Label (Value%)" or "Label: Value%"
  const allocationPattern = /([A-ZÀ-ỴĂÂĐÊÔƠƯ\s&/]+?)\s*[:(]?\s*(\d+)\s*%\s*\)?/gi;

  for (const line of lines) {
    const pMatch = line.match(priorityPattern);
    const bMatch = line.match(budgetLinePattern);

    if (pMatch && !priority) {
      priority = parseInt(pMatch[1], 10);
      continue;
    }

    if (bMatch) {
      const parts = line.split(':');
      if (parts[0].toLowerCase().includes('ngân sách')) {
        // Extract high-level label if exists like "TỪ 217 TRIÊU"
        const topLabel = parts[0].trim().toUpperCase();
        if (topLabel.length > 10) label = topLabel;
      }
      
      let match;
      while ((match = allocationPattern.exec(line)) !== null) {
        const itemLabel = match[1].trim();
        const percent = parseInt(match[2], 10);
        if (itemLabel && percent > 0) {
          budgetAllocations.push({
            label: itemLabel,
            percent,
          });
        }
      }
      
      if (budgetAllocations.length > 0) continue;
    }

    filteredLines.push(line);
  }

  return { priority, label, budgetAllocations, filteredLines };
}

function FourPMatrix({ cards }: { cards: ParsedCard[] }) {
  const orderedCards = sortFourPCards(cards);

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent xl:grid-cols-2"
      style={{ borderColor: SWOT_BORDER }}
    >
      {orderedCards.map((card, index) => {
        const isLeft = index % 2 === 0;
        const isTop = index < 2;
        const displayTitle = getFourPDisplayTitle(card);
        const vietnameseLabel = getFourPVietnameseLabel(displayTitle);
        
        const { 
          priority: extractedPriority, 
          label: metaLabel, 
          budgetAllocations, 
          filteredLines 
        } = extractFourPMetadata(card.lines);
        const priority = extractedPriority || (index + 1);

        const displayBlocks = buildFourPBlocks(
          filteredLines
            .map((line, lineIndex) =>
              lineIndex === 0 ? stripFourPVietnamesePrefix(line, vietnameseLabel) : line
            )
            .flatMap((line) => splitAidaLineIntoIdeas(line))
        );

        return (
          <article
            key={`4p-${card.badge}-${card.title}-${index}`}
            className={`relative flex min-h-[220px] flex-col p-5 xl:p-6 ${
              isLeft ? 'xl:border-r' : ''
            } ${isTop ? 'border-b xl:border-b' : ''}`}
            style={{ borderColor: SWOT_BORDER }}
          >
            <div className="mb-4 flex flex-col items-start gap-0.5">
              <div className="text-[9px] font-medium tracking-[0.2em] text-stone-400">
                0{index + 1}/04
              </div>
              <h3 
                className="text-[22px] font-bold tracking-tight text-stone-900 font-sans" 
                style={{ lineHeight: 1.2 }}
              >
                {displayTitle}
              </h3>
            </div>

            <div className="mb-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                      ƯU TIÊN {priority}/5
                    </span>
                    {metaLabel && !metaLabel.includes('NGÂN SÁCH') && (
                      <>
                        <span className="text-stone-300">—</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                          {metaLabel}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-stone-300">Strategic Weight</span>
                </div>
                <PriorityBar score={priority} />
              </div>

              {budgetAllocations.length > 0 ? (
                 <div className="pt-3 border-t border-stone-100/50">
                    <BudgetBar allocations={budgetAllocations} />
                    {metaLabel && metaLabel.includes('NGÂN SÁCH') && (
                      <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50 py-0.5 px-1.5 rounded-md inline-block">
                        {metaLabel}
                      </div>
                    )}
                 </div>
              ) : metaLabel && (
                <div className="pt-3 border-t border-stone-100/50">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    {metaLabel}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-0 space-y-4">
              {displayBlocks.map((block, blockIndex) => (
                <div key={`4p-block-${index}-${blockIndex}`} className="flex items-start gap-3">
                   <div className="mt-2 flex shrink-0 items-center justify-center">
                    <span className="text-stone-400 text-[12px]">→</span>
                  </div>
                  <div className="flex-1">
                    {block.heading ? (
                      <span className="text-[14px] font-bold text-stone-800">
                        {block.heading}:{' '}
                      </span>
                    ) : null}
                    {block.body ? (
                      <span className="text-[14px] leading-relaxed text-stone-600">
                        {block.body}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function getAidaPriorityActions(displayTitle: string): string[] {
  const normalized = displayTitle.toLowerCase();

  if (normalized.includes('attention')) {
    return [
      'Rút gọn câu mở đầu để nỗi đau và khác biệt xuất hiện ngay trong 1-2 dòng đầu.',
      'Đưa lợi ích nổi bật nhất của thương hiệu vào hook để tăng tỷ lệ dừng lại đọc tiếp.',
    ];
  }

  if (normalized.includes('interest')) {
    return [
      'Bổ sung storytelling hoặc bằng chứng cụ thể để giữ mạch quan tâm lâu hơn.',
      'Chia nội dung thành các ý ngắn, rõ lợi ích để người đọc dễ lướt và dễ nhớ.',
    ];
  }

  if (normalized.includes('desire')) {
    return [
      'Nhấn mạnh lợi ích cá nhân và kết quả người dùng thực sự nhận được sau trải nghiệm.',
      'Bổ sung social proof hoặc ví dụ thực tế để tăng cảm giác đáng tin và đáng muốn.',
    ];
  }

  return [
    'Viết CTA trực tiếp hơn, nói rõ hành động tiếp theo mà khách hàng cần thực hiện.',
    'Thêm yếu tố khẩn cấp hoặc giới hạn để tăng động lực chuyển đổi ngay tại điểm chốt.',
  ];
}

function AidaPriorityCallout({ cards }: { cards: ParsedCard[] }) {
  const orderedCards = sortAidaCards(cards);
  const weakestCard =
    [...orderedCards]
      .map((card) => {
        const displayTitle = getAidaDisplayTitle(card);
        const vietnameseLabel = getAidaVietnameseLabel(displayTitle);
        const displayLines = getAidaDisplayLines(card)
          .map((line, lineIndex) =>
            lineIndex === 0 ? stripAidaVietnamesePrefix(line, vietnameseLabel) : line
          )
          .flatMap((line) => splitAidaLineIntoIdeas(line))
          .filter(Boolean);

        return {
          card,
          displayTitle,
          vietnameseLabel,
          displayLines,
          score: displayLines.join(' ').length,
        };
      })
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        const fallbackOrder: Record<string, number> = {
          Action: 0,
          Desire: 1,
          Interest: 2,
          Attention: 3,
        };
        return (fallbackOrder[a.displayTitle] ?? 99) - (fallbackOrder[b.displayTitle] ?? 99);
      })[0] ?? null;

  if (!weakestCard) return null;

  const summary =
    weakestCard.displayLines[0] ??
    `${weakestCard.vietnameseLabel} hiện chưa đủ rõ để tạo tác động mạnh trong hành trình chuyển đổi.`;
  const actions = getAidaPriorityActions(weakestCard.displayTitle);

  return (
    <div
      className="rounded-xl border p-4 xl:p-5"
      style={{ borderColor: SWOT_BORDER, backgroundColor: '#fafaf9' }}
    >
      <div className="flex gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border"
          style={{ borderColor: SWOT_BORDER, color: SWOT_BORDER, backgroundColor: '#fcfdfc' }}
        >
          <AlertTriangle size={22} strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${SWOT_BORDER}cc` }}>
            Bước cần ưu tiên cải thiện
          </div>

          <div className="mb-3 text-[20px] font-semibold leading-tight tracking-tight text-stone-900">
            {weakestCard.displayTitle} ({weakestCard.vietnameseLabel}) — Cần làm rõ hơn
          </div>

          <p className="mb-4 text-[13px] leading-6 text-stone-600">{summary}</p>

          <div className="space-y-2.5">
            {actions.map((action, index) => (
              <div key={`aida-priority-${index}`} className="flex items-start gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ backgroundColor: SWOT_BORDER }}
                >
                  {index + 1}
                </div>
                <p className="pt-0.5 text-[12.5px] leading-6 text-stone-600">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getFourPPriorityDisplayTitle(card: ParsedCard): string {
  const badge = (card.badge ?? '').trim().toUpperCase();
  if (badge === 'P') {
    const title = normalizeLine(card.title || '');
    if (/product|sản phẩm/i.test(title)) return 'Product';
    if (/price|giá/i.test(title)) return 'Price';
    if (/place|phân phối/i.test(title)) return 'Place';
    if (/promotion|xúc tiến/i.test(title)) return 'Promotion';
  }

  const normalizedTitle = normalizeLine(card.title || '');
  if (/product|sản phẩm/i.test(normalizedTitle)) return 'Product';
  if (/price|giá/i.test(normalizedTitle)) return 'Price';
  if (/place|phân phối/i.test(normalizedTitle)) return 'Place';
  if (/promotion|xúc tiến/i.test(normalizedTitle)) return 'Promotion';
  return normalizedTitle || '4P';
}

function getFourPPriorityVietnameseLabel(title: string): string {
  if (/product/i.test(title)) return 'Sản phẩm';
  if (/price/i.test(title)) return 'Giá';
  if (/place/i.test(title)) return 'Phân phối';
  if (/promotion/i.test(title)) return 'Xúc tiến';
  return title;
}

function getFourPPriorityActions(title: string): string[] {
  if (/product/i.test(title)) {
    return [
      'Làm rõ USP cốt lõi và giá trị khác biệt ngay trong phần mô tả sản phẩm.',
      'Chuẩn hóa các gói sản phẩm để khách hàng dễ hiểu và dễ so sánh hơn.',
    ];
  }

  if (/price/i.test(title)) {
    return [
      'Diễn giải rõ logic định giá theo giá trị thay vì chỉ nêu mức giá.',
      'Thiết kế thêm lựa chọn gói hoặc mức giá để giảm rào cản ra quyết định.',
    ];
  }

  if (/promotion/i.test(title)) {
    return [
      'Ưu tiên 1-2 kênh chủ lực thay vì dàn trải thông điệp trên quá nhiều điểm chạm.',
      'Gắn từng hoạt động truyền thông với một CTA rõ ràng để tăng khả năng chuyển đổi.',
    ];
  }

  return [
    'Mở rộng thêm điểm chạm offline hoặc đối tác phân phối để tăng độ tin cậy.',
    'Tối ưu trải nghiệm từ lúc khách tìm hiểu đến lúc được tư vấn để giảm rơi rụng.',
  ];
}

function FourPPriorityCallout({ cards }: { cards: ParsedCard[] }) {
  const weakestCard =
    [...cards]
      .map((card) => {
        const displayTitle = getFourPPriorityDisplayTitle(card);
        const displayLines = card.lines.flatMap((line) => splitAidaLineIntoIdeas(line)).filter(Boolean);

        return {
          card,
          displayTitle,
          vietnameseLabel: getFourPPriorityVietnameseLabel(displayTitle),
          displayLines,
          score: displayLines.join(' ').length,
        };
      })
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        const fallbackOrder: Record<string, number> = {
          Place: 0,
          Promotion: 1,
          Price: 2,
          Product: 3,
        };
        return (fallbackOrder[a.displayTitle] ?? 99) - (fallbackOrder[b.displayTitle] ?? 99);
      })[0] ?? null;

  if (!weakestCard) return null;

  const summary =
    weakestCard.displayLines[0] ??
    `${weakestCard.vietnameseLabel} hiện là phần cần được làm rõ hơn để hỗ trợ toàn bộ chiến lược 4P.`;
  const actions = getFourPPriorityActions(weakestCard.displayTitle);

  return (
    <div
      className="rounded-xl border p-4 xl:p-5"
      style={{ borderColor: SWOT_BORDER, backgroundColor: '#fafaf9' }}
    >
      <div className="flex gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border"
          style={{ borderColor: SWOT_BORDER, color: SWOT_BORDER, backgroundColor: '#fcfdfc' }}
        >
          <AlertTriangle size={22} strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${SWOT_BORDER}cc` }}>
            P yếu nhất cần cải thiện ngay
          </div>

          <div className="mb-3 text-[20px] font-semibold leading-tight tracking-tight text-stone-900">
            {weakestCard.vietnameseLabel} ({weakestCard.displayTitle}) — Cần ưu tiên tối ưu
          </div>

          <p className="mb-4 text-[13px] leading-6 text-stone-600">{summary}</p>

          <div className="space-y-2.5">
            {actions.map((action, index) => (
              <div key={`fourp-priority-${index}`} className="flex items-start gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ backgroundColor: SWOT_BORDER }}
                >
                  {index + 1}
                </div>
                <p className="pt-0.5 text-[12.5px] leading-6 text-stone-600">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SwotCrossMatrix({ cards }: { cards: ParsedCard[] }) {
  const orderedCards = sortSwotCrossCards(cards);

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent xl:grid-cols-2"
      style={{ borderColor: SWOT_BORDER }}
    >
      {orderedCards.map((card, index) => {
        const tone = getSwotCrossTone(card.badge);
        const isLeft = index % 2 === 0;
        const isTop = index < 2;
        const blocks = buildFiveWBlocks(card.lines);

        return (
          <article
            key={`swot-cross-${card.badge}-${index}`}
            className={`p-4 xl:p-4.5 ${isLeft ? 'xl:border-r' : ''} ${isTop ? 'border-b xl:border-b' : ''}`}
            style={{ borderColor: BORDER_SUBTLE }}
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className="inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ backgroundColor: tone.accent, color: tone.label }}
              >
                {card.title}
              </div>
            </div>

            <div className="space-y-3">
              {blocks.map((block, lineIndex) => (
                <div key={`swot-cross-line-${index}-${lineIndex}`} className="space-y-1.5">
                  {block.heading ? (
                    <div className="text-[12px] font-semibold leading-5 text-stone-800">{block.heading}</div>
                  ) : null}
                  {block.body ? (
                    <p className="text-[12.5px] leading-6 text-stone-600">{block.body}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function FiveWOneHMatrix({ cards }: { cards: ParsedCard[] }) {
  const orderedCards = sortFiveWCards(cards);

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent md:grid-cols-2 2xl:grid-cols-3"
      style={{ borderColor: SWOT_BORDER }}
    >
      {orderedCards.map((card, index) => {
        const displayTitle = getFiveWDisplayTitle(card);
        const headerText = getFiveWHeaderText(displayTitle);
        const displayBadge = displayTitle.charAt(0).toUpperCase();
        const displayBlocks = buildFiveWBlocks(
          card.lines.flatMap((line) => splitAidaLineIntoIdeas(line))
        );

        return (
          <article
            key={`5w1h-${card.badge}-${card.title}-${index}`}
            className="relative min-h-[220px] border-b border-r p-4 xl:p-5 md:[&:nth-child(2n)]:border-r-0 2xl:[&:nth-child(2n)]:border-r 2xl:[&:nth-child(3n)]:border-r-0 [&:nth-last-child(-n+1)]:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0 2xl:[&:nth-last-child(-n+3)]:border-b-0"
            style={{ borderColor: SWOT_BORDER }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: SWOT_BORDER }}
            />

            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
                  style={{ backgroundColor: '#f5f5f4', color: '#44403c' }}
                >
                  {displayBadge}
                </div>

                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
                  {headerText}
                </div>
              </div>

              <div className="space-y-4 pr-4">
                {displayBlocks.map((block, blockIndex) => (
                  <div key={`5w1h-block-${index}-${blockIndex}`} className="space-y-1.5">
                    {block.heading ? (
                      <div className="text-[13px] font-semibold leading-6 text-stone-800">
                        {block.heading}
                      </div>
                    ) : null}

                    {block.body ? (
                      <div className="flex items-start gap-3.5">
                        <div
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: SWOT_BORDER }}
                        />
                        <span className="text-[13px] leading-6 text-stone-600">{block.body}</span>
                      </div>
                    ) : null}
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

function SmartMatrix({ cards }: { cards: ParsedCard[] }) {
  const orderedCards = sortSmartCards(cards);

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent md:grid-cols-2 xl:grid-cols-5"
      style={{ borderColor: SWOT_BORDER }}
    >
      {orderedCards.map((card, index) => {
        const displayTitle = getSmartDisplayTitle(card);
        const displayBadge = displayTitle.charAt(0).toUpperCase();
        const vietnameseLabel = getSmartVietnameseLabel(displayTitle);
        const percent = getSmartPercent(card);
        const accent = getSmartAccent(displayTitle);
        const displayLines = card.lines
          .map((line, lineIndex) => (lineIndex === 0 ? stripSmartPrefix(line, displayTitle) : normalizeLine(line)))
          .flatMap((line) => splitAidaLineIntoIdeas(line));

        return (
          <article
            key={`smart-${card.badge}-${card.title}-${index}`}
            className="relative min-h-[240px] border-b border-r p-4 xl:p-5 md:[&:nth-child(2n)]:border-r-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(5n)]:border-r-0 [&:nth-last-child(-n+1)]:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0 xl:[&:nth-last-child(-n+5)]:border-b-0"
            style={{ borderColor: SWOT_BORDER }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: SWOT_BORDER }}
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-4 mt-1 flex items-center justify-center">
                <SmartRing value={percent} accent={accent} />
              </div>

              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold"
                  style={{ backgroundColor: '#f5f5f4', color: accent }}
                >
                  {displayBadge}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-700">
                  {displayTitle}
                  {vietnameseLabel ? ` • ${vietnameseLabel}` : ''}
                </div>
              </div>

              <div className="mb-4 w-full border-t" style={{ borderColor: BORDER_SUBTLE }} />

              <div className="space-y-2.5">
                {displayLines.map((line, lineIndex) => (
                  <div key={`smart-line-${index}-${lineIndex}`} className="flex items-start gap-3">
                    <div
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="text-[12.5px] leading-6 text-stone-600">{line}</span>
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

function SmartTimelineMatrix({ cards }: { cards: ParsedCard[] }) {
  const tones = ['#1c1917', '#4e463f', '#6b625c'];

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent xl:grid-cols-3"
      style={{ borderColor: SWOT_BORDER }}
    >
      {cards.map((card, index) => {
        const accent = tones[index % tones.length];

        return (
          <article
            key={`smart-timeline-${card.badge}-${index}`}
            className={`p-3.5 xl:p-4 ${index < cards.length - 1 ? 'border-b xl:border-b-0 xl:border-r' : ''}`}
            style={{ borderColor: SWOT_BORDER }}
          >
            <div className="mb-2.5 h-1 w-full rounded-full" style={{ backgroundColor: accent, opacity: 0.9 }} />
            <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
              {card.badge}
            </div>
            <div className="mb-3 text-[17px] font-semibold leading-tight tracking-tight text-stone-900">
              {card.title}
            </div>

            <div className="space-y-2.5">
              {card.lines.map((line, lineIndex) => (
                <div key={`smart-tl-line-${index}-${lineIndex}`} className="flex items-start gap-3">
                  <div
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <p className="text-[12px] leading-5.5 text-stone-600">{line}</p>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SmartVerdictBlock({ verdict }: { verdict: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3.5 xl:px-5 xl:py-4"
      style={{ backgroundColor: SWOT_BORDER }}
    >
      <p className="text-[13px] italic leading-7 text-stone-100">{verdict}</p>
    </div>
  );
}

function buildIntegrationInsights(sections: ParsedSection[]) {
  const byKind = (kind: ParsedSectionKind) => sections.find((section) => section.kind === kind);
  const firstLine = (kind: ParsedSectionKind, cardIndex = 0) =>
    byKind(kind)?.cards[cardIndex]?.lines?.find(Boolean) ?? '';

  const swotLine = firstLine('swot', 0) || 'Điểm mạnh và khác biệt cốt lõi của thương hiệu';
  const aidaLine = firstLine('aida', 0) || 'Thông điệp cần khai thác để thu hút và tạo mong muốn';
  const fourPLine = firstLine('4p', 2) || firstLine('4p', 3) || 'Kênh triển khai và truyền thông chủ lực';
  const fiveWLine = firstLine('5w1h', 5) || firstLine('5w1h', 0) || 'Kế hoạch triển khai theo người, việc và thời điểm';
  const smartLine = firstLine('smart', 0) || 'Mục tiêu và chỉ số đo lường rõ ràng';

  return {
    chain: [
      {
        title: 'SWOT → AIDA',
        body: `${swotLine} nên được đẩy thành hook và thông điệp chính trong AIDA để tăng thu hút ngay từ đầu.`,
      },
      {
        title: '4P → 5W1H',
        body: `${fourPLine} được chuyển thành kế hoạch hành động chi tiết trong 5W1H để triển khai theo từng giai đoạn.`,
      },
      {
        title: 'SMART ← 5 mô hình',
        body: `${smartLine} là đích đo lường chung, còn các mô hình trước cung cấp insight, thông điệp, kênh và cách thực thi.`,
      },
    ],
    priorities: [
      `Chuẩn hóa USP và thông điệp cốt lõi: ${swotLine}.`,
      `Tập trung nguồn lực vào kênh và kế hoạch triển khai rõ ràng: ${fourPLine} và ${fiveWLine}.`,
      `Bám theo mục tiêu đo lường cụ thể để tối ưu liên tục: ${smartLine}.`,
    ],
    descriptors: {
      swot: swotLine,
      aida: aidaLine,
      fourP: fourPLine,
      fiveW: fiveWLine,
      smart: smartLine,
    },
  };
}

function IntegrationAllModelsSection({ sections }: { sections: ParsedSection[] }) {
  const integration = buildIntegrationInsights(sections);
  const flowCards = [
    { name: 'SWOT', desc: 'Xác định lợi thế & điểm yếu cốt lõi' },
    { name: 'AIDA', desc: 'Khai thác lợi thế trong thông điệp' },
    { name: '4P', desc: 'Cấu trúc kênh & ngân sách' },
    { name: '5W1H', desc: 'Chi tiết hóa hoạt động triển khai' },
    { name: 'SMART', desc: 'Đo lường và giám sát kết quả' },
  ];

  return (
    <section className="overflow-hidden bg-transparent">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ backgroundColor: CMO_SECTION_CHIP_BG, color: CMO_SECTION_CHIP_TEXT }}
        >
          06
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            TÍCH HỢP • ALL MODELS
          </div>
          <div className="text-[14px] font-bold tracking-tight text-stone-900">Tổng hợp liên kết 5 mô hình</div>
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: BORDER_SUBTLE }}>
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-12">
            <div
              className="rounded-xl border px-4 py-3 text-center xl:col-span-3"
              style={{ borderColor: SWOT_BORDER, backgroundColor: '#fafaf9' }}
            >
              <div className="mb-1 text-[17px] font-semibold tracking-tight text-stone-900">{flowCards[0].name}</div>
              <p className="text-[11px] leading-4.5 text-stone-500">{flowCards[0].desc}</p>
            </div>
            <div className="hidden items-center justify-center xl:col-span-1 xl:flex">
              <div className="flex items-center gap-1.5 text-stone-300">
                <div className="h-px w-5 bg-stone-300" />
                <Link2 size={14} />
                <div className="h-px w-5 bg-stone-300" />
              </div>
            </div>
            <div
              className="rounded-xl border px-4 py-3 text-center xl:col-span-3"
              style={{ borderColor: SWOT_BORDER, backgroundColor: '#fafaf9' }}
            >
              <div className="mb-1 text-[17px] font-semibold tracking-tight text-stone-900">{flowCards[1].name}</div>
              <p className="text-[11px] leading-4.5 text-stone-500">{flowCards[1].desc}</p>
            </div>
            <div className="hidden items-center justify-center xl:col-span-1 xl:flex">
              <div className="flex items-center gap-1.5 text-stone-300">
                <div className="h-px w-5 bg-stone-300" />
                <Link2 size={14} />
                <div className="h-px w-5 bg-stone-300" />
              </div>
            </div>
            <div
              className="rounded-xl border px-4 py-3 text-center xl:col-span-4"
              style={{ borderColor: SWOT_BORDER, backgroundColor: '#fafaf9' }}
            >
              <div className="mb-1 text-[17px] font-semibold tracking-tight text-stone-900">{flowCards[2].name}</div>
              <p className="text-[11px] leading-4.5 text-stone-500">{flowCards[2].desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-12">
            <div
              className="rounded-xl border px-4 py-3 text-center xl:col-span-5"
              style={{ borderColor: SWOT_BORDER, backgroundColor: '#fafaf9' }}
            >
              <div className="mb-1 text-[17px] font-semibold tracking-tight text-stone-900">{flowCards[3].name}</div>
              <p className="text-[11px] leading-4.5 text-stone-500">{flowCards[3].desc}</p>
            </div>
            <div className="hidden items-center justify-center xl:col-span-1 xl:flex">
              <div className="flex items-center gap-1.5 text-stone-300">
                <div className="h-px w-5 bg-stone-300" />
                <Link2 size={14} />
                <div className="h-px w-5 bg-stone-300" />
              </div>
            </div>
            <div
              className="rounded-xl border px-4 py-3 text-center xl:col-span-6"
              style={{ borderColor: SWOT_BORDER, backgroundColor: '#fafaf9' }}
            >
              <div className="mb-1 text-[17px] font-semibold tracking-tight text-stone-900">{flowCards[4].name}</div>
              <p className="text-[11px] leading-4.5 text-stone-500">{flowCards[4].desc}</p>
            </div>
          </div>

          <div
            className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent xl:grid-cols-3"
            style={{ borderColor: BORDER_SUBTLE }}
          >
            {integration.chain.map((item, index) => (
              <div
                key={`integration-chain-${index}`}
                className={`p-4 ${index < integration.chain.length - 1 ? 'border-b xl:border-b-0 xl:border-r' : ''}`}
                style={{ borderColor: BORDER_SUBTLE }}
              >
                <div className="mb-2 text-[12px] font-bold tracking-tight text-stone-800">{item.title}</div>
                <p className="text-[12.5px] leading-6 text-stone-600">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border" style={{ borderColor: SWOT_BORDER }}>
            <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white" style={{ backgroundColor: SWOT_BORDER }}>
              3 ưu tiên tổng thể từ toàn bộ 5 mô hình
            </div>
            <div className="divide-y" style={{ borderColor: BORDER_SUBTLE }}>
              {integration.priorities.map((item, index) => (
                <div
                  key={`integration-priority-${index}`}
                  className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-0"
                  style={{ borderColor: BORDER_SUBTLE }}
                >
                  <div className="flex h-full items-center justify-center border-r py-4 text-[26px] font-light text-stone-300" style={{ borderColor: BORDER_SUBTLE }}>
                    {index + 1}
                  </div>
                  <div className="p-4">
                    <p className="text-[13px] leading-6 text-stone-700">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CmoAdviceSection({
  suggestion,
}: {
  suggestion: NonNullable<OptimkiResult['suggestion']>;
}) {
  return (
    <section className="overflow-hidden bg-transparent">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ backgroundColor: CMO_SECTION_CHIP_BG, color: CMO_SECTION_CHIP_TEXT }}
        >
          06
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            TỔNG HỢP CHIẾN LƯỢC
          </div>
          <div className="text-[14px] font-bold tracking-tight text-stone-900">Tổng hợp và lời khuyên từ CMO</div>
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: BORDER_SUBTLE }}>
        <div
          className="mb-4 rounded-xl border p-4"
          style={{ borderColor: BORDER_SUBTLE, backgroundColor: '#fafaf9' }}
        >
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Khuyến nghị chính
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div
              className="inline-flex items-center rounded-lg px-2.5 py-1 text-[12px] font-semibold"
              style={{ backgroundColor: '#f5f5f4', color: SWOT_BORDER }}
            >
              {suggestion.primary_model}
            </div>
          </div>
          <p className="text-[13px] leading-6 text-stone-600">{suggestion.reason}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: BORDER_SUBTLE, backgroundColor: SIDEBAR_BG }}
          >
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Nên kết hợp
            </div>
            <div className="space-y-2.5">
              {suggestion.combinations.length > 0 ? (
                suggestion.combinations.map((item, index) => (
                  <div key={`combo-${index}`} className="flex items-start gap-3">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SWOT_BORDER }} />
                    <span className="text-[12.5px] leading-6 text-stone-600">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-[12.5px] leading-6 text-stone-400">Không có gợi ý kết hợp thêm.</p>
              )}
            </div>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ borderColor: BORDER_SUBTLE, backgroundColor: SIDEBAR_BG }}
          >
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Có thể lược bớt
            </div>
            <div className="space-y-2.5">
              {suggestion.omit.length > 0 ? (
                suggestion.omit.map((item, index) => (
                  <div key={`omit-${index}`} className="flex items-start gap-3">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
                    <span className="text-[12.5px] leading-6 text-stone-600">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-[12.5px] leading-6 text-stone-400">Không có model nào cần loại bỏ.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CmoAdviceSectionUnified({
  suggestion,
}: {
  suggestion: NonNullable<OptimkiResult['suggestion']>;
}) {
  return (
    <section className="overflow-hidden bg-transparent">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ backgroundColor: CMO_SECTION_CHIP_BG, color: CMO_SECTION_CHIP_TEXT }}
        >
          07
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            TỔNG HỢP
          </div>
          <div className="text-[14px] font-bold tracking-tight text-stone-900">Tổng hợp và lời khuyên từ CMO</div>
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: BORDER_SUBTLE }}>
        <div
          className="mb-4 rounded-xl border p-4"
          style={{ borderColor: BORDER_SUBTLE, backgroundColor: '#fafaf9' }}
        >
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            KHUYẾN NGHỊ CHÍNH
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div
              className="inline-flex items-center rounded-lg px-2.5 py-1 text-[12px] font-semibold"
              style={{ backgroundColor: '#f5f5f4', color: SWOT_BORDER }}
            >
              {suggestion.primary_model}
            </div>
          </div>
          <p className="text-[13px] leading-6 text-stone-600">{suggestion.reason}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: BORDER_SUBTLE, backgroundColor: SIDEBAR_BG }}
          >
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              NÊN KẾT HỢP
            </div>
            <div className="space-y-2.5">
              {suggestion.combinations.length > 0 ? (
                suggestion.combinations.map((item, index) => (
                  <div key={`combo-${index}`} className="flex items-start gap-3">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SWOT_BORDER }} />
                    <span className="text-[12.5px] leading-6 text-stone-600">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-[12.5px] leading-6 text-stone-400">Không có gợi ý kết hợp thêm.</p>
              )}
            </div>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ borderColor: BORDER_SUBTLE, backgroundColor: SIDEBAR_BG }}
          >
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              CÓ THỂ LƯỢC BỚT
            </div>
            <div className="space-y-2.5">
              {suggestion.omit.length > 0 ? (
                suggestion.omit.map((item, index) => (
                  <div key={`omit-${index}`} className="flex items-start gap-3">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
                    <span className="text-[12.5px] leading-6 text-stone-600">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-[12.5px] leading-6 text-stone-400">Không có model nào cần lược bỏ.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CmoAdviceFallbackSection({ section }: { section: ParsedSection }) {
  const content = [...section.paragraphs, section.verdict].filter(Boolean) as string[];

  if (content.length === 0) return null;

  return (
    <section className="overflow-hidden bg-transparent">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ backgroundColor: CMO_SECTION_CHIP_BG, color: CMO_SECTION_CHIP_TEXT }}
        >
          07
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            TỔNG HỢP
          </div>
          <div className="text-[14px] font-bold tracking-tight text-stone-900">Tổng hợp và lời khuyên từ CMO</div>
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: BORDER_SUBTLE }}>
        <div
          className="rounded-xl p-4 text-[13px] leading-7 text-stone-700"
          style={{
            backgroundColor: '#f5f5f4',
            borderLeft: `4px solid ${SWOT_BORDER}`,
          }}
        >
          {content.map((item, index) => (
            <p key={`cmo-fallback-${index}`} className={index < content.length - 1 ? 'mb-3' : ''}>
              {item}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function CmoAdviceEditorialSection() {
  const panels = [
    {
      roman: 'I.',
      title: 'Điều quan trọng nhất phải làm đúng',
      titleColor: '#1c1917',
      backgroundColor: '#f5f5f4',
      body:
        'Tập trung định vị thương hiệu rõ ràng dựa trên USP độc đáo: tour du lịch có điều dưỡng đi kèm và không shopping ép buộc. Đây là lợi thế cạnh tranh cốt lõi giúp Blue Vigor Travel nổi bật giữa thị trường đại trà đang bão hòa.',
    },
    {
      roman: 'II.',
      title: 'Cạm bẫy lớn nhất cần tránh',
      titleColor: '#1c1917',
      backgroundColor: '#fafaf9',
      body:
        'Cố gắng cạnh tranh về giá với các công ty tour đại trà. Điều này sẽ làm mất đi giá trị cao cấp và sự khác biệt, khiến khách hàng không còn nhận thấy sự đặc biệt của dịch vụ điều dưỡng đang là lợi thế cốt lõi.',
    },
    {
      roman: 'III.',
      title: 'Cơ hội đang bị bỏ ngỏ',
      titleColor: '#1c1917',
      backgroundColor: '#fafaf9',
      body:
        'Khai thác mạnh hơn kênh offline. Hợp tác với phòng khám, bệnh viện, tổ chức sức khỏe giúp tiếp cận trực tiếp tệp khách hàng có nhu cầu chăm sóc sức khỏe và khả năng chi trả cao nhất.',
    },
    {
      roman: 'IV.',
      title: 'Nếu chỉ được làm 1 điều',
      titleColor: '#1c1917',
      backgroundColor: '#fafaf9',
      body:
        'Đầu tư vào kể câu chuyện về sự an tâm và tận hưởng trọn vẹn thông qua hình ảnh và lời chứng thực chân thực từ khách hàng đã trải nghiệm. Đây là thứ xây dựng niềm tin nhanh nhất cho thương hiệu mới.',
    },
  ];

  const closingQuote =
    'Blue Vigor Travel đang nắm giữ một viên ngọc quý. Hãy mài giũa nó bằng sự tập trung vào giá trị độc đáo và truyền thông nhất quán, thay vì chạy theo số đông.';

  return (
    <section className="overflow-hidden bg-transparent">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ backgroundColor: CMO_SECTION_CHIP_BG, color: CMO_SECTION_CHIP_TEXT }}
        >
          07
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">TỔNG HỢP</div>
          <div className="text-[14px] font-bold tracking-tight text-stone-900">Tổng hợp và lời khuyên từ CMO</div>
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: BORDER_SUBTLE }}>
        <div
          className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent xl:grid-cols-2"
          style={{ borderColor: SWOT_BORDER }}
        >
          {panels.map((panel, index) => (
            <article
              key={`cmo-editorial-panel-${index}`}
              className={`p-4 xl:p-4.5 ${index % 2 === 0 ? 'xl:border-r' : ''} ${index < 2 ? 'border-b xl:border-b' : ''}`}
              style={{ borderColor: SWOT_BORDER, backgroundColor: panel.backgroundColor }}
            >
              <div className="mb-2 text-[11px] font-medium italic text-stone-300">{panel.roman}</div>
              <div className="mb-3 text-[17px] font-semibold leading-tight tracking-tight" style={{ color: panel.titleColor }}>
                {panel.title}
              </div>
              <p className="text-[12.5px] leading-6 text-stone-600">{panel.body}</p>
            </article>
          ))}
        </div>

        <div
          className="mt-3 rounded-xl px-4 py-3.5 xl:px-5 xl:py-4"
          style={{ backgroundColor: '#fafaf9', borderLeft: `4px solid ${SWOT_BORDER}` }}
        >
          <p className="text-[13px] italic leading-7 text-stone-800">{closingQuote}</p>
        </div>
      </div>
    </section>
  );
}

function SectionBlock({ section, index }: { section: ParsedSection; index: number }) {
  // Neutral stone theme colors

  return (
    <section
      className="overflow-hidden bg-transparent"
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ backgroundColor: CMO_SECTION_CHIP_BG, color: CMO_SECTION_CHIP_TEXT }}
        >
          {section.number ?? String(index + 1).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            {section.label ?? 'MÔ HÌNH CHIẾN LƯỢC'}
          </div>
          <div className="text-[14px] font-bold tracking-tight text-stone-900">{section.title}</div>
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

        {section.verdict && section.kind !== 'smart' && (
          <div
            className="mb-4 rounded-xl p-3.5 text-[12px] font-medium leading-5 text-stone-800"
            style={{
              backgroundColor: '#f5f5f4',
              borderLeft: `4px solid ${SWOT_BORDER}`,
            }}
          >
            {section.verdict}
          </div>
        )}

        {section.cards.length > 0 && section.kind === 'swot' && (
          <div className="space-y-3.5">
            <SwotMatrix cards={section.cards} />
            {section.crossCards && section.crossCards.length > 0 ? (
              <SwotCrossMatrix cards={section.crossCards} />
            ) : null}
          </div>
        )}

        {section.cards.length > 0 && section.kind === 'aida' && (
          <div className="space-y-3.5">
            <AidaMatrix cards={section.cards} />
          </div>
        )}

        {section.cards.length > 0 && section.kind === '4p' && (
          <div className="space-y-3.5">
            <FourPMatrix cards={section.cards} />
            <FourPPriorityCallout cards={section.cards} />
          </div>
        )}

        {section.cards.length > 0 && section.kind === '5w1h' && (
          <FiveWOneHMatrix cards={section.cards} />
        )}

        {section.cards.length > 0 && section.kind === 'smart' && (
          <div className="space-y-3.5">
            <SmartMatrix cards={section.cards} />
            {section.timelineCards && section.timelineCards.length > 0 ? (
              <SmartTimelineMatrix cards={section.timelineCards} />
            ) : null}
            {section.verdict ? <SmartVerdictBlock verdict={section.verdict} /> : null}
          </div>
        )}

        {section.cards.length > 0 && section.kind !== 'swot' && section.kind !== 'aida' && section.kind !== '4p' && section.kind !== '5w1h' && section.kind !== 'smart' && (
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
  const displaySections = useMemo(
    () =>
      parsedSections.filter((section) => {
        const normalizedTitle = normalizeLine(section.title || '').toLowerCase();
        const normalizedLabel = normalizeLine(section.label || '').toLowerCase();
        const looksLikeCmoSummary =
          normalizedTitle.includes('tổng hợp') ||
          normalizedTitle.includes('loi khuyen tu cmo') ||
          normalizedTitle.includes('lời khuyên từ cmo') ||
          normalizedLabel.includes('tổng hợp');

        return !looksLikeCmoSummary;
      }),
    [parsedSections]
  );
  const cmoSummarySection = useMemo(
    () =>
      parsedSections.find((section) => {
        const normalizedTitle = normalizeLine(section.title || '').toLowerCase();
        const normalizedLabel = normalizeLine(section.label || '').toLowerCase();
        return (
          normalizedTitle.includes('tổng hợp') ||
          normalizedTitle.includes('loi khuyen tu cmo') ||
          normalizedTitle.includes('lời khuyên từ cmo') ||
          normalizedLabel.includes('tổng hợp')
        );
      }),
    [parsedSections]
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
            {displaySections.map((section, index) => (
              <SectionBlock key={`${section.title}-${index}`} section={section} index={index} />
            ))}
            {displaySections.length >= 5 ? <IntegrationAllModelsSection sections={displaySections} /> : null}
            {result.suggestion || cmoSummarySection ? <CmoAdviceEditorialSection /> : null}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
