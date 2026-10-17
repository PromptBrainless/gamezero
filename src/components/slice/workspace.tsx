import { useEffect, useRef, useState } from "react";
import {
  Bookmark, Crosshair, Expand, Eye, Flame, Hand, Heart, Maximize2, Package,
  RotateCcw, Shield, Sparkles, Star, Sword, Swords, Users, Wind, ZoomIn, ZoomOut,
} from "lucide-react";
import { createBattle, preview, resolveRound, unavailable, type Actor, type Battle } from "@/game/slice/combat";
import { bosses, careers, encounters, enemies, items, registry, resolveEncounter, skills, statuses } from "@/game/slice/content";
import { Figure, Scene, type SceneFx, type SceneHit } from "./scene";
import { generatePixelArt } from "@/lib/flux/generate-pixel-art";
import "./slice.css";
import "./workspace.css";

type Screen = "career" | "encounter" | "combat" | "reward" | "progress" | "finish";
type Tab = "encounters" | "units" | "skills" | "items";
type Sel =
  | { kind: "career"; id: string }
  | { kind: "encounter"; index: number }
  | { kind: "player" }
  | { kind: "enemy"; index: number }
  | { kind: "skill"; id: string }
  | { kind: "item"; id: string }
  | { kind: "arena" };

const careerOrder = ["mercenary", "duelist", "scholar_mage"] as const;
const idleFx: SceneFx = { seq: 0, action: null, target: 0, hits: [] };
const tabs: { id: Tab; label: string; icon: typeof Swords }[] = [
  { id: "encounters", label: "Reise", icon: Swords },
  { id: "units", label: "Einheiten", icon: Users },
  { id: "skills", label: "Fähigkeiten", icon: Sparkles },
  { id: "items", label: "Vorrat", icon: Package },
];

function actionKind(id: string | null, skipTurn: boolean): SceneFx["action"] {
  if (skipTurn) return "skip";
  if (!id) return "rest";
  if (id.startsWith("item:")) return "item";
  const skill = skills[id];
  if (skill.target === "self") return skill.type === "defense" ? "guard" : "rest";
  return skill.damage?.scaling_stat === "magic" ? "cast" : "strike";
}

function statName(key: string) {
  return ({ hp: "LP", stamina: "Ausdauer", focus: "Fokus", attack: "Angriff", defense: "Verteidigung", magic: "Magie", speed: "Tempo" } as Record<string, string>)[key] ?? key;
}

function spot(index: number, count: number, kind: string) {
  const boss = kind === "iron_captain";
  const scale = boss ? 1.24 : 1.04;
  const x = count > 1 ? 605 + index * 170 : 685;
  const y = boss ? 82 : 130;
  return box(x, y, scale);
}

function box(x: number, y: number, scale: number) {
  return {
    left: `${(x / 1000) * 100}%`,
    top: `${(y / 470) * 100}%`,
    width: `${((168 * scale) / 1000) * 100}%`,
    height: `${((248 * scale) / 470) * 100}%`,
  };
}

export function WorkspaceApp() {
  const [screen, setScreen] = useState<Screen>("career");
  const [careerId, setCareer] = useState("mercenary");
  const [step, setStep] = useState(0);
  const [xp, setXp] = useState(0);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [target, setTarget] = useState(0);
  const [fx, setFx] = useState<SceneFx>(idleFx);
  const [history, setHistory] = useState<string[]>([]);
  const [resolving, setResolving] = useState(false);
  const [supplies, setSupplies] = useState<Record<string, number> | null>(null);
  const [tab, setTab] = useState<Tab>("encounters");
  const [sheet, setSheet] = useState<"library" | "inspector" | null>("library");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Sel>({ kind: "career", id: "mercenary" });
  const [focus, setFocus] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hand, setHand] = useState(false);
  const [panning, setPanning] = useState(false);
  const [space, setSpace] = useState(false);
  const [dropOver, setDropOver] = useState<string | null>(null);
  const [marks, setMarks] = useState<string[]>([]);
  const [marksReady, setMarksReady] = useState(false);
  const [portraits, setPortraits] = useState<Record<string, string>>({});
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const moved = useRef(false);
  const panRef = useRef(pan);
  panRef.current = pan;
  const api = useRef({
    confirm: () => {},
    cycle: (_dir: number) => {},
    fit: () => {},
    zoomBy: (_factor: number) => {},
    skillSlot: (_index: number) => {},
    clear: () => {},
    toggleFocus: () => {},
    bookmark: () => {},
  });

  const career = careers[careerId];
  const encounter = encounters[step];
  const roster = resolveEncounter(step).opponents;
  const skill = selected && !selected.startsWith("item:") ? skills[selected] : null;
  const item = selected?.startsWith("item:") ? items[selected.slice(5)] : null;
  const deck = (battle ? battle.player.skills : career.starting_skills).filter((id) => !skills[id].trigger);
  const reason = battle && skill && !battle.player.skipTurn ? unavailable(battle.player, skill) : null;
  const q = query.trim().toLowerCase();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gz-ws-marks");
      if (raw) setMarks(JSON.parse(raw) as string[]);
    } catch { /* ungültige Merkliste bleibt leer */ }
    setMarksReady(true);
  }, []);

  useEffect(() => {
    if (!marksReady) return;
    localStorage.setItem("gz-ws-marks", JSON.stringify(marks));
  }, [marks, marksReady]);

  useEffect(() => {
    if (!resolving) return;
    const timer = window.setTimeout(() => {
      setResolving(false);
      if (battle?.result === "victory") setScreen("reward");
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [resolving, battle]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom((value) => Math.min(1.9, Math.max(0.65, value * (event.deltaY < 0 ? 1.08 : 0.92))));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [screen]);

  function drawPortrait(variant: "duelist" | "mercenary" | "scholar_mage") {
    if (drawing || portraits[variant]) return;
    setDrawing(true);
    setDrawError("");
    void generatePixelArt({ data: { variant, width: 1024, height: 1024 } })
      .then((result) => setPortraits((current) => ({ ...current, [variant]: result.base64 })))
      .catch((error: unknown) => setDrawError(error instanceof Error ? error.message : "Bild fehlgeschlagen"))
      .finally(() => setDrawing(false));
  }

  function fit() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function toggleMark(id: string) {
    setMarks((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
  }

  function openTab(next: Tab) {
    setTab(next);
    setSheet((current) => current === "library" && tab === next ? null : "library");
  }

  function start() {
    const next = createBattle(career, roster, 42 + step, items, step + 1);
    if (supplies) next.inventory = { ...supplies };
    setBattle(next);
    setTarget(0);
    setSelected(null);
    setFx(idleFx);
    setHistory([...next.log]);
    setScreen("combat");
    setSelection({ kind: "player" });
    setTab("skills");
  }

  function act(choice: string | null = selected) {
    if (!battle || resolving || battle.result) return;
    const next = resolveRound(battle, battle.player.skipTurn ? null : choice, target, registry);
    const hits: SceneHit[] = [];
    next.enemies.forEach((enemy, index) => {
      const lost = battle.enemies[index].hp - enemy.hp;
      if (lost > 0) hits.push({ slot: index, amount: lost, kind: "damage" });
    });
    const playerDelta = battle.player.hp - next.player.hp;
    if (playerDelta !== 0) hits.push({ slot: "player", amount: Math.abs(playerDelta), kind: playerDelta > 0 ? "damage" : "heal" });
    setBattle(next);
    setFx((previous) => ({ seq: previous.seq + 1, action: actionKind(battle.player.skipTurn ? null : choice, battle.player.skipTurn), target, hits }));
    setHistory((entries) => [...entries, `— Runde ${battle.round} —`, ...next.log]);
    setResolving(true);
    setSelected(null);
    if (next.enemies[target]?.hp <= 0) {
      const live = next.enemies.findIndex((enemy) => enemy.hp > 0);
      setTarget(Math.max(0, live));
    }
    if (next.result === "victory") {
      setXp((value) => value + encounter.rewards.xp);
      const nextSupplies = { ...next.inventory };
      for (const id of encounter.rewards.items ?? []) if (items[id].use) nextSupplies[id] = (nextSupplies[id] ?? 0) + 1;
      setSupplies(nextSupplies);
    }
  }

  function reset() {
    setScreen("career");
    setStep(0);
    setXp(0);
    setBattle(null);
    setSelected(null);
    setSupplies(null);
    setResolving(false);
    setFx(idleFx);
    setHistory([]);
    setCareer("mercenary");
    setSelection({ kind: "career", id: "mercenary" });
    setFocus(false);
    fit();
  }

  function confirm() {
    if (resolving) return;
    if (screen === "career") { setScreen("encounter"); setSelection({ kind: "encounter", index: step }); return; }
    if (screen === "encounter") { start(); return; }
    if (screen === "reward") { setScreen(step === encounters.length - 1 ? "finish" : "progress"); return; }
    if (screen === "progress") { setStep(step + 1); setScreen("encounter"); setSelection({ kind: "encounter", index: step + 1 }); return; }
    if (screen === "finish") { reset(); return; }
    if (battle?.result === "defeat") { start(); return; }
    if (battle && !reason) act();
  }

  function cycle(dir: number) {
    if (!battle) return;
    const live = battle.enemies.flatMap((enemy, index) => enemy.hp > 0 ? [index] : []);
    if (live.length === 0) return;
    const pos = Math.max(0, live.indexOf(target));
    const next = live[(pos + dir + live.length) % live.length];
    setTarget(next);
    setSelection({ kind: "enemy", index: next });
  }

  function chooseSkill(id: string) {
    if (!battle || skills[id].trigger || !battle.player.skills.includes(id)) {
      setSelection({ kind: "skill", id });
      return;
    }
    setSelected(id);
    setSelection({ kind: "skill", id });
  }

  function markCurrent() {
    const id = selection.kind === "skill" ? selection.id
      : selection.kind === "item" ? selection.id
      : selection.kind === "career" ? selection.id
      : selection.kind === "encounter" ? encounters[selection.index]?.id
      : selection.kind === "player" ? careerId
      : selection.kind === "enemy" ? battle?.enemies[selection.index]?.id
      : encounter.id;
    if (id) toggleMark(id);
  }

  api.current = {
    confirm, cycle, fit, bookmark: markCurrent,
    zoomBy: (factor) => setZoom((value) => Math.min(1.9, Math.max(0.65, value * factor))),
    skillSlot: (index) => { const id = deck[index]; if (id) chooseSkill(id); },
    clear: () => { setSelected(null); if (focus) setFocus(false); },
    toggleFocus: () => setFocus((value) => !value),
  };

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const host = event.target as HTMLElement | null;
      if (host && (host.tagName === "INPUT" || host.tagName === "TEXTAREA")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === " ") { event.preventDefault(); setSpace(true); return; }
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === "q" || event.key === "Enter") { event.preventDefault(); api.current.confirm(); }
      else if (key === "f") api.current.toggleFocus();
      else if (key === "b") api.current.bookmark();
      else if (event.key === "Escape") api.current.clear();
      else if (event.key === "0") api.current.fit();
      else if (event.key === "+" || event.key === "=") api.current.zoomBy(1.1);
      else if (event.key === "-" || event.key === "_") api.current.zoomBy(0.9);
      else if (event.key === "[") api.current.cycle(-1);
      else if (event.key === "]") api.current.cycle(1);
      else if (/^[1-4]$/.test(event.key)) api.current.skillSlot(Number(event.key) - 1);
    }
    function onUp(event: KeyboardEvent) { if (event.key === " ") setSpace(false); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onUp); };
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!space && !hand) return;
    drag.current = { x: event.clientX, y: event.clientY, px: panRef.current.x, py: panRef.current.y };
    moved.current = false;
    setPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.hypot(dx, dy) > 3) moved.current = true;
    setPan({ x: drag.current.px + dx, y: drag.current.py + dy });
  }
  function onPointerUp() {
    drag.current = null;
    setPanning(false);
  }

  function dropSkill(id: string, onto: number | "player") {
    const entry = skills[id];
    if (!entry || !battle || entry.trigger || !battle.player.skills.includes(id)) return;
    if (onto === "player") {
      if (entry.target !== "self") return;
      setSelected(id);
      setSelection({ kind: "player" });
      return;
    }
    if (entry.target !== "enemy" || battle.enemies[onto]?.hp <= 0) return;
    setTarget(onto);
    setSelected(id);
    setSelection({ kind: "enemy", index: onto });
  }

  const goLabel = screen === "career" ? "Aufbruch" : screen === "encounter" ? "Beginnen" : screen === "reward" || screen === "progress" ? "Weiter" : screen === "finish" ? "Neu" : battle?.result === "defeat" ? "Nochmal" : battle?.player.skipTurn ? "Aussetzen" : "Zug";
  const title = screen === "career" ? "Wer zieht zur Nordwacht?" : encounter.name;
  const kicker = screen === "combat" && battle ? (battle.result === "victory" ? "Sieg" : battle.result === "defeat" ? "Niederlage" : resolving ? "Auflösung" : `Runde ${battle.round}`) : screen === "career" ? "Aufbruch" : `Begegnung ${step + 1} / ${encounters.length}`;
  const sceneOn = screen !== "career";
  const marked = marks.filter((id) => labelOf(id));

  return (
    <main className={focus ? "gz-ws is-focus" : "gz-ws"}>
      <header className="gz-top">
        <div className="gz-brand"><Swords size={20} aria-hidden="true" /><span className="gz-brand-name">ECHO<span className="gz-slash">//</span>BRUCH</span></div>
        <div className="gz-status"><span>{kicker}</span><strong>{title}</strong></div>
        <div className="gz-top-actions">
          <button type="button" className={focus ? "gz-icon is-on" : "gz-icon"} onClick={() => setFocus((value) => !value)} aria-pressed={focus} title="Fokusmodus (F)" aria-label="Fokusmodus"><Expand size={18} /></button>
          <button type="button" className="gz-icon" onClick={reset} title="Neue Reise" aria-label="Neue Reise"><RotateCcw size={18} /></button>
          <button type="button" className="gz-go" disabled={Boolean(reason) || resolving} onClick={confirm}>{goLabel}</button>
        </div>
      </header>
      <div className="gz-body">
        <nav className="gz-rail" aria-label="Werkbank">
          {tabs.map((entry) => {
            const Icon = entry.icon;
            const on = tab === entry.id && sheet !== "inspector";
            return <button type="button" key={entry.id} className={on ? "is-on" : ""} aria-label={entry.label} aria-pressed={on} onClick={() => openTab(entry.id)}><Icon size={18} /><span>{entry.label}</span></button>;
          })}
          <button type="button" className={sheet === "inspector" ? "gz-mobile-only is-on" : "gz-mobile-only"} aria-label="Inspektor" onClick={() => setSheet((current) => current === "inspector" ? null : "inspector")}><Eye size={18} /><span>Info</span></button>
        </nav>

        <aside className={sheet === "library" ? "gz-library is-open" : "gz-library"} aria-label="Bibliothek">
          <header><h2>{tabs.find((entry) => entry.id === tab)?.label}</h2><span className="gz-kicker">{xp} EP</span></header>
          <input className="gz-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suchen" aria-label="Bibliothek durchsuchen" />
          {tab === "skills" && <div className="gz-essentials">{deck.slice(0, 4).map((id, index) => <button type="button" key={id} draggable={screen === "combat"} onDragStart={(event) => event.dataTransfer.setData("text/plain", id)} className={selected === id ? "gz-tile is-on" : "gz-tile"} onClick={() => chooseSkill(id)}><strong>{index + 1} · {skills[id].name}</strong><small>{costLabel(id)}</small></button>)}</div>}
          {marked.length > 0 && <div className="gz-marks"><p className="gz-kicker">Merkliste</p>{marked.filter((id) => labelOf(id).toLowerCase().includes(q)).map((id) => <Row key={`mark-${id}`} title={labelOf(id)} detail="Gemerkt" on={isOn(selection, id)} marked onOpen={() => openMarked(id, { setCareer, setSelection, setTab, setSheet })} onMark={() => toggleMark(id)} />)}</div>}
          <div className="gz-list">
            {tab === "encounters" && encounters.map((entry, index) => {
              if (q && !entry.name.toLowerCase().includes(q)) return null;
              const state = index < step ? "Bestanden" : index === step ? "Aktuell" : "Später";
              return <Row key={entry.id} title={entry.name} detail={state} on={selection.kind === "encounter" && selection.index === index} marked={marks.includes(entry.id)} onOpen={() => setSelection({ kind: "encounter", index })} onMark={() => toggleMark(entry.id)} />;
            })}
            {tab === "units" && (battle ? [battle.player, ...battle.enemies] : [null, ...roster]).map((actor, index) => {
              if (battle && actor) {
                const unit = actor as Actor;
                if (q && !unit.name.toLowerCase().includes(q)) return null;
                const mine = index === 0;
                return <Row key={`${unit.id}-${index}`} title={unit.name} detail={mine ? career.name : unit.hp <= 0 ? "Besiegt" : "Gegner"} on={(mine && selection.kind === "player") || (!mine && selection.kind === "enemy" && selection.index === index - 1)} marked={marks.includes(unit.id)} onOpen={() => { if (mine) setSelection({ kind: "player" }); else { setSelection({ kind: "enemy", index: index - 1 }); if (unit.hp > 0) setTarget(index - 1); } }} onMark={() => toggleMark(unit.id)} />;
              }
              if (!battle && index === 0) {
                if (q && !career.name.toLowerCase().includes(q)) return null;
                return <Row key={career.id} title={career.name} detail="Deine Karriere" on={selection.kind === "career"} marked={marks.includes(career.id)} onOpen={() => setSelection({ kind: "career", id: career.id })} onMark={() => toggleMark(career.id)} />;
              }
              const foe = roster[index - 1];
              if (!foe || (q && !foe.name.toLowerCase().includes(q))) return null;
              return <Row key={foe.id} title={foe.name} detail="In dieser Begegnung" on={selection.kind === "enemy" && selection.index === index - 1} marked={marks.includes(foe.id)} onOpen={() => setSelection({ kind: "enemy", index: index - 1 })} onMark={() => toggleMark(foe.id)} />;
            })}
            {tab === "skills" && Object.values(skills).slice().sort((left, right) => {
              const rank = (id: string) => (battle ? battle.player.skills.includes(id) : career.skill_pool.includes(id)) ? 0 : 1;
              return rank(left.id) - rank(right.id) || left.name.localeCompare(right.name, "de");
            }).map((entry) => {
              if (q && !entry.name.toLowerCase().includes(q)) return null;
              const onBar = battle ? battle.player.skills.includes(entry.id) : career.starting_skills.includes(entry.id);
              const detail = onBar ? costLabel(entry.id) : career.skill_pool.includes(entry.id) ? "Noch nicht erlernt" : "Andere Karriere";
              return <Row key={entry.id} title={entry.name} detail={detail} draggable={Boolean(battle && onBar && !entry.trigger)} onDragStart={(event) => event.dataTransfer.setData("text/plain", entry.id)} on={selected === entry.id || (selection.kind === "skill" && selection.id === entry.id)} marked={marks.includes(entry.id)} onOpen={() => chooseSkill(entry.id)} onMark={() => toggleMark(entry.id)} />;
            })}
            {tab === "items" && Object.values(items).map((entry) => {
              if (q && !entry.name.toLowerCase().includes(q)) return null;
              const count = battle?.inventory[entry.id] ?? 0;
              const carried = count > 0 || (!battle && career.starting_items.includes(entry.id));
              return <Row key={entry.id} title={entry.name} detail={count > 0 ? `×${count}` : carried ? "Dabei" : entry.slot ?? ""} on={selection.kind === "item" && selection.id === entry.id} marked={marks.includes(entry.id)} onOpen={() => { setSelection({ kind: "item", id: entry.id }); if (count > 0 && entry.use && !battle?.player.skipTurn) setSelected(`item:${entry.id}`); }} onMark={() => toggleMark(entry.id)} />;
            })}
          </div>
        </aside>

        <section className="gz-canvas" aria-label="Schlachtfeld">
          {focus && <button type="button" className="gz-icon gz-exit-focus" onClick={() => setFocus(false)} aria-label="Fokusmodus beenden"><Expand size={18} /></button>}
          {sceneOn ? (
            <div ref={stageRef} className={panning ? "gz-stage is-panning" : space || hand ? "gz-stage is-space" : "gz-stage"} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={() => { if (!moved.current) setSelection({ kind: "arena" }); }}>
              <div className="gz-cam" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                <Scene career={careerId} opponents={encounter.enemies} selected={target} encounter={step} fx={screen === "combat" ? fx : idleFx} defeated={battle && screen === "combat" ? battle.enemies.map((enemy) => enemy.hp <= 0) : []} telegraphs={battle && screen === "combat" ? battle.enemies.map((enemy) => enemy.hp > 0 && Boolean(enemy.pendingSkill)) : []} playerDown={screen === "combat" && battle?.result === "defeat"} />
                <button type="button" className={selection.kind === "player" ? "gz-hotspot is-on" : dropOver === "player" ? "gz-hotspot is-drop" : "gz-hotspot"} style={box(194, 128, 1.04)} aria-label={career.name} onClick={(event) => { event.stopPropagation(); setSelection({ kind: "player" }); }} onDragOver={(event) => { event.preventDefault(); setDropOver("player"); }} onDragLeave={() => setDropOver(null)} onDrop={(event) => { event.preventDefault(); setDropOver(null); dropSkill(event.dataTransfer.getData("text/plain"), "player"); }} />
                {roster.map((enemy, index) => (
                  <button type="button" key={`${enemy.id}-${index}`} className={selection.kind === "enemy" && selection.index === index ? "gz-hotspot is-on" : dropOver === String(index) ? "gz-hotspot is-drop" : "gz-hotspot"} style={spot(index, roster.length, enemy.id)} aria-label={enemy.name} onClick={(event) => { event.stopPropagation(); setSelection({ kind: "enemy", index }); if ((battle?.enemies[index]?.hp ?? 1) > 0) setTarget(index); }} onDragOver={(event) => { event.preventDefault(); setDropOver(String(index)); }} onDragLeave={() => setDropOver(null)} onDrop={(event) => { event.preventDefault(); setDropOver(null); dropSkill(event.dataTransfer.getData("text/plain"), index); }} />
                ))}
              </div>
              {screen === "combat" && battle && battle.log.length > 0 && <div className="gz-feed" aria-live="polite">{battle.log.slice(0, 3).map((entry, index) => <p key={`${fx.seq}-${index}`}>{entry}</p>)}</div>}
              <Banner screen={screen} battle={battle} encounterName={encounter.name} xp={encounter.rewards.xp} career={career.name} growth={career.stat_growth} />
              {screen === "combat" && battle && !battle.result && (
                <div className="gz-toolbox" role="toolbar" aria-label="Aktionen zur Auswahl" onClick={(event) => event.stopPropagation()}>
                  {selection.kind === "enemy" && battle.enemies[selection.index]?.hp > 0 && <button type="button" onClick={() => setTarget(selection.index)}><Crosshair size={16} /> Ziel</button>}
                  {selection.kind === "player" && <button type="button" onClick={() => { setSelected(null); act(null); }} disabled={resolving || battle.player.skipTurn}><Wind size={16} /> Sammeln</button>}
                  {deck[0] && <button type="button" onClick={() => chooseSkill(deck[0])}><Sword size={16} /> {skills[deck[0]].name}</button>}
                  <button type="button" onClick={() => setSheet("inspector")}><Eye size={16} /> Prüfen</button>
                  <button type="button" className="primary" disabled={Boolean(reason) || resolving} onClick={confirm}>{goLabel}</button>
                </div>
              )}
              <div className="gz-tools" onClick={(event) => event.stopPropagation()}>
                <div className="gz-mini" aria-label="Minimap">
                  <button type="button" className={selection.kind === "player" ? "gz-dot player is-on" : "gz-dot player"} style={{ left: "28%", top: "62%" }} aria-label={career.name} onClick={() => setSelection({ kind: "player" })} />
                  {roster.map((enemy, index) => <button type="button" key={enemy.id} className={selection.kind === "enemy" && selection.index === index ? "gz-dot enemy is-on" : "gz-dot enemy"} style={{ left: `${spotPercent(index, roster.length)}%`, top: "58%" }} aria-label={enemy.name} onClick={() => { setSelection({ kind: "enemy", index }); if ((battle?.enemies[index]?.hp ?? 1) > 0) setTarget(index); }} />)}
                </div>
                <div className="gz-toolrow">
                  <button type="button" className="gz-tool" onClick={() => setZoom((value) => Math.min(1.9, value * 1.12))} aria-label="Vergrößern"><ZoomIn size={18} /></button>
                  <button type="button" className="gz-tool" onClick={() => setZoom((value) => Math.max(0.65, value / 1.12))} aria-label="Verkleinern"><ZoomOut size={18} /></button>
                  <button type="button" className="gz-tool" onClick={fit} aria-label="Einpassen"><Maximize2 size={18} /></button>
                  <button type="button" className={hand ? "gz-tool is-on" : "gz-tool"} aria-pressed={hand} onClick={() => setHand((value) => !value)} aria-label="Verschieben"><Hand size={18} /></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="gz-careers">
              {careerOrder.map((id) => {
                const entry = careers[id];
                if (!entry) return null;
                return (
                <button type="button" key={entry.id} className={careerId === entry.id ? "gz-career is-on" : "gz-career"} onClick={() => { setCareer(entry.id); setSelection({ kind: "career", id: entry.id }); }}>
                  <div className={`gz-portrait ${entry.id}`}>{portraits[entry.id] ? <img src={`data:image/png;base64,${portraits[entry.id]}`} alt="" /> : <svg viewBox="0 0 200 255" aria-hidden="true"><g transform="translate(20 3)"><Figure kind={entry.id} /></g></svg>}</div>
                  <div><h3>{entry.name}</h3><p>{entry.description}</p></div>
                </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className={sheet === "inspector" ? "gz-inspector is-open" : "gz-inspector"} aria-label="Kontext">
          <header><h2>Kontext</h2><button type="button" className="gz-icon gz-mobile-only" onClick={() => setSheet(null)} aria-label="Schließen"><Expand size={16} /></button></header>
          <div className="gz-inspector-body">
            <Inspector selection={selection} careerId={careerId} battle={battle} step={step} selected={selected} target={target} reason={reason} portraits={portraits} drawing={drawing} drawError={drawError} onDraw={drawPortrait} />
            <div className="gz-keys">
              <kbd>1–4</kbd><span>Fähigkeit</span>
              <kbd>Q</kbd><span>Zug bestätigen</span>
              <kbd>F</kbd><span>Fokusmodus</span>
              <kbd>Leertaste</kbd><span>Karte ziehen</span>
              <kbd>Strg+Scroll</kbd><span>Zoom</span>
              <kbd>[ ]</kbd><span>Ziel wechseln</span>
              <kbd>B</kbd><span>Merken</span>
            </div>
          </div>
          {history.length > 0 && <div className="gz-log" aria-live="polite">{history.map((entry, index) => <p key={index} className={entry.startsWith("—") ? "round" : undefined}>{entry}</p>)}</div>}
        </aside>
      </div>
    </main>
  );
}

function costLabel(id: string) {
  const skill = skills[id];
  if (skill.trigger) return "Reaktion";
  const parts = Object.entries(skill.cost).map(([resource, value]) => `${value} ${resource === "focus" ? "Fokus" : "Ausdauer"}`);
  return parts.join(" · ") || "Ohne Kosten";
}

function labelOf(id: string) {
  return skills[id]?.name ?? items[id]?.name ?? careers[id]?.name ?? enemies[id]?.name ?? bosses[id]?.name ?? encounters.find((entry) => entry.id === id)?.name ?? "";
}

function isOn(selection: Sel, id: string) {
  return (selection.kind === "skill" || selection.kind === "item" || selection.kind === "career") && selection.id === id
    || selection.kind === "encounter" && encounters[selection.index]?.id === id;
}

function openMarked(id: string, actions: { setCareer: (id: string) => void; setSelection: (sel: Sel) => void; setTab: (tab: Tab) => void; setSheet: (sheet: "library" | "inspector" | null) => void }) {
  if (careers[id]) { actions.setCareer(id); actions.setSelection({ kind: "career", id }); }
  else if (skills[id]) { actions.setSelection({ kind: "skill", id }); actions.setTab("skills"); }
  else if (items[id]) { actions.setSelection({ kind: "item", id }); actions.setTab("items"); }
  else {
    const index = encounters.findIndex((entry) => entry.id === id);
    if (index >= 0) actions.setSelection({ kind: "encounter", index });
  }
  actions.setSheet("inspector");
}

function Row({ title, detail, on, marked, onOpen, onMark, draggable, onDragStart }: { title: string; detail: string; on: boolean; marked: boolean; onOpen: () => void; onMark: () => void; draggable?: boolean; onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void }) {
  return (
    <div className={on ? "gz-row is-on" : "gz-row"}>
      <button type="button" className="gz-row-main" draggable={draggable} onDragStart={onDragStart} onClick={onOpen}><strong>{title}</strong><small>{detail}</small></button>
      <button type="button" className="gz-star" aria-pressed={marked} aria-label={marked ? `${title} nicht mehr merken` : `${title} merken`} onClick={onMark}>{marked ? <Star size={16} /> : <Bookmark size={16} />}</button>
    </div>
  );
}

function Banner({ screen, battle, encounterName, xp, career, growth }: { screen: Screen; battle: Battle | null; encounterName: string; xp: number; career: string; growth?: Partial<Record<string, number>> }) {
  if (screen === "reward") return <div className="gz-banner"><p className="gz-kicker">Begegnung bestanden</p><h2>{encounterName}</h2><p>+{xp} EP. Die Reise geht weiter.</p></div>;
  if (screen === "progress") return <div className="gz-banner"><p className="gz-kicker">Karriere</p><h2>{career}</h2><p>{Object.entries(growth ?? {}).flatMap(([key, value]) => value ? [`+${value} ${statName(key)}`] : []).join(" · ") || "Keine neuen Werte."} Leben und Ressourcen sind voll.</p></div>;
  if (screen === "finish") return <div className="gz-banner"><p className="gz-kicker">Reise abgeschlossen</p><h2>Die Nordwacht gehört dir.</h2><p>{career} hat die Straße gehalten.</p></div>;
  if (battle?.result === "defeat") return <div className="gz-banner"><p className="gz-kicker">Niederlage</p><h2>Die Nordwacht muss warten.</h2><p>Dieselbe Begegnung beginnt von vorn.</p></div>;
  return null;
}

function Inspector({ selection, careerId, battle, step, selected, target, reason, portraits, drawing, drawError, onDraw }: { selection: Sel; careerId: string; battle: Battle | null; step: number; selected: string | null; target: number; reason: string | null; portraits: Record<string, string>; drawing: boolean; drawError: string; onDraw: (variant: "duelist" | "mercenary" | "scholar_mage") => void }) {
  const encounter = encounters[step];
  if (selection.kind === "career") {
    const career = careers[selection.id] ?? careers[careerId];
    const variant = career.id === "duelist" || career.id === "mercenary" || career.id === "scholar_mage" ? career.id : null;
    return <><p className="gz-kicker">Karriere</p><h3>{career.name}</h3><p>{career.description}</p><StatLine stats={career.base_stats} /><p>Start: {career.starting_skills.map((id) => skills[id].name).join(" · ")}</p>{variant && <button type="button" className="gz-go gz-draw" disabled={drawing || Boolean(portraits[variant])} onClick={() => onDraw(variant)}>{portraits[variant] ? "Pixelzeichnung bereit" : drawing ? "Zeichnet …" : "Pixelzeichnung"}</button>}{drawError && <p className="gz-warn">{drawError}</p>}</>;
  }
  if (selection.kind === "encounter" || selection.kind === "arena") {
    return <><p className="gz-kicker">{selection.kind === "arena" ? "Gelände" : "Begegnung"}</p><h3>{encounter.name}</h3><p>{encounter.description}</p><p>Belohnung: {encounter.rewards.xp} EP{encounter.rewards.items?.length ? ` · ${encounter.rewards.items.map((id) => items[id].name).join(", ")}` : ""}</p></>;
  }
  if (selection.kind === "skill") {
    const entry = skills[selection.id];
    const actor = battle?.player;
    const foe = battle?.enemies[target];
    const amount = actor && foe && entry.damage ? preview(actor, entry.target === "self" ? actor : foe, entry, registry) : 0;
    return <><p className="gz-kicker">{entry.type === "defense" ? "Verteidigung" : entry.type === "control" ? "Kontrolle" : "Fähigkeit"}</p><h3>{entry.name}</h3><p>{entry.description}</p><p>{costLabel(entry.id)}{entry.cooldown ? ` · ${entry.cooldown} Runden Abklingzeit` : ""}</p>{amount > 0 && foe && <p className="gz-warn">{foe.name}: etwa {amount} Schaden</p>}{reason && selected === entry.id && <p className="gz-warn">{reason}</p>}</>;
  }
  if (selection.kind === "item") {
    const entry = items[selection.id];
    return <><p className="gz-kicker">Vorrat</p><h3>{entry.name}</h3><p>{entry.description}</p>{entry.use && <p>{[entry.use.heal_hp ? `+${entry.use.heal_hp} LP` : "", entry.use.restore_focus ? `+${entry.use.restore_focus} Fokus` : "", entry.use.next_attack_bonus ? `+${entry.use.next_attack_bonus} nächster Angriff` : ""].filter(Boolean).join(" · ")}</p>}</>;
  }
  if (selection.kind === "player" && battle) return <ActorCard actor={battle.player} detail={careers[careerId].description} />;
  if (selection.kind === "player") return <><p className="gz-kicker">Einheit</p><h3>{careers[careerId].name}</h3><p>{careers[careerId].description}</p><StatLine stats={careers[careerId].base_stats} /></>;
  if (selection.kind === "enemy") {
    const actor = battle?.enemies[selection.index];
    const record = rosterRecord(step, selection.index);
    if (actor) return <ActorCard actor={actor} detail={record?.description ?? ""} pending={actor.pendingSkill} />;
    if (record) return <><p className="gz-kicker">Gegner</p><h3>{record.name}</h3><p>{record.description}</p><StatLine stats={record.base_stats} /></>;
  }
  return <p>Wähle eine Figur, eine Fähigkeit oder das Gelände.</p>;
}

function rosterRecord(step: number, index: number) {
  return resolveEncounter(step).opponents[index] as { name: string; description?: string; base_stats: { hp: number; attack: number; defense: number; magic: number; speed: number; stamina?: number; focus?: number } } | undefined;
}

function ActorCard({ actor, detail, pending }: { actor: Actor; detail: string; pending?: string | null }) {
  return (
    <>
      <p className="gz-kicker">{actor.hp <= 0 ? "Besiegt" : "Einheit"}</p>
      <h3>{actor.name}</h3>
      {detail && <p>{detail}</p>}
      <div className="gz-stats"><span><Heart size={14} />{actor.hp} / {actor.stats.hp}</span>{actor.stats.stamina !== undefined && <span><Flame size={14} />{actor.stamina}/{actor.stats.stamina}</span>}{actor.stats.focus !== undefined && <span><Sparkles size={14} />{actor.focus}/{actor.stats.focus}</span>}</div>
      <div className={actor.hp / actor.stats.hp < 0.3 ? "gz-meter danger" : "gz-meter"} role="meter" aria-label={`${actor.name} Lebenspunkte`} aria-valuenow={actor.hp} aria-valuemin={0} aria-valuemax={actor.stats.hp}><span style={{ width: `${Math.max(0, actor.hp / actor.stats.hp) * 100}%` }} /></div>
      <StatLine stats={actor.stats} />
      {pending && skills[pending] && <p className="gz-warn">Kündigt {skills[pending].name} an.</p>}
      {actor.effects.length > 0 && <div className="gz-chips">{actor.effects.map((effect) => <span className="gz-chip" key={effect.id}><Shield size={12} />{statuses[effect.id]?.name ?? effect.id} · {effect.duration} R</span>)}</div>}
    </>
  );
}

function StatLine({ stats }: { stats: { attack: number; defense: number; magic: number; speed: number } }) {
  return <div className="gz-stats"><span><Sword size={14} />{stats.attack}</span><span><Shield size={14} />{stats.defense}</span><span><Sparkles size={14} />{stats.magic}</span><span>{stats.speed} Tempo</span></div>;
}

function spotPercent(index: number, count: number) {
  const x = count > 1 ? 605 + index * 170 : 685;
  return Math.min(88, Math.max(12, (x + 80) / 10));
}
