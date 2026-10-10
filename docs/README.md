# GameZero Documentation

Canonical entry point for the first playable vertical slice. Each subject has one source of truth; [`repo-consolidation-plan.md`](repo-consolidation-plan.md) explains the selected baseline and [`pr-integration-review.md`](pr-integration-review.md) records how the PR strands were reviewed.

## Actionable execution backlog

[`workstreams/README.md`](workstreams/README.md) consolidates the canonical plans into six implementation briefs with dependencies, sequencing, acceptance criteria, complete source coverage, and recorded agent dispatches. These briefs route execution; the canonical documents below remain authoritative for scope and contracts.

## Vision and target direction

- [Vision Manifest](vision-manifest.md) — mission, product pillars, authoring philosophy, non-goals, and scaling vision.
- [Technical Target Architecture](target-architecture.md) — layers, ownership, runtime/state boundaries, and the target validation/export pipeline.
- [Game Director Pitch](game-director-pitch.md) — emotional player promise, world framing, and creative guardrails.

Read these together for strategic, technical, and creative intent. They extend the
[slice vision](vision.md), not the approved content budget or mechanics. The
supplement validator/export exists separately from the canonical native pack;
schema, reviewed policy, and workstream acceptance evidence still govern integration.
Historical Resource-based pipeline
and scaling drafts are not permission to replace canonical JSON.
## Authority and orientation

- Long-term intent: [`vision-manifest.md`](vision-manifest.md). [`vision.md`](vision.md) retains the first-playable promise.
- Technical direction: [`target-architecture.md`](target-architecture.md) maps layers; [`combat-architecture.md`](combat-architecture.md) owns resolver/event separation.
- Creative direction: [`game-director-pitch.md`](game-director-pitch.md), not a source of new mechanics or balance values.
- Content contract: [`data-schema.md`](data-schema.md) plus canonical `../data/`; authoring practice: [`data-authoring-rules.md`](data-authoring-rules.md).
- Runtime loading: [`runtime-data-plan.md`](runtime-data-plan.md); isolated supplement contract: [`final-runtime-data-design.md`](final-runtime-data-design.md); readiness/export flow: [`content-pipeline.md`](content-pipeline.md).
- Scope/gates: slice plan, milestones, and board below. Execution ownership/blockers: workstream briefs and their [decision queue](workstreams/README.md#decisions-and-blocked-work).

Read the relevant owner before changing a subject. Vision does not override the
approved schema or slice scope; workstream briefs do not create competing contracts.
When sources conflict, document the conflict and update the subject owner with review,
then cross-link affected consumers. Do not copy an alternate ruleset from prototype code.

## Where outputs belong

| Work | Destination and boundary |
|---|---|
| Approved design/architecture docs | Update the owning `docs/*.md` file; index a new subject here only when no owner exists |
| Imported design, lore, references | Importer-mapped `docs/design/`, `docs/lore/`, `docs/quests/`, `docs/world/`, `docs/references/`, `docs/art/concept/`; review inputs until explicitly adopted into an owner |
| Gameplay definitions | `data/<collection>/<id>.json`; see [`../data/README.md`](../data/README.md) |
| Versioned execution metadata | `data/runtime/slice.json` under `final-runtime-data-design.md`; policy/consumer approval before native integration |
| Next-runtime skill/event contracts | `data/contracts/v1/` and `src/game/contracts/`; isolated from canonical slice registries until reviewed migration |
| Raw gameplay/dialogue tables | `data-sources/`; never feed directly to combat or Godot |
| Browser reference rules and tests | `src/game/slice/`; presentation in `src/components/slice/` and route adapters in `src/routes/` |
| Godot runtime, scenes, tests | [`../godot/README.md`](../godot/README.md) maps WS01–WS06 ownership |
| Pipeline/acceptance tooling and tests | [`../scripts/README.md`](../scripts/README.md); importer stays in `tools/import/` |
| Art preparation/evidence | `artifacts/art/sprint-1/` under WS05; approved runtime assets in `godot/assets/` per the art pack |
| Browser QA evidence | `screenshots/`; cross-link retained evidence from the handoff, not from a new status document |
| Decisions and follow-up | Relevant workstream decision queue and dated `project-history-and-execution-log.md` entry; use the [handoff convention](workstreams/orchestration.md#repository-handoff-convention) |

Generated runtime copies/bundles, build outputs, Godot import caches, and raw import
mirrors are never source of truth. Do not commit them as authored data or edit them
to fix content; change the source and regenerate through the reviewed pipeline.
Retain only deliberately selected, non-sensitive evidence, not incidental logs.

## First-playable execution

| Document | Owns |
|---|---|
| [`milestones.md`](milestones.md) | Sequential gates: Docs Final, First Playable Build, Post-Slice Expansion |
| [`implementation-board.md`](implementation-board.md) | Ordered tracks, deliverables, dependencies, review focus |
| [`vertical-slice-implementation-plan.md`](vertical-slice-implementation-plan.md) | Scope, build sequence, slice done criteria |
| [`runtime-data-plan.md`](runtime-data-plan.md) | JSON loading, validation, registries, encounter resolution |
| [`first-playable-ui-plan.md`](first-playable-ui-plan.md) | Combat HUD foundation and screen flow |
| [`workstreams/README.md`](workstreams/README.md) | Six implementation packages, ownership, dependencies and agent assignments |

## Data and combat

| Document | Owns |
|---|---|
| [`data-schema.md`](data-schema.md) | Canonical JSON entities, fields, references, validation |
| [`data-authoring-rules.md`](data-authoring-rules.md) | How content is authored and reviewed |
| [`final-runtime-data-design.md`](final-runtime-data-design.md) | Versioned runtime supplement, concrete progression/targeting/staging/narrative data and Godot export |
| [`first-playable-rules.md`](first-playable-rules.md) | Implemented slice mechanics and historical balance measurements |
| [`combat-architecture.md`](combat-architecture.md) | Resolver/event/presentation boundary; no detailed mechanics |
| [`final-data-entities/skills-and-effects.md`](final-data-entities/skills-and-effects.md) | Canonical v1 target skill/effect model, targeting, costs, timing and migration |
| [`combat/combat-event-contract.md`](combat/combat-event-contract.md) | Canonical v1 commands, resolved action batches, events and Godot integration |

## UI and visual direction

| Document | Owns |
|---|---|
| [`hud-spec.md`](hud-spec.md) | HUD modules and interaction states |
| [`ui-style-guide.md`](ui-style-guide.md) | Readability, values, visual and interaction rules |
| [`visual-reference-brief.md`](visual-reference-brief.md) | Stable visual direction and prompt structure |
| [`art-sprint-1-production-pack.md`](art-sprint-1-production-pack.md) | Sprint 1 HUD kit and exact 36-icon production brief |
| [`art-sprint-1-task-checklist.md`](art-sprint-1-task-checklist.md) | Actionable phases and review gates |
| [`art-sprint-1-prompt-sheet.md`](art-sprint-1-prompt-sheet.md) | Generator-ready HUD and per-icon prompts |

## Post-slice data model planning

Planned next layer; does not change the slice contract above. Staged types and examples live in [`../game/runtime_data/`](../game/runtime_data/README.md).

| Document | Owns |
|---|---|
| [`final-data-entities/README.md`](final-data-entities/README.md) | Staging rules and promotion path into `data-schema.md` |
| [`final-data-entities/classes-and-progression.md`](final-data-entities/classes-and-progression.md) | Classes, progression tracks, run progression state |
| [`final-data-entities/enemies-and-encounters.md`](final-data-entities/enemies-and-encounters.md) | Enemies, bosses, stages, encounters and waves |
| [`ui/hud-combat-event-integration-plan.md`](ui/hud-combat-event-integration-plan.md) | HUD and Reward/Progression consumption of combat and run events |

## Project context

| Document | Owns |
|---|---|
| [`vision.md`](vision.md) | Slice-level game direction and principles |
| [`project-history-and-execution-log.md`](project-history-and-execution-log.md) | Decisions, sequencing, and historical context |
| [`repo-consolidation-plan.md`](repo-consolidation-plan.md) | Baseline choices and source replacement rules |
| [`pr-integration-review.md`](pr-integration-review.md) | Per-PR adoption/defer/exclusion decisions |

## Tooling

| Document | Owns |
|---|---|
| [`../tools/import/README.md`](../tools/import/README.md) | Google Drive importer: setup, dry run, import, mapping rules, manifest, safety |
| [`../imports/drive/README.md`](../imports/drive/README.md) | Import output area (manifest, raw mirror, unsorted review queue) |

## Reading order

For product orientation, start with the three artifacts above. For implementation:

1. This authority/output map, `milestones.md`, `implementation-board.md`, and the relevant full workstream brief
2. `vertical-slice-implementation-plan.md`
3. `data-schema.md`, `data-authoring-rules.md`, `runtime-data-plan.md`, and `content-pipeline.md`
4. `first-playable-ui-plan.md`, `hud-spec.md`, and `ui-style-guide.md`
5. `visual-reference-brief.md` and Sprint 1 art documents
6. Vision, architecture, history, and integration review as supporting context

Optional high-level drafts, alternate datasets, and unapproved mechanics are not canonical. If a supporting document conflicts with the schema or slice plan, the schema and plan win.

The two v1 contract documents above own the next-runtime skill/action boundary.
Their executable schemas and isolated `data/contracts/v1/` examples are approved
design artifacts, not a migration of the existing playable slice. The current
`data/` slice collections remain governed by `data-schema.md`.
