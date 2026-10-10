# 03 — Godot Runtime Migration

## Mission and sources

Move the agreed data-driven slice into Godot without porting every historical browser prototype. Sources: [repository README](../../README.md), [schema](../data-schema.md), [runtime supplement](../final-runtime-data-design.md), [slice plan](../vertical-slice-implementation-plan.md), [combat architecture](../combat-architecture.md), [UI flow](../first-playable-ui-plan.md).

The older [Godot project plan](../godot-project-plan.md) is layout/direction context. Its `.tres` content and 1v1 language are superseded by canonical JSON and the cult fight's two opponents.

## Observed versus remaining

**Observed before current bridge:** `godot/project.godot`, `scenes/boot/main.tscn`, data definition classes, combat/state/event/UI/progression/inventory/save scaffolds. `turn_resolver.gd` returns an empty list. Empty folders and TODO services are not playable features.

**Delivered foundation:** `scripts/export-godot-data.ts`, `godot/scripts/data/content_registry.gd`, and bootstrap loading in `main.gd`. `npm run data:check` passed; all nine export tests passed within the 22-test combined metadata/export run at the 2026-10-10 checkpoint. These verify Node-side transport, not engine execution, combat, menus, inventory or progression.

**Pending:** real engine parse/import, headless fixture parity, all screen transitions and G5 gameplay. No Godot binary was found at the documentation checkpoint; engine checks must remain explicitly unverified until performed.

## Ownership

Own exporter/bundle envelope, Godot ContentRegistry, bootstrap and screen-routing/controller integration. 01 owns validation; 02 owns pure resolver rules and parity expectations; 04 owns RPG handoff service/data; 05 owns UI/actor presentation scenes and styling.

Do not copy constants into scenes, build a second JSON validator with divergent semantics, or implement combat logic in `main.gd`. Agree new controller/scene paths before edits. Existing save/inventory stubs are deferred, not an invitation to expand.

## Data bridge contract

1. Export from canonical `data/{careers,skills,statuses,items,enemies,bosses,encounters}` plus `data/runtime/slice.json`.
2. Validate all inputs with 01 before writing anything. Reject errors with source path/field, nonzero exit, and no replacement of a prior valid bundle.
3. Produce deterministic `godot/data/content_bundle.json`, loaded in engine as `res://data/content_bundle.json`.
4. Envelope v1 contains `schema_version`, `content_revision`, `collections` indexed by stable ID and `runtime`. Sort object keys while preserving meaningful array order; do not reorder encounters/waves/actions.
5. Treat the bundle as generated output, not canonical source or a committed duplicate catalog. `--check` must validate without writing.
6. Registry fails clearly for missing/invalid/unsupported bundle; copies or freezes definitions so combat instances cannot mutate them. Full schema/reference validation belongs to the exporter; lightweight engine envelope checks are not equivalent.

Version/revision mismatch is a startup failure, not silent fallback. Existing data-definition `.gd` classes may be adapted, but their early shape is not a rival schema.

## Work sequence

1. Accept G1/export tests and bootstrap registry diagnostics.
2. Resolve each encounter by stable ID into definitions plus distinct spawn instances. Demonstrate both cult slots.
3. Load G2 fixtures and run 02's pure resolver in headless engine. Compare preview, numeric event order and final state, including RNG/rounding.
4. Add controller handoff with minimal in-memory contexts: career ID, encounter ID/index, level, XP display, seed, combat result. 04 supplies transitions; 05 supplies views.
5. Connect selection → preview → combat → reward → progression, including retry, reset and final finish. Do not award rewards twice on repeated presentation callbacks.
6. Test scene import and target-runtime execution before declaring migration complete. Placeholder actors are acceptable; disconnected test scenes are not.

## Executable acceptance

Node-side checks after local bridge handoff:

```sh
npm run data:check
node --test scripts/export-godot-data.test.mjs
npm run data:export:godot
```

The export owner's test must assert repeat-byte determinism, exact counts/IDs, no writes in check mode, and invalid-source rejection without damaging output. Do not commit generated output created by these commands.

Engine commands, **only where Godot 4 is installed** (`godot4` may replace `godot`):

```sh
godot --headless --path godot --editor --import
godot --headless --path godot --quit-after 2
```

Expected: no script/import errors, successful registry load, counts 3/10/6/11/3/1/4 and clean boot exit. These commands prove import/boot only.

**To implement, not an existing test claim:** a package-owned `godot/tests/slice_parity.gd` headless runner:

```sh
godot --headless --path godot --script res://tests/slice_parity.gd
```

Runner must exit nonzero on fixture differences and assert G2 previews/events/state for normal, cult and boss cases. Gate remains open until that runner exists and actually passes.

Interactive G5 evidence: select each career, play all four encounters, inspect/confirm legal targets, retry a loss without progress/reward leakage, restart fresh and reach finish. Record platform, engine version, source revision and screenshots/log evidence. Successful exporter tests cannot substitute for this.

## Dependencies and deferrals

Bridge can proceed after G1; execution waits for G2; full flow waits for 04/05 handoffs. A missing engine blocks G3 runtime verification but not Node export validation. Report the distinction.

Deferred: wholesale web port, W100 modes, save/load, world/shop, desktop packaging, Android/iOS certification, huge catalogs and hot reload.

## Copyable agent assignment

> Own package 03: exporter, Godot registry/bootstrap and scene/controller integration only. Reuse package 01 validation and package 02 fixtures/resolver; do not reimplement rules or HUD. Generate validated deterministic res://data/content_bundle.json without committing it, fail safely on invalid/version-mismatched inputs, and resolve two cult opponents. Connect 04's in-memory run service with 05's views. Run Node export tests; run Godot import/boot/parity only if an engine exists. Report unavailable engine tests as blocked and never call a loading scaffold fully playable.
