export type Side = "A" | "B";
export type BasisAction = "kampf" | "block" | "ausweichen";

export interface BasisHero {
  id: string;
  name: string;
  line: string;
  kraft: number;
  schutz: number;
  bewegung: number;
  kontrolle: number;
  tempo: number;
}

/** Karten der Regel, vor jedem Ausgleich. Fähigkeiten gelten in der Basis nicht. */
export const BASIS_HEROES: BasisHero[] = [
  { id: "brecher", name: "Brecher", line: "Schwerer Treffer", kraft: 8, schutz: 5, bewegung: 2, kontrolle: 2, tempo: 3 },
  { id: "laeuferin", name: "Läuferin", line: "Durchgang", kraft: 3, schutz: 3, bewegung: 8, kontrolle: 5, tempo: 8 },
  { id: "archivar", name: "Archivar", line: "Speichern", kraft: 3, schutz: 4, bewegung: 4, kontrolle: 9, tempo: 4 },
  { id: "waechter", name: "Wächter", line: "Standhalten", kraft: 4, schutz: 8, bewegung: 2, kontrolle: 5, tempo: 2 },
  { id: "jaeger", name: "Jäger", line: "Verfolgen", kraft: 6, schutz: 3, bewegung: 5, kontrolle: 4, tempo: 7 },
];

export interface BasisFighter {
  side: Side;
  heroId: string;
  body: number;
  bodyMax: number;
  energy: number;
  energyMax: number;
  bruch: number;
  bruchMax: number;
  collapse: boolean;
}

export interface BasisChoice {
  action: BasisAction;
  energy: number;
}

export interface BasisState {
  round: number;
  fighters: Record<Side, BasisFighter>;
  log: string[];
  winner: Side | null;
  winReason: "Körper" | "Bruch" | "Zeit" | null;
  over: boolean;
  seed: number;
  roundCap: number;
}

export interface BasisBeat {
  kicker: string;
  title: string;
  detail: string;
  tone: "idle" | "hit" | "guard" | "miss" | "win";
}

export function basisHero(id: string): BasisHero {
  const found = BASIS_HEROES.find((hero) => hero.id === id);
  if (!found) throw new Error(`Unbekannte Karte: ${id}`);
  return found;
}

export function bonus(value: number): number {
  if (value <= 2) return 0;
  if (value <= 4) return 1;
  if (value <= 6) return 2;
  if (value <= 8) return 3;
  return 4;
}

export function basisPools(hero: BasisHero): { body: number; energy: number; bruch: number } {
  return {
    body: 12 + hero.schutz,
    energy: Math.max(3, Math.min(8, 4 + Math.floor(hero.bewegung / 3))),
    bruch: 4 + Math.floor(hero.schutz / 2),
  };
}

function roll(state: BasisState): number {
  state.seed = (state.seed + 0x6d2b79f5) | 0;
  let t = Math.imul(state.seed ^ (state.seed >>> 15), 1 | state.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function d6(state: BasisState): number {
  return 1 + Math.floor(roll(state) * 6);
}

function other(side: Side): Side {
  return side === "A" ? "B" : "A";
}

function nameOf(state: BasisState, side: Side): string {
  return basisHero(state.fighters[side].heroId).name;
}

function note(state: BasisState, line: string) {
  state.log.push(line);
}

function isOpen(f: BasisFighter): boolean {
  return f.bruch >= Math.ceil(f.bruchMax / 2);
}

export function createBasis(heroA: string, heroB: string, seed = 1): BasisState {
  const make = (side: Side, id: string): BasisFighter => {
    const pools = basisPools(basisHero(id));
    return {
      side,
      heroId: id,
      body: pools.body,
      bodyMax: pools.body,
      energy: 2,
      energyMax: pools.energy,
      bruch: 0,
      bruchMax: pools.bruch,
      collapse: false,
    };
  };
  return {
    round: 0,
    fighters: { A: make("A", heroA), B: make("B", heroB) },
    log: [],
    winner: null,
    winReason: null,
    over: false,
    seed,
    roundCap: 16,
  };
}

export function beginBasisRound(input: BasisState): BasisState {
  const state: BasisState = structuredClone(input);
  if (state.over) return state;
  state.round += 1;
  const bits: string[] = [];
  for (const side of ["A", "B"] as Side[]) {
    const f = state.fighters[side];
    const before = f.energy;
    f.energy = Math.min(f.energyMax, f.energy + 2);
    bits.push(`${nameOf(state, side)} +${f.energy - before} Energie`);
  }
  note(state, `Runde ${state.round}. ${bits.join(" · ")}.`);
  return state;
}

function actionTempo(action: BasisAction): number {
  if (action === "block") return -1;
  if (action === "ausweichen") return 2;
  return 0;
}

export function basisActionValue(hero: BasisHero, choice: BasisChoice): number {
  return hero.tempo + actionTempo(choice.action) + Math.max(0, choice.energy);
}

function clampChoice(f: BasisFighter, choice: BasisChoice): BasisChoice {
  if (choice.action === "ausweichen") return { action: "ausweichen", energy: 0 };
  const cap = choice.action === "block" ? 1 : 3;
  return { action: choice.action, energy: Math.max(0, Math.min(cap, choice.energy, f.energy)) };
}

function orderSides(state: BasisState, choices: Record<Side, BasisChoice>): [Side, Side] {
  const score = (side: Side) => basisActionValue(basisHero(state.fighters[side].heroId), choices[side]);
  const pair: Side[] = ["A", "B"];
  const dice = { A: d6(state), B: d6(state) };
  pair.sort((a, b) => {
    const va = score(a);
    const vb = score(b);
    if (va !== vb) return vb - va;
    if (choices[a].energy !== choices[b].energy) return choices[a].energy - choices[b].energy;
    const ta = basisHero(state.fighters[a].heroId).tempo;
    const tb = basisHero(state.fighters[b].heroId).tempo;
    if (ta !== tb) return tb - ta;
    if (state.fighters[a].body !== state.fighters[b].body) return state.fighters[a].body - state.fighters[b].body;
    return dice[b] - dice[a];
  });
  return [pair[0], pair[1]];
}

function label(action: BasisAction): string {
  if (action === "kampf") return "Kampf";
  if (action === "block") return "Block";
  return "Ausweichen";
}

function finish(state: BasisState, winner: Side | null, reason: BasisState["winReason"]) {
  state.over = true;
  state.winner = winner;
  state.winReason = reason;
}

function gainBruch(state: BasisState, f: BasisFighter, amount: number): number {
  if (amount <= 0 || f.body <= 0) return 0;
  const before = f.bruch;
  f.bruch = Math.min(f.bruchMax, f.bruch + amount);
  if (f.bruch >= f.bruchMax) f.collapse = true;
  return f.bruch - before;
}

function strike(state: BasisState, attacker: Side, choices: Record<Side, BasisChoice>): string {
  const a = state.fighters[attacker];
  const defender = other(attacker);
  const d = state.fighters[defender];
  const aHero = basisHero(a.heroId);
  const dHero = basisHero(d.heroId);
  const plan = choices[attacker];
  const spent = Math.min(a.energy, plan.energy);
  a.energy -= spent;
  const attack = bonus(aHero.kraft) + spent;
  const defense = 2 + bonus(dHero.schutz) + bonus(dHero.bewegung);
  const die = d6(state);
  const diceNote = `Würfel ${die}. Angriff ${attack} gegen Verteidigung ${defense}.`;
  if (die + attack < defense) {
    const line = `${aHero.name} verfehlt ${dHero.name}. ${diceNote}`;
    note(state, line);
    if (choices[defender].action === "ausweichen") {
      note(state, `${dHero.name} muss nicht ausweichen.`);
    }
    return line;
  }

  const energyRaw = spent >= 3 ? 2 : spent >= 1 ? 1 : 0;
  let bruchMod = spent >= 2 ? 1 : 0;
  let end = Math.max(1, bonus(aHero.kraft) + energyRaw - bonus(dHero.schutz));
  const bits = [`Roh ${bonus(aHero.kraft) + energyRaw}`, `nach Schutzbonus ${end}`];

  if (choices[defender].action === "block") {
    const paid = choices[defender].energy;
    const cut = paid >= 1 ? 4 : 3;
    end = Math.max(0, end - cut);
    bruchMod -= 1;
    bits.push(`Block −${cut}`);
  }
  if (isOpen(d)) {
    end += 1;
    bruchMod += 1;
    bits.push("Offen +1");
  }
  const crit = die === 6;
  if (crit) {
    end *= 2;
    bruchMod += 1;
    bits.push("Kritisch");
  }
  if (choices[defender].action === "ausweichen") {
    if (d.energy >= 2) {
      d.energy -= 2;
      end = Math.max(0, end - 2);
      bits.push("Ausweichen −2");
    } else {
      bits.push("Ausweichen ohne 2 Energie");
    }
  }

  const dealt = Math.min(d.body, end);
  d.body -= dealt;
  const bruch = gainBruch(state, d, Math.max(0, bruchMod));
  const line = `${aHero.name} trifft ${dHero.name}. ${diceNote} ${bits.join(", ")}. ${dealt} Körper, ${bruch} Bruch.`;
  note(state, line);
  if (d.body <= 0) {
    finish(state, attacker, "Körper");
    note(state, `${dHero.name} fällt. Körper auf 0.`);
  }
  return line;
}

export function resolveBasis(input: BasisState, choiceA: BasisChoice, choiceB: BasisChoice): { state: BasisState; beats: BasisBeat[] } {
  const state: BasisState = structuredClone(input);
  const beats: BasisBeat[] = [];
  if (state.over) return { state, beats };

  const choices: Record<Side, BasisChoice> = {
    A: clampChoice(state.fighters.A, choiceA),
    B: clampChoice(state.fighters.B, choiceB),
  };

  for (const side of ["A", "B"] as Side[]) {
    const choice = choices[side];
    if (choice.action !== "block" || choice.energy <= 0) continue;
    const paid = Math.min(state.fighters[side].energy, choice.energy);
    state.fighters[side].energy -= paid;
    choices[side] = { action: "block", energy: paid };
  }

  const order = orderSides(state, choices);
  const first = order[0];
  const second = order[1];
  beats.push({
    kicker: `Runde ${state.round} · Aufdecken`,
    title: `${label(choices[first].action)} vor ${label(choices[second].action)}`,
    detail: `${nameOf(state, first)} handelt zuerst. Aktionswert ${basisActionValue(basisHero(state.fighters[first].heroId), choices[first])} gegen ${basisActionValue(basisHero(state.fighters[second].heroId), choices[second])}.`,
    tone: "idle",
  });

  for (const side of order) {
    const choice = choices[side];
    if (choice.action === "kampf") continue;
    const who = nameOf(state, side);
    if (choice.action === "block") {
      const power = choice.energy >= 1 ? 4 : 3;
      const line = `${who} blockt. Der erste Treffer dieser Runde ist um ${power} niedriger, der Bruch daraus um 1.`;
      note(state, line);
      beats.push({ kicker: `Runde ${state.round} · Block`, title: `${who} blockt`, detail: line, tone: "guard" });
    } else {
      const line = `${who} will ausweichen. Ein Treffer kostet 2 Energie und 2 Schaden, sonst verpufft es.`;
      note(state, line);
      beats.push({ kicker: `Runde ${state.round} · Ausweichen`, title: `${who} weicht`, detail: line, tone: "guard" });
    }
  }

  for (const side of order) {
    if (state.over || choices[side].action !== "kampf") continue;
    const who = nameOf(state, side);
    const line = strike(state, side, choices);
    beats.push({
      kicker: `Runde ${state.round} · Kampf`,
      title: line.includes("verfehlt") ? `${who} verfehlt` : `${who} trifft`,
      detail: line,
      tone: state.over ? "win" : line.includes("verfehlt") ? "miss" : "hit",
    });
  }

  if (!state.over) {
    const losers = (["A", "B"] as Side[]).filter((side) => state.fighters[side].collapse && state.fighters[side].bruch >= state.fighters[side].bruchMax);
    if (losers.length === 1) {
      finish(state, other(losers[0]), "Bruch");
      note(state, `${nameOf(state, losers[0])} bricht zusammen.`);
    } else if (losers.length === 2) {
      finish(state, null, "Bruch");
      note(state, "Beide brechen zusammen.");
    } else if (state.round >= state.roundCap) {
      const a = state.fighters.A.body;
      const b = state.fighters.B.body;
      if (a === b) finish(state, null, "Zeit");
      else finish(state, a > b ? "A" : "B", "Zeit");
      note(state, "Die Zeit ist um. Es zählt der Körper.");
    } else {
      note(state, "Die Runde endet.");
    }
    beats.push({
      kicker: `Runde ${state.round} · Ende`,
      title: state.over ? winTitle(state) : "Die Runde endet",
      detail: state.log[state.log.length - 1] ?? "",
      tone: state.over ? "win" : "idle",
    });
  } else {
    beats.push({
      kicker: `Runde ${state.round} · Entscheidung`,
      title: winTitle(state),
      detail: winDetail(state),
      tone: "win",
    });
  }

  return { state, beats };
}

export function winTitle(state: BasisState): string {
  if (!state.winner) return state.winReason === "Zeit" ? "Unentschieden" : "Beide brechen";
  return `${nameOf(state, state.winner)} siegt`;
}

export function winDetail(state: BasisState): string {
  if (state.winReason === "Körper") return "Der Körper des Gegners ist auf 0.";
  if (state.winReason === "Bruch") return "Das Bruchmaximum hat die Runde beendet.";
  if (state.winReason === "Zeit") return "Nach 16 Runden zählt der verbleibende Körper.";
  return "Das Duell endet.";
}

export function botBasisChoice(state: BasisState): BasisChoice {
  const me = state.fighters.B;
  const mine = basisHero(me.heroId);
  const their = basisHero(state.fighters.A.heroId);
  const threatened = me.body <= Math.ceil(me.bodyMax * 0.35) || me.bruch >= me.bruchMax - 1;
  const hard = bonus(their.kraft) >= bonus(mine.schutz);
  if (threatened && hard) {
    if (bonus(mine.bewegung) >= 2 && me.energy >= 2 && state.round % 2 === 0) return { action: "ausweichen", energy: 0 };
    return { action: "block", energy: me.energy >= 1 ? 1 : 0 };
  }
  if (me.energy >= 3 && bonus(mine.kraft) >= 2) return { action: "kampf", energy: 3 };
  if (me.energy >= 1) return { action: "kampf", energy: 1 };
  return { action: "kampf", energy: 0 };
}

export function botBasisHero(playerId: string, seed: number): string {
  const order = ["waechter", "brecher", "jaeger", "laeuferin", "archivar"];
  const start = Math.abs(seed) % order.length;
  for (let i = 0; i < order.length; i++) {
    const id = order[(start + i) % order.length];
    if (id !== playerId) return id;
  }
  return "waechter";
}

export function basisSelfcheck(): string[] {
  const errors: string[] = [];
  const expect = (cond: boolean, message: string) => {
    if (!cond) errors.push(message);
  };
  expect(bonus(1) === 0 && bonus(4) === 1 && bonus(6) === 2 && bonus(8) === 3 && bonus(10) === 4, "Bonus-Tabelle");
  const brecher = basisPools(basisHero("brecher"));
  expect(brecher.body === 17 && brecher.energy === 4 && brecher.bruch === 6, "Brecher-Pools");
  const laeuferin = basisPools(basisHero("laeuferin"));
  expect(laeuferin.body === 15 && laeuferin.energy === 6 && laeuferin.bruch === 5, "Läuferin-Pools");
  const waechter = basisPools(basisHero("waechter"));
  expect(waechter.body === 20 && waechter.energy === 4 && waechter.bruch === 8, "Wächter-Pools");

  const bare = beginBasisRound(createBasis("brecher", "waechter", 7));
  const open = resolveBasis(bare, { action: "kampf", energy: 0 }, { action: "kampf", energy: 0 });
  const blocked = resolveBasis(structuredClone(bare), { action: "kampf", energy: 0 }, { action: "block", energy: 0 });
  expect(open.state.fighters.B.body <= bare.fighters.B.body, "Kampf senkt oder hält den Körper");
  expect(blocked.state.fighters.B.body >= open.state.fighters.B.body, "Block mildert denselben Schlag");
  expect(blocked.state.log.some((line) => line.includes("Block")), "Block steht im Protokoll");
  expect(!("echoes" in open.state.fighters.A), "Keine Echos");

  let state = beginBasisRound(createBasis("brecher", "archivar", 3));
  for (let i = 0; i < 16 && !state.over; i++) {
    const next = resolveBasis(state, { action: "kampf", energy: Math.min(3, state.fighters.A.energy) }, botBasisChoice(state));
    state = next.state.over ? next.state : beginBasisRound(next.state);
    expect(state.fighters.A.body >= 0 && state.fighters.B.body >= 0, "Körper nicht unter 0");
    expect(state.fighters.A.energy <= state.fighters.A.energyMax, "Energie im Maximum");
  }
  expect(state.over, "Ein Duell endet");
  if (state.winner) expect(state.winReason === "Körper" || state.winReason === "Bruch" || state.winReason === "Zeit", "Sieggrund");
  return errors;
}
