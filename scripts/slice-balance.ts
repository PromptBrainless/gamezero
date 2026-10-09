import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createBattle, preview, resolveRound, unavailable, type Career, type Encounter, type Enemy, type Registry, type Stats } from "../src/game/slice/combat.ts";

function load<Type extends { id: string }>(type: string): Record<string, Type> {
  const directory = fileURLToPath(new URL(`../data/${type}/`, import.meta.url));
  return Object.fromEntries(readdirSync(directory).filter((file) => file.endsWith(".json")).map((file) => {
    const entry = JSON.parse(readFileSync(`${directory}/${file}`, "utf8")) as Type;
    return [entry.id, entry];
  }));
}

const careers = load<Career>("careers");
const enemies = { ...load<Enemy>("enemies"), ...load<Enemy>("bosses") };
const encounters = Object.values(load<Encounter>("encounters")).sort((left, right) => left.order - right.order);
const registry: Registry = { skills: load("skills"), statuses: load("statuses") };
const equipment = load<{ id: string; stat_modifiers?: Partial<Stats> }>("items");
const seeds = Number(process.argv[2] ?? 100);
const results = [];

for (const career of Object.values(careers)) {
  for (const encounter of encounters) {
    let victories = 0;
    let rounds = 0;
    let remainingHealth = 0;
    for (let seed = 1; seed <= seeds; seed += 1) {
      let battle = createBattle(career, encounter.enemies.map((id) => enemies[id]), seed, equipment, encounter.order);
      for (let turn = 0; turn < 120 && !battle.result; turn += 1) {
        const targetIndex = battle.enemies.reduce((best, enemy, index) => enemy.hp > 0 && (battle.enemies[best].hp <= 0 || enemy.hp < battle.enemies[best].hp) ? index : best, 0);
        const target = battle.enemies[targetIndex];
        const options = battle.player.skills.map((id) => registry.skills[id]).filter((skill) => !unavailable(battle.player, skill));
        const ranked = options.map((skill) => {
          let score = preview(battle.player, target, skill, registry);
          for (const effect of skill.applies_statuses ?? []) {
            const definition = registry.statuses[effect.status];
            const tick = Number(definition?.effect.damage_per_turn_per_stack ?? 0);
            score += tick * Math.min(effect.duration, 2) * (effect.chance ?? 1);
            if (definition?.effect.skip_turn) score += 3 * (effect.chance ?? 1);
            if (effect.status === "exposed") score += 2 * (effect.chance ?? 1);
          }
          return { id: skill.id, score };
        }).sort((left, right) => right.score - left.score);
        battle = resolveRound(battle, ranked[0]?.score > 0 ? ranked[0].id : null, targetIndex, registry);
      }
      if (battle.result === "victory") {
        victories += 1;
        rounds += battle.round;
        remainingHealth += battle.player.hp / battle.player.stats.hp;
      }
    }
    results.push({ career: career.name, encounter: encounter.name, seeds, victories, winRate: `${Math.round(victories / seeds * 100)}%`, averageRounds: victories ? +(rounds / victories).toFixed(1) : null, remainingHealth: victories ? `${Math.round(remainingHealth / victories * 100)}%` : null });
  }
}
console.table(results);
console.log("Heuristische Offensive, Stufe = Begegnungsnummer, volle Ressourcen je Begegnung; keine Aussage über optimales menschliches Spiel.");