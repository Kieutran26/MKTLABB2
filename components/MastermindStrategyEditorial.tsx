import React from 'react';
import './MastermindStrategyEditorial.css';
import { MastermindStrategy } from '../types';

interface MastermindStrategyEditorialProps {
  strategy: MastermindStrategy;
}

const MastermindStrategyEditorial: React.FC<MastermindStrategyEditorialProps> = ({ strategy }) => {
  const { result } = strategy;

  if (!result) return null;

  return (
    <div className="ms-editorial-wrapper">
      {/* HEADER */}
      <div className="ms-doc-header">
        <div>
          <div className="ms-doc-eyebrow">Chiến lược Mastermind · Hệ thống</div>
          <div className="ms-doc-title">
            {strategy.name.split(' - ')[0]} × <em>{result.brand_context?.persona.demographics || 'Khách hàng mục tiêu'}</em>
          </div>
        </div>
        <div className="ms-doc-meta">
          <span className="ms-doc-date">Q{Math.floor(new Date(strategy.createdAt).getMonth() / 3) + 1} · {new Date(strategy.createdAt).getFullYear()}</span>
          <span className="ms-doc-tag">Chiến lược tổng thể</span>
        </div>
      </div>

      {/* BIG IDEA */}
      <div className="ms-big-idea">
        <div className="ms-bi-label">Big Idea · Core Message</div>
        <div className="ms-bi-quote">
          "{result.coreMessage}"
        </div>
        <div className="ms-bi-sub">
          {result.conclusion?.summary || "Chiến lược tập trung vào việc xây dựng giá trị cốt lõi và kết nối sâu sắc với khách hàng mục tiêu."}
        </div>
      </div>

      {/* INSIGHT STRIP */}
      <div className="ms-insight-strip">
        <div className="ms-ins-item">
          <div className="ms-ins-num">01</div>
          <div className="ms-ins-label">Core Insight</div>
          <div className="ms-ins-val">{result.insight}</div>
        </div>
        <div className="ms-ins-item">
          <div className="ms-ins-num">02</div>
          <div className="ms-ins-label">Baseline hiện tại</div>
          <div className="ms-ins-val">
            {result.strategic_goals?.smart_goals[0]?.baseline || "Chưa có số liệu cụ thể"}
          </div>
        </div>
        <div className="ms-ins-item">
          <div className="ms-ins-num">03</div>
          <div className="ms-ins-label">Mục tiêu chiến dịch</div>
          <div className="ms-ins-val">
            {result.strategic_goals?.smart_goals[0]?.target || "Tăng trưởng bền vững"}
          </div>
        </div>
      </div>

      {/* PERSONA + COMPETITIVE */}
      <div className="ms-two-col">
        {/* Persona Section */}
        <div className="ms-section">
          <div className="ms-section-head">
            <div className="ms-section-icon"></div>
            <span className="ms-section-title">Persona & Hành trình</span>
          </div>
          <div className="ms-persona-name">{result.brand_context?.persona.psychographics.split(' · ')[0] || 'Khách hàng mục tiêu'}</div>
          <div className="ms-persona-tag">
            {result.brand_context?.persona.demographics}<br />
            {result.brand_context?.persona.behaviors}
          </div>
          <div className="ms-persona-body">
            {result.brand_context?.persona.psychographics}
          </div>
          <div style={{ marginBottom: '6px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ms-ink-3)', fontWeight: 500 }}>
            Nỗi đau chính
          </div>
          {result.brand_context?.pain_gain.ranked_pains.slice(0, 3).map((pain, i) => (
            <div key={i} className="ms-pain-item">
              <div className={`ms-pain-dot ${pain.impact === 'High' ? 'red' : ''}`}></div>
              {pain.content}
            </div>
          ))}
          <div style={{ marginTop: '0.875rem', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ms-ink-3)', fontWeight: 500 }}>
            Khao khát thật sự
          </div>
          {result.brand_context?.pain_gain.top_gains.slice(0, 2).map((gain, i) => (
            <div key={i} className="ms-pain-item">
              <div className="ms-pain-dot"></div>
              {gain}
            </div>
          ))}
        </div>

        {/* Competitive Space */}
        <div className="ms-section">
          <div className="ms-section-head">
            <div className="ms-section-icon warn"></div>
            <span className="ms-section-title">Competitive Space</span>
          </div>
          <div className="ms-comp-body">
            {result.brand_context?.positioning.current_state}
          </div>
          <div className="ms-comp-body" style={{ marginBottom: '0.5rem', fontSize: '11px', color: 'var(--ms-ink-3)' }}>
            Vị thế cạnh tranh: {result.brand_context?.positioning.competitive_map.x_axis} & {result.brand_context?.positioning.competitive_map.y_axis}
          </div>
          
          <div className="ms-comp-axis">
            <div className="ms-axis-row">
              <div className="ms-axis-label">Vị thế</div>
              <div className="ms-axis-track">
                <div className="ms-axis-fill" style={{ width: `${result.brand_context?.positioning.competitive_map.brand_position.x}%` }}></div>
                <div className="ms-axis-marker ms-marker-us" style={{ left: `${result.brand_context?.positioning.competitive_map.brand_position.x}%` }}></div>
                <div className="ms-axis-marker ms-marker-them" style={{ left: '50%' }}></div>
              </div>
            </div>
          </div>

          <div className="ms-axis-legend" style={{ marginTop: '12px' }}>
            <div className="ms-leg"><div className="ms-leg-dot" style={{ background: 'var(--ms-accent)' }}></div>Thương hiệu</div>
            <div className="ms-leg"><div className="ms-leg-dot" style={{ background: 'var(--ms-ink-4)' }}></div>Đối thủ trung bình</div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: 'var(--ms-accent-light)', borderRadius: '3px', borderLeft: '2px solid var(--ms-accent)' }}>
            <div style={{ fontSize: '11px', color: 'var(--ms-accent)', fontWeight: 500, marginBottom: '3px' }}>Differentiator</div>
            <div style={{ fontSize: '12px', color: 'var(--ms-ink-2)', lineHeight: 1.6 }}>
              {result.brand_context?.positioning.differentiator}
            </div>
          </div>
        </div>
      </div>

      {/* ROADMAP */}
      <div className="ms-roadmap">
        <div className="ms-section-head" style={{ marginBottom: '1.25rem' }}>
          <div className="ms-section-icon"></div>
          <span className="ms-section-title">Lộ trình 90 ngày</span>
        </div>
        <div className="ms-roadmap-grid">
          {result.strategic_goals?.roadmap_90day.months.map((month, i) => (
            <div key={i} className="ms-rm-col">
              <div className="ms-rm-month">{month.month_name}</div>
              <div className="ms-rm-theme">{month.priority}</div>
              {month.actions.slice(0, 3).map((action, j) => (
                <div key={j} className="ms-rm-item">
                  <div className="ms-rm-dot"></div>
                  {action}
                </div>
              ))}
              <div className="ms-rm-kpi">Target: {month.kpi}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CHANNEL */}
      <div className="ms-channel-section">
        <div className="ms-section-head" style={{ marginBottom: '1.25rem' }}>
          <div className="ms-section-icon"></div>
          <span className="ms-section-title">Kênh truyền thông & KPI</span>
        </div>
        <div className="ms-channel-grid">
          {Object.entries(result.strategic_goals?.resource_allocation.budget_split || {}).map(([channel, data], i) => (
            <div key={i} className="ms-ch-card">
              <div className="ms-ch-top">
                <span className="ms-ch-name">{channel}</span>
                <span className="ms-ch-pct">{data.percent}</span>
              </div>
              <div className="ms-ch-bar">
                <div className="ms-ch-fill" style={{ width: data.percent }}></div>
              </div>
              <div className="ms-ch-kpi">
                KPI: {data.kpi}<br />
                {data.rationale}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT CALENDAR / MIX */}
      <div className="ms-content-section">
        <div className="ms-section-head" style={{ marginBottom: '1.25rem' }}>
          <div className="ms-section-icon"></div>
          <span className="ms-section-title">Content Mix hàng tuần · {result.contentAngles.weekly_distribution}</span>
        </div>
        <div className="ms-content-tabs">
          <div className="ms-ct-tab">
            <div className="ms-ct-type visual">Visual</div>
            <div className="ms-ct-ratio">{result.contentAngles.visual.length}×</div>
            <div className="ms-ct-example">"{result.contentAngles.visual[0]}"</div>
            <div className="ms-ct-hook"><strong>Định hướng:</strong> Tập trung vào cảm xúc và hình ảnh thương hiệu nhất quán.</div>
          </div>
          <div className="ms-ct-tab">
            <div className="ms-ct-type story">Story</div>
            <div className="ms-ct-ratio">{result.contentAngles.story.length}×</div>
            <div className="ms-ct-example">"{result.contentAngles.story[0]}"</div>
            <div className="ms-ct-hook"><strong>Định hướng:</strong> Kể chuyện để xây dựng trust và kết nối persona.</div>
          </div>
          <div className="ms-ct-tab">
            <div className="ms-ct-type action">Action</div>
            <div className="ms-ct-ratio">{result.contentAngles.action.length}×</div>
            <div className="ms-ct-example">"{result.contentAngles.action[0]}"</div>
            <div className="ms-ct-hook"><strong>Định hướng:</strong> Call-to-action rõ ràng, thúc đẩy chuyển đổi trực tiếp.</div>
          </div>
        </div>
      </div>

      {/* CMO NOTE */}
      <div className="ms-cmo-section">
        <div className="ms-cmo-head">
          <div className="ms-cmo-label">Lời khuyên từ Giám đốc Marketing (CMO)</div>
          <div className="ms-cmo-sig">Expert Note</div>
        </div>
        <div className="ms-cmo-grid">
          <div className="ms-cmo-item">
            <div className="ms-cmo-num">I.</div>
            <div className="ms-cmo-text"><strong>Việc cần làm:</strong> {result.action_plan?.expert_advice.the_must_do}</div>
          </div>
          <div className="ms-cmo-item">
            <div className="ms-cmo-num">II.</div>
            <div className="ms-cmo-text"><strong>Cần tránh:</strong> {result.action_plan?.expert_advice.common_pitfall}</div>
          </div>
          <div className="ms-cmo-item">
            <div className="ms-cmo-num">III.</div>
            <div className="ms-cmo-text"><strong>Cơ hội:</strong> {result.action_plan?.expert_advice.hidden_opportunity}</div>
          </div>
        </div>
        <div className="ms-cmo-quote">
          "{result.conclusion?.positioning_statement}"
        </div>
      </div>
    </div>
  );
};

export default MastermindStrategyEditorial;
