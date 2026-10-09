# Repo Consolidation Plan

Reduces the overlapping PR/doc strands to one source of truth per topic for the first playable vertical slice. The original consolidation establishes documentation and schema; this PR integration carries over schema-compatible PR #5 content without adding runtime systems or gameplay code.

## Decisions

| PR | Decision | Role |
|---|---|---|
| #1 | Keep selectively | Retain resolver/event/presentation architecture; defer the unverified Godot scaffold |
| #2, #3 | Drop | Superseded early design drafts |
| #4 | Keep selectively | Source for optional high-level docs |
| #5 | Keep, leading | Reality check for the JSON content shape and slice content |
| #6 | Drop | Competing dataset to #5 |
| #7 | Keep selectively | UI style, HUD spec, visual brief, authoring rules; its schema text is replaced |
| #8 | Keep | Canonical vertical-slice execution plan |
| #9 | Keep | Milestone definitions |
| #10 | Keep, after link cleanup | Implementation board |

Slice content is **JSON-first under `data/`**. `.tres` / `godot/data/` is not a content source for the slice.

## Final target file set and sources

| File | Source | Action |
|---|---|---|
| `README.md` (root) | PR #1 | Keep; point to `docs/README.md` and `data/` |
| `docs/README.md` | New (material: #7, #8, #9, #10, #4) | Rewritten as canonical index |
| `docs/repo-consolidation-plan.md` | This PR | New |
| `docs/data-schema.md` | New (leading: #5; conventions: #7; runtime: #8) | Rewritten |
| `docs/milestones.md` | #9 | Adopt sequential gates and align with current slice |
| `docs/implementation-board.md` | #10 | Adopt; fix missing-document reference and schema/runtime assumptions |
| `docs/vertical-slice-implementation-plan.md` | #8 | Adopt and sync scope/counts to selected content |
| `docs/runtime-data-plan.md` | #8 | Adopt and sync fields/required behaviors to `data-schema.md` |
| `docs/first-playable-ui-plan.md` | #8 | Adopt and align screens/content to selected slice |
| `docs/ui-style-guide.md` | #7 | Adopt useful principles, align language to canonical schema |
| `docs/hud-spec.md` | #7 | Adopt module/interaction direction, align to canonical runtime data |
| `docs/visual-reference-brief.md` | #7 | Adopt stable visual principles; link to Sprint 1 art docs |
| `docs/data-authoring-rules.md` | #7 | Adopt and align with schema |
| `docs/vision.md` | #4 | Keep the slice-level vision; defer the duplicate high-level doc suite |
| `data/<type>/<id>.json` | #5 | Content base; follow `data-schema.md` |

## What replaces what

| Topic | Source of truth | Replaces |
|---|---|---|
| Slice execution plan | #8 | slice planning in #2, #3, #4 |
| Milestones | #9 | milestone/roadmap fragments in #4 and older docs |
| Implementation board | #10 | ticket lists in PR bodies/chat |
| UI style, HUD, visual brief, authoring rules | #7 | UI/HUD/visual parts of #2, #3 |
| JSON content shape | `data-schema.md` (led by #5) | schema in #7, record fields in #8's runtime plan, `.tres` notes in #1, dataset in #6 |
| Docs index | `docs/README.md` | indexes in #1, #4, #5, #7 |

## What `docs/data-schema.md` must define and normalize

Defines: entity types in the slice (careers, skills, statuses, items, enemies, bosses, encounters); required vs optional fields per type; enum values; shared blocks (`base_stats`, `damage`, `applies_statuses`, `loot_table`); reference table and startup validation rules; out-of-scope types.

Normalizes (decided in the file): chances `0.0–1.0`; optional fields omitted, never `null`; bosses are their own type; unknown fields are dev errors; `applies_statuses`, `default_duration`, `effect`, `hp_threshold`, `career_tags`, `base_stats` keys, inline encounter `rewards`; collection implied by directory instead of a `type` field.

## What `docs/README.md` must contain and exclude

Contains: core docs (with ownership one-liners), supporting docs, optional high-level docs, reading order.
Excludes: restated milestones, schema, board or plan content; draft/final status tables; links to dropped material as if authoritative.

## Consistency touch-ups required in related docs

These files live on other PR branches, not on this base, so they are listed rather than edited here:

- `implementation-board.md`: references `docs/definition-of-done-vertical-slice.md`, which does not exist; point to the done criteria in `vertical-slice-implementation-plan.md` or add the file.
- `runtime-data-plan.md`: replace `name_key`/`description_key`, `allowed_careers`, `reward_table_id`/`rewards/`, `progression[]`, `stats`, 0–100 chances with the names in `data-schema.md`; validation rule 4 uses 100 % → `1.0`.
- `data-authoring-rules.md`: rule 8 "chances multiples of 5" → multiples of 0.05; rule 9 (regions) → regions are out of slice; rule 2 ids should state "singular".
- Root `README.md`: state JSON-first under `data/`.

## Unresolved tensions

1. **Slice size** is set by `vertical-slice-implementation-plan.md`: three careers, nine player skills, six statuses, three normal enemies, one boss, eleven items, and four ordered encounters. Keep that target bounded.
2. **Historical source optionals** included `null` fields and an empty boss `on_enter` list; normalized content omits those optional values.
3. **Progression and reward tables**: `progression[]` and separate reward tables are deferred; the schema uses `stat_growth`, inline encounter `rewards`, and enemy/boss `loot_table`.
4. **Item `effects` modifiers** use the documented single-key-object shape. Runtime consumers and validation must support each adopted modifier; do not treat shape acceptance as behavior implementation.
5. **PR #4's full doc suite** is intentionally deferred; only slice-level vision and architecture principles are retained.

## Current integration follow-up

The above table records the original consolidation decision. The subsequent per-PR review and adopted/deferred content are tracked in [`pr-integration-review.md`](pr-integration-review.md). The current art-planning branch consolidates compatible PR #5 content, corrected PR #7–#10 planning, the PR #15 HUD/icon pack, and selected architecture/vision principles from PR #1–#4.

The data files merged from PR #12 must conform to this file's schema. The original PR #6 dataset remains excluded because it duplicates and conflicts with the selected PR #5 content; its useful referential-integrity test pattern is reused against the unified dataset.
