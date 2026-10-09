import { useState } from "react";
import { Archive, ArrowRight, Bot, Download, Swords, UsersRound } from "lucide-react";
import { CHARAKTERE, type CharakterId } from "@/game/w100/charaktere";
import { neuerKampf, type Kampf } from "@/game/w100/kampf";
import { foundryPaket, roll20Paket } from "@/game/w100/export";
import { SeitenKampf } from "./seiten-kampf";
import { pose } from "./spieler-blick";

export function BreachApp({ onArchiv }: { onArchiv: () => void }) {
  const [kampf, setKampf] = useState<Kampf | null>(null);
  const [a, setA] = useState<CharakterId>("brecher");
  const [b, setB] = useState<CharakterId>("jaeger");
  const [modus, setModus] = useState<"bot" | "gegen">("bot");

  if (!kampf) {
    return (
      <main className="relative isolate min-h-dvh overflow-hidden bg-bg text-fg">
        <img
          src="/kampf/v2/bg/halle.jpg"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg/40 via-bg/80 to-bg" />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-7 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <header className="flex items-center justify-between gap-4 border-b border-line/70 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-soft/50 bg-bg/75 text-soft">
                <Swords aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Neues Kampfsystem</p>
                <p className="text-sm font-medium">ECHO//BRUCH</p>
              </div>
            </div>
            <button type="button" className="btn bg-bg/65 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soft" onClick={onArchiv}>
              <Archive aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Altes System</span>
              <span className="sm:hidden">Archiv</span>
            </button>
          </header>

          <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
            <section className="min-w-0">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-soft">Aufstellung · 01</p>
                  <h1 className="display mt-2 text-4xl sm:text-5xl">Gegenüber</h1>
                </div>
                <p className="hidden max-w-xs text-right text-sm leading-relaxed text-muted md:block">
                  Zwei Kämpfer. Ein Duell. Wähle deine Seite und bestimme, wer dir gegenübersteht.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Wahl label="Deine Figur" seite="A" value={a} onChange={setA} />
                <Wahl label="Gegenüber" seite="B" value={b} onChange={setB} />
              </div>
            </section>

            <aside className="panel flex flex-col gap-5 border-line/80 bg-surface/90 p-4 backdrop-blur-md sm:p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Spielmodus</p>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-line bg-bg/70 p-1" role="group" aria-label="Spielmodus">
                  <button
                    type="button"
                    aria-pressed={modus === "bot"}
                    className={`btn min-w-0 border-transparent px-2 ${modus === "bot" ? "btn-on bg-raised" : "bg-transparent text-muted"}`}
                    onClick={() => setModus("bot")}
                  >
                    <Bot aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="truncate">Gegen Bot</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={modus === "gegen"}
                    className={`btn min-w-0 border-transparent px-2 ${modus === "gegen" ? "btn-on bg-raised" : "bg-transparent text-muted"}`}
                    onClick={() => setModus("gegen")}
                  >
                    <UsersRound aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="truncate">Zu zweit</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Duellpaarung</p>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <span className="truncate font-medium">{charakterName(a)}</span>
                  <span className="text-xs uppercase text-faint">gegen</span>
                  <span className="truncate text-right font-medium">{charakterName(b)}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary min-h-12 w-full justify-between px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soft"
                onClick={() => setKampf(neuerKampf(a, b))}
              >
                <span className="flex items-center gap-2">
                  <Swords aria-hidden="true" className="h-4 w-4" />
                  Kampf beginnen
                </span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>

              <div className="mt-auto border-t border-line pt-4">
                <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Kampf exportieren</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="btn min-w-0 bg-bg/65 px-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soft" onClick={() => datei("echo-bruch-foundry.json", foundryPaket([]))}>
                    <Download aria-hidden="true" className="h-4 w-4 shrink-0" />
                    Foundry
                  </button>
                  <button type="button" className="btn min-w-0 bg-bg/65 px-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soft" onClick={() => datei("echo-bruch-roll20.json", roll20Paket())}>
                    <Download aria-hidden="true" className="h-4 w-4 shrink-0" />
                    Roll20
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  return (
    <SeitenKampf kampf={kampf} setKampf={setKampf} modus={modus} onNeu={() => setKampf(null)} onArchiv={onArchiv} />
  );
}

function datei(name: string, inhalt: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(inhalt, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}


function Wahl({ label, seite, value, onChange }: { label: string; seite: "A" | "B"; value: CharakterId; onChange: (id: CharakterId) => void }) {
  const item = CHARAKTERE.find((character) => character.id === value)!;
  return (
    <article className="group overflow-hidden rounded-md border border-line/80 bg-surface/90 shadow-xl shadow-ink/30 backdrop-blur-sm">
      <div className="relative h-56 overflow-hidden sm:h-64">
        <img
          src={pose(value, null, false)}
          alt=""
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-bg/10" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="rounded-sm border border-fg/30 bg-bg/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] backdrop-blur-sm">
            Seite {seite}
          </span>
          <span className="text-[10px] uppercase tracking-[0.15em] text-fg/75">{label}</span>
        </div>
        <div className="absolute inset-x-4 bottom-4">
          <h2 className="display text-3xl sm:text-4xl">{item.name}</h2>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-fg/80">{item.zeile}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
        <Wert label="Wunden" value={item.wunden} />
        <Wert label="Reichweite" value={item.reichweite} />
        <Wert label="Bewegung" value={item.bewegung} />
      </div>

      <label className="block p-4 text-xs font-medium text-muted">
        Kämpfer auswählen
        <select
          aria-label={`${label} auswählen`}
          className="btn mt-2 w-full appearance-none justify-between bg-bg/75 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soft"
          value={value}
          onChange={(event) => onChange(event.target.value as CharakterId)}
        >
          {CHARAKTERE.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

function Wert({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2 py-3 text-center sm:px-3">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-muted sm:text-[10px]">{label}</p>
    </div>
  );
}

function charakterName(id: CharakterId): string {
  return CHARAKTERE.find((character) => character.id === id)?.name ?? id;
}
