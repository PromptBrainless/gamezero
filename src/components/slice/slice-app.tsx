import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Flame, Heart, Package, RotateCcw, Shield, Sparkles, Sword, Swords, Wind, X } from "lucide-react";
import { createBattle, preview, resolveRound, unavailable, type Actor, type Battle } from "@/game/slice/combat";
import { careers, encounters, items, registry, resolveEncounter, skills, statuses } from "@/game/slice/content";
import { Figure, Scene } from "./scene";

type Screen = "career" | "encounter" | "combat" | "reward" | "progress" | "finish";

export function SliceApp() {
  const [screen, setScreen] = useState<Screen>("career");
  const [careerId, setCareer] = useState("mercenary");
  const [step, setStep] = useState(0);
  const [xp, setXp] = useState(0);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [target, setTarget] = useState(0);
  const [impact, setImpact] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [supplies, setSupplies] = useState<Record<string, number> | null>(null);
  const career = careers[careerId];
  const encounter = encounters[step];
  const roster = resolveEncounter(step).opponents;
  const skill = selected ? skills[selected] : null;
  const item = selected?.startsWith("item:") ? items[selected.slice(5)] : null;
  const recipient = battle && skill ? skill.target === "self" ? battle.player : battle.enemies[target] : null;
  const damage = battle && skill && recipient ? preview(battle.player, recipient, skill, registry) : 0;
  const reason = battle && skill && !battle.player.skipTurn ? unavailable(battle.player, skill) : null;

  useEffect(() => {
    if (!resolving) return;
    const timer = window.setTimeout(() => {
      setResolving(false);
      if (battle?.result === "victory") setScreen("reward");
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450);
    return () => window.clearTimeout(timer);
  }, [resolving, battle]);

  function start() {
    const next = createBattle(career, roster, 42 + step, items, step + 1);
    if (supplies) next.inventory = { ...supplies };
    setBattle(next);
    setTarget(0);
    setSelected(null);
    setScreen("combat");
  }

  function act() {
    if (!battle || resolving) return;
    const next = resolveRound(battle, battle.player.skipTurn ? null : selected, target, registry);
    setBattle(next);
    setResolving(true);
    setSelected(null);
    setImpact((value) => value + 1);
    if (next.enemies[target]?.hp <= 0) setTarget(Math.max(0, next.enemies.findIndex((enemy) => enemy.hp > 0)));
    if (next.result === "victory") {
      setXp((value) => value + encounter.rewards.xp);
      const nextSupplies = { ...next.inventory };
      for (const id of encounter.rewards.items ?? []) if (items[id].use) nextSupplies[id] = (nextSupplies[id] ?? 0) + 1;
      setSupplies(nextSupplies);
    }
  }

  function reset() {
    setScreen("career"); setStep(0); setXp(0); setBattle(null); setSelected(null); setSupplies(null); setResolving(false);
  }

  return (
    <main className="slice-app">
      <header className="slice-header">
        <div className="slice-brand"><Swords size={24} aria-hidden="true" /><span>ECHO<span className="slice-brand-mark">//</span>BRUCH</span></div>
        <span className="slice-build">DIE REISE ZUR NORDWACHT</span>
        <button className="slice-icon-button" type="button" onClick={reset} disabled={resolving} title="Neue Reise" aria-label="Neue Reise"><RotateCcw size={18} /></button>
      </header>

      <div className="slice-shell">
        <nav className="slice-route" aria-label="Begegnungen">
          {encounters.map((entry, index) => <span className={index === step ? "current" : index < step ? "complete" : ""} key={entry.id} aria-current={index === step ? "step" : undefined}><span>{index < step ? <Check size={12} /> : `0${index + 1}`}</span><span>{entry.name}</span></span>)}
        </nav>

        {screen === "career" ? <>
          <div className="slice-title"><p>DEINE REISE BEGINNT</p><h1>Wer zieht zur Nordwacht?</h1><span>Wähle eine Karriere</span></div>
          <section className="slice-careers" aria-label="Karrierewahl">
            {Object.values(careers).map((entry) => <button type="button" key={entry.id} className={`slice-career ${careerId === entry.id ? "selected" : ""}`} onClick={() => setCareer(entry.id)} aria-pressed={careerId === entry.id}>
              <div className={`slice-portrait ${entry.id}`}><svg viewBox="0 0 200 255" aria-hidden="true"><g transform="translate(20 3)"><Figure kind={entry.id} /></g></svg><span>{careerId === entry.id ? <Check size={18} /> : <Sword size={18} />}</span></div>
              <div className="slice-career-copy"><h2>{entry.name}</h2><p>{entry.description}</p><div className="slice-stats"><span><Heart size={14} />{entry.base_stats.hp} LP</span><span><Sword size={14} />{entry.base_stats.attack}</span><span><Shield size={14} />{entry.base_stats.defense}</span></div></div>
            </button>)}
          </section>
          <footer className="slice-selection-footer"><div><span>STARTFÄHIGKEITEN</span><p>{career.starting_skills.map((id) => skills[id].name).join(" · ")}</p></div><button className="slice-button primary" type="button" onClick={() => setScreen("encounter")}>Mit {career.name} aufbrechen <ArrowRight size={18} /></button></footer>
        </> : <>
          <div className="slice-title compact"><div><p>BEGEGNUNG {step + 1} / {encounters.length}</p><h1>{encounter.name}</h1></div><span>{screen === "combat" && battle ? `RUNDE ${battle.round}` : `${xp} EP`}</span></div>
          <section className="slice-stage" aria-label="Schlachtfeld">
            <Scene career={careerId} opponents={encounter.enemies} selected={target} encounter={step} impact={impact} defeated={battle && screen === "combat" ? battle.enemies.map((enemy) => enemy.hp <= 0) : []} />
            <div className="slice-stage-caption"><span>{career.name}</span><span>{roster.map((enemy) => enemy.name).join(" + ")}</span></div>
          </section>

          {screen === "encounter" && <section className="slice-encounter"><div><p className="slice-eyebrow">VOR DER BEGEGNUNG</p><h2>{roster.map((enemy) => enemy.name).join(" & ")}</h2><p>{encounter.description}</p><p className="slice-muted">Belohnung: {encounter.rewards.xp} EP · {encounter.rewards.items?.map((id) => items[id].name).join(", ")}</p></div><div className="slice-encounter-buttons"><button className="slice-button" type="button" onClick={() => setScreen("career")}><ArrowLeft size={16} /> Karriere</button><button className="slice-button primary" type="button" onClick={start}><Swords size={17} /> Begegnung beginnen</button></div></section>}

          {screen === "combat" && battle && <>
            <section className="slice-combatants"><ActorPanel actor={battle.player} /><div className="slice-targets">{battle.enemies.map((enemy, index) => <div key={`${enemy.id}-${index}`} className={`slice-target ${target === index ? "selected" : ""}`}><ActorPanel actor={enemy} /><button type="button" aria-pressed={target === index} disabled={enemy.hp <= 0 || resolving} onClick={() => setTarget(index)} className="slice-target-label">{enemy.hp <= 0 ? "Besiegt" : target === index ? "Ziel ausgewählt" : "Als Ziel wählen"}</button></div>)}</div></section>
            {battle.player.skipTurn && <p className="slice-warning" role="status">Betäubt: Die nächste Bestätigung überspringt deinen Zug.</p>}
            {battle.enemies.filter((enemy) => enemy.hp > 0 && enemy.pendingSkill).map((enemy) => <p className="slice-warning" role="status" key={enemy.id}>{enemy.name}: {skills[enemy.pendingSkill!].name} in der nächsten Runde.</p>)}
            {battle.result === "defeat" ? <section className="slice-result"><h2>Die Nordwacht muss warten.</h2><p>Deine Reise endet hier. Ein neuer Versuch beginnt mit frischen Ressourcen.</p><button type="button" className="slice-button primary" onClick={start}><RotateCcw size={17} /> Begegnung wiederholen</button></section> : <section className="slice-command">
              <div className="slice-action-list"><p className="slice-eyebrow">DEINE AKTION</p><div className="slice-actions">{battle.player.skills.filter((id) => !skills[id].trigger).map((id) => { const action = skills[id]; const blocked = unavailable(battle.player, action); return <button key={id} type="button" disabled={resolving} aria-pressed={selected === id} className={`slice-action action-${action.type} ${blocked ? "unavailable" : ""} ${selected === id ? "selected" : ""}`} onClick={() => setSelected(id)}><span>{action.type === "defense" ? <Shield size={20} /> : action.type === "control" ? <Sparkles size={20} /> : <Sword size={20} />}</span><strong>{action.name}</strong><small>{blocked ?? Object.entries(action.cost).map(([resource, value]) => `${value} ${resource === "focus" ? "Fokus" : "Ausdauer"}`).join(" · ")}</small></button>; })}<button type="button" disabled={resolving} aria-pressed={selected === null} className={`slice-action action-rest ${selected === null ? "selected" : ""}`} onClick={() => setSelected(null)}><span><Wind size={20} /></span><strong>Kraft sammeln</strong><small>+6 Ausdauer · +4 Fokus</small></button></div>
                {battle.player.skills.filter((id) => skills[id].trigger).map((id) => <p key={id} className="slice-reaction"><Sword size={14} />{skills[id].name} · automatisch nach Nahkampftreffer · {unavailable(battle.player, skills[id]) ?? "bereit"}</p>)}
                <div className="slice-consumables">{Object.entries(battle.inventory).filter(([, count]) => count > 0).map(([id, count]) => <button type="button" disabled={resolving || battle.player.skipTurn} aria-pressed={selected === `item:${id}`} key={id} className={`slice-supply ${selected === `item:${id}` ? "selected" : ""}`} onClick={() => setSelected(`item:${id}`)}><Package size={15} />{items[id].name}<span>×{count}</span></button>)}</div>
              </div>
              <div className="slice-preview"><div className="slice-preview-heading"><p className="slice-eyebrow">VORSCHAU</p><button type="button" className="slice-cancel" disabled={resolving || !selected} onClick={() => setSelected(null)} aria-label="Auswahl abbrechen" title="Auswahl abbrechen"><X size={16} /></button></div><h3>{battle.player.skipTurn ? "Betäubt" : skill?.name ?? item?.name ?? "Kraft sammeln"}</h3><p>{battle.player.skipTurn ? "Dein Zug entfällt. Danach handeln die Gegner." : skill?.description ?? item?.description ?? "Ressourcen auffüllen. Danach handeln die Gegner."}</p>{skill && !battle.player.skipTurn && <p className="slice-outcome">{recipient?.name}{damage > 0 ? ` · ${damage} Schaden` : " · Statuswirkung"}</p>}{item?.use && <p className="slice-outcome">{item.use.heal_hp ? `+${item.use.heal_hp} LP ` : ""}{item.use.restore_focus ? `+${item.use.restore_focus} Fokus ` : ""}{item.use.next_attack_bonus ? `+${item.use.next_attack_bonus} auf den nächsten Angriff` : ""}</p>}<button type="button" className="slice-button primary" disabled={Boolean(reason) || resolving} onClick={act}>{resolving ? "Auflösung …" : reason ?? (battle.player.skipTurn ? "Zug aussetzen" : "Aktion bestätigen")}<ArrowRight size={16} /></button></div>
            </section>}
            <details className="slice-log"><summary>Kampfprotokoll · Runde {battle.round}</summary><div aria-live="polite">{battle.log.map((entry, index) => <p key={`${battle.round}-${index}`}>{entry}</p>)}</div></details>
          </>}

          {screen === "reward" && <section className="slice-result"><p className="slice-eyebrow">BEGEGNUNG BESTANDEN</p><h2>Ein Schritt näher.</h2><div className="slice-reward"><span><Sparkles size={20} /> +{encounter.rewards.xp} EP</span>{encounter.rewards.items?.map((id) => <span key={id}><Package size={18} />{items[id].name}</span>)}</div><p>Gesammelt: {xp} EP.</p><button type="button" className="slice-button primary" onClick={() => setScreen(step === encounters.length - 1 ? "finish" : "progress")}>Reise fortsetzen <ArrowRight size={17} /></button></section>}
          {screen === "progress" && <section className="slice-result"><p className="slice-eyebrow">KARRIEREFORTSCHRITT</p><h2>{career.name} · Stufe {step + 2}</h2><div className="slice-growth">{Object.entries(career.stat_growth).filter(([, value]) => value > 0).map(([key, value]) => <span key={key}>+{value} {statName(key)}</span>)}</div><p>Lebenspunkte und Ressourcen vollständig wiederhergestellt.</p>{step === 0 && <p>Neu: {career.skill_pool.filter((id) => !career.starting_skills.includes(id)).map((id) => skills[id].name).join(", ")}</p>}<button type="button" className="slice-button primary" onClick={() => { setStep(step + 1); setScreen("encounter"); }}>Nächste Begegnung <ArrowRight size={17} /></button></section>}
          {screen === "finish" && <section className="slice-result"><p className="slice-eyebrow">REISE ABGESCHLOSSEN</p><h2>Die Nordwacht gehört dir.</h2><p>Vier Begegnungen · {xp} EP · {career.name}</p><button type="button" className="slice-button primary" onClick={reset}>Neue Reise <RotateCcw size={17} /></button></section>}
        </>}
        <footer className="slice-footnote"><span>ECHO//BRUCH</span><span>Nordwacht · {screen === "career" ? "Aufbruch" : `Stufe ${step + 1}`}</span></footer>
      </div>
    </main>
  );
}

function ActorPanel({ actor }: { actor: Actor }) {
  return <div className="slice-actor"><div className="slice-actor-heading"><strong>{actor.name}</strong><span><Heart size={13} />{actor.hp} / {actor.stats.hp}</span></div><div className="slice-meter" role="meter" aria-label={`${actor.name} Lebenspunkte`} aria-valuenow={actor.hp} aria-valuemin={0} aria-valuemax={actor.stats.hp}><span style={{ width: `${actor.hp / actor.stats.hp * 100}%` }} /></div><div className="slice-actor-resources">{actor.stats.stamina !== undefined && <span><Flame size={13} />{actor.stamina}/{actor.stats.stamina} Ausdauer</span>}{actor.stats.focus !== undefined && <span><Sparkles size={13} />{actor.focus}/{actor.stats.focus} Fokus</span>}</div>{actor.nextAttackBonus > 0 && <p className="slice-reaction">Nächster Angriff: +{actor.nextAttackBonus}</p>}<div className="slice-effects">{actor.effects.map((effect) => <details key={effect.id}><summary><StatusSymbol id={effect.id} />{statuses[effect.id]?.name} · {effect.duration} R · ×{effect.stacks}</summary><p>{statuses[effect.id]?.description}</p></details>)}</div></div>;
}

function StatusSymbol({ id }: { id: string }) {
  return id === "guarded" ? <Shield size={13} /> : id === "bleeding" ? <Heart size={13} /> : id === "chilled" ? <Wind size={13} /> : <Sparkles size={13} />;
}

function statName(key: string) {
  return ({ hp: "LP", stamina: "Ausdauer", focus: "Fokus", attack: "Angriff", defense: "Verteidigung", magic: "Magie", speed: "Tempo" } as Record<string, string>)[key] ?? key;
}