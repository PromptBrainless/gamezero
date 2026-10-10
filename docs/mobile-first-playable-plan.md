# Mobile First Playable — Execution Plan

**Target:** Godot 4.4+, mobile-first, turn-based 2D side-view RPG  
**Scope:** One complete first-playable slice using the existing three careers and four canonical encounters.  
**Status:** Plan and baseline audit only. No engine execution has been performed as part of this audit; all runtime/export gates below remain unverified until their commands run in a recorded environment.

## Repository baseline reviewed

- `godot/project.godot` targets Godot 4.4 / Mobile, sets `res://scenes/boot/main.tscn` as the main scene, uses a 390×720 reference viewport, canvas-item stretching and touch-from-mouse emulation.
- `godot/scenes/boot/main.tscn` mounts `scripts/core/main.gd` and `scripts/ui/combat_hud.gd`.
- `godot/tests/flow_test.gd` exercises career selection, encounter preview, combat input states, item consumption, defeat/retry, reward idempotence, progression, all four encounter handoffs, reset and malformed-pack rejection. It also has optional narrow/wide screenshot capture.
- `godot/tests/combat_test.gd` exercises resolver contracts, seeded replay, statuses, boss phases, items, outcomes and a starting-stat matrix.
- `package.json` exposes `npm run test:slice`, `npm run data:godot:check`, `npm run test:godot`, `npm test`, `npm run typecheck`, and `npm run build`.
- The implementation board records the four-encounter no-growth heuristic as successful for mercenary and mage, but not duelist across seeds 42–141. Its 100-seed matrix records boss wins of 0/100 duelist, 69/100 mercenary, and 30/100 mage. These are diagnostic signals, not proof of impossibility and not a target win-rate specification.
- The documentation explicitly says native engine acceptance, mobile device/export testing, final side-view presentation and asset review are still release gates.

## Concrete blockers / risks

1. **Native execution is unverified in this audit.** Source files and test scripts exist, but their presence is not proof that Godot imports the project, parses every script, or runs the complete flow. No test result is claimed here.
2. **Boss/career balance needs a human playthrough and tuning review.** The recorded duelist boss result is a strong blocker signal; mage and mercenary results also warrant review. Do not add undocumented stats, levels, or win-rate promises to mask this.
3. **Mobile device and export evidence is missing from the inspected records.** A 390×720 project reference and screenshot test are useful but do not replace testing an exported build on a real device and recording device/orientation/input results.
4. **Production presentation is not final.** The docs identify side-view actor scenes, animation/event playback, final icon integration and art review as outstanding work. Keep these separate from core functionality so the first playable is testable before art polish.
5. **Release acceptance must cover all three careers and all four encounters.** A flow test that simulates victories validates transitions and accounting; it does not establish that a human can win the actual fights with each career.

## Ordered implementation plan

### Gate 0 — Reproduce the baseline
Run from repository root with Node installed and Godot 4.4+ available:

```sh
npm ci
npm run data:godot:check
npm run test:slice
npm test
npm run typecheck
npm run test:godot
```

Record OS, Node/npm versions, Godot version, commit SHA, exact commands and exit status. If Godot is not on PATH, set `GODOT=/absolute/path/to/godot`. Fix import/parser/test failures before content expansion. Run `npm run build` as a separate repository-wide check if the local environment supports the configured build/migration prerequisites.

### Gate 1 — Runtime and flow correctness
- Run the Godot combat and flow tests headlessly.
- Exercise each of the three careers through the actual four-encounter sequence; separately verify victory, defeat/retry, reset, no duplicated rewards, consumable handoff, and terminal completion.
- Preserve canonical IDs and edit `data/` rather than generated `godot/data/runtime_pack.json`.
- Keep previews non-mutating and combat deterministic; add a regression test for every gameplay fix.
- Do not silently change turn/status/resource rules that the docs mark unresolved; record and approve any rule decision before implementation.

### Gate 2 — Balance and encounter readability
- Reproduce and review the recorded boss matrix with the current seed range and combat heuristic.
- Perform human/manual runs for duelist, mercenary and mage; record action choices, failure causes, resource pressure, boss phase/telegraph clarity and consumable use.
- Make the smallest canonical data or rules change supported by the observed cause. Add deterministic tests and re-run the matrix after each change.
- Acceptance: no known career is blocked by a reproducible rule defect; all career routes can complete in manual play; difficulty and win-rate expectations are documented as design decisions, not inferred from a heuristic.

### Gate 3 — Mobile usability
- Capture Godot flow screenshots at narrow portrait (390×844) and wide (1280×720) using the existing `--visual` test path.
- Inspect text clipping, safe spacing, status/action legibility, numeric visibility, touch targets, target selection, preview confirmation/cancel and defeat/retry.
- Ensure primary touch targets are at least 48 dp for device acceptance (the existing flow test checks a 44 px minimum; update tests only after confirming the intended logical-pixel contract).
- Record the chosen orientation and at least one actual device or emulator model/resolution. Do not call screenshot-only evidence a device test.

### Gate 4 — Exported build
- Export the Godot project for the selected mobile target using a documented preset and installed export templates.
- Verify generated canonical JSON is included and loaded by ID in the export, without machine-local or parent-directory dependencies.
- Install and launch the export on a device/emulator; complete all four encounters and verify pause/resume, touch interaction, screen resizing/orientation behavior and clean restart.
- Attach logs/screenshots and environment details to the acceptance record. Any engine/tool/device absence is BLOCKED/UNVERIFIED, never passed.

### Gate 5 — First-playable exit
The slice is accepted only when Gates 0–4 have recorded evidence, all three careers can finish all four encounters in manual play, rewards/progression/retry/reset work without duplication or state leakage, and remaining art polish is explicitly listed rather than misrepresented as complete.

## Out of scope for this increment

Save/load, shop, overworld, deep inventory/equipment management, new careers/regions, networking, extensive content catalogs, and final cinematic/VFX polish. Finish and verify the connected slice before expanding scope.
