# HUD ↔ Combat Event Integration Plan

**Milestone:** First Playable Build (resolver events) and Post-Slice Expansion (wave and progression events) · **Status:** planning + staged binding example · **Owns:** how presentation consumes events. Module behaviour stays in [`../hud-spec.md`](../hud-spec.md); event production stays with the combat-event contract.

## Purpose

Connect the combat HUD and the Reward/Progression screens to the ordered event stream emitted by the resolver and the progression service, so that every visible number, status and transition comes from an event payload or a resolved record. The HUD becomes a pure consumer: it folds events into a view model, paces them for readability, and never applies combat rules.

## Scope

**In scope**

- One data file (`hud_event_binding`) that maps each event type to HUD modules, the payload fields they read, log verbosity and pacing.
- The presentation pipeline in Godot: event bus → router → presentation queue → modules.
- HUD view-model rules (initial snapshot + events), input locking and the HUD interaction states.
- Resolver events for the slice and the post-slice wave/progression events from [`../final-data-entities/`](../final-data-entities/README.md).

**Out of scope**

- Event production, payload validation and preview computation (combat-event contract / WS02).
- Visual styling, icons and animation assets ([`../ui-style-guide.md`](../ui-style-guide.md), Sprint 1 art pack).
- VFX choreography beyond pacing classes; camera work; audio mix.

## Entity list

| Entity                | Kind                    | Location                                                                      | Notes                                                                                    |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Combat event envelope | runtime (from contract) | resolver output                                                               | `{sequence, type, turn, source_id?, target_id?, payload}` — sequence strictly increasing |
| `hud_event_binding`   | authored                | `game/runtime_data/examples/ui/` (type `types/hud_event_binding.schema.json`) | Example: `combat_hud_event_bindings`                                                     |
| HUD view model        | runtime                 | Godot UI layer                                                                | Derived only from the resolved encounter snapshot and events                             |
| Presentation queue    | runtime                 | Godot UI layer                                                                | Applies pacing; never reorders or drops events                                           |
| Event log entry       | runtime                 | Godot UI layer                                                                | Text + values from payload, verbosity from binding                                       |

## Data model outline

### `hud_event_binding.events[]`

| Field            | Type                                                                                                                                                                                              | Meaning                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `event_type`     | id, unique                                                                                                                                                                                        | Event `type` as emitted                                                                                                     |
| `source`         | `resolver` \| `run`                                                                                                                                                                               | `resolver` events update HUD modules; `run` events (progression service) update only `reward_screen` / `progression_screen` |
| `modules`        | ≥ 1 of `phase_header`, `combatant_panel`, `resource_meter`, `status_rail`, `battlefield`, `action_selector`, `preview_panel`, `event_log`, `tooltip_layer`, `reward_screen`, `progression_screen` | Modules that must refresh                                                                                                   |
| `payload_fields` | ids                                                                                                                                                                                               | Payload keys the modules read; the contract must provide them                                                               |
| `log`            | `none` \| `summary` \| `detail`                                                                                                                                                                   | `summary` always in compact log; `detail` only in the expanded log. Logged events include `event_log`                       |
| `pacing`         | `instant` \| `short` \| `beat` \| `hold`                                                                                                                                                          | 0 ms / ≈250 ms / ≈600 ms / wait for tap or the auto-advance setting                                                         |

### Event → module table (first binding)

| Event                 | Source   | Modules                                | Payload                                | Log     | Pacing  |
| --------------------- | -------- | -------------------------------------- | -------------------------------------- | ------- | ------- |
| `encounter_started`   | resolver | phase header, battlefield, panels, log | `encounter_id`, `stage_id`             | summary | beat    |
| `wave_started`        | resolver | phase header, battlefield, panels, log | `wave_id`, `combatant_ids`             | summary | beat    |
| `round_started`       | resolver | phase header                           | `round`                                | none    | short   |
| `turn_started`        | resolver | phase header, panels, action selector  | `actor_id`                             | none    | short   |
| `action_declared`     | resolver | battlefield, log                       | `action_id`, `target_ids`              | summary | short   |
| `resource_spent`      | resolver | resource meter                         | `resource`, `amount`, `current`, `max` | none    | instant |
| `damage_dealt`        | resolver | battlefield, log                       | `amount`, `damage_type`, `critical`    | summary | beat    |
| `hp_changed`          | resolver | panels, resource meter                 | `current`, `max`                       | none    | instant |
| `status_applied`      | resolver | status rail, log, tooltip              | `status_id`, `duration`, `stacks`      | summary | short   |
| `status_ticked`       | resolver | status rail, log                       | `status_id`, `amount`, `remaining`     | detail  | short   |
| `status_removed`      | resolver | status rail, log                       | `status_id`, `reason`                  | detail  | short   |
| `reaction_triggered`  | resolver | battlefield, log                       | `skill_id`, `trigger`                  | summary | beat    |
| `telegraph_announced` | resolver | phase header, panels, log              | `skill_id`, `warning_turns`, `icon`    | summary | hold    |
| `phase_changed`       | resolver | phase header, panels, log              | `phase_id`, `phase_name`               | summary | hold    |
| `combatant_defeated`  | resolver | battlefield, panels, log               | `combatant_id`                         | summary | beat    |
| `encounter_ended`     | resolver | phase header, log                      | `outcome`                              | summary | hold    |
| `xp_awarded`          | run      | reward, progression screens            | `amount`, `total_xp`                   | none    | beat    |
| `item_granted`        | run      | reward screen                          | `item_id`                              | none    | short   |
| `level_up`            | run      | progression screen                     | `class_id`, `level`, `stat_gains`      | none    | hold    |
| `skill_unlocked`      | run      | progression screen                     | `skill_id`                             | none    | beat    |

The authoritative copy is `game/runtime_data/examples/ui/combat_hud_event_bindings.json`; this table documents it. Event names follow the candidate list in [`../combat-architecture.md`](../combat-architecture.md) and are provisional until the combat-event contract is merged — renames happen in the binding file and this table only.

### Pipeline

```text
TurnResolver.resolve() ─► ordered events ─► EventBus.combat_event(event)
                                              │
                         HudEventRouter (bindings by event_type)
                                              │
                         PresentationQueue (pacing; FIFO by sequence)
                                              │
              HudViewModel.apply(event) ─► module refresh (only bound modules)
```

- **View model:** `hud_state = fold(resolved_encounter_snapshot, events)`. Modules read the view model, never the resolver state or data registries for gameplay numbers (tooltips may read canonical text).
- **Ordering:** the queue processes events strictly by `sequence`; a gap or regression is a dev error. Fast-forward/skip applies remaining events instantly in order — the final view model is identical with and without pacing.
- **Input lock:** `Confirmed → Resolving` starts when the first event of an action batch is queued; the HUD returns to `Idle` when the queue is empty and the next `turn_started` belongs to the player.
- **Preview:** the preview panel uses the non-mutating preview result from the combat contract, never events; previews do not touch the view model.
- **Unknown event type:** dev builds fail loudly; release builds log a generic summary line and refresh nothing else.
- **Reduced motion:** `short` and `beat` become `instant`; `hold` remains so telegraphs and phase changes are still acknowledged.
- **Accessibility:** every logged event renders text with its values; status changes keep shape + text, not colour alone ([`../hud-spec.md`](../hud-spec.md)).

## Dependencies

| Depends on                                                                                               | For                                                                  |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`../hud-spec.md`](../hud-spec.md), [`../first-playable-ui-plan.md`](../first-playable-ui-plan.md)       | Module list, interaction states, acceptance                          |
| [`../combat-architecture.md`](../combat-architecture.md)                                                 | Resolver authority; events are ordered and stable per seed           |
| Combat-event contract and WS02 contract boundary (parallel workstreams)                                  | Envelope, final event names and typed payloads; non-mutating preview |
| [`../final-data-entities/enemies-and-encounters.md`](../final-data-entities/enemies-and-encounters.md)   | Wave, telegraph, phase and terminal events                           |
| [`../final-data-entities/classes-and-progression.md`](../final-data-entities/classes-and-progression.md) | Run events for Reward/Progression screens                            |
| `godot/scripts/core/event_bus.gd`, `godot/scripts/ui/combat_hud.gd`                                      | Existing signal (`combat_event`) and HUD node to extend              |

## Implementation sequence

1. **Binding data (this change).** Type definition and first binding file, validated by `scripts/runtime-data-examples.test.mjs` (unique types, run events off the HUD, logged events include the log).
2. **Reconcile with the event contract.** When the contract lands, align names and `payload_fields` with its typed payloads; add a test that every contract event type has exactly one binding.
3. **Router and queue.** Add `godot/scripts/ui/hud_event_router.gd` (loads the binding, dispatches by type) and `godot/scripts/ui/presentation_queue.gd` (pacing, skip, reduced motion), subscribed to `EventBus.combat_event`.
4. **View model.** Add `godot/scripts/ui/hud_view_model.gd` with `apply(event)`; unit-test that folding a recorded event stream yields the expected final state with and without pacing.
5. **Module wiring.** Extend `CombatHud` (`godot/scripts/ui/combat_hud.gd`) so each module refreshes from the view model when routed; start with panels, meters, status rail and log, then telegraph/phase header.
6. **Screens.** Reward and Progression screens subscribe to run events from the progression service.
7. **Replay check.** Record the event streams of the four slice encounters with a fixed seed and replay them through the HUD headlessly; assert identical final view models and no unbound events.

## Definition of done

- Every event type emitted by the resolver and progression service has exactly one binding; unbound or out-of-order events fail in dev.
- HUD values (HP, resources, statuses, phase, telegraphs, log values) equal the payloads of the replayed stream; the HUD contains no damage, cost or duration calculations.
- Skip/fast-forward and reduced motion produce the same final view model as normal pacing.
- Input is locked during resolution and unlocked exactly on the player's next `turn_started`.
- Telegraphs and boss phase changes are visible and acknowledged (`hold`) on narrow mobile and wide layouts.
- Reward and Progression screens show XP, items, level-ups and unlocks only from run events.
