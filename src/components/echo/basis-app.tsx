import { useEffect, useReducer, useState } from "react";
import { Footprints, Shield, Swords } from "lucide-react";
import { KampfBuehne } from "@/components/echo/kampf-buehne";
import {
  BASIS_HEROES,
  basisActionValue,
  basisHero,
  basisPools,
  basisSelfcheck,
  beginBasisRound,
  botBasisChoice,
  botBasisHero,
  createBasis,
  resolveBasis,
  winDetail,
  winTitle,
  type BasisAction,
  type BasisBeat,
  type BasisChoice,
  type BasisFighter,
  type BasisState,
  type Side,
} from "@/game/basis";

type Screen = "title" | "pick" | "cover" | "plan" | "scene" | "end";

interface Duel {
  screen: Screen;
  mode: "bot" | "hotseat";
  focus: Side;
  heroes: Record<Side, string>;
  game: BasisState | null;
  draft: BasisChoice;
  locked: Partial<Record<Side, BasisChoice>>;
  beats: BasisBeat[];
  frame: number;
  pending: BasisState | null;
  banner: string;
}

type Act =
  | { type: "boot"; mode: "bot" | "hotseat" }
  | { type: "hero"; id: string }
  | { type: "advance" }
  | { type: "back" }
  | { type: "ready" }
  | { type: "draft"; choice: BasisChoice }
  | { type: "lock" }
  | { type: "step" }
  | { type: "rematch" }
  | { type: "title" };

function emptyChoice(): BasisChoice {
  return { action: "kampf", energy: 0 };
}

function initial(): Duel {
  return {
    screen: "title",
    mode: "bot",
    focus: "A",
    heroes: { A: "brecher", B: "waechter" },
    game: null,
    draft: emptyChoice(),
    locked: {},
    beats: [],
    frame: 0,
    pending: null,
    banner: "",
  };
}

function openFight(state: Duel, heroes: Record<Side, string>): Duel {
  const seed = 1 + Math.floor(Math.random() * 999983);
  const begun = beginBasisRound(createBasis(heroes.A, heroes.B, seed));
  return {
    ...state,
    heroes,
    game: begun,
    banner: begun.log[begun.log.length - 1] ?? "",
    screen: state.mode === "hotseat" ? "cover" : "plan",
    focus: "A",
    draft: emptyChoice(),
    locked: {},
    beats: [],
    frame: 0,
    pending: null,
  };
}

function reduce(state: Duel, act: Act): Duel {
  switch (act.type) {
    case "boot":
      return { ...state, mode: act.mode, focus: "A", screen: "pick", draft: emptyChoice() };
    case "hero":
      return { ...state, heroes: { ...state.heroes, [state.focus]: act.id } };
    case "advance": {
      if (state.screen !== "pick") return state;
      if (state.mode === "hotseat" && state.focus === "A") {
        return { ...state, screen: "cover", focus: "B" };
      }
      const heroes = { ...state.heroes };
      if (state.mode === "bot") heroes.B = botBasisHero(heroes.A, heroes.A.length + 3);
      return openFight(state, heroes);
    }
    case "back":
      if (state.screen === "pick" && state.focus === "B") return { ...state, screen: "pick", focus: "A" };
      if (state.screen === "pick") return { ...state, screen: "title", focus: "A" };
      return state;
    case "ready":
      return { ...state, screen: state.focus === "B" && !state.game ? "pick" : "plan", draft: emptyChoice() };
    case "draft":
      return { ...state, draft: act.choice };
    case "lock": {
      if (!state.game || state.game.over) return state;
      const mine = clampDraft(state.game.fighters[state.focus], state.draft);
      if (state.mode === "bot") {
        const bot = botBasisChoice(state.game);
        const resolved = resolveBasis(state.game, mine, bot);
        return {
          ...state,
          locked: { A: mine, B: bot },
          pending: resolved.state,
          beats: resolved.beats,
          frame: 0,
          screen: "scene",
        };
      }
      const locked = { ...state.locked, [state.focus]: mine };
      if (state.focus === "A") return { ...state, locked, screen: "cover", focus: "B", draft: emptyChoice() };
      const resolved = resolveBasis(state.game, locked.A ?? mine, mine);
      return { ...state, locked, pending: resolved.state, beats: resolved.beats, frame: 0, screen: "scene" };
    }
    case "step": {
      if (state.frame < state.beats.length - 1) return { ...state, frame: state.frame + 1 };
      const next = state.pending;
      if (!next) return state;
      if (next.over) return { ...state, game: next, pending: null, screen: "end", beats: [], frame: 0 };
      const begun = beginBasisRound(next);
      return {
        ...state,
        game: begun,
        pending: null,
        banner: begun.log[begun.log.length - 1] ?? "",
        screen: state.mode === "hotseat" ? "cover" : "plan",
        focus: "A",
        draft: emptyChoice(),
        locked: {},
        beats: [],
        frame: 0,
      };
    }
    case "rematch":
      return openFight(state, state.heroes);
    case "title":
      return { ...initial(), mode: state.mode };
    default:
      return state;
  }
}

function clampDraft(f: BasisFighter, choice: BasisChoice): BasisChoice {
  if (choice.action === "ausweichen") return { action: "ausweichen", energy: 0 };
  const cap = choice.action === "block" ? 1 : 3;
  return { action: choice.action, energy: Math.max(0, Math.min(cap, choice.energy, f.energy)) };
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function BasisApp({ onFull }: { onFull: () => void }) {
  const [duel, dispatch] = useReducer(reduce, undefined, initial);
  const [codex, setCodex] = useState(false);
  const [checked, setChecked] = useState("");

  useEffect(() => {
    const errors = basisSelfcheck();
    setChecked(errors.length ? errors.join(" · ") : "");
  }, []);

  useEffect(() => {
    if (duel.screen !== "scene") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const timer = window.setTimeout(() => dispatch({ type: "step" }), 3200);
    return () => window.clearTimeout(timer);
  }, [duel.screen, duel.frame, duel.beats.length]);

  const beat = duel.screen === "scene" ? duel.beats[duel.frame] : null;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      {duel.screen === "title" && <Title onFull={onFull} onBoot={(mode) => dispatch({ type: "boot", mode })} />}
      {duel.screen === "pick" && <Pick duel={duel} dispatch={dispatch} />}
      {duel.screen === "cover" && <Cover duel={duel} dispatch={dispatch} />}
      {duel.screen === "scene" && beat && <KampfBuehne duel={duel} beat={beat} dispatch={dispatch} />}
      {duel.screen === "plan" && duel.game && (
        <Fight duel={duel} beat={beat} dispatch={dispatch} onCodex={() => setCodex(true)} />
      )}
      {duel.screen === "end" && duel.game && <Ending duel={duel} dispatch={dispatch} />}
      {codex && <Codex onClose={() => setCodex(false)} />}
      {checked && (
        <p className="fixed bottom-3 left-3 right-3 rounded-md bg-accent px-3 py-2 text-sm text-fg" role="alert">
          Basisprüfung: {checked}
        </p>
      )}
    </div>
  );
}

function Title({ onFull, onBoot }: { onFull: () => void; onBoot: (mode: "bot" | "hotseat") => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-8 px-4 py-8">
      <header className="max-w-xl">
        <p className="text-sm text-muted">Basis · zum Prüfen</p>
        <h1 className="display mt-2 text-5xl sm:text-6xl">ECHO//BRUCH</h1>
        <p className="mt-4 max-w-md text-muted">
          Zwei Spielkarten, nur die fünf Grundwerte. Keine Waffe, keine Ausrüstung, keine Echos. Eine Runde ist Kampf, Block oder Ausweichen.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => onBoot("bot")}>
          Gegen den Bot
        </button>
        <button type="button" className="btn" onClick={() => onBoot("hotseat")}>
          Zu zweit am Gerät
        </button>
        <button type="button" className="btn" onClick={onFull}>
          Volles Duell
        </button>
      </div>
    </main>
  );
}

function Pick({ duel, dispatch }: { duel: Duel; dispatch: (act: Act) => void }) {
  const current = duel.heroes[duel.focus];
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{duel.focus === "A" ? "Spieler A" : "Spieler B"}</p>
          <h1 className="display text-4xl">Spielkarte</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={() => dispatch({ type: "back" })}>
            Zurück
          </button>
          <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "advance" })}>
            Diese Karte
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BASIS_HEROES.map((hero) => (
          <Spielkarte
            key={hero.id}
            heroId={hero.id}
            selected={hero.id === current}
            onPick={() => dispatch({ type: "hero", id: hero.id })}
          />
        ))}
      </div>
    </main>
  );
}

function Cover({ duel, dispatch }: { duel: Duel; dispatch: (act: Act) => void }) {
  const who = duel.focus === "A" ? "Spieler A" : "Spieler B";
  const picking = !duel.game;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm text-muted">{picking ? "Nächste Karte" : "Verdecktes Planen"}</p>
      <h1 className="display text-5xl">{who}</h1>
      <p className="max-w-sm text-muted">Gib das Gerät weiter. Die andere Wahl bleibt zu.</p>
      <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "ready" })}>
        Ich bin bereit
      </button>
    </main>
  );
}

function Fight({
  duel,
  beat,
  dispatch,
  onCodex,
}: {
  duel: Duel;
  beat: BasisBeat | null;
  dispatch: (act: Act) => void;
  onCodex: () => void;
}) {
  const game = (duel.screen === "scene" && duel.pending ? duel.pending : duel.game)!;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-4 py-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="display text-xl">ECHO//BRUCH</p>
          <p className="text-xs text-muted">{beat ? beat.kicker : `Runde ${game.round} · Planen`}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={onCodex}>
            Regeln
          </button>
          <button type="button" className="btn" onClick={() => dispatch({ type: "title" })}>
            Menü
          </button>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <LiveCard fighter={game.fighters.A} tag="Spieler A" />
        <LiveCard fighter={game.fighters.B} tag={duel.mode === "bot" ? "Bot" : "Spieler B"} />
      </div>
      {duel.screen === "plan" && <Planner duel={duel} dispatch={dispatch} />}
      {beat && (
        <section className="panel p-4">
          <p className="text-sm text-muted">{beat.kicker}</p>
          <h2 className="display mt-1 text-3xl">{beat.title}</h2>
          <p className="mt-2 text-sm text-muted">{beat.detail}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "step" })}>
              Weiter
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Planner({ duel, dispatch }: { duel: Duel; dispatch: (act: Act) => void }) {
  const game = duel.game!;
  const mine = game.fighters[duel.focus];
  const hero = basisHero(mine.heroId);
  const draft = clampDraft(mine, duel.draft);
  const value = basisActionValue(hero, draft);
  const actions: { id: BasisAction; name: string; text: string; icon: typeof Swords }[] = [
    { id: "kampf", name: "Kampf", text: "Unbewaffneter Schlag. Kraftbonus, plus eingesetzte Energie.", icon: Swords },
    { id: "block", name: "Block", text: "Der erste Treffer ist um 3 niedriger, mit 1 Energie um 4.", icon: Shield },
    { id: "ausweichen", name: "Ausweichen", text: "Kein Schlag. Ein Treffer kostet 2 Energie und nimmt 2 Schaden.", icon: Footprints },
  ];
  const energyCap = draft.action === "kampf" ? 3 : draft.action === "block" ? 1 : 0;

  return (
    <section className="panel flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted">
          {duel.focus === "A" ? "Spieler A" : "Spieler B"} · {hero.name}
        </p>
        <p className="text-sm tabular-nums text-muted">Aktionswert {value}</p>
      </div>
      <p className="text-sm text-muted">{duel.banner}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const on = draft.action === action.id;
          return (
            <button
              key={action.id}
              type="button"
              className={`panel p-3 text-left ${on ? "border-fg" : ""}`}
              onClick={() => dispatch({ type: "draft", choice: { action: action.id, energy: action.id === "ausweichen" ? 0 : draft.energy } })}
            >
              <span className="flex items-center gap-2 font-medium">
                <Icon size={16} />
                {action.name}
              </span>
              <span className="mt-1 block text-sm text-muted">{action.text}</span>
            </button>
          );
        })}
      </div>
      {energyCap > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Energie</span>
          {Array.from({ length: energyCap + 1 }, (_, energy) => (
            <button
              key={energy}
              type="button"
              className={`btn ${draft.energy === energy ? "btn-primary" : ""}`}
              disabled={energy > mine.energy}
              onClick={() => dispatch({ type: "draft", choice: { action: draft.action, energy } })}
            >
              {energy}
            </button>
          ))}
          <span className="text-xs text-faint">{energyHint(draft)}</span>
        </div>
      )}
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "lock" })}>
          Verdeckt festlegen
        </button>
      </div>
    </section>
  );
}

function energyHint(choice: BasisChoice): string {
  if (choice.action === "block") return choice.energy >= 1 ? "Block mildert um 4." : "Block mildert um 3.";
  if (choice.energy >= 3) return "+2 Rohschaden, +1 Bruch.";
  if (choice.energy >= 2) return "+1 Rohschaden, +1 Bruch.";
  if (choice.energy >= 1) return "+1 Rohschaden.";
  return "Keine zusätzliche Wucht.";
}

function Ending({ duel, dispatch }: { duel: Duel; dispatch: (act: Act) => void }) {
  const game = duel.game!;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 px-4">
      <p className="text-sm text-muted">Runde {game.round} · Basis</p>
      <h1 className="display text-5xl">{winTitle(game)}</h1>
      <p className="text-muted">{winDetail(game)}</p>
      <ul className="flex max-h-80 flex-col gap-2 overflow-auto text-sm text-muted">
        {[...game.log].reverse().map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "rematch" })}>
          Nochmal
        </button>
        <button type="button" className="btn" onClick={() => downloadText(`echo-bruch-basis-${game.seed}.txt`, [...game.log].reverse().join("\n"))}>
          Protokoll speichern
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: "title" })}>
          Andere Karten
        </button>
      </div>
    </main>
  );
}

function Spielkarte({ heroId, selected, onPick }: { heroId: string; selected: boolean; onPick: () => void }) {
  const hero = basisHero(heroId);
  const pools = basisPools(hero);
  return (
    <button type="button" onClick={onPick} className={`panel flex flex-col gap-3 p-4 text-left ${selected ? "border-fg" : ""}`}>
      <Sigil id={hero.id} />
      <span>
        <span className="display block text-2xl">{hero.name}</span>
        <span className="text-sm text-muted">{hero.line}</span>
      </span>
      <Stat label="Kraft" value={hero.kraft} />
      <Stat label="Schutz" value={hero.schutz} />
      <Stat label="Bewegung" value={hero.bewegung} />
      <Stat label="Kontrolle" value={hero.kontrolle} hint="ruht" />
      <Stat label="Tempo" value={hero.tempo} />
      <span className="text-sm tabular-nums text-muted">
        Körper {pools.body} · Energie {pools.energy} · Bruch {pools.bruch}
      </span>
    </button>
  );
}

function LiveCard({ fighter, tag }: { fighter: BasisFighter; tag: string }) {
  const hero = basisHero(fighter.heroId);
  const open = fighter.bruch >= Math.ceil(fighter.bruchMax / 2);
  return (
    <section className="panel flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sigil id={hero.id} />
          <div>
            <h2 className="display text-2xl">{hero.name}</h2>
            <p className="text-sm text-muted">{hero.line}</p>
          </div>
        </div>
        <p className="text-xs text-muted">{tag}</p>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        <Mini label="Kraft" value={hero.kraft} />
        <Mini label="Schutz" value={hero.schutz} />
        <Mini label="Bewegung" value={hero.bewegung} />
        <Mini label="Kontrolle" value={hero.kontrolle} />
        <Mini label="Tempo" value={hero.tempo} />
      </div>
      <Meter label="Körper" value={fighter.body} max={fighter.bodyMax} tone="body" />
      <Meter label="Bruch" value={fighter.bruch} max={fighter.bruchMax} tone="bruch" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">Energie</span>
        <span className="flex gap-1">
          {Array.from({ length: fighter.energyMax }, (_, i) => (
            <span key={i} className={`pip ${i < fighter.energy ? "on-guard" : ""}`} />
          ))}
        </span>
      </div>
      <p className="min-h-5 text-xs text-muted">{fighter.collapse ? "Letzte Runde" : open ? "Offen" : "Stabil"}</p>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <span className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">
        {label}
        {hint ? <span className="text-faint"> · {hint}</span> : null}
      </span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="block text-[10px] uppercase tracking-wide text-faint">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: "body" | "bruch" }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-raised">
        <div className={`h-full rounded-full ${tone === "bruch" ? "bg-accent" : "bg-fg"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Sigil({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 shrink-0 text-soft" aria-hidden="true">
      {id === "brecher" && <path d="M8 36 L24 8 L40 36 Z" fill="none" stroke="currentColor" strokeWidth="1.6" />}
      {id === "laeuferin" && <path d="M8 32 C16 8 32 8 40 32" fill="none" stroke="currentColor" strokeWidth="1.6" />}
      {id === "archivar" && <rect x="10" y="10" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" />}
      {id === "waechter" && <path d="M8 16 H40 V28 C40 36 32 40 24 40 C16 40 8 36 8 28 Z" fill="none" stroke="currentColor" strokeWidth="1.6" />}
      {id === "jaeger" && <circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" strokeWidth="1.6" />}
    </svg>
  );
}

function Codex({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-bg/80 p-3 sm:items-center" role="dialog" aria-label="Basisregeln">
      <div className="panel max-h-[80dvh] w-full max-w-lg overflow-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="display text-3xl">Basis</h2>
          <button type="button" className="btn" onClick={onClose}>
            Schließen
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
          <p>Es gelten die Kartenwerte aus dem Regelwerk, nicht der spätere Ausgleich. Fähigkeiten, Waffen, Rüstung, Werkzeug, Artefakte, Items und Echos sind zurückgestellt.</p>
          <p>Körper ist 12 plus Schutz. Energie ist 4 plus Bewegung geteilt durch 3, mindestens 3 und höchstens 8. Bruch ist 4 plus Schutz geteilt durch 2. Beginn mit 2 Energie, jede Runde plus 2.</p>
          <p>Kampf trifft, wenn Würfel plus Kraftbonus plus Energie mindestens 2 plus Schutzbonus plus Bewegungsbonus erreicht. Ohne Waffe ist der Rohschaden nur der Kraftbonus, plus 1 bei 1 oder 2 Energie und plus 2 bei 3. Ab 2 Energie gibt es 1 Bruch. Eine 6 verdoppelt den Endschaden.</p>
          <p>Block senkt den ersten Treffer um 3, mit 1 Energie um 4, und nimmt dem Treffer 1 Bruch. Ausweichen ist kein Schlag: liegt der Treffer, kostet er 2 Energie und 2 Schaden. Ohne Feld gibt es kein Entkommen aus der Reichweite.</p>
          <p>Höherer Aktionswert handelt zuerst: Tempo, minus 1 bei Block, plus 2 bei Ausweichen, plus eingesetzte Energie. Körper auf 0 endet sofort. Bruchmaximum endet nach dieser Runde. Nach 16 Runden zählt der Körper.</p>
        </div>
      </div>
    </div>
  );
}
