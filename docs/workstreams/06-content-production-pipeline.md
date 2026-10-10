# 06 — Content Production Pipeline

## Mission and sources

Create an auditable path from Drive/raw material to reviewed canonical content and production art. Read [authoring rules](../data-authoring-rules.md), [schema](../data-schema.md), [runtime supplement](../final-runtime-data-design.md), [Sprint 1 pack](../art-sprint-1-production-pack.md), [checklist](../art-sprint-1-task-checklist.md) and [visual brief](../visual-reference-brief.md).

The older [content pipeline](../content-pipeline.md) proposes `.tres` as content authority; canonical slice JSON supersedes that. Drive is an intake source, never an alternate gameplay registry.

## Delivered versus pending

**Observed:** selected canonical JSON and art planning documents. No Drive-import/raw/curated implementation was found in the inspected repository checkpoint.

**Reported external state:** PR #16 Drive import and PR #17 doc orchestration are open with no files yet. Do not claim PR #16 imported material, treat #17 as merged, or launch remote jobs from this workstream plan.

**Pending:** concrete import/dry-run tooling, configured authorized source, provenance manifest, curation/QC and safe publication handoff. A connector being unavailable need not block existing local content or Godot acceptance.

## Ownership and boundaries

Own local import/curation tooling, intake manifests and proposed raw/curated artifacts. 04 owns publication to canonical `data/`; 05 owns final asset acceptance and runtime placement; 01 owns schema validation; 03 owns bundle export.

Proposed paths, to agree with integrator before implementation: `scripts/content-pipeline/` for tooling and `content-production/{raw,curated,manifests}/` for review artifacts. These are **not existing claimed directories**. Keep large/unlicensed/private raw material out of Git; manifests may point to authorized local/source artifacts rather than committing them.

Do not edit schema, stats, Godot bootstrap, production HUD or canonical entities directly as part of import. Shared `package.json` script changes require integrator ownership.

## Production flow

```text
authorized source / offline fixture
    → read-only intake + provenance
    → raw quarantine (never runtime-loaded)
    → normalization and validation
    → curated proposal + diff/QC report
    → 04 content review / 05 art review
    → explicit canonical publication
    → 01 validation → 03 deterministic export
```

Inputs must be explicitly authorized; no whole-Drive crawling or uploading private source data to third-party services. Credentials stay outside committed files/logs. An offline fixture proves tooling behavior, not live connector success.

## Implementation backlog

1. Agree source scope and intake formats. Use an explicit allowlist of selected documents/files; default to read-only and dry-run.
2. Record provenance per artifact: source/provider ID, source revision or modified timestamp, retrieval timestamp, local logical path, content checksum, intended collection/production ID, license/usage permission and reviewer state. Avoid storing tokens or unnecessary personal data.
3. Make imports idempotent by source identity/revision/checksum. Reimporting unchanged input must not create duplicates or alter canonical files.
4. Reject unsafe filenames, absolute/parent-traversal paths, unsupported types and output collisions. Stage results before publication; interrupted import must not corrupt accepted output.
5. Preserve raw input separately. Normalize field names/IDs only into proposals, showing the mapping and all conflicts. Never silently rename a released ID.
6. For data, validate JSON and references using 01. Reject placeholders, null/unknown fields and prose-only mechanics. Proposals stay within the existing slice count/budget unless a later milestone explicitly approves expansion.
7. For art, enforce Sprint 1 naming, transparent exports, source/license evidence, dimensions and actual-size silhouette QC. Generated prompts are production inputs, not finished assets.
8. Produce a reviewer diff: accepted/skipped/rejected files, duplicates, changed IDs/fields, validation failures and provenance gaps. Partial successes remain quarantined until review.
9. Hand content proposals to 04 and art to 05; publication is a separate explicit operation. Preserve provenance after promotion.
10. Distinguish offline-tested, authenticated read tested and live import accepted. Missing connector access is a documented blocker for live intake only.

## Executable acceptance

Existing canonical gate after **reviewed** publication:

```sh
npm run test:slice
npm run data:check
```

Follow-on tooling contract, **to implement rather than commands that already exist**:

```sh
node scripts/content-pipeline/import.mjs --fixture content-production/fixtures/minimal.json --dry-run
node --test scripts/content-pipeline/import.test.mjs
```

The owner must create that fixture/runner or report the acceptance unmet. No new service/dependency is mandated by these paths.

Required tests:

- Dry-run emits proposed changes and writes no canonical/runtime assets.
- Repeated same fixture gives identical normalized proposal/checksum and no duplicate artifact.
- Source revision change is visible in diff; conflicting existing ID cannot auto-overwrite.
- Malformed JSON, unknown fields and broken cross-references are quarantined with located diagnostics.
- Traversal/collision inputs cannot write outside the agreed intake root.
- Failed/interrupted import leaves prior accepted artifacts intact.
- Missing licensing/provenance prevents promotion; secrets are not serialized/logged.
- Data promotion requires 04 review; art promotion requires 05 QC.

Live Drive acceptance separately requires an authorized sample retrieval with revision/checksum manifest and redacted transport evidence. Offline tests do not certify live access or a remote PR.

## Dependencies and deferrals

Start planning against G0; normalization depends on G1. 04/05 are review gates, not downstream auto-consumers. 03 only reads published canonical data, never raw quarantine. Tooling is supporting work: no live connector is needed to export already-curated slice records.

Deferred: bidirectional sync, bulk destructive overwrites, whole-account indexing, editor CMS, automated balance approval, localization, giant catalogs and new world content.

## Copyable agent assignment

> Own package 06's local read-only/dry-run import, provenance, raw quarantine and curated proposals. Inspect current branch and PR #16 status before claiming existing tooling. Agree paths with integrator; use an allowlisted authorized source or offline fixture, no remote launches or whole-Drive crawl. Test idempotence, safe paths, conflicts, validation and interrupted writes. Never publish directly to data/ or runtime art: hand content to 04 and art to 05, preserving IDs/stats/slice budget and licensing. Report offline versus live-tested evidence separately and keep credentials/private raw files out of commits.
