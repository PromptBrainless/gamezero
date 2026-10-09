# Implementierungs-Roadmap

Teil der [Dokumentation](README.md). Verfeinert die Meilensteintabelle in
[mini-gdd.md](mini-gdd.md) Abschnitt 16 (M0–M7) und ordnet sie Phasen zu.
Inhalte: [initial-content-plan.md](initial-content-plan.md); Skalierung: [system-scaling.md](system-scaling.md).

Definition of Done je Meilenstein: Tests grün, Build auf Android-Gerät getestet, Doku aktualisiert.

## Phasenübersicht

| Phase | Mini-GDD-Meilenstein | Fokus |
|---|---|---|
| 0 – Docs/Foundation | M0 | Doku, Entscheidungen, Projektgerüst |
| 1 – Prototyp | M1–M2 | Regelkern headless, Greybox-Kampf |
| 2 – Vertical Slice | M3 | Ein Kampf in Endqualität |
| 3 – Combat Alpha | M4 (+ Kampfteile M5) | Vollständiger Kampf, Meta-Basis |
| 4 – Content Alpha | M5–M6 | Startroster, Bosse, Editor, Optionen |
| 5 – Polish/Beta-Vorbereitung | M7 | Performance, Balancing, Stabilität |

## Phase 0 – Docs/Foundation
- Doku-Set abgeschlossen (Vision, Mini-GDD, Combat, HUD, Content, Scaling, Roadmap).
- Entscheidungen: Hochformat als Primär (Annahme), Animationspfad (Spine vs. Skeleton2D) vorbereitet.
- Godot-Projektgerüst, Ordnerstruktur, Test-Framework (GUT/gdUnit4), CI-Grundlauf.
- **Abnahme:** Docs freigegeben, leeres Projekt baut und führt Tests aus.

## Phase 1 – Prototyp
- Regelkern headless: `CombatState`, Resolver, Event-Log, Seed-RNG, KI-Basis.
- Datenlader mit Schema-/Referenzvalidierung; 3 Gegner, erste Skills/Status.
- Balancing-Simulation (viele Seeds) als Testwerkzeug.
- Greybox-Kampf mit Platzhaltern, HUD v1 auf echtem Gerät, 10 Skills, 6 Status.
- **Abnahme:** Kampf deterministisch reproduzierbar; Touch-Bedienung im Greybox spielbar.

## Phase 2 – Vertical Slice
- 1 Spieler, 1 Gegner, 1 Boss mit finalem Animationsstil und HUD-Stil.
- Hit-Feedback (Hit-Stop, Shake, VFX), Telegraphen, Phasenwechsel-Präsentation.
- Animationspfad entschieden; 60-fps-Test auf Zielgerät.
- **Abnahme:** Ein Kampf, der Zielqualität und Tonalität der [Vision](vision.md) belegt.

## Phase 3 – Combat Alpha
- Alle Kernmechaniken: Aktionen, Reaktionen, Ressourcen, 12 Status, Wunden.
- Meta-Basis: XP, Karriere-Rang, Inventar/Equipment, versionierter Savegame.
- Combat-Balancing über Simulation (Ziel-Siegquoten laut [combat-design.md](combat-design.md)).
- **Abnahme:** Kompletter Loop Camp → Kampf → Belohnung → Camp ohne Platzhalter-Logik.

## Phase 4 – Content Alpha
- Startroster: 6 Karrieren (Rang 1–2), 20 Skills, Gegnerfamilien, 2 Bosse, ~30 Items.
- Erste Region(en) laut Regionssystem; Camp-Screen.
- Charakter-Editor, Optionen, Lokalisierung DE/EN.
- **Abnahme:** Slice-Begegnungsfolge (5 Kämpfe → Boss 1 → Camp → 4 Kämpfe → Boss 2) durchspielbar.

## Phase 5 – Polish/Beta-Vorbereitung
- Performance-Pass für Low-End-Geräte, Speicher- und Akkuverbrauch.
- Feintuning: Balancing, Tooltips, Barrierefreiheit (Farbenblind, Textgröße).
- Crash-Freiheit, Telemetrie-freie Fehlerberichte, Savegame-Migrationstests.
- **Abnahme:** Closed-Beta-Build stabil; Release-Checkliste erfüllt.

## Nach der Beta (Ausblick)
Rang 3–4 der Karrieren, neue Karrieren, weitere Regionen, Gegnerfamilien und Bosse
gemäß [system-scaling.md](system-scaling.md).

## Risiken und Abhängigkeiten
- Animationspipeline ist der größte Kostentreiber – früh in Phase 2 prüfen.
- Regelkern muss vor UI stabil sein; UI hängt nur an der Event-Queue.
- Offene Fragen aus dem Mini-GDD (Spine vs. Skeleton, Hoch-/Querformat) bleiben Entscheidungen von Phase 1–2.
