# Documentation Hardening Plan

All docs below are **final** (no draft status). They were finished in three scoped workstreams and share one vocabulary: careers, skills, statuses, bosses, regions, encounters.

| Workstream | Owns | Status |
|---|---|---|
| 1 – Combat UI | `ui-style-guide.md`, `hud-spec.md` | Final |
| 2 – Visual direction | `visual-reference-brief.md` | Final |
| 3 – Data | `data-schema.md`, `data-authoring-rules.md` | Final |

Boundaries: workstream 1 defines how numbers and states are *shown*; workstream 2 defines how things *look* in generated art; workstream 3 defines how content is *stored*. A workstream does not redefine another's rules; it links to them.

Checklist
- [x] UI style guide and HUD spec aligned (modules, states, tooltips, numbers-open, mobile)
- [x] Visual brief split into principles, prompt rules, output requirements
- [x] Data schema and authoring rules aligned (JSON-first, one file per entity, snake_case ids)
