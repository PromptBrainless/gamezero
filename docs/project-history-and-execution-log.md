# Project History and Execution Log

A structured record of the consolidation decisions, staged execution plan, and art-planning direction for GameZero's first playable slice. This is a project record, not a raw chat transcript. Historical PR numbers and agent status are included as supplied planning context; verify live GitHub state before acting on them.

## 1. Project context and current goal

The project is working toward a small, complete, data-driven **First Playable Vertical Slice**:

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

The planning target is a Godot foundation under `godot/` and JSON-first content under `data/`. Keep work focused on this playable loop; defer broader regions, extra careers/bosses, save/load, overworld, shop, inventory management, audio, and large-scale balancing until the slice is playable.

The repository also contains an `ECHO//BRUCH` web/JavaScript combat prototype. Its rules and names are not automatically the source of truth for the planned first slice.

## 2. Consolidation decision and schema principles

The central decision was to stop broad parallel expansion, consolidate overlapping documentation and data proposals, and establish a single source of truth per subject before implementing runtime, HUD, and screen flow.

Intended content/schema rules:

- JSON under `data/` is canonical; `docs/data-schema.md` describes the real slice data.
- IDs are stable `snake_case`; chance values use `0.0–1.0`.
- Optional fields are omitted rather than set to `null`.
- Bosses are a distinct content type.
- Unknown fields are developer-facing errors.
- All content references must resolve, including career/skill/status and encounter/enemy/reward relationships.

These principles must be checked against the actual schema and content files; this log does not create a parallel schema.

## 3. Historical consolidation and PR context

The conversation supplied more than one historical PR map. Preserve the ordering and intent, but do not treat old PR dispositions as verified current status.

### Earlier keep/drop recommendations

- Keep: PR #1 (Godot technical foundation), PR #8 (slice implementation plan), PR #9 (milestones), PR #10 (implementation board), PR #13 (docs/schema consolidation).
- Keep selectively: PR #4 (optional high-level docs), PR #5 (actual JSON content shape), PR #7 (UI/HUD/visual/authoring rules).
- Do not treat as canonical: PR #2, PR #3, PR #6.

### Later consolidation notes

The consolidated plan also warns that older schema/content strands—including PR #8 and PR #10—may overlap with the canonical schema and should be reused only when consistent. Treat this as a reminder to review the actual PR contents, not as a reason to blindly keep or drop a number.

### Recommended review and merge order for content work

1. **PR #13 — schema/docs consolidation:** establish the vocabulary and baseline.
2. **PR #12 — core player content:** verify against the merged schema, stable IDs, omitted optional fields, and valid references.
3. **PR #11 — encounter content:** update against the baseline and verify enemy, boss, item, encounter, and reward references.

The PR numbers, states, and relationships are historical conversation context. Check GitHub before merging or assuming any agent work is still active.

## 4. Intended documentation and content structure

The canonical documentation set proposed in the consolidation work includes:

- `docs/README.md`
- `docs/data-schema.md`
- `docs/data-authoring-rules.md`
- `docs/runtime-data-plan.md`
- `docs/first-playable-ui-plan.md`
- `docs/vertical-slice-implementation-plan.md`
- `docs/milestones.md`
- `docs/implementation-board.md`
- `docs/repo-consolidation-plan.md`
- `docs/project-history-and-execution-log.md`

Content is organized under `data/` by type: careers, skills, statuses, enemies, bosses, items, encounters, and rewards. Optional high-level/visual documents may support the slice but should not create a competing operational source of truth.

## 5. Agent workstreams described in the conversation

Three coordinated workstreams were described as started; their present status is unknown unless verified against their task/PR:

1. **Core player content:** careers, skills, statuses; expected output was three careers, eight to nine skills, a core status set, and schema-valid references.
2. **Encounter content:** enemies, optional boss, items, encounters, and rewards; expected output was three enemies, an optional schema-supported boss, one to four encounters, and consistent references.
3. **Schema/docs consolidation:** documentation index, data schema, consolidation plan, and focused terminology fixes.

The earlier request to create this project log also produced a cloud-agent task link in the conversation. Its completion and merge status were not verified in that context.

## 6. Post-content implementation sequence

After the consolidation and content work is reviewed:

1. **Data Runtime Foundation:** JSON loading, validation, registry, runtime facade, and encounter resolver. UI/gameplay should not consume raw JSON.
2. **Combat HUD Foundation:** HUD layout, player/enemy state, action/target/preview flow, tooltips, compact event log, and runtime-data connection.
3. **First Playable Screen Flow:** Career Select, Encounter Preview, Reward, Progression, and minimal state handoff to/from combat.

Do not expand these steps into a full combat resolver, save/load, overworld, shop, or inventory management without a separate scope decision. Establish shared data/UI contracts before parallel agent work and assign non-overlapping surfaces.

## 7. Sprint 1 art-planning direction

The later request asked for full-text treatment of the prioritized asset list, art direction, and image-generation prompts rather than a mini guide. Sprint 1 is bounded to:

- A reusable combat HUD visual kit and responsive module/layout references.
- Exactly 36 core combat icons across actions, combat resources, statuses, reactions, echoes, field markers, and equipment slots.
- A staged process: confirm source terminology → approve visual foundation and responsive layouts → prototype HUD modules → approve representative icon archetypes → produce and review all 36 icons → export and hand off.
- Consistent global style and individual prompts, with generated output treated as draft art requiring normalization and review.

Keep the First Playable framing. Do not add speculative gameplay, classes, enemies, environments, or systems to justify new art. The full production details are in:

- `docs/art-sprint-1-production-pack.md`
- `docs/art-sprint-1-task-checklist.md`
- `docs/art-sprint-1-prompt-sheet.md`

These documents are plans; they do not claim that assets have been created or approved.

## 8. Open tensions and risks

- Slice scope may grow beyond the minimum playable loop.
- Older docs may conflict on field names, types, or chance formats.
- Actual content shape must be reconciled with abstract schema descriptions.
- Reward representation (inline versus separate structures) needs one canonical decision.
- Optional high-level docs should not displace operational slice docs.
- Prototype `ECHO//BRUCH` details should not silently define the planned Godot slice.
- Icon labels and HUD semantics must be confirmed against the canonical gameplay model before integration.
- Milestones and implementation status can drift from the actual repository.

## 9. Intended source-of-truth map

| Subject | Intended canonical source |
| --- | --- |
| Docs entry point | `docs/README.md` |
| JSON shapes and fields | `docs/data-schema.md` |
| Content authoring conventions | `docs/data-authoring-rules.md` |
| Consolidation decisions | `docs/repo-consolidation-plan.md` |
| Data loading/validation/registry | `docs/runtime-data-plan.md` |
| Screens and HUD | `docs/first-playable-ui-plan.md` |
| Slice execution | `docs/vertical-slice-implementation-plan.md` |
| Milestones and current status | `docs/milestones.md`, `docs/implementation-board.md` |
| Gameplay content | `data/` |
| Engine foundation | `godot/` |
| Sprint 1 visual production | `docs/art-sprint-1-production-pack.md` and its checklist/prompt sheet |

## 10. Consolidation completion criteria

Consolidation is complete when:

- There is one authoritative source per topic and no unresolved competing standard.
- `docs/README.md` is a reliable entry point and its links resolve.
- `docs/data-schema.md` matches the real JSON under `data/`.
- IDs, references, optional fields, and value ranges agree across content and schema.
- The historical PR order and any outstanding agent work are checked against live GitHub state.
- The next implementation block starts from a stable content, runtime, and UI contract.

Sprint 1 art planning is complete only when the separate art checklist's review gates and done criteria are satisfied.
