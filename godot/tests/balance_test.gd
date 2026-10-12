extends SceneTree

const Resolver = preload("res://scripts/combat/turn_resolver.gd")
var failures := 0

func _initialize() -> void:
	var pack = JSON.parse_string(FileAccess.get_file_as_string("res://data/runtime_pack.json"))
	if not pack is Dictionary or pack.get("schema_version") != 1:
		push_error("BALANCE TEST: validated canonical pack is required")
		quit(1)
		return
	var registry: Dictionary = pack.collections
	var initial := Resolver.create_battle(registry.careers.duelist, [registry.bosses.iron_captain], registry, 42)
	var first := run_offensive(initial, registry)
	var replay := run_offensive(initial, registry)
	check(first == replay, "Seed 42 reproduces identical native state and ordered combat trace")
	check(first.battle.result == "defeat", "Recorded starting-stat offensive Duelist failure remains reproducible; not a balance approval")
	check(first.battle.enemies[0].hp > 0, "Duelist defeat leaves a surviving boss")
	check(initial.round == 1 and initial.player.hp == initial.player.stats.hp, "Diagnostic replay does not mutate initial state")
	var reactions := 0
	for turn in first.trace:
		for event in turn.events:
			if event.type == "reaction" and event.payload.get("skill") == "riposte":
				reactions += 1
	check(reactions == 4, "Canonical automatic Riposte executes four times; failure is not a missing reaction")
	check(first.battle.round == 14 and first.battle.enemies[0].hp == 23, "Seed 42 failure snapshot is stable")
	print("Duelist boss diagnostic seed 42: ", JSON.stringify(first.trace))
	print("Duelist boss result: %s, player HP %s, boss HP %s, ripostes %s; no balance values changed." % [first.battle.result, first.battle.player.hp, first.battle.enemies[0].hp, reactions])
	print("Balance diagnostic tests: 6 checks, %s failures" % failures)
	quit(0 if failures == 0 else 1)

func check(condition: bool, message: String) -> void:
	if not condition:
		failures += 1
		push_error("BALANCE TEST: " + message)

func run_offensive(initial: Dictionary, registry: Dictionary) -> Dictionary:
	var battle := initial.duplicate(true)
	var trace: Array = []
	for turn in range(200):
		if not battle.result.is_empty():
			break
		var action := ""
		var best := 0
		for id in battle.player.skills:
			var skill: Dictionary = registry.skills[id]
			if skill.target != "enemy" or Resolver.unavailable(battle.player, skill) != "":
				continue
			var damage := Resolver.preview(battle.player, battle.enemies[0], skill, registry)
			if damage > best:
				action = id
				best = damage
		for id in battle.inventory:
			var use: Dictionary = registry.items[id].get("use", {})
			if battle.inventory[id] > 0 and int(use.get("heal_hp", 0)) > 0 and battle.player.hp <= battle.player.stats.hp - int(use.heal_hp):
				action = "item:" + id
				break
		battle = Resolver.resolve_round(battle, action, 0, registry)
		trace.append({"round": turn + 1, "action": action, "player_hp": battle.player.hp, "stamina": battle.player.stamina, "boss_hp": battle.enemies[0].hp, "phase": battle.enemies[0].phase_index, "events": battle.events.duplicate(true)})
	return {"battle": battle, "trace": trace}
