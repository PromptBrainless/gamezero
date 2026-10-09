# Data Authoring Rules

1. **JSON only**, one entity per file, located at `data/<type>/<id>.json`; schema in `data-schema.md`.
2. **Naming:** ids are lowercase snake_case, ASCII, singular (`plague_mother`, `broken_armor`). Never rename an id after release; add a new one.
3. **Display text:** `name` Title Case, `description` one or two factual sentences stating the mechanic with its numbers.
4. **Numbers explicit:** every effect states value and duration in fields; no mechanics only in prose (supports numbers-open UI).
5. **References by id** only; referenced files must exist in the same change.
6. **No placeholders:** no `TODO`, `tbd`, empty arrays used as stubs, or dummy values.
7. **Quality bar:** each skill has a distinct role (no strict duplicates of another skill for the same career); each career has ≥3 skills with at least one setup, one payoff and one utility; each status has a counter (cleanse, skill or resource); each boss phase changes behavior, not only numbers.
8. **Balance bounds:** damage base ≤ 3× the career's `power`; chances multiples of 5; durations 1–5 turns.
9. **Regions as containers:** a region lists enemies, bosses and loot theme; no quest, faction or worldmap data yet.
10. **Godot-facing:** files load as plain `Dictionary` via `JSON.parse_string`; use only strings, integers, booleans, arrays, objects; no nulls (omit optional keys).
11. **Review checklist:** valid JSON, filename equals id, all references resolve, rules 6–8 satisfied.
