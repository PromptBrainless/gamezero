/**
 * Rule-based classification of Drive entries into GameZero categories.
 *
 * Rules (see mapping-rules.json) are evaluated in order; the first rule whose
 * conditions all hold wins. Overrides (by Drive ID or Drive-path glob) take
 * precedence over rules.
 */
import { readFileSync } from "node:fs";
import { assertRepoRelativeDir, normalizeForMatching, splitExtension } from "./paths.mjs";
import { binaryExtension, isGoogleNative } from "./media.mjs";

const SUBFOLDER_MODES = new Set(["after-match", "full", "none"]);
const RULE_KEYS = new Set([
  "id",
  "category",
  "description",
  "kinds",
  "extensions",
  "mimeTypes",
  "folderPattern",
  "namePattern",
  "anyPattern",
  "subfolders",
]);

/** Convert a simple glob (**, *, ?) into an anchored, case-insensitive RegExp. */
export function globToRegExp(glob) {
  let source = "";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*") {
      if (glob[i + 1] === "*") {
        i += 1;
        if (glob[i + 1] === "/") {
          i += 1;
          source += "(?:.*/)?";
        } else {
          source += ".*";
        }
      } else {
        source += "[^/]*";
      }
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`, "i");
}

function compilePattern(pattern, where) {
  if (pattern === undefined) return undefined;
  if (typeof pattern !== "string" || pattern === "")
    throw new Error(`${where} must be a non-empty string.`);
  try {
    return new RegExp(pattern, "i");
  } catch (error) {
    throw new Error(`${where} is not a valid regular expression: ${error.message}`);
  }
}

function stringList(value, where) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item === "")) {
    throw new Error(`${where} must be an array of non-empty strings.`);
  }
  return value.map((item) => item.toLowerCase());
}

/** Validate and compile a parsed mapping-rules document. */
export function compileRules(document, source = "mapping rules") {
  if (!document || typeof document !== "object")
    throw new Error(`${source}: expected a JSON object.`);
  const { categories, rules, overrides = [], fallbackCategory = "unsorted" } = document;
  if (!categories || typeof categories !== "object" || Array.isArray(categories)) {
    throw new Error(`${source}: "categories" must be an object.`);
  }

  const compiledCategories = {};
  for (const [name, definition] of Object.entries(categories)) {
    if (!/^[a-z][a-z0-9_]*$/.test(name))
      throw new Error(`${source}: invalid category name "${name}".`);
    if (!definition || typeof definition !== "object")
      throw new Error(`${source}: category ${name} must be an object.`);
    const subfolders = definition.subfolders ?? "after-match";
    if (!SUBFOLDER_MODES.has(subfolders)) {
      throw new Error(`${source}: category ${name} has invalid subfolders mode "${subfolders}".`);
    }
    compiledCategories[name] = {
      name,
      destination: assertRepoRelativeDir(
        definition.destination,
        `${source}: categories.${name}.destination`,
      ),
      description: definition.description ?? "",
      subfolders,
    };
  }
  if (!compiledCategories[fallbackCategory]) {
    throw new Error(`${source}: fallbackCategory "${fallbackCategory}" is not a defined category.`);
  }

  if (!Array.isArray(rules)) throw new Error(`${source}: "rules" must be an array.`);
  const seenIds = new Set();
  const compiledRules = rules.map((rule, index) => {
    const where = `${source}: rules[${index}]`;
    if (!rule || typeof rule !== "object") throw new Error(`${where} must be an object.`);
    for (const key of Object.keys(rule)) {
      if (!RULE_KEYS.has(key)) throw new Error(`${where} has unknown field "${key}".`);
    }
    if (typeof rule.id !== "string" || rule.id === "") throw new Error(`${where}.id is required.`);
    if (seenIds.has(rule.id)) throw new Error(`${where}: duplicate rule id "${rule.id}".`);
    seenIds.add(rule.id);
    if (!compiledCategories[rule.category])
      throw new Error(`${where}: unknown category "${rule.category}".`);
    if (rule.subfolders !== undefined && !SUBFOLDER_MODES.has(rule.subfolders)) {
      throw new Error(`${where}: invalid subfolders mode "${rule.subfolders}".`);
    }
    const compiled = {
      id: rule.id,
      category: rule.category,
      kinds: stringList(rule.kinds, `${where}.kinds`),
      extensions: stringList(rule.extensions, `${where}.extensions`),
      mimeTypes: stringList(rule.mimeTypes, `${where}.mimeTypes`),
      folderPattern: compilePattern(rule.folderPattern, `${where}.folderPattern`),
      namePattern: compilePattern(rule.namePattern, `${where}.namePattern`),
      anyPattern: compilePattern(rule.anyPattern, `${where}.anyPattern`),
      subfolders: rule.subfolders,
    };
    const hasCondition = [
      "kinds",
      "extensions",
      "mimeTypes",
      "folderPattern",
      "namePattern",
      "anyPattern",
    ].some((key) => compiled[key] !== undefined);
    if (!hasCondition) throw new Error(`${where} has no match condition.`);
    return compiled;
  });

  if (!Array.isArray(overrides)) throw new Error(`${source}: "overrides" must be an array.`);
  const compiledOverrides = overrides.map((override, index) => {
    const where = `${source}: overrides[${index}]`;
    if (!override || typeof override !== "object") throw new Error(`${where} must be an object.`);
    const { id, path, category, destination, skip } = override;
    if (!id && !path) throw new Error(`${where} needs "id" or "path".`);
    if (!skip && !category && !destination)
      throw new Error(`${where} needs "category", "destination" or "skip".`);
    if (category && !compiledCategories[category])
      throw new Error(`${where}: unknown category "${category}".`);
    return {
      index,
      id: id ?? undefined,
      pathRegExp: path ? globToRegExp(path) : undefined,
      path,
      category,
      destination: destination
        ? assertRepoRelativeDir(destination, `${where}.destination`)
        : undefined,
      skip: skip === true,
    };
  });

  return {
    categories: compiledCategories,
    rules: compiledRules,
    overrides: compiledOverrides,
    fallbackCategory,
  };
}

export function loadRules(file) {
  let document;
  try {
    document = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read mapping rules ${file}: ${error.message}`);
  }
  return compileRules(document, file);
}

function mimeMatches(patterns, mimeType) {
  const mime = String(mimeType ?? "").toLowerCase();
  return patterns.some((pattern) =>
    pattern.endsWith("*") ? mime.startsWith(pattern.slice(0, -1)) : mime === pattern,
  );
}

/** Index of the outermost folder matching pattern, or -1. */
function outermostFolderMatch(pattern, folders) {
  return folders.findIndex((folder) => pattern.test(folder));
}

/**
 * Evaluate one rule. Returns null on no match, otherwise the index of the
 * outermost folder that satisfied a folder/any pattern (-1 if none did).
 * Subfolders below that folder are kept in the destination ("after-match").
 */
function evaluateRule(rule, facts) {
  if (rule.kinds && !rule.kinds.includes(facts.kind)) return null;
  if (rule.extensions && !rule.extensions.includes(facts.extension)) return null;
  if (rule.mimeTypes && !mimeMatches(rule.mimeTypes, facts.mimeType)) return null;
  let folderIndex = -1;
  if (rule.folderPattern) {
    folderIndex = outermostFolderMatch(rule.folderPattern, facts.folders);
    if (folderIndex === -1) return null;
  }
  if (rule.namePattern && !rule.namePattern.test(facts.name)) return null;
  if (rule.anyPattern) {
    const anyFolder = outermostFolderMatch(rule.anyPattern, facts.folders);
    const nameMatch = rule.anyPattern.test(facts.name);
    if (anyFolder === -1 && !nameMatch) return null;
    if (folderIndex === -1 || (anyFolder !== -1 && anyFolder < folderIndex))
      folderIndex = anyFolder;
  }
  return folderIndex;
}

function subfoldersFor(mode, rawFolders, matchedIndex) {
  if (mode === "none") return [];
  if (mode === "full") return rawFolders;
  return matchedIndex >= 0 ? rawFolders.slice(matchedIndex + 1) : [];
}

/**
 * Classify one file entry.
 * @param {object} entry Drive entry with name, mimeType, kind, folders (names of ancestor folders below root), drivePath, id
 * @param {ReturnType<typeof compileRules>} compiled
 */
export function classify(entry, compiled) {
  const folders = entry.folders ?? [];
  const extension = isGoogleNative(entry.mimeType) ? "" : binaryExtension(entry);
  const stem = isGoogleNative(entry.mimeType) ? entry.name : splitExtension(entry.name).stem;
  const facts = {
    kind: entry.kind,
    extension,
    mimeType: entry.mimeType,
    name: normalizeForMatching(stem),
    folders: folders.map((folder) => normalizeForMatching(folder)),
  };

  for (const override of compiled.overrides) {
    const hit =
      (override.id && override.id === entry.id) ||
      (override.pathRegExp && override.pathRegExp.test(entry.drivePath));
    if (!hit) continue;
    if (override.skip) {
      return {
        skip: true,
        ruleId: `override:${override.index}`,
        reason: `override ${override.id ?? override.path} skips this entry`,
      };
    }
    const category = compiled.categories[override.category ?? compiled.fallbackCategory];
    return {
      skip: false,
      category: override.category ?? compiled.fallbackCategory,
      destinationDir: override.destination ?? category.destination,
      subfolders: override.destination ? [] : subfoldersFor(category.subfolders, folders, -1),
      ruleId: `override:${override.index}`,
      reason: `override ${override.id ?? override.path}`,
    };
  }

  for (const rule of compiled.rules) {
    const matchedIndex = evaluateRule(rule, facts);
    if (matchedIndex === null) continue;
    const category = compiled.categories[rule.category];
    const mode = rule.subfolders ?? category.subfolders;
    const matchedFolder = matchedIndex >= 0 ? folders[matchedIndex] : undefined;
    return {
      skip: false,
      category: rule.category,
      destinationDir: category.destination,
      subfolders: subfoldersFor(mode, folders, matchedIndex),
      ruleId: rule.id,
      reason: matchedFolder
        ? `rule ${rule.id} (kind ${facts.kind}, folder "${matchedFolder}")`
        : `rule ${rule.id} (kind ${facts.kind}${extension ? `, .${extension}` : ""})`,
    };
  }

  const fallback = compiled.categories[compiled.fallbackCategory];
  return {
    skip: false,
    category: fallback.name,
    destinationDir: fallback.destination,
    subfolders: subfoldersFor(fallback.subfolders, folders, -1),
    ruleId: null,
    reason: `no rule matched (kind ${facts.kind}${extension ? `, .${extension}` : ""})`,
  };
}
