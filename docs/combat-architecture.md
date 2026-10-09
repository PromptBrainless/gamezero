# Combat architecture

Flow: **action → deterministic resolver → event stream → presentation**.

- `CombatState` / `CombatantState`: plain data, seeded RNG, no nodes.
- `TurnResolver`: turns actions into events (`AttackStarted`, `HitRolled`, `Blocked`, `CritTriggered`, `StatusApplied`, `HPChanged`, `Defeated`).
- Events are emitted over `EventBus.combat_event`; `ActorView` and `CombatHud` consume them.
- Initiative-based rounds; per turn one main action, one minor action, one reaction.
- Enemy AI: archetype rules, utility scoring, boss phase scripts layered on top.
- Existing reference rules: `src/game/w100/` and `src/game/`.
