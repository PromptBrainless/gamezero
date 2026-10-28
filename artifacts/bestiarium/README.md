# Ruff Bestiarium – Bestandsaufnahme & 3D-Cutouts

Stand: 28.10.2026

## Bestandsaufnahme

Quelle: `Ruff_Bestandsaufnahme_Wesen_und_Figuren.xlsx` (Export aus Notion ZIP)

**Kennzahlen:**
- 1.074 HTML-ZIP-Einträge
- 237 unterschiedliche HTML-Pfade
- 133 Einzelprofile im Wesen-Register
- 66 Pfade mit mehrfachen ZIP-Vorkommen und abweichenden CRC32-Werten

**Wichtige Einschränkung:** ZIP-Einträge sind keine eindeutigen Wesen. Wiederholte Pfade können unterschiedliche Inhaltsstände enthalten. Keine Seite wurde in Notion geändert oder gelöscht.

Die Excel-Datei liegt lokal vor und dient als Arbeitsinventar. Sie enthält:
- Start hier
- Seiteninventar
- Profil-Abgleich
- ZIP-Varianten
- Offene Entscheidungen
- Sicherer Aufräumplan (8 Schritte)

## Generierte 3D-Cutouts

Ordner: `artifacts/bestiarium/3d/`

Aktuell **83** PNGs im Format `ruff_wesen_<slug>.png`.

Stil: Ruff Eisen-Glühen (evolviert zu Ember-Augen, ohne dunkles Eisen), transparenter Hintergrund, 3D-volumetrisch.

**Mapping:** Siehe `mapping_png_to_profile.csv`
- Exact matches: 23
- Partial: 8
- Kein Match (Ruff-spezifisch / erweitert): 52

Viele generierte Wesen sind Ruff-Erweiterungen oder Varianten (z. B. freundliche Versionen, Menschengestalten, Ruß-Kreaturen), die im klassischen Register so nicht (oder unter anderem Namen) existieren.

## Pilotmigration – Repräsentative Profile

| # | Titel | Typ / Fall | Quelle |
|---|-------|------------|--------|
| 1 | Gnom | Einfaches Wesen | Wesen-Register |
| 2 | Aesops Fuchs | Einfaches Wesen + Alias | Wesen-Register |
| 3 | Anubis | Gottheit | Wesen-Register |
| 4 | Amaterasu | Gottheit | Wesen-Register |
| 5 | Reineke Fuchs | Alias / Verwandtschaft | Wesen-Register |
| 6 | Unbenannt | Unbenannt-Seite | Wesen-Register |
| 7 | Cerberus | Archetyp-Verknüpfung | Wesen-Register |
| 8 | (magisches Objekt) | Magisches Objekt | Stufe-6-Listen / V5 |

## Vorgeschlagene Notion-Datenbank-Struktur

**Properties:**
- Name (Title)
- Status (Select): Entwurf · Prüfen · Kanon · Archiv · Unbenannt
- Machtstufe (Select)
- Typ (Select): Wesen · Gottheit · Archetyp-Referenz · Magisches Objekt · Mensch
- Archetypen (Relation)
- Verwandte Einträge (Relation)
- Alias / Alternative Namen
- Quelle / Exportpfad
- In Ruff angekommen? (Checkbox)
- Rolle in Ruff
- 3D-Cutout (Files)
- Notizen / Prüfstatus

## Nächste Schritte (aus Aufräumplan)

1. Unbenannte Seiten und unterschiedliche Fassungen prüfen
2. Kanonische Quellen und Statusregeln festlegen
3. Zentrale Wesen-Datenbank mit Feldern und Ansichten vorbereiten
4. Pilotgruppe (oben) migrieren und gegen Originale prüfen
5. Erst danach weitere Inhalte übertragen

---
*Index automatisch erzeugt. Excel und PNGs liegen lokal / im Repo unter artifacts/bestiarium/.*
