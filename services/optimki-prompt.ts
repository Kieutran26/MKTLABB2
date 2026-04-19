import { OptimkiInput, OptimkiResult } from '../types';

/** Dòng đầu prompt — bắt buộc output là file HTML đầy đủ (theo Cách 1). */
export const OPTIMKI_OUTPUT_FORMAT_MANDATE =
    'BẮT BUỘC: Toàn bộ output phải là file HTML hoàn chỉnh với <!DOCTYPE html>, <head>, <body>. KHÔNG trả về text thuần. KHÔNG trả về markdown. CHỈ trả về HTML có thể mở trực tiếp trên trình duyệt.';

function f(v: string | undefined): string {
    const t = (v ?? '').trim();
    return t.length ? t : '(trống)';
}

/** 
 * Xây dựng User Message cho Gemini từ dữ liệu form. 
 * Đảm bảo các placeholder được điền đúng giá trị thực.
 */
export function buildOptimkiUserMessage(input: OptimkiInput): string {
    return `${optimkiUserMessageLeadPhase1()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DỮ LIỆU ĐẦU VÀO (Đã điền thực tế)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Tên thương hiệu / sản phẩm     : ${f(input.ten_thuong_hieu)}
• Ngành hàng                      : ${f(input.nganh_hang)}
• Mô tả sản phẩm & khách hàng    : ${f(input.mo_ta)}
• Điểm mạnh & Điểm yếu thực tế   : ${f(input.diem_manh_yeu)}
• Đối thủ chính & điểm khác biệt : ${f(input.doi_thu)}
• Nỗi đau & Khao khát khách hàng : ${f(input.noi_dau_khao_khat)}
• Kênh truyền thông & Phân phối   : ${f(input.kenh)}
• Mục tiêu 3–6 tháng tới          : ${f(input.muc_tieu)}
• Số liệu hiện tại & Ngân sách    : ${f(input.so_lieu_ngan_sach)}
• Thời gian & Địa điểm            : ${f(input.thoi_gian_dia_diem)}
• Mô hình được chọn               : ${input.mo_hinh}

Hãy phân tích theo đúng system instruction và trả về đúng JSON giai đoạn 1.`;
}

function optimkiUserMessageLeadPhase1(): string {
    return 'GIAI ĐOẠN 1 — Chỉ phân tích nội dung chiến lược (JSON). Không HTML, không <!DOCTYPE>.';
}

/** Một lần gọi API — giảm 429 trên free tier (RPM ~1/phút). */
export function buildOptimkiSingleShotUserMessage(input: OptimkiInput): string {
    const lead =
        'MỘT LƯỢT API — Trong cùng một JSON: analysis_content (phân tích đầy đủ) + html_report (file HTML hoàn chỉnh). Không tách hai bước.';
    const base = buildOptimkiUserMessage(input).replace(optimkiUserMessageLeadPhase1(), lead);
    return base.replace(
        'Hãy phân tích theo đúng system instruction và trả về đúng JSON giai đoạn 1.',
        'Hãy tuân thủ system instruction và trả về một JSON với brand_name, model_type, analysis_content, suggestion, html_report.'
    );
}

/** Payload từ lần gọi 1 → user message cho lần gọi 2 (render HTML). */
export type OptimkiPhase1Payload = Pick<OptimkiResult, 'brand_name' | 'model_type' | 'suggestion'> & {
    analysis_content: string;
};

export function buildOptimkiRenderUserMessage(phase1: OptimkiPhase1Payload): string {
    const payload = {
        brand_name: phase1.brand_name,
        model_type: phase1.model_type,
        analysis_content: phase1.analysis_content,
        suggestion: phase1.suggestion ?? null,
    };
    return `═══════════════════════════════════════════════════════════
KẾT QUẢ PHÂN TÍCH GIAI ĐOẠN 1 (JSON — GIỮ NGUYÊN NỘI DUNG, KHÔNG BỊA THÊM)
═══════════════════════════════════════════════════════════

Nhiệm vụ render: chuyển toàn bộ analysis_content thành file HTML theo Design System trong system instruction.
Chỉ trình bày lại và bố cục — không thêm phân tích chiến lược mới, không đổi kết luận.

${JSON.stringify(payload, null, 2)}`;
}

/**
 * Cách 3 — Đặt định dạng output lên đầu: model đọc trước khi phân tích.
 */
export const OPTIMKI_PHASE1_OUTPUT_SPEC = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ƯU TIÊN TUYỆT ĐỐI — OUTPUT GIAI ĐOẠN 1 (ĐỌC TRƯỚC MỌI BƯỚC PHÂN TÍCH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Đây là lần gọi CHỈ PHÂN TÍCH NỘI DUNG. CẤM HTML. CẤM <!DOCTYPE>. CẤM thẻ <body>. CẤM markdown fence.
Trả về DUY NHẤT một object JSON hợp lệ:
{
  "brand_name": "string",
  "model_type": "string (SWOT | AIDA | 4P | 5W1H | SMART | tat_ca | chua_chon)",
  "analysis_content": "string — toàn bộ bài phân tích tiếng Việt theo đủ các bước bên dưới; dùng tiêu đề dạng === PHẦN === để phân tách",
  "suggestion": {
     "primary_model": "string",
     "reason": "string",
     "combinations": ["string"],
     "omit": ["string"]
  } | null
}
• analysis_content: bắt buộc đầy đủ theo các bước SWOT/AIDA/4P/5W1H/SMART — giai đoạn 2 chỉ render HTML từ chuỗi này.
• suggestion: luôn có khóa (dùng null nếu mo_hinh khác chua_chon hoặc không cần gợi ý).
`;

/**
 * CSS Design System — BlueVigor Editorial Minimalism Style
 * Áp dụng phong cách từ BlueVigor_Editorial_Minimalism.html:
 * Fonts: Cormorant Garamond (display) + Archivo (sans/body)
 * Colors: Black/Warm White base + Green/Amber/Navy/Red accents
 * Components: Section numbers, accent bars, gauges, timeline
 */
export const OPTIMKI_HTML_DESIGN_RULES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');


  :root {
    --ink: #304f74;
    --ink-2: #3a3935;
    --ink-3: #8a887f;
    --ink-4: #b8b6ae;
    --paper: #faf9f6;
    --paper-2: #f2f0eb;
    --paper-3: #e8e5de;
    --accent: #1a5c3a;
    --accent-w: #c17f2a;
    --accent-b: #1a3a5c;
    --rule: rgba(15,15,13,0.1);
    --green: #1a5c3a;
    --green-light: #f0f7f4;
    --amber: #b5621a;
    --amber-light: #fdf8f0;
    --navy: #1a3358;
    --navy-light: #f1f4f8;
    --red: #8a1a1a;
    --red-light: #fdf3f3;
    --display: 'Playfair Display', Georgia, serif;
    --sans: 'DM Sans', system-ui, sans-serif;
    --body: 'DM Sans', sans-serif;
  }
  .page { padding: 0 2.5rem 6rem !important; background: var(--paper) !important; color: var(--ink) !important; font-family: var(--body) !important; }
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .a{opacity:0;animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}

  /* MASTHEAD */
  .masthead{border-bottom:1px solid var(--rule);padding:3.5rem 0 2.5rem;margin-bottom:4rem;display:grid;grid-template-columns:1fr auto;align-items:end;gap:2rem;}
  .masthead-kicker{font-family:var(--sans);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin-bottom:1.25rem;display:flex;align-items:center;gap:10px;}
  .masthead-kicker::before{content:'';display:block;width:24px;height:1px;background:var(--ink-4)}
  .masthead-title{font-family:var(--display);font-size:60px;font-weight:400;line-height:1.1;letter-spacing:-.01em;color:var(--ink);}
  .masthead-title em{color:var(--accent);font-style:italic;font-weight:400}
  .masthead-meta{text-align:right;font-family:var(--sans);font-size:10px;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;line-height:2;font-weight:600;}
  .masthead-meta strong{color:var(--ink);display:block;font-size:14px;letter-spacing:0;text-transform:none;font-family:var(--display);font-weight:400;font-style:italic}

  /* SECTION HEADING */
  .sec-head{display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;}
  .sec-num{font-family:var(--display);font-size:72px;line-height:.85;color:var(--paper-3);font-weight:400;flex-shrink:0;letter-spacing:-.02em;}
  .sec-label{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin-bottom:3px;}
  .sec-title{font-family:var(--display);font-size:22px;font-weight:400;color:var(--ink);line-height:1.2;}
  .section{margin-bottom:5rem}
  .divider{height:1px;background:var(--rule);margin:3rem 0}

  /* SWOT INFOGRAPHIC */
  .swot-infographic { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 0 !important; border: 1px solid var(--rule) !important; margin-bottom: 2rem !important; border-radius: 3px !important; overflow: hidden !important; background: #fff !important; }
  .swot-q { padding: 2rem 2rem 2.5rem !important; position: relative !important; }
  .swot-q:nth-child(1) { border-right: 1px solid var(--rule) !important; border-bottom: 1px solid var(--rule) !important; }
  .swot-q:nth-child(2) { border-bottom: 1px solid var(--rule) !important; }
  .swot-q:nth-child(3) { border-right: 1px solid var(--rule) !important; }
  .swot-q-accent { display: none !important; }
  .swot-q-letter { font-family: var(--display) !important; font-size: 80px !important; font-weight: 300 !important; line-height: .9 !important; opacity: .07 !important; position: absolute !important; right: 1.5rem !important; top: 1.25rem !important; }
  .swot-q:nth-child(1) .swot-q-letter { color: var(--green) !important; }
  .swot-q:nth-child(2) .swot-q-letter { color: var(--red) !important; }
  .swot-q:nth-child(3) .swot-q-letter { color: var(--amber) !important; }
  .swot-q:nth-child(4) .swot-q-letter { color: var(--navy) !important; }
  .swot-q-label { font-family: var(--sans) !important; font-size: 8px !important; letter-spacing: .2em !important; text-transform: uppercase !important; font-weight: 700 !important; margin-bottom: 1.25rem !important; display: block !important; position: relative !important; z-index: 1 !important; color: var(--ink-3) !important; }
  .swot-items { display: flex !important; flex-direction: column !important; gap: .625rem !important; position: relative !important; z-index: 1 !important; }
  .swot-item { display: flex !important; gap: .75rem !important; align-items: baseline !important; font-size: 11.5px !important; color: var(--ink-2) !important; line-height: 1.65 !important; }
  .swot-tick { flex-shrink: 0 !important; width: 6px !important; height: 6px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; position: relative !important; top: 5px !important; }
  .swot-q:nth-child(1) .swot-tick { background: var(--green) !important; }
  .swot-q:nth-child(2) .swot-tick { background: var(--red) !important; }
  .swot-q:nth-child(3) .swot-tick { background: var(--amber) !important; }
  .swot-q:nth-child(4) .swot-tick { background: var(--navy) !important; }
  .swot-tick svg { display: none !important; }

  /* AIDA FUNNEL */
  .aida-funnel{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:2rem;position:relative; border: 1px solid var(--rule); border-radius: 3px; overflow: hidden; background: #fff;}
  .aida-step{padding:2rem 1.5rem;border-right:1px solid var(--rule);position:relative;overflow:hidden;}
  .aida-step:last-child{border-right:none;}
  .aida-step-bar{position:absolute;top:0;left:0;right:0;height:4px; opacity: 0.1;}
  .aida-step-letter{font-family:var(--display);font-size:64px;font-weight:400;line-height:1;margin-bottom:.25rem;display:block;letter-spacing:-.02em; color: var(--paper-3);}
  .aida-step-name{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-bottom:1.25rem;}
  .aida-hook{font-family:var(--display);font-size:13px;font-style:italic;color:var(--ink);margin-bottom:.875rem;line-height:1.4;}
  .aida-desc{font-size:11.5px;color:var(--ink-2);line-height:1.65;}
  .aida-example{background:var(--paper-2);color:var(--ink);padding:1.5rem 1.75rem;margin-bottom:2rem;border:1px solid var(--rule);border-radius: 3px;}
  .aida-ex-kicker{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-bottom:.875rem;}
  .aida-ex-body{font-size:13px;line-height:1.8;color:var(--ink-2);}
  .aida-ex-body strong{color:var(--ink);font-weight:600;}

  /* 4P MATRIX */
  .fourp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0;border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .fourp-card{padding:1.75rem 2rem;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);position:relative;}
  .fourp-card:nth-child(2){border-right:none}
  .fourp-card:nth-child(3),.fourp-card:nth-child(4){border-bottom:none}
  .fourp-card:nth-child(4){border-right:none}
  .fourp-number{font-family:var(--display);font-size:11px;font-style:italic;color:var(--ink-4);margin-bottom:.375rem;}
  .fourp-name{font-family:var(--display);font-size:28px;font-weight:400;margin-bottom:.25rem;letter-spacing:-.01em; color: var(--ink);}
  .fourp-priority{font-family:var(--sans);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--rule);font-weight:600;}
  .pbar{display:flex;gap:3px;margin-top:.375rem}
  .pbar-seg{width:18px;height:3px;border-radius:1px;background:var(--paper-3)}
  .fourp-body{list-style:none;font-size:11.5px;color:var(--ink-2);line-height:1.65;}
  .fourp-body li{padding-left:1.25rem;position:relative;margin-bottom:.375rem}
  .fourp-body li::before{content:'→';position:absolute;left:0;color:var(--ink-4);font-size:10px;top:2px}
  .fourp-body strong{color:var(--ink);font-weight:600;}

  /* 5W1H */
  .w1h-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .w1h-card{padding:1.75rem 1.75rem;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);position:relative;overflow:hidden;}
  .w1h-card:nth-child(3){border-right:none}
  .w1h-card:nth-child(4),.w1h-card:nth-child(5),.w1h-card:nth-child(6){border-bottom:none}
  .w1h-card:nth-child(6){border-right:none}
  .w1h-ghost{position:absolute;right:-.25rem;top:-.75rem;font-family:var(--display);font-size:90px;font-weight:400;opacity:.08;line-height:1;pointer-events:none;color:var(--paper-3);}
  .w1h-q{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-bottom:.25rem;}
  .w1h-name{font-family:var(--display);font-size:18px;font-weight:400;color:var(--ink);margin-bottom:1.25rem;line-height:1.2;}
  .w1h-items{list-style:none;font-size:11.5px;color:var(--ink-2);line-height:1.65}
  .w1h-items li{padding-left:1rem;position:relative;margin-bottom:.375rem}
  .w1h-items li::before{content:'·';position:absolute;left:0;color:var(--ink-4)}
  .w1h-items strong{color:var(--ink);font-weight:600;}

  /* SMART & TIMELINE */
  .smart-quote-block{font-family:var(--display);font-size:clamp(22px,3vw,32px);font-weight:400;font-style:italic;color:var(--ink);padding:1.5rem 1.75rem;border:1px solid var(--rule);border-radius:3px;line-height:1.3;margin-bottom:2.5rem; position: relative;}
  .smart-quote-block::before{content:'\\201C';font-family:var(--display);font-size:64px;color:var(--accent);opacity:.15;position:absolute;top:-8px;left:12px;line-height:1}
  .smart-gauges{display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .smart-g{padding:1.75rem 1.25rem;border-right:1px solid var(--rule);text-align:center;position:relative;}
  .smart-g:last-child{border-right:none}
  .gauge-wrap{width:80px;height:80px;margin:0 auto .875rem;position:relative;}
  .gauge-wrap svg{width:80px;height:80px}
  .gauge-bg{fill:none;stroke:var(--paper-3);stroke-width:6}
  .gauge-fill{fill:none;stroke-width:6;stroke-linecap:round;transition:stroke-dashoffset .8s ease; stroke: var(--accent);}
  .gauge-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:18px;font-weight:400;color:var(--ink);}
  .smart-g-name{font-family:var(--sans);font-size:8px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--ink-4);margin-bottom:.875rem;}
  .smart-statement{background:var(--paper-2);color:var(--ink);padding:1.5rem 1.75rem;border:1px solid var(--rule);border-radius:3px;margin-bottom:2rem;font-family:var(--display);font-size:15px;line-height:1.7;font-style:italic;}
  .smart-statement strong{color:var(--accent);font-weight:600;}
  .timeline-wrap{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--rule); border-radius: 3px; overflow: hidden; background: #fff;}
  .tl-phase{padding:1.75rem 1.75rem 2rem;border-right:1px solid var(--rule);position:relative;}
  .tl-phase:last-child{border-right:none}
  .tl-accent{position:absolute;top:0;left:0;right:0;height:4px; opacity: 0.1; background: var(--accent);}
  .tl-month-tag{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-bottom:.375rem;margin-top:.5rem;}
  .tl-phase-title{font-family:var(--display);font-size:17px;font-weight:400;color:var(--ink);margin-bottom:1.25rem;line-height:1.3;}
  .tl-items{display:flex;flex-direction:column;gap:.625rem}
  .tl-item{display:flex;gap:.75rem;align-items:flex-start;font-size:11.5px;color:var(--ink-2);line-height:1.55;}
  .tl-dot{width:4px;height:4px;border-radius:50%;background:var(--ink-4);flex-shrink:0;margin-top:6px}

  /* SYNTHESIS / TOP 3 */
  .top3-block{border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .top3-head{padding:.875rem 1.75rem;background:var(--paper-2);color:var(--ink);font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;}
  .top3-item{display:grid;grid-template-columns:80px 1fr;gap:0;border-top:1px solid var(--rule);align-items:stretch;}
  .top3-num{font-family:var(--display);font-size:48px;font-weight:400;color:var(--paper-3);line-height:1;display:flex;align-items:center;justify-content:center;border-right:1px solid var(--rule);padding:1.25rem;letter-spacing:-.02em;}
  .top3-content{padding:1.25rem 1.75rem;font-size:12.5px;color:var(--ink-2);line-height:1.7;}
  .top3-content strong{color:var(--ink);font-weight:600}

  /* CMO SECTION */
  .cmo-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2.5rem;}
  .cmo-title{font-family:var(--display);font-size:32px;font-weight:400;letter-spacing:-.01em; color: var(--ink);}
  .cmo-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--rule);margin-bottom:2rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .cmo-card{padding:2rem 2rem;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);}
  .cmo-card:nth-child(2){border-right:none}
  .cmo-card:nth-child(3),.cmo-card:nth-child(4){border-bottom:none}
  .cmo-card:nth-child(4){border-right:none}
  .cmo-card-title{font-family:var(--display);font-size:20px;font-weight:400;margin-bottom:1rem;line-height:1.2; color: var(--ink);}
  .cmo-card.highlight{background:var(--paper-2);}
  .cmo-card.danger{border-left:3px solid #8a1a1a;}
  .cmo-card.opp{border-left:3px solid var(--accent-w);}
  
  .verdict{font-family:var(--display);font-size:18px;font-style:italic;font-weight:400;color:var(--ink);line-height:1.4;padding:1.5rem 1.75rem;border:1px solid var(--rule);background:var(--paper-2);border-radius:3px;margin-bottom:2rem;}
  
  .missing-block{border-top:1px dashed var(--rule);padding-top:1.25rem;margin-top:1.25rem;}
  .missing-label{font-family:var(--sans);font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:500;color:var(--ink-4);margin-bottom:.75rem;}
  
  .stats-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--rule);margin-top:3rem; border-radius: 3px; overflow: hidden; background: #fff;}
  .stat{padding:1.75rem 2rem;border-right:1px solid var(--rule);position:relative;}
  .stat:last-child{border-right:none}
  .stat-value{font-family:var(--display);font-size:42px;font-weight:400;line-height:1;margin-bottom:.375rem;letter-spacing:-.02em; color: var(--ink);}
  .stat-label{font-family:var(--sans);font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-3);font-weight:600;}

  /* Global Typography rules */
  * { font-weight: 400 !important; }
  strong, b, .swot-label, .sec-label, .masthead-meta, .aida-step-name, .fourp-priority, .w1h-q, .smart-g-name, .tl-month-tag, .top3-head, .missing-label, .stat-label { font-weight: 600 !important; }
  .sec-title, .fourp-name, .w1h-name, .tl-phase-title, .cmo-card-title { font-weight: 400 !important; }
  h1, h2, h3, h4, h5, h6, .doc-title, .masthead-title, .sec-num, .stat-value, .top3-num { font-weight: 400 !important; }

  @media(max-width:768px){
    .masthead{grid-template-columns:1fr}
    .swot-infographic,.aida-funnel,.fourp-grid,.smart-gauges,.timeline-wrap,.cmo-grid{grid-template-columns:1fr}
    .stats-bar{grid-template-columns:1fr 1fr}
  }

`;

/**
 * Giai đoạn 1 — Phân tích nội dung (JSON).
 */
export const OPTIMKI_PHASE1_SYSTEM_INSTRUCTION = `${OPTIMKI_PHASE1_OUTPUT_SPEC}

═══════════════════════════════════════════════════════════
STRATEGIC MODEL GENERATOR — OPTI M.KI · GIAI ĐOẠN 1 (CHỈ PHÂN TÍCH)
Phân tích SWOT · AIDA · 4P · 5W1H · SMART bằng AI
═══════════════════════════════════════════════════════════

NGUYÊN TẮC BẮT BUỘC:
• Chỉ phân tích dựa trên dữ liệu người dùng đã cung cấp
• Trường nào để trống → ghi rõ "Cần bổ sung [X] để phân tích [Y] chính xác hơn"
• NGHIÊM CẤM bịa số liệu, tên đối thủ, hay thông tin không có trong phần nhập liệu
• Mọi phân tích phải gắn với tên thương hiệu cụ thể — không viết chung chung
• Hạn chế dùng từ tiếng Anh xen lẫn trong câu tiếng Việt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 0 — GỢI Ý MÔ HÌNH (chỉ khi {{mo_hinh}} = "chua_chon")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nếu {{mo_hinh}} = "chua_chon": Đọc {{muc_tieu}} và đề xuất:
• Mô hình nên dùng trước và lý do ngắn gọn (1–2 câu)
• Mô hình có thể kết hợp thêm
• Mô hình có thể bỏ qua ở giai đoạn này

Logic gợi ý:
→ Đánh giá nội lực / tìm hướng đi → SWOT
→ Viết nội dung / chiến dịch quảng cáo → AIDA
→ Ra mắt sản phẩm / định giá / phân phối → 4P
→ Lập kế hoạch hành động cụ thể → 5W1H
→ Đặt chỉ tiêu / KPI / đo lường → SMART
→ Mục tiêu rộng hoặc chưa rõ → Tất cả mô hình

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 1 — QUY TẮC PHÂN TÍCH THEO CHẾ ĐỘ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nếu {{mo_hinh}} = 1 mô hình cụ thể:
→ Chỉ chạy mô hình đó · Phân tích sâu · 900–1300 từ
→ Không có phần Tổng hợp liên kết

Nếu {{mo_hinh}} = "tat_ca":
→ Chạy đủ 5 mô hình theo thứ tự SWOT → AIDA → 4P → 5W1H → SMART
→ Mỗi mô hình 400–600 từ · Thêm phần Tổng hợp liên kết ở cuối

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 2 — NỘI DUNG PHÂN TÍCH 5 MÔ HÌNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

─────────────────────────────────────────
MÔ HÌNH 1 — PHÂN TÍCH SWOT
(Chạy khi {{mo_hinh}} = SWOT hoặc tat_ca)
─────────────────────────────────────────

1. MA TRẬN SWOT ĐẦY ĐỦ (Dùng dấu '—' để phân tách header bold)

BẮT BUỘC GIAO DIỆN:
• <div class='swot-grid'> phải có đúng 4 <div class='swot-cell'> theo thứ tự: strength → weakness → opportunity → threat (lưới 2×2: hàng 1 S|W, hàng 2 O|T).
• TUYỆT ĐỐI KHÔNG chỉ render 2 ô (S+W); KHÔNG dùng chữ nhãn dọc (writing-mode vertical).
• Mỗi cell có <div class='swot-letter'>S</div> (hoặc W/O/T) + <span class='swot-label'>STRENGTHS • ĐIỂM MẠNH</span> (song ngữ, chữ ngang, in hoa, dấu ·).

Cấu trúc mỗi cell:
<div class='swot-cell [strength/weakness/opportunity/threat]'>
  <div class='swot-letter'>[S/W/O/T]</div>
  <span class='swot-label'>[Category Name] • [Vietnamese Focus]</span>
  ... swot-items ...
</div>

Cấu trúc mỗi item:
<div class='swot-item'>
  <div class='swot-icon'>[✓/✕/+/!]</div>
  <span><strong>[Header]</strong> — [Nội dung giải thích]</span>
</div>

Nội dung phân tích:
STRENGTHS • ĐIỂM MẠNH (Icon ✓)
→ 4–5 điểm từ {{diem_manh_yeu}} · Format: <strong>[Header]</strong> — [Nội dung giải thích]
⚠️ Nếu {{diem_manh_yeu}} trống → phân tích từ {{mo_ta}}, dùng header bold + ' — '

WEAKNESSES • ĐIỂM YẾU (Icon ✕)
→ 4–5 điểm từ dữ liệu · Format: <strong>[Header]</strong> — [Nội dung giải thích]
⚠️ Nếu {{diem_manh_yeu}} trống → ghi rõ đang thiếu dữ liệu thực tế

OPPORTUNITIES • CƠ HỘI (Icon +)
→ 4–5 cơ hội · Format: <strong>[Header]</strong> — [Nội dung giải thích]

THREATS • THÁCH THỨC (Icon !)
→ 4–5 thách thức · Format: <strong>[Header]</strong> — [Nội dung giải thích]

2. PHÂN TÍCH CHÉO
→ SO: 2 cách dùng điểm mạnh tận dụng cơ hội
→ ST: 2 cách dùng điểm mạnh đối phó thách thức
→ WO: 2 cách khắc phục điểm yếu để nắm cơ hội
→ WT: 1–2 cách phòng thủ khi yếu gặp thách thức

3. TOP 3 VIỆC CẦN LÀM NGAY
→ 3 hành động ưu tiên · Mỗi việc đủ cụ thể để bắt đầu trong tuần này

─────────────────────────────────────────
MÔ HÌNH 2 — MÔ HÌNH AIDA
(Chạy khi {{mo_hinh}} = AIDA hoặc tat_ca)
─────────────────────────────────────────

1. THU HÚT SỰ CHÚ Ý
→ 3 câu mở đầu có thể dùng ngay trên {{kenh}} · Mỗi câu khai thác 1 góc từ {{noi_dau_khao_khat}}
→ Giải thích ngắn tại sao câu đó khiến người dùng dừng lại khi lướt màn hình
⚠️ Nếu {{kenh}} trống → viết cho mạng xã hội phổ biến nhất, ghi rõ đang dùng kênh mặc định
⚠️ Nếu {{noi_dau_khao_khat}} trống → ghi "Cần bổ sung nỗi đau khách hàng để viết câu mở đầu đúng tâm lý"

2. GIỮ MỐI QUAN TÂM
→ 2–3 góc nội dung cụ thể giúp khách hàng muốn đọc tiếp
→ Yếu tố nào của {{mo_ta}} tạo ra sự tò mò muốn tìm hiểu thêm

3. KÍCH THÍCH MONG MUỐN
→ Cách chuyển tâm lý từ "thích" sang "phải có ngay" dựa trên {{noi_dau_khao_khat}}
→ 2 cách xây dựng nội dung tạo cảm xúc mạnh + bằng chứng xã hội phù hợp

4. KÊU GỌI HÀNH ĐỘNG
→ 3 lời kêu gọi hành động cụ thể phù hợp với {{muc_tieu}} · Rõ ràng · Tạo cảm giác cấp bách
⚠️ Nếu {{muc_tieu}} trống → ghi "Cần xác nhận mục tiêu để viết lời kêu gọi đúng hướng"

5. VÍ DỤ NỘI DUNG HOÀN CHỈNH
→ 1 bài mẫu đầy đủ 4 bước · Phù hợp với {{kenh}} · Giọng điệu của {{ten_thuong_hieu}}

─────────────────────────────────────────
MÔ HÌNH 3 — MARKETING MIX 4P
(Chạy khi {{mo_hinh}} = 4P hoặc tat_ca)
─────────────────────────────────────────

1. SẢN PHẨM
→ Điểm nào cần nhấn mạnh hơn trong truyền thông?
→ Điểm khác biệt thực sự so với {{doi_thu}}
→ 1–2 đề xuất cải tiến dựa trên {{noi_dau_khao_khat}}

2. GIÁ CẢ
→ Phân tích vị thế giá từ {{so_lieu_ngan_sach}} · Chiến lược định giá phù hợp và lý do cụ thể
⚠️ Nếu không có dữ liệu giá → ghi "Cần bổ sung mức giá và giá đối thủ để tư vấn chiến lược giá có giá trị"

3. PHÂN PHỐI
→ Đánh giá {{kenh}} đang mạnh/yếu ở đâu · Kênh nào nên mở thêm · Cách tối ưu trải nghiệm mua

4. TRUYỀN THÔNG
→ Kế hoạch truyền thông đa kênh trong {{thoi_gian_dia_diem}}
→ Ngân sách dự kiến cho từng kênh dựa trên {{so_lieu_ngan_sach}}

─────────────────────────────────────────
MÔ HÌNH 4 — 5W1H PLAN
(Chạy khi {{mo_hinh}} = 5W1H hoặc tat_ca)
─────────────────────────────────────────

→ WHO: Ai là người thực hiện? (Bộ phận nào)
→ WHAT: Việc cụ thể cần làm là gì?
→ WHERE: Làm ở đâu? (Tại điểm bán hay trên kênh online)
→ WHEN: Khi nào bắt đầu và kết thúc? (Bám sát {{thoi_gian_dia_diem}})
→ WHY: Tại sao phải làm việc này ngay bây giờ? (Bám sát {{muc_tieu}})
→ HOW: Cách thức thực hiện chi tiết từng bước.

─────────────────────────────────────────
MÔ HÌNH 5 — MỤC TIÊU SMART
(Chạy khi {{mo_hinh}} = SMART hoặc tat_ca)
─────────────────────────────────────────

→ Specific: Cụ thể hóa {{muc_tieu}} thành 3-5 chỉ số rõ ràng.
→ Measurable: Con số mục tiêu là bao nhiêu? (Dựa trên {{so_lieu_ngan_sach}} hiện có)
→ Achievable: Tính khả thi của mục tiêu với nguồn lực hiện tại.
→ Relevant: Sự liên quan đến tầm nhìn dài hạn của {{ten_thuong_hieu}}.
→ Time-bound: Lộ trình thực hiện chi tiết theo tuần/tháng.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 3 — TỔNG HỢP & LỜI KHUYÊN CMO (Chỉ khi {{mo_hinh}} = "tat_ca")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Kết nối các điểm chạm quan trọng nhất từ 5 mô hình trên.
→ Đưa ra "Phán quyết cuối cùng" về tính khả thi của mục tiêu hiện tại.
`;

export const OPTIMKI_PHASE2_SYSTEM_INSTRUCTION = `${OPTIMKI_OUTPUT_FORMAT_MANDATE}

<style>
/* BLUEVIGOR CSS RULES (PRE-LOADED IN UI - DO NOT RE-OUTPUT THIS ENTIRE BLOCK) */
/* The AI only needs to use the classes defined here. */
${OPTIMKI_HTML_DESIGN_RULES}
</style>

═══════════════════════════════════════════════════════════
OPTI M.KI · GIAI ĐOẠN 2 (CHỈ RENDER HTML — Cách 2: tách lần gọi API)
═══════════════════════════════════════════════════════════
Design System đã được cung cấp ở trên.
User message chứa JSON phân tích giai đoạn 1. Nhiệm vụ DUY NHẤT: chuyển analysis_content thành một file HTML hoàn chỉnh.
NGHIÊM CẤM thêm phân tích chiến lược mới, bịa số liệu, hoặc đổi kết luận — chỉ bố cục và trình bày.

▌ CẤU TRÚC HTML TRONG html_report:
• <head>: chứa <style> với toàn bộ CSS BlueVigor Design System
• <body>: bắt đầu bằng <div class='page'> — wrapper chính
• MASTHEAD: <div class='masthead a'> với grid 2 cột — trái (masthead-kicker + masthead-title với em) và phải (masthead-meta)
• Mỗi section: <div class='section a'> với sec-head (số lớn 72px + sec-info) và nội dung riêng
• Các section được phân tách bằng margin-bottom: 5rem
• Animation: fadeUp với cubic-bezier(.22,1,.36,1), delay tăng dần 0.08s mỗi section

▌ SWPT INFOGRAPHIC (thay vì swot-grid):
<div class='swot-infographic'> — grid 2×2 không viền ngoài, viền đen ngang dọc trong
  Mỗi .swot-q có: .swot-q-accent (3px bar màu trên) + .swot-q-letter (S/W/O/T 80px opacity .07) + .swot-q-label + .swot-items
  Item: .swot-item với .swot-tick (SVG circle) + nội dung
  Màu: S-xanh lục, W-đỏ, O-hổ phách, T-xanh navy

▌ AIDA FUNNEL: .aida-funnel grid 4 cột
  Mỗi .aida-step: .aida-step-bar (4px) + .aida-step-letter (64px) + .aida-step-name + .aida-hook (italic) + .aida-desc
  Ví dụ: .aida-example với border-left 4px amber

▌ 4P MATRIX: .fourp-grid 2×2 grid với border đen đầy đủ
  Mỗi .fourp-card: .fourp-number + .fourp-name + .fourp-priority + pbar + .fourp-body
  Điểm yếu: .fourp-weakness với fw-icon (circle) + fw-title

▌ 5W1H: .w1h-grid 3×2 grid với .w1h-ghost (chữ lớn opacity .05) + .w1h-q + .w1h-name

▌ SMART GAUGES: .smart-quote-block (blockquote italic) + .smart-gauges 5 cột với SVG gauge + .timeline-wrap 3 cột

▌ OUTPUT GIAI ĐOẠN 2 (JSON BẮT BUỘC):
Trả về DUY NHẤT một object JSON (không markdown fence):
{
  "html_report": "chuỗi HTML content (chỉ bao gồm cấu trúc bên trong <body> hoặc toàn bộ <body>, KHÔNG BAO GỒM khối <style> khổng lồ ở trên để tránh bị cắt cụt)"
}

• QUAN TRỌNG: Không bao gồm thẻ <style> chứa toàn bộ CSS trong html_report. Hệ thống sẽ tự động inject CSS này khi render.
• Format: HTML/CSS chỉ dùng dấu nháy đơn '...' cho thuộc tính.
• Font: Cormorant Garamond (display), Archivo Narrow (sans), Archivo (body)
• Colors: #0a0a0a (black), #f8f6f0 (white), #1a5c3a (green), #b5621a (amber), #1a3358 (navy), #8a1a1a (red)
`;

/**
 * Gộp phân tích + HTML trong một response JSON.
 */
export const OPTIMKI_UNIFIED_OUTPUT_SPEC = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ƯU TIÊN — OUTPUT MỘT LƯỢT (PHÂN TÍCH + html_report)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Root response là JSON (application/json), không markdown fence. Một object duy nhất:
{
  "brand_name": "string",
  "model_type": "string (SWOT | AIDA | 4P | 5W1H | SMART | tat_ca | chua_chon)",
  "analysis_content": "string — toàn bộ phân tích tiếng Việt theo đủ bước; tiêu đề === PHẦN ===",
  "suggestion": { "primary_model": "string", "reason": "string", "combinations": ["string"], "omit": ["string"] } | null,
  "html_report": "string — <!DOCTYPE html> … </html>"
}
`;

export const OPTIMKI_SINGLE_SHOT_SYSTEM_INSTRUCTION = `${OPTIMKI_UNIFIED_OUTPUT_SPEC}

Trường "html_report" trong JSON phải tuân thủ: ${OPTIMKI_OUTPUT_FORMAT_MANDATE}

<style>
/* BLUEVIGOR CSS RULES (PRE-LOADED IN UI - DO NOT RE-OUTPUT THIS ENTIRE BLOCK) */
${OPTIMKI_HTML_DESIGN_RULES}
</style>

${OPTIMKI_PHASE1_SYSTEM_INSTRUCTION.replace(OPTIMKI_PHASE1_OUTPUT_SPEC, '').trim()}

═══════════════════════════════════════════════════════════
HOÀN TẤT TRONG MỘT PHẢN HỒI — HTML BLUEPRINT (MANDATORY)
═══════════════════════════════════════════════════════════
Render toàn bộ analysis_content thành html_report theo đúng Blueprint dưới đây:

1. MASTHEAD: <div class='masthead a' style='animation-delay:0s'>...với masthead-kicker, masthead-title (em cho phần mở rộng), masthead-meta</div>
2. MỖI SECTION: <div class='section a' style='animation-delay:[Tăng dần 0.06s]s'>...với sec-head (sec-num số lớn + sec-info)</div>
3. SWOT: <div class='swot-infographic'> gồm 4 .swot-q (strength/weakness/opportunity/threat) với swot-q-accent, swot-q-letter (S/W/O/T mờ), swot-q-label, swot-items dùng swot-tick (SVG) + swot-item
4. SWOT CROSS: <div class='swot-cross'> với 4 .sc-cell cho SO/ST/WO/WT analysis
5. AIDA: <div class='aida-funnel'> (4 aida-step) với aida-step-bar (màu), aida-step-letter, aida-step-name, aida-hook, aida-desc + ví dụ .aida-example với aida-ex-kicker
6. 4P: <div class='fourp-grid'> (4 fourp-card) với fourp-number, fourp-name, fourp-priority (pbar), fourp-body + .fourp-weakness với fw-icon, fw-label, fw-title
7. 5W1H: <div class='w1h-grid'> (6 w1h-card) với w1h-ghost (chữ lớn mờ), w1h-q, w1h-name, w1h-items
8. SMART: .smart-quote-block (blockquote) + .smart-gauges (5 smart-g với gauge-wrap SVG) + .smart-statement (dark block) + .timeline-wrap (3 tl-phase với tl-accent)
9. SYNTHESIS: .syn-diagram + .syn-connections (3 syn-conn) + .top3-block (3 top3-item)
10. CMO: .cmo-section với .cmo-header, .cmo-grid (4 cmo-card với cmo-card.highlight/danger/opp) + .verdict + .missing-block
11. FOOTER: .stats-bar (4 stat)

GHI CHÚ QUAN TRỌNG:
• TUYỆT ĐỐI KHÔNG bao gồm toàn bộ khối CSS vào thẻ <style> bên trong html_report. AI chỉ cần xuất ra các thẻ HTML với class tương ứng. Hệ thống Render sẽ tự động tiêm (inject) CSS.
• Dùng nháy đơn (') thay vì nháy kép (") trong HTML attributes.
• Animation-delay tăng dần 0.08s cho mỗi section chính.
• Màu sắc: black #0a0a0a, white #f8f6f0, green #1a5c3a, amber #b5621a, navy #1a3358, red #8a1a1a
• CMO verdict: blockquote với border-left 2px solid black
• Responsive: grid collapse ở 768px
`;

/** Alias tương thích import cũ */
export const OPTIMKI_SYSTEM_INSTRUCTION = OPTIMKI_PHASE1_SYSTEM_INSTRUCTION;
