import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../docs/workstreams/", import.meta.url));
const ledger = JSON.parse(readFileSync(resolve(root, "orchestration.json"), "utf8"));
const repository = resolve(root, "../..");
const instructionSurfaces = [
  "README.md",
  "AGENTS.project.md",
  ".github/copilot-instructions.md",
  "docs/README.md",
  "docs/vision.md",
  "docs/vision-manifest.md",
  "docs/target-architecture.md",
  "docs/game-director-pitch.md",
  "docs/runtime-data-plan.md",
  "docs/content-pipeline.md",
  "docs/project-history-and-execution-log.md",
  "docs/workstreams/source-coverage.md",
  "docs/godot-project-plan.md",
  "docs/system-scaling.md",
  "data/README.md",
  "godot/README.md",
  "scripts/README.md",
];

test("execution ledger covers six distinct briefs with an acyclic dependency graph", () => {
  assert.equal(ledger.workstreams.length, 6);
  const entries = new Map(ledger.workstreams.map((entry) => [entry.id, entry]));
  assert.equal(entries.size, 6);
  assert.equal(new Set(ledger.workstreams.map((entry) => entry.brief)).size, 6);
  assert.equal(new Set(ledger.workstreams.map((entry) => entry.agent_id)).size, 6);
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
    assert.ok(["started", "increment-complete", "blocked", "failed"].includes(entry.status));
    assert.equal(typeof entry.agent_id, "string");
    assert.ok(entry.agent_id.length > 0);
    if (entry.status === "increment-complete") assert.ok(entry.outcome);
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
  const plans = canonical.split("## First-playable execution")[1].split("## Tooling")[0];
  const sources = [...plans.matchAll(/\|\s*\[`([^`]+\.md)`\]/g)].map((match) => match[1]);
  assert.equal(sources.length, 18);
  for (const source of sources) assert.ok(coverage.includes(`\`${source}\``), source);
});

test("repository instruction surfaces have resolvable local links and anchors", () => {
  const headingAnchor = (heading) => heading.toLowerCase()
    .replace(/[^\p{L}\p{N}_\-\s]/gu, "").replace(/\s/g, "-");
  for (const name of instructionSurfaces) {
    const path = resolve(repository, name);
    const text = readFileSync(path, "utf8");
    for (const [, target] of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(target)) continue;
      const [file, anchor] = target.split("#");
      const destination = file ? resolve(dirname(path), file) : path;
      assert.ok(existsSync(destination), `${name}: ${target}`);
      if (anchor) {
        const headings = [...readFileSync(destination, "utf8").matchAll(/^#{1,6}\s+(.+)$/gm)];
        assert.ok(headings.some(([, heading]) => headingAnchor(heading) === anchor), `${name}: ${target}`);
      }
    }
  }
});

test("runtime guidance distinguishes proposed supplement and export from implemented scripts", () => {
  const runtime = readFileSync(resolve(repository, "docs/runtime-data-plan.md"), "utf8");
  const pipeline = readFileSync(resolve(repository, "docs/content-pipeline.md"), "utf8");
  const { scripts } = JSON.parse(readFileSync(resolve(repository, "package.json"), "utf8"));
  assert.match(runtime, /Runtime supplement direction \(planned, not implemented\)/);
  assert.match(runtime, /data\/runtime\/slice\.json/);
  assert.match(pipeline, /packaging and a[\s\S]*versioned runtime supplement are pending/);
  assert.equal(scripts["data:check"], undefined);
  assert.equal(scripts["data:export:godot"], undefined);
  assert.ok(scripts["test:slice"]);
});

test("handoff convention names stable decision, evidence, and resume destinations", () => {
  const text = readFileSync(resolve(root, "orchestration.md"), "utf8");
  const handoff = text.split("## Repository handoff convention")[1];
  assert.ok(handoff);
  assert.match(handoff, /project-history-and-execution-log\.md/);
  assert.match(handoff, /decisions-and-blocked-work/);
  assert.match(handoff, /exact commands/);
  assert.match(handoff, /next bounded action/);
  assert.match(handoff, /only for outcomes of its recorded dispatches/);
});

test("art brief preserves all 36 canonical production identifiers", () => {
  const pack = readFileSync(resolve(root, "../art-sprint-1-production-pack.md"), "utf8");
  const ids = [...pack.matchAll(/\|\s*\d{2}\s*\|[^|]+\|\s*`([^`]+)`/g)].map((match) => match[1]);
  assert.equal(ids.length, 36);
  const brief = readFileSync(resolve(root, "05-art-production.md"), "utf8");
  for (const id of ids) assert.ok(brief.includes(`\`${id}\``), id);
});
