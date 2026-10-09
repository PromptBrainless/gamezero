# Vertical Slice Implementation Plan

Coordinates the first playable build. Details: `runtime-data-plan.md` (Track 1) and `first-playable-ui-plan.md` (Tracks 2 and 3).

## Goal
One complete run: **Career Select → Encounter Preview → Combat → Reward → Progression**, fully data-driven, with a tactical numbers-open HUD.

## Tracks
| # | Track | Output | Depends on |
|---|---|---|---|
| 1 | Data Runtime Foundation | loader, registries, validation, `EncounterResolver`, slice content | — |
| 2 | UI Foundation | combat HUD modules, interaction states, tooltip/preview | schemas from Track 1 |
| 3 | First Playable Screen Flow | five screens and `ScreenFlow` | Tracks 1 and 2 |

## Sequence
1. **Contracts**: finalize record schemas (Track 1 item 1). Unblocks UI work against sample data.
2. **Parallel**: Track 1 items 2–5 alongside Track 2 items 1–3 using hand-written resolved-encounter fixtures.
3. **Integrate**: swap fixtures for `EncounterResolver` output; author slice content (Track 1 item 6).
4. **Flow**: Track 3 screens and `ScreenFlow`.
5. **Playthrough**: full run including boss; fix defects only.

## Scope boundaries
- In: 2–3 careers, 3 normal encounters, 1 boss, reward and progression for the run.
- Out: save/load, inventory screen, map/overworld, localization, audio, settings, new mechanics beyond those defined in the data schemas.
- New requests go to a post-slice backlog and are not added to this track.

## Done criteria for the slice
- Track 1, 2 and 3 done criteria all met.
- A run starting at Career Select reaches Progression after each encounter, and the boss encounter is completable.
- No gameplay value is hardcoded outside JSON data.
- Broken data is reported by validation at startup with clear errors.
