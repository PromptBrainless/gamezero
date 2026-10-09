# Data Schema

## Conventions
- JSON-first, UTF-8, 2-space indent. **One file per entity**, path `data/<type>/<id>.json`.
- `id`: snake_case, equals filename stem, unique within its type.
- Every file has `id`, `type`, `name`, `description`. Cross-references use ids only. All numbers are integers unless noted; percentages are integers 0–100.
- Types: `careers`, `skills`, `statuses`, `bosses`, `regions`, `encounters`, `items`.

## careers
`id, type:"career", name, description, role, skills[skill ids], base_stats{hp, guard, focus, power, speed}`

## skills
`id, type:"skill", name, description, career (career id or "general"), cost{focus}, cooldown, target ("enemy"|"ally"|"self"), range ("melee"|"ranged"), damage{base, scaling, element?}, applies[{status, chance, duration}], removes[status ids]`

## statuses
`id, type:"status", name, description, kind ("buff"|"debuff"|"dot"|"control"), duration_default, stacking ("refresh"|"stack"|"none"), max_stacks, effects[{stat, op ("add"|"mul"), value}], tick_damage?`
Core statuses include `bleed, marked, stunned, weakened`; the expansion adds `poison, terrified, focused, broken_armor`.

## bosses
`id, type:"boss", name, description, region, base_stats, phases[{id, name, hp_threshold_pct, skills[], statuses_on_enter[], guard_modifier}]`

## regions
`id, type:"region", name, description, role ("start"|"arcane"|"hunter"), mood[], enemies[enemy/encounter ids], bosses[boss ids], loot_theme, visual_accent`

## encounters
`id, type:"encounter", name, region, enemies[ids], boss?`

## Validation
IDs resolve; filename equals id; no unknown fields; numbers within range; every skill's career exists; every boss phase thresholds descend from 100.
