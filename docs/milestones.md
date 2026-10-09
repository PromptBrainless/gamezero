# Project Milestones

This plan separates documentation closure, the first playable implementation,
and expansion after the slice. Each milestone has one outcome and a clear gate;
work belongs to the earliest milestone whose outcome it directly serves.

## 1. Docs Final

**Purpose:** Close planning and agree on an implementation-ready baseline before
the first playable build begins.

**Focus:** Finalize the data schema and authoring rules, runtime data plan, UI
foundation and first-playable screen-flow plan, and any vertical-slice
implementation plan. Keep IDs, references, screen flow, and acceptance criteria
consistent across those documents.

**Done when:**
- The plans agree on the first slice's scope, data contracts, and screen flow:
  Career Select → Encounter Preview → Combat Screen → Reward Screen →
  Progression Screen.
- Each planned system has a defined first-slice responsibility and observable
  acceptance criteria.
- Open decisions that block implementation are resolved or explicitly deferred
  with an owner and a later milestone.

**Non-goals:** Implementing runtime systems or screens, adding content beyond
what is needed to specify the slice, and polishing speculative future systems.

**Transition rule:** Start First Playable Build only when the baseline is
consistent enough that implementation does not depend on unresolved
foundational decisions. Small discoveries may be documented during the build,
but changes to a shared contract must be reviewed across the affected plans.

**Anti-mixing rule:** This milestone produces plans, not implementation. Do not
use documentation closure to sneak in code, content expansion, or design work
that has no bearing on the first slice.

## 2. First Playable Build

**Purpose:** Turn the agreed baseline into one complete, verifiable playable
vertical slice.

**Focus:** Build the minimum runtime data foundation (JSON loader, ID-based
registry, structural and reference validation, and encounter resolution), the
shared UI foundation, and the five-screen flow from career selection through
progression. Prefer a small amount of real, connected content over broad
placeholder coverage.

**Done when:**
- A player can select a career, preview and start an encounter, complete combat,
  receive rewards, and reach progression without a broken or simulated-only
  transition.
- The slice loads its data by ID; duplicate IDs, malformed data, and missing
  references produce actionable errors.
- The flow can be run repeatedly, and its core behavior can be verified against
  the agreed acceptance criteria.

**Non-goals:** Large content catalogs, multiple regions or extended boss
chains, hot reload, authoring tools, localization pipelines, and systems that
are not required to finish or validate the slice.

**Transition rule:** Move to Post-Slice Expansion only after the complete flow
works end to end and the slice's critical data, combat, UI, and progression
risks have been exercised. Unmet slice criteria remain First Playable Build
work.

**Anti-mixing rule:** Do not let expansion requests displace end-to-end
completion. New content or systems enter this milestone only when they are
necessary to prove a stated slice criterion; otherwise defer them.

## 3. Post-Slice Expansion

**Purpose:** Grow the game from a validated playable baseline without making
the first slice's completion a moving target.

**Focus:** Add content and systems in deliberate increments, such as additional
careers, skills, enemies, encounters, regions, and deeper progression. Extend
the runtime and UI through explicit, backward-compatible needs demonstrated by
the expanded game.

**Done when:** Each expansion increment has its own scope and acceptance
criteria, works with the established data contracts, and preserves the
first-playable flow as a regression-tested baseline. This milestone is ongoing;
completion is assessed per increment, not by an unbounded feature list.

**Non-goals:** Reopening the first slice's acceptance gate for convenience,
replacing the agreed data model without a migration decision, or accumulating
unvalidated features into a single release.

**Transition rule:** Begin an increment only after the slice gate is met and
the increment's value, dependencies, and validation approach are clear. If
work exposes a foundational defect, pause expansion and address it as a
separately scoped correction before proceeding.

**Anti-mixing rule:** Keep each increment distinct from both documentation
closure and first-slice delivery. Do not quietly broaden the slice, and do not
bundle unrelated expansion items into the same acceptance gate.

## Cross-milestone rules

- The milestones are sequential gates, not parallel workstreams.
- Keep the first playable slice small enough to finish and broad enough to
  exercise the complete data-to-screen flow.
- Label deferred work with its intended later milestone; do not treat a
  placeholder or an unimplemented plan as completed work.
- Changes to shared contracts must identify the affected milestone and update
  the relevant documentation and validation criteria together.
