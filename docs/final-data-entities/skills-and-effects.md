# Skills and effects — canonical target contract v1

## Authority and implementation status

This document owns the **next-runtime skill/effect model**, not a silent change
to the playable browser slice. [`../data-schema.md`](../data-schema.md) remains
authoritative for the existing `data/skills/`, `data/statuses/` and other slice
collections. The v1 target definitions live separately in
`data/contracts/v1/`; they are not loaded by the browser or current Godot
slice host. Do not mix these two skill formats in one registry.

Executable authority:

- `src/game/contracts/skills.ts`: strict Zod schemas and inferred TypeScript
  types (`SkillDef`, `EffectStep`, `EffectSequence`, `TargetingRule`).
- `src/game/contracts/events.ts`: commands and resolved event batches.
- `scripts/combat-contracts.test.mjs`: fixtures, reference checks and negative
  cases; run `node --experimental-strip-types --test scripts/combat-contracts.test.mjs`.
  These tests also run in `npm test`.

No combat resolver, Godot importer, passive engine or migration of existing
gameplay is claimed by this pass. The decisions below are binding for that
implementation; structural validation is already executable. State-dependent
rules (affordability, actual damage, legal actors and cooldowns) belong to the
future resolver, not a JSON schema.

## Identity, collections and shared values

One JSON definition per file, UTF-8, snake_case field names; stable
`lower_snake_case` IDs, filename = definition ID, unique **within collection**.
Every definition has `schema_version: 1`. Optional fields are omitted, never
null. Unknown fields, invalid enums and non-finite numbers are errors.
Chances are fractions `[0,1]`; multipliers are nonnegative finite numbers;
costs, stats, turns and resource amounts are safe integers. No formula strings,
scripts, NodePaths or scene references participate in rules.

```text
data/contracts/v1/
  skills/{id}.json
  effect_sequences/{id}.json
  targeting_rules/{id}.json
  resolved_actions/{scenario}.json
```

`resolved_actions` contains test scenarios rather than registry definitions;
its filenames identify scenarios, not action IDs. Status and career references
currently resolve against the existing `data/statuses/` and `data/careers/`.
Their schemas are not duplicated here. Combatant IDs identify **instances**
(`enemy_1`), not archetypes (two enemies may share a content ID).

## `skill_def`

| Field                  | Required meaning                                                    |
| ---------------------- | ------------------------------------------------------------------- |
| `schema_version`, `id` | Version and stable skill identity                                   |
| `name`, `description`  | German source display text; never executable rules                  |
| `type`                 | `attack`, `defense`, `control`, `reaction`                          |
| `career`               | Optional career ID; omission permits enemy/shared skills            |
| `costs`                | Array of `{resource, amount}`; empty = free; one entry per resource |
| `cooldown`             | Number of subsequent owner turns on which this skill is unavailable |
| `targeting_rule_id`    | Reusable legal-target definition                                    |
| `effect_sequence_id`   | Reusable ordered effects                                            |
| `timing`               | `{window: own_turn \| after_melee_hit, effect_phase: impact}`       |
| `hit_rule`             | Guaranteed hit or explicit accuracy strategy, plus crit multiplier  |
| `requirements`         | AND-list of typed source requirements                               |
| `tags`                 | Unique semantic labels; no mechanics inferred from descriptions     |

Costs support `stamina` and `focus` only, positive integers; HP sacrifice is
not supported. Validate **all** costs and requirements first, then pay all
costs once at commit. Failure pays nothing. Misses do not refund resources or
cooldowns. A committed action always completes, even if effects become no-ops.
Resources never become negative and grants/heals clamp to the actor's maximum.
Cooldown zero is immediately reusable at the next legal window. For cooldown
N, block the next N owner turns and decrement at their end; do not decrement
on the turn of application. Reactions use the same owner-turn clock.

Requirements are `has_tag {tag}`, `has_status {status_id}` or
`lacks_status {status_id}`, evaluated on the source at validation. Skill
ownership/loadout, alive state, current turn, resource availability, cooldown
and encounter completion are mandatory runtime checks, not optional
requirements. Tags are actor traits/equipment labels for `has_tag`; skill tags
classify actions for triggers and UI (`melee`, `spell`, `ranged`, `cleanse`).
No implied range or damage bonus follows from a tag.

## Targeting

`targeting_rule` requires side (`self`, `ally`, `enemy`), selection (`chosen`,
`all`), positive `min_targets`/`max_targets`, `life_state: alive` and
`order: combatant_id`. `max_targets >= min_targets`; self is exactly one
chosen target. Allies exclude the source; self targeting is explicit.

The command supplies combatant instance IDs, never content IDs. `chosen`
requires exactly the supplied distinct legal IDs within the bounds. `all`
requires the command IDs to equal the full current legal set; if that set
exceeds the maximum or is below the minimum, reject rather than truncate.
Canonicalize accepted IDs by ascending ASCII ID, regardless of UI order.
No random selection, revival, lane/range constraints or positional movement
exists in v1. The side-view/2.5D presentation does not imply spatial rules.

Freeze the legal target list at commit; never retarget mid-action. Later steps
skip defeated targets. `recipient: source` executes once, not once per target.
`recipient: targets` iterates the frozen canonical list for each step.

## Effect sequences

`effect_sequence` has `schema_version`, `id` and 1–32 ordered `steps`. A step
ID is stable and unique within its sequence (for event attribution).
Sequences are flat; no nesting, jumps, arbitrary expressions, recursion or
embedded follow-up commands. Authoring order is execution order.

Every step has `id`, `op`, `recipient` (`source` or `targets`) and `gate`
(`always` or `on_hit`). `on_hit` uses the action's one hit outcome for that
target. Source-only steps must use `always`; no ambiguous "any target hit"
rule. `always` is still subject to alive-recipient eligibility.

| Opcode           | Additional fields                                      | Rules                                                    |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| `damage`         | `amount`, `damage_type`, `ignores_defense`, `can_crit` | Apply clamped HP loss                                    |
| `heal`           | `amount`                                               | Restore HP, no revival or critical heal                  |
| `apply_status`   | `status_id`, `duration`, `stacks`, `chance`            | Positive turns/stacks; fractional chance                 |
| `remove_status`  | Distinct `status_ids`                                  | Remove full matching instances; absent status is a no-op |
| `grant_resource` | `resource`, positive integer `amount`                  | Stamina/focus grant, clamped                             |

`amount` is `{flat, scaling_stat: attack | magic, multiplier}`. For heal,
`max(0, floor(flat + source_stat * multiplier))`. For damage, retain the
slice's basic formula:

```text
base = max(1, flat + source_stat * multiplier - defense)
raw = base * damage_taken_modifiers * (critical ? crit_multiplier : 1)
damage = max(1, floor(raw))
applied = min(current_hp, damage)
```

Use zero defense when `ignores_defense` is true; otherwise both physical and
magic damage use existing `defense` (no new resistance stat). Multiply the
existing status/equipment damage-taken modifiers in sorted definition-ID order,
per stack where specified by the existing runtime. V1 has no immunity/zero
damage modifier; require positive damage-taken multipliers during import.
Source stats and crit chance snapshot at commit; recipient defense/modifiers
are read at each step so earlier buffs/cleanses can affect later steps.
Floor only at the final numeric amount, never between multipliers.

Damage/heal events report **applied** HP change, not overkill/overheal.
For example source attack 20, defense 7, flat 2 and scaling 0.9 yield 13
damage without critical/modifiers, as shown in `rending_cut_hit.json`.

## Hit, accuracy, critical and randomness

`hit_rule` is either `{mode: always, crit_multiplier}` or
`{mode: accuracy, accuracy, crit_multiplier}`. Existing representative skills
use `always`; this does not introduce evasion/accuracy stats into the old slice.
For `accuracy`, use the explicit chance, including 0 and 1; compare
`roll < accuracy`. No implicit minimum/maximum hit chance.

One hit outcome per target per action, reused by `on_hit` steps. On a hit,
roll critical only if at least one target damage step has `can_crit`.
Critical chance is clamped to `[0,1]` from source `crit_chance` plus source
bonuses and target crit-taken bonuses from the existing status contract.
One target critical outcome applies to all eligible damage steps; never heal,
status, or a damage step with `can_crit: false`.

RNG belongs to the resolver. Use seeded uint32 xorshift (nonzero seed), draw
`uint32 / 4294967296` in `[0,1)`, recording the cursor. Pin this algorithm for
the v1 resolver and use identical integer operations in TypeScript and Godot.
Zero seed normalizes to `0x6d2b79f5`; unsigned mask each shift/xor in Godot.
First draw hit/crit in canonical target order, then effect-step order and
recipient order for status chance. `always` consumes no hit draw; accuracy
mode consumes one even at 0/1. Eligible critical consumes one even at 0/1;
ineligible or missed critical consumes none (event chance = 0). Eligible
status attempts consume one even at chance 0/1. Skipped/no-op steps consume
none. The example records cursor 0→2: one critical and one bleed draw;
the bleed draw is assumed 0.4. Actual RNG values require a matching seeded
state in resolver tests; this fixture is a contract example, not a seed replay.

## Status lifetime and passive/reaction interactions

Keep canonical `status_effect_def` fields under `data/statuses/`: duration,
max stacks, tick window, typed supported modifier keys. `apply_status` adds
stacks capped at `max_stacks`; refresh remaining duration to
`max(old_remaining, incoming_duration)`. One merged instance per
`(combatant_id, status_id)`, stable instance ID while present; the latest
successful application supplies its source attribution. `status_applied`
records resulting stacks/duration, including refresh at cap.

For the target runtime, duration counts future **owner turns**: a newly
applied status does not tick or decrement until the owner's next turn.
At each eligible owner turn, tick at the definition's `turn_start` or
`turn_end`; decrement once after turn-end ticks and expire at zero.
Stun's `skip_turn` skips selection but not status ticks/expiry or cooldown
aging. DoT and regeneration run as separate system transactions, not hidden
inside a skill command; their envelopes require a future contract version.
Do not mislabel them as player skill events.

`reaction` skills require `after_melee_hit` (and vice versa); player/UI may
not submit them. After the root action completes, schedule eligible defender
reactions in combatant-ID then skill-ID order, against the attacker.
Eligibility requires positive applied melee damage and both actors alive.
Each is a separate validated/costed action with the next revision. Once per
reactor per root action; reaction actions cannot trigger further reactions.
The scheduler supplies trusted causal metadata internally; it is not a
client-command field in v1.

No general `passive_def` is executable in this pass. Declarative stat bonuses
and existing statuses remain supported through the current actor model.
Future passives must use registered rule triggers, never presentation signals;
evaluate eligibility from committed facts, enqueue after the root transaction,
and use an explicit once-per-root guard and chain bound. Adding passive
opcodes/triggers requires schema and resolver tests together.

## Migration and Godot integration

1. Build separate validated v1 registries; `validateSkillCatalog` aggregates
   structural/reference errors before any registry is exposed. The importer
   additionally checks filename/ID agreement and status numeric constraints.
2. Map old `cost` to unique `costs`; old `target` to `single_enemy`/`self`;
   inline damage/status/removal fields to named ordered steps; `trigger` to
   the reaction window. Preserve IDs, numbers and tags. A converter must
   specify order and rounding explicitly and compare old/new resolver traces;
   this pass intentionally does not claim numerical parity for every skill.
3. Import validated JSON into Godot `Resource` containers (`SkillDefResource`,
   `EffectSequenceResource`, `EffectStepResource`, `TargetingRuleResource`).
   Enums mirror wire values; `StringName` for IDs; resolve references once.
   Resources are read-only definition data; mutable cooldown/status/resource
   instances live in `CombatState`, never on shared Resources.
4. Port all opcodes and the event contract together. No fallback that silently
   ignores unsupported opcodes. Keep Godot node/animation code outside rules.

See [`../combat/combat-event-contract.md`](../combat/combat-event-contract.md)
for the command boundary, event payloads and transaction sequencing.
