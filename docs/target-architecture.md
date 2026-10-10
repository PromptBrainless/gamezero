# Target Architecture

## Purpose and authority

Translate the [Vision Manifest](vision-manifest.md) into responsibility boundaries.
This is a target map, not evidence that all modules exist.
[`data-schema.md`](data-schema.md) owns canonical fields;
[`runtime-data-plan.md`](runtime-data-plan.md) owns loading/supplement direction;
[`combat-architecture.md`](combat-architecture.md) owns resolver/event separation.
The [slice plan](vertical-slice-implementation-plan.md) limits delivery scope.

## Layer model

```text
Authoring inputs → canonical definitions + approved runtime supplement
                              |
                    validation / export
                              |
                   read-only runtime registry
                              |
                 run setup → combat instance state
                              |
                   deterministic combat core
                              |
                      state + ordered events
                              |
                 run result consumption / presentation

Godot runtime host: load, wire, route, and render these boundaries.
It does not define a competing content model or ruleset.
```

| Layer | Owns | Does not own |
|---|---|---|
| Canonical content definitions | Stable IDs and static definitions in `data/` | Mutable HP, cooldowns, progress |
| Runtime supplement | Explicit versioned execution linkage where approved | Duplicate catalog fields or invented scope |
| Combat instance state | Per-fight actors, resources, effects, turn/seed state | Global definitions or session progression |
| Deterministic combat core | Legal actions/targets, previews, resolution, ordered events | Nodes, rendering, animation clocks |
| Run state | Career choice, encounter cursor, accumulated rewards, transition/reset policy | Damage resolution or content mutation |
| Presentation | HUD, selection intent, event playback, accessibility, feedback | Rule calculations or reward application |
| Godot runtime host | Registry boot, wiring, screen routing, resource loading | Alternative gameplay authority |
| Validation/export tooling | Readiness checks and reproducible runtime input | Silent repair or authoring generated output |

## Definitions and supplement

The seven current collections are careers, skills, statuses, items, enemies,
bosses, and encounters. Rewards remain inline. Registry access is read-only;
instances copy or reference definitions without mutating them.

The proposed `data/runtime/slice.json` is absent and has no approved executable
contract yet. Before adoption, specify version/content revision, allowed fields,
reference checks, consumers, and unsupported-version failure in
[`runtime-data-plan.md`](runtime-data-plan.md).
Stages, waves, dialogue, and unlock policies are not automatically in slice scope.

## Combat and run boundaries

Given validated records, an explicit seed/state, and action intent, the combat
core produces the next combat state and an ordered event sequence. Preview must
not mutate state. No wall clock, unseeded randomness, or animation callback may
decide gameplay. Repeat-seed/input tests should verify reproducibility.

Run flow consumes results once and advances the approved encounter sequence.
HP/resource carryover, defeat/retry, and timing policies require gameplay review
in the [decision queue](workstreams/README.md#decisions-and-blocked-work);
this architecture does not resolve them by adopting browser behavior.

## Presentation and host integration

Presenters request legal actions/targets and computed previews, emit intent,
and display state/events. They may change playback speed, not event ordering or
outcomes. Godot adapters wire these interfaces and route screens; `main.gd`
must not absorb validation, combat rules, and progression into one controller.

## Validation and export

Follow [`content-pipeline.md`](content-pipeline.md):
validate shapes/references, exercise supported behaviors, generate/copy
deterministically, load defensively, then test exported consumption.
Invalid input or unsupported versions block readiness visibly.
Generated bundles/copies are disposable build inputs, never authored sources.
An exported game must not depend on the checkout's parent directory.

## Implementation locations and current limits

[`workstreams/README.md`](workstreams/README.md) assigns WS01 data runtime,
WS02 combat, WS03 HUD, WS04 flow, WS05 art, and WS06 acceptance.
[`../godot/README.md`](../godot/README.md) maps native paths;
[`README.md`](README.md#where-outputs-belong) maps all outputs.
Browser reference code/tests are in `src/game/slice/`; presentation is in
`src/components/slice/`.

Existing Godot stubs and recorded initial increments do not establish complete
runtime, parity, or packaging. The supplement/export pipeline remains planned.
Historical ledger results must be checked against the current tree/environment.

## Testing and change discipline

- Content: valid/invalid shapes, IDs, ranges, references, unknown fields/versions.
- Combat: approved behaviors, non-mutating previews, deterministic replay, event ordering.
- Run: result identity, reward-once, next/finish/reset, reviewed failure policies.
- Presentation: legal intent wiring, readable responsive state, clean runtime behavior.
- Host/export: native boot, registry failures, packaged JSON, all encounters and repeat runs.

Keep tests in the owning suite and report blocked gates honestly.
Coordinate shared contract changes before parallel integration. Do not introduce
scene-authored gameplay, duplicated catalogs, silent fallbacks, or hidden UI rules.
Record decisions in their owners and cross-link [handoffs](workstreams/orchestration.md#repository-handoff-convention).
