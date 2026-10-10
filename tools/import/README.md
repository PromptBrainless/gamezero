# Google Drive importer (`tools/import`)

Imports the GameZero design/asset Drive folder into this repository: it walks a
Google Drive folder recursively, records metadata for every file and folder,
classifies each file into the Godot RPG layout of this repo, downloads binary
files, exports Google Docs/Sheets/Slides/Drawings to usable formats, keeps an
untouched raw mirror and writes a manifest that maps every Drive entry to its
repository paths.

It is plain Node.js (≥ 20, the repo uses 22) with **no extra dependencies**: the
Drive API v3, the Sheets API v4 and Google OAuth are called directly over HTTPS.

```text
tools/import/
├── drive-import.mjs           CLI entry point
├── drive-import.config.json   Committed config (no secrets): folder, auth paths, outputs, exports
├── mapping-rules.json         Categories → repo destinations and ordered classification rules
├── lib/                       auth, Drive client, traversal, classification, plan, execution, manifest
├── test/                      Unit tests + end-to-end tests against a mock Drive server
└── .secrets/                  (git-ignored) OAuth client / service-account JSON go here
```

## Quick start

```bash
npm ci                                   # once, if node_modules is missing
# 1. put a Desktop OAuth client JSON at tools/import/.secrets/oauth-client.json (see below)
npm run drive:auth                       # one-time browser consent, read-only scope
npm run drive:status                     # which credentials are used + can the folder be read?
npm run drive:plan                       # DRY RUN: full import plan, writes nothing
npm run drive:import                     # download/export, raw mirror, sorted copies, manifest
git status && git add -p                 # review and commit what you want to keep
```

The default folder is the GameZero Drive folder
`https://drive.google.com/drive/folders/1J7Ww5YBFyOVMgirT0AXXY_o2YVgH4jRv`
(`source.folder` in `drive-import.config.json`).

## 1. Authentication / setup

The importer only ever requests the **read-only** scope
`https://www.googleapis.com/auth/drive.readonly` (which also covers reading
spreadsheet tabs through the Sheets API). Credentials are resolved in this order
when `auth.method` is `auto` (the default); force one with `--auth <method>`:

| Order | Method            | Where the credential comes from                                                              | Use it for                                    |
| ----- | ----------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1     | `access-token`    | env `GOOGLE_DRIVE_ACCESS_TOKEN` (e.g. `gcloud auth print-access-token`)                      | quick one-off runs                            |
| 2     | `service-account` | env `GOOGLE_APPLICATION_CREDENTIALS` or `tools/import/.secrets/service-account.json`         | CI / automation                               |
| 3     | `oauth`           | refresh token in `~/.config/gamezero/drive-oauth-token.json` created by `npm run drive:auth` | developers (recommended)                      |
| 4     | `api-key`         | env `GOOGLE_DRIVE_API_KEY`                                                                   | folders shared as "Anyone with the link" only |

### Google Cloud project (once per team)

1. Open <https://console.cloud.google.com/>, create or pick a project.
2. **APIs & Services → Library**: enable **Google Drive API** and **Google Sheets
   API** (Sheets is used to export every tab of a spreadsheet as its own CSV; if
   it is disabled the importer falls back to the first tab only and records a
   warning).
3. **APIs & Services → OAuth consent screen**: user type _External_ (or
   _Internal_ for Workspace), add the `.../auth/drive.readonly` scope and add the
   developers as test users.

### Option A — OAuth for developers (recommended)

1. **APIs & Services → Credentials → Create credentials → OAuth client ID →
   Application type: Desktop app**. Download the JSON.
2. Save it as `tools/import/.secrets/oauth-client.json` (the folder is
   git-ignored), or point `GOOGLE_OAUTH_CLIENT_FILE` at it.
3. Run `npm run drive:auth`. A browser opens on Google's consent page; after you
   allow access the tool receives the code on a temporary `127.0.0.1` port
   (PKCE + state checked) and stores the refresh token in
   `~/.config/gamezero/drive-oauth-token.json` (mode `0600`, outside the repo;
   override with `GAMEZERO_DRIVE_TOKEN_FILE`).
   - Headless machine / SSH / container: `npm run drive:auth -- --manual`. Open
     the printed URL anywhere, approve, then copy the full address of the page
     your browser lands on (`http://127.0.0.1:8085/?code=...`, which will show
     "cannot connect" — that is expected) and paste it into the terminal.
4. `npm run drive:status` confirms the credential and that the folder is
   readable. To revoke, delete the token file and remove the app at
   <https://myaccount.google.com/permissions>.

### Option B — service account (CI)

1. **Credentials → Create credentials → Service account**, then **Keys → Add key
   → JSON**.
2. Save it as `tools/import/.secrets/service-account.json` or set
   `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`.
3. **Share the Drive folder with the service account's `client_email`** (Viewer
   is enough). A service account cannot see files that are not shared with it.

In GitHub Actions store the key JSON as a secret, write it to a temp file at
runtime and export `GOOGLE_APPLICATION_CREDENTIALS`; never commit it.

### Option C — API key (public folders only)

Create an API key restricted to the Drive and Sheets APIs and export
`GOOGLE_DRIVE_API_KEY`. Only works when the folder is shared as "Anyone with the
link". Links that need a `resourcekey` work if you pass the full URL.

## 2. Passing the Drive folder

Any of these forms works, in priority order:

```bash
npm run drive:plan -- --folder "https://drive.google.com/drive/folders/1J7Ww5YBFyOVMgirT0AXXY_o2YVgH4jRv"
npm run drive:plan -- --folder 1J7Ww5YBFyOVMgirT0AXXY_o2YVgH4jRv
GAMEZERO_DRIVE_FOLDER="https://drive.google.com/drive/u/1/folders/<id>?usp=sharing" npm run drive:plan
# or edit "source.folder" in tools/import/drive-import.config.json
```

Accepted URLs include `drive.google.com/drive/folders/<id>`, `/drive/u/<n>/folders/<id>`,
`open?id=<id>`, `?resourcekey=...` links and Shared-drive folders. Shortcuts to
folders/files inside the tree are followed (cycles and duplicates are detected
and reported once).

## 3. Dry run (`plan`)

```bash
npm run drive:plan                                   # human-readable plan on stdout
npm run drive:plan -- --json > /tmp/plan.json        # full plan as JSON
npm run drive:plan -- --plan-out imports/drive/plan.json   # save the plan (git-ignored) for review
```

The dry run reads Drive metadata only. It **does not create, change or delete
any file** in the repo (the only exception is the explicit `--plan-out` file).
The plan lists, per entry: Drive path, kind, category, rule that matched,
action (`download`, `export`, `folder`, `skip` + reason), status relative to the
last import (`new`, `updated`, `unchanged`) and every raw/sorted destination
path, followed by totals per category and action, conflicts that were renamed,
and files that disappeared from Drive since the last import.

Tune classification until the plan looks right (see
[§6](#6-mapping-rules)), then import.

## 4. Import

```bash
npm run drive:import                                        # scan + execute
npm run drive:import -- --from-plan imports/drive/plan.json # execute exactly a reviewed plan
npm run drive:import -- --force                             # re-download even unchanged entries
npm run drive:import -- --no-raw                            # sorted copies only
npm run drive:import -- --no-sorted                         # raw mirror only
npm run drive:import -- --conflict skip                     # never touch pre-existing repo files
npm run drive:import -- --concurrency 8 --max-file-size-mb 2000 --verbose
```

What happens:

1. Each file is downloaded (`alt=media`) or exported straight to its raw-mirror
   path. Two cases go through a per-run staging folder under
   `imports/drive/.staging/` first (removed afterwards): `--no-raw` imports, and
   exports with fallback formats (e.g. Docs `.md` → `.txt`), whose final file
   name is only known once Drive has answered. Every write goes through an
   atomic `.part-*` temp file; downloads are verified against Drive's MD5
   checksum and hashed with SHA-256.
2. **Raw mirror** — the file is placed under
   `imports/drive/raw/<folderId>/<original Drive path>` (names made filesystem
   safe). This area is git-ignored: it is the untouched local source of truth.
3. **Sorted placement** — the primary output is copied to its category
   destination (below) with a slugged file name, e.g.
   `Charaktere/Held Sprite (Final).PNG` → `godot/assets/art/characters/held_sprite_final.png`.
4. The manifest (`imports/drive/manifest.json` + `.csv`) is written.
5. Exit code `1` if any entry failed (others are still imported and recorded),
   `0` otherwise.

Re-running is **incremental**: entries whose Drive `modifiedTime`, checksum and
planned paths are unchanged and whose raw file still hashes correctly are not
downloaded again. Network errors, HTTP 429/5xx and Drive rate-limit 403s are
retried with exponential backoff (honouring `Retry-After`).

### Google-native formats

Configured in `exports` of `drive-import.config.json`; the first format is the
_primary_ output that goes to the sorted destination, all formats go to the raw
mirror:

| Google type          | Exports (primary first)                               |
| -------------------- | ----------------------------------------------------- |
| Docs                 | `.md` (fallback `.txt`), `.docx`                      |
| Sheets               | one `.csv` per tab (`<name>.tabs/<tab>.csv`), `.xlsx` |
| Slides               | `.pdf`, `.pptx`                                       |
| Drawings             | `.png`, `.svg`                                        |
| Apps Script          | `.json`                                               |
| Jamboard             | `.pdf`                                                |
| Forms / Sites / Maps | not exportable through the API → skipped with reason  |

Large Docs beyond Drive's 10 MB export limit are fetched through the file's
`exportLinks` automatically.

### Category → destination

Defined in `mapping-rules.json` (sub-folders below the matched Drive folder are
kept, e.g. `Sprites/Characters/Heroes/x.png` → `.../characters/heroes/x.png`):

| Category          | Destination                     | Typical content                                   |
| ----------------- | ------------------------------- | ------------------------------------------------- |
| `design_docs`     | `docs/design/`                  | GDD, mechanics, systems, roadmaps                 |
| `lore`            | `docs/lore/`                    | story, history, factions, backstories             |
| `quests`          | `docs/quests/`                  | quest lines, missions                             |
| `worldbuilding`   | `docs/world/`                   | regions, locations, maps, cultures                |
| `reference_media` | `docs/references/`              | videos, presentations, references                 |
| `concept_art`     | `docs/art/concept/`             | concept art, sketches, mood boards                |
| `art_source`      | `art-source/`                   | PSD, Krita, Aseprite, Tiled sources               |
| `characters`      | `godot/assets/art/characters/`  | player/NPC sprites, portraits, sprite sheets      |
| `enemies`         | `godot/assets/art/enemies/`     | enemies, monsters, bosses                         |
| `ui_art`          | `godot/assets/art/ui/`          | HUD, menus, icons, buttons, cursors               |
| `tilesets`        | `godot/assets/art/tilesets/`    | tiles, terrain, autotiles                         |
| `items`           | `godot/assets/art/items/`       | weapons, armour, consumables                      |
| `backgrounds`     | `godot/assets/art/backgrounds/` | backgrounds, parallax layers                      |
| `vfx`             | `godot/assets/art/vfx/`         | effects, particles, spells                        |
| `fonts`           | `godot/assets/fonts/`           | font files                                        |
| `models`          | `godot/assets/models/`          | 3D models                                         |
| `music`           | `godot/assets/audio/music/`     | music, themes, OST                                |
| `sound_effects`   | `godot/assets/audio/sfx/`       | SFX, UI sounds                                    |
| `ambience`        | `godot/assets/audio/ambience/`  | ambient loops                                     |
| `voice`           | `godot/assets/audio/voice/`     | voice-over, barks                                 |
| `audio_source`    | `art-source/audio/`             | DAW / audio editor projects                       |
| `dialogue_data`   | `data-sources/dialogue/`        | dialogue tables/scripts awaiting conversion       |
| `gameplay_data`   | `data-sources/gameplay/`        | balancing, stats, loot, item/enemy/skill tables   |
| `unsorted`        | `imports/drive/unsorted/`       | nothing matched — full Drive path kept for review |

Why these places:

- Runtime art/audio go into `godot/assets/…` so Godot imports them directly.
- Spreadsheets/CSV/JSON tables go to `data-sources/`, **not** to `data/` or
  `godot/`: `data/` holds the schema-validated slice content (see
  [`docs/data-schema.md`](../../docs/data-schema.md)) that must be authored
  through the content pipeline, and Godot would treat raw `.csv` files as
  translation tables.
- Concept art and layered sources stay outside `godot/` so they are not
  imported into the game.

## 5. Manifest

`imports/drive/manifest.json` (committed — it is the traceable link between
Drive and the repo) and `imports/drive/manifest.csv` (same data, one row per
entry, handy in a spreadsheet; disable with `--no-csv` or `output.manifestCsv`).

```jsonc
{
  "schemaVersion": 1,
  "tool": "gamezero-drive-import",
  "mode": "import", // "dry-run" for --plan-out files
  "generatedAt": "...",
  "completedAt": "...",
  "source": { "folderId": "1J7W…", "folderUrl": "…", "rootName": "…", "rootModifiedTime": "…" },
  "settings": {
    "rawRoot": "imports/drive/raw/1J7W…",
    "conflictPolicy": "rename",
    "rulesFile": "…",
    "exclude": [],
  },
  "summary": {
    "folders": 0,
    "files": 0,
    "toDownload": 0,
    "toExport": 0,
    "skipped": 0,
    "unchanged": 0,
    "byCategory": {},
    "byAction": {},
    "failed": 0,
    "apiRequests": 0,
    "apiRetries": 0,
  },
  "entries": [
    {
      "id": "Drive file ID",
      "name": "…",
      "mimeType": "…",
      "kind": "image|audio|document|spreadsheet|…",
      "isFolder": false,
      "parentId": "…",
      "parents": ["…"],
      "drivePath": "Folder/Sub/file.png",
      "depth": 2,
      "modifiedTime": "…",
      "createdTime": "…",
      "size": 1234,
      "md5Checksum": "…",
      "webViewLink": "…",
      "category": "characters",
      "rule": "character-art",
      "action": "download",
      "status": "new|updated|unchanged",
      "skipReason": null,
      "outputs": [
        {
          "format": "original",
          "mimeType": "image/png",
          "extension": "png",
          "primary": true,
          "rawPath": "imports/drive/raw/…",
          "sortedPath": "godot/assets/art/characters/….png",
          "sha256": "…",
          "bytes": 1234,
          "md5": "…",
          "result": "written|unchanged|skipped|failed",
        },
      ],
      // spreadsheets with perSheet: { "rawDir": "….tabs", "sortedDir": "…", "tabs": [{ "title", "sheetId", "rawPath", "sortedPath", "sha256", "bytes" }] }
      // export fallbacks are recorded as "usedFallback"; sorted-path conflicts as "conflict" + "conflictResolution", raw-mirror ones as "rawConflict" + "rawConflictResolution"
    },
  ],
  "removedSinceLastImport": [],
}
```

The manifest contains no tokens, no owner names or e-mail addresses.

## 6. Mapping rules

`mapping-rules.json` has:

- `categories` — `{ "<name>": { "destination": "repo/relative/dir", "subfolders": "after-match|full|none", "description": "…" } }`
- `rules` — ordered, **first match wins**. Every given condition must match:
  - `kinds`: media kinds (`image`, `art_source`, `audio`, `audio_project`, `video`,
    `document`, `presentation`, `spreadsheet`, `data`, `font`, `model`, `code`, `archive`)
  - `extensions`, `mimeTypes`
  - `folderPattern` — regex tested against **each folder name** of the Drive
    path separately (the outermost matching folder decides where kept
    sub-folders start); `namePattern` — regex tested against the file name
    without extension; `anyPattern` — matches if it hits any folder name _or_
    the file name. Patterns never see `/`, so do not write patterns that span
    folders. Before matching, names are lower-cased, German umlauts
    transliterated (`ä`→`ae`, `ß`→`ss`) and `_ - .` / camelCase boundaries turned
    into spaces: `Quests/Hauptquest_01.docx` is seen as folder `quests` and name
    `hauptquest 01`, so `"folderPattern": "\\bquests?\\b"` and
    `"namePattern": "quest"` both match.
  - `subfolders` overrides the category default.
- `overrides` — pin individual entries, by Drive `id` or `path` glob:

  ```json
  "overrides": [
    { "path": "Archiv/**", "skip": true },
    { "id": "1AbC…", "category": "lore" },
    { "path": "**/weltkarte*.png", "destination": "docs/world/maps" }
  ]
  ```

- `fallbackCategory` — where unmatched files go (`unsorted`).

Use your own file with `--rules path/to/rules.json` or `rulesFile` in the
config. Invalid rule files (unknown category/fields, bad regex, unsafe
destinations) are rejected before anything runs.

## 7. Configuration reference

`drive-import.config.json` (override with `--config`). Values are layered:
**CLI flags > environment variables > config file > built-in defaults**.

| Key                                                            | Meaning                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `source.folder`                                                | Folder URL or ID                                                         |
| `source.followShortcuts`                                       | Follow Drive shortcuts                                                   |
| `auth.method`                                                  | `auto`, `oauth`, `service-account`, `access-token`, `api-key`            |
| `auth.oauthClientFile` / `tokenFile` / `serviceAccountKeyFile` | Credential locations (outside git)                                       |
| `rulesFile`                                                    | Mapping rules                                                            |
| `output.rawDir` / `stagingDir` / `manifestFile`                | Output locations (repo-relative)                                         |
| `output.manifestCsv` / `writeRaw` / `writeSorted`              | Toggles                                                                  |
| `output.conflictPolicy`                                        | What to do if a sorted target exists but was not created by the importer |
| `limits.maxFileSizeMB` / `concurrency` / `maxRetries`          | Safety and throughput limits                                             |
| `exclude`                                                      | Glob patterns on Drive paths to ignore (`**/.DS_Store`, `Archiv/**`, …)  |
| `exports`                                                      | Per Google MIME type: `[{ mimeType, extension, fallbacks?, perSheet? }]` |

Keys starting with `$` (e.g. `$comment`) are ignored.

## 8. Safety notes

- **Read-only on Drive.** Only the `drive.readonly` scope is requested; the tool
  never modifies, moves or deletes anything in Drive.
- **Never deletes repo files.** Files removed from Drive are only listed under
  `removedSinceLastImport`; clean them up yourself.
- **Run on a clean working tree** (commit or stash first) so `git diff` shows
  exactly what the import changed, and review before committing.
- **Pre-existing files are protected.** If a sorted destination already exists
  and is not owned by a previous import (per the manifest), the default
  `rename` policy writes `<name>__drive_<id8>.<ext>` next to it; `skip` leaves
  it alone; `overwrite` replaces it. Files that _were_ created by a previous
  import are updated in place when Drive changes — local edits to them are
  overwritten, so edit copies or move them out of the import destinations.
- **Paths are sanitised.** Drive names cannot escape the repository (`..`,
  absolute paths, `.git`, `node_modules` are rejected), and names are made safe
  for Windows/macOS/Linux. Case-insensitive name clashes get an `__<id8>` suffix.
- **Secrets stay out of git.** `tools/import/.secrets/` is git-ignored; the
  OAuth token lives in `~/.config/gamezero/`. Credentials are never accepted as
  CLI flags (shell history) and never written to logs, plans or manifests. If a
  key leaks, delete it in Google Cloud Console immediately.
- **Size.** Files above `limits.maxFileSizeMB` are skipped with a reason. Large
  binary assets (audio, PSD, video) bloat git history — consider
  [Git LFS](https://git-lfs.com/) for `godot/assets/**` and `art-source/**`
  before committing big batches.
- **Generated, git-ignored outputs:** `imports/drive/raw/`,
  `imports/drive/.staging/`, `imports/drive/plan*.json` and `*.part-*` temp
  files. Committed outputs: sorted files you choose to keep, and the manifest.
- **Licensing.** Only import material the team has the rights to use in the
  game.

## 9. Development

```bash
npm run test:import          # unit + end-to-end tests (mock Drive/Sheets server, no network)
npx eslint tools/import
npx prettier --check tools/import
```

`npm test` runs these tests together with the rest of the repository suite.
