import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { loadContent, type Collection } from "../src/game/slice/validation.ts";

export const collections: Collection[] = [
  "careers",
  "skills",
  "statuses",
  "items",
  "enemies",
  "bosses",
  "encounters",
];
export const packPath = fileURLToPath(new URL("../godot/data/runtime_pack.json", import.meta.url));

export function readSources() {
  return Object.fromEntries(
    collections.map((collection) => {
      const directory = fileURLToPath(new URL(`../data/${collection}/`, import.meta.url));
      return [
        collection,
        Object.fromEntries(
          readdirSync(directory)
            .filter((file) => file.endsWith(".json"))
            .sort()
            .map((file) => [
              `data/${collection}/${file}`,
              readFileSync(resolve(directory, file), "utf8"),
            ]),
        ),
      ];
    }),
  );
}

export function buildPack(sources: Partial<Record<Collection, Record<string, string>>>): string {
  const runtime = loadContent(sources);
  if (!runtime.ready) {
    throw new Error(
      runtime.issues.map((issue) => `${issue.path} ${issue.field}: ${issue.message}`).join("\n"),
    );
  }
  const records = Object.fromEntries(
    collections.map((collection) => [
      collection,
      Object.fromEntries(
        Object.entries(runtime.data[collection]).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
    ]),
  );
  return `${JSON.stringify({ schema_version: 1, collections: records }, null, 2)}\n`;
}

export function exportContent(check = false) {
  const content = buildPack(readSources());
  if (check) {
    if (readFileSync(packPath, "utf8") !== content) {
      throw new Error("Godot content pack is stale. Run npm run data:godot.");
    }
  } else {
    writeFileSync(packPath, content, "utf8");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some((argument) => argument !== "--check")) {
      throw new Error("Usage: npm run data:godot -- [--check]");
    }
    exportContent(process.argv.includes("--check"));
    console.log("Godot content pack validated; all seven canonical collections are ready.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
