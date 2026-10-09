# Godot project plan

The project pivots to **Godot 4.4+** (Mobile renderer, GDScript) for a mobile-first 2D side-view, turn-based 1v1 combat game. The Godot project lives in `godot/`; the existing JS/TS web prototype (`src/`) is kept as a rules reference and is not being ported wholesale.

## Pillars
Deep but readable combat, many enemy archetypes and phased bosses, WFRP 4e-inspired careers, slot inventory, character creation, strong hit feedback.

## Layout (`godot/`)
`scenes/` (boot, combat, ui, actors) · `scripts/` (core, combat, actors, data, ui, progression, inventory, save) · `data/` (.tres content) · `assets/`.

## Roadmap
1. Combat core (pure data, tested) using placeholder boxes.
2. Vertical slice: 1 player, 3 enemies, 1 boss, 8–12 skills, 6–10 statuses, HUD.
3. Meta: XP, careers, inventory/equipment, saves.
4. Character creator and layered/skeletal art (e.g. Spine runtime or Godot skeletons).
5. Device profiling, export presets for Android/iOS.

## Agent-friendliness
Godot projects are text-based (`.gd`, `.tscn`, `.tres`), so coding agents can edit them directly. Keep scenes small and logic in scripts.
