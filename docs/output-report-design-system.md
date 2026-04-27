# Output Report Design System

> Nguồn: `OptimkiSidebarReport.tsx` · `result-design-system.css` · report `Blue Vigor Travel` trong history của Opti M.KI Engine  
> Mục đích: file này ghi lại design system dùng chung cho **toàn bộ trang output kết quả của tất cả tính năng**.  
> Một vài feature có thể có block riêng, nhưng **navbar, spacing, typography, section shell, button language và visual nền chung** phải theo chuẩn này.

---

## 1. Scope

- Áp dụng cho toàn bộ trang output đã render xong kết quả
- Áp dụng cho cả report mở trực tiếp sau generate và report mở lại từ history
- Không áp dụng cho form input, wizard, dashboard, list card ngoài history

**Được custom theo feature:**
- charts
- tables
- block phân tích đặc thù
- layout riêng bên trong từng section

**Không được custom theo feature:**
- sticky result navbar
- page background
- typography cơ bản
- section header shell
- button action language
- border / shadow language chung

---

## 2. Tokens dùng chung

### 2.1 Màu chính

| Token | Value | Dùng cho |
|---|---|---|
| `--rk-ink` | `#1c1917` | text chính, border đậm, CTA tối |
| `--rk-ink-3` | `rgba(28,25,23,0.62)` | body text |
| `--rk-ink-4` | `rgba(28,25,23,0.34)` | meta text |
| `--rk-paper` | `#fcfbf8` | nền toàn report |
| `--rk-surface` | `#ffffff` | card nền trắng |
| `--rk-surface-soft` | `#f5f5f4` | chip, block nhẹ |
| `--rk-border` | `rgba(28,25,23,0.10)` | border mặc định |
| `NAV_TEXT` | `#4A4A4A` | chữ nút `Lưu`, `Xuất PNG` |
| `BORDER_SUBTLE` | `#E8E5E1` | divider section |

### 2.2 Typography

| Token | Value |
|---|---|
| Font | `Plus Jakarta Sans, sans-serif` |
| `--rk-text-xs` | `10px` |
| `--rk-text-sm` | `12px` |
| `--rk-text-md` | `14px` |
| `--rk-text-lg` | `16px` |
| `--rk-text-xl` | `22px` |

### 2.3 Radius + shadow

| Token | Value |
|---|---|
| `--rk-radius-sm` | `12px` |
| `--rk-radius-md` | `18px` |
| `--rk-radius-lg` | `24px` |
| `--rk-radius-pill` | `999px` |
| `--rk-shadow-sm` | `0 4px 18px rgba(28,25,23,0.05)` |
| `--rk-shadow-md` | `0 14px 36px rgba(28,25,23,0.08)` |

---

## 3. Page Shell

### 3.1 Root wrapper

```tsx
<div
  className="flex h-full flex-col"
  style={{
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    color: '#4A4A4A',
    backgroundColor: '#FCFDFC',
  }}
/>
```

### 3.2 Body wrapper

```tsx
<div className="w-full pb-3">
  <div ref={reportContentRef} className="px-6 pt-5">
    <div className="space-y-4">...</div>
  </div>
</div>
```

**Spec:**
- nền trang: `#FCFDFC`
- horizontal padding body: `24px`
- top padding body: `20px`
- khoảng cách giữa các section: `16px`

---

## 4. Sticky Result Navbar

> Đây là thanh navbar có tên report + nút `Lưu`, `Xuất PNG`, `Render lại`.  
> Mọi output page phải dùng cùng pattern này.

### 4.1 Container

```tsx
<div className="sticky top-0 z-30 w-full border-b border-stone-200/80 bg-[#FCFDFC]/95 backdrop-blur">
  <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-3 px-6 py-2.5">
    ...
  </div>
</div>
```

**Spec:**
- `sticky top-0 z-30`
- border bottom: `stone-200/80`
- background: `#FCFDFC` với opacity `0.95`
- blur nhẹ
- inner min-height: `58px`
- padding: `px-6 py-2.5`

### 4.2 Cụm bên trái

```tsx
<div className="flex min-w-0 flex-wrap items-center gap-3">
  [model chip]
  [title row]
  [date]
</div>
```

### 4.3 Model chip

```tsx
<span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold tracking-tight text-stone-600">
  Tất cả mô hình
</span>
```

### 4.4 Title row

```tsx
<div className="flex min-w-0 items-center gap-2 text-[16px] font-bold tracking-tight text-stone-900">
  <ModelIcon size={15} strokeWidth={1.8} />
  <span className="truncate">Blue Vigor Travel</span>
  [edit trigger / input]
</div>
```

**Spec:**
- title size: `16px`
- weight: `700`
- icon size: `15`
- title luôn `truncate`

### 4.5 Date

```tsx
<div className="text-[14px] text-stone-400">· 27 thg 4, 2026</div>
```

### 4.6 Cụm action bên phải

```tsx
<div className="flex items-center gap-2">
  [Lưu]
  [divider]
  [Xuất PNG]
  [divider]
  [Render lại]
</div>
```

Thứ tự phải luôn là:
1. `Lưu`
2. `Xuất PNG`
3. `Render lại`

### 4.7 Nút `Lưu` và `Xuất PNG`

```tsx
className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors hover:bg-black/[0.05]"
style={{ color: '#4A4A4A' }}
```

**Spec:**
- height: `28px`
- radius: `8px`
- text: `12px`, `500`
- icon size: `13`
- hover: `bg-black/[0.05]`

### 4.8 Divider

```tsx
<div className="h-4 w-px bg-stone-200" />
```

### 4.9 Nút `Render lại`

```tsx
className="inline-flex h-7 min-w-[100px] items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
```

**Spec:**
- height: `28px`
- min-width: `100px`
- radius: `12px`
- text: `12px`, `600`
- bg: `stone-900`
- hover: `stone-800`
- disabled: giảm opacity + cấm click
- loading: đổi icon thành spinner, label có thể đổi theo `renderStep`

### 4.10 Edit tên report

**Edit trigger:**

```tsx
<button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-black/[0.05] hover:text-stone-900">
  <Pencil size={13} />
</button>
```

**Input state:**

```tsx
<input className="h-8 min-w-[220px] max-w-[420px] rounded-lg border border-stone-200 bg-white px-3 text-[15px] font-semibold text-stone-900 outline-none transition-colors focus:border-stone-400" />
```

**Confirm button:**
- size `32x32`
- radius `8px`
- hover bg `black/[0.05]`
- icon size `14`

---

## 5. Section Shell

### 5.1 Section wrapper

```tsx
<section className="overflow-hidden bg-transparent">
```

### 5.2 Section header

```tsx
<div className="flex items-center gap-3 px-4 py-3.5">
  [number chip]
  [title cluster]
</div>
```

### 5.3 Number chip

```tsx
<div
  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold"
  style={{ backgroundColor: '#f5f5f4', color: '#1c1917' }}
>
  01
</div>
```

### 5.4 Title cluster

**Eyebrow:**

```tsx
<div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
  MÔ HÌNH CHIẾN LƯỢC
</div>
```

**Title:**

```tsx
<div className="text-[14px] font-bold tracking-tight text-stone-900">
  Phân tích SWOT
</div>
```

### 5.5 Section content shell

```tsx
<div className="border-t px-0 pb-0 pt-3.5" style={{ borderColor: '#E8E5E1' }}>
```

### 5.6 Paragraph block

```tsx
<div className="mb-4 space-y-2.5">
  <p className="text-[11px] leading-5 text-stone-600">...</p>
</div>
```

### 5.7 Verdict block

```tsx
<div
  className="mb-4 rounded-xl p-3.5 text-[12px] font-medium leading-5 text-stone-800"
  style={{
    backgroundColor: '#f5f5f4',
    borderLeft: '4px solid #1c1917',
  }}
>
  ...
</div>
```

---

## 6. Matrix / Card Language bên trong report

> Áp dụng cho SWOT, AIDA, 4P, 5W1H, SMART, timeline và các card neutral khác.

### 6.1 Matrix shell chuẩn

```tsx
<div
  className="grid grid-cols-1 overflow-hidden rounded-xl border bg-transparent xl:grid-cols-2"
  style={{ borderColor: '#1c1917' }}
>
```

**Spec:**
- 1 cột ở màn nhỏ
- 2 cột ở `xl` nếu là matrix cơ bản
- radius: `12px`
- border: `#1c1917`

### 6.2 Card con chuẩn

```tsx
<article className="relative min-h-[220px] p-4 xl:p-5">
```

**Spec:**
- min height: `220px`
- padding: `16px`, desktop `20px`

### 6.3 Top line

```tsx
<div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: '#1c1917' }} />
```

### 6.4 Watermark chữ lớn

```tsx
<div className="pointer-events-none absolute right-5 top-8 select-none text-[72px] font-semibold leading-none tracking-[-0.08em] opacity-60">
```

**Spec:**
- size: `72px`
- opacity: `0.6`
- màu thường: `#e7e5e4`

### 6.5 Header card con

```tsx
<div className="mb-5 flex items-center gap-3">
  <div
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
    style={{ backgroundColor: '#f5f5f4', color: '#44403c' }}
  >
    S
  </div>

  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
    Điểm mạnh
  </div>
</div>
```

### 6.6 Bullet row

```tsx
<div className="flex items-start gap-4">
  <div className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" />
  <span className="text-[13px] leading-6 text-stone-600">...</span>
</div>
```

### 6.7 Các variant được phép

| Variant | Grid | Đặc điểm |
|---|---|---|
| `SWOT` | `1 -> xl:2` | watermark, card chia 4 ô, có cross matrix phụ |
| `AIDA` | `1 -> xl:2` | step cards |
| `4P` | `1 -> xl:2` | neutral cards + callout phụ |
| `5W1H` | `1 -> xl:3` | question cards |
| `SMART` | `1 -> md:2 -> xl:5` | ring/progress visual |
| `Timeline` | `1 -> xl:3` | month + task lines |

**Quy tắc:**
- được đổi layout bên trong
- không được đổi ngôn ngữ nền/border/type của shell ngoài
- accent màu nếu có chỉ sống ở ring, bullet dot, thin top bar hoặc icon nhỏ

---

## 7. Pro Gate / Premium Lock Block

> Dùng khi output có phần khóa Pro/Pro Max.

### 7.1 Card shell

```css
.rk-pro-gate-card {
  display: grid;
  max-width: 600px;
  overflow: hidden;
  border: 1px solid var(--rk-border);
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 14px 36px rgba(28,25,23,0.08);
}

.rk-pro-gate-card--compact {
  grid-template-columns: minmax(0, 4fr) minmax(0, 3fr);
}
```

### 7.2 Content panel

- padding: `24px 24px 22px`
- gap dọc: `18px`
- 1 CTA duy nhất

### 7.3 Eyebrow

- padding: `8px 16px`
- radius: `14px`
- bg: `#fbf5e6`
- text: `#5f7493`
- size: `11px`
- tracking: `0.28em`

### 7.4 CTA

- min-height: `42px`
- padding X: `24px`
- radius: full
- bg: `#1c1917`
- text: trắng
- size: `12px`
- weight: `700`

### 7.5 Visual panel

- border-left nhẹ
- nền neutral gradient
- lock ring khoảng `92x92`

---

## 8. Responsive rules

### 8.1 Navbar

```css
@media (max-width: 900px) {
  .rk-result-toolbar__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .rk-result-toolbar__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
```

### 8.2 Matrix

- dưới `xl`: đa số matrix rút về 1 cột hoặc 2 cột nhẹ
- không ép giữ desktop density ở mobile

### 8.3 Pro gate

- dưới mobile: layout 2 cột chuyển thành 1 cột
- visual panel xuống dưới
- border-left đổi thành border-top

---

## 9. Rule áp dụng cho mọi feature

### 9.1 Phải reuse

- `components/result-design-system.css`
- sticky navbar pattern của `OptimkiSidebarReport`
- section shell pattern
- token `--rk-*`

### 9.2 Không được làm

- tạo palette riêng cho từng output page
- dùng serif cho result page mới
- đổi navbar thành dark bar / gradient bar
- dùng màu feature-specific cho chrome chung
- làm mỗi section một kiểu radius/border khác nhau

### 9.3 Nếu feature cần custom

- chỉ custom block bên trong section
- shell ngoài vẫn phải giữ đúng system này
- nếu cần token mới thì thêm vào `result-design-system.css`

---

## 10. Checklist ngắn cho dev

- [ ] Page nền `#FCFDFC`
- [ ] Font `Plus Jakarta Sans`
- [ ] Có sticky navbar đúng pattern
- [ ] Có `Lưu`, `Xuất PNG`, `Render lại`
- [ ] Body dùng `px-6 pt-5`
- [ ] Section gap `16px`
- [ ] Section chip `32x32`
- [ ] Divider section `#E8E5E1`
- [ ] Paragraph mặc định `11px / 20px`
- [ ] Matrix giữ neutral monochrome
- [ ] Feature-specific block không phá shell chung

---

## 11. Unresolved questions

- Chưa xác nhận được trực tiếp record cloud history qua Supabase do kết nối đọc từ môi trường hiện tại không ổn định, nhưng renderer và history references trong code đang bám đúng flow/report `Blue Vigor Travel` của Opti M.KI Engine.
