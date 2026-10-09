# Project History and Execution Log

<<<<<<< HEAD
This is a structured record of planning context supplied in the project conversation. It is not a raw transcript or a claim that historical pull requests and agent runs have been independently verified. The current checkout did not contain the referenced `docs/` planning baseline when this log was added; verify repository/GitHub state before relying on the historical PR numbers or agent status.

## 1. Project context

The planning direction in the conversation describes `PromptBrainless/gamezero` as moving from an existing web/JavaScript prototype toward a Godot-based, mobile-first, 2D side-view, turn-based combat RPG. The goal is a **First Playable Vertical Slice**, not a complete game.

Planned first-playable flow:

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

The current repository also contains an `ECHO//BRUCH` combat prototype. Its implementation and terminology should not silently replace the planned first-slice direction or become a new source of truth for future gameplay. Use the canonical slice content and schema when their baseline is restored or established.

## 2. Consolidation decision

The prior planning recommendation was to stop broad parallel expansion and instead:

1. Consolidate competing documentation and data proposals.
2. Establish one source of truth per subject.
3. Review player and encounter content against the consolidated schema.
4. Build the data runtime, combat HUD, and screen flow on that stable foundation.

The intent is controlled integration, not an expansion of the slice or a raw archive of chat messages.

## 3. Historical PR consolidation map

These PR dispositions and numbers come from the supplied conversation and have not been independently checked in this task.

### Keep

- PR #1 — Godot technical foundation.
- PR #8 — slice implementation plan.
- PR #9 — milestones.
- PR #10 — implementation board.
- PR #13 — documentation/schema consolidation.

### Keep selectively

- PR #4 — optional high-level documents.
- PR #5 — leading reference for the actual JSON content shape.
- PR #7 — UI, HUD, visual, and authoring rules.

### Drop / do not treat as canonical

- PR #2.
- PR #3.
- PR #6.

## 4. Intended documentation and content map

The prior proposed documentation structure was:

### Core documents

- `README.md`
- `docs/README.md`
- `docs/repo-consolidation-plan.md`
- `docs/milestones.md`
- `docs/implementation-board.md`
- `docs/vertical-slice-implementation-plan.md`
- `docs/runtime-data-plan.md`
- `docs/first-playable-ui-plan.md`
- `docs/data-schema.md`
- `docs/data-authoring-rules.md`
- `docs/ui-style-guide.md`
- `docs/hud-spec.md`

### Supporting and optional documents

- `docs/visual-reference-brief.md`
- `docs/vision.md`
- `docs/combat-design.md`
- `docs/system-scaling.md`
- `docs/implementation-roadmap.md`

### Content areas

- `data/careers/...`
- `data/skills/...`
- `data/statuses/...`
- `data/items/...`
- `data/enemies/...`
- `data/bosses/...`
- `data/encounters/...`

The Sprint 1 files introduced with this log are additive. They do not supersede the source-of-truth documents above.

## 5. Data and schema principles

The prior conversation established the following intended direction for the first slice:

- Gameplay content is JSON-first under `data/`.
- `.tres` / `godot/data/` is not the primary source for first-slice content.
- Chances use the `0.0–1.0` range.
- Omit optional fields instead of assigning `null`.
- Bosses remain a distinct content type.
- Unknown fields are errors in development.
- `docs/data-schema.md` documents the effective slice data model, not an abstract target.

These are planning decisions to verify against the consolidated schema before content review; this log does not create or alter the schema.

## 6. Prior agent work and status

Three coordinated work streams were described as started in the conversation. Their present status is unknown from this checkout.

### Core player content

Expected area: `data/careers/...`, `data/skills/...`, `data/statuses/...`.

Expected output: three careers, eight to nine skills, a core status set, stable references, and schema-compliant content.

### Encounter content

Expected area: `data/enemies/...`, `data/bosses/...`, `data/items/...`, `data/encounters/...`.

Expected output: three enemies, one boss if the active slice schema supports it, one to four encounters, and consistent reward/item references.

### Schema and docs consolidation

Expected area: `docs/repo-consolidation-plan.md`, `docs/README.md`, `docs/data-schema.md`, and focused consistency fixes.

Expected output: one canonical documentation baseline and a harmonized schema definition.

The earlier request to create this project log also resulted in a cloud-agent task link in the conversation. Its completion or merge state is not confirmed here. Do not treat any of these streams as currently running without checking the task/PR directly.

## 7. Historical PR review and merge ordering

The recommended order for the three described content/consolidation PRs was:

1. **PR #13 — Docs/schema consolidation:** establish the baseline first.
2. **PR #12 — Core player content:** review and merge only after PR #13, once schema conformance, stable IDs, omitted optional fields, and references are checked.
3. **PR #11 — Encounter content:** review last, after updating it to the new baseline and checking encounter, boss, item, and reward references.

PR numbers, state, and branch relationships are historical conversation context, not verified live GitHub status. Re-check them before taking merge action.

## 8. Planned post-content implementation sequence

After the three content/consolidation PRs are reviewed and merged, the prior sequence was:

1. **Data Runtime Foundation** — JSON loader, validator, registry, runtime facade, and encounter resolver.
2. **Combat HUD Foundation** — combat HUD structure, action selection, preview panel, tooltip foundation, and runtime-data connection.
3. **First Playable Screen Flow** — Career Select, Encounter Preview, Reward, Progression, and state handoff/navigation.

Keep implementation agents on non-overlapping surfaces and establish shared data/UI contracts before parallel work.

## 9. Newly established art-planning direction

The later conversation asked for full-text treatment of the prioritized asset list, art direction, and image-generation prompts—not a mini guide. Sprint 1 turns that request into a bounded production plan:

- **Focus:** HUD visual kit and core combat icon set.
- **Planned output:** reusable HUD module/layout references and exactly 36 core combat icons.
- **Icon categories:** actions, combat resources, statuses, reactions, echoes, field markers, and equipment slots.
- **Order:** confirm slice terminology → approve visual foundation and responsive layouts → prototype modules → approve representative icon archetypes → produce and review all 36 → export and hand off.
- **Constraint:** keep the first-playable slice framing; do not add speculative gameplay, classes, enemies, environments, or systems to justify art.
- **Prompting:** use consistent global style guidance and per-asset prompts; treat generated images as drafts that require normalization and review.

The full specification lives in:

- `docs/art-sprint-1-production-pack.md`
- `docs/art-sprint-1-task-checklist.md`
- `docs/art-sprint-1-prompt-sheet.md`

These planning documents do not claim that the art assets have been created or approved.

## 10. Open tensions and review risks

1. **Slice size:** broad earlier proposals may exceed the minimal first playable.
2. **Schema drift:** older documents may disagree on field names, percentages, or types.
3. **PR #5 versus later documentation:** actual content shape must win over abstract descriptions, subject to consolidation review.
4. **Reward model:** inline rewards versus separate reward structures needs one canonical decision.
5. **Optional high-level docs:** useful context is not automatically part of the operational slice.
6. **Prototype versus planned target:** current `ECHO//BRUCH` prototype details should not be mistaken for confirmed Godot first-slice rules.
7. **Art before final schema:** icon labels and module semantics must be checked against the canonical gameplay model before implementation.

## 11. Intended source-of-truth rules

The prior map assigned one leading document per subject:

| Subject | Intended source of truth |
| --- | --- |
| Milestones | `docs/milestones.md` |
| Slice execution | `docs/vertical-slice-implementation-plan.md` |
| Work board | `docs/implementation-board.md` |
| Data schema | `docs/data-schema.md` |
| Content authoring | `docs/data-authoring-rules.md` |
| UI style | `docs/ui-style-guide.md` |
| HUD behavior/specification | `docs/hud-spec.md` |

The checkout at the time this log was created did not contain these files. Treat this table as the intended map from the conversation and establish/verify those documents before treating the map as an active repository invariant.

## 12. Consolidation completion criteria

The earlier consolidation is complete when:

- There is one authoritative source per subject and no unresolved competing versions.
- `docs/README.md` provides a reliable entry point.
- `docs/data-schema.md` describes the real first-slice JSON model.
- Content and schema agree on IDs, references, optional fields, and value ranges.
- Historical PR review/merge ordering has been checked against the actual GitHub state.
- The next implementation block starts from a stable content, UI, and runtime contract.

Sprint 1 art planning is complete only when the separate art checklist's review gates and done criteria are satisfied; writing this history is not itself approval of assets.
=======
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
>>>>>>> origin/main
