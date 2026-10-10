import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildPack, collections, packPath, readSources } from "./export-godot-content.ts";

test("Godot pack contains every canonical record and is reproducible", () => {
  const sources = readSources();
  const serialized = buildPack(sources);
  const pack = JSON.parse(serialized);
  assert.equal(pack.schema_version, 1);
  assert.deepEqual(Object.keys(pack.collections), collections);
  for (const collection of collections) {
    assert.equal(
      Object.keys(pack.collections[collection]).length,
      Object.keys(sources[collection]).length,
    );
    for (const [path, record] of Object.entries(sources[collection])) {
      const entity = JSON.parse(record);
      assert.deepEqual(pack.collections[collection][entity.id], entity, path);
    }
  }
  const reversed = Object.fromEntries(
    Object.entries(sources)
      .reverse()
      .map(([collection, files]) => [
        collection,
        Object.fromEntries(Object.entries(files).reverse()),
      ]),
  );
  assert.equal(buildPack(reversed), serialized);
  assert.equal(readFileSync(packPath, "utf8"), serialized, "committed runtime pack must not drift");
});

test("invalid content cannot produce a runtime pack", () => {
  const sources = readSources();
  sources.skills["data/skills/broken.json"] = "{";
  const path = Object.keys(sources.encounters)[0];
  const encounter = JSON.parse(sources.encounters[path]);
  encounter.enemies = ["missing_opponent"];
  sources.encounters[path] = JSON.stringify(encounter);
  assert.throws(
    () => buildPack(sources),
    (error: Error) =>
      error.message.includes("broken.json") && error.message.includes("missing_opponent"),
  );
});
