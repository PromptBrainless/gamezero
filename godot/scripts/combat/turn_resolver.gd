class_name TurnResolver
extends RefCounted

const ActorState = preload("res://scripts/combat/combatant_state.gd")
const BattleState = preload("res://scripts/combat/combat_state.gd")

static func create_battle(career: Dictionary, opponents: Array, registry: Dictionary, seed: int = 42) -> Dictionary:
	var record := career.duplicate(true)
	var inventory: Dictionary = {}
	var equipment_effects: Dictionary = {}
	for id in career.get("starting_items", []):
		var item: Dictionary = registry.get("items", {}).get(id, {})
		if item.is_empty() or (item.has("career_tags") and not career.id in item.career_tags):
			continue
		if item.get("slot", "") == "consumable":
			inventory[id] = int(inventory.get(id, 0)) + 1
			continue
		for key in item.get("stat_modifiers", {}):
			record.base_stats[key] = record.base_stats.get(key, 0) + item.stat_modifiers[key]
		for effect in item.get("effects", []):
			for key in effect:
				equipment_effects[key] = float(equipment_effects.get(key, 1.0)) * float(effect[key])
	var player: Dictionary = ActorState.create(record, career.starting_skills)
	player.equipment_effects = equipment_effects
	var enemies: Array = []
	var instance_counts: Dictionary = {player.id: 1}
	for opponent in opponents:
		var phases: Array = opponent.get("phases", [])
		var skills: Array = opponent.get("skills", phases[0].skills if not phases.is_empty() else [])
		var enemy: Dictionary = ActorState.create(opponent, skills, true)
		enemy.content_id = opponent.id
		instance_counts[opponent.id] = int(instance_counts.get(opponent.id, 0)) + 1
		if instance_counts[opponent.id] > 1:
			enemy.id = "%s#%s" % [opponent.id, instance_counts[opponent.id]]
		enemies.append(enemy)
	var battle: Dictionary = BattleState.create(player, enemies, inventory, seed)
	BattleState.emit(battle, "battle_start", player.id, "", {"seed": seed})
	for enemy in enemies:
		if not enemy.phases.is_empty():
			_enter_phase(battle, enemy, 0, registry)
	_outcome(battle)
	return battle

static func unavailable(actor: Dictionary, skill: Dictionary) -> String:
	if skill.has("trigger"):
		return "Automatische Reaktion: nach Nahkampftreffer"
	return _action_unavailable(actor, skill)

static func _action_unavailable(actor: Dictionary, skill: Dictionary) -> String:
	if int(actor.hp) <= 0:
		return "Besiegt"
	if actor.get("skip_turn", false):
		return "Betäubt: Zug aussetzen"
	if int(actor.cooldowns.get(skill.get("id", ""), 0)) > 0:
		return "Abklingzeit: %s Runden" % actor.cooldowns[skill.id]
	for resource in ["stamina", "focus"]:
		if not actor.get("free_" + resource, false) and int(skill.get("cost", {}).get(resource, 0)) > int(actor[resource]):
			return "Nicht genug Ausdauer" if resource == "stamina" else "Nicht genug Fokus"
	return ""

static func _stat(actor: Dictionary, key: String, registry: Dictionary) -> float:
	var value := float(actor.stats.get(key, 0))
	for effect in actor.effects:
		value += float(registry.statuses.get(effect.id, {}).get("effect", {}).get(key + "_modifier", 0)) * int(effect.stacks)
	return maxf(0.0, value)

static func _modifier(actor: Dictionary, key: String, registry: Dictionary) -> float:
	var value := float(actor.equipment_effects.get(key, 1.0))
	for effect in actor.effects:
		value *= pow(float(registry.statuses.get(effect.id, {}).get("effect", {}).get(key, 1.0)), int(effect.stacks))
	return value

static func preview(source: Dictionary, target: Dictionary, skill: Dictionary, registry: Dictionary) -> int:
	if not skill.has("damage"):
		return 0
	var damage: Dictionary = skill.damage
	var physical: bool = damage.get("damage_type", "physical") == "physical"
	var bonus := int(source.next_attack_bonus) if physical else 0
	var raw := maxf(1.0, float(damage.flat) + bonus + _stat(source, damage.scaling_stat, registry) * float(damage.multiplier) - _stat(target, "defense", registry))
	var modifier := _modifier(target, "damage_taken_multiplier", registry)
	if not physical:
		modifier *= float(target.equipment_effects.get("magic_damage_taken_multiplier", 1.0))
	return maxi(1, int(floor(raw * modifier + 0.5)))

static func _damage(battle: Dictionary, source: String, target: Dictionary, amount: int, payload: Dictionary) -> void:
	var before := int(target.hp)
	target.hp = maxi(0, before - amount)
	payload = payload.duplicate(true)
	payload.merge({"amount": amount, "hp_before": before, "hp_after": target.hp})
	BattleState.emit(battle, "damage", source, target.id, payload)
	if target.hp == 0 and not target.dead_reported:
		target.dead_reported = true
		BattleState.emit(battle, "death", source, target.id)

static func _sync_skip(actor: Dictionary, registry: Dictionary) -> void:
	actor.skip_turn = false
	for effect in actor.effects:
		if registry.statuses.get(effect.id, {}).get("effect", {}).get("skip_turn", false):
			actor.skip_turn = true

static func _apply(battle: Dictionary, source: Dictionary, target: Dictionary, application: Dictionary, registry: Dictionary) -> void:
	var id: String = application.get("status", application.get("apply_status", ""))
	var definition: Dictionary = registry.statuses.get(id, {})
	if definition.is_empty() or target.hp <= 0:
		return
	if BattleState.random(battle) >= float(application.get("chance", 1.0)):
		BattleState.emit(battle, "status_resisted", source.id, target.id, {"status": id})
		return
	var duration := int(application.get("duration", definition.default_duration))
	var found := false
	for effect in target.effects:
		if effect.id == id:
			effect.duration = maxi(int(effect.duration), duration)
			effect.stacks = mini(int(definition.max_stacks), int(effect.stacks) + 1)
			effect.born_turn = target.turn_count
			found = true
			break
	if not found:
		target.effects.append({"id": id, "duration": duration, "stacks": 1, "born_turn": target.turn_count})
	_sync_skip(target, registry)
	BattleState.emit(battle, "status_applied", source.id, target.id, {"status": id, "duration": duration})

static func _cleanse(battle: Dictionary, source: Dictionary, target: Dictionary, ids: Array, registry: Dictionary) -> void:
	for index in range(target.effects.size() - 1, -1, -1):
		if target.effects[index].id in ids:
			BattleState.emit(battle, "status_removed", source.id, target.id, {"status": target.effects[index].id, "reason": "cleanse"})
			target.effects.remove_at(index)
	_sync_skip(target, registry)

static func _use_skill(battle: Dictionary, source: Dictionary, target: Dictionary, skill: Dictionary, registry: Dictionary, reaction: bool = false) -> void:
	var recipient: Dictionary = source if skill.target == "self" else target
	for resource in ["stamina", "focus"]:
		if not source.get("free_" + resource, false):
			source[resource] -= int(skill.cost.get(resource, 0))
	source.cooldowns[skill.id] = int(skill.cooldown) + 1
	BattleState.emit(battle, "reaction" if reaction else "action", source.id, recipient.id, {"skill": skill.id})
	if skill.has("damage"):
		var amount := preview(source, recipient, skill, registry)
		if skill.damage.get("damage_type", "physical") == "physical":
			source.next_attack_bonus = 0
		_damage(battle, source.id, recipient, amount, {"skill": skill.id, "damage_type": skill.damage.get("damage_type", "physical")})
	_cleanse(battle, source, recipient, skill.get("removes_statuses", []), registry)
	for application in skill.get("applies_statuses", []):
		var affected: Dictionary = recipient
		if application.get("target", "") == "self":
			affected = source
		elif application.get("target", "") == "enemy":
			affected = target
		_apply(battle, source, affected, application, registry)

static func _tick(battle: Dictionary, actor: Dictionary, timing: String, registry: Dictionary) -> void:
	for effect in actor.effects:
		# A self-buff applied during this action starts aging at its next opportunity.
		if int(effect.get("born_turn", -1)) >= int(actor.turn_count):
			continue
		var definition: Dictionary = registry.statuses.get(effect.id, {})
		if definition.get("tick", "turn_start") != timing:
			continue
		var data: Dictionary = definition.get("effect", {})
		var amount := int(data.get("damage_per_turn_per_stack", 0)) * int(effect.stacks)
		if amount > 0:
			if not data.get("ignores_defense", false):
				amount = maxi(1, amount - int(_stat(actor, "defense", registry)))
			BattleState.emit(battle, "status_tick", actor.id, actor.id, {"status": effect.id, "amount": amount, "timing": timing})
			_damage(battle, actor.id, actor, amount, {"status": effect.id, "damage_type": data.get("damage_type", "")})
			if actor.hp <= 0:
				break

static func _begin_turn(battle: Dictionary, actor: Dictionary, registry: Dictionary) -> bool:
	actor.turn_count += 1
	var skipped: bool = actor.skip_turn
	_sync_skip(actor, registry)
	skipped = skipped or actor.skip_turn
	_tick(battle, actor, "turn_start", registry)
	if skipped and actor.hp > 0:
		BattleState.emit(battle, "turn_skipped", actor.id, actor.id, {"reason": "stunned"})
	return skipped

static func _end_turn(battle: Dictionary, actor: Dictionary, registry: Dictionary) -> void:
	_tick(battle, actor, "turn_end", registry)
	if actor.hp <= 0:
		return
	_regenerate(battle, actor, int(floor(4 * _modifier(actor, "stamina_regen_multiplier", registry))), 3)
	for id in actor.cooldowns:
		actor.cooldowns[id] = maxi(0, int(actor.cooldowns[id]) - 1)
	for index in range(actor.effects.size() - 1, -1, -1):
		var effect: Dictionary = actor.effects[index]
		if int(effect.get("born_turn", -1)) < int(actor.turn_count):
			effect.duration -= 1
			if effect.duration <= 0:
				BattleState.emit(battle, "status_removed", actor.id, actor.id, {"status": effect.id, "reason": "expired"})
				actor.effects.remove_at(index)
	_sync_skip(actor, registry)

static func _regenerate(battle: Dictionary, actor: Dictionary, stamina: int, focus: int) -> void:
	var old_stamina := int(actor.stamina)
	var old_focus := int(actor.focus)
	actor.stamina = mini(int(actor.stats.get("stamina", 0)), old_stamina + stamina)
	actor.focus = mini(int(actor.stats.get("focus", 0)), old_focus + focus)
	BattleState.emit(battle, "resources", actor.id, actor.id, {"stamina": actor.stamina, "focus": actor.focus, "stamina_gained": actor.stamina - old_stamina, "focus_gained": actor.focus - old_focus})

static func _recover(battle: Dictionary, actor: Dictionary) -> void:
	BattleState.emit(battle, "recovery", actor.id, actor.id)
	_regenerate(battle, actor, 6, 4)

static func _enter_phase(battle: Dictionary, enemy: Dictionary, index: int, registry: Dictionary) -> void:
	enemy.phase_index = index
	var phase: Dictionary = enemy.phases[index]
	enemy.skills = phase.skills.duplicate()
	if not enemy.pending_skill in enemy.skills:
		enemy.pending_skill = ""
		enemy.pending_turns = 0
	BattleState.emit(battle, "phase_change", enemy.id, enemy.id, {"phase": phase.id, "name": phase.name, "index": index})
	for action in phase.get("on_enter", []):
		if action.has("apply_status"):
			_apply(battle, enemy, battle.player if action.get("target", "self") == "enemy" else enemy, action, registry)
		for key in action.get("stat_modifier", {}):
			enemy.stats[key] = enemy.stats.get(key, 0) + action.stat_modifier[key]
			BattleState.emit(battle, "stat_changed", enemy.id, enemy.id, {"stat": key, "value": enemy.stats[key]})

static func _update_phase(battle: Dictionary, enemy: Dictionary, registry: Dictionary) -> void:
	if enemy.phases.is_empty() or enemy.hp <= 0:
		return
	var index := int(enemy.phase_index)
	for candidate in range(index + 1, enemy.phases.size()):
		if float(enemy.hp) / float(enemy.stats.hp) <= float(enemy.phases[candidate].hp_threshold):
			_enter_phase(battle, enemy, candidate, registry)

static func _enemy_skill(battle: Dictionary, enemy: Dictionary, registry: Dictionary) -> Dictionary:
	var choices: Array = []
	var total := 0.0
	for id in enemy.skills:
		var skill: Dictionary = registry.skills.get(id, {})
		if skill.is_empty() or skill.has("trigger") or unavailable(enemy, skill) != "":
			continue
		var weight := float(enemy.ai.get("weights", {}).get(id, 1.0))
		if weight <= 0:
			continue
		total += weight
		choices.append({"skill": skill, "weight": weight})
	if choices.is_empty():
		return {}
	var roll: float = BattleState.random(battle) * total
	for entry in choices:
		roll -= entry.weight
		if roll < 0:
			return entry.skill
	return choices.back().skill

static func _enemy_action(battle: Dictionary, enemy: Dictionary, registry: Dictionary) -> void:
	var skill: Dictionary = {}
	if enemy.pending_skill != "":
		enemy.pending_turns = maxi(0, int(enemy.pending_turns) - 1)
		if enemy.pending_turns > 0:
			BattleState.emit(battle, "telegraph", enemy.id, battle.player.id, {"skill": enemy.pending_skill, "warning_turns": enemy.pending_turns})
			return
		skill = registry.skills.get(enemy.pending_skill, {})
		if skill.is_empty() or unavailable(enemy, skill) != "":
			_recover(battle, enemy)
			return
		enemy.pending_skill = ""
	else:
		skill = _enemy_skill(battle, enemy, registry)
		if not skill.is_empty() and not enemy.phases.is_empty():
			for telegraph in enemy.phases[enemy.phase_index].get("telegraphs", []):
				if telegraph.skill == skill.id and int(telegraph.warning_turns) > 0:
					enemy.pending_skill = skill.id
					enemy.pending_turns = int(telegraph.warning_turns)
					BattleState.emit(battle, "telegraph", enemy.id, battle.player.id, telegraph.duplicate(true))
					return
	if skill.is_empty():
		_recover(battle, enemy)
		return
	var before := int(battle.player.hp)
	_use_skill(battle, enemy, battle.player, skill, registry)
	if battle.player.hp > 0 and battle.player.hp < before and "melee" in skill.get("tags", []):
		for id in battle.player.skills:
			var reaction: Dictionary = registry.skills.get(id, {})
			if reaction.get("trigger", "") == "after_melee_hit" and _action_unavailable(battle.player, reaction) == "":
				_use_skill(battle, battle.player, enemy, reaction, registry, true)
				_update_phase(battle, enemy, registry)
				break

static func _use_item(battle: Dictionary, id: String, registry: Dictionary) -> void:
	var player: Dictionary = battle.player
	var item: Dictionary = registry.items[id]
	var use: Dictionary = item.use
	battle.inventory[id] -= 1
	var before := int(player.hp)
	player.hp = mini(int(player.stats.hp), before + int(use.get("heal_hp", 0)))
	player.focus = mini(int(player.stats.get("focus", 0)), int(player.focus) + int(use.get("restore_focus", 0)))
	player.next_attack_bonus += int(use.get("next_attack_bonus", 0))
	BattleState.emit(battle, "item_used", player.id, player.id, {"item": id, "hp_before": before, "hp_after": player.hp, "focus": player.focus, "next_attack_bonus": player.next_attack_bonus})
	_cleanse(battle, player, player, use.get("removes_statuses", []), registry)
	for application in use.get("applies_statuses", []):
		_apply(battle, player, player, application, registry)

static func _outcome(battle: Dictionary) -> bool:
	var result := ""
	if battle.player.hp <= 0:
		result = "defeat"
	else:
		var alive := false
		for enemy in battle.enemies:
			alive = alive or enemy.hp > 0
		if not alive:
			result = "victory"
	if result != "" and battle.result == "":
		battle.result = result
		BattleState.emit(battle, result, battle.player.id, "", {"result": result})
	return result != ""

static func resolve_round(previous: Dictionary, skill_id: String, target_index: int, registry: Dictionary) -> Dictionary:
	if previous.result != "":
		return previous
	var skill: Dictionary = {}
	var item_id := ""
	var target: Dictionary = previous.player
	if skill_id.begins_with("item:"):
		item_id = skill_id.substr(5)
		var item: Dictionary = registry.get("items", {}).get(item_id, {})
		if item.get("slot", "") != "consumable" or not item.has("use") or int(previous.inventory.get(item_id, 0)) <= 0:
			return previous
	elif skill_id != "":
		skill = registry.skills.get(skill_id, {})
		if skill.is_empty() or skill.has("trigger") or not skill_id in previous.player.skills:
			return previous
		if not previous.player.skip_turn and unavailable(previous.player, skill) != "":
			return previous
		if skill.target == "enemy":
			if target_index < 0 or target_index >= previous.enemies.size() or previous.enemies[target_index].hp <= 0:
				return previous
			target = previous.enemies[target_index]
	var battle := previous.duplicate(true)
	battle.events = []
	var skipped := _begin_turn(battle, battle.player, registry)
	if _outcome(battle):
		return battle
	if not skipped:
		if item_id != "":
			_use_item(battle, item_id, registry)
		elif not skill.is_empty():
			target = battle.player if skill.target == "self" else battle.enemies[target_index]
			_use_skill(battle, battle.player, target, skill, registry)
		else:
			_recover(battle, battle.player)
	if _outcome(battle):
		return battle
	for enemy in battle.enemies:
		_update_phase(battle, enemy, registry)
	# Player end ticks follow enemy actions, preserving self-guard through this round.
	for enemy in battle.enemies:
		if enemy.hp <= 0:
			continue
		skipped = _begin_turn(battle, enemy, registry)
		if _outcome(battle):
			return battle
		_update_phase(battle, enemy, registry)
		if enemy.hp > 0:
			if not skipped:
				_enemy_action(battle, enemy, registry)
			if _outcome(battle):
				return battle
			_end_turn(battle, enemy, registry)
			if _outcome(battle):
				return battle
	_end_turn(battle, battle.player, registry)
	_outcome(battle)
	battle.round += 1
	return battle
