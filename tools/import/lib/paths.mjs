/**
 * File-name and path helpers. Everything that turns a Drive name into a path
 * on disk goes through here so that no Drive-controlled string can escape the
 * repository or produce names Godot / Windows / git cannot handle.
 */
import { isAbsolute, relative, resolve, sep } from "node:path";

const TRANSLITERATION = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  Ä: "Ae",
  Ö: "Oe",
  Ü: "Ue",
  ß: "ss",
  ẞ: "SS",
  æ: "ae",
  Æ: "AE",
  ø: "o",
  Ø: "O",
  œ: "oe",
  Œ: "OE",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  þ: "th",
  Þ: "TH",
};

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
const MAX_SEGMENT_LENGTH = 120;

/** German-aware ASCII folding: "Übersicht Größe" -> "Uebersicht Groesse". */
export function foldToAscii(value) {
  return Array.from(String(value), (char) => TRANSLITERATION[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Lower-case, space-separated words used for rule matching.
 * "HeroIdle_v2-Final" -> "hero idle v2 final".
 */
export function normalizeForMatching(value) {
  return foldToAscii(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function trimLength(value, max) {
  return value.length > max ? value.slice(0, max).replace(/[_.-]+$/, "") : value;
}

/** Godot/git friendly snake_case segment: "Held Idle (v2)" -> "held_idle_v2". */
export function slugify(value, fallback = "unnamed") {
  let slug = foldToAscii(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  slug = trimLength(slug, MAX_SEGMENT_LENGTH);
  if (slug === "") slug = fallback;
  if (WINDOWS_RESERVED.test(slug)) slug = `_${slug}`;
  return slug;
}

/** Split "Sheet.Final.PNG" into { stem: "Sheet.Final", ext: "png" }. */
export function splitExtension(name) {
  const match = /^(.*[^.])\.([A-Za-z0-9]{1,10})$/.exec(String(name));
  if (!match) return { stem: String(name), ext: "" };
  return { stem: match[1], ext: match[2].toLowerCase() };
}

/** Slugified file name: ("Held Idle", "PNG") -> "held_idle.png". */
export function slugFileName(stem, extension) {
  const base = slugify(stem, "file");
  const ext = String(extension ?? "").toLowerCase();
  return ext ? `${base}.${ext}` : base;
}

/** Raw-mirror file name: keeps the readable stem, appends the extension. */
export function safeFileName(stem, extension) {
  const ext = String(extension ?? "").toLowerCase();
  const base = safeSegment(stem, "file");
  return ext ? `${base}.${ext}` : base;
}

/**
 * Keep the original Drive name readable (case, spaces, umlauts) but make it a
 * single safe path segment. Used for the raw mirror.
 */
export function safeSegment(value, fallback = "unnamed") {
  let segment = String(value)
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();
  if (segment === "" || segment === "." || segment === "..") segment = fallback;
  if (WINDOWS_RESERVED.test(splitExtension(segment).stem)) segment = `_${segment}`;
  if (segment.length > 180) {
    const { stem, ext } = splitExtension(segment);
    segment = `${stem.slice(0, 170)}${ext ? `.${ext}` : ""}`;
  }
  return segment;
}

/** Add a disambiguating suffix before the extension: a.png -> a__1abc2def.png */
export function withSuffix(fileName, suffix) {
  const { stem, ext } = splitExtension(fileName);
  return ext ? `${stem}__${suffix}.${ext}` : `${fileName}__${suffix}`;
}

export function isInside(parent, child) {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** Join a repository-relative POSIX path onto root and refuse escapes. */
export function resolveInside(root, repoRelativePath) {
  if (typeof repoRelativePath !== "string" || repoRelativePath === "") {
    throw new Error("Empty destination path.");
  }
  if (isAbsolute(repoRelativePath) || repoRelativePath.split("/").includes("..")) {
    throw new Error(
      `Destination must be a relative path inside the repository: ${repoRelativePath}`,
    );
  }
  const absolute = resolve(root, ...repoRelativePath.split("/"));
  if (!isInside(root, absolute) || absolute === resolve(root)) {
    throw new Error(`Destination escapes the repository: ${repoRelativePath}`);
  }
  return absolute;
}

/** Validate a configured repo-relative directory (no "..", no absolute, no .git). */
export function assertRepoRelativeDir(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty repository-relative path.`);
  }
  const parts = value.split(/[\\/]+/).filter(Boolean);
  if (isAbsolute(value) || parts.includes("..") || parts.length === 0) {
    throw new Error(`${label} must stay inside the repository: ${value}`);
  }
  if (parts[0] === ".git" || parts[0] === "node_modules") {
    throw new Error(`${label} must not point into ${parts[0]}/: ${value}`);
  }
  return parts.join("/");
}

export function toPosix(path) {
  return path.split(sep).join("/");
}

/** Replace (or add) the extension of a POSIX path; null/empty paths pass through. */
export function replaceExtension(path, extension) {
  if (!path) return path;
  const slash = path.lastIndexOf("/");
  const dot = path.lastIndexOf(".");
  return `${dot > slash ? path.slice(0, dot) : path}.${extension}`;
}

/** Lower-cased extension of a POSIX path's last segment, or "" if none. */
export function pathExtension(path) {
  if (!path) return "";
  const slash = path.lastIndexOf("/");
  const dot = path.lastIndexOf(".");
  return dot > slash ? path.slice(dot + 1).toLowerCase() : "";
}
