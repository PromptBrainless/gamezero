# Asset-Inventur und Visual-Sound-Pairing

Status: Die statische Inventur ist im [getrackten Manifest](../../artifacts/art/asset-audit.json) erfasst und am 2026-10-13 reproduzierbar geprüft. Sie ist keine Laufzeit-, Lizenz- oder visuelle Freigabe.

## Aktueller Inventurstand (2026-10-13)

- `npm run assets:audit:check` bestätigt, dass das Manifest dem getrackten Checkout entspricht.
- Das Manifest enthält 257 lose Dateien: 12 SVGs, ein PDF und 244 Rasterdateien; lose Audiodateien wurden nicht gefunden.
- Zwölf ZIP-Archive enthalten 3.649 erkannte Assets auf der ersten Ebene, darunter 500 Audioeinträge. Verschachtelte ZIP-Inhalte sind nicht enthalten.
- Der Scanner fand keine fehlenden erkannten literalen Runtime-Referenzen. Sieben dynamische Pfadausdrücke bleiben unbestätigte Kandidaten und benötigen Laufzeitprüfung.
- Keine Datei ist durch den Scan als `freigegeben` bestätigt. Rechte/Herkunft sowie Archiv-Metadaten (einschließlich Codec und Dauer) bleiben offen; Archive und Kandidaten sind nicht integriert.

Diese Zählungen beschreiben den Scanumfang, nicht geladene oder für das Spiel zugelassene Assets. Die manifestierte Einzeldatei bleibt die maßgebliche Inventur; der Scan ergänzt weder fehlende Lizenznachweise noch manuelle Laufzeit-/Darstellungsprüfungen.

## Inventur
- Alle versionierten Vektor-Dateien (mindestens SVG) und Audio-Dateien (WAV, OGG, MP3, M4A, WEBM sowie tatsächlich vorhandene weitere Formate) scannen.
- Quellassets von Build-/Exportkopien unterscheiden.
- Referenzen in Szenen, Skripten, UI, Projekt-/Exportkonfigurationen, Manifesten und dynamischen Ladepfaden prüfen.
- Je Datei Pfad, Typ, Format, Größe, Maße oder Dauer, Quelle/Lizenz, Runtime-Referenzen, Verwendung und Status festhalten.
- Statuswerte: `referenziert`, `nicht referenziert`, `fehlt`, `Duplikat/Build-Ausgabe`, `Platzhalter`, `freigegeben`.
- Dateinamen allein gelten nicht als Nachweis für tatsächliche Laufzeitverwendung.

## Pairing-Matrix zur Überprüfung

| Ereignis | Visuals | Audio | Prüfung |
|---|---|---|---|
| Menü / Charakterwahl | Logo, Charakter-/Klassen-Visuals, UI-Icons | dezente, sauber loopende Musik; kurze UI-Bestätigung | Lesbarkeit, Stil, keine Audio-Konkurrenz |
| Kampfstart / Bossphase | Arena, Gegner-/Boss-Visual, Phasenindikator | kurzer Start-/Phasen-Stinger | Timing, klare Phasenunterscheidung |
| Angriff / Fähigkeit | Aktions- und Effekt-Visual | kurzer charakteristischer SFX | Synchronität, Polyphonie |
| Treffer / kritischer Treffer | Trefferfeedback, Schadensanzeige, Statussymbol | unterscheidbarer Hit-/Krit-SFX | Lautheitsspitzen vermeiden; nicht nur Farbe als Signal |
| Sieg / Niederlage | Ergebnis- und Belohnungs-/Retry-UI | eigene Ergebnis-Stinger | klare Zustände, kein abgeschnittener Ton |
| Belohnung / Progression | Item-/Upgrade-Icon, Freischaltungsfeedback | kurzer Bestätigungs-SFX | nicht bei UI-Refresh wiederholen |
| Fokus / Bestätigung / Fehler | Fokus-, Button- oder Fehlerzustand | dezenter UI-SFX | Tastatur/Touch, Mute und Lautstärkeregler |

## Kriterien für die besten Kombinationen
- Einheitliche Art Direction und klare Lesbarkeit bei kleinen UI-Größen.
- Audio passt zeitlich zum Ereignis; SFX sind kurz, Musik ist loopfähig und Lautheit bleibt kontrolliert.
- Formate/Fallbacks passen zu den tatsächlich unterstützten Plattformen.
- Reduzierte Bewegung, Stummschaltung und getrennte Musik-/SFX-Lautstärke funktionieren.
- Lizenz und Herkunft sind nachvollziehbar.
- Ungeprüfte Vorschläge bleiben als solche markiert; `freigegeben` erst nach Import- und Laufzeittest.

## Abschlussnachweis
Der Abschluss-PR enthält das ausgefüllte Manifest, den reproduzierbaren Scan, die Referenzprüfung sowie Logs/Screenshots echter Tests. Unklare dynamische Referenzen und fehlende Metadaten werden als offene Punkte dokumentiert, nicht erraten.
