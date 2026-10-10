# 05 — UX and Combat Presentation

## Mission and sources

Make the approved combat and five-screen flow understandable on mobile and wide screens, without a second rules engine. Read [UI plan](../first-playable-ui-plan.md), [HUD spec](../hud-spec.md), [style guide](../ui-style-guide.md), [combat architecture](../combat-architecture.md), [visual brief](../visual-reference-brief.md), and [Sprint 1 pack](../art-sprint-1-production-pack.md), [checklist](../art-sprint-1-task-checklist.md), [prompts](../art-sprint-1-prompt-sheet.md).

Data and computed preview/event values govern every number; art-production labels never create gameplay fields.

## Delivered versus pending

**Observed:** browser `SliceApp`, `Scene`/procedural figures and `slice.css` provide responsive career/encounter/combat/reward/progression views, target buttons, previews and status details. This is a reference, not the Godot target-runtime HUD.

**Observed Godot:** actor/HUD scripts and folders are scaffolding. Sprint 1 has a production brief for one HUD kit plus 36 icons; a prompt sheet is not exported/licensed art or an integrated UI.

**Pending:** Godot HUD interactions, state/event presentation, narrow/wide evidence, reviewed asset integration, and complete flow handoff. This documentation/data-design task leaves browser UI unchanged.

## Ownership and dependencies

Own Godot UI/actor presentation scripts/scenes, theme tokens, runtime art mapping and reviewed presentation assets. 03 owns routing/bootstrap; 04 owns run progression/narrative logic; 02 owns combat state/preview/events; 06 owns raw intake/provenance.

Can prepare against G1 frozen mocks. Real actions wait for G2 and G3; final meta-screen handoff waits for 04. Agree scene paths with 03 before writes. Never mutate HP/resources/effects to “finish an animation,” implement damage in a tooltip, or tune data for visual convenience.

Inputs: immutable resolved content, legal-action/target reasons, pure preview and ordered combat events; career/encounter/result/progression view models. Outputs: selection/cancel/confirm intents and presentation-complete signals, not authoritative combat results.

## Backlog

1. Establish reusable numeric meters, panels, status chips, focus/tap help and action buttons using Sprint 1 visual tokens. Normal text contrast at least 4.5:1; touch targets at least 48 dp.
2. Implement `Idle → Action selected → Target selected → Preview → Confirmed → Resolving → Idle`. Cancel goes back one step; resolving blocks conflicting input.
3. Render all living opponent targets including both cult actors, legal/selected/dead affordances with text/shape plus color. Selecting one target never hides the other enemy's health/status.
4. Show costs, cooldowns and unavailable reasons from 02. Unavailable actions remain inspectable. Preview displays computed direct damage, not fabricated hit chance or random status guarantees.
5. Show exact HP/resources, status duration/stacks, boss phase and warning when supplied. Riposte appears as an automatic reaction with readiness/cost information, not a selectable action; consumables remain usable. No active initiative/critical/resistance UI.
6. Consume numeric event order for log/HP/status/telegraph/phase presentation. Motion can accelerate or be skipped without changing state or reordering events; reduced motion must work.
7. Connect career, encounter preview, reward, progression and finish views to 03/04 services. Loss exposes retry; new run resets safely; repeated clicks cannot double-submit actions/rewards.
8. Integrate only reviewed exports from 06. Map asset production IDs to canonical skill/status/UI IDs explicitly; missing assets retain readable procedural/text fallbacks rather than blocking the slice.

## Art boundary and QC

Sprint 1's **36-icon set** is a UI production budget, not 36 new skills. It covers a reusable HUD kit and icons, not final portraits, encounter backgrounds, marketing art or a whole-game art bible.

Require editable/source masters where available, transparent exports, consistent optical size/stroke, legibility at 24–32 px, naming/format manifest, source/license notes and actual in-engine review. No baked-in text/numbers. Do not hide missing assets behind claims of completed art.

06 supplies provenance/raw-to-curated evidence; 05 owns final acceptance, semantic mapping, runtime asset placement and import settings. Avoid two owners moving the same files.

## Acceptance and executable checks

No UI build is required for these documentation-only changes. During follow-on implementation:

```sh
npm run test:slice
npm run data:check
godot --headless --path godot --editor --import
```

Node checks protect contracts; engine import detects scene/script/asset errors, not usability. If the package edits browser reference code deliberately, also run `npm run typecheck` and `npm run build`; browser changes are not implicit in this assignment.

Required interactive test matrix, recorded against actual Godot build:

| Case | Observable pass |
|---|---|
| Narrow 390×844 reference and wide 1280×720 | No clipped core values/targets; readable labels; touch targets preserved |
| Action/target/cancel/confirm | Preview changes without mutation; cancel restores previous step; one confirmation executes once |
| Cult and dead target | Two enemy panels; dead targets not selectable; remaining living target reachable |
| Cooldown/resource blocked | Visible accurate reason; details usable by tap and keyboard |
| Boss warning/phase | Warning precedes damage; phase feedback matches event state |
| Fast/reduced-motion replay | Same final state/events; no stuck resolution lock |
| Victory/loss/retry/finish | Real result navigation, no duplicate reward or lost context |

Attach screenshots for narrow/wide plus interaction results and engine errors, if any. A static screenshot or a boot log cannot satisfy G4. Godot unavailable means target-runtime UI testing remains blocked.

## Handoff and deferrals

Hand 03 scene/controller signal contracts; 02 discrepancies between preview/events/UI; 04 meta/narrative display needs; 06 accepted/rejected art QC notes.

Deferred: final character/environment art, heavy VFX, full character customization, new mechanics, deep inventory/shop/save screens and localization pipeline.

## Copyable agent assignment

> Own package 05's Godot HUD/actor/UI presentation and reviewed art integration. Read HUD/style/Sprint 1 sources; consume 02 preview/events and 04 view models through 03 routing. Support two cult targets, inspectable blocked actions, keyboard/touch help, exact numeric values, cancel/confirm locks and reduced motion without changing state. Preserve automatic Riposte/current consumables and no initiative/crit/resistance. Record actual narrow/wide interactive evidence; do not claim Godot QA from Node tests or art completion from prompts. Coordinate raw assets with 06; do not edit combat/data/progression.
