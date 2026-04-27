# Brand Vault Upsell Card — Design System

> Nguồn: `BrandVaultUpsellCard.tsx` · `MastermindStrategyEditorial.css` (`.ms-vault-*`) · 2026-04-26  
> **Mục đích:** Tài liệu đầy đủ để AI tạo lại chính xác card Brand Vault upsell xuất hiện khi user chưa có Pro Max và chọn tab "Brand Vault".

---

## 1. Tổng quan Component

`BrandVaultUpsellCard` là một **shared component** — dùng chung trên nhiều tính năng (IMC Planner, Opti M.KI Engine, PESTEL, Porter...).

Hiển thị **2 cột:**
- **Cột trái (1.15fr):** Nội dung — label, title, description, benefits list, CTA button
- **Cột phải (0.85fr):** Visual — DNA bars animation + Lock circle animation

**Khi nào hiển thị:** `activeTab === 'vault' && !isPromax`

---

## 2. Props Interface

```tsx
type BrandVaultUpsellCardProps = {
  title?: string;       // default: "Tính năng Brand Vault"
  description: string;  // bắt buộc
  benefits: string[];   // bắt buộc — danh sách tính năng
  ctaLabel?: string;    // default: "Nâng cấp Pro Max"
  onCtaClick?: () => void;
  className?: string;
};
```

**Ví dụ cho IMC Planner:**
```tsx
<BrandVaultUpsellCard
  description="Kế hoạch IMC sẽ chính xác hơn gấp 5 lần khi AI được học về DNA thương hiệu của bạn."
  benefits={[
    'Kết nối đa kênh dựa trên giá trị cốt lõi',
    'Phân bổ ngân sách tối ưu theo đặc thù ngành',
    'Tự động viết Key Hook theo Brand Voice',
    'Sẵn sàng hạng mục triển khai cho Team sản xuất',
  ]}
/>
```

---

## 3. Layout & Card Container

```css
.ms-vault-card {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
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

**Responsive (mobile ≤ 768px):**
```css
/* @media (max-width: 768px) */
.ms-vault-card {
  grid-template-columns: 1fr;    /* Chuyển thành 1 cột */
}
.ms-vault-content {
  border-right: none;
  border-bottom: 1px solid rgba(26, 25, 22, 0.05);
  padding: 1.75rem 1.5rem;       /* Giảm padding */
}
.ms-vault-visual {
  min-height: 200px;
}
```

**Variant chỉ có 1 cột (không có visual):**
```css
.ms-vault-card--content-only {
  grid-template-columns: 1fr;
}
.ms-vault-card--content-only .ms-vault-content {
  border-right: none;
}
```

---

## 4. Cột Trái — Content Panel

```css
.ms-vault-content {
  padding: 2.5rem 3rem;       /* 40px 48px */
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid rgba(26, 25, 22, 0.05);
  gap: 1.125rem;              /* 18px giữa các block */
}
```

### 4.1 Eyebrow Label ("BRAND VAULT ACCESS")

```css
.ms-vault-label {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #64748b;             /* slate-500 */
  background: #fffbeb;        /* amber-50 */
  border: 1px solid rgba(100, 116, 139, 0.2);
  gap: 8px;
  padding: 6px 12px 6px 10px;
  border-radius: 6px;
  margin: 0 0 0.5rem 0;      /* mb-2 */
  line-height: 1;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.ms-vault-label-diamond {
  color: #64748b;             /* Diamond icon */
  flex-shrink: 0;
}
```

Icon: `<Diamond size={11} strokeWidth={2.25} />`  
Text: `"Brand Vault Access"`

### 4.2 Title

```css
.ms-vault-title {
  font-family: var(--ms-serif);  /* Plus Jakarta Sans */
  font-size: 26px;
  line-height: 1.2;
  color: var(--ms-ink);          /* #1c1917 */
  letter-spacing: -0.02em;
  margin-top: 0;
}
```

### 4.3 Description

```css
.ms-vault-desc {
  font-size: 13px;
  line-height: 1.55;
  color: var(--ms-ink-3);        /* rgba(28,25,23,0.62) */
  max-width: 440px;
  margin-bottom: 0;
}
```

### 4.4 Benefits List

```css
.ms-vault-benefits {
  padding-top: 1rem;
  margin-top: 0.25rem;
  border-top: 1px solid var(--ms-rule);  /* rgba(28,25,23,0.10) */
  display: flex;
  flex-direction: column;
  gap: 0.5rem;             /* 8px giữa mỗi item */
  margin-bottom: 0.75rem;
}

.ms-vault-benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--ms-ink-3);  /* rgba(28,25,23,0.62) */
}

.ms-vault-benefit-icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--ms-green-bg);  /* rgba(28,25,23,0.04) ≈ stone-50 */
  border: 1px solid var(--ms-green-mid); /* rgba(28,25,23,0.10) */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--ms-green);   /* #1c1917 */
}
```

Icon trong benefit: `<Check size={14} strokeWidth={3} />`

### 4.5 CTA Button ("Nâng cấp Pro Max")

```css
.ms-vault-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--ms-ink);  /* #1c1917 */
  color: #fff;
  padding: 0.55rem 1.35rem;   /* ≈ py-2 px-5 */
  border-radius: 99px;        /* rounded-full */
  font-weight: 600;
  font-size: 12.5px;
  width: fit-content;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
}
```

| State | Style |
|---|---|
| Default | `background: #1c1917; color: #fff` |
| Hover | `transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); background: #000` |
| Active | `transform: translateY(0)` |

Icon bên phải: `<ChevronRight size={18} />`  
Label: `"Nâng cấp Pro Max ›"`

---

## 5. Cột Phải — Visual Panel

```css
.ms-vault-visual {
  background: #faf9f6;         /* warm off-white */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
```

### 5.1 Glow Background

```css
.ms-vault-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 55% 65% at 50% 50%,
    rgba(143, 94, 22, 0.05) 0%,
    transparent 70%
  );
  pointer-events: none;
}
```

### 5.2 DNA Bars Animation

```css
.ms-vault-dna {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  padding: 0 1.5rem 32px;
  height: 100%;
}

.ms-vault-dna-bar {
  width: 3px;
  background: linear-gradient(to top, var(--rk-ink-4), rgba(181, 181, 173, 0.2));
  border-radius: 99px;
  animation: msDnaPulse 3s ease-in-out infinite;
  /* height: dynamic — được set bằng inline style: height: `${12 + random * 24}%` */
  /* animation-delay: index * 0.15s */
}

@keyframes msDnaPulse {
  0%, 100% { transform: scaleY(1);    opacity: 0.18; }
  50%       { transform: scaleY(0.75); opacity: 0.08; }
}
```

Render 12 bars: `[1..12].map(i => <div style={{ height: `${12 + Math.random() * 24}%`, animationDelay: `${i * 0.15}s` }} />)`

### 5.3 Lock Circle

```css
.ms-vault-lock-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 2px 10px rgba(0,0,0,0.04),
    0 6px 24px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rk-ink-4);   /* rgba(28,25,23,0.34) */
  position: relative;
  animation: msFloat 3s ease-in-out infinite;
}

/* Vòng dashed quay chậm — inner */
.ms-vault-lock-circle::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px dashed rgba(143, 94, 22, 0.3);
  animation: msRingSpin 8s linear infinite;
}

/* Vòng dashed quay chậm — outer */
.ms-vault-lock-circle::after {
  content: '';
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  border: 1px dashed rgba(181, 181, 173, 0.25);
  animation: msRingSpin 14s linear infinite reverse;
}

@keyframes msRingSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

**Lock Icon bên trong:**
```css
.ms-vault-lock-icon {
  animation: msLockShake 2.5s ease-in-out infinite;
}
@keyframes msLockShake {
  0%, 90%, 100% { transform: rotate(0deg);   }
  92%           { transform: rotate(-8deg);  }
  94%           { transform: rotate(8deg);   }
  96%           { transform: rotate(-5deg);  }
  98%           { transform: rotate(5deg);   }
}
```

Icon: `<Lock size={32} strokeWidth={1.5} />`

**Floating animation:**
```css
@keyframes msFloat {
  0%, 100% { transform: translateY(0);    }
  50%       { transform: translateY(-6px); }
}
```

**Lock label:**
```css
.ms-vault-lock-text {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--rk-ink-4);
  /* content: "ENCRYPTED DNA" */
}
```

### 5.4 Corner Decorations

```css
.ms-vault-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  opacity: 0.18;
}

/* Top-left corner */
.ms-vault-corner-tl {
  top: 16px;
  left: 16px;
  border-top: 1.5px solid var(--rk-ink-4);
  border-left: 1.5px solid var(--rk-ink-4);
}

/* Bottom-right corner */
.ms-vault-corner-br {
  bottom: 16px;
  right: 16px;
  border-bottom: 1.5px solid var(--rk-ink-4);
  border-right: 1.5px solid var(--rk-ink-4);
}
```

---

## 6. CSS Variables cần có (`--ms-*`)

Các biến này được định nghĩa trong `MastermindStrategyEditorial.css` (`:root`):

```css
:root {
  --ms-ink:      var(--rk-ink);          /* #1c1917 */
  --ms-ink-2:    var(--rk-ink-2);        /* rgba(28,25,23,0.84) */
  --ms-ink-3:    var(--rk-ink-3);        /* rgba(28,25,23,0.62) */
  --ms-ink-4:    var(--rk-ink-4);        /* rgba(28,25,23,0.34) */
  --ms-green:    var(--rk-ink);          /* #1c1917 — monochrome */
  --ms-green-bg: var(--rk-surface-soft); /* ≈ stone-50 */
  --ms-green-mid:var(--rk-border);       /* rgba(28,25,23,0.10) */
  --ms-rule:     var(--rk-border);       /* rgba(28,25,23,0.10) */
  --ms-serif:    var(--rk-font-sans);    /* Plus Jakarta Sans */
  --ms-sans:     var(--rk-font-sans);    /* Plus Jakarta Sans */
}
```

---

## 7. Import & Cách dùng đúng

```tsx
import BrandVaultUpsellCard from './BrandVaultUpsellCard';
import './MastermindStrategyEditorial.css';  // Import CSS đi kèm

// Trong render (khi tab = vault và không phải ProMax):
{activeTab === 'vault' && !isPromax && (
  <BrandVaultUpsellCard
    description="..."
    benefits={['...', '...', '...', '...']}
  />
)}
```

> **Lưu ý quan trọng:** `BrandVaultUpsellCard.tsx` tự import `MastermindStrategyEditorial.css` bên trong nó (line 3). Bạn **không cần** import lại CSS ở component cha. Chỉ cần import component là đủ.

---

## 8. Checklist cho AI khi tạo trang có Brand Vault tab

- [ ] Header có đủ 3 phần: Tab Switcher + History button + Primary CTA
- [ ] Tab "Brand Vault" có icon `<Diamond />` với màu amber khi Pro Max, stone khi free
- [ ] Khi `activeTab === 'vault' && !isPromax` → render `<BrandVaultUpsellCard />`
- [ ] Khi `activeTab === 'vault' && isPromax` → render `<BrandSelector />` trong form + điền auto từ `currentBrand`
- [ ] `BrandVaultUpsellCard` props: `title` (optional), `description` (required), `benefits[]` (required)
- [ ] Content của `benefits[]` phải mô tả lợi ích cụ thể của **tính năng hiện tại** khi kết hợp với Brand Vault
