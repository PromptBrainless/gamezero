# 04 — RPG Content Systems

## Mission and sources

Make the existing careers, progression, enemies, encounters, equipment and narrative form one bounded run. Sources: [schema](../data-schema.md), [authoring rules](../data-authoring-rules.md), [rules](../first-playable-rules.md), [runtime supplement](../final-runtime-data-design.md), [slice plan](../vertical-slice-implementation-plan.md) and [milestones](../milestones.md).

“Final data design” authorizes supplemental metadata, not a finished RPG or a catalog expansion.

## Delivered versus pending

**Observed:** three career JSON definitions with stats/growth/start/pool/items; all selected enemies/boss/skills/statuses/items/encounters. Browser `createBattle` applies growth/start equipment; `SliceApp` advances encounters and displays XP/rewards. Godot progression/inventory/save files are scaffolds.

**Delivered data:** validated metadata describing level unlocks, action selection, status policy, archetypes, stages/spawns, equipment slots and eight short before/victory dialogue graphs. They are authored slice data, not a delivered dialogue screen or live Drive import.

**Pending:** verified Godot run service, narrative consumption, exact-once reward/progression transitions and cross-package integration. Metadata existence does not imply a working dialogue engine, item economy or inventory screen.

## Ownership and contracts

Own authored canonical entities and RPG run/progression/narrative service. 01 owns schema/validation; 02 owns combat semantics; 03 owns routing/engine IO; 05 owns screens; 06 owns imports/raw curation.

Coordinate `data/runtime/slice.json` changes with 01/integrator; it is a shared contract. Do not edit base career shapes to add `progression[]`, tune combat stats, duplicate stage coordinates in scenes, or publish raw Drive proposals directly.

Inputs: selected career, ordered/resolved encounter, accepted combat result. Outputs: in-memory run context (career, encounter position/ID, level, cumulative displayed XP, completion), preview/narrative IDs and progression summary. Combat actor state is owned by 02 and freshly instantiated each encounter.

## Concrete slice inventory

| Area | Canonical budget and behavior |
|---|---|
| Classes | `mercenary`, `duelist`, `scholar_mage`; no alternate “mystic” class |
| Skills | Nine player skills across those pools; tenth `iron_command` remains enemy/boss-only |
| Statuses | `bleeding`, `chilled`, `exposed`, `focused`, `guarded`, `stunned` |
| Enemies | `alley_cutthroat`, `rusted_deserter`, `hedge_cultist`; boss `iron_captain` |
| Encounters | `first_blood`, `deserters_toll`, `cult_in_the_hedges`, `gate_of_the_north_watch` |
| Items | Eleven definitions; consumables are usable and rewarded supplies carry forward; non-consumable rewards are displayed, not newly equippable |
| Narrative | Supplement's short before/victory chains, no branching quest/world system |

Cult includes `hedge_cultist` **and** `alley_cutthroat` in one starting wave. Encounter array order and spawn identity remain authoritative; one selected target does not mean one enemy.

Base `role` is authored flavor/classification text; archetype `role` is the supplement's tactical taxonomy (`striker`, `defender`, `controller`, `boss`). They are distinct fields, not aliases to normalize into one enum.

## Implementation backlog

1. Resolve career starts and metadata unlocks: level 1 has starting skills, level 2 exposes the rest of the canonical pool; max slice level 4. Starting skills must remain affordable and career-compatible.
2. Implement victory-level progression using existing `stat_growth`; no XP threshold invention. XP is reported from inline encounter rewards.
3. Start each encounter at full HP/resources with the approved starting equipment modifiers. Loss/retry retains the same encounter/level and resets battle state. New run clears prior state.
4. Guard reward/progression consumption by completed encounter identity: replaying a callback cannot duplicate XP or advance twice. Last encounter leads to a finish state.
5. Instantiate archetypes from canonical enemy/boss definitions and ordered slots/waves. Normal AI is seeded `uniform_available`; authored `ai.weights` are future intent, not currently consumed. Boss pending telegraphs take precedence.
6. Consume before/victory narrative as short, reachable node chains. Keep German text as authored; IDs ASCII. Narrative is skippable and cannot mutate combat rules.
7. Resolve starting equipment slots and item descriptions with validation. Preserve current usable consumables and `consumables_next_encounter` rewards: retain remaining supplies, add consumable rewards, restore supplies into the next battle. Do not make non-consumable rewards equippable or add a deep inventory screen.
8. Review 06 curated proposals for ID/reference/mechanics/copy consistency before canonical publication; route schema additions through 01, not descriptions.

The mounted root route already uses rewarded consumables/automatic Riposte (see package 02 evidence). Updated rules and supplement reflect it; this package ports existing behavior rather than reverting it or expanding item use.

## Executable acceptance

Existing repository checks:

```sh
npm run test:slice
npm run data:check
node --experimental-strip-types --test src/game/slice/combat.test.ts
```

Follow-on deliverable: package-owned headless `godot/tests/run_flow.gd` (not present/verified at this checkpoint):

```sh
godot --headless --path godot --script res://tests/run_flow.gd
```

Required assertions: each career starts correctly; first victory unlocks pool and next level; subsequent stats derive from original base/growth rather than compounding equipment; XP comes from inline rewards; remaining supplies plus consumable rewards enter the next encounter; non-consumable rewards do not alter equipment; repeated result consumption is idempotent; retry changes no progression; restart clears all; fourth victory finishes safely; cult spawns two distinct actors; narrative links resolve and terminate.

Do not call “all careers can win” from one offensive heuristic. Playthrough evidence is separate from balance sampling; no 99% target and no baseline-stat changes are required.

## Handoff and deferrals

Hand 03 the run-service API and exact transitions; 05 the career/preview/reward/progression/narrative view models; 01 all new authoring invariant fixtures; 06 review feedback with provenance preserved.

Deferred: persistent saves, world/regions, shop, deep inventory/equipment UI, item economy, career trees beyond level 4, quests, branching narrative, additional careers/enemies/boss chains and catalogs.

## Copyable agent assignment

> Own package 04's existing content and minimal RPG run/progression/narrative service. Use schema v1 plus the separate supplement; preserve canonical IDs, all counts and baseline stats. Implement exact-once in-memory victory-level advancement, full encounter resets, retry/reset/finish and short narrative handoff. Keep iron_command enemy-only and both cult opponents. Coordinate metadata edits with 01, route scenes through 03 and UI through 05, review 06 proposals before publication. Add/run targeted run-flow tests; do not implement save/world/shop/catalog or unapproved item mechanics.
