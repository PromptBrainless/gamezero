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
