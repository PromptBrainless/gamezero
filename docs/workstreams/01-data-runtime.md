# WS01 — Data Runtime Foundation

**Milestone:** First Playable Build · **Priority:** P0 · **Owner:** data implementation agent.
**Sources:** [runtime components/gates](../runtime-data-plan.md), [schema and reference table](../data-schema.md), [authoring rules](../data-authoring-rules.md), [Track 1](../implementation-board.md), [slice plan](../vertical-slice-implementation-plan.md).
**Dependencies:** schema is the baseline; behavior acceptance is shared with WS02. Ownership and downstream interfaces: [index](README.md).

## Current evidence and initial assignment

The browser has strict validation in `src/game/slice/validation.ts` and glob loading in `content.ts`. Godot's existing `*_definition.gd` Resources are not schema-aligned. Do not port them as canonical data.

First coding increment: implement a standalone JSON loader/registry boundary under `godot/scripts/data/runtime/` with actionable parse/ID/duplicate errors and no publication of partially invalid registries. Keep schema validation an explicit separate responsibility, not a claim that parsing alone validates content. Avoid boot changes until WS06 integration.

## Complete backlog

- [ ] Lock representative real records for all seven collections and resolved-record signatures with WS02–WS04.
- [ ] Load every entity in deliberate collection/file order: careers, skills, statuses, items, enemies, bosses, encounters. Aggregate parse failures with source paths.
- [ ] Implement separate structural and reference validators; only publish read-only validated registries after all checks pass. Expose readiness and full stable errors through `DataRuntime`.
- [ ] Enforce UTF-8 JSON, one entity/file, filename = ASCII snake_case ID, uniqueness within collection, required/optional fields, nested types, enums, integer/float distinctions, omitted-not-null optionals and unknown-field rejection.
- [ ] Validate every schema range: chances 0–1, nonnegative costs/cooldowns, durations/stacks ≥1, difficulty 1–5, thresholds in (0,1], descending boss phases starting at 1.0, unique encounter order, an affordable starting skill per career.
- [ ] Resolve career starting/pool skills with matching career; starting items with career tags; skill careers, applied/removed statuses; item use applied/removed statuses; enemy skills/AI weight keys/loot; boss phase skills, telegraph skills and entry statuses; encounter enemies or bosses and reward items. Check every row of the canonical reference table.
- [ ] Support the schema's shared blocks and optional visual fields, item single-key `effects`, consumable `use`, boss entry modifiers/telegraphs, enemy AI/weaknesses/resistances and loot without silently dropping fields. New keys require schema plus consumer approval.
- [ ] Resolve **all four** encounters, including normal and boss records, their skills/statuses and inline reward items. Expose resolved data to preview/combat, never arbitrary raw JSON.
- [ ] Arrange canonical root `data/` consumption and Godot export packaging with WS06. No second authored content source, absolute host paths or runtime dependency on the parent directory in exported builds.
- [ ] With WS02, exercise `riposte.trigger`, `hold_the_line`/`quick_feint.removes_statuses`, whetstone `next_attack_bonus`, and every adopted modifier. Structural acceptance without effect consumption is insufficient.

## Acceptance and validation

- Every real slice file loads; registry lookups are stable by type/ID and unknown lookups fail clearly.
- Errors use `[collection/id] field: message (path)` or an equivalently actionable source-locatable form, include all discovered failures and have deterministic ordering.
- Tests cover valid seven-collection load, malformed JSON, duplicate/mismatched IDs, unknown/nested/null fields, enum/range failures, broken references, career affordability and tags, boss thresholds/telegraphs, encounter ordering and complete normal/boss resolution.
- Downstream HUD/combat can consume resolved records without re-loading JSON.
- Run existing `node --test scripts/data-content.test.mjs` and `npm run test:slice` for reference regression; run native tests when Godot exists. Report absent native tooling explicitly.

**Excluded:** schema compilers, editor tooling, hot reload, localization, migrations, networking, save data, regions/reward collections, authoring new careers or balancing targets from drafts.
