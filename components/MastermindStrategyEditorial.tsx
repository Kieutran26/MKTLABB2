import React, { useMemo } from 'react';
import './MastermindStrategyEditorial.css';
import { MastermindStrategy } from '../types';
import ProMaxAdviceGate from './ProMaxAdviceGate';
import type { SubscriptionTier } from './AuthContext';

interface MastermindStrategyEditorialProps {
  strategy: MastermindStrategy;
  subscriptionTier?: SubscriptionTier | string | null;
}

type KeyValueCard = { label: string; value: string; number?: string };
type TextCard = { title: string; body: string; eyebrow?: string; lines?: string[]; accent?: string };
type ParsedReport = {
  vision: { title: string; summary: string; analysis: string };
  metrics: KeyValueCard[];
  persona?: TextCard;
  competition?: TextCard;
  roadmap: TextCard[];
  channels: TextCard[];
  content: TextCard[];
  advice: TextCard[];
  adviceQuote?: string;
};

const clean = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
const first = (...values: Array<string | null | undefined>) => values.map(clean).find(Boolean) ?? '';

function fromStructuredResult(strategy: MastermindStrategy): ParsedReport {
  const { result } = strategy;
  const smartGoals = result.strategic_goals?.smart_goals ?? [];
  const budgetSplit = result.strategic_goals?.resource_allocation?.budget_split ?? {};
  const roadmapMonths = result.strategic_goals?.roadmap_90day?.months ?? [];
  const pains = (result.brand_context?.pain_gain?.ranked_pains ?? []).slice(0, 3).map((item) => item.content);
  const gains = result.brand_context?.pain_gain?.top_gains ?? [];

  return {
    vision: {
      title: first(result.coreMessage, strategy.name, 'Strategic direction'),
      summary: first(result.conclusion?.summary, result.brand_context?.positioning?.current_state, result.insight),
      analysis: first(result.insight, result.conclusion?.final_notes),
    },
    metrics: [
      { number: '01', label: 'Core Insight', value: first(result.insight, 'Chưa có insight cụ thể') },
      { number: '02', label: 'Baseline hiện tại', value: first(smartGoals[0]?.baseline, 'Chưa có số liệu cụ thể') },
      { number: '03', label: 'Mục tiêu chiến dịch', value: first(smartGoals[0]?.target, smartGoals[0]?.goal, 'Tăng trưởng bền vững') },
    ],
    persona: {
      title: first(result.brand_context?.persona?.demographics, 'Target Persona'),
      eyebrow: first(result.brand_context?.persona?.behaviors),
      body: first(result.brand_context?.persona?.psychographics, result.brand_context?.persona?.journey),
      lines: [...pains, ...gains].filter(Boolean).slice(0, 5),
      accent: 'persona',
    },
    competition: {
      title: 'Competitive Space',
      eyebrow: first(result.brand_context?.positioning?.competitive_map?.description, 'Bối cảnh cạnh tranh'),
      body: first(result.brand_context?.positioning?.current_state),
      lines: [
        first(result.brand_context?.positioning?.competitive_map?.x_axis),
        first(result.brand_context?.positioning?.competitive_map?.y_axis),
        first(result.brand_context?.positioning?.differentiator),
      ].filter(Boolean),
      accent: 'competition',
    },
    roadmap: roadmapMonths.slice(0, 3).map((month, index) => ({
      title: first(month.month_name, `Giai đoạn ${index + 1}`),
      eyebrow: first(month.priority),
      body: first(month.kpi, month.owner),
      lines: (month.actions ?? []).filter(Boolean).slice(0, 4),
      accent: 'roadmap',
    })),
    channels: Object.entries(budgetSplit).map(([name, data]) => ({
      title: name,
      eyebrow: first(data.percent),
      body: first(data.kpi),
      lines: [first(data.rationale)].filter(Boolean),
      accent: 'channel',
    })),
    content: [
      { title: 'Visual', eyebrow: `${result.contentAngles?.visual?.length ?? 0}x`, body: first(result.contentAngles?.visual?.[0]), lines: result.contentAngles?.visual?.slice(1, 3) ?? [], accent: 'content' },
      { title: 'Story', eyebrow: `${result.contentAngles?.story?.length ?? 0}x`, body: first(result.contentAngles?.story?.[0]), lines: result.contentAngles?.story?.slice(1, 3) ?? [], accent: 'content' },
      { title: 'Action', eyebrow: `${result.contentAngles?.action?.length ?? 0}x`, body: first(result.contentAngles?.action?.[0]), lines: result.contentAngles?.action?.slice(1, 3) ?? [], accent: 'content' },
    ],
    advice: [
      { title: 'Việc phải làm', body: first(result.action_plan?.expert_advice?.the_must_do), accent: 'advice' },
      { title: 'Cần tránh', body: first(result.action_plan?.expert_advice?.common_pitfall), accent: 'advice' },
      { title: 'Cơ hội ẩn', body: first(result.action_plan?.expert_advice?.hidden_opportunity), accent: 'advice' },
    ].filter((item) => item.body),
    adviceQuote: first(result.conclusion?.positioning_statement),
  };
}

function mergeTextCard(base?: TextCard, override?: TextCard): TextCard | undefined {
  if (!base && !override) return undefined;
  return {
    title: first(override?.title, base?.title),
    eyebrow: first(override?.eyebrow, base?.eyebrow),
    body: first(override?.body, base?.body),
    lines: (override?.lines?.length ? override.lines : base?.lines) ?? [],
    accent: override?.accent ?? base?.accent,
  };
}

function mergeReports(base: ParsedReport, override: ParsedReport | null): ParsedReport {
  if (!override) return base;
  return {
    vision: {
      title: first(override.vision.title, base.vision.title),
      summary: first(override.vision.summary, base.vision.summary),
      analysis: first(override.vision.analysis, base.vision.analysis),
    },
    metrics: base.metrics.map((item, index) => ({
      number: first(override.metrics[index]?.number, item.number),
      label: first(override.metrics[index]?.label, item.label),
      value: first(override.metrics[index]?.value, item.value),
    })),
    persona: mergeTextCard(base.persona, override.persona),
    competition: mergeTextCard(base.competition, override.competition),
    roadmap: override.roadmap.length ? override.roadmap : base.roadmap,
    channels: override.channels.length ? override.channels : base.channels,
    content: override.content.length ? override.content : base.content,
    advice: override.advice.length ? override.advice : base.advice,
    adviceQuote: first(override.adviceQuote, base.adviceQuote),
  };
}

function parseTextCards(root: ParentNode, selector: string, accent: string): TextCard[] {
  return Array.from(root.querySelectorAll(selector)).map((node) => ({
    title: first((node.querySelector('.rm-month, .ch-name, .ct-type, .cmo-item-title') as HTMLElement | null)?.textContent, 'Untitled'),
    eyebrow: first((node.querySelector('.rm-theme, .ch-pct, .ct-ratio') as HTMLElement | null)?.textContent),
    body: first(
      (node.querySelector('.rm-kpi, .ch-kpi, .ct-example, .cmo-item-copy') as HTMLElement | null)?.textContent,
      clean((node as HTMLElement).textContent)
    ),
    lines: Array.from(node.querySelectorAll('.rm-item span, .ch-rationale, .ct-hook')).map((item) => clean(item.textContent)).filter(Boolean).slice(0, 4),
    accent,
  })).filter((item) => item.title || item.body || (item.lines?.length ?? 0) > 0);
}

function fromHtmlOutput(strategy: MastermindStrategy): ParsedReport | null {
  const raw = strategy.result?.htmlOutput?.trim();
  if (!raw || typeof DOMParser === 'undefined') return null;

  const doc = new DOMParser().parseFromString(raw, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed').forEach((node) => node.remove());

  const bigIdea = doc.querySelector('.big-idea');
  const insightStrip = doc.querySelector('.insight-strip');
  const pairedCards = Array.from(doc.querySelectorAll('.two-col .section, .two-col .section-card'));
  const cmoQuote = doc.querySelector('.cmo-quote');

  const metrics = insightStrip
    ? Array.from(insightStrip.querySelectorAll('.ins-item')).map((item, index) => ({
        number: first((item.querySelector('.ins-num') as HTMLElement | null)?.textContent, String(index + 1).padStart(2, '0')),
        label: first((item.querySelector('.ins-label') as HTMLElement | null)?.textContent, `Metric ${index + 1}`),
        value: first((item.querySelector('.ins-val') as HTMLElement | null)?.textContent, 'Chưa có dữ liệu'),
      }))
    : [];

  const persona = pairedCards[0]
    ? {
        title: first((pairedCards[0].querySelector('.persona-name, .section-title') as HTMLElement | null)?.textContent, 'Target Persona'),
        eyebrow: first((pairedCards[0].querySelector('.persona-tag') as HTMLElement | null)?.textContent),
        body: first((pairedCards[0].querySelector('.persona-body') as HTMLElement | null)?.textContent),
        lines: Array.from(pairedCards[0].querySelectorAll('.pain-item')).map((item) => clean(item.textContent)).filter(Boolean).slice(0, 5),
        accent: 'persona',
      }
    : undefined;

  const competition = pairedCards[1]
    ? {
        title: first((pairedCards[1].querySelector('.section-title') as HTMLElement | null)?.textContent, 'Competitive Space'),
        eyebrow: first((pairedCards[1].querySelector('.mini-label, .axis-label') as HTMLElement | null)?.textContent),
        body: first((pairedCards[1].querySelector('.comp-body') as HTMLElement | null)?.textContent),
        lines: [
          ...Array.from(pairedCards[1].querySelectorAll('.comp-axis-copy, .diff-pill-text, .axis-label, .leg')).map((item) => clean(item.textContent)),
        ].filter(Boolean).slice(0, 4),
        accent: 'competition',
      }
    : undefined;

  const advice = Array.from(doc.querySelectorAll('.cmo-grid .cmo-item')).map((item, index) => {
    const roman = first((item.querySelector('.cmo-num') as HTMLElement | null)?.textContent);
    const defaultTitle = index === 0 ? 'Việc phải làm' : index === 1 ? 'Cần tránh' : 'Cơ hội ẩn';
    return {
      title: defaultTitle,
      eyebrow: roman,
      body: first(
        (item.querySelector('.cmo-text, .cmo-item-copy') as HTMLElement | null)?.textContent,
        clean((item as HTMLElement).textContent)
      ),
      accent: 'advice',
    };
  }).filter((item) => item.body);

  return {
    vision: {
      title: first((bigIdea?.querySelector('.bi-quote') as HTMLElement | null)?.textContent, strategy.result.coreMessage, strategy.name),
      summary: first((bigIdea?.querySelector('.bi-sub') as HTMLElement | null)?.textContent, strategy.result.conclusion?.summary),
      analysis: first((bigIdea?.querySelector('.bi-side-copy') as HTMLElement | null)?.textContent, strategy.result.insight),
    },
    metrics: metrics.length ? metrics : fromStructuredResult(strategy).metrics,
    persona: persona ?? fromStructuredResult(strategy).persona,
    competition: competition ?? fromStructuredResult(strategy).competition,
    roadmap: parseTextCards(doc, '.roadmap-grid .rm-col', 'roadmap'),
    channels: parseTextCards(doc, '.channel-grid .ch-card', 'channel'),
    content: parseTextCards(doc, '.content-tabs .ct-tab', 'content'),
    advice: advice.length ? advice : parseTextCards(doc, '.cmo-grid .cmo-item', 'advice'),
    adviceQuote: first(cmoQuote?.textContent, strategy.result.conclusion?.positioning_statement),
  };
}

function renderSectionHeader(number: string, eyebrow: string, title: string) {
  return (
    <div className="msr-section-head">
      <div className="msr-section-head__number">{number}</div>
      <div className="msr-section-head__meta">
        <div className="msr-section-head__eyebrow">{eyebrow}</div>
        <h2 className="msr-section-head__title">{title}</h2>
      </div>
    </div>
  );
}

function renderBulletList(lines?: string[]) {
  if (!lines?.length) return null;

  return (
    <ul className="msr-list">
      {lines.map((line, index) => (
        <li key={`${line}-${index}`}>{line}</li>
      ))}
    </ul>
  );
}

const MastermindStrategyEditorial: React.FC<MastermindStrategyEditorialProps> = ({ strategy, subscriptionTier }) => {
  const isPromax = subscriptionTier === 'promax';
  const report = useMemo(() => {
    const structured = fromStructuredResult(strategy);
    const legacyFacts = fromHtmlOutput(strategy);
    return mergeReports(structured, legacyFacts);
  }, [strategy]);

  return (
    <div className="mastermind-report-shell msr-report">
      <div className="msr-stack">
        <section className="msr-section">
          {renderSectionHeader('01', 'Mô hình chiến lược', 'Strategic Vision & Core Message')}
          <div className="msr-hero rk-result-surface">
            <div className="msr-hero__main">
              <div className="rk-result-badge">Mastermind Strategy</div>
              <blockquote className="msr-hero__quote">{report.vision.title}</blockquote>
              {report.vision.summary ? <p className="msr-hero__summary">{report.vision.summary}</p> : null}
            </div>
            <aside className="msr-hero__side">
              <div className="msr-panel-card msr-panel-card--soft">
                <div className="rk-result-eyebrow">Expert Analysis</div>
                <p className="rk-result-copy">{report.vision.analysis || 'Chưa có expert analysis cụ thể.'}</p>
              </div>
              <div className="msr-panel-card">
                <div className="rk-result-eyebrow">Strategic Summary</div>
                <p className="rk-result-copy">
                  {report.vision.summary || report.metrics[0]?.value || 'Chưa có tổng quan chiến lược.'}
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="msr-section">
          {renderSectionHeader('02', 'Mô hình chiến lược', 'Chỉ số chiến lược')}
          <div className="msr-kpi-grid">
            {report.metrics.map((item, index) => (
              <article key={`${item.label}-${index}`} className="msr-kpi-card rk-result-card">
                <div className="msr-kpi-card__top">
                  <div className="rk-result-eyebrow">{item.label}</div>
                  <div className="msr-kpi-card__number">{item.number ?? String(index + 1).padStart(2, '0')}</div>
                </div>
                <div className="msr-kpi-card__value">{item.value}</div>
              </article>
            ))}
          </div>
        </section>

        {report.persona || report.competition ? (
          <section className="msr-section">
            {renderSectionHeader('03', 'Mô hình chiến lược', 'Persona & Competitive Space')}
            <div className="msr-split-grid">
              {[report.persona, report.competition].filter(Boolean).map((item, index) => (
                <article key={`${item?.title}-${index}`} className="msr-insight-card rk-result-surface">
                  <div className="msr-insight-card__head">
                    <div className="rk-result-eyebrow">{item?.eyebrow || (index === 0 ? 'Target Persona' : 'Competitive Space')}</div>
                    <h3 className="rk-result-title">{item?.title}</h3>
                  </div>
                  {item?.body ? <p className="rk-result-copy">{item.body}</p> : null}
                  {renderBulletList(item?.lines)}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {report.roadmap.length ? (
          <section className="msr-section">
            {renderSectionHeader('04', 'Mô hình chiến lược', 'Lộ trình 90 ngày')}
            <div className="msr-roadmap-grid">
              {report.roadmap.map((item, index) => (
                <article key={`${item.title}-${index}`} className="msr-roadmap-card rk-result-surface">
                  <div className="msr-roadmap-card__step">{String(index + 1).padStart(2, '0')}</div>
                  <div className="rk-result-eyebrow">{item.eyebrow || `Giai đoạn ${index + 1}`}</div>
                  <h3 className="rk-result-title">{item.title}</h3>
                  {item.body ? <p className="rk-result-copy">{item.body}</p> : null}
                  {renderBulletList(item.lines)}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {report.channels.length ? (
          <section className="msr-section">
            {renderSectionHeader('05', 'Mô hình chiến lược', 'Kênh truyền thông & ngân sách')}
            <div className="msr-card-grid msr-card-grid--auto">
              {report.channels.map((item, index) => (
                <article key={`${item.title}-${index}`} className="msr-detail-card rk-result-card">
                  <div className="msr-detail-card__top">
                    <div className="rk-result-eyebrow">{item.eyebrow || 'Channel'}</div>
                    <div className="msr-detail-card__pill">Media</div>
                  </div>
                  <h3 className="rk-result-title">{item.title}</h3>
                  {item.body ? <p className="rk-result-copy">{item.body}</p> : null}
                  {renderBulletList(item.lines)}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {report.content.length ? (
          <section className="msr-section">
            {renderSectionHeader('06', 'Mô hình chiến lược', 'Content Mix hàng tuần')}
            <div className="msr-card-grid msr-card-grid--thirds">
              {report.content.map((item, index) => (
                <article key={`${item.title}-${index}`} className="msr-detail-card rk-result-card">
                  <div className="msr-detail-card__top">
                    <div className="rk-result-eyebrow">{item.eyebrow || 'Content angle'}</div>
                    <div className="msr-detail-card__pill">Weekly</div>
                  </div>
                  <h3 className="rk-result-title">{item.title}</h3>
                  {item.body ? <p className="rk-result-copy">{item.body}</p> : null}
                  {renderBulletList(item.lines)}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {isPromax && (report.advice.length || report.adviceQuote) ? (
          <section className="msr-section">
            {renderSectionHeader('07', 'Mô hình chiến lược', 'CMO Advice')}
            <div className="msr-card-grid msr-card-grid--thirds">
              {report.advice.map((item, index) => (
                <article key={`${item.title}-${index}`} className="msr-detail-card msr-detail-card--soft rk-result-card">
                  <div className="msr-detail-card__top">
                    <div className="rk-result-eyebrow">Strategic advice</div>
                    <div className="msr-detail-card__pill">CMO</div>
                  </div>
                  <h3 className="rk-result-title">{item.title}</h3>
                  <p className="rk-result-copy">{item.body}</p>
                </article>
              ))}
            </div>
            {report.adviceQuote ? (
              <blockquote className="msr-advice-quote rk-result-surface">
                <div className="rk-result-eyebrow">Positioning Statement</div>
                <p>{report.adviceQuote}</p>
              </blockquote>
            ) : null}
          </section>
        ) : null}
      </div>

      {!isPromax && (report.advice.length || report.adviceQuote) ? (
        <div className="mastermind-promax-advice-gate">
          <ProMaxAdviceGate
            subscriptionTier={subscriptionTier}
            benefits={[
              'Việc cần làm, bẫy phổ biến và cơ hội ẩn',
              'Positioning statement hoàn chỉnh để chốt chiến lược',
            ]}
          />
        </div>
      ) : null}
    </div>
  );
};

export default MastermindStrategyEditorial;
