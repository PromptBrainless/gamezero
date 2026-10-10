# Agent orchestration

## Operating contract

Each of the six briefs has a dedicated implementation agent. The first dispatch is a bounded, useful coding increment in its exclusive directories, followed by a remaining-work/blocker report. This starts implementation without pretending six simultaneous agents can independently decide shared gameplay contracts or finish the whole Godot game.

Agents read their full brief and the shared index, use the canonical sources, inspect existing code, implement only their initial assignment, run relevant checks themselves, and report changed paths, actual check results and remaining acceptance criteria. No agent may edit another stream, change dependencies, fabricate approval, or commit/push independently.

The parent owns planning documents, launch records and publication. The existing PR #17 is used for this work; no new PR creation capability is available. The board's preferred separate implementation PRs remain a later handoff, not a claim that six PRs were opened.

## Launch evidence

The [ledger](orchestration.json) records actual IDs returned by the session's agent launcher. These are **session subagents**, not independent GitHub cloud task URLs. They implement in this checkout/current PR; no external follow-on cloud-task creation tool is available. Do not present them as persistent jobs across session shutdown.

Status vocabulary: `started` means dispatch succeeded; `increment-complete` means the bounded initial assignment was delivered, with remaining work still pending; `blocked` means explicit dependency/tool/approval prevents progress; `failed` means dispatch or execution failed. Whole-workstream completion requires its acceptance proof and is not inferred from an agent returning.

## Completion and follow-on handoff

1. Inspect returned changed-path ownership and evidence; do not overwrite concurrent work.
2. Scan every changed file before the parent commits. Review/publish only scoped changes on this PR.
3. Record initial increment outcome and remaining blockers in the ledger; retain the briefs' pending checklists until actual criteria are met.
4. Review WS01/WS02 signatures and gameplay decisions before requesting integration increments. WS06 coordinates boot/export only then.
5. Re-dispatch from the same full brief plus accepted signatures and latest evidence; a launch record alone is not an unattended dependency scheduler.
6. If separate GitHub tasks/PRs become available later, transfer each brief with its ownership, dependencies and acceptance unchanged. Until then, the session tasks are the actual implementation efforts started here.
