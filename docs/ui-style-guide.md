# UI Style Guide

The combat UI is tactical, readable, and explicit. Values and state labels are primary information; decorative bars and color are supporting cues.

## Principles

1. **Numbers open:** show exact values wherever the first-slice data provides them. Bars supplement numbers, never replace them.
2. **State is explicit:** status icons use a shape plus a readable label; show duration/stack details only when supplied by runtime data.
3. **No surprise:** show an action's available cost and target before confirmation. Do not display calculations or chances that the schema/runtime does not provide.
4. **Color is redundant:** pair accent colors with shape, label, position, or pattern.
5. **Responsive density:** organize dense information into clear modules and preserve touch targets on mobile.

## Visual tokens

Use the token starting point in the [Sprint 1 production pack](art-sprint-1-production-pack.md): dark charcoal-green surfaces, warm ivory text, muted sage secondary text, burnt-orange attack/danger, steel-blue defense, olive movement, and soft-gold focus. The final palette is checked for contrast against each actual state.

- Use a consistent spacing scale and border treatment.
- Use tabular numerals for changing values.
- Body text should meet WCAG AA contrast (4.5:1 for normal text).
- Do not make side, action, target, status, or availability identifiable by color alone.

## Components and interaction

- **Panels:** consistent border, surface, padding, and hierarchy; ornament must not compete with values.
- **Meters:** include a numeric value; use fill/ticks to support at-a-glance reading.
- **Status chips:** icon silhouette, short name, and an explanation accessible by focus/tap.
- **Buttons:** mobile touch targets are at least 48 dp; unavailable actions give a visible reason.
- **Tooltips:** available by focus and tap/long-press, not hover alone. Keep the action and target visible when possible.
- **Motion:** use brief feedback for a state change, respect reduced motion, and do not let an animation imply an unmodeled mechanic.
