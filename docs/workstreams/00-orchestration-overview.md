# 00 — Orchestration Overview

## Outcome and authority

This is supporting runtime-design material from PR #18, not a second execution
ledger. The [current workstream index](README.md), its WS01–WS06 briefs and
`orchestration.json` govern write ownership and acceptance. The checkpoint below
is historical; newer native runtime work must not be replaced by the old boot scaffold.

Deliver one reproducible, data-driven Godot run:

`Career Select → Encounter Preview → Combat → Reward → Progression → next encounter/finish`

Authority is subject-specific: [data schema](../data-schema.md) owns base entities; [runtime supplement](../final-runtime-data-design.md) owns the separate metadata v1 contract; [first-playable rules](../first-playable-rules.md) owns approved mechanics; [slice plan](../vertical-slice-implementation-plan.md) owns scope; [milestones](../milestones.md) and [board](../implementation-board.md) own gates. [Runtime plan](../runtime-data-plan.md), [combat architecture](../combat-architecture.md), and [UI plan](../first-playable-ui-plan.md) guide implementation within those limits.

Older `.tres` authoring, 1v1-only and large-meta proposals in `content-pipeline.md`/`godot-project-plan.md` do not override JSON or the two-opponent cult encounter. Current rules and supplement agree with tested automatic Riposte and usable supplies. Documenting this baseline does not change gameplay.

## Checkpoint: facts, not completion claims

| Surface | Observed delivery | Remaining acceptance |
|---|---|---|
| Base data | 38 JSON entities in seven collections; canonical references and counts have tests | Keep full validation strict and supplement references consistent |
| Browser | `src/game/slice/{content,validation,combat}.ts`; mounted `SliceApp` connects flow, automatic Riposte, consumables and reward supplies; rules prose updated | Preserve tested behavior in language-neutral Godot fixtures |
| Godot before bridge | `project.godot`, boot scene, data classes and gameplay stubs | `TurnResolver.resolve()` returns `[]`; no full playable demonstrated |
| Data/export foundation | Metadata validator, deterministic exporter, ContentRegistry/bootstrap delivered; data check and 22 targeted metadata/export tests passed | Real engine execution, resolved gameplay contexts and combat parity |
| Production | Art briefs and prompt/checklist docs | Imported, licensed, reviewed assets and functional production tooling |
| Remote work | PR #16 Drive import; PR #17 doc orchestration open, no files at reported checkpoint | No remote launch or finished work claimed |

No UI changes are part of metadata/doc closure. Its acceptance gate is headless data validation; target-runtime interaction is a separate later gate.

## Dependency DAG

```text
schema + slice + rules + metadata approval
                    |
                   G0
                    |
                  01 — G1
                 /  |  \
                02  04  06
                |   |    └── curated proposals ──> 04 (content) / 05 (art)
               G2   |
                \   /
                  03 — G3
                    |
     05 (may prepare against G1 fixtures) — G4
                    |
         03 + 04 + 05 integrated run — G5
```

Only contracts/mocks overlap early. Live execution waits for dependencies; 06 is not required for a run from already-committed data. Milestones are sequential even when packages within First Playable Build operate in parallel.

## Gates and evidence

| Gate | Owner | Required evidence |
|---|---|---|
| G0 Contract lock | Integrator + 01/02 | Base v1 plus separate metadata v1; IDs/counts unchanged; rules prose reconciled with tested code; no unresolved blocking enums |
| G1 Data ready | 01 | `npm run test:slice` and `npm run data:check`; negative fixtures aggregate located errors; every encounter resolves, cult has two instances |
| G2 Rules oracle | 02 | Seeded snapshot/preview/invalid-action tests; automatic Riposte, consumables, uniform available-skill AI and longer-duration reapply fixtures; unsupported mechanics absent |
| G3 Engine bridge | 03 | Export reproducibility and rejection tests; Godot imports bundle, resolves records and executes G2 fixtures with parity |
| G4 Presentation | 05 | Narrow/wide interaction evidence, touch/keyboard help, target legality, event ordering, no UI state mutation |
| G5 Playable slice | Integrator with 03/04/05 | All careers through four encounters; rewards/progression/retry/reset correct; tests and engine run attached |

Foundation export tests do not satisfy G2/G4/G5. If no `godot`/`godot4` executable is available, record G3 engine parity and G5 as blocked; do not replace them with a successful Node test.

## Non-overlapping ownership

- **01:** validator/schema adapters, shared contract fixtures. Owns contract change review, not tuning.
- **02:** pure combat rules and event fixtures. Owns damage/status/turn semantics, not scenes or data authoring.
- **03:** exporter, Godot registry/bootstrap and screen routing. Owns engine wiring, not combat rules or HUD styling.
- **04:** canonical entity authoring, RPG handoff service, narrative. Owns gameplay content, not importing raw files or altering combat formulas.
- **05:** Godot HUD/actor views, presentation assets and UI scenes. Owns visuals, not progression or resolver state.
- **06:** import/curation tooling and provenance; proposed raw assets. Owns transport and QC workflow, not direct canonical publication.

Current validator/export agents retain their already-assigned surfaces until handoff. Do not start competing implementations. `package.json`, metadata document, and shared fixtures have one integrator; request a change rather than racing a sibling. Agree paths for new services/scenes before parallel writes; do not put class, narrative, or UI logic into `main.gd`.

## Integration and change control

1. Integrate G0/G1 first; test invalid data before trusting a registry.
2. Integrate the combat oracle and RPG services behind frozen interfaces.
3. Integrate Godot adapter and compare fixture output, then connect presentation.
4. Review curated content/art independently; keep canonical IDs and provenance.
5. Run the whole slice and report unmet gates, not a percentage-complete guess.

Breaking shape changes need explicit version/migration decisions and affected-package review. Content-only revisions do not imply new mechanics. Schema v1 is not a save-game version. Keep generated `godot/data/content_bundle.json` out of committed source; regenerate from canonical inputs.

## Copyable integrator assignment

> Coordinate packages 01–06 using docs/workstreams. Lock schemas, rules and path ownership before parallel writes. Record the actual delivered/in-flight/deferred state. Require G1–G5 evidence, preserve IDs/counts/stats, and require explicit review for contract changes. Do not launch remote jobs or treat PR #16/#17 as finished. Keep generated output uncommitted. Report exact commands/results and unavailable Godot execution honestly; defer save/load/world/shop/catalog expansion.
