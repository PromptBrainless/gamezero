import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import test from "node:test";
import { imageMetadata, scanAssets, archiveEntries } from "./asset-audit.mjs";

test("archive listing preserves member paths, byte sizes and resource-fork distinction", () => {
  const listing =
    "Archive: demo.zip\n-rw---- 2.0 fat 120 b- 52 defN 26-Oct-12 07:35 neu3/__MACOSX/._sound.wav\n-rw---- 2.0 fat 420 b- 300 defN 26-Oct-12 07:35 neu3/sound effect.wav\ndrwx--- 2.0 fat 0 b- 0 stor 26-Oct-12 07:35 neu3/";
  assert.deepEqual(archiveEntries(listing), [
    { path: "neu3/__MACOSX/._sound.wav", bytes: 120, format: "wav", resourceFork: true },
    { path: "neu3/sound effect.wav", bytes: 420, format: "wav", resourceFork: false },
  ]);
});

test("SVG, PNG and GIF dimensions come from file contents", () => {
  assert.deepEqual(
    imageMetadata(Buffer.from('<svg width="24" height="32" viewBox="0 0 128 128"/>'), ".svg"),
    { width: "24", height: "32", viewBox: "0 0 128 128" },
  );
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
  png.writeUInt32BE(390, 16);
  png.writeUInt32BE(844, 20);
  assert.deepEqual(imageMetadata(png, ".png"), { width: 390, height: 844 });
  assert.throws(() => imageMetadata(Buffer.from("not svg"), ".svg"), /SVG root/);
  assert.deepEqual(imageMetadata(Buffer.from("GIF89a\x18\x00\x20\x00", "binary"), ".gif"), {
    width: 24,
    height: 32,
  });
});

test("audit separates build copies, literal references, dynamic candidates and missing assets", () => {
  const root = mkdtempSync(join(tmpdir(), "gamezero-assets-"));
  try {
    const content = {
      "public/equipment.svg": '<svg viewBox="0 0 128 128"/>',
      ".vercel/output/static/equipment.svg": '<svg viewBox="0 0 128 128"/>',
      "public/actors/hero.svg": '<svg width="32" height="32"/>',
      "godot/scripts/view.gd": 'var image = load("res://assets/missing.svg")',
      "src/view.tsx":
        '<use href="/equipment.svg#sword"/>\nconst image = `/actors/${actor}.svg`;\nconst generated = `/actors/${file}`;',
      "src/unrelated.ts": "const score = `${wins}/${games}`;\nconst host = `https://${host}`;",
      "artifacts/plan.json": '{"planned": "exports/not-produced.svg"}',
    };
    for (const [path, value] of Object.entries(content)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), value);
    }
    const result = scanAssets(root, Object.keys(content));
    assert.equal(result.summary.assets, 3);
    const source = result.assets.find((asset) => asset.path === "public/equipment.svg");
    assert.equal(source.status, "referenziert");
    assert.deepEqual(source.duplicates, [".vercel/output/static/equipment.svg"]);
    assert.equal(
      result.assets.find((asset) => asset.role === "build-output").status,
      "Duplikat/Build-Ausgabe",
    );
    const dynamic = result.assets.find((asset) => asset.path === "public/actors/hero.svg");
    assert.equal(dynamic.runtimeAnchored, false);
    assert.equal(dynamic.references[0].kind, "dynamic-candidate");
    assert.equal(result.missingReferences[0].expectedPath, "godot/assets/missing.svg");
    assert.equal(result.dynamicReferences.length, 2);
    assert.deepEqual(result, scanAssets(root, Object.keys(content).reverse()));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});




test("recursive nested ZIP inventory marks contents as not approved and preserves paths", () => {
  const root = mkdtempSync(join(tmpdir(), "gamezero-nested-"));
  try {
    execFileSync("python3", ["/tmp/make_nested_zip.py", root], { encoding: "utf8" });
    const result = scanAssets(root, ["outer.zip"]);
    const archive = result.archives[0];
    assert.ok(archive, "archive present");
    assert.equal(archive.path, "outer.zip");
    const nestedPaths = archive.assets.map((a) => a.path);
    assert.ok(nestedPaths.some((p) => p.includes("inner.zip") && p.includes("sound.wav")), "nested wav: " + nestedPaths.join(", "));
    assert.ok(nestedPaths.some((p) => p.includes("inner.zip") && p.includes("icon.png")), "nested png");
    assert.ok(nestedPaths.some((p) => p === "top.png"), "top-level");
    const nestedAsset = archive.assets.find((a) => a.path.includes("sound.wav"));
    assert.ok(nestedAsset && (nestedAsset.nested === true || String(nestedAsset.status).includes("nested")), "nested status");
    assert.ok(archive.nestedArchives.length >= 1, "nestedArchives");
    assert.deepEqual(result, scanAssets(root, ["outer.zip"]));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
