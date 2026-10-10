# Canonical gameplay data

Author one UTF-8 JSON record at `<collection>/<id>.json` in the seven collections:
`careers`, `skills`, `statuses`, `items`, `enemies`, `bosses`, `encounters`.
[`../docs/data-schema.md`](../docs/data-schema.md) owns fields/types/references;
[`../docs/data-authoring-rules.md`](../docs/data-authoring-rules.md) owns review practice.

- Preserve filename/ID agreement, stable ASCII `snake_case` IDs, omitted optional
  fields, and inline rewards. No placeholder records or undocumented fields.
- Treat definitions as read-only; HP, cooldowns, active statuses, inventory, and
  encounter progress belong to instantiated combat/run state, not these files.
- Raw imports belong in [`../data-sources/`](../data-sources/README.md).
  `godot/data/`, authored `.tres` copies, and generated bundles are not another catalog.
- `runtime/slice.json` is validated by the isolated
  [`runtime supplement contract`](../docs/final-runtime-data-design.md).
  Review gameplay policy, consumers, and native failure tests before integration.
- `contracts/v1/` contains next-runtime skill/event fixtures governed by
  [`skills and effects`](../docs/final-data-entities/skills-and-effects.md);
  it is not loaded by the seven-collection slice loader or native host.
- Run `node --test scripts/data-content.test.mjs` from the checkout root for
  inventory/reference checks; `npm run test:slice` exercises browser validation
  and rules too. These do not prove exported Godot readiness.

Use [`../docs/content-pipeline.md`](../docs/content-pipeline.md) for readiness
gates and the [handoff convention](../docs/workstreams/orchestration.md#repository-handoff-convention)
for decisions, evidence, and follow-up. Update the contract and its tests together.
