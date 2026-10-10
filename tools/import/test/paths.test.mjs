import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDriveId, parseDriveLink } from "../lib/drive-id.mjs";
import {
  assertRepoRelativeDir,
  normalizeForMatching,
  resolveInside,
  safeSegment,
  slugify,
  slugFileName,
  withSuffix,
} from "../lib/paths.mjs";
import { globToRegExp } from "../lib/classify.mjs";
import { toCsv } from "../lib/drive-client.mjs";

const ID = "1J7Ww5YBFyOVMgirT0AXXY_o2YVgH4jRv";

test("parses Drive folder IDs from every common URL form", () => {
  for (const input of [
    ID,
    ` ${ID} `,
    `https://drive.google.com/drive/folders/${ID}`,
    `https://drive.google.com/drive/folders/${ID}?usp=sharing`,
    `https://drive.google.com/drive/u/1/folders/${ID}`,
    `https://drive.google.com/open?id=${ID}`,
    `https://drive.google.com/folderview?id=${ID}&usp=sharing`,
    `https://drive.google.com/file/d/${ID}/view`,
    `https://docs.google.com/document/d/${ID}/edit`,
  ]) {
    assert.equal(parseDriveId(input), ID, input);
  }
  assert.deepEqual(
    parseDriveLink(`https://drive.google.com/drive/folders/${ID}?resourcekey=0-abc`),
    {
      id: ID,
      resourceKey: "0-abc",
    },
  );
});

test("rejects non-Drive input", () => {
  assert.throws(() => parseDriveId(""), /required/);
  assert.throws(
    () => parseDriveId("https://example.com/drive/folders/" + ID),
    /Not a Google Drive URL/,
  );
  assert.throws(() => parseDriveId("https://drive.google.com/drive/my-drive"), /Could not find/);
  assert.throws(() => parseDriveId("not an id"), /Not a Drive folder/);
});

test("slugify produces Godot-friendly ASCII names", () => {
  assert.equal(slugify("Held Idle (v2)"), "held_idle_v2");
  assert.equal(slugify("Größe Übersicht"), "groesse_uebersicht");
  assert.equal(slugify("HeroSpriteSheet"), "hero_sprite_sheet");
  assert.equal(slugify("../.."), "unnamed");
  assert.equal(slugify("CON"), "_con");
  assert.equal(slugFileName("Boss Theme", "OGG"), "boss_theme.ogg");
  assert.equal(normalizeForMatching("Charaktere_Final-v2"), "charaktere final v2");
  assert.equal(normalizeForMatching("UIIcons"), "ui icons");
  assert.equal(slugify("HUDFrame"), "hud_frame");
  assert.equal(normalizeForMatching("ItemIcons"), "item icons");
});

test("safeSegment keeps readable names but never path separators", () => {
  assert.equal(safeSegment("Lore: Kapitel 1/2"), "Lore_ Kapitel 1_2");
  assert.equal(safeSegment(".."), "unnamed");
  assert.equal(safeSegment("name. "), "name");
  assert.equal(withSuffix("hero.png", "abc"), "hero__abc.png");
  assert.equal(withSuffix("folder", "abc"), "folder__abc");
});

test("destination paths cannot escape the repository", () => {
  assert.throws(() => resolveInside("/repo", "../etc/passwd"), /relative path inside/);
  assert.throws(() => resolveInside("/repo", "/etc/passwd"), /relative path inside/);
  assert.equal(resolveInside("/repo", "docs/lore/a.md"), "/repo/docs/lore/a.md");
  assert.throws(() => assertRepoRelativeDir("../outside", "x"), /inside the repository/);
  assert.throws(() => assertRepoRelativeDir(".git/hooks", "x"), /\.git/);
  assert.equal(assertRepoRelativeDir("docs\\lore/", "x"), "docs/lore");
});

test("globs match Drive paths", () => {
  assert.ok(globToRegExp("**/.DS_Store").test(".DS_Store"));
  assert.ok(globToRegExp("**/.DS_Store").test("Art/Sub/.DS_Store"));
  assert.ok(globToRegExp("Archive/**").test("Archive/old/file.png"));
  assert.ok(!globToRegExp("Archive/*").test("Archive/old/file.png"));
  assert.ok(globToRegExp("**/~$*").test("Docs/~$Plan.docx"));
});

test("CSV encoding quotes and pads", () => {
  assert.equal(
    toCsv([["id", "name"], ["1", 'Sword "Edge", sharp'], ["2"]]),
    'id,name\n1,"Sword ""Edge"", sharp"\n2,\n',
  );
  assert.equal(toCsv([]), "");
});
