import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../", import.meta.url));
const runtimeRoot = join(repo, "game/runtime_data");
const typesRoot = join(runtimeRoot, "types");
const examplesRoot = join(runtimeRoot, "examples");

const collectionTypes = {
  classes: "class_def",
  progression_tracks: "progression_track",
  enemies: "enemy_def",
  bosses: "boss_def",
  stages: "stage_def",
  encounters: "encounter_def",
  ui: "hud_event_binding",
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function loadDirectory(directory) {
  return Object.fromEntries(
    readdirSync(directory)
      .filter((file) => file.endsWith(".json"))
      .map((file) => [file.slice(0, -5), readJson(join(directory, file))]),
  );
}

const schemas = Object.fromEntries(
  readdirSync(typesRoot)
    .filter((file) => file.endsWith(".schema.json"))
    .map((file) => [file, readJson(join(typesRoot, file))]),
);
const examples = Object.fromEntries(
  Object.keys(collectionTypes).map((collection) => [
    collection,
    loadDirectory(join(examplesRoot, collection)),
  ]),
);
const canonical = Object.fromEntries(
  ["careers", "skills", "statuses", "items", "enemies", "bosses", "encounters"].map((type) => [
    type,
    loadDirectory(join(repo, "data", type)),
  ]),
);

const annotationKeywords = new Set(["$schema", "$id", "$defs", "title", "description"]);

function resolveRef(ref, currentFile) {
  const [file, pointer = ""] = ref.split("#");
  const schemaFile = file || currentFile;
  let node = schemas[schemaFile];
  assert.ok(node, `unknown schema file in $ref "${ref}"`);
  for (const part of pointer.split("/").filter(Boolean)) node = node?.[part];
  assert.ok(node, `unresolved $ref "${ref}"`);
  return { node, file: schemaFile };
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

// Minimal JSON Schema subset used by game/runtime_data/types. Unsupported keywords fail loudly.
function validate(value, schema, file, path, errors) {
  for (const keyword of Object.keys(schema)) {
    if (annotationKeywords.has(keyword)) continue;
    const rule = schema[keyword];
    switch (keyword) {
      case "$ref": {
        const target = resolveRef(rule, file);
        validate(value, target.node, target.file, path, errors);
        break;
      }
      case "allOf":
        for (const part of rule) validate(value, part, file, path, errors);
        break;
      case "type": {
        const actual = typeOf(value);
        const ok = actual === rule || (rule === "number" && actual === "integer");
        if (!ok) errors.push(`${path}: expected ${rule}, got ${actual}`);
        break;
      }
      case "enum":
        if (!rule.includes(value)) errors.push(`${path}: must be one of ${rule.join(", ")}`);
        break;
      case "required":
        if (typeOf(value) === "object")
          for (const key of rule)
            if (!Object.hasOwn(value, key)) errors.push(`${path}: missing required field "${key}"`);
        break;
      case "properties":
        if (typeOf(value) === "object")
          for (const [key, sub] of Object.entries(rule))
            if (Object.hasOwn(value, key))
              validate(value[key], sub, file, `${path}.${key}`, errors);
        break;
      case "additionalProperties":
        if (typeOf(value) === "object")
          for (const key of Object.keys(value)) {
            if (schema.properties && Object.hasOwn(schema.properties, key)) continue;
            if (rule === false) errors.push(`${path}: unknown field "${key}"`);
            else validate(value[key], rule, file, `${path}.${key}`, errors);
          }
        break;
      case "items":
        if (Array.isArray(value))
          value.forEach((item, index) => validate(item, rule, file, `${path}[${index}]`, errors));
        break;
      case "minItems":
        if (Array.isArray(value) && value.length < rule)
          errors.push(`${path}: needs at least ${rule} entries`);
        break;
      case "uniqueItems":
        if (Array.isArray(value) && rule) {
          const keys = value.map((item) => JSON.stringify(item));
          if (new Set(keys).size !== keys.length) errors.push(`${path}: entries must be unique`);
        }
        break;
      case "pattern":
        if (typeof value === "string" && !new RegExp(rule).test(value))
          errors.push(`${path}: "${value}" does not match ${rule}`);
        break;
      case "minLength":
        if (typeof value === "string" && value.trim().length < rule)
          errors.push(`${path}: text must not be empty`);
        break;
      case "minimum":
        if (typeof value === "number" && value < rule) errors.push(`${path}: must be ≥ ${rule}`);
        break;
      case "maximum":
        if (typeof value === "number" && value > rule) errors.push(`${path}: must be ≤ ${rule}`);
        break;
      case "exclusiveMinimum":
        if (typeof value === "number" && value <= rule) errors.push(`${path}: must be > ${rule}`);
        break;
      default:
        assert.fail(`${file}: unsupported schema keyword "${keyword}" at ${path}`);
    }
  }
}

function validateAgainst(typeName, value, location) {
  const errors = [];
  const file = `${typeName}.schema.json`;
  assert.ok(schemas[file], `missing type definition ${file}`);
  validate(value, schemas[file], file, location, errors);
  return errors;
}

function assertNoNull(value, location) {
  if (value === null) assert.fail(`${location} must omit null values`);
  if (Array.isArray(value))
    value.forEach((item, index) => assertNoNull(item, `${location}[${index}]`));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value)) assertNoNull(item, `${location}.${key}`);
}

function assertRef(table, id, location) {
  assert.ok(table[id], `${location} references missing id "${id}"`);
}

test("every staged collection has a type definition and at least one example", () => {
  for (const [collection, typeName] of Object.entries(collectionTypes)) {
    assert.ok(schemas[`${typeName}.schema.json`], `${collection} needs types/${typeName}`);
    assert.ok(Object.keys(examples[collection]).length > 0, `${collection} needs an example`);
  }
});

test("examples conform to their type definitions and authoring conventions", () => {
  for (const [collection, records] of Object.entries(examples)) {
    for (const [filenameId, record] of Object.entries(records)) {
      const location = `${collection}/${filenameId}`;
      assert.equal(record.id, filenameId, `${location} id must match filename`);
      assertNoNull(record, location);
      const errors = validateAgainst(collectionTypes[collection], record, location);
      assert.deepEqual(errors, [], errors.join("\n"));
      for (const key of ["name", "description", "title"]) {
        if (typeof record[key] === "string")
          assert.doesNotMatch(
            record[key],
            /\b(?:TODO|TBD|placeholder|lorem ipsum)\b/i,
            `${location}.${key} must not be placeholder text`,
          );
      }
    }
  }
});

test("the subset validator rejects invalid records", () => {
  const broken = structuredClone(examples.encounters.deserters_toll);
  broken.waves[0].trigger = "on_tuesday";
  broken.extra = 1;
  delete broken.stage;
  const errors = validateAgainst("encounter_def", broken, "encounters/broken");
  assert.ok(errors.some((error) => error.includes("must be one of")));
  assert.ok(errors.some((error) => error.includes('unknown field "extra"')));
  assert.ok(errors.some((error) => error.includes('missing required field "stage"')));
});

test("classes and progression tracks reference real skills, items and each other", () => {
  for (const [id, cls] of Object.entries(examples.classes)) {
    const location = `classes/${id}`;
    for (const skillId of cls.skill_pool) {
      assertRef(canonical.skills, skillId, `${location}.skill_pool`);
      assert.equal(
        canonical.skills[skillId].career,
        id,
        `${location}: ${skillId} belongs to ${id}`,
      );
    }
    for (const skillId of cls.starting_skills)
      assert.ok(cls.skill_pool.includes(skillId), `${location}: ${skillId} must be in skill_pool`);
    for (const itemId of cls.starting_items)
      assertRef(canonical.items, itemId, `${location}.starting_items`);
    assertRef(examples.progression_tracks, cls.progression_track, `${location}.progression_track`);
    assert.equal(examples.progression_tracks[cls.progression_track].class, id);
  }

  for (const [id, track] of Object.entries(examples.progression_tracks)) {
    const location = `progression_tracks/${id}`;
    assertRef(examples.classes, track.class, `${location}.class`);
    const cls = examples.classes[track.class];
    assert.equal(cls.progression_track, id, `${location} must be the class's track`);
    assert.equal(track.levels.length, track.max_level, `${location} needs one entry per level`);
    const unlocked = [];
    track.levels.forEach((entry, index) => {
      assert.equal(entry.level, index + 1, `${location}.levels must be 1..max_level in order`);
      if (index === 0) assert.equal(entry.xp_required, 0, `${location} level 1 starts at 0 XP`);
      else
        assert.ok(
          entry.xp_required > track.levels[index - 1].xp_required,
          `${location}.levels xp_required must strictly increase`,
        );
      for (const skillId of entry.unlock_skills ?? []) {
        assert.ok(cls.skill_pool.includes(skillId), `${location}: ${skillId} not in skill_pool`);
        assert.ok(!cls.starting_skills.includes(skillId), `${location}: ${skillId} already known`);
        assert.ok(!unlocked.includes(skillId), `${location}: ${skillId} unlocked twice`);
        unlocked.push(skillId);
      }
      for (const itemId of entry.grant_items ?? [])
        assertRef(canonical.items, itemId, `${location}.grant_items`);
    });
    const learnable = cls.skill_pool.filter((skillId) => !cls.starting_skills.includes(skillId));
    assert.deepEqual(
      [...unlocked].sort(),
      [...learnable].sort(),
      `${location} must unlock every non-starting skill_pool skill exactly once`,
    );
  }
});

test("enemies, bosses, stages and encounters resolve and follow composition rules", () => {
  const enemyTable = { ...canonical.enemies, ...examples.enemies };
  const bossTable = { ...canonical.bosses, ...examples.bosses };

  for (const [id, enemy] of Object.entries(examples.enemies)) {
    for (const skillId of enemy.skills)
      assertRef(canonical.skills, skillId, `enemies/${id}.skills`);
    for (const skillId of Object.keys(enemy.ai?.weights ?? {}))
      assert.ok(enemy.skills.includes(skillId), `enemies/${id}.ai.weights uses ${skillId}`);
    for (const drop of enemy.loot_table ?? [])
      assertRef(canonical.items, drop.item, `enemies/${id}.loot_table`);
  }

  for (const [id, boss] of Object.entries(examples.bosses)) {
    const thresholds = boss.phases.map((phase) => phase.hp_threshold);
    assert.equal(thresholds[0], 1, `bosses/${id} first phase starts at 1.0`);
    thresholds.forEach((value, index) => {
      if (index > 0) assert.ok(thresholds[index - 1] > value, `bosses/${id} thresholds descend`);
    });
    for (const phase of boss.phases) {
      for (const skillId of phase.skills)
        assertRef(canonical.skills, skillId, `bosses/${id}.phases.skills`);
      for (const telegraph of phase.telegraphs ?? [])
        assert.ok(phase.skills.includes(telegraph.skill), `bosses/${id} telegraphs a phase skill`);
      for (const action of phase.on_enter ?? []) {
        const keys = Object.keys(action).sort().join(",");
        assert.ok(
          keys === "apply_status,duration,target" || keys === "stat_modifier",
          `bosses/${id}.on_enter entry must be a status application or a stat_modifier`,
        );
        if (action.apply_status)
          assertRef(canonical.statuses, action.apply_status, `bosses/${id}.on_enter`);
      }
    }
    for (const drop of boss.loot_table ?? [])
      assertRef(canonical.items, drop.item, `bosses/${id}.loot_table`);
  }

  const orders = [];
  for (const [id, encounter] of Object.entries(examples.encounters)) {
    const location = `encounters/${id}`;
    assertRef(examples.stages, encounter.stage, `${location}.stage`);
    const stage = examples.stages[encounter.stage];
    const waveIds = encounter.waves.map((wave) => wave.id);
    assert.equal(new Set(waveIds).size, waveIds.length, `${location} wave ids must be unique`);
    let hasBoss = false;
    encounter.waves.forEach((wave, index) => {
      assert.equal(
        wave.trigger,
        index === 0 ? "encounter_start" : "previous_wave_cleared",
        `${location}.waves[${index}].trigger`,
      );
      const slots = wave.spawns.map((spawn) => spawn.slot);
      assert.equal(new Set(slots).size, slots.length, `${location}.${wave.id} slots are unique`);
      for (const spawn of wave.spawns) {
        assert.ok(spawn.slot < stage.layout.enemy_slots, `${location}.${wave.id} slot fits stage`);
        if (spawn.kind === "boss") {
          hasBoss = true;
          assertRef(bossTable, spawn.actor, `${location}.${wave.id}.spawns`);
        } else assertRef(enemyTable, spawn.actor, `${location}.${wave.id}.spawns`);
      }
    });
    assert.equal(encounter.type === "boss", hasBoss, `${location}: boss type ⇔ boss spawn`);
    assert.equal(encounter.victory === "defeat_boss", hasBoss, `${location}: victory rule`);
    for (const itemId of encounter.rewards.items ?? [])
      assertRef(canonical.items, itemId, `${location}.rewards.items`);
    if (encounter.order !== undefined) orders.push(encounter.order);
  }
  assert.equal(new Set(orders).size, orders.length, "encounter order values must be unique");
});

test("staged records are backward-compatible supersets of the canonical slice records", () => {
  for (const [collection, canonicalType] of [
    ["classes", "careers"],
    ["enemies", "enemies"],
    ["bosses", "bosses"],
  ]) {
    for (const [id, record] of Object.entries(examples[collection])) {
      const source = canonical[canonicalType][id];
      if (!source) continue;
      for (const [key, value] of Object.entries(source))
        assert.deepEqual(record[key], value, `${collection}/${id}.${key} drifted from data/`);
    }
  }

  for (const [id, encounter] of Object.entries(examples.encounters)) {
    const source = canonical.encounters[id];
    if (!source) continue;
    for (const key of ["name", "type", "order", "difficulty", "rewards", "description"])
      assert.deepEqual(encounter[key], source[key], `encounters/${id}.${key} drifted from data/`);
    assert.equal(encounter.stage, source.arena, `encounters/${id}.stage must equal slice arena`);
    assert.equal(encounter.waves.length, 1, `encounters/${id} migrates to a single wave`);
    assert.deepEqual(
      encounter.waves[0].spawns.map((spawn) => spawn.actor),
      source.enemies,
      `encounters/${id} spawns must equal slice enemies`,
    );
  }
});

test("HUD event bindings route resolver and run events to the right surfaces", () => {
  const screens = ["reward_screen", "progression_screen"];
  for (const [id, binding] of Object.entries(examples.ui)) {
    const types = binding.events.map((entry) => entry.event_type);
    assert.equal(new Set(types).size, types.length, `ui/${id} event types must be unique`);
    for (const entry of binding.events) {
      const location = `ui/${id}.${entry.event_type}`;
      const onScreens = entry.modules.filter((module) => screens.includes(module));
      if (entry.source === "run")
        assert.equal(
          onScreens.length,
          entry.modules.length,
          `${location}: run events stay off HUD`,
        );
      else assert.equal(onScreens.length, 0, `${location}: resolver events stay on the HUD`);
      if (entry.log !== "none")
        assert.ok(entry.modules.includes("event_log"), `${location}: logged events need event_log`);
    }
  }
});

test("planning docs contain the required sections", () => {
  const required = [
    "Purpose",
    "Scope",
    "Entity list",
    "Data model outline",
    "Dependencies",
    "Implementation sequence",
    "Definition of done",
  ];
  for (const doc of [
    "docs/final-data-entities/classes-and-progression.md",
    "docs/final-data-entities/enemies-and-encounters.md",
    "docs/ui/hud-combat-event-integration-plan.md",
  ]) {
    const text = readFileSync(join(repo, doc), "utf8");
    for (const heading of required)
      assert.match(text, new RegExp(`^## ${heading}\\b`, "m"), `${doc} needs "## ${heading}"`);
    assert.doesNotMatch(text, /\b(?:TODO|TBD|lorem ipsum)\b/i, `${doc} has placeholder text`);
  }
});
