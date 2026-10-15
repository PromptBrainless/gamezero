# Project History and Execution Log

[... previous content from main preserved; see commit history ...]

## 2026-10-13 dynamic asset reference review

- **Scope/evidence:** follow-up on the seven dynamic expressions in the
  reproducible audit from baseline `ecbb7a8` (merged PR #52). Updated only
  `docs/assets/asset-inventory-and-pairing.md` and this handoff. Source review
  covers the three expression-owning components, their candidate image files,
  and `src/routes/index.tsx`; the current root route mounts `SliceApp`, not the
  legacy ECHO//BRUCH components.
- **Decision:** all seven expressions are now individually mapped to their
  source-constrained IDs/states and marked **needs-follow-up** in the owning
  pairing record. The scanner and generated manifest remain unchanged and
  reproducible: source enumeration narrows the candidates but does not prove
  runtime loads, visual quality, provenance, or rights. No asset is approved,
  paired with audio, or integrated by this review.
- **Validation:** `npm run assets:audit:check` passed.
  `node --test scripts/asset-audit.test.mjs scripts/workstream-docs.test.mjs`
  passed all 12 checks. `git diff --check` passed. These are source,
  documentation, and manifest checks; no browser runtime or visual review was
  performed.
- **Unverified/blocker:** project/art owner must decide whether the currently
  unmounted legacy components should be retained. That scope decision and
  per-file provenance/rights evidence block any approval; if retained, generated
  URLs and actual image loads still need a runtime/visual check.
- **Resume:** project/art owner records retain-or-retire for the legacy
  ECHO//BRUCH views. For retained views, test the generated image URLs and
  rendered loads, review provenance/rights, then update this pairing owner and
  the asset statuses from evidence. Keep all seven statuses open until those
  gates are met.
