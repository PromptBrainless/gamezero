# WS03 — Combat HUD Foundation

**Milestone:** First Playable Build · **Priority:** P0 · **Owner:** HUD implementation agent.
**Sources:** [Track 2](../implementation-board.md), [HUD modules/states](../hud-spec.md), [UI principles/flow](../first-playable-ui-plan.md), [style guide](../ui-style-guide.md), [visual brief](../visual-reference-brief.md), [art modules/tokens](../art-sprint-1-production-pack.md).
**Dependencies:** WS01 records, WS02 preview/events, WS05 approved mappings for final artwork; WS04 embeds combat.

## Initial assignment

Build reusable native meter, status-chip and focus/tap-help foundations under `godot/scripts/ui/foundation/` and `godot/scenes/ui/foundation/`. Render supplied values, never generate gameplay stats. Use valid runtime-shaped fixtures while APIs stabilize; do not change boot, browser UI or the existing stub HUD.

## Complete backlog

- [ ] Establish shared spacing, consistent border/surface hierarchy, legible operational sans type, tabular-number treatment and token palette from the art pack. Palette is a starting point subject to contrast review.
- [ ] Build shallow encounter/phase/round header, player/enemy/boss identity panels, battlefield/target affordances, numeric resource meters, status rail, action selector, preview/context panel, event log and tooltip/help/confirmation layer.
- [ ] Show exact current/max values only where supplied. Show status names, description, duration/stacks when available. Expose boss phase/telegraph only when defined.
- [ ] Implement `Idle → Action selected → Target selected → Preview → Confirmed → Resolving → Idle`; unavailable actions remain inspectable with a visible reason; cancel backs up one step; resolution locks conflicting input.
- [ ] Select legal self/enemy targets from runtime, clearly distinguish focused/selected/legal/occupied/marked states where used with shape/text/line cues, not color alone.
- [ ] Update selected action/target/cost/computed outcome preview **before** confirmation. Never invent damage ranges, chances, initiative or unsupported resource bars.
- [ ] Consume WS02 ordered events for compact readable latest-event log and detail access; presentation does not apply combat rules.
- [ ] Support pointer, keyboard focus and touch help/dismissal. No critical instruction/value is hover-only. Preserve action and target visibility while explaining them.
- [ ] Render both narrow portrait/mobile and wide compositions without overflow or scaled-down illegible labels. Preserve critical combat view, safe spacing and ≥48 dp targets.
- [ ] Verify normal text contrast ≥4.5:1 in actual default/selected/focused/unavailable/warning states; keep color redundant and respect reduced motion.
- [ ] Represent art-pack module families/states, including secondary reaction/ability controls **only when canonical data supports them**. Four art action-family prompts do not authorize four new runtime actions.
- [ ] Integrate approved icon mapping and WS04 result transition; final art/heavy VFX are not prerequisites for foundational behavior.

## Acceptance and validation

Every used module/state works with real or validated runtime-shaped data. Select action and target, inspect changed preview, cancel, confirm, read resolution and terminal result. Disabled reasons remain visible. Test focus/tap help, resolution lock and no accidental double confirm.

Inspect real native screenshots at narrow and wide viewports for clipping, text contrast, target size and battlefield visibility; exercise keyboard/touch paths. WS06 retains evidence. Widgets alone do not satisfy whole-HUD acceptance.

**Excluded:** final portraits/backgrounds, heavy VFX, deep inventory, full special-case/boss-system expansion, invented combat values, orientation choice asserted without project review.
