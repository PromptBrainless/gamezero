# Final Runtime Data Design

## Decision and authority

Godot 4.4+ is the target runtime for a mobile-first, turn-based, 2D side-view
combat RPG. Depth is presentation (layers/parallax), not a second combat axis.
The existing web slice remains a working rules reference during migration.

[`data-schema.md`](data-schema.md) still owns the seven base content collections.
This document owns the **version 1 runtime supplement**, concretely authored in
`data/runtime/slice.json` and validated by `scripts/runtime-data.mjs`. It starts
the final architecture without replacing existing records or expanding the slice
budget. The supplement is not an eighth entity collection: it is one versioned
manifest linking the existing definitions.

Authority order: base schema for base records; this contract for the supplement;
[`first-playable-rules.md`](first-playable-rules.md) and observed, tested slice
behavior for implemented rules. Early W100 and resource drafts are not alternate
sources of runtime content. The new metadata is consumed by the export pipeline;
the web combat/UI and native slice host have **not** been switched to consuming it.
Implemented reference behavior is not approval of unspecified gameplay policy;
native adoption remains subject to the workstream decision/acceptance gates.

## Definition, instance, and presentation boundaries

| Layer | Owns | Must not own |
|---|---|---|
| Definition catalog | Careers, skills, statuses, items, enemy/boss values, encounters; read-only by ID | HP loss, cooldown counters, mutable inventory |
| Runtime supplement | Progression unlocks, action selection, status lifecycle, archetypes, stage/wave/dialogue links | Duplicate damage, stat, cost, loot or reward values |
| Combat instance | Unique actor instance ID, definition reference, HP/resources, cooldowns, status instances, boss phase, pending telegraph, RNG state | Scene paths, UI nodes, animation callbacks as rule authority |
| Run state | Career ID, level, next encounter, XP, remaining supplies, completion | Changes to catalog definitions |
| Presentation | Normalized stage anchors, render layers, event playback, accessible HUD | Hit decisions, physical collisions controlling target legality |

Godot receives dictionaries through a read-only registry API returning deep
copies. Resource adapters can later wrap validated definitions for editor
ergonomics; `.tres` files must not become a second manually maintained catalog.

## References, identity, and versions

- Base IDs remain ASCII `lower_snake_case`, collection-local and equal to their
  filename stem. A qualified reference is `{collection, id}`; an actor instance
  ID is distinct from the definition ID. Never rename/reuse released IDs.
- Metadata identifies its base records with `career`, `skill`, `status` or
  `encounter`; archetypes use explicit `enemies`/`bosses` references.
- Stage/archetype/dialogue IDs are unique within their section. Slot/layer IDs
  are stage-local; wave/node IDs are encounter/dialogue-local; spawn instance
  IDs are unique across an encounter, allowing multiple copies of one enemy.
- `schema_version: 1` is an exact supported contract, not a best-effort parser.
  `content_revision: "slice_1"` identifies this curated baseline. Change it
  deliberately when publishing a new catalog; no timestamps in generated data.
- Unknown fields, null, malformed IDs, unsupported versions and dangling
  references fail validation. Migrations must be explicit before a new version
  is accepted. Save formats are separately versioned **later**, not implemented
  or silently inferred from this bundle.

## Concrete slice contract

### Careers, classes, and progression

`careers[]` contains `{career, max_level, unlocks:[{level, skills}]}`.
There is one entry per base career; unlock levels are ascending and within
`max_level`. Every skill in `skill_pool` occurs exactly once; level 1 matches
`starting_skills`. This slice caps at level 4, gains a level per victory and
unlocks remaining skills at level 2:

| Career | Level 1 | Level 2 |
|---|---|---|
| `mercenary` | `shield_bash`, `hold_the_line` | `rending_cut` |
| `duelist` | `riposte`, `precise_thrust` | `quick_feint` |
| `scholar_mage` | `arcane_bolt`, `frost_sigil` | `focused_mind` |

Base `stat_growth` remains the numeric authority: base + growth × (level − 1)
plus starting equipment. XP remains displayed accumulation, not a hidden XP
level threshold. Additional careers, specializations, talent prerequisites and
branching progression require a reviewed schema version and runtime consumer.

### Skills, actions, resources, and targeting

`actions[]` covers all ten base skills, including the boss-only `iron_command`.
Each has `{skill, selection, execution, reaction_hook?}`. Selection is explicit:
`team: self|opponent`, `count: 1`, `life_state: alive`, `range: any_slot`.
The team must agree with base `target`; stage x/y never constrain range.

`execution` is `manual` except `riposte`, which is `reaction` with
`reaction_hook: after_melee_hit`, matching its base trigger. It is not a second
player action button. The current hook requires a damaging melee hit, a living,
player without a currently attached stun effect and an affordable, ready
reaction. The remembered turn-skip flag is consumed before enemy actions; a
player who just lost an action can currently react if the stun instance has
already expired. Blocking reactions for that entire round requires an explicit
combat-rule decision and regression test, not an incidental migration change.
Costs and cooldowns stay
on the skill. Shared skills may be used by enemies despite their player career
ownership; `career` restricts learning, not enemy use.

`rules` explicitly locks this baseline:

| Field | Value / meaning |
|---|---|
| `turn_order` | `player_then_enemies`; encounter spawn order, not speed initiative |
| `damage_rounding` | `nearest_min_one`; `max(1, round(max(1, flat + scaling × multiplier − defense) × modifiers))` |
| `resource_regen` | stamina 4, focus 3, capped at maximum; stamina status multiplier applies |
| `recovery_bonus` | stamina 6, focus 4; a recovery action still allows enemies to act |
| `enemy_cost_policy` | `free`; enemies still observe cooldowns |
| `progression` | `victory_level` |
| `encounter_reset` | `full_restore`; battle HP/resources reset, run supplies do not |
| `rewards` | `consumables_next_encounter` |

Base `crit_chance`, speed, weaknesses/resistances and crit status bonuses remain
defined but are not active crit/initiative/resistance mechanics. Neither the
supplement nor exporter turns these on. Numeric status/equipment effects must
be implemented explicitly; no formula strings, arbitrary scripts or eval.

### Status effects and conditions

`statuses[]` covers all six base statuses with
`{status, duration_clock, reapply, stack_mode, expiration, cleanseable}`.
The duration clock is an owner action opportunity, not an animation or elapsed
seconds. `reapply: keep_longer_duration` uses max(existing, incoming);
`bleeding` uses `add_capped`, the others `replace` (one stack).
`expiration: after_tick` decrements/removes after the owner's tick.
`cleanseable: true` permits explicitly listed removals; it does not make every
action a cleanse.

This is the target invariant and matches **skill** application. Existing
consumable and boss-entry paths append status instances without merging. For
example, `focused_mind` followed by `focus_draught` can currently duplicate
`focused` despite `max_stacks: 1`. The combat workstream must consolidate status
application and add mixed-source cap/reapply tests before claiming that all
application paths enforce this contract. Metadata validation does not repair
this existing runtime discrepancy.

The web resolver currently ticks enemies before their action and the player
after the enemy sequence. Stun is remembered for the next player opportunity;
its instance can expire before that skip. This asymmetry is intentional parity
input, not authorization to homogenize clocks during migration. Base `tick`
is an authored timing direction; general turn-start/turn-end dispatch is a
follow-on combat task. Status instances need separate remaining duration,
stack count and source instance ID; definitions must never be mutated.

### Enemies, bosses, and archetypes

`archetypes[]` has `{id, combatant:{collection,id}, role, resource_policy,
selection_policy}`. The three normal enemies map to striker/defender/controller;
the captain maps to boss. All use `resource_policy: free`.
Base `role` is descriptive content (`glass_cannon`, `bruiser`, `caster`);
archetype `role` is the constrained presentation/tactical classification.
Neither selects an AI algorithm; `selection_policy` does. Do not interpret the
base role string as an archetype enum.
Normal selection is `uniform_available`; bosses use `telegraph_first`.
Base `ai.weights` remains authored intent but is not evaluated by the current
resolver. Boss phase skill lists, thresholds, entry effects and telegraphs
remain in the base boss definition, not duplicated in metadata.

### Encounters, waves, and stages

`encounters[]` has `{encounter, stage, waves, narrative}`. A wave is
`{id, trigger, spawns:[{instance_id, archetype, slot}]}`. The first trigger is
`encounter_start`; subsequent waves use `previous_wave_defeated`.
Every concrete slice encounter has one wave; flattened spawns exactly match
its base enemy list and collection. The cult encounter has **two** simultaneous
opponents in distinct slots. Wave sequencing is structurally available but
multi-wave combat execution is a follow-on task.

`stages[]` has `{id, name, layout:side_view, player_slots, enemy_slots, layers}`.
Slot positions `{id,x,y}` are normalized 0–1 arena coordinates. Four existing
arena IDs are concrete records, each with one player and two enemy anchors.
Layers `{id,depth,parallax}` define background/arena/foreground staging;
no invented asset paths are included. They are not collision or targeting
lanes. Godot must adapt anchors to the safe viewport, leave HUD space and
support touch selection without changing combat rules.

### Items, equipment, and rewards

Existing eleven items remain authoritative for slots, modifiers, allowed careers,
consumable use and rarity. `equipment` explicitly lists the four equip slots,
`duplicate_policy: one_per_slot`, `consumable_policy: separate_inventory`.
This is the target slot invariant, not a newly delivered equipment-management UI.
The exporter validates references; the follow-on inventory resolver must enforce
occupancy on equip commands.

Guaranteed encounter rewards remain inline; enemy loot tables are not rolled
again or added to encounter rewards by this exporter. Remaining supplies plus
guaranteed consumable rewards enter the next encounter. Weapon/armor rewards
are displayed only; XP is not paid twice using `xp_reward`.

### Dialogue and slice narrative

`dialogue[]` has `{id,entry,nodes:[{id,speaker,text,next?}]}`.
Eight concrete dialogue graphs provide before/victory hooks for all four
encounters. Node IDs and next links are local; every node is reachable from
entry, references resolve, and chains terminate (no cycles). Omitted `next`
ends the dialogue. The captain's introduction demonstrates a two-node chain.
The texts are German curated slice copy, not imported source claims.

Narrative links are data-ready, **not yet shown by the web/Godot screen flow**.
Branching choices, flags, quests and localization require explicit later schema
changes; arbitrary narrative scripts are not accepted.

## Validation and Godot handoff

```sh
npm run data:check
npm run data:export:godot
```

The exporter runs the existing base loader/validator, then supplement structural
and semantic validation. Only a fully valid catalog produces
`godot/data/content_bundle.json`, with this envelope:

```json
{
  "schema_version": 1,
  "content_revision": "slice_1",
  "collections": { "...": "validated base registries keyed by ID" },
  "runtime": { "...": "validated runtime supplement" }
}
```

The envelope illustration is documentation, not a fixture. The real fixture is
`data/runtime/slice.json` together with every canonical base file.
Export is deterministic and atomically replaces the destination only after
validation. Generated output and Godot's `.godot/` cache are ignored, not
manually edited. Run this export when testing the optional bundle bridge;
the current slice host instead uses the canonical `runtime_pack.json` generated
by `npm run data:godot`. The two envelopes are not interchangeable.
Include `*.json` in Godot's non-resource export filter; export templates and
mobile signing remain environment setup, not content.

Godot `ContentRegistry` checks the bundle envelope before readiness and returns
copied definitions/runtime metadata; `load_bundle()` fails when the bundle is
absent/invalid. This bridge is not wired into the native slice boot.
Full authoring validation lives in the build pipeline; full defensive native
supplement validation still requires integration work. This
bridge is **not** a complete Godot combat port or independently verified mobile
export.

Tests cover coverage, types, ranges, unknown fields, references, progression,
targeting, slot/wave identity, terminating dialogue and fail-closed export.
Existing combat tests remain the parity baseline. See
[`workstreams/README.md`](workstreams/README.md) for ownership and next gates.
