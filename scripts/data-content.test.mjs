import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../data/", import.meta.url));
const expectedCounts = {
  careers: 3,
  skills: 10,
  statuses: 6,
  items: 11,
  enemies: 3,
  bosses: 1,
  encounters: 4,
};

const fields = {
  careers: [
    "id",
    "name",
    "role",
    "description",
    "base_stats",
    "stat_growth",
    "starting_skills",
    "skill_pool",
    "starting_items",
    "reaction",
    "visual",
  ],
  skills: [
    "id",
    "name",
    "type",
    "cost",
    "cooldown",
    "target",
    "description",
    "career",
    "damage",
    "applies_statuses",
    "tags",
    "trigger",
    "removes_statuses",
  ],
  statuses: [
    "id",
    "name",
    "kind",
    "default_duration",
    "max_stacks",
    "effect",
    "description",
    "tick",
    "icon_shape",
  ],
  items: [
    "id",
    "name",
    "slot",
    "rarity",
    "stat_modifiers",
    "description",
    "value",
    "career_tags",
    "effects",
    "use",
  ],
  enemies: [
    "id",
    "name",
    "role",
    "tier",
    "base_stats",
    "skills",
    "description",
    "weaknesses",
    "resistances",
    "ai",
    "loot_table",
    "xp_reward",
    "visual",
  ],
  bosses: [
    "id",
    "name",
    "title",
    "tier",
    "base_stats",
    "description",
    "visual",
    "phases",
    "loot_table",
    "xp_reward",
  ],
  encounters: [
    "id",
    "name",
    "type",
    "order",
    "enemies",
    "difficulty",
    "arena",
    "rewards",
    "description",
  ],
};

const required = {
  careers: [
    "id",
    "name",
    "role",
    "description",
    "base_stats",
    "stat_growth",
    "starting_skills",
    "skill_pool",
    "starting_items",
    "reaction",
  ],
  skills: ["id", "name", "type", "cost", "cooldown", "target", "description"],
  statuses: ["id", "name", "kind", "default_duration", "max_stacks", "effect", "description"],
  items: ["id", "name", "slot", "rarity", "stat_modifiers", "description"],
  enemies: ["id", "name", "role", "tier", "base_stats", "skills", "description"],
  bosses: ["id", "name", "title", "tier", "base_stats", "description", "phases"],
  encounters: [
    "id",
    "name",
    "type",
    "order",
    "enemies",
    "difficulty",
    "arena",
    "rewards",
    "description",
  ],
};

function loadCollection(type) {
  const directory = join(root, type);
  return Object.fromEntries(
    readdirSync(directory)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const record = JSON.parse(readFileSync(join(directory, file), "utf8"));
        return [file.slice(0, -5), record];
      }),
  );
}

const data = Object.fromEntries(
  Object.keys(expectedCounts).map((type) => [type, loadCollection(type)]),
);

function assertAllowedFields(record, type, location) {
  assert.ok(
    record && typeof record === "object" && !Array.isArray(record),
    `${location} must be an object`,
  );
  const allowed = new Set(fields[type]);
  for (const key of Object.keys(record)) {
    assert.ok(allowed.has(key), `${location} has unknown field "${key}"`);
  }
  for (const key of required[type]) {
    assert.ok(Object.hasOwn(record, key), `${location} is missing required field "${key}"`);
  }
}

function assertNoNull(value, location) {
  if (value === null) assert.fail(`${location} must omit null values`);
  if (Array.isArray(value))
    value.forEach((item, index) => assertNoNull(item, `${location}[${index}]`));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) assertNoNull(item, `${location}.${key}`);
  }
}

function assertReference(collection, id, location) {
  assert.ok(data[collection][id], `${location} references missing ${collection} id "${id}"`);
}

function assertChance(value, location) {
  assert.ok(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `${location} must be between 0 and 1`,
  );
}

function assertKeys(value, allowed, location) {
  assert.ok(
    value && typeof value === "object" && !Array.isArray(value),
    `${location} must be an object`,
  );
  for (const key of Object.keys(value))
    assert.ok(allowed.includes(key), `${location} has unknown field "${key}"`);
}

function assertEnum(value, choices, location) {
  assert.ok(choices.includes(value), `${location} must be one of ${choices.join(", ")}`);
}

test("selected first-playable content has the expected collections and schema fields", () => {
  for (const [type, records] of Object.entries(data)) {
    assert.equal(Object.keys(records).length, expectedCounts[type], `${type} record count`);
    assert.equal(
      new Set(Object.keys(records)).size,
      Object.keys(records).length,
      `${type} ids must be unique`,
    );
    for (const [filenameId, record] of Object.entries(records)) {
      const location = `${type}/${filenameId}`;
      assertAllowedFields(record, type, location);
      assert.equal(record.id, filenameId, `${location} id must match filename`);
      assert.match(
        record.id,
        /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/,
        `${location} id must be snake_case ASCII`,
      );
      assertNoNull(record, location);
      for (const key of ["name", "description"]) {
        assert.ok(
          typeof record[key] === "string" && record[key].trim(),
          `${location}.${key} must be nonempty text`,
        );
        assert.doesNotMatch(
          record[key],
          /\b(?:TODO|TBD|placeholder|lorem ipsum)\b/i,
          `${location}.${key} must not be placeholder text`,
        );
      }
    }
  }
});

test("nested records and enum values follow the documented schema", () => {
  const statKeys = ["hp", "focus", "stamina", "attack", "defense", "magic", "speed", "crit_chance"];
  const baseStatKeys = [
    "hp",
    "attack",
    "defense",
    "magic",
    "speed",
    "crit_chance",
    "focus",
    "stamina",
  ];
  const statusEffectKeys = [
    "damage_per_turn_per_stack",
    "damage_type",
    "ignores_defense",
    "skip_turn",
    "damage_taken_multiplier",
    "crit_chance_bonus",
    "crit_chance_taken_bonus",
    "stamina_regen_multiplier",
  ];

  for (const [id, career] of Object.entries(data.careers)) {
    assertKeys(career.base_stats, baseStatKeys, `careers/${id}.base_stats`);
    assertKeys(career.stat_growth, baseStatKeys, `careers/${id}.stat_growth`);
    assertEnum(career.reaction, ["brace", "parry", "ward"], `careers/${id}.reaction`);
    for (const [stat, value] of Object.entries(career.base_stats)) {
      if (stat === "crit_chance") assertChance(value, `careers/${id}.base_stats.${stat}`);
      else
        assert.ok(
          Number.isInteger(value) && value >= 0,
          `careers/${id}.base_stats.${stat} must be a nonnegative integer`,
        );
    }
    for (const [stat, value] of Object.entries(career.stat_growth)) {
      assert.ok(statKeys.includes(stat), `careers/${id}.stat_growth.${stat} is not a known stat`);
      assert.ok(Number.isInteger(value), `careers/${id}.stat_growth.${stat} must be an integer`);
    }
  }

  for (const [id, skill] of Object.entries(data.skills)) {
    assertEnum(skill.type, ["attack", "defense", "control", "reaction"], `skills/${id}.type`);
    assertEnum(skill.target, ["enemy", "self"], `skills/${id}.target`);
    assertKeys(skill.cost, ["stamina", "focus"], `skills/${id}.cost`);
    for (const tag of skill.tags ?? [])
      assert.equal(typeof tag, "string", `skills/${id}.tags entries must be strings`);
    if (skill.trigger) assertEnum(skill.trigger, ["after_melee_hit"], `skills/${id}.trigger`);
    if (skill.damage) {
      assertKeys(
        skill.damage,
        ["damage_type", "scaling_stat", "multiplier", "flat", "formula"],
        `skills/${id}.damage`,
      );
      assertEnum(
        skill.damage.scaling_stat,
        ["attack", "magic"],
        `skills/${id}.damage.scaling_stat`,
      );
      assert.ok(
        Number.isFinite(skill.damage.multiplier) && skill.damage.multiplier >= 0,
        `skills/${id}.damage.multiplier must be nonnegative`,
      );
      assert.ok(Number.isInteger(skill.damage.flat), `skills/${id}.damage.flat must be an integer`);
    }
    for (const application of skill.applies_statuses ?? []) {
      assertKeys(
        application,
        ["status", "duration", "chance", "target"],
        `skills/${id}.applies_statuses entry`,
      );
      assert.ok(
        Number.isInteger(application.duration) && application.duration >= 1,
        `skills/${id}.applies_statuses.duration must be positive`,
      );
      if (application.target)
        assertEnum(application.target, ["self", "enemy"], `skills/${id}.applies_statuses.target`);
    }
  }

  for (const [id, status] of Object.entries(data.statuses)) {
    assertEnum(status.kind, ["buff", "debuff"], `statuses/${id}.kind`);
    if (status.tick) assertEnum(status.tick, ["turn_start", "turn_end"], `statuses/${id}.tick`);
    for (const key of Object.keys(status.effect)) {
      assert.ok(
        statusEffectKeys.includes(key) || /^[a-z_]+_modifier$/.test(key),
        `statuses/${id}.effect has unknown key "${key}"`,
      );
    }
  }

  for (const [id, item] of Object.entries(data.items)) {
    assertEnum(
      item.slot,
      ["weapon", "offhand", "armor", "trinket", "consumable"],
      `items/${id}.slot`,
    );
    assertEnum(item.rarity, ["common", "uncommon", "rare"], `items/${id}.rarity`);
    if (item.use) {
      assert.equal(item.slot, "consumable", `items/${id}.use is only allowed for consumables`);
      assertKeys(
        item.use,
        [
          "heal_hp",
          "restore_focus",
          "next_attack_bonus",
          "removes_statuses",
          "applies_statuses",
          "stackable",
          "max_stack",
        ],
        `items/${id}.use`,
      );
      if (item.use.max_stack !== undefined)
        assert.ok(
          Number.isInteger(item.use.max_stack) && item.use.max_stack >= 1,
          `items/${id}.use.max_stack must be positive`,
        );
      for (const key of ["heal_hp", "restore_focus", "next_attack_bonus"]) {
        if (item.use[key] !== undefined)
          assert.ok(
            Number.isInteger(item.use[key]) && item.use[key] >= 0,
            `items/${id}.use.${key} must be nonnegative`,
          );
      }
      for (const application of item.use.applies_statuses ?? []) {
        assertKeys(
          application,
          ["status", "duration", "chance", "target"],
          `items/${id}.use.applies_statuses entry`,
        );
        assert.ok(
          Number.isInteger(application.duration) && application.duration >= 1,
          `items/${id}.use.applies_statuses.duration must be positive`,
        );
        if (application.target)
          assertEnum(
            application.target,
            ["self", "enemy"],
            `items/${id}.use.applies_statuses.target`,
          );
      }
    }
    for (const effect of item.effects ?? []) {
      assert.equal(
        Object.keys(effect).length,
        1,
        `items/${id}.effects entries must have one modifier`,
      );
      assert.ok(
        Number.isFinite(Object.values(effect)[0]),
        `items/${id}.effects values must be numeric`,
      );
    }
  }

  for (const [type, actors] of [
    ["enemies", data.enemies],
    ["bosses", data.bosses],
  ]) {
    for (const [id, actor] of Object.entries(actors)) {
      assertKeys(actor.base_stats, baseStatKeys, `${type}/${id}.base_stats`);
      for (const [stat, value] of Object.entries(actor.base_stats)) {
        if (stat === "crit_chance") assertChance(value, `${type}/${id}.base_stats.${stat}`);
        else
          assert.ok(
            Number.isInteger(value) && value >= 0,
            `${type}/${id}.base_stats.${stat} must be a nonnegative integer`,
          );
      }
      if (actor.ai) {
        assertKeys(actor.ai, ["pattern", "weights"], `${type}/${id}.ai`);
        assert.ok(typeof actor.ai.pattern === "string", `${type}/${id}.ai.pattern must be text`);
        for (const weight of Object.values(actor.ai.weights ?? {})) {
          assert.ok(
            Number.isFinite(weight) && weight > 0,
            `${type}/${id}.ai.weights values must be positive`,
          );
        }
      }
      for (const drop of actor.loot_table ?? []) {
        assertKeys(drop, ["item", "chance"], `${type}/${id}.loot_table entry`);
      }
      if (type === "bosses") {
        for (const phase of actor.phases) {
          assertKeys(
            phase,
            ["id", "name", "hp_threshold", "skills", "telegraphs", "on_enter"],
            `bosses/${id}.phases entry`,
          );
          assertChance(phase.hp_threshold, `bosses/${id}.phases.hp_threshold`);
          for (const telegraph of phase.telegraphs ?? []) {
            assertKeys(
              telegraph,
              ["skill", "warning_turns", "icon"],
              `bosses/${id}.phases.telegraphs entry`,
            );
          }
          for (const action of phase.on_enter ?? []) {
            assertKeys(
              action,
              ["apply_status", "duration", "target", "stat_modifier"],
              `bosses/${id}.phases.on_enter entry`,
            );
          }
        }
      }
    }
  }

  for (const [id, encounter] of Object.entries(data.encounters)) {
    assertEnum(encounter.type, ["tutorial", "standard", "boss"], `encounters/${id}.type`);
    assertKeys(encounter.rewards, ["xp", "items"], `encounters/${id}.rewards`);
    assert.ok(
      Number.isInteger(encounter.rewards.xp) && encounter.rewards.xp >= 0,
      `encounters/${id}.rewards.xp must be nonnegative`,
    );
  }
});

test("careers, skills, statuses, items, enemies, bosses, and encounters have valid references", () => {
  for (const [id, career] of Object.entries(data.careers)) {
    for (const skillId of career.starting_skills) {
      assertReference("skills", skillId, `careers/${id}.starting_skills`);
      assert.equal(
        data.skills[skillId].career,
        id,
        `${id} starting skill must belong to that career`,
      );
    }
    for (const skillId of career.skill_pool) {
      assertReference("skills", skillId, `careers/${id}.skill_pool`);
      assert.equal(
        data.skills[skillId].career,
        id,
        `${id} skill-pool skill must belong to that career`,
      );
    }
    assert.ok(
      career.starting_skills.every((skillId) => career.skill_pool.includes(skillId)),
      `${id} skill_pool must include every starting skill`,
    );
    for (const itemId of career.starting_items) {
      assertReference("items", itemId, `careers/${id}.starting_items`);
      const tags = data.items[itemId].career_tags;
      assert.ok(!tags || tags.includes(id), `${id} cannot start with restricted item "${itemId}"`);
    }
    assert.ok(
      career.starting_skills.some((skillId) =>
        Object.entries(data.skills[skillId].cost).every(
          ([resource, amount]) => amount <= (career.base_stats[resource] ?? 0),
        ),
      ),
      `${id} must have an affordable starting skill`,
    );
  }

  for (const [id, skill] of Object.entries(data.skills)) {
    if (skill.career) assertReference("careers", skill.career, `skills/${id}.career`);
    assert.ok(
      skill.damage || skill.applies_statuses?.length,
      `skills/${id} must deal damage or apply a status`,
    );
    for (const statusId of skill.removes_statuses ?? [])
      assertReference("statuses", statusId, `skills/${id}.removes_statuses`);
    for (const application of skill.applies_statuses ?? []) {
      assertReference("statuses", application.status, `skills/${id}.applies_statuses`);
      if (application.chance !== undefined)
        assertChance(application.chance, `skills/${id}.applies_statuses.chance`);
    }
  }

  for (const [id, item] of Object.entries(data.items)) {
    for (const careerId of item.career_tags ?? [])
      assertReference("careers", careerId, `items/${id}.career_tags`);
    for (const statusId of item.use?.removes_statuses ?? [])
      assertReference("statuses", statusId, `items/${id}.use.removes_statuses`);
    for (const application of item.use?.applies_statuses ?? []) {
      assertReference("statuses", application.status, `items/${id}.use.applies_statuses`);
      if (application.chance !== undefined)
        assertChance(application.chance, `items/${id}.use.applies_statuses.chance`);
    }
  }

  for (const type of ["enemies", "bosses"]) {
    for (const [id, actor] of Object.entries(data[type])) {
      if (type === "enemies") {
        for (const skillId of actor.skills)
          assertReference("skills", skillId, `${type}/${id}.skills`);
        for (const skillId of Object.keys(actor.ai?.weights ?? {})) {
          assertReference("skills", skillId, `${type}/${id}.ai.weights`);
          assert.ok(
            actor.skills.includes(skillId),
            `${type}/${id}.ai.weights contains a skill outside its skill list`,
          );
        }
      } else {
        for (const phase of actor.phases) {
          for (const skillId of phase.skills)
            assertReference("skills", skillId, `${type}/${id}.phases.skills`);
          for (const telegraph of phase.telegraphs ?? [])
            assertReference("skills", telegraph.skill, `${type}/${id}.phases.telegraphs`);
          for (const action of phase.on_enter ?? []) {
            if (action.apply_status)
              assertReference("statuses", action.apply_status, `${type}/${id}.phases.on_enter`);
          }
        }
      }
      for (const drop of actor.loot_table ?? []) {
        assertReference("items", drop.item, `${type}/${id}.loot_table`);
        assertChance(drop.chance, `${type}/${id}.loot_table.chance`);
      }
    }
  }

  for (const [id, encounter] of Object.entries(data.encounters)) {
    const targetType = encounter.type === "boss" ? "bosses" : "enemies";
    for (const actorId of encounter.enemies)
      assertReference(targetType, actorId, `encounters/${id}.enemies`);
    for (const itemId of encounter.rewards.items ?? [])
      assertReference("items", itemId, `encounters/${id}.rewards.items`);
  }
});

test("numeric bounds and encounter ordering follow the schema", () => {
  for (const [id, skill] of Object.entries(data.skills)) {
    for (const [resource, amount] of Object.entries(skill.cost)) {
      assert.ok(
        Number.isInteger(amount) && amount >= 0,
        `skills/${id}.cost.${resource} must be a nonnegative integer`,
      );
    }
    assert.ok(
      Number.isInteger(skill.cooldown) && skill.cooldown >= 0,
      `skills/${id}.cooldown must be a nonnegative integer`,
    );
  }

  for (const [id, status] of Object.entries(data.statuses)) {
    assert.ok(
      Number.isInteger(status.default_duration) && status.default_duration >= 1,
      `statuses/${id}.default_duration must be positive`,
    );
    assert.ok(
      Number.isInteger(status.max_stacks) && status.max_stacks >= 1,
      `statuses/${id}.max_stacks must be positive`,
    );
  }

  for (const [id, boss] of Object.entries(data.bosses)) {
    const thresholds = boss.phases.map((phase) => phase.hp_threshold);
    assert.equal(thresholds[0], 1, `bosses/${id} first phase must start at full health`);
    assert.ok(
      thresholds.every((threshold, index) => index === 0 || thresholds[index - 1] > threshold),
      `bosses/${id} phase thresholds must descend`,
    );
    for (const phase of boss.phases) {
      for (const telegraph of phase.telegraphs ?? []) {
        assert.ok(
          Number.isInteger(telegraph.warning_turns) && telegraph.warning_turns >= 1,
          `bosses/${id} telegraph warning_turns must be positive`,
        );
      }
    }
  }

  const orders = Object.values(data.encounters).map((encounter) => encounter.order);
  assert.equal(new Set(orders).size, orders.length, "encounter order values must be unique");
  for (const [id, encounter] of Object.entries(data.encounters)) {
    assert.ok(
      Number.isInteger(encounter.difficulty) &&
        encounter.difficulty >= 1 &&
        encounter.difficulty <= 5,
      `encounters/${id}.difficulty must be 1–5`,
    );
  }
});
