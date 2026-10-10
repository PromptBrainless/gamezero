# GameZero

GameZero is a mobile-first, 2D side-view turn-based combat RPG in development. The current browser prototype remains available as a rules reference; the planned first playable is a data-driven Godot slice.

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

## Repository guide

- [`docs/README.md`](docs/README.md) — canonical documentation index and reading order.
- [`docs/data-schema.md`](docs/data-schema.md) — source of truth for first-slice JSON content.
- [`docs/implementation-board.md`](docs/implementation-board.md) — ordered first-playable work.
- [`docs/art-sprint-1-production-pack.md`](docs/art-sprint-1-production-pack.md) — HUD and core combat icon production brief.
- [`tools/import/README.md`](tools/import/README.md) — Google Drive importer: pulls the design/asset Drive folder into the repo structure (`npm run drive:plan`, `npm run drive:import`).

## Vision and architecture

- [`docs/vision-manifest.md`](docs/vision-manifest.md) — mission, product pillars, and growth guardrails.
- [`docs/target-architecture.md`](docs/target-architecture.md) — layer boundaries and validation/export target, explicitly separated from implementation status.
- [`docs/game-director-pitch.md`](docs/game-director-pitch.md) — intended player experience, world, and tone.

Canonical JSON definitions and deterministic rules own gameplay; runtime metadata,
combat instance state, run state, and presentation are separate concerns. Godot
is the target runtime host, not another content authority. The runtime supplement
and export pipeline are planned contracts, not completed systems in this checkout.

## Working in this repository

Start with the [documentation authority and output map](docs/README.md), then the
relevant [workstream](docs/workstreams/README.md). Agents follow
[repository instructions](.github/copilot-instructions.md); `AGENTS.project.md`
routes non-Copilot agents to the same guidance without replacing the sandbox contract.
Use the [handoff convention](docs/workstreams/orchestration.md#repository-handoff-convention)
so later agents can locate decisions, evidence, blockers, and the next increment.

## Browser prototype

The existing React/Vite prototype can be run with `npm install && npm run dev`.
It is not the target runtime for the planned Godot slice.
