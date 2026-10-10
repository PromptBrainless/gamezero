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

## Open-PR triage snapshot (2026-10-10)

Dispositions below were taken against `main` at the audit date. Open branches change independently; re-verify PR files and validation before merging. Decisions, not merges — the owner performs merges.

| PR | Contribution | Disposition | Order |
|---:|---|---|---|
| #26 | `.github/copilot-instructions.md`, `AGENTS.project.md`, vision manifest / target architecture / director pitch, local READMEs for `data/`, `godot/`, `scripts/`, handoff convention, docs regression tests | **Adopt first.** Instruction/authority layer only; no runtime claims. Becomes the agent instruction owner. No separate `AGENT_START_PROMPT.md` or similar is to be created afterwards. | 1 |
| #22 | Typed `Battle.events` stream in `src/game/slice/combat.ts` + tests, `combat-architecture.md` "Current slice event contract", `docs/operations/*.txt` mission prompt, PR-audit rows | **Adopt the combat-event code and `combat-architecture.md` section** as the browser reference event contract (executable, tested, no behaviour change). **Exclude** `docs/operations/gamezero-aggressive-status-and-make-runnable.txt` and its `docs/README.md` "Operations" index entry — agent instructions are owned by #26's `.github/copilot-instructions.md`; a one-off mission prompt is not a repository subject. **Supersede** its `pr-integration-review.md` rows for #18–#21 (they were taken when those branches had no files) with this table. Rebase after #26. | 2 |
| #20 | v1 skill/effect model (Zod schemas, `docs/combat/`, `docs/final-data-entities/`, `data/contracts/v1/` examples) and a second combat-event contract | **Defer.** Competes with the #22 event union, which is the executable reference. Allowed only as post-slice staging via the `docs/final-data-entities/README.md` promotion path, rebased on #22's union and not introducing a second event envelope or a second content catalog under `data/contracts/`. | 4 |
| #18 (+ #23 merge-fix, same stack) | Versioned runtime supplement, `data:check` / `data:export:godot`, Godot registry/bootstrap, six workstream packages | **Defer.** Conflicts with `AGENTS.md`/`README.md`/`runtime-data-plan.md`: supplement contract, version, consumers and failure behaviour must be approved by WS01/WS02 in `runtime-data-plan.md` before `data/runtime/*` or export scripts exist. #23 inherits this disposition; it only resolves #18's merge conflicts. Its workstream packages duplicate `docs/workstreams/README.md` and are not adopted. | 3 (decision only), merge blocked |
| #19 | "[WIP] complete Godot-first vertical slice": export pack, Godot combat, HUD, rewards, progression | **Exclude until re-submitted.** Claims a complete native slice with no recorded native evidence; depends on an export pipeline (#18) that is not approved. Must be rebased on post-#26 `main`, split per workstream (WS01/WS02/WS03/WS04/WS06), and report blocked/unverified native gates per the handoff convention. | 5 |

### Integration order (open PRs)

1. Merge #26.
2. Rebase #22 on `main`; drop `docs/operations/` and the Operations index row; keep code, tests, and the `combat-architecture.md` section; merge.
3. Decide the runtime-supplement contract in `runtime-data-plan.md` (WS01/WS02) before reopening #18/#23.
4. Re-scope #20 as post-slice staging on top of the #22 event union.
5. #19 only as split, evidence-backed workstream increments.

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
- A standalone mission/start prompt file is not a repository subject; agent guidance lives in `.github/copilot-instructions.md` (PR #26).
- Two combat-event contracts are not permitted; the `src/game/slice/combat.ts` event union (PR #22) is the reference until a reviewed successor replaces it in `combat-architecture.md`.
- No `data/runtime/*`, `data/contracts/*`, or export scripts are adopted before their contract is approved in `runtime-data-plan.md`.
