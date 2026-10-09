import { useEffect, useRef, useState } from "react";
import { charakter } from "@/game/w100/charaktere";
import {
  abwehrWaehlen,
  ankuendigen,
  bot,
  kann,
  passen,
  type Kampf,
  type Kaempfer,
  type Seite,
} from "@/game/w100/kampf";
import { ZONE_NAME, type Zone } from "@/game/w100/regeln";
import { pose } from "./spieler-blick";

const ZONEN: Zone[] = ["kopf", "arm-links", "arm-rechts", "koerper", "bein-links", "bein-rechts"];

export function SeitenKampf({
  kampf,
  setKampf,
  modus,
  onNeu,
  onArchiv,
}: {
  kampf: Kampf;
  setKampf: (kampf: Kampf) => void;
  modus: "bot" | "gegen";
  onNeu: () => void;
  onArchiv: () => void;
}) {
  const [zone, setZone] = useState<Zone>("koerper");
  const [zahlen, setZahlen] = useState<{ seite: Seite; text: string; id: number }[]>([]);
  const vorher = useRef(kampf);
  const zaehler = useRef(0);
  const seite = kampf.amZug;
  const duBist = modus === "bot" && seite === "B";
  const ich = kampf.kaempfer[seite];
  const c = charakter(ich.id);
  const blick = kampf.blick;

  useEffect(() => {
    if (!kampf || kampf.vorbei || modus !== "bot" || kampf.amZug !== "B") return;
    const timer = window.setTimeout(() => setKampf(bot(kampf)), 900);
    return () => window.clearTimeout(timer);
  }, [kampf, modus, setKampf]);

  useEffect(() => {
    const alt = vorher.current;
    const neu: { seite: Seite; text: string; id: number }[] = [];
    for (const wer of ["A", "B"] as const) {
      const delta = alt.kaempfer[wer].wunden - kampf.kaempfer[wer].wunden;
      if (delta > 0) {
        zaehler.current += 1;
        neu.push({ seite: wer, text: `−${delta}`, id: zaehler.current });
      }
    }
    if (neu.length > 0) setZahlen(neu);
    vorher.current = kampf;
  }, [kampf]);

  function schlagen() {
    if (duBist) return;
    setKampf(ankuendigen(kampf, c.ortwahl ? zone : null));
  }

  const wurf =
    blick && (blick.art === "treffer" || blick.art === "daneben" || blick.art === "patzer")
      ? blick.angreifer === kampf.kaempfer.A.id
        ? "von-links"
        : "von-rechts"
      : null;

  return (
    <main className="seite-buehne">
      <header className="flex items-center justify-between px-3 pt-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7c4a3]">{kampf.vorbei ? "Ende" : `${ich.name} ist am Zug`}</p>
        <div className="flex gap-1">
          <button type="button" className="btn px-2 py-1 text-xs" onClick={onNeu}>
            Neu
          </button>
          <button type="button" className="btn px-2 py-1 text-xs" onClick={onArchiv}>
            Archiv
          </button>
        </div>
      </header>
      <section className="seite-arena">
        <KaempferSeite wer={kampf.kaempfer.A} blick={blick} />
        <KaempferSeite wer={kampf.kaempfer.B} blick={blick} rechts />
        {wurf && <span key={blick?.text} className={`seite-wurf ${wurf}`} />}
        {zahlen.map((zahl) => (
          <span key={zahl.id} className={`seite-zahl ${zahl.seite === "A" ? "links" : "rechts"}`}>
            {zahl.text}
          </span>
        ))}
      </section>
      <p className="seite-spruch">{kampf.vorbei ? (kampf.sieger ? `${kampf.kaempfer[kampf.sieger].name} steht.` : "Unentschieden") : (kampf.log[0] ?? "")}</p>
      <section className="seite-leiste">
        {c.ortwahl && (
          <label className="text-[11px] text-[#d7c4a3]">
            Zone
            <select className="btn ml-2 py-1 text-xs" value={zone} onChange={(event) => setZone(event.target.value as Zone)}>
              {ZONEN.map((item) => (
                <option key={item} value={item}>
                  {ZONE_NAME[item]}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="seite-aktion" disabled={duBist || !kann(kampf, "schlagen")} onClick={schlagen}>
            Schlagen
          </button>
          <button type="button" className="seite-aktion" disabled={duBist || !kann(kampf, "parieren")} onClick={() => setKampf(abwehrWaehlen(kampf, "parieren"))}>
            Parieren
          </button>
          <button type="button" className="seite-aktion" disabled={duBist || !kann(kampf, "ausweichen")} onClick={() => setKampf(abwehrWaehlen(kampf, "ausweichen"))}>
            Ausweichen
          </button>
          <button type="button" className="seite-aktion" disabled={duBist || kampf.vorbei} onClick={() => setKampf(passen(kampf))}>
            Passen
          </button>
        </div>
      </section>
    </main>
  );
}

function KaempferSeite({
  wer,
  blick,
  rechts = false,
}: {
  wer: Kaempfer;
  blick: Kampf["blick"];
  rechts?: boolean;
}) {
  const dabei = Boolean(blick && (blick.ziel === wer.id || blick.angreifer === wer.id));
  const src = pose(wer.id, dabei ? blick!.art : null, blick?.ziel === wer.id);
  const stoss = blick?.angreifer === wer.id && (blick.art === "treffer" || blick.art === "daneben" || blick.art === "patzer");
  const anteil = Math.max(0, wer.wunden) / wer.wundenMax;
  const farbe = anteil < 0.3 ? "#c44536" : anteil < 0.6 ? "#e0b15a" : "#6ea86a";
  const klasse = [
    "seite-figur",
    rechts ? "rechts" : "links",
    stoss ? (rechts ? "stoss-links" : "stoss-rechts") : "",
    blick?.ziel === wer.id && blick.art === "treffer" ? "getroffen" : "",
    blick?.ziel === wer.id && blick.art === "ausgewichen" ? "weicht" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={klasse}>
      <div className={`seite-balken ${rechts ? "text-right" : ""}`}>
        <div className="flex justify-between text-[10px] uppercase tracking-wide">
          <span>{wer.name}</span>
          <span>
            {Math.max(0, wer.wunden)}/{wer.wundenMax}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/55">
          <div className="h-full" style={{ width: `${anteil * 100}%`, background: farbe, marginLeft: rechts ? "auto" : 0 }} />
        </div>
      </div>
      <img src={src} alt={wer.name} />
    </div>
  );
}
