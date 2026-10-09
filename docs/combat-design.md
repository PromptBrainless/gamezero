# Kampfdesign

Teil der [Dokumentation](README.md). Vertieft [Mini-GDD](mini-gdd.md) Abschnitt 3.
Konkrete Skills, Status-Werte und Bosse: [initial-content-plan.md](initial-content-plan.md).
Alle Zahlen sind **Balancing-Startwerte**.

## 1. Kampfsäulen

1. **Entscheidungen zählen** – Jede Runde bietet echte Abwägungen (Risiko, Ressource, Timing).
2. **Lesbarkeit** – Vorschau von Trefferchance, Kosten und Telegraphen; kein verstecktes Würfeln.
3. **Regeln vor Darstellung** – Der Kampfkern ist deterministisch; Animation löst keine Regeln aus.
4. **Reaktion statt Warten** – Auch der passive Kämpfer hat Optionen (Parade, Ausweichen, Konter).
5. **Bosse sind Prüfungen** – Sie testen gelernte Mechaniken, nicht nur Lebenspunkte.

## 2. Zugschleife

```text
Rundenbeginn → Status-Tick (Start) → Initiative
   → Aktiver Kämpfer: Hauptaktion + Nebenaktion
   → Reaktion des Gegners (optional)
   → Auflösung → Combat-Events → Präsentation
   → Status-Tick (Ende) → Sieg-/Niederlagenprüfung → nächster Kämpfer
```

- Initiative: Wert + w100-Streuung (siehe Mini-GDD).
- Pro Zug: **1 Hauptaktion** (Angriff, Skill, Item) und **1 Nebenaktion** (Stance, Bewegung, Quick-Slot).
- Siegbedingung: HP 0; bei Elite/Boss zusätzlich Moral-Bruch möglich.
- Jeder Zug muss in endlicher Zeit enden (Timeout/Auto-Pass für die KI, kein Soft-Lock).

## 3. Aktions-/Reaktionsmodell

| Typ | Beispiele | Regel |
|---|---|---|
| Hauptaktion | `power_strike`, `aimed_shot`, Item | kostet Ressource, kann Cooldown haben |
| Nebenaktion | `defensive_stance`, Quick-Slot | günstig, ergänzt die Hauptaktion |
| Reaktion | Parade, Ausweichen, `riposte` | nur auf gegnerische Aktion, kostet Stamina, 1 pro Runde |

- Reaktionen werden **vor** dem Trefferwurf gewählt, sofern der Angriff nicht „unblockbar“ ist.
- Reaktionen können durch Status (`staggered`) gesperrt werden; das macht `feint` und ähnliche Skills wertvoll.
- Konter lösen **keine** weiteren Reaktionen aus (verhindert Endlosketten).

## 4. Ressourcen

| Ressource | Zweck | Regeneration |
|---|---|---|
| HP | Überleben | nur Camp/Items/wenige Skills |
| Stamina | Skills, Reaktionen | teilweise pro Runde, mehr bei Verteidigung |
| Fokus | Magie/Techniken | gering pro Runde, `focus_mind` |

Prinzip: Mächtige Aktionen kosten Ressourcen, Grundaktionen sind immer verfügbar,
damit kein Zug „leer“ ist.

## 5. Treffer, Schaden und Status

- **Treffer:** w100 gegen Trefferchance (Basis 70 %, Modifikatoren additiv, Klammer 5–95 %).
- **Schaden:** Basis × Skill-Multiplikator − Rüstung (mit Mindestschaden); Breakpoints statt Prozent-Stacking.
- **Krit:** zusätzlicher Wurf; Multiplikator fest, nicht unbegrenzt stapelbar.
- **Status:** Jeder Status hat Dauer, Stack-Regel und Gegenmaßnahme (siehe [system-scaling.md](system-scaling.md) Abschnitt 6).
- **Wunden:** Hohe Treffer können Wunden erzeugen, die über den Kampf hinaus wirken.
- Reihenfolge der Auflösung ist fest dokumentiert: Treffer → Block/Reaktion → Schaden → Status → Tod.

## 6. Bossprinzipien

- **Phasen** nach HP-Schwellen, jede Phase führt höchstens eine neue Kernmechanik ein.
- **Telegraphen:** Starke Aktionen werden mindestens eine Runde vorher angekündigt (Icon + Text).
- **Fairness:** Keine Instant-Kills ohne Telegraph; kein KI-Cheating.
- **Reaktionsfenster:** Jede Bossmechanik besitzt mindestens eine erlernbare Antwort.
- **Resistenzprofile** statt Totalimmunität; Immunitäten sind selten und im UI sichtbar.
- Phasenwechsel sind Präsentationsmomente, bleiben aber regelseitig ein Event.

## 7. Combat-Event-Modell

Der Resolver erzeugt eine geordnete Event-Liste; Log, UI, Animation, Replay und Balancing-Simulation
konsumieren sie.

```text
CombatEvent { id, type, source_id, target_id, payload, turn, seq }
```

| Event | Bedeutung |
|---|---|
| `TurnStarted` / `TurnEnded` | Zuggrenzen |
| `ActionChosen` | Spieler/KI hat Aktion gewählt |
| `AttackStarted`, `HitRolled` | Angriff und Wurf (mit Chance und Ergebnis) |
| `Blocked`, `Dodged`, `Countered` | Reaktionsausgang |
| `DamageDealt`, `HpChanged` | Schaden und neue HP |
| `StatusApplied`, `StatusRemoved`, `StatusTicked` | Statusverlauf |
| `Telegraphed` | Ankündigung einer starken Aktion |
| `PhaseChanged` | Bossphase |
| `Defeated` | Kämpfer besiegt |

Regeln: Events sind unveränderlich, reihenfolgestabil und mit festem Seed reproduzierbar.
Die Präsentation darf Events überspringen oder beschleunigen, nie umordnen.

## 8. Balancing-Faustregeln

- Ein durchschnittlicher Kampf endet nach **4–8 Runden**; Bosse nach **10–16**.
- Zeit bis zum Tod (TTK): Spieler ≈ 6–8 gegnerische Treffer, normaler Gegner ≈ 4–6 Spielertreffer.
- Kein Skill darf in jeder Situation optimal sein; jedes Werkzeug braucht einen Preis (Ressource, CD, Risiko).
- Neue Effekte zuerst über Datenwerte lösen, erst dann über neue Regeln.
- Änderungen mit Headless-Simulation (viele Seeds) prüfen: Siegquote, Rundenzahl, Ressourcenverbrauch.
- Ziel-Siegquoten: normale Gegner 70–85 %, Elite 50–65 %, Boss 35–55 % (Erstversuch).
- Telegraph-Schaden darf hoch sein, solange eine Antwort existiert.
