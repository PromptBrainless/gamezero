# WS04 — First Playable Screen Flow

**Milestone:** First Playable Build · **Priority:** P1 · **Owner:** flow implementation agent.
**Sources:** [Track 3](../implementation-board.md), [screen contents/exits](../first-playable-ui-plan.md), [sequence/done criteria](../vertical-slice-implementation-plan.md), [vision](../vision.md).
**Dependencies:** WS01 lookup/resolution, WS02 result policy, WS03 combat UI. Prepare independently; integrate only after reviewed interfaces.

## Initial assignment

Implement standalone in-memory run context/navigation under `godot/scripts/progression/slice/`. Track selected career, ordered encounter cursor, XP/item handoff and consumed results. Reject duplicate rewards and invalid transitions; no saves, invented XP-level thresholds or career ranks. Do not wire boot or modify the existing progression stub.

## Complete backlog

- [ ] Career Select: render all three careers, their canonical stats, starting skills/items; explicit selection/confirmation leads to Encounter Preview.
- [ ] Encounter Preview: display resolved encounter identity, opponent/boss data, difficulty, arena key and inline reward summary; Start creates combat context from WS01.
- [ ] Combat: embed WS03 driven by WS02; victory exits to Reward. Agree defeat/exit/retry/reset with gameplay owner, without granting victory rewards for defeat.
- [ ] Reward: show encounter XP and item rewards; integrate enemy/boss loot only under reviewed canonical chance policy. Consume each result once so repeated navigation cannot duplicate XP/items.
- [ ] Progression: display minimal run handoff; Continue advances by canonical encounter order to next preview, or finishes after encounter four. No schema-absent rank track.
- [ ] Carry selected career, encounter/result identity, XP/item state and required combat context across screens; agree HP/resource/consumable carryover rather than silently deciding it.
- [ ] Provide reachable retry/finish/reset flow; reset in-memory state so a second run has no leaked career, rewards, statuses or encounter index.
- [ ] Connect screens to runtime readiness/error display; invalid records must not lead to a broken combat screen.
- [ ] Use shared WS03 UI foundations for readable mobile/wide layouts, focus/touch navigation and unavailable reasons.
- [ ] Complete the actual four-encounter sequence with all canonical content and fix slice-blocking handoff defects only.

## Acceptance and validation

Verify actual `Career Select → Encounter Preview → Combat → Reward → Progression → next Preview/finish` in Godot, not disconnected demo screens. Test all career selection paths, ordered encounters, normal/boss entry, victory reward handoff, defeat/exit recovery, duplicate-result rejection, terminal encounter and fresh repeat run.

State tests must prove no rewards without victory and no duplication across back/continue/reset actions. Record pending gameplay decisions separately from finished navigation. WS06 collects native end-to-end evidence.

**Excluded:** persistence, overworld, shop, inventory-management screen, full progression meta-system, new level/rank formulas, schema `progression[]`, unrelated menu/title art.
