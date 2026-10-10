# Systemskalierung

> Historischer, nicht verabschiedeter Ausbauentwurf. Die `.tres`-Struktur,
> zusätzlichen Felder, sechs Karrieren und Mechaniken unten sind **keine**
> aktuelle Authoring-Anweisung. Maßgeblich sind [data-schema.md](data-schema.md),
> [content-pipeline.md](content-pipeline.md) und die
> [Zielarchitektur](target-architecture.md). Kanonische Definitionen liegen in
> `data/`; Ausbau benötigt eine explizite Scope-/Contract-Entscheidung.

Teil der [Dokumentation](README.md). Beschreibt, wie das [Mini-GDD](mini-gdd.md) und der
[Content-Plan](initial-content-plan.md) wachsen können, ohne die Struktur zu brechen.
Regeln des Kampfs: [combat-design.md](combat-design.md). Alle Zahlen sind Startwerte.

## 1. Skalierungsprinzipien

1. **Daten vor Code** – Neuer Inhalt = neue Datei, kein neuer Code.
2. **Kleiner, stabiler Regelkern** – Wachstum durch Kombination von Tags, nicht durch Sonderfälle.
3. **Flach statt explosiv** – HP/Schaden wachsen flach; Tiefe kommt aus Interaktionen.
4. **Jede Ebene ist unabhängig lieferbar** – Ein Paket (Region, Karriere, Boss) ist ohne Rest des Spiels testbar.
5. **Stabile IDs** – `snake_case`, nie wiederverwendet, nie umbenannt ohne Migration.
6. **Vorlage vor Einzelstück** – Zuerst Familie/Template, dann Varianten.
7. **Messbar** – Jede neue Einheit wird per Balancing-Simulation geprüft.

## 2. Empfohlene Datenmodelle / Ressourcentypen

Alle Typen als Godot-`Resource` (`.tres`) oder JSON mit gemeinsamem Kopf:
`id`, `name_key`, `version`, `tags[]`.

| Typ | Kerninhalt |
|---|---|
| `AttributeSet` | Basiswerte (HP, Stamina, Fokus, Initiative, Rüstung…) |
| `CareerDefinition` | Ränge, Attribut-Boni, Skills/Talente je Rang, Quereinstiege |
| `SkillDefinition` | Kosten, Cooldown, Zielregeln, `effects[]`, Tags |
| `EffectDefinition` | Schaden, Heilung, Status anwenden, Ressource ändern (datengetrieben) |
| `StatusDefinition` | Dauer, Stack-Regel, Tick-Effekte, Modifikatoren, Gegenmaßnahmen, Tags |
| `ItemDefinition` | Slot, Basiswerte, Affixe, Seltenheit, Tags |
| `EnemyDefinition` | Familie, Attribute, Skill-Liste, KI-Profil, Resistenzen, Loot |
| `EnemyFamilyDefinition` | Gemeinsame Basis, Rollen, Varianten-Regeln |
| `BossDefinition` | Basis wie Enemy + geordnete `BossPhaseDefinition[]` |
| `BossPhaseDefinition` | HP-Schwelle, Skill-Pool, Telegraph-Skripte, Regeländerungen |
| `EncounterDefinition` | Gegner/Boss, Arena, Modifikatoren, Belohnungen |
| `RegionDefinition` | Begegnungspools, Themen, Freischaltungen, Händler/Camp |
| `LootTable` | Gewichtete Einträge, Bedingungen |

Verweise erfolgen nur über IDs; Laden validiert Referenzen (kaputte IDs = Testfehler).

## 3. Content-Ebenen

| Ebene | Inhalt | Änderungsrate |
|---|---|---|
| 0 – Kernregeln | Resolver, Event-Modell, Statussystem | selten, mit Migration |
| 1 – Basiskatalog | Attribute, Tags, Basis-Status, Basis-Skills | gelegentlich |
| 2 – Karrieren/Familien | Karrieren, Gegnerfamilien | pro Release |
| 3 – Regionen/Bosse | Regionen, Begegnungen, Bosse | pro Inhaltspaket |
| 4 – Varianten/Kosmetik | Elite-Varianten, Skins, Hintergründe | laufend |

Höhere Ebenen dürfen niedrigere nutzen, nie umgekehrt.

## 4. Wachstum der Karrierebäume

- Slice: 6 Karrieren, je Rang 1–2. Ausbau: Rang 3–4, danach neue Karrieren.
- Jede Karriere hat eine **klare Identität** (Rolle + 1–2 Signaturmechaniken) und überschneidet sich
  höchstens teilweise mit einer anderen.
- Rangstruktur bleibt konstant: Attribut-Boni, 1–2 Skills, 1 Talent/Passiv.
- Pro Karriere maximal **~12 Skills** gesamt; aktive Slots bleiben bei 6, damit Entscheidungen zählen.
- Quereinstieg über Karriere-**Nachbarschaften** (Graph); neue Karrieren benennen ihre Nachbarn.
- Neue Karriere nur, wenn sie eine neue Spielweise (Tag-Kombination) erlaubt, nicht nur andere Zahlen.

## 5. Skill-Taxonomie und Tag-System

**Kategorien:** `attack`, `defense`, `control`, `support`, `utility`, `reaction`.

**Tag-Achsen** (frei kombinierbar):

| Achse | Beispiele |
|---|---|
| Schadensart | `physical`, `fire`, `poison`, `magic` |
| Waffe/Klasse | `blade`, `blunt`, `ranged`, `shield`, `focus` |
| Rolle | `burst`, `sustain`, `debuff`, `mark` |
| Ziel-/Verhalten | `single`, `self`, `reaction`, `telegraphed` |
| Gegner-Tags | `beast`, `corrupted`, `armored`, `undead` |

Tags treiben Interaktionen (z. B. `silver_strike`: +50 % vs. `corrupted`) und Resistenzen.
Regeln: Neue Interaktion = neuer Tag-Eintrag + Datenregel; maximal 3 Schadensart-/Rollen-Tags pro Skill.
Ein Tag-Register (eigene Datei) listet alle erlaubten Tags, damit Tippfehler Tests brechen.

## 6. Status-Skalierungsregeln

- Jeder Status deklariert **Dauer, Stack-Regel** (`none`/`refresh`/`stack(max)`) und **Gegenmaßnahme**.
- Kategorien: `dot`, `control`, `debuff`, `buff`, `stance`. Pro Kategorie gelten feste Leitplanken
  (z. B. `dot`: Schaden je Runde ≤ ~7 % der Ziel-HP; `control`: Dauer meist 1).
- **Diminishing Returns:** Wiederholte Kontrollstatus (`stunned`, `staggered`) verkürzen sich oder
  werden kurz immunisiert; Bosse haben eigene Resistenzstufen.
- Neue Status müssen sich in einem Satz von bestehenden unterscheiden lassen; sonst Parameter statt neuer Status.
- Interaktionen (z. B. Wasser löscht `burn`) laufen über Tags, nicht über Sonderlogik.
- Obergrenze gleichzeitiger Status je Kämpfer (UI zeigt 6) – darüber priorisieren oder zusammenfassen.

## 7. Skalierung der Gegnerfamilien

- Eine **Familie** bündelt Archetyp, Verhalten und Schwäche (siehe Archetypen im Content-Plan).
- Wachstum über **Varianten**: `grunt` → `veteran` → `elite`; Unterschied durch Daten
  (Attribute, 1–2 zusätzliche Skills, KI-Profil), nicht durch neue Systeme.
- Pro Region 2–3 Familien plus Mischbegegnungen; Familien sind regionsübergreifend wiederverwendbar (Re-Skin + Anpassung).
- Stufenskalierung über `level_curve` (flach); Zielwerte per Tabelle, nicht pro Gegner von Hand.
- Jede Familie braucht: Lektion (was lernt der Spieler?), Gegenmaßnahme, Telegraph-Satz.

## 8. Bossskalierung und Phasenkomposition

- Boss = `BossDefinition` + geordnete Phasen. **Eine neue Kernmechanik pro Phase**.
- Phasen sind **Bausteine**: wiederverwendbare Phasenmodule (z. B. „Schildstellung“, „Beschwörung“,
  „Rage-Meter“) werden zu neuen Bossen kombiniert.
- Standardaufbau: Phase 1 = Lektion, Phase 2 = Variation/Komplikation, Phase 3 = Prüfung/Eskalation.
- Zukünftige Erweiterung: optionale Bonus-Phasen, Schwierigkeitsstufen (Modifikatoren statt neue Werte),
  Wiederholungsbosse mit veränderter Phasenreihenfolge.
- Jeder Boss besitzt ein Resistenzprofil, einen Telegraph-Katalog und einen Lektionsvermerk.
- Ein Boss darf nie eine Mechanik verlangen, die der Spieler im Spiel noch nicht kennengelernt hat.

## 9. Regionssystem als Content-Container

Eine `RegionDefinition` bündelt:

- Thema und Arena-Varianten (Hintergründe, Musik),
- Begegnungspools (Gegnerfamilien, Elite, Boss),
- Händler-/Camp-Angebot, Loot-Tabellen, Freischaltbedingungen,
- regionsspezifische Modifikatoren (z. B. Nacht, Nebel) als Status/Regeln.

Regionen sind **additiv**: Neue Region = neuer Ordner + Registrierung, keine Änderung bestehender Regionen.
Schwierigkeit wächst über Region-Tiers (`tier`), nicht über Sonderregeln.
Landstraße und Gruft aus dem Slice sind die ersten Regionsbausteine.

## 10. Content-/Repo-Organisation für langfristiges Wachstum

```text
godot/data/
  _registry/            # Tag-Register, ID-Listen, Schemas
  core/                 # Basis-Status, Basis-Skills, Attribute
  careers/<career_id>/  # career.tres, skills/, talents/
  enemies/<family_id>/  # family.tres, variants/
  bosses/<boss_id>/     # boss.tres, phases/
  regions/<region_id>/  # region.tres, encounters/, loot/
  items/<slot>/
  localization/
```

Regeln:
- Ein Ordner pro Karriere/Familie/Boss/Region; Inhalte wandern mit ihrem Paket.
- Namenskonvention `<typ>_<id>.tres`, IDs global eindeutig.
- Schema-Validierung und Referenzprüfung in CI-Tests (GUT/gdUnit4).
- Lokalisierung nur über `name_key`; keine Klartexte in Daten.
- Savegames versioniert mit Migrationen; Inhalts-IDs im Save sind stabil.
- Doku folgt der Struktur: neue Pakete bekommen einen Abschnitt im Content-Plan.

## 11. Zentrale Skalierungsrisiken

| Risiko | Gegenmaßnahme |
|---|---|
| Zahlenexplosion | flache Kurven, Breakpoints, Simulationsprüfung |
| Status-Wildwuchs | Kategorien, Leitplanken, „ein Satz“-Regel |
| Skill-Bloat je Karriere | Cap (~12) und 6 aktive Slots |
| Tag-Chaos | zentrales Tag-Register, Test auf unbekannte Tags |
| Dominante Builds | Simulationen über Karrieren × Gegnerfamilien |
| Kaputte Referenzen | Schema- und ID-Tests in CI |
| Boss-Frustration | Telegraphen, Lektionsprinzip, Resistenzen statt Immunitäten |
| Asset-Kosten | modulare Figuren, Re-Skins, wiederverwendbare Phasenmodule |
| Save-Brüche | Versionierung, Migrationen, stabile IDs |
| Doku-Drift | Regeln zuerst im GDD ändern, Docs im DoD jedes Meilensteins |
