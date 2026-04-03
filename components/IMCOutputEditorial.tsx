import React from 'react';
import { Check, AlertTriangle, XCircle, Info, Zap, Users, Sparkles, Compass, Flag, Target, RefreshCw, ShieldCheck, AlertOctagon, Lightbulb, MessageSquareQuote } from 'lucide-react';
import { IMCPlan } from '../types';
import type { SubscriptionTier } from './AuthContext';
import ProMaxAdviceGate from './ProMaxAdviceGate';
import './imc-planner-editorial.css';

interface IMCOutputEditorialProps {
  plan: IMCPlan;
  /** Tier từ SaaS profile — khớp Brand Vault / STP (AuthContext.tier không đồng bộ). */
  subscriptionTier?: SubscriptionTier | string | null;
}

const cleanText = (text: string) => text.replace(/\*\*/g, '');

const IMCOutputEditorial: React.FC<IMCOutputEditorialProps> = ({ plan, subscriptionTier }) => {
  const isPromax = subscriptionTier === 'promax';
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
    <div className="imc-editorial-wrapper imc-editorial-wrapper--full-bleed">

      <div className="imc-editorial-page imc-editorial-page--full-bleed">
        {/* Ngữ cảnh thương hiệu — tiêu đề dự án nằm ở header trang (giống Mastermind) */}
        <div className="imc-result-strip imc-anim">
          <div className="imc-eyebrow">IMC Planner · Chiến lược tích hợp</div>
          <div className="imc-result-strip-inner">
            <div className="imc-result-brandline">
              {plan.brand}: <em>{plan.product}</em>
            </div>
            <div className="imc-result-badges">
              <span className="imc-meta-tag imc-tag-green">{plan.industry}</span>
              <span className="imc-meta-tag imc-tag-blue">{plan.timeline_weeks} tuần</span>
              <span className="imc-meta-tag imc-tag-warm">{formatVND(plan.total_budget)} Budget</span>
            </div>
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
              <div className="imc-comp-item">
                <div className="imc-comp-item-label">
                  <Users size={12} className="inline mr-1.5 opacity-60" />
                  Đối thủ đang nói gì
                </div>
                <div className="imc-comp-item-text">{plan.strategic_foundation.competitive_angle.competitor_says}</div>
              </div>
              <div className="imc-comp-item">
                <div className="imc-comp-item-label" style={{ color: '#b45309' }}>
                  <Sparkles size={12} className="inline mr-1.5" />
                  Chúng ta nói gì khác
                </div>
                <div className="imc-comp-item-text">"{plan.strategic_foundation.competitive_angle.we_say_differently}"</div>
              </div>
              <div className="imc-comp-item">
                <div className="imc-comp-item-label" style={{ color: '#0f172a' }}>
                  <Compass size={12} className="inline mr-1.5 opacity-80" />
                  Khoảng trắng chúng ta chiếm
                </div>
                <div className="imc-comp-item-text">{plan.strategic_foundation.competitive_angle.gap_we_occupy}</div>
              </div>
            </div>
            <div className="imc-comp-opportunity">
              <div className="imc-comp-opp-label">Chiến lược định vị dự kiến</div>
              {plan.strategic_foundation.competitive_angle.positioning_strategy || "Mỗi chiến dịch đều xoay quanh một USP duy nhất để tối ưu nhận diện trong tâm trí khách hàng."}
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
                  <div className="imc-checkpoint-v2">
                    <div className="imc-cp-header">
                      <Flag size={10} className="text-stone-500" />
                      <span>CHECKPOINT CUỐI TUẦN {phase.weekly_checkpoint.week_indicator}</span>
                    </div>
                    <div className="imc-cp-body">
                      <div className="imc-cp-row">
                        <Target size={11} className="text-amber-600 shrink-0" />
                        <div className="imc-cp-text"><span>Nếu không đạt:</span> {phase.weekly_checkpoint.target_metric}</div>
                      </div>
                      <div className="imc-cp-divider"></div>
                      <div className="imc-cp-row">
                        <RefreshCw size={11} className="text-stone-500 shrink-0" />
                        <div className="imc-cp-text"><span>Hành động:</span> {phase.weekly_checkpoint.if_not_reached}</div>
                      </div>
                    </div>
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
                  <div className="imc-rev-num" style={{ color: '#0f172a' }}>{plan.revenue_projection.reach}</div>
                  <div className="imc-rev-num-label">Reach ước tính</div>
                </div>
                <div className="imc-rev-num-col">
                  <div className="imc-rev-num" style={{ color: '#b45309' }}>{plan.revenue_projection.ctr}</div>
                  <div className="imc-rev-num-label">Avg CTR</div>
                </div>
                <div className="imc-rev-num-col">
                  <div className="imc-rev-num" style={{ color: '#166534' }}>{plan.revenue_projection.conversion_rate}</div>
                  <div className="imc-rev-num-label">CR (Leads to Sales)</div>
                </div>
                <div className="imc-rev-num-col">
                  <div className="imc-rev-num" style={{ color: '#1e293b' }}>{plan.revenue_projection.aov}</div>
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

        {/* CMO NOTE - STRATEGIC WATERFALL + FOOTER BAR */}
        <div
          className={
            plan.expert_notes && !isPromax
              ? 'imc-cmo-footer-stack imc-cmo-footer-stack--lock-last'
              : 'imc-cmo-footer-stack'
          }
        >
          {/* Expert Notes — khóa theo Pro Max (có dữ liệu vẫn chỉ hiện card nếu chưa promax) */}
          {plan.expert_notes && (
            <ProMaxAdviceGate
              subscriptionTier={subscriptionTier}
              className={`imc-cmo-gate${isPromax ? ' imc-cmo-gate--open' : ''}`}
              benefits={[
                'Key success factor, rủi ro & cơ hội bị bỏ lỡ',
                'Lời khuyên chiến lược theo từng giai đoạn IMC',
              ]}
            >
              <div className="imc-cmo-wrap--gate">
                <div className="imc-cmo-section imc-anim" style={{ animationDelay: '0.7s' }}>
                  <div className="imc-cmo-header">
                    <span className="imc-cmo-label">Strategic Executive Briefing</span>
                    <span className="imc-cmo-sig">Lời khuyên</span>
                  </div>

                  <div className="imc-cmo-waterfall">
                  {/* I. HERO INSIGHT */}
                  <div className="imc-cmo-hero">
                    <div className="imc-cmo-hero-icon"><ShieldCheck size={32} /></div>
                    <div className="imc-cmo-hero-content">
                      <div className="imc-cmo-num">I. THE KEY SUCCESS FACTOR</div>
                      <div className="imc-cmo-item-title">Điều quan trọng nhất phải làm đúng</div>

                      <div className="imc-cmo-hero-two-col">
                        <div className="imc-cmo-hero-c">
                          <div className="imc-cmo-c-head">
                            <Zap size={12} className="text-amber-500" />
                            <span>QUYẾT ĐỊNH CHIẾN DỊCH</span>
                          </div>
                          <div className="imc-cmo-c-text">
                            {cleanText(plan.expert_notes.key_success_factor.split('. ')[0])}.
                          </div>
                        </div>
                        <div className="imc-cmo-hero-c">
                          <div className="imc-cmo-c-head">
                            <Info size={12} className="text-slate-400" />
                            <span>LÝ DO & HỆ QUẢ</span>
                          </div>
                          <div className="imc-cmo-c-text">
                            {cleanText(plan.expert_notes.key_success_factor.split('. ').slice(1).join('. '))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* II. RISK MATRIX */}
                  <div className="imc-cmo-matrix-block">
                    <div className="imc-cmo-num">II. RISK MITIGATION & CONTINGENCY</div>
                    <div className="imc-cmo-item-title">Rủi ro lớn nhất & Phương án phòng tránh</div>
                    <div className="imc-cmo-risk-grid">
                      {plan.expert_notes.risks.map((r, idx) => (
                        <div key={idx} className="imc-cmo-risk-card">
                          <div className="imc-cmo-risk-head">
                            <AlertOctagon size={16} className="text-rose-600" />
                            <strong>RISK: {cleanText(r.issue)}</strong>
                          </div>
                          <div className="imc-cmo-risk-arrow">↳</div>
                          <div className="imc-cmo-risk-body">
                            <span>MITIGATION:</span>
                            <div className="imc-mitigation-list">
                              {cleanText(r.mitigation).split('. ').map((point, pIdx) => (
                                point && (
                                  <div key={pIdx} className="imc-mitigation-item">
                                    {point.trim()}{point.endsWith('.') ? '' : '.'}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* III & IV. STRATEGIC LEVERS */}
                  <div className="imc-cmo-levers-row">
                    <div className="imc-cmo-lever-card">
                      <div className="imc-cmo-num">III. OPPORTUNITY</div>
                      <div className="imc-cmo-lever-head">
                        <Lightbulb size={20} className="text-amber-500" />
                        <span>CƠ HỘI ĐANG BỊ BỎ NGỎ</span>
                      </div>
                      <div className="imc-mitigation-list">
                        {cleanText(plan.expert_notes.opportunity).split('. ').map((point, pIdx) => (
                          point && (
                            <div key={pIdx} className="imc-mitigation-item">
                              {point.trim()}{point.endsWith('.') ? '' : '.'}
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    <div className="imc-cmo-lever-card imc-lever-soft">
                      <div className="imc-cmo-num">IV. STRAIGHT TALK</div>
                      <div className="imc-cmo-lever-head">
                        <MessageSquareQuote size={20} className="text-slate-600" />
                        <span>LỜI KHUYÊN THẲNG THẮN</span>
                      </div>
                      <div className="imc-mitigation-list">
                        {cleanText(plan.expert_notes.frank_advice).split('. ').map((point, pIdx) => (
                          point && (
                            <div key={pIdx} className="imc-mitigation-item">
                              {point.trim()}{point.endsWith('.') ? '' : '.'}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                  <div className="imc-cmo-quote">
                    Chiến lược IMC này mang tính định hướng cao. Thành công thực tế phụ thuộc rất lớn vào sự phối hợp nhịp nhàng giữa team Branding và Performance trong từng tuần thực thi.
                  </div>
                </div>
              </div>
            </ProMaxAdviceGate>
          )}

          {/* FOOTER BAR — always visible */}
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
    </div>
  );
};

export default IMCOutputEditorial;
