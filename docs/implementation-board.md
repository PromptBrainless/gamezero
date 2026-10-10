# Implementation Board — First Playable Vertical Slice

Compact board for the next work. Three tracks, one shared goal: a connected, testable mini-flow.

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

## Overview

| Order | Track | Priority | Labels |
|---|---|---|---|
| 1 | Data Runtime Foundation | P0 | `area:data`, `type:implementation`, `milestone:first-playable`, `priority:p0`, `foundation`, `vertical-slice` |
| 2 | Combat HUD Foundation | P0 | `area:ui`, `type:implementation`, `milestone:first-playable`, `priority:p0`, `foundation`, `vertical-slice` |
| 3 | First Playable Screen Flow | P1 | `area:flow`, `type:implementation`, `milestone:first-playable`, `priority:p1`, `vertical-slice` |

## Track 1 — Data Runtime Foundation

**Priority:** P0 · **Order:** #1 (start immediately)

**Goal:** Load JSON content from `data/`, register it by type, validate it, and resolve at least one encounter end-to-end.

**Scope**
- Load JSON files from slice-relevant `data/` directories, in a deliberate order
- Registry by content type with lookup by `id`; duplicate-ID detection
- Validation: required fields, basic field types, reference integrity, filename ↔ `id` consistency
- Encounter resolution (enemy/boss, skill/status references)
- Out of scope: editor tooling, hot reload, localization, migrations, schema compilers

**Deliverables**
- Loader + registry
- Validation layer
- Encounter resolver
- Readable content-error output

**Done criteria**
- [ ] All slice JSON files load
- [ ] Duplicate IDs are detected
- [ ] Missing/invalid references are clearly reported
- [ ] At least one encounter resolves fully
- [ ] Combat/UI code can consume the result

**References:** `docs/runtime-data-plan.md`, `docs/data-schema.md`, `docs/data-authoring-rules.md`, `docs/vertical-slice-implementation-plan.md`

## Track 2 — Combat HUD Foundation

**Priority:** P0 · **Order:** #2 (start in parallel; may begin with test data)

**Goal:** A working combat HUD in the target runtime that shows resolved combat values, supports action selection, and exposes preview and tooltips.

**Scope**
- Combat root layout, enemy/boss panel, player status panel, primary action bar
- Preview/context panel, tooltip foundation, basic combat log
- UI states: neutral, action selection, target selection, execution, result
- Visible values and status icons from the canonical schema; boss phase/telegraph where defined
- Out of scope: final art, heavy VFX, full special-case coverage, deep inventory, full boss logic

**Deliverables**
- HUD structure in the target runtime
- Interactive action selection
- Preview panel usable before confirmation
- Tooltips with mechanical content
- Basic combat log

**Done criteria**
- [ ] HUD shows real or runtime-shaped data
- [ ] At least one action can be selected and visibly changes the preview
- [ ] Tooltips are functional and mechanically useful
- [ ] Core values stay visible; state changes are understandable
- [ ] More than a static mockup

**References:** `docs/hud-spec.md`, `docs/ui-style-guide.md`, `docs/first-playable-ui-plan.md`, `docs/vertical-slice-implementation-plan.md`

## Track 3 — First Playable Screen Flow

**Priority:** P1 · **Order:** #3 (prepare in parallel; harden after Tracks 1 + 2)

**Goal:** Connected meta-screens around combat, with real navigation and state handoff.

**Scope**
- Career Select, Encounter Preview, Reward, Progression screens
- Navigation and context handoff (career / encounter / result / progression)
- Out of scope: world map, shop, save/load expansion, large meta systems, deep inventory

**Deliverables**
- Four meta-screens
- Working navigation between them and combat
- State handoff contexts

**Done criteria**
- [ ] A career can be selected
- [ ] An encounter can be started and combat is reached from the flow
- [ ] Reward appears after combat; progression appears after reward
- [ ] The sequence is testable as a real mini-flow

**References:** `docs/first-playable-ui-plan.md`, `docs/vertical-slice-implementation-plan.md`, `docs/milestones.md`

## Working Rules

- No hardcoded content where the runtime data layer can supply it.
- No isolated test screens; every screen must belong to the flow.
- Keep slice scope: nothing from post-slice expansion.
- Each track ships behind its own PR and states which Done criteria it meets.

## Parallelization Model

- **Track 1** starts independently.
- **Track 2** starts with test data, structured for runtime data.
- **Track 3** builds screens early and finalizes integration once Tracks 1 + 2 stand.
- Integration points: encounter context, combat result, progression context.

## Review Focus

- Track 1: error clarity, reference validation, resolver output shape
- Track 2: preview-before-confirm, always-visible core values, tooltip usefulness
- Track 3: real state handoff, working transitions, no dead-end screens

## Exit Condition

The board is complete when the full flow runs end-to-end on real runtime data: a career is selected, an encounter is resolved and started, combat is played with the HUD, reward is shown, and progression closes the flow.

## Native implementation handoff

The current implementation replaces the boot/resolver/HUD placeholders with a
connected Godot flow. These artifacts advance the three tracks without declaring
the entire production slice finished:

| Area | Concrete artifact / gate | Next production task |
|---|---|---|
| Data foundation | Shared source validation, deterministic `runtime_pack.json`, `data:godot:check`, export regression tests | Keep import candidates outside canonical content until validation passes |
| Combat core | Detached seeded resolver, ordered events, native combat regression script | Review balance and decide currently unspecified crit/initiative/resistance rules |
| Runtime / HUD | Main scene, career/preview/combat/reward/progression flow, native flow tests | Side-view actor scenes, animation/event playback, final icon integration |
| RPG content | Existing three careers, normal enemies, boss phases, four ordered encounters consumed by ID | Human playthrough and tuning without inventing progression tracks |
| Production pipeline | Validated content-pack boundary usable by ingestion tooling | Land/review the separate Drive importer and raw-to-reviewed asset workflow |

Parallel ownership is deliberately non-overlapping: data/export owns canonical
validation and packaging; combat owns state transitions and events; presentation
owns input states/navigation and reads resolver output. Schema extensions must
land with consumers and tests, not as speculative catalog additions.

Remaining release gates: review the complete encounter run for all careers,
mobile device/export testing, final side-view presentation, and asset review.
Save/load, shops, overworld and extensive catalogs remain post-slice work.

Native no-growth simulation completes the four encounters for mercenary and
mage with carried consumables. The offensive/item heuristic has not beaten the
boss as duelist across seeds 42–141; that is a tuning/review signal, not proof
that the fight is impossible. Do not mark the all-career balance gate complete
or compensate with undocumented levels/stat bonuses.

The native starting-stat matrix (100 seeds per career/encounter; strongest
affordable attack, recovery and starting healing items) terminates all 1,200
fights. Win counts are a diagnostic, not a release acceptance target:

| Career | First blood | Deserters | Cult | Boss |
|---|---:|---:|---:|---:|
| Duelist | 100 | 100 | 95 | 0 |
| Mercenary | 100 | 100 | 78 | 69 |
| Mage | 100 | 99 | 100 | 30 |
