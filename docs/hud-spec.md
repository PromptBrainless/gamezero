# Combat HUD Specification

This document defines the first-playable combat HUD modules and interaction states. Visual appearance is owned by [`ui-style-guide.md`](ui-style-guide.md) and the [Sprint 1 art pack](art-sprint-1-production-pack.md). Available gameplay values come from resolved data/events, not UI-authored rules.

## Modules

| Module | Responsibility |
|---|---|
| Phase/round header | Identifies the encounter and the current combat step when available. |
| Player and enemy panels | Identify each combatant and show available body/health, resources, and current effects from the runtime model. |
| Resource meters | Show a numeric value with a supporting meter; never infer unavailable stats. |
| Status/effect rail | Show active status icon and name; expose the status description and duration when supplied. |
| Battlefield/target affordances | Distinguish legal, focused, selected, occupied, and marked targets without relying only on color. |
| Action selector | Present the current available actions from runtime data with selected, focused, unavailable, and pressed states. |
| Preview panel | Show the selected action, target, available costs, and only those outcome values computed by the combat preview/runtime. |
| Event log | Summarize ordered combat events with readable labels and values from the event payload. |
| Tooltip/help layer | Explain skills, statuses, and items from canonical data and computed preview information. |

## Interaction states

```text
Idle → Action selected → Target selected → Preview → Confirmed → Resolving → Idle
```

Unavailable actions remain inspectable and show their reason. Cancel moves back one step. Input that could change a pending action is locked during resolution. A finished encounter moves to its result/Reward flow.

## Numbers and accessibility

- Show exact values that the runtime makes available; do not invent hit chance, damage ranges, initiative, or costs.
- Statuses and target states use text/shape plus color.
- Tooltips are available to keyboard focus and touch as well as pointer hover.
- Mobile layouts meet the minimum viewport and touch-target checks in the UI plan.

## Acceptance

- Each module renders real or runtime-shaped data and has the states it uses.
- The player can select an action and target, inspect the preview, confirm, and understand the resulting events.
- Disabled actions explain why they cannot be used.
- No critical value or instruction exists only in a hover-only tooltip.
