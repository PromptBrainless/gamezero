# Data Schema (first playable slice, v1.0)

Canonical definition of the JSON content used by the first playable vertical slice. It documents the **shape actually used by the slice content under `data/`** (PR #5), takes conventions and validation strictness from `data-authoring-rules.md` (PR #7) and is shaped so the Loader → Validator → Registry → Resolver pipeline in `runtime-data-plan.md` (PR #8) can consume it. Where those sources disagreed, this file decides (see [Normalized names](#normalized-names)).

## Conventions

- JSON, UTF-8, 2-space indent. **One entity per file**: `data/<type>/<id>.json`, where `<type>` is the plural collection name below.
- `id`: `lower_snake_case`, ASCII, unique within its type, equal to the filename stem. Never rename a released id.
- The collection is given by the directory. Records carry **no** `type`-as-collection field; the `type` field that exists on `skills` and `encounters` is a *category* of that entity (see below).
- Cross-references use ids only.
- Display text (`name`, `description`, `title`) is German source text and may contain umlauts. Ids stay ASCII.
- Field names are `lower_snake_case`. Chances are floats `0.0–1.0`. Multipliers are floats (`0.6` = 60 %). Counts, stats, costs, cooldowns and durations are integers.
- **Optional fields are omitted, never `null`.** Allowed JSON values: strings, numbers, booleans, arrays, objects.
- Loaders treat **unknown fields as errors in dev** (typos must not pass silently); a field becomes valid only by being added to this file.
- Every number shown in the HUD must exist as a data field (numbers-open); no mechanics only in `description`.

Damage formula (display and runtime):
`damage = max(1, flat + scaling_stat × multiplier − target_defense)`, then multiplied by status modifiers (e.g. `guarded` → `damage_taken_multiplier` 0.6). `formula` strings in data are documentation only; the runtime uses the numeric fields.

## Slice entity types

| Collection | In slice | Notes |
|---|---|---|
| `careers` | yes | playable roles |
| `skills` | yes | player and enemy skills |
| `statuses` | yes | buffs / debuffs |
| `items` | yes | equipment and consumables |
| `enemies` | yes | normal enemies |
| `bosses` | yes | **own type** (phases, telegraphs) |
| `encounters` | yes | ordered fights; rewards are inline |
| `regions`, `rewards/`, localization keys, career progression tracks | **no** | deferred, see [Out of scope](#out-of-scope) |

## Shared blocks

**`base_stats`** — required: `hp`, `attack`, `defense`, `magic`, `speed`, `crit_chance` (float). Optional (default 0): `focus`, `stamina` (resource pools, used by playable careers).

**`visual`** (optional) — `silhouette` (string), `accent_color` (hex `#rrggbb`); bosses add `art_quality`.

**`damage`** (optional on skills; omit for non-damaging skills) — required: `damage_type`, `scaling_stat` (`attack` | `magic`), `multiplier`, `flat`. Optional: `formula` (documentation string).

**`applies_statuses[]`** entry — required: `status` (status id), `duration` (turns ≥ 1). Optional: `chance` (default `1.0`), `target` (`self` | `enemy`; default = the skill's `target`).

**`loot_table[]`** entry — `item` (item id), `chance` (0.0–1.0).

## careers

Required: `id`, `name`, `role`, `description`, `base_stats`, `stat_growth` (per level, same keys as `base_stats`, ints; `crit_chance` not required), `starting_skills` (skill ids, ≥ 1), `skill_pool` (all learnable skill ids, must contain every starting skill), `starting_items` (item ids), `reaction` (`brace` | `parry` | `ward`).
Optional: `visual`.

## skills

Required: `id`, `name`, `type` (`attack` | `defense` | `control` | `reaction`), `cost` (object with optional `stamina` / `focus` ints; `{}` means free), `cooldown` (turns ≥ 0), `target` (`enemy` | `self`), `description`.
Optional: `career` (career id; **omit for enemy/boss-only skills**), `damage`, `applies_statuses`, `tags` (strings), `trigger` (`after_melee_hit` for the current reaction skill), `removes_statuses` (status ids removed by the skill).
Rule: a skill has at least a `damage` or an `applies_statuses` entry.

## statuses

Required: `id`, `name`, `kind` (`buff` | `debuff`), `default_duration` (turns ≥ 1), `max_stacks` (≥ 1), `effect` (object, see below), `description`.
Optional: `tick` (`turn_start` default | `turn_end`), `icon_shape` (HUD icons use shape, not color alone).

`effect` keys in use: `damage_per_turn_per_stack`, `damage_type`, `ignores_defense`, `skip_turn`, `damage_taken_multiplier`, `<stat>_modifier` (e.g. `speed_modifier`, `defense_modifier`, `magic_modifier`), `crit_chance_bonus`, `crit_chance_taken_bonus`, `stamina_regen_multiplier`. New keys require an addition here and runtime support.

## items

Required: `id`, `name`, `slot` (`weapon` | `offhand` | `armor` | `trinket` | `consumable`), `rarity` (`common` | `uncommon` | `rare`), `stat_modifiers` (object keyed by stat name; `{}` allowed), `description`.
Optional: `value` (int), `career_tags` (career ids allowed to use it; omitted = anyone), `effects` (list of single-key modifier objects, e.g. `{"magic_damage_taken_multiplier": 0.9}`), `use` (consumables only): `heal_hp`, `restore_focus`, `removes_statuses` (status ids), `applies_statuses` (entries as above, `chance` optional), `stackable`, `max_stack`.

## enemies

Required: `id`, `name`, `role`, `tier` (int ≥ 1), `base_stats`, `skills` (skill ids, ≥ 1), `description`.
Optional: `weaknesses` / `resistances` (damage types), `ai` (`pattern`, `weights` keyed by skill id and covering only the enemy's `skills`), `loot_table`, `xp_reward` (int), `visual`.

## bosses

Same fields as enemies, plus required `title` and `phases` (ordered by strictly descending `hp_threshold`; first is `1.0`). Boss `skills` is not top-level; each phase lists its own.
Phase — required: `id`, `name`, `hp_threshold` (fraction of max HP at which it begins), `skills` (skill ids). Optional: `telegraphs` (`{skill, warning_turns, icon}`), `on_enter` (list of `{apply_status, duration, target}` or `{stat_modifier: {<stat>: int}}`; omit instead of `[]`).
`visual.art_quality` is expected for bosses.

## encounters

Required: `id`, `name`, `type` (`tutorial` | `standard` | `boss`), `order` (int, unique, run sequence), `enemies` (enemy ids; for `boss` encounters boss ids), `difficulty` (1–5), `arena` (string key), `rewards` (`xp` int, optional `items` list of item ids), `description`.

## References and validation

| From | Field | Must resolve to |
|---|---|---|
| career | `starting_skills`, `skill_pool` | skills (with matching `career`) |
| career | `starting_items` | items (`career_tags` absent or containing the career) |
| skill | `career` | careers |
| skill | `applies_statuses[].status` | statuses |
| skill | `removes_statuses` | statuses |
| status / item | `removes_statuses`, `use.applies_statuses[].status` | statuses |
| enemy | `skills`, `ai.weights` keys | skills |
| boss | `phases[].skills`, `telegraphs[].skill`, `on_enter[].apply_status` | skills / statuses |
| enemy / boss | `loot_table[].item` | items |
| encounter | `enemies` | enemies (or bosses for `type: boss`) |
| encounter | `rewards.items` | items |

Validation (runs at startup, reports **all** errors as `[type/id] field: message (path)`):

1. Valid JSON; filename equals `id`; ids snake_case and unique per type.
2. Required fields present and typed; enum values valid; unknown fields rejected; no `null`.
3. All references in the table above resolve.
4. Ranges: chances 0.0–1.0, costs ≥ 0, cooldown ≥ 0, `max_stacks` ≥ 1, durations ≥ 1, `difficulty` 1–5, `hp_threshold` in (0, 1].
5. Boss phase thresholds strictly descending, first phase `1.0`.
6. Encounter `order` unique; every career has a starting skill affordable at base stats.
7. `data-authoring-rules.md` quality rules (no placeholders, balance bounds) are checked in review.

## Normalized names

Competing names from earlier drafts and their canonical form:

| Draft name (source) | Canonical |
|---|---|
| `applies` (PR #7) | `applies_statuses` |
| `duration_default` (PR #7) | `default_duration` |
| status `effects[{stat, op, value}]` (PR #7) | `effect` object |
| `hp_threshold_pct` (PR #7), 0–100 | `hp_threshold`, 0.0–1.0 |
| `allowed_careers` (PR #8), `career_tags` | `career_tags` |
| `base_stats` keys `guard` / `power` / `initiative` (PR #7/#8) | `defense` / `attack` / `speed` |
| `stats` on enemy (PR #8) | `base_stats` |
| `name_key` / `description_key` (PR #8) | `name` / `description` (no localization in slice) |
| `reward_table_id`, `rewards/` (PR #8) | inline `rewards` on encounter, `loot_table` on enemy/boss |
| percentages 0–100 (PR #7/#8) | floats 0.0–1.0 |
| `type: "career"` etc. inside records (PR #7) | removed; collection = directory |
| `damage: null`, `career: null` (PR #5 data) | omit the field |
| `type` on skill / encounter | kept as *category* (not the collection) |
| `skill.range`, `skills[].target: ally` (PR #7) | not in slice |

## Out of scope

Regions, reward tables as separate files, career progression tracks (`progression[]`), localization keys, save data. Add them here first, with runtime support, before authoring content for them.
