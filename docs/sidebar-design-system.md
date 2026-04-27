# Sidebar Design System — OptiM.KI

> Trích xuất từ `components/Sidebar.tsx` · 2026-04-26

---

## 1. Design Tokens

### 1.1 Colors

| Token | Value | Dùng cho |
|---|---|---|
| `SIDEBAR_BG` | `#FCFDFC` | Nền sidebar, nền footer |
| `NAV_TEXT` | `#4A4A4A` | Text toàn nav (group, item, label) |
| `NAV_TEXT_DIM` | `#4A4A4A99` (60% opacity) | Icon/text inactive collapsed |
| `BORDER_SUBTLE` | `#E8E5E1` | Viền phải sidebar, divider, border-l indent |
| Hover / Active BG | `rgba(0,0,0,0.06)` | `bg-black/[0.06]` |
| App Name | `#2C2C2C` | Text "OptiM.KI" |
| Toggle icon | `#2C2C2C` | PanelLeft icon |
| Badge BG | `#FFE8D6` | Badge "Mới" nền |
| Badge text | `#C45C26` | Badge "Mới" chữ |

---

### 1.2 Typography

| Phần tử | Size | Weight | Đặc điểm |
|---|---|---|---|
| Toàn sidebar font | — | — | `"Plus Jakarta Sans", sans-serif` |
| App Name | `0.875rem` (14px) | `600` | `tracking-tight` |
| Group label | `11px` | `500` | `leading-snug tracking-tight` |
| Nav item label | `11px` | `400` | `leading-snug` |
| Single nav item | `11px` | `500` | `leading-snug truncate` |
| User name | `11px` | `600` | `leading-snug truncate` |
| User email | `10px` | `400` | `opacity-60 leading-snug` |
| Version text | `10px` | `500` | `tracking-wide opacity-45` |
| Badge "Mới" | `9px` | `600` | `tracking-wide` |
| User menu name | `10px` | `500` | `uppercase tracking-wide text-stone-400` |
| User menu email | `12px` | `400` | `text-stone-600` |
| User menu items | `11px` | `400` | — |

---

### 1.3 Sizing & Layout

| | Expanded | Collapsed |
|---|---|---|
| `width` | `17rem` (272px) | `4.75rem` (76px) |
| `height` | `100vh` | `100vh` |
| `position` | `fixed left-0 top-0` | `fixed left-0 top-0` |
| `z-index` aside | `z-40` | `z-40` |
| `z-index` toggle | `z-[100]` | `z-[100]` |

---

### 1.4 Spacing

| Vùng | Value |
|---|---|
| Logo area (expanded) | `px-4 py-5` |
| Logo area (collapsed) | `px-2 py-5`, flex-col, `gap-2` |
| Nav scroll area | `px-2.5 py-3` |
| Group header button | `px-3 py-3` |
| Nav item button | `px-3 py-2.5` |
| Single nav item | `px-3 py-3` |
| Footer user area | `px-3 py-4` |
| Section divider | `my-3 mx-1` |
| Logo divider | `mx-4` |
| Indent container | `mt-0.5 mb-1 ml-4 pl-3` (border-l) |
| Children list gap | `space-y-0.5` |
| Nav group row gap | `space-y-0.5` |

---

## 2. Components

### 2.1 `<aside>` Container

```
position: fixed left-0 top-0  |  z-index: z-40
height: 100vh  |  display: flex flex-col
border-right: 1px solid #E8E5E1
background: #FCFDFC
font-family: "Plus Jakarta Sans", sans-serif
color: #4A4A4A
transition: width 300ms ease-out
```

---

### 2.2 Toggle Button

```
position: fixed  |  z-index: z-[100]
top: 42px  |  transform: translateY(-50%)
left (expanded): calc(17rem - 14px)
left (collapsed): calc(4.75rem - 14px)
size: h-7 w-7 (28×28px)
border-radius: rounded-full
background: white  |  border: 1px solid #E8E5E1
shadow: 0 1px 3px rgba(0,0,0,0.08)
transition: left 300ms ease-out, background-color
```

| State | Style |
|---|---|
| Default | `bg-white` |
| Hover | `hover:bg-stone-50` |
| Focus | `focus-visible:ring-2 focus-visible:ring-black/10` |

Icon: `PanelLeftClose` / `PanelLeftOpen` — `size={16}` `strokeWidth={1.5}` color `#2C2C2C`

---

### 2.3 Logo Area

```
Logo button:
  display: flex items-center  |  gap: 10px  |  py-1
  padding-x: px-1 (expanded) | px-0 (collapsed)
  border-radius: rounded-lg

Icon wrapper: h-9 w-9 (36×36px) flex items-center justify-center shrink-0
  icon: Sparkles  size=22  strokeWidth=1.5  color: #4A4A4A

App name (expanded only):
  font-size: 0.875rem  |  font-weight: 600
  tracking: tight  |  color: #2C2C2C  |  truncate

Divider: border-t 1px solid #E8E5E1  |  mx-4
```

---

### 2.4 NavGroup Header Button (expanded sidebar)

```
width: w-full  |  display: flex items-center  |  gap: 12px
padding: px-3 py-3  |  border-radius: rounded-lg
color: #4A4A4A  |  transition: colors 150ms
```

| State | Background |
|---|---|
| Default | transparent |
| Hover | `rgba(0,0,0,0.06)` |
| Active (child active + group closed) | `rgba(0,0,0,0.06)` |
| Focus | `focus-visible:ring-2 focus-visible:ring-black/10` |

**Elements:**
- Icon wrapper: `h-5 w-5` flex center shrink-0 · icon `size=18 strokeWidth=1.5`
- Label: `text-[11px] font-medium leading-snug tracking-tight flex-1 min-w-0`
- Active dot: `h-1.5 w-1.5` rounded-full opacity-50 color `#4A4A4A` — chỉ hiện khi `hasActive && !expanded`
- Chevron: `ChevronDown/Right` `size=16 strokeWidth=1.5 opacity-45`

**Collapsed sidebar:** Single icon button `h-10 w-10` rounded-lg, icon `size=20`, hover `bg-black/[0.06]`

---

### 2.5 NavGroup Children (Expand Animation)

```
overflow: hidden
transition: max-height 250ms ease-in-out, opacity 250ms ease-in-out
expanded:  max-height: 2000px  |  opacity: 1
collapsed: max-height: 0      |  opacity: 0

margin: mt-0.5 mb-1 ml-4  |  padding-left: pl-3 (12px)
border-left: 1px solid #E8E5E1
list gap: space-y-0.5 (2px)
```

---

### 2.6 NavItem Button

```
width: w-full  |  display: flex items-center  |  gap: 10px
padding: px-3 py-2.5  |  border-radius: rounded-lg
color: #4A4A4A  |  transition: all 150ms
```

| State | Background |
|---|---|
| Default | transparent |
| Hover | `rgba(0,0,0,0.06)` |
| Active | `rgba(0,0,0,0.06)` |
| Focus | `focus-visible:ring-2 focus-visible:ring-black/10` |

**Elements:**
- Icon wrapper: `h-5 w-5` flex center shrink-0 **opacity-80** · icon `size=16 strokeWidth=1.5`
- Label: `text-[11px] font-normal leading-snug flex-1 min-w-0`
- Badge: `BadgeNew` (optional) `shrink-0`

---

### 2.7 Single Nav Items (Utility)

**Expanded:**
```
flex items-center gap-3 (12px)  |  px-3 py-3  |  rounded-lg
icon-wrapper: h-5 w-5 opacity-90  |  icon size=18 strokeWidth=1.5
label: text-[11px] font-medium leading-snug truncate flex-1
hover: bg-black/[0.06]
```

**Collapsed:**
```
wrapper: flex justify-center py-1
button: h-10 w-10 rounded-lg flex center
icon: size=20 strokeWidth=1.5
color: active → #4A4A4A | inactive → #4A4A4A99
hover: bg-black/[0.06]
```

---

### 2.8 BadgeNew

```
element: <span>  |  border-radius: rounded-full
padding: px-1.5 py-px  |  font-size: 9px  |  font-weight: 600
tracking: tracking-wide  |  shrink-0
background: #FFE8D6  |  color: #C45C26
```

---

### 2.9 Footer — User Profile

**Container:** `shrink-0 border-t px-3 py-4 space-y-1 bg-[#FCFDFC]`

**User button (expanded):**
```
flex items-center gap-2.5 (10px)  |  px-2 py-2  |  rounded-lg  |  w-full
hover: bg-black/[0.06]
```

**Avatar (có ảnh):** `h-8 w-8 rounded-full object-cover ring-1 ring-stone-200/70 shrink-0`

**Avatar (initials):** `h-8 w-8 rounded-full bg-stone-200 text-xs font-semibold text-stone-600`

**ChevronUp:** `size=14 strokeWidth=1.5` — rotate-180 khi menu đóng

**Version:** `text-[10px] font-medium tracking-wide opacity-45 text-center pt-1`

---

### 2.10 User Dropdown Menu

```
position: absolute bottom-full left-0 right-0  |  z-index: z-20  |  mb-1
border-radius: rounded-xl  |  border: 1px solid stone-200/90
background: white  |  py-1
shadow: 0 8px 30px rgba(15,23,42,0.08)
```

Header block: `px-3 pb-2 pt-1 mb-1 border-b border-stone-100`

| Menu item | Hover | Color |
|---|---|---|
| Hướng dẫn sử dụng | `hover:bg-stone-50` | `#4A4A4A` |
| Xem Landing Page | `hover:bg-stone-50` | `#4A4A4A` |
| Đăng xuất | `hover:bg-red-50` | `text-red-500` |

Menu item layout: `flex items-center gap-2.5 px-3 py-2 text-[11px] w-full text-left` · icon `size=14 strokeWidth=1.5`

---

## 3. Navigation Structure

| Group | Icon | Số item |
|---|---|---|
| Models & Content | `Brain` | 15 (Opti M.KI *new*, Mastermind, IMC, STP, PESTEL, Porter, Strategic, Insight, Journey, BrandVault, Persona, Rival, Positioning, Pricing, Emotion) |
| Idea Strategy AI | `Lightbulb` | 8 (Hook, Viết Content, Mindmap, SCAMPER, Calendar, AutoBrief, SOP, Creative) |
| Design & Visuals | `ImageIcon` | 6 (Email, Frame, Mockup, KV tạo, KV list, ChainLink) |
| Ads & Performance | `TrendingUp` | 5 (Budget, UTM, A/B, ROAS, AdsHealth) |
| Quản lý Plan | `CreditCard` | 2 (Lịch TT, Danh sách Plans) |
| Utility (single) | — | 4 (To-Do, News, Knowledge, Toolkit) |

---

## 4. Transitions

| Phần tử | Property | Duration | Easing |
|---|---|---|---|
| Sidebar width | `width` | `300ms` | `ease-out` |
| Toggle `left` | `left` | `300ms` | `ease-out` |
| NavGroup expand | `max-height`, `opacity` | `250ms` | `ease-in-out` |
| Nav item hover | bg-color | `150ms` | default |
| Main `margin-left` | `ml` | `300ms` | default |

---

## 5. Icon Spec (Lucide React)

| Vị trí | size | strokeWidth |
|---|---|---|
| Group icon (expanded) | `18` | `1.5` |
| Group icon (collapsed) | `20` | `1.5` |
| Nav item icon | `16` | `1.5` |
| Single nav (expanded) | `18` | `1.5` |
| Single nav (collapsed) | `20` | `1.5` |
| Logo (Sparkles) | `22` | `1.5` |
| Toggle button | `16` | `1.5` |
| Chevron group | `16` | `1.5` |
| Active dot | `h-1.5 w-1.5` (6px) | — |
| User menu icons | `14` | `1.5` |
| ChevronUp user | `14` | `1.5` |

---

## 6. Visibility Rules

Sidebar ẩn khi: `currentView === 'LEARN_SESSION'` | `'LANDING_INTRO'` | `'LOGIN'`

Main offset: expanded → `ml-[17rem]` | collapsed → `ml-[4.75rem]` | fullscreen → `ml-0`
