# Data Schema (v0.1)

Practical content data model for the planned Godot game. Content lives in `data/<type>/<id>.json`, one file per entry. JSON is used because it is easy to review in Git and easy to load in Godot (`JSON.parse_string`) or convert to `.tres` Resources later.

## General rules

- **One entry per file**; filename (without `.json`) **must equal** the `id`.
- **IDs**: `lower_snake_case`, ASCII only, unique within their type, stable once released (never rename; deprecate instead). References between files use IDs only.
- **Display text** (`name`, `description`, `title`) is German source text and may contain umlauts. Keep it separate from `id`.
- **Field names**: `lower_snake_case`. Percentages/chances are floats `0.0–1.0`; multipliers are floats (`0.6` = 60 %).
- **Required** fields must be present; **optional** fields may be omitted (loader supplies the default listed).
- Unknown fields must be ignored by loaders so the schema can grow.
- Damage is always shown to the player with its calculation (nerdy HUD): every damage source exposes the components below.

Shared damage formula (display and runtime):
`damage = max(1, flat + scaling_stat × multiplier − target_defense)` × status multipliers (e.g. `guarded` 0.6).

Shared stat block (`base_stats`): `hp`, `attack`, `defense`, `magic`, `speed`, `crit_chance` (required); `focus`, `stamina` (optional, default 0; used by playable careers).

## careers (`data/careers/`)

Playable role. Required: `id`, `name`, `role`, `description`, `base_stats`, `stat_growth` (per level, same keys as stats), `starting_skills` (skill ids), `skill_pool` (all learnable skill ids), `starting_items` (item ids), `reaction` (`brace` | `parry` | `ward`). Optional: `visual` (`silhouette`, `accent_color` hex).

## skills (`data/skills/`)

Required: `id`, `name`, `type` (`attack` | `defense` | `control` | `reaction`), `cost` (object with `stamina`/`focus`, may be empty), `cooldown` (turns), `target` (`enemy` | `self`), `description`. Optional: `career` (career id or `null` for enemy-only skills), `damage` (`damage_type`, `scaling_stat`, `multiplier`, `flat`, `formula`), `applies_statuses` (list of `{status, chance, duration, target?}`; `target` defaults to the skill target), `tags`.

## statuses (`data/statuses/`)

Required: `id`, `name`, `kind` (`buff` | `debuff`), `default_duration` (turns), `max_stacks`, `effect` (object of modifiers: e.g. `damage_per_turn_per_stack`, `skip_turn`, `damage_taken_multiplier`, `<stat>_modifier`), `description`. Optional: `tick` (`turn_start` default | `turn_end`), `icon_shape` (HUD icons use shape, not just color).

## enemies (`data/enemies/`)

Required: `id`, `name`, `role`, `tier`, `base_stats`, `skills`, `description`. Optional: `weaknesses`/`resistances` (damage types), `ai` (`pattern` + `weights` per skill), `loot_table` (`{item, chance}`), `xp_reward`, `visual`.

## bosses (`data/bosses/`)

Same as enemies plus: `title`, `phases` (required, ordered by descending `hp_threshold`). Phase: `id`, `name`, `hp_threshold` (fraction of max HP at which it begins; first phase is `1.0`), `skills`; optional `telegraphs` (`{skill, warning_turns, icon}`) and `on_enter` (list of `{apply_status, duration, target}` or `{stat_modifier}`). Bosses use the HD dark-fantasy visual tier (`visual.art_quality`).

## items (`data/items/`)

Required: `id`, `name`, `slot` (`weapon` | `offhand` | `armor` | `trinket` | `consumable`), `rarity` (`common` | `uncommon` | `rare`), `stat_modifiers` (may be empty), `description`. Optional: `career_tags`, `value`, `effects`, `use` (consumables: `heal_hp`, `restore_focus`, `removes_statuses`, `applies_statuses`, `stackable`, `max_stack`).

## encounters (`data/encounters/`)

Required: `id`, `name`, `type` (`tutorial` | `standard` | `boss`), `order` (sequence in the vertical slice), `enemies` (enemy ids; boss ids for `boss` type), `difficulty` (1–5), `arena`, `rewards` (`xp`, `items`), `description`.

## Vertical slice (v0.1)

3 careers (`mercenary`, `duelist`, `scholar_mage`), 8 skills, 6 statuses, 3 enemies, 1 boss (`iron_captain`), 11 items, 4 encounters. Referential integrity (all referenced ids exist) is a requirement for future loaders and validation.
