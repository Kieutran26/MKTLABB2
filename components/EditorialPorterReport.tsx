import React from 'react';
import { PorterAnalysisResult, PorterForce } from '../types';
import './porter-report-editorial.css';

/** "Tiêu đề: mô tả" → in đậm phần trước dấu hai chấm (giống mock roadmap). */
function ActionRoadmapTaskLine({ task }: { task: string }) {
  const colon = task.indexOf(':');
  if (colon > 0 && colon < task.length - 1) {
    const title = task.slice(0, colon).trim();
    const body = task.slice(colon + 1).trim();
    return (
      <div className="ar-task-text">
        <strong>{title}</strong>
        {`: ${body}`}
      </div>
    );
  }
  return <div className="ar-task-text">{task}</div>;
}

const PORTER_ROADMAP_COLUMN_NOTES = [
  'Không chạy ads cho đến khi có đủ nền tảng.',
  'Đánh giá CPL và chọn angle chiến thắng để scale tháng 3.',
  'Mục tiêu: lead đủ chất lượng và hoàn tất vòng đo–tối ưu trong 90 ngày.',
] as const;

interface Props {
  data: PorterAnalysisResult;
  nganh_hang?: string;
  thi_truong?: string;
}

const EditorialPorterReport: React.FC<Props> = ({ data, nganh_hang, thi_truong }) => {
  const { forces, advice } = data;

  // Radar: tọa độ nội bộ 0..chartInner; viewBox âm để nhãn trục (Cạnh tranh, Thay thế…) không bị cắt
  const chartInner = 240;
  const viewPad = 52;
  const viewBoxSize = chartInner + 2 * viewPad;
  const center = chartInner / 2;
  const radius = (chartInner / 2) * 0.8;
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

  /** Nhãn ngắn trên trục radar (ảnh mẫu) */
  const axisLabelsVi = ['Cạnh tranh', 'Đối thủ mới', 'Người mua', 'Nhà cung cấp', 'Thay thế'];

  const statusLabelVi = (status: string) => {
    if (status === 'High' || status === 'Extreme') return 'Cao';
    if (status === 'Medium') return 'TB';
    return 'Thấp';
  };

  const trendLabelVi = (trend: string) => {
    if (trend === 'Increasing') return 'Tăng ↑';
    if (trend === 'Decreasing') return 'Giảm ↓';
    return 'Ổn định →';
  };

  const pillToneClass = (status: string) => {
    if (status === 'High' || status === 'Extreme') return 'pr-radar-pill--high';
    if (status === 'Medium') return 'pr-radar-pill--med';
    return 'pr-radar-pill--low';
  };

  const forceCategoryEn = (f: PorterForce) => f.name.replace(/\s+/g, ' ').toUpperCase();

  const trendLineVi = (trend: string) => {
    if (trend === 'Increasing') return '↑ Xu hướng: Tăng';
    if (trend === 'Decreasing') return '↓ Xu hướng: Giảm';
    return '→ Xu hướng: Ổn định';
  };

  const getStrategyTitleVi = (strategy: string) => {
    switch (strategy) {
      case 'Cost Leadership': return 'Lãnh đạo chi phí — cạnh tranh nhờ quy mô';
      case 'Differentiation': return 'Khác biệt hóa — không cạnh tranh về giá';
      case 'Focus/Niche': return 'Tập trung trọng điểm — chiếm lĩnh phân khúc';
      default: return strategy;
    }
  };

  const tagSnippet = (text: string, max = 52) => {
    const t = text.trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
  };

  const ForceDetailCard = ({ f, index }: { f: PorterForce; index: number }) => {
    const tone = getForceColor(index);
    const raw = f.determinants.filter((d) => d.trim().length > 0);
    const boxes = raw.slice(0, 2);
    return (
      <article className="pf-fc-card">
        <div className="pf-fc-head">
          <span className="pf-fc-cat" style={{ color: tone }}>
            {forceCategoryEn(f)}
          </span>
          <div className="pf-fc-scorewrap">
            <span className="pf-fc-score-num" style={{ color: tone }}>
              {f.score}
            </span>
            <span className="pf-fc-score-max">/10</span>
          </div>
        </div>
        <h3 className="pf-fc-title">{f.name_vi}</h3>
        {boxes.length > 0 && (
          <div className="pf-fc-tags">
            {boxes.map((d, di) => (
              <span className="pf-fc-tag" key={di}>
                {tagSnippet(d)}
              </span>
            ))}
          </div>
        )}
        <div className="pf-fc-boxes">
          {boxes.length > 0 ? (
            boxes.map((d, di) => (
              <div className="pf-fc-box" key={di}>
                {d}
              </div>
            ))
          ) : (
            <div className="pf-fc-box pf-fc-box--muted">
              {f.trend_reason?.trim() || '—'}
            </div>
          )}
        </div>
        <div className="pf-fc-divider" />
        <div className="pf-fc-action-label">Hành động đề xuất</div>
        <p className="pf-fc-action-body">{f.strategic_action}</p>
        <div className={`pf-fc-trend trend ${getTrendClass(f.trend)}`}>{trendLineVi(f.trend)}</div>
      </article>
    );
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

      {/* RADAR + CHI TIẾT — layout ảnh 2 */}
      <section className="pr-radar-section a" style={{ animationDelay: '0.4s' }}>
        <div className="pr-radar-head">
          <div className="pr-radar-head-dot" aria-hidden />
          <h2 className="pr-radar-head-title">Radar chart — Hình dạng nguy hiểm</h2>
        </div>
        <div className="pr-radar-grid">
          <div className="pr-radar-chart">
            <svg
              className="pr-radar-svg"
              width={chartInner}
              height={chartInner}
              viewBox={`-${viewPad} -${viewPad} ${viewBoxSize} ${viewBoxSize}`}
              overflow="visible"
            >
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
                  stroke="rgba(15, 15, 13, 0.08)"
                  strokeWidth="0.75"
                />
              ))}
              {forces.map((_, i) => {
                const p = getPoint(10, i, radius);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={p.x}
                    y2={p.y}
                    stroke="rgba(15, 15, 13, 0.08)"
                    strokeWidth="0.75"
                  />
                );
              })}
              <polygon
                points={polygonPoints}
                fill="rgba(193, 127, 42, 0.1)"
                stroke="var(--ink)"
                strokeWidth="1.25"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={getForceColor(i)}
                  stroke="var(--paper)"
                  strokeWidth="1"
                />
              ))}
              {forces.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const lr = radius * 1.22;
                const lx = center + lr * Math.cos(angle);
                const ly = center + lr * Math.sin(angle);
                return (
                  <text
                    key={`lbl-${i}`}
                    x={lx}
                    y={ly}
                    className="pr-radar-axis-label"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {axisLabelsVi[i]}
                  </text>
                );
              })}
            </svg>
          </div>
          <div className="pr-radar-list" role="list">
            {forces.map((f, i) => (
              <div className="pr-radar-row" key={f.name} role="listitem">
                <div className="pr-radar-row-dot" style={{ background: getForceColor(i) }} aria-hidden />
                <div className="pr-radar-row-main">
                  <div className="pr-radar-row-vi">{f.name_vi}</div>
                  <div className="pr-radar-row-en">{f.name}</div>
                </div>
                <div className="pr-radar-row-side">
                  <div className="pr-radar-row-score">
                    {f.score}
                    <span className="pr-radar-row-score-suffix">/10</span>
                  </div>
                  <div className={`pr-radar-pill ${pillToneClass(f.status)}`}>
                    {statusLabelVi(f.status)} · {trendLabelVi(f.trend)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHÂN TÍCH CHI TIẾT 5 LỰC — layout ảnh 2 (3 + 2 căn giữa) */}
      <section className="pf-forces-detail a" style={{ animationDelay: '0.5s' }}>
        <div className="pf-forces-detail-head">
          <span className="pf-forces-detail-dot" aria-hidden />
          <h2 className="pf-forces-detail-title">Phân tích chi tiết 5 lực lượng</h2>
        </div>
        <div className="pf-forces-detail-grid">
          {forces.map((f, i) => (
            <ForceDetailCard key={f.name} f={f} index={i} />
          ))}
        </div>
      </section>

      {/* STRATEGY BLOCK — Layout ảnh 2 (Expert dark card) */}
      <section className="strategy-section a" style={{ animationDelay: '0.7s' }}>
        <div className="sb-header">
          <div className="sb-header-dot" />
          <h2 className="sb-header-title">CHIẾN LƯỢC CẠNH TRANH ĐỀ XUẤT</h2>
        </div>
        
        <div className="strategy-block">
          <div className="sb-eyebrow">CHIẾN LƯỢC ĐƯỢC CHỌN</div>
          <div className="sb-badge">{advice.recommended_strategy}</div>
          <h3 className="sb-title">{getStrategyTitleVi(advice.recommended_strategy)}</h3>
          <p className="sb-body">{advice.strategy_rationale}</p>
          
          <div className="sb-divider" />
          
          <div className="sb-grid">
            <div className="sb-col">
              <div className="sb-col-label">LỰC NGUY HIỂM NHẤT</div>
              <div className="sb-col-val">
                {advice.biggest_threat.force_name} — {advice.biggest_threat.score}/10
              </div>
              <p className="sb-col-body">
                {advice.biggest_threat.reason}. {advice.biggest_threat.consequence}
              </p>
            </div>
            <div className="sb-col">
              <div className="sb-col-label">LỰC LỢI THẾ NHẤT</div>
              <div className="sb-col-val">
                {advice.biggest_opportunity.force_name} — {advice.biggest_opportunity.score}/10
              </div>
              <p className="sb-col-body">
                {advice.biggest_opportunity.reason}. {advice.biggest_opportunity.exploitation_plan}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CMO EXPERT NOTE — Layout ảnh 2 (4 cards with markers) */}
      <section className="cmo-section a" style={{ animationDelay: '0.8s' }}>
        <div className="cmo-header">
          <div className="cmo-label">Lời khuyên chiến lược từ CMO</div>
          <div className="cmo-sig">Expert Verdict</div>
        </div>

        <div className="cmo-grid">
          <div className="cmo-card cmo-card--must">
            <div className="cmo-num">I.</div>
            <div className="cmo-title">Điều quan trọng nhất phải làm đúng</div>
            <p className="cmo-body">
              {advice.critical_must_do.factor}. {advice.critical_must_do.why_leverage}
            </p>
            <div className="cmo-tag-wrap">
              <span className="cmo-tag">Làm ngay · Không thương lượng</span>
            </div>
          </div>

          <div className="cmo-card cmo-card--pitfall">
            <div className="cmo-num">II.</div>
            <div className="cmo-title">Cạm bẫy lớn nhất cần tránh</div>
            <p className="cmo-body">
              {advice.biggest_pitfall.mistake}. {advice.biggest_pitfall.example_consequence}
            </p>
            <div className="cmo-tag-wrap">
              <span className="cmo-tag">Tuyệt đối tránh</span>
            </div>
          </div>

          <div className="cmo-card cmo-card--opp">
            <div className="cmo-num">III.</div>
            <div className="cmo-title">Cơ hội đang bị bỏ ngỏ</div>
            <p className="cmo-body">
              {advice.untapped_opportunity.gap}. {advice.untapped_opportunity.how_to_capture}
            </p>
            <div className="cmo-tag-wrap">
              <span className="cmo-tag">Cơ hội chiến lược dài hạn</span>
            </div>
          </div>

          <div className="cmo-card cmo-card--priority">
            <div className="cmo-num">IV.</div>
            <div className="cmo-title">Nếu chỉ được làm 1 điều trong 30 ngày</div>
            <p className="cmo-body">
              {advice.action_plan.month_1[0] || 'Tập trung triển khai các hành động ưu tiên giai đoạn 1.'}
            </p>
            <div className="cmo-tag-wrap">
              <span className="cmo-tag">Ưu tiên số 1</span>
            </div>
          </div>
        </div>
      </section>

      {/* ACTION ROADMAP — khung kem + header chấm cam (đồng bộ mock 30·60·90) */}
      <div className="action-roadmap-box a" style={{ animationDelay: '0.9s' }}>
        <header className="action-roadmap-head">
          <div className="action-roadmap-head-inner">
            <span className="action-roadmap-dot" aria-hidden />
            <h2 className="action-roadmap-title">Ưu tiên hành động — 30 · 60 · 90 ngày</h2>
          </div>
        </header>
        <div className="action-head">
          <div className="ah-col">Tháng 1 — Phòng thủ & nền tảng</div>
          <div className="ah-col">Tháng 2 — Tấn công & khác biệt hóa</div>
          <div className="ah-col">Tháng 3 — Tối ưu & đánh giá</div>
        </div>
        <div className="action-rows">
          <div className="ar-col">
            {advice.action_plan.month_1.map((task, idx) => (
              <div className="ar-item" key={idx}>
                <span className="ar-dot dot-r" aria-hidden />
                <ActionRoadmapTaskLine task={task} />
              </div>
            ))}
            <p className="ar-note">{PORTER_ROADMAP_COLUMN_NOTES[0]}</p>
          </div>
          <div className="ar-col">
            {advice.action_plan.month_2.map((task, idx) => (
              <div className="ar-item" key={idx}>
                <span className="ar-dot dot-o" aria-hidden />
                <ActionRoadmapTaskLine task={task} />
              </div>
            ))}
            <p className="ar-note">{PORTER_ROADMAP_COLUMN_NOTES[1]}</p>
          </div>
          <div className="ar-col">
            {advice.action_plan.month_3.map((task, idx) => (
              <div className="ar-item" key={idx}>
                <span className="ar-dot dot-g" aria-hidden />
                <ActionRoadmapTaskLine task={task} />
              </div>
            ))}
            <p className="ar-note">{PORTER_ROADMAP_COLUMN_NOTES[2]}</p>
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
