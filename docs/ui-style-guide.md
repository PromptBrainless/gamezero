# UI Style Guide

Direction: **tactical, nerdy, explicit numbers.** The player is trusted to read math. Nothing meaningful is hidden behind vague bars or icons alone.

## Principles
1. **Numbers open.** Every resource, damage value, chance, duration and modifier is shown as a number. Bars supplement numbers; they never replace them.
2. **State is explicit.** Every status shows icon, short name and remaining duration (`poison 3`).
3. **No surprise.** Any action's cost, target, expected damage range and hit chance are visible before confirming.
4. **Density with order.** Dense layouts are fine if aligned to the grid and grouped by module (see `hud-spec.md`).

## Tokens
- Spacing grid: 4 px base; paddings are multiples of 4.
- Type: monospace for all numbers and ids (tabular figures); a condensed sans for labels. Minimum 12 px desktop, 14 px mobile.
- Color roles: `bg` near-black, `panel` dark slate, `text` off-white, `muted` grey, `accent` amber (selection/focus), `danger` red (damage, lethal), `good` green (heal, buffs), `warn` yellow (debuffs, low resource), `arcane` violet (magic/corruption).
- Color is never the only signal: pair with icon or text.
- Contrast: body text at least 4.5:1.

## Components
- **Panel:** 1 px border, 4 px radius, no shadows or gradients.
- **Bar:** numeric `current/max` right-aligned inside; fill animates ≤150 ms; damage preview shown as a darker ghost segment.
- **Status chip:** icon + name + duration; buffs green border, debuffs yellow, control red.
- **Button:** min height 40 px desktop, 48 px mobile; disabled buttons state the reason in text.
- **Tooltip:** see rules below.

## Tooltip rules
- Desktop: opens on hover or focus after 150 ms; mobile: on long press (400 ms) or via an info button; dismissed by tapping elsewhere.
- Structure, fixed order: name, one-line effect, numeric breakdown (`base 12 + 20% of power 30 = 18`), modifiers, status interactions.
- Max width 320 px; never covers the acting unit or its target.
- Rules text uses the exact status/skill ids' display names from data files.

## Motion and feedback
Floating combat numbers (crit larger, heal green) last 800 ms; no screen shake above 4 px; respect reduced-motion.

## Mobile constraints
Portrait 360×640 minimum. Touch targets ≥48 px with 8 px spacing. Skill bar is bottom-anchored and thumb-reachable; combat log collapses into a drawer. No hover-only information.
