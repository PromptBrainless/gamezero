# Vision

Teil der [Dokumentation](README.md). Ergänzt das [Mini-GDD](mini-gdd.md) (Abschnitt 1)
um die übergeordnete Ausrichtung. Kampfregeln stehen in [combat-design.md](combat-design.md),
Meilensteine in [implementation-roadmap.md](implementation-roadmap.md).

## 1. Projektvision

ECHO//BRUCH Mobile ist ein schnelles, brutales und gut lesbares 1v1-Kampf-RPG in
2D-Seitenansicht. Ein Kampf dauert 2–5 Minuten; Karriere, Ausrüstung und Entscheidungen
im Kampf bestimmen den Ausgang. Das Spiel soll über viele Inhaltspakete wachsen können
(Karrieren, Gegnerfamilien, Regionen, Bosse), ohne dass der Regelkern umgebaut werden muss
(siehe [system-scaling.md](system-scaling.md)).

## 2. Design-Säulen

Die fünf Säulen des Mini-GDD bleiben maßgeblich:

1. **Lesbar** – Ein Blick zeigt, wer dran ist, was gleich passiert und wie gefährlich es ist.
2. **Tief, nicht schwer** – Wenige Werte, viele Interaktionen (Stances, Status, Reaktionen).
3. **Build zählt** – Karriere und Ausrüstung verändern den Spielstil, nicht nur Zahlen.
4. **Wuchtiges Feedback** – Treffer fühlen sich schwer an, ohne Regeln zu beeinflussen.
5. **Daten statt Code** – Inhalte sind Ressourcen/JSON, nicht hartcodiert.

Prüffrage für neue Features: *Stärkt es mindestens eine Säule und schwächt es keine?*

## 3. Spielerfantasie

Der Spieler ist ein gezeichneter Kämpfer in einer rauen, düsteren Welt, der durch
Können, Vorbereitung und kluge Entscheidungen wächst:

- **Ich lese meinen Gegner** – Telegraphen erkennen, Schwächen ausnutzen.
- **Ich baue meinen Stil** – Karriere, Skills und Ausrüstung formen eine eigene Spielweise.
- **Ich überlebe knapp** – Risiko, Wunden und Ressourcenmanagement erzeugen Spannung.
- **Ich besiege Giganten** – Bosse sind Höhepunkte, die Vorbereitung belohnen.

## 4. Ton und Präsentation

- **Ton:** düster-realistische Fantasy mit Anleihen an WFRP 4e; ernst, schmutzig, ohne Zynismus.
- **Look:** modulare 2D-Skelett-Figuren, gemalte Parallax-Hintergründe, Sprite-VFX,
  dunkle UI mit klaren Kontrasten (Details: [mini-gdd.md](mini-gdd.md) Abschnitt 5–6).
- **Wucht:** Hit-Stop, leichter Screenshake, Flash und Zahlen-Popups; alles abschaltbar.
- **Klarheit vor Realismus:** Stilisierung ist erlaubt, wenn sie die Lesbarkeit erhöht.
- **Audio:** dumpfe, körperliche Treffer; sparsame, atmosphärische Musik; Boss-Themen mit Phasen.

## 5. Mobile-first-Identität

- Entworfen für Hochformat und Daumenbedienung; Querformat wird unterstützt.
- Sitzungen von 10–20 Minuten, Kämpfe sind jederzeit pausierbar.
- Touch-Ziele ≥ 48 dp, Informationen nie nur über Farbe (siehe [hud-wireframe.md](hud-wireframe.md)).
- Leistung geht vor Effekt: 60 fps als Ziel, 30 fps Fallback, Low-End-Geräte berücksichtigen.
- Kein Pay-to-win, keine Zwangs-Online-Funktion; Offline-Spielbarkeit ist Standard.

## 6. Nicht-Ziele (v1)

Multiplayer, Gruppenkämpfe, Open World, Live-Service/Monetarisierung, Grid-Taktik.
