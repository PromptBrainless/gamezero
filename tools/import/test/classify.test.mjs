import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { classify, compileRules, loadRules } from "../lib/classify.mjs";
import { detectKind } from "../lib/media.mjs";

const rules = loadRules(fileURLToPath(new URL("../mapping-rules.json", import.meta.url)));

function entry(drivePath, mimeType, extra = {}) {
  const parts = drivePath.split("/");
  const name = parts.pop();
  const file = { id: `id-${drivePath}`, name, mimeType, drivePath, folders: parts, ...extra };
  return { ...file, kind: detectKind(file) };
}

const DOC = "application/vnd.google-apps.document";
const SHEET = "application/vnd.google-apps.spreadsheet";

const cases = [
  ["Design/Kampfsystem", DOC, "design_docs", "docs/design"],
  ["GDD Version 3", DOC, "design_docs", "docs/design"],
  ["Lore/Fraktionen/Die Nordwacht", DOC, "lore", "docs/lore"],
  ["Story/Hauptquest Kapitel 1", DOC, "quests", "docs/quests"],
  ["Quests/Nebenquests/Der Deserteur.pdf", "application/pdf", "quests", "docs/quests"],
  ["Welt/Regionen/Nordmark", DOC, "worldbuilding", "docs/world"],
  ["Art/Concept/hero_sketch_01.png", "image/png", "concept_art", "docs/art/concept"],
  ["Moodboard/castle.jpg", "image/jpeg", "concept_art", "docs/art/concept"],
  [
    "Art/Characters/Duelist/duelist_idle.png",
    "image/png",
    "characters",
    "godot/assets/art/characters",
  ],
  ["Sprites/hero_walk_sheet.png", "image/png", "characters", "godot/assets/art/characters"],
  ["Art/Gegner/hedge_cultist.png", "image/png", "enemies", "godot/assets/art/enemies"],
  ["Art/UI/Icons/skill_riposte.png", "image/png", "ui_art", "godot/assets/art/ui"],
  ["Art/HUDFrame.png", "image/png", "ui_art", "godot/assets/art/ui"],
  ["Art/Tilesets/dungeon_floor.png", "image/png", "tilesets", "godot/assets/art/tilesets"],
  ["Art/Items/iron_sword.png", "image/png", "items", "godot/assets/art/items"],
  ["Art/Waffen/rapier.webp", "image/webp", "items", "godot/assets/art/items"],
  [
    "Art/Backgrounds/forest_parallax_1.png",
    "image/png",
    "backgrounds",
    "godot/assets/art/backgrounds",
  ],
  ["Art/Source/hero.psd", "image/vnd.adobe.photoshop", "art_source", "art-source"],
  ["Audio/Musik/Boss Theme.ogg", "audio/ogg", "music", "godot/assets/audio/music"],
  ["Audio/SFX/sword_hit_01.wav", "audio/wav", "sound_effects", "godot/assets/audio/sfx"],
  ["Audio/Voice/duelist_bark_03.ogg", "audio/ogg", "voice", "godot/assets/audio/voice"],
  ["Audio/Ambience/forest_loop.ogg", "audio/ogg", "ambience", "godot/assets/audio/ambience"],
  ["Dialoge/Kapitel 1 Dialoge", SHEET, "dialogue_data", "data-sources/dialogue"],
  ["Daten/Balancing", SHEET, "gameplay_data", "data-sources/gameplay"],
  ["Daten/items.json", "application/json", "gameplay_data", "data-sources/gameplay"],
  ["Daten/enemies.csv", "text/csv", "gameplay_data", "data-sources/gameplay"],
  ["Fonts/PixelFont.ttf", "font/ttf", "fonts", "godot/assets/fonts"],
  ["Trailer/teaser.mp4", "video/mp4", "reference_media", "docs/references"],
  ["Misc/random.png", "image/png", "unsorted", "imports/drive/unsorted"],
  ["Misc/backup.zip", "application/zip", "unsorted", "imports/drive/unsorted"],
  ["Notizen", DOC, "unsorted", "imports/drive/unsorted"],
];

for (const [drivePath, mimeType, category, destination] of cases) {
  test(`classifies ${drivePath} as ${category}`, () => {
    const result = classify(entry(drivePath, mimeType), rules);
    assert.equal(result.category, category, result.reason);
    assert.equal(result.destinationDir, destination);
  });
}

test("keeps subfolders below the folder that matched", () => {
  const result = classify(entry("Art/Characters/Duelist/Attack/frame_01.png", "image/png"), rules);
  assert.equal(result.category, "characters");
  assert.deepEqual(result.subfolders, ["Duelist", "Attack"]);
});

test("unsorted mirrors the full Drive folder path", () => {
  const result = classify(entry("Misc/Old/random.png", "image/png"), rules);
  assert.deepEqual(result.subfolders, ["Misc", "Old"]);
});

test("overrides win over rules and can skip entries", () => {
  const compiled = compileRules({
    categories: {
      lore: { destination: "docs/lore" },
      unsorted: { destination: "imports/drive/unsorted" },
    },
    rules: [{ id: "any-image", category: "unsorted", kinds: ["image"] }],
    overrides: [
      { path: "Secret/**", skip: true },
      { id: "special", category: "lore" },
      { path: "**/map.png", destination: "docs/world/maps" },
    ],
  });
  assert.equal(classify(entry("Secret/a.png", "image/png"), compiled).skip, true);
  assert.equal(classify(entry("x.png", "image/png", { id: "special" }), compiled).category, "lore");
  const map = classify(entry("World/map.png", "image/png"), compiled);
  assert.equal(map.destinationDir, "docs/world/maps");
});

test("rule files are validated", () => {
  const base = { categories: { unsorted: { destination: "imports/drive/unsorted" } } };
  assert.throws(
    () => compileRules({ ...base, rules: [{ id: "a", category: "nope", kinds: ["image"] }] }),
    /unknown category/,
  );
  assert.throws(
    () => compileRules({ ...base, rules: [{ id: "a", category: "unsorted" }] }),
    /no match condition/,
  );
  assert.throws(
    () => compileRules({ ...base, rules: [{ id: "a", category: "unsorted", anyPattern: "(" }] }),
    /regular expression/,
  );
  assert.throws(
    () => compileRules({ ...base, rules: [{ id: "a", category: "unsorted", kind: ["x"] }] }),
    /unknown field/,
  );
  assert.throws(
    () => compileRules({ categories: { unsorted: { destination: "../outside" } }, rules: [] }),
    /inside the repository/,
  );
});
