# Vision Manifest

## Mission

GameZero aims to become a focused, data-driven tactical RPG: a small playable
system with durable foundations, not a catalog of disconnected prototypes.
Its identity is mobile-first, 2D side-view, turn-based combat.

The first commitment remains the [slice promise](vision.md):
**Career Select → Encounter Preview → Combat → Reward → Progression**.
This manifesto owns long-term intent, not replacement mechanics, schema, or release status.

## Player promise

Give the player compact decisions with visible consequences. Careers should feel
distinct, threats should be legible, and a successful run should reflect learning
rather than hidden rules. Explain relevant costs, status effects, and outcomes
without burying the battlefield in interface noise.

## Product pillars

- **Readable tactics:** show state and legal choices clearly before commitment.
- **Meaningful identity:** distinguish roles through approved skills and interactions,
  not an ever-growing list of nearly identical numbers.
- **Reproducibility:** the same seed and input sequence must produce the same rules
  outcomes, independent of animation speed or host.
- **Content discipline:** stable IDs, explicit contracts, curated records, validated references.
- **Finish before expansion:** deliver a coherent run before adding regions,
  persistence, shops, networking, or speculative subsystems.

## Architectural philosophy

Gameplay truth belongs to canonical content definitions and deterministic combat
rules. A versioned runtime supplement may supply approved execution linkage;
it must never become a shadow catalog or disguise unresolved policy.

Definitions remain read-only. Combat instance state, run state, presentation,
and the Godot runtime host have distinct responsibilities. Presentation communicates
rules outcomes; the host loads and orchestrates, rather than rewriting gameplay.
The [target architecture](target-architecture.md) maps these boundaries.

## World and tone

Aim for grounded fantasy under strain: contested roads, failing military order,
ritual threats, and encounters with specific identities. Weight comes from restraint,
readable danger, and purposeful feedback, not spectacle at the cost of comprehension.
The [Game Director Pitch](game-director-pitch.md) develops this creative direction;
it does not introduce new production content.

## Authoring and growth

Review external ideas before adopting them. Canonical JSON and the
[validation/export pipeline](content-pipeline.md) decide content readiness,
not the presence of a file or an attractive screen.
Invalid references and unsupported contracts fail visibly.

After first-playable acceptance, growth should be incremental: reviewed content,
explicit contract revisions, compatibility decisions, and regression evidence.
New frontends or authoring tools may consume the same rules/data boundaries;
they must not become alternate authorities.

## Quality standard and non-goals

Every delivered increment needs traceable decisions, relevant tests, honest
acceptance evidence, and a resumable [handoff](workstreams/orchestration.md#repository-handoff-convention).
A browser reference pass does not establish Godot parity or export readiness.
This document does not claim those systems are complete.

Do not pursue feature breadth, engine-owned rules, duplicate datasets, silent
schema extensions, or art-driven mechanics. The [slice plan](vertical-slice-implementation-plan.md),
[schema](data-schema.md), and [milestone gates](milestones.md) retain operational authority.

## Decision heuristics

Choose the change that improves the playable loop while preserving its boundaries.
Prefer an existing subject owner over another document, a validated record over
a hard-coded copy, and a blocked decision with an accountable role over a guessed rule.
If a proposal cannot name its layer, source authority, and acceptance gate, clarify
those before implementing it.
