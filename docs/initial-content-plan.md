# Initial content plan

## Purpose and scope

This is the first content set for a combat vertical slice, not a final catalog.
It is designed to exercise distinct combat choices with reusable rules and
manageable production scope.

| Content type         | Initial target |
| -------------------- | -------------: |
| Starting professions |              5 |
| Core statuses        |             12 |
| Starting skills      |             20 |
| Enemy archetypes     |              6 |
| Boss concepts        |              2 |

Names and effects are working design definitions. Tune values after the
combat-resolution contract is playable.

## Starting professions

| Profession   | Starting identity                                             | Tactical emphasis                                      |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------ |
| Sellsword    | Practical hired blade with reliable armor and weapon training | Guard, punish openings, dependable damage              |
| Duelist      | Fast specialist who reads and exploits an opponent            | Feints, parries, precision, counters                   |
| Hunter       | Resourceful tracker used to fighting dangerous prey           | Marking, traps, endurance, exploiting weaknesses       |
| Marksman     | Ranged specialist who controls tempo and creates space        | Aimed attacks, interruption, range management          |
| Hedge Mystic | Self-taught wielder of risky, unconventional magic            | Focus, control effects, powerful but costly techniques |

Professions establish starting attributes, kit, and three signature skills.
Career advances can cross-train; avoid hard locks that make a profession's
identity a permanent limit.

## Core statuses

Use short durations and clear application/expiration feedback. Stacking is
limited and explicit.

| Status    | Type               | Initial behavior                                                            |
| --------- | ------------------ | --------------------------------------------------------------------------- |
| Bleeding  | Harmful            | Lose a small amount of health at round end; can be cleared by treatment     |
| Burning   | Harmful            | Take damage at round end; a second application refreshes duration           |
| Poisoned  | Harmful            | Take reduced damage over several rounds and suffer a minor accuracy penalty |
| Staggered | Harmful            | Reduced effectiveness on the next action; expires after that action         |
| Stunned   | Control            | Lose the next primary action; bosses may resist or convert to stagger       |
| Exposed   | Harmful            | The next incoming hit gains a damage bonus, then the effect ends            |
| Weakened  | Harmful            | Deal reduced damage for a short duration                                    |
| Guarded   | Beneficial         | Reduce incoming damage until the next turn or a guard break                 |
| Focused   | Beneficial         | Improve the next precision or spell check; consumed on use                  |
| Hasted    | Beneficial         | Gain an initiative advantage for the next round                             |
| Marked    | Harmful            | The source gains improved accuracy against the marked target                |
| Enraged   | Beneficial / risky | Deal more damage but become more vulnerable to counterattacks               |

Boss resistance should alter control duration or severity rather than silently
ignore a status.

## Starting skills

Four skills per profession; shared skills can be learned later through career
advances. Skill names are provisional.

| Profession   | Skill           | Initial role                                                     |
| ------------ | --------------- | ---------------------------------------------------------------- |
| Sellsword    | Measured Strike | Reliable attack with moderate stamina cost                       |
| Sellsword    | Brace           | Reduce the next incoming hit; vulnerable to guard break          |
| Sellsword    | Pommel Blow     | Low damage, with a chance to stagger                             |
| Sellsword    | Retaliate       | Counter a telegraphed melee attack if the guard holds            |
| Duelist      | Feint           | Apply Exposed if the opponent commits to a predictable response  |
| Duelist      | Riposte         | Parry a melee attack and answer with a precision strike          |
| Duelist      | Lunge           | High-impact attack that trades away some defense                 |
| Duelist      | Slip Aside      | Evade one attack and gain a brief initiative advantage           |
| Hunter       | Quarry Mark     | Apply Marked and reveal a target's weakness                      |
| Hunter       | Snare           | Restrict the next reposition or charge action                    |
| Hunter       | Venom Cut       | Deal damage and apply Poisoned                                   |
| Hunter       | Field Dressing  | Clear Bleeding and recover a small amount of health              |
| Marksman     | Aimed Shot      | Spend a turn preparing a more accurate ranged attack             |
| Marksman     | Quick Shot      | Fast, lower-damage attack that can interrupt preparation         |
| Marksman     | Pinning Shot    | Deal modest damage and reduce enemy initiative                   |
| Marksman     | Backstep        | Create space and gain a short defensive benefit                  |
| Hedge Mystic | Ember Hex       | Deal light damage and apply Burning                              |
| Hedge Mystic | Binding Word    | Attempt to apply Staggered or, against susceptible foes, Stunned |
| Hedge Mystic | Ward Sign       | Reduce the next magical or special hit                           |
| Hedge Mystic | Borrowed Time   | Gain Hasted at the cost of health or stamina                     |

Tune exact costs, probabilities, damage, and durations only after a playable
prototype exists. Skills should clearly communicate target, resource cost,
expected effect, and any conditional outcome.

## Enemy archetypes

| Archetype | Behavior identity                                            | Teaches the player                        |
| --------- | ------------------------------------------------------------ | ----------------------------------------- |
| Bruiser   | Slow, durable, telegraphs punishing attacks                  | Read intent and punish recovery           |
| Duelist   | Uses feints, parries, and counterattacks                     | Vary timing and avoid predictable actions |
| Bulwark   | Guards frequently and attempts to break the player's offense | Manage stamina and create openings        |
| Assassin  | Fast, fragile, and threatening when the player is exposed    | Protect against burst and control tempo   |
| Hexer     | Applies status effects and pressures resource use            | Interrupt setup and prioritize threat     |
| Beast     | Alternates between probing and aggressive enrage behavior    | Observe patterns and handle risky phases  |

Archetypes should share a modest action vocabulary but prioritize it
differently. Variants should add a mechanic or decision, not only larger stats.

## Boss concepts

### The Iron Provost

A heavily armored arena champion who opens behind a shield. The player must
break or bypass the guard, then capitalize on a brief recovery window. At a
health threshold, the Provost changes stance and telegraphs a crushing attack.
Counterplay: conserve stamina, interrupt or evade the heavy strike, and use
the recovery opening.

### The Ashen Cantor

A ritualist who builds a visible focus meter while applying pressure with
Burning and control effects. At phase transition, the Cantor attempts a
powerful area-like duel attack represented clearly in the side-view scene.
Counterplay: interrupt the ritual, manage status effects, or spend a resource
to withstand the cast.

Both concepts are designed for one-on-one presentation. Phase triggers,
telegraphs, and status resistance should be authored as data where practical.

## Content data checklist

Each skill, status, enemy, and item definition should have a stable ID, display
name, concise description, tags, gameplay parameters, and presentation cues.
Avoid using display text as an identifier. Balance changes must not require
editing animation logic.
