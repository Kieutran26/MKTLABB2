# Opti Result Design System

This document defines the single design system for all result pages in the product.  
`Opti M.KI Engine` is now the visual source of truth. Older `Editorial Minimalism` styling is deprecated and must only survive as class-level structure, not as an independent visual language.

## Core Principle

All result pages must share:

- One typography system
- One neutral color system
- One border and elevation system
- One section header pattern
- One badge / chip language
- One premium gate pattern

Feature-specific pages may still have different layouts, grids, charts, or content structures.  
They must not introduce a second visual system.

## Token Source Of Truth

Global result tokens live in:

- [components/result-design-system.css](D:\MKTLABB2\components\result-design-system.css)

Key tokens:

- `--rk-ink`: main ink `#1c1917`
- `--rk-paper`: app paper background
- `--rk-surface`: white content surface
- `--rk-surface-soft`: soft badge / chip background
- `--rk-border`: default hairline border
- `--rk-border-strong`: stronger border for emphasis
- `--rk-shadow-sm`, `--rk-shadow-md`, `--rk-shadow-lg`
- `--rk-radius-sm`, `--rk-radius-md`, `--rk-radius-lg`
- `--rk-font-sans`, `--rk-font-display`

## Typography

Use one font family only:

- Display: `Plus Jakarta Sans`
- Body: `Plus Jakarta Sans`

Recommended sizes:

- Eyebrow / meta: `10px`
- Small support copy: `12px`
- Body copy: `13px` to `14px`
- Card title: `16px` to `22px`
- Section title: `14px` to `18px`
- Hero / large summary title: `28px` to `36px`

Typography rules:

- Use tighter tracking only for large headings
- Use uppercase with high letter spacing only for meta labels and badges
- Avoid decorative serif display styles on result pages

## Color System

The result UI is monochrome and must scale from the web base color:

- Base ink: `#1c1917`
- Supporting text: alpha variations of base ink
- Soft backgrounds: warm stone neutrals only
- Borders: alpha variations of base ink

Rules:

- Do not use green, amber, blue, rose, purple as independent semantic themes for result-page chrome
- If a chart needs multiple series colors, keep them inside chart-only scopes
- Section chips, labels, locked states, and cards must stay inside the neutral system

## Surfaces

Standard surfaces:

- App background: `--rk-paper`
- Elevated report surface: `--rk-surface`
- Soft utility surface: `--rk-surface-soft`

Standard radii:

- Large page card: `24px`
- Content card: `18px`
- Chip / mini badge: `12px` to `14px`
- Pill CTA: full radius

## Borders And Shadow

Use subtle, editorial-like structure with modern app polish:

- Default border: `1px solid var(--rk-border)`
- Strong divider: `1px solid var(--rk-border-strong)` when hierarchy truly needs it
- Default card shadow: `var(--rk-shadow-sm)`
- Premium / gated card: `var(--rk-shadow-md)` or `var(--rk-shadow-lg)`

Avoid:

- Heavy dark borders on every nested block
- Multiple competing shadows in one section
- Colored glows on result pages

## Section Pattern

Every result section should follow this structure:

1. Number chip
2. Eyebrow label
3. Section title
4. Top divider
5. Content block

This pattern is now the standard reference taken from `OptimkiSidebarReport`.

## Badge Pattern

Badges and title chips must use:

- Filled dark background
- White text
- Uppercase
- Tight but readable tracking
- Rounded corners

Do not use:

- Pastel semantic badge families per category
- Gold / cream “editorial luxury” badges on result pages

## Pro Gate Pattern

Locked premium content should use:

- Standard section header
- Centered compact card
- Filled dark `PRO MAX` badge with lock icon
- Short supporting copy
- Benefit list with subtle neutral icon tiles
- Dark pill CTA

This is the canonical pattern for premium-gated result insights.

## Migration Rule For Older Result Pages

Legacy result pages may keep their existing DOM/class structure temporarily, but they must map their local variables to the global result tokens.

This means:

- Old local `--ink`, `--paper`, `--accent`, `--serif`, `--sans` variables should alias to `--rk-*`
- Old pages should not define a separate color identity anymore
- Layout can remain custom per feature

## Files Currently Covered By The Unified System

These files now participate in the same result design language:

- [components/OptimkiSidebarReport.tsx](D:\MKTLABB2\components\OptimkiSidebarReport.tsx)
- [components/MastermindStrategyEditorial.css](D:\MKTLABB2\components\MastermindStrategyEditorial.css)
- [components/imc-planner-editorial.css](D:\MKTLABB2\components\imc-planner-editorial.css)
- [components/porter-report-editorial.css](D:\MKTLABB2\components\porter-report-editorial.css)
- [components/pestel-report-editorial.css](D:\MKTLABB2\components\pestel-report-editorial.css)
- [components/ProMaxAdviceGate.css](D:\MKTLABB2\components\ProMaxAdviceGate.css)

## Deprecated System

`Editorial Minimalism` is deprecated as a standalone design system.

What remains allowed:

- Legacy class names
- Legacy layout structure
- Transitional CSS selectors

What is no longer allowed:

- A second palette
- Serif-led result-page typography
- Feature-specific visual systems that conflict with Opti M.KI

## Implementation Notes

- For new result pages: start from `--rk-*` tokens first
- For old result pages: migrate tokens first, then refine layout later
- Do not hardcode colors if an `--rk-*` token already exists
- If a new shared token is needed, add it to `result-design-system.css`

## Unresolved Questions

- None at this time
