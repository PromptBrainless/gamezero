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
