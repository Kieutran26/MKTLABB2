import React from 'react';
import { ArrowLeft, Check, AlertTriangle, XCircle, Info, Zap } from 'lucide-react';
import { IMCPlan } from '../types';
import './imc-planner-editorial.css';

interface IMCOutputEditorialProps {
  plan: IMCPlan;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

const IMCOutputEditorial: React.FC<IMCOutputEditorialProps> = ({ plan, onBack, onSave, saving, saved }) => {
  const formatVND = (num: number) => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' tỷ';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
    return num.toString();
  };

  const getPhaseClass = (phase: string) => {
    switch (phase.toUpperCase()) {
      case 'AWARE': return 'imc-badge-aware';
      case 'TRIGGER': return 'imc-badge-trigger';
      case 'CONVERT': return 'imc-badge-convert';
      default: return 'imc-badge-aware';
    }
  };

  const getWarningIcon = (text: string) => {
    if (text.includes('✅')) return <Check size={14} className="text-emerald-600" />;
    if (text.includes('⚠️')) return <AlertTriangle size={14} className="text-amber-500" />;
    if (text.includes('🔴') || text.includes('❌')) return <XCircle size={14} className="text-rose-600" />;
    if (text.includes('💡') || text.includes('🚀')) return <Zap size={14} className="text-blue-500" />;
    return <Info size={14} className="text-stone-400" />;
  };

  const cleanWarningText = (text: string) => {
    return text.replace(/[✅⚠️🔴❌💡🚀🛡️]/g, '').trim();
  };

  const allWarnings = [
    ...(plan.validation_warnings || []),
    ...(plan.golden_thread_warnings || [])
  ];

  return (
    <div className="imc-editorial-wrapper">

      <div className="imc-editorial-page">
        {/* HEADER */}
        <div className="imc-doc-header imc-anim">
          <div>
            <div className="imc-eyebrow">IMC Planner · Chiến lược tích hợp</div>
            <h1 className="imc-doc-title">
              {plan.brand}: <em>{plan.product}</em>
            </h1>
          </div>
          <div className="imc-doc-meta">
            <span className="imc-meta-tag imc-tag-green">{plan.industry}</span>
            <span className="imc-meta-tag imc-tag-blue">8 tuần</span>
            <span className="imc-meta-tag imc-tag-warm">{formatVND(plan.total_budget)} Budget</span>
          </div>
        </div>

        {/* WARNINGS */}
        {allWarnings.length > 0 && (
          <div className="imc-warning-block imc-anim" style={{ animationDelay: '0.1s' }}>
            <div className="imc-warn-head">
              <div className="imc-warn-icon"></div>
              <span className="imc-warn-title">Golden Thread Warnings</span>
            </div>
            <div className="imc-warn-grid">
              {allWarnings.map((warning, i) => {
                const icon = getWarningIcon(warning);
                const cleaned = cleanWarningText(warning);
                const parts = cleaned.split(':');
                
                return (
                  <div key={i} className="imc-warn-item" style={{ position: 'relative', paddingLeft: '24px' }}>
                    <div style={{ position: 'absolute', left: 0, top: '2px' }}>{icon}</div>
                    {parts.length > 1 ? (
                      <>
                        <span className="imc-warn-label">{parts[0]}</span>
                        {parts.slice(1).join(':')}
                      </>
                    ) : (
                      cleaned
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STRATEGIC FOUNDATION */}
        <div className="imc-anim" style={{ animationDelay: '0.2s', marginBottom: '1rem' }}>
          <div className="imc-sec-head">
            <div className="imc-sec-dot imc-sec-dot-g"></div>
            <span className="imc-sec-title">Strategic Foundation</span>
          </div>
          <div className="imc-sf-grid">
            <div className="imc-sf-col">
              <div className="imc-sf-label">Business Objective</div>
              <div className="imc-sf-body">{plan.strategic_foundation.business_obj}</div>
            </div>
            <div className="imc-sf-col">
              <div className="imc-sf-label">Marketing Objective</div>
              <div className="imc-sf-body">{plan.strategic_foundation.marketing_obj}</div>
            </div>
            <div className="imc-sf-col">
              <div className="imc-sf-label">Communication Objective</div>
              <div className="imc-sf-body">{plan.strategic_foundation.communication_obj}</div>
            </div>
          </div>
        </div>

        {/* COMPETITIVE ANGLE */}
        {plan.strategic_foundation.competitive_angle && (
          <div className="imc-comp-block imc-anim" style={{ animationDelay: '0.3s' }}>
            <div className="imc-comp-label">Competitive Angle</div>
            <div className="imc-comp-grid">
              <div>
                <div className="imc-comp-item-label">Đối thủ đang nói gì</div>
                <div className="imc-comp-item-text">{plan.strategic_foundation.competitive_angle.competitor_says}</div>
              </div>
              <div>
                <div className="imc-comp-item-label">Chúng ta nói gì khác</div>
                <div className="imc-comp-item-text">"{plan.strategic_foundation.competitive_angle.we_say_differently}"</div>
              </div>
              <div>
                <div className="imc-comp-item-label">Khoảng trắng chúng ta chiếm</div>
                <div className="imc-comp-item-text">{plan.strategic_foundation.competitive_angle.gap_we_occupy}</div>
              </div>
            </div>
            <div className="imc-comp-opportunity">
              <div className="imc-comp-opp-label">Chiến lược định vị dự kiến</div>
              Mỗi chiến dịch đều xoay quanh một USP duy nhất để tối ưu nhận diện trong tâm trí khách hàng.
            </div>
          </div>
        )}

        {/* EXECUTION MODEL */}
        <div className="imc-anim" style={{ animationDelay: '0.4s' }}>
          <div className="imc-sec-head">
            <div className="imc-sec-dot imc-sec-dot-w"></div>
            <span className="imc-sec-title">Execution Model</span>
          </div>
          <div className="imc-exec-grid">
            {plan.imc_execution.map((phase, i) => (
              <div key={i} className="imc-exec-col">
                <span className={`imc-phase-badge ${getPhaseClass(phase.phase)}`}>{phase.phase}</span>
                <div className="imc-exec-hook">"{phase.key_hook}"</div>
                <div className="imc-exec-channels">
                  <div className="imc-exec-ch-label">Kênh chính</div>
                  {phase.channels.map((ch, idx) => (
                    <div key={idx} className="imc-exec-ch-item">
                      <div className="imc-exec-bullet"></div>{ch}
                    </div>
                  ))}
                </div>
                {phase.execution_details && (
                  <>
                    <div className="imc-exec-week">
                      <span className="imc-week-label">Thời gian</span>
                      <span className="imc-week-val">{phase.execution_details.week_range}</span>
                    </div>
                    <div className="imc-budget-row">
                      <div className="imc-bud-card">
                        <div className="imc-bud-label">Production</div>
                        <div className="imc-bud-val">{formatVND(phase.execution_details.budget_split.production)}</div>
                      </div>
                      <div className="imc-bud-card">
                        <div className="imc-bud-label">Media</div>
                        <div className="imc-bud-val">{formatVND(phase.execution_details.budget_split.media)}</div>
                      </div>
                    </div>
                  </>
                )}
                <div className={`imc-exec-kpi ${i === 1 ? 'imc-exec-kpi-warn' : ''}`}>
                  Target: {phase.kpis.target} · {phase.kpis.metric}
                </div>
                {phase.weekly_checkpoint && (
                  <div className="imc-checkpoint">
                    <div className="imc-checkpoint-label">Checkpoint {phase.weekly_checkpoint.week_indicator}</div>
                    Nếu không đạt {phase.weekly_checkpoint.target_metric} → {phase.weekly_checkpoint.if_not_reached}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* REVENUE PROJECTION */}
        {plan.revenue_projection && (
          <div className="imc-anim" style={{ animationDelay: '0.5s' }}>
            <div className="imc-sec-head">
              <div className="imc-sec-dot imc-sec-dot-g"></div>
              <span className="imc-sec-title">Revenue Projection</span>
            </div>
            <div className="imc-rev-formula">
              <div className="imc-rev-formula-text">{plan.revenue_projection.formula}</div>
              <div className="imc-rev-nums">
                <div className="imc-rev-num-col">
                  <div className="imc-rev-num">{plan.revenue_projection.reach}</div>
                  <div className="imc-rev-num-label">Reach ước tính</div>
                </div>
                <div className="imc-rev-num-col">
                  <div className="imc-rev-num">{plan.revenue_projection.ctr}</div>
                  <div className="imc-rev-num-label">Avg CTR</div>
                </div>
                <div className="imc-rev-num-col">
                  <div className="imc-rev-num">{plan.revenue_projection.conversion_rate}</div>
                  <div className="imc-rev-num-label">CR (Leads to Sales)</div>
                </div>
                <div className="imc-rev-num-col">
                  <div className="imc-rev-num">{plan.revenue_projection.aov}</div>
                  <div className="imc-rev-num-label">AOV dự kiến</div>
                </div>
              </div>
            </div>
            <div className="imc-rev-highlight">
              <div className="imc-rev-h-card imc-rev-h-big">
                <div className="imc-rev-h-label">Doanh thu kỳ vọng (Realistic)</div>
                <div className="imc-rev-h-val">{plan.revenue_projection.projected_revenue}</div>
                <div className="imc-rev-h-sub">Dựa trên kịch bản CR thực tế từ dữ liệu ngành</div>
              </div>
              <div className="imc-rev-h-card imc-rev-h-sm">
                <div className="imc-rev-h-label">Break-even Point</div>
                <div className="imc-rev-h-val">{plan.revenue_projection.breakeven_orders}</div>
                <div className="imc-rev-h-sub">Số đơn hàng tối thiểu để hoàn vốn marketing</div>
              </div>
            </div>
          </div>
        )}

        {/* SCENARIOS */}
        {plan.scenarios && plan.scenarios.length > 0 && (
          <div className="imc-anim" style={{ animationDelay: '0.6s' }}>
            <div className="imc-sec-head">
              <div className="imc-sec-dot imc-sec-dot-w"></div>
              <span className="imc-sec-title">Dự báo 3 kịch bản</span>
            </div>
            <div className="imc-scen-grid">
              {plan.scenarios.map((s, i) => (
                <div key={i} className="imc-scen-col">
                  <span className={`imc-scen-badge ${i === 0 ? 'imc-badge-cons' : i === 1 ? 'imc-badge-real' : 'imc-badge-ambi'}`}>
                    {s.name} · {s.probability}
                  </span>
                  <div className="imc-scen-num">{s.revenue}</div>
                  <div className="imc-scen-row"><span className="imc-scen-key">Doanh thu</span><span>{s.revenue}</span></div>
                  <div className="imc-scen-row"><span className="imc-scen-key">ROAS</span><span>{s.roas}</span></div>
                  <div className="imc-scen-row"><span className="imc-scen-key">ROI</span><span>{s.roi}</span></div>
                  <div className="imc-scen-row"><span className="imc-scen-key">Leads</span><span>{s.leads}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CMO NOTE */}
        {plan.expert_notes && (
          <div className="imc-cmo-section imc-anim" style={{ animationDelay: '0.7s' }}>
            <div className="imc-cmo-header">
              <span className="imc-cmo-label">CMO Expert Note</span>
              <span className="imc-cmo-sig">Lời khuyên chiến lược</span>
            </div>
            <div className="imc-cmo-grid">
              <div className="imc-cmo-item">
                <div className="imc-cmo-num">I.</div>
                <div className="imc-cmo-item-title">Điều quan trọng nhất phải làm đúng</div>
                <div className="imc-cmo-text">{plan.expert_notes.key_success_factor}</div>
              </div>
              <div className="imc-cmo-item">
                <div className="imc-cmo-num">II.</div>
                <div className="imc-cmo-item-title">Rủi ro lớn nhất cần phòng tránh</div>
                <div className="imc-cmo-text">
                  {plan.expert_notes.risks.map((r, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <strong>{r.issue}</strong>: {r.mitigation}
                    </div>
                  ))}
                </div>
              </div>
              <div className="imc-cmo-item">
                <div className="imc-cmo-num">III.</div>
                <div className="imc-cmo-item-title">Cơ hội đang bị bỏ ngỏ</div>
                <div className="imc-cmo-text">{plan.expert_notes.opportunity}</div>
              </div>
              <div className="imc-cmo-item">
                <div className="imc-cmo-num">IV.</div>
                <div className="imc-cmo-item-title">Lời khuyên thẳng thắn</div>
                <div className="imc-cmo-text">{plan.expert_notes.frank_advice}</div>
              </div>
            </div>
            <div className="imc-cmo-quote">
              Chiến lược IMC này được tối ưu hóa dựa trên mô hình dữ liệu thực tế. Thành công phụ thuộc vào việc thực thi chỉn chu từng nội dung và theo sát các checkpoint hàng tuần.
            </div>
          </div>
        )}

        {/* FOOTER BAR */}
        <div className="imc-footer-bar imc-anim" style={{ animationDelay: '0.8s' }}>
          <div className="imc-fb-col">
            <span className="imc-fb-val">{formatVND(plan.total_budget)}</span>
            <div className="imc-fb-label">Ngân sách</div>
          </div>
          <div className="imc-fb-col">
            <span className="imc-fb-val">{plan.imc_execution.length}</span>
            <div className="imc-fb-label">Giai đoạn</div>
          </div>
          <div className="imc-fb-col">
            <span className="imc-fb-val">{plan.timeline_weeks} tuần</span>
            <div className="imc-fb-label">Thời gian</div>
          </div>
          <div className="imc-fb-col">
            <span className="imc-fb-val">{plan.revenue_projection?.projected_revenue || 'N/A'}</span>
            <div className="imc-fb-label">Doanh thu kỳ vọng</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IMCOutputEditorial;
