# Content pipeline

Canonical definitions are JSON in root `data/`, not authored Godot Resources.
[`data-schema.md`](data-schema.md) owns the contract and
[`data-authoring-rules.md`](data-authoring-rules.md) owns authoring practice.
This replaces the earlier `.tres`-first guidance.

## Readiness flow

```text
Imported inputs → review/normalization → canonical JSON
  → structural/reference validation → behavioral tests
  → deterministic export/copy → Godot registry → exported-build acceptance
```

1. Stage imported tables in `data-sources/`; use the importer manifest/review
   queue in `imports/drive/` for provenance. Imported docs are not auto-approved contracts.
2. Review/normalize into the seven canonical collections. Approve contract
   changes before adding fields, metadata, or new mechanics.
3. Run `node --test scripts/data-content.test.mjs` and `npm run test:slice`.
   Validation errors block readiness; accepting a field without its runtime
   behavior is not sufficient.
4. `npm run data:godot` generates the canonical native `runtime_pack.json`.
   `npm run data:check` validates the isolated supplement; `npm run data:export:godot`
   generates its optional `content_bundle.json`. The envelopes and consumers are
   documented in [`runtime-data-plan.md`](runtime-data-plan.md) and
   [`final-runtime-data-design.md`](final-runtime-data-design.md); do not interchange them.
5. Test registry loading and actual exported Godot consumption without access
   to the checkout's parent `data/`. Invalid input fails visibly, not by fallback.

## Current limits and generated outputs

The browser has content validation/reference tests. Both export commands exist;
supplement integration and exported-game acceptance remain pending.
`ContentRegistry` provides envelope checks only, not full defensive native
supplement validation. Development inventory checks are not native playability
or export acceptance.

Generated runtime bundles/copies, raw import mirrors, caches, and build outputs
must never be committed as source of truth or edited as content fixes. Change
canonical inputs and regenerate; retain only explicitly reviewed evidence.
Runtime supplement planning belongs in [`runtime-data-plan.md`](runtime-data-plan.md),
not an unindexed competing schema.

Art follows the [Sprint 1 production pack](art-sprint-1-production-pack.md) and
WS05 approval gates: preparation under `artifacts/art/sprint-1/`, approved runtime
assets under `godot/assets/`. Simulation reports and art exports do not authorize
mechanics, balance targets, or expanded animation scope.
