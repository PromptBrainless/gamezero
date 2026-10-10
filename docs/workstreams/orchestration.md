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

## This dispatch's validation limits

This section and the ledger describe the recorded dispatch, not a live environment probe.

All six initial increments were delivered; see their individual ledger outcomes. Godot is absent, so native scripts, rendering, input and exported-build acceptance remain unverified. Agents reported passing content/reference checks where available; missing `zod` blocked the browser reference validation suite. No dependencies were added to work around these limits.

The automated review backend was unavailable; a separate read-only reviewer found no significant planning issues and identified a cyclic-input robustness issue in run-context validation. Its owning agent corrected it with a depth bound and focused native cases; those cases remain unexecuted without Godot. Automated security validation must still be assessed for the final code increment; GDScript is not a CodeQL-supported language.

## Repository handoff convention

Use this convention for every subsequent increment, including work outside the
recorded dispatch above. Do not create per-agent status files or raw chat transcripts.

1. Update the owning brief's pending criteria and the shared [decision queue](README.md#decisions-and-blocked-work) when a dependency/policy changes. Every unresolved item needs an accountable role, affected gate, and next action; do not resolve it by guessing.
2. Record accepted decisions in the owning canonical doc. Append a dated entry to [`../project-history-and-execution-log.md`](../project-history-and-execution-log.md) for cross-stream decisions or a resumable handoff, linking back to the owner rather than copying its contract.
3. Update `orchestration.json` only for outcomes of its recorded dispatches. Preserve historical agent IDs and PR references; later work uses dated history entries and actual issue/PR links, not fabricated ledger launches.
4. Keep [`../README.md`](../README.md) and affected local links current when a destination or authority changes. State which prior decision is superseded; do not leave two active owners.

A dated handoff entry must contain:

- **Scope/evidence:** workstream or issue/PR, source revision and working-tree caveats, owned changed paths, implemented increment versus remaining criteria.
- **Decisions:** links to updated canonical sections; unresolved question, accountable role, blocking dependency/gate.
- **Validation:** exact commands, actual pass/fail/blocked results, environment limits, and stable links to any retained evidence. Browser/static success must not be reported as native/export acceptance.
- **Resume:** the next bounded action, its destination paths, required input/approval, and check to run. Enough context to resume without the previous chat.

Keep transient diagnostics out of source control. Retained screenshots go in
`screenshots/`; sprint art evidence stays in `artifacts/art/sprint-1/`. Link only
files that exist or explicitly mark missing evidence as unverified.
