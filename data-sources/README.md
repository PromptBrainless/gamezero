# Data sources

Raw tabular source data imported from Google Drive (dialogue tables, balancing sheets, item/enemy/skill lists) as CSV/XLSX/JSON, written by the Drive importer ([`tools/import/README.md`](../tools/import/README.md)).

These files are **inputs**, not runtime content: convert the relevant rows into the schema-validated records under [`data/`](../data) following [`docs/data-schema.md`](../docs/data-schema.md) and [`docs/data-authoring-rules.md`](../docs/data-authoring-rules.md). They live outside `godot/` on purpose so Godot does not import the CSVs as translation tables.

- `dialogue/` — dialogue tables and scripts
- `gameplay/` — balancing, stats, loot and other gameplay tables
