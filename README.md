# GameZero

GameZero is a data-driven tactical RPG in development: mobile-first, turn-based, and presented in 2D side view. It aims for readable decisions with emotional weight in a grounded dark-fantasy world. The current browser prototype remains a rules reference; Godot is the target runtime host for the planned first playable, not a second gameplay-data authority.

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

## Vision and architecture

- [Vision Manifest](docs/vision-manifest.md) — mission, product pillars, architectural principles, authoring philosophy, boundaries, and long-term scaling.
- [Technical Target Architecture](docs/target-architecture.md) — layer model, ownership, state lifetimes, Godot hosting, and target validation/export flow.
- [Game Director Pitch](docs/game-director-pitch.md) — player promise, emotional rhythm, fantasy, and creative guardrails.

The direction separates **canonical content definitions**, a proposed **runtime supplement**, **deterministic combat rules**, **combat instance state**, **run state**, and **presentation**. Definitions are read-only; rules own outcomes; HUD and animation communicate them.

These artifacts guide intent, not implementation status. The canonical schema and first-playable plans remain authoritative. The runtime supplement remains target work; the canonical Godot pack export is implemented below. Browser reference tests do not establish Godot parity or native acceptance.

## Repository guide

- [`docs/README.md`](docs/README.md) — canonical documentation index and reading order.
- [`docs/data-schema.md`](docs/data-schema.md) — source of truth for first-slice JSON content.
- [`docs/implementation-board.md`](docs/implementation-board.md) — ordered first-playable work.
- [`docs/art-sprint-1-production-pack.md`](docs/art-sprint-1-production-pack.md) — HUD and core combat icon production brief.
- [`tools/import/README.md`](tools/import/README.md) — Google Drive importer: pulls the design/asset Drive folder into the repo structure (`npm run drive:plan`, `npm run drive:import`).
- [`docs/workstreams/README.md`](docs/workstreams/README.md) — six bounded implementation workstreams, unresolved decisions, and acceptance gates.
- [`AGENTS.md`](AGENTS.md) — repository/workspace instructions and aligned gameplay architecture guardrails.

Contributors should read the three vision artifacts for direction, then the documentation index for contracts and execution order. Author gameplay records only under the approved `data/` collections; do not duplicate them into authored Godot Resources. Finish the connected slice before post-slice expansion.

## Browser prototype

The existing React/Vite prototype can be run with `npm install && npm run dev`.
It is not the target runtime for the planned Godot slice.

## Godot first playable

Open `godot/project.godot` with Godot 4.4+ and run the main scene. The native
slice connects career selection, encounter preview, combat, rewards, and
in-memory progression using the canonical content.

Content preparation and regression gates:

```sh
npm ci
npm run data:godot
npm run test:slice
npm run test:godot
```

`test:godot` requires `godot` on PATH (or `GODOT=/absolute/path/to/godot`).
The generated pack is committed so the project can run without Node; edit
`data/`, not `godot/data/runtime_pack.json`. See
[`docs/runtime-data-plan.md`](docs/runtime-data-plan.md) for runtime contracts
and [`docs/implementation-board.md`](docs/implementation-board.md) for remaining gates.

## Relevant checks

- `npm run test:slice` — reference combat, validation, and canonical content checks.
- `node --test scripts/workstream-docs.test.mjs` — documentation links and workstream consistency.
- `npm test` — repository Node test suite.

The versioned runtime supplement remains target work. Native first-playable acceptance remains a separate workstream gate.
