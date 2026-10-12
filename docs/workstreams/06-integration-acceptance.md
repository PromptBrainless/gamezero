# WS06 — Integration, Content Assurance and Acceptance

**Milestone:** Docs Final verification → First Playable Build exit gate · **Priority:** P0 gatekeeper.
**Owner:** integration/QA implementation agent.
**Sources:** [milestones](../milestones.md), [slice acceptance](../vertical-slice-implementation-plan.md), [board review focus/exit](../implementation-board.md), [schema validation](../data-schema.md), [authoring review](../data-authoring-rules.md), [consolidation completion](../project-history-and-execution-log.md), [integration decisions](../pr-integration-review.md), [source replacement rules](../repo-consolidation-plan.md).
**Dependencies:** WS01–WS04 for playable acceptance; WS05 separately for art-sprint completion.

The [2026-10-12 issue sweep](../mobile-first-playable-plan.md#2026-10-12-issue-sweep)
records real headless import/combat/flow evidence, the 3x4 balance matrix,
feedback regression and diagnostic packaged boot. It does not close rendered,
device, clean-export or release-candidate gates; keep the criteria below pending.

## Initial assignment

Prepare native acceptance checks under `godot/tests/` for the canonical seven-collection inventory and documented IDs/order; inspect engine availability and define an honest runnable command/evidence contract. Do not claim a working game from counts or static checks. Do not change boot until other contracts are integrated.

## Complete backlog

- [ ] Verify all canonical links and scope agree; historical PR integration/adoption records remain history, not permission to merge other branches. Record current evidence before claiming consolidation complete.
- [ ] Preserve selected PR #12/player and PR #5/encounter content and stable IDs; PR #6 competing data, PR #2–#4 expanded mechanics/targets and unverified PR #1 stubs are not accepted implementation.
- [ ] Audit exact content counts, nine career-owned skills plus one enemy-only skill, all references, allowed fields, formula-backed values, placeholders/empty-stub rejection, optional omission and chance/range constraints. First-pass balance requires exercise/review, not invented win-rate targets or multiples-of-five restrictions.
- [ ] Inspect scaffold before reuse; integrate only schema-aligned, verified code. WS01 owns runtime code, WS02 rules/events, WS03 widgets, WS04 run context; coordinate boot/UI scene composition after those interfaces are reviewed.
- [ ] Make Godot boot the connected career-to-progression flow with clear startup errors. Exclude save/inventory/rank stubs from the slice rather than pretending they are implemented.
- [ ] Package canonical JSON for Godot exports using a single generated/copied build input, not a competing authored dataset; explicitly include non-resource JSON and verify ID-based loads in exported builds.
- [ ] Exercise loader failure matrix: malformed JSON, duplicate/file-ID mismatch, forbidden fields/nulls/types/ranges, missing references, bad phase/order/affordability. Retain actionable aggregated diagnostics.
- [ ] Verify non-mutating previews, deterministic event order and each adopted optional behavior with WS02; normal and boss encounter resolution with WS01.
- [ ] Play all four encounters with all three career paths; validate action/target/preview/cancel/confirm/locked resolution, rewards/progression and terminal/reset/defeat recovery, no duplicate reward or leaked run state.
- [ ] Inspect native narrow portrait and wide screenshots; test touch/keyboard help, unavailable reasons, ≥48 dp targets, no overflow, numeric visibility, non-color-only states and contrast ≥4.5:1. Record target viewport and device/orientation limitations.
- [ ] Verify a native exported build as well as editor/headless tests; no parent-directory/host-path dependency. Browser prototype passes are reference regression only.
- [ ] Record check command, environment, result, source revision and evidence location. Engine/tool absence and unresolved gameplay/art gates are **blocked/unverified**, never passed.
- [ ] Update milestone/board status only against actual evidence; unmet criteria remain First Playable Build. Separate art approval from playable-foundation completion.
- [ ] Before release, fix only slice blockers, scan changed files, review diffs and preserve the first-playable regression baseline for later expansion.

## Acceptance matrix

| Gate | Required proof |
|---|---|
| Docs Final | Consistent canonical contracts; explicit owner/handling for open decisions; all subjects have concrete briefs |
| Data | Seven collections validated; error matrix tested; all four encounters resolved; no silent field dropping |
| Combat | Approved behaviors exercised; deterministic ordered events; preview does not mutate; terminal results |
| HUD | Real data, interactive preview, useful help, visible values/reasons, mobile/wide and keyboard/touch evidence |
| Flow | Five screens, all encounters, career paths, rewards once, next/finish/retry/reset; repeatable native run |
| Packaging | Canonical JSON included and read by ID in exported Godot build |
| Art sprint | WS05 approvals and complete sources/exports/contact sheets; not satisfied by a manifest |
| Expansion | Separate increment only after playable gate; own acceptance and regression evidence |

Existing commands: `node --test scripts/data-content.test.mjs`, `npm run test:slice`, `npm test`, `npm run typecheck`, `npm run build`. Use only relevant existing checks for modified areas; native checks must state their Godot requirement. Do not make a database or web runtime a prerequisite for the Godot slice.

**Excluded:** expansion implementation, unrelated browser/platform fixes, new testing dependencies, unattended merges of historical PRs, invented balance targets and fabricated native/art acceptance.
