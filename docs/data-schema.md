# Game Data Schema v0.1

This document defines the JSON contract for the first playable content slice.
Each file in `data/<kind>/` contains one UTF-8 JSON object whose `id` matches
the filename without its `.json` extension. IDs are permanent, lowercase
`snake_case` keys; display names and player-facing text may change without
changing IDs.

## Conventions

- Store data as plain JSON with two-space indentation and no comments.
- Use English for stable IDs and player-facing text in this initial slice.
- Use integers for health, resource costs, durations, quantities, and base
  damage. Multipliers are decimal numbers.
- A successful skill hit rolls a d20 and compares it with the target's evasion
  as described below. Damage is calculated as
  `base + floor(attacker[scaling_stat] * scaling)`, then outgoing and incoming
  multipliers are applied and rounded down. Finally subtract
  `floor(target.resolve / 4)` and flat damage reductions; damage cannot fall
  below 1.
- References are IDs, not file paths. An array of references is resolved from
  the matching `data/<kind>/` directory.
- Durations count the target's turns unless an effect says otherwise. A status
  applied during a turn does not consume a duration tick until the next stated
  trigger.
- A skill's `duration_turns` overrides the status's default duration. Item
  status applications use the status's default duration.
- `null` means a mechanic is intentionally absent. Do not add empty objects,
  sample values, or unfinished entries.
- Content is descriptive and engine-neutral: `animation_key`, `icon_key`, and
  tags are stable hooks for Godot resources and runtime systems.

## Shared identity

Every record requires:

| Field  | Type   | Meaning                                                  |
| ------ | ------ | -------------------------------------------------------- |
| `id`   | string | Stable `snake_case` identifier; must match the filename. |
| `name` | string | Player-facing display name.                              |

## Careers (`data/careers/`)

Career records require `id`, `name`, `role`, `description`, `base_stats`,
`passive`, `starting_skills`, and `weapon_tags`.

- `role`: short combat identity.
- `description`: concise player-facing explanation.
- `base_stats`: `health`, `resource`, `might`, `finesse`, `intellect`, and
  `resolve`; health/resource are maxima, `resolve` reduces incoming damage, and
  the remaining values are attributes.
- `passive`: `{ id, name, trigger, effect }`; `effect` is a structured object
  with a handler `operation` and numeric parameters, not flavor text. Initial
  handlers are `restore_resource_once_per_turn_on_damage_threshold`
  (`threshold`, `amount`), `restore_resource_once_per_turn_on_miss` (`amount`),
  and `restore_resource_once_per_turn_on_status` (`amount`).
- `starting_skills`: skill IDs available at the start of a run.
- `weapon_tags`: weapon categories the career can equip.

## Skills (`data/skills/`)

Skill records require `id`, `name`, `career_id`, `category`, `resource_cost`,
`cooldown_turns`, `target_type`, `range`, `hit_check`, `damage`, `effects`,
`animation_key`, `ai_tags`, and `tooltip`.

- `category`: `attack`, `defense`, or `spell`.
- `career_id` identifies the career that teaches/owns the skill. Enemies and
  bosses may reference these skills to reuse the same mechanics.
- `target_type`: `enemy`, `self`, or `ally`.
- `range`: integer in tiles; `0` means self-only.
- `hit_check`: `{ attribute, target_stat, modifier }` or `null` for a
  self-targeting skill. A hit succeeds when
  `d20 + attacker[attribute] + modifier >= target[target_stat]`.
- `damage`: `null` for a non-damaging action; otherwise
  `{ type, base, scaling_stat, scaling }`. On a hit, damage is
  `base + floor(attacker[scaling_stat] * scaling)` before mitigation. Damage
  types used in this slice are `physical` and `fire`.
- `effects`: an array of `{ status_id, chance, duration_turns, stacks }`.
  Chance is from `0` to `1`; effects are attempted only after a successful hit.
- `animation_key`: stable animation lookup key.
- `ai_tags`: tactical intent labels used by enemy decision logic.
- `tooltip`: player-facing summary consistent with the mechanics above.

## Statuses (`data/statuses/`)

Status records require `id`, `name`, `category`, `duration_turns`, `stacking`,
`effects`, `cleanse_tags`, `icon_key`, and `description`.

- `category`: `harmful` or `beneficial`.
- `stacking`: `{ policy, max_stacks }`; policy is `refresh`, `strongest`, or
  `stack`, with a positive integer maximum.
- Each effect is `{ trigger, operation, value, damage_type }`. Supported
  operations in this slice are `damage`, `skip_action`, `reduce_incoming_damage`,
  `multiply_outgoing_damage`, and `multiply_incoming_damage`. `damage_type` is
  `null` unless the effect deals damage.
- Triggers used here are `turn_start`, `on_damage_dealt`, and
  `on_damage_received`. `damage` deals `value` per stack; `skip_action` skips
  `value` actions; `reduce_incoming_damage` subtracts `value` from each hit;
  the two multiply operations scale damage by `value`.
- `cleanse_tags`: item/ability cleanse categories that remove the status.
- `icon_key`: stable UI resource key.

## Enemies (`data/enemies/`)

Enemy records require `id`, `name`, `archetype`, `description`, `stats`,
`skills`, `ai_profile`, `rewards`, and `tags`.

- `stats`: `health`, `resource`, `might`, `finesse`, `intellect`, `resolve`,
  and `evasion`. Resolve reduces incoming damage; evasion is the target number
  used by skill hit checks.
- `skills`: skill IDs available to this enemy.
- `ai_profile`: `{ preferred_range, behavior, telegraph }`; `behavior` is a
  readable tactical rule, and `telegraph` names the warning style shown before
  a committed attack.
- `rewards`: `{ experience, item_drops }`; each drop is
  `{ item_id, quantity, chance }`.
- `tags`: search/filter labels.

## Bosses (`data/bosses/`)

Bosses use the enemy fields and add `phases`. Each phase requires
`id`, `health_threshold`, `description`, and `skill_weights`. Thresholds are
descending percentages (`100` through `1`); a phase begins once health is at or
below its threshold. Each skill weight is `{ skill_id, weight }` with a
positive integer weight.

## Items (`data/items/`)

Item records require `id`, `name`, `category`, `rarity`, `target_type`,
`effect`, `uses`, `value`, `description`, and `tags`.

- `category`: `consumable` or `combat_tool`.
- `rarity`: `common`, `uncommon`, or `rare`.
- `target_type`: `self` or `enemy`.
- `effect`: `{ operation, value, status_id, damage_type }`; supported operations in this
  slice are `heal`, `restore_resource`, `deal_damage`, `apply_status`,
  `remove_status`, and `bonus_damage_next_attack`. Unused `status_id` is `null`.
  `damage_type` is required and is `null` except for `deal_damage`.
- For `heal`, `restore_resource`, `deal_damage`, and
  `bonus_damage_next_attack`, `value` is the amount. For `apply_status`, it is
  the number of stacks to apply; for `remove_status`, it is the number of
  stacks to remove (up to all existing stacks). `apply_status` uses the
  status's default duration.
- `uses`: number of uses granted when acquired.
- `value`: integer shop value in silver.

## Encounters (`data/encounters/`)

Encounter records require `id`, `name`, `region`, `description`, `difficulty`,
`recommended_careers`, `waves`, `rewards`, and `tags`.

- `difficulty`: integer from `1` to `5`.
- `recommended_careers`: career IDs suggested, not required, for the encounter.
- `waves`: ordered list of `{ enemies, boss_id }`; `enemies` is a list of
  `{ enemy_id, quantity }`, and `boss_id` is an ID or `null`. A boss wave must
  not also list regular enemies.
- `rewards`: `{ experience, item_drops }`, using the same drop shape as enemies.
- `tags`: search/filter labels.

## Cross-reference and content checks

All IDs referenced by careers, skills, enemies, bosses, items, and encounters
must resolve to a file in the corresponding folder. Every skill's career and
status effect, every reward drop, each boss phase skill, and every encounter
roster/recommendation must resolve. This keeps the text data loadable and
reviewable without baking runtime-specific resource paths into content.
