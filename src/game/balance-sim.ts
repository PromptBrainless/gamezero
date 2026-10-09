import { writeFileSync } from "node:fs";
import { choosePlan } from "./ai";
import { CHARACTERS, type Side } from "./content";
import { createGame, suggestedSetup, type GameState } from "./model";
import { beginRound, resolveRound } from "./resolve";

const IDS = CHARACTERS.map((c) => c.id);
const SEEDS = 16;

function seedRandom(seed: number) {
  let t = seed >>> 0;
  Math.random = () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function play(left: string, right: string, seed: number): GameState {
  seedRandom(seed * 1000 + left.length * 17 + right.length);
  let pack = beginRound(createGame(suggestedSetup(left, "A"), suggestedSetup(right, "B"), seed));
  let state = pack.state;
  let guard = 0;
  while (!state.over && guard < 28) {
    guard += 1;
    const frames = resolveRound(state, choosePlan(state, "A", "taktisch"), choosePlan(state, "B", "taktisch"));
    state = frames[frames.length - 1].state;
    if (!state.over) {
      pack = beginRound(state);
      state = pack.state;
    }
  }
  return state;
}

const tally = Object.fromEntries(
  IDS.map((id) => [id, { games: 0, wins: 0, losses: 0, draws: 0, rounds: 0, body: 0, reasons: {} as Record<string, number> }]),
);
const matrix: Record<string, { wins: number; games: number; draws: number }> = {};
const actions: Record<string, Record<string, number>> = Object.fromEntries(
  IDS.map((id) => [id, { attack: 0, guard: 0, move: 0, influence: 0, all: 0 }]),
);
const logs: string[] = [];

for (const left of IDS) {
  for (const right of IDS) {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const state = play(left, right, seed);
      const key = `${left}|${right}`;
      matrix[key] ??= { wins: 0, games: 0, draws: 0 };
      matrix[key].games += 1;
      const winnerId = state.winner ? state.fighters[state.winner].characterId : null;
      if (!state.winner) matrix[key].draws += 1;
      else if (state.winner === "A") matrix[key].wins += 1;
      for (const side of ["A", "B"] as Side[]) {
        const id = state.fighters[side].characterId;
        const row = tally[id];
        row.games += 1;
        row.rounds += state.round;
        if (!state.winner) row.draws += 1;
        else if (state.fighters[state.winner].characterId === id) {
          row.wins += 1;
          row.body += state.fighters[side].body;
          row.reasons[state.winReason ?? "?"] = (row.reasons[state.winReason ?? "?"] ?? 0) + 1;
        } else row.losses += 1;
      }
      const name = (side: Side) => CHARACTERS.find((c) => c.id === state.fighters[side].characterId)?.name;
      const head = `${name("A")} (A) gegen ${name("B")} (B) · Samen ${seed} · Runde ${state.round} · ${state.winner ? name(state.winner) : "Unentschieden"} · ${state.winReason ?? "offen"} · Körper ${state.fighters.A.body}/${state.fighters.B.body}`;
      logs.push(`--- ${left}-vs-${right}-s${seed} ---\n${head}\n${[...state.log].reverse().join("\n")}\n`);
      for (const line of state.log) {
        const owner = line.startsWith(`${name("A")} `) ? left : line.startsWith(`${name("B")} `) ? right : "";
        if (!owner) continue;
        const bucket = actions[owner];
        if (line.includes("trifft") || line.includes("verfehlt")) bucket.attack += 1;
        else if (line.includes("geschützt") || line.includes("sperrt")) bucket.guard += 1;
        else if (line.includes("geht nach")) bucket.move += 1;
        else if (line.includes("Einfluss") || line.includes("Echo")) bucket.influence += 1;
        else continue;
        bucket.all += 1;
      }
    }
  }
}

const lines = [
  "ECHO//BRUCH · Simulationsprotokoll",
  "Stand des Systemcodes nach dem Balance-Patch.",
  "Kraftbonus nur im Trefferwurf. Rohschaden ist Waffe minus Rüstung.",
  "Block zieht mindestens den Schutzbonus ab, mindestens 2. Ausweichen ist immer −2.",
  "Ersttreffer von Archivar und Jäger ist auf 2 gedeckelt. Ein Fehlschlag lässt ein Angriffs-Echo.",
  "Wächter hält den ersten Treffer der Runde. Speer ignoriert Bewegung. Bogen aus der Distanz ignoriert 2 Rüstung.",
  "Paarungen 5×5 · 16 Samen · beide Seiten taktisch · Deckel 28 Runden",
  "Duelle 400 · vollständig, nicht gekürzt",
  "",
  "Siegquote je Figur (beide Seiten, Standardausrüstung)",
  "Figur | Spiele | Siege | Niederlagen | Unentschieden | Quote | Ø Runden | Ø Körper übrig | Siege nach Grund",
];
for (const id of IDS) {
  const row = tally[id];
  const name = CHARACTERS.find((c) => c.id === id)?.name;
  const quote = ((row.wins / row.games) * 100).toFixed(1);
  const rounds = (row.rounds / row.games).toFixed(1);
  const body = row.wins ? (row.body / row.wins).toFixed(1) : "0";
  const reasons = Object.entries(row.reasons)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ");
  lines.push(`${name} | ${row.games} | ${row.wins} | ${row.losses} | ${row.draws} | ${quote}% | ${rounds} | ${body} | ${reasons}`);
}
lines.push("", "Aktionen, gezählt aus den Protokollzeilen");
for (const id of IDS) {
  const bucket = actions[id];
  const pct = (key: string) => (bucket.all ? Math.round((bucket[key] / bucket.all) * 100) : 0);
  lines.push(
    `${CHARACTERS.find((c) => c.id === id)?.name} | Angriff ${pct("attack")}% | Schutz ${pct("guard")}% | Bewegung ${pct("move")}% | Einfluss ${pct("influence")}%`,
  );
}
lines.push("", "Matrix · Siege der linken Figur / Spiele (Unentschieden in Klammern)");
lines.push(["", ...IDS.map((id) => CHARACTERS.find((c) => c.id === id)?.name)].join(" | "));
for (const left of IDS) {
  const cells = IDS.map((right) => {
    const cell = matrix[`${left}|${right}`];
    return cell.draws ? `${cell.wins}/${cell.games} (${cell.draws})` : `${cell.wins}/${cell.games}`;
  });
  lines.push([CHARACTERS.find((c) => c.id === left)?.name, ...cells].join(" | "));
}
lines.push("", "=== VOLLSTÄNDIGE DUELLPROTOKOLLE ===", "", ...logs);
const text = lines.join("\n");
writeFileSync("public/protokoll.txt", text);
writeFileSync("public/bilanz.txt", lines.slice(0, lines.indexOf("=== VOLLSTÄNDIGE DUELLPROTOKOLLE ===")).join("\n"));
console.log(lines.slice(0, lines.indexOf("=== VOLLSTÄNDIGE DUELLPROTOKOLLE ===")).join("\n"));
