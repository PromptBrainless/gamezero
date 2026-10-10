/**
 * Configuration loading for the Drive importer.
 *
 * Precedence (highest first): CLI flags > environment variables > config
 * file > built-in defaults. All repository paths are relative to the repo
 * root; secrets are never read from the config file itself, only paths to
 * credential files that live outside git (see README "Authentication").
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertRepoRelativeDir } from "./paths.mjs";

export const TOOL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_ROOT = resolve(TOOL_DIR, "..", "..");
export const DEFAULT_CONFIG_FILE = join(TOOL_DIR, "drive-import.config.json");

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export const DEFAULT_EXPORTS = {
  "application/vnd.google-apps.document": [
    {
      mimeType: "text/markdown",
      extension: "md",
      fallbacks: [{ mimeType: "text/plain", extension: "txt" }],
    },
    { mimeType: DOCX, extension: "docx" },
  ],
  "application/vnd.google-apps.spreadsheet": [
    { mimeType: "text/csv", extension: "csv", perSheet: true },
    { mimeType: XLSX, extension: "xlsx" },
  ],
  "application/vnd.google-apps.presentation": [
    { mimeType: "application/pdf", extension: "pdf" },
    { mimeType: PPTX, extension: "pptx" },
  ],
  "application/vnd.google-apps.drawing": [
    { mimeType: "image/png", extension: "png" },
    { mimeType: "image/svg+xml", extension: "svg" },
  ],
  "application/vnd.google-apps.script": [
    { mimeType: "application/vnd.google-apps.script+json", extension: "json" },
  ],
  "application/vnd.google-apps.jam": [{ mimeType: "application/pdf", extension: "pdf" }],
};

export const DEFAULT_CONFIG = {
  source: {
    folder: "",
    followShortcuts: true,
  },
  auth: {
    method: "auto",
    oauthClientFile: "tools/import/.secrets/oauth-client.json",
    tokenFile: "~/.config/gamezero/drive-oauth-token.json",
    serviceAccountKeyFile: "",
  },
  rulesFile: "tools/import/mapping-rules.json",
  output: {
    rawDir: "imports/drive/raw",
    stagingDir: "imports/drive/.staging",
    manifestFile: "imports/drive/manifest.json",
    manifestCsv: true,
    writeRaw: true,
    writeSorted: true,
    conflictPolicy: "rename",
  },
  limits: {
    maxFileSizeMB: 500,
    concurrency: 4,
    maxRetries: 6,
  },
  exclude: ["**/.DS_Store", "**/Thumbs.db", "**/desktop.ini", "**/~$*", "**/.~lock.*"],
  exports: DEFAULT_EXPORTS,
};

const CONFLICT_POLICIES = new Set(["rename", "skip", "overwrite"]);
const AUTH_METHODS = new Set(["auto", "oauth", "service-account", "access-token", "api-key"]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function merge(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override))
    return override === undefined ? base : override;
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (key.startsWith("$")) continue;
    // Export lists are replaced per MIME type, never merged element-wise.
    result[key] = key === "exports" ? { ...base[key], ...value } : merge(base[key], value);
  }
  return result;
}

export function expandHome(path) {
  if (typeof path !== "string" || path === "") return path;
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return path;
}

/** Resolve a credential/config path: "~" expands, relative paths are from the repo root. */
export function resolveUserPath(path, root = REPO_ROOT) {
  if (!path) return "";
  const expanded = expandHome(path);
  return isAbsolute(expanded) ? expanded : resolve(root, expanded);
}

function validateExports(exports) {
  if (!isPlainObject(exports))
    throw new Error('config "exports" must be an object keyed by Google MIME type.');
  for (const [mime, formats] of Object.entries(exports)) {
    if (!Array.isArray(formats)) throw new Error(`config exports["${mime}"] must be an array.`);
    for (const [index, format] of formats.entries()) {
      const where = `config exports["${mime}"][${index}]`;
      const candidates = [format, ...(format?.fallbacks ?? [])];
      for (const candidate of candidates) {
        if (
          !isPlainObject(candidate) ||
          typeof candidate.mimeType !== "string" ||
          !candidate.mimeType
        ) {
          throw new Error(`${where} needs a mimeType.`);
        }
        if (
          typeof candidate.extension !== "string" ||
          !/^[a-z0-9]{1,10}$/.test(candidate.extension)
        ) {
          throw new Error(`${where} needs a lower-case alphanumeric extension.`);
        }
      }
      if (format.perSheet && format.mimeType !== "text/csv") {
        throw new Error(`${where}: perSheet is only supported for text/csv.`);
      }
    }
  }
}

/** Validate a merged config and normalise its paths. Throws on invalid values. */
export function validateConfig(config) {
  const output = config.output;
  for (const key of ["rawDir", "stagingDir", "manifestFile"]) {
    output[key] = assertRepoRelativeDir(output[key], `output.${key}`);
  }
  if (!CONFLICT_POLICIES.has(output.conflictPolicy)) {
    throw new Error(`output.conflictPolicy must be one of ${[...CONFLICT_POLICIES].join(", ")}.`);
  }
  if (!AUTH_METHODS.has(config.auth.method)) {
    throw new Error(`auth.method must be one of ${[...AUTH_METHODS].join(", ")}.`);
  }
  const { maxFileSizeMB, concurrency, maxRetries } = config.limits;
  if (!(Number.isFinite(maxFileSizeMB) && maxFileSizeMB > 0))
    throw new Error("limits.maxFileSizeMB must be > 0.");
  if (!(Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 16)) {
    throw new Error("limits.concurrency must be an integer between 1 and 16.");
  }
  if (!(Number.isInteger(maxRetries) && maxRetries >= 0 && maxRetries <= 12)) {
    throw new Error("limits.maxRetries must be an integer between 0 and 12.");
  }
  if (!Array.isArray(config.exclude) || config.exclude.some((item) => typeof item !== "string")) {
    throw new Error("exclude must be an array of glob strings.");
  }
  validateExports(config.exports);
  return config;
}

/**
 * Build the effective configuration.
 * @param {{ configFile?: string, overrides?: object, env?: NodeJS.ProcessEnv }} options
 */
export function loadConfig({ configFile, overrides = {}, env = process.env } = {}) {
  let fileConfig = {};
  const file = configFile ? resolveUserPath(configFile, process.cwd()) : DEFAULT_CONFIG_FILE;
  if (configFile || existsSync(file)) {
    try {
      fileConfig = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      throw new Error(`Cannot read config ${file}: ${error.message}`);
    }
  }

  const envConfig = { source: {}, auth: {} };
  if (env.GAMEZERO_DRIVE_FOLDER) envConfig.source.folder = env.GAMEZERO_DRIVE_FOLDER;
  if (env.GOOGLE_OAUTH_CLIENT_FILE) envConfig.auth.oauthClientFile = env.GOOGLE_OAUTH_CLIENT_FILE;
  if (env.GAMEZERO_DRIVE_TOKEN_FILE) envConfig.auth.tokenFile = env.GAMEZERO_DRIVE_TOKEN_FILE;
  if (env.GOOGLE_APPLICATION_CREDENTIALS)
    envConfig.auth.serviceAccountKeyFile = env.GOOGLE_APPLICATION_CREDENTIALS;

  const merged = merge(
    merge(merge(structuredClone(DEFAULT_CONFIG), fileConfig), envConfig),
    overrides,
  );
  merged.configFile = configFile || existsSync(file) ? file : null;
  return validateConfig(merged);
}
