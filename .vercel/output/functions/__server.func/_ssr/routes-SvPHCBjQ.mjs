import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Sword, c as RotateCcw, d as Flame, f as Check, i as Swords, l as Package, m as ArrowLeft, n as Wind, o as Sparkles, p as ArrowRight, s as Shield, t as X, u as Heart } from "../_libs/lucide-react.mjs";
import { a as number, c as record, d as union, i as literal, l as strictObject, n as array, r as boolean, s as partialRecord, t as _enum, u as string } from "../_libs/zod.mjs";
import "./router-QHWY2JLP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-SvPHCBjQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function actor(record, skills) {
	return {
		id: record.id,
		name: record.name,
		stats: { ...record.base_stats },
		hp: record.base_stats.hp,
		focus: record.base_stats.focus ?? 0,
		stamina: record.base_stats.stamina ?? 0,
		skills,
		cooldowns: {},
		effects: [],
		skipTurn: false,
		phases: record.phases,
		phaseIndex: 0,
		pendingSkill: null,
		nextAttackBonus: 0,
		equipmentEffects: {}
	};
}
function createBattle(career, enemies, seed = 42, equipment = {}, level = 1, rewardItems = []) {
	const stats = { ...career.base_stats };
	for (const [key, growth] of Object.entries(career.stat_growth ?? {})) {
		const statKey = key;
		if (statKey in stats) stats[statKey] = (stats[statKey] ?? 0) + growth * (level - 1);
	}
	for (const id of career.starting_items) for (const [key, value] of Object.entries(equipment[id]?.stat_modifiers ?? {})) {
		const statKey = key;
		if (statKey in stats) stats[statKey] = (stats[statKey] ?? 0) + value;
	}
	const player = actor({
		...career,
		base_stats: stats
	}, level > 1 ? career.skill_pool : career.starting_skills);
	for (const id of career.starting_items) for (const effect of equipment[id]?.effects ?? []) Object.assign(player.equipmentEffects, effect);
	const inventory = {};
	for (const id of [...career.starting_items, ...rewardItems]) if (equipment[id]?.use) inventory[id] = (inventory[id] ?? 0) + 1;
	return {
		player,
		enemies: enemies.map((enemy) => actor(enemy, enemy.skills ?? enemy.phases?.[0].skills ?? [])),
		round: 1,
		seed,
		log: ["Die Begegnung beginnt."],
		result: null,
		inventory
	};
}
function unavailable(player, skill) {
	if (player.skipTurn) return "Betäubt: Zug aussetzen";
	if ((player.cooldowns[skill.id] ?? 0) > 0) return `Abklingzeit: ${player.cooldowns[skill.id]} Runden`;
	if ((skill.cost.stamina ?? 0) > player.stamina) return "Nicht genug Ausdauer";
	if ((skill.cost.focus ?? 0) > player.focus) return "Nicht genug Fokus";
	return null;
}
function stat(actor, key, registry) {
	return Math.max(0, (actor.stats[key] ?? 0) + actor.effects.reduce((sum, effect) => sum + Number(registry.statuses[effect.id]?.effect[`${key}_modifier`] ?? 0) * effect.stacks, 0));
}
function preview(source, target, skill, registry) {
	if (!skill.damage) return 0;
	const raw = Math.max(1, skill.damage.flat + source.nextAttackBonus + stat(source, skill.damage.scaling_stat, registry) * skill.damage.multiplier - stat(target, "defense", registry));
	const equipmentModifier = skill.damage.damage_type !== "physical" ? target.equipmentEffects.magic_damage_taken_multiplier ?? 1 : 1;
	const modifier = target.effects.reduce((value, effect) => value * Number(registry.statuses[effect.id]?.effect.damage_taken_multiplier ?? 1), equipmentModifier);
	return Math.max(1, Math.round(raw * modifier));
}
function random(battle) {
	battle.seed = Math.imul(battle.seed, 1664525) + 1013904223 >>> 0;
	return battle.seed / 4294967296;
}
function useSkill(battle, source, target, skill, registry, pay) {
	const recipient = skill.target === "self" ? source : target;
	if (pay) {
		source.stamina -= skill.cost.stamina ?? 0;
		source.focus -= skill.cost.focus ?? 0;
	}
	source.cooldowns[skill.id] = skill.cooldown + 1;
	const damage = preview(source, recipient, skill, registry);
	if (skill.damage) source.nextAttackBonus = 0;
	recipient.hp = Math.max(0, recipient.hp - damage);
	battle.log.push(`${source.name}: ${skill.name}${damage ? ` · ${damage} Schaden an ${recipient.name}` : ""}.`);
	for (const id of skill.removes_statuses ?? []) recipient.effects = recipient.effects.filter((effect) => effect.id !== id);
	for (const application of skill.applies_statuses ?? []) {
		if (random(battle) > (application.chance ?? 1)) continue;
		const affected = application.target === "self" ? source : application.target === "enemy" ? target : recipient;
		const definition = registry.statuses[application.status];
		if (!definition) continue;
		const existing = affected.effects.find((effect) => effect.id === application.status);
		if (existing) {
			existing.duration = Math.max(existing.duration, application.duration);
			existing.stacks = Math.min(definition.max_stacks, existing.stacks + 1);
		} else affected.effects.push({
			id: application.status,
			duration: application.duration,
			stacks: 1
		});
		battle.log.push(`${affected.name}: ${definition.name} (${application.duration} Runden).`);
	}
}
function tick(battle, actor, registry) {
	let skipped = false;
	for (const effect of actor.effects) {
		const definition = registry.statuses[effect.id];
		const damage = Number(definition?.effect.damage_per_turn_per_stack ?? 0) * effect.stacks;
		if (damage > 0) {
			actor.hp = Math.max(0, actor.hp - damage);
			battle.log.push(`${actor.name}: ${damage} Schaden durch ${definition.name}.`);
		}
		if (definition?.effect.skip_turn) skipped = true;
		effect.duration -= 1;
	}
	actor.effects = actor.effects.filter((effect) => effect.duration > 0);
	return skipped;
}
function outcome(battle) {
	battle.result = battle.player.hp <= 0 ? "defeat" : battle.enemies.every((enemy) => enemy.hp <= 0) ? "victory" : null;
	return battle.result !== null;
}
function resolveRound(previous, skillId, targetIndex, registry) {
	if (previous.result) return previous;
	const itemId = skillId?.startsWith("item:") ? skillId.slice(5) : null;
	const item = itemId ? registry.items?.[itemId] : null;
	if (itemId && (!item?.use || (previous.inventory[itemId] ?? 0) <= 0)) return previous;
	const skill = skillId ? registry.skills[skillId] : null;
	if (skillId && !itemId && (!skill || skill.trigger || !previous.player.skills.includes(skillId) || !previous.player.skipTurn && unavailable(previous.player, skill))) return previous;
	const target = previous.enemies[targetIndex];
	if (skill?.target === "enemy" && (!target || target.hp <= 0)) return previous;
	const battle = structuredClone(previous);
	battle.log = [];
	if (battle.player.skipTurn) {
		battle.player.skipTurn = false;
		battle.log.push(`${battle.player.name} ist betäubt und verliert diesen Zug.`);
	} else if (item?.use && itemId) {
		battle.inventory[itemId] -= 1;
		battle.player.hp = Math.min(battle.player.stats.hp, battle.player.hp + (item.use.heal_hp ?? 0));
		battle.player.focus = Math.min(battle.player.stats.focus ?? 0, battle.player.focus + (item.use.restore_focus ?? 0));
		battle.player.nextAttackBonus += item.use.next_attack_bonus ?? 0;
		battle.player.effects = battle.player.effects.filter((effect) => !item.use?.removes_statuses?.includes(effect.id));
		for (const application of item.use.applies_statuses ?? []) if (random(battle) <= (application.chance ?? 1)) battle.player.effects.push({
			id: application.status,
			duration: application.duration,
			stacks: 1
		});
		battle.log.push(`${battle.player.name} verwendet ${item.name}.`);
	} else if (skill) useSkill(battle, battle.player, battle.enemies[targetIndex], skill, registry, true);
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
			battle.log.push(`${enemy.name} ist betäubt.`);
			continue;
		}
		if (enemy.phases) {
			const nextPhase = enemy.phases.reduce((current, entry, index) => enemy.hp / enemy.stats.hp <= entry.hp_threshold ? index : current, 0);
			const phase = enemy.phases[nextPhase];
			enemy.skills = phase.skills;
			if (nextPhase !== enemy.phaseIndex) {
				enemy.phaseIndex = nextPhase;
				battle.log.push(`${enemy.name}: ${phase.name}.`);
				for (const action of phase.on_enter ?? []) {
					if (action.apply_status) enemy.effects.push({
						id: action.apply_status,
						duration: action.duration ?? 1,
						stacks: 1
					});
					for (const [key, value] of Object.entries(action.stat_modifier ?? {})) {
						const statKey = key;
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
			battle.log.push(`${enemy.name} kündigt ${enemySkill.name} für die nächste Runde an.`);
		} else if (enemySkill) {
			enemy.pendingSkill = null;
			const beforeHit = battle.player.hp;
			useSkill(battle, enemy, battle.player, enemySkill, registry, false);
			if (battle.player.hp > 0 && battle.player.hp < beforeHit && enemySkill.tags?.includes("melee") && !battle.player.effects.some((effect) => registry.statuses[effect.id]?.effect.skip_turn)) {
				const reaction = battle.player.skills.map((id) => registry.skills[id]).find((entry) => entry.trigger === "after_melee_hit" && !unavailable(battle.player, entry));
				if (reaction) useSkill(battle, battle.player, enemy, reaction, registry, true);
			}
		} else battle.log.push(`${enemy.name} bereitet den nächsten Angriff vor.`);
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
var duelist_default = "{\n  \"id\": \"duelist\",\n  \"name\": \"Duellant\",\n  \"role\": \"fast_precision\",\n  \"description\": \"Schlanker Klingenkämpfer: hohe Initiative, Präzision und Konter.\",\n  \"base_stats\": {\n    \"hp\": 44,\n    \"focus\": 26,\n    \"stamina\": 34,\n    \"attack\": 8,\n    \"defense\": 3,\n    \"magic\": 1,\n    \"speed\": 9,\n    \"crit_chance\": 0.12\n  },\n  \"stat_growth\": {\n    \"hp\": 5,\n    \"focus\": 2,\n    \"stamina\": 2,\n    \"attack\": 1,\n    \"defense\": 0,\n    \"magic\": 0,\n    \"speed\": 1\n  },\n  \"starting_skills\": [\n    \"riposte\",\n    \"precise_thrust\"\n  ],\n  \"skill_pool\": [\n    \"riposte\",\n    \"precise_thrust\",\n    \"quick_feint\"\n  ],\n  \"starting_items\": [\n    \"rapier\",\n    \"leather_jerkin\",\n    \"bandage_roll\"\n  ],\n  \"reaction\": \"parry\",\n  \"visual\": {\n    \"silhouette\": \"slim_sideways\",\n    \"accent_color\": \"#d9b44a\"\n  }\n}\n";
var mercenary_default = "{\n  \"id\": \"mercenary\",\n  \"name\": \"Söldner\",\n  \"role\": \"frontline_bruiser\",\n  \"description\": \"Ein standhafter Frontkämpfer, der Gegner mit Schild und Klinge unter Druck setzt.\",\n  \"base_stats\": {\n    \"hp\": 60,\n    \"stamina\": 30,\n    \"focus\": 20,\n    \"attack\": 7,\n    \"defense\": 4,\n    \"magic\": 0,\n    \"speed\": 4,\n    \"crit_chance\": 0.05\n  },\n  \"stat_growth\": {\n    \"hp\": 7,\n    \"stamina\": 3,\n    \"focus\": 1,\n    \"attack\": 1,\n    \"defense\": 0,\n    \"magic\": 0,\n    \"speed\": 0\n  },\n  \"starting_skills\": [\n    \"shield_bash\",\n    \"hold_the_line\"\n  ],\n  \"skill_pool\": [\n    \"shield_bash\",\n    \"hold_the_line\",\n    \"rending_cut\"\n  ],\n  \"starting_items\": [\n    \"iron_sword\",\n    \"buckler\",\n    \"leather_jerkin\"\n  ],\n  \"reaction\": \"brace\",\n  \"visual\": {\n    \"silhouette\": \"broad_shield_forward\",\n    \"accent_color\": \"#8c5a3c\"\n  }\n}\n";
var scholar_mage_default = "{\n  \"id\": \"scholar_mage\",\n  \"name\": \"Gelehrtenmagier\",\n  \"role\": \"control_caster\",\n  \"description\": \"Ein fokussierter Zauberwirker, der Gegner mit arkanem Schaden und Frost kontrolliert.\",\n  \"base_stats\": {\n    \"hp\": 38,\n    \"focus\": 50,\n    \"stamina\": 22,\n    \"attack\": 2,\n    \"defense\": 2,\n    \"magic\": 9,\n    \"speed\": 5,\n    \"crit_chance\": 0.06\n  },\n  \"stat_growth\": {\n    \"hp\": 4,\n    \"focus\": 5,\n    \"stamina\": 1,\n    \"attack\": 0,\n    \"defense\": 0,\n    \"magic\": 1,\n    \"speed\": 0\n  },\n  \"starting_skills\": [\n    \"arcane_bolt\",\n    \"frost_sigil\"\n  ],\n  \"skill_pool\": [\n    \"arcane_bolt\",\n    \"frost_sigil\",\n    \"focused_mind\"\n  ],\n  \"starting_items\": [\n    \"oak_staff\",\n    \"scholars_robe\",\n    \"focus_draught\"\n  ],\n  \"reaction\": \"ward\",\n  \"visual\": {\n    \"silhouette\": \"hooded_staff\",\n    \"accent_color\": \"#7789c4\"\n  }\n}\n";
var arcane_bolt_default = "{\n  \"id\": \"arcane_bolt\",\n  \"name\": \"Arkanes Geschoss\",\n  \"career\": \"scholar_mage\",\n  \"type\": \"attack\",\n  \"cost\": {\n    \"focus\": 8\n  },\n  \"cooldown\": 0,\n  \"target\": \"enemy\",\n  \"damage\": {\n    \"damage_type\": \"arcane\",\n    \"scaling_stat\": \"magic\",\n    \"multiplier\": 1.1,\n    \"flat\": 4\n  },\n  \"tags\": [\n    \"spell\",\n    \"ranged\"\n  ],\n  \"description\": \"Verursacht zuverlässigen arkanen Schaden aus sicherer Entfernung.\"\n}\n";
var focused_mind_default = "{\n  \"id\": \"focused_mind\",\n  \"name\": \"Klarer Fokus\",\n  \"career\": \"scholar_mage\",\n  \"type\": \"control\",\n  \"cost\": {\n    \"focus\": 6\n  },\n  \"cooldown\": 3,\n  \"target\": \"self\",\n  \"applies_statuses\": [\n    {\n      \"status\": \"focused\",\n      \"duration\": 2\n    }\n  ],\n  \"tags\": [\n    \"setup\",\n    \"spell\",\n    \"self\"\n  ],\n  \"description\": \"Stärkt die eigene Magie und Kritchance für zwei Runden.\"\n}\n";
var frost_sigil_default = "{\n  \"id\": \"frost_sigil\",\n  \"name\": \"Frostsiegel\",\n  \"career\": \"scholar_mage\",\n  \"type\": \"control\",\n  \"cost\": {\n    \"focus\": 14\n  },\n  \"cooldown\": 3,\n  \"target\": \"enemy\",\n  \"damage\": {\n    \"damage_type\": \"frost\",\n    \"scaling_stat\": \"magic\",\n    \"multiplier\": 0.8,\n    \"flat\": 3\n  },\n  \"applies_statuses\": [\n    {\n      \"status\": \"chilled\",\n      \"chance\": 0.8,\n      \"duration\": 3\n    }\n  ],\n  \"tags\": [\n    \"spell\",\n    \"control\",\n    \"ranged\"\n  ],\n  \"description\": \"Verursacht Frostschaden und senkt mit hoher Chance das Tempo des Ziels.\"\n}\n";
var hold_the_line_default = "{\n  \"id\": \"hold_the_line\",\n  \"name\": \"Stellung halten\",\n  \"career\": \"mercenary\",\n  \"type\": \"defense\",\n  \"cost\": {\n    \"stamina\": 10\n  },\n  \"cooldown\": 3,\n  \"target\": \"self\",\n  \"applies_statuses\": [\n    {\n      \"status\": \"guarded\",\n      \"duration\": 2\n    }\n  ],\n  \"removes_statuses\": [\n    \"bleeding\",\n    \"exposed\",\n    \"stunned\"\n  ],\n  \"tags\": [\n    \"defense\",\n    \"cleanse\",\n    \"self\"\n  ],\n  \"description\": \"Verringert zwei Runden lang eingehenden Schaden und entfernt Blutung, Entblößung oder Betäubung.\"\n}\n";
var iron_command_default = "{\n  \"id\": \"iron_command\",\n  \"name\": \"Eiserner Befehl\",\n  \"type\": \"attack\",\n  \"cost\": {},\n  \"cooldown\": 2,\n  \"target\": \"enemy\",\n  \"damage\": {\n    \"damage_type\": \"physical\",\n    \"scaling_stat\": \"attack\",\n    \"multiplier\": 1.3,\n    \"flat\": 2,\n    \"formula\": \"flat + scaling_stat * multiplier - target_defense\"\n  },\n  \"applies_statuses\": [\n    {\n      \"status\": \"guarded\",\n      \"chance\": 1.0,\n      \"duration\": 2,\n      \"target\": \"self\"\n    }\n  ],\n  \"tags\": [\n    \"boss\"\n  ],\n  \"description\": \"Signaturangriff des Eisernen Hauptmanns.\"\n}\n";
var precise_thrust_default = "{\n  \"id\": \"precise_thrust\",\n  \"name\": \"Präziser Stich\",\n  \"career\": \"duelist\",\n  \"type\": \"attack\",\n  \"cost\": {\n    \"stamina\": 8,\n    \"focus\": 4\n  },\n  \"cooldown\": 2,\n  \"target\": \"enemy\",\n  \"damage\": {\n    \"damage_type\": \"physical\",\n    \"scaling_stat\": \"attack\",\n    \"multiplier\": 1.1,\n    \"flat\": 0\n  },\n  \"applies_statuses\": [\n    {\n      \"status\": \"exposed\",\n      \"chance\": 0.5,\n      \"duration\": 2\n    }\n  ],\n  \"tags\": [\n    \"melee\",\n    \"precision\",\n    \"payoff\"\n  ],\n  \"description\": \"Fügt präzisen körperlichen Schaden zu und legt Schwachstellen des Ziels frei.\"\n}\n";
var quick_feint_default = "{\n  \"id\": \"quick_feint\",\n  \"name\": \"Flinke Finte\",\n  \"career\": \"duelist\",\n  \"type\": \"control\",\n  \"cost\": {\n    \"stamina\": 5,\n    \"focus\": 2\n  },\n  \"cooldown\": 2,\n  \"target\": \"self\",\n  \"applies_statuses\": [\n    {\n      \"status\": \"focused\",\n      \"duration\": 1\n    }\n  ],\n  \"removes_statuses\": [\n    \"chilled\"\n  ],\n  \"tags\": [\n    \"setup\",\n    \"cleanse\",\n    \"self\"\n  ],\n  \"description\": \"Entgeht Kälte und bereitet mit einem Fokusbonus den nächsten präzisen Treffer vor.\"\n}\n";
var rending_cut_default = "{\n  \"id\": \"rending_cut\",\n  \"name\": \"Reißender Schnitt\",\n  \"career\": \"mercenary\",\n  \"type\": \"attack\",\n  \"cost\": {\n    \"stamina\": 9\n  },\n  \"cooldown\": 2,\n  \"target\": \"enemy\",\n  \"damage\": {\n    \"damage_type\": \"physical\",\n    \"scaling_stat\": \"attack\",\n    \"multiplier\": 0.9,\n    \"flat\": 2\n  },\n  \"applies_statuses\": [\n    {\n      \"status\": \"bleeding\",\n      \"chance\": 0.6,\n      \"duration\": 3\n    }\n  ],\n  \"tags\": [\n    \"melee\",\n    \"damage_over_time\",\n    \"payoff\"\n  ],\n  \"description\": \"Verursacht körperlichen Schaden und lässt das Ziel mit hoher Chance drei Runden bluten.\"\n}\n";
var riposte_default = "{\n  \"id\": \"riposte\",\n  \"name\": \"Riposte\",\n  \"career\": \"duelist\",\n  \"type\": \"reaction\",\n  \"trigger\": \"after_melee_hit\",\n  \"cost\": {\n    \"stamina\": 6\n  },\n  \"cooldown\": 1,\n  \"target\": \"enemy\",\n  \"damage\": {\n    \"damage_type\": \"physical\",\n    \"scaling_stat\": \"attack\",\n    \"multiplier\": 1.2,\n    \"flat\": 3\n  },\n  \"tags\": [\n    \"melee\",\n    \"reaction\",\n    \"utility\"\n  ],\n  \"description\": \"Kontert einen eingehenden Nahkampfangriff mit einem präzisen Gegenstoß.\"\n}\n";
var shield_bash_default = "{\n  \"id\": \"shield_bash\",\n  \"name\": \"Schildstoß\",\n  \"career\": \"mercenary\",\n  \"type\": \"attack\",\n  \"cost\": {\n    \"stamina\": 8\n  },\n  \"cooldown\": 1,\n  \"target\": \"enemy\",\n  \"damage\": {\n    \"damage_type\": \"physical\",\n    \"scaling_stat\": \"attack\",\n    \"multiplier\": 1.0,\n    \"flat\": 3\n  },\n  \"applies_statuses\": [\n    {\n      \"status\": \"stunned\",\n      \"chance\": 0.35,\n      \"duration\": 1\n    }\n  ],\n  \"tags\": [\n    \"melee\",\n    \"control\",\n    \"setup\"\n  ],\n  \"description\": \"Fügt körperlichen Schaden zu und betäubt das Ziel mit geringer Chance für eine Runde.\"\n}\n";
var bleeding_default = "{\n  \"id\": \"bleeding\",\n  \"name\": \"Blutung\",\n  \"kind\": \"debuff\",\n  \"default_duration\": 3,\n  \"max_stacks\": 3,\n  \"effect\": {\n    \"damage_per_turn_per_stack\": 3,\n    \"damage_type\": \"bleed\",\n    \"ignores_defense\": true\n  },\n  \"description\": \"Verursacht zu Beginn des Zuges drei Schaden pro Stapel.\",\n  \"icon_shape\": \"drop\",\n  \"tick\": \"turn_start\"\n}\n";
var chilled_default = "{\n  \"id\": \"chilled\",\n  \"name\": \"Unterkühlt\",\n  \"kind\": \"debuff\",\n  \"default_duration\": 3,\n  \"max_stacks\": 1,\n  \"effect\": {\n    \"speed_modifier\": -3,\n    \"stamina_regen_multiplier\": 0.75\n  },\n  \"description\": \"Senkt das Tempo um drei und reduziert die Ausdauerregeneration um 25 Prozent.\",\n  \"icon_shape\": \"snowflake\",\n  \"tick\": \"turn_start\"\n}\n";
var exposed_default = "{\n  \"id\": \"exposed\",\n  \"name\": \"Entblößt\",\n  \"kind\": \"debuff\",\n  \"default_duration\": 2,\n  \"max_stacks\": 1,\n  \"effect\": {\n    \"defense_modifier\": -3,\n    \"crit_chance_taken_bonus\": 0.15\n  },\n  \"description\": \"Senkt die Verteidigung um drei und erhöht die erlittene Kritchance um 15 Prozentpunkte.\",\n  \"icon_shape\": \"crack\"\n}\n";
var focused_default = "{\n  \"id\": \"focused\",\n  \"name\": \"Fokussiert\",\n  \"kind\": \"buff\",\n  \"default_duration\": 2,\n  \"max_stacks\": 1,\n  \"effect\": {\n    \"crit_chance_bonus\": 0.15,\n    \"attack_modifier\": 2\n  },\n  \"description\": \"Erhöht die Kritchance um 15 Prozentpunkte und die Angriffskraft um zwei.\",\n  \"icon_shape\": \"eye\"\n}\n";
var guarded_default = "{\n  \"id\": \"guarded\",\n  \"name\": \"Gedeckt\",\n  \"kind\": \"buff\",\n  \"default_duration\": 2,\n  \"max_stacks\": 1,\n  \"effect\": {\n    \"damage_taken_multiplier\": 0.6\n  },\n  \"description\": \"Verringert erlittenen Schaden um 40 Prozent.\",\n  \"icon_shape\": \"shield\"\n}\n";
var stunned_default = "{\n  \"id\": \"stunned\",\n  \"name\": \"Betäubt\",\n  \"kind\": \"debuff\",\n  \"default_duration\": 1,\n  \"max_stacks\": 1,\n  \"effect\": {\n    \"skip_turn\": true\n  },\n  \"description\": \"Überspringt den nächsten Zug und endet nach einer Runde.\",\n  \"icon_shape\": \"star\"\n}\n";
var alley_cutthroat_default = "{\n  \"id\": \"alley_cutthroat\",\n  \"name\": \"Gassenmesser\",\n  \"role\": \"glass_cannon\",\n  \"tier\": 1,\n  \"base_stats\": {\n    \"hp\": 32,\n    \"attack\": 8,\n    \"defense\": 2,\n    \"magic\": 0,\n    \"speed\": 8,\n    \"crit_chance\": 0.05\n  },\n  \"skills\": [\n    \"precise_thrust\",\n    \"rending_cut\"\n  ],\n  \"weaknesses\": [\n    \"physical\"\n  ],\n  \"resistances\": [],\n  \"ai\": {\n    \"pattern\": \"weighted_random\",\n    \"weights\": {\n      \"precise_thrust\": 1,\n      \"rending_cut\": 1\n    }\n  },\n  \"loot_table\": [\n    {\n      \"item\": \"whetstone\",\n      \"chance\": 0.35\n    },\n    {\n      \"item\": \"leather_jerkin\",\n      \"chance\": 0.1\n    }\n  ],\n  \"xp_reward\": 22,\n  \"description\": \"Flinker Straßenkämpfer mit Blutungsmessern.\",\n  \"visual\": {\n    \"silhouette\": \"glass_cannon\",\n    \"accent_color\": \"#b33a3a\"\n  }\n}\n";
var hedge_cultist_default = "{\n  \"id\": \"hedge_cultist\",\n  \"name\": \"Heckenkultist\",\n  \"role\": \"caster\",\n  \"tier\": 1,\n  \"base_stats\": {\n    \"hp\": 30,\n    \"attack\": 3,\n    \"defense\": 2,\n    \"magic\": 0,\n    \"speed\": 5,\n    \"crit_chance\": 0.05\n  },\n  \"skills\": [\n    \"frost_sigil\",\n    \"arcane_bolt\"\n  ],\n  \"weaknesses\": [\n    \"physical\"\n  ],\n  \"resistances\": [\n    \"frost\"\n  ],\n  \"ai\": {\n    \"pattern\": \"weighted_random\",\n    \"weights\": {\n      \"frost_sigil\": 1,\n      \"arcane_bolt\": 1\n    }\n  },\n  \"loot_table\": [\n    {\n      \"item\": \"focus_draught\",\n      \"chance\": 0.4\n    },\n    {\n      \"item\": \"ward_talisman\",\n      \"chance\": 0.15\n    }\n  ],\n  \"xp_reward\": 24,\n  \"description\": \"Okkulter Wanderprediger, schwach im Nahkampf, gefährlich mit Zaubern.\",\n  \"visual\": {\n    \"silhouette\": \"caster\",\n    \"accent_color\": \"#6b4fa3\"\n  }\n}\n";
var rusted_deserter_default = "{\n  \"id\": \"rusted_deserter\",\n  \"name\": \"Verrosteter Deserteur\",\n  \"role\": \"bruiser\",\n  \"tier\": 1,\n  \"base_stats\": {\n    \"hp\": 45,\n    \"attack\": 6,\n    \"defense\": 4,\n    \"magic\": 0,\n    \"speed\": 3,\n    \"crit_chance\": 0.05\n  },\n  \"skills\": [\n    \"shield_bash\",\n    \"rending_cut\"\n  ],\n  \"weaknesses\": [\n    \"frost\"\n  ],\n  \"resistances\": [],\n  \"ai\": {\n    \"pattern\": \"weighted_random\",\n    \"weights\": {\n      \"shield_bash\": 1,\n      \"rending_cut\": 1\n    }\n  },\n  \"loot_table\": [\n    {\n      \"item\": \"bandage_roll\",\n      \"chance\": 0.4\n    },\n    {\n      \"item\": \"iron_sword\",\n      \"chance\": 0.1\n    }\n  ],\n  \"xp_reward\": 20,\n  \"description\": \"Ausgemusterter Soldat mit Rostpanzer; langsam, aber zäh.\",\n  \"visual\": {\n    \"silhouette\": \"bruiser\",\n    \"accent_color\": \"#8c5a3c\"\n  }\n}\n";
var iron_captain_default = "{\n  \"id\": \"iron_captain\",\n  \"name\": \"Der Eiserne Hauptmann\",\n  \"title\": \"Letzter Kommandant der Nordwacht\",\n  \"tier\": 1,\n  \"base_stats\": {\n    \"hp\": 80,\n    \"attack\": 7,\n    \"defense\": 5,\n    \"magic\": 0,\n    \"speed\": 4,\n    \"crit_chance\": 0.05\n  },\n  \"description\": \"Massiver Plattenträger mit schwerem Schild; diszipliniert, langsam, erbarmungslos.\",\n  \"visual\": {\n    \"silhouette\": \"oversized_plate\",\n    \"accent_color\": \"#a32626\",\n    \"art_quality\": \"hd_dark_fantasy\"\n  },\n  \"phases\": [\n    {\n      \"id\": \"phase_1_formation\",\n      \"name\": \"Formation\",\n      \"hp_threshold\": 1.0,\n      \"skills\": [\n        \"shield_bash\",\n        \"iron_command\"\n      ],\n      \"telegraphs\": [\n        {\n          \"skill\": \"iron_command\",\n          \"warning_turns\": 1,\n          \"icon\": \"amber_sword\"\n        }\n      ]\n    },\n    {\n      \"id\": \"phase_2_last_stand\",\n      \"name\": \"Letztes Gefecht\",\n      \"hp_threshold\": 0.5,\n      \"skills\": [\n        \"rending_cut\",\n        \"iron_command\"\n      ],\n      \"on_enter\": [\n        {\n          \"apply_status\": \"guarded\",\n          \"duration\": 2,\n          \"target\": \"self\"\n        },\n        {\n          \"stat_modifier\": {\n            \"attack\": 3\n          }\n        }\n      ],\n      \"telegraphs\": [\n        {\n          \"skill\": \"iron_command\",\n          \"warning_turns\": 1,\n          \"icon\": \"amber_sword\"\n        }\n      ]\n    }\n  ],\n  \"loot_table\": [\n    {\n      \"item\": \"captains_greatshield\",\n      \"chance\": 1.0\n    },\n    {\n      \"item\": \"whetstone\",\n      \"chance\": 0.5\n    }\n  ],\n  \"xp_reward\": 150\n}\n";
var cult_in_the_hedges_default = "{\n  \"id\": \"cult_in_the_hedges\",\n  \"name\": \"Kult in den Hecken\",\n  \"type\": \"standard\",\n  \"order\": 3,\n  \"enemies\": [\n    \"hedge_cultist\",\n    \"alley_cutthroat\"\n  ],\n  \"difficulty\": 3,\n  \"arena\": \"hedge_clearing\",\n  \"rewards\": {\n    \"xp\": 46,\n    \"items\": [\n      \"focus_draught\"\n    ]\n  },\n  \"description\": \"Zwei verschiedene Gegnertypen: Ziele priorisieren.\"\n}\n";
var deserters_toll_default = "{\n  \"id\": \"deserters_toll\",\n  \"name\": \"Der Wegzoll des Deserteurs\",\n  \"type\": \"standard\",\n  \"order\": 2,\n  \"enemies\": [\n    \"rusted_deserter\"\n  ],\n  \"difficulty\": 2,\n  \"arena\": \"ruined_road\",\n  \"rewards\": {\n    \"xp\": 20,\n    \"items\": [\n      \"whetstone\"\n    ]\n  },\n  \"description\": \"Lernen: Verteidigung und Betäubung.\"\n}\n";
var first_blood_default = "{\n  \"id\": \"first_blood\",\n  \"name\": \"Erstes Blut\",\n  \"type\": \"tutorial\",\n  \"order\": 1,\n  \"enemies\": [\n    \"alley_cutthroat\"\n  ],\n  \"difficulty\": 1,\n  \"arena\": \"alley_dusk\",\n  \"rewards\": {\n    \"xp\": 22,\n    \"items\": [\n      \"bandage_roll\"\n    ]\n  },\n  \"description\": \"Einführung: Zugablauf, Schaden und Blutung.\"\n}\n";
var gate_of_the_north_watch_default = "{\n  \"id\": \"gate_of_the_north_watch\",\n  \"name\": \"Tor der Nordwacht\",\n  \"type\": \"boss\",\n  \"order\": 4,\n  \"enemies\": [\n    \"iron_captain\"\n  ],\n  \"difficulty\": 5,\n  \"arena\": \"fortress_gate\",\n  \"rewards\": {\n    \"xp\": 150,\n    \"items\": [\n      \"captains_greatshield\"\n    ]\n  },\n  \"description\": \"Bosskampf in zwei Phasen mit Telegraphen.\"\n}\n";
var bandage_roll_default = "{\n  \"id\": \"bandage_roll\",\n  \"name\": \"Verbandsrolle\",\n  \"slot\": \"consumable\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {},\n  \"description\": \"Heilt 15 HP und entfernt Blutung.\",\n  \"value\": 15,\n  \"use\": {\n    \"heal_hp\": 15,\n    \"removes_statuses\": [\n      \"bleeding\"\n    ],\n    \"stackable\": true,\n    \"max_stack\": 5\n  }\n}\n";
var buckler_default = "{\n  \"id\": \"buckler\",\n  \"name\": \"Faustschild\",\n  \"slot\": \"offhand\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {\n    \"defense\": 2\n  },\n  \"description\": \"Kleiner Schild.\",\n  \"value\": 30\n}\n";
var captains_greatshield_default = "{\n  \"id\": \"captains_greatshield\",\n  \"name\": \"Großschild des Hauptmanns\",\n  \"slot\": \"offhand\",\n  \"rarity\": \"rare\",\n  \"stat_modifiers\": {\n    \"defense\": 5,\n    \"speed\": -1\n  },\n  \"description\": \"Beute des Eisernen Hauptmanns.\",\n  \"career_tags\": [\n    \"mercenary\"\n  ],\n  \"value\": 250\n}\n";
var focus_draught_default = "{\n  \"id\": \"focus_draught\",\n  \"name\": \"Fokustrank\",\n  \"slot\": \"consumable\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {},\n  \"description\": \"Stellt 15 Fokus wieder her.\",\n  \"value\": 20,\n  \"use\": {\n    \"restore_focus\": 15,\n    \"applies_statuses\": [\n      {\n        \"status\": \"focused\",\n        \"duration\": 2\n      }\n    ],\n    \"stackable\": true,\n    \"max_stack\": 5\n  }\n}\n";
var iron_sword_default = "{\n  \"id\": \"iron_sword\",\n  \"name\": \"Eisenschwert\",\n  \"slot\": \"weapon\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {\n    \"attack\": 3\n  },\n  \"description\": \"Solide Klinge.\",\n  \"career_tags\": [\n    \"mercenary\"\n  ],\n  \"value\": 40\n}\n";
var leather_jerkin_default = "{\n  \"id\": \"leather_jerkin\",\n  \"name\": \"Lederwams\",\n  \"slot\": \"armor\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {\n    \"defense\": 2,\n    \"speed\": 1\n  },\n  \"description\": \"Leichte Rüstung.\",\n  \"value\": 35\n}\n";
var oak_staff_default = "{\n  \"id\": \"oak_staff\",\n  \"name\": \"Eichenstab\",\n  \"slot\": \"weapon\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {\n    \"magic\": 3,\n    \"focus\": 5\n  },\n  \"description\": \"Fokusstab eines Gelehrten.\",\n  \"career_tags\": [\n    \"scholar_mage\"\n  ],\n  \"value\": 45\n}\n";
var rapier_default = "{\n  \"id\": \"rapier\",\n  \"name\": \"Rapier\",\n  \"slot\": \"weapon\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {\n    \"attack\": 2,\n    \"speed\": 1,\n    \"crit_chance\": 0.05\n  },\n  \"description\": \"Leichte Stichwaffe.\",\n  \"career_tags\": [\n    \"duelist\"\n  ],\n  \"value\": 45\n}\n";
var scholars_robe_default = "{\n  \"id\": \"scholars_robe\",\n  \"name\": \"Gelehrtenrobe\",\n  \"slot\": \"armor\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {\n    \"defense\": 1,\n    \"focus\": 6\n  },\n  \"description\": \"Stoffrobe mit Siegelstickerei.\",\n  \"value\": 35\n}\n";
var ward_talisman_default = "{\n  \"id\": \"ward_talisman\",\n  \"name\": \"Schutztalisman\",\n  \"slot\": \"trinket\",\n  \"rarity\": \"uncommon\",\n  \"stat_modifiers\": {\n    \"defense\": 1,\n    \"magic\": 1\n  },\n  \"description\": \"Verringert Magieschaden um 10 %.\",\n  \"value\": 80,\n  \"effects\": [\n    {\n      \"magic_damage_taken_multiplier\": 0.9\n    }\n  ]\n}\n";
var whetstone_default = "{\n  \"id\": \"whetstone\",\n  \"name\": \"Wetzstein\",\n  \"slot\": \"consumable\",\n  \"rarity\": \"common\",\n  \"stat_modifiers\": {},\n  \"description\": \"Nächster physischer Angriff: +3 Schaden.\",\n  \"value\": 18,\n  \"use\": {\n    \"next_attack_bonus\": 3,\n    \"stackable\": true,\n    \"max_stack\": 5\n  }\n}\n";
var chance = number().min(0).max(1);
var count = number().int().nonnegative();
var text = string().trim().min(1);
var id = string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
var ids = array(id);
var statModifiers = partialRecord(_enum([
	"hp",
	"focus",
	"stamina",
	"attack",
	"defense",
	"magic",
	"speed",
	"crit_chance"
]), number());
var stats = strictObject({
	hp: count.positive(),
	attack: count,
	defense: count,
	magic: count,
	speed: count,
	crit_chance: chance,
	stamina: count.optional(),
	focus: count.optional()
});
var visual = strictObject({
	silhouette: text,
	accent_color: string().regex(/^#[0-9a-f]{6}$/i),
	art_quality: text.optional()
});
var application = strictObject({
	status: id,
	duration: count.positive(),
	chance: chance.optional(),
	target: _enum(["self", "enemy"]).optional()
});
var applications = array(application);
var loot = array(strictObject({
	item: id,
	chance
}));
var effectKeys = [
	"damage_per_turn_per_stack",
	"damage_type",
	"ignores_defense",
	"skip_turn",
	"damage_taken_multiplier",
	"crit_chance_bonus",
	"crit_chance_taken_bonus",
	"stamina_regen_multiplier"
];
var effect = record(string(), union([
	number(),
	string(),
	boolean()
])).superRefine((record, context) => {
	for (const key of Object.keys(record)) if (!effectKeys.includes(key) && !/^[a-z_]+_modifier$/.test(key)) context.addIssue({
		code: "custom",
		path: [key],
		message: "Unbekannter Statuseffekt"
	});
});
var schemas = {
	careers: strictObject({
		id,
		name: text,
		role: text,
		description: text,
		base_stats: stats,
		stat_growth: statModifiers,
		starting_skills: ids.min(1),
		skill_pool: ids.min(1),
		starting_items: ids,
		reaction: _enum([
			"brace",
			"parry",
			"ward"
		]),
		visual: visual.optional()
	}),
	skills: strictObject({
		id,
		name: text,
		type: _enum([
			"attack",
			"defense",
			"control",
			"reaction"
		]),
		cost: strictObject({
			focus: count.optional(),
			stamina: count.optional()
		}),
		cooldown: count,
		target: _enum(["enemy", "self"]),
		description: text,
		career: id.optional(),
		damage: strictObject({
			damage_type: text,
			scaling_stat: _enum(["attack", "magic"]),
			multiplier: number().nonnegative(),
			flat: number().int(),
			formula: text.optional()
		}).optional(),
		applies_statuses: applications.optional(),
		tags: array(text).optional(),
		trigger: literal("after_melee_hit").optional(),
		removes_statuses: ids.optional()
	}),
	statuses: strictObject({
		id,
		name: text,
		kind: _enum(["buff", "debuff"]),
		default_duration: count.positive(),
		max_stacks: count.positive(),
		effect,
		description: text,
		tick: _enum(["turn_start", "turn_end"]).optional(),
		icon_shape: text.optional()
	}),
	items: strictObject({
		id,
		name: text,
		slot: _enum([
			"weapon",
			"offhand",
			"armor",
			"trinket",
			"consumable"
		]),
		rarity: _enum([
			"common",
			"uncommon",
			"rare"
		]),
		stat_modifiers: statModifiers,
		description: text,
		value: count.optional(),
		career_tags: ids.optional(),
		effects: array(record(string(), number())).optional(),
		use: strictObject({
			heal_hp: count.optional(),
			restore_focus: count.optional(),
			next_attack_bonus: count.optional(),
			removes_statuses: ids.optional(),
			applies_statuses: applications.optional(),
			stackable: boolean().optional(),
			max_stack: count.positive().optional()
		}).optional()
	}),
	enemies: strictObject({
		id,
		name: text,
		role: text,
		tier: count.positive(),
		base_stats: stats,
		skills: ids.min(1),
		description: text,
		weaknesses: array(text).optional(),
		resistances: array(text).optional(),
		ai: strictObject({
			pattern: text,
			weights: record(string(), number().positive())
		}).optional(),
		loot_table: loot.optional(),
		xp_reward: count.optional(),
		visual: visual.optional()
	}),
	bosses: strictObject({
		id,
		name: text,
		title: text,
		tier: count.positive(),
		base_stats: stats,
		description: text,
		visual: visual.optional(),
		phases: array(strictObject({
			id,
			name: text,
			hp_threshold: chance.positive(),
			skills: ids.min(1),
			telegraphs: array(strictObject({
				skill: id,
				warning_turns: count.positive(),
				icon: text
			})).optional(),
			on_enter: array(strictObject({
				apply_status: id.optional(),
				duration: count.positive().optional(),
				target: _enum(["self", "enemy"]).optional(),
				stat_modifier: statModifiers.optional()
			})).optional()
		})).min(1),
		loot_table: loot.optional(),
		xp_reward: count.optional()
	}),
	encounters: strictObject({
		id,
		name: text,
		type: _enum([
			"tutorial",
			"standard",
			"boss"
		]),
		order: count.positive(),
		enemies: ids.min(1),
		difficulty: number().int().min(1).max(5),
		arena: text,
		rewards: strictObject({
			xp: count,
			items: ids.optional()
		}),
		description: text
	})
};
function loadContent(files) {
	const data = Object.fromEntries(Object.keys(schemas).map((key) => [key, {}]));
	const issues = [];
	for (const type of Object.keys(schemas)) {
		const sources = files[type] ?? {};
		if (Object.keys(sources).length === 0) issues.push({
			path: `data/${type}`,
			field: "collection",
			message: "Sammlung fehlt oder ist leer"
		});
		for (const [path, source] of Object.entries(sources)) {
			let record;
			try {
				record = JSON.parse(source);
			} catch {
				issues.push({
					path,
					field: "json",
					message: "Ungueltiges JSON"
				});
				continue;
			}
			const result = schemas[type].safeParse(record);
			if (!result.success) {
				for (const error of result.error.issues) issues.push({
					path,
					field: error.path.join(".") || "record",
					message: error.message
				});
				continue;
			}
			const entry = result.data;
			const filename = path.split("/").at(-1)?.replace(/\.json$/, "");
			if (entry.id !== filename) issues.push({
				path,
				field: "id",
				message: "ID stimmt nicht mit Dateiname ueberein"
			});
			if (data[type][entry.id]) issues.push({
				path,
				field: "id",
				message: "Doppelte ID"
			});
			Object.assign(data[type], { [entry.id]: entry });
		}
	}
	const report = (type, recordId, field, message) => issues.push({
		path: `data/${type}/${recordId}.json`,
		field,
		message
	});
	const reference = (type, recordId, field, collection, targetId) => {
		if (!data[collection][targetId]) report(type, recordId, field, `Fehlende Referenz: ${collection}/${targetId}`);
	};
	for (const career of Object.values(data.careers)) {
		for (const skillId of [...career.starting_skills, ...career.skill_pool]) {
			reference("careers", career.id, "skills", "skills", skillId);
			if (data.skills[skillId] && data.skills[skillId].career !== career.id) report("careers", career.id, "skills", `Falsche Karriere fuer ${skillId}`);
		}
		for (const itemId of career.starting_items) {
			reference("careers", career.id, "starting_items", "items", itemId);
			if (data.items[itemId]?.career_tags && !data.items[itemId].career_tags.includes(career.id)) report("careers", career.id, "starting_items", `Gegenstand ${itemId} ist fuer Karriere gesperrt`);
		}
		if (!career.starting_skills.every((skillId) => career.skill_pool.includes(skillId))) report("careers", career.id, "skill_pool", "Startfaehigkeit fehlt im Pool");
		if (!career.starting_skills.some((skillId) => {
			const skill = data.skills[skillId];
			return skill && !skill.trigger && Object.entries(skill.cost).every(([resource, amount]) => amount <= (career.base_stats[resource] ?? 0));
		})) report("careers", career.id, "starting_skills", "Keine bezahlbare Startfaehigkeit");
	}
	for (const skill of Object.values(data.skills)) {
		if (skill.career) reference("skills", skill.id, "career", "careers", skill.career);
		if (!skill.damage && !skill.applies_statuses?.length) report("skills", skill.id, "effect", "Faehigkeit ohne Wirkung");
		for (const statusId of skill.removes_statuses ?? []) reference("skills", skill.id, "removes_statuses", "statuses", statusId);
		for (const entry of skill.applies_statuses ?? []) reference("skills", skill.id, "applies_statuses", "statuses", entry.status);
	}
	for (const item of Object.values(data.items)) {
		if (item.use && item.slot !== "consumable") report("items", item.id, "use", "Nur fuer Verbrauchsgegenstaende erlaubt");
		for (const careerId of item.career_tags ?? []) reference("items", item.id, "career_tags", "careers", careerId);
		for (const statusId of item.use?.removes_statuses ?? []) reference("items", item.id, "use.removes_statuses", "statuses", statusId);
		for (const entry of item.use?.applies_statuses ?? []) reference("items", item.id, "use.applies_statuses", "statuses", entry.status);
	}
	for (const enemy of Object.values(data.enemies)) {
		for (const skillId of enemy.skills) reference("enemies", enemy.id, "skills", "skills", skillId);
		for (const skillId of Object.keys(enemy.ai?.weights ?? {})) if (!enemy.skills.includes(skillId)) report("enemies", enemy.id, "ai.weights", `Faehigkeit ${skillId} fehlt im Pool`);
	}
	for (const boss of Object.values(data.bosses)) {
		if (boss.phases[0].hp_threshold !== 1) report("bosses", boss.id, "phases", "Erste Phase muss bei 1 beginnen");
		boss.phases.forEach((phase, index) => {
			if (index > 0 && phase.hp_threshold >= boss.phases[index - 1].hp_threshold) report("bosses", boss.id, "phases", "Phasengrenzen muessen absteigen");
			for (const skillId of phase.skills) reference("bosses", boss.id, "phases.skills", "skills", skillId);
			for (const telegraph of phase.telegraphs ?? []) reference("bosses", boss.id, "phases.telegraphs", "skills", telegraph.skill);
			for (const action of phase.on_enter ?? []) if (action.apply_status) reference("bosses", boss.id, "phases.on_enter", "statuses", action.apply_status);
		});
	}
	for (const type of ["enemies", "bosses"]) for (const actor of Object.values(data[type])) for (const entry of actor.loot_table ?? []) reference(type, actor.id, "loot_table", "items", entry.item);
	const orders = /* @__PURE__ */ new Set();
	for (const encounter of Object.values(data.encounters)) {
		if (orders.has(encounter.order)) report("encounters", encounter.id, "order", "Doppelte Reihenfolge");
		orders.add(encounter.order);
		for (const enemyId of encounter.enemies) reference("encounters", encounter.id, "enemies", encounter.type === "boss" ? "bosses" : "enemies", enemyId);
		for (const itemId of encounter.rewards.items ?? []) reference("encounters", encounter.id, "rewards.items", "items", itemId);
	}
	return {
		data,
		issues: issues.sort((left, right) => `${left.path}.${left.field}`.localeCompare(`${right.path}.${right.field}`)),
		ready: issues.length === 0
	};
}
var runtime = loadContent({
	careers: /* #__PURE__ */ Object.assign({
		"../../../data/careers/duelist.json": duelist_default,
		"../../../data/careers/mercenary.json": mercenary_default,
		"../../../data/careers/scholar_mage.json": scholar_mage_default
	}),
	skills: /* #__PURE__ */ Object.assign({
		"../../../data/skills/arcane_bolt.json": arcane_bolt_default,
		"../../../data/skills/focused_mind.json": focused_mind_default,
		"../../../data/skills/frost_sigil.json": frost_sigil_default,
		"../../../data/skills/hold_the_line.json": hold_the_line_default,
		"../../../data/skills/iron_command.json": iron_command_default,
		"../../../data/skills/precise_thrust.json": precise_thrust_default,
		"../../../data/skills/quick_feint.json": quick_feint_default,
		"../../../data/skills/rending_cut.json": rending_cut_default,
		"../../../data/skills/riposte.json": riposte_default,
		"../../../data/skills/shield_bash.json": shield_bash_default
	}),
	statuses: /* #__PURE__ */ Object.assign({
		"../../../data/statuses/bleeding.json": bleeding_default,
		"../../../data/statuses/chilled.json": chilled_default,
		"../../../data/statuses/exposed.json": exposed_default,
		"../../../data/statuses/focused.json": focused_default,
		"../../../data/statuses/guarded.json": guarded_default,
		"../../../data/statuses/stunned.json": stunned_default
	}),
	enemies: /* #__PURE__ */ Object.assign({
		"../../../data/enemies/alley_cutthroat.json": alley_cutthroat_default,
		"../../../data/enemies/hedge_cultist.json": hedge_cultist_default,
		"../../../data/enemies/rusted_deserter.json": rusted_deserter_default
	}),
	bosses: /* #__PURE__ */ Object.assign({ "../../../data/bosses/iron_captain.json": iron_captain_default }),
	encounters: /* #__PURE__ */ Object.assign({
		"../../../data/encounters/cult_in_the_hedges.json": cult_in_the_hedges_default,
		"../../../data/encounters/deserters_toll.json": deserters_toll_default,
		"../../../data/encounters/first_blood.json": first_blood_default,
		"../../../data/encounters/gate_of_the_north_watch.json": gate_of_the_north_watch_default
	}),
	items: /* #__PURE__ */ Object.assign({
		"../../../data/items/bandage_roll.json": bandage_roll_default,
		"../../../data/items/buckler.json": buckler_default,
		"../../../data/items/captains_greatshield.json": captains_greatshield_default,
		"../../../data/items/focus_draught.json": focus_draught_default,
		"../../../data/items/iron_sword.json": iron_sword_default,
		"../../../data/items/leather_jerkin.json": leather_jerkin_default,
		"../../../data/items/oak_staff.json": oak_staff_default,
		"../../../data/items/rapier.json": rapier_default,
		"../../../data/items/scholars_robe.json": scholars_robe_default,
		"../../../data/items/ward_talisman.json": ward_talisman_default,
		"../../../data/items/whetstone.json": whetstone_default
	})
});
if (!runtime.ready) throw new Error(runtime.issues.map((issue) => `${issue.path} ${issue.field}: ${issue.message}`).join("\n"));
var { careers, skills, statuses, enemies, bosses, items } = runtime.data;
var encounters = Object.values(runtime.data.encounters).sort((left, right) => left.order - right.order);
var registry = {
	skills,
	statuses,
	items
};
function resolveEncounter(index) {
	const encounter = encounters[index];
	if (!encounter) throw new Error(`Unbekannte Begegnung: ${index}`);
	return {
		encounter,
		opponents: encounter.enemies.map((id) => encounter.type === "boss" ? bosses[id] : enemies[id]),
		rewards: encounter.rewards.items?.map((id) => items[id]) ?? []
	};
}
var idleFx$1 = {
	seq: 0,
	action: null,
	target: 0,
	hits: []
};
var enemyPalette = {
	alley_cutthroat: "#9e414c",
	rusted_deserter: "#8a6f48",
	hedge_cultist: "#6f4d84",
	iron_captain: "#4f6878"
};
function Figure({ kind, enemy = false }) {
	const mage = kind === "scholar_mage" || kind === "hedge_cultist";
	const light = kind === "duelist" || kind === "alley_cutthroat";
	const boss = kind === "iron_captain";
	const cloak = enemy ? enemyPalette[kind] ?? "#9e414c" : mage ? "#69aeae" : light ? "#d5b15e" : "#548e82";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
		transform: enemy ? "translate(160 0) scale(-1 1)" : void 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "80",
				cy: "231",
				rx: "58",
				ry: "9",
				fill: "#111d25",
				opacity: ".55"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M58 85 Q25 124 24 213 L91 216 L119 91 Z",
				fill: cloak
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M55 93 L38 211 L61 209 L78 112 Z",
				fill: "#101e2b",
				opacity: ".4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M57 151 L53 217 L70 224 L78 158 M85 157 L99 218 L116 223 L104 149",
				fill: "none",
				stroke: "#273747",
				strokeWidth: "16",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M47 219 L73 221 M96 221 L123 223",
				stroke: "#111e29",
				strokeWidth: "12",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M57 87 L96 84 L110 146 L55 155 Z",
				fill: mage ? "#345966" : "#657b85",
				stroke: "#1b303e",
				strokeWidth: "3"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M63 99 L95 95 L96 132 L62 138 Z",
				fill: mage ? cloak : "#9cb0b2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M61 143 L107 140",
				stroke: "#d2b676",
				strokeWidth: "8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M99 95 L119 119 L137 107",
				fill: "none",
				stroke: "#405763",
				strokeWidth: "14",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "139",
				cy: "108",
				r: "7",
				fill: "#d6a588"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M57 99 L43 134 L62 150",
				fill: "none",
				stroke: "#405763",
				strokeWidth: "14",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M69 83 L70 70 L91 68 L92 88",
				fill: "#c0927c"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M60 46 Q63 22 83 24 Q109 25 103 55 L97 73 L79 80 L66 66 Z",
				fill: "#d8aa8a"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M60 48 L60 32 L77 20 L98 25 L109 43 L100 59 L91 35 L68 43 L65 65 Z",
				fill: mage ? "#d3d8c7" : "#263746"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M91 51 L99 53 M83 64 L94 65",
				stroke: "#5e4e4b",
				strokeWidth: "2"
			}),
			mage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M136 216 L146 52",
					stroke: "#c2a66d",
					strokeWidth: "6"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M134 47 L147 28 L158 49 L145 66 Z",
					fill: "#96e0cf",
					stroke: "#d6f4d9",
					strokeWidth: "2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "146",
					cy: "48",
					r: "23",
					fill: "#8cdccf",
					opacity: ".1"
				})
			] }) : light ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M127 123 L155 66",
				stroke: "#e0e7d8",
				strokeWidth: "4"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M123 111 L143 122",
				stroke: "#d5b15e",
				strokeWidth: "5"
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M136 122 L145 57 L157 66 L144 126 Z",
					fill: "#e0e7d8"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M124 120 L156 126",
					stroke: "#d5b15e",
					strokeWidth: "5"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: boss ? "M28 104 L78 93 L83 167 L55 199 L20 163 Z" : "M28 116 L70 105 L76 156 L53 178 L25 155 Z",
					fill: cloak,
					stroke: "#c1b687",
					strokeWidth: "4"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M48 117 L54 158 M33 137 L66 131",
					stroke: "#d1d8bd",
					strokeWidth: "4"
				})
			] }),
			boss && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M57 49 L60 23 L101 22 L113 50 L99 73 L67 74 Z M65 40 L103 39",
				fill: "#617980",
				stroke: "#c5bc99",
				strokeWidth: "4"
			})
		]
	});
}
var arenas = [
	{
		sky: [
			"#3a2340",
			"#99543f",
			"#d9a05f"
		],
		ground: ["#5d564a", "#231d20"],
		far: "#43304a",
		mid: "#352736",
		stoneA: "#4f4344",
		stoneB: "#6d5f55",
		path: "#b09a7c"
	},
	{
		sky: [
			"#2e4350",
			"#7d9697",
			"#c2bb9b"
		],
		ground: ["#566753", "#1c2a2b"],
		far: "#3e5660",
		mid: "#32464e",
		stoneA: "#45565a",
		stoneB: "#6b7a6f",
		path: "#a3ab8e"
	},
	{
		sky: [
			"#13302f",
			"#3f6e5f",
			"#9cb582"
		],
		ground: ["#3e6050", "#14272b"],
		far: "#24473f",
		mid: "#1d3a36",
		stoneA: "#34504a",
		stoneB: "#54705f",
		path: "#8aa07e"
	},
	{
		sky: [
			"#0b1527",
			"#1d3350",
			"#415972"
		],
		ground: ["#3c4f63", "#101b2b"],
		far: "#17293f",
		mid: "#20374e",
		stoneA: "#324256",
		stoneB: "#4e6072",
		path: "#8e9cab"
	}
];
function enemyAnchor(index, count, kind) {
	const boss = kind === "iron_captain";
	const s = boss ? 1.24 : 1.04;
	const x = count > 1 ? 605 + index * 170 : 685;
	const y = boss ? 82 : 130;
	return {
		x,
		y,
		s,
		cx: x + 80 * s,
		cy: y + 125 * s,
		top: y + 12 * s,
		ground: y + 231 * s
	};
}
var playerAnchor = {
	x: 194,
	y: 128,
	s: 1.04,
	cx: 277,
	cy: 258,
	top: 141,
	ground: 368
};
function AlleyDusk() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "500",
			cy: "150",
			r: "58",
			fill: "#f3c17e",
			opacity: ".85"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "500",
			cy: "150",
			r: "90",
			fill: "#f3c17e",
			opacity: ".12"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			fill: "#2c2030",
			stroke: "#54404e",
			strokeWidth: "2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M0 330V96H58L70 72L84 96H128V330Z" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M128 330V180H196V150H238V330Z" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M818 330V120H872V88H906V120H1000V330Z" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M744 330V210H818V330Z" })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			fill: "#ffb45e",
			className: "fx-window",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "24",
					y: "128",
					width: "16",
					height: "22"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "76",
					y: "128",
					width: "16",
					height: "22"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "150",
					y: "200",
					width: "14",
					height: "19"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "846",
					y: "146",
					width: "16",
					height: "22"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "922",
					y: "160",
					width: "16",
					height: "22"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "770",
					y: "236",
					width: "14",
					height: "18"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M128 110 Q400 180 744 128",
			fill: "none",
			stroke: "#1d1620",
			strokeWidth: "3"
		}),
		[
			240,
			420,
			590,
			700
		].map((x, index) => {
			const y = 110 + Math.round(48 * Math.sin((x - 128) / 616 * Math.PI));
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: `M${x} ${y} v12`,
					stroke: "#1d1620",
					strokeWidth: "3"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: x - 7,
					y: y + 12,
					width: "14",
					height: "18",
					rx: "3",
					fill: "#3a2a2c",
					stroke: "#54404e"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: x,
					cy: y + 21,
					r: "5",
					fill: "#ffc46e",
					className: "fx-lantern",
					style: { animationDelay: `${index * .9}s` }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: x,
					cy: y + 21,
					r: "16",
					fill: "#ffc46e",
					opacity: ".14",
					className: "fx-lantern",
					style: { animationDelay: `${index * .9}s` }
				})
			] }, x);
		}),
		Array.from({ length: 10 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			className: "fx-mote",
			style: {
				animationDelay: `${-index * 1.3}s`,
				animationDuration: `${8 + index % 4}s`
			},
			cx: (index * 137 + 60) % 1e3,
			cy: 180 + index * 53 % 170,
			r: index % 3 ? 1.6 : 2.4,
			fill: "#f3cf96"
		}, index))
	] });
}
function RuinedRoad() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "790",
			cy: "100",
			r: "40",
			fill: "#e7e3c4",
			opacity: ".7"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			fill: "#8d9489",
			opacity: ".8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M330 92 l9 -5 9 5 -9 2Z" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M380 74 l8 -4 8 4 -8 2Z" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M296 70 l7 -4 7 4 -7 2Z" })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			fill: "#50625f",
			stroke: "#6d7f78",
			strokeWidth: "3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M60 335 V150 h42 V335 Z M210 335 V150 h42 V335 Z" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M48 162 Q156 74 264 162 L246 176 Q156 104 66 176 Z" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M96 150 h120 l-8 -16 h-104 Z",
					fill: "#43534f"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M560 318 L720 300 L724 322 L564 342 Z M736 296 L800 288 L803 308 L739 317 Z",
			fill: "#5c6e68",
			stroke: "#73857c",
			strokeWidth: "3"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
			cx: "640",
			cy: "334",
			rx: "96",
			ry: "9",
			fill: "#101e22",
			opacity: ".35"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M884 338 V260 h34 l6 24 v54 Z",
			fill: "#55675f",
			stroke: "#73857c",
			strokeWidth: "3"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M893 282 h16 M893 300 h16",
			stroke: "#3b4c47",
			strokeWidth: "3"
		}),
		Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
			className: "fx-mist",
			style: { animationDelay: `${-index * 4}s` },
			cx: 200 + index * 320,
			cy: 344 + index * 14,
			rx: "190",
			ry: "17",
			fill: "#cfd8c2",
			opacity: ".09"
		}, index))
	] });
}
function HedgeClearing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
		Array.from({ length: 12 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			transform: `translate(${index * 97 - 20} ${index % 2 * 19})`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M43 332 L51 104 L68 100 L66 333Z",
					fill: "#263f44"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M-12 206 L56 28 L117 212 L85 205 L130 257 L-27 255 L17 209Z",
					fill: "#305959"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M17 183 L56 65 L95 185Z",
					fill: "#406c62"
				})
			]
		}, index)),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M0 340 Q60 296 130 338 Q200 292 280 336 Q350 298 430 338 Q510 294 590 336 Q660 298 740 338 Q820 294 900 336 Q950 306 1000 338 V380 H0 Z",
			fill: "#2c4f3f"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M0 348 Q80 318 170 348 Q260 316 360 348 Q460 318 560 348 Q660 316 760 348 Q860 318 1000 348 V386 H0 Z",
			fill: "#234236",
			opacity: ".9"
		}),
		Array.from({ length: 8 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			className: "fx-firefly",
			style: {
				animationDelay: `${-index * 1.7}s`,
				animationDuration: `${5 + index % 3}s`
			},
			cx: (index * 173 + 90) % 1e3,
			cy: 240 + index * 67 % 110,
			r: "2.4",
			fill: "#d8f2a0"
		}, index))
	] });
}
function FortressGate() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "812",
			cy: "84",
			r: "34",
			fill: "#dfe8ef",
			opacity: ".9"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "812",
			cy: "84",
			r: "58",
			fill: "#dfe8ef",
			opacity: ".1"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			fill: "#273d52",
			stroke: "#3b5469",
			strokeWidth: "3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M0 350 V160 h92 v-26 h30 v26 h756 v-26 h30 v26 h92 V350 Z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M110 160 V96 h26 v-18 h22 v18 h26 v64 Z M816 160 V96 h26 v-18 h22 v18 h26 v64 Z" })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M0 160 h1000 M0 176 h1000",
			stroke: "#1b2e40",
			strokeWidth: "3",
			opacity: ".7"
		}),
		Array.from({ length: 18 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: index * 56 + 8,
			y: 142,
			width: "26",
			height: "18",
			fill: "#1b2e40"
		}, index)),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M430 350 V218 Q500 168 570 218 V350 Z",
			fill: "#101c2b",
			stroke: "#3b5469",
			strokeWidth: "4"
		}),
		Array.from({ length: 5 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: `M${452 + index * 24} 350 V${206 + Math.abs(index - 2) * 8}`,
			stroke: "#45596c",
			strokeWidth: "5"
		}, index)),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M430 262 H570",
			stroke: "#45596c",
			strokeWidth: "5"
		}),
		[86, 914].map((x, side) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: `M${x - 5} 350 V268 h10 V350 Z`,
				fill: "#22384c",
				stroke: "#3b5469",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: `M${x - 20} 268 h40 l-7 -18 h-26 Z`,
				fill: "#30465a",
				stroke: "#3b5469",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: `M${x} 250 Q${x - 11} 232 ${x - 3} 216 Q${x + 2} 230 ${x + 9} 221 Q${x + 12} 240 ${x} 250`,
				fill: "#f3a154",
				className: "fx-flame",
				style: { animationDelay: `${side * .4}s` }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: x,
				cy: 236,
				r: "26",
				fill: "#f3a154",
				opacity: ".12",
				className: "fx-lantern"
			}),
			Array.from({ length: 4 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				className: "fx-ember",
				style: { animationDelay: `${-index * 1.4 - side * .7}s` },
				cx: x - 8 + index * 6,
				cy: 240,
				r: "1.8",
				fill: "#ffc678"
			}, index))
		] }, x)),
		Array.from({ length: 16 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			className: "fx-snow",
			style: {
				animationDelay: `${-index * 1.1}s`,
				animationDuration: `${7 + index % 5}s`
			},
			cx: (index * 131 + 45) % 1e3,
			cy: "-12",
			r: index % 3 ? 1.8 : 2.6,
			fill: "#e8eef2",
			opacity: ".8"
		}, index))
	] });
}
function ImpactFx({ action, cx, cy }) {
	if (action === "strike") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
		className: "fx-burst",
		transform: `translate(${cx} ${cy})`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M-58 -42 Q0 -72 58 -16",
				fill: "none",
				stroke: "#f6e6bd",
				strokeWidth: "7",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M-50 -10 Q0 -44 52 12",
				fill: "none",
				stroke: "#f2cf76",
				strokeWidth: "4",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M-20 -58 l-8 22 M26 -52 l2 24 M48 8 l18 10 M-44 18 l-20 6",
				stroke: "#fff3d6",
				strokeWidth: "3",
				strokeLinecap: "round"
			})
		]
	});
	if (action === "cast") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
		transform: `translate(${cx} ${cy - 20})`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			className: "fx-cast",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					r: "34",
					fill: "none",
					stroke: "#9fe6da",
					strokeWidth: "5"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					r: "14",
					fill: "#c9f4ec",
					opacity: ".8"
				}),
				Array.from({ length: 6 }, (_, index) => {
					const angle = index * Math.PI / 3;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: `M${Math.cos(angle) * 44} ${Math.sin(angle) * 44} l${Math.cos(angle) * 16} ${Math.sin(angle) * 16}`,
						stroke: "#8cdccf",
						strokeWidth: "4",
						strokeLinecap: "round"
					}, index);
				})
			]
		})
	});
	return null;
}
function Scene({ career, opponents, selected = 0, encounter = 0, fx = idleFx$1, defeated = [], telegraphs = [], playerDown = false }) {
	const arena = arenas[encounter] ?? arenas[0];
	const targetAnchor = enemyAnchor(fx.target, opponents.length, opponents[fx.target] ?? "");
	const playerHit = fx.hits.find((hit) => hit.slot === "player");
	const offensive = fx.action === "strike" || fx.action === "cast";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "slice-scene",
		viewBox: "0 0 1000 470",
		role: "img",
		"aria-label": "Gezeichnetes zweidimensionales Schlachtfeld mit deiner Figur links und Gegnern rechts",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: `slice-sky-${encounter}`,
					x2: "0",
					y2: "1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { stopColor: arena.sky[0] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: ".7",
							stopColor: arena.sky[1]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "1",
							stopColor: arena.sky[2]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: `slice-ground-${encounter}`,
					x2: "0",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { stopColor: arena.ground[0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "1",
						stopColor: arena.ground[1]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
					id: "slice-grain",
					width: "29",
					height: "23",
					patternUnits: "userSpaceOnUse",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M3 4h2 M16 15h3",
						stroke: "#f0ead1",
						opacity: ".06"
					})
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "1000",
				height: "470",
				fill: `url(#slice-sky-${encounter})`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 252 L104 175 L189 223 L295 143 L404 228 L538 166 L663 216 L813 156 L1000 234 V470 H0Z",
				fill: arena.far
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 285 L135 242 L267 285 L424 230 L598 278 L725 244 L866 279 L1000 243 V470 H0Z",
				fill: arena.mid
			}),
			encounter === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlleyDusk, {}) : encounter === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RuinedRoad, {}) : encounter === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HedgeClearing, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FortressGate, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 351 Q177 319 377 344 T1000 331V470H0Z",
				fill: `url(#slice-ground-${encounter})`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 384 Q287 345 513 386 T1000 365",
				fill: "none",
				stroke: arena.path,
				strokeWidth: "3",
				opacity: ".3"
			}),
			Array.from({ length: 24 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: `M${index * 47} ${409 + index % 4 * 12}l18 -3 13 5 -22 5Z`,
				fill: index % 2 ? arena.stoneA : arena.stoneB,
				opacity: ".6"
			}, index)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
				transform: `translate(${playerAnchor.x} ${playerAnchor.y}) scale(1.04)`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					className: playerDown ? "fx-fall" : playerHit ? "fx-hit-l" : fx.action === "strike" ? "fx-lunge" : fx.action === "cast" ? "fx-channel" : "slice-idle",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, { kind: career })
				}, `stance-${offensive || playerHit ? fx.seq : "idle"}`)
			}),
			fx.action === "guard" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				className: "fx-guard",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M332 170 Q364 228 332 300",
					fill: "none",
					stroke: "#9fe6da",
					strokeWidth: "8",
					strokeLinecap: "round"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M318 184 Q344 228 318 284",
					fill: "none",
					stroke: "#c9f4ec",
					strokeWidth: "4",
					strokeLinecap: "round",
					opacity: ".7"
				})]
			}, `guard-${fx.seq}`),
			(fx.action === "item" || fx.action === "rest") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
				className: "fx-wisp",
				style: { animationDelay: `${index * .14}s` },
				transform: `translate(${playerAnchor.cx - 26 + index * 26} ${playerAnchor.cy - 20 - index % 2 * 14})`,
				children: fx.action === "item" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M-6 0 h12 M0 -6 v12",
					stroke: "#9fe3a8",
					strokeWidth: "5",
					strokeLinecap: "round"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					r: "5",
					fill: "#b5d78e"
				})
			}, index)) }, `aid-${fx.seq}`),
			opponents.map((kind, index) => {
				const anchor = enemyAnchor(index, opponents.length, kind);
				const hit = fx.hits.find((entry) => entry.slot === index);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					transform: `translate(${anchor.x} ${anchor.y}) scale(${anchor.s})`,
					opacity: defeated[index] ? void 0 : selected === index ? 1 : .72,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
						className: defeated[index] ? "fx-fall" : hit ? "fx-hit-r" : "slice-sway",
						style: defeated[index] || hit ? void 0 : { animationDelay: `${-index * 1.3}s` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, {
							kind,
							enemy: true
						})
					}, `state-${defeated[index] ? "down" : hit ? fx.seq : "idle"}`)
				}, `${kind}-${index}`);
			}),
			opponents.map((kind, index) => {
				const anchor = enemyAnchor(index, opponents.length, kind);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [selected === index && !defeated[index] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
					className: "fx-ring",
					cx: anchor.cx,
					cy: anchor.ground,
					rx: 62 * anchor.s,
					ry: 10 * anchor.s,
					fill: "none",
					stroke: "#f2cf76",
					strokeWidth: "3"
				}), telegraphs[index] && !defeated[index] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					className: "fx-telegraph",
					transform: `translate(${anchor.cx} ${anchor.top - 26})`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M0 -15 L11 0 L0 15 L-11 0 Z",
						fill: "#1a201e",
						stroke: "#f2cf76",
						strokeWidth: "2.5"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M0 -7 v8 M0 7 v.5",
						stroke: "#f2cf76",
						strokeWidth: "3",
						strokeLinecap: "round"
					})]
				})] }, `marks-${kind}-${index}`);
			}),
			fx.seq > 0 && offensive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImpactFx, {
				action: fx.action,
				cx: targetAnchor.cx,
				cy: targetAnchor.cy
			}) }, `impact-${fx.seq}`),
			fx.seq > 0 && playerHit && playerHit.kind === "damage" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				className: "fx-burst",
				transform: `translate(${playerAnchor.cx} ${playerAnchor.cy})`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M48 -38 Q0 -62 -46 -10",
					fill: "none",
					stroke: "#e8795f",
					strokeWidth: "6",
					strokeLinecap: "round"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M20 -50 l4 20 M-34 -26 l-14 12",
					stroke: "#f0a18b",
					strokeWidth: "3",
					strokeLinecap: "round"
				})]
			}, `counter-${fx.seq}`),
			fx.seq > 0 && fx.hits.map((hit) => {
				const anchor = hit.slot === "player" ? playerAnchor : enemyAnchor(hit.slot, opponents.length, opponents[hit.slot] ?? "");
				const fill = hit.kind === "heal" ? "#9fe3a8" : hit.slot === "player" ? "#ff937b" : "#ffd98a";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					className: "fx-float",
					x: anchor.cx,
					y: anchor.top - 8,
					textAnchor: "middle",
					fill,
					stroke: "#141a18",
					strokeWidth: "5",
					paintOrder: "stroke",
					fontSize: "34",
					fontWeight: "700",
					fontFamily: "Fraunces, serif",
					children: hit.kind === "heal" ? `+${hit.amount}` : `−${hit.amount}`
				}, `hit-${fx.seq}-${hit.slot}`);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				fill: arena.path,
				opacity: ".85",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M93 396l-11-27 16 19 5-32 6 28 16-15-12 28Z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M906 395l-8-28 13 19 12-30-4 32 14-17-10 30Z" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "1000",
				height: "470",
				fill: "url(#slice-grain)",
				pointerEvents: "none"
			})
		]
	});
}
var idleFx = {
	seq: 0,
	action: null,
	target: 0,
	hits: []
};
function actionKind(id, skipTurn) {
	if (skipTurn) return "skip";
	if (!id) return "rest";
	if (id.startsWith("item:")) return "item";
	const skill = skills[id];
	if (skill.target === "self") return skill.type === "defense" ? "guard" : "rest";
	return skill.damage?.scaling_stat === "magic" ? "cast" : "strike";
}
function SliceApp() {
	const [screen, setScreen] = (0, import_react.useState)("career");
	const [careerId, setCareer] = (0, import_react.useState)("mercenary");
	const [step, setStep] = (0, import_react.useState)(0);
	const [xp, setXp] = (0, import_react.useState)(0);
	const [battle, setBattle] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [target, setTarget] = (0, import_react.useState)(0);
	const [fx, setFx] = (0, import_react.useState)(idleFx);
	const [history, setHistory] = (0, import_react.useState)([]);
	const [resolving, setResolving] = (0, import_react.useState)(false);
	const [supplies, setSupplies] = (0, import_react.useState)(null);
	const career = careers[careerId];
	const encounter = encounters[step];
	const roster = resolveEncounter(step).opponents;
	const skill = selected ? skills[selected] : null;
	const item = selected?.startsWith("item:") ? items[selected.slice(5)] : null;
	const recipient = battle && skill ? skill.target === "self" ? battle.player : battle.enemies[target] : null;
	const damage = battle && skill && recipient ? preview(battle.player, recipient, skill, registry) : 0;
	const reason = battle && skill && !battle.player.skipTurn ? unavailable(battle.player, skill) : null;
	(0, import_react.useEffect)(() => {
		if (!resolving) return;
		const timer = window.setTimeout(() => {
			setResolving(false);
			if (battle?.result === "victory") setScreen("reward");
		}, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
		return () => window.clearTimeout(timer);
	}, [resolving, battle]);
	function start() {
		const next = createBattle(career, roster, 42 + step, items, step + 1);
		if (supplies) next.inventory = { ...supplies };
		setBattle(next);
		setTarget(0);
		setSelected(null);
		setFx(idleFx);
		setHistory([...next.log]);
		setScreen("combat");
	}
	function act() {
		if (!battle || resolving) return;
		const next = resolveRound(battle, battle.player.skipTurn ? null : selected, target, registry);
		const hits = [];
		next.enemies.forEach((enemy, index) => {
			const lost = battle.enemies[index].hp - enemy.hp;
			if (lost > 0) hits.push({
				slot: index,
				amount: lost,
				kind: "damage"
			});
		});
		const playerDelta = battle.player.hp - next.player.hp;
		if (playerDelta !== 0) hits.push({
			slot: "player",
			amount: Math.abs(playerDelta),
			kind: playerDelta > 0 ? "damage" : "heal"
		});
		setBattle(next);
		setFx((previous) => ({
			seq: previous.seq + 1,
			action: actionKind(battle.player.skipTurn ? null : selected, battle.player.skipTurn),
			target,
			hits
		}));
		setHistory((entries) => [
			...entries,
			`— Runde ${battle.round} —`,
			...next.log
		]);
		setResolving(true);
		setSelected(null);
		if (next.enemies[target]?.hp <= 0) setTarget(Math.max(0, next.enemies.findIndex((enemy) => enemy.hp > 0)));
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
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "slice-app",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "slice-header",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "slice-brand",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swords, {
						size: 24,
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"ECHO",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "slice-brand-mark",
							children: "//"
						}),
						"BRUCH"
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "slice-build",
					children: "DIE REISE ZUR NORDWACHT"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "slice-icon-button",
					type: "button",
					onClick: reset,
					disabled: resolving,
					title: "Neue Reise",
					"aria-label": "Neue Reise",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 18 })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "slice-shell",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "slice-route",
					"aria-label": "Begegnungen",
					children: encounters.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: index === step ? "current" : index < step ? "complete" : "",
						"aria-current": index === step ? "step" : void 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: index < step ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 12 }) : `0${index + 1}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: entry.name })]
					}, entry.id))
				}),
				screen === "career" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "slice-title",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "DEINE REISE BEGINNT" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Wer zieht zur Nordwacht?" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Wähle eine Karriere" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "slice-careers",
						"aria-label": "Karrierewahl",
						children: Object.values(careers).map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `slice-career ${careerId === entry.id ? "selected" : ""}`,
							onClick: () => setCareer(entry.id),
							"aria-pressed": careerId === entry.id,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `slice-portrait ${entry.id}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 200 255",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
										transform: "translate(20 3)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, { kind: entry.id })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: careerId === entry.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sword, { size: 18 }) })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "slice-career-copy",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: entry.name }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: entry.description }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "slice-stats",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 14 }),
												entry.base_stats.hp,
												" LP"
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sword, { size: 14 }), entry.base_stats.attack] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 14 }), entry.base_stats.defense] })
										]
									})
								]
							})]
						}, entry.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
						className: "slice-selection-footer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "STARTFÄHIGKEITEN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: career.starting_skills.map((id) => skills[id].name).join(" · ") })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "slice-button primary",
							type: "button",
							onClick: () => setScreen("encounter"),
							children: [
								"Mit ",
								career.name,
								" aufbrechen ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 18 })
							]
						})]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "slice-title compact",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"BEGEGNUNG ",
							step + 1,
							" / ",
							encounters.length
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: encounter.name })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: screen === "combat" && battle ? `RUNDE ${battle.round}` : `${xp} EP` })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "slice-stage",
						"aria-label": "Schlachtfeld",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scene, {
								career: careerId,
								opponents: encounter.enemies,
								selected: target,
								encounter: step,
								fx: screen === "combat" ? fx : idleFx,
								defeated: battle && screen === "combat" ? battle.enemies.map((enemy) => enemy.hp <= 0) : [],
								telegraphs: battle && screen === "combat" ? battle.enemies.map((enemy) => enemy.hp > 0 && Boolean(enemy.pendingSkill)) : [],
								playerDown: screen === "combat" && battle?.result === "defeat"
							}),
							screen === "combat" && battle && fx.seq > 0 && battle.log.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "slice-feed",
								"aria-live": "polite",
								children: battle.log.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									style: { animationDelay: `${index * .14}s` },
									children: entry
								}, index))
							}, fx.seq),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "slice-stage-caption",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: career.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: roster.map((enemy) => enemy.name).join(" + ") })]
							})
						]
					}),
					screen === "encounter" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "slice-encounter",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "slice-eyebrow",
								children: "VOR DER BEGEGNUNG"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: roster.map((enemy) => enemy.name).join(" & ") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: encounter.description }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "slice-muted",
								children: [
									"Belohnung: ",
									encounter.rewards.xp,
									" EP · ",
									encounter.rewards.items?.map((id) => items[id].name).join(", ")
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "slice-encounter-buttons",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "slice-button",
								type: "button",
								onClick: () => setScreen("career"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 16 }), " Karriere"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "slice-button primary",
								type: "button",
								onClick: start,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swords, { size: 17 }), " Begegnung beginnen"]
							})]
						})]
					}),
					screen === "combat" && battle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "slice-combatants",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActorPanel, { actor: battle.player }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "slice-targets",
								children: battle.enemies.map((enemy, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `slice-target ${target === index ? "selected" : ""}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActorPanel, { actor: enemy }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": target === index,
										disabled: enemy.hp <= 0 || resolving,
										onClick: () => setTarget(index),
										className: "slice-target-label",
										children: enemy.hp <= 0 ? "Besiegt" : target === index ? "Ziel ausgewählt" : "Als Ziel wählen"
									})]
								}, `${enemy.id}-${index}`))
							})]
						}),
						battle.player.skipTurn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "slice-warning",
							role: "status",
							children: "Betäubt: Die nächste Bestätigung überspringt deinen Zug."
						}),
						battle.enemies.filter((enemy) => enemy.hp > 0 && enemy.pendingSkill).map((enemy) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "slice-warning",
							role: "status",
							children: [
								enemy.name,
								": ",
								skills[enemy.pendingSkill].name,
								" in der nächsten Runde."
							]
						}, enemy.id)),
						battle.result === "defeat" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "slice-result",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Die Nordwacht muss warten." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Deine Reise endet hier. Ein neuer Versuch beginnt mit frischen Ressourcen." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "slice-button primary",
									onClick: start,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 17 }), " Begegnung wiederholen"]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "slice-command",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "slice-action-list",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "slice-eyebrow",
										children: "DEINE AKTION"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "slice-actions",
										children: [battle.player.skills.filter((id) => !skills[id].trigger).map((id) => {
											const action = skills[id];
											const blocked = unavailable(battle.player, action);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												disabled: resolving,
												"aria-pressed": selected === id,
												className: `slice-action action-${action.type} ${blocked ? "unavailable" : ""} ${selected === id ? "selected" : ""}`,
												onClick: () => setSelected(id),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: action.type === "defense" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 20 }) : action.type === "control" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 20 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sword, { size: 20 }) }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: action.name }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: blocked ?? Object.entries(action.cost).map(([resource, value]) => `${value} ${resource === "focus" ? "Fokus" : "Ausdauer"}`).join(" · ") })
												]
											}, id);
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											disabled: resolving,
											"aria-pressed": selected === null,
											className: `slice-action action-rest ${selected === null ? "selected" : ""}`,
											onClick: () => setSelected(null),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wind, { size: 20 }) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Kraft sammeln" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "+6 Ausdauer · +4 Fokus" })
											]
										})]
									}),
									battle.player.skills.filter((id) => skills[id].trigger).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "slice-reaction",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sword, { size: 14 }),
											skills[id].name,
											" · automatisch nach Nahkampftreffer · ",
											unavailable(battle.player, skills[id]) ?? "bereit"
										]
									}, id)),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "slice-consumables",
										children: Object.entries(battle.inventory).filter(([, count]) => count > 0).map(([id, count]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											disabled: resolving || battle.player.skipTurn,
											"aria-pressed": selected === `item:${id}`,
											className: `slice-supply ${selected === `item:${id}` ? "selected" : ""}`,
											onClick: () => setSelected(`item:${id}`),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 15 }),
												items[id].name,
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["×", count] })
											]
										}, id))
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "slice-preview",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "slice-preview-heading",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "slice-eyebrow",
											children: "VORSCHAU"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "slice-cancel",
											disabled: resolving || !selected,
											onClick: () => setSelected(null),
											"aria-label": "Auswahl abbrechen",
											title: "Auswahl abbrechen",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: battle.player.skipTurn ? "Betäubt" : skill?.name ?? item?.name ?? "Kraft sammeln" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: battle.player.skipTurn ? "Dein Zug entfällt. Danach handeln die Gegner." : skill?.description ?? item?.description ?? "Ressourcen auffüllen. Danach handeln die Gegner." }),
									skill && !battle.player.skipTurn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "slice-outcome",
										children: [recipient?.name, damage > 0 ? ` · ${damage} Schaden` : " · Statuswirkung"]
									}),
									item?.use && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "slice-outcome",
										children: [
											item.use.heal_hp ? `+${item.use.heal_hp} LP ` : "",
											item.use.restore_focus ? `+${item.use.restore_focus} Fokus ` : "",
											item.use.next_attack_bonus ? `+${item.use.next_attack_bonus} auf den nächsten Angriff` : ""
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "slice-button primary",
										disabled: Boolean(reason) || resolving,
										onClick: act,
										children: [resolving ? "Auflösung …" : reason ?? (battle.player.skipTurn ? "Zug aussetzen" : "Aktion bestätigen"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 16 })]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "slice-log",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: ["Kampfprotokoll · Runde ", battle.round] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"aria-live": "polite",
								children: history.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: entry.startsWith("—") ? "slice-log-round" : void 0,
									children: entry
								}, index))
							})]
						})
					] }),
					screen === "reward" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "slice-result",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "slice-eyebrow",
								children: "BEGEGNUNG BESTANDEN"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Ein Schritt näher." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "slice-reward",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 20 }),
									" +",
									encounter.rewards.xp,
									" EP"
								] }), encounter.rewards.items?.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 18 }), items[id].name] }, id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								"Gesammelt: ",
								xp,
								" EP."
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "slice-button primary",
								onClick: () => setScreen(step === encounters.length - 1 ? "finish" : "progress"),
								children: ["Reise fortsetzen ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 17 })]
							})
						]
					}),
					screen === "progress" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "slice-result",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "slice-eyebrow",
								children: "KARRIEREFORTSCHRITT"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
								career.name,
								" · Stufe ",
								step + 2
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "slice-growth",
								children: Object.entries(career.stat_growth).filter(([, value]) => value > 0).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"+",
									value,
									" ",
									statName(key)
								] }, key))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Lebenspunkte und Ressourcen vollständig wiederhergestellt." }),
							step === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Neu: ", career.skill_pool.filter((id) => !career.starting_skills.includes(id)).map((id) => skills[id].name).join(", ")] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "slice-button primary",
								onClick: () => {
									setStep(step + 1);
									setScreen("encounter");
								},
								children: ["Nächste Begegnung ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 17 })]
							})
						]
					}),
					screen === "finish" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "slice-result",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "slice-eyebrow",
								children: "REISE ABGESCHLOSSEN"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Die Nordwacht gehört dir." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								"Vier Begegnungen · ",
								xp,
								" EP · ",
								career.name
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "slice-button primary",
								onClick: reset,
								children: ["Neue Reise ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 17 })]
							})
						]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "slice-footnote",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ECHO//BRUCH" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Nordwacht · ", screen === "career" ? "Aufbruch" : `Stufe ${step + 1}`] })]
				})
			]
		})]
	});
}
function ActorPanel({ actor }) {
	const ratio = `${actor.hp / actor.stats.hp * 100}%`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "slice-actor",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "slice-actor-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actor.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 13 }),
					actor.hp,
					" / ",
					actor.stats.hp
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "slice-meter",
				role: "meter",
				"aria-label": `${actor.name} Lebenspunkte`,
				"aria-valuenow": actor.hp,
				"aria-valuemin": 0,
				"aria-valuemax": actor.stats.hp,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "slice-meter-ghost",
					style: { width: ratio }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: ratio } })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "slice-actor-resources",
				children: [actor.stats.stamina !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { size: 13 }),
					actor.stamina,
					"/",
					actor.stats.stamina,
					" Ausdauer"
				] }), actor.stats.focus !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 13 }),
					actor.focus,
					"/",
					actor.stats.focus,
					" Fokus"
				] })]
			}),
			actor.nextAttackBonus > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "slice-reaction",
				children: ["Nächster Angriff: +", actor.nextAttackBonus]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "slice-effects",
				children: actor.effects.map((effect) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: `status-${effect.id}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusSymbol, { id: effect.id }),
						statuses[effect.id]?.name,
						" · ",
						effect.duration,
						" R · ×",
						effect.stacks
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: statuses[effect.id]?.description })]
				}, effect.id))
			})
		]
	});
}
function StatusSymbol({ id }) {
	return id === "guarded" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 13 }) : id === "bleeding" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 13 }) : id === "chilled" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wind, { size: 13 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 13 });
}
function statName(key) {
	return {
		hp: "LP",
		stamina: "Ausdauer",
		focus: "Fokus",
		attack: "Angriff",
		defense: "Verteidigung",
		magic: "Magie",
		speed: "Tempo"
	}[key] ?? key;
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliceApp, {});
}
//#endregion
export { Home as component };
