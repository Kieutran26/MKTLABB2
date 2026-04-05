import React from 'react';
import { PorterAnalysisResult, PorterForce } from '../types';
import './porter-report-editorial.css';

interface Props {
  data: PorterAnalysisResult;
  nganh_hang?: string;
  thi_truong?: string;
}

const EditorialPorterReport: React.FC<Props> = ({ data, nganh_hang, thi_truong }) => {
  const { forces, advice } = data;

  // Radar Chart Logic
  const size = 200;
  const center = size / 2;
  const radius = (size / 2) * 0.8;
  const angleStep = (Math.PI * 2) / 5;

  const getPoint = (score: number, index: number, r: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const distance = (score / 10) * r;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  const points = forces.map((f, i) => getPoint(f.score, i, radius));
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const getForceColor = (index: number) => {
    const colors = ['--f1', '--f2', '--f3', '--f4', '--f5'];
    return `var(${colors[index % colors.length]})`;
  };

  const getVerdictClass = (verdict: string) => {
    if (verdict.includes('Blue Ocean') || verdict.includes('Attractive')) return 'tag-g';
    if (verdict.includes('Unattractive') || verdict.includes('Red Ocean')) return 'tag-r';
    return 'tag-w';
  };

  const getLevelClass = (status: string) => {
    if (status === 'High' || status === 'Extreme') return 'lv-h';
    if (status === 'Medium') return 'lv-m';
    return 'lv-l';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'Increasing') return '↗';
    if (trend === 'Decreasing') return '↘';
    return '→';
  };

  const getTrendClass = (trend: string) => {
    if (trend === 'Increasing') return 'trend-up';
    if (trend === 'Decreasing') return 'trend-down';
    return 'trend-flat';
  };

  return (
    <div className="porter-report">
      {/* HEADER */}
      <header className="doc-header a" style={{ animationDelay: '0.1s' }}>
        <div>
          <div className="eyebrow">Competitive Intensity Report</div>
          <h1 className="doc-title">
            Porter’s <em>Five Forces</em> Analysis
          </h1>
        </div>
        <div className="doc-tags">
          <span className="tag" style={{ background: 'var(--paper-3)', color: 'var(--ink-2)' }}>
            INDUSTRY: {nganh_hang || 'Unknown'}
          </span>
          <span className="tag" style={{ background: 'var(--ink)', color: 'white' }}>
            MARKET: {thi_truong || 'Vietnam'}
          </span>
        </div>
      </header>

      {/* OVERALL */}
      <section className="overall a" style={{ animationDelay: '0.2s' }}>
        <div>
          <div className="ov-label">Overall Industry Assessment</div>
          <h2 className="ov-verdict">{data.overall_verdict}</h2>
          <p className="ov-desc">{data.verdict_description}</p>
        </div>
        <div className="ov-score">
          <span className="ov-score-num">{data.total_threat_score}</span>
          <div className="ov-score-label">Threat / 50</div>
        </div>
      </section>

      {/* MATRIX TABLE */}
      <div className="sh a" style={{ animationDelay: '0.3s' }}>
        <div className="sh-dot" style={{ background: 'var(--ink)' }}></div>
        <div className="sh-title">Force Intensity Matrix</div>
      </div>

      <div className="matrix a" style={{ animationDelay: '0.35s' }}>
        <div className="mh">
          <div className="mh-c">Force Component</div>
          <div className="mh-c">Score</div>
          <div className="mh-c">Level</div>
          <div className="mh-c">Trend</div>
          <div className="mh-c">Strategic Action</div>
        </div>
        {forces.map((f, i) => (
          <div className="mr" key={f.name}>
            <div className="mc">
              <span className="mc-name">{f.name_vi}</span>
            </div>
            <div className="mc">
              <span className="sc-badge" style={{ color: getForceColor(i) }}>{f.score}</span>
              <span style={{ fontSize: '10px', color: 'var(--ink-4)', marginLeft: '2px' }}>/10</span>
            </div>
            <div className="mc">
              <span className={`lv ${getLevelClass(f.status)}`}>{f.status}</span>
            </div>
            <div className="mc">
              <div className={`trend ${getTrendClass(f.trend)}`}>
                <span>{getTrendIcon(f.trend)}</span>
                <span>{f.trend}</span>
              </div>
            </div>
            <div className="mc">
              <p className="action-text">{f.strategic_action}</p>
            </div>
          </div>
        ))}
      </div>

      {/* RADAR & LEGEND */}
      <div className="radar-wrap a" style={{ animationDelay: '0.4s' }}>
        <div className="radar-svg-wrap">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background Polygons */}
            {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
              <polygon
                key={step}
                points={forces
                  .map((_, i) => {
                    const p = getPoint(10 * step, i, radius);
                    return `${p.x},${p.y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="var(--rule)"
                strokeWidth="0.5"
              />
            ))}
            {/* Axis Lines */}
            {forces.map((_, i) => {
              const p = getPoint(10, i, radius);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={p.x}
                  y2={p.y}
                  stroke="var(--rule)"
                  strokeWidth="0.5"
                />
              );
            })}
            {/* Data Polygon */}
            <polygon
              points={polygonPoints}
              fill="rgba(15, 15, 13, 0.05)"
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            {/* Data Points */}
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--ink)" />
            ))}
          </svg>
        </div>
        <div className="radar-legend">
          {forces.map((f, i) => (
            <div className="rl-item" key={f.name}>
              <div className="rl-dot" style={{ background: getForceColor(i) }}></div>
              <div className="rl-name">{f.name_vi}</div>
              <div className="rl-score">{f.score}</div>
              <span className={`rl-lv lv ${getLevelClass(f.status)}`}>{f.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FORCE CARDS */}
      <div className="forces-grid a" style={{ animationDelay: '0.5s' }}>
        {forces.slice(0, 3).map((f, i) => (
          <div className="fc" key={f.name}>
            <div className="fc-top">
              <div className="fc-eyebrow" style={{ color: getForceColor(i) }}>Force 0{i + 1}</div>
              <div className="fc-score" style={{ color: getForceColor(i) }}>{f.score}</div>
            </div>
            <div className="fc-name">{f.name_vi}</div>
            <div className="fc-tags">
              {f.determinants.slice(0, 2).map((d, di) => (
                <span className="fc-tag" key={di}>{d}</span>
              ))}
            </div>
            <div className="fc-action">
              <div className="fc-action-label">Strategic Lever</div>
              {f.strategic_action}
            </div>
          </div>
        ))}
      </div>

      <div className="forces-grid-2 a" style={{ animationDelay: '0.6s' }}>
        {forces.slice(3, 5).map((f, i) => (
          <div className="fc" key={f.name}>
            <div className="fc-top">
              <div className="fc-eyebrow" style={{ color: getForceColor(i + 3) }}>Force 0{i + 4}</div>
              <div className="fc-score" style={{ color: getForceColor(i + 3) }}>{f.score}</div>
            </div>
            <div className="fc-name">{f.name_vi}</div>
            <div className="fc-tags">
              {f.determinants.slice(0, 2).map((d, di) => (
                <span className="fc-tag" key={di}>{d}</span>
              ))}
            </div>
            <div className="fc-action">
              <div className="fc-action-label">Strategic Lever</div>
              {f.strategic_action}
            </div>
          </div>
        ))}
      </div>

      {/* STRATEGY BLOCK */}
      <section className="strategy-block a" style={{ animationDelay: '0.7s' }}>
        <div className="sb-eyebrow">Recommended Competitive Architecture</div>
        <div className="sb-badge">{advice.recommended_strategy}</div>
        <h3 className="sb-title">Primary Strategic Path</h3>
        <p className="sb-body">{advice.strategy_rationale}</p>
        <div className="sb-grid">
          <div>
            <div className="sb-col-label">Leverage Point</div>
            <div className="sb-col-val">{advice.biggest_opportunity.force_name}</div>
            <div className="sb-col-body">{advice.biggest_opportunity.reason}</div>
          </div>
          <div>
            <div className="sb-col-label">Execution Risk</div>
            <div className="sb-col-val">Potential Pitfall</div>
            <div className="sb-col-body">{advice.biggest_pitfall.mistake}</div>
          </div>
        </div>
      </section>

      {/* CMO EXPERT NOTE */}
      <section className="cmo-wrap a" style={{ animationDelay: '0.8s' }}>
        <div className="cmo-header">
          <div className="cmo-label">Lời khuyên chiến lược từ CMO</div>
          <div className="cmo-sig">Expert Verdict</div>
        </div>

        <div className="cmo-grid">
          <div className="cmo-card priority">
            <div className="cmo-num">01</div>
            <div className="cmo-title">Critical Must-Do</div>
            <p className="cmo-body">{advice.critical_must_do.factor}. {advice.critical_must_do.why_leverage}</p>
            <span className="cmo-tag" style={{ background: 'var(--f3)', color: 'white' }}>High Impact</span>
          </div>
          <div className="cmo-card risk">
            <div className="cmo-num">02</div>
            <div className="cmo-title">Highest Threat: {advice.biggest_threat.force_name}</div>
            <p className="cmo-body">{advice.biggest_threat.reason}. {advice.biggest_threat.consequence}</p>
            <span className="cmo-tag" style={{ background: 'rgba(138, 26, 26, 0.1)', color: 'var(--f1)' }}>Urgent Defense</span>
          </div>
        </div>

        <div className="cmo-grid">
          <div className="cmo-card opp">
            <div className="cmo-num">03</div>
            <div className="cmo-title">Untapped Opportunity</div>
            <p className="cmo-body">{advice.untapped_opportunity.gap}. {advice.untapped_opportunity.how_to_capture}</p>
            <span className="cmo-tag" style={{ background: 'rgba(193, 127, 42, 0.1)', color: 'var(--f4)' }}>Growth Potential</span>
          </div>
          <div className="cmo-card">
            <div className="cmo-num">04</div>
            <div className="cmo-title">Strategic Defensive</div>
            <p className="cmo-body">{advice.biggest_threat.defensive_action}</p>
          </div>
        </div>
      </section>

      {/* ACTION TABLE */}
      <div className="sh a" style={{ animationDelay: '0.9s' }}>
        <div className="sh-dot" style={{ background: 'var(--ink)' }}></div>
        <div className="sh-title">Implementation Roadmap (90 Days)</div>
      </div>

      <div className="action-strip a" style={{ animationDelay: '0.95s' }}>
        <div className="action-head">
          <div className="ah-col">Month 01: Defense</div>
          <div className="ah-col">Month 02: Attack</div>
          <div className="ah-col">Month 03: Optimize</div>
        </div>
        <div className="action-rows">
          <div className="ar-col">
            {advice.action_plan.month_1.map((task, idx) => (
              <div className="ar-item" key={idx}>
                <div className="ar-dot dot-r"></div>
                <div>{task}</div>
              </div>
            ))}
          </div>
          <div className="ar-col">
            {advice.action_plan.month_2.map((task, idx) => (
              <div className="ar-item" key={idx}>
                <div className="ar-dot dot-w"></div>
                <div>{task}</div>
              </div>
            ))}
          </div>
          <div className="ar-col">
            {advice.action_plan.month_3.map((task, idx) => (
              <div className="ar-item" key={idx}>
                <div className="ar-dot dot-g"></div>
                <div>{task}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VERDICT LINE */}
      <div className="verdict-line a" style={{ animationDelay: '1.0s' }}>
        "{advice.final_verdict}"
      </div>

      {/* UNKNOWNS */}
      {advice.unknowns.length > 0 && (
        <section className="unknown-block a" style={{ animationDelay: '1.1s' }}>
          <div className="unk-label">Data Limitations & Required Field Research</div>
          <div className="unk-grid">
            {advice.unknowns.map((unk, idx) => (
              <div className="unk-item" key={idx}>
                <span className="unk-dash">—</span>
                <div>{unk}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER BAR */}
      <div className="footer-bar a" style={{ animationDelay: '1.2s' }}>
        <div className="fb-c">
          <span className="fb-val">{data.total_threat_score}/50</span>
          <span className="fb-lbl">Threat Score</span>
        </div>
        <div className="fb-c">
          <span className="fb-val">{forces.find(f => f.score === Math.max(...forces.map(v => v.score)))?.name_vi.split(' ')[0]}</span>
          <span className="fb-lbl">Max Force</span>
        </div>
        <div className="fb-c">
          <span className="fb-val">{advice.recommended_strategy.split(' ')[0]}</span>
          <span className="fb-lbl">Strategy</span>
        </div>
        <div className="fb-c">
          <span className="fb-val">{new Date(data.generated_at).toLocaleDateString('vi-VN')}</span>
          <span className="fb-lbl">Analysis Date</span>
        </div>
      </div>
    </div>
  );
};

export default EditorialPorterReport;
