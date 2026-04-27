# To-Do List · Tin Tức · Kho Kiến Thức · Bộ Công Cụ — Design System

> Source: `ToDoListPage.tsx` · `NewsPage.tsx` · `MarketingKnowledge.tsx` · `ToolkitPage.tsx` · 2026-04-26

---

## SHARED TOKENS (tất cả 4 trang)

```
Page BG:    bg-[#FCFDFC]  font-sans  text-stone-900
cardClass:  rounded-2xl border border-stone-200/90 bg-white
            shadow-[0_1px_2px_rgba(15,23,42,0.04)]
inputClass: w-full rounded-xl border border-stone-200 bg-white px-4 py-3
            text-sm text-stone-900 placeholder:text-stone-400
            focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80
```

---

## 1. TO-DO LIST (ToDoListPage.tsx)

### Header

```
<header>
  flex shrink-0 flex-col gap-4
  border-b border-stone-200/70 bg-[#FCFDFC]
  px-5 py-5 md:px-8
  lg:flex-row lg:items-start lg:justify-between

  LEFT:
    max-w-2xl

    Eyebrow row: mb-2 flex items-center gap-2 text-stone-400
      <ListTodo size={20} strokeWidth={1.25} />
      span: text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400
            "Personal Productivity"

    Title <h1>:  font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl
                 "To-Do List"

    Sub <p>: mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]
```

*(Không có RIGHT action buttons — header chỉ có identity)*

### Content Area

```
flex-1 overflow-y-auto px-5 py-8 md:px-8
  mx-auto max-w-7xl
```

### Stats Row (4 cards)

```
grid grid-cols-2 md:grid-cols-4 gap-4 mb-8

Each card: cardClass + p-5
  Row: flex items-center gap-3 mb-2
    Icon box: bg-stone-100 p-2 rounded-xl
              (emerald-100 / amber-100 for completed/pending)
    Label:    text-sm text-stone-500

  Number:
    Total:     text-3xl font-semibold text-stone-900
    Completed: text-3xl font-bold text-emerald-600
    Pending:   text-3xl font-bold text-amber-500
    Rate:      text-3xl font-semibold text-stone-900
```

### Main Grid

```
grid grid-cols-1 lg:grid-cols-3 gap-6
  Left (lg:col-span-2): cardClass + p-6
  Right sidebar:        space-y-6
```

### Add Task Input

```
flex gap-2 mb-6

Input:   flex-1 + inputClass
         placeholder "Thêm công việc mới..."

Button:  inline-flex items-center gap-2
         rounded-full bg-stone-900 px-5 py-3
         text-sm font-medium text-white
         hover: hover:bg-stone-800
         icon: <Plus size={18} />
         "Thêm"
```

### Filter Tabs

```
mb-4 inline-flex gap-1 rounded-full border border-stone-200 bg-stone-50 p-1

Each tab:
  rounded-full px-4 py-2 text-sm font-medium transition-colors
  Active:   bg-stone-900 text-white
  Inactive: text-stone-600 hover:bg-white

Count span: ml-1 opacity-70
```

### Task Item

```
group flex items-center gap-4 rounded-2xl border p-4 transition-colors

States:
  Pending:   border-stone-200/90 bg-white hover:bg-stone-50/50
  Completed: border-stone-200 bg-stone-50/70

Toggle button:
  h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors
  Pending:   border-stone-300 hover:border-stone-500 hover:bg-stone-50
  Completed: border-emerald-500 bg-emerald-500 text-white
  Check icon: <Check size={14} />

Text:
  Pending:   text-sm text-slate-700
  Completed: text-sm text-slate-400 line-through
Date sub:    mt-1 text-xs text-stone-400

Delete btn:
  opacity-0 group-hover:opacity-100
  text-stone-300 hover:text-rose-500 transition-all p-2
  icon: <Trash2 size={16} />
```

### Clear Completed Button

```
mt-4 w-full rounded-xl border border-stone-200 bg-white py-3
text-sm font-medium text-stone-600
hover: hover:bg-stone-50 hover:text-rose-600
```

### Sidebar Cards

```
Each: cardClass + p-6
Title: flex items-center gap-2 mb-4 text-sm font-medium text-stone-900
       icon size={18} className="text-stone-500"

Progress Donut:
  w-32 h-32 conic-gradient (emerald/amber/stone)
  Inner: absolute inset-3 bg-white rounded-full flex items-center justify-center
  Center text: text-2xl font-semibold / text-xs text-stone-400

Today/Week stats:
  flex justify-between items-center
  Label: text-sm text-stone-500
  Value: font-semibold text-stone-900 / font-bold text-emerald-600

Progress bar: h-2 bg-stone-100 rounded-full overflow-hidden
  Fill: h-full bg-stone-900 rounded-full transition-all

Mini bar chart: flex items-end gap-1 h-12
  Bar: flex-1 bg-stone-200 rounded-t hover:bg-stone-400 transition-all
```

---

## 2. TIN TỨC TỔNG HỢP (NewsPage.tsx)

### Header

```
<header>
  flex shrink-0 flex-col gap-4
  border-b border-stone-200/70 bg-[#FCFDFC]
  px-5 py-5 md:px-8
  lg:flex-row lg:items-start lg:justify-between

  LEFT:
    max-w-2xl
    Eyebrow row: mb-2 flex items-center gap-2 text-stone-400
      <RefreshCw size={20} strokeWidth={1.25} animate-spin khi loading />
      span: text-[11px] font-medium uppercase tracking-[0.2em]
            "News Intelligence"
    Title: text-2xl font-normal tracking-tight text-stone-900 md:text-3xl
           "Tin Tức Tổng Hợp"
    Sub:   mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]

  RIGHT: flex shrink-0 flex-col items-end gap-3 pt-2

    Realtime badge row: flex items-center gap-2
      Connected:    px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full
                    text-[10px] font-bold uppercase tracking-wider
                    <Wifi size={10} /> "Realtime"
      Connecting:   px-2.5 py-1 bg-stone-100 text-stone-500 rounded-full
                    text-[10px] font-medium uppercase
                    <WifiOff size={10} /> "Kết nối..."
      Last seen:    text-[10px] text-stone-400 font-medium

    Buttons row: flex items-center gap-3
      Refresh:  rounded-full border border-stone-200 bg-white p-2.5 text-stone-500 shadow-sm
                hover:bg-stone-50 hover:text-stone-900
                icon: <RefreshCw size={18} strokeWidth={1.5} />

      Crawl:    inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5
                text-sm font-medium text-white shadow-sm
                hover:bg-stone-800 disabled:opacity-50
                icon: <Download size={16} animate-bounce khi crawling />
                label: "Crawl" / "Crawling..."

      Delete:   rounded-full border border-stone-200 bg-white p-2.5 text-rose-400 shadow-sm
                hover:bg-rose-50 hover:text-rose-600
                icon: <Trash2 size={18} strokeWidth={1.5} />
```

### Filter Bar (sticky second row)

```
flex shrink-0 items-center gap-4
border-b border-stone-100 bg-[#FCFDFC]/80
px-5 py-3 md:px-8 backdrop-blur-md

Category pill group:
  flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 p-1
  Each pill: px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
    Active:   bg-white text-stone-900 shadow-sm
    Inactive: text-stone-500 hover:text-stone-900
  Count badge: text-[10px] px-1.5 py-0.5 rounded-full
    Active:   bg-stone-100 text-stone-600
    Inactive: bg-stone-200/50 text-stone-400

Divider: h-4 w-px bg-stone-200

Source select: rounded-full border border-stone-200 bg-white px-4 py-1.5
               text-sm text-stone-700 outline-none hover:border-stone-300

Date filter group:
  flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 p-1
  Each: px-2.5 py-1 rounded-full text-xs font-medium transition-all
    Active:   bg-stone-900 text-white shadow-sm
    Inactive: text-stone-500 hover:text-stone-900

Date input: rounded-full border border-stone-200 bg-white px-4 py-1.5
            text-xs text-stone-700 outline-none hover:border-stone-300
```

### Content Area

```
flex-1 overflow-y-auto px-5 py-8 md:px-8
  max-w-7xl mx-auto

Loading skeleton: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
  Each: cardClass + p-6 h-64 animate-pulse
  Bars: h-4 bg-stone-100 rounded / h-48 bg-stone-100 rounded-xl

Articles grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
  → <NewsCard /> component

Empty: text-center py-20
  <Filter size={48} className="mx-auto text-stone-300 mb-4" />
  h3: text-xl font-medium text-stone-900
  p:  text-stone-500 mt-2
```

### Delete Articles Modal

```
Backdrop: fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4

Modal: max-w-md w-full rounded-2xl border border-stone-200/90 bg-white shadow-2xl p-6

Header: flex items-center justify-between mb-6
  Title: text-xl font-medium text-stone-900  "Quản Lý Bài Viết"
  Close: p-1 hover:bg-stone-100 rounded-lg

Action items: space-y-3 (delete by date/week/all):
  Base:   w-full p-4 text-left rounded-xl border border-stone-200
          flex items-center gap-3 transition-all
          hover: hover:bg-rose-50 hover:border-rose-200
          title: font-medium text-stone-900
          sub:   text-sm text-stone-500
  All delete (danger):
          border border-red-300 bg-red-50 hover:bg-red-100
          title: font-medium text-red-600

Custom date row: p-4 rounded-xl border border-stone-200
  date input + px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600
```

---

## 3. KHO KIẾN THỨC MARKETING (MarketingKnowledge.tsx)

### Header (sticky)

```
sticky top-0 z-20 border-b border-stone-200/70 bg-[#FCFDFC]/95 backdrop-blur-sm

Section 1: px-6 py-4
  flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between

  LEFT: flex items-start gap-4
    Icon box: h-10 w-10 shrink-0 rounded-xl border border-stone-200/90 bg-white text-stone-500
              <BookMarked size={20} strokeWidth={1.5} />
    Text:
      Eyebrow: text-xs font-semibold uppercase tracking-wide text-stone-500
               "Marketing glossary"
      Title:   text-xl font-normal tracking-tight text-stone-900 sm:text-2xl
               "Kho Kiến Thức Marketing"
      Sub:     mt-0.5 text-sm text-stone-500
               "{N} thuật ngữ • {M} chủ đề"

  RIGHT — Add button:
    inline-flex shrink-0 items-center justify-center gap-2
    rounded-full bg-stone-900 px-5 py-2.5
    text-sm font-medium text-white
    hover: hover:bg-stone-800
    icon: <Plus size={16} strokeWidth={2} />  "Thêm"

Section 2 — Category pills: border-t border-stone-100 px-6 py-3
  flex flex-wrap items-center gap-2

  pillBase: inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
  Active:   bg-stone-900 text-white
  Inactive: border border-stone-200 bg-white text-stone-600 hover:bg-stone-50
  Dot:      h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400 (active: bg-white/70)
```

### Search Bar

```
relative mb-8 max-w-2xl  (inside p-6 sm:p-8)
<Search size={18} absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 strokeWidth={1.5} />
input: inputClass + pl-11 shadow-none
       placeholder "Tìm kiếm thuật ngữ marketing..."
```

### Add/Edit Form Card

```
cardClass + mb-8 max-w-4xl p-6
(Edit form: + border-l-4 border-l-stone-300)

Header: flex items-center justify-between mb-6
  Title: text-sm font-semibold uppercase tracking-wide text-stone-500
  Close: rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600
         <X size={18} strokeWidth={1.5} />

Grid: mb-4 grid grid-cols-1 gap-4 md:grid-cols-2
  Inputs use inputClass

Fields:
  label: mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500
  textarea: inputClass + resize-none rows={4}
  Example textarea: + bg-stone-50/50

Comparison block:
  overflow-hidden rounded-xl border border-stone-200 bg-stone-50/40
  Title input: border-b border-stone-200 bg-stone-50/80 px-4 py-2.5 text-sm font-medium
  Grid 2 cols: border-r border-stone-200 / no border
               resize-none bg-white px-4 py-3 text-sm text-stone-800
  Conclusion:  border-t border-stone-200 bg-stone-50/80 px-4 py-2.5 text-sm

Footer: flex justify-end gap-3
  Cancel: rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50
  Save:   rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-40
          (edit: + inline-flex items-center gap-2 + <Save size={14} strokeWidth={2} />)
```

### Knowledge Card Grid

```
grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

Each card: cardClass + group cursor-pointer p-5 transition-colors hover:border-stone-300

  Top row: mb-3 flex items-start justify-between gap-2
    Category pill: inline-flex max-w-[85%] items-center rounded-full px-2.5 py-1
                   text-xs font-medium bg-stone-100/80 text-stone-600
    Eye icon:      shrink-0 p-1 text-stone-300 group-hover:text-stone-500
                   <Eye size={16} strokeWidth={1.5} />

  Term: text-base font-medium leading-snug tracking-tight text-stone-900
        group-hover:text-stone-700
```

### Detail Modal

```
Backdrop: fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px]

Modal:    cardClass + max-h-[85vh] w-full max-w-4xl overflow-hidden
          shadow-[0_8px_30px_rgba(15,23,42,0.08)]

Header: border-b border-stone-100 bg-stone-50/70 px-6 py-4
  Category pill: rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide bg-stone-100/80 text-stone-600
  Term: mt-2 text-xl font-normal tracking-tight text-stone-900 sm:text-2xl
  Close: shrink-0 rounded-lg p-2 text-stone-400 hover:bg-white hover:text-stone-600

Body: max-h-[60vh] overflow-y-auto p-6
  grid grid-cols-1 gap-6 lg:grid-cols-2

  Definition panel: rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5
  Example panel:    rounded-2xl border border-stone-200/90 bg-white p-5
  Comparison panel: rounded-2xl border border-stone-200/90 bg-stone-50/30 p-5

  Section title: mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500
  Content text:  whitespace-pre-wrap text-sm leading-relaxed text-stone-700

  Comparison viewer:
    overflow-hidden rounded-xl border border-stone-200 bg-white
    Title row: border-b border-stone-200 bg-stone-50/80 px-3 py-2 text-sm font-semibold
    2-col:     flex items-stretch + w-px shrink-0 self-stretch bg-stone-200 (divider)
    Each col:  min-w-0 flex-1 p-3 text-sm leading-relaxed text-stone-700
    Conclusion: border-t border-stone-200 bg-stone-50/80 px-3 py-2 text-sm

Footer: flex justify-end gap-3 border-t border-stone-100 px-6 py-4
  Edit:   inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white
          px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50
          <Edit2 size={14} strokeWidth={1.5} /> "Sửa"
  Delete: inline-flex items-center gap-2 rounded-full border border-red-200 bg-white
          px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50
          <Trash2 size={14} strokeWidth={1.5} /> "Xóa"
```

---

## 4. BỘ CÔNG CỤ (ToolkitPage.tsx)

### Menu View (activeTool === 'menu')

```
min-h-full bg-[#FCFDFC] font-sans text-stone-900

Content: mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12

Hero block: mb-12 text-center
  Icon box: mb-5 inline-flex h-14 w-14 items-center justify-center
            rounded-2xl border border-stone-200/90 bg-white text-stone-500
            shadow-[0_1px_2px_rgba(15,23,42,0.04)]
            <Wrench size={28} strokeWidth={1.5} />

  Eyebrow: mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500
           "Tiện ích trình duyệt"
  Title:   mb-3 text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl
           "Bộ Công Cụ"
  Sub:     mx-auto max-w-xl text-sm leading-relaxed text-stone-500 sm:text-base

Tool cards grid: grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6

  Tool card:
    cardClass + group p-6 text-left transition-colors
    hover: hover:border-stone-300

    iconBoxClass: flex h-12 w-12 shrink-0 items-center justify-center
                  rounded-xl border border-stone-200/90 bg-stone-50 text-stone-600
                  mb-5

    Name:   mb-2 text-lg font-medium tracking-tight text-stone-900
            group-hover:text-stone-700
    Desc:   text-sm leading-relaxed text-stone-500

  "Coming soon" placeholder:
    flex flex-col items-center justify-center
    rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/40 p-8 text-center
    iconBoxClass opacity-70 mb-4
    text: text-sm text-stone-400 "Thêm công cụ sắp ra mắt..."
```

### Tool Active View (header + tool content)

```
min-h-full bg-[#FCFDFC] font-sans text-stone-900

Sticky toolbar: sticky top-0 z-30 flex items-center justify-between
                border-b border-stone-200/70 bg-[#FCFDFC]/95
                px-4 py-3 sm:px-6 backdrop-blur-sm

  Back button:
    inline-flex items-center gap-2
    rounded-full border border-stone-200 bg-white
    px-3 py-2
    text-sm font-medium text-stone-600
    hover: hover:bg-stone-50 hover:text-stone-900
    icon: <ArrowLeft size={18} strokeWidth={1.5} />
    "Quay lại"

  Tool Switcher dropdown:
    Trigger button:
      inline-flex items-center gap-2
      rounded-full border border-stone-200 bg-white
      px-4 py-2
      text-sm font-medium text-stone-800
      shadow-[0_1px_2px_rgba(15,23,42,0.04)]
      hover: hover:bg-stone-50
      <Wrench size={16} className="text-stone-500" strokeWidth={1.5} />
      {activeToolName}
      <ChevronDown size={16} className="text-stone-400" rotate-180 khi open />

    Dropdown panel:
      absolute right-0 top-full z-50 mt-2
      w-[min(100vw-2rem,20rem)]
      overflow-hidden rounded-2xl border border-stone-200/90 bg-white py-1
      shadow-[0_8px_30px_rgba(15,23,42,0.08)]

      Each item: flex w-full items-start gap-3 px-4 py-3 text-left transition-colors
        Active:   bg-stone-100
        Inactive: hover:bg-stone-50

        Icon box: h-9 w-9 shrink-0 rounded-lg border border-stone-200/90 bg-stone-50 text-stone-600
                  [&_svg]:h-[18px] [&_svg]:w-[18px]
                  (Active: border-stone-300 bg-white)

        Text block:
          Name: text-sm font-medium text-stone-800 (active: text-stone-900)
          Desc: mt-0.5 line-clamp-2 text-xs leading-snug text-stone-500
```

---

## COLOR TOKENS SUMMARY (4 trang)

| Token | Value | Usage |
|---|---|---|
| Page BG | `#FCFDFC` | All pages |
| Primary CTA bg | `stone-900` → `stone-800` hover | Main action buttons |
| Secondary btn | `border-stone-200 bg-white` | Back, cancel, icon btns |
| Danger | `rose-500/rose-600` | Delete actions |
| Success | `emerald-600` | Completed tasks |
| Warning | `amber-500/amber-600` | Pending / approaching deadline |
| Card | `stone-200/90 border + white bg` | All cards |
| Sticky header | `bg-[#FCFDFC]/95 backdrop-blur-sm` | Kho Kiến Thức, Bộ Công Cụ |

---

## 5. CÁC CÔNG CỤ BÊN TRONG BỘ CÔNG CỤ

> Lưu ý chung: Các tool dùng design system riêng (`gray-*` / `slate-*`) khác với 4 trang chính (`stone-*`). AI KHÔNG được thay đổi sang stone.

---

### 5.1 Đếm Từ (WordCounter.tsx)

```
File: components/Toolkit/WordCounter.tsx
Page BG: bg-[#F9FAFB]   max-w-7xl mx-auto   p-8

HEADER:
  <h1>: text-3xl font-bold text-gray-900 mb-2   "Đếm Từ"
  <p>:  text-gray-500

INFO BANNER (blue):
  bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6
  text: text-blue-700 text-sm

TRANSFORMATION BUTTONS ROW: flex flex-wrap items-center gap-2 mb-6
  Label span: text-sm text-gray-500 mr-2
  Base btn:   px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm
              hover:bg-gray-50 transition-colors
              <Type size={14} className="inline mr-1" />
  Copy btn:   same base + flex items-center gap-1 + <Copy size={14} />
  Remove spaces: same + <AlignLeft size={14} />
  Clear btn:  px-3 py-1.5 bg-white border border-red-200 text-red-600
              rounded-lg text-sm hover:bg-red-50

MAIN GRID: grid grid-cols-1 lg:grid-cols-3 gap-6

  LEFT (lg:col-span-2):
    Card: bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
    Card Header: flex items-center justify-between px-5 py-4 border-b border-gray-100
      Left: flex items-center gap-2
        <AlignLeft size={18} className="text-gray-400" />
        span: font-medium text-gray-900  "Đếm Từ"
      Right: text-blue-600 font-bold  "{N} Từ • {N} Ký Tự"
    Textarea: w-full h-96 p-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none

  RIGHT (sidebar): space-y-6

    Stats Card: bg-white rounded-2xl border border-gray-100 shadow-sm p-5
      Title: font-semibold text-gray-900 mb-4 flex items-center gap-2
             "📊 Thống Kê"
      Rows: space-y-3
        Each: flex justify-between py-2 border-b border-gray-50
          Label: text-gray-600
          Value: font-semibold text-gray-900

    Keyword Density Card: bg-white rounded-2xl border border-gray-100 shadow-sm p-5
      Title: "📈 Mật Độ Từ Khóa"
      Tabs (x1/x2/x3): flex gap-2 mb-4
        Active:   px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-blue-100 text-blue-700 border border-blue-200
        Inactive: bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent
      Keyword item: flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg
        Word: text-gray-800 font-medium
        Count: text-xs text-gray-500
        Density: text-xs font-semibold text-blue-600
      Empty: text-center py-8 text-gray-400
             <Search size={32} className="mx-auto mb-2 opacity-50" />
```

---

### 5.2 Máy Tính Tỷ Lệ Khung Hình (AspectRatioCalculator.tsx)

```
File: components/Toolkit/AspectRatioCalculator.tsx
Page BG: bg-[#F9FAFB]   max-w-6xl mx-auto   p-8

HEADER:
  <h1>: text-3xl font-bold text-gray-900 mb-2   "Máy Tính Tỷ Lệ Khung Hình"
  <p>:  text-gray-500

INFO BANNER: same as WordCounter (blue-50/blue-100/blue-700)

MODE TOGGLE: flex items-center gap-4 mb-6
  Label: text-sm text-gray-600 font-medium  "Chế độ:"
  Toggle wrapper: flex bg-white rounded-lg border border-gray-200 p-1
    Each btn: px-4 py-2 rounded-md text-sm font-medium transition-colors
      Active:   bg-blue-100 text-blue-700
      Inactive: text-gray-600 hover:bg-gray-50

MODE "Tính Tỷ Lệ Từ Kích Thước":
  grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8

  Input card: bg-white rounded-2xl border border-gray-100 shadow-sm p-6
    Header: flex items-center justify-between mb-4
      Left: <Ratio size={18} className="text-blue-500" /> + span font-medium
      Right: Xóa btn → flex items-center gap-1 text-sm text-gray-400 hover:text-red-500
    Label: block text-sm font-medium text-gray-700 mb-1
    Input: flex-1 px-4 py-2.5 border border-gray-200 rounded-lg
           focus:outline-none focus:ring-2 focus:ring-blue-500
    Unit: text-gray-400 text-sm  "px"

  Result card: bg-white rounded-2xl border border-gray-100 shadow-sm p-6
    Aspect ratio: text-3xl font-bold text-blue-600
    Fraction:     text-xl font-semibold text-gray-900
    Size:         text-xl font-semibold text-gray-900
    Orientation:  text-lg font-medium text-gray-900
      Landscape: <Monitor size={20} className="text-blue-500" />
      Portrait:  <Smartphone size={20} className="text-purple-500" />
      Square:    div w-5 h-5 border-2 border-emerald-500 rounded

MODE "Tính Kích Thước Từ Tỷ Lệ":
  grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8
  3 cards: Tỷ Lệ · Kích Thước · Kết Quả
  Calculated dimension: text-2xl font-bold text-emerald-500

PRESET RATIOS: bg-white rounded-2xl border border-gray-100 shadow-sm p-6
  grid grid-cols-3 md:grid-cols-5 gap-2
  Each preset btn: p-3 rounded-xl border text-center transition-all hover:shadow-sm
    Active:   border-blue-300 bg-blue-50
    Inactive: border-gray-100 hover:border-gray-200 hover:bg-gray-50
    Ratio:    font-semibold text-gray-900
    Label:    text-[10px] text-gray-400 mt-0.5
```

---

### 5.3 So Sánh & Merge Văn Bản (TextCompare.tsx)

```
File: components/Toolkit/TextCompare.tsx
Page BG: bg-[#F9FAFB]   max-w-7xl mx-auto   p-8

HEADER:
  <h1>: text-3xl font-bold text-gray-900 mb-2   "So Sánh & Merge Văn Bản"
  <p>:  text-gray-500

INFO BANNER: blue-50/blue-100/blue-700 (same pattern)

COMPARE MODE TABS: flex items-center gap-4 mb-6
  Label: text-sm text-gray-600 font-medium  "Chế độ so sánh:"
  Wrapper: flex bg-white rounded-lg border border-gray-200 p-1
    Active:   px-4 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-700
    Inactive: text-gray-600 hover:bg-gray-50
  Options: "Theo ký tự" · "Theo từ" · "Theo dòng"

TEXT INPUT GRID: grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6
  Each card: bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
    Card header: px-5 py-4 border-b border-gray-100 flex items-center gap-2
      "Văn bản cũ": 📄 (red emoji)
      "Văn bản mới": 📄 (green emoji)
    Textarea: w-full h-48 p-5 resize-none focus:outline-none text-gray-800 placeholder-gray-400

ACTION BUTTONS: flex items-center gap-3 mb-6
  So sánh: px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium
            <GitCompare size={16} />
  Merge:   px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700
           disabled:opacity-50 disabled:cursor-not-allowed
           <Merge size={16} />
  Xóa:    same as Merge style  <Trash2 size={16} />

DIFF RESULT (conditional): bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
  Header: px-5 py-4 border-b border-gray-100 flex items-center justify-between
    Legend chips (text-xs):
      Added:     w-3 h-3 bg-green-100 border border-green-300 rounded
      Removed:   w-3 h-3 bg-red-100 border border-red-300 rounded
      Unchanged: w-3 h-3 bg-gray-100 border border-gray-200 rounded
  Content: p-5 max-h-96 overflow-auto
    Highlight tokens:
      added:    bg-green-100 text-green-800
      removed:  bg-red-100 text-red-800 line-through
      unchanged: text-gray-700

MERGED RESULT (conditional): mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
  Copy btn: bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700
  Content: p-5 max-h-64 overflow-auto bg-gray-50
           <pre> font-mono text-sm text-gray-800 whitespace-pre-wrap

TOAST (merge success): fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl shadow-lg
  Icon: w-6 h-6 bg-emerald-100 rounded-full + <Check size={14} className="text-emerald-600" />
  Progress bar: h-1 w-24 bg-gray-100 rounded-full (fill: bg-emerald-500)
```

---

### 5.4 Tạo Văn Bản Giả (LoremIpsumGenerator.tsx)

```
File: components/Toolkit/LoremIpsumGenerator.tsx
Page BG: bg-slate-50   max-w-5xl mx-auto   p-8
Note: dùng slate-* không phải stone-*

HEADER: flex items-center gap-3 mb-2
  Icon box: w-10 h-10 bg-white border border-slate-100 rounded-lg
            flex items-center justify-center text-slate-600
            <FileText size={20} />
  h1: text-2xl font-semibold text-slate-900  "Tạo Văn Bản Giả"
  p:  text-sm text-slate-500  "Lorem Ipsum Generator"

CONTROLS CARD: bg-white border border-slate-100 rounded-xl p-6 mb-6
  grid grid-cols-1 md:grid-cols-3 gap-6

  Loại Văn Bản toggle (2 buttons):
    Active:   flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-900 text-white
    Inactive: bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100
    Labels: 🇻🇳 Tiếng Việt · 📜 Lorem Ipsum

  Đơn Vị toggle (3 buttons: Đoạn · Câu · Từ):
    Same pattern, Active: bg-slate-900 text-white

  Số Lượng counter:
    Decrement btn: w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg
                   flex items-center justify-center text-slate-600 hover:bg-slate-100
                   <Minus size={16} />
    Number input:  flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg
                   text-center text-slate-800 font-medium
                   focus:ring-2 focus:ring-slate-900/10
    Increment btn: same as decrement + <Plus size={16} />

  Footer (border-t border-slate-100 pt-6 mt-6):
    Stats: flex items-center gap-4 text-sm text-slate-500
           "{N} từ • {N} ký tự • {N} đoạn"
    Tạo Mới btn: bg-white border border-slate-200 hover:bg-slate-50 text-slate-700
                 font-medium rounded-lg text-sm  <RefreshCw size={16} />
    Sao Chép btn: bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg
                  {copied ? <Check /> : <Copy />}

GENERATED TEXT CARD: bg-white border border-slate-100 rounded-xl overflow-hidden
  Header: px-5 py-4 border-b border-slate-100 flex items-center justify-between
    Left: <FileText size={18} className="text-slate-400" /> + "Văn Bản Được Tạo"
    Right: text-xs text-slate-400 uppercase tracking-wide
           "Tiếng Việt - Marketing" | "Lorem Ipsum - Classic"
  Content: p-6 whitespace-pre-wrap text-slate-700 leading-relaxed font-normal

INFO TIP: mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl
  text-sm text-slate-600
```

---

### 5.5 Nhắc Việc Một Lần (OneTimeReminder.tsx)

```
File: components/Toolkit/OneTimeReminder.tsx
Page BG: bg-slate-50   max-w-2xl mx-auto   p-8

HEADER: same pattern as 5.4
  Icon: <Bell size={20} />
  h1: "Nhắc Việc Một Lần"
  p:  "One-time Reminder"

NOTIFICATION BANNER (conditional):
  bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6
  flex items-center justify-between
  Left: <AlertCircle size={20} className="text-amber-600" /> + text-sm text-amber-800
  Right btn: px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg
             "Bật Thông Báo"

ADD REMINDER FORM: bg-white border border-slate-100 rounded-xl p-6 mb-6
  space-y-4

  Text input:
    Label: block text-sm font-medium text-slate-700 mb-1.5  "Việc cần nhắc"
    Input: w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg
           text-sm text-slate-800 placeholder:text-slate-400
           focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none

  Date & Time grid: grid grid-cols-2 gap-4
    Same input style

  Submit btn: w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium
              rounded-lg active:scale-[0.98] flex items-center justify-center gap-2
              <Plus size={18} />  "Thêm Nhắc Việc"

REMINDERS LIST: bg-white border border-slate-100 rounded-xl overflow-hidden
  Header: px-5 py-4 border-b border-slate-100 flex items-center justify-between
    Left: <Clock size={18} className="text-slate-400" /> + "Đang chờ nhắc"
    Right count: text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md

  Reminder item: px-5 py-4 flex items-center justify-between
                 hover:bg-slate-50 transition-colors group
    Task: text-sm font-medium text-slate-900 truncate
    Date: text-xs text-slate-500
    Countdown badge: text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded
    Delete btn: opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500

  Empty: p-12 text-center
    Icon box: w-12 h-12 bg-slate-50 rounded-lg mx-auto mb-3
              <BellRing size={24} className="text-slate-300" />

INFO TIP: mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600
```

---

### 5.6 Chuyển Vấn Đề Thành Câu Hỏi (ProblemToQuestion.tsx)

```
File: components/Toolkit/ProblemToQuestion.tsx
Page BG: bg-slate-50   max-w-3xl mx-auto   p-8

HEADER: same pattern
  Icon: <HelpCircle size={20} />
  h1: "Chuyển Vấn Đề Thành Câu Hỏi"
  p:  "Problem to Actionable Questions"

INPUT CARD: bg-white border border-slate-100 rounded-xl p-6 mb-6
  Label: block text-sm font-medium text-slate-700 mb-1.5
         "Nhập vấn đề hoặc lời than phiền"
  Textarea: w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg
            text-sm text-slate-800 placeholder:text-slate-400
            focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300
            resize-none rows={4}

  Example chips row:
    Label: text-xs text-slate-500 mb-2  "Ví dụ:"
    Chip: px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg
          text-xs text-slate-600 hover:bg-slate-100

  Generate btn:
    Normal: w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium
            rounded-lg active:scale-[0.98]
            flex items-center justify-center gap-2
            <Sparkles size={18} />  "Chuyển Thành Câu Hỏi"
    Loading: <Loader2 size={18} className="animate-spin" />  "Đang phân tích..."
    disabled: opacity-50 cursor-not-allowed

RESULTS CARD (conditional): bg-white border border-slate-100 rounded-xl overflow-hidden
  Header: px-5 py-4 border-b border-slate-100 flex items-center justify-between
    Left: <Lightbulb size={18} className="text-amber-500" /> + "Câu Hỏi Có Thể Hành Động"
    Right "Copy all": px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg
                      text-xs text-slate-600 hover:bg-slate-100
                      <Copy size={14} />

  Question items: divide-y divide-slate-100
    Each: px-5 py-4 flex items-start gap-4 group hover:bg-slate-50
      Number badge: w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center
                    text-slate-600 font-medium text-sm shrink-0 mt-0.5
      Text: flex-1 text-sm text-slate-800 leading-relaxed
      Copy btn: opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-slate-600
        Copied state: <Check size={16} className="text-emerald-500" />

  Footer (border-t border-slate-100 bg-slate-50 px-5 py-4):
    "Tạo câu hỏi mới" btn: bg-white border border-slate-200 hover:bg-slate-50
                            text-slate-700 font-medium rounded-lg text-sm
                            <RefreshCw size={16} />

EMPTY STATE: bg-white border border-slate-100 rounded-xl p-12 text-center
  Icon: w-14 h-14 bg-slate-50 rounded-xl mx-auto mb-4
        <HelpCircle size={28} className="text-slate-300" />

INFO TIP: mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600
```

---

### 5.7 Chuyển Đổi Link Unsplash (UnsplashLinkConverter.tsx)

```
File: components/Toolkit/UnsplashLinkConverter.tsx
Page BG: bg-[#F9FAFB]   max-w-4xl mx-auto   p-8
Note: dùng gray-* + purple accent

HEADER (center): text-center mb-8
  Icon box: inline-flex items-center justify-center w-14 h-14
            bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl mb-4
            <Link size={28} className="text-purple-600" />
  h1: text-2xl font-bold text-gray-900 mb-2  "Chuyển Đổi Link Unsplash"
  p:  text-gray-500

MAIN GRID: grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6

  LEFT — Input card: bg-white rounded-2xl p-6 border border-gray-100 shadow-sm
    Label: block text-sm font-medium text-gray-700 mb-2
           "Dán link Unsplash vào đây"
    Textarea: w-full h-32 px-4 py-3 border border-gray-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-purple-200
              focus:border-purple-300 resize-none text-sm

  RIGHT — Output card: bg-white rounded-2xl p-6 border border-gray-100 shadow-sm
    (Has result):
      Label row: flex items-center justify-between mb-2
        Copy btn:
          Normal:  bg-purple-50 text-purple-600 hover:bg-purple-100
          Copied:  bg-green-100 text-green-600
          Size:    px-3 py-1.5 rounded-lg text-sm font-medium
                   <Copy size={14} /> / <Check size={14} />
      Link display: p-3 bg-gray-50 rounded-xl text-xs text-gray-700 break-all font-mono
      Image preview: relative rounded-xl overflow-hidden bg-gray-100 aspect-video
                     <img> w-full h-full object-cover

    (No result): h-full flex items-center justify-center text-gray-400 text-center py-8
      <Image size={32} className="mx-auto mb-2 opacity-50" />

HISTORY CARD: bg-white rounded-2xl p-6 border border-gray-100 shadow-sm
  Header: flex items-center justify-between mb-4
    Left: <Clock size={16} className="text-gray-500" />
          "Lịch sử chuyển đổi"
          count badge: text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500
    Right "Xóa tất cả": text-xs text-red-500 hover:text-red-600

  History grid: grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3
    Each item: group relative bg-gray-50 hover:bg-gray-100 rounded-xl overflow-hidden cursor-pointer
      Thumbnail: aspect-video bg-gray-200  <img> object-cover
      Time: p-2 text-[10px] text-gray-400 truncate
      Delete btn: absolute top-1 right-1 p-1 bg-black/50 text-white rounded
                  opacity-0 group-hover:opacity-100  <Trash2 size={12} />

INFO BOX: mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100
  text-sm text-purple-700
  <code>: px-1.5 py-0.5 bg-purple-100 rounded
```

---

## DESIGN SYSTEM NOTE — Bộ Công Cụ vs Trang Chính

| Thuộc tính | 4 Trang Chính (ToDo, News, Knowledge, Toolkit) | Các Tool Bên Trong |
|---|---|---|
| BG color | `bg-[#FCFDFC]` | `bg-[#F9FAFB]` hoặc `bg-slate-50` |
| Card | `stone-200/90 border bg-white rounded-2xl` | `border-gray-100 shadow-sm rounded-2xl` |
| Input | `stone-200 border` + `focus:ring-stone-200` | `gray-200 border` + `focus:ring-blue-500` |
| Button primary | `bg-stone-900 text-white` | `bg-slate-900 text-white` (slate tools) hoặc `bg-blue-500` (gray tools) |
| Text color | `text-stone-900/600/400` | `text-gray-900/500/400` hoặc `text-slate-900/500` |
| Accent | stone-300 | blue-500 / purple-600 / indigo-600 (per tool) |
