# Mini-GDD

## Overview

| Field            | Target                                                 |
| ---------------- | ------------------------------------------------------ |
| Genre            | Turn-based combat RPG                                  |
| View             | 2D side-view, one-on-one arena combat                  |
| Engine target    | Godot                                                  |
| Primary platform | Mobile; desktop supported for development              |
| Mode             | Single-player, local progression                       |
| Tone             | Grounded dark fantasy with readable, deliberate action |

The game combines tactical duels with career-based character growth. The player
builds one combatant, selects equipment and skills, fights opponents with
distinct behavior, and spends earned advancement between encounters.

## Core loop

1. Review the next opponent and any encounter rules.
2. Select a profession, skills, equipment, and optional consumables.
3. Enter a duel and read the opponent's intent.
4. Choose an action, resolve its costs and effects, then review the result.
5. Win, lose, or withdraw; receive a clear combat summary and rewards.
6. Spend experience on career advances, adjust the loadout, and choose the next
   encounter.

## Meta loop

**Fight → earn XP and rewards → advance a career → refine a build → unlock
harder encounters and cosmetics → fight again.**

Long-term progression has four layers:

1. **Character growth:** attributes, derived values, and experience.
2. **Career growth:** profession ranks, talents, and skill access.
3. **Equipment growth:** weapons, armor, accessories, and consumables.
4. **Collection growth:** encounters, enemy records, and cosmetic options.

The first slice needs only local save data. No account or shared service is
assumed.

## Combat loop

Each round, the active combatant chooses one primary action. Some actions also
consume a limited resource or establish a defense. Initiative determines the
order; visible intent gives the defender a chance to respond on their next
decision. The resolver produces an ordered event list, then the presentation
layer plays it back.

See [Combat design](combat-design.md) for the action contract, status behavior,
and encounter rules.

## Characters and professions

The character starts with one of five professions: **Sellsword, Duelist,
Hunter, Marksman, or Hedge Mystic**. A profession establishes starting
attributes, equipment familiarity, signature skills, and a career advance
path. It should guide rather than permanently restrict later builds.

The player-facing identity is expressed through profession, face and hair
options, palette choices, weapon, armor layers, and combat animations. Character
customization should use modular 2D layers or rig attachments so equipment is
visible during battle.

## Progression

- **Experience:** awarded for encounters, with modest bonuses for boss victories
  and optional challenge objectives.
- **Career ranks:** unlock profession advances, talents, and skill choices.
- **Attributes:** improve a small set of checks and derived combat values.
- **Equipment:** changes defense, initiative, damage profile, and selected
  actions; avoid steep item-level escalation.
- **Cosmetics and records:** reward collection and mastery without mandatory
  power growth.

Progression should create horizontal choices as well as vertical improvement.
Encounter mechanics, not just larger health pools, provide challenge.

## Inventory and equipment

The equipment layout uses explicit slots:

- Main-hand weapon
- Off-hand item, shield, or focus
- Head
- Chest
- Hands
- Legs
- Accessory 1
- Accessory 2
- Talisman
- Quick consumable

Items are data-driven definitions with slot, base properties, tags, and any
special effect. The inventory UI owns selection and comparison; the combat
resolver consumes the resulting loadout rather than UI state.

## Presentation

Use a polished 2D presentation: expressive character poses, readable attack and
defense silhouettes, restrained hit-stop and screen shake, distinct impact
effects, and layered arena backgrounds. A high-frame-rate pixel approach or
skeletal 2D animation are both viable; validate asset cost and device
performance in the first visual slice.

Combat results must remain readable with reduced effects and at low frame
rates. Animation is driven by resolved events, never by gameplay timing.

## Interface

The combat screen prioritizes combatants and health, current turn, enemy intent,
resources, available actions, and status effects. Secondary information such
as the combat log and settings is accessible but does not compete with primary
actions. See [Mobile HUD](mobile-hud.md).

## First playable content

The first content package is intentionally bounded:

- 5 starting professions
- 12 core status effects
- 20 starting skills
- 6 enemy archetypes
- 2 boss concepts

Names and initial behavior are defined in [Initial content plan](initial-content-plan.md).

## Technical design constraints

- Keep combat state and resolution deterministic for a given state, action,
  and random seed.
- Separate definitions (skills, statuses, enemies, items) from runtime state.
- Emit structured combat events for UI, animation, logs, and tests.
- Make core resolution independently testable without scene nodes.
- Profile on representative mobile devices before increasing visual complexity.

## Open decisions

- Final attribute list, probability curve, and action economy
- Whether range is a discrete lane state or a simple close/reach distinction
- Final art style and animation tooling
- Career rank count, campaign structure, and reward pacing

These are prototype questions, not reasons to expand the first slice.
