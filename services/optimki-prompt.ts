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
 * CSS Design System — Editorial Minimalism v3
 * Inspired by Kinfolk, Cereal Magazine publications
 * Fonts: Cormorant Garamond (display) + Source Sans 3 (body)
 * Colors: Warm black/Warm white base + Earth accent tones
 * Components: Large section numbers, accent bars, minimal typography
 */
export const OPTIMKI_HTML_DESIGN_RULES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Archivo+Narrow:wght@400;500;600;700&family=Archivo:wght@300;400&display=swap');

:root {
  --mki-ink: #0a0a0a;
  --mki-ink-light: #3d3d3d;
  --mki-ink-faint: #7a7a7a;
  --mki-paper: #f8f6f0;
  --mki-paper-deep: #ddd9d0;
  --mki-accent: #1a5c3a;
  --mki-accent-w: #b5621a;
  --mki-rule: rgba(10, 10, 10, 0.1);
  --mki-display: 'Cormorant Garamond', serif;
  --mki-sans: 'Archivo Narrow', sans-serif;
  --mki-body: 'Archivo', sans-serif;
}

/* Base Styles */
.mki-report { font-family: var(--mki-body); background: var(--mki-paper); color: var(--mki-ink); font-size: 13.5px; line-height: 1.7; font-weight: 300; }
.mki-animate { opacity: 0; animation: mkiFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
@keyframes mkiFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Header */
.mki-header { border-bottom: 1px solid var(--mki-ink); padding: 4rem 0 3rem; margin-bottom: 4rem; display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 2rem; }
.mki-eyebrow { font-family: var(--mki-sans); font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--mki-ink-faint); font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; }
.mki-eyebrow::before { content: ''; display: block; width: 32px; height: 1px; background: var(--mki-paper-deep); }
.mki-title { font-family: var(--mki-display); font-size: 4.5rem; font-weight: 300; line-height: 1.05; letter-spacing: -0.02em; }
.mki-title em { color: var(--mki-accent); font-style: italic; font-weight: 400; }

/* Section Management */
.mki-section { margin-bottom: 6rem; }
.mki-sec-head { display: flex; align-items: center; gap: 2rem; margin-bottom: 3rem; }
.mki-sec-num { font-family: var(--mki-display); font-size: 6rem; font-weight: 300; color: var(--mki-paper-deep); line-height: 0.8; flex-shrink: 0; letter-spacing: -0.05em; }
.mki-sec-label { font-family: var(--mki-sans); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--mki-ink-faint); font-weight: 700; margin-bottom: 0.25rem; display: block; }
.mki-sec-title { font-family: var(--mki-display); font-size: 2rem; font-weight: 400; color: var(--mki-ink); line-height: 1.2; }

/* Components */
.mki-swot { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--mki-ink); margin-bottom: 4rem; }
.mki-swot-cell { padding: 2.5rem; border-right: 1px solid var(--mki-ink); border-bottom: 1px solid var(--mki-ink); position: relative; background: #fff; }
.mki-swot-cell:nth-child(2n) { border-right: none; }
.mki-swot-cell:nth-child(n+3) { border-bottom: none; }
.mki-swot-letter { font-family: var(--mki-display); font-size: 8rem; color: var(--mki-ink); position: absolute; top: 1rem; right: 1.5rem; opacity: 0.05; font-weight: 300; line-height: 1; }
.mki-swot-label { font-family: var(--mki-sans); font-size: 9px; text-transform: uppercase; color: var(--mki-ink-faint); letter-spacing: 0.2em; font-weight: 700; display: block; margin-bottom: 2rem; }
.mki-swot-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.8rem; }
.mki-swot-item { display: flex; gap: 1rem; font-size: 12px; color: var(--mki-ink-light); line-height: 1.6; align-items: baseline; }
.mki-swot-icon { width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; top: 2px; }

.mki-aida { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--mki-ink); margin-bottom: 4rem; position: relative; }
.mki-aida-step { padding: 3rem 1.5rem; border-right: 1px solid var(--mki-ink); }
.mki-aida-step:last-child { border-right: none; }
.mki-aida-letter { font-family: var(--mki-display); font-size: 4rem; font-weight: 300; color: var(--mki-ink); line-height: 1; margin-bottom: 0.5rem; display: block; }
.mki-aida-name { font-family: var(--mki-sans); font-size: 9px; text-transform: uppercase; color: var(--mki-ink-faint); letter-spacing: 0.2em; font-weight: 700; margin-bottom: 1.5rem; display: block; }
.mki-aida-hook { font-family: var(--mki-display); font-size: 1.25rem; font-style: italic; color: var(--mki-ink); line-height: 1.35; margin-bottom: 1rem; }

.mki-4p { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--mki-ink); margin-bottom: 4rem; }
.mki-4p-card { padding: 2.5rem; border-right: 1px solid var(--mki-ink); border-bottom: 1px solid var(--mki-ink); }
.mki-4p-card:nth-child(2n) { border-right: none; }
.mki-4p-card:nth-child(n+3) { border-bottom: none; }
.mki-4p-name { font-family: var(--mki-display); font-size: 2rem; font-weight: 300; color: var(--mki-ink); margin-bottom: 0.5rem; }

.mki-verdict { font-family: var(--mki-display); font-size: 2.25rem; font-style: italic; font-weight: 300; padding: 4rem 0 4rem 3rem; border-left: 2px solid var(--mki-ink); color: var(--mki-ink); margin: 5rem 0; line-height: 1.3; }
.mki-prose p { margin-bottom: 1.5rem; line-height: 1.8; }
.mki-prose strong { font-weight: 500; color: var(--mki-ink); }
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
• <head>: chứa <style> với toàn bộ CSS Editorial Minimalism Design System
• <body>: bắt đầu bằng <div class='optimki-editorial mki-report'> — wrapper chính
• Mỗi section: <div class='mki-section mki-animate'> với mki-sec-head (mki-sec-num + mki-sec-title) và nội dung
• Animation: mkiFadeUp, delay tăng dần 0.1s mỗi section
• KHÔNG bao gồm phần header/cover/masthead — UI component đã có header riêng

▌ SWOT INFOGRAPHIC:
<div class='mki-swot'> — grid 2×2
  Mỗi .mki-swot-cell: thêm class strength/weakness/opportunity/threat + mki-swot-letter (S/W/O/T) + mki-swot-label + mki-swot-list với mki-swot-item và mki-swot-icon

▌ SWOT CROSS: <div class='mki-swot-cross'> với 4 .mki-swot-cell cho phân tích chéo

▌ AIDA FUNNEL: .mki-aida grid 4 cột
  Mỗi .mki-aida-step: mki-aida-letter + mki-aida-name + mki-aida-hook (italic) + mki-aida-desc

▌ 4P MATRIX: .mki-4p 2×2 grid
  Mỗi .mki-4p-card: mki-4p-letter + mki-4p-name + mki-4p-priority + mki-4p-body

▌ 5W1H: .mki-5w1h grid 3 cột với mki-5w1h-card (mki-5w1h-q + mki-5w1h-name + mki-5w1h-body)

▌ SMART: .mki-smart-wrap + .mki-verdict (italic block) + .mki-smart (5 cột .mki-smart-g) + .mki-timeline (tl-phase)

▌ OUTPUT GIAI ĐOẠN 2 (JSON BẮT BUỘC):
Trả về DUY NHẤT một object JSON (không markdown fence):
{
  "html_report": "chuỗi HTML content (chỉ bao gồm cấu trúc bên trong <body>, KHÔNG BAO GỒM khối <style> khổng lồ)"
}

• QUAN TRỌNG: Không bao gồm thẻ <style> chứa toàn bộ CSS trong html_report. Hệ thống sẽ tự động inject CSS này khi render.
• Format: HTML/CSS chỉ dùng dấu nháy đơn '...' cho thuộc tính.
• Font: Cormorant Garamond (display), Source Sans 3 (body), JetBrains Mono (mono)
• Colors: #1a1a1a (ink), #fdfcfb (paper), #8b7355 (accent), #5a7a5a/#8b5a5a/#5a5a7a (swot colors)
• Responsive: grid collapse ở 900px và 640px
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
/* EDITORIAL MINIMALISM CSS RULES (PRE-LOADED IN UI - DO NOT RE-OUTPUT THIS ENTIRE BLOCK) */
${OPTIMKI_HTML_DESIGN_RULES}
</style>

${OPTIMKI_PHASE1_SYSTEM_INSTRUCTION.replace(OPTIMKI_PHASE1_OUTPUT_SPEC, '').trim()}

═══════════════════════════════════════════════════════════
HOÀN TẤT TRONG MỘT PHẢN HỒI — HTML BLUEPRINT (MANDATORY)
═══════════════════════════════════════════════════════════
Render toàn bộ analysis_content thành html_report theo đúng Blueprint dưới đây:

1. MỖI SECTION: <div class='mki-section mki-animate'>...với mki-sec-head (mki-sec-num + mki-sec-title)
2. SWOT: <div class='mki-swot'> gồm 4 .mki-swot-cell (strength/weakness/opportunity/threat) với mki-swot-letter, mki-swot-label, mki-swot-list
3. AIDA: <div class='mki-aida'> (4 .mki-aida-step) với mki-aida-letter, mki-aida-name, mki-aida-hook, mki-aida-desc
4. 4P: <div class='mki-4p'> (4 .mki-4p-card) với mki-4p-letter, mki-4p-name, mki-4p-priority, mki-4p-body
5. 5W1H: <div class='mki-5w1h'> (w1h-card) với w1h-q, w1h-name, body
6. VERDICT: .mki-verdict block
7. FOOTER: .mki-stats (4 .mki-stat)

GHI CHÚ QUAN TRỌNG:
• KHÔNG bao gồm phần header/cover/masthead — UI component đã có header riêng hiển thị brand_name và model_type
• TUYỆT ĐỐI KHÔNG bao gồm toàn bộ khối CSS vào thẻ <style> bên trong html_report. Hệ thống Render sẽ tự động tiêm (inject) CSS.
• Dùng nháy đơn (') thay vì nháy kép (") trong HTML attributes.
• Animation-delay tăng dần 0.08s cho mỗi section chính.
• Màu sắc: #1a1a1a (ink), #fdfcfb (paper), #8b7355 (accent), #5a7a5a/#8b5a5a/#5a5a7a (swot)
• Responsive: grid collapse ở 900px và 640px
`;

/** Alias tương thích import cũ */
export const OPTIMKI_SYSTEM_INSTRUCTION = OPTIMKI_PHASE1_SYSTEM_INSTRUCTION;
