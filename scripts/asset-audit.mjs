import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, resolve, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const formats = new Set([
  ".svg",
  ".svgz",
  ".eps",
  ".ai",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".bmp",
  ".wav",
  ".ogg",
  ".mp3",
  ".m4a",
  ".webm",
  ".flac",
  ".aiff",
  ".aif",
  ".opus",
  ".aac",
]);
const audioFormats = new Set([
  ".wav",
  ".ogg",
  ".mp3",
  ".m4a",
  ".webm",
  ".flac",
  ".aiff",
  ".aif",
  ".opus",
  ".aac",
]);
const textFormats = new Set([
  ".gd",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".tscn",
  ".tres",
  ".godot",
  ".cfg",
  ".html",
  ".css",
  ".json",
]);
const buildPath = (path) => /^(?:\.vercel\/output|dist|build|exports)\//.test(path);

export function imageMetadata(buffer, format) {
  if (format === ".svg") {
    const root = buffer.toString("utf8").match(/<svg\b[^>]*>/i)?.[0];
    if (!root) throw new Error("SVG root is missing");
    const attribute = (name) =>
      root.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? null;
    return {
      width: attribute("width"),
      height: attribute("height"),
      viewBox: attribute("viewBox"),
    };
  }
  if (
    format === ".png" &&
    buffer.length >= 24 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (
    format === ".gif" &&
    buffer.length >= 10 &&
    /^GIF8[79]a/.test(buffer.toString("ascii", 0, 6))
  ) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if ([".jpg", ".jpeg"].includes(format) && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const size = buffer.readUInt16BE(offset + 2);
      if (size < 2 || offset + 2 + size > buffer.length) throw new Error("Truncated JPEG segment");
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        )
      ) {
        if (size < 7) throw new Error("Truncated JPEG frame");
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += size + 2;
    }
    throw new Error("JPEG dimensions were not found");
  }
  return {
    unavailable: `No built-in metadata reader for ${format}; inspect with an appropriate tool.`,
  };
}

export function archiveEntries(listing) {
  return listing.split("\n").flatMap((line) => {
    const match = line.match(/^\S+\s+\S+\s+\S+\s+(\d+)\s+\S+\s+\d+\s+\S+\s+\S+\s+\S+\s+(.+)$/);
    if (!match || match[2].endsWith("/")) return [];
    const path = match[2];
    return [
      {
        path,
        bytes: Number(match[1]),
        format: extname(path).slice(1).toLowerCase(),
        resourceFork: /(?:^|\/)__MACOSX\/|(?:^|\/)\._/.test(path),
      },
    ];
  });
}

const MAX_ARCHIVE_DEPTH = 5;

function listArchiveRecursive(archivePath, prefix = "", depth = 0) {
  if (depth > MAX_ARCHIVE_DEPTH) {
    return { entries: [], error: "max recursion depth exceeded" };
  }
  let listing;
  try {
    listing = execFileSync("unzip", ["-Z", "-l", archivePath], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    return { entries: [], error: String(err.message || err) };
  }
  const rawEntries = archiveEntries(listing);
  const entries = [];
  for (const entry of rawEntries) {
    const fullPath = prefix ? `${prefix}!${entry.path}` : entry.path;
    if (entry.resourceFork) {
      entries.push({ ...entry, path: fullPath, resourceFork: true });
      continue;
    }
    if (entry.format === "zip") {
      // Extract nested ZIP to temp and recurse
      const tempDir = mkdtempSync(join(tmpdir(), "asset-audit-"));
      const tempZip = join(tempDir, "nested.zip");
      try {
        const extract = spawnSync("unzip", ["-p", archivePath, entry.path], {
          encoding: "buffer",
          maxBuffer: 64 * 1024 * 1024,
        });
        if (extract.status !== 0 || !extract.stdout?.length) {
          entries.push({
            path: fullPath,
            bytes: entry.bytes,
            format: "zip",
            resourceFork: false,
            status: "nested archive extraction failed; inventory pending",
            error: extract.stderr?.toString() || "extraction failed",
          });
          continue;
        }
        writeFileSync(tempZip, extract.stdout);
        const nested = listArchiveRecursive(tempZip, fullPath, depth + 1);
        entries.push({
          path: fullPath,
          bytes: entry.bytes,
          format: "zip",
          resourceFork: false,
          nested: true,
          nestedEntries: nested.entries,
          nestedError: nested.error,
          status: nested.error
            ? "nested archive; inventory incomplete"
            : "nested archive; members inventoried (not approved)",
        });
        // Flatten nested media into the parent listing for summary, but keep them marked
        for (const ne of nested.entries) {
          if (formats.has(`.${ne.format}`) || ne.format === "zip") {
            entries.push({ ...ne, path: ne.path, nested: true });
          }
        }
      } catch (err) {
        entries.push({
          path: fullPath,
          bytes: entry.bytes,
          format: "zip",
          resourceFork: false,
          status: "nested archive error",
          error: String(err.message || err),
        });
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    } else {
      entries.push({ ...entry, path: fullPath });
    }
  }
  return { entries };
}

function scanArchives(root, files) {
  return files
    .filter((path) => path.endsWith(".zip"))
    .map((path) => {
      const abs = resolve(root, path);
      const { entries, error } = listArchiveRecursive(abs);
      const media = entries.filter((e) => formats.has(`.${e.format}`) && !e.resourceFork);
      const nestedZips = entries.filter((e) => e.format === "zip" && !e.resourceFork);
      return {
        path,
        bytes: statSync(abs).size,
        status: error
          ? "archived input; listing error"
          : "archived input; not integrated or approved",
        error,
        nestedArchives: nestedZips.map((e) => ({
          path: e.path,
          bytes: e.bytes,
          status: e.status || "nested archive; members inventoried (not approved)",
          error: e.error || e.nestedError,
        })),
        licenseCandidates: entries
          .filter(
            (entry) =>
              !entry.resourceFork && /(?:license|licence|copyright|attribution)/i.test(entry.path),
          )
          .map((entry) => entry.path),
        assets: media.map((entry) => ({
          path: entry.path,
          bytes: entry.bytes,
          format: entry.format,
          resourceFork: !!entry.resourceFork,
          nested: !!entry.nested,
          status: entry.resourceFork
            ? "platform metadata; not a usable asset"
            : entry.nested
              ? "nested archived; not runtime-referenced / not approved"
              : "archived; not runtime-referenced",
          metadata:
            "Dimensions, duration, codec, content duplicates and rights require inspection of this archive member before integration. Nested contents are inventory-only.",
        })),
      };
    });
}

export function scanAssets(root, trackedFiles) {
  const files = [...trackedFiles].sort();
  const assets = files.filter((path) => formats.has(extname(path).toLowerCase()));
  const tracked = new Set(files);
  const referenceFiles = files.filter(
    (path) =>
      textFormats.has(extname(path)) &&
      /^(?:godot|src|public|server)\//.test(path) &&
      !/(?:\.test\.|\/tests\/)/.test(path),
  );
  const references = new Map(assets.map((path) => [path, []]));
  const missing = [];
  const dynamic = [];
  const addReference = (path, reference) => {
    const entries = references.get(path);
    if (
      entries &&
      !entries.some(
        (entry) =>
          entry.file === reference.file &&
          entry.line === reference.line &&
          entry.kind === reference.kind,
      )
    )
      entries.push(reference);
  };
  for (const file of referenceFiles) {
    const lines = readFileSync(resolve(root, file), "utf8").split("\n");
    for (const [index, line] of lines.entries()) {
      const reference = { file, line: index + 1, kind: "literal" };
      for (const match of line.matchAll(
        /(?<=["'`(=])(?:res:\/\/|\/)[\w./%-]+\.(?:svg|svgz|eps|ai|pdf|png|jpe?g|gif|webp|avif|bmp|wav|ogg|mp3|m4a|webm|flac|aiff?|opus|aac)(?=[#?"'`\s)<]|$)/gi,
      )) {
        const value = match[0];
        const path = value.startsWith("res://") ? `godot/${value.slice(6)}` : `public${value}`;
        if (tracked.has(path)) addReference(path, reference);
        else missing.push({ ...reference, value, expectedPath: path, status: "fehlt" });
      }
      for (const match of line.matchAll(
        /(?<=["'`])(?:res:\/\/|\/)[^"'`\n]*\$\{[^"'`\n]*\}[^"'`\n]*/g,
      )) {
        const expression = match[0];
        const prefix = expression.slice(0, expression.indexOf("${"));
        const pathPrefix = prefix.startsWith("res://")
          ? `godot/${prefix.slice(6)}`
          : `public${prefix}`;
        const candidates = assets.filter((path) => path.startsWith(pathPrefix));
        if (
          !formats.has(extname(expression).toLowerCase()) &&
          (prefix === "/" || !candidates.length)
        )
          continue;
        dynamic.push({
          ...reference,
          expression,
          candidates,
          status: "requires runtime expansion check",
        });
        for (const path of candidates)
          addReference(path, { ...reference, kind: "dynamic-candidate" });
      }
    }
  }
  const hashes = new Map();
  const records = assets.map((path) => {
    const buffer = readFileSync(resolve(root, path));
    const format = extname(path).toLowerCase();
    const hash = createHash("sha256").update(buffer).digest("hex");
    const peers = hashes.get(hash) ?? [];
    peers.push(path);
    hashes.set(hash, peers);
    let metadata;
    if (audioFormats.has(format)) {
      const probe = spawnSync(
        "ffprobe",
        ["-v", "error", "-show_format", "-show_streams", "-of", "json", resolve(root, path)],
        { encoding: "utf8" },
      );
      if (probe.error?.code === "ENOENT")
        metadata = {
          unavailable:
            "ffprobe is not installed; duration, codec, loudness and loopability are unverified.",
        };
      else if (probe.error) throw probe.error;
      else if (probe.status !== 0) throw new Error(`ffprobe failed for ${path}: ${probe.stderr}`);
      else metadata = JSON.parse(probe.stdout);
    } else metadata = imageMetadata(buffer, format);
    const refs = references.get(path);
    const literal = refs.some((ref) => ref.kind === "literal");
    return {
      path,
      format: format.slice(1),
      bytes: buffer.length,
      sha256: hash,
      metadata,
      role: buildPath(path)
        ? "build-output"
        : /^(?:screenshots|artifacts)\//.test(path)
          ? "evidence-or-production-input"
          : path.startsWith(".grok/") || path.startsWith("public/__grok/")
            ? "platform"
            : "source",
      status: buildPath(path)
        ? "Duplikat/Build-Ausgabe"
        : literal
          ? "referenziert"
          : "nicht referenziert",
      runtimeAnchored: literal,
      references: refs,
      referenceCoverage: literal
        ? "literal runtime reference; load not verified"
        : refs.length
          ? "dynamic candidates only; confirmed use is unresolved"
          : "no reference found by supported scan patterns",
      source: path.startsWith("artifacts/imagine_images/")
        ? "Repository generation output; provenance and usage rights require review."
        : "Tracked repository file; external provenance not established.",
      license: "unverified; no per-asset license approval recorded",
      approval:
        "not approved by this scan; native load, visual/audio review and rights evidence required",
    };
  });
  for (const record of records)
    record.duplicates = hashes.get(record.sha256).filter((path) => path !== record.path);
  const archives = scanArchives(root, files);
  return {
    schemaVersion: 1,
    scope:
      "All tracked vector, raster and audio formats, including platform, attachments, evidence and build outputs. References scan source runtime scenes, scripts, UI, themes and project/export configuration under godot/, src/, public/ and server/, excluding test fixtures and production plans. Static references are not runtime acceptance; dynamic candidates are not confirmed loads.",
    summary: {
      assets: records.length,
      audio: records.filter((record) => audioFormats.has(`.${record.format}`)).length,
      vectors: records.filter((record) =>
        ["svg", "svgz", "eps", "ai", "pdf"].includes(record.format),
      ).length,
      archives: archives.length,
      archivedAssets: archives.reduce(
        (sum, archive) => sum + archive.assets.filter((entry) => !entry.resourceFork).length,
        0,
      ),
      archivedAudio: archives.reduce(
        (sum, archive) =>
          sum +
          archive.assets.filter(
            (entry) => !entry.resourceFork && audioFormats.has(`.${entry.format}`),
          ).length,
        0,
      ),
      missingLiteralReferences: missing.length,
      dynamicExpressions: dynamic.length,
    },
    assets: records,
    archives,
    missingReferences: missing,
    dynamicReferences: dynamic,
    gaps: [
      "No automatic asset approval or placeholder inference.",
      "License/attribution, audio loudness/loopability and genuine rendered tests require separate evidence.",
      "Nested ZIP containers are recursively inventoried (inventory-only; not integrated or approved). Resource forks and extraction failures are explicitly marked.",
      "Constructed paths outside the recognized template syntax require manual review.",
    ],
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  const output = resolve(root, "artifacts/art/asset-audit.json");
  const serialized = `${JSON.stringify(scanAssets(root, files), null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== serialized)
      throw new Error("Asset audit is stale; run npm run assets:audit.");
    console.log("Tracked asset audit is reproducible and current.");
  } else {
    writeFileSync(output, serialized);
    console.log(`Asset audit written: ${output}`);
  }
}
