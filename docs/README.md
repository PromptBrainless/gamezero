# GameZero Documentation

Canonical entry point for the first playable vertical slice. Each subject has one source of truth; [`repo-consolidation-plan.md`](repo-consolidation-plan.md) explains the selected baseline and [`pr-integration-review.md`](pr-integration-review.md) records how the PR strands were reviewed.

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

## Reading order

1. `milestones.md` and `implementation-board.md`
2. `vertical-slice-implementation-plan.md`
3. `data-schema.md`, `data-authoring-rules.md`, and `runtime-data-plan.md`
4. `first-playable-ui-plan.md`, `hud-spec.md`, and `ui-style-guide.md`
5. `visual-reference-brief.md` and Sprint 1 art documents
6. Vision, architecture, history, and integration review as supporting context

Optional high-level drafts, alternate datasets, and unapproved mechanics are not canonical. If a supporting document conflicts with the schema or slice plan, the schema and plan win.
