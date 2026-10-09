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
