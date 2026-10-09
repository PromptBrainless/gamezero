import { useState } from "react";
import { CHARACTERS, type Side } from "@/game/content";
import { isOpen, type Fighter, type GameState } from "@/game/model";
import type { Frame } from "@/game/resolve";

export type Look = "waffe" | "block" | "ausweichen" | "offen" | "gebrochen";

const CLASSIC_STATE: Record<Look, string | null> = {
  waffe: null,
  block: "08_block.jpg",
  ausweichen: "09_ausweichen.jpg",
  offen: "10_offen.jpg",
  gebrochen: "13_zusammenbruch.jpg",
};

export function plateSrc(id: string, weaponId: string, look: Look): string {
  const signature = (id === "brecher" && weaponId === "hammer") || (id === "jaeger" && weaponId === "bogen");
  if (signature && (id === "brecher" || id === "jaeger")) {
    if (look === "waffe") return `/kampf/hd/${id}/01_gegenueber.jpg`;
    const file = CLASSIC_STATE[look];
    if (file) return `/kampf/hd/${id}/${file}`;
  }
  if (look === "waffe") return `/kampf/v2/${id}/${weaponId}.jpg`;
  return `/kampf/v2/${id}/${look}.jpg`;
}

export function backdrop(beat: Frame | null): string {
  if (!beat) return "/kampf/v2/bg/halle.jpg";
  if (beat.tone === "win" || beat.tone === "break") return "/kampf/v2/bg/bruch.jpg";
  if (beat.tone === "miss" || /ausweich/i.test(beat.detail)) return "/kampf/v2/bg/nebel.jpg";
  if (beat.tone === "hit" || beat.tone === "guard") return "/kampf/v2/bg/funken.jpg";
  return "/kampf/v2/bg/halle.jpg";
}

export function lookOf(state: GameState, side: Side, beat: Frame | null): Look {
  const f = state.fighters[side];
  if (f.body <= 0 || f.collapse) return "gebrochen";
  if (beat?.tone === "win" && beat.state.winner && beat.state.winner !== side) return "gebrochen";
  const blob = beat ? `${beat.title} ${beat.detail}` : "";
  const defender = beat?.actor && beat.actor !== side;
  if (defender && /Block −|blockt|steht geschützt|Standhalten/i.test(blob)) return "block";
  if (defender && /Ausweichen −|weicht aus/i.test(blob)) return "ausweichen";
  if (beat?.actor === side && beat.tone === "guard") return "block";
  if (isOpen(f)) return "offen";
  return "waffe";
}

export function lookLabel(look: Look): string {
  if (look === "block") return "Geblockt";
  if (look === "ausweichen") return "Ausgewichen";
  if (look === "offen") return "Offen";
  if (look === "gebrochen") return "Gebrochen";
  return "Bereit";
}

export function KampfKarte({
  f,
  tag,
  look,
  featured = false,
  className = "",
}: {
  f: Fighter;
  tag: string;
  look: Look;
  featured?: boolean;
  className?: string;
}) {
  const c = CHARACTERS.find((item) => item.id === f.characterId)!;
  return (
    <article className={`rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md ${featured ? "ring-1 ring-white/40" : ""} ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="display truncate text-2xl">{c.name}</h2>
        <p className="text-[10px] uppercase tracking-wide text-white/50">{tag}</p>
      </div>
      <p className="mt-1 truncate text-xs text-white/70">
        {weaponName(f.weaponId)} · {armorName(f.armorId)}
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-wide text-white/80">{lookLabel(look)}</p>
      <div className="mt-2 flex flex-col gap-2">
        <Meter label="Körper" value={f.body} max={f.bodyMax} tone="bg-white" />
        <Meter label="Bruch" value={f.bruch} max={f.bruchMax} tone="bg-[#c4523a]" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wide text-white/50">Energie</span>
          <span className="flex gap-1">
            {Array.from({ length: f.energyMax }, (_, i) => (
              <span key={i} className={`h-1.5 w-3 rounded-full ${i < f.energy ? "bg-white" : "bg-white/20"}`} />
            ))}
          </span>
        </div>
      </div>
    </article>
  );
}

export function Szenenloop({ src }: { src: string }) {
  const [clip, setClip] = useState(true);
  const [ready, setReady] = useState(false);
  const mp4 = src.replace(/\.jpg$/, ".mp4");
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img src={src} alt="" className="gif-still h-full w-full object-cover" />
      {clip && (
        <video
          key={mp4}
          className={ready ? "absolute inset-0 h-full w-full object-cover" : "hidden"}
          src={mp4}
          poster={src}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setReady(true)}
          onError={() => setClip(false)}
        />
      )}
    </div>
  );
}

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-white/50">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function weaponName(id: string): string {
  const names: Record<string, string> = {
    kurzschwert: "Kurzschwert",
    hammer: "Hammer",
    speer: "Speer",
    bogen: "Bogen",
    kette: "Kettenklinge",
  };
  return names[id] ?? id;
}

function armorName(id: string): string {
  const names: Record<string, string> = {
    leder: "Leder",
    ketten: "Kettenrüstung",
    platte: "Platte",
    spiegel: "Spiegelfaser",
  };
  return names[id] ?? id;
}
