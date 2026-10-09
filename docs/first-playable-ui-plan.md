# First Playable UI Plan — UI Foundation and Screen Flow

Tracks 2 and 3 of the first playable vertical slice. See `vertical-slice-implementation-plan.md`.

## Principles
- Tactical, numbers-open: show exact values (HP, Stamina, Fokus, Guard, Initiative, hit/crit chance, damage range, costs). Sober, readable; dark-fantasy styling must never hide information.
- Mobile-first portrait layout; touch flow: tap skill → tap target → preview → confirm. Long press shows full tooltip.
- Data-driven: all UI content comes from `DataRuntime` / `EncounterResolver`.

## Scope
In: combat HUD modules, interaction states, tooltip and preview, and the five screens of the flow.
Out: inventory management screen, full combat log screen, animations beyond hit numbers, audio, settings, boss-specific art.
(Inventory and boss HUD variants follow after the slice; the boss HUD reuses the same modules with the extra Boss Header fields listed below.)

## Track 2 — UI Foundation

### Combat HUD modules (top to bottom)
| Module | Content |
|---|---|
| `TopBar` | Pause, speed 1x/2x, Auto on/off, log toggle |
| `EnemyPanel` | name, HP/Guard/Fokus with bar, statuses, intent, telegraph level. Boss variant adds phase `n/m` and pattern label |
| `Battlefield` | combatant markers, floating damage/status numbers |
| `PlayerPanel` | name, HP/Stamina/Fokus/Guard/Initiative, reaction, bars, statuses |
| `ActionBar` | Attack, Skills, Item, Stance, Reaction |
| `PreviewPanel` | target, hit %, damage range, crit %, cost, status chance, enemy reaction risk |
| `CombatLogStrip` | last lines, expandable; compact one-line entries |

### Interaction states
`Idle → ActionMenuOpen → SkillSelected → TargetSelect → PreviewShown → Confirmed → Resolving → Idle`, plus `Disabled` (not enough resources or on cooldown, with reason shown) and `Ended`. Cancel returns one step back. Input is locked in `Resolving`.

### Tooltip and preview support
- `TooltipPanel` reusable for skill, status and item, in this order: title/type line, plain description, costs/range/target, mechanics, live preview (skills only), tags.
- Triggers: long press on skill/item/status icon; tap on a status icon.
- Preview values are computed by a combat-side `PreviewCalculator`, UI only displays them.
- Status tooltip shows duration, max stacks, stack rule, per-round effect, removal sources, expiry at combat end.

## Track 3 — First Playable Screen Flow
`Career Select → Encounter Preview → Combat → Reward → Progression`

| Screen | Content | Exit |
|---|---|---|
| Career Select | list of careers with base stats, starting skills, starting items; detail on selection | Confirm → Encounter Preview |
| Encounter Preview | enemies with stats, intent patterns, telegraph, difficulty, reward table summary | Start → Combat |
| Combat | HUD above | Win → Reward; Loss → Career Select |
| Reward | XP, currency, items gained with item tooltips; Take all | Continue → Progression |
| Progression | current level, XP bar, stat gains and unlocks of next level, then new unlocks applied | Continue → Encounter Preview (next encounter) |

Screens are managed by a `ScreenFlow` state machine in a single run-state object (`selected_career`, `encounter_index`, `xp`, `inventory`). No persistence in the slice.

## Work items
1. Scene and theme skeleton: shared styles, `TooltipPanel`, bar and status chip components.
2. Combat HUD modules with static data from a resolved encounter.
3. Interaction state machine and `PreviewPanel` wiring.
4. Remaining four screens and `ScreenFlow`.
5. Full run through 3 encounters and the boss.

## Done criteria
- All HUD modules render real resolved data in a 390×844 portrait viewport without overflow.
- Every interaction state is reachable, and disabled actions show their reason.
- Tooltips show all fields listed above for a skill, a status and an item.
- A complete run Career Select → … → Progression loops through all slice encounters without errors.
