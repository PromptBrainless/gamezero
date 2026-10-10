# WS05 — Art Preparation, HUD Kit and Exact 36-Icon Production

**Milestone:** Docs Final decisions → First Playable visual support · **Priority:** P1 · **Owner:** art-preparation coding agent plus human art/project reviewer.
**Sources:** [production pack §§1–9](../art-sprint-1-production-pack.md), [full phased checklist](../art-sprint-1-task-checklist.md), [global/HUD/per-icon prompts](../art-sprint-1-prompt-sheet.md), [visual brief](../visual-reference-brief.md), [style](../ui-style-guide.md).
**Dependencies:** project approval of terminology and import constraints (Gate 0); WS03 realistic layouts.

## Initial coding assignment and automation limit

Create a complete 36-row machine-readable tracking manifest and canonical-schema semantic-gap report under `artifacts/art/sprint-1/`. Record exact ID/category/meaning, source prompt, required masters/exports/reviews and mapping status. Tracking entries are production work records, **not placeholder art**.

No image-generation tools or approvals are assumed. Art drawing, visual quality and licensing approval cannot be claimed by the coding agent. Many pack terms (echoes, field markers, break/energy, bound/confused, tool/artifact) have no direct canonical equivalent; flag those and block integration rather than add mechanics or invent synonyms. Candidate mappings such as body→HP or open→exposed still need approval.

## Complete backlog and gates

- [ ] **Phase 0 / Gate 0:** reconcile every production term against schema/content; list unresolved terms; confirm bounded scope, icon display sizes, viewports, engine imports/output formats and all 36 identifiers with project/art owner.
- [ ] **Phase 1 / Gate A:** assemble palette/material reference board; define type hierarchy, borders, elevations, corners/action-family cues. Produce annotated narrow/mobile and wide HUD references with viewport dimensions, critical combat frame, cards/meters, actions, secondary controls, targets, log/help. Review spacing/density/contrast and touch targets.
- [ ] **Phase 2 / Gate B1:** define panel/button/meter/chip/target/tooltip/modal kit with default, selected, focused, disabled and warning examples where used. Exact values are editable text; legal/focused/selected/occupied/marked distinction is non-color-only. HUD must not obscure combat/action. Annotate responsive behavior without new rules.
- [ ] **Phase 3 / Gate B2:** draw one action, one status, one echo and one field-marker representative. Compare monochrome silhouette/weight/negative space/optical centering at 128, 64, 32 and 24 px. Approve framing, ~12% safe inset, construction/detail/export treatment **before** batching.
- [ ] **Phase 3 / Gate C:** produce all exact icons category by category using shared geometry/style. Check meaning, flag unresolved terms, review same-size monochrome contact sheet and realistic HUD context. Do not create different styles per category.
- [ ] **Phase 4 / Gate D:** retain editable SVG or layered lossless master per approved icon; transparent square sRGB PNG at 128×128 and 64×64; exact canonical names without version suffixes. Separate resolution directories so exports do not collide. No baked text/numbers/background/tile/avoidable shadow.
- [ ] Deliver mobile/wide dimensions, approved palette/sizing, asset mappings/state variants, licensing/source notes/exceptions, contact sheets and handoff note. Keep drafts/generator intermediates separate from production exports.
- [ ] Reviewer records actual approval/evidence for Gate 0, A, B1, B2, C and D; the checklist's “four review gates” shorthand does not omit preliminary or split HUD/icon reviews.

## Exact production set

| Category | IDs |
|---|---|
| Action (4) | `action-attack`, `action-guard`, `action-move`, `action-influence` |
| Resource (5) | `resource-body`, `resource-energy`, `resource-break`, `resource-protection`, `resource-tempo` |
| Status (5) | `status-open`, `status-bound`, `status-confused`, `status-wounded`, `status-guarded` |
| Reaction (4) | `reaction-dodge`, `reaction-riposte`, `reaction-stabilize`, `reaction-secure` |
| Echo (8) | `echo-attack`, `echo-guard`, `echo-move`, `echo-influence`, `echo-trap`, `echo-barrier`, `echo-mist`, `echo-rift` |
| Field marker (6) | `marker-brand`, `marker-mist`, `marker-mirror`, `marker-guard`, `marker-rift`, `marker-bind` |
| Equipment (4) | `gear-weapon`, `gear-armor`, `gear-tool`, `gear-artifact` |

Use all nine HUD-01–HUD-09 prompts and all 36 individual icon prompts with the global style, single-isolated-symbol template and supported negative constraints. Prompts remain mechanic-neutral; generated sketches need manual normalization. No generated UI screenshot/faux copy can substitute for functional HUD implementation.

## Acceptance

Exactly 36 distinct approved icons, each editable master and both exports, recognizable at 32 px and distinguishable in monochrome at 24 px. All HUD module families appear in both compositions; no critical side/state/availability depends on color alone. No speculative mechanic is introduced. Contact sheet and handoff permit integration without verbal clarification; every gate explicitly approved.

**Excluded:** character/career/enemy/boss illustration, encounter backgrounds/maps/animations, promotional art, title/reward/progression/inventory art beyond reusable HUD blocks, new lore/rules and a game-wide art bible.
