import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { assertCleanExport, prepareProject } from "./export-godot-release.mjs";

test("native export stages source inputs without editor caches, tests or uploaded archives", () => {
  const root = mkdtempSync(join(tmpdir(), "gamezero-export-test-"));
  try {
    const source = join(root, "source");
    for (const path of [
      "project.godot",
      "export_presets.cfg",
      "scripts/core/main.gd",
      "scripts/tests/fixture.gd",
      "scenes/main.tscn",
      "data/runtime_pack.json",
      ".godot/editor/filesystem_cache10",
      "assets/input.zip",
      "assets/icon.svg",
    ]) {
      mkdirSync(dirname(join(source, path)), { recursive: true });
      writeFileSync(join(source, path), "fixture");
    }
    const staged = join(root, "staged");
    mkdirSync(staged);
    prepareProject(source, staged);
    for (const path of [
      "project.godot",
      "scripts/core/main.gd",
      "data/runtime_pack.json",
      "assets/icon.svg",
    ])
      assert.ok(existsSync(join(staged, path)));
    for (const path of [".godot", "scripts/tests", "assets/input.zip"])
      assert.ok(!existsSync(join(staged, path)));
    assert.throws(
      () => prepareProject(join(root, "missing"), staged),
      /Required native export input/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("zero exit status does not hide native export errors", () => {
  assertCleanExport({ status: 0, stdout: "Packing finished\n", stderr: "" });
  assert.throws(
    () =>
      assertCleanExport({
        status: 0,
        stdout: "",
        stderr: "ERROR: Can't open file from path ''.\n",
      }),
    /logged an engine error/,
  );
  assert.throws(() => assertCleanExport({ status: 1, stdout: "", stderr: "" }), /exit 1/);
  assert.throws(
    () => assertCleanExport({ status: 0, stdout: "SCRIPT ERROR: Parse Error", stderr: "" }),
    /logged an engine error/,
  );
});
