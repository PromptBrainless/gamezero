# First-playable execution backlog

This is the deduplicated execution view of the [canonical index](../README.md), not a replacement schema, ruleset, or milestone plan. Every brief is an implementation assignment with an initial coding increment and a complete remaining backlog. An agent starting an increment does **not** mean its whole workstream is complete.

## Baseline and scope

- Target: Godot 4.4+ under `godot/`, mobile-first 2D side-view turn-based combat. The root README explicitly treats the browser as a rules reference, not the target runtime.
- Existing `src/game/slice/` and `src/components/slice/` supply reference code/tests. The native host now connects the slice using the generated canonical `godot/data/runtime_pack.json`; implementation is not evidence of native acceptance.
- Preserve canonical JSON under `data/`: 3 careers, **9 player skills plus 1 enemy-only skill** (10 files), 6 statuses, 3 enemies, 1 boss, 11 items, 4 ordered encounters. Do not duplicate authored content into `.tres` or `godot/data/`; generated exports are permitted.
- No expanded rosters, regions, localization, separate reward collections, career rank tracks, save/load, overworld, shop, inventory-management screen, networking, audio, heavy VFX, final character/background art, or speculative echo/field mechanics.
- Shared contract changes require review across affected briefs and canonical documents. Existing historical PR labels/status are history, not current completion evidence.

## Workstreams and sequencing

| ID / brief | Purpose | Priority | Hard dependencies for completion | Initial parallel increment |
|---|---|---|---|---|
| [WS01 — Data runtime](01-data-runtime.md) | JSON loading, validation, registries, resolved records | P0 | Approved schema; WS02 exercises adopted behaviors | Loader and registry boundary |
| [WS02 — Combat contract](02-combat-contract.md) | State/action/preview/result and ordered events; approved behaviors | P0 supporting Tracks 1–2 | WS01 records; gameplay owner resolves unspecified policy | Event envelope and contract boundary, not a new full resolver |
| [WS03 — Combat HUD](03-combat-hud.md) | Responsive, accessible modules and action/target/preview states | P0 | WS01 + WS02; WS05 approved art mapping for final art | Reusable meter/status/help foundations |
| [WS04 — Screen flow](04-screen-flow.md) | Four meta-screens plus combat handoff and repeatable run | P1 | WS01 + WS02 + WS03 | In-memory run-context/navigation boundary |
| [WS05 — Art preparation and production](05-art-production.md) | HUD kit, exact 36-icon tracking, production gates/handoff | P1; prepare early | Project/art owner Gate 0; WS03 layout context | Complete asset manifest and semantic-gap mapping |
| [WS06 — Integration and acceptance](06-integration-acceptance.md) | Content integrity, packaging, gate evidence, end-to-end regression | P0 gatekeeper | WS01–WS04; WS05 only for art-sprint closure | Native acceptance runner/inventory checks without declaring a playable build |

### Ordered release gates

1. **Docs Final:** confirm scope, IDs, schema, responsibilities and interfaces. Assign unresolved decisions below; no blocked mechanic or visual mapping may silently become a contract.
2. **Foundation increments in parallel:** WS01 loader, WS02 envelopes, WS03 widgets, WS04 context, WS05 manifest, WS06 acceptance preparation have disjoint ownership. Use representative **valid fixtures**, not placeholder production content.
3. **Integration:** WS01 completes validation/resolution; WS02 implements only approved adopted behaviors; WS03 binds real data/events; WS04 connects all five screens. WS06 owns boot/packaging changes after interfaces stabilize.
4. **First Playable Build:** complete all four encounters, all three careers, normal/boss resolution, reward/progression, error paths and repeat runs in Godot. Fix only slice blockers.
5. **Art gates:** Gate 0 → A → B1 → B2 → C → D are individually recorded. Art preparation can run early; automated manifests do not satisfy visual approval.
6. **Post-Slice Expansion:** only after the playable gate, with separately reviewed scope, backward-compatible contracts and regression evidence per increment.

## Shared interfaces and write ownership

Names below define module responsibilities, not a second content schema. Until WS01/WS02 signatures are reviewed, downstream code is standalone and does not wire competing APIs into boot.

- WS01: `godot/scripts/data/runtime/`; `DataRuntime` exposes readiness, aggregated issues and collection/ID lookups only after validation. `EncounterResolver` provides encounter identity, resolved opponents/skills/statuses and inline reward items.
- WS02: `godot/scripts/combat/contracts/`; action intent identifies actor, action and legal target IDs. Preview is non-mutating and exposes only computed/available values. Events contain sequence, type, turn, applicable source/target IDs and payload; result distinguishes victory/defeat/exit. No scene nodes in these contracts.
- WS03: `godot/scripts/ui/foundation/`, `godot/scenes/ui/foundation/`; consumes records/preview/events, emits intent, never applies damage or rewards.
- WS04: `godot/scripts/progression/slice/`, `godot/scenes/flow/`; owns in-memory selected career, ordered encounter cursor, accumulated XP/items, result consumption and next/finish/reset navigation.
- WS05: `artifacts/art/sprint-1/`; preparation only until approvals. Canonical asset filenames remain the pack's hyphenated identifiers, not gameplay IDs.
- WS06: `godot/tests/`, later `godot/scripts/core/` and boot/project export integration after dependency review. Do not modify shared boot while other agents are building interfaces.
- Parent/orchestrator: only these briefs, `docs/README.md`, orchestration ledger and its Node tests. Agents must not edit another stream's files, canonical docs, dependencies, browser runtime or existing Godot stubs without a coordinated follow-up.

All repository paths in this document are repository-relative ownership coordinates. Agent prompts use the actual absolute checkout path. No secrets, external services, database/auth or new dependencies are required.

## Decisions and blocked work

| Decision | Accountable role | Gate / handling |
|---|---|---|
| Unspecified turn order, cooldown/status timing, resource regeneration, crit/resistance rounding, reaction policy and consumable action timing | Gameplay owner, WS02 | Approve before gameplay integration; schema gives data/formula, not every turn rule. Browser behavior is a proposal, not authority. |
| Defeat/exit/retry and between-encounter HP/resource carryover | Gameplay owner, WS04 with WS02 | Resolve before end-to-end gate. Isolate navigation policies; do not invent progression formulas or persistence. |
| Final device orientation and target device checks | Project owner, WS03/WS06 | Keep both narrow portrait and wide references now; final orientation explicitly deferred to device review before release. |
| Art identifiers with no canonical gameplay equivalent | Art/project owner, WS05 | Gate 0 blocks their production/integration; track all 36, never implement extra mechanics to justify them. |
| Approval of palette/layouts/archetypes/batch/handoff | Art reviewer, WS05/WS03 | Record actual reviewer/evidence for each gate; no automated approval. |
| Godot execution/export environment | Integration owner, WS06 | Verify engine availability; absent engine means native acceptance remains unverified, not passed. |

## Source coverage and orchestration

- [Source coverage](source-coverage.md) accounts for canonical documents, duplicate commitments, historical cleanup and exclusions.
- [Agent orchestration](orchestration.md) explains launch scope, operational limitations, ownership and status evidence.
- [Machine-readable ledger](orchestration.json) records the same six briefs, dependency graph and actual agent IDs.

Completion requires acceptance evidence for every brief. Checklists intentionally describe **pending work**, not placeholder implementation or fabricated completion.
## Supplementary runtime-design packages

The packages below preserve the runtime-design proposal from PR #18. The six
WS01–WS06 briefs and `orchestration.json` above remain the execution backlog and
write-ownership authority. These packages are supporting design material, not a
second set of launched agents or permission to expand the first-playable scope.

Six bounded work packages turn the agreed data design into the Godot first playable. These are implementation assignments, not six already-started remote jobs or six completed systems.

## Start here

1. Read [orchestration and gates](00-orchestration-overview.md).
2. Read the [canonical documentation index](../README.md), especially schema, slice plan, rules, milestones, and board.
3. Read the [runtime metadata supplement](../final-runtime-data-design.md) and `data/runtime/slice.json`. They supplement base schema v1; they do not silently change browser combat.
4. Choose one package, use its copyable assignment, and confirm its allowed paths before editing.

| Package | Accountable output | Hard implementation dependency |
|---|---|---|
| [01 Data foundation](01-data-foundation.md) | Validated base/metadata registry and stable contracts | Agreed schema and metadata |
| [02 Combat core](02-combat-core.md) | Deterministic rules/state/events and fixture oracle | 01 contract gate |
| [03 Runtime migration](03-runtime-migration.md) | Validated export, Godot bridge, scenes and integration | 01; 02 for combat execution |
| [04 RPG content systems](04-rpg-content-systems.md) | Existing classes, progression, enemies, encounters, items and narrative | 01; 02 interfaces for live integration |
| [05 UX/combat presentation](05-ux-combat-presentation.md) | HUD, target interaction and event/art presentation | 01 mock contract; 02 and 03 for integration |
| [06 Content production pipeline](06-content-production-pipeline.md) | Auditable Drive/raw-to-curated production handoff | 01 authoring contract; 04/05 review |

The six packages refine the board's three tracks; they do not replace its exit criteria. Data foundation maps to Track 1; combat and migration enable it; UX maps to Track 2; runtime plus RPG handoff map to Track 3. Production tooling is supporting work and must not hold a valid local slice hostage to a connector.

## Status language

- **Observed:** source files exist and their behavior was inspected.
- **In flight:** assigned local work; review/tests still decide acceptance.
- **Accepted:** reproducible evidence satisfies a named gate.
- **Deferred:** excluded from this slice, not secretly promised.

At the original runtime-design checkpoint, the repository contained connected browser slice code, validated metadata/export tooling and Godot loading scaffolding. Those historical foundation checks and PR #16/#17 states are not current acceptance evidence. The newer native slice host remains intact; the supplement bridge is separate and not wired into it.

## Fixed budget and guardrails

Three careers (`mercenary`, `duelist`, `scholar_mage`), ten skills (nine player skills plus enemy/boss-only `iron_command`), six statuses, three normal enemies, one boss, eleven items and four encounters. `cult_in_the_hedges` has two opponents: never impose a 1v1 limitation.

Stable IDs and existing baseline stats stay unchanged. Current tested browser combat automatically triggers Riposte and supports consumables; the mounted route carries rewarded consumables into subsequent encounters (evidence in package 02). The supplement records these existing behaviors; it does not enable new browser behavior. Initiative/critical/resistance mechanics remain inactive. Save/load, world map, shop, networking, deep inventory and large catalogs remain deferred.

## Handoff format

Every assignment returns: changed paths; implemented versus deferred scope; commands and actual results; unresolved contract decisions; downstream consumers affected. Missing Godot means **Godot execution not tested**, not “smoke passed.” No remote agent launch, release, or PR merge is implied by these documents.
