# GameZero agent instructions

## Start here

1. Read [`../README.md`](../README.md) and [`../docs/README.md`](../docs/README.md) for the authority map and output locations.
2. Read the relevant full brief in [`../docs/workstreams/README.md`](../docs/workstreams/README.md), its canonical sources, and existing code/tests before editing.
3. Check the actual checkout, package scripts, working tree, and current PR state. Historical agent IDs, PR numbers, and successful browser checks are not current Godot acceptance evidence.
4. State the layer, owned paths, dependencies, and acceptance checks for the increment. Coordinate shared contract changes before parallel writes; do not overwrite another stream.

## Architectural guardrails

- Canonical content definitions are the seven JSON collections in `data/`, governed by `docs/data-schema.md`. Preserve stable IDs, inline rewards, and read-only definitions.
- Runtime supplement means explicit, versioned execution metadata, not combat instance state or a second catalog. Follow `docs/runtime-data-plan.md` and `docs/final-runtime-data-design.md`: validator/export tooling exists, but native supplement integration remains pending. Keep next-runtime `data/contracts/v1/` schemas/fixtures separate from live slice registries.
- Keep deterministic combat rules, combat instance state, run state, presentation, and the Godot runtime host separate as described in `docs/target-architecture.md`.
- Combat owns legality, targeting, seeded resolution, and ordered events. UI and animation consume results; they never apply damage, rewards, or timing rules independently.
- Godot hosts validated content and presentation, not a parallel authoring authority. Do not author copies in `godot/data/` or promote existing Resource stubs into the canonical model.
- Fail visibly on invalid data or unsupported versions; do not silently repair references, infer missing policy, or accept fields whose behavior is ignored.
- Browser slice behavior is reference evidence, not approval of unspecified gameplay policies. Record blocked policies in the workstream decision queue.
- Validation/export readiness is authoritative: a content test pass is not proof of behavioral support, packaging, or a playable Godot build.

## Placement and continuity

- Use the output map in `docs/README.md` and local READMEs in `data/`, `godot/`, and `scripts/`. Update existing subject owners instead of creating alternate plans or shadow schemas.
- Imported documents and `data-sources/` are review inputs, not canonical authority. Generated bundles, raw imports, caches, and build outputs must never become authored content.
- Put focused tests beside the relevant existing suite: browser slice tests in `src/game/slice/`, Node tooling tests in `scripts/` or `tools/import/test/`, native tests in `godot/tests/`.
- Before handoff, follow `docs/workstreams/orchestration.md`: record changed paths, decisions with authority links, actual commands/results, unverified gates, blockers/owner, and the next bounded action. Update a ledger only for a dispatch it actually represents.
- Keep the docs index and affected cross-links current. Label proposals, historical records, and unverified systems explicitly; never claim a whole workstream complete from one increment.
- Scan changed files for secrets and review the diff before publication. Do not commit credentials, temporary diagnostics, or unrelated generated files.
