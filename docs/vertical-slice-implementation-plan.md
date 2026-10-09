# Vertical Slice Implementation Plan

Coordinates one complete first-playable run. The runtime details are in [`runtime-data-plan.md`](runtime-data-plan.md); HUD and screens are in [`first-playable-ui-plan.md`](first-playable-ui-plan.md).

## Goal

Complete **Career Select → Encounter Preview → Combat → Reward → Progression** using validated, connected slice content.

## Tracks and dependencies

| Track | Output | Depends on |
|---|---|---|
| 1. Data Runtime Foundation | JSON loader, validation, registries, encounter resolver, slice content | Canonical schema |
| 2. Combat HUD Foundation | HUD modules, action/target/preview flow, tooltips, event display | Schema and sample resolved data |
| 3. First Playable Screen Flow | Five screens and minimal run-state handoff | Tracks 1 and 2 |

## Sequence

1. Confirm schema, content identifiers, and resolved-record contract.
2. Implement the data runtime and HUD foundations using valid fixtures.
3. Integrate canonical content and resolve normal and boss encounters.
4. Connect Career Select, Encounter Preview, Combat, Reward, and Progression.
5. Complete the whole encounter sequence and fix slice-blocking defects only.

## Slice content budget

The current consolidated content target is three careers, nine player skills, six statuses, three normal enemies, one boss, eleven items, and four ordered encounters. Content count does not authorize extending mechanics beyond `data-schema.md`.

## Scope boundaries

In scope: the connected combat loop, minimal reward/progression handoff, data validation, and HUD feedback needed to complete the slice.

Out of scope: save/load, overworld, shop, inventory-management screen, localization pipeline, networking, extensive content catalogs, and unapproved mechanics. New requests belong in a post-slice backlog unless required to meet a stated done criterion.

## Done criteria

- All three tracks meet their documented done criteria.
- A player can select a career, preview/start encounters, complete combat, receive rewards, and advance through the slice.
- All in-scope data loads by ID; malformed data and unresolved references are reported.
- Combat/UI consume resolved data and results; no gameplay value is duplicated as hardcoded content.
