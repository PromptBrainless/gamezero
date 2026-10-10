# Implementation Workstreams

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

The repository contains connected browser slice code, validated metadata/export tooling and Godot loading scaffolding. Foundation checks passed at the documentation checkpoint; a bridge that loads a bundle is still not a playable Godot build. Existing PR #16 (Drive import) and #17 (documentation orchestration) are open with no files at the reported checkpoint; neither establishes remote delivery.

## Fixed budget and guardrails

Three careers (`mercenary`, `duelist`, `scholar_mage`), ten skills (nine player skills plus enemy/boss-only `iron_command`), six statuses, three normal enemies, one boss, eleven items and four encounters. `cult_in_the_hedges` has two opponents: never impose a 1v1 limitation.

Stable IDs and existing baseline stats stay unchanged. Current tested browser combat automatically triggers Riposte and supports consumables; the mounted route carries rewarded consumables into subsequent encounters (evidence in package 02). The supplement records these existing behaviors; it does not enable new browser behavior. Initiative/critical/resistance mechanics remain inactive. Save/load, world map, shop, networking, deep inventory and large catalogs remain deferred.

## Handoff format

Every assignment returns: changed paths; implemented versus deferred scope; commands and actual results; unresolved contract decisions; downstream consumers affected. Missing Godot means **Godot execution not tested**, not “smoke passed.” No remote agent launch, release, or PR merge is implied by these documents.
