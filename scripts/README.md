# Pipeline and tooling placement

Run commands from the checkout root and read `../package.json` before prescribing
a script. Existing platform/environment/PWA scripts are infrastructure; do not
replace them to implement gameplay.

- Repository validation, packaging, simulations, and acceptance helpers belong
  here with focused `*.test.mjs` tests where Node tooling is involved.
- Browser slice rules/validation tests remain in `../src/game/slice/`.
- Native Godot tests remain in `../godot/tests/`; a Node check cannot certify
  Godot rendering or export behavior.
- Drive import code/config/tests stay in [`../tools/import/`](../tools/import/README.md).
  Raw tables go to `../data-sources/`, never directly into canonical data.

Current checks:

| Command | Evidence |
|---|---|
| `node --test scripts/data-content.test.mjs` | Canonical inventory/reference checks |
| `node --test scripts/workstream-docs.test.mjs` | Guidance links, source coverage, workstream ledger |
| `npm run test:slice` | Browser reference combat and validation plus content checks |
| `npm run test:import` | Importer tests |
| `npm test` | Repository Node suites; not native Godot acceptance |

`data:check` and `data:export:godot` are not package scripts in this baseline.
Do not instruct later agents to run them as if implemented. Future export tooling
must follow [`../docs/content-pipeline.md`](../docs/content-pipeline.md): validate
first, generate reproducibly, never write back to canonical sources, document
output/version and failure behavior, and test exported consumption.

Keep generated bundles/build outputs and transient diagnostics out of authored
source. Record exact commands/results and next work through the
[handoff convention](../docs/workstreams/orchestration.md#repository-handoff-convention),
not a new tool-specific status log.
