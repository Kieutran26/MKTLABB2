import React, { useMemo } from 'react';
import './mastermind-strategy-opti-report.css';
import type { MastermindStrategy } from '../types';
import type { SubscriptionTier } from './AuthContext';
import ProMaxAdviceGate from './ProMaxAdviceGate';

interface Props {
  strategy: MastermindStrategy;
  subscriptionTier?: SubscriptionTier | string | null;
}

type Card = { title: string; eyebrow?: string; body: string; lines?: string[] };
type Report = {
  visionTitle: string;
  visionSummary: string;
  expertAnalysis: string;
  metrics: Array<{ label: string; value: string; number: string }>;
  persona?: Card;
  competition?: Card;
  roadmap: Card[];
  channels: Card[];
  content: Card[];
  advice: Card[];
  adviceQuote: string;
};

const clean = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
const pick = (...values: Array<string | null | undefined>) => values.map(clean).find(Boolean) ?? '';

function readLegacyHtml(strategy: MastermindStrategy) {
  const html = strategy.result.htmlOutput?.trim();
  if (!html || typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const pair = Array.from(doc.querySelectorAll('.two-col .section, .two-col .section-card'));
  return {
    visionTitle: pick((doc.querySelector('.bi-quote') as HTMLElement | null)?.textContent),
    visionSummary: pick((doc.querySelector('.bi-sub') as HTMLElement | null)?.textContent),
    expertAnalysis: pick((doc.querySelector('.bi-side-copy') as HTMLElement | null)?.textContent),
    metrics: Array.from(doc.querySelectorAll('.insight-strip .ins-item')).map((item, index) => ({
      label: pick((item.querySelector('.ins-label') as HTMLElement | null)?.textContent, `Metric ${index + 1}`),
      value: pick((item.querySelector('.ins-val') as HTMLElement | null)?.textContent),
      number: pick((item.querySelector('.ins-num') as HTMLElement | null)?.textContent, String(index + 1).padStart(2, '0')),
    })),
    persona: pair[0]
      ? {
          title: pick((pair[0].querySelector('.persona-name, .section-title') as HTMLElement | null)?.textContent, 'Target Persona'),
          eyebrow: pick((pair[0].querySelector('.persona-tag') as HTMLElement | null)?.textContent),
          body: pick((pair[0].querySelector('.persona-body') as HTMLElement | null)?.textContent),
          lines: Array.from(pair[0].querySelectorAll('.pain-item')).map((item) => clean(item.textContent)).filter(Boolean).slice(0, 5),
        }
      : undefined,
    competition: pair[1]
      ? {
          title: pick((pair[1].querySelector('.section-title') as HTMLElement | null)?.textContent, 'Competitive Space'),
          eyebrow: pick((pair[1].querySelector('.mini-label, .axis-label') as HTMLElement | null)?.textContent),
          body: pick((pair[1].querySelector('.comp-body') as HTMLElement | null)?.textContent),
          lines: Array.from(pair[1].querySelectorAll('.comp-axis-copy, .diff-pill-text, .axis-label, .leg'))
            .map((item) => clean(item.textContent))
            .filter(Boolean)
            .slice(0, 4),
        }
      : undefined,
  };
}

function buildReport(strategy: MastermindStrategy): Report {
  const legacy = readLegacyHtml(strategy);
  const { result } = strategy;
  const smart = result.strategic_goals?.smart_goals?.[0];
  const roadmap = (result.strategic_goals?.roadmap_90day?.months ?? []).slice(0, 3).map((month, index) => ({
    title: pick(month.month_name, `Giai đoạn ${index + 1}`),
    eyebrow: pick(month.priority, `Tháng ${index + 1}`),
    body: pick(month.kpi, month.owner, 'Chưa có KPI chi tiết'),
    lines: (month.actions ?? []).filter(Boolean).slice(0, 4),
  }));
  const channels = Object.entries(result.strategic_goals?.resource_allocation?.budget_split ?? {}).map(([name, data]) => ({
    title: name,
    eyebrow: pick(data.percent, 'Channel'),
    body: pick(data.kpi, data.rationale, 'Chưa có KPI chi tiết'),
    lines: [pick(data.rationale)].filter(Boolean),
  }));
  const content = [
    { title: 'Visual', eyebrow: `${result.contentAngles?.visual?.length ?? 0}x`, body: pick(result.contentAngles?.visual?.[0]), lines: result.contentAngles?.visual?.slice(1, 3) ?? [] },
    { title: 'Story', eyebrow: `${result.contentAngles?.story?.length ?? 0}x`, body: pick(result.contentAngles?.story?.[0]), lines: result.contentAngles?.story?.slice(1, 3) ?? [] },
    { title: 'Action', eyebrow: `${result.contentAngles?.action?.length ?? 0}x`, body: pick(result.contentAngles?.action?.[0]), lines: result.contentAngles?.action?.slice(1, 3) ?? [] },
  ].filter((item) => item.body || item.lines.length);

  return {
    visionTitle: pick(legacy?.visionTitle, result.coreMessage, strategy.name),
    visionSummary: pick(legacy?.visionSummary, result.conclusion?.summary, result.brand_context?.positioning?.current_state),
    expertAnalysis: pick(legacy?.expertAnalysis, result.insight, 'Chưa có expert analysis cụ thể.'),
    metrics: (legacy?.metrics?.length ? legacy.metrics : [
      { label: 'Core Insight', value: pick(result.insight, 'Chưa có insight cụ thể'), number: '01' },
      { label: 'Baseline hiện tại', value: pick(smart?.baseline, 'Chưa có số liệu cụ thể'), number: '02' },
      { label: 'Mục tiêu 90 ngày', value: pick(smart?.target, smart?.goal, 'Tăng trưởng bền vững'), number: '03' },
    ]).slice(0, 3),
    persona: legacy?.persona ?? {
      title: pick(result.brand_context?.persona?.demographics, 'Target Persona'),
      eyebrow: pick(result.brand_context?.persona?.behaviors),
      body: pick(result.brand_context?.persona?.psychographics, result.brand_context?.persona?.journey, 'Chưa có mô tả persona cụ thể.'),
      lines: [
        ...(result.brand_context?.pain_gain?.ranked_pains ?? []).slice(0, 3).map((item) => item.content),
        ...(result.brand_context?.pain_gain?.top_gains ?? []).slice(0, 2),
      ].filter(Boolean),
    },
    competition: legacy?.competition ?? {
      title: 'Competitive Space',
      eyebrow: pick(result.brand_context?.positioning?.competitive_map?.description, 'Competitive landscape'),
      body: pick(result.brand_context?.positioning?.current_state, 'Chưa có mô tả không gian cạnh tranh.'),
      lines: [
        pick(result.brand_context?.positioning?.competitive_map?.x_axis),
        pick(result.brand_context?.positioning?.competitive_map?.y_axis),
        pick(result.brand_context?.positioning?.differentiator),
      ].filter(Boolean),
    },
    roadmap,
    channels,
    content,
    advice: [
      { title: 'Việc phải làm', body: pick(result.action_plan?.expert_advice?.the_must_do) },
      { title: 'Cần tránh', body: pick(result.action_plan?.expert_advice?.common_pitfall) },
      { title: 'Cơ hội ẩn', body: pick(result.action_plan?.expert_advice?.hidden_opportunity) },
    ].filter((item) => item.body),
    adviceQuote: pick(result.conclusion?.positioning_statement),
  };
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mmor-section-head">
      <div className="mmor-section-number">{number}</div>
      <div>
        <div className="mmor-section-kicker">Mô hình chiến lược</div>
        <h2 className="mmor-section-title">{title}</h2>
      </div>
    </div>
  );
}

const MastermindStrategyOptiReport: React.FC<Props> = ({ strategy, subscriptionTier }) => {
  const isPromax = subscriptionTier === 'promax';
  const report = useMemo(() => buildReport(strategy), [strategy]);

  return (
    <div className="mmor-page">
      <section className="mmor-section">
        <SectionHeader number="01" title="Strategic Vision & Core Message" />
        <div className="mmor-board mmor-board--split">
          <article className="mmor-panel">
            <div className="mmor-panel-kicker">Strategic Vision · Core Message</div>
            <blockquote className="mmor-quote">"{report.visionTitle}"</blockquote>
            <p className="mmor-copy">{report.visionSummary}</p>
          </article>
          <aside className="mmor-panel mmor-panel--side">
            <div className="mmor-panel-kicker">Expert Analysis</div>
            <p className="mmor-copy">{report.expertAnalysis}</p>
          </aside>
        </div>
      </section>

      <section className="mmor-section">
        <SectionHeader number="02" title="Chỉ số chiến lược" />
        <div className="mmor-metric-row">
          {report.metrics.map((item) => (
            <article key={item.number} className="mmor-metric-card">
              <div className="mmor-metric-label">{item.label}</div>
              <div className="mmor-metric-number">{item.number}</div>
              <div className="mmor-metric-value">{item.value}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mmor-section">
        <SectionHeader number="03" title="Persona & Competitive Space" />
        <div className="mmor-board mmor-board--split">
          {[report.persona, report.competition].filter(Boolean).map((card, index) => (
            <article key={`${card?.title}-${index}`} className="mmor-panel">
              <div className="mmor-panel-kicker">{card?.eyebrow || (index === 0 ? 'Target Persona' : 'Competitive Space')}</div>
              <h3 className="mmor-panel-title">{card?.title}</h3>
              <p className="mmor-copy">{card?.body}</p>
              {card?.lines?.length ? (
                <ul className="mmor-list">
                  {card.lines.map((line, lineIndex) => <li key={`${line}-${lineIndex}`}>{line}</li>)}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {report.roadmap.length ? (
        <section className="mmor-section">
          <SectionHeader number="04" title="Lộ trình 90 ngày" />
          <div className="mmor-grid mmor-grid--3">
            {report.roadmap.map((card, index) => (
              <article key={`${card.title}-${index}`} className="mmor-card">
                <div className="mmor-card-kicker">{card.eyebrow}</div>
                <h3 className="mmor-card-title">{card.title}</h3>
                <p className="mmor-copy">{card.body}</p>
                {card.lines?.length ? <ul className="mmor-list">{card.lines.map((line, i) => <li key={`${line}-${i}`}>{line}</li>)}</ul> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {report.channels.length ? (
        <section className="mmor-section">
          <SectionHeader number="05" title="Kênh truyền thông & ngân sách" />
          <div className="mmor-grid mmor-grid--3">
            {report.channels.map((card, index) => (
              <article key={`${card.title}-${index}`} className="mmor-card">
                <div className="mmor-card-kicker">{card.eyebrow}</div>
                <h3 className="mmor-card-title">{card.title}</h3>
                <p className="mmor-copy">{card.body}</p>
                {card.lines?.length ? <ul className="mmor-list">{card.lines.map((line, i) => <li key={`${line}-${i}`}>{line}</li>)}</ul> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {report.content.length ? (
        <section className="mmor-section">
          <SectionHeader number="06" title="Content Mix hàng tuần" />
          <div className="mmor-grid mmor-grid--3">
            {report.content.map((card, index) => (
              <article key={`${card.title}-${index}`} className="mmor-card">
                <div className="mmor-card-kicker">{card.eyebrow}</div>
                <h3 className="mmor-card-title">{card.title}</h3>
                <p className="mmor-copy">{card.body}</p>
                {card.lines?.length ? <ul className="mmor-list">{card.lines.map((line, i) => <li key={`${line}-${i}`}>{line}</li>)}</ul> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {isPromax && (report.advice.length || report.adviceQuote) ? (
        <section className="mmor-section">
          <SectionHeader number="07" title="CMO Advice" />
          <div className="mmor-grid mmor-grid--3">
            {report.advice.map((card, index) => (
              <article key={`${card.title}-${index}`} className="mmor-card mmor-card--soft">
                <div className="mmor-card-kicker">Strategic advice</div>
                <h3 className="mmor-card-title">{card.title}</h3>
                <p className="mmor-copy">{card.body}</p>
              </article>
            ))}
          </div>
          {report.adviceQuote ? <blockquote className="mmor-advice-quote">{report.adviceQuote}</blockquote> : null}
        </section>
      ) : null}

      {!isPromax && (report.advice.length || report.adviceQuote) ? (
        <div className="mmor-gate">
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

export default MastermindStrategyOptiReport;
