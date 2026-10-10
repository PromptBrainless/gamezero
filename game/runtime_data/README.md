# Runtime Data Staging (`game/runtime_data/`)

Staged types and example records for the post-slice data model. Nothing here is loaded by the first playable slice; canonical slice content stays in [`data/`](../../data) and is governed by [`docs/data-schema.md`](../../docs/data-schema.md).

| Path                           | Contents                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `types/`                       | JSON Schema (2020-12 subset) per entity type; `common.schema.json` holds shared blocks (`id`, `base_stats`, `stat_delta`, `visual`, `loot_entry`, `rewards`) |
| `examples/classes/`            | `class_def` — the three slice careers plus `role_tags`, `progression_track`                                                                                  |
| `examples/progression_tracks/` | `progression_track` — level curve and unlocks per class                                                                                                      |
| `examples/enemies/`            | `enemy_def` — slice enemies plus `family`, `rank`                                                                                                            |
| `examples/bosses/`             | `boss_def` — slice boss plus `family`                                                                                                                        |
| `examples/stages/`             | `stage_def` — slot layout and presentation keys for former arena keys                                                                                        |
| `examples/encounters/`         | `encounter_def` — waves of spawns on a stage, victory rule, inline rewards                                                                                   |
| `examples/ui/`                 | `hud_event_binding` — event type → HUD modules, payload fields, log, pacing                                                                                  |

Planning documents: [`docs/final-data-entities/`](../../docs/final-data-entities/README.md) and [`docs/ui/hud-combat-event-integration-plan.md`](../../docs/ui/hud-combat-event-integration-plan.md).

## Conventions

- One entity per file, filename = `id`, collection = directory; same authoring rules as `data/`.
- Examples that share an id with a `data/` record must keep every slice field identical (they extend, never fork).
- Types only use the keywords supported by the validator in `scripts/runtime-data-examples.test.mjs`: `$ref`, `allOf`, `type`, `enum`, `required`, `properties`, `additionalProperties`, `items`, `minItems`, `uniqueItems`, `pattern`, `minLength`, `minimum`, `maximum`, `exclusiveMinimum`. Unsupported keywords fail the test.

## Validate

```sh
node --test scripts/runtime-data-examples.test.mjs   # also part of npm test
```
