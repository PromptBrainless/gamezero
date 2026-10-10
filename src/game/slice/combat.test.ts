import assert from "node:assert/strict";
import { test } from "node:test";
import { createBattle, preview, resolveRound, unavailable, type Career, type Registry } from "./combat.ts";

const career: Career = { id: "test", name: "Held", description: "", base_stats: { hp: 30, attack: 10, defense: 4, magic: 0, speed: 4, stamina: 10 }, starting_skills: ["cut"], skill_pool: ["cut"], starting_items: [] };
const registry: Registry = { skills: { cut: { id: "cut", name: "Schnitt", description: "", type: "attack", target: "enemy", cost: { stamina: 3 }, cooldown: 1, damage: { scaling_stat: "attack", multiplier: 1, flat: 2 } } }, statuses: {} };
const enemy = { id: "enemy", name: "Gegner", base_stats: { hp: 18, attack: 4, defense: 2, magic: 0, speed: 3 }, skills: ["cut"] };

test("preview, resource cost and cooldown are resolved without mutating input", () => {
  const battle = createBattle(career, [enemy]);
  assert.equal(preview(battle.player, battle.enemies[0], registry.skills.cut, registry), 10);
  const next = resolveRound(battle, "cut", 0, registry);
  assert.equal(next.player.stamina, 10);
  assert.equal(next.enemies[0].hp, 8);
  assert.equal(battle.enemies[0].hp, 18);
  assert.equal(unavailable(next.player, registry.skills.cut), "Abklingzeit: 1 Runden");
  assert.equal(resolveRound(next, "cut", 0, registry), next);
});

test("combat events are ordered, typed, and keep sequence numbers across rounds", () => {
  const battle = createBattle(career, [enemy]);
  const zeroCooldownRegistry: Registry = { ...registry, skills: { cut: { ...registry.skills.cut, cooldown: 0 } } };
  const first = resolveRound(battle, "cut", 0, zeroCooldownRegistry);
  assert.deepEqual(first.events.map(({ sequence, turn, type }) => ({ sequence, turn, type })), [
    { sequence: 0, turn: 1, type: "skill_used" },
    { sequence: 1, turn: 1, type: "damage" },
    { sequence: 2, turn: 1, type: "skill_used" },
    { sequence: 3, turn: 1, type: "damage" },
  ]);
  assert.deepEqual(first.events[1], {
    sequence: 1, turn: 1, type: "damage", source_id: "test", target_id: "enemy", amount: 10, cause: "skill", skill_id: "cut",
  });
  const second = resolveRound(first, null, 0, zeroCooldownRegistry);
  assert.deepEqual(second.events.slice(4).map(({ sequence, turn }) => ({ sequence, turn })), [
    { sequence: 4, turn: 2 }, { sequence: 5, turn: 2 },
  ]);
  assert.deepEqual(battle.events, []);
});

test("rest restores bounded resources and victory stops enemy retaliation", () => {
  const battle = createBattle(career, [{ ...enemy, base_stats: { ...enemy.base_stats, hp: 5 } }]);
  const win = resolveRound(battle, "cut", 0, registry);
  assert.equal(win.result, "victory");
  assert.equal(win.player.hp, 30);
  assert.equal(win.events.at(-1)?.type, "combat_ended");
  assert.equal(resolveRound(win, null, 0, registry), win);
  const rested = resolveRound(createBattle(career, [enemy]), null, 0, registry);
  assert.equal(rested.player.stamina, 10);
});

test("starting equipment adds canonical stat modifiers", () => {
  const battle = createBattle({ ...career, starting_items: ["sword"] }, [enemy], 42, { sword: { stat_modifiers: { attack: 3 } } });
  assert.equal(battle.player.stats.attack, 13);
  assert.equal(career.base_stats.attack, 10);
});

test("player stun skips the next action without spending resources", () => {
  const battle = createBattle(career, [enemy]);
  battle.player.skipTurn = true;
  const next = resolveRound(battle, "cut", 0, registry);
  assert.equal(next.enemies[0].hp, enemy.base_stats.hp);
  assert.equal(next.player.stamina, 10);
  assert.equal(next.player.skipTurn, false);
  assert.match(next.log[0], /verliert diesen Zug/);
});

test("levels apply career growth and unlock the skill pool", () => {
  const grown = createBattle({ ...career, stat_growth: { hp: 5, attack: 1 }, skill_pool: ["cut", "guard"] }, [enemy], 42, {}, 3);
  assert.equal(grown.player.stats.hp, 40);
  assert.equal(grown.player.stats.attack, 12);
  assert.deepEqual(grown.player.skills, ["cut", "guard"]);
});

test("boss telegraphs delay attacks and phase modifiers apply only once", () => {
  const boss = { ...enemy, base_stats: { ...enemy.base_stats, hp: 100 }, phases: [
    { name: "Formation", hp_threshold: 1, skills: ["cut"], telegraphs: [{ skill: "cut", warning_turns: 1 }] },
    { name: "Letztes Gefecht", hp_threshold: .5, skills: ["cut"], on_enter: [{ stat_modifier: { attack: 3 } }], telegraphs: [{ skill: "cut", warning_turns: 1 }] },
  ] };
  const battle = createBattle(career, [boss]);
  battle.enemies[0].hp = 45;
  const warned = resolveRound(battle, null, 0, registry);
  assert.equal(warned.enemies[0].pendingSkill, "cut");
  assert.equal(warned.player.hp, 30);
  assert.equal(warned.enemies[0].stats.attack, 7);
  const hit = resolveRound(warned, null, 0, registry);
  assert.equal(hit.enemies[0].pendingSkill, null);
  assert.equal(hit.player.hp, 25);
  assert.equal(hit.enemies[0].stats.attack, 7);
});

test("riposte fires after a melee hit but cannot be selected as a normal action", () => {
  const reactionRegistry: Registry = { ...registry, skills: {
    cut: { ...registry.skills.cut, tags: ["melee"] },
    riposte: { ...registry.skills.cut, id: "riposte", name: "Riposte", trigger: "after_melee_hit" },
  } };
  const battle = createBattle({ ...career, starting_skills: ["cut", "riposte"] }, [enemy]);
  assert.equal(resolveRound(battle, "riposte", 0, reactionRegistry), battle);
  const next = resolveRound(battle, null, 0, reactionRegistry);
  assert.equal(next.enemies[0].hp, 8);
  assert.ok(next.log.some((entry) => entry.includes("Riposte")));
});

test("whetstone is consumed and its bonus applies exactly once", () => {
  const itemRegistry: Registry = { ...registry, items: { stone: { id: "stone", name: "Schleifstein", use: { next_attack_bonus: 4 } } } };
  const battle = createBattle({ ...career, starting_items: ["stone"] }, [{ ...enemy, skills: [], base_stats: { ...enemy.base_stats, hp: 100 } }], 42, itemRegistry.items);
  const prepared = resolveRound(battle, "item:stone", 0, itemRegistry);
  assert.equal(prepared.inventory.stone, 0);
  assert.equal(preview(prepared.player, prepared.enemies[0], registry.skills.cut, itemRegistry), 14);
  assert.equal(resolveRound(prepared, "item:stone", 0, itemRegistry), prepared);
  const hit = resolveRound(prepared, "cut", 0, itemRegistry);
  assert.equal(hit.enemies[0].hp, 86);
  assert.equal(hit.player.nextAttackBonus, 0);
});