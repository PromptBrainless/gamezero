# Google Drive imports

Output area of the Drive importer ([`tools/import/README.md`](../../tools/import/README.md)).

| Path | Committed? | Content |
|---|---|---|
| `manifest.json`, `manifest.csv` | yes | Every Drive file/folder (ID, path, MIME type, parent, modified time, size, checksum) and the repo paths it was written to |
| `unsorted/` | review first | Files no mapping rule matched, with their full Drive path; re-map them in `tools/import/mapping-rules.json` |
| `raw/<folderId>/` | no (git-ignored) | Untouched mirror of the Drive tree, including every export format |
| `.staging/` | no (git-ignored) | Temporary download area of a running import |
| `plan*.json` | no (git-ignored) | Saved dry-run plans (`npm run drive:plan -- --plan-out imports/drive/plan.json`) |

Sorted files land in their category destinations (`docs/…`, `godot/assets/…`, `art-source/…`, `data-sources/…`).
