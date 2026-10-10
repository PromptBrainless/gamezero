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

## Dependency-ordered integration (2026-10-10)

The requested integration order supersedes the historical triage below:
**#18 → #23 → #20 → #26**, on the task branch
`copilot/merge-open-prs-into-main`, starting from main commit
`510040e0048668229b21024ab9246e63ab346ea7`.

| PR | Integrated head | Reconciliation |
|---:|---|---|
| #18 | `9e655e6e6a418505351787959ee2769a44249f6c` | Preserve supplement, validator/export and optional registry bridge; keep newer mainline native boot and canonical `runtime_pack.json` consumer. |
| #23 | `37d23b3c8fc4ffc82b17896fc0f75f73e3f1b40d` | Preserve stacked history and coverage additions; retain the current six execution briefs/ledger, with runtime-design packages as supporting material. |
| #20 | `0538b8686ef05cda2b729593c584c6b99285f97c` | Preserve isolated next-runtime schemas/fixtures without replacing browser/native slice events; retain importer tests in the combined test command. |
| #26 | `847635a3ab88131b99adce2404313ed84a3eb645` | Preserve authority/output maps, local guides, instruction routing and handoffs; reconcile implemented tooling with pending native integration. |

Both export paths remain intentional: `data:godot` produces the canonical pack
used by the native slice; `data:export:godot` produces the optional supplement
bundle. Neither generated output is an authored catalog. The next-runtime v1
skill/event fixtures are not loaded by the slice registries; integrating them
requires reviewed migration, not a second competing live event stream.

### Validation and exact blockers

- Passed: `npm run build`, `npm run typecheck`, `npm run test:slice`,
  `npm run data:check`, `npm run data:godot:check`, and all eight documentation checks.
- `npm test`: 293/301 Node tests passed; eight unchanged
  `scripts/grok-pwa-plugin.test.mjs` share-card/title failures remain. The command
  stops before its separate app-data/auth suites; running those separately passed
  all 55 tests. `npm run test:import` also passed all 51 importer tests.
- `npm run lint`: 18 errors and 16 warnings, all in unchanged baseline files.
- `npm run test:godot`: canonical pack check passed, then `sh: 1: godot: not found`
  (exit 127). Native acceptance is unverified, not passed.
- Reading PR check runs for all four heads returned HTTP 403,
  `Resource not accessible by integration`. Required-check and branch-protection
  eligibility cannot be certified by this session.
- Publication is restricted to the task branch. No available tool can merge the
  source PRs, change their bases, or update remote `main`; original PRs remain open.

### Remaining maintainer actions

1. Review the integration diff and obtain required CI/reviews. Resolve or explicitly
   approve baseline test/lint blockers according to repository rules; run native
   checks with Godot 4.4+ before claiming native acceptance.
2. Merge the integration branch into `main` using a **merge commit**, not squash
   or rebase, to retain the four PR heads and dependency-ordered merge history.
3. Verify all four recorded heads are ancestors of `main`. Check the original PR
   states; #23 targets #18's branch, so retarget it to `main` if needed to recognize
   indirect integration, or close it with a link to the integration commit.
   Close any remaining source PR only after verifying its work is incorporated.

## Open-PR triage snapshot (2026-10-10)

Historical snapshot, superseded by the dependency-ordered integration above.

Dispositions below were taken against `main` at the audit date. Open branches change independently; re-verify PR files and validation before merging. Decisions, not merges — the owner performs merges.

| PR | Contribution | Disposition | Order |
|---:|---|---|---|
| #26 | `.github/copilot-instructions.md`, `AGENTS.project.md`, vision manifest / target architecture / director pitch, local READMEs for `data/`, `godot/`, `scripts/`, handoff convention, docs regression tests | **Adopt first.** Instruction/authority layer only; no runtime claims. Becomes the agent instruction owner. No separate `AGENT_START_PROMPT.md` or similar is to be created afterwards. | 1 |
| #22 | Typed `Battle.events` stream in `src/game/slice/combat.ts` + tests, `combat-architecture.md` "Current slice event contract", `docs/operations/*.txt` mission prompt, PR-audit rows | **Adopt the combat-event code and `combat-architecture.md` section** as the browser reference event contract (executable, tested, no behaviour change). **Exclude** `docs/operations/gamezero-aggressive-status-and-make-runnable.txt` and its `docs/README.md` "Operations" index entry — agent instructions are owned by #26's `.github/copilot-instructions.md`; a one-off mission prompt is not a repository subject. **Supersede** its `pr-integration-review.md` rows for #18–#21 (they were taken when those branches had no files) with this table. Rebase after #26. | 2 |
| #20 | v1 skill/effect model (Zod schemas, `docs/combat/`, `docs/final-data-entities/`, `data/contracts/v1/` examples) and a second combat-event contract | **Defer.** Competes with the #22 event union, which is the executable reference. Allowed only as post-slice staging via the `docs/final-data-entities/README.md` promotion path, rebased on #22's union and not introducing a second event envelope or a second content catalog under `data/contracts/`. | 4 |
| #18 (+ #23 merge-fix, same stack) | Versioned runtime supplement, `data:check` / `data:export:godot`, Godot registry/bootstrap, six workstream packages | **Defer.** Conflicts with `AGENTS.md`/`README.md`/`runtime-data-plan.md`: supplement contract, version, consumers and failure behaviour must be approved by WS01/WS02 in `runtime-data-plan.md` before `data/runtime/*` or export scripts exist. #23 inherits this disposition; it only resolves #18's merge conflicts. Its workstream packages duplicate `docs/workstreams/README.md` and are not adopted. | 3 (decision only), merge blocked |
| #19 | "[WIP] complete Godot-first vertical slice": export pack, Godot combat, HUD, rewards, progression | **Exclude until re-submitted.** Claims a complete native slice with no recorded native evidence; depends on an export pipeline (#18) that is not approved. Must be rebased on post-#26 `main`, split per workstream (WS01/WS02/WS03/WS04/WS06), and report blocked/unverified native gates per the handoff convention. | 5 |

### Historical integration order (superseded above)

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

These are historical triage decisions. For #18/#23/#20/#26, the integrated
disposition and isolation boundaries above supersede the earlier exclusions.

- The complete Godot stub scaffold from PR #1 is not part of this integration until its code is reviewed and runnable.
- PR #2–#4 expanded mechanics, large rosters, regions, and numeric balance proposals are not first-playable commitments.
- PR #6's competing content is not mixed into the PR #5 content baseline.
- PR #11 contained no encounter implementation to merge.
- A standalone mission/start prompt file is not a repository subject; agent guidance lives in `.github/copilot-instructions.md` (PR #26).
- Two combat-event contracts are not permitted; the `src/game/slice/combat.ts` event union (PR #22) is the reference until a reviewed successor replaces it in `combat-architecture.md`.
- No `data/runtime/*`, `data/contracts/*`, or export scripts are adopted before their contract is approved in `runtime-data-plan.md`.
