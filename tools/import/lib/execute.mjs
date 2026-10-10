/**
 * Execute an import plan: download/export every planned entry into the raw
 * mirror (or a staging area), then place the primary format in its sorted
 * destination. Every write is atomic (temp file + rename) and every path is
 * re-checked to stay inside the repository.
 */
import { createHash, randomBytes } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DriveApiError, toCsv } from "./drive-client.mjs";
import { resolveInside, safeFileName, slugFileName, withSuffix } from "./paths.mjs";
import { shortId, summarize } from "./plan.mjs";

async function sha256File(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function atomicCopy(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  const temp = `${destination}.part-${randomBytes(4).toString("hex")}`;
  try {
    await copyFile(source, temp);
    await rename(temp, destination);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}

async function atomicMove(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  try {
    await rename(source, destination);
  } catch (error) {
    if (error.code !== "EXDEV") throw error;
    await atomicCopy(source, destination);
    await rm(source, { force: true });
  }
}

async function atomicWrite(destination, contents) {
  await mkdir(dirname(destination), { recursive: true });
  const temp = `${destination}.part-${randomBytes(4).toString("hex")}`;
  try {
    await writeFile(temp, contents);
    await rename(temp, destination);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}

function replaceExtension(path, extension) {
  if (!path) return path;
  const slash = path.lastIndexOf("/");
  const dot = path.lastIndexOf(".");
  return `${dot > slash ? path.slice(0, dot) : path}.${extension}`;
}

/** Export failures that mean "this format is not available", so a fallback is worth trying. */
function formatUnavailable(error) {
  return (
    error instanceof DriveApiError &&
    [400, 403, 415].includes(error.status) &&
    error.reason !== "exportSizeLimitExceeded"
  );
}

async function runPool(items, concurrency, worker) {
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
}

/**
 * @param {object} plan output of buildPlan (mutated in place with results)
 * @param {{ client: import("./drive-client.mjs").DriveClient, config: object, repoRoot: string,
 *   previousManifest?: object | null, force?: boolean, log?: (message: string) => void }} options
 */
export async function executePlan(
  plan,
  { client, config, repoRoot, previousManifest = null, force = false, log = () => {} },
) {
  // A per-run directory inside the configured staging area: only this is ever deleted.
  const stagingRoot = resolveInside(
    repoRoot,
    `${config.output.stagingDir}/run-${randomBytes(4).toString("hex")}`,
  );
  const previousEntries = new Map(
    (previousManifest?.entries ?? []).map((entry) => [entry.id, entry]),
  );
  const maxBytes = Math.floor(config.limits.maxFileSizeMB * 1024 * 1024);
  const work = plan.entries.filter(
    (entry) => entry.action === "download" || entry.action === "export",
  );
  const abs = (relativePath) => resolveInside(repoRoot, relativePath);
  const conflictPolicy = plan.settings?.conflictPolicy ?? config.output.conflictPolicy;

  // Paths decided at execution time (export fallbacks, spreadsheet tabs) must
  // honour the same guarantees as planned paths: never clobber another entry's
  // output or a repository file the importer does not own.
  const ownedByPrevious = new Map();
  for (const previous of previousManifest?.entries ?? []) {
    for (const output of previous.outputs ?? []) {
      for (const path of [output.sortedPath, ...(output.tabs ?? []).map((tab) => tab.sortedPath)])
        if (path) ownedByPrevious.set(path.toLowerCase(), previous.id);
    }
  }
  const claimed = new Map();
  for (const entry of plan.entries) {
    for (const output of entry.outputs ?? []) {
      for (const path of [output.rawPath, output.sortedPath]) {
        if (path) claimed.set(path.toLowerCase(), entry.id);
      }
    }
  }

  /**
   * Claim a path chosen during execution. Returns the path to write (possibly
   * renamed) or null when the conflict policy says to skip it.
   * @param {{ checkRepo: boolean }} options checkRepo: also protect existing repo files
   */
  function claimRuntimePath(entry, path, record, { checkRepo }) {
    const isTaken = (candidate) => {
      const key = candidate.toLowerCase();
      const holder = claimed.get(key);
      if (holder !== undefined) return holder !== entry.id;
      return checkRepo && existsSync(abs(candidate)) && ownedByPrevious.get(key) !== entry.id;
    };
    if (!isTaken(path)) {
      claimed.set(path.toLowerCase(), entry.id);
      return path;
    }
    const holder = claimed.get(path.toLowerCase());
    record.conflict = holder ? `claimed by Drive entry ${holder}` : "existing repository file";
    if (checkRepo && conflictPolicy === "skip") {
      record.conflictResolution = "skipped";
      return null;
    }
    if (checkRepo && conflictPolicy === "overwrite" && !holder) {
      record.conflictResolution = "overwrite";
      claimed.set(path.toLowerCase(), entry.id);
      return path;
    }
    const base = `drive_${shortId(entry.id)}`;
    let candidate = withSuffix(path, base);
    for (let n = 2; isTaken(candidate); n += 1) candidate = withSuffix(path, `${base}_${n}`);
    claimed.set(candidate.toLowerCase(), entry.id);
    record.conflictResolution = "renamed";
    return candidate;
  }

  let done = 0;
  let failures = 0;

  async function fetchToFile(entry, output, target) {
    if (entry.action === "download") {
      return {
        ...(await client.download(entry, target, { maxBytes })),
        extension: output.extension,
      };
    }
    const candidates = [
      { mimeType: output.mimeType, extension: output.extension },
      ...(output.fallbacks ?? []),
    ];
    let lastError;
    for (const candidate of candidates) {
      try {
        const result = await client.export(entry, candidate.mimeType, target, { maxBytes });
        return { ...result, extension: candidate.extension, mimeType: candidate.mimeType };
      } catch (error) {
        lastError = error;
        if (!formatUnavailable(error)) throw error;
        log(`  ${candidate.mimeType} export unavailable for ${entry.drivePath}: ${error.message}`);
      }
    }
    throw lastError;
  }

  async function writeSingle(entry, output, index) {
    const staging = `${stagingRoot}/${entry.id}-${index}-${randomBytes(3).toString("hex")}`;
    const keepRaw = Boolean(output.rawPath);
    const fetchTarget = keepRaw ? abs(output.rawPath) : staging;
    let result;
    try {
      result = await fetchToFile(entry, output, fetchTarget);
      let landed = fetchTarget;
      if (result.extension !== output.extension) {
        output.usedFallback = { mimeType: result.mimeType, extension: result.extension };
        if (output.rawPath)
          output.rawPath = claimRuntimePath(
            entry,
            replaceExtension(output.rawPath, result.extension),
            output,
            { checkRepo: false },
          );
        if (output.sortedPath)
          output.sortedPath = claimRuntimePath(
            entry,
            replaceExtension(output.sortedPath, result.extension),
            output,
            { checkRepo: true },
          );
        if (keepRaw) {
          await atomicMove(fetchTarget, abs(output.rawPath));
          landed = abs(output.rawPath);
        }
      }
      if (output.sortedPath) {
        if (keepRaw) await atomicCopy(landed, abs(output.sortedPath));
        else await atomicMove(landed, abs(output.sortedPath));
      }
    } finally {
      if (!keepRaw) await rm(staging, { force: true });
    }
    output.bytes = result.bytes;
    output.sha256 = result.sha256;
    output.md5 = result.md5;
  }

  async function writeSheetTabs(entry, output) {
    let tabs;
    try {
      tabs = await client.sheetTabs(entry.id);
    } catch (error) {
      if (!(error instanceof DriveApiError) || ![400, 403, 404].includes(error.status)) throw error;
      // Sheets API disabled for the project or not permitted: keep the data via
      // Drive's CSV export, which contains the first tab only.
      log(
        `  Sheets API unavailable for ${entry.drivePath} (${error.message}); exporting first tab only`,
      );
      output.warning = `Sheets API unavailable (${error.reason || error.status}); only the first tab was exported`;
      const staging = `${stagingRoot}/${entry.id}-firsttab-${randomBytes(3).toString("hex")}.csv`;
      const result = await client.export(entry, "text/csv", staging, { maxBytes });
      const fileName = "sheet1.csv";
      output.tabs = [{ title: null, sheetId: null, sha256: result.sha256, bytes: result.bytes }];
      try {
        if (output.rawDir) {
          output.tabs[0].rawPath = claimRuntimePath(
            entry,
            `${output.rawDir}/${fileName}`,
            output.tabs[0],
            { checkRepo: false },
          );
          await atomicCopy(staging, abs(output.tabs[0].rawPath));
        }
        if (output.sortedDir) {
          const sortedPath = claimRuntimePath(
            entry,
            `${output.sortedDir}/${fileName}`,
            output.tabs[0],
            { checkRepo: true },
          );
          if (sortedPath) {
            output.tabs[0].sortedPath = sortedPath;
            await atomicCopy(staging, abs(sortedPath));
          }
        }
      } finally {
        await rm(staging, { force: true });
      }
      return;
    }

    output.tabs = [];
    const usedRaw = new Set();
    const usedSorted = new Set();
    for (const tab of tabs) {
      const rows = await client.sheetValues(entry.id, tab.title);
      const csv = toCsv(rows);
      const sha256 = createHash("sha256").update(csv).digest("hex");
      const record = {
        title: tab.title,
        sheetId: tab.sheetId,
        rows: rows.length,
        bytes: Buffer.byteLength(csv),
        sha256,
      };
      if (output.rawDir) {
        let name = safeFileName(tab.title, "csv");
        if (usedRaw.has(name.toLowerCase())) name = withSuffix(name, String(tab.sheetId));
        usedRaw.add(name.toLowerCase());
        record.rawPath = claimRuntimePath(entry, `${output.rawDir}/${name}`, record, {
          checkRepo: false,
        });
        await atomicWrite(abs(record.rawPath), csv);
      }
      if (output.sortedDir) {
        let name = slugFileName(tab.title, "csv");
        if (usedSorted.has(name)) name = withSuffix(name, String(tab.sheetId));
        usedSorted.add(name);
        record.sortedPath = claimRuntimePath(entry, `${output.sortedDir}/${name}`, record, {
          checkRepo: true,
        });
        if (record.sortedPath) await atomicWrite(abs(record.sortedPath), csv);
        else delete record.sortedPath;
      }
      output.tabs.push(record);
    }
    output.bytes = output.tabs.reduce((sum, tab) => sum + tab.bytes, 0);
  }

  async function verifyUnchanged(entry, previousEntry) {
    if (!previousEntry) return false;
    for (const output of entry.outputs) {
      const previous = previousEntry.outputs?.find(
        (candidate) => candidate.format === output.format,
      );
      if (!previous) return false;
      const singlePaths = [output.rawPath, output.sortedPath].filter(Boolean);
      for (const path of singlePaths) {
        if (!existsSync(abs(path))) return false;
      }
      if (output.perSheet) {
        for (const tab of previous.tabs ?? []) {
          for (const path of [tab.rawPath, tab.sortedPath].filter(Boolean))
            if (!existsSync(abs(path))) return false;
        }
        output.tabs = previous.tabs;
      }
      // The raw copy is tool-owned: if it was edited or corrupted, re-download.
      if (
        output.rawPath &&
        previous.sha256 &&
        (await sha256File(abs(output.rawPath))) !== previous.sha256
      )
        return false;
      Object.assign(output, {
        bytes: previous.bytes,
        sha256: previous.sha256,
        md5: previous.md5,
        ...(previous.usedFallback ? { usedFallback: previous.usedFallback } : {}),
      });
    }
    return true;
  }

  await mkdir(stagingRoot, { recursive: true });
  try {
    await runPool(work, config.limits.concurrency, async (entry) => {
      try {
        if (
          !force &&
          entry.status === "unchanged" &&
          (await verifyUnchanged(entry, previousEntries.get(entry.id)))
        ) {
          for (const output of entry.outputs) output.result = "unchanged";
          return;
        }
        for (const [index, output] of entry.outputs.entries()) {
          if (output.perSheet) await writeSheetTabs(entry, output);
          else await writeSingle(entry, output, index);
          const wroteSomething = output.perSheet
            ? (output.tabs ?? []).some((tab) => tab.rawPath || tab.sortedPath)
            : Boolean(output.rawPath || output.sortedPath);
          // "skipped": conflicts left no destination; the next run plans it again.
          output.result = wroteSomething ? "written" : "skipped";
        }
      } catch (error) {
        failures += 1;
        entry.error = error.message;
        for (const output of entry.outputs) if (!output.result) output.result = "failed";
        log(`  FAILED ${entry.drivePath}: ${error.message}`);
      } finally {
        done += 1;
        const target = entry.outputs.find((o) => o.sortedPath || o.sortedDir);
        log(
          `[${done}/${work.length}] ${entry.outputs[0]?.result ?? "?"} ${entry.drivePath}${
            target ? ` -> ${target.sortedPath ?? target.sortedDir}` : ""
          }`,
        );
      }
    });
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }

  plan.mode = "import";
  plan.completedAt = new Date().toISOString();
  plan.summary = summarize(plan.entries);
  plan.summary.failed = failures;
  plan.summary.apiRequests = client.stats.requests;
  plan.summary.apiRetries = client.stats.retries;
  return { failures };
}
