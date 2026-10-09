# Combat design

## Combat goals

Combat should feel like a tense duel of preparation, commitment, and response.
The player should be able to explain the result of an action from visible
information, even when chance is involved.

### Combat pillars

1. **Readable intent:** show the enemy's likely next action and danger level.
2. **Meaningful commitment:** powerful actions cost time, stamina, position, or
   an opportunity to defend.
3. **Distinct responses:** guard, evade, interrupt, and counter are not
   interchangeable buttons.
4. **Consequences without bookkeeping:** statuses matter, but active effects
   remain concise and inspectable.
5. **Resolution before spectacle:** rules determine outcomes; the presentation
   layer communicates those outcomes.

## Combatant state

The minimum runtime state for each combatant includes:

- Identity and enemy/profession definition
- Current and maximum health
- Stamina (or the selected action resource)
- Attributes and derived combat values
- Equipped items and available skills
- Active statuses with duration and source
- Initiative and current intent
- Guard/stance and cooldown or once-per-round flags

Definitions are immutable content. Current health, statuses, and other changing
values belong to combat state.

## Turn and round structure

1. **Round start:** apply start-of-round effects, refresh round-based
   allowances, and determine initiative.
2. **Intent:** the opponent's planned action is shown when its behavior permits
   it to be telegraphed.
3. **Decision:** the active combatant selects one primary action and confirms
   target, cost, and any relevant chance.
4. **Resolution:** validate the action, pay its cost, resolve accuracy and
   defense, then apply damage, statuses, and state changes in a defined order.
5. **Presentation:** play emitted events in sequence and update the HUD.
6. **Round end:** resolve end-of-round effects, check defeat, and begin the next
   round if combat continues.

The action economy begins with **one primary action per turn**. A limited
reaction or defensive stance may be available based on skill and state; avoid
adding universal main/side/reaction actions until prototype testing proves
they improve decisions.

## Action categories

- **Attack:** deal damage, break guard, or apply a status.
- **Technique:** reposition, feint, interrupt, or create an opening.
- **Defense:** guard, evade, or prepare a counter with a meaningful trade-off.
- **Skill:** use a profession or equipment ability with a resource cost or
  cooldown.
- **Consumable:** use a limited inventory item.

Every action definition should specify eligibility, cost, target rules,
resolution effect, status interaction, and presentation tags. Invalid actions
must be rejected before costs are paid.

## Resolution contract

The combat resolver receives the current combat state, chosen action, and
random seed. It returns an updated state plus an ordered list of events such
as:

- `ActionDeclared`
- `ResourceSpent`
- `AttackChecked`
- `AttackMissed` or `AttackHit`
- `DamageApplied`
- `GuardBroken`
- `StatusApplied` or `StatusExpired`
- `CombatantDefeated`

The exact event schema can evolve, but a single authoritative resolver must
drive gameplay, combat log, and animation. Presentation must not call back into
the resolver to decide damage or timing.

## Tactical choices

The first prototype should test these decision tensions:

- Fast, low-cost action versus slower, higher-impact action
- Immediate damage versus setting up a status or opening
- Guarding predictable heavy attacks versus evading or interrupting
- Spending stamina now versus keeping enough for a later defense
- Exploiting an enemy weakness versus using a reliable general action

Keep probability display honest: show a percentage or a qualitative band only
when its calculation is stable and explainable.

## Status rules

Statuses use explicit duration and stacking rules. Unless an effect says
otherwise, a repeated application refreshes duration rather than stacking
unboundedly. Damage-over-time effects resolve at the specified round boundary;
control effects must clearly state when they expire and what actions they
restrict.

The initial status roster and their provisional behavior are in
[Initial content plan](initial-content-plan.md). Limit the number of simultaneously
prominent icons; group or summarize duplicates.

## Enemy behavior and bosses

An enemy archetype changes priorities and action selection, not just health and
damage. A small rule-based evaluator is sufficient for the first slice:

- Check defeat, control, and phase triggers first.
- Score legal actions using health, stamina, status, intent, and archetype
  priorities.
- Choose a readable action, with controlled variation to prevent perfect
  predictability.

Bosses should introduce a distinct encounter rule, telegraphed phase change,
and counterplay. Do not make a boss difficult only by multiplying its health.
The initial concepts are in [Initial content plan](initial-content-plan.md).

## Defeat, rewards, and logs

Defeat ends combat cleanly and reports the decisive events. The result screen
should summarize outcome, XP, rewards, and any challenge objective. The combat
log records the same event stream as the presentation and provides concise
explanations of major hits, misses, status changes, and costs.

## Validation cases

The combat prototype should have tests for:

- Valid actions spending their cost exactly once
- Invalid actions leaving state unchanged
- Damage, mitigation, and defeat ordering
- Status application, refresh, expiration, and tick timing
- Deterministic results for a fixed seed
- Event order matching state transitions
- Boss phase transitions and their telegraphs
