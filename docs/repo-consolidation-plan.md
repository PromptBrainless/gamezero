# Repo Consolidation Plan

Reduces the overlapping PR/doc strands to one source of truth per topic for the first playable vertical slice. Scope: documentation and schema only; no gameplay, systems or new content.

## Decisions

| PR | Decision | Role |
|---|---|---|
| #1 | Keep | Godot technical foundation only; its early docs are not authoritative |
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
| `docs/milestones.md` | #9 | Take as is |
| `docs/implementation-board.md` | #10 | Take; fix references to non-existing docs |
| `docs/vertical-slice-implementation-plan.md` | #8 | Take as is |
| `docs/runtime-data-plan.md` | #8 | Take; sync record fields to `data-schema.md` |
| `docs/first-playable-ui-plan.md` | #8 | Take as is |
| `docs/ui-style-guide.md` | #7 | Take as is |
| `docs/hud-spec.md` | #7 | Take as is |
| `docs/visual-reference-brief.md` | #7 | Take as is |
| `docs/data-authoring-rules.md` | #7 | Take; align with schema (see below) |
| `docs/vision.md`, `combat-design.md`, `system-scaling.md`, `implementation-roadmap.md` | #4 | Optional, post-alignment |
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

1. **Slice size**: #8 plans 3 normal encounters + 1 boss; #5 content has 3 careers, 8 skills, 6 statuses, 3 enemies, 1 boss, 11 items, 4 encounters; the preferred minimal core is smaller. Not decided here; content PRs may trim.
2. **#5 content vs schema**: `hold_the_line.damage` and `iron_command.career` are `null` in #5 and must be omitted.
3. **Progression and reward tables**: #8 expects career `progression[]` and reward tables; #5 has neither (inline `rewards`, `stat_growth`). Schema follows #5; Track 1 must either accept this or extend the schema first.
4. **Boss item `captains_greatshield`** etc. rely on #5 `effects` objects whose keys are not enumerated; the schema leaves them open for items.
5. **PR #4 docs** are not yet aligned to milestones/board.
