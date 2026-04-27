# Quản lý Plan — Design System (2 trang dropdown)

> Source: `PlanList.tsx` · `PlanCalendar.tsx` · 2026-04-26

---

## SHARED TOKENS

```
Page BG:       bg-[#FCFDFC]   font-sans
cardClass:     rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]
inputClass:    w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900
               placeholder:text-stone-400
               focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80
               transition-all
```

---

## TRANG 1 — DANH SÁCH PLANS (PlanList.tsx)

### Header

```
wrapper:   z-10 flex shrink-0 items-center justify-between
           border-b border-stone-200/70 bg-[#FCFDFC] px-8 py-4

LEFT block:
  display: flex items-center gap-4

  Icon box:
    h-10 w-10  rounded-xl  bg-stone-100  text-stone-500
    icon: <CreditCard size={20} strokeWidth={1.5} />

  Text block:
    Eyebrow: text-xs font-medium uppercase tracking-wide text-stone-400
             content: "Quản lý & Thanh toán"
    Title:   text-lg font-normal tracking-tight text-stone-900
             content: "Danh sách Plans"

RIGHT — CTA button:
  inline-flex items-center gap-2
  rounded-full  bg-stone-900
  px-6 py-3
  text-sm font-medium text-white shadow-sm
  hover: hover:bg-stone-800
  icon: <Plus size={18} strokeWidth={1.5} />
  label: "Thêm Plan"
```

### Content Area

```
wrapper: flex-1 overflow-auto p-8

Table container: cardClass + mx-auto max-w-7xl overflow-hidden
  <table> w-full text-left border-collapse

THEAD:
  border-b border-stone-100 bg-stone-50/70
  <th>: p-5 text-xs font-semibold uppercase tracking-wide text-stone-500
  Columns: # | Tên Web | Email | Số tiền | Ngày T.Toán Tiếp Theo | Ngày còn lại | Hành động

TBODY rows:
  divide-y divide-stone-100/70
  hover: hover:bg-stone-50/50

  td base: p-5
  td #:    font-mono text-xs text-stone-400
  td Name: flex items-center gap-3
    Icon box: h-10 w-10 rounded-xl border border-stone-200 bg-stone-50 text-stone-600 shadow-sm
              icon size={18} strokeWidth={1.5}
    Name span: font-medium text-stone-800
  td Email:  text-sm text-stone-600
  td Price:  font-mono text-sm font-medium text-stone-700  (Intl.NumberFormat VND)
  td Date:   text-sm font-medium text-stone-800
  td Days remaining — urgency:
    > 7 ngày:  text-emerald-600
    ≤ 7 ngày:  text-amber-600 font-medium
    ≤ 3 ngày:  text-rose-600 font-semibold
    Quá hạn:   text-rose-600 font-semibold

  Action buttons (td text-right):
    display: flex justify-end gap-2
    Base:    rounded-xl border border-stone-200 bg-white p-2 text-stone-400 shadow-sm
             transition-all hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50
    Delete:  hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50
    Icons:   Eye / Edit2 / Trash2  size={18} strokeWidth={1.5}

EMPTY STATE (colSpan=7):
  p-20 text-center text-stone-400
  Icon box: h-16 w-16 rounded-2xl border border-stone-200 bg-white
            <CreditCard size={32} strokeWidth={1} className="text-stone-200" />
  Text: "Chưa có plan nào được thêm."
```

### Add/Edit Modal

```
Backdrop: fixed inset-0 z-50 flex items-center justify-center
          bg-black/20 backdrop-blur-sm p-4

Modal:    flex w-full max-w-2xl flex-col rounded-2xl border border-stone-200/90 bg-white
          shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh]

Header:   flex items-center justify-between border-b border-stone-100
          bg-stone-50/60 p-6 rounded-t-2xl
  Title:  text-lg font-medium text-stone-900
  Close:  rounded-full bg-white p-2 text-stone-400 shadow-sm
          hover: hover:text-stone-700 hover:bg-stone-100
          icon: <X size={20} strokeWidth={1.5} />

Body:     flex-1 space-y-6 overflow-auto p-8

  Icon Picker section:
    label: mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500
    Icons: flex gap-3 overflow-x-auto pb-2
    Each icon btn:
      min-h-[60px] min-w-[60px] flex items-center justify-center
      rounded-xl border p-4 transition-all
      Active:   border-stone-400 bg-stone-100 text-stone-700 ring-2 ring-stone-300
      Inactive: border-stone-200 bg-stone-50 text-stone-400
                hover:border-stone-300 hover:bg-white
      Icon size={24} strokeWidth={1.5}

  Form grid: grid grid-cols-2 gap-6
  Fields use inputClass (shared above)
  Field label: mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500
  Required (*): text-rose-500

  Card input (with icon):
    wrapper: relative
    Icon: absolute left-4 top-1/2 -translate-y-1/2 text-stone-400  size={18} strokeWidth={1.5}
    Input: pl-12 pr-4 py-3 w-full + rest of inputClass

Footer:   flex gap-4 border-t border-stone-100 bg-white p-6 rounded-b-2xl
  Cancel: flex-1 rounded-xl border border-stone-200 py-3.5 text-sm font-medium
          text-stone-500 hover:bg-stone-50
  Save:   flex-1 rounded-xl bg-stone-900 py-3.5 text-sm font-medium
          text-white hover:bg-stone-800
```

### View Detail Modal

```
Backdrop: same as Add modal

Modal:    w-full max-w-md rounded-2xl border border-stone-200/90 bg-white
          shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden

Modal Header: border-b border-stone-100 bg-stone-50/60 p-8 text-center
  Close (absolute): right-4 top-4 rounded-full bg-white p-2 text-stone-400 shadow-sm
                    hover:text-stone-700 hover:bg-stone-100
  Icon box: mx-auto mb-4 h-16 w-16 rounded-2xl border border-stone-200 bg-white text-stone-500 shadow-sm
  Name: text-xl font-semibold text-stone-900
  Price: mt-2 font-mono text-lg text-stone-600

Info rows: space-y-4 p-6
  Row item: flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4
    Icon box: rounded-xl bg-white p-3 text-stone-500 shadow-sm  icon size={20} strokeWidth={1.5}
    Label: text-[10px] font-semibold uppercase tracking-wider text-stone-400
    Value: text-sm font-medium text-stone-800

  Date row: flex gap-4
    Each cell: flex-1 rounded-xl border border-stone-200 p-4
               Label: flex items-center gap-2 text-stone-400
                      <Calendar size={14} strokeWidth={1.5} />
                      text-[10px] font-semibold uppercase
               Value: text-sm font-medium text-stone-800

  Urgency badge (text-center pt-2):
    Quá hạn:    rounded-full bg-rose-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600
    ≤ 3 ngày:   same rose
    ≤ 7 ngày:   rounded-full bg-amber-50 ... text-amber-600
    OK:         rounded-full bg-emerald-50 ... text-emerald-600

Footer: flex gap-3 border-t border-stone-100 pt-4
  Edit: flex-1 rounded-xl border border-stone-200 py-3.5 text-sm font-medium text-stone-600
        hover:bg-stone-50 hover:text-stone-900
  Delete: flex-1 rounded-xl border border-rose-200 py-3.5 text-sm font-medium text-rose-600
          hover:bg-rose-50
```

---

## TRANG 2 — LỊCH THANH TOÁN (PlanCalendar.tsx)

### Header

```
wrapper:  z-10 flex shrink-0 flex-col gap-4 border-b border-stone-200/70
          bg-[#FCFDFC] px-8 py-4
          sm:flex-row sm:items-center sm:justify-between

LEFT block:
  display: flex items-center gap-4
  Icon box:  h-10 w-10 rounded-xl bg-stone-100 text-stone-500
             icon: <Calendar size={20} strokeWidth={1.5} />
  Text:
    Eyebrow: text-xs font-medium uppercase tracking-wide text-stone-400
             content: "Quản lý & Thanh toán"
    Title:   text-lg font-normal tracking-tight text-stone-900
             content: "Tháng {M}/{YYYY}"
    Sub:     mt-0.5 text-sm text-stone-500
             "Lịch thanh toán đăng ký — theo dõi plan đến hạn trong tháng"

RIGHT — Month Nav:
  inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1
  shadow-[0_1px_2px_rgba(15,23,42,0.04)]

  Prev/Next button:
    rounded-full p-2.5 text-stone-600 transition-colors hover:bg-stone-50
    icon: <ChevronLeft/ChevronRight size={20} strokeWidth={1.5} />

  Divider: h-6 w-px bg-stone-200
```

### Layout

```
Body: flex min-h-0 flex-1 gap-6 overflow-hidden p-6 lg:p-8

  LEFT — Calendar (flex-1):
    cardClass + flex min-h-0 min-w-0 flex-1 flex-col p-6

    Day headers: grid grid-cols-7 mb-4
      Each: text-center text-xs font-semibold uppercase tracking-wide text-stone-500
      Labels: CN T2 T3 T4 T5 T6 T7

    Day grid: grid min-h-0 flex-1 grid-cols-7 auto-rows-fr gap-2

      Day cell base:
        flex min-h-[72px] flex-col justify-between rounded-xl border p-2 transition-colors

        States:
          Default:      border-stone-200/90 bg-white
          Has plans:    border-stone-300 bg-stone-50/80 cursor-pointer hover:bg-stone-100/80
          Today:        border-stone-300 bg-stone-50/60

        Today number:   h-6 w-6 rounded-full bg-stone-900 text-xs font-medium text-white
                        flex items-center justify-center
        Normal number:  text-sm font-medium text-stone-600

        Status dot (top-right):
          ≤ 3 ngày: h-2 w-2 rounded-full bg-rose-500 animate-pulse
          ≤ 7 ngày: h-2 w-2 rounded-full bg-amber-500
          > 7 ngày: h-2 w-2 rounded-full bg-emerald-500

        Plan chip: truncate rounded-md border border-stone-200 bg-white px-1 py-0.5
                   text-[10px] text-stone-700

  RIGHT — Sidebar (w-80):
    display: flex w-full shrink-0 flex-col gap-6 lg:w-80

    Summary card (dark):
      rounded-2xl border border-stone-800/90 bg-stone-900 p-6 text-white
      shadow-[0_1px_2px_rgba(15,23,42,0.06)]

      Header row: flex items-center gap-2 text-stone-400 mb-4
        <TrendingUp size={18} strokeWidth={1.5} />
        text-xs font-semibold uppercase tracking-wide
        "Thanh toán tháng này"

      Total amount: text-3xl font-semibold tracking-tight (Intl VND)
      Sub: mt-1 text-sm text-stone-400

      Divider: border-t border-stone-700/80 pt-4
      Count:   text-2xl font-semibold
      Label:   mt-0.5 text-xs font-medium text-stone-400
               "Tổng plan đang đăng ký"

    Detail card:
      cardClass + relative flex flex-1 flex-col p-6
      Title: mb-4 text-sm font-medium text-stone-900
             "Chi tiết Plan"

      Empty: absolute inset-0 flex items-center justify-center px-6 text-center
             text-sm text-stone-400

      Selected plan view: animate-fade-in space-y-4
        Icon+name row: flex items-center gap-4 mb-2
          Icon: h-12 w-12 rounded-xl border border-stone-200 bg-stone-50  icon size={22} strokeWidth={1.5}
          Label: text-xs font-semibold uppercase tracking-wide text-stone-500
          Name:  text-lg font-medium leading-tight text-stone-900

        Amount: label + font-mono text-xl font-medium text-stone-900

        Card info (conditional): flex items-center gap-2 text-sm font-medium text-stone-700
          <CreditCard size={16} className="text-stone-400" />

        Email: truncate text-sm text-stone-600

        Status panel: mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4
          Header: flex items-center gap-2
            <AlertCircle size={16} className="text-stone-500" />
            text-sm font-medium text-stone-800
          Days text: text-sm font-semibold/medium (color by urgency)
          Progress bar: h-2 w-full overflow-hidden rounded-full bg-stone-200
            Fill: h-full (bg-emerald/amber/rose-500) width = (30-days)*3.33%
```

---

## URGENCY COLOR SYSTEM (shared cả 2 trang)

| Condition | Text color | BG (badge/dot) |
|---|---|---|
| days > 7 | `text-emerald-600` | `bg-emerald-500` / `bg-emerald-50` |
| days ≤ 7 | `text-amber-600` | `bg-amber-500` / `bg-amber-50` |
| days ≤ 3 | `text-rose-600 font-semibold` | `bg-rose-500 animate-pulse` / `bg-rose-50` |
| days < 0 | `text-rose-600 font-semibold` | `bg-rose-500 animate-pulse` / `bg-rose-50` |
