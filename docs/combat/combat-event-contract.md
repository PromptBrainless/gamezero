# Combat-event contract — v1

## Ownership and scope

This is the canonical **target-runtime skill action** boundary described by
[`../combat-architecture.md`](../combat-architecture.md).
`src/game/contracts/events.ts` implements strict executable schemas and inferred
types. It does not replace the browser slice's string log or the existing
Godot slice host's dictionaries yet. Content mechanics and RNG rules are in
[`../final-data-entities/skills-and-effects.md`](../final-data-entities/skills-and-effects.md).

V1 supports skill action transactions only. Encounter/turn lifecycle,
DoT ticks, regeneration, consumables, telegraphs, boss phase transitions,
passive scheduling and encounter victory are future **explicit** contract
extensions; do not invent unvalidated dictionary variants. A future resolver
must add the required system-transaction schemas before implementing these
flows over this boundary. `combatant_defeated` is already an action consequence,
not an encounter-victory decision.

## Input: `action_command`

```json
{
  "schema_version": 1,
  "command_id": "command_1",
  "combat_id": "combat_slice",
  "expected_revision": 0,
  "actor_id": "player_1",
  "skill_id": "rending_cut",
  "target_ids": ["enemy_1"]
}
```

IDs are stable snake_case strings; actor/target IDs identify runtime instances.
`expected_revision` is the last committed state observed by the command issuer.
Target IDs are nonempty and distinct. The input contains **intent only**:
no damage, costs, phases, actor stats, RNG seed, rolls, presentation assets,
client-supplied ownership or callback functions.

Resolver signature direction:

```text
resolve(state, validated_registries, command, seeded_rng)
  -> {next_state, resolved_action}
```

Validate command shape, combat identity/completion, revision, actor/loadout,
timing window, requirements, targeting, cooldown and all costs in that order.
Reject with the first applicable stable reason; validation uses no RNG.
If a networking layer is later introduced, authenticate actor authority there;
an ID is not authorization. UI previews are non-authoritative.

Commands are idempotent within a combat: store command ID + canonical intent
and the original result. Identical resubmission returns that result before
revision validation, with no new costs, events or randomness. Reusing a
command ID for different intent is a protocol error, not a new action.
Malformed shapes, foreign combat IDs and command-ID collisions are boundary
errors before resolution; they are not one of the gameplay rejection enums.
Only the local resolver/scheduler assigns `action_id`.

## Output: `resolved_action`

Both variants contain:

| Field                                   | Meaning                                     |
| --------------------------------------- | ------------------------------------------- |
| `schema_version`                        | Literal 1                                   |
| `action_id`, `command`                  | Resolver identity and exact original intent |
| `status`                                | `resolved` or `rejected`                    |
| `revision_before`, `revision_after`     | Atomic state revision                       |
| `rng_cursor_before`, `rng_cursor_after` | Draw counts in the battle RNG               |
| `events`                                | Complete ordered batch                      |

Resolved actions additionally contain the canonical sorted `target_ids`.
`revision_before` must match accepted command intent; `revision_after =
revision_before + 1`, including misses and valid no-op effects. RNG cursor
cannot decrease. Event boundaries are `action_started` and
`action_completed`, exactly once each.

Rejected actions have `reason` from:

```text
stale_revision, unknown_actor, unknown_skill, wrong_window, requirements,
invalid_targets, insufficient_resource, cooldown, combat_finished
```

They have no `target_ids`, no events and unchanged revisions/RNG cursor.
Rejections are command feedback to input/UI, **not combat facts** on the
presentation event bus. `stale_revision` reports the actual current revision
in `revision_before`; it can differ from `command.expected_revision`.

Examples:

- `data/contracts/v1/resolved_actions/rending_cut_hit.json`: cost, cooldown,
  hit, damage/HP change, bleeding application and completion.
- `data/contracts/v1/resolved_actions/insufficient_stamina.json`: no mutation,
  no RNG, empty events.

## Event envelope

| Field                    | Meaning                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `schema_version`         | Literal 1                                                                  |
| `event_id`               | Unique in combat; e.g. `event_8`, assigned deterministically               |
| `combat_id`, `action_id` | Correlation to the committed transaction                                   |
| `sequence`               | Combat-global safe integer, starts at 1, contiguous across batches         |
| `turn`                   | Positive owner-turn ordinal supplied by the scheduler; not wall-clock time |
| `phase`                  | `commit`, `impact`, `aftermath`, `complete` for emitted facts              |
| `source_id`              | Action actor; same across this batch                                       |
| `target_id`              | Required for combatant facts; omitted on action boundaries                 |
| `step_id`                | Optional sequence-local effect step attribution                            |
| `payload`                | Strict discriminated union with `type` and typed fields                    |

`validate` is an action phase but emits no committed facts. Optional values
are omitted, never null. No nodes, Resources, animation names, display text,
timestamps or arbitrary dictionaries appear on the wire.

### Payloads

| `payload.type`       | Fields in addition to `type`                                                                  | Phase                             |
| -------------------- | --------------------------------------------------------------------------------------------- | --------------------------------- |
| `action_started`     | `skill_id`                                                                                    | commit                            |
| `resource_changed`   | `resource`, `before`, `after`, `delta`, `reason`                                              | commit for cost; impact otherwise |
| `cooldown_changed`   | `skill_id`, `before`, `after`                                                                 | commit                            |
| `hit_resolved`       | `outcome`, `hit_chance`, optional `hit_roll`, `critical`, `crit_chance`, optional `crit_roll` | impact                            |
| `damage_applied`     | `amount`, `damage_type`, `critical`                                                           | impact                            |
| `healing_applied`    | `amount`                                                                                      | impact                            |
| `status_applied`     | `status_id`, `instance_id`, `duration`, `stacks`, `source_id`                                 | impact                            |
| `status_removed`     | `status_id`, `instance_id`, `reason`                                                          | impact                            |
| `combatant_defeated` | none                                                                                          | aftermath                         |
| `action_completed`   | `revision`                                                                                    | complete                          |

Resource keys: HP/stamina/focus as `hp`, `stamina`, `focus`.
`delta = after - before`; nonnegative before/after. Reasons:
`cost`, `damage`, `heal`, `effect`. Costs charge source stamina/focus;
damage/heal only HP; grant effect only stamina/focus. Cost/damage delta
cannot be positive; heal/effect delta cannot be negative.

`status_removed.reason` is `cleanse`, `expired` or `defeat`; expiry is
reserved for future lifecycle transactions, not a skill action. Removal
on defeat is a skill consequence and must occur in impact before the
aftermath defeat fact. A merged status instance's payload `source_id` tracks
its latest applier separately from envelope source.

Hit rolls are `[0,1)`, outcomes use `< chance`; an absent hit roll is only
valid for guaranteed hit (`hit_chance: 1`). Misses never roll crit. Disabled
crit means `critical: false`, `crit_chance: 0`, no crit roll. Noncritical
damage steps remain noncritical even when the target-level outcome was
critical. Status chance failure emits no status fact; RNG cursor still
advances. A debug trace can record draws outside this presentation contract.

## Transaction and sequencing guarantees

1. **Validate:** reject before any mutation, draw or emitted fact.
2. **Commit:** work on isolated state; start, pay costs in resource-key order,
   set cooldown (emit only if changed). Freeze targets and source stats.
3. **Impact:** emit hit outcomes in target-ID order. Then execute step-array
   order, and target-ID order within each step. Emit applied damage/heal
   followed immediately by its HP `resource_changed`. `damage_applied` is
   feedback, not an additional HP mutation. For zero applied change emit
   neither amount nor resource event. Emit status application/refresh or
   actual removal, never absent-status removal.
4. Mark HP-zero recipients unable to receive subsequent effects immediately.
   Clear their status instances at the end of impact (status-ID order), using
   `status_removed` with reason `defeat`.
5. **Aftermath:** emit each new `combatant_defeated` once, in combatant-ID order.
6. **Complete:** append `action_completed` with next revision, validate the
   batch, atomically publish next state + result, then notify consumers.

Phases never go backwards. Events in one action have one turn and contiguous
sequences; the first sequence may be greater than 1. No rejected/failed
transaction reserves sequence numbers. Action IDs/event IDs and next sequence
are authoritative counters, stored with combat state. Action IDs may have
gaps for rejections; event sequences may not.

An unexpected resolver error discards tentative state **and RNG** and emits
no partial batch; report an implementation error rather than pretending a
gameplay rejection. Observer exceptions cannot roll back committed rules.
Root and scheduled reaction batches never interleave.

For a given validated content version, initial state/seed and command
sequence, resolved facts and final state must match. Pin content revision
and RNG algorithm outside the command (in replay/session metadata).
Structural schemas validate ordering and identities; cross-batch continuity,
global ID uniqueness, RNG draws, amount/HP pairing, legal opcodes/step IDs,
cost totals and state transition correctness require resolver/session tests.
The current validator deliberately does not claim to reconstruct state.

## Rules-facing versus presentation-facing

**Rules input:** command and validated registries.
**Rules output:** committed state and immutable resolved action.
**Rules observers:** consume the internal committed facts to schedule
reactions/passives; they cannot mutate the batch or emit new facts during it.
The scheduler resolves their subsequent actions through the same authority.

**Presentation input:** an ordered read-only event batch plus read-only
state snapshot/revision. HUD, text log, animation and audio derive labels
and cues via definition IDs; they never reroll, recompute or apply effects.
A presentation projection may animate its own visual HP from resource events
but never writes that projection back into `CombatState`.

Animations may delay their own consumption, fast-forward or skip visual
work, but must not reorder facts. Input awaits a separate local
`presentation_batch_finished(action_id)` notification when desired. That
notification is not a combat event and cannot change rules. Late subscribers
load current state and next sequence; duplicates are ignored by event ID/
sequence, gaps demand resync instead of guessed values.

## Godot integration recommendations

- Keep pure `CombatResolver` and owned `CombatState` separate from nodes;
  immutable definition Resources are shared, runtime actor state is not.
- The existing `godot/scripts/core/event_bus.gd` signal
  `combat_event(event: Dictionary)` can carry validated envelopes during
  migration. Add an authoritative batch delivery adapter
  `action_resolved(result)`; use `combat_event` only as an ordered projection
  **after** atomic commit. Never let subscribers become competing resolvers.
- Build typed GDScript envelope/payload adapters matching these enums and
  validators before accepting dictionaries. Reject unsupported versions or
  fields; no default success for missing data. JSON IDs map to `StringName`,
  safe integer bounds remain the shared TS/Godot wire limit.
- Godot Dictionaries/Arrays are mutable: deep-duplicate at the adapter
  boundary or expose read-only wrapper objects. Never send live state or
  shared definition Resources to mutation-capable subscribers.
- `CombatPresenter` queues committed batches; actor scenes/HUD subscribe to
  presentation adapter signals, not directly to skill definitions. Use
  `call_deferred` for presentation delivery if necessary, not for rule ordering.
- Keep logs derived from payloads and German definition names; existing
  browser string logs remain unchanged until a tested adapter is introduced.
- Port the example/negative fixtures and add deterministic resolver parity,
  two-batch continuity, stale command, idempotency and reaction-loop tests
  before switching the first playable flow to this boundary.
