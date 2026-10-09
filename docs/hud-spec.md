# Combat HUD Spec

Follows `ui-style-guide.md`. All values are numeric and visible.

## Modules
| Module | Position (desktop) | Content |
|---|---|---|
| Turn Order | top | Initiative queue, next 8 actors, active highlighted |
| Unit Cards | left (party) / right (enemies) | Name, career, HP, Guard, Focus as `cur/max`, status chips |
| Boss Panel | top-right, replaces enemy card | Name, phase name (e.g. `sickly_veil`), HP, phase threshold markers, active mechanics |
| Skill Bar | bottom | Skills with cost, cooldown, hotkey 1–9 |
| Target Preview | near target | Hit %, damage min–max, applied statuses, lethal flag |
| Combat Log | bottom-left | One line per event with full numbers, filterable |
| Tooltip | cursor/anchor | Per tooltip rules |

## States
- **Idle/Enemy turn:** skill bar dimmed, still inspectable.
- **Player turn:** active unit highlighted amber; skill bar enabled.
- **Skill selected:** valid targets outlined amber, invalid dimmed with reason on hover/long-press.
- **Target hovered/confirm pending:** Target Preview shown; second tap/click confirms.
- **Resolving:** input locked; log streams events.
- **Defeat/Victory:** summary of damage dealt, taken, statuses applied.

Skill button states: `ready`, `no_resource` (shows missing amount), `cooldown N`, `blocked` (e.g. stunned, shows status).

## Numbers-open rules
- Damage preview is a range and hit chance; no hidden rolls.
- Each resolved hit logs: `actor → skill → target: base, modifiers, final, remaining HP`.
- Status application logs chance and result.

## Mobile layout (portrait)
Top: turn order. Middle: enemy cards (boss panel full width) over party cards. Bottom: skill bar, 4 slots visible with horizontal scroll for more; log as drawer; target preview as a bottom sheet above the skill bar. Landscape uses the desktop layout.

## Acceptance
Every module has all states above implemented; no information exists only in tooltips on mobile; all numbers match data files.
