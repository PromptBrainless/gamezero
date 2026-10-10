# Project History and Execution Log

A structured record of the consolidation decisions, staged execution plan, and art-planning direction for GameZero's first playable slice. This is a project record, not a raw chat transcript. Historical PR numbers and agent status are included as supplied planning context; verify live GitHub state before acting on them.

## 1. Project context and current goal

The project is working toward a small, complete, data-driven **First Playable Vertical Slice**:

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

The planning target is a Godot foundation under `godot/` and JSON-first content under `data/`. Keep work focused on this playable loop; defer broader regions, extra careers/bosses, save/load, overworld, shop, inventory management, audio, and large-scale balancing until the slice is playable.

The repository also contains an `ECHO//BRUCH` web/JavaScript combat prototype. Its rules and names are not automatically the source of truth for the planned first slice.

## 2. Consolidation decision and schema principles

The central decision was to stop broad parallel expansion, consolidate overlapping documentation and data proposals, and establish a single source of truth per subject before implementing runtime, HUD, and screen flow.

Intended content/schema rules:

- JSON under `data/` is canonical; `docs/data-schema.md` describes the real slice data.
- IDs are stable `snake_case`; chance values use `0.0–1.0`.
- Optional fields are omitted rather than set to `null`.
- Bosses are a distinct content type.
- Unknown fields are developer-facing errors.
- All content references must resolve, including career/skill/status and encounter/enemy/reward relationships.

These principles must be checked against the actual schema and content files; this log does not create a parallel schema.

## 3. PR consolidation and review ordering

PRs #12, #13, and #14 are on the current `main` baseline. This branch is PR #15. Live review of PRs #1–#11 confirmed that several remain open, with multiple drafts overlapping or contradicting the merged schema. The full per-PR adoption/defer record is [`pr-integration-review.md`](pr-integration-review.md); a PR is not considered useful merely because it is included in the review.

The resulting integration order is:

1. Keep **PR #13** as the merged schema/docs baseline.
2. Keep **PR #12** player content, normalizing its fields and values to that baseline.
3. Add compatible encounter-side records from **PR #5**; this also resolves the subject of empty/blocked **PR #11**.
4. Add schema-aligned plans from **PR #7–#10**, plus selected architecture/vision guidance from **PR #1–#4**.
5. Preserve **PR #15**'s bounded HUD and 36-icon art plan; update the canonical docs index/history.

PR #6's competing dataset is excluded; its useful integrity-test structure is reapplied to the selected content. PR #2–#4's duplicate content lists, new mechanics, and unsupported balancing numbers are not commitments.

## 4. Consolidated documentation and content structure

The canonical documentation set now includes:

- `docs/README.md`
- `docs/data-schema.md`
- `docs/data-authoring-rules.md`
- `docs/runtime-data-plan.md`
- `docs/first-playable-ui-plan.md`
- `docs/vertical-slice-implementation-plan.md`
- `docs/milestones.md`
- `docs/implementation-board.md`
- `docs/repo-consolidation-plan.md`
- `docs/project-history-and-execution-log.md`
- `docs/pr-integration-review.md`
- `docs/combat-architecture.md`
- `docs/vision.md`
- `docs/hud-spec.md`
- `docs/ui-style-guide.md`
- `docs/visual-reference-brief.md`
- the three `docs/art-sprint-1-*` documents

Content is organized under `data/` by type: careers, skills, statuses, enemies, bosses, items, and encounters. Rewards are inline in encounters and enemy/boss loot tables. Optional high-level/visual documents may support the slice but should not create a competing operational source of truth.

## 5. Agent workstreams described in the conversation

Three coordinated workstreams were described as started in the earlier conversation:

1. **Core player content:** careers, skills, statuses; expected output was three careers, eight to nine skills, a core status set, and schema-valid references.
2. **Encounter content:** enemies, optional boss, items, encounters, and rewards; expected output was three enemies, an optional schema-supported boss, one to four encounters, and consistent references.
3. **Schema/docs consolidation:** documentation index, data schema, consolidation plan, and focused terminology fixes.

The player-content and schema/docs tracks landed as PRs #12 and #13; this project log landed as PR #14. PR #11 was still empty when reviewed and blocked on the missing schema; PR #5 now provides the selected encounter-side source for this consolidated branch. Check live GitHub for any later changes to these PRs.

## 6. Post-content implementation sequence

After the consolidation and content work is reviewed:

1. **Data Runtime Foundation:** JSON loading, validation, registry, runtime facade, and encounter resolver. UI/gameplay should not consume raw JSON.
2. **Combat HUD Foundation:** HUD layout, player/enemy state, action/target/preview flow, tooltips, compact event log, and runtime-data connection.
3. **First Playable Screen Flow:** Career Select, Encounter Preview, Reward, Progression, and minimal state handoff to/from combat.

The autonomous development follow-up authorizes implementing the first-slice
combat resolver and connected Godot runtime. Save/load, overworld, shop, and
inventory management remain outside the slice. Establish shared data/UI contracts
before parallel agent work and assign non-overlapping surfaces.

## 7. Sprint 1 art-planning direction

The later request asked for full-text treatment of the prioritized asset list, art direction, and image-generation prompts rather than a mini guide. Sprint 1 is bounded to:

- A reusable combat HUD visual kit and responsive module/layout references.
- Exactly 36 core combat icons across actions, combat resources, statuses, reactions, echoes, field markers, and equipment slots.
- A staged process: confirm source terminology → approve visual foundation and responsive layouts → prototype HUD modules → approve representative icon archetypes → produce and review all 36 icons → export and hand off.
- Consistent global style and individual prompts, with generated output treated as draft art requiring normalization and review.

Keep the First Playable framing. Do not add speculative gameplay, classes, enemies, environments, or systems to justify new art. The full production details are in:

- `docs/art-sprint-1-production-pack.md`
- `docs/art-sprint-1-task-checklist.md`
- `docs/art-sprint-1-prompt-sheet.md`

These documents are plans; they do not claim that assets have been created or approved.

## 8. Open tensions and risks

- Slice scope may grow beyond the minimum playable loop.
- Older docs and authored data have conflicted on field names, types, and chance formats; this integration normalizes current content against `docs/data-schema.md`.
- Reward representation is resolved for the slice: inline encounter `rewards` plus enemy/boss `loot_table`; separate reward collections remain out of scope.
- Optional high-level docs should not displace operational slice docs.
- Prototype `ECHO//BRUCH` details should not silently define the planned Godot slice.
- Icon labels and HUD semantics must be confirmed against the canonical gameplay model before integration.
- Final target device orientation remains unresolved between earlier portrait and landscape proposals; plan responsive references without claiming it is settled.
- The original PR #1 Godot scaffold contained unverified stubs. Native boot,
  combat and HUD implementation now replaces those core placeholders; unrelated
  early Resource/save/progression sketches are still not runtime authority.
- Optional content behaviors (`trigger`, `removes_statuses`, and consumable `next_attack_bonus`) are explicit schema fields; runtime implementation must exercise them before the data/runtime track is done.
- Milestones and implementation status can drift from the actual repository.

## 9. Intended source-of-truth map

| Subject | Intended canonical source |
| --- | --- |
| Docs entry point | `docs/README.md` |
| JSON shapes and fields | `docs/data-schema.md` |
| Content authoring conventions | `docs/data-authoring-rules.md` |
| Consolidation decisions | `docs/repo-consolidation-plan.md` |
| Data loading/validation/registry | `docs/runtime-data-plan.md` |
| Screens and HUD | `docs/first-playable-ui-plan.md` |
| Slice execution | `docs/vertical-slice-implementation-plan.md` |
| Milestones and current status | `docs/milestones.md`, `docs/implementation-board.md` |
| Gameplay content | `data/` |
| Engine foundation | Godot is the intended target; PR #1 scaffold remains deferred pending code review |
| Sprint 1 visual production | `docs/art-sprint-1-production-pack.md` and its checklist/prompt sheet |
| PR-by-PR adoption decisions | `docs/pr-integration-review.md` |

## 10. Consolidation completion criteria

Consolidation is complete when:

- There is one authoritative source per topic and no unresolved competing standard.
- `docs/README.md` is a reliable entry point and its links resolve.
- `docs/data-schema.md` matches the real JSON under `data/`.
- IDs, references, optional fields, and value ranges agree across content and schema.
- The per-PR adoption decisions and any outstanding agent work are checked against live GitHub state.
- The next implementation block starts from a stable content, runtime, and UI contract.

Sprint 1 art planning is complete only when the separate art checklist's review gates and done criteria are satisfied.

## 11. 2026-10-10 — Open-PR triage (#16–#26)

- **Scope/evidence:** Docs only, this PR; `main` at the audit date. Changed paths: `docs/pr-integration-review.md` and `docs/project-history-and-execution-log.md`.
- **Decisions:** See [`pr-integration-review.md#open-pr-triage-snapshot-2026-10-10`](pr-integration-review.md#open-pr-triage-snapshot-2026-10-10). Blocked item: runtime-supplement contract approval; accountable role: WS01/WS02; gate: `runtime-data-plan.md`.
- **Validation:** `node --test scripts/workstream-docs.test.mjs` — 4/5 passed; `source coverage accounts for all canonical index documents` failed (expected 18, found 24). `npm test` — 256/265 passed; 9 failures (8 in `scripts/grok-pwa-plugin.test.mjs`, 1 the same source-coverage assertion). The same results were observed before and after the documentation edits; existing failures are unrelated and were not changed.
- **Resume:** Next bounded action = merge #26, then rebase #22 per the integration order; destination `docs/pr-integration-review.md` for any changed disposition.

## 12. 2026-10-10 — Repository instruction alignment handoff

Historical PR #26 checkpoint; the integration handoff below supersedes its
absent-tooling/resume statements without rewriting the original evidence.

- **Scope:** repository guidance only, plus documentation regression tests;
  PR #26 (`copilot/add-repository-instructions`). No gameplay data, runtime code,
  dependencies, or historical dispatch IDs changed.
- **Decisions:** [`README.md`](README.md#authority-and-orientation) routes subject
  authorities and output locations. The [Vision Manifest](vision-manifest.md),
  [Target Architecture](target-architecture.md), and
  [Game Director Pitch](game-director-pitch.md) separate strategic, technical,
  and creative direction without replacing schema/slice gates.
- **Placement:** `.github/copilot-instructions.md` is the operational agent guide;
  `AGENTS.project.md` routes to it. Local `data/`, `godot/`, and `scripts/` READMEs
  map destinations. The [handoff convention](workstreams/orchestration.md#repository-handoff-convention)
  reuses workstream blockers and this log rather than creating per-agent documents.
- **Corrected conflict:** [`content-pipeline.md`](content-pipeline.md) replaces
  `.tres`-first instructions; older Godot/scaling proposals are explicitly historical.
  `runtime-data-plan.md` (the planned-supplement section at that checkpoint)
  records the supplement as a proposal, not implemented/export-ready content.
- **Resume:** WS01/WS02 and affected consumers must review supplement version,
  schema, scope, and failure behavior before adding `data/runtime/slice.json`.
  WS06 then owns packaging/output contract and native/export evidence. Existing
  gameplay-policy blockers remain in the [decision queue](workstreams/README.md#decisions-and-blocked-work).
  Do not create `final-runtime-data-design.md` as a shadow owner or prescribe
  absent `data:check` / `data:export:godot` commands.
- **Validation:** `node --test scripts/workstream-docs.test.mjs`: 7 passed
  (links, anchors, authority coverage, handoff fields, planned-contract wording);
  `git diff --check`: passed. `npm test`: 251 passed, 8 failed in unchanged
  `scripts/grok-pwa-plugin.test.mjs` share-card/title expectations. Running that
  suite on an isolated archive of baseline `55596f6` reproduced the same eight
  failures (41 passed, 8 failed). Follow-up belongs to platform/PWA tooling,
  not the gameplay workstreams. Final revision/review results remain in this PR;
  these documentation checks do not certify any Godot/native/export gate.

## 13. 2026-10-10 — Dependency-ordered PR integration handoff

- **Scope:** integrate #18 → #23 → #20 → #26 on the main-based task branch.
  Changes include isolated supplement/export tooling, v1 skill/event fixtures,
  authority/output maps, local guides, and documentation regression coverage.
  Mainline native boot, canonical pack, content definitions, and importer remain intact.
- **Decisions:** the [integration review](pr-integration-review.md#dependency-ordered-integration-2026-10-10)
  records exact PR heads, conflict choices, blockers, and maintainer actions.
  The current WS01–WS06 ledger remains the execution authority; alternate runtime
  packages are supporting material. Native supplement/contract migration is pending.
- **Evidence:** build, typecheck, slice/content/supplement/pack checks and eight docs
  checks pass. Full Node suite has eight unchanged platform failures; lint has
  unchanged baseline failures. Godot is unavailable; no native acceptance claimed.
  Secret scans passed before merge commits.
- **Blocker/resume:** branch-scoped publication cannot update `main` or merge/retarget
  source PRs; PR check-run reads return HTTP 403. Maintainer must review required
  checks, merge the integration branch with history preserved, verify all recorded
  heads on `main`, and reconcile the original PR states, especially stacked #23.
- **Additional requirement:** strengthen existing agent/connector guidance without
  creating credentials or new services. The [tooling map](../scripts/README.md#existing-connectors-and-credential-boundaries)
  distinguishes repository Drive intake from viewer request-scoped connectors,
  anchors existing code/configuration, and records safe secret/blocker handling.
  No external authentication, grants, or credential provisioning is claimed.
