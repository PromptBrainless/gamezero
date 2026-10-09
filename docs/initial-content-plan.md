# Initialer Content-Plan

Teil des [Mini-GDD](mini-gdd.md). Alle Werte sind **Balancing-Startwerte**.
Skala: HP-Spieler Start ~60, w100-Treffer, Basis-Trefferchance 70 %.

## 1. Starter-Roster Karrieren

| ID | Name | Rolle | Kernidee | Rang 1 → 2 (Slice) |
|---|---|---|---|---|
| `mercenary` | Söldner | Allrounder/Tank | Rüstung, Guard, ausdauernd | Rekrut → Veteran |
| `duelist` | Duellant | Konter/Präzision | Parade, Ausweichen, Riposte | Fechter → Klingentänzer |
| `hunter` | Jäger | Fernkampf/Kontrolle | Markieren, Fallen, Bleed | Fährtenleser → Waldläufer |
| `witch_hunter` | Hexenknecht | Anti-Magie/Burst | Entlarven, Silber, Glaubens-Boni | Häscher → Inquisitor |
| `brawler` | Straßenkämpfer | Risiko/Schaden | Dirty Tricks, Benommen, Kontern | Raufbold → Schläger |
| `scholar_mage` | Gelehrter-Magier | Caster | Fokus, Elementar-Debuffs | Student → Magister |

Rang 3–4 (Meister/Legende) nach der Slice-Phase.

## 2. Status-Effekte (12)

| ID | Name | Wirkung | Dauer | Gegenmaßnahme |
|---|---|---|---|---|
| `bleed` | Blutung | 3 Schaden/Runde, stapelt bis 3 | 3 | Verband, Heilung |
| `poison` | Gift | 2 Schaden/Runde, −10 % Heilung | 4 | Gegengift |
| `burn` | Brennen | 4 Schaden/Runde, endet bei Wasser/Nässe | 2 | Löschen |
| `stunned` | Benommen | Verliert Nebenaktion; −20 % Trefferchance | 1 | Zähigkeit-Wurf |
| `staggered` | Ins Wanken | Verliert Reaktion; nächster Treffer +25 % Schaden | 1 | – |
| `broken_armor` | Gebrochene Rüstung | −30 % Rüstungswert | 3 | Reparatur-Item |
| `weakened` | Geschwächt | −20 % Schaden | 3 | Rast/Trank |
| `slowed` | Verlangsamt | −20 Initiative | 2 | – |
| `marked` | Markiert | +15 % Trefferchance gegen Ziel | 3 | – |
| `guard` | Deckung | +25 % Block, −10 % eigene Trefferchance | 1 | – |
| `focused` | Konzentriert | +15 % Krit, +10 Initiative | 2 | Wird bei Treffer gebrochen |
| `terrified` | Furcht | −15 % Trefferchance, kann Aktion verweigern (20 %) | 2 | Willenskraft-Wurf |

## 3. Skills (20)

Kosten: St = Stamina, Fo = Fokus. Cooldown (CD) in Runden.

| # | ID | Name | Karriere | Kosten/CD | Effekt |
|---|---|---|---|---|---|
| 1 | `power_strike` | Wuchtschlag | Söldner | 3 St / 1 | 150 % Schaden, −10 % Treffer |
| 2 | `shield_wall` | Schildwall | Söldner | 2 St / 2 | `guard`, +10 Rüstung 1 Runde |
| 3 | `second_wind` | Zweiter Atem | Söldner | – / 4 | +4 St, heilt 10 % HP |
| 4 | `riposte` | Riposte | Duellant | 2 St / 0 | Reaktion: nach Parade Konter 80 % |
| 5 | `feint` | Finte | Duellant | 2 St / 2 | Gegner verliert Reaktion (`staggered`) |
| 6 | `lunge` | Ausfall | Duellant | 3 St / 1 | +20 % Treffer, 120 % Schaden |
| 7 | `aimed_shot` | Gezielter Schuss | Jäger | 3 St / 1 | 130 % Schaden, +10 % Krit |
| 8 | `mark_prey` | Beute markieren | Jäger | 1 St / 3 | `marked` 3 Runden |
| 9 | `barbed_trap` | Dornenfalle | Jäger | 2 St / 3 | `bleed` + `slowed` (Gegner-Zug-Trigger) |
| 10 | `silver_strike` | Silberhieb | Hexenknecht | 3 St / 1 | 130 %, +50 % vs. Verderbte/Magische |
| 11 | `expose_heresy` | Ketzer entlarven | Hexenknecht | 2 Fo / 3 | Entfernt Buffs des Ziels, `weakened` |
| 12 | `purging_flame` | Läuternde Flamme | Hexenknecht | 3 Fo / 2 | 100 % Feuer, `burn` |
| 13 | `dirty_trick` | Schmutziger Trick | Straßenkämpfer | 2 St / 2 | Sand: `stunned` (50 %) |
| 14 | `headbutt` | Kopfstoß | Straßenkämpfer | 2 St / 2 | 90 %, `staggered`, 5 Selbstschaden |
| 15 | `reckless_swing` | Wilder Hieb | Straßenkämpfer | 2 St / 1 | 170 %, Gegner +20 % Treffer eine Runde |
| 16 | `arcane_bolt` | Arkanes Geschoss | Magier | 2 Fo / 0 | 100 % Magie, ignoriert 50 % Rüstung |
| 17 | `frost_chains` | Frostketten | Magier | 3 Fo / 3 | `slowed`, extinguishes `burn` |
| 18 | `focus_mind` | Geist sammeln | Magier | – / 3 | +3 Fo, `focused` |
| 19 | `bandage` | Verband | Allgemein | 2 St / 3 | Entfernt `bleed`, +8 HP |
| 20 | `defensive_stance` | Verteidigungshaltung | Allgemein | Nebenaktion / 0 | `guard`, +1 St |

## 4. Gegner-Archetypen

| ID | Archetyp | Verhalten | Beispiel | Schwäche |
|---|---|---|---|---|
| `bruiser` | Brecher | Langsam, harte Schläge, telegraphiert | Ogerschläger | `slowed`, Ausweichen |
| `duelist_npc` | Duellant | Pariert/kontert | Fechtmeister | `feint` |
| `tank` | Bollwerk | Dauer-`guard`, Rüstung hoch | Schildträger | `broken_armor` |
| `assassin` | Meuchler | Hohe Initiative, Krit, Gift | Klingenschatten | Niedrige HP, `marked` |
| `ranger` | Schütze | Markiert, Fernschaden | Bandenbogner | Nahdruck |
| `controller` | Hexer | Debuffs (`weakened`, `terrified`) | Hexer des Kults | Burst, geringe Rüstung |
| `summoner` | Rufer | Ruft Helfer-Buffs/Schilde | Nekromantenlehrling | Unterbrechen (`stunned`) |
| `beast` | Bestie | Rage-Meter, Berserk bei <40 % HP | Schwarzwolf | `focused` Konter |

## 5. Bosse

### Boss 1 – Der Eiserne Hauptmann (`boss_iron_captain`)
- Thema: Gepanzerter Söldnerführer; Lektion: Rüstung brechen und Telegraphen lesen.
- **Phase 1 (100–60 %)**: Schildstellung, `guard` dauerhaft; Telegraph „Schmetterhieb" (unblockbar-mindernd).
- **Phase 2 (60–30 %)**: Schild bricht (→ `broken_armor` auf Boss, wenn 2× Schwer-Skills getroffen); ruft Weckruf (+Initiative).
- **Phase 3 (<30 %)**: Wut: 2 Angriffe/Runde, dafür −Rüstung; Todesstoß-Telegraph (2 Runden).
- Resistenzen: Furcht immun, Blutung 50 %.

### Boss 2 – Die Seuchenmutter (`boss_plague_mother`)
- Thema: Verderbte Hexe; Lektion: Status-Management und Fokus.
- **Phase 1**: Gift-Aura (`poison` jede 2. Runde), ruft Seuchenratten (Buff-Schilde, 2 Treffer entfernbar).
- **Phase 2 (<60 %)**: Wechselt Stance: Spiegelbild – nimmt jede 2. Runde keinen Schaden (Erkennbar am Icon).
- **Phase 3 (<25 %)**: „Fäulnisgeburt" – Rage-Meter lädt 3 Runden; unterbrechen mit `stunned`, sonst starker Flächenschaden.
- Resistenzen: Gift immun, Feuer +25 % Schaden.

## 6. Start-Items (Auswahl, ~30 geplant)
Waffen: Langschwert, Rapier, Jagdbogen, Streitkolben, Silberdolch, Zauberstab.
Offhand: Rundschild, Parierdolch, Fokuskristall. Rüstung: Leder-/Kettenset je 4 Teile.
Schmuck/Talisman: Glückspfennig (+Krit), Eisenring (+Zähigkeit), Hexenzahn (Furcht-Resist).
Verbrauch: Verband, Gegengift, Heiltrank, Wurfflasche Öl.

## 7. Begegnungsfolge (Slice)
5 Kämpfe (bruiser, duelist_npc, assassin, beast, controller) → Boss 1 → Camp → 4 Kämpfe → Boss 2.
Arena: Landstraße (Tag/Nacht), Gruft (Boss 2).
