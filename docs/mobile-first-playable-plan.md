# Mobile First Playable — Execution Plan

**Target:** Godot 4.4+, mobile-first, turn-based 2D side-view RPG  
**Scope:** One complete first-playable slice using the existing three careers and four canonical encounters.  
**Status:** The original audit below is historical. The [2026-10-12 issue sweep](#2026-10-12-issue-sweep) records real Godot headless execution and Linux packaged boot. Rendered/manual play, device acceptance, approved asset integration and release-candidate acceptance remain unverified.

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

## 2026-10-12 issue sweep

### Current scope and order

GitHub's live open-issue query returned exactly **#37, #38, #39, #40, #41,
#42 and #43**, with no further page. #42 is additional to the supplied list.
The checkout started clean on `main`, revision `aca5f62`; the open PRs were
#18, #20, #23 and #26, none on the checked-out branch. They were not merged.

| Order | Issue | Dependency and result |
|---|---|---|
| 1 | #37 native QA | Real Godot import, combat and host-flow tests executed. Automated Mercenary/Mage runs complete; Duelist fails at the boss. Rendered/manual acceptance still blocked. |
| 2 | #38, #42, #43 asset audit | One shared [manifest](../artifacts/art/asset-audit.json), reproducible scanner and reference checks. Archive inspection is separate from loose/runtime files; no unreviewed assets enabled. |
| 3 | #39 balance | Native 100-seed matrix and exact seed-42 trace reproduce the failure. No tuning or new progression policy approved; issue remains open. |
| 3 | #40 feedback | Fixed duplicated DoT damage numbers; native feedback regression passes. Audio and rendered timing review remain blocked. |
| 4 | #41 release | Depends on the preceding gates. Clean staged Linux export and packaged boot passed, not a release-candidate approval. |
| 5 | publication | Commit only scoped reviewed changes. GitHub CLI and Git remote access lack authentication in this session; issue updates and push are not claimed. |

### Native evidence and balance

Environment: Linux x86_64, Node `v24.21.0`, npm `11.19.0`,
Godot `4.4.1.stable.official.49a5bc7b6`. Engine and templates came from the
official URLs and SHA-512 checks already pinned in
[the native workflow](../.github/workflows/native-game.yml).
The workflow uses Node 22; this local result does not replace that CI run.

Selected machine-readable results are retained in
[native evidence](../artifacts/qa/native-2026-10-12.json).
Actual checks:

- `godot --headless --path godot --editor --import --quit`: initial import
  exited 0 with no script/import errors.
- `npm run test:slice`: 18 reference/content checks passed.
- `GODOT=/path/to/verified/godot timeout 600 npm run test:godot`:
  **243 combat checks and 151 flow checks passed**. The initial combined
  180-second attempt timed out after combat passed; the workflow budget is
  now 600 seconds, still bounded by its 20-minute job limit.
- `npm run test:godot:balance`: **6 diagnostic checks passed**. Passing means
  reproducible defeat and replay, not acceptable balance.
- `npm run test:godot:feedback`: reproduced 3 failures before the fix,
  then **5 checks passed**. Only the resolver's `damage` event generates a
  damage label; `status_tick` annotates that same hit.
- `npm run typecheck`: passed on retry after an earlier terminated attempt.
  Repository-wide Node failures outside this increment are recorded in the
  [handoff](project-history-and-execution-log.md#2026-10-12-all-open-issues-increment).

Starting-stat native matrix: 100 independent seeds **42-141** per cell, full
starting resources/equipment, starting skills only, no level/stat growth.
The offensive heuristic uses direct-damage previews and available healing.
This is **not** a human playtest, optimum-strategy proof or target win rate.

| Career | First blood | Deserter | Cult | Boss |
|---|---:|---:|---:|---:|
| Duelist | 100 wins / 0 losses | 100 / 0 | 95 / 5 | **0 / 100** |
| Mercenary | 100 / 0 | 100 / 0 | 78 / 22 | 69 / 31 |
| Scholar Mage | 100 / 0 | 99 / 1 | 100 / 0 | 30 / 70 |

All 1,200 fights terminate. The actual host-flow heuristic (seeds 42, 43, 44,
45; run inventory/rewards carried normally) completes Mercenary in 51 rounds
and Scholar Mage in 21 rounds, each receiving 238 XP. Duelist reaches the
fourth encounter and loses. The test now attempts **all three careers** instead
of stopping at the first successful run.

The isolated Duelist boss trace at seed 42 ends at round 14: player HP 0,
boss HP 23, four automatic Ripostes. Stamina repeatedly returns to its cap;
the trace does **not** support blaming missing reactions or simple resource
starvation. `precise_thrust` is the only selectable starting attack; cooldown
gaps, stuns and phase-two damage/bleeding contribute to insufficient offensive
output and survival. A bounded alternative-action search also found no win,
but that is not an exhaustive impossibility proof.

Gameplay owner must review a minimal tuning change or the explicitly pending
progression policy, then rerun this matrix and manual play. Do not import the
browser's growth/unlocked skill pool just because its historical boss win rate
is higher. Canonical values and live rules were unchanged in this increment.

### Asset inventory and visual/sound pairing

`npm run assets:audit` scans `git ls-files`; `npm run assets:audit:check`
reproduces the committed manifest. Loose files: **257** (12 SVG, one PDF
document, 244 raster files), including 87 build copies, 13 platform files,
72 evidence/production inputs and 85 other source files. There are **no
loose audio files**. Twelve ZIP inputs contain **3,649 non-resource-fork
asset members, including 500 audio members**. These first-level counts exclude
nested ZIP contents, whose containers are listed as an explicit inspection gap.
These are not loaded Godot
assets. Member paths/sizes and license candidates are listed; member
dimensions/duration/codec, rights scope and duplicates still need inspection.
The supplied archive families are incomplete (Worldassets part 05 and most
demo-project parts are absent); do not assume a license in one part covers
every other part.

The scanner checks source runtime scenes/scripts/UI/themes and Godot project
and export configuration. It found no missing *recognized literal* resource
reference, and separately records seven browser dynamic-path expressions.
Dynamic candidate status is not proof that every constructed path exists or
loads. No loose file has been marked `freigegeben`; rights and runtime review
are missing. Planned 36-icon filenames in the sprint manifest are production
requirements, not existing runtime resources or automatically inferred
placeholders.

| Event | Current native visual / candidate | Sound candidate | Timing / level policy | Status |
|---|---|---|---|---|
| Menu | Existing textual panels; browser favicon/equipment atlas are not native menu art | Archived `neu3/Audio/back_001.ogg` for audition only | Single UI action; gain/loudness unmeasured | Native logic present; sound not loaded, rights/audition pending |
| Character choice | Procedural career silhouettes and canonical accent colors | No approved candidate; reject announcer-style speech by default | Confirm selection, never autoplay voice | Headless selection checked; rendered/audio review pending |
| Combat start | Procedural arena and encounter preview | No approved music; demo loop is not presumed suitable | Start only after encounter confirmation; loop boundaries/gain unmeasured | Transition checked; no native music |
| Attack / ability | Ordered action log; no final attack animation | Archived `neu3/Audio/chop.ogg` for audition only | Once per resolved action, not preview/animation time | Logic checked; sound/duration/style unverified |
| Hit / crit | Damage labels from `damage`; crit rolls are not implemented | Archived demo `sound_hit.wav` for audition only | Once per damage event; no invented crit sound | DoT duplicate fixed; audibility/rendering pending |
| Boss phase | Phase/status/telegraph text and actor snapshot | No approved phase cue | Trigger from phase event, not HP recalculation in view | Native phase tests passed; rendered timing/audio pending |
| Victory / defeat | Explicit reward/defeat screen and resolved actor state | Demo `gameover.wav` is a candidate for comparison, not a tonal recommendation | Once per terminal result; no reward-trigger replay | Accounting/retry checked; sound not loaded |
| Reward | Canonical XP/items, awarded once | Demo `sound_coin.wav` for audition only | On accepted terminal result; level unmeasured | Accounting passed; no audio acceptance |
| General UI | Focusable 48-logical-pixel controls, movement toggle | Same short UI-click audition candidate | Mute/reduced-motion independent; visual/text remains authoritative | Headless focus/motion checks; touch/device/audio pending |

**Recommendation:** retain the current procedural native visual foundation
until final art review, rather than copying browser/generated art with
unverified rights or introducing cyberpunk/arcade assets into grounded dark
fantasy. Audition only short, non-verbal archived UI/hit/reward sounds after
per-file license confirmation. Filename alone cannot establish style fit,
duration, loudness or loopability. Prefer Godot-supported WAV/OGG after codec
verification; browser and mobile compatibility require separate tests.
Never make sound the only signal. Native audio players/mixer/mute are not
implemented; the browser prototype's synthesized Web Audio is not native
audio acceptance.

### Export and known release blockers

The existing Linux x86_64 preset produced a 67 MiB executable outside the
checkout. `echo-bruch.x86_64 --headless --audio-driver Dummy --
--verify-packaged-boot`, executed from its output directory, exited 0:
`Packaged boot verified: 3 careers, 4 encounters; career selection ready.`
This verifies packaged startup without Node or parent-directory content.
It does **not** verify a rendered exported playthrough.

Known release gates and resolved export diagnostic:

1. Duelist completion/tuning remains unresolved (#39); gameplay-owner action.
2. No display server, Xvfb or device was available; genuine native screenshots,
   animation/touch review and human exported playthrough are unverified (#37/#40/#41).
3. Archived sound/graphics rights and member metadata are unresolved; no native
   audio integration, audibility, mix or loop acceptance (#38/#42/#43/#40).
4. The direct cached export initially exited 0 but logged
   `ERROR: Can't open file from path ''.`; packaged boot nevertheless passed.
   Rebuilding the generated editor filesystem cache removed the error.
   `npm run export:godot:linux -- /absolute/output/echo-bruch.x86_64`
   now stages fresh source inputs, excluding editor caches, and fails on
   engine error logs even with exit 0. The final runtime was exported with
   this wrapper, **without engine errors**, and packaged boot passed again.
   Rendered exported-game acceptance remains open (#41).
5. Only Linux diagnostic packaging is exercised. No Android/mobile preset,
   device installation or supported-mobile release claim. Progress remains
   in memory; save/load is outside this slice.
6. Remote publication needs the existing Codespace/GitHub integration to grant
   authenticated issue-write and Git-push capabilities. Do not fabricate
   an issue update, uploaded artifact, successful push or CI run.

Next bounded action: review the Duelist trace and approve one explicit tuning
increment; then run the visual test path in
a display-capable environment and play all three careers on the selected device.
