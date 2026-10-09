# First Playable: Regeln und Balance v0.1

Diese Regeln gelten fuer den neuen 2D-Slice unter der Hauptroute. Das alte W100-Duell und der Godot-Entwurf sind separate Prototypen, nicht das Regelwerk dieser Version. Die Umsetzung liegt in `src/game/slice/combat.ts`.

## Reise und Fortschritt

- Drei Karrieren: Soeldner, Duellant und Gelehrtenmagier.
- Vier Begegnungen: Erstes Blut, Wegzoll, Kult und Tor der Nordwacht.
- Start auf Stufe 1 mit Startausruestung und zwei Startfaehigkeiten.
- Startausruestung addiert ihre `stat_modifiers` zu den Karrierewerten.
- Jeder Sieg erhoeht fuer die naechste Begegnung die Stufe um eins. Die vorhandenen `stat_growth`-Werte werden entsprechend addiert.
- Ab Stufe 2 steht der gesamte Karriere-Faehigkeitspool zur Verfuegung.
- Jede Begegnung startet mit vollen Lebenspunkten und Ressourcen. Kein permanenter Tod, keine Persistenz.
- EP und garantierte Gegenstandsbelohnungen werden angezeigt. Belohnungsgegenstaende sind in dieser Version noch nicht nutzbar oder ausruestbar; keine Inventarsimulation behaupten.

## Runden

1. Faehigkeit und gegebenenfalls einen lebenden Gegner waehlen.
2. Vorschau zeigt berechneten direkten Schaden ohne zufaellige Zusatzstatuswirkung.
3. Bestaetigen verbraucht die angegebenen Ressourcen und fuehrt die Aktion aus.
4. Lebende Gegner ticken ihre Statuswirkungen und handeln nacheinander.
5. Spielerstatus tickt, Abklingzeiten sinken und Ausdauer/Fokus regenerieren.

Pro Runde: +4 Ausdauer und +3 Fokus, jeweils begrenzt durch das Maximum. Unterkuehlung reduziert die Ausdauerregeneration. Kraft sammeln gibt zusaetzlich +6 Ausdauer und +4 Fokus statt einer Faehigkeit. Die Gegner handeln trotzdem.

Eine Faehigkeit mit Abklingzeit 2 bleibt fuer zwei nachfolgende eigene Aktionsgelegenheiten gesperrt. Gegner beachten dieselben Abklingzeiten. Da Gegnerdaten keine Ressourcenpools enthalten, zahlen sie keine Ressourcen. Sind alle gegnerischen Faehigkeiten gesperrt, setzt der Gegner aus.

## Schaden und Status

`Schaden = round(max(1, flat + scaling_stat * multiplier - defense) * Zielmodifikator)`, mindestens 1.

- Angriff oder Magie als Skalierungswert kommen aus der Faehigkeit.
- Blutung: 3 Schaden je Stapel und Tick, maximal die definierten Stapel.
- Entbloessung: Verteidigung -3, nicht unter null.
- Fokussierung: Angriffsmodifikator aus den Statusdaten.
- Deckung: eingehender Schaden mal 0,6.
- Betäubung: naechste Aktionsgelegenheit auslassen.
- Unterkuehlung: reduziert Ressourcenregeneration; Tempo hat noch keine Rundenreihenfolge-Wirkung.
- Erfolgswahrscheinlichkeiten fuer Statusanwendungen nutzen einen deterministischen Seed.
- Direkte Treffer sind sicher. Kritische Treffer, Initiative, Resistenzen und automatische Reaktionen sind noch nicht implementiert. Riposte ist in diesem Prototyp eine manuell gewaehlte Aktion, kein automatischer Konter.
- Sieg beendet sofort die Gegenaktionen; Niederlage bei 0 Lebenspunkten. Ein Wiederholungsversuch startet dieselbe Begegnung frisch.

## Gegner und Boss

| Gegner | LP | Angriff | Verteidigung | Rolle |
| --- | ---: | ---: | ---: | --- |
| Gassenmesser | 32 | 8 | 2 | Schnelle Blutungs-/Entbloessungsangriffe |
| Verrosteter Deserteur | 45 | 6 | 4 | Schildstoss und Blutung |
| Heckenkultist | 30 | 3 | 2 | Zauber und Unterkuehlung; aktuelle Magie 0, weitere Balance offen |
| Eiserner Hauptmann | 80 | 7 | 5 | Zwei Phasen, Vorwarnung und Deckung |

Der Hauptmann wechselt bei 50 % Leben einmalig in sein letztes Gefecht: +3 Angriff und zwei Runden Deckung. Eiserner Befehl wird eine Runde vorher angekuendigt und ersetzt in der Warnrunde den Angriff. Ein betaeubter Boss verschiebt den angekuendigten Angriff auf seine naechste verfuegbare Aktion.

## Gemessene Balance

Reproduzierbar: `npm run balance:slice -- 100`. Je Karriere und Begegnung 100 Seeds, insgesamt 1.200 Einzelkaempfe. Die offensive Heuristik priorisiert Schaden, Blutung und Betaeubung; sie sammelt Kraft, wenn kein offensiver Zug moeglich ist. Stufe entspricht Begegnungsnummer. Keine Aussage ueber optimale Strategie oder menschliche Siegquoten.

| Karriere | Erstes Blut | Wegzoll | Kult | Boss | Bossrunden | Restleben beim Bosssieg |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Duellant | 100 % | 100 % | 100 % | 99 % | 10,5 | 21 % |
| Soeldner | 100 % | 100 % | 100 % | 100 % | 10,7 | 67 % |
| Gelehrtenmagier | 100 % | 100 % | 100 % | 100 % | 6,6 | 33 % |

Ausgangslage ohne diese Prototypregeln: 0 % Bosssiege fuer alle Karrieren. Aenderungen: Boss von 220 LP / 10 Angriff / 8 Verteidigung auf 80 / 7 / 5; Soeldner-Verteidigung von 6 auf 4 und Verteidigungswachstum von 1 auf 0; Schildstoss-Abklingzeit von 2 auf 1. Fortschritt, Startausruestung, Regeneration, Bossvorwarnungen und gegnerische Abklingzeiten sind jetzt wirksam.

Offene Balancefrage: Der Soeldner ist deutlich sicherer, der Magier schneller. Dies ist eine spielbare Baseline, keine finale Klassenparitaet. Fuer das naechste Balancing sind Gegenstandsnutzung, Reaktionen und weniger offensiv optimierte Strategien separat zu messen.