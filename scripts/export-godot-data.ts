import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadContent, type Collection, type ContentIssue } from "../src/game/slice/validation.ts";
import { validateRuntimeData } from "./runtime-data.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COLLECTIONS: Collection[] = ["careers", "skills", "statuses", "items", "enemies", "bosses", "encounters"];

export function buildContentBundle(root = ROOT) {
  if (!isAbsolute(root)) throw new Error("Repository root must be absolute");
  const files: Partial<Record<Collection, Record<string, string>>> = {};
  const issues: ContentIssue[] = [];
  for (const collection of COLLECTIONS) {
    const directory = `data/${collection}`;
    files[collection] = {};
    let names: string[];
    try {
      names = readdirSync(join(root, directory)).filter((name) => name.endsWith(".json")).sort();
    } catch {
      issues.push({ path: directory, field: "read", message: "Cannot read collection directory" });
      continue;
    }
    for (const name of names) {
      const path = `${directory}/${name}`;
      try {
        files[collection]![path] = readFileSync(join(root, path), "utf8");
      } catch {
        issues.push({ path, field: "read", message: "Cannot read content file" });
      }
    }
  }
  const base = loadContent(files);
  issues.push(...base.issues);
  const runtimePath = "data/runtime/slice.json";
  let runtime: unknown;
  try {
    runtime = JSON.parse(readFileSync(join(root, runtimePath), "utf8"));
  } catch (error) {
    issues.push({
      path: runtimePath,
      field: error instanceof SyntaxError ? "json" : "read",
      message: error instanceof SyntaxError ? "Invalid JSON" : "Cannot read runtime metadata",
    });
  }
  if (runtime !== undefined && base.ready) {
    const validation = validateRuntimeData(base.data, runtime);
    issues.push(...validation.issues);
    runtime = validation.data;
  }
  if (issues.length) {
    issues.sort((left, right) => `${left.path}.${left.field}`.localeCompare(`${right.path}.${right.field}`));
    throw new Error(`Content export rejected:\n${issues.map((issue) => `${issue.path} [${issue.field}]: ${issue.message}`).join("\n")}`);
  }
  return { schema_version: 1, content_revision: "slice_1", collections: base.data, runtime };
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      return Object.fromEntries(Object.keys(entry).sort().map((key) => [key, entry[key]]));
    }
    return entry;
  }, 2) + "\n";
}

function main(args: string[]) {
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    throw new Error("Usage: node --experimental-strip-types scripts/export-godot-data.ts [--check]");
  }
  const bundle = buildContentBundle();
  if (args[0] === "--check") {
    console.log("Godot content bundle validated (no files written)");
    return;
  }
  const destination = join(ROOT, "godot/data/content_bundle.json");
  mkdirSync(dirname(destination), { recursive: true });
  const staged = `${destination}.${process.pid}.stage`;
  try {
    writeFileSync(staged, stableJson(bundle), { flag: "wx" });
    renameSync(staged, destination);
  } finally {
    rmSync(staged, { force: true });
  }
  console.log("Exported godot/data/content_bundle.json");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
