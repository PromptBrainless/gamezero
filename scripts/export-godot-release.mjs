import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function prepareProject(source, destination) {
  for (const name of [
    "project.godot",
    "export_presets.cfg",
    "scripts",
    "scenes",
    "data",
    "assets",
  ]) {
    const path = join(source, name);
    if (!existsSync(path)) {
      if (name === "assets") continue;
      throw new Error(`Required native export input is missing: ${path}`);
    }
    cpSync(path, join(destination, name), {
      recursive: true,
      filter: (entry) => {
        const parts = relative(source, entry).split("/");
        return (
          !parts.includes(".godot") &&
          !parts.includes("tests") &&
          !parts.some((part) => part.endsWith(".zip"))
        );
      },
    });
  }
}

export function assertCleanExport(result) {
  if (result.error) throw result.error;
  if (
    result.status !== 0 ||
    /(?:^|\n)(?:SCRIPT ERROR:|ERROR:)/.test(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)
  ) {
    throw new Error(
      `Native export failed or logged an engine error (exit ${result.status}, signal ${result.signal ?? "none"}).`,
    );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv[2];
  if (!output || !isAbsolute(output))
    throw new Error("Usage: npm run export:godot:linux -- /absolute/output/echo-bruch.x86_64");
  const source = fileURLToPath(new URL("../godot/", import.meta.url));
  const staging = mkdtempSync(join(tmpdir(), "gamezero-native-export-"));
  try {
    prepareProject(source, staging);
    mkdirSync(dirname(output), { recursive: true });
    const result = spawnSync(
      process.env.GODOT || "godot",
      ["--headless", "--path", staging, "--export-release", "Linux", output],
      {
        encoding: "utf8",
        timeout: 180_000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    assertCleanExport(result);
    if (!existsSync(output) || statSync(output).size === 0)
      throw new Error("Godot reported success but the standalone executable is missing or empty.");
    console.log(
      "Clean Linux export created. Packaged boot and rendered playthrough are separate acceptance gates.",
    );
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
