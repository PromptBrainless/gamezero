/**
 * Turn traversed Drive entries into an import plan: what to download or
 * export, where the raw copy goes, where the sorted copy goes, and why.
 * Planning never touches the working tree (it only reads it to detect
 * conflicts), so the same plan powers dry-run and import.
 */
import { existsSync } from "node:fs";
import { classify, globToRegExp } from "./classify.mjs";
import { binaryExtension, isGoogleNative } from "./media.mjs";
import {
  resolveInside,
  safeFileName,
  safeSegment,
  slugFileName,
  slugify,
  splitExtension,
  withSuffix,
} from "./paths.mjs";

export const MANIFEST_SCHEMA_VERSION = 1;
export const TOOL_NAME = "gamezero-drive-import";

const GOOGLE_TYPE_LABELS = {
  "application/vnd.google-apps.form": "Google Forms",
  "application/vnd.google-apps.site": "Google Sites",
  "application/vnd.google-apps.map": "Google My Maps",
  "application/vnd.google-apps.shortcut": "shortcut",
  "application/vnd.google-apps.vid": "Google Vids",
};

function shortId(id) {
  return String(id)
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 8)
    .toLowerCase();
}

/** Allocate unique (case-insensitive) paths; later claimants get an ID suffix. */
class PathAllocator {
  constructor() {
    this.claims = new Map();
  }

  claim(path, id) {
    let candidate = path;
    const lastSlash = path.lastIndexOf("/");
    const dir = path.slice(0, lastSlash + 1);
    const base = path.slice(lastSlash + 1);
    let attempt = 0;
    while (
      this.claims.has(candidate.toLowerCase()) &&
      this.claims.get(candidate.toLowerCase()) !== id
    ) {
      attempt += 1;
      const suffix = attempt === 1 ? shortId(id) : `${shortId(id)}${attempt}`;
      candidate = `${dir}${withSuffix(base, suffix)}`;
    }
    this.claims.set(candidate.toLowerCase(), id);
    return candidate;
  }
}

function previousOwnership(previousManifest) {
  const owned = new Map();
  for (const entry of previousManifest?.entries ?? []) {
    for (const output of entry.outputs ?? []) {
      if (output.sortedPath) owned.set(output.sortedPath.toLowerCase(), entry.id);
      if (output.sortedDir) owned.set(output.sortedDir.toLowerCase(), entry.id);
    }
  }
  return owned;
}

function excludedBy(drivePath, folders, patterns) {
  const candidates = [drivePath];
  for (let i = 1; i <= folders.length; i += 1) candidates.push(folders.slice(0, i).join("/"));
  for (const { glob, regExp } of patterns) {
    if (candidates.some((candidate) => regExp.test(candidate))) return glob;
  }
  return null;
}

function exportFormatsFor(entry, config) {
  return config.exports[entry.mimeType] ?? null;
}

function statusAgainst(previousEntry, entry, outputs, repoRoot) {
  if (!previousEntry) return "new";
  const sameSource =
    previousEntry.modifiedTime === entry.modifiedTime &&
    (previousEntry.md5Checksum ?? null) === (entry.md5Checksum ?? null) &&
    (previousEntry.version ?? null) === (entry.version ?? null);
  if (!sameSource) return "updated";
  const previousPaths = new Set();
  for (const output of previousEntry.outputs ?? []) {
    if (output.result !== "written" && output.result !== "unchanged") return "updated";
    for (const key of ["rawPath", "sortedPath", "rawDir", "sortedDir"]) {
      if (output[key]) previousPaths.add(output[key]);
    }
  }
  for (const output of outputs) {
    for (const key of ["rawPath", "sortedPath", "rawDir", "sortedDir"]) {
      if (!output[key]) continue;
      if (!previousPaths.has(output[key]) || !existsSync(resolveInside(repoRoot, output[key])))
        return "updated";
    }
  }
  return "unchanged";
}

/**
 * @param {{ root: object, entries: object[] }} tree output of traverseFolder
 * @param {{ config: object, rules: object, repoRoot: string, previousManifest?: object, mode: "dry-run" | "import" }} options
 */
export function buildPlan(tree, { config, rules, repoRoot, previousManifest = null, mode }) {
  const { output, limits } = config;
  const rawRoot = `${output.rawDir}/${safeSegment(tree.root.id)}`;
  const maxBytes = Math.floor(limits.maxFileSizeMB * 1024 * 1024);
  const excludePatterns = config.exclude.map((glob) => ({ glob, regExp: globToRegExp(glob) }));
  const rawPaths = new PathAllocator();
  const sortedPaths = new PathAllocator();
  const owned = previousOwnership(previousManifest);
  const previousById = new Map((previousManifest?.entries ?? []).map((entry) => [entry.id, entry]));
  const folderRawDirs = new Map([[tree.root.id, rawRoot]]);

  const planned = tree.entries.map((entry) => {
    const item = {
      id: entry.id,
      name: entry.name,
      ...(entry.originalName !== entry.name ? { originalName: entry.originalName } : {}),
      mimeType: entry.mimeType,
      kind: entry.kind,
      isFolder: entry.isFolder,
      parentId: entry.parentId,
      parents: entry.parents,
      drivePath: entry.drivePath,
      depth: entry.depth,
      modifiedTime: entry.modifiedTime,
      createdTime: entry.createdTime,
      size: entry.size,
      md5Checksum: entry.md5Checksum,
      version: entry.version,
      webViewLink: entry.webViewLink,
      description: entry.description,
      shortcut: entry.shortcut,
      image: entry.image,
      video: entry.video,
      category: null,
      rule: null,
      reason: null,
      action: "skip",
      status: null,
      skipReason: null,
      outputs: [],
    };

    const parentRaw = folderRawDirs.get(entry.parentId) ?? rawRoot;

    if (entry.isFolder) {
      const rawDir = rawPaths.claim(`${parentRaw}/${safeSegment(entry.name)}`, entry.id);
      folderRawDirs.set(entry.id, rawDir);
      const excluded = excludedBy(entry.drivePath, entry.folders, excludePatterns);
      item.action = entry.error ? "skip" : "folder";
      item.skipReason = entry.error ?? (excluded ? `excluded by "${excluded}"` : null);
      item.rawDir = output.writeRaw && !entry.error && !excluded ? rawDir : null;
      return item;
    }

    const skip = (reason) => {
      item.action = "skip";
      item.skipReason = reason;
      return item;
    };

    if (entry.error) return skip(entry.error);
    if (entry.duplicateOf)
      return skip(`duplicate of ${entry.duplicateOf} (shortcut or multiple parents)`);
    const excluded = excludedBy(entry.drivePath, entry.folders, excludePatterns);
    if (excluded) return skip(`excluded by "${excluded}"`);

    const classification = classify(entry, rules);
    item.rule = classification.ruleId;
    item.reason = classification.reason;
    if (classification.skip) return skip(classification.reason);
    item.category = classification.category;
    if (!entry.canDownload) return skip("downloads are disabled for this file by its owner");

    const sortedDir = [
      classification.destinationDir,
      ...classification.subfolders.map((folder) => slugify(folder, "folder")),
    ].join("/");
    const native = isGoogleNative(entry.mimeType);
    let formats;
    if (native) {
      formats = exportFormatsFor(entry, config);
      if (!formats || formats.length === 0) {
        const label = GOOGLE_TYPE_LABELS[entry.mimeType] ?? entry.mimeType;
        return skip(
          `${label} files cannot be exported through the Drive API (no export format configured)`,
        );
      }
      item.action = "export";
    } else {
      if (entry.size !== null && entry.size > maxBytes) {
        return skip(
          `size ${entry.size} bytes exceeds limits.maxFileSizeMB (${limits.maxFileSizeMB})`,
        );
      }
      const ext = binaryExtension(entry);
      formats = [{ mimeType: entry.mimeType, extension: ext, original: true }];
      item.action = "download";
    }

    const stem = native ? entry.name : splitExtension(entry.name).stem;
    item.outputs = formats.map((format, index) => {
      const planOutput = {
        format: format.original ? "original" : format.extension,
        mimeType: format.mimeType,
        extension: format.extension,
        ...(format.fallbacks?.length ? { fallbacks: format.fallbacks } : {}),
        ...(format.perSheet ? { perSheet: true } : {}),
        primary: index === 0,
        rawPath: null,
        sortedPath: null,
      };

      if (format.perSheet) {
        delete planOutput.rawPath;
        delete planOutput.sortedPath;
        planOutput.rawDir = output.writeRaw
          ? rawPaths.claim(`${parentRaw}/${safeSegment(entry.name)}.tabs`, entry.id)
          : null;
        planOutput.sortedDir =
          output.writeSorted && index === 0
            ? sortedPaths.claim(`${sortedDir}/${slugify(stem, "sheet")}`, entry.id)
            : null;
      } else {
        const rawName = format.original
          ? safeSegment(
              splitExtension(entry.name).ext || !format.extension
                ? entry.name
                : `${entry.name}.${format.extension}`,
            )
          : safeFileName(entry.name, format.extension);
        planOutput.rawPath = output.writeRaw
          ? rawPaths.claim(`${parentRaw}/${rawName}`, entry.id)
          : null;
        planOutput.sortedPath =
          output.writeSorted && index === 0
            ? sortedPaths.claim(`${sortedDir}/${slugFileName(stem, format.extension)}`, entry.id)
            : null;
      }

      // Sorted destinations may already hold files that this importer did not write.
      const sortedKey = planOutput.sortedPath
        ? "sortedPath"
        : planOutput.sortedDir
          ? "sortedDir"
          : null;
      if (sortedKey) {
        const target = planOutput[sortedKey];
        const ownedBy = owned.get(target.toLowerCase());
        if (existsSync(resolveInside(repoRoot, target)) && ownedBy !== entry.id) {
          planOutput.conflict = ownedBy
            ? `owned by Drive entry ${ownedBy}`
            : "existing repository file";
          if (output.conflictPolicy === "skip") {
            planOutput[sortedKey] = null;
            planOutput.conflictResolution = "skipped";
          } else if (output.conflictPolicy === "rename") {
            const base = `drive_${shortId(entry.id)}`;
            let candidate = withSuffix(target, base);
            for (
              let n = 2;
              existsSync(resolveInside(repoRoot, candidate)) &&
              owned.get(candidate.toLowerCase()) !== entry.id;
              n += 1
            ) {
              candidate = withSuffix(target, `${base}_${n}`);
            }
            planOutput[sortedKey] = sortedPaths.claim(candidate, entry.id);
            planOutput.conflictResolution = "renamed";
          } else {
            planOutput.conflictResolution = "overwrite";
          }
        }
      }
      return planOutput;
    });

    if (
      !item.outputs.some(
        (planOutput) =>
          planOutput.rawPath || planOutput.sortedPath || planOutput.rawDir || planOutput.sortedDir,
      )
    ) {
      return skip("nothing to write (raw and sorted output disabled or blocked by conflicts)");
    }
    item.status = statusAgainst(previousById.get(entry.id), item, item.outputs, repoRoot);
    return item;
  });

  const currentIds = new Set(planned.map((entry) => entry.id));
  const removedSinceLastImport = (previousManifest?.entries ?? [])
    .filter((entry) => !currentIds.has(entry.id))
    .map((entry) => ({
      id: entry.id,
      drivePath: entry.drivePath,
      outputs: (entry.outputs ?? []).flatMap((o) =>
        [o.rawPath, o.sortedPath, o.rawDir, o.sortedDir].filter(Boolean),
      ),
    }));

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    tool: TOOL_NAME,
    mode,
    generatedAt: new Date().toISOString(),
    source: {
      folderId: tree.root.id,
      folderUrl: tree.root.webViewLink ?? `https://drive.google.com/drive/folders/${tree.root.id}`,
      rootName: tree.root.name,
      rootModifiedTime: tree.root.modifiedTime,
      driveId: tree.root.driveId,
    },
    settings: {
      rawRoot: output.writeRaw ? rawRoot : null,
      writeRaw: output.writeRaw,
      writeSorted: output.writeSorted,
      conflictPolicy: output.conflictPolicy,
      maxFileSizeMB: limits.maxFileSizeMB,
      rulesFile: config.rulesFile,
      exclude: config.exclude,
    },
    summary: summarize(planned),
    entries: planned,
    removedSinceLastImport,
  };
}

export function summarize(entries) {
  const summary = {
    folders: 0,
    files: 0,
    toDownload: 0,
    toExport: 0,
    skipped: 0,
    unchanged: 0,
    knownBytes: 0,
    byCategory: {},
    byAction: {},
    results: {},
  };
  for (const entry of entries) {
    summary.byAction[entry.action] = (summary.byAction[entry.action] ?? 0) + 1;
    if (entry.isFolder) {
      summary.folders += 1;
      continue;
    }
    summary.files += 1;
    if (entry.action === "skip") summary.skipped += 1;
    if (entry.action === "download") summary.toDownload += 1;
    if (entry.action === "export") summary.toExport += 1;
    if (entry.status === "unchanged") summary.unchanged += 1;
    if (entry.action !== "skip" && entry.size) summary.knownBytes += entry.size;
    if (entry.category && entry.action !== "skip")
      summary.byCategory[entry.category] = (summary.byCategory[entry.category] ?? 0) + 1;
    for (const output of entry.outputs) {
      if (output.result) summary.results[output.result] = (summary.results[output.result] ?? 0) + 1;
    }
  }
  return summary;
}
