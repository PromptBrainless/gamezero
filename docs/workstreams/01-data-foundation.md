# 01 — Data Foundation

## Mission and sources

Give every consumer one validated, read-only content contract. Read [schema](../data-schema.md), [authoring rules](../data-authoring-rules.md), [runtime plan](../runtime-data-plan.md), [runtime supplement](../final-runtime-data-design.md), and [orchestration](00-orchestration-overview.md). This package owns G1, not combat completion.

## Delivered versus pending

**Observed:** seven base collections under `data/`; Vite raw loading in `src/game/slice/content.ts`; strict Zod parsing/reference checks in `validation.ts`; canonical-content tests in `scripts/data-content.test.mjs`; ordered encounter resolution currently takes an array index.

**Delivered foundation:** `data/runtime/slice.json`, `scripts/runtime-data.mjs`, and separate metadata tests. `npm run data:check` and the combined metadata/export command passed all 22 tests at the 2026-10-10 documentation checkpoint, covering strict shapes, references, unlocks, targeting, slots/waves and terminating dialogue.

**Pending:** fully resolved gameplay contexts by stable ID and consumer integration. Combined authoring validation is delivered; successful validation does not establish Godot gameplay or independently verify engine startup diagnostics.

## Ownership and interfaces

Allowed: data validation adapters, metadata validation, shared contract fixtures and targeted tests. Base entity edits belong to 04; export/bundle/Godot IO to 03. Integrator owns `package.json` and schema/supplement publication.

Inputs: seven schema-v1 collections plus separate `data/runtime/slice.json`. Metadata is not another entity in `data/encounters`; do not feed it into the base record loader.

Outputs:

- Registry indexed by **collection + stable ID**, published only after successful validation.
- Aggregated issues containing source path, field and message; deterministic ordering.
- Encounter context retaining canonical encounter, opponent instances, their definitions/skills/statuses, stage/slots, narrative references and inline rewards.
- Explicit readiness; failure must not publish a partial playable registry.

Definition IDs identify reusable content; `instance_id` identifies a spawn within an encounter. Two instances must not share mutable HP/status state.

## Implementation backlog

1. Verify counts: 3 careers, 10 skills, 6 statuses, 11 items, 3 enemies, 1 boss, 4 encounters. Keep `iron_command` out of playable pools.
2. Exercise base validation for JSON/type/null/unknown-field errors, filename mismatch, duplicate IDs, chance ranges, phases/order, career affinity and starting-skill affordability. Do not assume all documented invariants are already implemented.
3. Validate metadata schema/version before cross-reference checks. Cover each career/action/status/encounter exactly as specified; no missing or duplicate coverage.
4. Check unlock levels/pools, target team, stage coordinates/slot IDs, archetype collection references, spawn identity/slot legality, wave triggers, and narrative node references/reachability.
5. Require flattened encounter spawn definitions to agree with base opponent lists, including both cult opponents. Do not enforce globally unique instance IDs across independent encounters.
6. Expose resolved normal and boss encounters without copying gameplay values into consumers. Preserve canonical encounter order separately from ID lookup.
7. Freeze contracts and representative failure/success fixtures for 02–05. Leave actual mechanics to 02.

## Versioning and compatibility

Base schema v1 and supplement `schema_version: 1` are related but distinct contracts. `content_revision: "slice_1"` identifies the selected authored revision, not permission to tolerate unknown fields. Reject unsupported versions explicitly.

New keys/enums require a documented contract update plus validator/consumer tests. Breaking changes require a migration/version decision before authoring; new content revisions require consistent coverage/reference tests. Never rename released IDs, add null placeholders, embed `progression[]` in base careers, or change baseline stats to make a validator pass.

The supplement records existing Riposte as `execution: "reaction"` with `reaction_hook: "after_melee_hit"`; other skills remain manual. `rewards: "consumables_next_encounter"` records mounted browser supply handoff. Normal AI is `uniform_available`, not authored weights; status reapply is `keep_longer_duration`. These are code-aligned metadata, not new web behavior. Equipment/dialogue metadata does not establish a deep inventory or dialogue engine.

## Executable acceptance

From repository root, after the foundation implementation is present:

```sh
npm run test:slice
npm run data:check
node --test scripts/runtime-data.test.mjs
```

The last command is the metadata owner's targeted test file; absence means work remains, not a waived criterion.

Required assertions:

- Real content passes without rewriting inputs.
- Multiple bad records produce multiple stable path/field diagnostics in one result.
- Unknown nested metadata keys, nulls and unsupported versions fail.
- Broken skill/status/item/boss references and incompatible career unlocks fail.
- Missing/duplicate spawn slots, invalid waves, missing narrative links fail.
- Resolve all four IDs; cult yields two independent opponents; boss preserves phases/telegraphs.
- Returned content cannot be mutated into a different registry definition.

## Dependencies, handoff and deferrals

Depends on G0. 02/04/06 can implement against G1 fixtures; 03 receives validated data, not raw objects; 05 receives runtime-shaped examples. Handoff includes exact exported API, issue format, successful and malformed fixtures, commands/results and any unimplemented invariant.

Deferred: hot reload, localization, schema compilers, save migrations, world/region and separate reward catalogs.

## Copyable agent assignment

> Own package 01 only. Inspect src/game/slice/validation.ts, content.ts, scripts/data-content.test.mjs and the metadata supplement/current runtime validator. Complete strict combined validation and stable-ID resolved contexts with failure fixtures. Preserve all IDs, 38 base records, stats and schema-v1 field shapes. Do not edit exporter/Godot/UI or author new gameplay content; coordinate shared script/schema changes with the integrator. Run targeted validation commands, report implemented versus missing invariants, and hand 02–06 the frozen contract.
