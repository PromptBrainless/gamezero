# Docs

Canonical entry point for the documentation of the first playable vertical slice (Career Select → Encounter Preview → Combat → Reward → Progression). Each topic has exactly one source of truth; see `repo-consolidation-plan.md` for the rationale and which sources were replaced.

## Core docs (first playable slice)

| Doc | Owns |
|---|---|
| [`milestones.md`](milestones.md) | Milestone definitions: Docs Final, First Playable Build, Post-Slice Expansion |
| [`implementation-board.md`](implementation-board.md) | Work tracks, priorities, order and dependencies |
| [`vertical-slice-implementation-plan.md`](vertical-slice-implementation-plan.md) | Slice goal, tracks, sequence, scope and done criteria |
| [`runtime-data-plan.md`](runtime-data-plan.md) | Track 1: loader, validator, registry, `EncounterResolver` |
| [`first-playable-ui-plan.md`](first-playable-ui-plan.md) | Tracks 2 and 3: HUD foundation and screen flow |
| [`data-schema.md`](data-schema.md) | JSON content shape under `data/`, required/optional fields, references, validation |
| [`data-authoring-rules.md`](data-authoring-rules.md) | How content is written and reviewed |
| [`ui-style-guide.md`](ui-style-guide.md) | How numbers and states are shown |
| [`hud-spec.md`](hud-spec.md) | Combat HUD modules, states, tooltips |

## Supporting docs

| Doc | Owns |
|---|---|
| [`visual-reference-brief.md`](visual-reference-brief.md) | Art direction and generation prompt rules |
| [`repo-consolidation-plan.md`](repo-consolidation-plan.md) | Target file set, sources, replacements |

## Optional high-level docs (not slice blockers)

`vision.md`, `combat-design.md`, `system-scaling.md`, `implementation-roadmap.md` — selectively taken from PR #4 after being aligned with the core docs. If they conflict with a core doc, the core doc wins.

## Reading order

1. `milestones.md` — what "done" means
2. `implementation-board.md` — what is worked on, in which order
3. `vertical-slice-implementation-plan.md` — how the slice is executed
4. `runtime-data-plan.md`, then `data-schema.md` and `data-authoring-rules.md` — data
5. `first-playable-ui-plan.md`, `hud-spec.md`, `ui-style-guide.md` — UI
6. `visual-reference-brief.md` — art
7. Optional high-level docs

## Not in this index

Draft or superseded material (PR #2, #3, #6 content, early `.tres`/`godot/data/` notes). Slice content is JSON under `data/`, not under `godot/`.
