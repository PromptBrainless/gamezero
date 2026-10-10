import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../docs/workstreams/", import.meta.url));
const ledger = JSON.parse(readFileSync(resolve(root, "orchestration.json"), "utf8"));

test("execution ledger covers six distinct briefs with an acyclic dependency graph", () => {
  assert.equal(ledger.workstreams.length, 6);
  const entries = new Map(ledger.workstreams.map((entry) => [entry.id, entry]));
  assert.equal(entries.size, 6);
  assert.equal(new Set(ledger.workstreams.map((entry) => entry.brief)).size, 6);
  const visit = (id, ancestors = []) => {
    assert.ok(entries.has(id), `Unknown dependency ${id}`);
    assert.ok(!ancestors.includes(id), `Dependency cycle at ${id}`);
    for (const dependency of entries.get(id).dependencies) visit(dependency, [...ancestors, id]);
  };
  for (const entry of entries.values()) {
    visit(entry.id);
    const text = readFileSync(resolve(root, entry.brief), "utf8");
    assert.match(text, /## .*assignment/i);
    assert.match(text, /## Complete backlog/i);
    assert.match(text, /## Acceptance/i);
    assert.match(text, /Sources:/);
    assert.match(text, /Dependencies:/);
    assert.match(text, /Excluded:/);
    assert.ok(["pending-dispatch", "started", "increment-complete", "blocked", "failed"].includes(entry.status));
    if (entry.status !== "pending-dispatch") assert.ok(entry.agent_id);
  }
});

test("all generated documentation links resolve", () => {
  for (const name of ["README.md", "source-coverage.md", "orchestration.md", ...ledger.workstreams.map((entry) => entry.brief)]) {
    const path = resolve(root, name);
    for (const [, target] of readFileSync(path, "utf8").matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(target)) continue;
      assert.ok(existsSync(resolve(dirname(path), target.split("#")[0])), `${name}: ${target}`);
    }
  }
});

test("source coverage accounts for all canonical index documents", () => {
  const canonical = readFileSync(resolve(root, "../README.md"), "utf8");
  const coverage = readFileSync(resolve(root, "source-coverage.md"), "utf8");
  const sources = [...canonical.matchAll(/\|\s*\[`([^`]+\.md)`\]/g)].map((match) => match[1]);
  assert.equal(sources.length, 18);
  for (const source of sources) assert.ok(coverage.includes(`\`${source}\``), source);
});

test("art brief preserves all 36 canonical production identifiers", () => {
  const pack = readFileSync(resolve(root, "../art-sprint-1-production-pack.md"), "utf8");
  const ids = [...pack.matchAll(/\|\s*\d{2}\s*\|[^|]+\|\s*`([^`]+)`/g)].map((match) => match[1]);
  assert.equal(ids.length, 36);
  const brief = readFileSync(resolve(root, "05-art-production.md"), "utf8");
  for (const id of ids) assert.ok(brief.includes(`\`${id}\``), id);
});
