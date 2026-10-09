# PR Integration Review

This review assembles the useful, compatible work from the first planning PR series into the current first-playable branch. “Reviewed” does not mean every proposed file or mechanic is accepted. The canonical first-slice schema in [`data-schema.md`](data-schema.md) and scope in [`vertical-slice-implementation-plan.md`](vertical-slice-implementation-plan.md) take precedence over competing drafts.

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

## Integration order

1. Keep the merged PR #13 schema/docs baseline and PR #12 player-content IDs.
2. Normalize player content and add compatible PR #5 encounter-side content.
3. Add schema-aligned authoring, runtime, UI, milestone, and board documents from PRs #7–#10.
4. Preserve useful PR #1–#4 direction only where it does not create another source of truth or unapproved gameplay.
5. Retain PR #15 art planning and update the project index/history to describe the unified source of truth.
6. Re-run data reference and documentation link checks before the combined PR is considered ready.

## Explicitly deferred or excluded

- The complete Godot stub scaffold from PR #1 is not part of this integration until its code is reviewed and runnable.
- PR #2–#4 expanded mechanics, large rosters, regions, and numeric balance proposals are not first-playable commitments.
- PR #6's competing content is not mixed into the PR #5 content baseline.
- PR #11 contained no encounter implementation to merge.
