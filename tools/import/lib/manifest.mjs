/**
 * Manifest I/O. The manifest is the durable record of an import: every Drive
 * entry, its metadata, its classification and the repository paths written.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { toCsv } from "./drive-client.mjs";
import { MANIFEST_SCHEMA_VERSION, TOOL_NAME } from "./plan.mjs";

export function readManifest(file) {
  if (!existsSync(file)) return null;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Previous manifest ${file} is not valid JSON: ${error.message}`);
  }
  if (manifest.tool !== TOOL_NAME || manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    throw new Error(`${file} is not a ${TOOL_NAME} v${MANIFEST_SCHEMA_VERSION} manifest.`);
  }
  return manifest;
}

function writeAtomic(file, contents) {
  mkdirSync(dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, contents);
  renameSync(temp, file);
}

const CSV_COLUMNS = [
  "id",
  "drivePath",
  "name",
  "mimeType",
  "kind",
  "isFolder",
  "parentId",
  "modifiedTime",
  "size",
  "md5Checksum",
  "category",
  "rule",
  "action",
  "status",
  "skipReason",
  "rawPaths",
  "sortedPaths",
  "results",
];

export function manifestToCsv(manifest) {
  const rows = [CSV_COLUMNS];
  for (const entry of manifest.entries) {
    const outputs = entry.outputs ?? [];
    const raw = [entry.rawDir, ...outputs.map((o) => o.rawPath ?? o.rawDir)].filter(Boolean);
    const sorted = outputs.map((o) => o.sortedPath ?? o.sortedDir).filter(Boolean);
    const results = outputs.map((o) => o.result).filter(Boolean);
    rows.push([
      entry.id,
      entry.drivePath,
      entry.name,
      entry.mimeType,
      entry.kind,
      entry.isFolder,
      entry.parentId,
      entry.modifiedTime,
      entry.size,
      entry.md5Checksum,
      entry.category,
      entry.rule,
      entry.action,
      entry.status,
      entry.skipReason,
      raw.join(" | "),
      sorted.join(" | "),
      results.join(" | "),
    ]);
  }
  return toCsv(rows);
}

/** Write <file> (JSON) and, if requested, a sibling .csv. Returns written paths. */
export function writeManifest(manifest, file, { csv = true } = {}) {
  writeAtomic(file, `${JSON.stringify(manifest, null, 2)}\n`);
  const written = [file];
  if (csv) {
    const csvFile = file.replace(/\.json$/i, "") + ".csv";
    writeAtomic(csvFile, manifestToCsv(manifest));
    written.push(csvFile);
  }
  return written;
}
