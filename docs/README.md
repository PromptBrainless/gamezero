# GameZero Documentation

Canonical entry point for the first playable vertical slice. Each subject has one source of truth; [`repo-consolidation-plan.md`](repo-consolidation-plan.md) explains the selected baseline and [`pr-integration-review.md`](pr-integration-review.md) records how the PR strands were reviewed.

## Actionable execution backlog

[`workstreams/README.md`](workstreams/README.md) consolidates the canonical plans into six implementation briefs with dependencies, sequencing, acceptance criteria, complete source coverage, and recorded agent dispatches. These briefs route execution; the canonical documents below remain authoritative for scope and contracts.

## Authority and orientation

- Long-term intent: [`vision-manifest.md`](vision-manifest.md). [`vision.md`](vision.md) retains the first-playable promise.
- Technical direction: [`target-architecture.md`](target-architecture.md) maps layers; [`combat-architecture.md`](combat-architecture.md) owns resolver/event separation.
- Creative direction: [`game-director-pitch.md`](game-director-pitch.md), not a source of new mechanics or balance values.
- Content contract: [`data-schema.md`](data-schema.md) plus canonical `../data/`; authoring practice: [`data-authoring-rules.md`](data-authoring-rules.md).
- Runtime loading and proposed supplement: [`runtime-data-plan.md`](runtime-data-plan.md); readiness/export flow: [`content-pipeline.md`](content-pipeline.md).
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
| Proposed execution metadata | Contract/version proposal in `runtime-data-plan.md`; future `data/runtime/slice.json` only after schema/consumer/validator approval |
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

## Data and combat

| Document | Owns |
|---|---|
| [`data-schema.md`](data-schema.md) | Canonical JSON entities, fields, references, validation |
| [`data-authoring-rules.md`](data-authoring-rules.md) | How content is authored and reviewed |
| [`combat-architecture.md`](combat-architecture.md) | Resolver/event/presentation boundary; no detailed mechanics |

## UI and visual direction

| Document | Owns |
|---|---|
| [`hud-spec.md`](hud-spec.md) | HUD modules and interaction states |
| [`ui-style-guide.md`](ui-style-guide.md) | Readability, values, visual and interaction rules |
| [`visual-reference-brief.md`](visual-reference-brief.md) | Stable visual direction and prompt structure |
| [`art-sprint-1-production-pack.md`](art-sprint-1-production-pack.md) | Sprint 1 HUD kit and exact 36-icon production brief |
| [`art-sprint-1-task-checklist.md`](art-sprint-1-task-checklist.md) | Actionable phases and review gates |
| [`art-sprint-1-prompt-sheet.md`](art-sprint-1-prompt-sheet.md) | Generator-ready HUD and per-icon prompts |

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

1. This authority/output map, then `vision-manifest.md` and `target-architecture.md`
2. `milestones.md`, `implementation-board.md`, and the relevant full workstream brief
3. `vertical-slice-implementation-plan.md`
4. `data-schema.md`, `data-authoring-rules.md`, `runtime-data-plan.md`, and `content-pipeline.md`
5. Relevant combat, UI, or art owner docs and local code/tests
6. History and integration review for prior decisions; verify current evidence before reuse

Optional high-level drafts, alternate datasets, and unapproved mechanics are not canonical. If a supporting document conflicts with the schema or slice plan, the schema and plan win.
