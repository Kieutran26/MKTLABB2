# Opti M.KI Engine — Feature Design System

> Nguồn: `OptimkiBuilder.tsx` · `FeatureHeader.tsx` · `workspace-toolbar-classes.ts` · 2026-04-26  
> **Mục đích:** Tài liệu này ghi lại 2 vấn đề cần AI sửa: (1) Header bị thiếu Tab Switcher, (2) Trang lịch sử cần đồng bộ design.

---

## ⚠️ VẤN ĐỀ 1: Header Thiếu Tab Switcher (Thủ công / Brand Vault)

### Mô tả lỗi

AI đang tạo header như ảnh lỗi — chỉ có:
```
⚡ 10 lượt  |  [🕐]  |  [+ Tạo mới]
```

**Đúng phải là** (như trong web gốc):
```
⚡ 10 lượt  |  [ ✏ Thủ công  ◇ Brand Vault ]  |  [🕐]  |  [+ Tạo mới]
```

### Nguyên nhân

Con AI thiếu component `WS_SEGMENT_SHELL` (Tab Switcher) trong phần `children` của `<FeatureHeader />`.

---

### 1.1 Cấu trúc Header đầy đủ (source: `OptimkiBuilder.tsx` lines 346–387)

```tsx
<FeatureHeader
  icon={Target}
  eyebrow="STRATEGIC MODEL GENERATOR"
  title="Opti M.KI Engine"
  subline="Phân tích SWOT, AIDA, 4P, 5W1H và SMART bằng AI với độ chính xác cao."
>
  {/* Right actions: PHẢI có đủ 4 phần theo thứ tự */}
  <div className="flex shrink-0 items-center justify-end gap-2">

    {/* 1. TAB SWITCHER — ĐANG BỊ THIẾU */}
    <div className={WS_SEGMENT_SHELL}>
      <button onClick={() => setActiveTab('manual')} className={wsWorkspaceTabClass(activeTab === 'manual')}>
        <Pencil size={14} /> Thủ công
      </button>
      <button onClick={() => setActiveTab('vault')} className={wsWorkspaceTabClass(activeTab === 'vault')}>
        <Diamond size={14} className={isPromax ? 'text-amber-500 fill-amber-500' : 'text-stone-400'} /> Brand Vault
      </button>
    </div>

    {/* 2. HISTORY BUTTON */}
    <button
      onClick={() => setWorkspaceMode(mode => mode === 'history' ? 'main' : 'history')}
      className={wsHistoryToggleClass(workspaceMode === 'history')}
    >
      <History size={17} strokeWidth={1.5} />
    </button>

    {/* 3. PRIMARY CTA */}
    <button onClick={handleReset} className={WS_PRIMARY_CTA}>
      <Plus size={18} strokeWidth={2.5} /> Tạo mới
    </button>
  </div>
</FeatureHeader>
```

---

### 1.2 Tab Switcher — Thông số Design (source: `workspace-toolbar-classes.ts`)

**Shell Container (`WS_SEGMENT_SHELL`):**
```
display: inline-flex
gap: 4px (gap-1)
border-radius: rounded-2xl (16px)
border: 1px solid stone-200
background: stone-50/30
padding: p-1 (4px)
shadow: shadow-sm
```

**Tab Button Base:**
```
display: flex items-center
gap: 8px (gap-2)
border-radius: rounded-xl (12px)
padding: px-4 py-2  (16px × 8px)
font-size: 14px (text-sm)
font-weight: 500 (font-medium)
transition: all
```

| State | Style |
|---|---|
| **Active** | `bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5` |
| **Inactive** | `text-stone-400` |
| **Inactive hover** | `hover:text-stone-600` |

**Tab Icons:**
- "Thủ công": `<Pencil size={14} />`
- "Brand Vault": `<Diamond size={14} />` — Pro Max: `text-amber-500 fill-amber-500` | Free/Pro: `text-stone-400`

---

### 1.3 History Button (`wsHistoryToggleClass`)

```
display: inline-flex
size: h-10 w-10  (40×40px)
shrink-0
border-radius: rounded-full
items-center justify-center
transition: all
icon: <History size={17} strokeWidth={1.5} />
```

| State | Style |
|---|---|
| **Active** (đang xem lịch sử) | `bg-stone-900 text-white shadow-md` |
| **Default** | `border border-stone-200 bg-white text-stone-600 shadow-sm` |
| **Default hover** | `hover:bg-stone-50` |

---

### 1.4 Primary CTA Button (`WS_PRIMARY_CTA`)

```
display: flex
height: h-10  (40px)
width: w-[161.648px]  (fixed — khớp với IMC "Tạo kế hoạch")
items-center justify-center
gap: 8px (gap-2)
border-radius: rounded-full
background: bg-stone-950 (#0C0A09)
font-size: 14px (text-sm)
font-weight: 500 (font-medium)
color: white
shadow: shadow-md
transition: all
```

| State | Style |
|---|---|
| Default | `bg-stone-950 text-white shadow-md` |
| Hover | `hover:bg-stone-800` |
| Active/click | `active:scale-95` |

Icon: `<Plus size={18} strokeWidth={2.5} />`  
Label: "Tạo mới"

---

### 1.5 FeatureHeader Component (source: `FeatureHeader.tsx`)

```tsx
interface FeatureHeaderProps {
  icon: LucideIcon;
  eyebrow: string;   // "STRATEGIC MODEL GENERATOR"
  title: string;     // "Opti M.KI Engine"
  subline: string;   // mô tả ngắn
  children?: React.ReactNode;  // right actions
  className?: string;          // override px-8 nếu cần
}
```

**Rendered HTML:**
```
<header>
  display: flex shrink-0 items-center justify-between
  border-bottom: 1px solid rgba(stone-200, 0.7)
  background: #FCFDFC
  padding: py-6 px-8

  LEFT:
    display: flex flex-col gap-1
    ├─ Eyebrow row: flex items-center gap-2 text-stone-400
    │    icon: <Icon size={14} strokeWidth={1.5} />
    │    text: 10px bold uppercase tracking-[0.15em] text-stone-400
    ├─ Title <h2>: text-2xl font-semibold text-stone-900 tracking-tight leading-tight
    └─ Subline <p>: text-xs text-stone-400 font-medium mt-1

  RIGHT:
    display: flex items-center gap-4
    └─ {children}  ← Tab Switcher + History + CTA đều đặt vào đây
```

---

## 📋 VẤN ĐỀ 2: Trang Lịch sử (History Page) Design System

### 2.1 Layout Wrapper của History Mode

```
Trigger: khi workspaceMode === 'history'

Outer wrapper:
  className: min-w-0 flex-1 w-full overflow-y-auto px-4 py-6 lg:px-8 xl:px-10

Inner card:
  className: rounded-2xl border border-stone-200/90 bg-white
             shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 md:p-8
  → Đây là cardClass: "rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
```

### 2.2 History Page Header (Tiêu đề section)

```
<h2>
  display: flex items-center gap-2
  margin-bottom: mb-8 (32px)
  font-family: font-sans
  font-size: 18px (text-lg)
  font-weight: 500 (font-medium)
  letter-spacing: tracking-tight
  color: stone-900

  icon: <History size={20} strokeWidth={1.25} className="text-stone-400" />
  text: "Lịch sử chiến lược ({count})"
```

### 2.3 Loading State

```
container: py-16 text-center
spinner:
  mx-auto h-8 w-8
  border-2 border-stone-300 border-t-stone-800
  rounded-full animate-spin
```

### 2.4 Empty State

```
container: py-16 text-center

icon: <Sparkles size={40} strokeWidth={1.25} className="mx-auto mb-4 text-stone-300" />

text <p>:
  font-size: 16px (text-base)
  font-weight: 400 (font-normal)
  color: stone-600
  content: "Chưa có chiến lược nào"

CTA button:
  margin-top: mt-6
  display: inline-flex items-center gap-2
  border-radius: rounded-full
  background: stone-900
  padding: px-5 py-2.5 (20px × 10px)
  font-size: 14px (text-sm)
  font-weight: 500 (font-medium)
  color: white
  hover: hover:bg-stone-800
  icon: <Plus size={17} strokeWidth={1.25} />
  label: "Tạo mới"
```

### 2.5 History Card Grid

```
display: grid
gap: 16px (gap-4)
grid-cols: grid-cols-1 md:grid-cols-2 xl:grid-cols-3
```

### 2.6 History Card Item

```
element: <div role="button" tabIndex={0}>
border-radius: rounded-2xl (16px)
border: 1px solid rgba(stone-200, 0.9)  → border-stone-200/90
padding: p-5 (20px)
transition: all
cursor: cursor-pointer

Hover state:
  border-color: hover:border-stone-300
  background: hover:bg-stone-50/50

Keyboard: onKeyDown → Enter triggers same as onClick
```

**Card Content Structure:**
```
┌─ Row 1: Header (mb-3)
│    display: flex items-start justify-between gap-2
│    ├─ Left block (min-w-0 flex-1)
│    │    h3: font-medium text-stone-900 line-clamp-1   → tên chiến lược
│    │    p:  mt-1 text-sm font-normal text-stone-500   → brand · ngành hàng
│    └─ Right: Delete button
│         border-radius: rounded-lg (8px)
│         padding: p-2 (8px)
│         color: text-stone-400
│         hover: hover:bg-rose-50 hover:text-rose-600
│         transition: transition-colors
│         icon: <Trash2 size={16} strokeWidth={1.25} />
│
├─ Row 2: Meta info
│    display: flex items-center gap-3
│    font-size: 12px (text-xs)
│    font-weight: 400 (font-normal)
│    color: text-stone-500
│    items:
│      - Budget: <DollarSign size={12} strokeWidth={1.25} /> + text
│      - Timeline: <Calendar size={12} strokeWidth={1.25} /> + text
│    each item: flex items-center gap-1
│
└─ Row 3: Date footer
     margin-top: mt-3
     border-top: border-t border-stone-100
     padding-top: pt-3
     font-size: 12px (text-xs)
     font-weight: 400 (font-normal)
     color: text-stone-400
     content: toLocaleDateString('vi-VN')
```

---

## 📐 Design Tokens (Toàn trang Opti M.KI Engine)

### Colors

| Token | Value | Dùng cho |
|---|---|---|
| Page BG | `#FCFDFC` | Toàn trang |
| Card surface | `white` | Card content |
| Card border | `border-stone-200/90` | Viền card |
| Card shadow | `0 1px 2px rgba(15,23,42,0.04)` | Shadow card |
| Primary text | `stone-900` | Tiêu đề, label |
| Secondary text | `stone-500` | Sub-label |
| Tertiary text | `stone-400` | Meta, hint |
| History card hover border | `stone-300` | Hover state |
| History card hover bg | `stone-50/50` | Hover state |
| Delete hover bg | `rose-50` | Trash button hover |
| Delete hover icon | `rose-600` | Trash icon hover |

### Typography (Input Form)

| Element | Size | Weight | Ghi chú |
|---|---|---|---|
| Input field | 13px | 400 | `text-[13px]` (nhỏ hơn IMC dùng 14px) |
| Textarea field | 13px | 400 | `text-[13px]` |
| Wizard step title | 10px bold | 700 | `text-[10px] font-bold uppercase tracking-widest` |
| Wizard step subtitle | 9px | 500 | `text-[9px] font-medium opacity-60` |

### Input Controls (Opti M.KI Engine)

```
inputClass:
  w-full rounded-xl border border-stone-200 bg-white
  px-3 py-2
  text-[13px] text-stone-900
  outline-none transition-all
  placeholder:text-stone-300
  focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20

areaClass (textarea):
  w-full rounded-xl border border-stone-200 bg-white
  p-3
  text-[13px] text-stone-900
  outline-none transition-all
  placeholder:text-stone-300
  focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20
  min-h-[80px] resize-none
```

> **Lưu ý:** Opti M.KI Engine dùng `text-[13px]` + `focus:ring-1` — khác một chút so với IMC Planner dùng `text-sm (14px)` + không có ring. Giữ nguyên sự khác biệt này.

### Wizard Progress Bar (Opti M.KI Engine)

```
container: flex border-b border-stone-100 bg-stone-50/50

step button:
  flex-1 py-4 px-2 text-center
  border-b-2 transition-all

Active state:  border-stone-900 text-stone-900
Inactive state: border-transparent text-stone-400 hover:text-stone-600

Title:    text-[10px] font-bold uppercase tracking-widest
Subtitle: text-[9px] font-medium opacity-60 hidden sm:block
```

### Form Footer Buttons

| Button | Padding | Border-radius | BG | Text | Border | Shadow | Hover | Active |
|---|---|---|---|---|---|---|---|---|
| **Quay lại** | `px-6 py-2.5` | `rounded-full` | transparent | `stone-500 14px italic` | `border-stone-200` | none | `bg-stone-50` | — |
| **Tiếp theo** | `px-8 py-2.5` | `rounded-full` | `stone-900` | `white 14px` | none | `shadow-lg shadow-stone-900/10` | `bg-stone-800` | `scale-95` |
| **Phân tích** | `px-8 py-2.5` | `rounded-full` | `stone-900` | `white 14px` | none | `shadow-lg shadow-stone-900/10` | `bg-stone-800` | `scale-95` |

---

## 5. Animations

| Animation | Value | Duration |
|---|---|---|
| Model selection screen | `animate-in fade-in slide-in-from-bottom-4` | `700ms` |
| Form group switch | `animate-in fade-in slide-in-from-bottom-4` | `500ms` |
| Result view | `animate-in fade-in slide-in-from-right-4` | `500ms` |
| All transitions | `transition-all` | `150ms` |
| Model card hover | `-translate-y-1` | — |
| CTA click | `active:scale-95` | — |
