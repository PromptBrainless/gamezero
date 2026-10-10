#!/usr/bin/env node
/**
 * GameZero Google Drive importer.
 *
 *   node tools/import/drive-import.mjs auth login            # one-time OAuth consent
 *   node tools/import/drive-import.mjs plan  --folder <url>  # dry run, writes nothing
 *   node tools/import/drive-import.mjs import --folder <url> # download + sort + manifest
 *
 * See tools/import/README.md for setup, configuration and safety notes.
 */
import { readFileSync, rmdirSync } from "node:fs";
import { relative } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createAuth, oauthLogin } from "./lib/auth.mjs";
import { DEFAULT_CONFIG_FILE, REPO_ROOT, loadConfig, resolveUserPath } from "./lib/config.mjs";
import { loadRules } from "./lib/classify.mjs";
import { DriveClient } from "./lib/drive-client.mjs";
import { folderUrl, parseDriveLink } from "./lib/drive-id.mjs";
import { executePlan } from "./lib/execute.mjs";
import { readManifest, writeManifest } from "./lib/manifest.mjs";
import { resolveInside } from "./lib/paths.mjs";
import { MANIFEST_SCHEMA_VERSION, TOOL_NAME, buildPlan } from "./lib/plan.mjs";
import { traverseFolder } from "./lib/traverse.mjs";

const USAGE = `GameZero Google Drive importer

Usage:
  node tools/import/drive-import.mjs <command> [options]
  npm run drive:<command> -- [options]

Commands:
  auth login        Run the one-time OAuth consent (Desktop OAuth client) and cache a refresh token
  auth status       Show which credentials would be used and check access to the folder
  plan              Dry run: scan the folder and print the full import plan. Writes nothing
                    (unless --plan-out is given)
  import            Download/export, write raw mirror + sorted copies and the manifest
  help              Show this help

Options:
  --folder <url|id>         Drive folder URL or ID (default: source.folder in the config)
  --config <file>           Config file (default: tools/import/drive-import.config.json)
  --rules <file>            Mapping-rules file (default: rulesFile in the config)
  --auth <method>           auto | oauth | service-account | access-token | api-key
  --manifest <file>         Manifest path (default: output.manifestFile in the config)
  --no-csv                  Do not write the CSV twin of the manifest
  --no-raw                  Do not keep the raw mirror (sorted copies only)
  --no-sorted               Only fill the raw mirror (no sorted placement)
  --conflict <policy>       rename | skip | overwrite for pre-existing repo files (default: rename)
  --concurrency <n>         Parallel downloads (1-16, default 4)
  --max-file-size-mb <n>    Skip files larger than this (default 500)
  --force                   Re-download entries even if unchanged since the last import
  --from-plan <file>        import: execute a plan saved with "plan --plan-out" instead of re-scanning
  --plan-out <file>         plan: also save the full plan as JSON (for review or --from-plan)
  --json                    plan: print the full plan as JSON on stdout
  --manual                  auth login: copy/paste flow for machines without a local browser
  --verbose                 Log retries and progress details
  -h, --help                Show this help

Credentials come from environment variables or files outside git, never from flags:
  GOOGLE_DRIVE_ACCESS_TOKEN, GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_DRIVE_API_KEY,
  GOOGLE_OAUTH_CLIENT_FILE, GAMEZERO_DRIVE_TOKEN_FILE, GAMEZERO_DRIVE_FOLDER`;

const OPTIONS = {
  folder: { type: "string" },
  config: { type: "string" },
  rules: { type: "string" },
  auth: { type: "string" },
  manifest: { type: "string" },
  "no-csv": { type: "boolean" },
  "no-raw": { type: "boolean" },
  "no-sorted": { type: "boolean" },
  conflict: { type: "string" },
  concurrency: { type: "string" },
  "max-file-size-mb": { type: "string" },
  force: { type: "boolean" },
  "from-plan": { type: "string" },
  "plan-out": { type: "string" },
  json: { type: "boolean" },
  manual: { type: "boolean" },
  verbose: { type: "boolean" },
  help: { type: "boolean", short: "h" },
};

function numberOption(value, name, integer) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed))) {
    throw new Error(`--${name} expects a ${integer ? "whole " : ""}number, got "${value}".`);
  }
  return parsed;
}

export function parseCli(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    options: OPTIONS,
    allowPositionals: true,
    strict: true,
  });
  const [command = "help", subcommand] = positionals;
  const overrides = { source: {}, auth: {}, output: {}, limits: {} };
  if (values.folder) overrides.source.folder = values.folder;
  if (values.rules) overrides.rulesFile = values.rules;
  if (values.auth) overrides.auth.method = values.auth;
  if (values.manifest) overrides.output.manifestFile = values.manifest;
  if (values["no-csv"]) overrides.output.manifestCsv = false;
  if (values["no-raw"]) overrides.output.writeRaw = false;
  if (values["no-sorted"]) overrides.output.writeSorted = false;
  if (values.conflict) overrides.output.conflictPolicy = values.conflict;
  const concurrency = numberOption(values.concurrency, "concurrency", true);
  if (concurrency !== undefined) overrides.limits.concurrency = concurrency;
  const maxSize = numberOption(values["max-file-size-mb"], "max-file-size-mb", false);
  if (maxSize !== undefined) overrides.limits.maxFileSizeMB = maxSize;
  return { command, subcommand, values, overrides };
}

function rel(path) {
  return relative(REPO_ROOT, path) || ".";
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function describeOutputs(entry) {
  return entry.outputs
    .map((output) => {
      const sorted =
        output.sortedPath ?? (output.sortedDir ? `${output.sortedDir}/<tab>.csv` : null);
      const raw = output.rawPath ?? (output.rawDir ? `${output.rawDir}/<tab>.csv` : null);
      const parts = [];
      if (sorted) parts.push(`-> ${sorted}`);
      if (raw) parts.push(`raw: ${raw}`);
      if (output.conflict) parts.push(`conflict: ${output.conflict}, ${output.conflictResolution}`);
      return `[${output.format}] ${parts.join("  ")}`;
    })
    .join("\n        ");
}

export function renderPlan(plan) {
  const lines = [];
  const { source, summary } = plan;
  lines.push(`Drive folder: ${source.rootName} (${source.folderId})`);
  lines.push(`Raw mirror:   ${plan.settings.rawRoot ?? "disabled"}`);
  lines.push(
    `Sorted copy:  ${plan.settings.writeSorted ? "enabled" : "disabled"}   Conflicts: ${plan.settings.conflictPolicy}`,
  );
  lines.push("");

  const byCategory = new Map();
  for (const entry of plan.entries) {
    if (entry.isFolder || entry.action === "skip") continue;
    if (!byCategory.has(entry.category)) byCategory.set(entry.category, []);
    byCategory.get(entry.category).push(entry);
  }
  for (const [category, entries] of [...byCategory.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push(`== ${category} (${entries.length})`);
    for (const entry of entries) {
      const size = entry.size !== null ? ` ${formatBytes(entry.size)}` : "";
      lines.push(`  ${entry.action.padEnd(8)} ${entry.status ?? ""} ${entry.drivePath}${size}`);
      lines.push(`        ${describeOutputs(entry)}`);
      lines.push(`        why: ${entry.reason}`);
    }
    lines.push("");
  }

  const skipped = plan.entries.filter((entry) => entry.action === "skip");
  if (skipped.length > 0) {
    lines.push(`== skipped (${skipped.length})`);
    for (const entry of skipped)
      lines.push(`  ${entry.drivePath}${entry.isFolder ? "/" : ""}: ${entry.skipReason}`);
    lines.push("");
  }
  if (plan.removedSinceLastImport?.length) {
    lines.push(
      `== no longer in Drive since the last import (${plan.removedSinceLastImport.length}, not deleted)`,
    );
    for (const entry of plan.removedSinceLastImport)
      lines.push(`  ${entry.drivePath}: ${entry.outputs.join(", ")}`);
    lines.push("");
  }

  lines.push(
    `Summary: ${summary.folders} folders, ${summary.files} files: ${summary.toDownload} download, ` +
      `${summary.toExport} export, ${summary.skipped} skipped, ${summary.unchanged} unchanged; ` +
      `known size ${formatBytes(summary.knownBytes)}`,
  );
  const categories = Object.entries(summary.byCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => `${category}=${count}`)
    .join(" ");
  if (categories) lines.push(`By category: ${categories}`);
  if (summary.failed !== undefined) lines.push(`Failed: ${summary.failed}`);
  return lines.join("\n");
}

function setup(parsed, { needsFolder = true } = {}) {
  const config = loadConfig({ configFile: parsed.values.config, overrides: parsed.overrides });
  const log = (message) => process.stderr.write(`${message}\n`);
  const debug = parsed.values.verbose ? log : () => {};
  let folder = null;
  if (needsFolder) {
    if (!config.source.folder) {
      throw new Error(
        'No Drive folder given. Pass --folder "https://drive.google.com/drive/folders/<id>" or set source.folder in the config.',
      );
    }
    folder = parseDriveLink(config.source.folder);
  }
  return { config, log, debug, folder };
}

function createClient(config, debug) {
  const auth = createAuth(config.auth);
  debug(`auth: ${auth.description}`);
  return new DriveClient({ auth, maxRetries: config.limits.maxRetries, log: debug });
}

async function scanAndPlan(parsed, mode) {
  const { config, log, debug, folder } = setup(parsed);
  const rules = loadRules(resolveUserPath(config.rulesFile));
  const client = createClient(config, debug);
  const manifestFile = resolveInside(REPO_ROOT, config.output.manifestFile);
  const previousManifest = readManifest(manifestFile);
  log(`Scanning ${folderUrl(folder.id)} ...`);
  const tree = await traverseFolder(client, folder.id, {
    followShortcuts: config.source.followShortcuts,
    resourceKey: folder.resourceKey,
    log,
  });
  log(`Found ${tree.entries.length} entries below "${tree.root.name}".`);
  const plan = buildPlan(tree, { config, rules, repoRoot: REPO_ROOT, previousManifest, mode });
  return { config, log, client, plan, manifestFile, previousManifest };
}

async function commandPlan(parsed) {
  const { plan, log } = await scanAndPlan(parsed, "dry-run");
  if (parsed.values["plan-out"]) {
    const out = resolveUserPath(parsed.values["plan-out"], process.cwd());
    writeManifest(plan, out, { csv: false });
    log(`Plan saved to ${out}`);
  }
  if (parsed.values.json) process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  else
    process.stdout.write(
      `${renderPlan(plan)}\n\nDry run only: nothing was downloaded or written.\n`,
    );
  return 0;
}

function loadSavedPlan(file) {
  let plan;
  try {
    plan = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read plan ${file}: ${error.message}`, { cause: error });
  }
  if (
    plan.tool !== TOOL_NAME ||
    plan.schemaVersion !== MANIFEST_SCHEMA_VERSION ||
    plan.mode !== "dry-run"
  ) {
    throw new Error(`${file} is not a dry-run plan written by "plan --plan-out".`);
  }
  for (const entry of plan.entries) {
    for (const output of entry.outputs ?? []) {
      for (const key of ["rawPath", "sortedPath", "rawDir", "sortedDir"]) {
        if (output[key]) resolveInside(REPO_ROOT, output[key]);
      }
    }
  }
  return plan;
}

async function commandImport(parsed) {
  let context;
  if (parsed.values["from-plan"]) {
    const { config, log, debug } = setup(parsed, { needsFolder: false });
    const plan = loadSavedPlan(resolveUserPath(parsed.values["from-plan"], process.cwd()));
    const manifestFile = resolveInside(REPO_ROOT, config.output.manifestFile);
    context = {
      config,
      log,
      plan,
      manifestFile,
      client: createClient(config, debug),
      previousManifest: readManifest(manifestFile),
    };
  } else {
    context = await scanAndPlan(parsed, "import");
  }
  const { config, log, plan, manifestFile, client, previousManifest } = context;
  log(
    `Importing ${plan.summary.toDownload} downloads and ${plan.summary.toExport} exports ` +
      `(${plan.summary.unchanged} unchanged, ${plan.summary.skipped} skipped)...`,
  );
  const { failures } = await executePlan(plan, {
    client,
    config,
    repoRoot: REPO_ROOT,
    previousManifest,
    force: Boolean(parsed.values.force),
    log,
  });
  try {
    rmdirSync(resolveInside(REPO_ROOT, config.output.stagingDir));
  } catch {
    // Not empty or already gone: leave it.
  }
  const written = writeManifest(plan, manifestFile, { csv: config.output.manifestCsv });
  process.stdout.write(`${renderPlan(plan)}\n\nManifest: ${written.map(rel).join(", ")}\n`);
  if (failures > 0) {
    process.stderr.write(
      `${failures} entr${failures === 1 ? "y" : "ies"} failed; see "error" fields in the manifest. Re-run to retry.\n`,
    );
    return 1;
  }
  return 0;
}

async function commandAuth(parsed) {
  const { config, debug } = setup(parsed, { needsFolder: false });
  if (parsed.subcommand === "login") {
    const clientFile = resolveUserPath(config.auth.oauthClientFile);
    const tokenFile = resolveUserPath(config.auth.tokenFile);
    await oauthLogin({ clientFile, tokenFile, manual: Boolean(parsed.values.manual) });
    return 0;
  }
  if (parsed.subcommand === "status") {
    const client = createClient(config, debug);
    process.stdout.write(`Credentials: ${client.auth.description}\n`);
    if (!config.source.folder) {
      process.stdout.write("No folder configured; pass --folder to test access.\n");
      return 0;
    }
    const folder = parseDriveLink(config.source.folder);
    client.rememberResourceKey(folder.id, folder.resourceKey);
    const file = await client.getFile(folder.id);
    process.stdout.write(`Folder access OK: "${file.name}" (${file.mimeType})\n`);
    return 0;
  }
  throw new Error('Unknown auth subcommand. Use "auth login" or "auth status".');
}

export async function main(argv = process.argv.slice(2)) {
  const parsed = parseCli(argv);
  if (parsed.values.help || parsed.command === "help") {
    process.stdout.write(`${USAGE}\n\nDefault config: ${rel(DEFAULT_CONFIG_FILE)}\n`);
    return 0;
  }
  switch (parsed.command) {
    case "plan":
    case "dry-run":
      return commandPlan(parsed);
    case "import":
      return commandImport(parsed);
    case "auth":
      return commandAuth(parsed);
    default:
      throw new Error(`Unknown command "${parsed.command}". Run with --help.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      process.stderr.write(`error: ${error.message}\n`);
      process.exitCode = 1;
    },
  );
}
