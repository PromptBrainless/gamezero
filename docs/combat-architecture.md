# Combat Architecture

This is a structural direction distilled from PRs #1, #3, and #4. It specifies separation of responsibilities, not a complete combat ruleset. Concrete first-slice data fields belong to [`data-schema.md`](data-schema.md); implementation work belongs to the [vertical-slice plan](vertical-slice-implementation-plan.md).

## Resolution and presentation

```text
Chosen action → deterministic resolver → ordered combat events → presentation
```

- Combat state and seeded randomness are independent of scene nodes and UI.
- The resolver is the authority for state changes; animations and HUD presentation do not apply rules.
- The resolver emits an ordered event stream. The log, HUD, animation, and later simulation tools consume that stream.
- Events are stable for a given seed and input sequence; presentation may pause or accelerate them but must not reorder them.
- Build the loader, validator, registry, and encounter resolver as separate runtime responsibilities, as detailed in [`runtime-data-plan.md`](runtime-data-plan.md).

## Event payload direction

An event should identify its sequence, event type, source and target when applicable, turn, and event-specific payload. Candidate events include action selection, hit result, block/dodge/counter, damage, HP change, status application/removal/tick, telegraph, phase change, and defeat. This list is an architecture aid, not a requirement to implement every event in the slice.

## Current slice event contract

`src/game/slice/combat.ts` implements a structured event stream on `Battle.events` for future HUD consumption. Events are appended in resolver order and carry a zero-based `sequence` across the entire battle plus the one-based `turn`. The current variants are `skill_used`, `item_used`, `damage`, `status_applied`, `status_removed`, `turn_skipped`, `phase_changed`, `telegraph`, and `combat_ended`; their TypeScript union is the executable contract. `damage.cause` distinguishes skill and status damage, with the corresponding `skill_id` or `status_id`.

The existing localized `Battle.log` remains for player-facing copy; it is not the machine contract. Event order is authoritative for presentation sequencing, while event payloads identify IDs and resolved values rather than requiring the HUD to infer mechanics from text. Tests cover ordering, cross-turn sequence continuity, immutability of the input battle, and terminal events. This contract is implemented in the browser slice as a rules reference; Godot still needs its own verified consumer before the target runtime can claim event-driven presentation.

## First-slice boundaries

- Use only actions, effects, and values defined by the approved data contract.
- Keep UI as a consumer of resolved state/events rather than a second combat authority.
- Do not adopt unreviewed turn rules, hit formulas, extra resources, or balance targets from the early concept PRs.
- Separate presentation milestones from gameplay implementation; the initial Godot scaffold proposed in PR #1 remains a separate, unverified implementation contribution.
