import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { loadContent, type Collection } from "./validation.ts";

function sources() {
  const result: Partial<Record<Collection, Record<string, string>>> = {};
  for (const type of ["careers", "skills", "statuses", "items", "enemies", "bosses", "encounters"] as Collection[]) {
    const root = fileURLToPath(new URL(`../../../data/${type}/`, import.meta.url));
    result[type] = Object.fromEntries(readdirSync(root).filter((file) => file.endsWith(".json")).map((file) => [`data/${type}/${file}`, readFileSync(`${root}/${file}`, "utf8")]));
  }
  return result;
}

test("all canonical slice records load and validate", () => {
  const runtime = loadContent(sources());
  assert.deepEqual(runtime.issues, []);
  assert.equal(Object.keys(runtime.data.careers).length, 3);
  assert.equal(Object.keys(runtime.data.encounters).length, 4);
});

test("invalid JSON, unknown fields and missing references are aggregated", () => {
  const files = sources();
  files.skills!["data/skills/broken.json"] = "{";
  const careerPath = "data/careers/mercenary.json";
  const career = JSON.parse(files.careers![careerPath]);
  career.starting_items.push("missing_item");
  files.careers![careerPath] = JSON.stringify(career);
  const itemPath = "data/items/iron_sword.json";
  files.items![itemPath] = JSON.stringify({ ...JSON.parse(files.items![itemPath]), typo: 1 });
  const runtime = loadContent(files);
  assert.equal(runtime.ready, false);
  assert.ok(runtime.issues.some((issue) => issue.field === "json"));
  assert.ok(runtime.issues.some((issue) => issue.path === itemPath));
  assert.ok(runtime.issues.some((issue) => issue.message.includes("missing_item")));
});

test("filename mismatch, forbidden null and encounter order are rejected", () => {
  const files = sources();
  files.statuses!["data/statuses/wrong.json"] = files.statuses!["data/statuses/guarded.json"];
  const skillPath = "data/skills/arcane_bolt.json";
  files.skills![skillPath] = JSON.stringify({ ...JSON.parse(files.skills![skillPath]), tags: null });
  const encounterPath = "data/encounters/deserters_toll.json";
  files.encounters![encounterPath] = JSON.stringify({ ...JSON.parse(files.encounters![encounterPath]), order: 1 });
  const runtime = loadContent(files);
  assert.equal(runtime.ready, false);
  assert.ok(runtime.issues.some((issue) => issue.field === "id"));
  assert.ok(runtime.issues.some((issue) => issue.field === "tags"));
  assert.ok(runtime.issues.some((issue) => issue.field === "order"));
});

test("a career needs an affordable selectable starting skill", () => {
  const files = sources();
  const path = "data/careers/mercenary.json";
  const career = JSON.parse(files.careers![path]);
  for (const skillId of career.starting_skills) {
    const skillPath = `data/skills/${skillId}.json`;
    const skill = JSON.parse(files.skills![skillPath]);
    skill.cost = { stamina: career.base_stats.stamina + 1 };
    files.skills![skillPath] = JSON.stringify(skill);
  }
  const runtime = loadContent(files);
  assert.equal(runtime.ready, false);
  assert.ok(runtime.issues.some((issue) =>
    issue.path === path && issue.field === "starting_skills" && issue.message.includes("bezahlbare"),
  ));
});