# Editorial Minimalism Design Guidelines

This document defines the visual standards and implementation rules for the **Editorial Minimalism** design system used across the Mastermind Strategy and IMC Planner tools. These guidelines ensure a consistent, premium, and publication-ready experience.

## Global Tokens

### Typography
- **Serif (Display/Headlines)**: `'Prata', serif` (e.g., `Strategic Mastermind Pro`, Main Titles).
- **Sans (Body/Forms)**: `'DM Sans', system-ui, sans-serif`.
- **Font Sizes**:
    - **Eyebrow/Label**: 9px - 10px (Uppercase, 0.22em tracking).
    - **Form Section Title**: 16px (Medium).
    - **Card Title**: 26px - 32px (Serif).
    - **Body Copy**: 13px - 15px (Line-height 1.5 - 1.7).
    - **Meta Info**: 11px.

### Color Palette
- **Ink (Text/Rule)**:
    - `Ink 1 (#1d1d1b)`: Primary black/ink.
    - `Ink 2 (#333330)`: Balanced body text.
    - `Ink 3 (#7a7a75)`: Subtle insights and descriptions.
    - `Ink 4 (#b5b5ad)`: Placeholder, labels, and decorative rules.
- **Paper (Backgrounds)**:
    - `Paper 1 (#faf9f6)`: The core "off-white" paper tone.
    - `Rule Color`: `rgba(26,25,22,0.10)`.
- **App Master Background**: `#FCFDFC`.

### Elevation & Borders
- **Card Border**: `1px solid rgba(26, 25, 22, 0.06)` or `stone-200/90`.
- **Card Radius**: `24px` for large container cards, `16px` for small list items.
- **Card Shadow**: `0 4px 10px rgba(0,0,0,0.02), 0 32px 64px -16px rgba(0,0,0,0.08)`.

---

## Component Standards

### 1. The Input Form Layout
- **Header**: Use `FeatureHeader` with:
    - Icon (Lucide, 20px-24px).
    - Eyebrow (10px, uppercase).
    - Subline (Descriptive, Ink-3 color).
- **Field Groups**: Wrapped in `.ms-editorial-wrapper` (transparent background).
- **Input Fields**:
    - Textareas for strategic content (`min-h-[4rem]` or matching height).
    - Borderless or very subtle border (stone-200) focused on typography.
    - Title size for Brand ID label: 10px.
    - Title size for Phase/Logic label: 16px.

### 2. The History Page (Grid)
- **View Mode**: Full-page state (`viewMode === 'history'`), not a modal.
- **Layout**: Grid system `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` with `gap-4`.
- **Card Content**:
    - Title (Line-clamp 1, font-medium text-stone-900).
    - Source Badge (Brand Vault vs Manual, 10px uppercase).
    - Date Meta (11px, with `Calendar` icon).
    - Actions (Trash icon, rose-50 hover state).

### 3. The Brand Vault "Upgrade" Card
- **Layout**: `display: grid; grid-template-columns: 1.15fr 0.85fr`.
- **Container**: `ms-vault-card` with `24px` radius and white background.
- **Left Side (Content)**:
    - Padding: `2.5rem 3rem`.
    - Gap between elements: `1.125rem`.
    - Benefit List Gap: `0.5rem`.
    - Benefit Icon: `22px x 22px`, `5px` radius.
- **Right Side (Visuals)**:
    - Background: `var(--ms-paper)` or `#faf9f6`.
    - Elements: Animated DNA bars, Dash-ring spinning lock circle.
    - Lock Icon Size: `32px`, `1.5` stroke width.

---

## Implementation Rules
- **Consistency**: Any new strategic model must use the `FeatureHeader` and the `viewMode` toggle logic.
- **Icon Set**: Always use `lucide-react`. Standard icons: `Diamond` for Vault, `Pencil` for Manual, `History` for history, `Trash2` for delete.
- **Buttons**:
    - **Primary**: `bg-stone-950`, `text-white`, `rounded-2xl`, `py-2.5 px-6`.
    - **Header Actions**: `size-10`, `rounded-2xl`, `border-stone-200`.

---

## Navigation & Controls

### The "Back" (Quay lại) Button
- **Visibility**: The Back button must be **hidden** during the first step (Step 1) of any wizard or creation flow to maintain a clean entry point.
- **Visual Style**:
    - **Shape**: `rounded-full` (Pill-shape).
    - **Border**: `1px solid var(--ms-rule)` or `stone-200`.
    - **Background**: `bg-white` or `transparent`.
    - **Text**: `text-stone-600` or `text-stone-700`, `font-medium`, `text-sm`.
    - **Padding**: `px-8 py-2.5` (IMC) or `px-8 h-10` (Mastermind).
    - **Effects**: `transition-all`, `hover:bg-stone-50`, `shadow-sm`.

### The "Next" (Kế tiếp) Button
- **Shape**: `rounded-full`.
- **Background**: `bg-stone-950` (Primary Ink).
- **Text**: `text-white`, `font-medium`.
- **Padding**: `px-8` to `px-10`, `h-10`.

---
*Created: 2026-04-03*
*Based on: Mastermind Strategy & IMC Planner sync*
