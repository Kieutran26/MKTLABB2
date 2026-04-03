import React from 'react';
import './MastermindStrategyEditorial.css';
import { MastermindStrategy } from '../types';
import { renderMarkdownBoldSegments } from '../utils/renderMarkdownBold';
import { Check, X, Zap } from 'lucide-react';
import ProMaxAdviceGate from './ProMaxAdviceGate';
import type { SubscriptionTier } from './AuthContext';

interface MastermindStrategyEditorialProps {
  strategy: MastermindStrategy;
  subscriptionTier?: SubscriptionTier | string | null;
}

/* ── small helpers ── */
const Band = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <div className={`ms-band ms-band-${color}`}>{children}</div>
);

const SectionLabel = ({
  num, label, dotClass = 'ms-band-label-dot',
  dotStyle,
}: {
  num: string; label: string; dotClass?: string; dotStyle?: React.CSSProperties;
}) => (
  <div className="ms-band-label">
    <div className={dotClass} style={dotStyle} />
    <span className="ms-band-label-text">{label}</span>
    <div className="ms-band-label-line" />
    <span className="ms-band-label-num">{num}</span>
  </div>
);

const MastermindStrategyEditorial: React.FC<MastermindStrategyEditorialProps> = ({ strategy, subscriptionTier }) => {
  const { result } = strategy;
  const isPromax = subscriptionTier === 'promax';
  if (!result) return null;

  /** API / DB có thể thiếu nhánh — tránh crash khi đọc nested */
  const contentAngles = {
    text: [] as string[],
    visual: [] as string[],
    story: [] as string[],
    data: [] as string[],
    action: [] as string[],
    weekly_distribution: 'hàng tuần',
    sample_week_schedule: '',
    ...result.contentAngles,
  };

  const createdAt = new Date(strategy.createdAt);
  const quarter   = `Q${Math.floor(createdAt.getMonth() / 3) + 1} · ${createdAt.getFullYear()}`;

  return (
    <div className="ms-editorial-wrapper">

      {/* ── 0. HEADER ─────────────────────────────────────────── */}
      <div className="ms-header-band">
        <div className="ms-header-left">
          <div className="ms-eyebrow">Mastermind Strategy • Framework v1.0</div>
          <h1 className="ms-main-title">
            {strategy.name.split(' - ')[0]}
          </h1>
          <div className="ms-header-subline">
            <span className="ms-sub-accent">Context</span>
            <span className="ms-sub-text">{result.brand_context?.persona.demographics || 'Khách hàng mục tiêu'}</span>
          </div>
        </div>
        <div className="ms-header-right">
          <div className="ms-meta-stack">
            <div className="ms-meta-item">
              <span className="ms-meta-label">Period</span>
              <span className="ms-meta-value">{quarter}</span>
            </div>
            <div className="ms-meta-item">
              <span className="ms-meta-label">Output Type</span>
              <span className="ms-meta-value accent">Chiến lược tổng thể</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. BIG IDEA ─────────────────────────────────────── */}
      <Band color="white">
        <SectionLabel num="01" label="Strategic Vision · Core Message" dotStyle={{ background: 'var(--ms-green)', width: 8, height: 8, borderRadius: '50%' }} />
        <div className="ms-big-idea-grid">
          <div className="ms-core-message">
            <div className="ms-quote-wrap">
              <span className="ms-quote-symbol">“</span>
              <h2 className="ms-quote-headline">
                {result.coreMessage}
              </h2>
            </div>
            <div className="ms-vision-copy">
              {result.conclusion?.summary || 'Chiến lược tập trung vào việc xây dựng giá trị cốt lõi và kết nối sâu sắc với khách hàng mục tiêu.'}
            </div>
          </div>
          <div className="ms-side-insight">
            <div className="ms-side-insight-label">Expert Analysis</div>
            <div className="ms-side-insight-text">
              {result.insight}
            </div>
          </div>
        </div>
      </Band>

      {/* ── 2. KEY METRICS ──────────────────────────────────── */}
      <Band color="paper2">
        <SectionLabel num="02" label="Chỉ số chiến lược" dotStyle={{ background: 'var(--ms-blue)', width: 8, height: 8, borderRadius: '50%' }} />
        <div className="ms-metrics-row">
          <div className="ms-metric-card">
            <div className="ms-metric-num">01</div>
            <div className="ms-metric-label">Core Insight</div>
            <div className="ms-metric-val">{result.insight}</div>
          </div>
          <div className="ms-metric-card">
            <div className="ms-metric-num">02</div>
            <div className="ms-metric-label">Baseline hiện tại</div>
            <div className="ms-metric-val">
              {result.strategic_goals?.smart_goals[0]?.baseline || 'Chưa có số liệu cụ thể'}
            </div>
          </div>
          <div className="ms-metric-card">
            <div className="ms-metric-num">03</div>
            <div className="ms-metric-label">Mục tiêu chiến dịch</div>
            <div className="ms-metric-val">
              {result.strategic_goals?.smart_goals[0]?.target || 'Tăng trưởng bền vững'}
            </div>
          </div>
        </div>
      </Band>

      {/* ── 3. PERSONA + COMPETITIVE ────────────────────────── */}
      <Band color="paper">
        <SectionLabel num="03" label="Persona & Competitive Space" dotStyle={{ background: 'var(--ms-amber)', width: 8, height: 8, borderRadius: '50%' }} />
        <div className="ms-two-col-grid">

          {/* Persona */}
          <div className="ms-col-card">
            <div className="ms-col-heading">Target Persona</div>
            <div className="ms-col-sub">
              {result.brand_context?.persona.demographics}<br />
              {result.brand_context?.persona.behaviors}
            </div>
            <div className="ms-col-body">{result.brand_context?.persona.psychographics}</div>

            <div className="ms-col-micro-label">Nỗi đau chính</div>
            {(result.brand_context?.pain_gain?.ranked_pains ?? []).slice(0, 3).map((pain, i) => (
              <div key={i} className="ms-list-item">
                <div className={`ms-list-dot ${pain.impact === 'High' ? 'ms-list-dot-red' : 'ms-list-dot-amber'}`} />
                {pain.content}
              </div>
            ))}

            <div className="ms-col-micro-label">Khao khát thật sự</div>
            {(result.brand_context?.pain_gain?.top_gains ?? []).slice(0, 2).map((gain, i) => (
              <div key={i} className="ms-list-item">
                <div className="ms-list-dot ms-list-dot-green" />
                {gain}
              </div>
            ))}
          </div>

          {/* Competitive */}
          <div className="ms-col-card">
            <div className="ms-col-heading">Competitive Space</div>
            <div className="ms-col-body">{result.brand_context?.positioning.current_state}</div>

            <div className="ms-col-micro-label">Trục cạnh tranh</div>
            <div className="ms-col-body" style={{ fontSize: 12, color: 'var(--ms-ink-3)' }}>
              {result.brand_context?.positioning?.competitive_map?.x_axis ?? '—'}
              {' · '}
              {result.brand_context?.positioning?.competitive_map?.y_axis ?? '—'}
            </div>

            <div className="ms-diff-pill">
              <div className="ms-diff-pill-label">Our Differentiator</div>
              <div className="ms-diff-pill-text">{result.brand_context?.positioning.differentiator}</div>
            </div>
          </div>
        </div>
      </Band>

      {/* ── 4. ROADMAP 90 NGÀY ──────────────────────────────── */}
      <Band color="blue">
        <SectionLabel num="04" label="Lộ trình 90 ngày" dotStyle={{ background: 'var(--ms-blue)', width: 8, height: 8, borderRadius: '50%' }} />
        <div className="ms-roadmap-cols">
          {(result.strategic_goals?.roadmap_90day?.months ?? []).map((month, i) => (
            <div key={i} className="ms-rm-card">
              <div className="ms-rm-card-top">
                <div className="ms-rm-month-label">{month.month_name}</div>
                <div className="ms-rm-priority">{month.priority}</div>
              </div>
              <div className="ms-rm-card-body">
                {(month.actions ?? []).slice(0, 3).map((action, j) => (
                  <div key={j} className="ms-rm-action-item">
                    <span className="ms-rm-action-num">{j + 1}.</span>
                    {action}
                  </div>
                ))}
                <div className="ms-rm-kpi-strip">
                  Target KPI: <span>{month.kpi}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Band>

      {/* ── 5. CHANNEL ALLOCATION ───────────────────────────── */}
      <Band color="paper">
        <SectionLabel num="05" label="Kênh truyền thông & Ngân sách" dotStyle={{ background: 'var(--ms-green)', width: 8, height: 8, borderRadius: '50%' }} />
        <div className="ms-channel-grid">
          {Object.entries(result.strategic_goals?.resource_allocation.budget_split || {}).map(([channel, data], i) => (
            <div key={i} className="ms-ch-card">
              <div className="ms-ch-header">
                <div className="ms-ch-name">{channel}</div>
                <div className="ms-ch-pct">{data.percent}</div>
              </div>
              <div className="ms-ch-bar-track">
                <div className="ms-ch-bar-fill" style={{ width: data.percent }} />
              </div>
              <div className="ms-ch-kpi-text">KPI: {data.kpi}</div>
              <div className="ms-ch-rationale">{data.rationale}</div>
            </div>
          ))}
        </div>
      </Band>

      {/* ── 6. CONTENT MIX ──────────────────────────────────── */}
      <Band color="paper2">
        <SectionLabel num="06" label={`Content Mix · ${contentAngles.weekly_distribution || 'hàng tuần'}`} dotStyle={{ background: 'var(--ms-amber)', width: 8, height: 8, borderRadius: '50%' }} />
        <div className="ms-content-grid">
          {/* Visual */}
          <div className="ms-ct-card">
            <div className="ms-ct-card-top visual">
              <div className="ms-ct-type-label visual">Visual</div>
              <div className="ms-ct-count">{contentAngles.visual?.length ?? 0}×</div>
            </div>
            <div className="ms-ct-card-body">
              {contentAngles.visual?.[0] && (
                <div className="ms-ct-example-text">"{contentAngles.visual[0]}"</div>
              )}
              <div className="ms-ct-direction">
                <strong>Định hướng:</strong> Tập trung vào cảm xúc và hình ảnh thương hiệu nhất quán.
              </div>
            </div>
          </div>
          {/* Story */}
          <div className="ms-ct-card">
            <div className="ms-ct-card-top story">
              <div className="ms-ct-type-label story">Story</div>
              <div className="ms-ct-count">{contentAngles.story?.length ?? 0}×</div>
            </div>
            <div className="ms-ct-card-body">
              {contentAngles.story?.[0] && (
                <div className="ms-ct-example-text">"{contentAngles.story[0]}"</div>
              )}
              <div className="ms-ct-direction">
                <strong>Định hướng:</strong> Kể chuyện để xây dựng trust và kết nối persona.
              </div>
            </div>
          </div>
          {/* Action */}
          <div className="ms-ct-card">
            <div className="ms-ct-card-top action">
              <div className="ms-ct-type-label action">Action</div>
              <div className="ms-ct-count">{contentAngles.action?.length ?? 0}×</div>
            </div>
            <div className="ms-ct-card-body">
              {contentAngles.action?.[0] && (
                <div className="ms-ct-example-text">"{contentAngles.action[0]}"</div>
              )}
              <div className="ms-ct-direction">
                <strong>Định hướng:</strong> Call-to-action rõ ràng, thúc đẩy chuyển đổi trực tiếp.
              </div>
            </div>
          </div>
        </div>
      </Band>

      {/* ── 7. LỜI KHUYÊN ─────────────────────────────────────── */}
      <Band color="paper">
        <SectionLabel num="07" label="Lời khuyên" dotStyle={{ background: 'var(--ms-rose)', width: 8, height: 8, borderRadius: '50%' }} />
        <ProMaxAdviceGate
          subscriptionTier={subscriptionTier}
          className={`ms-cmo-gate${isPromax ? ' ms-cmo-gate--open' : ''}`}
          benefits={[
            'Việc cần làm, bẫy phổ biến & cơ hội ẩn',
            'Positioning statement chuẩn bài bản',
          ]}
        >
          <div className="ms-cmo-grid">
            <div className="ms-cmo-card must">
              <div className="ms-cmo-card-label">
                <Check size={14} strokeWidth={2.5} /> Việc phải làm
              </div>
              <div className="ms-cmo-card-text">{result.action_plan?.expert_advice.the_must_do}</div>
            </div>
            <div className="ms-cmo-card avoid">
              <div className="ms-cmo-card-label">
                <X size={14} strokeWidth={2.5} /> Cần tránh
              </div>
              <div className="ms-cmo-card-text">{result.action_plan?.expert_advice.common_pitfall}</div>
            </div>
            <div className="ms-cmo-card oppt">
              <div className="ms-cmo-card-label">
                <Zap size={14} strokeWidth={2.5} /> Cơ hội ẩn
              </div>
              <div className="ms-cmo-card-text">{result.action_plan?.expert_advice.hidden_opportunity}</div>
            </div>
          </div>
          <div className="ms-final-positioning">
            <div className="ms-fp-label">Positioning Statement</div>
            <div className="ms-fp-text">
              &ldquo;{renderMarkdownBoldSegments(result.conclusion?.positioning_statement)}
              &rdquo;
            </div>
            <div className="ms-fp-underline" />
          </div>
        </ProMaxAdviceGate>
      </Band>

    </div>
  );
};

export default MastermindStrategyEditorial;
