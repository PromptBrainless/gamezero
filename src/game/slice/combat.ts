export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
  focus?: number;
  stamina?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: string;
  target: string;
  cost: { stamina?: number; focus?: number };
  cooldown: number;
  trigger?: "after_melee_hit";
  tags?: string[];
  damage?: { damage_type?: string; scaling_stat: "attack" | "magic"; multiplier: number; flat: number };
  applies_statuses?: { status: string; duration: number; chance?: number; target?: string }[];
  removes_statuses?: string[];
}

export interface Status {
  id: string;
  name: string;
  description: string;
  max_stacks: number;
  effect: Record<string, number | string | boolean>;
}

export interface Career {
  id: string;
  name: string;
  description: string;
  base_stats: Stats;
  stat_growth?: Partial<Stats>;
  starting_skills: string[];
  skill_pool: string[];
  starting_items: string[];
}

export interface Enemy {
  id: string;
  name: string;
  base_stats: Stats;
  skills?: string[];
  phases?: { name: string; hp_threshold: number; skills: string[]; telegraphs?: { skill: string; warning_turns: number }[]; on_enter?: { apply_status?: string; duration?: number; stat_modifier?: Partial<Stats> }[] }[];
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  slot?: string;
  stat_modifiers?: Partial<Stats>;
  effects?: Record<string, number>[];
  use?: {
    heal_hp?: number;
    restore_focus?: number;
    next_attack_bonus?: number;
    removes_statuses?: string[];
    applies_statuses?: { status: string; duration: number; chance?: number; target?: string }[];
  };
}

export interface Encounter {
  id: string;
  name: string;
  description: string;
  type: string;
  order: number;
  enemies: string[];
  rewards: { xp: number; items?: string[] };
}

export interface Actor {
  id: string;
  name: string;
  stats: Stats;
  hp: number;
  focus: number;
  stamina: number;
  skills: string[];
  cooldowns: Record<string, number>;
  effects: { id: string; duration: number; stacks: number }[];
  skipTurn: boolean;
  phaseIndex: number;
  pendingSkill: string | null;
  nextAttackBonus: number;
  equipmentEffects: Record<string, number>;
  phases?: Enemy["phases"];
}

export interface Battle {
  player: Actor;
  enemies: Actor[];
  round: number;
  seed: number;
  events: CombatEvent[];
  log: string[];
  result: "victory" | "defeat" | null;
  inventory: Record<string, number>;
}

export type CombatEvent =
  | { sequence: number; turn: number; type: "skill_used"; source_id: string; target_id: string; skill_id: string }
  | { sequence: number; turn: number; type: "item_used"; source_id: string; item_id: string }
  | { sequence: number; turn: number; type: "damage"; source_id: string; target_id: string; amount: number; cause: "skill" | "status"; skill_id?: string; status_id?: string }
  | { sequence: number; turn: number; type: "status_applied"; source_id: string; target_id: string; status_id: string; duration: number; stacks: number }
  | { sequence: number; turn: number; type: "status_removed"; source_id: string; target_id: string; status_id: string }
  | { sequence: number; turn: number; type: "turn_skipped"; actor_id: string; reason: "stunned" }
  | { sequence: number; turn: number; type: "phase_changed"; actor_id: string; phase_index: number; phase_name: string }
  | { sequence: number; turn: number; type: "telegraph"; actor_id: string; skill_id: string; warning_turns: number }
  | { sequence: number; turn: number; type: "combat_ended"; result: "victory" | "defeat" };

type CombatEventDetail = CombatEvent extends infer Event
  ? Event extends CombatEvent
    ? Omit<Event, "sequence" | "turn">
    : never
  : never;

function emitEvent(battle: Battle, detail: CombatEventDetail) {
  battle.events.push({ ...detail, sequence: battle.events.length, turn: battle.round } as CombatEvent);
}

export interface Registry {
  skills: Record<string, Skill>;
  statuses: Record<string, Status>;
  items?: Record<string, Item>;
}

function actor(record: Enemy, skills: string[]): Actor {
  return {
    id: record.id, name: record.name, stats: { ...record.base_stats },
    hp: record.base_stats.hp, focus: record.base_stats.focus ?? 0,
    stamina: record.base_stats.stamina ?? 0, skills, cooldowns: {}, effects: [], skipTurn: false,
    phases: record.phases, phaseIndex: 0, pendingSkill: null, nextAttackBonus: 0, equipmentEffects: {},
  };
}

export function createBattle(career: Career, enemies: Enemy[], seed = 42, equipment: Record<string, Omit<Item, "id" | "name">> = {}, level = 1, rewardItems: string[] = []): Battle {
  const stats = { ...career.base_stats };
  for (const [key, growth] of Object.entries(career.stat_growth ?? {})) {
    const statKey = key as keyof Stats;
    if (statKey in stats) stats[statKey] = (stats[statKey] ?? 0) + growth * (level - 1);
  }
  for (const id of career.starting_items) {
    for (const [key, value] of Object.entries(equipment[id]?.stat_modifiers ?? {})) {
      const statKey = key as keyof Stats;
      if (statKey in stats) stats[statKey] = (stats[statKey] ?? 0) + value;
    }
  }
  const player = actor({ ...career, base_stats: stats }, level > 1 ? career.skill_pool : career.starting_skills);
  for (const id of career.starting_items) {
    for (const effect of equipment[id]?.effects ?? []) Object.assign(player.equipmentEffects, effect);
  }
  const inventory: Record<string, number> = {};
  for (const id of [...career.starting_items, ...rewardItems]) {
    if (equipment[id]?.use) inventory[id] = (inventory[id] ?? 0) + 1;
  }
  return {
    player,
    enemies: enemies.map((enemy) => actor(enemy, enemy.skills ?? enemy.phases?.[0].skills ?? [])),
    round: 1, seed, events: [], log: ["Die Begegnung beginnt."], result: null, inventory,
  };
}

export function unavailable(player: Actor, skill: Skill): string | null {
  if (player.skipTurn) return "Betäubt: Zug aussetzen";
  if ((player.cooldowns[skill.id] ?? 0) > 0) return `Abklingzeit: ${player.cooldowns[skill.id]} Runden`;
  if ((skill.cost.stamina ?? 0) > player.stamina) return "Nicht genug Ausdauer";
  if ((skill.cost.focus ?? 0) > player.focus) return "Nicht genug Fokus";
  return null;
}

function stat(actor: Actor, key: keyof Stats, registry: Registry): number {
  return Math.max(0, (actor.stats[key] ?? 0) + actor.effects.reduce((sum, effect) =>
    sum + Number(registry.statuses[effect.id]?.effect[`${key}_modifier`] ?? 0) * effect.stacks, 0));
}

export function preview(source: Actor, target: Actor, skill: Skill, registry: Registry): number {
  if (!skill.damage) return 0;
  const raw = Math.max(1, skill.damage.flat + source.nextAttackBonus + stat(source, skill.damage.scaling_stat, registry) * skill.damage.multiplier - stat(target, "defense", registry));
  const equipmentModifier = skill.damage.damage_type !== "physical" ? target.equipmentEffects.magic_damage_taken_multiplier ?? 1 : 1;
  const modifier = target.effects.reduce((value, effect) => value * Number(registry.statuses[effect.id]?.effect.damage_taken_multiplier ?? 1), equipmentModifier);
  return Math.max(1, Math.round(raw * modifier));
}

function random(battle: Battle): number {
  battle.seed = (Math.imul(battle.seed, 1664525) + 1013904223) >>> 0;
  return battle.seed / 4294967296;
}

function executeSkill(battle: Battle, source: Actor, target: Actor, skill: Skill, registry: Registry, pay: boolean) {
  const recipient = skill.target === "self" ? source : target;
  if (pay) {
    source.stamina -= skill.cost.stamina ?? 0;
    source.focus -= skill.cost.focus ?? 0;
  }
  source.cooldowns[skill.id] = skill.cooldown + 1;
  emitEvent(battle, { type: "skill_used", source_id: source.id, target_id: recipient.id, skill_id: skill.id });
  const damage = preview(source, recipient, skill, registry);
  if (skill.damage) source.nextAttackBonus = 0;
  recipient.hp = Math.max(0, recipient.hp - damage);
  if (skill.damage) emitEvent(battle, { type: "damage", source_id: source.id, target_id: recipient.id, amount: damage, cause: "skill", skill_id: skill.id });
  battle.log.push(`${source.name}: ${skill.name}${damage ? ` · ${damage} Schaden an ${recipient.name}` : ""}.`);
  for (const id of skill.removes_statuses ?? []) {
    if (recipient.effects.some((effect) => effect.id === id)) {
      emitEvent(battle, { type: "status_removed", source_id: source.id, target_id: recipient.id, status_id: id });
      recipient.effects = recipient.effects.filter((effect) => effect.id !== id);
    }
  }
  for (const application of skill.applies_statuses ?? []) {
    if (random(battle) > (application.chance ?? 1)) continue;
    const affected = application.target === "self" ? source : application.target === "enemy" ? target : recipient;
    const definition = registry.statuses[application.status];
    if (!definition) continue;
    const existing = affected.effects.find((effect) => effect.id === application.status);
    if (existing) {
      existing.duration = Math.max(existing.duration, application.duration);
      existing.stacks = Math.min(definition.max_stacks, existing.stacks + 1);
    } else affected.effects.push({ id: application.status, duration: application.duration, stacks: 1 });
    emitEvent(battle, { type: "status_applied", source_id: source.id, target_id: affected.id, status_id: application.status, duration: existing?.duration ?? application.duration, stacks: existing?.stacks ?? 1 });
    battle.log.push(`${affected.name}: ${definition.name} (${application.duration} Runden).`);
  }
}

function tick(battle: Battle, actor: Actor, registry: Registry): boolean {
  let skipped = false;
  for (const effect of actor.effects) {
    const definition = registry.statuses[effect.id];
    const damage = Number(definition?.effect.damage_per_turn_per_stack ?? 0) * effect.stacks;
    if (damage > 0) {
      actor.hp = Math.max(0, actor.hp - damage);
      emitEvent(battle, { type: "damage", source_id: actor.id, target_id: actor.id, amount: damage, cause: "status", status_id: effect.id });
      battle.log.push(`${actor.name}: ${damage} Schaden durch ${definition.name}.`);
    }
    if (definition?.effect.skip_turn) skipped = true;
    effect.duration -= 1;
  }
  actor.effects = actor.effects.filter((effect) => effect.duration > 0);
  return skipped;
}

function outcome(battle: Battle): boolean {
  const result = battle.player.hp <= 0 ? "defeat" : battle.enemies.every((enemy) => enemy.hp <= 0) ? "victory" : null;
  if (result && battle.result !== result) emitEvent(battle, { type: "combat_ended", result });
  battle.result = result;
  return battle.result !== null;
}

export function resolveRound(previous: Battle, skillId: string | null, targetIndex: number, registry: Registry): Battle {
  if (previous.result) return previous;
  const itemId = skillId?.startsWith("item:") ? skillId.slice(5) : null;
  const item = itemId ? registry.items?.[itemId] : null;
  if (itemId && (!item?.use || (previous.inventory[itemId] ?? 0) <= 0)) return previous;
  const skill = skillId ? registry.skills[skillId] : null;
  if (skillId && !itemId && (!skill || skill.trigger || !previous.player.skills.includes(skillId) || (!previous.player.skipTurn && unavailable(previous.player, skill)))) return previous;
  const target = previous.enemies[targetIndex];
  if (skill?.target === "enemy" && (!target || target.hp <= 0)) return previous;
  const battle: Battle = structuredClone(previous);
  battle.log = [];
  if (battle.player.skipTurn) {
    battle.player.skipTurn = false;
    emitEvent(battle, { type: "turn_skipped", actor_id: battle.player.id, reason: "stunned" });
    battle.log.push(`${battle.player.name} ist betäubt und verliert diesen Zug.`);
  } else if (item?.use && itemId) {
    battle.inventory[itemId] -= 1;
    emitEvent(battle, { type: "item_used", source_id: battle.player.id, item_id: itemId });
    battle.player.hp = Math.min(battle.player.stats.hp, battle.player.hp + (item.use.heal_hp ?? 0));
    battle.player.focus = Math.min(battle.player.stats.focus ?? 0, battle.player.focus + (item.use.restore_focus ?? 0));
    battle.player.nextAttackBonus += item.use.next_attack_bonus ?? 0;
    for (const id of item.use.removes_statuses ?? []) {
      if (battle.player.effects.some((effect) => effect.id === id)) {
        emitEvent(battle, { type: "status_removed", source_id: battle.player.id, target_id: battle.player.id, status_id: id });
        battle.player.effects = battle.player.effects.filter((effect) => effect.id !== id);
      }
    }
    for (const application of item.use.applies_statuses ?? []) {
      if (random(battle) <= (application.chance ?? 1)) {
        battle.player.effects.push({ id: application.status, duration: application.duration, stacks: 1 });
        emitEvent(battle, { type: "status_applied", source_id: battle.player.id, target_id: battle.player.id, status_id: application.status, duration: application.duration, stacks: 1 });
      }
    }
    battle.log.push(`${battle.player.name} verwendet ${item.name}.`);
  } else if (skill) executeSkill(battle, battle.player, battle.enemies[targetIndex], skill, registry, true);
  else {
    battle.player.stamina = Math.min(battle.player.stats.stamina ?? 0, battle.player.stamina + 6);
    battle.player.focus = Math.min(battle.player.stats.focus ?? 0, battle.player.focus + 4);
    battle.log.push(`${battle.player.name} sammelt Kraft: +6 Ausdauer, +4 Fokus (bis zum Maximum).`);
  }
  if (outcome(battle)) return battle;
  for (const enemy of battle.enemies) {
    if (enemy.hp <= 0) continue;
    for (const id of Object.keys(enemy.cooldowns)) enemy.cooldowns[id] = Math.max(0, enemy.cooldowns[id] - 1);
    const skipped = tick(battle, enemy, registry);
    if (outcome(battle)) return battle;
    if (enemy.hp <= 0) continue;
    if (skipped) {
      emitEvent(battle, { type: "turn_skipped", actor_id: enemy.id, reason: "stunned" });
      battle.log.push(`${enemy.name} ist betäubt.`);
      continue;
    }
    if (enemy.phases) {
      const nextPhase = enemy.phases.reduce((current, entry, index) => enemy.hp / enemy.stats.hp <= entry.hp_threshold ? index : current, 0);
      const phase = enemy.phases[nextPhase];
      enemy.skills = phase.skills;
      if (nextPhase !== enemy.phaseIndex) {
        enemy.phaseIndex = nextPhase;
        emitEvent(battle, { type: "phase_changed", actor_id: enemy.id, phase_index: nextPhase, phase_name: phase.name });
        battle.log.push(`${enemy.name}: ${phase.name}.`);
        for (const action of phase.on_enter ?? []) {
          if (action.apply_status) enemy.effects.push({ id: action.apply_status, duration: action.duration ?? 1, stacks: 1 });
          for (const [key, value] of Object.entries(action.stat_modifier ?? {})) {
            const statKey = key as keyof Stats;
            if (statKey in enemy.stats) enemy.stats[statKey] = (enemy.stats[statKey] ?? 0) + value;
          }
        }
      }
    }
    const availableSkills = enemy.skills.filter((id) => (enemy.cooldowns[id] ?? 0) === 0);
    const enemySkill = registry.skills[enemy.pendingSkill ?? availableSkills[Math.floor(random(battle) * availableSkills.length)]];
    const telegraph = enemy.phases?.[enemy.phaseIndex].telegraphs?.find((entry) => entry.skill === enemySkill?.id);
    if (enemySkill && telegraph && !enemy.pendingSkill) {
      enemy.pendingSkill = enemySkill.id;
      emitEvent(battle, { type: "telegraph", actor_id: enemy.id, skill_id: enemySkill.id, warning_turns: telegraph.warning_turns });
      battle.log.push(`${enemy.name} kündigt ${enemySkill.name} für die nächste Runde an.`);
    } else if (enemySkill) {
      enemy.pendingSkill = null;
      const beforeHit = battle.player.hp;
      executeSkill(battle, enemy, battle.player, enemySkill, registry, false);
      if (battle.player.hp > 0 && battle.player.hp < beforeHit && enemySkill.tags?.includes("melee") && !battle.player.effects.some((effect) => registry.statuses[effect.id]?.effect.skip_turn)) {
        const reaction = battle.player.skills.map((id) => registry.skills[id]).find((entry) => entry.trigger === "after_melee_hit" && !unavailable(battle.player, entry));
        if (reaction) executeSkill(battle, battle.player, enemy, reaction, registry, true);
      }
    }
    else battle.log.push(`${enemy.name} bereitet den nächsten Angriff vor.`);
    if (outcome(battle)) return battle;
  }
  battle.player.skipTurn = tick(battle, battle.player, registry);
  const staminaMultiplier = battle.player.effects.reduce((value, effect) => value * Number(registry.statuses[effect.id]?.effect.stamina_regen_multiplier ?? 1), 1);
  battle.player.stamina = Math.min(battle.player.stats.stamina ?? 0, battle.player.stamina + Math.floor(4 * staminaMultiplier));
  battle.player.focus = Math.min(battle.player.stats.focus ?? 0, battle.player.focus + 3);
  for (const id of Object.keys(battle.player.cooldowns)) battle.player.cooldowns[id] = Math.max(0, battle.player.cooldowns[id] - 1);
  outcome(battle);
  battle.round += 1;
  return battle;
}