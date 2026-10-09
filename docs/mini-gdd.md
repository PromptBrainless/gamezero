# Mini-GDD – ECHO//BRUCH Mobile

Status: Entwurf v0.1 · Engine: **Godot 4.x** (GDScript, optional C# später) ·
Plattform: Android/iOS, Hochformat-Fokus mit Querformat-Support.

Siehe auch: [HUD-Wireframe](hud-wireframe.md) · [Content-Plan](initial-content-plan.md).

> Engine-Hinweis: Frühere Recherche empfahl Unity 6 als „stärkste“ Engine.
> Entscheidung für dieses Projekt: **Godot**, weil Text-/Datei-basierte Szenen
> und Ressourcen (`.tscn`, `.tres`, JSON) sich von KI-Agenten und in Git/Codespaces
> deutlich zuverlässiger bearbeiten und reviewen lassen als Unitys Editor-gebundene
> Assets (Meta-Dateien, YAML-Szenen, GUI-Setup). Spine-Runtimes existieren auch für Godot.

## 1. Vision und Säulen

**Vision:** Ein schnelles, brutales, gut lesbares 1v1-Kampf-RPG in 2D-Seitenansicht
für Mobile. Jeder Kampf dauert 2–5 Minuten, Builds (Karriere + Ausrüstung) verändern
spürbar, wie man kämpft. Düster-realistisches Fantasy-Setting mit Anleihen an
WFRP 4e (Karrieren, Verletzungen, Risiko).

**Säulen**
1. **Lesbar:** Ein Blick zeigt: wer ist dran, was passiert gleich, wie gefährlich ist es.
2. **Tief, nicht schwer:** Wenige Werte, viele Interaktionen (Stances, Status, Reaktionen).
3. **Build zählt:** Karriere und Ausrüstung ändern Spielstil, nicht nur Zahlen.
4. **Wuchtiges Feedback:** Treffer fühlen sich an (Hit-Stop, Shake, VFX) – ohne Regel-Einfluss.
5. **Daten statt Code:** Skills, Gegner, Items, Karrieren sind Ressourcen/JSON.

**Nicht-Ziele (v1):** Multiplayer, Gruppenkämpfe, Open World, Live-Service/Monetarisierung,
Grid-Taktik.

## 2. Core Gameplay Loop

```text
Camp/Hub → Begegnung wählen → Kampf (1v1) → Belohnung (XP, Loot, Wunden)
   ↑                                                        │
   └── Ausrüsten · Karriere-Fortschritt · Heilen/Training ←─┘
```

- Meta-Loop (Sitzung 10–20 Min): 3–5 Kämpfe, dann Boss oder Camp-Pause.
- Verletzungen (Wunden) bleiben nach dem Kampf teilweise bestehen und kosten Ressourcen im Camp.

## 3. Combat Loop und Prinzipien

**Ablauf einer Runde**
1. Initiative bestimmt, wer zuerst handelt (Wert + w100-Streuung, Details im Regel-Spec).
2. Aktiver Kämpfer wählt: **1 Hauptaktion** (Angriff/Skill/Item) + **1 Nebenaktion**
   (Stance, Bewegung zu/weg, Item-Quick-Slot).
3. Gegner kann mit einer **Reaktion** antworten (Parade, Ausweichen, Konter), sofern Ressource vorhanden.
4. Auflösung → Events → Präsentation → Status-Tick (Ende der Runde).
5. Siegbedingung: HP 0 oder Aufgabe/Moral-Bruch (nur Bosse/Elite).

**Ressourcen:** HP, Ausdauer (Stamina, für Skills/Reaktionen), Fokus (für Magie/Techniken).

**Prinzipien**
- **Regelkern ist rein datenbasiert und deterministisch** (Seed-basiert): 
  `Aktion → Resolver → Combat-Events → Presentation`. Animation löst nie Regeln aus.
- Events (`AttackStarted`, `HitRolled`, `Blocked`, `Crit`, `StatusApplied`, `HpChanged`,
  `Defeated`) bilden Log, Replay und Balancing-Simulation.
- Trefferwurf w100 (Trefferchance in %), sichtbar im Tooltip – kein verstecktes Würfeln.
- Telegraphen: Gegner kündigen starke Aktionen eine Runde vorher an.
- Keine Zahlenexplosion: HP-Skalierung flach, Breakpoints statt Prozent-Stacking.
- Verletzungen: Hohe Treffer können Wunden (Blutung, Benommen, Gebrochene Rüstung…) erzeugen.
- AI: regelbasiert + Utility-Scoring pro Archetyp; Bosse mit Phasen-Skript. Kein Cheating.

## 4. HUD / Mobile UX

Kurzfassung (Details: [hud-wireframe.md](hud-wireframe.md)):
- Hochformat: Arena oben (~55 %), Aktionsbereich unten im Daumenradius.
- Max. 4–6 Primäraktionen sichtbar, Rest in Untermenüs (Skills, Items).
- Long-Press = Tooltip mit Trefferchance, Kosten, Effekt.
- Ziel-Mindestgröße Touch: 48 dp.
- Optionen: Tempo (1×/2×), Auto-Kampf, Log, Vibration, Screenshake, Farbenblind-Modus,
  Textgröße, Sprache.

## 5. Visuelle Präsentation

- **Hybrid-Look:** Figuren als modulare 2D-Skelett-Puppets, gemalte Parallax-Hintergründe
  (3 Ebenen), Sprite-basierte VFX, dunkle Fantasy-UI mit klaren Kontrasten.
- Kamera fest in Seitenansicht; Spieler links, Gegner rechts; leichter Kamera-Punch bei Treffern.
- Farbsprache: Schaden rot, Block blau/grau, Heilung grün, Gift gelb-grün, Magie violett,
  Telegraph-Warnung orange-gelb mit Icon (nicht nur Farbe).
- Charakter-Editor: Körpertyp, Gesicht, Haare/Bart, Hautton, Farbpaletten; Rüstung/Waffen
  als Overlay-Teile, die Ausrüstung sichtbar machen.
- Alternativ-Option für Prototyp: Pixel-Art mit Layering (nur falls Skelett-Pipeline zu teuer).

## 6. Animationsrichtung

- Godot `Skeleton2D`/`AnimationPlayer` oder Spine (Godot-Runtime); Entscheidung in Meilenstein M3.
- Pflicht-Set pro Figur: `idle`, `ready`, `step_in`, `step_out`, `attack_light`, `attack_heavy`,
  `cast`, `dodge`, `block`, `hit_light`, `hit_heavy`, `stun`, `defeat`, `victory`.
- Boss zusätzlich: `charge`, `taunt`, `phase_transition`, `summon`, `enrage`.
- Feedback: Hit-Stop 60–100 ms, Screenshake (abschaltbar), Hit-Flash-Shader, Smear-Frames, Zahlen-Popups.
- Ziel: 60 fps, 30 fps Fallback; Anim-Dauer pro Aktion ≤ 1,5 s (überspringbar/2×).
- Presentation hängt nur an der Event-Queue; Tempo-Schalter skaliert Animationen, nicht Regeln.

## 7. Karrieren / Professionen / Klassenstruktur

Statt Klassen-Silos: **Karrieren mit Rängen** (WFRP-inspiriert).
- Jede Karriere hat 4 Ränge: Rang 1 *Anwärter* → 2 *Geselle* → 3 *Meister* → 4 *Legende*.
- Jeder Rang gibt: Attribut-Boni, 1–2 Skills, 1 Talent/Passiv, Zugang zu Ausrüstungsklassen.
- Quereinstieg: Nach Rang 2 darf in eine verwandte Karriere gewechselt werden (Behalte Skills).
- Startroster (Details im [Content-Plan](initial-content-plan.md)): Söldner, Duellant, Jäger,
  Hexenknecht, Straßenkämpfer, Gelehrter-Magier.

## 8. Progressions-Ebenen

1. **Kampf-XP:** XP pro Sieg, Bonus für Bosse, Perfektsiege, höhere Gegnerstufe.
2. **Karriere:** XP-Ausgabe für Rang-Aufstieg, Talente, Skills (Skill-Slots limitiert: 6 aktiv).
3. **Camp/Meta:** Händler, Heiler, Trainingshalle, Gegner-Almanach, Kosmetik-Freischaltungen.
4. **Ausrüstung:** Seltenheiten (Gewöhnlich, Gut, Selten, Meisterwerk), Affixe, wenige Set-Boni.

## 9. Inventar- und Equipment-Slot-Modell

| Slot | ID | Hinweis |
|---|---|---|
| Waffe | `weapon` | bestimmt Waffenklasse und Basisaktionen |
| Nebenhand | `offhand` | Schild, Parierdolch, Fokus; leer bei Zweihand |
| Kopf | `head` | |
| Brust | `chest` | Hauptrüstungswert |
| Hände | `hands` | |
| Beine | `legs` | |
| Schmuck 1/2 | `trinket_1`, `trinket_2` | |
| Talisman | `talisman` | 1 Passiv, kampfentscheidend |
| Quick-Slots | `quick_1..3` | Verbrauchsgüter im Kampf |

Regeln: Items sind `ItemDefinition`-Daten; Modifikatoren (Affixe) getrennt von Basiswerten;
Rucksack mit 24 Slots + Stapel für Verbrauchsgüter; Loadouts (2 speicherbare Sets);
Inventar-UI strikt getrennt vom Kampfkern (nur `EquippedLoadout` wird gelesen).

## 10. Initiale Content-Planung

Vertical-Slice-Umfang (Details: [initial-content-plan.md](initial-content-plan.md)):
6 Karrieren (je Rang 1–2 für Slice), 12 Status-Effekte, 20 Skills, 8 Gegner-Archetypen,
2 Bosse, ~30 Items, 1 Arena (+1 Variante), 1 Camp-Screen.

## 11–14. Roster, Status, Skills, Gegner

Ausgelagert in den [Content-Plan](initial-content-plan.md) (Abschnitte 1–5).

## 15. Vorgeschlagene Repo-/Content-Struktur (Godot)

```text
godot/                      # Godot-Projektwurzel (project.godot)
  assets/
    characters/  enemies/  backgrounds/  ui/  vfx/  audio/
  data/
    careers/  skills/  statuses/  enemies/  bosses/  items/  loot/   # .tres oder .json
  src/
    core/            # Event-Bus, RNG, Service-Locator
    combat/          # CombatState, TurnResolver, DamageResolver, StatusSystem, AI
    characters/      # Attribute, CharacterBuild, Creator
    inventory/       # Inventory, Equipment, Loadout
    progression/     # XP, Careers, Talents
    presentation/    # AnimationDirector, VFX, Camera
    ui/              # HUD, Menüs, Tooltips
    save/            # SaveGameService (JSON, versioniert)
  scenes/  boot/  menu/  camp/  combat/
  tests/             # GUT/gdUnit4: Regelkern + Balancing-Sims
docs/                # diese Dokumentation
```

Regeln: `combat/` kennt weder `ui/` noch `presentation/`. IDs `snake_case`; jede Datendatei
hat `id`, `name_key` (Lokalisierung), `version`. Savegames versioniert mit Migrationen.

## 16. Meilensteine

| # | Meilenstein | Ergebnis / Abnahme |
|---|---|---|
| M0 | Doku & Entscheidungen | Dieses GDD freigegeben, Engine/Animationspfad entschieden |
| M1 | Regelkern-Prototyp | Kampf headless lauffähig, Event-Log, 3 Gegner, Balancing-Sim, Tests |
| M2 | Greybox-Kampf | Boxen/Platzhalter, HUD v1 auf echtem Gerät, 10 Skills, 6 Status |
| M3 | Visual Slice | 1 Spieler, 1 Gegner, 1 Boss animiert, Final-HUD-Stil, Hit-Feedback, 60 fps Test |
| M4 | Meta-Layer | XP, Karriere-Rang, Inventar/Equipment, Savegame |
| M5 | Content-Slice | Komplettes Startroster (siehe Content-Plan), 2 Bosse, Camp |
| M6 | Charakter-Editor & Optionen | Anpassung, Settings, Lokalisierung DE/EN |
| M7 | Polish & Closed Beta | Performance-Pass Low-End, Balancing, Crash-Freiheit |

Definition of Done je Meilenstein: Tests grün, Build auf Android-Gerät getestet, Doku aktualisiert.

## Offene Fragen
- Spine vs. Godot-Skeleton? (M3)
- Hoch- oder Querformat als Primär? (Annahme: Hochformat, M2 testen)
- Zielpreis/Monetarisierung (Premium vs. Demo+Unlock) – außerhalb v1.
