# Runtime Data Plan — Data Runtime Foundation

Track 1 of the first playable vertical slice. See `vertical-slice-implementation-plan.md`.

## Principles
- JSON-first: all content (careers, skills, statuses, items, encounters, enemies, rewards) lives in JSON under `data/`. No content in scripts.
- Runtime layer: **Loader → Validator → Registry → Resolver**. Game code reads only from registries.
- Numbers-open: every value shown in UI (cost, cooldown, damage, chances) exists as a data field; UI never invents numbers.
- Fail fast: invalid data aborts loading in dev and reports every error at once.

## Scope
In: loader, schemas, validation, registries, encounter resolution, reward/progression data access.
Out: save/load, localization pipeline, editor tooling, content beyond the slice, networking.

## Data layout
```
data/
  careers/       one file per career (stats, starting skills, allowed items, progression track)
  skills/        active/passive skills
  statuses/      status effects
  items/         weapons, offhands, armor, trinkets, consumables
  enemies/       enemy and boss definitions (incl. intent patterns, phases)
  encounters/    encounter definitions
  rewards/       reward tables
```
Every record has: `id` (snake_case, unique per type), `name_key`, `description_key`, `tags[]`.

## Record fields (minimum)
- **Career**: `base_stats {hp, stamina, focus, guard, initiative}`, `starting_skills[]`, `starting_items[]`, `progression[]` (levels with `unlocks[]`, `stat_bonus{}`, `xp_required`).
- **Skill**: `action_type`, `cost {stamina, focus}`, `cooldown`, `range`, `target`, `hit_stat`, `damage {base, type}`, `status_applications[{status_id, chance, duration}]`, `conditional_bonuses[{tag, value}]`.
- **Status**: `kind` (negative/positive), `duration`, `max_stacks`, `stack_rule` (intensity/duration/refresh), `per_round_effect{}`, `stat_modifiers{}`, `removed_by[]`, `expires_on_combat_end`.
- **Item**: `slot`, `rarity`, `stat_modifiers{}`, `allowed_careers[]`, `granted_effects[]`, `value`.
- **Enemy**: `stats`, `skills[]`, `intent_pattern[]`, `telegraph_level`, optional `boss {phases[{hp_threshold, pattern, skills}], pattern_label}`.
- **Encounter**: `enemies[]`, `difficulty`, `reward_table_id`, `intro_key`.
- **Reward table**: `xp`, `currency`, `guaranteed_items[]`, `weighted_drops[{item_id, weight}]`.

## Components
| Component | Responsibility |
|---|---|
| `DataLoader` | Reads all JSON files per type directory; returns raw dictionaries; reports parse errors with file path. |
| `SchemaValidator` | Checks required fields, types, numeric ranges, enum values for each record type. |
| `ReferenceValidator` | After all types load, checks every cross-reference (skill ids, status ids, item ids, reward table ids) resolves; checks duplicate ids. |
| `Registry<T>` | Typed read-only lookup `get(id)`, `has(id)`, `all()`, `by_tag(tag)`; one registry per record type. |
| `DataRuntime` | Facade owning the loader, validators, and registries; single entry `DataRuntime.load()`; exposes `ready` and `errors`. |
| `EncounterResolver` | `resolve(encounter_id) → ResolvedEncounter` with fully expanded enemy, skill, status and reward records, ready for combat and preview. |

## Validation rules
1. Ids unique per type and snake_case.
2. All references resolve.
3. Numeric fields within range (chances 0–100, costs ≥ 0, cooldown ≥ 0, stacks ≥ 1).
4. Boss phase thresholds strictly descending, and the first phase starts at 100%.
5. Career `allowed_careers` on items refer to existing careers.
6. Weighted drops have weight > 0; reward tables are non-empty.
7. Each career has at least one starting skill that it can afford at base stats.

Error format: `[type/id] field: message (path)`.

## Slice content budget
2–3 careers, ~4 skills each, 6–8 statuses, ~12 items, 3 normal encounters, 1 boss encounter, 2 reward tables.

## Work items
1. Define schemas and sample data for each type (smallest valid example each).
2. Implement `DataLoader` and `Registry`.
3. Implement schema and reference validation with aggregated errors.
4. Implement `EncounterResolver`.
5. Unit tests: one valid load, one test per validation rule, resolver output for a normal and a boss encounter.
6. Author slice content to the budget above.

## Done criteria
- `DataRuntime.load()` succeeds on slice data and reports all errors on deliberately broken data.
- Each validation rule has a failing-case test.
- `EncounterResolver` returns complete records for every slice encounter; no UI or combat code reads JSON directly.
- Every number shown in the combat HUD and tooltips is derivable from resolved records.
