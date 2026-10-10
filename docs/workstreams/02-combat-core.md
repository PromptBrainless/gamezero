# 02 — Combat Core

## Mission and authority

Implement a deterministic rules engine and a language-neutral fixture oracle for Godot. Sources: [first-playable rules](../first-playable-rules.md), [schema](../data-schema.md), [runtime supplement](../final-runtime-data-design.md), [combat architecture](../combat-architecture.md). Architecture describes event boundaries, not permission for additional mechanics.

## Delivered and implementation evidence

**Observed:** `src/game/slice/combat.ts` exposes `createBattle`, `preview`, `unavailable`, `resolveRound`; seeded status/AI randomness; equipment modifiers, growth, resource recovery, cooldowns, statuses and boss warnings; tests in `combat.test.ts`.

**Current behavior:** `combat.ts:228` rejects selecting trigger skills; lines 286–288 automatically execute affordable, ready Riposte after a damaging melee hit when the player lives and has no attached skip-turn status effect. This checks attached effects, not the previously consumed `player.skipTurn` flag: an expired stun can allow a counter during a round whose player action was skipped. Lines 236–245 implement consumable use. `combat.test.ts:70–92` asserts automatic Riposte/manual rejection and one-use whetstone consumption.

The root route (`src/routes/index.tsx:1–9`) mounts `SliceApp`; its `start()` restores run supplies and victory handling carries remaining inventory plus rewarded consumables (`slice-app.tsx:38–59`). Non-consumable rewards remain displayed rather than newly equippable. Current rules and metadata agree with this behavior without modifying the browser.

Normal enemy choice samples uniformly from available skills (`combat.ts:276–277`), ignoring authored `ai.weights`. Skill status reapplication retains `max(existing.duration, incoming.duration)` and caps stacks (`combat.ts:192–196`), represented by `keep_longer_duration`. Item status application (`combat.ts:242–244`) and boss entry (`:267–268`) instead append instances directly; the intended shared stacking invariant is not yet enforced across application sources. Weighted AI and generalized lifecycle dispatch remain future consumers.

**Pending:** approved oracle fixtures, stable numeric event payloads rather than German log-only evidence, pure preview/state isolation, and Godot parity.

## Ownership and shared contract

Own pure combat semantics, state/event contracts and fixtures/tests. 03 owns scene/controller wiring and engine IO; 05 owns animation/HUD; 04 owns career/encounter content and run progression. Agree the GDScript pure-resolver path with 03 before writes; it is 02's surface, not two competing resolvers.

Inputs: resolved definitions, independently instantiated combatants, seed, chosen action and living target instance ID. Outputs: next state plus ordered events and result. Presentation cannot apply HP/resource/status mutations.

Proposed event contract to lock at G2: sequence, round, event kind, source/target instance IDs when applicable, canonical skill/status ID, and numeric payload. Include only actual slice events: damage/HP, resource/cooldown changes, status apply/remove/tick, skip, telegraph, phase and result. Display text is derived, not the fixture key.

## Rules checklist

1. Direct damage: `max(1, round(max(1, flat + scaling_stat * multiplier - defense) * target_modifier))`. Match rounding and status modifiers; numeric fields govern, not `formula` prose.
2. Preview is pure and shows direct damage, not a promised random status proc.
3. Player acts, living enemies tick/act in defined order, player statuses/cooldowns/recovery advance. Victory stops remaining counteractions immediately.
4. Costs/cooldowns obey definitions. Enemy resources are free; unavailable enemy skills do not execute. Cooldown 2 blocks two subsequent own action opportunities.
5. Recovery adds +6 stamina/+4 focus and still permits enemy actions; normal regeneration +4/+3 is bounded. Chilled changes stamina regeneration, not initiative.
6. Preserve current skill application/timing in parity fixtures: reapply keeps the longer duration and skill-applied stacks cap. Metadata specifies one stack for non-bleeding statuses, but item/boss append paths need the follow-on merger regression below before that invariant can be accepted globally. Preserve cleanse references and nonnegative derived defense.
7. Riposte is automatic after a damaging melee hit with a living player, no attached skip-turn effect and affordable/ready reaction; it cannot be manually selected. Do not claim it is blocked for the entire skipped-action round. Include current consumable use and exactly-once next-attack bonus. No critical hits, initiative ordering or resistance math.
8. Boss 50% phase entry is once-only; +3 attack and two-round guarded effect from data. One-round `iron_command` warning replaces warning-round attack; stun delays the pending action.
9. Invalid/dead targets, unaffordable actions, cooldown actions and terminal battle inputs leave state unchanged. Multiple opponents are supported.

## Fixture and test plan

Create reusable JSON fixture expectations, not screenshots: seed, career/level/encounter IDs, command sequence, previews, ordered numeric events and final actor state. Include canonical entity content or revision identity so a stale fixture is detectable. 03 loads the same fixtures in Godot; do not duplicate a second set of expectations.

Fixture minimum: ordinary hit and fractional rounding; self buff/cleanse; bleeding cap/expiry/longer-duration reapply; chilled regeneration; stunned actor; cooldown 2; two-target cult fight; invalid target; boss phase threshold and delayed telegraph; immediate victory and defeat; automatic Riposte/manual rejection; consumable consumption and next-attack bonus. Match seeded uniform available-skill choice; do not activate authored weights.

```sh
node --experimental-strip-types --test src/game/slice/combat.test.ts
npm run test:slice
npm run balance:slice -- 100
```

Existing auto-Riposte/consumable tests are direct baseline evidence, not future-design claims. The balance command runs 1,200 independent fights across careers/encounters; it is not an end-to-end run or human win-rate estimate. Historical 99% boss wins are measurements, not a required target. Do not retune base stats in this package.

Documentation checkpoint verification (2026-10-10): `npm run test:slice` passed all 15 tests, including eight combat tests with automatic Riposte/manual rejection and one-use whetstone. Root-route supply handoff was inspected in source, not separately browser-tested here. No Godot execution or cross-runtime parity is claimed.

**Simulator parity backlog:** the integrator's `npm run balance:slice -- 10` diagnostic reported Duellant 0 wins in every encounter, mercenary/mage 100%. This is not the historical table, proof of class balance, or a regression attributed to metadata changes. Inspection identifies a likely harness defect: `scripts/slice-balance.ts:31–43` ranks every affordable player skill, including automatic trigger skills, while `resolveRound` rejects their manual selection. Selecting Riposte can therefore repeatedly return unchanged state until the harness turn cap. The simulator also lacks a consumable registry/run-supply handoff.

Follow-on 02 should add a targeted simulator regression: automatic reactions are excluded from manual candidate actions; a chosen legal command advances state or terminates; no-progress selection is reported as a harness failure rather than a combat loss. Compare the harness's legal-action set with the mounted UI and resolver, and explicitly label consumables as unsupported until modeled. Then rerun diagnostic seeds and record fresh measurements separately from historical results. Fixes to this pre-existing simulator are outside the current data/documentation task.

**Mixed-source status backlog:** introduce one reviewed application merger for skill/item/boss sources, then test `focused_mind` plus `focus_draught`: current append behavior can create duplicate `focused` instances despite `max_stacks: 1`. Test mixed-source caps, longer-duration retention, expiry, cleanse and boss entry. The target invariant must not be reported delivered before these pass; no gameplay fix is part of this documentation task.

**Skipped-turn reaction decision:** define and test whether Riposte may counter after the player loses an action to stun whose attached effect has expired. Preserve the existing attached-effect gate in current-behavior fixtures; changing it to block an entire round requires an explicit rules decision, not a silent migration correction.

G2 requires deterministic repeat output, no mutation of previous state, preview correctness, invalid-action rejection, all fixtures reviewed against approved rules, and no hidden unsupported mechanics. G3 parity remains 03's integration gate; no engine available means untested parity.

## Handoff and exclusions

Deliver interfaces, fixture revision, exact rounding/RNG conventions, event ordering, failure behavior and commands/results. 04 gets combat result/level input boundaries; 05 gets preview, legal-action reasons and events.

Deferred: W100 conversion, additional reaction types, initiative, criticals/resistances, new resources, weighted/sophisticated tactics, equipment/consumable expansion beyond current behavior, save/load and tuning campaigns.

## Copyable agent assignment

> Implement package 02's pure rules/state/event oracle after G1. Read first-playable rules, supplement and actual combat.ts/tests. Preserve automatic Riposte/manual rejection, consumable use, uniform AI and current per-source status behavior in parity fixtures; do not activate weighted AI. Separately review shared skill/item/boss status merger regressions, skipped-turn reaction policy and simulator trigger-filter/no-progress fixes before claiming target invariants. Freeze seeded fixtures, rounding/RNG/events and invalid-action/multi-opponent/boss tests. Own no scenes/UI/content tuning. Run targeted tests without a win-rate target; hand 03 parity fixtures and 05 numeric events.
