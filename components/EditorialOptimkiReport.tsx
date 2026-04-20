import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OptimkiResult } from '../types';
import { Download, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';

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
 * Design System - Editorial Minimalism v5 (Force Override)
 * Inspired by Kinfolk, Cereal Magazine, high-end editorial publications
 * Uses !important to override inline styles from AI output
 */
const EDITORIAL_MINIMALISM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Archivo+Narrow:wght@400;500;600;700&family=Archivo:wght@300;400;500&display=swap');

/* ── BASE VARIABLES (forced) ── */
.em-report.em-report,
.em-report .em-content,
.em-report .mki-report {
  --mki-ink: #1a1a1a !important;
  --mki-ink-light: #4a4a4a !important;
  --mki-ink-faint: #8a8a8a !important;
  --mki-paper: #fafaf8 !important;
  --mki-paper-deep: #f0efe9 !important;
  --mki-accent: #8b7355 !important;
  --mki-rule: rgba(26, 26, 26, 0.08) !important;
  --mki-display: 'Cormorant Garamond', Georgia, serif !important;
  --mki-sans: 'Archivo Narrow', Arial, sans-serif !important;
  --mki-body: 'Archivo', Arial, sans-serif !important;
  font-family: var(--mki-body) !important;
  background: var(--mki-paper) !important;
  color: var(--mki-ink) !important;
  font-size: 14px !important;
  line-height: 1.75 !important;
  font-weight: 300 !important;
  -webkit-font-smoothing: antialiased !important;
}

/* ── RESET ALL INLINE STYLES FROM AI OUTPUT ── */
.em-report .mki-report *,
.em-report .em-content * {
  font-family: inherit !important;
  color: inherit !important;
  background: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
  text-transform: inherit !important;
  display: block !important;
  float: none !important;
  position: static !important;
  width: auto !important;
  height: auto !important;
  overflow: visible !important;
  max-width: none !important;
  min-width: 0 !important;
}

/* Force white background for cells */
.em-report .mki-swot-cell,
.em-report .mki-aida-step,
.em-report .mki-4p-card,
.em-report .mki-5w1h-card,
.em-report .mki-smart-g,
.em-report .mki-tl,
.em-report .mki-verdict {
  background: #fff !important;
}

/* ── SECTION ── */
.em-report .mki-section {
  margin-bottom: 5rem !important;
  opacity: 1 !important;
  animation: none !important;
}

.em-report .mki-sec-head {
  display: flex !important;
  align-items: baseline !important;
  gap: 1.5rem !important;
  margin-bottom: 2.5rem !important;
  padding-bottom: 1.5rem !important;
  border-bottom: 1px solid var(--mki-rule) !important;
}

.em-report .mki-sec-num {
  font-family: var(--mki-display) !important;
  font-size: 4.5rem !important;
  font-weight: 300 !important;
  color: var(--mki-paper-deep) !important;
  line-height: 0.85 !important;
  flex-shrink: 0 !important;
  letter-spacing: -0.04em !important;
}

.em-report .mki-sec-label {
  font-family: var(--mki-sans) !important;
  font-size: 0.6rem !important;
  letter-spacing: 0.18em !important;
  text-transform: uppercase !important;
  color: var(--mki-ink-faint) !important;
  font-weight: 600 !important;
  margin-bottom: 0.35rem !important;
  display: block !important;
}

.em-report .mki-sec-title {
  font-family: var(--mki-display) !important;
  font-size: 1.75rem !important;
  font-weight: 400 !important;
  color: var(--mki-ink) !important;
  line-height: 1.25 !important;
}

.em-report .em-prose {
  max-width: 780px !important;
  margin-bottom: 2rem !important;
}

.em-report .em-prose p {
  font-size: 1rem !important;
  line-height: 1.85 !important;
  color: var(--mki-ink-light) !important;
  margin-bottom: 1rem !important;
}

.em-report .em-prose p:last-child {
  margin-bottom: 0 !important;
}

/* ── SWOT GRID ── */
.em-report .mki-swot {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 1.5rem !important;
  margin-bottom: 3rem !important;
}

.em-report .mki-swot-cell {
  padding: 2rem !important;
  border: 1px solid var(--mki-rule) !important;
  position: relative !important;
  overflow: hidden !important;
}

.em-report .mki-swot-letter {
  font-family: var(--mki-display) !important;
  font-size: 6rem !important;
  font-weight: 300 !important;
  color: var(--mki-paper-deep) !important;
  position: absolute !important;
  top: 0.5rem !important;
  right: 1rem !important;
  opacity: 0.5 !important;
  line-height: 1 !important;
  letter-spacing: -0.04em !important;
}

.em-report .mki-swot-label {
  font-family: var(--mki-sans) !important;
  font-size: 0.6rem !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  color: var(--mki-ink-faint) !important;
  font-weight: 600 !important;
  margin-bottom: 1.5rem !important;
  display: block !important;
}

.em-report .mki-swot-list {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.em-report .mki-swot-item {
  display: flex !important;
  gap: 0.85rem !important;
  font-size: 0.9rem !important;
  line-height: 1.65 !important;
  color: var(--mki-ink-light) !important;
  margin-bottom: 0.85rem !important;
}

.em-report .mki-swot-icon {
  width: 5px !important;
  height: 5px !important;
  border-radius: 50% !important;
  background: var(--mki-accent) !important;
  margin-top: 0.5rem !important;
  flex-shrink: 0 !important;
}

/* ── AIDA FUNNEL ── */
.em-report .mki-aida {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 0 !important;
  border: 1px solid var(--mki-rule) !important;
  margin-bottom: 3rem !important;
  overflow: hidden !important;
}

.em-report .mki-aida-step {
  padding: 2rem 1.5rem !important;
  border-right: 1px solid var(--mki-rule) !important;
}

.em-report .mki-aida-letter {
  font-family: var(--mki-display) !important;
  font-size: 3.5rem !important;
  font-weight: 300 !important;
  color: var(--mki-paper-deep) !important;
  margin-bottom: 0.25rem !important;
  letter-spacing: -0.03em !important;
  line-height: 1 !important;
}

.em-report .mki-aida-name {
  font-family: var(--mki-sans) !important;
  font-size: 0.55rem !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  color: var(--mki-ink-faint) !important;
  font-weight: 600 !important;
  margin-bottom: 1rem !important;
  display: block !important;
}

.em-report .mki-aida-hook {
  font-family: var(--mki-display) !important;
  font-size: 1.1rem !important;
  font-weight: 400 !important;
  font-style: italic !important;
  line-height: 1.4 !important;
  margin-bottom: 0.75rem !important;
  color: var(--mki-ink) !important;
}

.em-report .mki-aida-desc {
  font-size: 0.85rem !important;
  line-height: 1.65 !important;
  color: var(--mki-ink-light) !important;
}

/* ── 4P GRID ── */
.em-report .mki-4p {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 1.5rem !important;
  margin-bottom: 3rem !important;
}

.em-report .mki-4p-card {
  padding: 2rem !important;
  border: 1px solid var(--mki-rule) !important;
}

.em-report .mki-4p-letter {
  font-family: var(--mki-display) !important;
  font-size: 3rem !important;
  font-weight: 300 !important;
  color: var(--mki-paper-deep) !important;
  line-height: 1 !important;
  margin-bottom: 0.5rem !important;
  letter-spacing: -0.03em !important;
}

.em-report .mki-4p-name {
  font-family: var(--mki-sans) !important;
  font-size: 0.6rem !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  color: var(--mki-ink-faint) !important;
  font-weight: 600 !important;
  margin-bottom: 1rem !important;
}

.em-report .mki-4p-priority {
  font-family: var(--mki-display) !important;
  font-size: 1.1rem !important;
  font-weight: 400 !important;
  font-style: italic !important;
  color: var(--mki-ink) !important;
  margin-bottom: 0.75rem !important;
}

.em-report .mki-4p-body {
  font-size: 0.9rem !important;
  line-height: 1.7 !important;
  color: var(--mki-ink-light) !important;
}

/* ── 5W1H GRID ── */
.em-report .mki-5w1h {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 1.5rem !important;
  margin-bottom: 3rem !important;
}

.em-report .mki-5w1h-card {
  padding: 1.5rem !important;
  border: 1px solid var(--mki-rule) !important;
}

.em-report .mki-5w1h-q {
  font-family: var(--mki-display) !important;
  font-size: 1.5rem !important;
  font-weight: 300 !important;
  color: var(--mki-paper-deep) !important;
  line-height: 1.1 !important;
  margin-bottom: 0.25rem !important;
}

.em-report .mki-5w1h-name {
  font-family: var(--mki-sans) !important;
  font-size: 0.55rem !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  color: var(--mki-ink-faint) !important;
  font-weight: 600 !important;
  margin-bottom: 0.75rem !important;
}

.em-report .mki-5w1h-body {
  font-size: 0.9rem !important;
  line-height: 1.7 !important;
  color: var(--mki-ink-light) !important;
}

/* ── SMART ── */
.em-report .mki-smart-wrap {
  margin-bottom: 3rem !important;
}

.em-report .mki-verdict {
  padding: 2rem 1.5rem !important;
  border-left: 3px solid var(--mki-accent) !important;
  font-family: var(--mki-display) !important;
  font-size: 1.2rem !important;
  font-style: italic !important;
  line-height: 1.6 !important;
  color: var(--mki-ink) !important;
  margin-bottom: 2rem !important;
}

.em-report .mki-smart {
  display: grid !important;
  grid-template-columns: repeat(5, 1fr) !important;
  gap: 1rem !important;
  margin-bottom: 2rem !important;
}

.em-report .mki-smart-g {
  padding: 1.5rem 1rem !important;
  border: 1px solid var(--mki-rule) !important;
  text-align: center !important;
}

.em-report .mki-smart-letter {
  font-family: var(--mki-display) !important;
  font-size: 2rem !important;
  font-weight: 300 !important;
  color: var(--mki-paper-deep) !important;
  margin-bottom: 0.25rem !important;
}

.em-report .mki-smart-name {
  font-family: var(--mki-sans) !important;
  font-size: 0.5rem !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase !important;
  color: var(--mki-ink-faint) !important;
  font-weight: 600 !important;
  margin-bottom: 0.5rem !important;
}

.em-report .mki-smart-body {
  font-size: 0.8rem !important;
  line-height: 1.55 !important;
  color: var(--mki-ink-light) !important;
}

/* ── TIMELINE ── */
.em-report .mki-timeline {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 0 !important;
  border: 1px solid var(--mki-rule) !important;
}

.em-report .mki-tl {
  padding: 1.5rem !important;
  border-right: 1px solid var(--mki-rule) !important;
}

.em-report .em-cross {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 1.5rem !important;
  margin-bottom: 3rem !important;
}

.em-report .em-cross-cell {
  background: #fff !important;
  border: 1px solid var(--mki-rule) !important;
  padding: 1.75rem !important;
}

.em-report .em-cross-kicker {
  font-family: var(--mki-sans) !important;
  font-size: 0.55rem !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  color: var(--mki-ink-faint) !important;
  margin-bottom: 0.6rem !important;
}

.em-report .em-cross-title {
  font-family: var(--mki-display) !important;
  font-size: 1.15rem !important;
  line-height: 1.35 !important;
  color: var(--mki-ink) !important;
  margin-bottom: 0.85rem !important;
}

.em-report .em-cross-body p {
  font-size: 0.95rem !important;
  line-height: 1.7 !important;
  color: var(--mki-ink-light) !important;
  margin-bottom: 0.75rem !important;
}

.em-report .em-cross-body p:last-child {
  margin-bottom: 0 !important;
}

/* ── ANIMATION ── */
.em-report .mki-animate {
  opacity: 0 !important;
  animation: emFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards !important;
}

@keyframes emFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.em-report .mki-animate:nth-child(1) { animation-delay: 0.05s !important; }
.em-report .mki-animate:nth-child(2) { animation-delay: 0.1s !important; }
.em-report .mki-animate:nth-child(3) { animation-delay: 0.15s !important; }
.em-report .mki-animate:nth-child(4) { animation-delay: 0.2s !important; }
.em-report .mki-animate:nth-child(5) { animation-delay: 0.25s !important; }
.em-report .mki-animate:nth-child(6) { animation-delay: 0.3s !important; }
.em-report .mki-animate:nth-child(7) { animation-delay: 0.35s !important; }
.em-report .mki-animate:nth-child(8) { animation-delay: 0.4s !important; }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .em-report .mki-aida { grid-template-columns: repeat(2, 1fr) !important; }
  .em-report .mki-smart { grid-template-columns: repeat(3, 1fr) !important; }
  .em-report .mki-5w1h { grid-template-columns: repeat(2, 1fr) !important; }
  .em-report .mki-timeline { grid-template-columns: repeat(2, 1fr) !important; }
}

@media (max-width: 640px) {
  .em-report .mki-swot,
  .em-report .mki-4p,
  .em-report .mki-5w1h { grid-template-columns: 1fr !important; }
  .em-report .mki-aida { grid-template-columns: 1fr !important; }
  .em-report .mki-aida-step { border-right: none !important; border-bottom: 1px solid var(--mki-rule) !important; }
  .em-report .mki-smart { grid-template-columns: repeat(2, 1fr) !important; }
  .em-report .mki-timeline { grid-template-columns: 1fr !important; }
  .em-report .mki-tl { border-right: none !important; border-bottom: 1px solid var(--mki-rule) !important; }
  .em-report .mki-sec-num { font-size: 3rem !important; }
  .em-report .mki-sec-title { font-size: 1.4rem !important; }
}
`;

const MIN_RERENDER_TEXT_LEN = 80;

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

function getAnalysisTextForReRender(result: OptimkiResult): string {
  const ac = result.analysis_content?.trim() ?? '';
  const fromHtml = extractPlainTextFromReportHtml(result.html_report ?? '');
  if (ac.length >= MIN_RERENDER_TEXT_LEN) return ac;
  if (fromHtml.length >= MIN_RERENDER_TEXT_LEN) return fromHtml;
  if (ac.length > 0) return ac;
  return fromHtml;
}

function wrapLooseSectionParagraphs(section: Element) {
  const children = Array.from(section.children);
  let buffer: HTMLParagraphElement[] = [];

  const flush = (beforeNode?: Element | null) => {
    if (!buffer.length) return;
    const block = section.ownerDocument.createElement('div');
    block.className = 'em-prose';
    buffer.forEach((p) => block.appendChild(p));
    if (beforeNode) {
      section.insertBefore(block, beforeNode);
    } else {
      section.appendChild(block);
    }
    buffer = [];
  };

  for (const child of children) {
    if (child.classList.contains('sec-head') || child.classList.contains('em-section-header')) {
      continue;
    }
    if (child.tagName === 'P') {
      buffer.push(child as HTMLParagraphElement);
      continue;
    }
    flush(child);
  }

  flush(null);
}

function normalizeSwotCrossSections(doc: Document) {
  const labelPattern = /^(SO|ST|WO|WT)\s*[•·-]\s*(.+)$/i;

  doc.querySelectorAll('.section, .em-section').forEach((section) => {
    const directParagraphs = Array.from(section.children).filter(
      (child) => child.tagName === 'P'
    ) as HTMLParagraphElement[];

    if (!directParagraphs.length) return;

    const cards: Array<{ code: string; title: string; paragraphs: string[] }> = [];
    let current: { code: string; title: string; paragraphs: string[] } | null = null;

    for (const p of directParagraphs) {
      const text = (p.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!text) continue;

      const match = text.match(labelPattern);
      if (match) {
        if (current) cards.push(current);
        current = {
          code: match[1].toUpperCase(),
          title: match[2].trim(),
          paragraphs: [],
        };
      } else if (current) {
        current.paragraphs.push(p.innerHTML.trim());
      }
    }

    if (current) cards.push(current);
    if (cards.length < 2) return;

    const cross = doc.createElement('div');
    cross.className = 'em-cross';

    cards.forEach((card) => {
      const cell = doc.createElement('div');
      cell.className = 'em-cross-cell';

      const kicker = doc.createElement('div');
      kicker.className = 'em-cross-kicker';
      kicker.textContent = card.code;

      const title = doc.createElement('div');
      title.className = 'em-cross-title';
      title.textContent = card.title;

      const body = doc.createElement('div');
      body.className = 'em-cross-body';
      for (const paragraphHtml of card.paragraphs) {
        const p = doc.createElement('p');
        p.innerHTML = paragraphHtml;
        body.appendChild(p);
      }

      cell.append(kicker, title, body);
      cross.appendChild(cell);
    });

    directParagraphs[0].before(cross);
    directParagraphs.forEach((p) => p.remove());
  });
}

function addClassAliases(doc: Document, selectors: string, classNames: string[]) {
  doc.querySelectorAll(selectors).forEach((node) => {
    classNames.forEach((className) => node.classList.add(className));
  });
}

function normalizeOptimkiReportHtml(html: string): string {
  const raw = html?.trim() ?? '';
  if (!raw) return '';

  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');

    // Remove weakness cards in 4P
    doc.querySelectorAll('.fourp-weakness, .fw-weakness').forEach((node) => node.remove());

    addClassAliases(doc, '.section, .em-section, .mki-section', ['mki-section']);
    addClassAliases(doc, '.sec-head, .section-header, .em-section-header, .mki-sec-head', ['mki-sec-head']);
    addClassAliases(doc, '.sec-num, .mki-sec-num', ['mki-sec-num']);
    addClassAliases(doc, '.sec-label, .mki-sec-label', ['mki-sec-label']);
    addClassAliases(doc, '.sec-title, .mki-sec-title', ['mki-sec-title']);

    addClassAliases(doc, '.swot-infographic, .swot-grid, .em-swot, .mki-swot', ['mki-swot']);
    addClassAliases(doc, '.swot-cell, .swot-q, .em-swot-cell, .mki-swot-cell', ['mki-swot-cell']);
    addClassAliases(doc, '.swot-letter, .swot-q-letter, .mki-swot-letter', ['mki-swot-letter']);
    addClassAliases(doc, '.swot-label, .swot-q-label, .mki-swot-label', ['mki-swot-label']);
    addClassAliases(doc, '.swot-items, .swot-list, .mki-swot-list', ['mki-swot-list']);
    addClassAliases(doc, '.swot-item, .mki-swot-item', ['mki-swot-item']);
    addClassAliases(doc, '.swot-tick, .swot-icon, .mki-swot-icon', ['mki-swot-icon']);

    addClassAliases(doc, '.aida-funnel, .em-aida, .mki-aida', ['mki-aida']);
    addClassAliases(doc, '.aida-step, .em-aida-step, .mki-aida-step', ['mki-aida-step']);
    addClassAliases(doc, '.aida-step-letter, .aida-letter, .mki-aida-letter', ['mki-aida-letter']);
    addClassAliases(doc, '.aida-step-name, .aida-name, .mki-aida-name', ['mki-aida-name']);
    addClassAliases(doc, '.aida-hook, .mki-aida-hook', ['mki-aida-hook']);
    addClassAliases(doc, '.aida-desc, .mki-aida-desc', ['mki-aida-desc']);

    addClassAliases(doc, '.fourp-grid, .mki-4p', ['mki-4p']);
    addClassAliases(doc, '.fourp-card, .mki-4p-card', ['mki-4p-card']);
    addClassAliases(doc, '.fourp-number, .fourp-letter, .mki-4p-letter', ['mki-4p-letter']);
    addClassAliases(doc, '.fourp-name, .mki-4p-name', ['mki-4p-name']);
    addClassAliases(doc, '.fourp-priority, .mki-4p-priority', ['mki-4p-priority']);
    addClassAliases(doc, '.fourp-body, .mki-4p-body', ['mki-4p-body']);

    addClassAliases(doc, '.w1h-grid, .mki-5w1h', ['mki-5w1h']);
    addClassAliases(doc, '.w1h-card, .mki-5w1h-card', ['mki-5w1h-card']);
    addClassAliases(doc, '.w1h-q, .mki-5w1h-q', ['mki-5w1h-q']);
    addClassAliases(doc, '.w1h-name, .mki-5w1h-name', ['mki-5w1h-name']);
    addClassAliases(doc, '.w1h-items, .w1h-body, .mki-5w1h-body', ['mki-5w1h-body']);

    addClassAliases(doc, '.smart-quote-block, .smart-wrap, .mki-smart-wrap', ['mki-smart-wrap']);
    addClassAliases(doc, '.verdict, .smart-statement, .mki-verdict', ['mki-verdict']);
    addClassAliases(doc, '.smart-gauges, .mki-smart', ['mki-smart']);
    addClassAliases(doc, '.smart-g, .mki-smart-g', ['mki-smart-g']);
    addClassAliases(doc, '.smart-g-letter, .smart-letter, .mki-smart-letter', ['mki-smart-letter']);
    addClassAliases(doc, '.smart-g-name, .smart-name, .mki-smart-name', ['mki-smart-name']);
    addClassAliases(doc, '.smart-body, .mki-smart-body', ['mki-smart-body']);

    addClassAliases(doc, '.timeline-wrap, .mki-timeline', ['mki-timeline']);
    addClassAliases(doc, '.tl-phase, .tl, .mki-tl', ['mki-tl']);

    // Normalize SWOT cross sections
    normalizeSwotCrossSections(doc);

    // Add em-animate class to sections
    doc.querySelectorAll('.section, .em-section').forEach((section) => {
      wrapLooseSectionParagraphs(section);
      section.classList.add('em-animate', 'mki-animate', 'mki-section');
    });

    // Also process swot-infographic and similar
    doc.querySelectorAll('.swot-infographic, .swot-grid, .mki-swot').forEach((el) => {
      el.classList.add('em-swot', 'mki-swot');
      el.querySelectorAll('.swot-cell, .swot-q, .mki-swot-cell').forEach((cell) => {
        cell.classList.add('em-swot-cell', 'mki-swot-cell');
      });
    });

    return doc.body?.innerHTML?.trim() || raw;
  } catch {
    return raw;
  }
}

export const EditorialOptimkiReport: React.FC<EditorialOptimkiReportProps> = ({
  result,
  onRenderHtml,
  isRendering,
  renderStep,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const analysisTextForReRender = useMemo(
    () => getAnalysisTextForReRender(result),
    [result.analysis_content, result.html_report]
  );
  const sanitizedReportHtml = useMemo(
    () => normalizeOptimkiReportHtml(result.html_report ?? ''),
    [result.html_report]
  );
  const canReRender = Boolean(onRenderHtml && analysisTextForReRender.length >= MIN_RERENDER_TEXT_LEN);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [result]);

  const handleCopy = () => {
    const el = reportRef.current;
    if (!el) return;
    const text = el.textContent ?? '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportHtml = () => {
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opti M.KI — ${result.brand_name}</title>
  <style>${EDITORIAL_MINIMALISM_CSS}</style>
</head>
<body>
  <div class="em-report">
    ${sanitizedReportHtml}
  </div>
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OptiMKI_${result.brand_name.replace(/\s+/g, '_')}_${result.model_type}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReRender = async () => {
    if (!onRenderHtml || isRendering) return;
    const payloadText = analysisTextForReRender;
    if (payloadText.length < MIN_RERENDER_TEXT_LEN) {
      toast.error('Không đủ nội dung để render lại');
      return;
    }
    await onRenderHtml({
      brand_name: result.brand_name,
      model_type: result.model_type,
      analysis_content: payloadText,
      suggestion: result.suggestion,
    });
  };

  const getModelTag = (model: string) => {
    const tags: Record<string, { cls: string; label: string }> = {
      SWOT: { cls: 'accent', label: 'SWOT Analysis' },
      AIDA: { cls: 'accent', label: 'AIDA Model' },
      '4P': { cls: 'accent', label: 'Marketing Mix' },
      '5W1H': { cls: '', label: '5W1H Plan' },
      SMART: { cls: 'accent', label: 'SMART Goals' },
      'tat_ca': { cls: 'accent', label: 'Full Strategy' },
    };
    return tags[model] || { cls: '', label: model };
  };

  const formattedDate = new Date(result.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col h-full bg-[#fdfcfb]">
      {/* Inject CSS */}
      <style>{EDITORIAL_MINIMALISM_CSS}</style>

      {/* Report Content */}
      <div
        ref={reportRef}
        className="em-report flex-1 overflow-y-auto"
      >
        <div className="em-container">
          {/* Content */}
          <div className="em-content">
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedReportHtml }}
            />
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="shrink-0 px-6 py-4 border-t border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-[900px] mx-auto flex items-center justify-center gap-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>

          <div className="w-px h-5 bg-stone-200" />

          <button
            onClick={handleExportHtml}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Xuất HTML
          </button>

          <div className="w-px h-5 bg-stone-200" />

          <button
            onClick={() => void handleReRender()}
            disabled={isRendering || !canReRender}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRendering ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {isRendering ? (renderStep ?? 'Đang render...') : 'Render lại'}
          </button>
        </div>
      </div>
    </div>
  );
};

