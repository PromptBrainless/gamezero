# Canonical source coverage and deduplication

This table routes the first-playable, data/combat, UI, and project-context sources in `docs/README.md` to the six [workstreams](README.md); repeated requirements have one implementation owner and shared acceptance, not duplicate tickets. Post-slice proposals and tooling references are supporting material, not additional slice requirements.

| Canonical source | Concrete actions / disposition | Execution owner |
|---|---|---|
| `milestones.md` | Docs Final contract/decision closure; sequential playable gate; repeatable real flow and actionable data failures; later expansion with its own regression-protected increments | WS06 gatekeeper; WS01–WS04 implementation |
| `implementation-board.md` | P0 loader/validator/registry/encounter resolver/errors; P0 HUD modules/action/preview/help/log; P1 four meta-screens/navigation/context; review focus and end-to-end exit | WS01, WS03, WS04; WS02 supporting behavior; WS06 acceptance |
| `vertical-slice-implementation-plan.md` | Lock schema/IDs/resolved contract; implement foundations; integrate normal/boss content; connect screens; finish four encounters; bounded counts/non-goals | WS01–WS04, WS06 |
| `runtime-data-plan.md` | Loader→Validator→Registry→Resolver, readiness/errors, every validation/reference gate, all encounter records; riposte trigger, removal skills, whetstone next-attack bonus | WS01 structures; WS02 effects; WS06 native packaging/tests |
| `first-playable-ui-plan.md` | Shared widgets/styles, both viewport references, action/target/preview/confirmation/lock/cancel, touch/focus help, five screens and minimal in-memory handoff | WS03 + WS04; WS06 verification |
| `data-schema.md` | Seven types/shared blocks, required/optional/nested fields/enums/ranges, all reference rows, affordable starts/order/phases, numeric formula, normalization and deferred types | WS01 validation/resolution; WS02 consumers; WS06 content checks |
| `data-authoring-rules.md` | Stable filenames/IDs, one entity, no unknown/null/placeholder content, real numeric fields, same-change resolved references, review first-pass balance without draft numeric targets | WS01 + WS06; no new content catalog |
| `final-runtime-data-design.md` | Versioned runtime supplement and validated optional bundle; promotion into native consumers requires reviewed policy and interfaces | WS01 contract review; WS02/WS04 policy; WS06 integration |
| `first-playable-rules.md` | Existing slice mechanics and historical balance evidence; does not independently approve native parity | WS02 reference behavior; WS06 acceptance |
| `combat-architecture.md` | Scene-independent state/RNG, deterministic resolver authority, ordered identified events, no animation/UI rules, candidate-event list not scope expansion | WS02 contracts; WS03 consumes; WS06 replay evidence |
| `hud-spec.md` | All nine module responsibilities, used states, inspectable unavailable actions, one-step cancel/lock/result handoff, exact numbers and non-hover accessibility | WS03 |
| `ui-style-guide.md` | Redundant color, explicit values/state, spacing/borders/tabular numerals, contrast 4.5:1, 48 dp touch targets, focus/tap help and reduced motion | WS03; WS05 visual review; WS06 QA |
| `visual-reference-brief.md` | Restrained material/silhouette/contrast, prompt subject/purpose/framing/palette/negative constraints, approved handoff not speculative image sizes | WS05; WS03 implementation |
| `art-sprint-1-production-pack.md` | HUD kit + layouts, exact seven-category 36-ID set, palette/type/shape/motion, representative-first production, masters/transparent exports/contact sheet/licensing/handoff, Gates A–D | WS05; WS03 realistic context |
| `art-sprint-1-task-checklist.md` | Every Phase 0–4 task and Gate 0/A/B1/B2/C/D; terminology/import check, direction/mobile+wide, states, four archetypes, 128/64/32/24 review, batch and export QA | WS05; approvals remain human gates |
| `art-sprint-1-prompt-sheet.md` | Global style/negative block, HUD-01–09, isolated-symbol template, all 36 individual prompts, editable text and normalization before acceptance | WS05; no fake UI or assumed generation capability |
| `vision.md` | Full career→progression promise, meaningful canonical choices, readable tactics, resolver authority, data-led content and finish-before-expansion | WS01–WS04; WS06 gate |
| `project-history-and-execution-log.md` | Source-of-truth map, PR-history verification, selected content, shared contracts before parallel writes, optional behavior exercise, orientation/terminology risks, consolidation and art completion gates | WS06 audit, WS02/WS04 decisions, WS05 art gates |
| `repo-consolidation-plan.md` | Selected JSON baseline, one source/topic, stable player content normalization, unresolved item modifiers exercised, link/name consistency, exclude competing dataset/stubs/full drafts | WS01 + WS06; historical cleanup addressed below |
| `pr-integration-review.md` | Adopt compatible selected content/architecture/plans, preserve player IDs, rerun references/docs links; explicitly defer incomplete scaffold and expanded/conflicting proposals | WS06; do not merge/open historical PRs automatically |
| `workstreams/README.md` | Six workstream briefs, sequencing, shared interfaces, ownership, gates, and blocked decisions | WS01–WS06 |
| `../tools/import/README.md` | Drive import setup, dry-run/write safety, credential handling, classification, and data-sources boundary | WS05 + WS06 |
| `../imports/drive/README.md` | Import output area, raw mirror, manifest, and unsorted review-queue ownership | WS05 + WS06 |

## Historical cleanup versus live work

- The board now links the real slice done criteria; a new `definition-of-done-vertical-slice.md` would duplicate them.
- Runtime/schema now use `name`/`description`, `career_tags`, `base_stats`, fractions, inline rewards and omitted optionals. The consolidation document's old rename checklist is historical, not a second schema.
- Its old “chances multiples of 0.05” and “singular IDs” proposals are superseded by current schema/authoring rules; no new constraints are adopted.
- Root README already identifies canonical docs and Godot target; no README rewrite or scaffold replacement is required by this extraction.
- Authored content already exists; count/reference/quality assurance is assigned to WS06 rather than reauthoring it. Native validation/consumption is still WS01/WS02 work.
- Earlier agent status and PR numbers are not live gate evidence. This session confirmed PR #17 is the planning PR and #16 is a separate import task; no cross-branch merge is part of this request.

## Deferred inventory — Post-Slice Expansion, not omitted TODOs

The project/gameplay owner must propose a separately scoped increment **after** WS06's playable gate for extra careers/skills/enemies/boss chains/encounters/regions, deeper progression, save/load, overworld, shop, full inventory, audio, localization, networking/multiplayer/live-service work, hot reload, editor tooling, schema compilers/migrations, separate reward tables and career progression collections. Each needs explicit contracts, dependencies and regression acceptance.

Final character/portrait/background/map/animation/promotional art and a game-wide art bible are outside Sprint 1; art owner scopes a later production pack after current gates. Unapproved echo/field/break mechanics and competing PR #6 content are **excluded**, not promised later implementation.

This preserves every concrete first-playable deliverable while keeping historical proposals and open design decisions from silently expanding the task.
