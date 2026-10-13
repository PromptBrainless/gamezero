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
| `npm run data:godot` / `npm run data:godot:check` | Generate/check the canonical `godot/data/runtime_pack.json` used by the native host |
| `npm run data:check` / `npm run data:export:godot` | Validate/generate the isolated versioned supplement `godot/data/content_bundle.json` |
| `npm run assets:audit` / `npm run assets:audit:check` | Inventory tracked vector/raster/audio files and reproduce `artifacts/art/asset-audit.json`; literal references, dynamic candidates and build copies remain distinct |
| `npm run export:godot:linux -- /absolute/output/echo-bruch.x86_64` | Validate canonical pack and export the existing Linux preset from fresh staged inputs; fail on engine error logs even with exit 0 |

The asset audit is evidence preparation for issues #38, #42 and #43, not a
license or native runtime approval. Run `node --test scripts/asset-audit.test.mjs`
for its focused regression checks. Audio metadata uses `ffprobe` when available
and explicitly records unverified metadata when that tool is absent. Rights,
placeholder identification, sound level/loop quality and dynamically constructed
paths still need review. ZIP containers are listed read-only with `unzip`, including
member byte sizes, license candidates, nested containers and resource forks; archived members are
not treated as loaded runtime assets. Do not enable assets based only on a static
reference or an archive's license filename.
Nested ZIP contents are recursively inventoried (inventory-only; not integrated or approved). Resource forks and extraction failures are explicitly marked. Nested media are included in archive asset counts but remain unapproved candidates.

The two export paths have different envelopes and consumers; do not substitute
one for the other. Supplement integration and exported-game acceptance remain
pending. Export tooling follows [`../docs/content-pipeline.md`](../docs/content-pipeline.md): validate
first, generate reproducibly, never write back to canonical sources, document
output/version and failure behavior, and test exported consumption.

Keep generated bundles/build outputs and transient diagnostics out of authored
source. Record exact commands/results and next work through the
[handoff convention](../docs/workstreams/orchestration.md#repository-handoff-convention),
not a new tool-specific status log.

## Existing connectors and credential boundaries

| Connection | Existing implementation | Safe operating boundary |
|---|---|---|
| Repository Drive intake | [`tools/import`](../tools/import/README.md), [`drive-import.config.json`](../tools/import/drive-import.config.json), [`mapping-rules.json`](../tools/import/mapping-rules.json) | `npm run drive:status`, then `npm run drive:plan`; use `npm run drive:import` only for a reviewed plan. Read-only Drive scope; tables go to `data-sources/`. |
| Viewer Google Drive/Calendar tools | [`app-data`](../src/lib/app-data/index.ts), [`server client`](../src/lib/app-data/client.server.ts), [`tool types`](../src/lib/app-data/types.ts) | Server-handler calls with request-scoped gate identity/token and granted tools; no browser-side credential access or separate OAuth replacement. |
| Viewer readiness and failures | [`readiness`](../src/lib/app-data/readiness.ts), [`error classification`](../src/lib/app-data/errors.ts) | Distinguish pending, login, not-connected, scope-denied and access-denied; absence is not a successful or empty-data response. |

These are existing capabilities, not a claim that this session has authenticated
external accounts or activated a new gameplay dependency. GameZero's slice does
not require viewer connectors, accounts, or a database.

The importer resolves provisioned credentials using its documented auth methods.
OAuth tokens are stored outside the checkout with owner-only permissions;
`tools/import/.secrets/` is ignored. CI credentials belong in the CI secret
manager and runtime temporary files, never committed configuration.
Do not print credential values or persist gate tokens in application state.
No credentials or consent are created by an agent instruction update.

Use `npm run test:import` and the existing app-data/auth suites for regression
evidence; mocked tests do not establish live authentication. Record unavailable
credentials/grants as blockers without copying tokens or private connector data
into handoffs.
