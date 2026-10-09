# Art Sprint 1: Production Pack

This pack turns the current first-playable planning into an executable art brief. Sprint 1 is deliberately narrow: establish a readable combat HUD visual kit and a reusable set of 36 core combat icons. It does not expand the game’s rules, add new systems, or attempt final character, enemy, environment, or promotional art.

Related documents:

- [Sprint 1 task checklist](art-sprint-1-task-checklist.md)
- [Generator prompt sheet](art-sprint-1-prompt-sheet.md)
- [Project history and execution log](project-history-and-execution-log.md)

## 1. Slice context and scope

The planned first playable slice follows:

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

Combat is the visual center of this sprint. HUD components and icons should make the player's current state and available actions legible without changing the gameplay model. Keep names and semantics aligned with the canonical slice content and schema when those are available; art labels in this pack are production identifiers, not a new data schema.

### In scope

- One cohesive combat HUD visual language and reusable module kit.
- Responsive layout guidance for narrow/mobile and wide screens.
- 36 monochrome-first core combat icons in seven categories.
- Neutral, selected, hover/focus, disabled, and warning treatments where a module needs them.
- Source masters, exported assets, naming, and handoff notes.

### Out of scope

- Career, enemy, or boss portraits and character illustration.
- Encounter backgrounds, biome tiles, maps, or combat animation.
- Reward, progression, inventory, or title-screen art beyond existing generic HUD building blocks.
- New mechanics, statuses, resources, or lore.
- A full game-wide art bible, finished UI implementation, or final localization.

## 2. Art direction

### Visual thesis

GameZero's first playable should feel like a deliberate tactical instrument: calm, precise, and readable before it feels ornamental. Use restrained dark surfaces, warm paper-like text, and a small number of purposeful accent colors. Combat information should feel tactile and authored, with crisp edges, etched details, and controlled energy effects; avoid generic sci-fi dashboards or noisy fantasy filigree.

This is a practical direction for the planned slice, not a commitment to final character or world art.

### Palette and contrast

The current prototype's UI tokens are a useful starting point, subject to review against the canonical slice:

| Role | Starting value | Use |
| --- | --- | --- |
| Background | `#111513` | App canvas and darkest surfaces |
| Surface | `#1a201e` | Main panels |
| Raised surface | `#252d2a` | Controls, cards, selected layers |
| Foreground | `#f1eee5` | Primary labels and values |
| Muted text | `#a7b3ab` | Supporting information |
| Accent | `#e16a4e` | Attack, danger, and decisive emphasis |
| Soft highlight | `#e8c98d` | Selection, focus, and rare emphasis |
| Steel | `#8fc5c3` | Guard/protection and calm defensive feedback |
| Olive | `#b5c77e` | Movement and positive state |

Treat these values as reference, not a mandate to copy the existing prototype unchanged. Use color redundantly with shape, label, and position; no game state should be identifiable by color alone. Verify text and icon contrast at actual display size, including disabled and selected states.

### Shape, material, and detail

- Build modules from simple, sturdy rectangles with restrained corner rounding and consistent borders.
- Use a deliberate hierarchy of flat dark surfaces, thin separators, and occasional inset/etched details.
- Give each action family a distinct silhouette and a consistent accent: attack (warm), defense (steel), movement (olive), influence/utility (soft gold).
- Reserve glow, particles, and strong gradients for a selected action, active target, or important combat event.
- Icons should use bold, open silhouettes and no tiny decorative marks that disappear at 24–32 px.
- Keep icon framing, stroke weight, optical center, and level of detail consistent across the complete set.

### Type and information hierarchy

- Use a highly legible sans-serif for all operational information, numbers, buttons, and compact labels.
- A restrained display face may appear in screen titles or major encounter headers, but never in dense combat state.
- Prioritize in this order: active phase/turn, player and target identity, health and other spendable/at-risk resources, action choices, then explanatory detail.
- Use numerals and short labels together for changing values. Do not rely on decorative bars or icons alone to communicate a quantity.
- Do not bake text, numbers, or localized labels into generated art.

### Motion and feedback

- Prefer brief, directional feedback that reinforces state: a target bracket, resource tick, marker pulse, or action confirmation.
- Keep persistent combat information still; animate only a change or an active affordance.
- Respect reduced-motion settings in the eventual implementation.
- Do not invent new state feedback: animation must map to an existing action, result, or selection.

## 3. Deliverables

1. **HUD visual kit**: reusable surface, border, button, meter, chip, target, tooltip, and modal treatments represented in a compact annotated board or implementation-ready reference.
2. **HUD module layouts**: production-ready layout references for the modules in section 4, including mobile and wide-screen arrangements.
3. **36-icon master set**: editable vector masters preferred; otherwise layered raster masters with transparent backgrounds.
4. **36 production exports**: consistent, transparent, square icons using the naming convention in section 8.
5. **Handoff sheet**: palette, sizing, asset list, state variants, licensing/source notes, and any intentional exceptions.

The source of truth for gameplay terminology remains the project’s content/schema documentation, not the art exports or prompt wording.

## 4. HUD module breakdown

Design each module as a reusable component family. The layout must support compact mobile play as well as a wider combat view; do not scale a desktop composition down until labels and targets become unusable.

| Module | Purpose and visual requirements |
| --- | --- |
| Combat frame and phase header | Establish encounter context, active phase/round, and a clear entry point for the combat view. Keep it shallow and avoid a permanent ornamental banner. |
| Player/target status cards | Show identity, health/body, and only the currently relevant combat resources or state. Make player and opposing sides distinguishable without relying only on color. |
| Resource meters | Show current and maximum values with visible segments or ticks, clear numeric labels, and a legible low/changed state. Never encode exact values by fill alone. |
| Status and effect rail | Hold active statuses, duration/stack cues where applicable, and concise hover/tap explanations. Keep icon chips consistent with the 36-icon system. |
| Combat action selector | Present the four core action families—attack, guard, move, influence—with selected, focused, unavailable, and pressed states. Preserve enough target size for touch. |
| Reaction and ability controls | Give optional reactions/ability affordances a subordinate but discoverable treatment. Cost and unavailable state must be legible. Do not visually imply a free action when it has a cost. |
| Board/target affordances | Define legal, focused, selected, occupied, and marked targets. Use line, shape, and contrast in addition to accent color; avoid obstructing the combatants or board information. |
| Turn/event log | Provide a compact, scannable explanation of the latest resolution and a path to more detail. Distinguish event types with icons/labels, not color alone. |
| Tooltip, help, and confirmation layer | Support hover on pointer devices and tap/focus on touch/keyboard. Keep explanatory text readable and avoid covering the action the player is choosing. |

## 5. Icon categories and exact set

The Sprint 1 set is exactly 36 icons. These are categories and semantic identifiers only; confirm the final visible labels and mappings with the project’s gameplay source of truth before integration.

| # | Category | Icon identifier | Meaning |
| ---: | --- | --- | --- |
| 01 | Action | `action-attack` | Commit to an attack |
| 02 | Action | `action-guard` | Guard or defend |
| 03 | Action | `action-move` | Move or evade |
| 04 | Action | `action-influence` | Influence or manipulate combat state |
| 05 | Combat resource | `resource-body` | Body/health remaining |
| 06 | Combat resource | `resource-energy` | Energy available to spend |
| 07 | Combat resource | `resource-break` | Accumulated break/strain |
| 08 | Combat resource | `resource-protection` | Guard or protection |
| 09 | Combat resource | `resource-tempo` | Action tempo or initiative |
| 10 | Status | `status-open` | Exposed/open state |
| 11 | Status | `status-bound` | Bound or restrained |
| 12 | Status | `status-confused` | Confused or disrupted |
| 13 | Status | `status-wounded` | Wounded state |
| 14 | Status | `status-guarded` | Guarded state |
| 15 | Reaction | `reaction-dodge` | Dodge |
| 16 | Reaction | `reaction-riposte` | Riposte/counter |
| 17 | Reaction | `reaction-stabilize` | Stabilize |
| 18 | Reaction | `reaction-secure` | Secure or preserve an effect |
| 19 | Echo | `echo-attack` | Attack echo |
| 20 | Echo | `echo-guard` | Guard echo |
| 21 | Echo | `echo-move` | Movement echo |
| 22 | Echo | `echo-influence` | Influence echo |
| 23 | Echo | `echo-trap` | Trap echo |
| 24 | Echo | `echo-barrier` | Barrier echo |
| 25 | Echo | `echo-mist` | Mist echo |
| 26 | Echo | `echo-rift` | Rift echo |
| 27 | Field marker | `marker-brand` | Brand marker |
| 28 | Field marker | `marker-mist` | Mist marker |
| 29 | Field marker | `marker-mirror` | Mirror marker |
| 30 | Field marker | `marker-guard` | Guard marker |
| 31 | Field marker | `marker-rift` | Rift marker |
| 32 | Field marker | `marker-bind` | Bind marker |
| 33 | Equipment slot | `gear-weapon` | Weapon slot |
| 34 | Equipment slot | `gear-armor` | Armor slot |
| 35 | Equipment slot | `gear-tool` | Tool slot |
| 36 | Equipment slot | `gear-artifact` | Artifact slot |

## 6. Production order and review gates

1. **Confirm source terminology and constraints.** Review the first-slice flow and canonical content/schema material. Flag terms or states that are not yet confirmed instead of inventing mechanics.
2. **Lock the visual foundation.** Approve palette direction, surface rules, type hierarchy, action-family cues, icon geometry, and the mobile/wide layout principles.
3. **Prototype the HUD modules.** Lay out the combat frame, status cards, meters, action selector, target states, and log before drawing the full icon batch. Review hierarchy at both target viewport sizes.
4. **Build icon archetypes.** Create one representative action, status, echo, and marker icon. Review silhouette, stroke weight, negative space, and small-size readability.
5. **Produce the 36-icon set.** Work category by category using shared construction rules; review each icon in a same-size grid and in realistic HUD context.
6. **Prepare variants and exports.** Apply color in the UI rather than making color-baked duplicates unless implementation explicitly requires otherwise. Export the approved master and raster size(s).
7. **Final QA and handoff.** Check naming, transparency, dimensions, visual consistency, meaning, touch layout, contrast, and source/editability. Record approved changes in the checklist and asset handoff.

### Review gates

- **Gate A — Direction:** one approved compact art-direction board and representative module layouts.
- **Gate B — Icon language:** four representative icons (one from each archetype group) approved at native and small sizes.
- **Gate C — Production batch:** full 36-icon contact sheet approved for meaning, silhouette, and consistency.
- **Gate D — Integration handoff:** modules and exports verified in realistic UI context, with no unresolved naming or mapping questions.

## 7. Export guidance

- Keep an editable vector master (SVG) when the drawing is cleanly vector-based. Otherwise retain a layered, lossless source file; do not use a flattened lossy image as the sole master.
- Deliver icons as square transparent PNGs in sRGB, with no baked background, shadow, label, or UI tile.
- Start with a 128 × 128 px export and a 64 × 64 px review export. The implementation may downsample for 32 px or 24 px use; inspect those sizes before approval. Preserve a vector source for any later higher-density export.
- Use a consistent optical safe area (roughly 12% inset) and a shared visual weight. Center by perceived mass, not just by bounding box.
- Name files exactly by identifier, e.g. `action-attack.svg` and `action-attack.png`. Do not include version numbers in canonical filenames; track revisions in source control or the handoff sheet.
- HUD module references should include a mobile-width and wide-screen view, with dimensions/viewports noted. Keep text editable and separate from decorative artwork.
- Include a contact sheet, source files, export files, and a short README/handoff note in the eventual asset delivery. Do not commit generator-only intermediate files as production assets.

## 8. Prompt guidance

- Use the shared global style block and one specific icon/module prompt from [the prompt sheet](art-sprint-1-prompt-sheet.md).
- For icons, request one isolated symbol per output on a plain transparent or neutral background; avoid multi-icon sheets when individual asset fidelity matters.
- Treat generated output as a sketch, not as final UI. Normalize geometry, stroke, silhouette, optical centering, and export settings in the editable master.
- Keep prompts mechanic-neutral when a game rule is not confirmed. Use the listed meaning as a visual brief, not an instruction to invent a new effect.
- Do not generate legible text, numbers, logos, full screens containing fake copy, or character-specific lore as part of an icon.
- Apply the negative prompt only where the generator supports it; otherwise append the relevant exclusions to the main prompt.

## 9. Acceptance criteria

- The HUD kit covers every module in section 4 and includes mobile and wide-screen compositions.
- The visual hierarchy makes phase/turn, identity, health/resources, legal action, and target state distinguishable at a glance.
- All 36 icon identifiers in section 5 have one approved, unambiguous icon each; no duplicates or additional implied mechanics.
- Every icon remains recognizable at 32 px, has a coherent silhouette at 24 px, and is legible in monochrome.
- Icons have consistent framing, stroke/shape weight, optical alignment, transparent exports, and editable sources.
- State and side distinction are not color-only; focus, selected, disabled, and warning states are shown where relevant.
- No text is rasterized into art; no speculative stats, statuses, or systems appear in labels or visuals.
- Export files match the naming and format guidance, and the contact sheet plus handoff note allow implementation without verbal clarification.
- Review Gates A–D have explicit approval before Sprint 1 is marked complete.
