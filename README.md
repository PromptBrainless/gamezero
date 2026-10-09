# ECHO//BRUCH

ECHO//BRUCH is currently a browser-based game project with two combat prototypes: a
side-view, d100-inspired combat mode and an older hidden-planning duel ruleset.
The design documents in [`docs/`](docs/README.md) describe a proposed
Godot-based, mobile-first 2D combat RPG direction; they are design specifications,
not a claim that the Godot game is already implemented.

## Design documents

- [Project vision](docs/vision.md) — goals, audience, pillars, and constraints
- [Mini-GDD](docs/mini-gdd.md) — the playable product and its core loops
- [Combat design](docs/combat-design.md) — turn structure, actions, statuses, and
  encounter principles
- [Mobile HUD](docs/mobile-hud.md) — touch-first information hierarchy and layout
- [Initial content plan](docs/initial-content-plan.md) — starting professions,
  statuses, skills, enemies, and bosses
- [Implementation roadmap](docs/implementation-roadmap.md) — milestones and
  validation gates

## Current repository

The existing implementation is a web application. Its combat rules and UI live
under `src/game/` and `src/components/echo/`; the new documents establish a
separate target for future Godot development without replacing or renaming those
files.

For the current web app, install dependencies with `npm install` and start it
with `npm run dev`. See `package.json` for the available build, typecheck, and
test commands.
