# Mobile HUD and interaction

## HUD objectives

At a glance, the player should know:

1. Who is acting now?
2. What threat or opportunity is coming next?
3. How healthy and resourced are both combatants?
4. Which action can I take, and what will it cost?

Keep the battlefield visually dominant. The HUD should frame the encounter,
not cover it.

## Information hierarchy

### Always visible

- Player and enemy identity/portrait
- Health bars and clear low-health state
- Current actor and turn/round cue
- Enemy intent and threat category
- Available resources and selected action cost
- Primary action controls

### Visible when relevant

- Status icons, duration, and short labels
- Boss phase or special mechanic
- Target and action preview
- Contextual tutorial or warning

### Secondary / expandable

- Combat log
- Full character sheet
- Skill details and long descriptions
- Pause, speed, accessibility, and settings

## Layout guidance

Use a responsive composition rather than fixed pixel positions:

- **Upper combat band:** opposing health, identity, status summaries, and turn
  order.
- **Center stage:** characters, intent telegraph, and effects, with safe space
  around faces and attack silhouettes.
- **Lower action band:** resource summary and primary skills within thumb
  reach.
- **Secondary panel:** expandable combat log and detailed inspection.

On narrow screens, collapse labels before shrinking touch targets. Keep core
combatants and the primary action row visible without horizontal scrolling.
Respect device safe areas and reserve space for system gestures.

## Controls and action flow

- Tap an action to select it; show its cost, target, and concise effect before
  committing.
- Use a distinct confirm step only for high-impact or irreversible choices;
  avoid unnecessary taps for routine actions.
- Long-press or an information affordance opens a full tooltip.
- Make target selection explicit and reversible before confirmation.
- Provide a clear disabled state and reason when an action is unavailable.
- Never rely on drag gestures as the only way to perform a combat action.

Primary controls should be comfortably thumb-sized and spaced to reduce
mis-taps. Test both portrait and landscape prototypes before locking the
orientation; keep the chosen layout consistent in production.

## Health, resources, and status presentation

- Pair color with text, icon shape, or numeric context; color alone must not
  communicate health or status.
- Animate health changes briefly, but immediately expose the resulting value.
- Use distinct shapes or labels for beneficial, harmful, and neutral effects.
- Show stack count and remaining duration where relevant.
- Highlight urgent effects without flashing continuously.

## Intent and combat feedback

Enemy intent should use an icon plus a short label or inspectable tooltip.
Differentiate attack, defense, and special/boss actions by shape and
presentation, not color alone. A dangerous telegraph should remain visible
through animation and screen shake.

After an action, provide a brief result cue—hit, miss, blocked, interrupted,
status applied—then return attention to the next decision. Combat log text is
supplemental, not the sole way to understand what happened.

## Accessibility and device constraints

- Support scalable text and legible contrast.
- Offer reduced screen shake, flash intensity, and animation speed.
- Do not require precise multi-touch or rapid taps.
- Keep the interface usable at common phone sizes and tablet aspect ratios.
- Ensure system safe areas, keyboard focus on desktop, and controller
  navigation can be added without redesigning the hierarchy.
- Test with localization expansion; avoid baking text into images.

## HUD acceptance checks

- The player can identify turn owner and enemy intent in under a glance.
- Every disabled action explains why it cannot be used.
- Actions remain operable with one thumb and without accidental adjacent taps.
- The battlefield and telegraphs remain visible on the smallest target screen.
- Reduced-effects mode does not hide outcome or danger information.
