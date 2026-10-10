import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { validateRuntimeData } from "./runtime-data.mjs";

const dataRoot = new URL("../data/", import.meta.url);
const content = Object.fromEntries(
  ["careers", "skills", "statuses", "items", "enemies", "bosses", "encounters"].map((collection) => {
    const directory = new URL(`${collection}/`, dataRoot);
    return [collection, Object.fromEntries(readdirSync(directory)
      .filter((filename) => filename.endsWith(".json"))
      .map((filename) => {
        const record = JSON.parse(readFileSync(new URL(filename, directory), "utf8"));
        return [record.id, record];
      }))];
  }),
);

function fixture() {
  return JSON.parse(readFileSync(new URL("runtime/slice.json", dataRoot), "utf8"));
}

function invalid(mutator, field, base = content) {
  const metadata = fixture();
  mutator(metadata);
  const result = validateRuntimeData(base, metadata);
  assert.equal(result.ready, false);
  assert.equal(result.data, undefined);
  assert.ok(result.issues.length > 0);
  assert.ok(result.issues.some((issue) => issue.field.includes(field)), JSON.stringify(result.issues));
  for (const issue of result.issues) {
    assert.equal(typeof issue.path, "string");
    assert.equal(typeof issue.field, "string");
    assert.ok(issue.message.length > 0);
  }
  return result;
}

test("the real runtime slice validates without changing its input", () => {
  const metadata = fixture();
  const original = structuredClone(metadata);
  const result = validateRuntimeData(content, metadata);
  assert.deepEqual(result.issues, []);
  assert.equal(result.ready, true);
  assert.deepEqual(result.data, metadata);
  assert.deepEqual(metadata, original);
  assert.notEqual(result.data, metadata);
});

test("rejects missing, null, wrong-version and coerced envelope values", () => {
  for (const metadata of [undefined, null, [], "slice"]) {
    assert.equal(validateRuntimeData(content, metadata).ready, false);
  }
  invalid((data) => { data.schema_version = 2; }, "schema_version");
  invalid((data) => { data.schema_version = "1"; }, "schema_version");
  invalid((data) => { data.content_revision = "slice_2"; }, "content_revision");
  invalid((data) => { delete data.rules; }, "rules");
  invalid((data) => { data.actions[0].reaction_hook = null; }, "reaction_hook");
  invalid((data) => { data.stages[0].name = " \n "; }, "name");
  invalid((data) => { data.dialogue[0].nodes[0].text = ""; }, "text");
});

test("strictly rejects unknown fields at every nested boundary", () => {
  const paths = [
    [], ["rules"], ["rules", "resource_regen"], ["rules", "recovery_bonus"],
    ["careers", 0], ["careers", 0, "unlocks", 0],
    ["actions", 0], ["actions", 0, "selection"], ["statuses", 0],
    ["archetypes", 0], ["archetypes", 0, "combatant"],
    ["stages", 0], ["stages", 0, "player_slots", 0], ["stages", 0, "enemy_slots", 0],
    ["stages", 0, "layers", 0], ["encounters", 0], ["encounters", 0, "waves", 0],
    ["encounters", 0, "waves", 0, "spawns", 0], ["encounters", 0, "narrative"],
    ["equipment"], ["dialogue", 0], ["dialogue", 0, "nodes", 0],
  ];
  for (const path of paths) {
    invalid((data) => {
      const object = path.reduce((value, key) => value[key], data);
      object.unknown_field = true;
    }, [...path, "unknown_field"].join("."));
  }
});

test("literal rules cannot silently change the prototype behavior", () => {
  for (const key of ["turn_order", "damage_rounding", "enemy_cost_policy", "progression", "encounter_reset", "rewards"]) {
    invalid((data) => { data.rules[key] = "different"; }, `rules.${key}`);
  }
  invalid((data) => { data.rules.resource_regen.stamina = 5; }, "resource_regen.stamina");
  invalid((data) => { data.rules.resource_regen.focus = 4; }, "resource_regen.focus");
  invalid((data) => { data.rules.recovery_bonus.stamina = 7; }, "recovery_bonus.stamina");
  invalid((data) => { data.rules.recovery_bonus.focus = 5; }, "recovery_bonus.focus");
});

test("requires exact base coverage and valid references", () => {
  for (const collection of ["careers", "actions", "statuses", "archetypes", "encounters"]) {
    invalid((data) => { data[collection].pop(); }, collection);
    invalid((data) => { data[collection].push(structuredClone(data[collection][0])); }, collection);
  }
  for (const [collection, key] of [["careers", "career"], ["actions", "skill"], ["statuses", "status"], ["encounters", "encounter"]]) {
    invalid((data) => { data[collection][0][key] = "missing_record"; }, collection);
  }
  invalid((data) => { data.archetypes[0].combatant.id = "missing_actor"; }, "archetypes");
  invalid((data) => { data.encounters[0].stage = "missing_stage"; }, "stage");
  invalid((data) => { data.encounters[0].narrative.before = "missing_dialogue"; }, "narrative.before");
  invalid((data) => { data.encounters[0].waves[0].spawns[0].archetype = "missing_archetype"; }, "archetype");
  invalid((data) => { data.encounters[0].waves[0].spawns[0].slot = "missing_slot"; }, "slot");
});

test("inherited object names never resolve as base records or throw", () => {
  for (const identifier of ["constructor", "to_string", "prototype"]) {
    for (const [collection, key] of [["careers", "career"], ["actions", "skill"], ["statuses", "status"], ["encounters", "encounter"]]) {
      invalid((data) => { data[collection][0][key] = identifier; }, collection);
    }
    invalid((data) => { data.archetypes[0].combatant.id = identifier; }, "archetypes");
    invalid((data) => { data.encounters[0].stage = identifier; }, "stage");
    invalid((data) => { data.encounters[0].narrative.before = identifier; }, "narrative.before");
    invalid((data) => { data.encounters[0].waves[0].spawns[0].archetype = identifier; }, "archetype");
    invalid((data) => { data.dialogue[0].nodes[0].next = identifier; }, "next");
  }
});

test("career unlocks exactly cover their pool, beginning with starting skills", () => {
  invalid((data) => { data.careers[0].max_level = 5; }, "max_level");
  invalid((data) => { data.careers[0].unlocks[0].level = 0; }, "level");
  invalid((data) => { data.careers[0].unlocks[1].level = 5; }, "level");
  invalid((data) => { data.careers[0].unlocks.reverse(); }, "level");
  invalid((data) => { data.careers[0].unlocks[1].level = 1; }, "unlocks");
  invalid((data) => { data.careers[0].unlocks[0].skills.pop(); }, "unlocks");
  invalid((data) => {
    data.careers[0].unlocks[1].skills.push(data.careers[0].unlocks[0].skills[0]);
  }, "unlocks");
  invalid((data) => { data.careers[0].unlocks[1].skills[0] = "missing_skill"; }, "unlocks");
});

test("action selection and reaction hooks match their base skill", () => {
  invalid((data) => {
    data.actions[0].selection.team = data.actions[0].selection.team === "self" ? "opponent" : "self";
  }, "selection.team");
  invalid((data) => {
    data.actions.find((action) => !content.skills[action.skill].trigger).reaction_hook = "after_melee_hit";
  }, "reaction_hook");
  invalid((data) => {
    delete data.actions.find((action) => content.skills[action.skill].trigger).reaction_hook;
  }, "reaction_hook");
  invalid((data) => { data.actions[0].execution = "automatic"; }, "execution");
  invalid((data) => {
    data.actions.find((action) => content.skills[action.skill].trigger).execution = "manual";
  }, "execution");
  invalid((data) => {
    data.actions.find((action) => !content.skills[action.skill].trigger).execution = "reaction";
  }, "execution");
  invalid((data) => { data.actions[0].selection.count = 2; }, "count");
});

test("status stacking and archetype selection match base behavior", () => {
  invalid((data) => {
    data.statuses[0].stack_mode = data.statuses[0].stack_mode === "replace" ? "add_capped" : "replace";
  }, "stack_mode");
  invalid((data) => {
    data.archetypes.find((actor) => actor.combatant.collection === "bosses").selection_policy = "uniform_available";
  }, "selection_policy");
  invalid((data) => {
    data.archetypes.find((actor) => actor.combatant.collection === "enemies").selection_policy = "telegraph_first";
  }, "selection_policy");
  const base = structuredClone(content);
  const metadata = fixture();
  const actor = metadata.archetypes.find((entry) => entry.combatant.collection === "enemies");
  delete base.enemies[actor.combatant.id].ai;
  actor.selection_policy = "uniform_available";
  assert.equal(validateRuntimeData(base, metadata).ready, true);
  const duplicatePhases = structuredClone(content);
  const boss = Object.values(duplicatePhases.bosses)[0];
  boss.phases[1].id = boss.phases[0].id;
  assert.ok(validateRuntimeData(duplicatePhases, fixture()).issues.some((issue) => issue.field === "phases.1.id"));
});

test("stage ids, coordinates and scoped slot/layer ids are checked", () => {
  invalid((data) => { data.stages[0].id = "other_arena"; }, "stages");
  invalid((data) => { data.stages[0].enemy_slots[0].x = 1.1; }, "x");
  invalid((data) => { data.stages[0].player_slots[0].y = -0.1; }, "y");
  invalid((data) => { data.stages[0].layers[0].parallax = 0; }, "parallax");
  invalid((data) => { data.stages[0].enemy_slots[1].id = data.stages[0].enemy_slots[0].id; }, "slots");
  invalid((data) => { data.stages[0].enemy_slots[0].id = data.stages[0].player_slots[0].id; }, "slots");
  invalid((data) => { data.stages[0].layers[1].id = data.stages[0].layers[0].id; }, "layers");
});

test("waves enforce triggers, spawn identities, collection, slots and base enemies", () => {
  invalid((data) => { data.encounters[0].waves[0].trigger = "previous_wave_defeated"; }, "trigger");
  invalid((data) => {
    const wave = data.encounters[0].waves[0];
    wave.spawns.push(structuredClone(wave.spawns[0]));
  }, "spawns");
  invalid((data) => {
    const encounter = data.encounters.find((entry) => entry.waves[0].spawns.length > 1);
    encounter.waves[0].spawns[1].slot = encounter.waves[0].spawns[0].slot;
  }, "slot");
  invalid((data) => {
    const encounter = data.encounters.find((entry) => entry.waves[0].spawns.length > 1);
    encounter.waves[0].spawns[1].instance_id = encounter.waves[0].spawns[0].instance_id;
  }, "instance_id");
  invalid((data) => {
    data.encounters.find((entry) => entry.waves[0].spawns.length > 1).waves[0].spawns.reverse();
  }, "waves");
  invalid((data) => {
    data.encounters[0].waves[0].spawns[0].archetype =
      data.archetypes.find((actor) => actor.combatant.collection === "bosses").id;
  }, "archetype");
  const metadata = fixture();
  const encounter = metadata.encounters.find((entry) => entry.waves[0].spawns.length > 1);
  const second = encounter.waves[0].spawns.pop();
  encounter.waves.push({ id: "wave_2", trigger: "previous_wave_defeated", spawns: [second] });
  assert.equal(validateRuntimeData(content, metadata).ready, true);
  encounter.waves[1].trigger = "encounter_start";
  assert.ok(validateRuntimeData(content, metadata).issues.some((issue) => issue.field.endsWith(".trigger")));
  encounter.waves[1].trigger = "previous_wave_defeated";
  encounter.waves[1].id = encounter.waves[0].id;
  assert.ok(validateRuntimeData(content, metadata).issues.some((issue) => issue.message.includes("Duplicate")));
});

test("dialogue graphs must resolve, be reachable and terminate", () => {
  invalid((data) => { data.dialogue[0].nodes[0].next = "missing_node"; }, "next");
  invalid((data) => { data.dialogue[0].nodes[0].next = data.dialogue[0].nodes[0].id; }, "nodes");
  invalid((data) => { data.dialogue[0].nodes[0].id = "not_opening"; }, "entry");
  invalid((data) => {
    data.dialogue[0].nodes.push({ id: "unreachable", speaker: "Erzähler", text: "Kein Weg führt hierher." });
  }, "nodes");
  invalid((data) => { data.dialogue[0].nodes.push(structuredClone(data.dialogue[0].nodes[0])); }, "nodes");
  const metadata = fixture();
  const dialogue = metadata.dialogue[0];
  dialogue.nodes = [
    { id: "opening", speaker: "narrator", text: "Der Weg beginnt.", next: "ending" },
    { id: "ending", speaker: "Hauptmann", text: "Hier endet er." },
  ];
  assert.equal(validateRuntimeData(content, metadata).ready, true);
  dialogue.nodes[1].next = "opening";
  assert.ok(validateRuntimeData(content, metadata).issues.some((issue) => issue.message.includes("cycle")));
});

test("equipment slots are complete and unique", () => {
  invalid((data) => { data.equipment.slots.push("weapon"); }, "equipment.slots");
  invalid((data) => { data.equipment.slots.pop(); }, "equipment.slots");
  invalid((data) => { data.equipment.slots[0] = "consumable"; }, "equipment.slots");
});

test("aggregates independent shape and semantic errors", () => {
  const result = invalid((data) => {
    data.schema_version = 2;
    data.rules.resource_regen.focus = null;
    data.actions[0].selection.team = data.actions[0].selection.team === "self" ? "opponent" : "self";
    data.encounters[0].narrative.victory = "missing_dialogue";
    data.dialogue[0].nodes[0].next = data.dialogue[0].nodes[0].id;
  }, "schema_version");
  for (const field of ["rules.resource_regen.focus", "selection.team", "narrative.victory", "nodes"]) {
    assert.ok(result.issues.some((issue) => issue.field.includes(field)), field);
  }
});
