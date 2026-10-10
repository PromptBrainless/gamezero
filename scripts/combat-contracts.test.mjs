import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import {
  actionCommandSchema,
  combatEventSchema,
  resolvedActionSchema,
} from "../src/game/contracts/events.ts";
import {
  effectStepSchema,
  skillDefSchema,
  validateSkillCatalog,
} from "../src/game/contracts/skills.ts";

const root = new URL("../data/contracts/v1/", import.meta.url);
function collection(name) {
  return readdirSync(new URL(`${name}/`, root))
    .sort()
    .map((filename) => {
      const record = JSON.parse(readFileSync(new URL(`${name}/${filename}`, root), "utf8"));
      if (record.id) assert.equal(record.id, filename.replace(/\.json$/, ""));
      return record;
    });
}
const catalog = {
  skills: collection("skills"),
  effect_sequences: collection("effect_sequences"),
  targeting_rules: collection("targeting_rules"),
};
function ids(name) {
  return new Set(
    readdirSync(new URL(`../data/${name}/`, import.meta.url)).map(
      (filename) =>
        JSON.parse(readFileSync(new URL(`../data/${name}/${filename}`, import.meta.url), "utf8"))
          .id,
    ),
  );
}
const references = { statuses: ids("statuses"), careers: ids("careers") };
const [rejected, resolved] = collection("resolved_actions");

test("versioned content and resolved action fixtures validate", () => {
  const result = validateSkillCatalog(catalog, references);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  for (const action of [resolved, rejected]) {
    const parsed = resolvedActionSchema.safeParse(action);
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
  }
  assert.equal(resolved.events[5].payload.after, 17);
  assert.equal(resolved.events[6].payload.status_id, "bleeding");
});

test("skills reject unknown keys, nulls, invalid costs, chances and reaction windows", () => {
  const skill = catalog.skills[0];
  for (const change of [
    { surprise: true },
    { career: null },
    { schema_version: 2 },
    { costs: [{ resource: "stamina", amount: -1 }] },
    { costs: [{ resource: "hp", amount: 1 }] },
    {
      costs: [
        { resource: "focus", amount: 1 },
        { resource: "focus", amount: 2 },
      ],
    },
    { hit_rule: { mode: "accuracy", accuracy: 1.1, crit_multiplier: 1.5 } },
    { timing: { window: "after_melee_hit", effect_phase: "impact" } },
    { tags: ["melee", "melee"] },
  ]) {
    assert.equal(skillDefSchema.safeParse({ ...skill, ...change }).success, false);
  }
  assert.equal(
    skillDefSchema.safeParse({
      ...skill,
      type: "reaction",
      timing: { window: "after_melee_hit", effect_phase: "impact" },
    }).success,
    true,
  );
});

test("catalog aggregates missing references and duplicate IDs/steps", () => {
  const broken = structuredClone(catalog);
  broken.skills[0].career = "missing_career";
  broken.skills[0].targeting_rule_id = "missing_target";
  broken.skills[0].effect_sequence_id = "missing_sequence";
  broken.skills[0].requirements = [{ kind: "has_status", status_id: "missing_status" }];
  broken.skills.push(broken.skills[0]);
  broken.effect_sequences[0].steps[0].recipient = "source";
  broken.effect_sequences[0].steps[0].gate = "on_hit";
  const result = validateSkillCatalog(broken, { statuses: new Set(), careers: new Set() });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.length >= 6);
  const duplicate = structuredClone(catalog);
  duplicate.effect_sequences[0].steps.push(duplicate.effect_sequences[0].steps[0]);
  assert.equal(validateSkillCatalog(duplicate, references).success, false);
});

test("all effect opcodes have strictly validated numeric payloads", () => {
  const base = { id: "step_1", recipient: "source", gate: "always" };
  for (const effect of [
    { ...base, op: "heal", amount: { flat: 5, scaling_stat: "magic", multiplier: 0 } },
    { ...base, op: "grant_resource", resource: "focus", amount: 2 },
    { ...base, op: "remove_status", status_ids: ["bleeding"] },
    { ...base, op: "apply_status", status_id: "guarded", duration: 2, stacks: 1, chance: 1 },
  ])
    assert.equal(effectStepSchema.safeParse(effect).success, true);
  assert.equal(
    effectStepSchema.safeParse({ ...base, op: "move_target", amount: 3 }).success,
    false,
  );
  assert.equal(
    effectStepSchema.safeParse({ ...base, op: "grant_resource", resource: "focus", amount: 0.5 })
      .success,
    false,
  );
});

test("commands accept only intent, never client-owned rules or duplicate targets", () => {
  for (const change of [
    { seed: 1 },
    { damage: 999 },
    { target_ids: ["enemy_1", "enemy_1"] },
    { expected_revision: -1 },
    { target_ids: [] },
  ]) {
    assert.equal(actionCommandSchema.safeParse({ ...resolved.command, ...change }).success, false);
  }
});

test("events reject contradictory resource deltas, hit outcomes and missing targets", () => {
  const damage = resolved.events[4];
  for (const change of [{ damage_type: "typo" }, { amount: 0 }]) {
    assert.equal(
      combatEventSchema.safeParse({ ...damage, payload: { ...damage.payload, ...change } }).success,
      false,
    );
  }
  const resource = resolved.events[1];
  assert.equal(
    combatEventSchema.safeParse({ ...resource, payload: { ...resource.payload, delta: -8 } })
      .success,
    false,
  );
  assert.equal(combatEventSchema.safeParse({ ...resource, target_id: undefined }).success, false);
  assert.equal(
    combatEventSchema.safeParse({
      ...resource,
      phase: "impact",
      payload: {
        type: "resource_changed",
        resource: "hp",
        before: 10,
        after: 12,
        delta: 2,
        reason: "effect",
      },
    }).success,
    false,
  );
  const status = resolved.events[6];
  assert.equal(
    combatEventSchema.safeParse({
      ...status,
      payload: { ...status.payload, source_id: "wrong_source" },
    }).success,
    false,
  );
  const hit = resolved.events[3];
  for (const change of [
    { outcome: "miss" },
    { critical: true },
    { hit_chance: 0.5 },
    { hit_chance: 0.5, hit_roll: 0.9 },
    { crit_roll: 1 },
  ])
    assert.equal(
      combatEventSchema.safeParse({ ...hit, payload: { ...hit.payload, ...change } }).success,
      false,
    );
  assert.equal(
    combatEventSchema.safeParse({
      ...hit,
      payload: {
        type: "hit_resolved",
        outcome: "miss",
        hit_chance: 0.5,
        hit_roll: 0.9,
        critical: false,
        crit_chance: 0,
      },
    }).success,
    true,
  );
});

test("resolved batches enforce identities, phase order, revisions and sequence guarantees", () => {
  for (const mutate of [
    (action) => {
      action.events[1].sequence = 8;
    },
    (action) => {
      action.events[1].event_id = action.events[0].event_id;
    },
    (action) => {
      action.events[1].combat_id = "wrong_combat";
    },
    (action) => {
      action.events[1].source_id = "wrong_source";
    },
    (action) => {
      action.events[1].turn = 2;
    },
    (action) => {
      action.events[3].target_id = "unselected_target";
    },
    (action) => {
      action.target_ids = ["other_target"];
    },
    (action) => {
      action.events[2].payload.skill_id = "wrong_skill";
    },
    (action) => {
      action.events[3].phase = "commit";
    },
    (action) => {
      [action.events[2], action.events[3]] = [action.events[3], action.events[2]];
    },
    (action) => {
      action.revision_after = 2;
    },
    (action) => {
      action.rng_cursor_after = -1;
    },
    (action) => {
      action.events.at(-1).payload.revision = 99;
    },
    (action) => {
      action.events.shift();
    },
  ]) {
    const broken = structuredClone(resolved);
    mutate(broken);
    assert.equal(resolvedActionSchema.safeParse(broken).success, false);
  }
  const nonInitial = structuredClone(resolved);
  nonInitial.events.forEach((event) => {
    event.sequence += 100;
  });
  assert.equal(resolvedActionSchema.safeParse(nonInitial).success, true);
});

test("canonical target order is independent of command selection order", () => {
  const action = structuredClone(resolved);
  action.command.target_ids = ["enemy_2", "enemy_1"];
  action.target_ids = ["enemy_1", "enemy_2"];
  assert.equal(resolvedActionSchema.safeParse(action).success, true);
  action.target_ids.reverse();
  assert.equal(resolvedActionSchema.safeParse(action).success, false);
});

test("rejected actions cannot pay costs, advance revisions or consume RNG", () => {
  for (const change of [
    { revision_after: 2 },
    { rng_cursor_after: 3 },
    { events: [resolved.events[0]] },
  ])
    assert.equal(resolvedActionSchema.safeParse({ ...rejected, ...change }).success, false);
});
