import { useEffect, useState } from "react";
import { basisHero, type BasisBeat, type BasisFighter } from "@/game/basis";

type SetId = "brecher" | "jaeger";

interface DuelView {
  mode: "bot" | "hotseat";
  frame: number;
  beats: BasisBeat[];
  heroes: Record<"A" | "B", string>;
  pending: { fighters: Record<"A" | "B", BasisFighter>; round: number } | null;
  game: { fighters: Record<"A" | "B", BasisFighter>; round: number } | null;
}

const PLATES: Record<SetId, string[]> = {
  brecher: [
    "01_gegenueber.jpg",
    "02_ausholen.jpg",
    "03_wuerfel.jpg",
    "04_verfehlen.jpg",
    "05_schutz.jpg",
    "06_koerper.jpg",
    "07_bruch.jpg",
    "08_block.jpg",
    "09_ausweichen.jpg",
    "10_offen.jpg",
    "11_gegentreffer.jpg",
    "12_energie.jpg",
    "13_zusammenbruch.jpg",
  ],
  jaeger: [
    "01_gegenueber.jpg",
    "02_ausholen.jpg",
    "03_anlegen.jpg",
    "04_verfehlen.jpg",
    "05_schutz.jpg",
    "06_koerper.jpg",
    "07_bruch.jpg",
    "08_block.jpg",
    "09_ausweichen.jpg",
    "10_offen.jpg",
    "11_schuss.jpg",
    "11b_schuss_aus_der_drehung.jpg",
    "12_energie.jpg",
    "13_zusammenbruch.jpg",
  ],
};

function foeSet(heroId: string): SetId {
  return heroId === "jaeger" ? "jaeger" : "brecher";
}

function plateFile(beat: BasisBeat, set: SetId, earlierHits: number): string {
  const blob = `${beat.title} ${beat.detail}`.toLowerCase();
  if (beat.kicker.includes("Aufdecken")) {
    if (!/kampf/.test(blob)) return "01_gegenueber.jpg";
    if (set === "jaeger" && /jäger/.test(blob)) return "03_anlegen.jpg";
    return "02_ausholen.jpg";
  }
  if (beat.tone === "win") {
    if (/zeit|unentschieden/.test(blob)) return "12_energie.jpg";
    return "13_zusammenbruch.jpg";
  }
  if (beat.tone === "miss" || /verfehlt/.test(blob)) return "04_verfehlen.jpg";
  if (/ausweich/.test(blob)) return "09_ausweichen.jpg";
  if (/block/.test(blob)) return "08_block.jpg";
  if (/[1-9]\d* bruch/.test(blob)) return "07_bruch.jpg";
  if (/offen/.test(blob)) return "10_offen.jpg";
  if (/0 körper/.test(blob)) return "05_schutz.jpg";
  if (beat.tone === "hit" && earlierHits > 0) {
    return set === "jaeger" ? "11b_schuss_aus_der_drehung.jpg" : "11_gegentreffer.jpg";
  }
  if (beat.tone === "hit") return "06_koerper.jpg";
  if (/ende|energie/.test(blob)) return "12_energie.jpg";
  return "01_gegenueber.jpg";
}

function plateSrc(set: SetId, file: string): string {
  return `/kampf/hd/${set}/${file}`;
}

function diceOf(detail: string): string {
  const found = detail.match(/Würfel (\d)/);
  return found ? found[1] : "–";
}

function Bars({ fighter, align }: { fighter: BasisFighter; align: "left" | "right" }) {
  const reverse = align === "right" ? "flex-row-reverse text-right" : "";
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${align === "right" ? "items-end" : ""}`}>
      <Meter label="Körper" value={fighter.body} max={fighter.bodyMax} tone="body" reverse={reverse} />
      <Meter label="Bruch" value={fighter.bruch} max={fighter.bruchMax} tone="bruch" reverse={reverse} />
      <div className={`flex items-center gap-2 ${reverse}`}>
        <span className="w-14 text-[10px] tracking-[0.12em] text-[#a89880] uppercase">Energie</span>
        <span className="flex gap-1">
          {Array.from({ length: fighter.energyMax }, (_, i) => (
            <i key={i} className={`block h-2.5 w-2.5 border border-[#7eb0c8] ${i < fighter.energy ? "bg-[#7eb0c8]" : "bg-transparent"}`} />
          ))}
        </span>
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  max,
  tone,
  reverse,
}: {
  label: string;
  value: number;
  max: number;
  tone: "body" | "bruch";
  reverse: string;
}) {
  const width = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const fill = tone === "body" ? "bg-gradient-to-r from-[#9c2b24] to-[#d4543c]" : "bg-gradient-to-r from-[#c4842a] to-[#e2b15a]";
  return (
    <div className={`flex w-full items-center gap-2 ${reverse}`}>
      <span className="w-14 shrink-0 text-[10px] tracking-[0.12em] text-[#a89880] uppercase">{label}</span>
      <span className="h-2 min-w-0 flex-1 border border-[rgba(232,220,196,0.35)] bg-white/10">
        <span className={`block h-full ${fill}`} style={{ width: `${width}%`, transition: "width 0.45s ease" }} />
      </span>
    </div>
  );
}

export function KampfBuehne({
  duel,
  beat,
  dispatch,
}: {
  duel: DuelView;
  beat: BasisBeat;
  dispatch: (act: { type: "step" } | { type: "title" }) => void;
}) {
  const state = duel.pending ?? duel.game;
  const set = foeSet(duel.heroes.B);
  const earlierHits = duel.beats.slice(0, duel.frame).filter((item) => item.tone === "hit").length;
  const file = plateFile(beat, set, earlierHits);
  const src = plateSrc(set, file);
  const [layers, setLayers] = useState({ back: src, front: src, token: 0 });

  useEffect(() => {
    for (const plate of PLATES.brecher) {
      const brecher = new Image();
      brecher.src = plateSrc("brecher", plate);
    }
    for (const plate of PLATES.jaeger) {
      const jaeger = new Image();
      jaeger.src = plateSrc("jaeger", plate);
    }
  }, []);

  useEffect(() => {
    setLayers((current) => {
      if (current.front === src) return current;
      return { back: current.front, front: src, token: current.token + 1 };
    });
  }, [src]);

  if (!state) return null;
  const drift = duel.frame % 2 === 0 ? "shot-left" : "shot-right";
  const flash = beat.tone === "hit" || beat.tone === "win" ? "bg-[#9c2b24]" : beat.tone === "guard" ? "bg-[#7eb0c8]" : beat.tone === "miss" ? "bg-[#1a1412]" : "";
  const lines = duel.beats.slice(Math.max(0, duel.frame - 2), duel.frame + 1);
  const you = state.fighters.A;
  const foe = state.fighters.B;

  return (
    <main className="relative h-dvh overflow-hidden bg-black text-[#e8dcc4]">
      <div className={`absolute inset-0 ${beat.tone === "hit" ? "shake" : ""}`}>
        <img src={layers.back} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <img key={layers.token} src={layers.front} alt="" className={`${drift} absolute inset-0 h-full w-full origin-center object-cover`} />
      </div>
      {flash && <div key={`flash-${layers.token}`} className={`impact pointer-events-none absolute inset-0 ${flash}`} />}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.55)_100%),linear-gradient(to_top,rgba(0,0,0,0.78),transparent_32%)]" />

      <Plate side="left" who={duel.mode === "bot" ? "Du" : "Spieler A"} name={basisHero(duel.heroes.A).name} fighter={you} />
      <Plate side="right" who={duel.mode === "bot" ? "Gegenüber" : "Spieler B"} name={basisHero(duel.heroes.B).name} fighter={foe} />

      <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 border border-[rgba(232,220,196,0.35)] bg-[rgba(12,10,8,0.72)] px-4 py-1.5 text-[12px] tracking-[0.22em] uppercase">
        Runde {state.round}
      </div>

      <div key={duel.frame} className="rise absolute bottom-28 left-3 z-10 w-[min(520px,calc(100%-6.5rem))] border border-[rgba(232,220,196,0.35)] bg-[rgba(12,10,8,0.72)] px-4 py-3 sm:left-1/2 sm:w-[min(520px,calc(100%-8rem))] sm:-translate-x-1/2 sm:text-center">
        <b className="display block text-2xl font-normal sm:text-3xl">{beat.title}</b>
        <span className="mt-1 block text-sm text-[#a89880]">{beat.detail}</span>
      </div>

      <div className="absolute right-3 bottom-28 z-10 grid h-16 w-16 place-items-center border border-[rgba(232,220,196,0.35)] bg-[rgba(12,10,8,0.72)] text-3xl">
        {diceOf(beat.detail)}
      </div>

      <div className="absolute bottom-3 left-3 z-10 w-[min(420px,calc(100%-11rem))] border border-[rgba(232,220,196,0.35)] bg-[rgba(12,10,8,0.72)] px-3 py-2 text-sm leading-snug">
        {lines.map((line, index) => (
          <div key={`${duel.frame}-${index}`} className={index === lines.length - 1 ? "text-[#e8dcc4]" : "text-[#a89880]"}>
            {line.title}
          </div>
        ))}
      </div>

      <div className="absolute right-3 bottom-3 z-10 flex gap-2">
        <button type="button" className="btn" onClick={() => dispatch({ type: "title" })}>
          Menü
        </button>
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "step" })}>
          Weiter
        </button>
      </div>
    </main>
  );
}

function Plate({ side, who, name, fighter }: { side: "left" | "right"; who: string; name: string; fighter: BasisFighter }) {
  return (
    <aside
      className={`absolute top-3 z-10 w-[min(240px,42vw)] border border-[rgba(232,220,196,0.35)] bg-[rgba(12,10,8,0.72)] px-3 py-2 ${side === "left" ? "left-3" : "right-3"}`}
    >
      <div className={`text-[11px] tracking-[0.16em] text-[#a89880] uppercase ${side === "right" ? "text-right" : ""}`}>{who}</div>
      <div className={`display mb-1 text-xl ${side === "right" ? "text-right" : ""}`}>{name}</div>
      <Bars fighter={fighter} align={side} />
    </aside>
  );
}
