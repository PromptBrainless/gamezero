# WS02 — Combat Contracts and Adopted Behavior Integration

**Milestone:** First Playable Build · **Priority:** P0 supporting foundation · **Owner:** combat implementation agent.
**Sources:** [architecture](../combat-architecture.md), [schema formula/fields](../data-schema.md), [adopted behaviors](../runtime-data-plan.md#adopted-content-behaviors), [history §6/§8](../project-history-and-execution-log.md), [slice boundaries](../vertical-slice-implementation-plan.md).
**Dependencies:** WS01 resolved records, gameplay-owner decisions in the [index](README.md); WS03/WS04 consume outputs.

## Scope guard and initial assignment

This supports the canonical three tracks; it is **not authorization for a separate full combat resolver or speculative ruleset**. The existing Godot resolver returns no events; the browser resolver uses readable strings rather than the complete proposed structured envelope. Neither is accepted target-runtime evidence.

First coding increment: implement a standalone, scene-independent ordered event envelope and action/preview/result contract boundary under `godot/scripts/combat/contracts/`. Validate sequence/type/turn/payload and preserve order. Do not wire the old resolver or decide unresolved mechanics. Record blockers for subsequent behavior integration.

## Complete backlog

- [ ] Agree action intent, combatant/run-state handoff, non-mutating preview, result and event signatures with WS01/WS03/WS04.
- [ ] Keep combat state and seeded randomness independent of scene nodes. Only the approved resolver changes state; HUD/animation consume results.
- [ ] Provide stable events for the actual adopted operations, with sequence, type, turn, applicable source/target IDs and typed payload. Candidate architecture events are guidance, not a mandate for new dodge/block mechanics.
- [ ] Prove same seed plus inputs gives the same ordered results; playback pause/speed never reorders events or applies rules a second time.
- [ ] Before integrating executable turns, obtain explicit review of unspecified turn/cooldown/status timing, regeneration, crit/resistance behavior, reaction cost/trigger policy and consumable timing. Document decisions against canonical fields; do not import early ECHO/W100/expanded draft rules.
- [ ] Implement and verify the documented numeric damage formula and approved status modifiers, including guarded damage multiplier. Formula text is descriptive only; use numeric fields.
- [ ] Exercise skill costs/cooldowns/targets, status application/removal/duration/stack/tick behavior, skip-turn and adopted stat modifiers under the approved timing policy.
- [ ] Dispatch `riposte` after a melee hit; test valid trigger, invalid trigger and prevention of unintended recursive reactions.
- [ ] Exercise `hold_the_line` and `quick_feint` removal of listed statuses, preserving unlisted statuses.
- [ ] Apply whetstone bonus to the next eligible attack exactly once; verify no accidental loss on a non-attack preview and no repeated bonus.
- [ ] Exercise starting equipment/stat modifiers and adopted item effects/consumable HP/focus/status use without a full inventory-management UI.
- [ ] Resolve the existing normal enemy skills/AI and boss phase thresholds/entry effects/telegraphs needed by real content. Show defined warnings before execution; do not build extended boss chains.
- [ ] Emit terminal victory/defeat/exit context and ordered reward-eligible results for WS04; agree retries/carryover before full integration.

## Acceptance and validation

- Preview leaves input state/RNG unchanged and exposes only available costs, legal targets and computed values. Invalid/unavailable intent gives a reason rather than partial mutation.
- Approved behavior tests cover costs, cooldowns, damage modifiers, status lifecycle, each named adopted optional behavior, boss transitions/warnings and terminal state.
- Event replay tests cover order, stable seed/input sequence, applicable identifiers and no UI-owned mutation.
- A real encounter can finish via the approved integration; WS06 verifies repeatability and all four encounters.
- Use `npm run test:slice` as reference regression, not as native acceptance. Run owned native tests if available; state blockers otherwise.

**Excluded:** a new action-point/hit model, echo/field systems, ally/range mechanics absent from schema, unapproved balancing targets, movement physics, animation-driven damage, large independent resolver expansion.
