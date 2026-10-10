import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseCli, renderPlan } from "../drive-import.mjs";
import { accessTokenAuth } from "../lib/auth.mjs";
import { loadRules } from "../lib/classify.mjs";
import { loadConfig } from "../lib/config.mjs";
import { DriveClient } from "../lib/drive-client.mjs";
import { executePlan } from "../lib/execute.mjs";
import { manifestToCsv, readManifest, writeManifest } from "../lib/manifest.mjs";
import { buildPlan } from "../lib/plan.mjs";
import { traverseFolder } from "../lib/traverse.mjs";

const FOLDER = "application/vnd.google-apps.folder";
const DOC = "application/vnd.google-apps.document";
const SHEET = "application/vnd.google-apps.spreadsheet";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const TOKEN = "test-token";
const EXPECTED_AUTH = ["Bearer", TOKEN].join(" ");
const ROOT = "rootFolder00001";
const MODIFIED = "2026-10-01T10:00:00.000Z";

const PNG = Buffer.from("89504e470d0a1a0a-duelist", "utf8");
const OGG = Buffer.from("OggS boss theme", "utf8");

function md5(buffer) {
  return createHash("md5").update(buffer).digest("hex");
}

/** Drive fixture: id -> file record (content for binaries, exports for Google files). */
const files = new Map();
function add(id, name, mimeType, parent, extra = {}) {
  files.set(id, { id, name, mimeType, parents: [parent], modifiedTime: MODIFIED, ...extra });
}

files.set(ROOT, {
  id: ROOT,
  name: "GameZero Drive",
  mimeType: FOLDER,
  parents: ["drive-root"],
  modifiedTime: MODIFIED,
});
add("folderDesign01", "Design", FOLDER, ROOT);
add("docKampf00001", "Kampfsystem", DOC, "folderDesign01", {
  exports: { "text/markdown": "# Kampfsystem\n\nRunden.\n", [DOCX]: "DOCX-BYTES" },
});
add("docNotes00001", "Notizen zum Design", DOC, "folderDesign01", {
  exports: { "text/markdown": 400, "text/plain": "Plain notes", [DOCX]: "DOCX-NOTES" },
});
add("folderArt0001", "Art", FOLDER, ROOT);
add("folderChars01", "Characters", FOLDER, "folderArt0001");
add("folderDuel001", "Duelist", FOLDER, "folderChars01");
add("pngDuelist001", "Duelist Idle.PNG", "image/png", "folderDuel001", { content: PNG });
add("folderUi00001", "UI", FOLDER, "folderArt0001");
add("pngIcon000001", "skill_riposte.png", "image/png", "folderUi00001", {
  content: Buffer.from("icon"),
});
add("shortcutArt01", "Art Link", "application/vnd.google-apps.shortcut", "folderArt0001", {
  shortcutDetails: { targetId: "folderArt0001", targetMimeType: FOLDER },
});
add("folderAudio01", "Audio", FOLDER, ROOT);
add("folderMusic01", "Musik", FOLDER, "folderAudio01");
add("oggBoss000001", "Boss Theme.ogg", "audio/ogg", "folderMusic01", { content: OGG, flaky: 1 });
add("folderData001", "Daten", FOLDER, ROOT);
add("sheetBal00001", "Balancing", SHEET, "folderData001", {
  exports: { [XLSX]: "XLSX-BAL" },
  tabs: {
    Waffen: [
      ["id", "damage"],
      ["iron_sword", "5"],
    ],
    "Gegner, Bosse": [["id"], ["hedge_cultist"]],
  },
});
add("sheetDialog01", "Dialoge Kapitel 1", SHEET, "folderData001", {
  exports: { "text/csv": "speaker,line\nDuelist,Hallo\n", [XLSX]: "XLSX-DLG" },
  sheetsForbidden: true,
});
add("formSurvey001", "Umfrage", "application/vnd.google-apps.form", "folderData001");
add("folderMisc001", "Misc", FOLDER, ROOT);
add("pngDupA00001", "dup.png", "image/png", "folderMisc001", { content: Buffer.from("A") });
add("pngDupB00001", "dup.png", "image/png", "folderMisc001", { content: Buffer.from("B") });
add("hugeZip00001", "huge.zip", "application/zip", "folderMisc001", {
  content: Buffer.from("x"),
  size: 10 ** 12,
});
add("dsStore00001", ".DS_Store", "application/octet-stream", "folderMisc001", {
  content: Buffer.from("junk"),
});

const requests = [];
let server;
let baseUrl;
let repoRoot;

function metadata(file) {
  const meta = {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    parents: file.parents,
    modifiedTime: file.modifiedTime,
  };
  if (file.content) {
    meta.size = String(file.size ?? file.content.length);
    meta.md5Checksum = md5(file.content);
  }
  if (file.shortcutDetails) meta.shortcutDetails = file.shortcutDetails;
  meta.capabilities = { canDownload: true };
  return meta;
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function handle(request, response) {
  const url = new URL(request.url, baseUrl);
  requests.push(`${url.pathname}${url.search}`);
  if (request.headers.authorization !== EXPECTED_AUTH)
    return json(response, 401, { error: { message: "bad auth" } });

  let match;
  if (url.pathname === "/drive/v3/files") {
    const parent = /^'([^']+)' in parents and trashed = false$/.exec(url.searchParams.get("q"))[1];
    const children = [...files.values()].filter((file) => file.parents.includes(parent));
    // Two per page to exercise pagination.
    const offset = Number(url.searchParams.get("pageToken") ?? 0);
    const page = children.slice(offset, offset + 2).map(metadata);
    return json(response, 200, {
      files: page,
      ...(offset + 2 < children.length ? { nextPageToken: String(offset + 2) } : {}),
    });
  }
  if ((match = /^\/drive\/v3\/files\/([^/]+)\/export$/.exec(url.pathname))) {
    const file = files.get(match[1]);
    const exported = file?.exports?.[url.searchParams.get("mimeType")];
    if (exported === undefined || typeof exported === "number") {
      return json(response, typeof exported === "number" ? exported : 400, {
        error: { message: "Export format not supported", errors: [{ reason: "badRequest" }] },
      });
    }
    response.writeHead(200);
    return response.end(exported);
  }
  if ((match = /^\/drive\/v3\/files\/([^/]+)$/.exec(url.pathname))) {
    const file = files.get(match[1]);
    if (!file)
      return json(response, 404, {
        error: { message: "not found", errors: [{ reason: "notFound" }] },
      });
    if (url.searchParams.get("alt") !== "media") return json(response, 200, metadata(file));
    if (file.flaky > 0) {
      file.flaky -= 1;
      return json(response, 503, {
        error: { message: "try later", errors: [{ reason: "backendError" }] },
      });
    }
    response.writeHead(200);
    return response.end(file.content);
  }
  if ((match = /^\/v4\/spreadsheets\/([^/]+)$/.exec(url.pathname))) {
    const file = files.get(match[1]);
    if (file.sheetsForbidden)
      return json(response, 403, {
        error: { message: "Sheets API disabled", status: "PERMISSION_DENIED" },
      });
    const sheets = Object.keys(file.tabs).map((title, index) => ({
      properties: { sheetId: index * 7, title, index },
    }));
    return json(response, 200, { sheets });
  }
  if ((match = /^\/v4\/spreadsheets\/([^/]+)\/values\/(.+)$/.exec(url.pathname))) {
    const file = files.get(match[1]);
    const title = decodeURIComponent(match[2]).replace(/^'|'$/g, "").replace(/''/g, "'");
    return json(response, 200, { values: file.tabs[title] });
  }
  return json(response, 404, { error: { message: `unexpected ${url.pathname}` } });
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) =>
      relative(dir, join(dirent.parentPath ?? dirent.path, dirent.name))
        .split("\\")
        .join("/"),
    )
    .sort();
}

function setup(output = {}) {
  const config = loadConfig({
    overrides: { limits: { concurrency: 3, maxFileSizeMB: 50 }, output },
  });
  const rules = loadRules(fileURLToPath(new URL("../mapping-rules.json", import.meta.url)));
  const client = new DriveClient({
    auth: accessTokenAuth(TOKEN),
    driveBaseUrl: baseUrl,
    sheetsBaseUrl: baseUrl,
    sleep: async () => {},
  });
  return { config, rules, client };
}

const read = (path) => readFileSync(join(repoRoot, path), "utf8");

before(async () => {
  server = createServer(handle);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  repoRoot = mkdtempSync(join(tmpdir(), "gamezero-drive-import-"));
  mkdirSync(join(repoRoot, "docs/design"), { recursive: true });
  writeFileSync(join(repoRoot, "docs/design/kampfsystem.md"), "hand-written, must survive\n");
  // Paths only decided at execution time (here: an export fallback) are protected too.
  writeFileSync(join(repoRoot, "docs/design/notizen_zum_design.txt"), "local notes\n");
});

after(() => {
  server.close();
  rmSync(repoRoot, { recursive: true, force: true });
});

test("dry run plans every entry without writing files", async () => {
  const { config, rules, client } = setup();
  const tree = await traverseFolder(client, ROOT);
  const plan = buildPlan(tree, { config, rules, repoRoot, mode: "dry-run" });

  assert.deepEqual(listFiles(repoRoot), [
    "docs/design/kampfsystem.md",
    "docs/design/notizen_zum_design.txt",
  ]);
  const byPath = new Map(plan.entries.map((entry) => [entry.drivePath, entry]));

  const duelist = byPath.get("Art/Characters/Duelist/Duelist Idle.PNG");
  assert.equal(duelist.category, "characters");
  assert.equal(duelist.parentId, "folderDuel001");
  assert.equal(duelist.size, PNG.length);
  assert.equal(duelist.modifiedTime, MODIFIED);
  assert.equal(
    duelist.outputs[0].sortedPath,
    "godot/assets/art/characters/duelist/duelist_idle.png",
  );
  assert.equal(
    duelist.outputs[0].rawPath,
    `imports/drive/raw/${ROOT}/Art/Characters/Duelist/Duelist Idle.PNG`,
  );

  const kampf = byPath.get("Design/Kampfsystem");
  assert.equal(kampf.action, "export");
  assert.equal(kampf.outputs[0].conflict, "existing repository file");
  assert.equal(kampf.outputs[0].sortedPath, "docs/design/kampfsystem__drive_dockampf.md");
  assert.equal(kampf.outputs[1].sortedPath, null, "only the primary format is sorted");
  assert.equal(kampf.outputs[1].rawPath, `imports/drive/raw/${ROOT}/Design/Kampfsystem.docx`);

  assert.match(byPath.get("Art/Art Link").skipReason, /already traversed/);
  assert.match(byPath.get("Daten/Umfrage").skipReason, /cannot be exported/);
  assert.match(byPath.get("Misc/huge.zip").skipReason, /exceeds/);
  assert.match(byPath.get("Misc/.DS_Store").skipReason, /excluded/);

  const dups = plan.entries
    .filter((entry) => entry.name === "dup.png")
    .map((entry) => entry.outputs[0].sortedPath);
  assert.deepEqual(dups, [
    "imports/drive/unsorted/misc/dup.png",
    "imports/drive/unsorted/misc/dup__pngdupb0.png",
  ]);
  assert.equal(plan.summary.folders, 10, "9 folders plus the cyclic folder shortcut");
  assert.equal(plan.summary.byCategory.gameplay_data, 1);
  assert.equal(plan.summary.byCategory.dialogue_data, 1);

  const text = renderPlan(plan);
  if (process.env.SHOW_PLAN) console.log(text);
  assert.match(text, /== characters \(1\)/);
  assert.match(text, /-> godot\/assets\/art\/characters\/duelist\/duelist_idle\.png/);
  assert.match(text, /== skipped \(4\)/);
});

test("CLI flags map onto config overrides", () => {
  const parsed = parseCli([
    "import",
    "--folder",
    "abcdefghijkl",
    "--no-raw",
    "--conflict",
    "skip",
    "--concurrency",
    "2",
  ]);
  assert.equal(parsed.command, "import");
  assert.deepEqual(parsed.overrides.source, { folder: "abcdefghijkl" });
  assert.equal(parsed.overrides.output.writeRaw, false);
  assert.equal(parsed.overrides.output.conflictPolicy, "skip");
  assert.equal(parsed.overrides.limits.concurrency, 2);
  assert.throws(() => parseCli(["plan", "--concurrency", "two"]), /whole number/);
  assert.throws(() => parseCli(["plan", "--bogus"]), /Unknown option/);
  assert.throws(
    () => loadConfig({ overrides: { output: { conflictPolicy: "merge" } } }),
    /conflictPolicy/,
  );
  assert.throws(
    () => loadConfig({ overrides: { output: { rawDir: "../elsewhere" } } }),
    /inside the repository/,
  );
});

test("import downloads, exports, sorts and writes a manifest; re-import is incremental", async () => {
  const { config, rules, client } = setup();
  const tree = await traverseFolder(client, ROOT);
  const plan = buildPlan(tree, { config, rules, repoRoot, mode: "import" });
  const { failures } = await executePlan(plan, { client, config, repoRoot });
  assert.equal(failures, 0);
  assert.ok(client.stats.retries >= 1, "the flaky download was retried");

  assert.equal(read("docs/design/kampfsystem.md"), "hand-written, must survive\n");
  assert.equal(read("docs/design/kampfsystem__drive_dockampf.md"), "# Kampfsystem\n\nRunden.\n");
  assert.equal(read(`imports/drive/raw/${ROOT}/Design/Kampfsystem.docx`), "DOCX-BYTES");
  assert.equal(
    read("docs/design/notizen_zum_design__drive_docnotes.txt"),
    "Plain notes",
    "markdown export fell back to text",
  );
  assert.equal(read("godot/assets/art/characters/duelist/duelist_idle.png"), PNG.toString());
  assert.equal(
    read(`imports/drive/raw/${ROOT}/Art/Characters/Duelist/Duelist Idle.PNG`),
    PNG.toString(),
  );
  assert.equal(read("godot/assets/art/ui/skill_riposte.png"), "icon");
  assert.equal(read("godot/assets/audio/music/boss_theme.ogg"), OGG.toString());
  assert.equal(read("docs/design/notizen_zum_design.txt"), "local notes\n");
  assert.equal(read("data-sources/gameplay/balancing/waffen.csv"), "id,damage\niron_sword,5\n");
  assert.equal(read("data-sources/gameplay/balancing/gegner_bosse.csv"), "id\nhedge_cultist\n");
  assert.equal(
    read(`imports/drive/raw/${ROOT}/Daten/Balancing.tabs/Gegner, Bosse.csv`),
    "id\nhedge_cultist\n",
  );
  assert.equal(
    read("data-sources/dialogue/dialoge_kapitel_1/sheet1.csv"),
    "speaker,line\nDuelist,Hallo\n",
  );
  assert.equal(read("imports/drive/unsorted/misc/dup__pngdupb0.png"), "B");
  assert.ok(!existsSync(join(repoRoot, "imports/drive/unsorted/misc/huge.zip")));
  assert.ok(
    !listFiles(repoRoot).some((file) => file.includes(".part-")),
    "no temp files left behind",
  );

  const manifestFile = join(repoRoot, "imports/drive/manifest.json");
  writeManifest(plan, manifestFile, { csv: true });
  const manifest = readManifest(manifestFile);
  assert.equal(manifest.mode, "import");
  assert.equal(manifest.summary.failed, 0);
  const duelist = manifest.entries.find((entry) => entry.id === "pngDuelist001");
  assert.equal(duelist.outputs[0].result, "written");
  assert.equal(duelist.outputs[0].md5, md5(PNG));
  assert.equal(duelist.outputs[0].sha256, createHash("sha256").update(PNG).digest("hex"));
  const dialog = manifest.entries.find((entry) => entry.id === "sheetDialog01");
  assert.match(dialog.outputs[0].warning, /first tab/);
  assert.ok(!JSON.stringify(manifest).includes(TOKEN), "manifest never contains credentials");
  const csv = readFileSync(join(repoRoot, "imports/drive/manifest.csv"), "utf8");
  assert.equal(csv, manifestToCsv(manifest));
  assert.match(csv, /^id,drivePath,name,mimeType/);

  // Second run: nothing changed in Drive, so nothing is downloaded again.
  requests.length = 0;
  const second = setup();
  const tree2 = await traverseFolder(second.client, ROOT);
  const plan2 = buildPlan(tree2, {
    config: second.config,
    rules: second.rules,
    repoRoot,
    previousManifest: manifest,
    mode: "import",
  });
  const work = plan2.entries.filter((entry) => entry.action !== "skip" && !entry.isFolder);
  const notUnchanged = work
    .filter((entry) => entry.status !== "unchanged")
    .map((entry) => entry.drivePath);
  // The notes doc used a fallback format, so its planned primary path differs and it is refreshed.
  assert.deepEqual(notUnchanged, ["Design/Notizen zum Design"]);
  assert.equal(
    plan2.entries.find((entry) => entry.id === "docKampf00001").outputs[0].sortedPath,
    "docs/design/kampfsystem__drive_dockampf.md",
    "a previously renamed destination stays stable",
  );
  await executePlan(plan2, {
    client: second.client,
    config: second.config,
    repoRoot,
    previousManifest: manifest,
  });
  assert.ok(
    !requests.some((path) => path.includes("alt=media")),
    "unchanged binaries are not downloaded again",
  );
  assert.equal(plan2.summary.unchanged, work.length - 1);
  const notes = plan2.entries.find((entry) => entry.id === "docNotes00001").outputs[0];
  assert.equal(
    notes.sortedPath,
    "docs/design/notizen_zum_design__drive_docnotes.txt",
    "a renamed fallback destination stays stable across imports",
  );
  assert.equal(read("docs/design/notizen_zum_design.txt"), "local notes\n");
});

test("conflict policy skip with --no-raw records skipped outputs instead of written", async () => {
  const otherRoot = mkdtempSync(join(tmpdir(), "gamezero-drive-skip-"));
  try {
    mkdirSync(join(otherRoot, "docs/design"), { recursive: true });
    writeFileSync(join(otherRoot, "docs/design/notizen_zum_design.txt"), "local notes\n");
    const { config, rules, client } = setup({ writeRaw: false, conflictPolicy: "skip" });
    const tree = await traverseFolder(client, ROOT);
    const plan = buildPlan(tree, { config, rules, repoRoot: otherRoot, mode: "import" });
    const notes = plan.entries.find((entry) => entry.id === "docNotes00001");
    notes.outputs = notes.outputs.slice(0, 1);
    const single = { ...plan, entries: [notes] };
    const { failures } = await executePlan(single, { client, config, repoRoot: otherRoot });
    assert.equal(failures, 0);
    assert.equal(notes.outputs[0].result, "skipped");
    assert.equal(notes.outputs[0].conflictResolution, "skipped");
    assert.equal(notes.outputs[0].sortedPath, null);
    assert.equal(
      readFileSync(join(otherRoot, "docs/design/notizen_zum_design.txt"), "utf8"),
      "local notes\n",
    );
  } finally {
    rmSync(otherRoot, { recursive: true, force: true });
  }
});
