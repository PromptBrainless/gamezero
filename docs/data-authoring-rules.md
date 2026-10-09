# Data Authoring Rules

These rules implement [`data-schema.md`](data-schema.md). The schema owns valid fields and types; this file owns authoring and review practice.

1. Store one UTF-8 JSON entity per `data/<collection>/<id>.json` file. Collection names are plural and identify the entity type.
2. Use stable, lowercase ASCII `snake_case` IDs that match the filename. Do not rename a released ID.
3. Use the field names, required/optional status, and enum values defined in the schema. Do not add unknown fields or collection-marker `type` fields.
4. Omit optional values rather than writing `null`. Use only the JSON value types allowed by the schema.
5. Put all gameplay-significant numeric values in fields; descriptions explain, but do not replace, mechanics.
6. Cross-reference entities by ID only. Include every referenced entity in the same change and check that it resolves.
7. Do not submit TODOs, placeholder descriptions, empty records, or stub arrays. Empty arrays are allowed only where the schema explicitly allows them.
8. Keep authored content within the first-playable scope. Regions, localization keys, reward-table files, and career progression tracks are deferred unless the schema is deliberately revised.
9. Treat all balance values as first-pass until reviewed and exercised. Do not apply numeric bounds or win-rate targets from draft PRs unless they are adopted by a future source-of-truth change.
10. Before review, validate JSON syntax, filename/ID agreement, allowed fields, references, chance/range constraints, and consistency with this schema.
