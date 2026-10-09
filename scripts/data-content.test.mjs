import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { projectRoot } from "./with-app-env.mjs";

const dataRoot = join(projectRoot(), "data");
const expectedCounts = {
  careers: 3,
  skills: 8,
  statuses: 6,
  enemies: 3,
  bosses: 1,
  items: 8,
  encounters: 4,
};

function records(kind) {
  const directory = join(dataRoot, kind);
  return Object.fromEntries(
    readdirSync(directory)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => {
        const record = JSON.parse(readFileSync(join(directory, file), "utf8"));
        assert.equal(record.id, file.slice(0, -5), `${kind}/${file} id must match its filename`);
        assert.match(record.id, /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
        return [record.id, record];
      }),
  );
}

function assertReference(recordsByKind, kind, id, source) {
  assert.ok(recordsByKind[kind][id], `${source} references missing ${kind} id "${id}"`);
}

function assertDrops(recordsByKind, drops, source) {
  for (const drop of drops) assertReference(recordsByKind, "items", drop.item_id, source);
}

test("vertical-slice files have the requested counts and canonical IDs", () => {
  const all = Object.fromEntries(Object.keys(expectedCounts).map((kind) => [kind, records(kind)]));

  for (const [kind, count] of Object.entries(expectedCounts)) {
    assert.equal(Object.keys(all[kind]).length, count, `${kind} file count`);
  }
  assert.deepEqual(Object.keys(all.careers), ["duelist", "mercenary", "scholar_mage"]);
  assert.deepEqual(Object.keys(all.statuses), [
    "bleed",
    "burning",
    "guarded",
    "marked",
    "stunned",
    "weakened",
  ]);
  assert.deepEqual(Object.keys(all.enemies), ["ash_hexer", "cult_duelist", "road_bruiser"]);
  assert.deepEqual(Object.keys(all.bosses), ["iron_captain"]);
});

test("all career, skill, status, reward, boss, and encounter references resolve", () => {
  const all = Object.fromEntries(Object.keys(expectedCounts).map((kind) => [kind, records(kind)]));

  for (const career of Object.values(all.careers)) {
    for (const skillId of career.starting_skills) {
      assertReference(all, "skills", skillId, `career ${career.id}`);
    }
  }
  for (const skill of Object.values(all.skills)) {
    assertReference(all, "careers", skill.career_id, `skill ${skill.id}`);
    for (const effect of skill.effects) {
      assertReference(all, "statuses", effect.status_id, `skill ${skill.id}`);
    }
  }
  for (const item of Object.values(all.items)) {
    if (item.effect.status_id !== null) {
      assertReference(all, "statuses", item.effect.status_id, `item ${item.id}`);
    }
  }
  for (const enemy of Object.values(all.enemies)) {
    for (const skillId of enemy.skills)
      assertReference(all, "skills", skillId, `enemy ${enemy.id}`);
    assertDrops(all, enemy.rewards.item_drops, `enemy ${enemy.id}`);
  }
  for (const boss of Object.values(all.bosses)) {
    for (const skillId of boss.skills) assertReference(all, "skills", skillId, `boss ${boss.id}`);
    assertDrops(all, boss.rewards.item_drops, `boss ${boss.id}`);
    for (const phase of boss.phases) {
      for (const entry of phase.skill_weights) {
        assertReference(all, "skills", entry.skill_id, `boss phase ${phase.id}`);
      }
    }
  }
  for (const encounter of Object.values(all.encounters)) {
    for (const careerId of encounter.recommended_careers) {
      assertReference(all, "careers", careerId, `encounter ${encounter.id}`);
    }
    for (const wave of encounter.waves) {
      for (const group of wave.enemies) {
        assertReference(all, "enemies", group.enemy_id, `encounter ${encounter.id}`);
      }
      if (wave.boss_id !== null)
        assertReference(all, "bosses", wave.boss_id, `encounter ${encounter.id}`);
      assert.ok(
        wave.enemies.length > 0 || wave.boss_id !== null,
        `encounter ${encounter.id} has an empty wave`,
      );
      assert.ok(
        wave.boss_id === null || wave.enemies.length === 0,
        `encounter ${encounter.id} mixes a boss with regular enemies`,
      );
    }
    assertDrops(all, encounter.rewards.item_drops, `encounter ${encounter.id}`);
  }
});

test("content has no placeholder text or empty records", () => {
  for (const kind of Object.keys(expectedCounts)) {
    for (const record of Object.values(records(kind))) {
      assert.ok(Object.keys(record).length > 0, `${kind}/${record.id} is empty`);
      assert.doesNotMatch(
        JSON.stringify(record),
        /\b(?:todo|tbd|placeholder|lorem ipsum)\b/i,
        `${kind}/${record.id} contains placeholder text`,
      );
    }
  }
});
