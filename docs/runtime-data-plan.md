# Runtime Data Plan — Data Runtime Foundation

Track 1 of the first playable vertical slice. The schema in [`data-schema.md`](data-schema.md) is authoritative for all record shapes and field names.

## Principles

- Slice content is JSON under `data/`; game code consumes validated runtime records, not arbitrary JSON.
- Runtime pipeline: **Loader → Validator → Registry → Encounter Resolver**.
- Numeric values displayed by the HUD come from data or explicit runtime calculations.
- Invalid content reports all actionable errors together in development.
- No localization pipeline, editor, networking, or save/load is required for this slice.

## Data layout

```text
data/
  careers/
  skills/
  statuses/
  items/
  enemies/
  bosses/
  encounters/
```

Do not add separate `regions/` or `rewards/` directories, localization keys, or career `progression[]` until the schema and slice scope are explicitly changed.

## Components

| Component | Responsibility |
|---|---|
| `DataLoader` | Reads JSON entities by collection and reports parse errors with the file path. |
| `SchemaValidator` | Checks required/optional fields, types, enums, numeric ranges, unknown fields, and forbidden nulls against `data-schema.md`. |
| `ReferenceValidator` | Checks collection-local ID uniqueness, filename/ID agreement, and all cross-collection references. |
| `Registry<T>` | Read-only lookup by stable ID after successful validation. |
| `DataRuntime` | Owns loading, validation, and typed registries; exposes readiness and aggregated errors. |
| `EncounterResolver` | Resolves encounter enemy/boss, skills, statuses, and inline reward item references for combat and preview. |

## Validation gates

1. Parse every JSON file and require one entity per file.
2. Match filename stem and unique `lower_snake_case` `id`.
3. Reject fields or enum values not defined in `data-schema.md`; reject `null`.
4. Validate numeric ranges, including chances in `0.0–1.0` and durations/costs as specified.
5. Resolve career skills/items, skill careers/statuses, item/status effects, enemy and boss skills/loot, boss phase data, and encounter enemy/boss/reward references.
6. Verify boss phase thresholds are descending and begin at `1.0`; verify encounter order is unique.
7. Report all discovered errors in a stable, source-locatable format.

## Adopted content behaviors

The selected slice records use several optional fields that require explicit runtime consumers, not only structural validation:

- `skills.trigger` dispatches the `riposte` reaction after a melee hit.
- `skills.removes_statuses` clears listed statuses when `hold_the_line` or `quick_feint` resolves.
- Consumable `use.next_attack_bonus` applies the whetstone's bonus to the next attack.

These behaviors are part of the current content contract. The runtime track is not complete until each is validated and exercised; do not silently accept the fields while ignoring their effects.

## Delivery sequence

1. Lock the schema and a representative valid record per collection.
2. Implement loader and registries.
3. Add structural and reference validation with failure tests.
4. Resolve one normal encounter and the boss encounter.
5. Connect UI/combat consumers to resolved records.

## Done criteria

- Every in-scope data file loads and validates; broken data produces actionable aggregated errors.
- All cross-references resolve.
- The resolver returns complete combat/preview records for each encounter.
- Tests cover valid loading, malformed or invalid records, unresolved references, and encounter resolution.

## Implemented Godot handoff

`npm run data:godot` runs the shared `src/game/slice/validation.ts` validator
over all seven canonical collections and writes `godot/data/runtime_pack.json`.
The versioned envelope is `{schema_version: 1, collections: {...}}`; each
collection is a dictionary keyed by stable record ID. It contains no timestamp
or machine-specific path. Invalid source content prevents export; errors retain
the source filename and field. `npm run data:godot:check` rejects stale output.
The pack is a generated deployment artifact, not an independent authoring source.

Godot reads the pack from `res://data/runtime_pack.json`, rejects missing,
malformed, incompatible or disconnected content before career selection, and
resolves encounter IDs to normal enemies or bosses. The main controller owns the
run context; the resolver receives dictionaries detached from presentation.
The older `*_definition.gd` Resource sketches are not used by this JSON runtime.

`npm run test:slice` covers source validation, reference failures and export
reproducibility. `npm run test:godot` first checks pack freshness, then runs the
native combat and screen-flow tests. Import automation should author candidate
records in a staging area and pass these gates before replacing canonical files;
Drive downloads and raw assets must never bypass validation.
