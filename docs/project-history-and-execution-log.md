# Project History and Execution Log

A curated record of the consolidation decisions and the staged execution plan for the first playable slice. It is a project record, not a chat transcript.

> **Status note:** The canonical docs and content listed below are the *target* structure. Files are authoritative only once the PR that introduces them has merged. Until then, treat this file as the plan.

## 1. Project context and current goal

Gamezero is working toward a **first playable slice**: a small, complete, data-driven combat loop.

- Flow: Career Select → Encounter Preview → Combat → Reward → Progression
- Content target: 3 careers, 8–9 skills, a core status package, 3 enemies, optionally 1 boss, 1–4 encounters, and items/rewards that are fully cross-referenced
- Foundation: Godot project under `godot/`, JSON content under `data/`

Everything outside that slice (extra careers, regions, bosses, save/load, overworld, shop, inventory screen, audio, final art pipeline, balancing expansion) is out of scope until the slice is playable.

## 2. Central consolidation decision

**Decision:** collapse the competing PR strands into one canonical docs set and one JSON-first content tree, then build runtime/UI on top of it.

**Rationale:**
- Several PR strands introduced overlapping docs and different field names for the same concepts.
- Runtime, HUD and screen-flow work needs a stable data contract. Building against a moving schema would force rework.
- Merge order matters more than parallel breadth.

## 3. Keep / keep selectively / drop

| Decision | What | Why |
|---|---|---|
| **Keep** | JSON-first content under `data/`; one schema doc; one docs index; the vertical-slice, runtime-data, HUD and milestone plans | They match the slice direction and form the single source of truth |
| **Keep selectively** | Overlapping schema drafts, older doc variants, and content from earlier PR strands (e.g. the earlier schema/content PRs #8 and #10) | Reuse only what is consistent with the canonical schema; adapt names and shapes rather than importing them wholesale |
| **Drop** | Parallel schema conventions, duplicate docs, `null` for optional fields, content beyond slice scope | They reopen competing sources of truth or expand scope |

## 4. Canonical documentation and content structure

**Docs (`docs/`)**
- `README.md` – canonical index
- `data-schema.md` – schema for slice JSON
- `data-authoring-rules.md` – authoring conventions
- `runtime-data-plan.md` – loading/validation/registry plan
- `first-playable-ui-plan.md` – screens and HUD plan
- `vertical-slice-implementation-plan.md`
- `milestones.md`
- `implementation-board.md`
- `repo-consolidation-plan.md` – what replaces what
- `project-history-and-execution-log.md` – this file

**Content:** `data/` (JSON-first, by content type: careers, skills, statuses, enemies, bosses, items, encounters, rewards)

**Foundation:** `godot/`

## 5. Schema ground rules

- JSON under `data/` is canonical; `docs/data-schema.md` describes the real files.
- IDs are stable `snake_case`.
- Chances use the range `0.0–1.0`.
- Optional fields are omitted, never `null`.
- Bosses are their own content type.
- Unknown fields are treated as developer-facing errors.
- All references (career → skills, skill → status, enemy/boss → skills, encounter → enemy/boss, encounter → rewards, item/reward → status/use) must resolve.

## 6. Current agent workstreams

1. **Core player content** – careers, skills, statuses.
2. **Encounter content** – enemies, optional boss, items, encounters, rewards.
3. **Schema & docs consolidation** – `docs/README.md`, `docs/data-schema.md`, `docs/repo-consolidation-plan.md`, terminology fixes.

## 7. Review and merge order

1. **Schema & docs consolidation (PR #13)** – defines vocabulary and source of truth.
2. **Core player content (PR #12)** – checked against the merged schema.
3. **Encounter content (PR #11)** – last; it was blocked by the missing schema on its base branch, so it must be updated against the merged baseline first.

Per-PR checks:
- Scope respected, no gameplay/runtime expansion.
- Field names match `docs/data-schema.md`; IDs are `snake_case`; no `null` optionals.
- References resolve; no new parallel standard.
- PR description lists assumptions and open points.

Outcome: merge if clean; request small follow-up for 1–3 inconsistencies; hold if it introduces a parallel standard or scope creep. WIP PRs are not merged until marked ready.

## 8. Next phase after content merges

Run only after all three PRs are merged, in this order:

1. **Data runtime foundation** – load, validate (parse errors, missing fields, shape, unresolved references, duplicate ids), register by type and id, expose a `DataRuntime` facade, and an encounter resolver. UI and gameplay do not read raw JSON.
2. **Combat HUD foundation** – HUD layout, player/enemy state, action → target → preview flow, tooltips for skill/status/item, compact log strip, driven by runtime data.
3. **First playable screen flow** – Career Select, Encounter Preview, Reward, Progression, with a minimal run-state handoff to and from combat.

Not in these PRs: the full combat resolver, save/load, overworld, shop, inventory management.

## 9. Unresolved tensions and risks

- Content PRs may still carry old field names or `null` optionals.
- Earlier strands (#8, #10) may overlap with the consolidated schema; resolve case by case.
- `data-authoring-rules.md` may need updating after the schema PR.
- `implementation-board.md` and `milestones.md` can drift from the actual repo state.
- Combat HUD "numbers-open" and mobile requirements depend on the final resource model.
- Pressure to widen scope before the slice is playable.

## 10. Source of truth

| Topic | Canonical file |
|---|---|
| Docs entry point | `docs/README.md` |
| JSON shapes and fields | `docs/data-schema.md` |
| Authoring conventions | `docs/data-authoring-rules.md` |
| What replaces what | `docs/repo-consolidation-plan.md` |
| Loading/validation/registry | `docs/runtime-data-plan.md` |
| Screens and HUD | `docs/first-playable-ui-plan.md` |
| Slice build plan | `docs/vertical-slice-implementation-plan.md` |
| Milestones and status | `docs/milestones.md`, `docs/implementation-board.md` |
| Content | `data/` |
| Engine foundation | `godot/` |
| History and execution order | this file |

## 11. Completion definition for consolidation

Consolidation is complete when:

- The docs/schema, core player content and encounter content PRs are merged in the order above.
- `docs/README.md` is the single docs entry point and its links resolve.
- `docs/data-schema.md` matches the actual JSON under `data/`.
- All cross-references listed in section 5 resolve with no `null` optionals or unknown fields.
- `docs/data-authoring-rules.md` and `docs/implementation-board.md` match the repo state.
- Leftover inconsistencies are fixed in a single cleanup PR.
- Only then does the data runtime work begin.
