# Godot runtime host

Godot 4.4+ is the target, not a second content authoring system. The slice host
connects combat/run screens using generated canonical data; implementation alone
is not native acceptance. Legacy Resource stubs are not a second schema.
Start with [`../docs/target-architecture.md`](../docs/target-architecture.md)
and the full relevant [workstream brief](../docs/workstreams/README.md).

| Owner | Placement |
|---|---|
| WS01 validated data/registries | `scripts/data/runtime/` |
| WS02 detached combat contracts/rules | `scripts/combat/contracts/`; coordinate resolver changes in `scripts/combat/` |
| WS03 presentation | `scripts/ui/foundation/`, `scenes/ui/foundation/` |
| WS04 in-memory run flow | `scripts/progression/slice/`, `scenes/flow/` |
| WS05 approved visual assets | `assets/`; preparation/review remains in `../artifacts/art/sprint-1/` |
| WS06 native tests and host integration | `tests/`; shared `scripts/core/`, boot scenes, project/export changes only after interface review |

These are intended ownership paths, not a claim that each increment exists.
Coordinate shared writes; do not revive save/inventory stubs as approved slice features.

Definitions originate in `../data/`. Do not author gameplay in `data/` here or
copy canonical definitions into scenes/Resources. The host loads the committed,
validated generated `data/runtime_pack.json` (`npm run data:godot`).
The optional `data/content_bundle.json` (`npm run data:export:godot`) includes
the isolated supplement; its `ContentRegistry` bridge is not wired into boot.
Packaging must work without parent-directory access in an
exported game; see [`../docs/content-pipeline.md`](../docs/content-pipeline.md).
Development inventory checks in `tests/canonical_inventory.gd` are not export proof.

Keep combat state/rules independent of Nodes and animation timing. Presenters emit
intent and consume legal actions, previews, state, and ordered events. Run flow owns
progress/reward consumption, not the HUD or immutable content registry.

Put native regression tests in `tests/` and retain the exact invocation/results in
the [handoff](../docs/workstreams/orchestration.md#repository-handoff-convention).
Use the command contract in `tests/canonical_inventory.json` for that check.
Missing Godot means native checks are blocked/unverified, not passed.
Do not commit `.godot/` caches or exported builds as source.
