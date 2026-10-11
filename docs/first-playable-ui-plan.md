# First Playable UI Plan — HUD Foundation and Screen Flow

Tracks 2 and 3 of the vertical slice. See [`vertical-slice-implementation-plan.md`](vertical-slice-implementation-plan.md).

## Principles

- Tactical and explicit: show values the data/runtime actually provides; do not invent a second combat model in UI.
- Mobile-first, responsive composition. The first reference set includes a narrow portrait layout and a wide layout; final device orientation is an open project decision.
- Touch flow: choose action → choose target → inspect preview → confirm. Provide focus/tap alternatives to hover.
- UI content is driven by validated runtime records and ordered combat events.

## Track 2 — Combat HUD

Modules, appearance, and acceptance are specified in [`hud-spec.md`](hud-spec.md); style and accessible interaction are specified in [`ui-style-guide.md`](ui-style-guide.md). Core modules:

- Phase/round header
- Player and enemy panels
- Battlefield and target affordances
- Action selector and preview panel
- Status/effect rail and tooltip
- Compact event log

Interaction: `Idle → Action selected → Target selected → Preview → Confirmed → Resolving → Idle`. Unavailable actions explain why; cancel returns one step; resolution locks conflicting input.

## Track 3 — First Playable Screen Flow

| Screen | Content | Exit |
|---|---|---|
| Career Select | The three canonical careers, their schema-defined stats and starting skills/items | Confirm → Encounter Preview |
| Encounter Preview | Encounter identity, enemies/boss, difficulty, arena key, and inline reward summary | Start → Combat |
| Combat | The HUD above, driven by the resolved encounter and event stream | Win → Reward; loss/exit follows the agreed run flow |
| Reward | Encounter XP and any item rewards | Continue → Progression |
| Progression | Minimal run handoff to the next encounter; do not invent a career rank track absent from the schema | Continue → next Encounter Preview or finish |

Keep run state minimal and in-memory for the slice. Persistence and a full inventory/progression meta-system are out of scope.

## Work sequence

1. Establish shared styles, status chips, meter, and tooltip foundations.
2. Render HUD modules with resolved sample data.
3. Implement action/target/preview states and event presentation.
4. Connect the five-screen flow and encounter/result handoff.
5. Play through the complete four-encounter slice and fix integration defects.

## Done criteria

- HUD modules render resolved data in narrow mobile and wide-screen references without overflow.
- Action/target/preview/confirm/resolution states work, including visible unavailable reasons.
- Help and status details work on touch and keyboard, not just hover.
- Career Select → Encounter Preview → Combat → Reward → Progression completes using the real slice data.

## Native implementation

The boot scene mounts `CombatHUD`; `scripts/core/main.gd` owns navigation and
the run context while `scripts/ui/combat_hud.gd` renders it. All career and
encounter choices come from the exported registries. Action selection, living
target selection, numeric preview, confirmation and cancellation are separate
input states. Help uses focusable controls, not hover alone.

Victory grants the encounter's inline XP/items once; defeat offers retry or a
new career without rewards. Progression is deliberately an in-memory summary
and encounter cursor, **not** a new level/rank/unlock track. Combatants start each
encounter with career equipment and restored resources; earned consumables are
handed into subsequent encounters. Random loot rolls and equipping earned gear
remain follow-up scope, rather than duplicating inline reward grants.

Native flow tests exercise transitions, rejected content, reward idempotence,
defeat/retry and reset. Responsive career cards and two-column/stacked combat
panels include a procedural side-view stage. Stage clicks route real target
intents; event-driven damage labels use detached snapshots and sequence cursors.
Statistics and the full ordered log can be disclosed without hiding primary
actions behind the log. The movement toggle disables event animation.

Narrow portrait and wide native reference captures are retained in
`screenshots/godot-*.png`; exact results and limits are in the
[execution log](project-history-and-execution-log.md#2026-10-11-native-presentation-and-linux-export).
Final actor/environment art and physical-device acceptance remain production
work. Procedural presentation does not satisfy the WS05 art approval gates.
