# Feature Input Page Design System — OptiM.KI

> Nguồn: `IMCPlanner.tsx` · `FeatureHeader.tsx` · `imc-planner-editorial-field.tsx` · `index.html` · 2026-04-26  
> **Đã kiểm chứng:** Style input form là **Tailwind thuần** — không bị override bởi CSS editorial cũ.

---

## 🔍 Ghi chú Kiểm chứng (Style Audit)

> **Mục đích:** Bạn lo ngại rằng các file CSS cũ (editorial style) có thể đang override giao diện hiện tại và gây nhầm lẫn khi trích xuất. Dưới đây là kết quả audit.

### Kết luận: Input Form = Tailwind thuần, KHÔNG có editorial override

| File CSS | Được import ở | Tác động lên Input Form |
|---|---|---|
| `MastermindStrategyEditorial.css` | `IMCPlanner.tsx` line 13 | ❌ KHÔNG — chỉ chứa classes `.ms-report`, `.ms-hero-board`, `.ms-vault-*` cho phần **output/kết quả** |
| `imc-planner-editorial.css` | Không import trong IMCPlanner | ❌ KHÔNG — chứa `.imc-exec-*`, `.imc-doc-*` cho layout kết quả cũ, **không được dùng** |
| `imc-planner-editorial-field.tsx` | Import bởi `IMCPlanner.tsx` | ✅ Đúng nhưng component này **chỉ dùng Tailwind classes**, không có CSS class riêng |

### Global tokens từ `index.html` (áp dụng toàn app)

Các CSS variable này được khai báo trong `index.html :root` và dùng bởi các file CSS output, **không ảnh hưởng input form** (vì input dùng Tailwind):

```css
:root {
  --rk-ink:        #1c1917;           /* stone-900 tương đương */
  --rk-ink-2:      rgba(28,25,23,0.84);
  --rk-ink-3:      rgba(28,25,23,0.62);
  --rk-ink-4:      rgba(28,25,23,0.34);
  --rk-paper:      #fcfbf8;
  --rk-paper-2:    #f8f6f3;
  --rk-paper-3:    #f1ede8;
  --rk-accent:     #1c1917;
  --rk-rule:       rgba(28,25,23,0.10);
  --rk-serif:      'Plus Jakarta Sans', sans-serif;   /* cả serif cũng là Plus Jakarta Sans */
  --rk-sans:       'Plus Jakarta Sans', sans-serif;
}
```

**Global `body`** (index.html):
```css
body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 400;
  font-size: 14px;
  background-color: #FCFBF8;
  color: #1C1917;
}
```

**Tailwind custom theme** (index.html):
```js
theme.extend.fontFamily: {
  sans:    ["Plus Jakarta Sans", sans-serif],
  serif:   ["Plus Jakarta Sans", sans-serif],  // serif = Plus Jakarta Sans (không phải Georgia/Times)
  display: ["Plus Jakarta Sans", sans-serif],
}
```

### Tại sao tên file vẫn có "editorial"?

Tên file giữ nguyên từ version cũ để không phá vỡ imports. **Style đã được refactor sang Tailwind** nhưng tên file không đổi:
- `imc-planner-editorial-field.tsx` → Vẫn dùng, nhưng nội dung bên trong là Tailwind thuần
- `imc-planner-editorial.css` → Vẫn tồn tại nhưng **không được import** trong luồng hiện tại
- `MastermindStrategyEditorial.css` → Vẫn import, nhưng chỉ dùng cho phần output, không override form

---

## ⚠️ Quy tắc Thiết kế Đồng bộ (Universal Standard)

> **File này là template giao diện input chuẩn cho TẤT CẢ các tính năng trong OptiM.KI.**
>
> IMC Planner là tính năng tham chiếu (reference implementation). Mọi tính năng khác khi xây dựng trang nhập liệu **PHẢI tuân thủ toàn bộ design system này** để đảm bảo UI đồng nhất xuyên suốt sản phẩm.

### Nguyên tắc thay thế

Khi áp dụng cho tính năng mới, **chỉ được thay đổi**:

| Phần tử | Được thay đổi | Ví dụ |
|---|---|---|
| `eyebrow` | Tên framework / loại AI | `"AI COPYWRITING ENGINE"` |
| `title` | Tên tính năng | `"Hook Generator"` |
| `subline` | Mô tả ngắn quy trình | `"3 bước → Hook cuốn hút đúng insight"` |
| Icon header | Icon đại diện (Lucide) | `Zap`, `Brain`, `Lightbulb`... |
| Wizard steps | Số bước và tên giai đoạn | 2 bước, 4 bước tuỳ tính năng |
| Fields | Tên trường, placeholder, hint | Tuỳ domain |
| Field layout | Grid 1–2 cột, textarea vs input | Tuỳ độ phức tạp |

**KHÔNG được thay đổi:**

- Màu sắc, typography, spacing của header
- Cấu trúc FeatureHeader (eyebrow + title + subline + actions right)
- Style của tab switcher, history button, primary CTA button
- Card `cardClass` (rounded-2xl, border, shadow)
- Wizard progress bar style (border-b-2, tracking uppercase)
- ImcPlannerEditorialField label / badge / hint pattern
- Input style (rounded-xl, border-stone-200, focus:border-stone-400)
- Animations (fade-in slide-in-from-bottom-4, slide-in-from-right-4)
- Page layout wrapper (h-screen flex-col, scroll area px/py)

### Mapping tính năng → tham số thay thế

| Tính năng | Icon | Eyebrow | Title | Subline |
|---|---|---|---|---|
| IMC Planner | `Target` | AI-POWERED STRATEGIC FRAMEWORK | IMC Planner | 3 bước nhập liệu → Kế hoạch IMC đa kênh |
| Mastermind Strategy | `Brain` | AI STRATEGY ENGINE | Mastermind Strategy | Nhập brief → Chiến lược tổng thể |
| Hook Generator | `Zap` | AI COPYWRITING ENGINE | Hook Generator | 2 bước → Hook cuốn hút đúng insight |
| STP Model | `Layers` | AI SEGMENTATION FRAMEWORK | STP Model | Phân tích → STP chuyên sâu |
| PESTEL Builder | `Globe` | AI STRATEGIC ANALYSIS | PESTEL Builder | Phân tích môi trường vĩ mô |
| Porter's Analyzer | `Target` | AI COMPETITIVE FRAMEWORK | Porter's Analyzer | 5 lực lượng cạnh tranh |
| Insight Finder | `BrainCircuit` | AI CONSUMER INTELLIGENCE | Insight Finder | Khai thác insight người dùng |
| Customer Journey | `Map` | AI JOURNEY MAPPING | Customer Journey Mapper | Vẽ hành trình khách hàng |
| Auto Brief | `FileText` | AI BRIEF GENERATOR | Auto Brief | Tạo brief marketing chuẩn |
| Persona Builder | `Users` | AI PERSONA ENGINE | Persona Builder | Xây dựng chân dung khách hàng |
| *(tính năng mới)* | *chọn icon phù hợp* | *AI [DOMAIN] ENGINE* | *Tên tính năng* | *N bước → Kết quả* |

---

## 1. Design Tokens

### 1.1 Colors

| Token | Value | Dùng cho |
|---|---|---|
| Page BG | `#FCFDFC` | Nền toàn trang (`bg-[#FCFDFC]`) |
| Header BG | `#FCFDFC` | Nền `<header>` FeatureHeader |
| Card surface | `white` | Nền card (`bg-white`) |
| Card border | `rgba(stone-200, 0.9)` — `border-stone-200/90` | Viền card |
| Card shadow | `0 1px 2px rgba(15,23,42,0.04)` | Shadow card nhẹ |
| Primary text | `stone-900` / `#0C0A09` | Tiêu đề, input text |
| Secondary text | `stone-500` | Hint, sub-label |
| Meta / eyebrow | `stone-400` | Eyebrow, label phụ |
| Header border-b | `rgba(stone-200, 0.7)` — `border-stone-200/70` | Đường kẻ dưới header |
| Input border default | `border-stone-200` | Viền input mặc định |
| Input border focus | `border-stone-400` | Viền input khi focus |
| Input BG | `white` | Nền input |
| Input BG disabled | `stone-50` | Nền input disabled |
| Input text disabled | `stone-500` | Chữ input disabled |
| Placeholder | `stone-300` | Placeholder input |
| Wizard BG bar | `stone-50/50` | Nền thanh wizard step |
| Wizard active border | `border-stone-900` | Bottom border step active |
| Wizard text active | `stone-900` | Text step active |
| Wizard text inactive | `stone-400` | Text step inactive |
| Primary action BG | `stone-950` (`#0C0A09`) | Nút "Tạo kế hoạch" |
| Primary action hover | `stone-800` | Hover nút primary |
| History button (active) | `stone-900` bg + `white` text | Nút lịch sử khi đang mở |
| History button (default) | `white` bg, `stone-600` text, `stone-200` border | Nút lịch sử mặc định |
| Tab active | `white` bg, `stone-900` text | Tab đang chọn |
| Tab inactive | transparent bg, `stone-400` text → `stone-600` hover | Tab không chọn |
| Tab container BG | `stone-50/30` | Nền pill tab switcher |
| Quota badge BG | `stone-100` | Nền quota indicator |
| Quota badge text | `stone-600` | Chữ quota |
| Quota icon | `amber-500` fill+stroke | Icon Zap |
| Required badge BG | `rose-50` + `ring-rose-100/80` | Badge "Bắt buộc" |
| Required badge text | `rose-600` | Chữ badge "Bắt buộc" |
| Optional badge BG | `amber-50` + `ring-amber-100/80` | Badge "Tùy chọn" |
| Optional badge text | `amber-700` | Chữ badge "Tùy chọn" |
| Mode btn active | `border-stone-900 bg-stone-50 ring-1 ring-stone-900/10` | Planning mode selected |
| Mode btn inactive hover | `hover:border-stone-300 hover:bg-stone-50/50` | Hover mode không chọn |
| Step number circle BG | `white` border `stone-200` | Số thứ tự giai đoạn |

---

### 1.2 Typography

| Phần tử | Size | Weight | Đặc điểm |
|---|---|---|---|
| Toàn trang font | — | — | `"Plus Jakarta Sans", sans-serif` (kế thừa body) |
| **Header — Eyebrow** | `10px` | `700` (bold) | `uppercase tracking-[0.15em] text-stone-400` |
| **Header — Title** | `1.5rem` (24px / text-2xl) | `600` (semibold) | `tracking-tight leading-tight text-stone-900` |
| **Header — Subline** | `12px` (text-xs) | `500` (medium) | `text-stone-400 mt-1` |
| Field label (eyebrow) | `10px` | `700` (bold) | `uppercase tracking-[0.14em] text-stone-950` |
| Field badge "Bắt buộc" | `8px` | `600` (semibold) | `uppercase tracking-wide` |
| Field badge "Tùy chọn" | `8px` | `600` (semibold) | `uppercase tracking-wide` |
| Input text | `14px` (text-sm) | `400` | `text-stone-900` |
| Input placeholder | `14px` | `400` | `text-stone-300` |
| Wizard step label | `10px` | `700` (bold) | `uppercase tracking-[0.2em]` |
| Section title (h2) | `16px` (text-base) | `500` (medium) | `tracking-tight text-stone-900` |
| Section meta | `10px` | `500` (medium) | `uppercase tracking-wider text-stone-400` |
| Step number | `12px` (text-xs) | `600` | `text-stone-900` |
| Mode btn label | `9px` (mobile) / `9.5px` | `600` | `leading-tight text-stone-900` |
| Mode btn desc | `7.5px` (mobile) / `8px` | `400` | `leading-tight text-stone-500 line-clamp-2` |
| Tab switcher text | `14px` (text-sm) | `500` (medium) | — |
| Quota indicator | `10px` | `500` (medium) | — |
| History card title | `16px` | `500` | `text-stone-900 line-clamp-1` |
| History card meta | `14px` (text-sm) | `400` | `text-stone-500` |

---

### 1.3 Spacing & Layout

| Phần tử | Value |
|---|---|
| Page container | `flex h-screen flex-col overflow-hidden` |
| Content scroll area | `flex-1 overflow-y-auto px-4 py-6 lg:px-8 xl:px-10` |
| Inner max-width | `max-w-[1182px] mx-auto w-full` |
| Card (`cardClass`) | `rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]` |
| Wizard card min-height | `min-h-[360px]` |
| Wizard content padding | `p-5 md:p-6` |
| Grid columns | `grid-cols-1 md:grid-cols-2` |
| Grid gap | `gap-x-6 gap-y-5` |
| Field spacing | `space-y-5` |
| Animate-in card | `animate-in fade-in slide-in-from-bottom-4 duration-700` |
| Wizard step animate | `animate-in fade-in slide-in-from-right-4 duration-300` |

---

## 2. Components

### 2.1 FeatureHeader (Header trang IMC)

Hiển thị như trong ảnh: left = eyebrow + title + subline · right = quota + tab + history + CTA

```
element: <header>
display: flex shrink-0 items-center justify-between
padding: py-6 px-8
border-bottom: 1px solid rgba(stone-200, 0.7)
background: #FCFDFC
```

**Left side — Identity block:**
```
display: flex flex-col gap-1

Eyebrow row:
  display: flex items-center gap-2 text-stone-400
  icon: Target  size=14  strokeWidth=1.5
  text: "AI-POWERED STRATEGIC FRAMEWORK"
        font-size: 10px  font-weight: 700  uppercase  tracking-[0.15em]

Title:
  element: <h2>
  text: "IMC Planner"
  font-size: 24px (text-2xl)  font-weight: 600
  tracking: tight  leading: tight  color: stone-900

Subline:
  text: "3 bước nhập liệu → Kế hoạch IMC đa kênh chuyên nghiệp."
  font-size: 12px (text-xs)  font-weight: 500
  color: stone-400  margin-top: 4px (mt-1)
```

**Right side — Actions container:**
```
display: flex items-center gap-4
```

---

### 2.2 Quota Indicator

```
display: flex items-center  |  gap: 6px (gap-1.5)
border-radius: rounded-full
padding: px-3 py-1
background: stone-100
font-size: 10px  |  font-weight: 500  |  color: stone-600
margin-right: mr-2

icon: Zap  size=10  className="text-amber-500 fill-amber-500"
text: "{N} lượt kế hoạch"
```

---

### 2.3 Tab Switcher (Thủ công / Brand Vault)

```
display: inline-flex  |  gap: 4px (gap-1)
border-radius: rounded-2xl (16px)
border: 1px solid stone-200
background: stone-50/30
padding: p-1 (4px)
shadow: shadow-sm
margin-right: mr-2
```

**Tab button:**
```
display: flex items-center  |  gap: 8px (gap-2)
border-radius: rounded-xl (12px)
padding: px-4 py-2
font-size: 14px (text-sm)  |  font-weight: 500
transition: all
```

| State | Style |
|---|---|
| Active | `bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5` |
| Inactive | `text-stone-400` |
| Inactive hover | `hover:text-stone-600` |

**Tab icons:**
- "Thủ công": `Pencil` `size={14}`
- "Brand Vault": `Diamond` `size={14}` — Pro = `text-amber-500 fill-amber-500` | non-Pro = `text-stone-400`

---

### 2.4 History Button

```
display: inline-flex  |  size: h-10 w-10 (40×40px)  |  shrink-0
border-radius: rounded-2xl (16px)
items-center justify-center  |  transition: all
icon: History  size=17  strokeWidth=1.5
```

| State | Style |
|---|---|
| Active (history mode) | `bg-stone-900 text-white shadow-md` |
| Default | `border border-stone-200 bg-white text-stone-600 shadow-sm` |
| Hover (default) | `hover:bg-stone-50` |

---

### 2.5 Primary CTA Button — "Tạo kế hoạch"

```
display: inline-flex items-center  |  gap: 8px (gap-2)
border-radius: rounded-2xl (16px)
padding: px-6 py-2.5 (24px × 10px)
background: stone-950 (#0C0A09)
color: white
font-size: 14px (text-sm)  |  font-weight: 500
shadow: shadow-md
transition: all
```

| State | Style |
|---|---|
| Default | `bg-stone-950 text-white shadow-md` |
| Hover | `hover:bg-stone-800` |
| Active/Click | `active:scale-95` |

Icon: `Plus` `size={18}` `strokeWidth={2.5}`

---

### 2.6 Wizard Progress Bar

```
container:
  display: flex  |  border-bottom: 1px solid stone-200
  background: stone-50/50

step item:
  flex: 1  |  display: flex flex-col items-center justify-center
  padding: py-3
  text-align: center
  transition: colors
```

| State | Style |
|---|---|
| Active | `border-b-2 border-stone-900 text-stone-900` |
| Inactive | `border-b-2 border-transparent text-stone-400` |

Step label: `text-[10px] font-bold uppercase tracking-[0.2em]` · Content: `"Giai đoạn {1/2/3}"`

---

### 2.7 ImcPlannerEditorialField

```
Field container: <div>

Label row:
  display: flex flex-wrap items-center  |  gap: 6px (gap-1.5)  |  mb-1.5

  Field title:
    element: <span>
    font-size: 10px  |  font-weight: 700  |  uppercase
    tracking: tracking-[0.14em]  |  color: stone-950

  Badge "Bắt buộc" (required):
    border-radius: rounded (4px)
    padding: px-1.5 py-px  |  font-size: 8px  |  font-weight: 600
    uppercase  |  tracking: tracking-wide
    background: rose-50  |  color: rose-600
    ring: ring-1 ring-rose-100/80

  Badge "Tùy chọn" (optional):
    border-radius: rounded (4px)
    padding: px-1.5 py-px  |  font-size: 8px  |  font-weight: 600
    uppercase  |  tracking: tracking-wide
    background: amber-50  |  color: amber-700
    ring: ring-1 ring-amber-100/80

  EditorialFieldHint (tooltip icon):
    Nhỏ info icon hiển thị popup gợi ý

Control wrapper:
  position: relative  |  margin-top: mt-0.5
  children: input / select / custom control
```

---

### 2.8 Input / Select Control

```
width: w-full
border-radius: rounded-xl (12px)
border: 1px solid stone-200
background: white
padding: px-3 py-2 (12px × 8px)
font-size: 14px (text-sm)
color: stone-900
outline: none
transition: all
placeholder: text-stone-300
```

| State | Border |
|---|---|
| Default | `border-stone-200` |
| Focus | `border-stone-400` |
| Disabled | `border-stone-200 bg-stone-50 text-stone-500` |

---

### 2.9 Planning Mode Selector

```
container:
  display: grid  |  grid-cols-3  |  gap: 8px (gap-2) / 10px (gap-2.5) sm
  max-width: max-w-[380px]
  role="group"

button per mode:
  display: flex flex-col items-center justify-center
  gap: 2px (gap-0.5) / 4px (gap-1) sm
  border-radius: rounded-lg (8px)
  border: 1px
  padding: p-1.5 py-2 / p-2 py-2.5 sm
  text-align: center
  overflow: hidden
  transition: all
```

| State | Style |
|---|---|
| Selected | `border-stone-900 bg-stone-50 ring-1 ring-stone-900/10` |
| Default | `border-stone-200` |
| Hover | `hover:border-stone-300 hover:bg-stone-50/50` |

**Icon:** `size={15}` `strokeWidth=1.5` — selected: `text-stone-900` | default: `text-stone-500`

**Label:** `text-[9px] sm:text-[9.5px] font-semibold leading-tight text-stone-900`

**Description:** `text-[7.5px] sm:text-[8px] leading-tight text-stone-500 line-clamp-2`

Modes: `Tôi có Ngân sách` (Wallet icon) · `Tôi có Mục tiêu` (Target icon) · `Kiểm tra Khả thi` (Scale icon)

---

### 2.10 Section Header (Giai đoạn header)

```
display: flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between

Left:
  display: flex items-center  |  gap: 10px (gap-2.5)

  Step circle:
    h-8 w-8 (32×32px)  |  rounded-full  |  shrink-0
    border: 1px solid stone-200  |  background: white
    font-size: 12px (text-xs)  |  font-weight: 600  |  color: stone-900
    display: flex items-center justify-center

  Title:
    font-size: 16px (text-base)  |  font-weight: 500
    tracking: tight  |  color: stone-900

Right meta:
  font-size: 10px  |  font-weight: 500  |  uppercase
  tracking: tracking-wider  |  color: stone-400
  padding-top: sm:pt-1
```

---

## 3. Page Layout Structure

```
<div> — flex h-screen flex-col overflow-hidden bg-[#FCFDFC]
  │
  ├─ <FeatureHeader> — shrink-0 border-b py-6 px-8
  │    ├─ Left: eyebrow + title + subline
  │    └─ Right: quota + tab-switcher + history-btn + cta-btn
  │
  └─ <div> — flex-1 overflow-y-auto px-4 py-6 lg:px-8 xl:px-10
       └─ <div> — mx-auto w-full max-w-[1182px]
            └─ animate-in fade-in slide-in-from-bottom-4 duration-700
                 │
                 ├─ [Brand Vault bar] — cardClass mb-5 p-4 (Pro only)
                 │
                 └─ [Main wizard card] — cardClass flex min-h-[360px] flex-col overflow-hidden
                      ├─ Wizard Progress Bar — flex border-b bg-stone-50/50
                      └─ Content — flex-1 flex-col p-5 md:p-6
                           ├─ Giai đoạn 1 — grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5
                           ├─ Giai đoạn 2 — grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5
                           └─ Giai đoạn 3 — grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5
```

---

## 4. Button Specifications (tổng hợp)

| Button | Size | Padding | Border-radius | BG | Text | Border | Shadow | Hover | Active |
|---|---|---|---|---|---|---|---|---|---|
| **Tạo kế hoạch** (primary CTA) | — | `px-6 py-2.5` | `rounded-2xl` | `stone-950` | `white 14px w-500` | none | `shadow-md` | `bg-stone-800` | `scale-95` |
| **History** (icon btn) | `h-10 w-10` | — | `rounded-2xl` | `white` (default) / `stone-900` (active) | `stone-600` / `white` | `border-stone-200` | `shadow-sm` | `bg-stone-50` | — |
| **Tab — Thủ công** | — | `px-4 py-2` | `rounded-xl` | `white` (active) / none | `stone-900` / `stone-400` | none (active: `ring-1 ring-stone-900/5`) | `shadow-sm` (active) | `text-stone-600` | — |
| **Tab — Brand Vault** | — | `px-4 py-2` | `rounded-xl` | `white` (active) / none | `stone-900` / `stone-400` | none (active: `ring-1 ring-stone-900/5`) | `shadow-sm` (active) | `text-stone-600` | — |
| **Planning Mode** (3 items) | — | `p-1.5 py-2 / p-2 py-2.5` | `rounded-lg` | `stone-50` (active) / `white` | `stone-900` | `stone-900` (active) / `stone-200` | none (active: `ring-1 ring-stone-900/10`) | `border-stone-300 bg-stone-50/50` | — |
| **Wizard Nav Prev/Next** | — | — | `rounded-full / rounded-lg` | — | — | — | — | — | — |
| **Tạo mới** (empty state) | — | `px-5 py-2.5` | `rounded-full` | `stone-900` | `white 14px w-500` | none | none | `bg-stone-800` | — |
| **Delete** (history card) | — | `p-2` | `rounded-lg` | transparent | `stone-400` | none | none | `bg-rose-50 text-rose-600` | — |

---

## 5. Animations & Transitions

| Phần tử | Animation | Duration |
|---|---|---|
| Main card appear | `animate-in fade-in slide-in-from-bottom-4` | `700ms` |
| Wizard step switch | `animate-in fade-in slide-in-from-right-4` | `300ms` |
| All transitions | `transition-all` (Tailwind default = `150ms ease-in-out`) | — |
| Primary btn click | `active:scale-95` | — |
| Loading spinner | `animate-spin` | — |

---

## 6. Toast Notification

```
display khi có lỗi hoặc thành công  |  auto-hide sau 3000ms
type: 'success' | 'error'
vị trí: fixed (quản lý bởi Toast component)
```

---

## 7. Wizard Steps — Fields Summary

### Giai đoạn 1 — Thông tin cơ bản (6 trường bắt buộc)

| Trường | Component | Required | Notes |
|---|---|---|---|
| Thương hiệu | `<input>` | ✓ | Disabled khi tab vault |
| Ngành hàng | `<select>` | ✓ | 16 options, disabled khi tab vault |
| Sản phẩm chủ đạo | `<input>` | ✓ | — |
| Giá bán (AOV) | `<input type="number">` | ✓ | min=0 |
| Ngân sách dự kiến | `<input type="number">` | Tùy mode | Disabled khi GOAL_DRIVEN |
| Thời gian chiến dịch | `<input type="number">` | ✓ | min=4, max=52, default=8 tuần |
| Chế độ tính | Planning Mode Selector (3 btn) | ✓ | BUDGET_DRIVEN / GOAL_DRIVEN / AUDIT |

### Giai đoạn 2 — Context (4 trường)

Tầm nhìn & Giá trị · Đối tượng mục tiêu · Nỗi đau & Khao khát · (1 optional)

### Giai đoạn 3 — Chi tiết chiến lược

USP · Đối thủ chính · Tone of voice · Chiến dịch trước

---

## 8. Empty / Loading States

**Loading spinner (history):**
```
mx-auto h-8 w-8 animate-spin rounded-full
border-2 border-stone-300 border-t-stone-800
py-16 text-center
```

**Empty history:**
```
py-16 text-center
icon: Sparkles size=40 strokeWidth=1.25 text-stone-300 mx-auto mb-4
text: "Chưa có chiến lược nào" text-base font-normal text-stone-600
CTA: rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white
```
