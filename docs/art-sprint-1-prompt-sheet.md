# Art Sprint 1: Generator Prompt Sheet

Use the [production pack](art-sprint-1-production-pack.md) for final decisions on scope, palette, exports, and acceptance. Prompts are starting briefs, not authority to change the game or ship unreviewed generated output.

## Global style prompt

> Design a restrained, premium tactical combat interface for GameZero's first playable slice. Dark charcoal-green surfaces, warm ivory information, muted sage support text, a controlled burnt-orange attack/danger accent, pale steel-blue defense accent, olive movement accent, and soft-gold focus accent. Crisp high-contrast shapes, subtle etched construction details, deliberate negative space, compact but readable information hierarchy, calm and precise rather than noisy. Keep all labels and numbers editable and outside artwork. Maintain a consistent silhouette language and practical mobile-first legibility. Do not invent lore, mechanics, characters, stats, or interface copy.

### Global negative prompt

> Avoid photorealism, glossy mobile-game gradients, excessive glow, neon cyberpunk, cluttered ornament, tiny filigree, low contrast, soft blurry silhouettes, faux text, random letters, illegible numbers, logos, watermarks, UI screenshots with invented copy, extra controls, character portraits, gore, and details that imply an unapproved game mechanic. Avoid making meaning depend on color alone.

## HUD module prompts

For a full-screen layout prompt, state the target aspect ratio/viewport and request separate mobile and wide-screen compositions rather than a single layout that merely scales.

### HUD-01 — Combat frame and phase header

> Create a compact tactical combat frame and phase header. Reserve a clear, shallow header for encounter context and current phase/round; leave the central combat area open. Use strong alignment, restrained borders, dark layered surfaces, warm ivory labels, and one soft-gold focus detail. Include placeholder blocks only, with no generated words, numbers, logos, characters, or new systems. Show mobile and wide-screen arrangements.

### HUD-02 — Player and target status cards

> Design a matched pair of player and target status cards for a turn-based combat HUD. Each card should clearly reserve identity, a prominent body/health value, and a compact row for other relevant combat state. Differentiate sides through label placement, framing, and shape as well as accent color. Make the selected/active card clear without a large glow. Use editable empty label areas; do not create character portraits or invent stats.

### HUD-03 — Resource meter family

> Design a coherent set of compact resource meters for body/health, energy, break/strain, protection, and tempo. Each meter needs visible ticks or segments and a separate readable value area; show full, partial, low, and changed examples. Use different semantic cues and a restrained palette, but make every value understandable without color. No text or numerals should be baked into the art.

### HUD-04 — Status and effect rail

> Design a compact status/effect rail that can hold several square icon chips with a small duration/stack cue and a tap/hover explanation affordance. Show normal, selected, and warning examples using simple silhouettes and generous spacing. Leave label/value areas blank and editable; do not invent states beyond the supplied icon list.

### HUD-05 — Combat action selector

> Design a touch-friendly combat action selector with four equally legible choices: attack, guard, move, influence. Each choice has an icon area, editable label area, and clear default, focused, selected, pressed, and unavailable states. Attack should feel decisive, guard stable, move directional, and influence deliberate. Do not imply differing costs or invent additional actions.

### HUD-06 — Reaction and ability controls

> Design a secondary control group for optional reactions and a character ability. Make the controls discoverable but visually subordinate to the four main action choices. Reserve a clear editable cost/availability area, with ready, selected, and unavailable examples. Keep the controls compact and touch-friendly; do not invent a reaction, ability, or cost.

### HUD-07 — Board and target affordances

> Create a small style sheet of tactical board target states: legal, focused, selected, occupied, and marked. Show each as a clean, unobstructive overlay around a target location. Use shape, line pattern, and contrast in addition to color. Keep the combatant/board visible beneath the affordances and do not add new field rules.

### HUD-08 — Turn and event log

> Design a scannable combat event log for a turn-based HUD. Show a compact latest-event row and a more detailed expanded row using a simple icon slot, clear hierarchy, and readable text placeholder lines. Distinguish attack, defense, movement, and effect events through icon/label treatments, not just color. No generated text, fake numbers, or new event types.

### HUD-09 — Tooltip, help, and confirmation layer

> Design a concise tooltip/help layer and a confirmation panel treatment that works for pointer hover, keyboard focus, and mobile tap. Keep text on a high-contrast surface, provide a clear dismiss/return affordance, and avoid covering the action or target being explained. Use blank editable text areas; do not generate copy or additional game systems.

## Icon prompt template

For each icon prompt below, append:

> Single isolated square icon, centered by optical mass, bold open silhouette, consistent line/shape weight, clear negative space, readable at 32 px and recognizable at 24 px, transparent background, no frame or tile, no text or number, monochrome-first. Follow the GameZero global style. Produce one symbol only; do not add alternate symbols or a sheet.

Append the global negative prompt where supported. Keep the finished master editable and manually normalize it to the shared icon construction rules.

## The 36 icon prompts

### Action icons

1. **`action-attack`** — A decisive forward strike represented by two crossing short blades or one clean impact slash; communicate commitment and direction without blood, a specific character, or a damage number.
2. **`action-guard`** — A compact upright shield with a firm central brace; communicate held defense and stability, not invulnerability.
3. **`action-move`** — A clear stepping boot or forward double-chevron with a small evasion arc; communicate repositioning without implying a specific distance.
4. **`action-influence`** — A central point shaping two orbiting rings or connected nodes; communicate deliberate manipulation of a field/effect, not magic of a specific lore type.

### Combat resource icons

5. **`resource-body`** — A simple heart-like core protected by a clean outer contour; communicate remaining body/health, with no medical cross or gore.
6. **`resource-energy`** — A compact contained spark or angular charge cell; communicate a spendable reserve without a numeric value.
7. **`resource-break`** — A solid plate or stone marked by one controlled fracture; communicate accumulating break/strain, not a destroyed character.
8. **`resource-protection`** — A small shield around a single inset line or dot; communicate active protection with a calm, stable silhouette.
9. **`resource-tempo`** — A precise metronome tick or offset clock-hand mark; communicate action timing/tempo, not a clock interface or time travel.

### Status icons

10. **`status-open`** — An opened guard or split outline with a clear gap; communicate an exposed state without a wound.
11. **`status-bound`** — Two restrained links crossing a simple central form; communicate restraint with a silhouette that stays legible when tiny.
12. **`status-confused`** — A broken or offset directional arrow around a central point; communicate disrupted orientation without a question mark or text.
13. **`status-wounded`** — A small notched body/armor silhouette with one restrained cut line; no blood, gore, or medical symbol.
14. **`status-guarded`** — A shield with a closed, reinforced inner contour; distinguish this status from the general protection resource icon.

### Reaction icons

15. **`reaction-dodge`** — A quick sidestep silhouette with one short trailing motion line; communicate an evasive reaction without specifying movement distance.
16. **`reaction-riposte`** — A short blade returning along a hooked arc; communicate an immediate counter, not a generic attack.
17. **`reaction-stabilize`** — A steady central form held level by a firm crossbar or bracing hand; communicate regaining control, not healing.
18. **`reaction-secure`** — A compact clasp or locking ring closing around a small core; communicate preserving an effect or resource.

### Echo icons

19. **`echo-attack`** — A sharp outward pulse shaped around a forward strike; distinct from the direct `action-attack` icon by its echoing ring.
20. **`echo-guard`** — A shield surrounded by one repeating resonance arc; communicate a stored defensive effect.
21. **`echo-move`** — A stepping mark repeated once along a short curved path; communicate a lingering movement effect, not a direction selector.
22. **`echo-influence`** — Two linked nodes inside one resonant ring; communicate a stored influence effect.
23. **`echo-trap`** — A compact sprung loop or concealed angular snare; communicate a placed hazard without spikes or gore.
24. **`echo-barrier`** — A firm segmented wall with a visible boundary line; distinguish it from personal protection by emphasizing a field boundary.
25. **`echo-mist`** — Three clean, spaced drifting bands surrounding an open center; maintain strong silhouette at small size.
26. **`echo-rift`** — A narrow split through a contained ring; communicate a spatial tear abstractly, without cosmic scenery.

### Field marker icons

27. **`marker-brand`** — A simple stamped diamond or seal with a central mark; communicate a placed brand without letters or a faction emblem.
28. **`marker-mist`** — A low curling cloud bounded by a small location dot; distinguish a placed field marker from the stored `echo-mist`.
29. **`marker-mirror`** — A narrow reflective plane with one reversed line; communicate reflection without a detailed mirror frame.
30. **`marker-guard`** — A grounded shield pin or protected field tile; distinguish a placed guard marker from personal protection and `echo-guard`.
31. **`marker-rift`** — A small split ring anchored to a location point; distinguish the placed marker from the stored `echo-rift`.
32. **`marker-bind`** — A tied loop fixed to a compact ground line; communicate a binding field marker without duplicating the personal `status-bound` silhouette.

### Equipment slot icons

33. **`gear-weapon`** — A neutral, compact weapon silhouette with no specific weapon model or attack effect.
34. **`gear-armor`** — A simple chest-plate silhouette with one clean central seam; no character or class styling.
35. **`gear-tool`** — A small multi-purpose hand tool silhouette with a clear handle and head; avoid a weapon-like profile.
36. **`gear-artifact`** — A contained abstract relic core with one restrained orbit or notch; no rune text, lore, or implied ability.
