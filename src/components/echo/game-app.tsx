import { useEffect, useReducer, useState } from "react";
import {
  BookOpen,
  Footprints,
  Orbit,
  Pause,
  Play,
  Shield,
  SkipForward,
  Swords,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  ACTIONS,
  ARMORS,
  CHARACTERS,
  ECHO_LABEL,
  GEAR,
  ITEMS,
  REACTIONS,
  STARTS,
  WEAPONS,
  type ActionKind,
  type Difficulty,
  type Side,
} from "@/game/content";
import { choosePlan } from "@/game/ai";
import {
  actionValue,
  botSetup,
  createGame,
  derivedMax,
  distance,
  emptyPlan,
  isOpen,
  liveStats,
  moveSteps,
  other,
  reachable,
  suggestedSetup,
  type Fighter,
  type GameState,
  type Plan,
  type Setup,
} from "@/game/model";
import { beginRound, preparePlan, resolveRound, useStone, type Frame } from "@/game/resolve";
import { Board } from "./board";
import { backdrop, KampfKarte, lookOf, plateSrc } from "./kampf-seite";

type Screen = "title" | "roster" | "kit" | "deploy" | "cover" | "plan" | "scene" | "end" | "ledger";

interface Duel {
  screen: Screen;
  mode: "bot" | "hotseat";
  difficulty: Difficulty;
  focus: Side;
  afterCover: Screen;
  setup: Record<Side, Setup>;
  game: GameState | null;
  draft: Plan;
  locked: Partial<Record<Side, Plan>>;
  frames: Frame[];
  frame: number;
  auto: boolean;
  muted: boolean;
  codex: boolean;
  banner: string;
  wins: number;
  losses: number;
}

type Act =
  | { type: "difficulty"; value: Difficulty }
  | { type: "boot"; mode: "bot" | "hotseat" }
  | { type: "quick" }
  | { type: "character"; id: string }
  | { type: "kit" }
  | { type: "slot"; slot: "weaponId" | "armorId" | "toolId" | "artifactId"; id: string }
  | { type: "item"; id: string }
  | { type: "field"; id: number }
  | { type: "advance" }
  | { type: "back" }
  | { type: "ready" }
  | { type: "draft"; plan: Plan }
  | { type: "stone" }
  | { type: "lock" }
  | { type: "step" }
  | { type: "skip" }
  | { type: "auto" }
  | { type: "mute" }
  | { type: "codex" }
  | { type: "rematch" }
  | { type: "title" }
  | { type: "ledger" }
  | { type: "prefs"; auto: boolean; muted: boolean; wins: number; losses: number; difficulty: Difficulty };

const SAVE_KEY = "echo-bruch";
const LOG_KEY = "echo-bruch-logs";

interface SavedLog {
  id: string;
  title: string;
  lines: string[];
}

function readLogs(): SavedLog[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as SavedLog[];
    return Array.isArray(data) ? data.filter((entry) => Array.isArray(entry.lines)) : [];
  } catch {
    return [];
  }
}

function storeLog(game: GameState) {
  const names = {
    A: CHARACTERS.find((c) => c.id === game.fighters.A.characterId)?.name ?? "A",
    B: CHARACTERS.find((c) => c.id === game.fighters.B.characterId)?.name ?? "B",
  };
  const winner = game.winner ? names[game.winner] : "Unentschieden";
  const entry: SavedLog = {
    id: `${game.seed}-${game.round}-${game.log.length}`,
    title: `${names.A} gegen ${names.B} · ${winner} · Runde ${game.round} · ${game.winReason ?? "offen"}`,
    lines: [...game.log].reverse(),
  };
  const prev = readLogs().filter((item) => item.id !== entry.id);
  localStorage.setItem(LOG_KEY, JSON.stringify([entry, ...prev].slice(0, 16)));
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

function initial(): Duel {
  return {
    screen: "title",
    mode: "bot",
    difficulty: "taktisch",
    focus: "A",
    afterCover: "plan",
    setup: { A: suggestedSetup("jaeger", "A"), B: suggestedSetup("waechter", "B") },
    game: null,
    draft: emptyPlan(),
    locked: {},
    frames: [],
    frame: 0,
    auto: true,
    muted: false,
    codex: false,
    banner: "",
    wins: 0,
    losses: 0,
  };
}

function openBattle(state: Duel, setup: Record<Side, Setup>): Duel {
  const begun = beginRound(createGame(setup.A, setup.B));
  return {
    ...state,
    setup,
    game: begun.state,
    banner: begun.line,
    screen: state.mode === "hotseat" ? "cover" : "plan",
    afterCover: "plan",
    focus: "A",
    draft: emptyPlan(),
    locked: {},
    frames: [],
    frame: 0,
    codex: false,
  };
}

function finishScenes(state: Duel): Duel {
  const game = state.frames[state.frames.length - 1]?.state ?? state.game;
  if (!game) return state;
  if (game.over) {
    const bot = state.mode === "bot";
    return {
      ...state,
      game,
      screen: "end",
      frames: [],
      wins: bot && game.winner === "A" ? state.wins + 1 : state.wins,
      losses: bot && game.winner === "B" ? state.losses + 1 : state.losses,
    };
  }
  const begun = beginRound(game);
  return {
    ...state,
    game: begun.state,
    banner: begun.line,
    screen: state.mode === "hotseat" ? "cover" : "plan",
    afterCover: "plan",
    focus: "A",
    draft: emptyPlan(),
    locked: {},
    frames: [],
    frame: 0,
  };
}

function reduce(state: Duel, act: Act): Duel {
  switch (act.type) {
    case "prefs":
      return {
        ...state,
        auto: act.auto,
        muted: act.muted,
        wins: act.wins,
        losses: act.losses,
        difficulty: act.difficulty,
      };
    case "difficulty":
      return { ...state, difficulty: act.value };
    case "boot":
      return { ...state, mode: act.mode, focus: "A", screen: "roster" };
    case "quick": {
      const a = suggestedSetup("jaeger", "A");
      const b = botSetup(a, state.difficulty);
      b.field = 5;
      return openBattle({ ...state, mode: "bot" }, { A: a, B: b });
    }
    case "character": {
      const next = suggestedSetup(act.id, state.focus);
      next.field = state.setup[state.focus].field;
      return { ...state, setup: { ...state.setup, [state.focus]: next } };
    }
    case "kit":
      return { ...state, screen: "kit" };
    case "slot":
      return {
        ...state,
        setup: {
          ...state.setup,
          [state.focus]: { ...state.setup[state.focus], [act.slot]: act.id },
        },
      };
    case "item": {
      const current = state.setup[state.focus];
      if (current.items.includes(act.id)) return state;
      return {
        ...state,
        setup: {
          ...state.setup,
          [state.focus]: { ...current, items: [current.items[1], act.id] as [string, string] },
        },
      };
    }
    case "field":
      if (!STARTS[state.focus].includes(act.id)) return state;
      return {
        ...state,
        setup: { ...state.setup, [state.focus]: { ...state.setup[state.focus], field: act.id } },
      };
    case "advance": {
      if (state.screen === "roster") return { ...state, screen: "kit" };
      if (state.screen === "kit") {
        if (state.mode === "hotseat" && state.focus === "A") {
          return { ...state, screen: "cover", afterCover: "roster", focus: "B" };
        }
        return { ...state, screen: "deploy", focus: "A" };
      }
      if (state.screen === "deploy") {
        if (state.mode === "hotseat" && state.focus === "A") {
          return { ...state, screen: "cover", afterCover: "deploy", focus: "B" };
        }
        const setup = {
          A: state.setup.A,
          B: { ...state.setup.B },
        };
        if (state.mode === "bot") {
          const bot = botSetup(setup.A, state.difficulty);
          bot.field = setup.A.field === 4 ? 3 : 5;
          setup.B = bot;
        }
        return openBattle(state, setup);
      }
      return state;
    }
    case "back":
      if (state.screen === "roster") return { ...state, screen: "title", focus: "A" };
      if (state.screen === "kit") return { ...state, screen: "roster" };
      if (state.screen === "deploy") return { ...state, screen: "kit", focus: state.mode === "bot" ? "A" : state.focus };
      return state;
    case "ready":
      return { ...state, screen: state.afterCover, draft: emptyPlan() };
    case "draft":
      return { ...state, draft: act.plan };
    case "stone":
      if (!state.game) return state;
      return { ...state, game: useStone(state.game, state.focus) };
    case "lock": {
      if (!state.game || state.game.over) return state;
      const plan = preparePlan(state.game, state.focus, state.draft);
      if (state.mode === "bot") {
        const bot = choosePlan(state.game, "B", state.difficulty);
        return {
          ...state,
          frames: resolveRound(state.game, plan, bot),
          frame: 0,
          screen: "scene",
          locked: { A: plan, B: bot },
        };
      }
      const locked = { ...state.locked, [state.focus]: plan };
      if (state.focus === "A") {
        return { ...state, locked, screen: "cover", afterCover: "plan", focus: "B", draft: emptyPlan() };
      }
      return {
        ...state,
        locked,
        frames: resolveRound(state.game, locked.A ?? plan, plan),
        frame: 0,
        screen: "scene",
      };
    }
    case "step":
      if (state.frame < state.frames.length - 1) return { ...state, frame: state.frame + 1 };
      return finishScenes(state);
    case "skip":
      return finishScenes({ ...state, frame: Math.max(0, state.frames.length - 1) });
    case "auto":
      return { ...state, auto: !state.auto };
    case "mute":
      return { ...state, muted: !state.muted };
    case "codex":
      return { ...state, codex: !state.codex };
    case "rematch":
      return openBattle(state, state.setup);
    case "title":
      return { ...initial(), wins: state.wins, losses: state.losses, muted: state.muted, auto: state.auto, difficulty: state.difficulty };
    case "ledger":
      return { ...state, screen: "ledger", codex: false };
    default:
      return state;
  }
}

let audioCtx: AudioContext | null = null;

function cue(kind: Frame["tone"], muted: boolean) {
  if (muted || typeof window === "undefined") return;
  const Ctx = window.AudioContext;
  if (!Ctx) return;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const freq =
    kind === "hit" ? 128 : kind === "win" ? 196 : kind === "guard" ? 240 : kind === "move" ? 180 : kind === "echo" ? 300 : 96;
  osc.type = kind === "hit" || kind === "win" ? "triangle" : "sine";
  osc.frequency.value = freq;
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.start(now);
  osc.stop(now + 0.2);
}

const ACTION_ICON = {
  attack: Swords,
  guard: Shield,
  move: Footprints,
  influence: Orbit,
} as const;

export function GameApp({ onBasis }: { onBasis?: () => void }) {
  const [duel, dispatch] = useReducer(reduce, undefined, initial);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      if (reduced) {
        dispatch({ type: "prefs", auto: false, muted: false, wins: 0, losses: 0, difficulty: "taktisch" });
      }
      return;
    }
    try {
      const data = JSON.parse(raw) as Partial<Duel>;
      dispatch({
        type: "prefs",
        auto: typeof data.auto === "boolean" ? data.auto : !reduced,
        muted: Boolean(data.muted),
        wins: Number(data.wins) || 0,
        losses: Number(data.losses) || 0,
        difficulty: data.difficulty === "bedacht" || data.difficulty === "brutal" ? data.difficulty : "taktisch",
      });
    } catch {
      /* ignore broken save */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        auto: duel.auto,
        muted: duel.muted,
        wins: duel.wins,
        losses: duel.losses,
        difficulty: duel.difficulty,
      }),
    );
  }, [duel.auto, duel.muted, duel.wins, duel.losses, duel.difficulty]);

  useEffect(() => {
    if (duel.screen === "end" && duel.game?.over) storeLog(duel.game);
  }, [duel.screen, duel.game]);

  useEffect(() => {
    if (duel.screen !== "scene" || !duel.auto) return;
    const timer = window.setTimeout(() => dispatch({ type: "step" }), 3200);
    return () => window.clearTimeout(timer);
  }, [duel.screen, duel.frame, duel.auto, duel.frames.length]);

  useEffect(() => {
    if (duel.screen !== "scene") return;
    const beat = duel.frames[duel.frame];
    if (beat) cue(beat.tone, duel.muted);
  }, [duel.screen, duel.frame, duel.frames, duel.muted]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " && duel.screen === "scene") {
        event.preventDefault();
        dispatch({ type: "step" });
      }
      if (event.key === "Enter" && duel.screen === "plan") dispatch({ type: "lock" });
      if (duel.screen === "plan" && duel.game && event.key >= "1" && event.key <= "4") {
        const action = ACTIONS[Number(event.key) - 1].id;
        dispatch({ type: "draft", plan: withAction(duel.draft, action, duel.game, duel.focus) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duel.screen, duel.draft, duel.game, duel.focus]);

  const beat = duel.screen === "scene" ? duel.frames[duel.frame] : null;
  const view = shownState(duel, beat);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      {duel.screen === "title" && <Title duel={duel} dispatch={dispatch} onBasis={onBasis} />}
      {duel.screen === "roster" && <Roster duel={duel} dispatch={dispatch} />}
      {duel.screen === "kit" && <Kit duel={duel} dispatch={dispatch} />}
      {duel.screen === "cover" && <Cover duel={duel} dispatch={dispatch} />}
      {duel.screen === "end" && duel.game && <Ending duel={duel} dispatch={dispatch} />}
      {duel.screen === "ledger" && <Ledger onBack={() => dispatch({ type: "title" })} />}
      {(duel.screen === "deploy" || duel.screen === "plan" || duel.screen === "scene") && view && (
        <Battle duel={duel} view={view} beat={beat} dispatch={dispatch} />
      )}
      {duel.codex && <Codex onClose={() => dispatch({ type: "codex" })} />}
    </div>
  );
}

function Title({ duel, dispatch, onBasis }: { duel: Duel; dispatch: (act: Act) => void; onBasis?: () => void }) {
  const levels: { id: Difficulty; name: string; text: string }[] = [
    { id: "bedacht", name: "Bedacht", text: "Hält Abstand, liest Muster, spielt den Wächter." },
    { id: "taktisch", name: "Taktisch", text: "Kontert dein Set und mischt Einfluss mit Druck." },
    { id: "brutal", name: "Rücksichtslos", text: "Der Brecher. Volle Energie, kein Schritt zurück." },
  ];
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-8 px-4 py-8">
      <header className="max-w-xl">
        <p className="text-sm text-muted">Endversion 1.0</p>
        <h1 className="display mt-2 text-5xl sm:text-6xl">ECHO//BRUCH</h1>
        <p className="mt-4 max-w-md text-muted">
          Plane verdeckt. Lies deinen Gegner. Hinterlasse eine Spur. Sieben Felder, vier Aktionen, drei Wege zum Sieg.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            className={`panel p-4 text-left ${duel.difficulty === level.id ? "border-fg" : ""}`}
            onClick={() => dispatch({ type: "difficulty", value: level.id })}
          >
            <span className="display text-2xl">{level.name}</span>
            <span className="mt-2 block text-sm text-muted">{level.text}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => { cue("idle", duel.muted); dispatch({ type: "boot", mode: "bot" }); }}>
          Gegen den Bot
        </button>
        <button type="button" className="btn" onClick={() => { cue("idle", duel.muted); dispatch({ type: "boot", mode: "hotseat" }); }}>
          Zu zweit am Gerät
        </button>
        <button type="button" className="btn" onClick={() => { cue("idle", duel.muted); dispatch({ type: "quick" }); }}>
          Sofort kämpfen
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: "ledger" })}>
          Protokolle
        </button>
        {onBasis && (
          <button type="button" className="btn" onClick={onBasis}>
            Zum neuen Kampf
          </button>
        )}
      </div>
      <p className="text-sm text-faint tabular-nums">
        Gegen den Bot: {duel.wins} Siege · {duel.losses} Niederlagen
      </p>
    </main>
  );
}

function Roster({ duel, dispatch }: { duel: Duel; dispatch: (act: Act) => void }) {
  const current = duel.setup[duel.focus].characterId;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <ScreenHead
        kicker={duel.focus === "A" ? "Spieler A" : "Spieler B"}
        title="Wer tritt an"
        action="Weiter zur Ausrüstung"
        onBack={() => dispatch({ type: "back" })}
        onNext={() => dispatch({ type: "advance" })}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CHARACTERS.map((c) => {
          const on = c.id === current;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => dispatch({ type: "character", id: c.id })}
              className={`panel flex flex-col gap-3 p-4 text-left ${on ? "border-fg" : ""}`}
            >
              <Sigil id={c.id} />
              <span>
                <span className="display block text-2xl">{c.name}</span>
                <span className="text-sm text-muted">{c.line}</span>
              </span>
              <StatLine label="Kraft" value={c.kraft} />
              <StatLine label="Schutz" value={c.schutz} />
              <StatLine label="Bewegung" value={c.bewegung} />
              <StatLine label="Kontrolle" value={c.kontrolle} />
              <StatLine label="Tempo" value={c.tempo} />
              <span className="text-sm text-muted">{c.passive}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function Kit({ duel, dispatch }: { duel: Duel; dispatch: (act: Act) => void }) {
  const setup = duel.setup[duel.focus];
  const max = derivedMax(setup);
  const c = CHARACTERS.find((item) => item.id === setup.characterId)!;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <ScreenHead
        kicker={c.name}
        title="Ausrüstung legen"
        action={duel.mode === "hotseat" && duel.focus === "A" ? "Weiter zu Spieler B" : "Aufstellung"}
        onBack={() => dispatch({ type: "back" })}
        onNext={() => dispatch({ type: "advance" })}
      />
      <section className="panel flex flex-wrap items-end justify-between gap-4 p-4">
        <div>
          <p className="display text-3xl">{c.name}</p>
          <p className="text-sm text-muted">{c.ability} · {c.abilityCost} Energie</p>
        </div>
        <p className="text-sm tabular-nums text-muted">
          Körper {max.body} · Energie max {max.energy} · Bruch {max.bruch}
        </p>
      </section>
      <GearRow title="Waffe" selected={setup.weaponId} options={WEAPONS.map((w) => ({ id: w.id, name: w.name, text: `Wert ${w.value} · Reichweite ${w.range} · ${w.text}` }))} onPick={(id) => dispatch({ type: "slot", slot: "weaponId", id })} />
      <GearRow title="Rüstung" selected={setup.armorId} options={ARMORS.map((w) => ({ id: w.id, name: w.name, text: `Wert ${w.value} · Körper +${w.body} · ${w.text}` }))} onPick={(id) => dispatch({ type: "slot", slot: "armorId", id })} />
      <GearRow title="Werkzeug" selected={setup.toolId} options={GEAR.filter((g) => g.slot === "tool").map((w) => ({ id: w.id, name: w.name, text: w.text }))} onPick={(id) => dispatch({ type: "slot", slot: "toolId", id })} />
      <GearRow title="Artefakt" selected={setup.artifactId} options={GEAR.filter((g) => g.slot === "artifact").map((w) => ({ id: w.id, name: w.name, text: w.text }))} onPick={(id) => dispatch({ type: "slot", slot: "artifactId", id })} />
      <GearRow title="Verbrauch · zwei" selected={setup.items[0]} also={setup.items[1]} options={ITEMS.map((w) => ({ id: w.id, name: w.name, text: w.text }))} onPick={(id) => dispatch({ type: "item", id })} />
    </main>
  );
}

function Cover({ duel, dispatch }: { duel: Duel; dispatch: (act: Act) => void }) {
  const who = duel.focus === "A" ? "Spieler A" : "Spieler B";
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm text-muted">Verdecktes Planen</p>
      <h1 className="display text-5xl">{who}</h1>
      <p className="max-w-sm text-muted">Gib das Gerät weiter. Der andere Plan bleibt zu.</p>
      <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "ready" })}>
        Ich bin bereit
      </button>
    </main>
  );
}

function Ending({ duel, dispatch }: { duel: Duel; dispatch: (act: Act) => void }) {
  const game = duel.game!;
  const winner = game.winner ? CHARACTERS.find((c) => c.id === game.fighters[game.winner!].characterId)?.name : null;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 px-4">
      <p className="text-sm text-muted">Runde {game.round}</p>
      <h1 className="display text-5xl">{winner ? `${winner} siegt` : "Beide brechen"}</h1>
      <p className="text-muted">
        {game.winReason === "Körper" && "Der Körper des Gegners ist auf 0."}
        {game.winReason === "Echo" && "Alle drei Kern-Echos sind zerstört."}
        {game.winReason === "Bruch" && "Das Bruchmaximum hat die letzte Runde beendet."}
        {game.winReason === "Zeit" && "Die Zeit ist um."}
      </p>
      <ul className="flex max-h-80 flex-col gap-2 overflow-auto text-sm text-muted">
        {[...game.log].reverse().map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "rematch" })}>
          Nochmal
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => downloadText(`echo-bruch-${game.seed}.txt`, [...game.log].reverse().join("\n"))}
        >
          Protokoll speichern
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: "ledger" })}>
          Alle Protokolle
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: "title" })}>
          Neues Duell
        </button>
      </div>
    </main>
  );
}

function Ledger({ onBack }: { onBack: () => void }) {
  const [logs, setLogs] = useState<SavedLog[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [bilanz, setBilanz] = useState("");

  useEffect(() => {
    setLogs(readLogs());
    fetch("/bilanz.txt")
      .then((response) => (response.ok ? response.text() : ""))
      .then(setBilanz)
      .catch(() => setBilanz(""));
  }, []);

  const current = logs.find((entry) => entry.id === open) ?? null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Vollständig, nichts gekürzt</p>
          <h1 className="display text-4xl">Protokolle</h1>
        </div>
        <button type="button" className="btn" onClick={onBack}>
          Zurück
        </button>
      </header>
      <div className="flex flex-wrap gap-3">
        <a className="btn" role="button" href="/protokoll.txt" download="echo-bruch-protokoll.txt">
          Simulationsprotokoll
        </a>
        <a className="btn" role="button" href="/bilanz.txt" download="echo-bruch-bilanz.txt">
          Bilanz
        </a>
      </div>
      {bilanz && (
        <pre className="panel max-h-80 overflow-auto whitespace-pre-wrap p-4 text-xs leading-relaxed text-muted">{bilanz}</pre>
      )}
      {logs.length === 0 ? (
        <p className="text-sm text-muted">Gespeicherte Duelle erscheinen hier, sobald eines endet. Bis zu sechzehn bleiben auf diesem Gerät.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {logs.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="panel w-full px-4 py-3 text-left text-sm" onClick={() => setOpen(entry.id === open ? null : entry.id)}>
                {entry.title}
                <span className="mt-1 block text-xs text-faint">{entry.lines.length} Zeilen</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {current && (
        <section className="panel flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="display text-2xl">{current.title}</h2>
            <button type="button" className="btn" onClick={() => downloadText(`echo-bruch-${current.id}.txt`, current.lines.join("\n"))}>
              Diese Datei
            </button>
          </div>
          <ol className="flex max-h-[28rem] flex-col gap-1 overflow-auto text-sm text-muted">
            {current.lines.map((line, index) => (
              <li key={`${current.id}-${index}`}>{line}</li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}

function Battle({
  duel,
  view,
  beat,
  dispatch,
}: {
  duel: Duel;
  view: GameState;
  beat: Frame | null;
  dispatch: (act: Act) => void;
}) {
  const legal = legalFields(duel, view);
  const selected = duel.screen === "deploy" ? duel.setup[duel.focus].field : duel.draft.targetField;
  const lookA = lookOf(view, "A", beat);
  const lookB = lookOf(view, "B", beat);
  const otherSide = beat?.actor === "A" ? "B" : "A";
  const otherLook = otherSide === "A" ? lookA : lookB;
  const stageSide = otherLook !== "waffe" ? otherSide : (beat?.actor ?? otherSide);
  const stageFighter = view.fighters[stageSide];
  const stageLook = stageSide === "A" ? lookA : lookB;
  const stageSrc = plateSrc(stageFighter.characterId, stageFighter.weaponId, beat?.tone === "hit" && stageLook === "waffe" ? "waffe" : stageLook);
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#0c0e12] text-white">
      <img src={backdrop(beat)} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="display text-xl">ECHO//BRUCH</p>
            <p className="text-xs text-white/60">{duel.screen === "deploy" ? "Aufstellung" : beat ? beat.kicker : `Runde ${view.round} · Planen`}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn" aria-label={duel.muted ? "Ton an" : "Ton aus"} onClick={() => dispatch({ type: "mute" })}>
              {duel.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button type="button" className="btn" aria-label="Regeln" onClick={() => dispatch({ type: "codex" })}>
              <BookOpen size={18} />
            </button>
            <button type="button" className="btn" onClick={() => dispatch({ type: "title" })}>
              Menü
            </button>
          </div>
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto px-3 pb-3 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(240px,300px)] lg:overflow-hidden">
          <KampfKarte className="order-2 lg:order-1" f={view.fighters.A} tag={duel.mode === "hotseat" ? "Spieler A" : "Du"} look={lookA} featured={duel.focus === "A" && duel.screen !== "scene"} />
          <div className="order-1 flex min-h-0 flex-col gap-3 lg:order-2">
            <div className={`relative min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-white/10 ${beat?.tone === "hit" ? "shake" : ""}`}>
              {duel.screen === "scene" ? (
                <img key={stageSrc} src={stageSrc} alt="" className="plate-in h-full w-full object-cover" />
              ) : (
                <Board
                  state={view}
                  legal={legal}
                  selected={selected}
                  focus={beat?.focus ?? []}
                  shake={false}
                  captions={fieldCaptions(duel, view)}
                  onPick={(field) => {
                    if (duel.screen === "deploy") dispatch({ type: "field", id: field });
                    else if (legal.includes(field)) dispatch({ type: "draft", plan: { ...duel.draft, targetField: field } });
                  }}
                />
              )}
            </div>
            {duel.screen !== "scene" && <FieldNote duel={duel} view={view} />}
            {beat && <Scene beat={beat} duel={duel} dispatch={dispatch} />}
          </div>
          <KampfKarte className="order-3" f={view.fighters.B} tag={duel.mode === "bot" ? "Gegenüber" : "Spieler B"} look={lookB} featured={duel.focus === "B" && duel.screen !== "scene"} />
        </div>
      </div>
      {duel.screen === "deploy" && (
        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-white/70">
            {duel.focus === "A" ? "Startfelder 2 oder 4." : "Startfelder 3 oder 5."} Im Kampf wählst du bei Bewegung ein helles Feld. Der Abstand entscheidet, ob die Waffen reichen.
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={() => dispatch({ type: "back" })}>
              Zurück
            </button>
            <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: "advance" })}>
              Duell beginnen
            </button>
          </div>
        </footer>
      )}
      {duel.screen === "plan" && <div className="relative z-10"><Planner duel={duel} view={view} dispatch={dispatch} /></div>}
    </div>
  );
}

function Planner({ duel, view, dispatch }: { duel: Duel; view: GameState; dispatch: (act: Act) => void }) {
  const f = view.fighters[duel.focus];
  const c = CHARACTERS.find((item) => item.id === f.characterId)!;
  const draft = duel.draft;
  const ready = preparePlan(view, duel.focus, draft);
  const abilityUsed = f.abilityRound === view.round;
  const canAbility = f.energy >= c.abilityCost && !abilityUsed;
  const predict = (Object.entries(f.pattern) as [ActionKind, number][]).filter(([, n]) => n >= 3).map(([k]) => k);
  return (
    <footer className="relative z-10 max-h-[48vh] overflow-auto border-t border-white/10 bg-black/80 px-3 py-3">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/50">Das bewirkt diese Wahl</p>
          <p className="mt-1 text-sm text-white">{planHint(c, draft, ready, f, view)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACTIONS.map((action) => {
            const Icon = ACTION_ICON[action.id];
            const on = draft.action === action.id && !draft.ability;
            return (
              <button
                key={action.id}
                type="button"
                className={`btn h-auto flex-col gap-1 py-3 ${on ? "btn-on" : ""}`}
                onClick={() => dispatch({ type: "draft", plan: withAction(draft, action.id, view, duel.focus) })}
              >
                <Icon size={18} />
                <span>{action.name}</span>
                <span className="text-xs text-faint">{action.text}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Energie · {energyLine(draft.action, draft.energy)}</span>
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              disabled={draft.ability || n > f.energy}
              className={`btn min-w-11 ${draft.energy === n ? "btn-on" : ""}`}
              onClick={() => {
                const next = { ...draft, energy: n, ability: false };
                if (draft.action === "move") {
                  const fields = reachable(f.field, moveSteps(f, n, false), view.fighters[other(f.side)].field);
                  if (!fields.includes(next.targetField ?? -1)) {
                    next.targetField = fields.sort((a, b) => distance(a, view.fighters[other(f.side)].field) - distance(b, view.fighters[other(f.side)].field))[0] ?? f.field;
                  }
                }
                dispatch({ type: "draft", plan: next });
              }}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={!canAbility}
            className={`btn ${draft.ability ? "btn-on" : ""}`}
            onClick={() =>
              dispatch({
                type: "draft",
                plan: {
                  ...draft,
                  ability: !draft.ability,
                  action: c.abilityAction,
                  energy: c.abilityCost,
                },
              })
            }
          >
            {c.ability} · {c.abilityCost}
          </button>
        </div>
        {draft.action === "influence" && !draft.ability && (
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["spur", "Spur", "Echo auf dein Feld. Der Archivar verteidigt damit besser."],
                ["kern", "Kern", "Zerstört gegnerische Kernpunkte. Drei Kerne sind der Sieg."],
                ["weaken", "Schwächen", "Nimmt einem gegnerischen Echo Ladungen."],
                ["convert", "Wandeln", "Angriff wird Falle, Schutz Barriere, Bewegung Nebel."],
              ] as const
            ).map(([id, label, text]) => (
              <button
                key={id}
                type="button"
                className={`btn h-auto max-w-xs flex-col items-start py-2 text-left ${draft.influence === id ? "btn-on" : ""}`}
                onClick={() =>
                  dispatch({
                    type: "draft",
                    plan: {
                      ...draft,
                      influence: id,
                      targetField: id === "spur" || id === "convert" ? f.field : view.fighters[other(f.side)].field,
                    },
                  })
                }
              >
                <span>{label}</span>
                <span className="text-xs text-faint">{text}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.id}
              type="button"
              className={`btn h-auto shrink-0 flex-col items-start py-2 text-left ${draft.reaction === reaction.id ? "btn-on" : ""}`}
              onClick={() =>
                dispatch({
                  type: "draft",
                  plan: { ...draft, reaction: draft.reaction === reaction.id ? null : reaction.id },
                })
              }
            >
              <span>{reaction.name} · {reaction.cost}</span>
              <span className="text-xs text-faint">{reaction.text}</span>
            </button>
          ))}
          {f.items
            .filter((item) => !item.spent)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                className={`btn h-auto shrink-0 flex-col items-start py-2 ${draft.itemId === item.id ? "btn-on" : ""}`}
                onClick={() =>
                  dispatch({
                    type: "draft",
                    plan: { ...draft, itemId: draft.itemId === item.id ? null : item.id },
                  })
                }
              >
                <span>{ITEMS.find((entry) => entry.id === item.id)?.name}</span>
                <span className="text-xs text-faint">{ITEMS.find((entry) => entry.id === item.id)?.text}</span>
              </button>
            ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {f.ruleBreak &&
            (["brace", "refund", "retarget"] as const).map((id) => (
              <button
                key={id}
                type="button"
                className={`btn ${draft.ruleBreak === id ? "btn-on" : ""}`}
                onClick={() =>
                  dispatch({
                    type: "draft",
                    plan: { ...draft, ruleBreak: draft.ruleBreak === id ? null : id },
                  })
                }
              >
                {id === "brace" ? "Regelbruch · 2 Bruch halten" : id === "refund" ? "Regelbruch · Stufe zurück" : "Regelbruch · Ziel ändern"}
              </button>
            ))}
          {f.nadelReady && (
            <button type="button" className={`btn ${draft.zeitnadel ? "btn-on" : ""}`} onClick={() => dispatch({ type: "draft", plan: { ...draft, zeitnadel: !draft.zeitnadel } })}>
              Zeitnadel
            </button>
          )}
          {(f.toolId === "rauch" || f.artifactId === "rauch") && (
            <button type="button" className={`btn ${draft.mist ? "btn-on" : ""}`} onClick={() => dispatch({ type: "draft", plan: { ...draft, mist: !draft.mist } })}>
              Rauchkapsel
            </button>
          )}
          {(f.toolId === "bruchstein" || f.artifactId === "bruchstein") && f.stoneRound !== view.round && (
            <button type="button" className="btn" onClick={() => dispatch({ type: "stone" })}>
              Bruchstein
            </button>
          )}
          {predict.map((kind) => (
            <button
              key={kind}
              type="button"
              className={`btn ${draft.prediction === kind ? "btn-on" : ""}`}
              onClick={() => dispatch({ type: "draft", plan: { ...draft, prediction: draft.prediction === kind ? null : kind } })}
            >
              Vorhersage {ACTIONS.find((a) => a.id === kind)?.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{planHint(c, draft, ready, f, view)}</p>
        <div className="sticky bottom-0 bg-surface pt-2">
          <button type="button" className="btn btn-primary w-full" onClick={() => { cue("idle", duel.muted); dispatch({ type: "lock" }); }}>
            Plan schließen
          </button>
        </div>
      </div>
    </footer>
  );
}

function Scene({ beat, duel, dispatch }: { beat: Frame; duel: Duel; dispatch: (act: Act) => void }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md">
      <p className="text-xs text-white/50">
        Schlag {duel.frame + 1} von {duel.frames.length} · {beatPlain(beat)}
      </p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <h2 className="display text-3xl">{beat.title}</h2>
        {beat.dice != null && (
          <p className="text-right">
            <span className="block text-[10px] uppercase tracking-wide text-white/50">Würfel</span>
            <span className="display text-5xl tabular-nums text-accent">{beat.dice}</span>
          </p>
        )}
      </div>
      <p className="mt-2 text-sm text-white/80">{beat.detail}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1" aria-hidden="true">
          {duel.frames.map((_, index) => (
            <span key={index} className={`pip ${index === duel.frame ? "on-attack" : ""}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={() => dispatch({ type: "auto" })} aria-label={duel.auto ? "Szenen anhalten" : "Szenen automatisch"}>
            {duel.auto ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" className="btn" onClick={() => dispatch({ type: "step" })}>
            Weiter
          </button>
          <button type="button" className="btn" onClick={() => dispatch({ type: "skip" })} aria-label="Runde überspringen">
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

function FighterCard({
  f,
  tag,
  className = "",
  strip = false,
}: {
  f: Fighter;
  tag: string;
  className?: string;
  strip?: boolean;
}) {
  const c = CHARACTERS.find((item) => item.id === f.characterId)!;
  const open = isOpen(f);
  const bits = [
    open ? "Offen" : "",
    f.collapse ? "Letzte Runde" : "",
    f.marked ? "Markiert" : "",
    f.flank ? "Durchgang" : "",
    ...f.statuses.map((s) =>
      s.kind === "guarded" ? "Geschützt" : s.kind === "bound" ? "Gebunden" : s.kind === "confused" ? "Verwirrt" : s.kind === "wounded" ? "Verletzt" : "",
    ),
  ].filter(Boolean);
  if (strip) {
    return (
      <section className={`panel min-w-0 flex-1 px-3 py-2 ${className}`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="display truncate text-lg">{c.name}</h2>
          <p className="text-xs text-muted">{tag}</p>
        </div>
        <p className="mt-1 text-xs tabular-nums text-muted">
          {f.body}/{f.bodyMax} Körper · {f.bruch}/{f.bruchMax} Bruch · {f.energy} Energie
        </p>
      </section>
    );
  }
  return (
    <section className={`panel px-3 py-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="display text-2xl">{c.name}</h2>
        <p className="text-xs text-muted">{tag}</p>
      </div>
      <p className="mt-1 text-xs text-muted">
        {WEAPONS.find((item) => item.id === f.weaponId)?.name} · {ARMORS.find((item) => item.id === f.armorId)?.name}
        {f.toolId ? ` · ${GEAR.find((item) => item.id === f.toolId)?.name}` : ""}
        {f.artifactId ? ` · ${GEAR.find((item) => item.id === f.artifactId)?.name}` : ""}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Meter label="Körper" value={f.body} max={f.bodyMax} tone="body" />
        <Meter label="Bruch" value={f.bruch} max={f.bruchMax} tone="bruch" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Energie</span>
          <span className="flex gap-1">
            {Array.from({ length: f.energyMax }, (_, i) => (
              <span key={i} className={`pip ${i < f.energy ? "on-guard" : ""}`} />
            ))}
          </span>
        </div>
      </div>
      <div className="mt-3 flex gap-3">
        {f.cores.map((core, index) => (
          <span key={index} className="flex items-center gap-1" title={core.revealed ? `${core.points} Punkte` : "Verdeckt"}>
            {[0, 1, 2].map((pip) => (
              <span key={pip} className={`pip ${core.points > pip && core.revealed ? "on-influence" : ""}`} />
            ))}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-3">
        {(["attack", "guard", "move", "influence"] as ActionKind[]).map((kind) => (
          <span key={kind} className="flex gap-1" title={ACTIONS.find((a) => a.id === kind)?.name}>
            {[0, 1, 2].map((pip) => (
              <span key={pip} className={`pip ${f.pattern[kind] > pip ? `on-${kind}` : ""}`} />
            ))}
          </span>
        ))}
      </div>
      <p className="mt-2 min-h-5 text-xs text-muted">{bits.join(" · ") || "Stabil"}</p>
      {f.echoes.length > 0 && (
        <p className="text-xs text-faint">
          {f.echoes.map((e) => `${ECHO_LABEL[e.kind]} ${e.charges}`).join(" · ")}
        </p>
      )}
    </section>
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

function StatLine({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function GearRow({
  title,
  options,
  selected,
  also,
  onPick,
}: {
  title: string;
  options: { id: string; name: string; text: string }[];
  selected: string;
  also?: string;
  onPick: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm text-muted">{title}</h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {options.map((option) => {
          const on = option.id === selected || option.id === also;
          return (
            <button key={option.id} type="button" className={`panel p-3 text-left ${on ? "border-fg" : ""}`} onClick={() => onPick(option.id)}>
              <svg className="gear-art" viewBox="0 0 128 128" aria-hidden="true">
                <use href={`/equipment.svg#${option.id}`} />
              </svg>
              <span className="block font-medium">{option.name}</span>
              <span className="mt-1 block text-sm text-muted line-clamp-3">{option.text}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ScreenHead({
  kicker,
  title,
  action,
  onBack,
  onNext,
}: {
  kicker: string;
  title: string;
  action: string;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm text-muted">{kicker}</p>
        <h1 className="display text-4xl">{title}</h1>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn" onClick={onBack}>
          Zurück
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          {action}
        </button>
      </div>
    </div>
  );
}

function PhaseRail({ screen, beat }: { screen: Screen; beat: Frame | null }) {
  const steps = ["Aktualisieren", "Planen", "Aufdecken", "Handeln", "Ende"];
  const current = screen === "deploy" ? -1 : screen === "plan" ? 1 : beat?.kicker.includes("Aufdecken") ? 2 : beat?.kicker.includes("Ende") || beat?.kicker.includes("Entscheidung") ? 4 : 3;
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-2 text-xs text-faint">
      {steps.map((step, index) => (
        <span key={step} className={index === current ? "text-fg" : ""}>
          {step}
        </span>
      ))}
    </div>
  );
}

function Sigil({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-soft" aria-hidden="true">
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
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-bg/80 p-3 sm:items-center" role="dialog" aria-label="Regelreferenz">
      <div className="panel max-h-[80dvh] w-full max-w-lg overflow-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="display text-3xl">Regelreferenz</h2>
          <button type="button" className="btn" onClick={onClose}>
            Schließen
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
          <p>Sieg durch Körper 0, durch drei zerstörte Kern-Echos, oder wenn das Bruchmaximum die letzte Runde beendet.</p>
          <p>Jede Runde: Energie +2, verdeckt planen, aufdecken, höherer Aktionswert zuerst, dann Echos und die Schlussprüfung.</p>
          <p>Angriff trifft, wenn Würfel plus Angriffswert mindestens die Verteidigung erreicht. Eine 6 verdoppelt den Endschaden.</p>
          <p>Schutz mildert den nächsten Treffer. Ausweichen senkt einen Treffer um 2, ohne das Feld zu wechseln. Einfluss legt Spuren, schwächt Echos oder bricht Kerne.</p>
          <p>Dieselbe Grundaktion zweimal hintereinander gibt dem Gegner einen Musterpunkt. Bei drei Punkten einer Farbe darfst du vorhersagen.</p>
          <p>Ein Regelbruch pro Kampf. Ein Item und eine Reaktion pro Runde.</p>
        </div>
      </div>
    </div>
  );
}

function shownState(duel: Duel, beat: Frame | null): GameState | null {
  if (duel.screen === "scene") return beat?.state ?? duel.game;
  if (duel.screen === "deploy") {
    const b = duel.mode === "bot" ? botSetup(duel.setup.A, duel.difficulty) : { ...duel.setup.B };
    if (duel.mode === "bot") b.field = duel.setup.A.field === 4 ? 3 : 5;
    return createGame(duel.setup.A, b, 1);
  }
  return duel.game;
}

function legalFields(duel: Duel, view: GameState): number[] {
  if (duel.screen === "deploy") return STARTS[duel.focus];
  if (duel.screen !== "plan") return [];
  const f = view.fighters[duel.focus];
  const foe = view.fighters[other(duel.focus)];
  const stats = liveStats(f);
  if (duel.draft.action === "attack") {
    const range = duel.draft.ability && f.characterId === "brecher" ? 1 : stats.range;
    if (f.weaponId === "bogen" && f.statuses.some((s) => s.kind === "bound")) return [];
    return distance(f.field, foe.field) <= range ? [foe.field] : [];
  }
  if (duel.draft.action === "move") {
    const steps = moveSteps(f, duel.draft.ability ? cCost(f) : duel.draft.energy, duel.draft.ability);
    return reachable(f.field, steps, foe.field);
  }
  if (duel.draft.action === "influence" && (duel.draft.influence === "spur" || duel.draft.influence === "convert")) return [f.field];
  if (duel.draft.action === "influence") return distance(f.field, foe.field) <= 3 ? [foe.field] : [];
  return [];
}

function withAction(draft: Plan, action: ActionKind, game: GameState, side: Side): Plan {
  const f = game.fighters[side];
  const foe = game.fighters[other(side)];
  const next: Plan = { ...draft, action, ability: false };
  if (action === "attack") next.targetField = foe.field;
  if (action === "guard") next.targetField = f.field;
  if (action === "move") {
    const fields = reachable(f.field, moveSteps(f, draft.energy, false), foe.field);
    next.targetField = fields.sort((a, b) => distance(a, foe.field) - distance(b, foe.field))[0] ?? f.field;
  }
  if (action === "influence") next.targetField = foe.field;
  return next;
}

function planHint(c: (typeof CHARACTERS)[number], draft: Plan, ready: Plan, f: Fighter, view: GameState): string {
  const foe = view.fighters[other(f.side)];
  const stats = liveStats(f);
  const foeStats = liveStats(foe);
  const dist = distance(draft.action === "move" && draft.targetField ? draft.targetField : f.field, foe.field);
  if (draft.ability) return `${c.ability}. ${c.abilityText}`;
  if (draft.action === "attack") {
    if (ready.action !== "attack") {
      return `Abstand ${distance(f.field, foe.field)}, deine Reichweite ist ${stats.range}. Der Schlag geht daneben und lässt ein Angriffs-Echo. Beweg dich auf ein helles Feld, das näher liegt.`;
    }
    const raw = stats.weapon + (draft.energy >= 3 ? 2 : draft.energy >= 1 ? 1 : 0);
    return `Du schlägst auf Feld ${foe.field}. Wurf ist Würfel plus Kraftbonus ${stats.kraftB}${draft.energy > 0 ? " plus 1" : ""}. Rohschaden ist etwa ${raw} minus Rüstung ${foeStats.armor}. Ab 2 Energie gibt der Treffer 1 Bruch.`;
  }
  if (draft.action === "guard") {
    const cut = Math.max(2, stats.schutzB) + (draft.energy >= 1 ? 1 : 0);
    return `Der nächste Treffer gegen dich sinkt um ${cut}. Das ist dein Schutzbonus, mindestens 2.${draft.energy >= 3 ? " Mit 3 Energie bleibt ein Schutz-Echo auf deinem Feld, der den nächsten Schlag noch einmal um 2 senkt." : ""}`;
  }
  if (draft.action === "move") {
    const steps = moveSteps(f, draft.energy, false);
    const dest = draft.targetField ?? f.field;
    const mine = dist <= stats.range ? "deine Waffe reicht ihn" : "deine Waffe reicht ihn nicht";
    const his = dist <= foeStats.range ? "seine Waffe reicht dich" : "seine Waffe reicht dich nicht";
    return `Bis zu ${steps} Felder. Helle Felder kannst du betreten, der Gegner nicht. Feld ${dest} lässt Abstand ${dist}: ${mine}, ${his}.${draft.energy >= 2 ? " Mit 2 Energie bleibt dort ein Bewegungs-Echo." : ""} Ausweichen danach braucht noch 2 Energie und nimmt 2 Schaden, löscht den Schlag aber nicht.`;
  }
  if (draft.influence === "kern") {
    return `Kern brechen kostet mindestens 1 Energie und braucht Abstand bis 3. Jetzt ${distance(f.field, foe.field) <= 3 ? "reicht es" : "stehst du zu weit"}. Drei zerstörte Kern-Echos gewinnen, ohne den Körper auf 0 zu bringen.`;
  }
  if (draft.influence === "weaken") return "Du nimmst einem gegnerischen Echo Ladungen. Liegt keins, bricht das Brecheisen einen Schutz- oder Nebelmarker.";
  if (draft.influence === "convert") return "Ein eigenes Echo wechselt die Art. Angriff wird Falle, Schutz wird Barriere, Bewegung wird Nebel, Einfluss wird Riss. Das kostet 1 Energie oder eine Ladung.";
  return "Spur legt ein Einfluss-Echo auf dein Feld. Jedes eigene Echo dort gibt dem Archivar +2 Verteidigung, und ein Treffer gibt dem Angreifer 1 Bruch zurück.";
}

function energyLine(action: ActionKind, energy: number): string {
  if (action === "attack") return energy >= 3 ? "Rohschaden +2, Bruch +1" : energy >= 2 ? "Rohschaden +1, Bruch +1" : energy === 1 ? "Rohschaden +1, Wurf +1" : "kein Zusatz";
  if (action === "guard") return energy >= 3 ? "Schutz-Echo dazu" : energy >= 1 ? "der Abzug ist um 1 höher" : "nur der Schutzbonus";
  if (action === "move") return energy >= 2 ? "zwei Felder weiter und ein Echo" : energy === 1 ? "ein Feld weiter" : "nur die Grundweite";
  return energy >= 2 ? "das Echo bekommt eine Ladung mehr" : energy >= 1 ? "reicht für den Kern" : "nur eine einfache Spur";
}

function beatPlain(beat: Frame): string {
  if (beat.kicker.includes("Aufdecken")) return "Beide Pläne liegen offen. Der höhere Aktionswert handelt zuerst.";
  if (beat.tone === "hit") return "Der Schlag ist angekommen. Darüber steht, was Waffe, Rüstung, Block oder Ausweichen daraus gemacht haben.";
  if (beat.tone === "miss") return "Vorbei. Die Energie ist weg, ein Angriffs-Echo bleibt auf dem Feld.";
  if (beat.tone === "guard") return "Der nächste Treffer in dieser Runde wird kleiner.";
  if (beat.tone === "move") return "Die Stellung wechselt. Ob die Waffen noch reichen, steht am neuen Abstand.";
  if (beat.tone === "echo") return "Ein Echo liegt jetzt auf einem Feld und ändert den nächsten Schlag.";
  if (beat.tone === "win") return "Das Duell ist entschieden.";
  return "Die Runde endet. Ungenutzte Echos verlieren eine Ladung.";
}

const ECHO_LINE: Record<string, string> = {
  attack: "Angriffs-Echo: +1 Rohschaden, ab 2 Ladungen auch +1 Bruch.",
  guard: "Schutz-Echo: nächster Treffer −2, ab 2 Ladungen auch −1 Bruch.",
  move: "Bewegungs-Echo: Markierung, dass hier gegangen wurde.",
  influence: "Einfluss-Echo: zählt als eigenes Echo auf diesem Feld.",
  trap: "Falle: wer das Feld betritt, nimmt 1 Bruch.",
  barrier: "Barriere: ein Schlag durch das Feld ist um 2 kleiner.",
  mist: "Nebel: +2 Verteidigung auf diesem Feld.",
  rift: "Riss: wer das Feld verlässt, nimmt 1 Bruch.",
};

function fieldCaptions(duel: Duel, view: GameState): Record<number, string> {
  if (duel.screen !== "plan" || duel.draft.action !== "move") return {};
  const foe = view.fighters[other(duel.focus)];
  const mine = liveStats(view.fighters[duel.focus]).range;
  const captions: Record<number, string> = {};
  for (const id of legalFields(duel, view)) {
    const dist = distance(id, foe.field);
    captions[id] = dist <= mine ? `${dist} nah` : `${dist} weit`;
  }
  return captions;
}

function FieldNote({ duel, view }: { duel: Duel; view: GameState }) {
  const echoes = (["A", "B"] as Side[]).flatMap((side) => view.fighters[side].echoes.map((echo) => ({ ...echo, side })));
  const selected = duel.screen === "plan" ? duel.draft.targetField : duel.screen === "deploy" ? duel.setup[duel.focus].field : null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/55 p-3 text-xs text-white/75">
      {duel.screen === "deploy" && <p>Helle Felder sind die Startfelder. Näher am Gegner heißt, beide Waffen reichen früher.</p>}
      {duel.screen === "plan" && duel.draft.action === "move" && (
        <p>Tippe ein helles Feld. „Nah“ heißt, deine Waffe reicht von dort. „Weit“ heißt, du stehst außerhalb deiner Reichweite.{selected ? ` Gewählt ist Feld ${selected}.` : ""}</p>
      )}
      {duel.screen === "plan" && duel.draft.action !== "move" && <p>Das Feld bleibt, bis du Bewegung wählst. Die Ringe zeigen nur, wohin der aktuelle Plan zeigt.</p>}
      {echoes.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {echoes.map((echo, index) => (
            <li key={`${echo.side}-${echo.field}-${index}`}>
              Feld {echo.field} · {ECHO_LINE[echo.kind] ?? echo.kind} · {echo.charges} Ladungen
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function cCost(f: Fighter): number {
  if (f.characterId === "brecher") return 3;
  if (f.characterId === "jaeger") return 1;
  if (f.characterId === "archivar") return 3;
  return 2;
}
