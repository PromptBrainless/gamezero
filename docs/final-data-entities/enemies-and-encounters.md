# Enemies and Encounters

**Milestone:** Post-Slice Expansion (planned now, implemented after the first-playable gate) · **Status:** planning + staged types/examples · **Slice impact:** none — the slice keeps `data/enemies`, `data/bosses` and `data/encounters` as defined in [`../data-schema.md`](../data-schema.md).

## Purpose

Define the opponent side of combat as data: who fights (enemies and bosses), where (stages), and in what composition and order (encounters made of waves). The runtime resolves an encounter into combatants and a wave schedule, the resolver emits events for spawns, phase changes and defeats, and the Encounter Preview, HUD and Reward screens render only those resolved values.

## Scope

**In scope**

- `enemy_def`: slice `enemies` record plus `family` and `rank`.
- `boss_def`: slice `bosses` record (phases, telegraphs, `on_enter`) plus `family`.
- `stage_def`: reusable side-view stage with slot layout; replaces the slice `arena` string key (stage id = former arena key).
- `encounter_def`: ordered `waves[]` of `spawns` on a stage, an explicit `victory` rule and inline `rewards`.
- Migration of the four slice encounters and the encounter-side events (`encounter_started`, `wave_started`, `telegraph_announced`, `phase_changed`, `combatant_defeated`, `encounter_ended`).

**Out of scope (deferred, with trigger)**

| Deferred item                                               | Enters when                                              |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| Separate `ai_profile` entity, scripted AI patterns          | A second `ai.pattern` beyond `weighted_random` is needed |
| Encounter modifiers / stage hazards                         | The skill/effect system defines reusable field effects   |
| Summons and reinforcements mid-wave                         | Waves alone cannot express a designed fight              |
| Regions, campaign map and encounter ordering beyond `order` | Region increment                                         |
| Separate reward-table files                                 | More than one encounter shares a loot pool               |
| Elite affixes / enemy scaling by tier                       | Second region with tier-2 content                        |

## Entity list

| Entity               | Kind                        | Collection (staged → canonical)                         | Type file                         | Examples                                                            |
| -------------------- | --------------------------- | ------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `enemy_def`          | authored                    | `game/runtime_data/examples/enemies/` → `data/enemies/` | `types/enemy_def.schema.json`     | `rusted_deserter`, `hedge_cultist`                                  |
| `boss_def`           | authored                    | `examples/bosses/` → `data/bosses/`                     | `types/boss_def.schema.json`      | `iron_captain`                                                      |
| `stage_def`          | authored                    | `examples/stages/` → `data/stages/`                     | `types/stage_def.schema.json`     | `ruined_road`, `fortress_gate`                                      |
| `encounter_def`      | authored                    | `examples/encounters/` → `data/encounters/`             | `types/encounter_def.schema.json` | `deserters_toll`, `gate_of_the_north_watch`, `north_watch_vanguard` |
| `wave` / `spawn`     | embedded in `encounter_def` | —                                                       | inside `encounter_def`            | see examples                                                        |
| `resolved_encounter` | runtime                     | — (output of `EncounterResolver`)                       | documented below                  | —                                                                   |

Bosses stay a separate type, as in the slice, because phases and telegraphs are required for bosses and invalid for normal enemies.

## Data model outline

### `enemy_def` (additions to slice `enemies`)

| Field    | Type                              | Rule                                                                                                                    |
| -------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `family` | id                                | Faction/creature group (`north_watch`, `hedge_cult`); used for encounter themes, preview grouping and later shared loot |
| `rank`   | `minion` \| `standard` \| `elite` | Composition budget and preview label; no hidden stat multiplier — all stats stay in `base_stats`                        |

Unchanged rules: `skills` ≥ 1 and resolvable; `ai.weights` keys ⊂ `skills`; `loot_table[].item` resolves; `weaknesses` / `resistances` are damage types.

### `boss_def` (additions to slice `bosses`)

`family` (id). Unchanged rules: `phases` ordered by strictly descending `hp_threshold` starting at `1.0`; each phase lists its own `skills`; `telegraphs[].skill` must be one of the phase's skills; each `on_enter` entry is either `{apply_status, duration, target}` or `{stat_modifier}`.

### `stage_def`

| Field                                | Type       | Rule                                      |
| ------------------------------------ | ---------- | ----------------------------------------- |
| `id`, `name`, `description`          | id / text  | `id` equals the former `arena` key        |
| `layout.player_slots`                | int 1–4    | Slice uses 1                              |
| `layout.enemy_slots`                 | int 1–6    | Upper bound for spawn `slot` values       |
| `background`, `music_cue` (optional) | asset keys | Resolved by presentation; never by combat |

### `encounter_def`

| Field                                                        | Type                                | Rule                                                                                                                                             |
| ------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`, `name`, `type`, `difficulty`, `description`, `rewards` | as slice                            | `type`: `tutorial` \| `standard` \| `boss`; `difficulty` 1–5                                                                                     |
| `order`                                                      | int, optional                       | Unique when present; slice run sequence. Encounters outside the slice run omit it                                                                |
| `stage`                                                      | stage id                            | Must resolve                                                                                                                                     |
| `waves[]`                                                    | ≥ 1, ordered                        | Unique `id`; first `trigger` = `encounter_start`, later ones `previous_wave_cleared`                                                             |
| `waves[].spawns[]`                                           | ≥ 1                                 | `{kind: enemy\|boss, actor, slot}`; `actor` resolves in the collection named by `kind`; `slot` unique within the wave and `< layout.enemy_slots` |
| `victory`                                                    | `defeat_all_waves` \| `defeat_boss` | `defeat_boss` ⇔ a boss spawn exists ⇔ `type: boss`                                                                                               |

### Migration from the slice

| Slice field                     | Final field                                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `arena: "ruined_road"`          | `stage: "ruined_road"` (+ `data/stages/ruined_road.json`)                                                             |
| `enemies: [a, b]`               | `waves: [{id: "wave_1", trigger: "encounter_start", spawns: [{kind, actor: a, slot: 0}, {kind, actor: b, slot: 1}]}]` |
| `type: boss`, `enemies: [boss]` | single boss spawn in the centre slot, `victory: "defeat_boss"`                                                        |
| other fields                    | unchanged                                                                                                             |

The test suite enforces this mapping for every staged encounter that exists in `data/encounters/`. `north_watch_vanguard` is a post-slice example showing two waves.

### Runtime rules

```text
start:          spawn waves[0]                                  → encounter_started, wave_started
wave cleared:   if next wave exists → spawn it                  → wave_started
                else                                            → encounter_ended {outcome: victory}
boss HP ≤ next phase hp_threshold × max_hp:
                switch phase, apply on_enter in listed order    → phase_changed (+ status/stat events)
telegraph:      announce warning_turns before the skill resolves → telegraph_announced
defeat_boss:    boss defeated ends the encounter, remaining adds are removed without XP
player defeated                                                 → encounter_ended {outcome: defeat}
```

`resolved_encounter` (EncounterResolver output) = encounter record + resolved stage + per-wave resolved combatant records (stats, skills, statuses referenced) + rewards with resolved items. Encounter Preview reads it: name, difficulty, stage name, wave count, distinct actors with `rank`/boss title, and reward summary.

## Dependencies

| Depends on                                                                                 | For                                                                                   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| [`../data-schema.md`](../data-schema.md)                                                   | Base enemy/boss/encounter fields and validation                                       |
| [`../runtime-data-plan.md`](../runtime-data-plan.md)                                       | `EncounterResolver` responsibilities; registries for `stages`                         |
| [`../combat-architecture.md`](../combat-architecture.md)                                   | Resolver authority and ordered events                                                 |
| Skill/effect system and combat-event contract (parallel workstream)                        | Enemy/boss skills and statuses; event envelope and names for wave/phase/defeat events |
| [`classes-and-progression.md`](classes-and-progression.md)                                 | Consumes `rewards.xp` / `rewards.items`                                               |
| [`../ui/hud-combat-event-integration-plan.md`](../ui/hud-combat-event-integration-plan.md) | Presentation of wave, telegraph, phase and defeat events                              |

## Implementation sequence

1. **Types and examples (this change).** Enemy, boss, stage and encounter schemas with migrated examples and a two-wave example, checked by `scripts/runtime-data-examples.test.mjs`.
2. **Schema promotion.** Add `family`, `rank`, the `stages` collection and `stage`/`waves`/`victory` to `data-schema.md`; migrate all four slice encounters and add the four stage records in the same change; drop `arena`/`enemies` from encounters.
3. **Godot data layer.** Replace the draft `archetype`/`is_boss`/`max_hp` fields in `godot/scripts/data/enemy_definition.gd` with the schema fields, add `boss_definition.gd`, `stage_definition.gd` and `encounter_definition.gd` under `godot/scripts/data/`, and register them with reference validation.
4. **Encounter resolver.** Resolve encounters into `resolved_encounter`; tests for every slice encounter and the two-wave example.
5. **Wave and phase flow.** Add a scene-independent wave controller under `godot/scripts/combat/` that the resolver drives; emit the runtime-rule events above in deterministic order.
6. **Preview and HUD.** Encounter Preview renders `resolved_encounter`; HUD consumes wave/phase/telegraph/defeat events via the binding table.
7. **Regression.** Play the four-encounter slice and the two-wave example with a fixed seed; event streams are identical across runs.

## Definition of done

- All enemy, boss, stage and encounter records validate; every reference resolves; slot, wave-trigger and victory rules are enforced at load time with aggregated errors.
- The resolver produces a complete `resolved_encounter` for every encounter, including multi-wave encounters.
- Wave transitions, boss phase changes, telegraphs and terminal outcomes emit events in a stable order for a given seed and input sequence.
- Encounter Preview, HUD and Reward screens show only resolved data; no enemy number is hard-coded in UI.
- The first-playable four-encounter run behaves identically before and after migration.

## Open decisions

| Decision                                                                            | Recommendation                                                             | Owner / milestone                    |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| Are enemy/boss `loot_table` rolls granted in addition to encounter `rewards.items`? | Yes, rolled with the combat seed after victory; shown on the Reward screen | Gameplay owner / promotion increment |
| Do surviving adds grant XP when `defeat_boss` ends a fight?                         | No; encounter `rewards.xp` is the only award                               | Gameplay owner / promotion increment |
| Does the player keep HP/status between waves?                                       | Yes; waves are one fight                                                   | Gameplay owner / promotion increment |
