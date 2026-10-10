# Game Director Pitch

## The promise

A road disappears into the dark. Your equipment is worn. The next opponent is waiting.
There is no army behind you and no flood of spectacle to make the decision for you.
There is a moment to look, to understand, and to commit.

That is the heart of GameZero: **small decisions with weight**.

We want victory to feel like recognition: *I saw the danger. I chose my moment.
I earned this.* We want defeat to leave a sharper question, not a suspicion that
the game changed its rules when we were not looking.

This is a creative direction for a mobile-first, 2D side-view tactical RPG, not a claim
that the Godot first playable is finished. The [Vision Manifest](vision-manifest.md)
states the principles; the [target architecture](target-architecture.md) protects them.

## The fantasy and the world

You are not asked to become the most powerful thing in the world. You are asked to
become someone who knows how to survive it.

Our tonal horizon is grounded dark fantasy: roads that no longer feel safe, authority
that has lost its certainty, steel maintained because it must be used again.
Threat should feel local before it feels cosmic. A guarded stance, a hostile silhouette,
or a ritual warning can suggest a larger world without requiring an overworld map.

These images are a framing for future creative review, not new lore, regions, dialogue
systems, or mechanics added by this pitch. Existing German content remains the source
for encounter identity. We should deepen what is already there before inventing a
different game around it.

## What the player does

The first journey is deliberately compact:

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

Choose a career and feel its tactical identity. Study the next encounter. In combat,
weigh the actions the approved rules actually make available. A defense can feel like
resolve; a carefully chosen attack can feel like courage. Neither needs a dozen new
systems to carry that meaning.

Then let the result breathe. Reward is acknowledgment; progression is the invitation
to face what comes next. The connected run should create continuity without pretending
to be a finished campaign or promising persistence the slice does not contain.

## The emotional rhythm

**Anticipation. Judgment. Impact. Reflection.**

The preview should make the player lean in. The decision should be understandable
enough to own. The impact should confirm what happened. The aftermath should make the
next decision more informed.

Combat can be hard without becoming obscure. Loss is meaningful when the player can
name the mistake, the risk, or the chance that failed. Mastery comes from learning
relationships between careers, actions, statuses, and opponents—not memorizing a
private set of exceptions hidden in a scene script.

On a small screen, clarity is intimacy. A readable warning and an uncluttered choice
bring the player closer to the encounter than another layer of visual noise.

## Why this game matters

GameZero should respect attention. It should offer a concentrated tactical experience
where a short session can contain a real arc: uncertainty, a deliberate choice,
a consequence, and a reason to return.

Its distinction is not the size of a feature list. It is the trust between intention
and result. The game remembers the rules even when the presentation becomes dramatic.
An animation may sell a blow; it must never secretly decide whether that blow lands.

Canonical content definitions give encounters their identity. A reviewed runtime
supplement can eventually connect that content into richer execution structures.
Deterministic combat rules make consequences trustworthy. Combat instance state
records the immediate struggle; run state carries its approved aftermath. Presentation
makes those consequences felt, and Godot is the runtime host that brings them to life.
These are creative protections as much as engineering boundaries.

## The long-term dream

Imagine a growing collection of encounters that are worth remembering because each
asks something different of you. New careers change how you read familiar danger.
New opponents test a lesson rather than merely increasing a health bar.

That future is earned one complete, reviewed increment at a time. First we prove the
small run. Then we can consider broader encounter chains, stronger world continuity,
and more expressive presentation without losing the clarity that made the first
fight matter. Those are ambitions, not a release promise.

## Creative guardrails

- Keep the grounded tone; do not substitute spectacle or speculative mechanics for tension.
- Let career and encounter identity come from approved content, not contradictory UI lore.
- Make costs, targets, and consequences readable; never invent numerical certainty for drama.
- Preserve ordered event playback and respect reduced-effects/readability needs.
- Treat final art, sound, expanded rosters, and narrative systems as separately reviewed work.
- Finish the existing slice before expanding its scope.

The feeling we are chasing is simple: **the world is dangerous, but my choices are mine**.
GameZero should make that sentence true both emotionally and mechanically.
