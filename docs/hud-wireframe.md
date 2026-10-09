# HUD-Wireframe und Mobile-UX

Teil des [Mini-GDD](mini-gdd.md). Referenz: 1080×2340 Hochformat, 48 dp Touch-Minimum.

## Kampf-HUD (Hochformat)

```text
┌──────────────────────────────────┐
│ [II Pause] [1x/2x] [Auto] [≡ Log]│  Topbar
│ SPIELER ████████░░ 82/100   Gegner│
│ Stamina ▓▓▓▓░  Fokus ▓▓░  ██████ │  HP/Ressourcen
│ (Status-Icons)         (Icons)   │
│ Initiative: [Du][Gegner][Du][..] │  Turn Order
│                                  │
│   ┌─────┐              ┌─────┐   │
│   │ SPI │   ⚠ Telegraph│ GEG │   │  Arena (~55 %)
│   └─────┘     (Icon+Text)└────┘  │
│ ────────── Boden/Parallax ────── │
│ Log (1 Zeile, antippen = auf)    │
├──────────────────────────────────┤
│ [Angriff] [Skills] [Stance][Item]│  Primäraktionen (4)
│ [Reaktion: Parade | Ausweichen]  │  Reaktionsleiste
│ Quick: (Q1)(Q2)(Q3)              │
└──────────────────────────────────┘
```

## Elemente
- **HP-Balken:** Zahl + Balken, Schadensverzögerungs-Segment (weiß, schrumpft nach).
- **Ressourcen:** Stamina (gelb), Fokus (violett).
- **Turn Order:** 4 Slots Vorschau, aktiver Kämpfer hervorgehoben.
- **Status-Icons:** max. 6 sichtbar, Zahl = Dauer/Stacks, Tap = Beschreibung.
- **Telegraph:** Banner über Gegner mit Icon, Name und Art (Schwer / Unblockbar / Flächen).
- **Ziel-/Treffervorschau:** Long-Press auf Aktion zeigt Trefferchance, Schaden-Spanne, Kosten.
- **Skills-Menü:** Bottom-Sheet, Raster 3×2, ausgegraute Skills nennen den Grund (Cooldown, Stamina).
- **Boss-Zusatz:** großer Boss-HP-Balken oben, Phasen-Markierungen, Phasenwechsel-Banner.

## Mobile-Regeln
1. Primäraktionen im unteren Drittel (Daumenzone), max. 4–6 gleichzeitig.
2. Keine Information nur über Farbe – immer Icon/Form/Text.
3. Alle Aktionen sind ohne Multi-Touch bedienbar; Bestätigung nur bei destruktiven Aktionen.
4. Safe-Area (Notch) beachten; Textgröße skalierbar (80–150 %).
5. Kein Log-Zwang: Log minimiert, aufklappbar, auch als Vollbild-Verlauf.
6. Ein Blick: wer ist dran · was kommt · wie gefährlich.

## Weitere Screens
- **Camp:** Charakter-Portrait, Tabs Inventar / Karriere / Händler / Almanach.
- **Inventar:** Paper-Doll mit Slots (siehe Slot-Modell im GDD), Rucksack-Raster darunter, Vergleichs-Tooltip.
- **Optionen:** Tempo, Auto, Vibration, Screenshake, Farbenblind, Textgröße, Lautstärke, Sprache.
- **Ergebnis:** XP-Balken, Loot, Wunden, „Weiter“ als einzige Hauptaktion.
