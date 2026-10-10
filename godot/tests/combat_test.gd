extends SceneTree

const Resolver = preload("res://scripts/combat/turn_resolver.gd")
var registry: Dictionary
var failures := 0
var checks := 0

func _initialize() -> void:
	var file := FileAccess.open("res://data/runtime_pack.json", FileAccess.READ)
	if file == null:
		push_error("Canonical runtime_pack.json is required")
		quit(1)
		return
	var pack = JSON.parse_string(file.get_as_text())
	if not pack is Dictionary or pack.get("schema_version", 0) != 1:
		push_error("Invalid canonical runtime pack")
		quit(1)
		return
	registry = pack.collections
	_test_creation_damage()
	_test_actions_replay()
	_test_statuses_cooldowns()
	_test_phases_telegraphs()
	_test_reactions_items()
	_test_outcomes_ai()
	print("Combat tests: %s checks, %s failures" % [checks, failures])
	quit(1 if failures > 0 else 0)

func _check(condition: bool, message: String) -> void:
	checks += 1
	if not condition:
		failures += 1
		push_error(message)

func _battle(career: String = "mercenary", enemy: String = "alley_cutthroat", seed: int = 42) -> Dictionary:
	var opponent: Dictionary = registry.enemies.get(enemy, registry.bosses.get(enemy, {}))
	return Resolver.create_battle(registry.careers[career], [opponent], registry, seed)

func _events(battle: Dictionary, type: String) -> Array:
	return battle.events.filter(func(event: Dictionary) -> bool: return event.type == type)

func _effect(actor: Dictionary, id: String) -> Dictionary:
	for effect in actor.effects:
		if effect.id == id:
			return effect
	return {}

func _quiet_enemy(battle: Dictionary) -> void:
	battle.enemies[0].skills = []
	battle.enemies[0].phases = []
	battle.enemies[0].hp = 1000
	battle.enemies[0].stats.hp = 1000

func _test_creation_damage() -> void:
	var original := registry.duplicate(true)
	var battle := _battle()
	_check(battle.round == 1 and battle.result == "", "Fresh battle contract")
	_check(battle.player.stats.attack == 10 and battle.player.stats.defense == 8, "Starting equipment stats applied")
	_check(battle.player.skills == registry.careers.mercenary.starting_skills, "No invented progression skills")
	_check(battle.enemies[0].free_stamina and battle.enemies[0].free_focus, "Omitted enemy pools are resource-free")
	var mage := _battle("scholar_mage")
	_check(mage.player.stats.magic == 12 and mage.player.focus == 61, "Equipment adjusts resource maxima")
	_check(mage.inventory.get("focus_draught") == 1, "Starting consumables populated")
	_check(registry == original, "Creation does not mutate records")
	var hit: int = Resolver.preview(battle.player, battle.enemies[0], registry.skills.shield_bash, registry)
	_check(hit == 11, "Canonical flat + scaling - defense damage")
	battle.enemies[0].effects = [{"id": "guarded", "duration": 2, "stacks": 1}]
	_check(Resolver.preview(battle.player, battle.enemies[0], registry.skills.shield_bash, registry) == 7, "Guard damage rounds canonical result")
	battle.enemies[0].effects = [{"id": "exposed", "duration": 2, "stacks": 1}]
	_check(Resolver.preview(battle.player, battle.enemies[0], registry.skills.shield_bash, registry) == 13, "Defense modifier clamped at zero")
	mage.player.equipment_effects = {"magic_damage_taken_multiplier": 0.9}
	var base: int = Resolver.preview(mage.enemies[0], mage.player, registry.skills.arcane_bolt, registry)
	_check(base == 1, "Minimum magical damage retained with equipment reduction")
	battle.player.equipment_effects = {"magic_damage_taken_multiplier": 0.9}
	_check(Resolver.preview(mage.player, battle.player, registry.skills.arcane_bolt, registry) == 8, "Equipment reduces actual non-minimum magic damage")
	battle.player.equipment_effects = {}
	_check(Resolver.preview(mage.player, battle.player, registry.skills.arcane_bolt, registry) == 9, "Magic reduction compares against unprotected preview")
	var talisman_career: Dictionary = registry.careers.scholar_mage.duplicate(true)
	talisman_career.starting_items.append("ward_talisman")
	var protected_battle := Resolver.create_battle(talisman_career, [registry.enemies.hedge_cultist], registry)
	_check(is_equal_approx(protected_battle.player.equipment_effects.magic_damage_taken_multiplier, 0.9), "Equipment effect consumed from registry")

func _test_actions_replay() -> void:
	var battle := _battle()
	_quiet_enemy(battle)
	var original := battle.duplicate(true)
	var resolved := Resolver.resolve_round(battle, "shield_bash", 0, registry)
	_check(battle == original, "Round cannot mutate its input")
	_check(resolved.round == 2 and resolved.player.stamina == 26, "Skill pays cost, then regenerates")
	_check(not _events(resolved, "action").is_empty(), "Action emits ordered events")
	_check(resolved.seed == ((42 * 1664525 + 1013904223) & 0xffffffff), "Seed advances by canonical LCG for status roll")
	var previous_seq := int(battle.seq)
	for event in resolved.events:
		_check(event.seq > previous_seq and event.turn == 1 and event.has("payload") and event.has("source") and event.has("target"), "Event schema/monotonic sequence")
		previous_seq = event.seq
	var again := Resolver.resolve_round(resolved, "", -1, registry)
	_check(again.events[0].seq > resolved.seq and again.events[0].turn == 2, "Sequence persists but round events reset")
	var one := _battle("duelist", "rusted_deserter", 90210)
	var two := one.duplicate(true)
	for index in range(12):
		var chosen := "precise_thrust" if Resolver.unavailable(one.player, registry.skills.precise_thrust) == "" else ""
		one = Resolver.resolve_round(one, chosen, 0, registry)
		two = Resolver.resolve_round(two, chosen, 0, registry)
		_check(one == two, "Seeded replay identical at round %s" % index)
	var different := _battle("duelist", "rusted_deserter", 90211)
	_check(different.seed != _battle("duelist", "rusted_deserter", 90210).seed, "Independent seeds retained")
	var invalid := _battle("duelist")
	_check(Resolver.unavailable(invalid.player, registry.skills.riposte) != "", "Automatic reaction explains manual unavailability")
	var snapshot := invalid.duplicate(true)
	for action in ["not_a_skill", "riposte", "arcane_bolt", "item:missing", "item:whetstone"]:
		_check(Resolver.resolve_round(invalid, action, 0, registry) == snapshot, "Invalid action unchanged: " + action)
	for target in [-1, 1, 999]:
		_check(Resolver.resolve_round(invalid, "precise_thrust", target, registry) == snapshot, "Invalid target unchanged")
	invalid.player.stamina = 0
	_check(Resolver.resolve_round(invalid, "precise_thrust", 0, registry) == invalid, "Unaffordable action unchanged")
	_check(Resolver.unavailable(invalid.player, registry.skills.precise_thrust) != "", "Unaffordable reason")
	invalid.enemies[0].hp = 0
	_check(Resolver.resolve_round(invalid, "precise_thrust", 0, registry) == invalid, "Dead target rejected")

func _test_statuses_cooldowns() -> void:
	var battle := _battle()
	_quiet_enemy(battle)
	battle.player.effects = [{"id": "bleeding", "duration": 2, "stacks": 2}, {"id": "chilled", "duration": 1, "stacks": 1}]
	battle.player.stamina = 0
	var hp := int(battle.player.hp)
	battle = Resolver.resolve_round(battle, "", 0, registry)
	_check(battle.player.hp == hp - 6, "Bleed ticks at own turn_start, per stack and ignores defense")
	_check(battle.events[0].type == "status_tick", "Turn-start DoT precedes player action")
	_check(battle.player.stamina == 9, "Chilled affects regen on its final turn: recovery 6 + regen 3")
	_check(_effect(battle.player, "chilled").is_empty() and _effect(battle.player, "bleeding").duration == 1, "Duration ages/expiry once per opportunity")
	battle = Resolver.resolve_round(battle, "", 0, registry)
	_check(battle.player.hp == hp - 12 and _effect(battle.player, "bleeding").is_empty(), "Bleed final tick and expiry")
	var stunned := _battle()
	_quiet_enemy(stunned)
	stunned.player.effects = [{"id": "stunned", "duration": 1, "stacks": 1}]
	stunned.player.skip_turn = true
	var stamina := int(stunned.player.stamina)
	stunned = Resolver.resolve_round(stunned, "shield_bash", 0, registry)
	_check(_events(stunned, "turn_skipped").size() == 1 and stunned.player.stamina == stamina, "Stun consumes exactly one opportunity, no action cost")
	_check(not stunned.player.skip_turn and stunned.player.effects.is_empty(), "Stun expires without permanently locking combat")
	var cooldown := _battle()
	_quiet_enemy(cooldown)
	cooldown = Resolver.resolve_round(cooldown, "shield_bash", 0, registry)
	_check(cooldown.player.cooldowns.shield_bash == 1, "Cooldown one blocks next opportunity")
	_check(Resolver.resolve_round(cooldown, "shield_bash", 0, registry) == cooldown, "Cooldown action rejected unchanged")
	cooldown = Resolver.resolve_round(cooldown, "", 0, registry)
	_check(Resolver.unavailable(cooldown.player, registry.skills.shield_bash) == "", "Cooldown available after required opportunity")
	var feint := _battle("duelist")
	_quiet_enemy(feint)
	feint.player.skills.append("quick_feint")
	feint.player.effects = [{"id": "chilled", "duration": 3, "stacks": 1}]
	feint = Resolver.resolve_round(feint, "quick_feint", -1, registry)
	_check(_effect(feint.player, "chilled").is_empty() and not _effect(feint.player, "focused").is_empty(), "Cleanse and duration-one setup survives for next action")
	var before: int = Resolver.preview(feint.player, feint.enemies[0], registry.skills.precise_thrust, registry)
	feint = Resolver.resolve_round(feint, "precise_thrust", 0, registry)
	_check(_events(feint, "damage")[0].payload.amount == before and _effect(feint.player, "focused").is_empty(), "Focused attack modifier works through expiry turn")
	var custom := registry.duplicate(true)
	custom.statuses.bleeding.tick = "turn_end"
	var end_tick := _battle()
	_quiet_enemy(end_tick)
	end_tick.player.effects = [{"id": "bleeding", "duration": 1, "stacks": 1}]
	end_tick = Resolver.resolve_round(end_tick, "", 0, custom)
	_check(end_tick.events[0].type == "recovery" and _events(end_tick, "status_tick")[0].payload.timing == "turn_end", "Authored turn_end timing respected")
	var cleanse := _battle()
	_quiet_enemy(cleanse)
	cleanse.player.effects = [{"id": "bleeding", "duration": 3, "stacks": 1}, {"id": "exposed", "duration": 2, "stacks": 1}]
	cleanse = Resolver.resolve_round(cleanse, "hold_the_line", -999, registry)
	_check(_effect(cleanse.player, "bleeding").is_empty() and _effect(cleanse.player, "exposed").is_empty(), "Hold the line cleanses actual content debuffs")
	_check(_effect(cleanse.player, "guarded").duration == 2, "New self guard does not expire application round")
	var stacked := _battle()
	_quiet_enemy(stacked)
	stacked.player.skills.append("rending_cut")
	stacked.enemies[0].effects = [{"id": "bleeding", "duration": 1, "stacks": 3}]
	custom.skills.rending_cut.applies_statuses[0].chance = 1.0
	stacked = Resolver.resolve_round(stacked, "rending_cut", 0, custom)
	_check(_effect(stacked.enemies[0], "bleeding").stacks == 3 and _effect(stacked.enemies[0], "bleeding").duration == 2, "Reapplication caps stacks and refreshes duration before enemy tick")
	var damaging_enemy: Dictionary = registry.enemies.alley_cutthroat.duplicate(true)
	damaging_enemy.skills = ["precise_thrust"]
	var enemy_cooldown := Resolver.create_battle(registry.careers.mercenary, [damaging_enemy], registry)
	enemy_cooldown.player.hp = 1000
	enemy_cooldown.player.stats.hp = 1000
	enemy_cooldown = Resolver.resolve_round(enemy_cooldown, "", 0, registry)
	_check(enemy_cooldown.enemies[0].cooldowns.precise_thrust == 2, "Enemy cooldown same semantics as player")
	for index in range(2):
		enemy_cooldown = Resolver.resolve_round(enemy_cooldown, "", 0, registry)
		_check(_events(enemy_cooldown, "action").is_empty() and _events(enemy_cooldown, "recovery").size() == 2, "Enemy waits/recoveries while cooldown blocked")
	enemy_cooldown = Resolver.resolve_round(enemy_cooldown, "", 0, registry)
	_check(_events(enemy_cooldown, "action").size() == 1, "Enemy acts after two blocked opportunities")

func _test_phases_telegraphs() -> void:
	var battle := _battle("mercenary", "iron_captain")
	battle.player.hp = 1000
	battle.player.stats.hp = 1000
	battle.enemies[0].hp = 40
	battle = Resolver.resolve_round(battle, "", 0, registry)
	_check(battle.enemies[0].phase_index == 1 and battle.enemies[0].stats.attack == 10, "Boss threshold applies phase stat modifier")
	_check(not _effect(battle.enemies[0], "guarded").is_empty(), "Phase on-enter applies guarded")
	battle = Resolver.resolve_round(battle, "", 0, registry)
	_check(battle.enemies[0].stats.attack == 10, "Phase effects not repeated")
	var boss: Dictionary = registry.bosses.iron_captain.duplicate(true)
	boss.phases[0].skills = ["iron_command"]
	boss.phases[0].telegraphs[0].warning_turns = 2
	var telegraph := Resolver.create_battle(registry.careers.mercenary, [boss], registry)
	telegraph = Resolver.resolve_round(telegraph, "", 0, registry)
	_check(telegraph.enemies[0].pending_skill == "iron_command" and telegraph.enemies[0].pending_turns == 2 and _events(telegraph, "damage").is_empty(), "Telegraph replaces attack and honors warning_turns")
	telegraph = Resolver.resolve_round(telegraph, "", 0, registry)
	_check(telegraph.enemies[0].pending_turns == 1 and _events(telegraph, "damage").is_empty(), "Multi-turn warning does not fire early")
	telegraph.enemies[0].effects = [{"id": "stunned", "duration": 1, "stacks": 1}]
	telegraph.enemies[0].skip_turn = true
	telegraph = Resolver.resolve_round(telegraph, "", 0, registry)
	_check(telegraph.enemies[0].pending_turns == 1 and _events(telegraph, "damage").is_empty(), "Stun postpones pending telegraph")
	telegraph = Resolver.resolve_round(telegraph, "", 0, registry)
	_check(telegraph.enemies[0].pending_skill == "" and _events(telegraph, "damage").size() == 1, "Telegraphed attack resolves once")

func _test_reactions_items() -> void:
	var custom := registry.duplicate(true)
	custom.skills.rending_cut.applies_statuses = []
	var reaction := _battle("duelist")
	reaction.enemies[0].skills = ["rending_cut"]
	reaction = Resolver.resolve_round(reaction, "", 0, custom)
	_check(_events(reaction, "reaction").size() == 1, "Automatic riposte on melee hit")
	_check(reaction.player.stamina == 32 and reaction.player.cooldowns.riposte == 1, "Reaction pays resource and uses cooldown")
	reaction = Resolver.resolve_round(reaction, "", 0, custom)
	_check(_events(reaction, "reaction").is_empty(), "Riposte cannot ignore cooldown")
	var blocked := _battle("duelist")
	blocked.enemies[0].skills = ["shield_bash"]
	custom.skills.shield_bash.applies_statuses[0].chance = 1.0
	blocked = Resolver.resolve_round(blocked, "", 0, custom)
	_check(_events(blocked, "reaction").is_empty(), "Stun suppresses reaction")
	var lethal_reaction := _battle("duelist")
	lethal_reaction.enemies[0].skills = ["rending_cut"]
	lethal_reaction.enemies[0].hp = 1
	lethal_reaction = Resolver.resolve_round(lethal_reaction, "", 0, custom)
	_check(lethal_reaction.result == "victory" and _events(lethal_reaction, "reaction").size() == 1, "Riposte kill resolves victory")
	var unfunded_reaction := _battle("duelist")
	unfunded_reaction.player.stamina = 0
	unfunded_reaction.enemies[0].skills = ["rending_cut"]
	unfunded_reaction = Resolver.resolve_round(unfunded_reaction, "precise_thrust", 0, custom)
	_check(_events(unfunded_reaction, "reaction").is_empty() and unfunded_reaction.round == 1, "Unaffordable player action rejected before enemy/reactions")
	var item := _battle("duelist")
	_quiet_enemy(item)
	item.player.hp = 20
	item.player.effects = [{"id": "bleeding", "duration": 3, "stacks": 1}]
	item = Resolver.resolve_round(item, "item:bandage_roll", -1, registry)
	_check(item.player.hp == 32 and item.inventory.bandage_roll == 0 and _effect(item.player, "bleeding").is_empty(), "Bandage heals after start bleed, removes bleed and consumes item")
	_check(Resolver.resolve_round(item, "item:bandage_roll", 0, registry) == item, "Consumed item cannot be reused")
	var draught := _battle("scholar_mage")
	_quiet_enemy(draught)
	draught.player.focus = 0
	draught = Resolver.resolve_round(draught, "item:focus_draught", 0, registry)
	_check(draught.player.focus == 18 and not _effect(draught.player, "focused").is_empty(), "Focus draught resources and status")
	draught.inventory.whetstone = 1
	draught = Resolver.resolve_round(draught, "item:whetstone", 0, registry)
	_check(draught.player.next_attack_bonus == 3, "Whetstone arms next physical attack")
	draught = Resolver.resolve_round(draught, "arcane_bolt", 0, registry)
	_check(draught.player.next_attack_bonus == 3, "Magical attack cannot consume physical whetstone")
	draught.player.skills.append("shield_bash")
	var expected: int = Resolver.preview(draught.player, draught.enemies[0], registry.skills.shield_bash, registry)
	draught = Resolver.resolve_round(draught, "shield_bash", 0, registry)
	_check(_events(draught, "damage")[0].payload.amount == expected and draught.player.next_attack_bonus == 0, "Whetstone physical payoff and one-time consumption")

func _test_outcomes_ai() -> void:
	var victory := _battle()
	victory.enemies[0].hp = 1
	victory = Resolver.resolve_round(victory, "shield_bash", 0, registry)
	_check(victory.result == "victory" and _events(victory, "death").size() == 1 and _events(victory, "action").size() == 1, "Victory immediately prevents enemy action")
	_check(Resolver.resolve_round(victory, "", 0, registry) == victory, "Finished battle immutable")
	var multi := Resolver.create_battle(registry.careers.mercenary, [registry.enemies.alley_cutthroat, registry.enemies.hedge_cultist], registry)
	multi.enemies[0].hp = 1
	multi = Resolver.resolve_round(multi, "shield_bash", 0, registry)
	_check(multi.result == "" and _events(multi, "action").size() == 2, "Dead enemy skipped while second enemy still acts")
	var action_events := _events(multi, "action")
	_check(action_events[1].source == "hedge_cultist", "Enemy array action order deterministic")
	var defeat := _battle()
	defeat.player.hp = 1
	defeat.player.effects = [{"id": "bleeding", "duration": 1, "stacks": 1}]
	defeat = Resolver.resolve_round(defeat, "", 0, registry)
	_check(defeat.result == "defeat" and _events(defeat, "recovery").is_empty(), "Turn-start death stops own action")
	var direct_defeat := _battle()
	direct_defeat.player.hp = 1
	direct_defeat.enemies[0].skills = ["rending_cut"]
	direct_defeat = Resolver.resolve_round(direct_defeat, "", 0, registry)
	_check(direct_defeat.result == "defeat" and _events(direct_defeat, "death").size() == 1, "Enemy direct hit defeat")
	var enemy: Dictionary = registry.enemies.alley_cutthroat.duplicate(true)
	enemy.base_stats.stamina = 9
	enemy.base_stats.focus = 0
	enemy.ai.weights = {"precise_thrust": 1000, "rending_cut": 1}
	var affordable := Resolver.create_battle(registry.careers.mercenary, [enemy], registry)
	affordable = Resolver.resolve_round(affordable, "", 0, registry)
	var actions := _events(affordable, "action")
	_check(actions.size() == 1 and actions[0].payload.skill == "rending_cut", "AI filters unaffordable skills despite weights")
	_check(affordable.enemies[0].stamina == 4, "Enemy authored resources paid and regenerated")
	var weighted_enemy: Dictionary = registry.enemies.alley_cutthroat.duplicate(true)
	weighted_enemy.ai.weights = {"precise_thrust": 0, "rending_cut": 1}
	var weighted := Resolver.create_battle(registry.careers.mercenary, [weighted_enemy], registry)
	weighted = Resolver.resolve_round(weighted, "", 0, registry)
	_check(_events(weighted, "action")[0].payload.skill == "rending_cut", "AI uses authored weights")
	for career in registry.careers:
		var opponents: Array = registry.enemies.keys() + registry.bosses.keys()
		for id in opponents:
			var battle := _battle(career, id, 2026)
			for turn in range(150):
				if battle.result != "":
					break
				var action := ""
				var best := 0
				for skill_id in battle.player.skills:
					var skill: Dictionary = registry.skills[skill_id]
					if skill.has("trigger") or Resolver.unavailable(battle.player, skill) != "":
						continue
					var damage: int = Resolver.preview(battle.player, battle.enemies[0], skill, registry)
					if damage > best:
						best = damage
						action = skill_id
				battle = Resolver.resolve_round(battle, action, 0, registry)
			_check(battle.result != "", "Actual content terminates for %s/%s" % [career, id])
