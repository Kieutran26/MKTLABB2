# Opti Result Design System

This document defines the single design system for all result pages in the product.  
`Opti M.KI Engine` is now the visual source of truth. Older `Editorial Minimalism` styling is deprecated and must only survive as class-level structure, not as an independent visual language.

## Core Principle

All result pages must share:

- One typography system
- One neutral color system
- One border and elevation system
- One sticky result navbar pattern
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
- `--rk-ink-5`: ultra-soft ink for quiet framing
- `--rk-paper`: app paper background
- `--rk-surface`: white content surface
- `--rk-surface-soft`: soft badge / chip background
- `--rk-surface-muted`: muted right-column / utility surface
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

## Result Navbar Pattern

All result pages that render a completed report should share the same sticky report navbar pattern used in `OptimkiSidebarReport`.

Structure:

1. Left meta cluster
2. Report type chip
3. Brand / report title row
4. Inline title edit affordance
5. Date metadata
6. Right action cluster
7. Secondary export action
8. Primary rerender action

Behavior rules:

- Navbar sticks directly below the page header
- Vertical padding must feel optically centered, not top-heavy
- Export actions must stay lightweight and secondary
- Primary rerender action stays as a dark pill CTA
- Inline title editing should support both confirm icon and Enter

Shared classes:

- `.rk-result-toolbar`
- `.rk-result-toolbar__inner`
- `.rk-result-toolbar__meta`
- `.rk-result-toolbar__title`
- `.rk-result-toolbar__name`
- `.rk-result-toolbar__date`
- `.rk-result-toolbar__actions`
- `.rk-result-toolbar__ghost-action`
- `.rk-result-toolbar__primary-action`
- `.rk-result-toolbar__icon-button`
- `.rk-result-toolbar__edit-shell`
- `.rk-result-toolbar__edit-input`

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
- Compact two-column card
- Max width `600px`
- Left content column around `4/7`
- Right lock visual column around `3/7`
- Support copy that may wrap naturally across lines
- Smaller `PRO MAX` badge
- Smaller benefit tiles and CTA than legacy gate cards
- Large but soft lock visual in the right column
- Dark pill CTA anchored in the content column

This is the canonical pattern for premium-gated result insights.

Shared classes:

- `.rk-pro-gate-card`
- `.rk-pro-gate-card--compact`
- `.rk-pro-gate-card__content`
- `.rk-pro-gate-card__eyebrow`
- `.rk-pro-gate-card__title`
- `.rk-pro-gate-card__body`
- `.rk-pro-gate-card__divider`
- `.rk-pro-gate-card__features`
- `.rk-pro-gate-card__feature`
- `.rk-pro-gate-card__feature-icon`
- `.rk-pro-gate-card__feature-copy`
- `.rk-pro-gate-card__cta`
- `.rk-pro-gate-card__visual`
- `.rk-pro-gate-card__lock-ring`
- `.rk-pro-gate-card__lock-bars`

Layout notes:

- Keep the card visually tighter than older upgrade blocks
- On smaller screens the lock column stacks under the content
- The right visual area should remain decorative, not information-dense
- Avoid adding extra badges, pricing text, or multiple CTAs to this card

## Migration Rule For Older Result Pages

Legacy result pages may keep their existing DOM/class structure temporarily, but they must map their local variables to the global result tokens.

This means:

- Old local `--ink`, `--paper`, `--accent`, `--serif`, `--sans` variables should alias to `--rk-*`
- Old pages should not define a separate color identity anymore
- Layout can remain custom per feature

## Files Currently Covered By The Unified System

These files now participate in the same result design language:

- [components/OptimkiSidebarReport.tsx](D:\MKTLABB2\components\OptimkiSidebarReport.tsx)
- [components/result-design-system.css](D:\MKTLABB2\components\result-design-system.css)
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
