# Art Sprint 1: Task Checklist

Execution checklist for the HUD visual kit and 36-icon set. Read the [production pack](art-sprint-1-production-pack.md) for the complete art direction and specifications and the [prompt sheet](art-sprint-1-prompt-sheet.md) for generator-ready briefs.

## Phase 0 — Scope and source-of-truth check

- [ ] Confirm the first playable slice and its combat terms against the current canonical project docs/content.
- [ ] Mark any terminology or mechanic that is not yet settled; do not invent a replacement.
- [ ] Confirm that Sprint 1 remains limited to the HUD visual kit and the 36 core combat icons.
- [ ] Confirm the implementation's likely icon display sizes, target viewports, and any engine import constraints.
- [ ] Create an asset tracking sheet with the 36 identifiers from the production pack.

**Review gate 0:** scope, terms, output formats, and icon list are approved before art production begins.

## Phase 1 — Art direction and layout foundation

- [ ] Assemble the palette and material reference board using the production pack as the baseline.
- [ ] Define type hierarchy, borders, surface elevations, corner treatment, and action-family cues.
- [ ] Produce a combat HUD overview for a narrow/mobile viewport.
- [ ] Produce a corresponding wide-screen HUD overview.
- [ ] Annotate the combat frame, status cards, meters, action selector, reaction/ability controls, board/target affordances, event log, and tooltip/help layer.
- [ ] Check touch target size, safe spacing, text density, contrast, and color-independent meaning.

**Review gate A — Direction:** approve one art-direction board and both HUD layout references. Record changes before moving on.

## Phase 2 — HUD module kit

- [ ] Define shared panel, button, meter, chip, target, tooltip, and modal treatments.
- [ ] Show default, selected, focused, disabled, and warning examples wherever the module uses those states.
- [ ] Check that exact resource values are shown by text/numerals in addition to meter fill.
- [ ] Check that legal, focused, selected, occupied, and marked targets are distinguishable without color alone.
- [ ] Verify that the HUD never obscures the critical combat view or the action being selected.
- [ ] Add brief behavior notes for responsive reflow; do not add new gameplay behavior.

**Review gate B1 — HUD:** approve the shared module kit in realistic mobile and wide-screen layouts.

## Phase 3 — Icon language and production

- [ ] Draw four representative icons: one action, one status, one echo, and one field marker.
- [ ] Compare their monochrome silhouettes and stroke/shape weight in a same-size grid.
- [ ] Review at 128 px, 64 px, 32 px, and 24 px; refine any ambiguous silhouettes.
- [ ] Approve icon framing, optical safe area, level of detail, and export treatment.
- [ ] Produce all 36 exact identifiers listed in the production pack.
- [ ] Check each icon's meaning against the approved asset list; flag unresolved source terminology.
- [ ] Use shared templates and construction rules; do not introduce unique illustration styles per category.
- [ ] Produce a monochrome contact sheet and a set shown in the HUD context.

**Review gate B2 — Icon language:** approve the four representatives before batch production.  
**Review gate C — Production batch:** approve the complete 36-icon sheet for meaning, small-size legibility, and consistency.

## Phase 4 — Export and handoff

- [ ] Save the editable vector or layered master for every approved icon.
- [ ] Export transparent sRGB PNGs at 128 × 128 px and 64 × 64 px.
- [ ] Verify canonical filenames exactly match the 36 asset identifiers.
- [ ] Confirm no baked-in background, text, number, tile, or avoidable shadow is present.
- [ ] Confirm the mobile and wide-screen HUD references list their viewport/dimensions.
- [ ] Include the approved palette, sizing notes, asset mapping, licensing/source notes, and any exceptions in the handoff.
- [ ] Remove or clearly separate drafts and generator intermediates from production exports.

**Review gate D — Handoff:** a reviewer can locate, identify, and integrate every asset without undocumented verbal guidance.

## Final done criteria

- [ ] All four review gates are explicitly approved.
- [ ] HUD modules in the production pack are represented in both responsive compositions.
- [ ] Exactly 36 icons are delivered; each identifier has one approved visual and the required source/export.
- [ ] Every icon reads at 32 px and remains distinguishable in monochrome at 24 px.
- [ ] Meaning, focus, selected, unavailable, side, and warning states never depend on color alone.
- [ ] No icon, label, or HUD detail introduces an unapproved gameplay mechanic or speculative content.
- [ ] The complete source, export, contact sheet, and handoff note are ready for the implementation team.
