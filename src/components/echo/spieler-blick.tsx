import { useEffect, useState } from "react";
import type { CharakterId } from "@/game/w100/charaktere";
import type { Blick, BlickArt } from "@/game/w100/kampf";

const WAFFE: Record<CharakterId, string> = {
  brecher: "hammer",
  jaeger: "bogen",
  laeuferin: "kurzschwert",
  archivar: "kette",
  waechter: "speer",
};

function platte(id: CharakterId, datei: string): string {
  if ((id === "brecher" || id === "jaeger") && datei.endsWith(".jpg") && datei.includes("_")) return `/kampf/hd/${id}/${datei}`;
  return `/kampf/v2/${id}/${datei}`;
}

function sequenz(id: CharakterId, gegnerIstZiel: boolean, art: BlickArt | null): string[] {
  const klassisch = id === "brecher" || id === "jaeger";
  const bereit = klassisch ? "01_gegenueber.jpg" : `${WAFFE[id]}.jpg`;
  const holen = klassisch ? (id === "jaeger" ? "03_anlegen.jpg" : "02_ausholen.jpg") : `${WAFFE[id]}.jpg`;
  const schuss = klassisch ? (id === "jaeger" ? "11_schuss.jpg" : "02_ausholen.jpg") : `${WAFFE[id]}.jpg`;
  let ende = bereit;
  if (!art) ende = bereit;
  else if (art === "gebrochen") ende = klassisch ? "13_zusammenbruch.jpg" : "gebrochen.jpg";
  else if (gegnerIstZiel && art === "treffer") ende = klassisch ? "06_koerper.jpg" : "offen.jpg";
  else if (gegnerIstZiel && art === "pariert") ende = klassisch ? "08_block.jpg" : "block.jpg";
  else if (gegnerIstZiel && (art === "ausgewichen" || art === "daneben")) ende = klassisch ? (art === "ausgewichen" ? "09_ausweichen.jpg" : "04_verfehlen.jpg") : "ausweichen.jpg";
  else if (!gegnerIstZiel && art === "treffer") ende = schuss;
  else if (!gegnerIstZiel && (art === "daneben" || art === "ausgewichen" || art === "pariert" || art === "patzer")) ende = klassisch ? "04_verfehlen.jpg" : "ausweichen.jpg";
  else if (art === "patzer") ende = klassisch ? "04_verfehlen.jpg" : "offen.jpg";
  return [platte(id, bereit), platte(id, holen), platte(id, ende)];
}

export function pose(id: CharakterId, art: BlickArt | null, istZiel: boolean): string {
  const folge = sequenz(id, istZiel, art);
  return folge[folge.length - 1] ?? folge[0];
}

export function SpielerBlick({ blick, gegner }: { blick: Blick | null; gegner: CharakterId }) {
  const [frame, setFrame] = useState(0);
  const gegnerIstZiel = !blick || blick.ziel === gegner;
  const bilder = sequenz(gegner, gegnerIstZiel, blick?.art ?? null);
  const key = `${gegner}-${blick?.text ?? "bereit"}`;

  useEffect(() => {
    setFrame(0);
  }, [key]);

  useEffect(() => {
    if (frame >= bilder.length - 1) return;
    const timer = window.setTimeout(() => setFrame((aktuell) => aktuell + 1), 680);
    return () => window.clearTimeout(timer);
  }, [frame, bilder.length, key]);

  return (
    <figure className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
      <img key={`${key}-${frame}`} src={bilder[frame]} alt="" className="plate-in scene-drift aspect-[5/2] max-h-24 w-full object-cover sm:aspect-video sm:max-h-40" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-1">
        <p className="text-[10px] uppercase tracking-wide text-white/60">Deine Sicht</p>
        <p className="text-sm text-white">{blick?.text ?? "Er steht dir gegenüber."}</p>
      </figcaption>
    </figure>
  );
}
