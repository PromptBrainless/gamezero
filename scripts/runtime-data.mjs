import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
const text = z.string().refine((value) => value.trim().length > 0, "Text must not be empty");
const positiveInt = z.number().int().positive();
const coordinate = z.number().min(0).max(1);
/** @template {z.ZodType} T @param {T} schema */
const list = (schema) => z.array(schema).min(1);
const slot = z.strictObject({ id, x: coordinate, y: coordinate });
const schemas = {
  careers: z.strictObject({
    career: id,
    max_level: z.literal(4),
    unlocks: list(z.strictObject({ level: positiveInt, skills: list(id) })),
  }),
  actions: z.strictObject({
    skill: id,
    selection: z.strictObject({
      team: z.enum(["self", "opponent"]),
      count: z.literal(1),
      life_state: z.literal("alive"),
      range: z.literal("any_slot"),
    }),
    execution: z.enum(["manual", "reaction"]),
    reaction_hook: z.literal("after_melee_hit").optional(),
  }),
  statuses: z.strictObject({
    status: id,
    duration_clock: z.literal("owner_action"),
    reapply: z.literal("keep_longer_duration"),
    stack_mode: z.enum(["add_capped", "replace"]),
    expiration: z.literal("after_tick"),
    cleanseable: z.literal(true),
  }),
  archetypes: z.strictObject({
    id,
    combatant: z.strictObject({ collection: z.enum(["enemies", "bosses"]), id }),
    role: z.enum(["striker", "defender", "controller", "boss"]),
    resource_policy: z.literal("free"),
    selection_policy: z.enum(["uniform_available", "telegraph_first"]),
  }),
  stages: z.strictObject({
    id,
    name: text,
    layout: z.literal("side_view"),
    player_slots: list(slot),
    enemy_slots: list(slot),
    layers: list(z.strictObject({ id, depth: z.number().int(), parallax: z.number().positive() })),
  }),
  encounters: z.strictObject({
    encounter: id,
    stage: id,
    waves: list(z.strictObject({
      id,
      trigger: z.enum(["encounter_start", "previous_wave_defeated"]),
      spawns: list(z.strictObject({ instance_id: id, archetype: id, slot: id })),
    })),
    narrative: z.strictObject({ before: id, victory: id }),
  }),
  dialogue: z.strictObject({
    id,
    entry: z.literal("opening"),
    nodes: list(z.strictObject({ id, speaker: text, text, next: id.optional() })),
  }),
};
const equipmentSlots = ["weapon", "offhand", "armor", "trinket"];
const schema = z.strictObject({
  schema_version: z.literal(1),
  content_revision: z.literal("slice_1"),
  rules: z.strictObject({
    turn_order: z.literal("player_then_enemies"),
    damage_rounding: z.literal("nearest_min_one"),
    resource_regen: z.strictObject({ stamina: z.literal(4), focus: z.literal(3) }),
    recovery_bonus: z.strictObject({ stamina: z.literal(6), focus: z.literal(4) }),
    enemy_cost_policy: z.literal("free"),
    progression: z.literal("victory_level"),
    encounter_reset: z.literal("full_restore"),
    rewards: z.literal("consumables_next_encounter"),
  }),
  careers: list(schemas.careers),
  actions: list(schemas.actions),
  statuses: list(schemas.statuses),
  archetypes: list(schemas.archetypes),
  stages: list(schemas.stages),
  encounters: list(schemas.encounters),
  dialogue: list(schemas.dialogue),
  equipment: z.strictObject({
    slots: list(z.enum(equipmentSlots)),
    duplicate_policy: z.literal("one_per_slot"),
    consumable_policy: z.literal("separate_inventory"),
  }),
});

/**
 * @typedef {{path: string, field: string, message: string}} RuntimeIssue
 * @typedef {ReturnType<typeof import("../src/game/slice/validation.ts").loadContent>["data"]} BaseContent
 * @typedef {keyof typeof schemas} MetadataCollection
 * @typedef {{[K in MetadataCollection]: {value: z.infer<(typeof schemas)[K]>, field: string}[]}} ParsedCollections
 */

/**
 * Validate the runtime document against an already validated base registry.
 * Invalid entries do not prevent validation of other entries and collections.
 * @param {BaseContent} content
 * @param {unknown} metadata
 * @returns {{ready: boolean, issues: RuntimeIssue[], data: z.infer<typeof schema> | undefined}}
 */
export function validateRuntimeData(content, metadata) {
  const path = "data/runtime/slice.json";
  /** @type {RuntimeIssue[]} */
  const issues = [];
  /** @param {string} field @param {string} message */
  const report = (field, message) => issues.push({ path, field, message });
  const result = schema.safeParse(metadata);
  if (!result.success) {
    for (const issue of result.error.issues) {
      if (issue.code === "unrecognized_keys") {
        for (const key of issue.keys) report([...issue.path, key].join("."), "Unknown field");
      } else report(issue.path.join(".") || "record", issue.message);
    }
  }
  const raw = metadata && typeof metadata === "object"
    ? /** @type {Record<string, unknown>} */ (metadata) : {};
  /** @param {MetadataCollection} key */
  const entries = (key) => (Array.isArray(raw[key]) ? raw[key] : [])
    .flatMap((value, index) => {
      const parsed = schemas[key].safeParse(value);
      return parsed.success ? [{ value: parsed.data, field: `${key}.${index}` }] : [];
    });
  const keys = /** @type {MetadataCollection[]} */ (Object.keys(schemas));
  const collections = /** @type {ParsedCollections} */ (
    Object.fromEntries(keys.map((key) => [key, entries(key)]))
  );
  /**
   * @param {(Record<string, unknown> | string | number)[]} values
   * @param {string} field
   * @param {string | null} [key]
   */
  const unique = (values, field, key = "id") => {
    const seen = new Set();
    values.forEach((value, index) => {
      const identifier = key && typeof value === "object" ? value[key] : value;
      if (seen.has(identifier)) report(`${field}.${index}${key ? `.${key}` : ""}`, `Duplicate identifier: ${identifier}`);
      seen.add(identifier);
    });
  };
  /**
   * @template T
   * @param {Record<string, T>} records
   * @param {string} target
   * @param {string} field
   * @param {string} collection
   * @returns {T | undefined}
   */
  const reference = (records, target, field, collection) => {
    if (!Object.hasOwn(records, target)) {
      report(field, `Missing reference: ${collection}/${target}`);
      return undefined;
    }
    return records[target];
  };
  /**
   * @param {MetadataCollection} key
   * @param {keyof BaseContent} collection
   * @param {string} target
   */
  const coverage = (key, collection, target) => {
    const seen = new Set();
    for (const { value, field } of collections[key]) {
      const identifier = /** @type {Record<string, string>} */ (/** @type {unknown} */ (value))[target];
      if (!Object.hasOwn(content[collection], identifier)) report(`${field}.${target}`, `Missing reference: ${collection}/${identifier}`);
      if (seen.has(identifier)) report(`${field}.${target}`, `Duplicate coverage: ${identifier}`);
      seen.add(identifier);
    }
    for (const identifier of Object.keys(content[collection])) {
      if (!seen.has(identifier)) report(key, `Missing coverage: ${collection}/${identifier}`);
    }
  };
  coverage("careers", "careers", "career");
  coverage("actions", "skills", "skill");
  coverage("statuses", "statuses", "status");
  coverage("encounters", "encounters", "encounter");
  for (const { value, field } of collections.careers) {
    const career = Object.hasOwn(content.careers, value.career) ? content.careers[value.career] : undefined;
    unique(value.unlocks, `${field}.unlocks`, "level");
    const skills = value.unlocks.flatMap((unlock) => unlock.skills);
    unique(skills, `${field}.unlocks.skills`, null);
    value.unlocks.forEach((unlock, index) => {
      if (unlock.level > value.max_level) report(`${field}.unlocks.${index}.level`, "Unlock exceeds max_level");
      if (index > 0 && unlock.level <= value.unlocks[index - 1].level) {
        report(`${field}.unlocks.${index}.level`, "Unlock levels must strictly ascend");
      }
      unlock.skills.forEach((skill, skillIndex) => {
        reference(content.skills, skill, `${field}.unlocks.${index}.skills.${skillIndex}`, "skills");
      });
    });
    if (!career) continue;
    const starting = value.unlocks.find((unlock) => unlock.level === 1)?.skills ?? [];
    if (!sameMembers(starting, career.starting_skills)) report(`${field}.unlocks`, "Level 1 must match starting_skills exactly");
    if (!sameMembers(skills, career.skill_pool)) report(`${field}.unlocks`, "Unlocks must cover skill_pool exactly once");
  }
  for (const { value, field } of collections.actions) {
    const skill = Object.hasOwn(content.skills, value.skill) ? content.skills[value.skill] : undefined;
    if (!skill) continue;
    if (value.selection.team !== (skill.target === "self" ? "self" : "opponent")) {
      report(`${field}.selection.team`, "Selection does not match skill target");
    }
    if (value.reaction_hook !== skill.trigger) report(`${field}.reaction_hook`, "Reaction hook must match the skill trigger");
    if (value.execution !== (skill.trigger ? "reaction" : "manual")) {
      report(`${field}.execution`, "Execution must be reaction exactly when the skill has a trigger");
    }
  }
  for (const { value, field } of collections.statuses) {
    const status = Object.hasOwn(content.statuses, value.status) ? content.statuses[value.status] : undefined;
    if (status && value.stack_mode !== (status.max_stacks > 1 ? "add_capped" : "replace")) {
      report(`${field}.stack_mode`, "Stack mode must match max_stacks");
    }
  }
  const archetypes = Object.fromEntries(collections.archetypes.map(({ value }) => [value.id, value]));
  unique(collections.archetypes.map(({ value }) => value), "archetypes");
  for (const collection of /** @type {const} */ (["enemies", "bosses"])) {
    const covered = new Set();
    for (const { value, field } of collections.archetypes) {
      if (value.combatant.collection !== collection) continue;
      const actors = /** @type {Record<string, BaseContent["enemies"][string] | BaseContent["bosses"][string]>} */ (content[collection]);
      const actor = reference(actors, value.combatant.id, `${field}.combatant.id`, collection);
      if (covered.has(value.combatant.id)) report(`${field}.combatant.id`, `Duplicate coverage: ${collection}/${value.combatant.id}`);
      covered.add(value.combatant.id);
      if (!actor) continue;
      const policy = collection === "bosses" ? "telegraph_first" : "uniform_available";
      if (value.selection_policy !== policy) report(`${field}.selection_policy`, `Expected ${policy}`);
      if ((value.role === "boss") !== (collection === "bosses")) report(`${field}.role`, "Boss role must match combatant collection");
      if (collection === "bosses" && "phases" in actor) {
        const seen = new Set();
        actor.phases.forEach((phase, index) => {
          if (seen.has(phase.id)) issues.push({
            path: `data/bosses/${actor.id}.json`, field: `phases.${index}.id`, message: `Duplicate identifier: ${phase.id}`,
          });
          seen.add(phase.id);
        });
      }
    }
    for (const identifier of Object.keys(content[collection])) {
      if (!covered.has(identifier)) report("archetypes", `Missing coverage: ${collection}/${identifier}`);
    }
  }
  unique(collections.stages.map(({ value }) => value), "stages");
  const stages = Object.fromEntries(collections.stages.map(({ value }) => [value.id, value]));
  const arenas = new Set(Object.values(content.encounters).map((encounter) => encounter.arena));
  for (const { value, field } of collections.stages) {
    if (!arenas.has(value.id)) report(`${field}.id`, "Stage must match a base encounter arena");
    unique([...value.player_slots, ...value.enemy_slots], `${field}.slots`);
    unique(value.layers, `${field}.layers`);
  }
  for (const arena of arenas) if (!Object.hasOwn(stages, arena)) report("stages", `Missing stage: ${arena}`);
  unique(collections.dialogue.map(({ value }) => value), "dialogue");
  const dialogue = Object.fromEntries(collections.dialogue.map(({ value }) => [value.id, value]));
  for (const { value, field } of collections.encounters) {
    const encounter = Object.hasOwn(content.encounters, value.encounter) ? content.encounters[value.encounter] : undefined;
    const stage = reference(stages, value.stage, `${field}.stage`, "stages");
    if (encounter && encounter.arena !== value.stage) report(`${field}.stage`, "Stage does not match encounter arena");
    unique(value.waves, `${field}.waves`);
    const instances = new Set();
    /** @type {string[]} */
    const combatants = [];
    value.waves.forEach((wave, waveIndex) => {
      const waveField = `${field}.waves.${waveIndex}`;
      const trigger = waveIndex === 0 ? "encounter_start" : "previous_wave_defeated";
      if (wave.trigger !== trigger) report(`${waveField}.trigger`, `Expected ${trigger}`);
      unique(wave.spawns, `${waveField}.spawns`, "slot");
      wave.spawns.forEach((spawn, spawnIndex) => {
        const spawnField = `${waveField}.spawns.${spawnIndex}`;
        if (instances.has(spawn.instance_id)) report(`${spawnField}.instance_id`, `Duplicate identifier: ${spawn.instance_id}`);
        instances.add(spawn.instance_id);
        const archetype = reference(archetypes, spawn.archetype, `${spawnField}.archetype`, "archetypes");
        if (stage && !stage.enemy_slots.some((slot) => slot.id === spawn.slot)) report(`${spawnField}.slot`, `Missing enemy slot: ${spawn.slot}`);
        if (archetype) {
          combatants.push(archetype.combatant.id);
          if (encounter && archetype.combatant.collection !== (encounter.type === "boss" ? "bosses" : "enemies")) {
            report(`${spawnField}.archetype`, "Spawn combatant collection does not match encounter type");
          }
        }
      });
    });
    if (encounter && (combatants.length !== encounter.enemies.length
      || combatants.some((combatant, index) => combatant !== encounter.enemies[index]))) {
      report(`${field}.waves`, "Flattened spawns must match encounter enemies in order");
    }
    for (const key of /** @type {const} */ (["before", "victory"])) reference(dialogue, value.narrative[key], `${field}.narrative.${key}`, "dialogue");
  }
  for (const { value, field } of collections.dialogue) {
    unique(value.nodes, `${field}.nodes`);
    const nodes = Object.fromEntries(value.nodes.map((node) => [node.id, node]));
    reference(nodes, value.entry, `${field}.entry`, "nodes");
    value.nodes.forEach((node, index) => {
      if (node.next !== undefined) reference(nodes, node.next, `${field}.nodes.${index}.next`, "nodes");
    });
    const visited = new Set();
    /** @type {string | undefined} */
    let current = value.entry;
    while (current !== undefined && Object.hasOwn(nodes, current) && !visited.has(current)) {
      visited.add(current);
      current = nodes[current].next;
      if (current === undefined) break;
    }
    if (visited.has(current)) report(`${field}.nodes`, "Dialogue cycle must terminate");
    value.nodes.forEach((node, index) => {
      if (!visited.has(node.id)) report(`${field}.nodes.${index}.id`, "Unreachable dialogue node");
    });
  }
  const parsedEquipment = schema.shape.equipment.safeParse(raw.equipment);
  const slots = parsedEquipment.success ? parsedEquipment.data.slots : undefined;
  if (Array.isArray(slots)) {
    unique(slots, "equipment.slots", null);
    if (!sameMembers(slots, equipmentSlots)) report("equipment.slots", "Equipment must cover every slot exactly once");
  }
  issues.sort((left, right) => `${left.path}.${left.field}.${left.message}`.localeCompare(`${right.path}.${right.field}.${right.message}`));
  return { ready: issues.length === 0, issues, data: issues.length === 0 && result.success ? result.data : undefined };
}

/** @param {string[]} left @param {string[]} right */
function sameMembers(left, right) {
  if (left.length !== right.length) return false;
  const expected = [...right].sort();
  return [...left].sort().every((value, index) => value === expected[index]);
}
