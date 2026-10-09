# Implementation roadmap

## Delivery principle

Build from rules outward: prove a small combat loop, add content and progression,
then invest in final presentation and breadth. Each milestone ends with a
playable build and explicit acceptance checks.

## Phase 0 — Project and technical prototype

**Deliver**

- Godot project shell, input configuration, scene conventions, and a basic
  mobile export test
- Combatant state and data definitions for actions/statuses
- Deterministic resolver prototype with seeded random outcomes
- Event output visible in a simple debug log

**Exit checks**

- A test can resolve a turn without loading a presentation scene.
- The same input and seed produce the same state and event sequence.
- A minimal build launches on a representative mobile device.

## Phase 1 — Combat vertical slice

**Deliver**

- One player fighter and one enemy
- One arena and complete duel flow: start, turns, win/loss, result summary
- A small action set covering attack, defense, and a status
- First HUD for health, resources, intent, skills, and turn ownership
- Combat log driven by the resolver's event stream

**Exit checks**

- A new player can identify an action, its cost, and the enemy's intent.
- Invalid actions cannot spend resources.
- Combat resolution, log, and presentation agree on the result.

## Phase 2 — Initial content and balance

**Deliver**

- Five professions, twelve statuses, twenty starting skills
- Six archetype behavior sets and the two boss concepts
- Data definitions and validation for required fields and stable identifiers
- Repeatable encounter scenarios and basic balance simulations

**Exit checks**

- Every profession can complete a duel using its starting kit.
- Every status can be applied, inspected, and expire as defined.
- Enemy variety changes player decisions, not only encounter duration.
- Boss phases are telegraphed and have at least one viable counterplay route.

## Phase 3 — Meta progression and inventory

**Deliver**

- XP awards, career ranks, and a first set of advancement choices
- Inventory and the ten equipment/quick-use slots in the mini-GDD
- Reward, loadout, and character summary screens
- Local save/load for character, progression, inventory, and settings

**Exit checks**

- A complete loop persists across app restarts.
- Equipment and career choices alter combat state through defined data rules.
- Save data is versioned or has a documented migration strategy before
  substantial user data is stored.

## Phase 4 — Presentation and mobile polish

**Deliver**

- Final direction for character art and animation pipeline
- Modular player appearance and equipment display
- Hit, block, evade, status, defeat, and boss transition presentation
- HUD behavior across phone and tablet sizes; accessibility options
- Audio cues, settings, and reduced-effects mode

**Exit checks**

- Presentation remains synchronized with resolved events at low frame rates.
- Touch controls work without precision gestures or obstructing the battlefield.
- Reduced motion and flash settings preserve combat information.
- Performance is profiled on representative low- and mid-range devices.

## Phase 5 — Content expansion and release readiness

**Deliver**

- More arenas, enemy variants, career advances, and encounter progression
- Localization-ready content and interface
- Automated combat regression coverage and manual device QA checklist
- Crash handling, performance budgets, and release packaging

**Exit checks**

- Combat rules and content pass regression tests.
- Save behavior and input are validated across target devices.
- A complete player journey is playable from character setup through boss
  reward.

## Cross-cutting implementation practices

- Keep combat rules independent from scene presentation.
- Prefer data definitions and validation over hard-coded per-enemy branches.
- Test edge cases alongside each new rule: invalid targets, depleted resources,
  simultaneous defeat conditions, status expiration, and repeated inputs.
- Use profiling and device builds early; do not assume desktop performance
  represents mobile behavior.
- Keep art direction, UI, and rules coherent, but deliver them in increments
  that remain testable.

## Explicitly deferred

Online services, multiplayer, monetization, live operations, cloud saves,
procedural campaigns, and large-scale content authoring are outside the initial
vertical-slice roadmap. Revisit them only after the local combat and progression
loop is validated.
