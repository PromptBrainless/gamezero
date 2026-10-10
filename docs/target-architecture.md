# Technical Target Architecture

## Purpose and status

This is the technical north star for the [Vision Manifest](vision-manifest.md).
It preserves the [combat boundary](combat-architecture.md) and the
[Loader → Validator → Registry → Encounter Resolver](runtime-data-plan.md) model.
It does not replace the [canonical schema](data-schema.md) or
[first-playable scope](vertical-slice-implementation-plan.md).

**Current:** canonical JSON and browser slice reference code/tests exist under
`data/` and `src/game/slice/`. The Godot slice host loads the generated canonical
`runtime_pack.json` and connects combat/run screens. Native acceptance still
requires engine execution. The [runtime supplement design](final-runtime-data-design.md),
`data/runtime/slice.json`, validator, and `data:check` / `data:export:godot`
scripts now exist as an isolated versioned bundle path. Its `ContentRegistry`
bridge is not wired into the slice host and does not establish full runtime validation.
**Target:** reviewed supplement policy/consumers, independently tested native rules,
defensive loading, and exported-game acceptance.

## Layer model

The host encloses execution responsibilities; it is not a higher source of gameplay
truth. Arrows below show consumption and intent/result exchange, not permission for
presentation to rewrite lower layers.

```text
AUTHORING / BUILD TIME
 [Canonical content definitions] + [Runtime supplement: target]
                         |
              [Validation / review / export]
                         |
               [Generated bundle: target]
                         v
GODOT RUNTIME HOST (target integration)
+----------------------------------------------------------------+
| Loader -> Validator -> Read-only Registry -> Encounter Resolver |
|                              |                                 |
|                         Run coordinator                        |
|                         owns RUN STATE                         |
|                              | setup / approved result         |
|                   Deterministic combat rules                   |
|                   own COMBAT INSTANCE STATE                    |
|                              ^             |                   |
|                         action intents     | state / events    |
|                              |             v                   |
|                     PRESENTATION LAYER                         |
|                screens / HUD / event playback                  |
+----------------------------------------------------------------+
```

### 1. Canonical content definitions

**Owns:** static careers, skills, statuses, items, enemies, bosses, and encounters
in `data/<collection>/<id>.json`. The schema owns field shapes, numeric values,
reference rules, and supported effects. Encounter order and inline rewards are
already canonical fields; do not copy them into a second catalog.

**Boundary:** immutable after validation. No current HP, inventory quantities,
cooldown counters, scene nodes, or display-layout state. Godot `.tres` files and
legacy Resource classes are not an alternative authored source.

### 2. Runtime supplement

**Owns, once approved:** execution metadata not represented by the base schema,
such as unlock policy, explicit targeting selection, status-lifecycle policy,
archetype/stage/wave structure, or dialogue hooks. Only approved, needed entries
belong here; the examples do not expand the first slice.

**Boundary:** read-only configuration, not combat instance state or run state.
It references canonical IDs and must not override base stats, skill costs, encounter
order, or inline rewards. Existing canonical targeting/effect fields remain in place.
Lifecycle metadata parameterizes reviewed rules; it is not arbitrary executable code.

The [runtime-data design](final-runtime-data-design.md) specifies the supplement's
shape, location, version and build-time reference validation. Integration still
requires gameplay-owner review of policy and coordinated consumers. Do not add
fields to canonical records or invent UI defaults to fill gaps.

### 3. Validation, export, and registry bridge

**Owns:** parsing, structural/range checks, ID/reference integrity, compatibility
checks, and resolved read-only records. Preserve source-locatable aggregated errors.
Gameplay starts only after readiness succeeds.

The target export produces a reproducible bundle from validated definitions and the
approved supplement. Sort collections and IDs deterministically; exclude machine-local
paths and variable timestamps from authoritative payloads. Record contract version
separately from content revision so hosts can reject incompatible contracts and
tests can pin an exact content set. These are target requirements, not existing fields.

Godot loading validates the bundle envelope and supported contract before exposing
registry lookups. Build validation does not justify trusting malformed runtime input.
The registry performs lookup; the encounter resolver joins definitions; neither
decides damage, consumes rewards, or advances a run.

### 4. Deterministic combat rules and combat instance state

**Owns:** action legality, legal targets, non-mutating previews, action resolution,
approved costs/effects/status behavior, seeded randomness, ordered events, and result.

Combat instance state contains actor instance identities, definition references,
current HP/resources, cooldowns, active effect durations/stacks, turn/phase information,
battle-local consumables, and RNG state. Distinct spawned actors need distinct
instance IDs even if they share one enemy definition. The current reference model
is not evidence that arbitrary repeated spawns or waves are already supported.

The target contract is:

```text
validated records + combat instance state + seed/RNG state + ordered intent
    -> legality check -> resolution -> next state + ordered events + result
```

Given the same inputs and content revision, outcomes and event ordering must agree.
No wall clock, animation callback, scene traversal order, or unseeded host randomness
may decide a combat result. The implementation may use controlled mutation internally,
but must not mutate definition records or alias state between battles.

Events carry sequence, type, turn, applicable actor IDs, and typed payloads. Preview
uses the same approved rule interpretation without advancing state or RNG; it must
not promise a guaranteed outcome when the rules provide only a chance. Event variants
and lifecycle/rounding policies require WS02 review rather than invention here.

### 5. Run state and session flow

**Owns:** selected career, ordered encounter cursor, accumulated XP/items, approved
progression choices, and next/finish/reset navigation. It survives between encounters
within an in-memory run, not necessarily across application restarts.

The run coordinator creates combat instances from resolved records and approved
carryover policy, then consumes each terminal combat result once. Replaying animations,
returning to a reward screen, or retrying a view must not grant rewards twice.
Between-encounter HP/resources, defeat/exit/retry behavior, and progression formulas
remain gameplay-owner decisions; do not infer them from a screen route.

Combat is short-lived; run state spans battles; canonical definitions and the runtime
supplement span runs. Savegames are a post-slice possibility, not part of this contract.

### 6. Presentation layer

**Owns:** screens, HUD, focus/selection affordances, tooltips, animation, accessibility,
and event playback. It displays resolved values and submits intents using actor/action
IDs. The rules core validates those intents again.

Presentation-local state includes selected widgets, open help, animation progress,
and playback cursor. It can pause or accelerate feedback, but must preserve event
order and cannot apply damage, consume items, award XP, or unlock actions independently.
Stage geometry is visual unless an approved rule explicitly defines gameplay meaning.

### 7. Godot runtime host

**Owns:** boot, resource access, adapters, controller lifecycle, input routing,
screen transitions, error surfaces, and rendering. Godot 4.4+ is the target runtime;
native acceptance must be demonstrated in the engine.

Keep boot, data runtime, combat controller, run coordinator, and presenters separate.
`main.gd` wires services; it must not become the resolver, registry, and progression
system at once. Pure rule/state contracts must not contain Nodes or depend on HUD
signals. Host-specific implementation is acceptable; competing rule semantics are not.

## Data flow and runtime flow

**Target authoring flow:** external intake → quarantine/normalization → reviewed
canonical definitions and supplement → validation → publication/export → bundle →
host validation → registry → encounter resolution. External imports never bypass
schema review; generated bundles are never edited to fix source content.

**Runtime flow:** boot verifies readiness → select career → resolve encounter preview →
instantiate combat → submit/validate intent → resolve state/events → present feedback →
consume result into run state → reward/progression → next encounter or finish.
An error before readiness blocks play with actionable diagnostics. An invalid action
does not partially mutate the battle or consume RNG.

## Ownership and delivery

Use the existing [six workstreams](workstreams/README.md), not a parallel backlog:

- **WS01 — Data runtime:** loader, validation, registries, resolved records; future
  supplement/export changes need coordinated contract review.
- **WS02 — Combat contract:** state/action/preview/result/events and approved behaviors.
- **WS03 — Combat HUD:** presentation consumes WS01/WS02 contracts.
- **WS04 — Screen flow:** run state, result handoff, navigation.
- **WS05 — Art production:** approved visual assets and mappings, never gameplay schema.
- **WS06 — Integration/acceptance:** native boot, packaging, and end-to-end evidence.

Freeze shared signatures before parallel integration. Content contract changes require
the schema/authoring owner and all affected consumers; unresolved gameplay policy goes
to the gameplay owner. Vision documents describe intent, not approval or completion.

## Verification and evolution

Use existing Node checks: `npm run test:slice` for reference combat/validation and
content checks, `node --test scripts/workstream-docs.test.mjs` for documentation,
and `npm test` for repository regressions. `npm run data:check` validates the
supplement bundle; `npm run data:godot:check` verifies the canonical native pack.
These are separate contracts, not proof of native acceptance.

## Placement and continuity

The [output map](README.md#where-outputs-belong) and [Godot guide](../godot/README.md)
route writes to existing owners. Follow the [content pipeline](content-pipeline.md)
and [handoff convention](workstreams/orchestration.md#repository-handoff-convention);
generated bundles are not authored sources, and an exported game must not depend
on parent-directory access.

The target test strategy adds malformed/unsupported bundle tests, unresolved-reference
and instance-isolation tests, seed/action reproducibility, non-mutating previews,
event-order checks, and result-once run integration. Cross-host parity should compare
the same approved fixtures and content revision, not declare all browser behavior
canonical. Native acceptance covers all careers/encounters, boss behavior, invalid-data
paths, and repeat runs; missing Godot execution means unverified, not passed.

After **Docs Final → First Playable Build**, evolve through reviewed additive contracts.
Migrate breaking versions explicitly. Do not grow through UI-only rules, authored bundle
patches, duplicated `.tres` catalogs, hidden schema extensions, or claims that exports,
multi-wave encounters, persistence, or parity are complete without evidence.

The [Game Director Pitch](game-director-pitch.md) explains why these boundaries matter:
they preserve a player experience whose tension comes from decisions, not inconsistency.
