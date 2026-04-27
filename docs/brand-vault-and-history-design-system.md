# IMC Planner / Opti M.KI Engine — Brand Vault Tab & History Page Design System

> Nguồn: `OptimkiBuilder.tsx` · `IMCPlanner.tsx` · `BrandVaultUpsellCard.tsx` · `MastermindStrategyEditorial.css` · `workspace-toolbar-classes.ts` · `FeatureHeader.tsx`  
> Tham chiếu ảnh: **Hình 1** = trang Brand Vault tab (IMC Planner) · **Hình 2** = trang History (Opti M.KI Engine)  
> 2026-04-26

---

## PHẦN A — HEADER ĐẦY ĐỦ (Đúng như 2 hình)

> Con AI hay bỏ sót Tab Switcher. Header phải luôn có đủ **4 thành phần** theo thứ tự từ trái qua phải.

### A.1 Cấu trúc JSX đúng

```tsx
<FeatureHeader
  icon={Target}
  eyebrow="AI-POWERED STRATEGIC FRAMEWORK"   {/* hoặc "STRATEGIC MODEL GENERATOR" */}
  title="IMC Planner"                         {/* hoặc "Opti M.KI Engine" */}
  subline="3 bước nhập liệu → Kế hoạch IMC đa kênh chuyên nghiệp."
>
  <div className="flex shrink-0 items-center justify-end gap-2">

    {/* ① TAB SWITCHER — HAY BỊ THIẾU */}
    <div className={WS_SEGMENT_SHELL}>
      <button
        onClick={() => setActiveTab('manual')}
        className={wsWorkspaceTabClass(activeTab === 'manual')}
      >
        <Pencil size={14} /> Thủ công
      </button>
      <button
        onClick={() => setActiveTab('vault')}
        className={wsWorkspaceTabClass(activeTab === 'vault')}
      >
        <Diamond
          size={14}
          className={isPromax ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}
        />
        Brand Vault
      </button>
    </div>

    {/* ② HISTORY BUTTON */}
    <button
      onClick={() => setWorkspaceMode(m => m === 'history' ? 'main' : 'history')}
      className={wsHistoryToggleClass(workspaceMode === 'history')}
    >
      <History size={17} strokeWidth={1.5} />
    </button>

    {/* ③ PRIMARY CTA */}
    <button onClick={handleReset} className={WS_PRIMARY_CTA}>
      <Plus size={18} strokeWidth={2.5} /> Tạo mới
    </button>
  </div>
</FeatureHeader>
```

### A.2 Thông số từng button (source: `workspace-toolbar-classes.ts`)

**Tab Switcher Shell `WS_SEGMENT_SHELL`:**
```
inline-flex gap-1 rounded-2xl border border-stone-200 bg-stone-50/30 p-1 shadow-sm
```

**Tab button (mỗi tab) — base:**
```
display: flex items-center
gap: 8px
border-radius: rounded-xl (12px)
padding: px-4 py-2  →  16px × 8px
font-size: text-sm (14px)
font-weight: font-medium (500)
transition: all
```

| State | Classes |
|---|---|
| Active | `bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5` |
| Inactive | `text-stone-400` |
| Inactive hover | `hover:text-stone-600` |

**History Button `wsHistoryToggleClass`:**
```
size: h-10 w-10  (40×40px)
border-radius: rounded-full
icon: <History size={17} strokeWidth={1.5} />
```

| State | Classes |
|---|---|
| Active (đang mở history) | `bg-stone-900 text-white shadow-md` |
| Default | `border border-stone-200 bg-white text-stone-600 shadow-sm` |
| Default hover | `hover:bg-stone-50` |

**Primary CTA `WS_PRIMARY_CTA`:**
```
display: flex
h-10 w-[161.648px]
items-center justify-center gap-2
border-radius: rounded-full
background: bg-stone-950  (#0C0A09)
font-size: text-sm (14px)  font-weight: font-medium (500)
color: white
shadow: shadow-md
transition: all
hover: hover:bg-stone-800
active: active:scale-95
icon: <Plus size={18} strokeWidth={2.5} />
label: "Tạo mới"
```

### A.3 FeatureHeader Component (`FeatureHeader.tsx`)

```
<header>
  display: flex shrink-0 items-center justify-between
  padding: py-6 px-8
  background: #FCFDFC
  border-bottom: 1px solid rgba(stone-200, 0.7)  →  border-stone-200/70

  LEFT — identity block:
    display: flex flex-col gap-1

    Eyebrow row:
      display: flex items-center gap-2 text-stone-400
      <Icon size={14} strokeWidth={1.5} />
      <span>  font-size: 10px  font-weight: 700  uppercase  tracking-[0.15em]

    Title <h2>:
      font-size: 24px (text-2xl)  font-weight: 600 (semibold)
      color: stone-900  tracking-tight  leading-tight

    Subline <p>:
      font-size: 12px (text-xs)  font-weight: 500 (medium)
      color: stone-400  mt-1

  RIGHT — actions:
    display: flex items-center gap-4
    content: {children}  ←  Tab Switcher + History + CTA
```

---

## PHẦN B — TRANG BRAND VAULT TAB (Hình 1)

> Hiển thị khi: `activeTab === 'vault' && !isPromax`

### B.1 Page Layout

```
Page wrapper:
  flex h-screen flex-col overflow-hidden bg-[#FCFDFC]

Content area (bên dưới header):
  flex-1 overflow-y-auto
  padding: px-4 py-6 lg:px-8 xl:px-10

Inner max-width:
  max-w-[1182px] (IMC) hoặc max-w-[1000px] (Opti Engine) mx-auto w-full
```

### B.2 BrandVaultUpsellCard — Card Container

```css
.ms-vault-card {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;   /* trái lớn hơn phải */
  background: #fff;
  border: 1px solid rgba(26, 25, 22, 0.06);
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 4px 10px rgba(0,0,0,0.02),
    0 32px 64px -16px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 1120px;
}
```

**Responsive mobile (≤768px):**
```css
.ms-vault-card          { grid-template-columns: 1fr; }
.ms-vault-content       { border-right: none; border-bottom: 1px solid rgba(26,25,22,0.05); padding: 1.75rem 1.5rem; }
.ms-vault-visual        { min-height: 200px; }
```

---

### B.3 Cột Trái — Content Panel

```css
.ms-vault-content {
  padding: 2.5rem 3rem;        /* 40px 48px */
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid rgba(26, 25, 22, 0.05);
  gap: 1.125rem;               /* 18px giữa các block */
}
```

**① Eyebrow Badge "BRAND VAULT ACCESS":**
```css
.ms-vault-label {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #64748b;              /* slate-500 */
  background: #fffbeb;         /* amber-50 */
  border: 1px solid rgba(100, 116, 139, 0.2);
  gap: 8px;
  padding: 6px 12px 6px 10px;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
```
Icon: `<Diamond size={11} strokeWidth={2.25} color="#64748b" />`

**② Title:**
```css
.ms-vault-title {
  font-family: 'Plus Jakarta Sans';
  font-size: 26px;
  line-height: 1.2;
  color: #1c1917;
  letter-spacing: -0.02em;
}
```

**③ Description:**
```css
.ms-vault-desc {
  font-size: 13px;
  line-height: 1.55;
  color: rgba(28, 25, 23, 0.62);   /* ink-3 */
  max-width: 440px;
}
```

**④ Benefits List:**
```css
.ms-vault-benefits {
  padding-top: 1rem;
  border-top: 1px solid rgba(28, 25, 23, 0.10);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;         /* 8px mỗi item */
  margin-bottom: 0.75rem;
}

.ms-vault-benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  line-height: 1.35;
  color: rgba(28, 25, 23, 0.62);
}

.ms-vault-benefit-icon {
  width: 22px; height: 22px;
  border-radius: 5px;
  background: rgba(28, 25, 23, 0.04);
  border: 1px solid rgba(28, 25, 23, 0.10);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #1c1917;
}
```
Icon check: `<Check size={14} strokeWidth={3} />`

**⑤ CTA Button "Nâng cấp Pro Max":**
```css
.ms-vault-cta {
  display: inline-flex;
  align-items: center; justify-content: center;
  gap: 6px;
  background: #1c1917;
  color: #fff;
  padding: 0.55rem 1.35rem;    /* ≈ py-2 px-5 */
  border-radius: 99px;
  font-weight: 600;
  font-size: 12.5px;
  width: fit-content;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

| State | Style |
|---|---|
| Default | `background: #1c1917` |
| Hover | `transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); background: #000` |
| Active | `transform: translateY(0)` |

Icon: `<ChevronRight size={18} />`

---

### B.4 Cột Phải — Visual Panel

```css
.ms-vault-visual {
  background: #faf9f6;          /* warm off-white */
  display: flex;
  align-items: center; justify-content: center;
  position: relative;
  overflow: hidden;
}
```

**Glow background:**
```css
.ms-vault-glow {
  position: absolute; inset: 0;
  background: radial-gradient(
    ellipse 55% 65% at 50% 50%,
    rgba(143, 94, 22, 0.05) 0%, transparent 70%
  );
  pointer-events: none;
}
```

**DNA Bars (12 thanh):**
```css
.ms-vault-dna {
  position: absolute; bottom: 0; left: 0; right: 0;
  display: flex; align-items: flex-end; justify-content: center;
  gap: 6px; padding: 0 1.5rem 32px; height: 100%;
}
.ms-vault-dna-bar {
  width: 3px;
  background: linear-gradient(to top, rgba(28,25,23,0.34), rgba(181,181,173,0.2));
  border-radius: 99px;
  animation: msDnaPulse 3s ease-in-out infinite;
  /* inline style: height = `${12 + random*24}%`, animationDelay = `${i*0.15}s` */
}
@keyframes msDnaPulse {
  0%, 100% { transform: scaleY(1);    opacity: 0.18; }
  50%       { transform: scaleY(0.75); opacity: 0.08; }
}
```

**Lock Circle:**
```css
.ms-vault-lock-circle {
  width: 80px; height: 80px;
  border-radius: 50%; background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.05);
  display: flex; align-items: center; justify-content: center;
  color: rgba(28,25,23,0.34);
  position: relative;
  animation: msFloat 3s ease-in-out infinite;
}
/* Vòng dashed bên trong — quay 8s */
.ms-vault-lock-circle::before {
  content: ''; position: absolute; inset: -6px; border-radius: 50%;
  border: 1px dashed rgba(143, 94, 22, 0.3);
  animation: msRingSpin 8s linear infinite;
}
/* Vòng dashed bên ngoài — quay ngược 14s */
.ms-vault-lock-circle::after {
  content: ''; position: absolute; inset: -14px; border-radius: 50%;
  border: 1px dashed rgba(181, 181, 173, 0.25);
  animation: msRingSpin 14s linear infinite reverse;
}
@keyframes msRingSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes msFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
```

Lock icon (bên trong circle):
```css
.ms-vault-lock-icon { animation: msLockShake 2.5s ease-in-out infinite; }
@keyframes msLockShake {
  0%,90%,100% { transform: rotate(0deg); }
  92%         { transform: rotate(-8deg); }
  94%         { transform: rotate(8deg); }
  96%         { transform: rotate(-5deg); }
  98%         { transform: rotate(5deg); }
}
```
Icon: `<Lock size={32} strokeWidth={1.5} />`

**Label "ENCRYPTED DNA":**
```css
.ms-vault-lock-text {
  font-size: 9px; font-weight: 700; letter-spacing: 0.16em;
  text-transform: uppercase; color: rgba(28,25,23,0.34);
}
```

**Corner decorators (4 góc):**
```css
.ms-vault-corner     { position: absolute; width: 24px; height: 24px; opacity: 0.18; }
.ms-vault-corner-tl  { top: 16px; left: 16px; border-top: 1.5px solid rgba(28,25,23,0.34); border-left: 1.5px solid rgba(28,25,23,0.34); }
.ms-vault-corner-br  { bottom: 16px; right: 16px; border-bottom: 1.5px solid rgba(28,25,23,0.34); border-right: 1.5px solid rgba(28,25,23,0.34); }
```

### B.5 Cách sử dụng BrandVaultUpsellCard

```tsx
import BrandVaultUpsellCard from './BrandVaultUpsellCard';
// CSS được import tự động bên trong component — không cần import lại ở cha

{activeTab === 'vault' && !isPromax && (
  <BrandVaultUpsellCard
    description="Kế hoạch IMC sẽ chính xác hơn gấp 5 lần khi AI được học về DNA thương hiệu của bạn."
    benefits={[
      'Kết nối đa kênh dựa trên giá trị cốt lõi',
      'Phân bổ ngân sách tối ưu theo đặc thù ngành',
      'Tự động viết Key Hook theo Brand Voice',
      'Sẵn sàng hạng mục triển khai cho Team sản xuất',
    ]}
  />
)}
```

---

## PHẦN C — TRANG LỊCH SỬ (Hình 2)

> Hiển thị khi: `workspaceMode === 'history'` (History button active = dark)

### C.1 Layout Wrapper khi History Mode

```
Content area:
  min-w-0 flex-1 w-full overflow-y-auto
  padding: px-4 py-6 lg:px-8 xl:px-10

Card container (cardClass):
  rounded-2xl border border-stone-200/90 bg-white
  shadow-[0_1px_2px_rgba(15,23,42,0.04)]
  padding: p-6 md:p-8
```

### C.2 Section Header "Lịch sử chiến lược (N)"

```
<h2>
  display: flex items-center gap-2
  margin-bottom: mb-8  (32px)
  font-family: font-sans  (Plus Jakarta Sans)
  font-size: 18px (text-lg)
  font-weight: 500 (font-medium)
  letter-spacing: tracking-tight
  color: stone-900

  icon: <History size={20} strokeWidth={1.25} className="text-stone-400" />
  text: "Lịch sử chiến lược ({savedList.length})"
```

### C.3 Loading State

```
container: py-16 text-center

spinner:
  mx-auto
  h-8 w-8  (32×32px)
  border-2 border-stone-300 border-t-stone-800
  rounded-full animate-spin
```

### C.4 Empty State

```
container: py-16 text-center

icon:
  <Sparkles size={40} strokeWidth={1.25} className="mx-auto mb-4 text-stone-300" />

text <p>:
  font-size: 16px (text-base)
  font-weight: 400 (font-normal)
  color: stone-600
  "Chưa có chiến lược nào"

CTA button:
  margin-top: mt-6
  display: inline-flex items-center gap-2
  border-radius: rounded-full
  background: stone-900
  padding: px-5 py-2.5
  font-size: text-sm (14px)  font-weight: font-medium (500)
  color: white
  hover: hover:bg-stone-800
  icon: <Plus size={17} strokeWidth={1.25} />
  label: "Tạo mới"
```

### C.5 Card Grid (khi có data)

```
display: grid
gap: gap-4 (16px)
columns: grid-cols-1 md:grid-cols-2 xl:grid-cols-3
```

### C.6 History Card Item (như hình 2)

```
element: <div role="button" tabIndex={0}>
border-radius: rounded-2xl (16px)
border: 1px solid border-stone-200/90
padding: p-5 (20px)
transition: all
cursor: cursor-pointer

Hover:
  border-color: hover:border-stone-300
  background: hover:bg-stone-50/50

Keyboard: onKeyDown → Enter = onClick
```

**Cấu trúc bên trong card (từ trên xuống):**

```
┌─ ROW 1 — Header (mb-3)
│    display: flex items-start justify-between gap-2
│
│    LEFT (min-w-0 flex-1):
│      h3:  font-medium text-stone-900 line-clamp-1
│           → Tên: "Blue Vigor Travel - tat_ca"
│      p:   mt-1 text-sm font-normal text-stone-500
│           → Sub: "Blue Vigor Travel • du lịch"
│
│    RIGHT — Delete button:
│      border-radius: rounded-lg (8px)
│      padding: p-2 (8px)
│      color: text-stone-400
│      hover: hover:bg-rose-50 hover:text-rose-600
│      transition: transition-colors
│      icon: <Trash2 size={16} strokeWidth={1.25} />
│
├─ ROW 2 — Meta info
│    display: flex items-center gap-3
│    font-size: text-xs (12px)  font-weight: font-normal  color: text-stone-500
│
│    Item Budget:
│      display: flex items-center gap-1
│      <DollarSign size={12} strokeWidth={1.25} />
│      text: "217 triệu"
│
│    Item Timeline:
│      display: flex items-center gap-1
│      <Calendar size={12} strokeWidth={1.25} />
│      text: "Quý 2/2026"
│
└─ ROW 3 — Date footer
     margin-top: mt-3
     border-top: border-t border-stone-100
     padding-top: pt-3
     font-size: text-xs (12px)  font-weight: font-normal
     color: text-stone-400
     content: new Date(createdAt).toLocaleDateString('vi-VN')
     → "19/4/2026"
```

---

## PHẦN D — Color Tokens (Toàn bộ 2 trang)

| Token | Hex / Value | Tailwind | Dùng cho |
|---|---|---|---|
| Page BG | `#FCFDFC` | `bg-[#FCFDFC]` | Toàn trang |
| Card surface | `#ffffff` | `bg-white` | Card |
| Card border | — | `border-stone-200/90` | Viền card |
| Card shadow | `0 1px 2px rgba(15,23,42,0.04)` | custom | Shadow card |
| Primary text | `#0C0A09` | `text-stone-900` | Tiêu đề |
| Secondary text | — | `text-stone-500` | Sub-label |
| Meta / hint | — | `text-stone-400` | Icon, date |
| History hover border | — | `border-stone-300` | Card hover |
| History hover bg | — | `bg-stone-50/50` | Card hover |
| Delete hover bg | — | `bg-rose-50` | Trash hover |
| Delete hover icon | — | `text-rose-600` | Trash hover |
| Vault label bg | `#fffbeb` | amber-50 | Eyebrow badge |
| Vault label text | `#64748b` | slate-500 | Eyebrow badge |
| Vault title | `#1c1917` | stone-950 | Vault title |
| Vault desc | `rgba(28,25,23,0.62)` | stone-500 ~ink-3 | Vault desc |
| Vault visual bg | `#faf9f6` | — | Right panel |
| Vault CTA bg | `#1c1917` | stone-950 | "Nâng cấp" btn |
| Vault glow | `rgba(143,94,22,0.05)` | amber warm | Glow bg |

---

## PHẦN E — Checklist cho AI

### Khi tạo trang với tab Brand Vault:
- [ ] Header có đủ: Tab Switcher → History button → CTA button
- [ ] Tab "Brand Vault" icon `<Diamond />`: Pro Max = `text-amber-500 fill-amber-500`, còn lại = `text-stone-400`
- [ ] `activeTab === 'vault' && !isPromax` → render `<BrandVaultUpsellCard />`
- [ ] `activeTab === 'vault' && isPromax` → render `<BrandSelector />` + tự điền form từ `currentBrand`
- [ ] `BrandVaultUpsellCard` phải có: `description` (bắt buộc) + `benefits[]` (bắt buộc) phù hợp tính năng

### Khi tạo trang History:
- [ ] History button active = `bg-stone-900 text-white shadow-md` (dark fill)
- [ ] Content bọc trong `cardClass` với `p-6 md:p-8`
- [ ] Header section: `<History size={20} />` + text "Lịch sử ... (N)" — `text-lg font-medium tracking-tight`
- [ ] Hiển thị loading spinner khi `loading && list.length === 0`
- [ ] Hiển thị empty state khi `list.length === 0`
- [ ] Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`
- [ ] Mỗi card có: title (line-clamp-1) + sub (brand • ngành) + meta ($ budget + 📅 timeline) + date footer + trash button
- [ ] Trash button hover: `hover:bg-rose-50 hover:text-rose-600`
- [ ] Card click: load lại kết quả, switch về `workspaceMode: 'main'`
