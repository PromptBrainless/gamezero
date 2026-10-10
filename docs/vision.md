# Game Vision

GameZero is a mobile-first, 2D side-view, turn-based combat RPG. The near-term goal is a complete **First Playable Vertical Slice**, not a broad catalog of unfinished systems.

This file owns the slice promise. The [Vision Manifest](vision-manifest.md) owns
long-term intent, the [Target Architecture](target-architecture.md) maps layers,
and the [Game Director Pitch](game-director-pitch.md) develops creative tone.
None replaces the approved schema or slice acceptance gates.

## First playable promise

The player selects a career, previews an encounter, makes readable combat decisions, receives a reward, and carries the run into progression:

```text
Career Select → Encounter Preview → Combat → Reward → Progression
```

The slice should demonstrate that content-driven data, combat resolution, and presentation work as one coherent loop.

## Design principles

- **Readable tactics:** the player can understand current state, action costs, and relevant outcomes before committing.
- **Meaningful choices:** careers, skills, statuses, and equipment should have distinct roles rather than differ only by numbers.
- **Rules before presentation:** the resolver owns gameplay; HUD and animation communicate its results.
- **Data-led content:** slice content is authored in the canonical JSON model and validated by reference.
- **Finish the slice first:** broader world, roster, persistence, multiplayer, and live-service features are deferred unless needed to satisfy a slice criterion.

These principles summarize the useful direction in PRs #2–#4. Detailed mechanics, implementation gates, and art production are owned by their linked source-of-truth documents, not duplicated here.
