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

## Standalone Linux game

The `Linux` preset in `export_presets.cfg` embeds the canonical pack into one
x86_64 executable. Install the matching official Godot export templates, then:

```sh
npm run export:godot:linux -- /absolute/output/echo-bruch.x86_64
```

The exporter checks canonical data, stages source inputs in a fresh temporary
Godot project and rejects engine errors even if Godot exits 0. It never copies
editor caches, uploaded ZIPs or tests into that staging project. This avoids the
observed Godot 4.4.1 cached empty-dependency export error; source scripts and the
existing Linux preset remain unchanged. Matching templates and `GODOT`/PATH
are still required. The output directory is created when needed.
Run the executable without Node or the
checkout. On machines without Vulkan, use `--rendering-method gl_compatibility`.
The preset explicitly includes the native host, HUD/stage/theme and detached
combat scripts as well as the boot scene; keep that resource list current when
adding a native dependency. Tests and legacy save/inventory stubs are excluded.
`echo-bruch.x86_64 --headless -- --verify-packaged-boot` checks that packaged
content loads and career selection is ready, then exits with a success/failure
status. This is a boot check, not a full exported-game playthrough.
The [Native playable workflow](../.github/workflows/native-game.yml) validates
content/native tests, exports the game, checks packaged startup and uploads the
`echo-bruch-linux-x86_64` archive. An artifact is available only after that job
actually succeeds; Windows, Android and device acceptance are not implied.

## Native presentation

`scripts/ui/foundation/battle_stage.gd` draws the side-view arena and distinct
career/opponent silhouettes procedurally from detached presentation snapshots.
Its target clicks emit intents through the HUD; damage labels consume resolved
events and never change battle state. City/forest/gate treatments are display
choices, not gameplay metadata or final WS05 art approval.
Only `damage` events create damage labels; a preceding `status_tick` annotates
the same DoT hit and must not create a second number. Run
`npm run test:godot:feedback` to check this, event replay and reduced motion.

`npm run test:godot:balance` reproduces the starting-stat Duelist boss defeat
at seed 42 with an ordered native trace. A passing diagnostic means the failure
was reproduced, not that balance is fixed. The flow suite attempts all three
careers; it no longer stops after the first completed run. See the current
[acceptance record](../docs/mobile-first-playable-plan.md#2026-10-12-issue-sweep)
for separate automated, rendered, device and release gates.

Career cards and combat panels reflow between narrow and wide layouts.
Optional statistics and the ordered event log expand through focusable buttons.
The movement toggle disables event animation. Critical numeric meters, target
selection and confirmation remain textual and keyboard/touch accessible.
