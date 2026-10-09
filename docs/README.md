# Dokumentation – Index

Quelle der Wahrheit für die Planung des Godot-Mobile-Spiels (Arbeitstitel
„ECHO//BRUCH Mobile“). Status aller Dokumente: **Entwurf v0.1**.

| Dokument | Inhalt |
|---|---|
| [vision.md](vision.md) | Vision, Design-Säulen, Spielerfantasie, Ton/Präsentation, Mobile-first-Identität |
| [mini-gdd.md](mini-gdd.md) | Vision, Säulen, Loops, Kampfprinzipien, Visuals, Animation, Karrieren, Progression, Inventar, Repo-Struktur, Meilensteine |
| [hud-wireframe.md](hud-wireframe.md) | Kampf-HUD und Mobile-UX (Wireframes, Touch-Regeln) |
| [combat-design.md](combat-design.md) | Kampfsäulen, Zugschleife, Aktion/Reaktion, Ressourcen, Treffer/Schaden/Status, Bossprinzipien, Event-Modell, Balancing |
| [initial-content-plan.md](initial-content-plan.md) | Start-Content: Karrieren, 12 Status-Effekte, 20 Skills, Gegner, 2 Bosse, Items |
| [system-scaling.md](system-scaling.md) | Datenmodelle, Content-Ebenen, Karriere-/Skill-/Status-/Gegner-/Boss-/Regionsskalierung, Repo-Organisation, Risiken |
| [implementation-roadmap.md](implementation-roadmap.md) | Phasen von Docs/Foundation über Prototyp, Vertical Slice, Combat/Content Alpha bis Polish/Beta |

Lesereihenfolge: vision → mini-gdd → combat-design → hud-wireframe →
initial-content-plan → system-scaling → implementation-roadmap.

Welche Datei wofür?
- *Warum und wie fühlt es sich an?* → vision
- *Überblick über alle Systeme* → mini-gdd (Einstieg, Quelle für Struktur)
- *Kampfregeln im Detail* → combat-design
- *Konkrete Startinhalte* → initial-content-plan
- *Wie wächst das Ganze?* → system-scaling
- *Wann wird was gebaut?* → implementation-roadmap

Konventionen: Dokumentsprache Deutsch, Bezeichner für Code/Daten Englisch
(`snake_case` für IDs). Zahlenwerte sind **Startwerte für Balancing**, keine
endgültigen Regeln. Änderungen an Regeln zuerst im GDD, dann im Code.

Hinweis: Das bestehende Web-Spiel (`src/game/w100`, `src/game/*`) dient als
Regel-Referenz und Prototyp; das Godot-Projekt ist ein separater Strang.
