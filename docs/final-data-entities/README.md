# Final Data Entities — Post-Slice Planning

This folder plans the **final runtime data model** that grows out of the first playable slice. It sits one layer above the skill/effect system and the combat-event contract and does **not** change the slice contract: [`../data-schema.md`](../data-schema.md) and the records under `data/` stay authoritative for the first playable build.

| Document                                                                                   | Owns                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| [`classes-and-progression.md`](classes-and-progression.md)                                 | Classes (careers), level curves, unlocks, run progression state          |
| [`enemies-and-encounters.md`](enemies-and-encounters.md)                                   | Enemies, bosses, stages, encounters and waves                            |
| [`../ui/hud-combat-event-integration-plan.md`](../ui/hud-combat-event-integration-plan.md) | How the HUD and Reward/Progression screens consume combat and run events |

## Staging area

Types and examples for these entities live in [`game/runtime_data/`](../../game/runtime_data/README.md):

```text
game/runtime_data/
  types/                 JSON Schema (2020-12 subset) per entity type + common.schema.json
  examples/
    classes/             class_def            (superset of data/careers)
    progression_tracks/  progression_track
    enemies/             enemy_def            (superset of data/enemies)
    bosses/              boss_def             (superset of data/bosses)
    stages/              stage_def            (replaces encounter.arena keys)
    encounters/          encounter_def        (waves; migrates data/encounters)
    ui/                  hud_event_binding
```

`scripts/runtime-data-examples.test.mjs` (part of `npm test`) validates every example against its type, resolves references against the canonical `data/` records, and fails if a staged record drifts from the slice record it extends.

## Rules

1. **Superset, not replacement.** A staged type keeps every field of the slice entity it extends with the same meaning; it only adds fields. Existing ids are never renamed.
2. **Same conventions as the slice.** One entity per file, filename = `id`, `lower_snake_case` ASCII ids, omit optional fields instead of `null`, German display text, numbers in fields — see [`../data-authoring-rules.md`](../data-authoring-rules.md).
3. **Promotion.** A staged entity becomes canonical only through a Post-Slice Expansion increment ([`../milestones.md`](../milestones.md)) that, in one change: adds the fields to `data-schema.md`, moves records into `data/<collection>/`, extends the runtime validator/registry, and keeps the slice regression tests green.
4. **Event names are provisional** until the combat-event contract is merged; the HUD binding file is the single place to rename them.
