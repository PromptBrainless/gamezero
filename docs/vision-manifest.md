# Vision Manifest

## Mission

GameZero is a data-driven tactical RPG: mobile-first, turn-based, and presented in
2D side view. Its ambition is to make a small number of decisions feel consequential
through legible rules, distinctive opponents, and a grounded dark-fantasy atmosphere.
We are building a game with a durable system underneath it, not a technology showcase
with a game attached.

The first proof is one complete run:

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

This manifesto extends the [slice vision](vision.md), not its scope. The
[target architecture](target-architecture.md) defines responsibility boundaries;
the [Game Director Pitch](game-director-pitch.md) expresses the experience they serve.
The [schema](data-schema.md), [slice plan](vertical-slice-implementation-plan.md), and
[workstreams](workstreams/README.md) remain authoritative for contracts and delivery.

## Player promise and product pillars

**Your decisions should matter, and you should understand why.** Victory should feel
earned through observation and timing; defeat should reveal something worth learning.

- **Readable tactics:** costs, available actions, targets, and resolved outcomes are
  understandable on a small screen. Mystery belongs to the world, not hidden rules.
- **Distinct identities:** each career and encounter teaches a different tactical
  relationship. More names and larger numbers are not substitutes for meaningful choices.
- **Concentrated dramatic rhythm:** preview creates anticipation, combat tests judgment,
  and reward/progression makes the next encounter feel like a continuation.
- **Trustworthy systems:** reproducible resolution makes balance review, bug diagnosis,
  and player-facing explanations agree.
- **A complete small game before a larger one:** finish the connected slice before
  multiplying systems, content, or platforms.

## Architectural principles

1. **Canonical content definitions describe what exists.** Author careers, skills,
   statuses, items, enemies, bosses, and encounters in the approved JSON collections.
   IDs connect records; descriptions do not secretly implement mechanics.
2. **A runtime supplement describes approved execution metadata.** The target is a
   separately validated, versioned companion for missing progression, targeting,
   status-lifecycle, stage/wave, or dialogue linkage. It is not mutable session state
   and must not duplicate fields already owned by canonical definitions.
   This supplement is a proposed contract, not an implemented collection.
3. **Deterministic combat rules own outcomes.** For the same validated content revision,
   initial combat instance state, seed, and ordered intents, resolution must produce
   the same next state and ordered events, independently of rendering.
4. **Definitions are read-only; instances change.** Combat instance state belongs to
   one battle. Run state carries approved progress between battles. Neither writes
   health, cooldowns, inventory quantities, or progress back into content definitions.
5. **Presentation communicates rather than adjudicates.** HUD, scenes, animation, and
   logs consume resolved values and events. They never decide damage, legal targets,
   rewards, or turn outcomes through their own formulas or timing.
6. **Godot is the runtime host.** It loads, orchestrates, and presents the game; it is
   not a competing content authority. The browser prototype supplies reference code
   and tests, not automatic approval of every prototype rule or proof of Godot parity.
7. **Fail closed at the content boundary.** Invalid records must produce actionable
   errors before gameplay starts, not inferred repairs or a silently substituted model.

## World and tone

The creative direction is grounded dark fantasy: worn equipment, threatened roads,
and opponents who seem to belong to a world under strain. Restraint gives a silhouette,
a warning, or a single decisive impact room to matter. This is a tonal commitment,
not approval of a campaign, a new lore canon, or speculative mechanics.

Readable tactics and emotional weight are partners. The player should see enough to
make a deliberate choice while still feeling the uncertainty of facing another threat.

## Boundaries and non-goals

The current budget remains three careers, nine player skills plus one enemy-only skill,
six statuses, three normal enemies, one boss, eleven items, and four ordered encounters.
Counts do not authorize new mechanics.

The first slice does not require save/load, accounts, networking, an overworld, shops,
an inventory-management screen, localization, expanded rosters, or heavy VFX. It is
not a live-service platform, a generic engine framework, or an uncurated content library.
Engine Resources must not become a second authored gameplay catalog.

Unspecified turn policy, lifecycle timing, reaction policy, and between-encounter
carryover remain explicit design decisions in the workstreams. Neither this vision
nor a convenient prototype default resolves them.

## Quality and authoring philosophy

Every content addition should have a purpose, valid references, an intelligible role,
and evidence that its approved behavior is consumed. Follow the
[authoring rules](data-authoring-rules.md): stable IDs, explicit numeric fields,
no placeholders, no unknown fields, and reviewable changes.

External source material is intake, not production content. The long-term authoring
path is intake → quarantine → normalization → validation → review → publication →
export. Validation protects structure; human review protects coherence, provenance,
and player value. Generated runtime bundles are outputs, never alternate authoring
sources. The full pipeline is a target, not a claim of existing automation.

Quality means a repeatable complete run, visible error paths, independently tested
rules, understandable feedback on narrow and wide screens, and recorded native
acceptance. Passing browser tests or preparing an art manifest is not a passed
Godot playable or a visual approval.

Every increment needs a resumable [handoff](workstreams/orchestration.md#repository-handoff-convention)
with traceable decisions and actual evidence. The [content pipeline](content-pipeline.md)
governs readiness; the presence of a file alone is not acceptance.

## Long-term scaling vision

After the first-playable gate, grow through curated careers, encounter chains, and
opponent variations that compose existing rules. Add a system only when composition
cannot express an approved player need. Larger campaigns, persistence, authoring
inspectors, balancing simulations, and additional hosts are future options, not
promised release features.

Scaling requires stable IDs, explicit contract migrations, separate schema/contract
versions and content revisions, and regression evidence. Host independence means
portable rules and testable contracts, not a promise of one binary running everywhere.
The sequence remains **Docs Final → First Playable Build → Post-Slice Expansion**.

## Decision heuristics

Before accepting a change, ask:

- Does it strengthen a player decision or complete a slice criterion?
- Which layer owns it, and can it be tested without borrowing another layer's authority?
- Does it reuse an approved definition or require an explicit contract review?
- Can we explain the result with the same rules the game executes?
- Is its completion supported by evidence, rather than an optimistic checklist?

If ownership or policy is unclear, clarify the contract before implementing. GameZero
should grow in depth and trust before it grows in breadth.
