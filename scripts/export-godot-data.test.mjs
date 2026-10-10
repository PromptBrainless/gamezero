import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const EXPORTER = join(ROOT, "scripts/export-godot-data.ts");

function fixture(run) {
  const root = mkdtempSync(join(ROOT, ".godot-export-test-"));
  try {
    cpSync(join(ROOT, "data"), join(root, "data"), { recursive: true });
    for (const path of [
      "scripts/export-godot-data.ts",
      "scripts/runtime-data.mjs",
      "src/game/slice/validation.ts",
    ]) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      cpSync(join(ROOT, path), join(root, path));
    }
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function cli(root, ...args) {
  return spawnSync(process.execPath, ["--experimental-strip-types", join(root, "scripts/export-godot-data.ts"), ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

function build(root) {
  const code = `import { buildContentBundle } from ${JSON.stringify(pathToFileURL(EXPORTER).href)}; console.log(JSON.stringify(buildContentBundle(${JSON.stringify(root)})));`;
  return spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "--eval", code], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

function mutate(root, path, edit) {
  const target = join(root, path);
  const record = JSON.parse(readFileSync(target, "utf8"));
  edit(record);
  writeFileSync(target, JSON.stringify(record));
}

test("bundle function returns validated canonical collections and runtime without writing", () => {
  fixture((root) => {
    const result = build(root);
    assert.equal(result.status, 0, result.stderr);
    const bundle = JSON.parse(result.stdout);
    assert.deepEqual(Object.keys(bundle), ["schema_version", "content_revision", "collections", "runtime"]);
    assert.equal(bundle.schema_version, 1);
    assert.equal(bundle.content_revision, "slice_1");
    assert.deepEqual(bundle.runtime, JSON.parse(readFileSync(join(root, "data/runtime/slice.json"), "utf8")));
    for (const [collection, records] of Object.entries(bundle.collections)) {
      const names = readdirSync(join(root, "data", collection)).filter((name) => name.endsWith(".json"));
      assert.equal(Object.keys(records).length, names.length);
      for (const name of names) {
        const source = JSON.parse(readFileSync(join(root, "data", collection, name), "utf8"));
        assert.deepEqual(records[source.id], source);
      }
    }
    assert.equal(existsSync(join(root, "godot/data/content_bundle.json")), false);
  });
});

test("CLI export is deterministic, portable, and leaves no staged files", () => {
  fixture((root) => {
    const destination = join(root, "godot/data/content_bundle.json");
    const first = cli(root);
    assert.equal(first.status, 0, first.stderr);
    const bytes = readFileSync(destination, "utf8");
    assert.doesNotMatch(bytes, new RegExp(ROOT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    const runtimePath = join(root, "data/runtime/slice.json");
    const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
    writeFileSync(runtimePath, JSON.stringify(Object.fromEntries(Object.entries(runtime).reverse())));
    const second = cli(root);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(readFileSync(destination, "utf8"), bytes);
    assert.deepEqual(readdirSync(dirname(destination)), ["content_bundle.json"]);
  });
});

test("--check validates without creating or replacing an export", () => {
  fixture((root) => {
    const destination = join(root, "godot/data/content_bundle.json");
    assert.equal(cli(root, "--check").status, 0);
    assert.equal(existsSync(destination), false);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, "previous bundle");
    assert.equal(cli(root, "--check").status, 0);
    assert.equal(readFileSync(destination, "utf8"), "previous bundle");
  });
});

test("malformed base and runtime JSON errors are aggregated and export fails closed", () => {
  fixture((root) => {
    const enemy = readdirSync(join(root, "data/enemies")).find((name) => name.endsWith(".json"));
    writeFileSync(join(root, "data/enemies", enemy), "{");
    writeFileSync(join(root, "data/runtime/slice.json"), "{");
    const destination = join(root, "godot/data/content_bundle.json");
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, "previous bundle");
    const result = cli(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /data\/enemies\/.*\[json\]/);
    assert.match(result.stderr, /data\/runtime\/slice.json \[json\]/);
    assert.equal(readFileSync(destination, "utf8"), "previous bundle");
    assert.deepEqual(readdirSync(dirname(destination)), ["content_bundle.json"]);
  });
});

test("missing canonical references reject export without creating output", () => {
  fixture((root) => {
    const enemy = readdirSync(join(root, "data/enemies")).find((name) => name.endsWith(".json"));
    mutate(root, `data/enemies/${enemy}`, (record) => { record.skills = ["missing_skill"]; });
    const result = cli(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /skills\/missing_skill/);
    assert.equal(existsSync(join(root, "godot")), false);
  });
});

test("invalid runtime schema version and absent runtime metadata reject export", () => {
  fixture((root) => {
    mutate(root, "data/runtime/slice.json", (record) => { record.schema_version = 999; });
    const invalid = cli(root, "--check");
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /schema_version/);
    rmSync(join(root, "data/runtime/slice.json"));
    const missing = cli(root);
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /Cannot read runtime metadata/);
    assert.equal(existsSync(join(root, "godot")), false);
  });
});

test("runtime references are checked against the canonical base registry", () => {
  fixture((root) => {
    mutate(root, "data/runtime/slice.json", (record) => { record.actions[0].skill = "missing_runtime_skill"; });
    const result = cli(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /skills\/missing_runtime_skill/);
    assert.equal(existsSync(join(root, "godot")), false);
  });
});

test("null runtime JSON is rejected without overwriting an existing bundle", () => {
  fixture((root) => {
    writeFileSync(join(root, "data/runtime/slice.json"), "null");
    const destination = join(root, "godot/data/content_bundle.json");
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, "previous bundle");
    const result = cli(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /data\/runtime\/slice.json/);
    assert.equal(readFileSync(destination, "utf8"), "previous bundle");
  });
});

test("absent required base collection and nonabsolute function roots fail closed", () => {
  fixture((root) => {
    rmSync(join(root, "data/statuses"), { recursive: true });
    const result = cli(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /data\/statuses \[read\]/);
    assert.equal(existsSync(join(root, "godot")), false);
  });
  const result = build(".");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Repository root must be absolute/);
});

test("import does not run CLI and unknown CLI options fail without writing", () => {
  const code = `await import(${JSON.stringify(pathToFileURL(EXPORTER).href)});`;
  const imported = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "--eval", code], { encoding: "utf8" });
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout, "");
  fixture((root) => {
    const result = cli(root, "--output", "elsewhere.json");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
    assert.equal(existsSync(join(root, "godot")), false);
  });
});
