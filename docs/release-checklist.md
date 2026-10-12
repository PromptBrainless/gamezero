# GameZero Release Candidate Checklist

**Status**: In Progress  
**Target**: First Playable / Release Candidate  
**Last updated**: 2026-10-12

## Prerequisites (must be done or blocked with evidence)

- [ ] **#37 QA** – Real Godot build + full playthrough (3 classes × 4 encounters)
- [ ] **#38 / #42 / #43 Assets** – Complete inventory + runtime references + pairing matrix
- [ ] **#39 Balance** – Duelist boss failure reproduced, root-caused, regression tests added
- [ ] **#40 Polish** – Combat feedback matrix (visual + audio) with pass/fail evidence

## Release Candidate Build (#41)

- [ ] Confirm blockers above are resolved or explicitly accepted
- [ ] Clean standalone export (document command + Godot version)
- [ ] Startup → full playthrough → save/progression → clean shutdown tested
- [ ] Mobile layout/input verified (or platforms explicitly stated)
- [ ] Build version / commit / export settings recorded
- [ ] Known issues list attached
- [ ] Genuine screenshots from running build attached

## Asset Manifest Template

| Path | Type | Dimensions/Duration | Size | Status | Runtime refs | License/Source | Notes |
|------|------|---------------------|------|--------|--------------|----------------|-------|
| example.svg | vector | 64x64 | 2 KB | placeholder | none | internal | — |
| example.ogg | audio | 1.2s | 45 KB | candidate | combat/hit | CC0 | loopable |

**Status values**: `referenziert` | `nicht referenziert` | `fehlt` | `Duplikat/Build` | `Platzhalter` | `freigegeben`

## Acceptance for RC

A reproducible export + test report + known-issues list exists. Do not call it release-ready until evidence is committed.

---
*Auto-generated starting point – update with real data.*
