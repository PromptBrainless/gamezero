# PR Integration Review

This review assembles the useful, compatible work from the first planning PR series into the current first-playable branch. “Reviewed” does not mean every proposed file or mechanic is accepted. The canonical first-slice schema in [`data-schema.md`](data-schema.md) and scope in [`vertical-slice-implementation-plan.md`](vertical-slice-implementation-plan.md) take precedence over competing drafts.

The open-PR dispositions below are an audit snapshot from 2026-10-10. Recheck PR files and validation before adopting work because open branches can change independently of this document.

| PR | Contribution reviewed | Disposition in the consolidated strand |
|---:|---|---|
| #1 | Godot scaffold, event-driven combat separation, project guide | Keep the action → resolver → event → presentation architecture in [`combat-architecture.md`](combat-architecture.md). Defer the submitted stub project code: resolver and data classes are incomplete/unverified, and its `.tres` direction conflicts with JSON-first slice content. |
| #2 | Mini-GDD, HUD wireframe, large initial content proposal | Preserve the first-playable flow and mobile readability principles in the canonical vision/HUD docs. Do not retain a competing mini-GDD or the unreviewed expanded roster. |
| #3 | Alternate GDD, combat/HUD design, larger content plan, roadmap | Reuse deterministic resolution/event-stream separation and clear tactical presentation. Do not duplicate the canonical plans or adopt the expanded roster and unapproved mechanics. |
| #4 | Vision, combat design, scaling and implementation roadmap | Keep the slice-level vision and architecture principles in [`vision.md`](vision.md) and [`combat-architecture.md`](combat-architecture.md). Defer numerical balance targets, expanded content layers, regions, and the duplicate roadmap. |
| #5 | Concrete JSON schema and connected career/combat/encounter content | Leading content source per the consolidation decision. Adopt the compatible enemies, boss, items, and encounters; normalize content to the merged schema and omit invalid `null` optionals. |
| #6 | Competing larger dataset and data integrity tests | Do not combine its mutually incompatible content with PR #5. Reuse its useful test approach—counts, canonical IDs, references, and placeholder checks—against the selected dataset and schema. |
| #7 | UI style, HUD, visual reference, authoring rules, alternate schema | Adopt the useful number-open, explicit-state, accessible/mobile, authoring, and prompt-quality practices in schema-aligned docs. Its schema field names and speculative careers/regions are superseded. |
| #8 | Runtime, UI/screen-flow, and slice execution plans | Adopt as the execution baseline after correcting record fields, slice content, scope, and dependency references to match the merged schema. |
| #9 | Milestone gates and non-goals | Adopt the three sequential gates: Docs Final, First Playable Build, and Post-Slice Expansion. |
| #10 | Three-track implementation board | Adopt after fixing the missing-document link and aligning priorities/dependencies with the consolidated plans. |
| #11 | Encounter-content task; branch had no content because schema was missing | Its blocker is addressed by the merged schema and PR #5 content integration. The empty PR contributes no files; any later encounter changes must be reviewed against the selected data and schema. |
| #12 | Careers, skills, and statuses | Already merged. Preserve the authored content and normalize its field names and values to the canonical schema. |
| #13 | Docs index, schema, consolidation plan | Already merged. Retain as the canonical docs/schema baseline, with this review adding compatible plans and content. |
| #14 | Project history and execution log | Already merged. Preserve the structured history and update its status/order to reflect the current consolidation. |
| #15 | Sprint 1 HUD and 36-icon art planning | Current branch work. Keep as the bounded art-production pack and link it from the canonical docs index. |
| #16 | Google Drive content importer (open; 25 changed files) | Keep isolated as tooling; do not duplicate its importer in runtime data. Validate its own tests and review before adoption. |
| #17 | Workstreams, Godot runtime boundary, combat contracts, HUD widgets, run context, and art tracking (open; 33 changed files) | Retain the workstream sequence as input, but do not call runtime validation complete: publication depends on injected schema/reference callbacks, and the current tests use accepting callbacks. Verify in Godot and supply real validators before adoption. |
| #18 | Final data structure (open; no changed files at audit time) | No implementation to adopt. |
| #19 | Godot vertical slice (open; no changed files at audit time) | No implementation to adopt. The resolver on `main` remains a stub. |
| #20 | Skill/effect system and combat-event contract (open; no changed files at audit time) | No implementation to adopt. Existing slice combat remains the executable mechanics reference. |
| #21 | Class, encounter, and HUD planning structure (open; no changed files at audit time) | No implementation to adopt. Keep the existing schema and first-playable plans canonical rather than adding a competing data tree. |
| #22 | Repository mission prompt (current branch) | Keep the prompt in `docs/operations/`; this integration review records the active PR audit without treating its drafts as merged work. |

## Integration order

1. Keep the merged PR #13 schema/docs baseline and PR #12 player-content IDs.
2. Normalize player content and add compatible PR #5 encounter-side content.
3. Add schema-aligned authoring, runtime, UI, milestone, and board documents from PRs #7–#10.
4. Preserve useful PR #1–#4 direction only where it does not create another source of truth or unapproved gameplay.
5. Retain PR #15 art planning and update the project index/history to describe the unified source of truth.
6. Treat PR #16 as isolated importer tooling and require its tests/review; do not mix its credentials/configuration workflow into runtime content.
7. Use PR #17 workstream order as supporting context, but require actual schema/reference validation before accepting its runtime boundary.
8. Keep PRs #18–#21 out of the canonical baseline until they contain reviewable changes and are checked against the existing schema and first-playable scope.
9. Re-run data reference and documentation link checks before the combined PR is considered ready.

## Explicitly deferred or excluded

- The complete Godot stub scaffold from PR #1 is not part of this integration until its code is reviewed and runnable.
- PR #2–#4 expanded mechanics, large rosters, regions, and numeric balance proposals are not first-playable commitments.
- PR #6's competing content is not mixed into the PR #5 content baseline.
- PR #11 contained no encounter implementation to merge.
- PR #17's runtime boundary is not a schema or reference validator; accepting callbacks are not evidence that canonical content is valid.
- Open PR plans are not treated as implementation until changes are committed and validated.
