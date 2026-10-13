# Asset-Inventur und Visual-Sound-Pairing

Status: Die statische Inventur ist im [getrackten Manifest](../../artifacts/art/asset-audit.json) erfasst und am 2026-10-13 reproduzierbar geprüft. Sie ist keine Laufzeit-, Lizenz- oder visuelle Freigabe.

## Aktueller Inventurstand (2026-10-13)

- `npm run assets:audit:check` bestätigt, dass das Manifest dem getrackten Checkout entspricht.
- Das Manifest enthält 257 lose Dateien: 12 SVGs, ein PDF und 244 Rasterdateien; lose Audiodateien wurden nicht gefunden.
- Zwölf ZIP-Archive enthalten 3.649 erkannte Assets auf der ersten Ebene, darunter 500 Audioeinträge. Verschachtelte ZIP-Inhalte sind **nicht** rekursiv inventarisiert (siehe unten).
- Der Scanner fand keine fehlenden erkannten literalen Runtime-Referenzen. Sieben dynamische Pfadausdrücke bleiben unbestätigte Kandidaten und benötigen Laufzeitprüfung (explizit unten aufgelistet).
- Keine Datei ist durch den Scan als `freigegeben` bestätigt. Rechte/Herkunft sowie Archiv-Metadaten (einschließlich Codec und Dauer) bleiben offen; Archive und Kandidaten sind nicht integriert.

Diese Zählungen beschreiben den Scanumfang, nicht geladene oder für das Spiel zugelassene Assets. Die manifestierte Einzeldatei bleibt die maßgebliche Inventur; der Scan ergänzt weder fehlende Lizenznachweise noch manuelle Laufzeit-/Darstellungsprüfungen.

## Explizite dynamische Pfadausdrücke (runtime-review pending)

Der Scanner hat genau **7** dynamische Template-Ausdrücke erkannt. Diese sind Kandidaten, keine bestätigten Loads. Alle benötigen eine Laufzeitprüfung (ob die konstruierten Pfade tatsächlich existieren und geladen werden).

| Datei:Zeile | Expression | Kandidaten (Beispiele) | Status |
|---|---|---|---|
| `src/components/echo/kampf-buehne.tsx:79` | `` `/kampf/hd/${set}/${file}` `` | 27 (z. B. `public/kampf/hd/brecher/01_gegenueber.jpg`, `.../jaeger/...`) | runtime-review pending |
| `src/components/echo/kampf-seite.tsx:19` | `` `/kampf/hd/${id}/01_gegenueber.jpg` `` | 27 (gleiche HD-Sets) | runtime-review pending |
| `src/components/echo/kampf-seite.tsx:21` | `` `/kampf/hd/${id}/${file}` `` | 27 (gleiche HD-Sets) | runtime-review pending |
| `src/components/echo/kampf-seite.tsx:23` | `` `/kampf/v2/${id}/${weaponId}.jpg` `` | 49 (z. B. `public/kampf/v2/brecher/hammer.jpg`, `.../jaeger/...`) | runtime-review pending |
| `src/components/echo/kampf-seite.tsx:24` | `` `/kampf/v2/${id}/${look}.jpg` `` | 49 (gleiche v2-Sets) | runtime-review pending |
| `src/components/echo/spieler-blick.tsx:14` | `` `/kampf/hd/${id}/${datei}` `` | 27 (gleiche HD-Sets) | runtime-review pending |
| `src/components/echo/spieler-blick.tsx:15` | `` `/kampf/v2/${id}/${datei}` `` | 49 (gleiche v2-Sets) | runtime-review pending |

**Hinweis:** Diese Ausdrücke stammen aus dem Browser-Frontend (`src/components/echo/`). Sie sind nicht automatisch als native Godot-Loads bestätigt. Keine dieser Dateien wurde als `freigegeben` markiert.

## Nested-ZIP-Lücke (explizit)

Die Archive-Inventur listet nur die **erste Ebene**. Verschachtelte ZIP-Container werden als Gap erfasst, aber nicht rekursiv extrahiert oder inventarisiert. Beispiele aus dem aktuellen Manifest:

- `godot/abacktools-Worldassets-part03-of10.zip`: 10 nested Archives, 0 direkte Assets auf Ebene 1
- `godot/abacktools-Worldassets-part09-of10.zip`: 1 nested, 1109 Assets auf Ebene 1
- Mehrere weitere Worldassets- und Demo-Project-Zips enthalten nested Archive (siehe `nestedArchives` im Manifest)

**Status:** Nested contents, Member-Metadaten (Maße, Dauer, Codec), Lizenz-/Attribution-Prüfung und Integration bleiben offen. Keine ungeprüften Archive-Inhalte wurden aktiviert oder als Runtime-Assets freigegeben.

## Inventur
- Alle versionierten Vektor-Dateien (mindestens SVG) und Audio-Dateien (WAV, OGG, MP3, M4A, WEBM sowie tatsächlich vorhandene weitere Formate) scannen.
- Quellassets von Build-/Exportkopien unterscheiden.
- Referenzen in Szenen, Skripten, UI, Projekt-/Exportkonfigurationen, Manifesten und dynamischen Ladepfaden prüfen.
- Je Datei Pfad, Typ, Format, Größe, Maße oder Dauer, Quelle/Lizenz, Runtime-Referenzen, Verwendung und Status festhalten.
- Statuswerte: `referenziert`, `nicht referenziert`, `fehlt`, `Duplikat/Build-Ausgabe`, `Platzhalter`, `freigegeben`.
- Dateinamen allein gelten nicht als Nachweis für tatsächliche Laufzeitverwendung.

## Pairing-Matrix zur Überprüfung

Aktuelle Kandidaten und Status (Stand Audit 2026-10-13; keine Freigaben):

| Ereignis | Visuals (aktuell / Kandidat) | Audio (Kandidat) | Prüfung / Status |
|---|---|---|---|
| Menü / Charakterwahl | Textuelle Panels; prozedurale Silhouetten + Akzentfarben (native); Browser-Favicon/Atlas nicht native | Archiviert: `neu3/Audio/back_001.ogg` (nur Audition) | Lesbarkeit ok in Headless; Sound nicht geladen, Rechte/Audition pending |
| Kampfstart / Bossphase | Prozedurale Arena + Encounter-Preview | Kein freigegebener Stinger; Demo-Loops nicht vorausgesetzt | Transitionen geprüft; native Musik fehlt |
| Angriff / Fähigkeit | Ordered Action-Log; keine finalen Animationen | Archiviert: `neu3/Audio/chop.ogg` (nur Audition) | Logik geprüft; Sound/Dauer/Stil unverifiziert |
| Treffer / kritischer Treffer | Damage-Labels aus `damage`; Crits nicht implementiert | Archiviert: Demo `sound_hit.wav` (nur Audition) | DoT-Duplikat gefixt; Audibility/Rendering pending |
| Sieg / Niederlage | Explizite Reward/Defeat-Screens | Demo `gameover.wav` (Vergleichskandidat, keine Tonempfehlung) | Accounting/Retry geprüft; Sound nicht geladen |
| Belohnung / Progression | Kanonische XP/Items (einmalig) | Demo `sound_coin.wav` (nur Audition) | Accounting ok; kein Audio-Acceptance |
| Fokus / Bestätigung / Fehler | Focusable Controls (48 px logisch) | Gleicher kurzer UI-Click-Kandidat | Headless-Checks ok; Touch/Device/Audio pending |

**Empfehlung:** Prozedurale native Visuals beibehalten, bis finale Art-Review. Audio nur nach per-File-Lizenz + Audition kurz und non-verbal. Kein Sound als einziges Signal.

## Kriterien für die besten Kombinationen
- Einheitliche Art Direction und klare Lesbarkeit bei kleinen UI-Größen.
- Audio passt zeitlich zum Ereignis; SFX sind kurz, Musik ist loopfähig und Lautheit bleibt kontrolliert.
- Formate/Fallbacks passen zu den tatsächlich unterstützten Plattformen.
- Reduzierte Bewegung, Stummschaltung und getrennte Musik-/SFX-Lautstärke funktionieren.
- Lizenz und Herkunft sind nachvollziehbar.
- Ungeprüfte Vorschläge bleiben als solche markiert; `freigegeben` erst nach Import- und Laufzeittest.

## Abschlussnachweis
Der Abschluss-PR enthält das ausgefüllte Manifest, den reproduzierbaren Scan, die Referenzprüfung sowie Logs/Screenshots echter Tests. Unklare dynamische Referenzen und fehlende Metadaten werden als offene Punkte dokumentiert, nicht erraten.

**Offene Punkte nach diesem Update:**
- Laufzeitprüfung der 7 dynamischen Ausdrücke
- Rekursives Nested-ZIP-Inventar (optional, ohne ungeprüfte Aktivierung)
- Rechte/Attribution + Metadaten für Archive-Members
- Keine Assets als `freigegeben` markiert

## ZIP-Parts-Übersicht (Stand 2026-10-13)

Kompakte Übersicht der gesplitteten Archive. Nur erste Ebene; nested Inhalte nicht extrahiert. Keine Assets freigegeben.

### Demo-Projects (root)
| Part | Größe | Assets (Ebene 1) | Nested | Lizenz-Kandidaten |
|------|-------|------------------|--------|-------------------|
| part01-of15.zip | 21.1 MB | 288 | 0 | 2 (LICENSE.txt / LICENSE) |
| part02-of15.zip | 17.3 MB | 41 | 0 | 7 (*.LICENSE.md) |
| part04-of15.zip | 2.5 MB | 17 | 0 | 3 (*.LICENSE.md) |

*Fehlend laut Audit: parts 03, 05–15.*

### Worldassets (godot/)
| Part | Größe | Assets (Ebene 1) | Nested | Lizenz-Kandidaten / Nested-Beispiel |
|------|-------|------------------|--------|-------------------------------------|
| part01-of10.zip | 14.4 MB | 436 | 1 | — / hologram_interface.zip |
| part02-of10.zip | 12.3 MB | 82 | 2 | public-license.txt / cyberpunk + dark_forest |
| part03-of10.zip | 14.0 MB | 0 | **10** | — / kenney_*.zip (cartography, ui, sounds, …) |
| part04-of10.zip | 3.5 MB | 46 | 2 | 12× License*.txt / kenney_voiceover |
| part06-of10.zip | 14.4 MB | 14 | 0 | — |
| part07-of10.zip | 15.4 MB | 49 | 0 | — |
| part08-of10.zip | 15.0 MB | 496 | 1 | license.txt / parallax-industrial-pack |
| part09-of10.zip | 13.9 MB | 1109 | 1 | — / skymon-icons.zip |
| part10-of10.zip | 5.5 MB | 1079 | 0 | — |

*Fehlend: part05-of10.zip.*

### Lizenz-Kandidaten (Pfade, keine Inhalte geprüft)
- Demo: `godot-demo-projects-master/.../LICENSE`, `*.LICENSE.md`
- Worldassets: `neu3/License*.txt`, `neu3/cyberpunk-street-files/public-license.txt`, `neu3/parallax-industrial-pack/license.txt`

**Status:** Alle Nested-ZIPs und Member-Metadaten (Codec, Dauer, Maße) sowie Rechte-Prüfung bleiben offen. Keine Extraktion oder Aktivierung vorgenommen.
