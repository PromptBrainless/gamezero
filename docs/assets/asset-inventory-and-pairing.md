# Asset-Inventur und Visual-Sound-Pairing

Status: Die statische Inventur ist im [getrackten Manifest](../../artifacts/art/asset-audit.json) erfasst und am 2026-10-13 reproduzierbar geprüft. Sie ist keine Laufzeit-, Lizenz- oder visuelle Freigabe.

## Aktueller Inventurstand (2026-10-13, merged from main)

- `npm run assets:audit:check` bestätigt, dass das Manifest dem getrackten Checkout entspricht.
- Das Manifest enthält 7.090 erkannte Asset-Dateien: 257 lose Dateien (12 SVGs, ein PDF und 244 Rasterdateien; kein loses Audio) sowie 6.833 Dateien aus den extrahierten Archiven. Insgesamt sind 986 Audio- und 890 Vektordateien erfasst.
- Zwölf ZIP-Archive enthalten 6.817 inventarisierte Assets (davon 3.168 aus verschachtelten Archiven; 986 Audio). Verschachtelte ZIP-Inhalte werden rekursiv inventarisiert, bleiben aber ungeprüft und nicht freigegeben.
- Der Scanner fand keine fehlenden erkannten literalen Runtime-Referenzen. Alle sieben dynamischen Pfadausdrücke wurden gegen ihre Quelllogik geprüft; Laufzeitprüfung, Herkunfts-/Rechtenachweis und Freigabe bleiben offen.
- Keine Datei ist durch den Scan als `freigegeben` bestätigt. Rechte/Herkunft sowie Archiv-Metadaten (einschließlich Codec und Dauer) bleiben offen; Archive und Kandidaten sind nicht integriert.

Diese Zählungen beschreiben den Scanumfang, nicht geladene oder für das Spiel zugelassene Assets. Archiv- und Extraktionsinventar erfassen überlappende Inhalte und dürfen nicht addiert werden. Die manifestierte Einzeldatei bleibt die maßgebliche Inventur; der Scan ergänzt weder fehlende Lizenznachweise noch manuelle Laufzeit-/Darstellungsprüfungen.

## Review der sieben dynamischen Pfade (2026-10-13)

Alle sieben Fundstellen liegen in älteren ECHO//BRUCH-Komponenten unter
`src/components/echo/`. Der aktuelle Root-Route rendert `SliceApp`; keine dieser
Komponenten ist von einer Route importiert. Die Quellprüfung begrenzt daher die
Kandidaten, bestätigt aber weder eine aktuelle Laufzeitnutzung noch Bildabrufe,
Darstellungsqualität oder Rechte. Der Scanner bleibt unverändert und listet
weiterhin Präfix-Kandidaten, nicht statisch bewiesene Laufzeitkombinationen.

| Fundstelle | Quellseitig begrenzte Pfade | Status |
|---|---|---|
| `kampf-buehne.tsx:79` `/kampf/hd/${set}/${file}` | `set` ist `brecher` oder `jaeger`; `file` stammt aus der jeweiligen `PLATES`-Liste. Alle 27 aufgelisteten HD-Dateien sind im Inventar vorhanden und werden zusätzlich vorab geladen. | **needs-follow-up** — ungemountete Legacy-Komponente; Laufzeitabruf und Herkunft/Rechte nicht geprüft. |
| `kampf-seite.tsx:19` `/kampf/hd/${id}/01_gegenueber.jpg` | Nur die Signaturpaare `brecher`/`hammer` und `jaeger`/`bogen`; die jeweilige `01_gegenueber.jpg` ist vorhanden. | **needs-follow-up** — Quellpfad geprüft, aber keine Laufzeit-/Rechtefreigabe. |
| `kampf-seite.tsx:21` `/kampf/hd/${id}/${file}` | Im selben Signaturzweig begrenzt `CLASSIC_STATE` `file` auf `08_block`, `09_ausweichen`, `10_offen` oder `13_zusammenbruch`; die acht Kombinationen beider Figuren sind vorhanden. | **needs-follow-up** — Quellpfad geprüft, aber keine Laufzeit-/Rechtefreigabe. |
| `kampf-seite.tsx:23` `/kampf/v2/${id}/${weaponId}.jpg` | Figuren- und Waffenauswahl stammen aus `CHARACTERS`/`WEAPONS`; die beiden Signaturpaare verlassen den Zweig vorher. Die verbleibenden Figuren-/Waffenbilder sind vorhanden. | **needs-follow-up** — Quellpfad geprüft, aber keine Laufzeit-/Rechtefreigabe. |
| `kampf-seite.tsx:24` `/kampf/v2/${id}/${look}.jpg` | Für nicht speziell behandelte Signatur-/Ausrüstungspaare sind `look`-Werte `block`, `ausweichen`, `offen` und `gebrochen`; die zugehörigen V2-Dateien sind vorhanden. | **needs-follow-up** — Quellpfad geprüft, aber keine Laufzeit-/Rechtefreigabe. |
| `spieler-blick.tsx:14` `/kampf/hd/${id}/${datei}` | `id` ist auf `brecher`/`jaeger` begrenzt; `sequenz` wählt deren HD-Posen. Die ermittelten Dateinamen sind im Inventar vorhanden. | **needs-follow-up** — Quellpfad geprüft, aber keine Laufzeit-/Rechtefreigabe. |
| `spieler-blick.tsx:15` `/kampf/v2/${id}/${datei}` | Für `laeuferin`, `archivar` und `waechter` erzeugt `sequenz` die jeweilige Waffenpose oder einen der Zustände `block`, `ausweichen`, `offen`, `gebrochen`; die entsprechenden V2-Dateien sind vorhanden. | **needs-follow-up** — Quellpfad geprüft, aber keine Laufzeit-/Rechtefreigabe. |

Kein Pfad wird als `approved` markiert: Quellcode und Inventar belegen keine
ausgeführten Bildabrufe, visuelle Freigabe oder Nutzungsrechte. Vor einer
Freigabe muss der zuständige Projekt-/Art-Owner entscheiden, ob die nicht
eingebundenen Legacy-Komponenten erhalten bleiben sollen; danach sind ihre
tatsächlich erzeugten URLs und Bildabrufe in einer Laufzeitprüfung sowie
Herkunft und Rechte der verwendeten Dateien nachzuweisen. Bis dahin sind alle
sieben Einträge ausdrücklich **needs-follow-up** und nicht Teil einer Asset-
oder Release-Freigabe.

## Nested-ZIP-Prüfung (explizit)

Der Scanner inventarisiert verschachtelte ZIP-Container rekursiv (bis zu fünf Ebenen). Die verfügbaren Archive wurden zusätzlich nach `extracted-assets/` entpackt; diese Kopien und die Inventur sind keine Laufzeit-Integration oder Freigabe. Beispiele aus dem aktuellen Manifest:

- `godot/abacktools-Worldassets-part03-of10.zip`: 10 nested Archives, 0 direkte Medien-Assets auf Ebene 1
- `godot/abacktools-Worldassets-part09-of10.zip`: 1 nested Archive, 1.109 direkte Medien-Assets auf Ebene 1
- Mehrere weitere Worldassets- und Demo-Project-Zips enthalten nested Archive (siehe `nestedArchives` im Manifest)

**Status:** Pro-Member-Metadaten (Maße, Dauer, Codec, Duplikate), Lizenz-/Attribution-Prüfung und Integration bleiben offen. Keine ungeprüften Archive-Inhalte wurden aktiviert oder als Runtime-Assets freigegeben.

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
- Laufzeitprüfung der 7 dynamischen Ausdrücke (needs-follow-up, Legacy-Komponenten ungemountet)
- Rechte/Attribution + Metadaten für Archive-Members
- Keine Assets als `freigegeben` markiert
- Retain-or-retire Entscheidung für Legacy ECHO//BRUCH views

## ZIP-Parts-Übersicht (Stand 2026-10-13)

Kompakte Übersicht der gesplitteten Archive. Die Asset-Spalte enthält direkte Medien-Assets der ersten Ebene; verschachtelte Medien sind im rekursiven Manifest erfasst. Keine Assets freigegeben.

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
| part01-of10.zip | 14.4 MB | 428 | 1 | — / hologram_interface.zip |
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

**Status:** Rekursive Inventur und Extraktion in `extracted-assets/` sind erfolgt. Member-Metadaten (Codec, Dauer, Maße), Rechte-Prüfung und Integration bleiben offen; keine Assets sind freigegeben.

## Liste der fehlenden / unvollständigen Assets

### Fehlende ZIP-Parts (vollständig abwesend)

**Demo-Projects** (`abacktools-godot-demo-projects-master-partXX-of15.zip`):  
Vorhanden: 01, 02, 04  
**Fehlend:** part03, part05–part15 (12 Parts)

**Worldassets** (`godot/abacktools-Worldassets-partXX-of10.zip`):  
Vorhanden: 01–04, 06–10  
**Fehlend:** part05-of10.zip

### Nested-ZIP-Inhalte (inventarisiert und extrahiert, aber ungeprüft)

Diese inneren ZIPs sind rekursiv im Manifest inventarisiert und unter `extracted-assets/` entpackt. Die Dateien sind weiterhin ungeprüfte Kandidaten:

- Worldassets-part01: `neu3/1._free_hologram_interface_wenrexa.zip`
- Worldassets-part02: `neu3/cyberpunk-street-files.zip`, `neu3/dark_forest.zip`
- Worldassets-part03: 10× Kenney-Packs (`kenney_cartography-pack.zip`, `kenney_fantasy-ui-borders.zip`, `kenney_impact-sounds.zip`, `kenney_interface-sounds.zip`, `kenney_minimap-pack.zip`, `kenney_new-platformer-pack-1.1.zip`, `kenney_rpg-audio.zip`, `kenney_sketch-desert.zip`, `kenney_sketch-town-expansion.zip`, `kenney_ui-audio.zip`)
- Worldassets-part04: `kenney_voiceover-pack-fighter.zip`, `kenney_voiceover-pack.zip`
- Worldassets-part08: `neu3/parallax-industrial-pack.zip`
- Worldassets-part09: `neu3/skymon-icons-free-v250329.zip`

### Dynamische Referenzen (unbestätigt, nicht fehlend)

7 Template-Ausdrücke in `src/components/echo/` (siehe Review oben) – Kandidaten existieren, Laufzeit-Load ungeprüft. Status: **needs-follow-up**.

**Hinweis:** Die verfügbaren ZIPs wurden in eigene Ordner extrahiert (siehe [`extracted-assets/README.md`](../../extracted-assets/README.md)); fehlende Parts müssen beschafft werden. Keine ungeprüften Assets werden als freigegeben markiert.
