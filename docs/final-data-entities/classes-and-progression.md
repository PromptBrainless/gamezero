# Classes and Progression

**Milestone:** Post-Slice Expansion (planned now, implemented after the first-playable gate) · **Status:** planning + staged types/examples · **Slice impact:** none — the slice Progression screen remains the minimal handoff described in [`../first-playable-ui-plan.md`](../first-playable-ui-plan.md).

## Purpose

Define how a playable class (career) is described as data and how it grows over a run: XP thresholds, per-level stat growth, skill unlocks and explicit level bonuses. The goal is a data-only progression layer: the runtime applies one documented formula, the Reward and Progression screens show exactly the values the data and the progression service produce, and new classes are added by authoring files, not code.

## Scope

**In scope**

- `class_def`: the slice `careers` record plus `role_tags` and a `progression_track` reference.
- `progression_track`: one level curve per class with XP thresholds, skill unlocks, stat bonuses and item grants.
- `character_progress`: the runtime (not authored) progression state of the current character.
- Progression run events (`xp_awarded`, `level_up`, `skill_unlocked`, `item_granted`) consumed by the Reward/Progression screens.
- Migration of the three slice careers (`mercenary`, `duelist`, `scholar_mage`).

**Out of scope (deferred, with trigger)**

| Deferred item                                     | Enters when                                                |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Advanced classes / career tiers (`advances_to`)   | A second tier of classes is authored                       |
| Talents / passives chosen on level-up             | The skill/effect system defines a canonical passive entity |
| Respec, multi-class, party roster                 | Party combat is approved                                   |
| Save/load of `character_progress`                 | Save system increment (slice has none)                     |
| Equipment-slot expansion, item level requirements | Item/economy increment                                     |

## Entity list

| Entity               | Kind          | Collection (staged → canonical)                             | Type file                             | Examples                                                 |
| -------------------- | ------------- | ----------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| `class_def`          | authored      | `game/runtime_data/examples/classes/` → `data/careers/`     | `types/class_def.schema.json`         | `mercenary`, `duelist`, `scholar_mage`                   |
| `progression_track`  | authored      | `examples/progression_tracks/` → `data/progression_tracks/` | `types/progression_track.schema.json` | `mercenary_track`, `duelist_track`, `scholar_mage_track` |
| `character_progress` | runtime state | — (in-memory run state; later save data)                    | documented below                      | —                                                        |

Decision: the canonical collection keeps the name `careers` on promotion, because the slice flow (Career Select), released ids and the Godot `CareerDefinition` already use it. `class_def` is the type name; "class" and "career" mean the same entity.

## Data model outline

### `class_def`

All slice `careers` fields keep their meaning (`id`, `name`, `role`, `description`, `base_stats`, `stat_growth`, `starting_skills`, `skill_pool`, `starting_items`, `reaction`, optional `visual`). Added:

| Field               | Type                                                                                   | Rule                                                                       |
| ------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `role_tags`         | array of `striker` \| `tank` \| `skirmisher` \| `controller` \| `support`, ≥ 1, unique | Drives Career Select filters and encounter-preview hints; no combat effect |
| `progression_track` | progression_track id                                                                   | Must resolve; the track's `class` must point back to this class            |

### `progression_track`

| Field                       | Type                 | Rule                                                                                                                |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `id`, `name`, `description` | id / text            | —                                                                                                                   |
| `class`                     | class id             | Exactly one track per class                                                                                         |
| `max_level`                 | int 2–20             | `levels.length == max_level`                                                                                        |
| `levels[]`                  | ordered              | `level` = index + 1; `xp_required` cumulative, `0` at level 1, strictly increasing                                  |
| `levels[].unlock_skills`    | skill ids, optional  | Must be in the class `skill_pool`, not in `starting_skills`; every non-starting pool skill is unlocked exactly once |
| `levels[].stat_bonus`       | stat delta, optional | Additive one-off bonus on reaching that level                                                                       |
| `levels[].grant_items`      | item ids, optional   | Added to the run inventory on reaching that level                                                                   |

### Formulas

```text
level(xp)          = highest L with levels[L-1].xp_required ≤ xp   (capped at max_level)
stat(L)            = base_stats[s] + stat_growth[s] × (L − 1) + Σ stat_bonus[s] for levels 2..L
known_skills(L)    = starting_skills ∪ unlock_skills of levels 2..L
```

`stat_growth` stays the per-level source (as in the slice); tracks only add unlocks and explicit bonuses, so growth is never authored twice. Derived stats are never stored.

### `character_progress` (runtime state)

```json
{
  "class": "mercenary",
  "level": 2,
  "xp": 42,
  "known_skills": ["shield_bash", "hold_the_line", "rending_cut"],
  "inventory": ["iron_sword", "buckler", "leather_jerkin", "bandage_roll", "whetstone"]
}
```

Applying an encounter reward is one deterministic operation: add `rewards.xp`, then for each level crossed **in ascending order** emit `level_up`, then `skill_unlocked` / `item_granted` for that level; `item_granted` for encounter reward items is emitted after `xp_awarded`. Multiple level-ups from one reward are processed one level at a time.

### First-pass curve (all three classes)

| Level | XP  | Mercenary             | Duelist             | Scholar-mage       |
| ----- | --- | --------------------- | ------------------- | ------------------ |
| 1     | 0   | start                 | start               | start              |
| 2     | 40  | `rending_cut`         | `quick_feint`       | `focused_mind`     |
| 3     | 100 | +1 defense            | +1 speed            | +3 focus           |
| 4     | 220 | +5 hp, +2 stamina     | +3 hp, +2 stamina   | +3 hp, +1 magic    |
| 5     | 400 | +1 attack, +1 defense | +1 attack, +1 speed | +1 magic, +3 focus |

Slice walkthrough with canonical encounter XP (22, 20, 46, 150): cumulative 22 → 42 → 88 → 238, i.e. level 1 → 2 → 2 → 4. The pool skill is available before `cult_in_the_hedges`; level 5 is reserved for post-slice content. Values are first-pass and must be exercised with `npm run balance:slice`-style simulation before promotion.

## Dependencies

| Depends on                                                                                 | For                                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [`../data-schema.md`](../data-schema.md)                                                   | Base `careers` fields, stat keys, conventions                                        |
| [`../runtime-data-plan.md`](../runtime-data-plan.md)                                       | Loader → Validator → Registry pipeline that will load `progression_tracks`           |
| Skill/effect system and combat-event contract (parallel workstream)                        | Skill ids in `unlock_skills`; future passives/talents; event envelope for run events |
| [`enemies-and-encounters.md`](enemies-and-encounters.md)                                   | `rewards.xp` / `rewards.items` as the XP and item source                             |
| [`../ui/hud-combat-event-integration-plan.md`](../ui/hud-combat-event-integration-plan.md) | Rendering of `xp_awarded`, `level_up`, `skill_unlocked`, `item_granted`              |

## Implementation sequence

1. **Types and examples (this change).** `class_def` and `progression_track` schemas, three classes and three tracks, cross-checked by `scripts/runtime-data-examples.test.mjs`.
2. **Schema promotion.** Add `role_tags` and `progression_track` to `careers`, add the `progression_tracks` collection and its reference/ordering rules to `data-schema.md`; move the records into `data/`; extend `scripts/data-content.test.mjs`.
3. **Godot data layer.** Extend `godot/scripts/data/career_definition.gd` with the new fields (replacing the draft `tiers` array) and add `godot/scripts/data/progression_track_definition.gd`; register both in the data runtime with reference validation.
4. **Progression service.** Replace the stub `add_xp` in `godot/scripts/progression/progression_service.gd` with a pure `apply_reward(progress, rewards) -> {progress, events}` that implements the formulas above and returns ordered run events.
5. **Screens.** Reward screen consumes `xp_awarded` / `item_granted`; Progression screen consumes `level_up` / `skill_unlocked` and shows derived stats from the formula (see the HUD plan).
6. **Combat hand-off.** Combat starts from `character_progress`: derived stats and `known_skills` feed the combatant; the resolver never reads tracks directly.
7. **Regression.** Re-run the slice flow with three careers; confirm the walkthrough levels above.

## Definition of done

- Every class has exactly one track; all references resolve; validation reports all errors at startup.
- `apply_reward` is deterministic and covered by tests for: no level-up, single level-up, multi-level-up from one reward, max-level cap, unlock + item grant ordering.
- Reward and Progression screens show XP, level, unlocked skills and stat changes exclusively from progression events and the formula — no hard-coded numbers.
- Combat uses derived stats and known skills of the current level; a level-2 Mercenary can use `rending_cut` in the next encounter.
- The first-playable flow and its existing tests still pass unchanged.

## Open decisions

| Decision                                                                                        | Recommendation                            | Owner / milestone                    |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------ |
| Is encounter `rewards.xp` the only XP source, with enemy `xp_reward` kept for authoring checks? | Yes; avoids double-counting               | Gameplay owner / promotion increment |
| Do HP/resources refill on level-up?                                                             | Refill to new max between encounters only | Gameplay owner / promotion increment |
| Final `max_level` for the first region                                                          | 5 until a second region exists            | Content owner / region increment     |
