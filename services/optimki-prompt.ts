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
 * CSS Design System — Dùng chung cho các bước render.
 */
export const OPTIMKI_HTML_DESIGN_RULES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#0f0f0d;--ink-2:#3a3935;--ink-3:#8a887f;--ink-4:#b8b6ae;
  --paper:#faf9f6;--paper-2:#f2f0eb;--paper-3:#e8e5de;
  --accent:#1a5c3a;--accent-w:#c17f2a;--accent-b:#1a3a5c;--danger:#8a1a1a;
  --purple:#5c1a5c;--green2:#2a7f3a;
  --rule:rgba(15,15,13,0.1);
  --serif:'Playfair Display',Georgia,serif;
  --sans:'DM Sans',system-ui,sans-serif;
}
body{background:var(--paper);font-family:var(--sans);color:var(--ink);font-size:13px;line-height:1.7}
.page{max-width:960px;margin:0 auto;padding:1.5rem 100px 6rem}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.a{animation:fadeUp .5s ease both;opacity:0;animation-fill-mode:both}

/* HEADER */
.doc-header{display:grid;grid-template-columns:1fr auto;align-items:start;padding-bottom:1.75rem;border-bottom:1px solid var(--rule);margin-bottom:2.5rem}
.eyebrow{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);font-weight:500;margin-bottom:.5rem}
.doc-title{font-family:var(--serif);font-size:30px;line-height:1.2;font-weight:400;color:var(--ink)}
.doc-title em{font-style:italic;color:var(--accent)}
.doc-tags{display:flex;flex-direction:column;gap:5px;align-items:flex-end}
.tag{font-size:10px;padding:3px 10px;border-radius:2px;font-weight:500;letter-spacing:.05em;color:#fff}

/* SEC HEAD */
.sh{display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;padding-bottom:.625rem;border-bottom:1px solid var(--rule)}
.sh-dot{width:13px;height:13px;border-radius:50%;flex-shrink:0}
.sh-title{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:500;color:var(--ink-2)}

/* SWOT */
.swot-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--rule);border-radius:3px;overflow:hidden;margin-bottom:1.5rem}
.swot-cell{padding:1.25rem;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.swot-cell:nth-child(2){border-right:none}
.swot-cell:nth-child(3){border-bottom:none}
.swot-cell:nth-child(4){border-right:none;border-bottom:none}
.swot-label{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:500;margin-bottom:1rem}
.swot-cell.strength .swot-label{color:var(--accent)}
.swot-cell.weakness .swot-label{color:var(--danger)}
.swot-cell.opportunity .swot-label{color:var(--accent-w)}
.swot-cell.threat .swot-label{color:var(--accent-b)}
.swot-item{display:flex;gap:10px;margin-bottom:12px;font-size:12.5px;color:var(--ink-2);line-height:1.65;align-items:baseline}
.swot-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;position:relative;top:4px}
.swot-cell.strength .swot-dot{background:var(--accent)}
.swot-cell.weakness .swot-dot{background:var(--danger)}
.swot-cell.opportunity .swot-dot{background:var(--accent-w)}
.swot-cell.threat .swot-dot{background:var(--accent-b)}
.swot-item strong{color:var(--ink);font-weight:600}
*{font-weight:400}
strong{font-weight:600}

/* CROSS */
.cross-group{padding-left:1rem;border-left:2px solid;margin-bottom:1.1rem}
.cross-label{font-size:11px;font-weight:500;margin-bottom:.375rem}
.cross-body{font-size:12px;color:var(--ink-2);line-height:1.7}

/* TOP3 */
.top3{border:1px solid var(--rule);border-radius:3px;overflow:hidden;margin-top:1.25rem}
.top3-head{padding:.625rem 1rem;background:var(--paper-2);border-bottom:1px solid var(--rule);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);font-weight:500}
.top3-item{display:flex;gap:12px;padding:.875rem 1rem;border-bottom:1px solid var(--rule);align-items:flex-start}
.top3-item:last-child{border-bottom:none}
.top3-num{font-family:var(--serif);font-size:20px;color:var(--paper-3);line-height:1;flex-shrink:0;width:24px}
.top3-text{font-size:12px;color:var(--ink-2);line-height:1.65}
.top3-text strong{color:var(--ink);font-weight:500}

/* AIDA */
.aida-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--rule);border-radius:3px;overflow:hidden;margin-bottom:1.25rem}
.aida-col{padding:1.1rem;border-right:1px solid var(--rule)}
.aida-col:last-child{border-right:none}
.aida-letter{font-family:var(--serif);font-size:32px;color:var(--paper-3);line-height:1;margin-bottom:.375rem}
.aida-step-label{font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:500;margin-bottom:.625rem}
.aida-body{font-size:12px;color:var(--ink-2);line-height:1.7}
.aida-hook{font-family:var(--serif);font-size:13px;color:var(--ink);line-height:1.45;font-style:italic;margin-bottom:.5rem}
.aida-example{background:var(--paper-2);border-radius:3px;padding:1.25rem;border-left:2px solid var(--accent-w);margin-top:1.25rem}
.aida-ex-label{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);font-weight:500;margin-bottom:.75rem}
.aida-ex-body{font-size:12px;color:var(--ink-2);line-height:1.8}

/* 4P */
.fourp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.25rem}
.fourp-card{border:1px solid var(--rule);border-radius:3px;padding:1.1rem}
.fourp-name{font-family:var(--serif);font-size:18px;color:var(--ink);margin-bottom:.25rem}
.fourp-pri{font-size:10px;color:var(--ink-3);margin-bottom:.75rem;letter-spacing:.04em}
.fourp-body{font-size:12px;color:var(--ink-2);line-height:1.7}
.fourp-body li{margin-bottom:4px;padding-left:.75rem;position:relative}
.fourp-body li::before{content:'·';position:absolute;left:0;color:var(--ink-3)}
.fourp-weak{border:2px solid var(--danger);border-radius:3px;padding:1.1rem}
.fourp-weak-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--danger);font-weight:500;margin-bottom:.5rem}
.fourp-weak-body{font-size:12px;color:var(--ink-2);line-height:1.7}

/* 5W1H */
.w1h-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:1.25rem}
.w1h-card{border:1px solid var(--rule);border-radius:3px;padding:1.1rem;position:relative;overflow:hidden}
.w1h-bg-letter{position:absolute;top:-10px;right:-5px;font-family:var(--serif);font-size:72px;color:var(--ink);opacity:.04;line-height:1;pointer-events:none}
.w1h-name{font-size:11px;font-weight:500;color:var(--ink);margin-bottom:.5rem;letter-spacing:.02em}
.w1h-body{font-size:12px;color:var(--ink-2);line-height:1.7;position:relative;z-index:1}
.w1h-body li{margin-bottom:3px;padding-left:.75rem;position:relative}
.w1h-body li::before{content:'·';position:absolute;left:0;color:var(--ink-3)}

/* SMART */
.smart-quote{font-family:var(--serif);font-size:18px;font-style:italic;color:var(--ink-2);border-left:2px solid var(--ink-2);padding-left:1.25rem;margin-bottom:1.5rem;line-height:1.45}
.smart-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.5rem}
.smart-criterion{border:1px solid var(--rule);border-radius:3px;padding:1rem}
.smart-crit-label{font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:500;margin-bottom:.375rem}
.smart-crit-body{font-size:12px;color:var(--ink-2);line-height:1.65;margin-bottom:.5rem}
.smart-bar{height:3px;background:var(--paper-3);border-radius:99px;overflow:hidden}
.smart-fill{height:100%;background:var(--accent);border-radius:99px}
.smart-dark{background:var(--ink);border-radius:3px;padding:1.25rem;margin-bottom:1.5rem}
.smart-dark-text{font-family:var(--serif);font-size:14px;color:rgba(255,255,255,.82);line-height:1.65}
.smart-dark-text strong{color:#fff}

/* TIMELINE */
.timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--rule);border-radius:3px;overflow:hidden}
.tl-col{padding:1rem;border-right:1px solid var(--rule)}
.tl-col:last-child{border-right:none}
.tl-month{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);font-weight:500;margin-bottom:.25rem}
.tl-title{font-family:var(--serif);font-size:13px;color:var(--ink);margin-bottom:.625rem}
.tl-item{display:flex;gap:6px;margin-bottom:4px;font-size:11.5px;color:var(--ink-2);line-height:1.55;align-items:baseline}
.tl-dot{width:3px;height:3px;border-radius:50%;flex-shrink:0;position:relative;top:5px}

/* SYNTHESIS */
.syn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--rule);border-radius:3px;overflow:hidden;margin-bottom:1.25rem}
.syn-col{padding:1.1rem;border-right:1px solid var(--rule);font-size:12px;color:var(--ink-2);line-height:1.7}
.syn-col:last-child{border-right:none}
.syn-col strong{color:var(--accent);font-weight:500}

/* CMO */
.cmo-wrap{border-top:2px solid var(--ink);padding-top:2rem;margin-bottom:2rem}
.cmo-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1.5rem}
.cmo-label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-3);font-weight:500}
.cmo-sig{font-family:var(--serif);font-size:13px;color:var(--ink-3);font-style:italic}
.cmo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.25rem}
.cmo-card{border:1px solid var(--rule);border-radius:3px;padding:1rem 1.1rem}
.cmo-card.pri{border-color:var(--accent);background:rgba(26,92,58,.03)}
.cmo-card.risk{border-left:3px solid var(--danger);border-radius:0 3px 3px 0}
.cmo-card.opp{border-left:3px solid var(--accent-w);border-radius:0 3px 3px 0}
.cmo-num{font-family:var(--serif);font-size:12px;color:var(--ink-4);margin-bottom:.25rem}
.cmo-title{font-size:11px;font-weight:500;margin-bottom:.375rem;line-height:1.4}
.cmo-body{font-size:12px;color:var(--ink-2);line-height:1.75}
.cmo-body strong{color:var(--ink);font-weight:500}
.verdict-quote{font-family:var(--serif);font-size:15px;color:var(--ink);line-height:1.55;font-style:italic;padding:1.1rem 1.5rem;background:var(--paper-2);border-radius:3px;border-left:2px solid var(--ink)}

/* MISSING */
.missing{border-top:1px dashed var(--rule);padding-top:1.25rem;margin-top:1.5rem}
.missing-label{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);font-weight:500;margin-bottom:.75rem}
.missing-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.missing-item{font-size:12px;color:var(--ink-3);line-height:1.6;display:flex;gap:6px;align-items:baseline}
.missing-dash{color:var(--ink-4);flex-shrink:0}

/* FOOTER */
.footer-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--ink);border-radius:3px;overflow:hidden;margin-top:2rem}
.fb-col{padding:.875rem 1.25rem;border-right:1px solid var(--ink);text-align:center}
.fb-col:last-child{border-right:none}
.fb-val{font-family:var(--serif);font-size:20px;color:var(--ink);display:block}
.fb-lbl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin-top:3px}

.section-gap{margin-bottom:2.5rem}

/* RESPONSIVE */
@media (max-width: 900px) {
  .aida-steps, .timeline, .syn-grid, .footer-bar { grid-template-columns: 1fr }
  .aida-col, .tl-col, .syn-col { border-right: none; border-bottom: 1px solid var(--rule) }
  .aida-col:last-child, .tl-col:last-child, .syn-col:last-child { border-bottom: none }
}
@media (max-width: 640px) {
  .doc-header { grid-template-columns: 1fr; gap: 1rem }
  .doc-tags { align-items: flex-start }
  .swot-grid, .fourp-grid, .w1h-grid, .smart-grid, .cmo-grid, .missing-grid { grid-template-columns: 1fr }
  .swot-cell { border-right: none !important }
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

ĐIỂM MẠNH
→ 4–5 điểm từ {{diem_manh_yeu}} · Format: <strong>[Header]</strong> — [Nội dung giải thích]
⚠️ Nếu {{diem_manh_yeu}} trống → phân tích từ {{mo_ta}}, dùng header bold + ' — '

ĐIỂM YẾU
→ 4–5 điểm từ dữ liệu · Format: <strong>[Header]</strong> — [Nội dung giải thích]
⚠️ Nếu {{diem_manh_yeu}} trống → ghi rõ đang thiếu dữ liệu thực tế

CƠ HỘI
→ 4–5 cơ hội · Format: <strong>[Header]</strong> — [Nội dung giải thích]

THÁCH THỨC
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
${OPTIMKI_HTML_DESIGN_RULES}
</style>

═══════════════════════════════════════════════════════════
OPTI M.KI · GIAI ĐOẠN 2 (CHỈ RENDER HTML — Cách 2: tách lần gọi API)
═══════════════════════════════════════════════════════════
Design System đã được cung cấp ở trên.
User message chứa JSON phân tích giai đoạn 1. Nhiệm vụ DUY NHẤT: chuyển analysis_content thành một file HTML hoàn chỉnh.
NGHIÊM CẤM thêm phân tích chiến lược mới, bịa số liệu, hoặc đổi kết luận — chỉ bố cục và trình bày.

▌ CẤU TRÚC HTML TRONG html_report:
• <head>: chứa <style> với toàn bộ CSS bên trên
• <body>: bắt đầu bằng <div class='page'> — wrapper chính
• Các section được phân tách bằng <div class='section-gap'> (margin-bottom:2.5rem)
• Mỗi section dùng class .a với animation-delay tăng dần 0.06s

▌ OUTPUT GIAI ĐOẠN 2 (JSON BẮT BUỘC — chỉ khóa html_report):
Trả về DUY NHẤT một object JSON (không markdown fence):
{
  "html_report": "chuỗi file HTML đầy đủ <!DOCTYPE html> … </html>"
}

• Trong html_report: HTML/CSS chỉ dùng dấu nháy đơn '...' cho thuộc tính; tránh dấu nháy kép để không vỡ JSON.
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
${OPTIMKI_HTML_DESIGN_RULES}
</style>

${OPTIMKI_PHASE1_SYSTEM_INSTRUCTION.replace(OPTIMKI_PHASE1_OUTPUT_SPEC, '').trim()}

═══════════════════════════════════════════════════════════
HOÀN TẤT TRONG MỘT PHẢN HỒI — HTML BLUEPRINT (MANDATORY)
═══════════════════════════════════════════════════════════
Render toàn bộ analysis_content thành html_report theo đúng Blueprint dưới đây:

1. HEADER: <div class='doc-header a' style='animation-delay:.0s'>...</div>
2. MỖI SECTION: <div class='section-gap a' style='animation-delay:[Tăng dần 0.06s]s'>...</div>
3. SWOT GRID: <div class='swot-grid'> (4 swot-cell: class 'strength', 'weakness', 'opportunity', 'threat') </div>
4. CROSS ANALYSIS: <div style='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.25rem'> (4 cross-group) </div>
5. AIDA STEPS: <div class='aida-steps'> (4 aida-col) </div>
6. 4P GRID: <div class='fourp-grid'> (4 fourp-card) </div> + <div class='fourp-weak'>...</div>
7. 5W1H GRID: <div class='w1h-grid'> (6 w1h-card với w1h-bg-letter) </div>
8. SMART: <div class='smart-quote'>...</div> + <div class='smart-grid'>...</div> + <div class='smart-dark'>...</div> + <div class='timeline'>...</div>
9. SYNTHESIS: <div class='syn-grid'>...</div>
10. CMO ADVICE: <div class='cmo-wrap'>...</div> + <div class='verdict-quote'>...</div> + <div class='missing'>...</div>
11. FOOTER: <div class='footer-bar a' style='animation-delay:0.48s'>...</div>

GHI CHÚ QUAN TRỌNG:
• Dùng nháy đơn (') thay vì nháy kép (") trong HTML attributes.
• Animation-delay tăng dần 0.06s cho mỗi thành phần chính.
`;

/** Alias tương thích import cũ */
export const OPTIMKI_SYSTEM_INSTRUCTION = OPTIMKI_PHASE1_SYSTEM_INSTRUCTION;
