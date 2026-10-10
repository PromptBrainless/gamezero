# Combat Architecture

This is a structural direction distilled from PRs #1, #3, and #4. It specifies separation of responsibilities, not a complete combat ruleset. Concrete first-slice data fields belong to [`data-schema.md`](data-schema.md); implementation work belongs to the [vertical-slice plan](vertical-slice-implementation-plan.md).

## Resolution and presentation

```text
Chosen action → deterministic resolver → ordered combat events → presentation
```

- Combat state and seeded randomness are independent of scene nodes and UI.
- The resolver is the authority for state changes; animations and HUD presentation do not apply rules.
- The resolver emits an ordered event stream. The log, HUD, animation, and later simulation tools consume that stream.
- Events are stable for a given seed and input sequence; presentation may pause or accelerate them but must not reorder them.
- Build the loader, validator, registry, and encounter resolver as separate runtime responsibilities, as detailed in [`runtime-data-plan.md`](runtime-data-plan.md).

## Event payload direction

An event should identify its sequence, event type, source and target when applicable, turn, and event-specific payload. Candidate events include action selection, hit result, block/dodge/counter, damage, HP change, status application/removal/tick, telegraph, phase change, and defeat. This list is an architecture aid, not a requirement to implement every event in the slice.

## First-slice boundaries

- Use only actions, effects, and values defined by the approved data contract.
- Keep UI as a consumer of resolved state/events rather than a second combat authority.
- Do not adopt unreviewed turn rules, hit formulas, extra resources, or balance targets from the early concept PRs.
- Separate presentation milestones from gameplay implementation; the initial Godot scaffold proposed in PR #1 remains a separate, unverified implementation contribution.

## Native first-slice contract

`godot/scripts/combat/turn_resolver.gd` implements a scene-independent dictionary
API:

- `create_battle(career, opponents, registry, seed = 42)` initializes detached
  combatants, starting equipment and consumables.
- `unavailable(actor, skill)` returns an explanation, or an empty string.
- `preview(source, target, skill, registry)` returns calculated damage.
- `resolve_round(previous, skill_id, target_index, registry)` returns new state;
  rejected actions and terminal battles leave the supplied state unchanged.
  Empty `skill_id` means recovery; `item:<id>` selects a consumable.

Battle state carries player, enemies, round, seeded RNG state, inventory, result
(`""`, `"victory"`, `"defeat"`) and current-round events. Events carry
`seq`, `type`, `source`, `target`, `turn`, and `payload`; sequence numbers continue
across rounds. The HUD consumes these events and resolver previews, never applies
damage itself. Stable replay is guaranteed for the same native seed and inputs,
not parity with the older browser simulator.

Repeated opponent definitions receive distinct combat-instance IDs; `content_id`
retains the canonical lookup key. Consumers must not use an instance ID as an
authoring reference.

The native rules cover numeric damage and modifiers, resource costs and
cooldowns, timed statuses, cleanse, melee-triggered reactions, consumables,
weighted enemy actions and boss phase/telegraph transitions. Critical-hit rolls,
weakness/resistance tuning and a speed-based initiative scheduler are not
introduced: the architecture did not approve formulas for them. Those descriptive
stats must not imply effects in the HUD.
