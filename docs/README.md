# Design documentation

This folder is the design source of truth for the proposed **Godot-based,
mobile-first, 2D side-view turn-based combat RPG**. It describes a target
experience and a sequence for validating it; it does not describe a completed
Godot implementation. The existing web prototypes remain in place.

## Reading order

1. [Vision](vision.md) — product intent, pillars, audience, and non-goals
2. [Mini-GDD](mini-gdd.md) — the compact end-to-end game specification
3. [Combat design](combat-design.md) — combat contract and tactical rules
4. [Mobile HUD](mobile-hud.md) — mobile layout, controls, and feedback
5. [Initial content plan](initial-content-plan.md) — first playable content set
6. [Implementation roadmap](implementation-roadmap.md) — build sequence and
   acceptance gates

## How to use these documents

- Treat the mini-GDD as the cross-system overview; use the focused documents for
  detailed decisions.
- Keep combat rules, content definitions, and visual presentation separate.
  Resolution should produce structured combat events; animation presents those
  events and must not determine their outcome.
- Record material design changes in the relevant focused document and update
  references here when new systems are added.
- Numbers and effects below are initial design targets. Validate them in a
  playable prototype before treating them as balance commitments.

## Engine and implementation scope

Godot is the target engine for this design set, as required by the project
brief. The initial scope is a local, single-player vertical slice with no
account, online, or live-service requirement. Engine-specific implementation
choices beyond that target should be confirmed during the technical prototype.
