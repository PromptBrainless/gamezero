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
