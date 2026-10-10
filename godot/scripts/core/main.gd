extends Node

const HudScript = preload("res://scripts/ui/combat_hud.gd")
const ResolverScript = preload("res://scripts/combat/turn_resolver.gd")
const PACK_PATH = "res://data/runtime_pack.json"

var hud: Control
var resolver = ResolverScript.new()
var registry: Dictionary = {}
var encounter_ids: Array = []
var career_id := ""
var encounter_index := 0
var screen := "loading"
var battle: Dictionary = {}
var combat_events: Array = []
var selected_action := ""
var selected_target := -1
var interaction := "idle"
var total_xp := 0
var earned_items: Dictionary = {}
var run_inventory: Dictionary = {}
var encounter_inventory: Dictionary = {}
var rewarded_encounters: Dictionary = {}
var content_error := ""

func _ready() -> void:
	hud = get_node_or_null("CombatHUD")
	if hud == null:
		hud = HudScript.new()
		hud.name = "CombatHUD"
		add_child(hud)
	hud.action_selected.connect(choose_action)
	hud.target_selected.connect(choose_target)
	hud.confirm_requested.connect(confirm_action)
	hud.cancel_requested.connect(cancel_action)
	load_pack()

func load_pack(path: String = PACK_PATH) -> bool:
	registry.clear()
	encounter_ids.clear()
	reset_state()
	if not FileAccess.file_exists(path):
		return fail_content("Content pack missing: %s\nRun the canonical content exporter, then select Retry loading." % path)
	var file = FileAccess.open(path, FileAccess.READ)
	if file == null:
		return fail_content("Cannot read %s (error %s). Check file permissions and retry." % [path, FileAccess.get_open_error()])
	var json = JSON.new()
	var error = json.parse(file.get_as_text())
	if error != OK:
		return fail_content("Invalid JSON in %s, line %s: %s\nRegenerate the canonical content pack and retry." % [path, json.get_error_line(), json.get_error_message()])
	var errors := validate_pack(json.data)
	if not errors.is_empty():
		return fail_content("Invalid content pack:\n%s\nFix the source records and regenerate the validated pack; then retry." % "\n".join(errors))
	registry = json.data.collections.duplicate(true)
	encounter_ids = registry.encounters.keys()
	encounter_ids.sort_custom(func(a, b): return registry.encounters[a].order < registry.encounters[b].order)
	content_error = ""
	screen = "career_select"
	render()
	return true

func fail_content(message: String) -> bool:
	content_error = message
	screen = "content_error"
	render()
	return false

func validate_pack(value: Variant) -> PackedStringArray:
	var errors := PackedStringArray()
	if not value is Dictionary:
		errors.append("Root must be an object.")
		return errors
	if value.get("schema_version") != 1 or not value.get("collections") is Dictionary:
		errors.append("Expected schema_version 1 and a collections object.")
		return errors
	reject_nulls(value, "pack", errors)
	var collections: Dictionary = value.collections
	for collection in collections:
		if collection not in ["careers", "skills", "statuses", "items", "enemies", "bosses", "encounters"]:
			errors.append("Unknown collection: %s." % collection)
	var allowed = {
		"careers": ["id", "name", "role", "description", "base_stats", "stat_growth", "starting_skills", "skill_pool", "starting_items", "reaction", "visual"],
		"skills": ["id", "name", "type", "cost", "cooldown", "target", "description", "career", "damage", "applies_statuses", "tags", "trigger", "removes_statuses"],
		"statuses": ["id", "name", "kind", "default_duration", "max_stacks", "effect", "description", "tick", "icon_shape"],
		"items": ["id", "name", "slot", "rarity", "stat_modifiers", "description", "value", "career_tags", "effects", "use"],
		"enemies": ["id", "name", "role", "tier", "base_stats", "skills", "description", "weaknesses", "resistances", "ai", "loot_table", "xp_reward", "visual"],
		"bosses": ["id", "name", "title", "role", "tier", "base_stats", "description", "phases", "weaknesses", "resistances", "ai", "loot_table", "xp_reward", "visual"],
		"encounters": ["id", "name", "type", "order", "enemies", "difficulty", "arena", "rewards", "description"]
	}
	var required = {
		"careers": {"name": TYPE_STRING, "role": TYPE_STRING, "reaction": TYPE_STRING, "description": TYPE_STRING, "base_stats": TYPE_DICTIONARY, "stat_growth": TYPE_DICTIONARY, "starting_skills": TYPE_ARRAY, "skill_pool": TYPE_ARRAY, "starting_items": TYPE_ARRAY},
		"skills": {"name": TYPE_STRING, "type": TYPE_STRING, "description": TYPE_STRING, "cost": TYPE_DICTIONARY, "cooldown": TYPE_FLOAT, "target": TYPE_STRING},
		"statuses": {"name": TYPE_STRING, "kind": TYPE_STRING, "description": TYPE_STRING, "effect": TYPE_DICTIONARY, "default_duration": TYPE_FLOAT, "max_stacks": TYPE_FLOAT},
		"items": {"name": TYPE_STRING, "description": TYPE_STRING, "slot": TYPE_STRING, "rarity": TYPE_STRING, "stat_modifiers": TYPE_DICTIONARY},
		"enemies": {"name": TYPE_STRING, "role": TYPE_STRING, "tier": TYPE_FLOAT, "description": TYPE_STRING, "base_stats": TYPE_DICTIONARY, "skills": TYPE_ARRAY},
		"bosses": {"name": TYPE_STRING, "title": TYPE_STRING, "tier": TYPE_FLOAT, "description": TYPE_STRING, "base_stats": TYPE_DICTIONARY, "phases": TYPE_ARRAY},
		"encounters": {"name": TYPE_STRING, "description": TYPE_STRING, "type": TYPE_STRING, "enemies": TYPE_ARRAY, "order": TYPE_FLOAT, "difficulty": TYPE_FLOAT, "arena": TYPE_STRING, "rewards": TYPE_DICTIONARY}
	}
	for collection in required:
		if not collections.get(collection) is Dictionary or collections[collection].is_empty():
			errors.append("%s: missing or empty collection." % collection)
			continue
		for id in collections[collection]:
			var record = collections[collection][id]
			if not record is Dictionary:
				errors.append("[%s/%s] must be an object." % [collection, id])
				continue
			if record.get("id") != id:
				errors.append("[%s/%s] id must match registry key." % [collection, id])
			for field in record:
				if field not in allowed[collection]:
					errors.append("[%s/%s] unknown field: %s." % [collection, id, field])
			for field in required[collection]:
				var expected = required[collection][field]
				var actual = typeof(record.get(field))
				if actual != expected and not (expected == TYPE_FLOAT and actual == TYPE_INT):
					errors.append("[%s/%s] %s: missing or wrong type." % [collection, id, field])
	if not errors.is_empty():
		return errors
	if collections.careers.size() != 3 or collections.encounters.size() != 4:
		errors.append("First playable requires three careers and four encounters.")
	var orders: Dictionary = {}
	for collection in ["careers", "enemies", "bosses"]:
		for id in collections[collection]:
			var record: Dictionary = collections[collection][id]
			for stat in ["hp", "attack", "defense", "magic", "speed", "crit_chance"]:
				var stat_value = record.base_stats.get(stat)
				if not (stat_value is int or stat_value is float) or stat_value < 0:
					errors.append("[%s/%s] base_stats.%s must be a nonnegative number." % [collection, id, stat])
			for stat in ["stamina", "focus"]:
				var pool = record.base_stats.get(stat, 0)
				if not (pool is int or pool is float) or pool < 0:
					errors.append("[%s/%s] base_stats.%s must be nonnegative." % [collection, id, stat])
			var hp = record.base_stats.get("hp", 0)
			if (hp is int or hp is float) and hp <= 0:
				errors.append("[%s/%s] hp must be positive." % [collection, id])
			if collection == "careers":
				check_refs(record.starting_skills, collections.skills, "%s.starting_skills" % id, errors)
				check_refs(record.get("skill_pool", []), collections.skills, "%s.skill_pool" % id, errors)
				check_refs(record.starting_items, collections.items, "%s.starting_items" % id, errors)
				if record.starting_skills.is_empty():
					errors.append("[%s] starting_skills cannot be empty." % id)
				if record.reaction not in ["brace", "parry", "ward"]:
					errors.append("[%s] invalid career reaction." % id)
				for skill_id in record.starting_skills:
					if collections.skills.has(skill_id) and (collections.skills[skill_id].get("career") != id or skill_id not in record.skill_pool):
						errors.append("[%s] starting skill must match career and skill_pool." % id)
				for skill_id in record.skill_pool:
					if collections.skills.has(skill_id) and collections.skills[skill_id].get("career") != id:
						errors.append("[%s] skill_pool skill must match career." % id)
				for item_id in record.starting_items:
					if collections.items.has(item_id) and collections.items[item_id].has("career_tags") and id not in collections.items[item_id].career_tags:
						errors.append("[%s] starting item is not allowed for career." % id)
			elif collection == "enemies":
				check_refs(record.skills, collections.skills, "%s.skills" % id, errors)
			else:
				if record.phases.is_empty():
					errors.append("[%s] phases cannot be empty." % id)
				var previous := 2.0
				for phase in record.phases:
					if not phase is Dictionary or not phase.get("id") is String or phase.get("id", "").is_empty() or not phase.get("skills") is Array or not phase.get("name") is String or not (phase.get("hp_threshold") is float or phase.get("hp_threshold") is int):
						errors.append("[%s] invalid boss phase." % id)
						continue
					if phase.hp_threshold <= 0 or phase.hp_threshold >= previous or (previous == 2.0 and phase.hp_threshold != 1.0):
						errors.append("[%s] invalid phase thresholds." % id)
					previous = phase.hp_threshold
					check_refs(phase.skills, collections.skills, "%s.phases.skills" % id, errors)
					for telegraph in phase.get("telegraphs", []):
						if not telegraph is Dictionary or not collections.skills.has(telegraph.get("skill", "")):
							errors.append("[%s] unresolved telegraph skill." % id)
					for entry in phase.get("on_enter", []):
						if not entry is Dictionary:
							errors.append("[%s] phase on_enter must contain objects." % id)
						elif entry.has("apply_status") and not collections.statuses.has(entry.apply_status):
							errors.append("[%s] unresolved on_enter status." % id)
			if collection != "careers":
				for loot in record.get("loot_table", []):
					if not loot is Dictionary or not collections.items.has(loot.get("item", "")):
						errors.append("[%s] unresolved loot item." % id)
				var ai = record.get("ai", {})
				if not ai is Dictionary or not ai.get("weights", {}) is Dictionary:
					errors.append("[%s] ai and weights must be objects." % id)
				else:
					var actor_skills: Array = record.get("skills", []).duplicate()
					for phase in record.get("phases", []):
						if phase is Dictionary and phase.get("skills") is Array:
							actor_skills.append_array(phase.skills)
					for skill_id in ai.get("weights", {}):
						if not collections.skills.has(skill_id) or skill_id not in actor_skills:
							errors.append("[%s] AI weight references an unavailable skill." % id)
	for id in collections.skills:
		var skill: Dictionary = collections.skills[id]
		if skill.target not in ["self", "enemy"] or skill.cooldown < 0 or skill.cooldown != int(skill.cooldown) or skill.type not in ["attack", "defense", "control", "reaction"]:
			errors.append("[%s] invalid skill target/cooldown." % id)
		if skill.has("career") and not collections.careers.has(skill.career):
			errors.append("[%s] unresolved career." % id)
		for cost in skill.cost:
			if cost not in ["stamina", "focus"] or not (skill.cost[cost] is int or skill.cost[cost] is float) or skill.cost[cost] < 0:
				errors.append("[%s] invalid resource cost." % id)
		if skill.has("damage"):
			var damage = skill.damage
			if not damage is Dictionary or not damage.get("damage_type") is String or damage.get("scaling_stat") not in ["attack", "magic"] or not (damage.get("flat") is float or damage.get("flat") is int) or not (damage.get("multiplier") is float or damage.get("multiplier") is int):
				errors.append("[%s] invalid numeric damage definition." % id)
		check_status_refs(skill, collections.statuses, id, errors)
	for id in collections.items:
		check_refs(collections.items[id].get("career_tags", []), collections.careers, "%s.career_tags" % id, errors)
		if collections.items[id].slot not in ["weapon", "offhand", "armor", "trinket", "consumable"] or collections.items[id].rarity not in ["common", "uncommon", "rare"]:
			errors.append("[%s] invalid item slot or rarity." % id)
		if collections.items[id].has("effects"):
			if not collections.items[id].effects is Array:
				errors.append("[%s] effects must be an array." % id)
			else:
				for effect in collections.items[id].effects:
					if not effect is Dictionary:
						errors.append("[%s] equipment effect must be an object." % id)
					else:
						for key in effect:
							if not (effect[key] is float or effect[key] is int):
								errors.append("[%s] equipment effect must be numeric." % id)
		for stat in collections.items[id].stat_modifiers:
			var modifier = collections.items[id].stat_modifiers[stat]
			if not (modifier is int or modifier is float):
				errors.append("[%s] item stat modifiers must be numeric." % id)
		if collections.items[id].has("use"):
			if not collections.items[id].use is Dictionary:
				errors.append("[%s] use must be an object." % id)
			else:
				check_status_refs(collections.items[id].use, collections.statuses, id, errors)
	for id in collections.statuses:
		var status: Dictionary = collections.statuses[id]
		if status.kind not in ["buff", "debuff"] or status.default_duration < 1 or status.max_stacks < 1:
			errors.append("[%s] invalid status kind, duration or stacks." % id)
		for key in status.effect:
			var modifier = status.effect[key]
			if key == "damage_type":
				if not modifier is String:
					errors.append("[%s] effect.damage_type must be a string." % id)
			elif key in ["skip_turn", "ignores_defense"]:
				if not modifier is bool:
					errors.append("[%s] effect.%s must be boolean." % [id, key])
			elif not (modifier is float or modifier is int):
				errors.append("[%s] effect.%s must be numeric." % [id, key])
	for id in collections.encounters:
		var encounter: Dictionary = collections.encounters[id]
		if encounter.type not in ["tutorial", "standard", "boss"] or encounter.difficulty < 1 or encounter.difficulty > 5 or encounter.order != int(encounter.order) or orders.has(encounter.order):
			errors.append("[%s] invalid encounter type, difficulty or unique order." % id)
		orders[encounter.order] = true
		var opponents: Dictionary = collections.bosses if encounter.type == "boss" else collections.enemies
		check_refs(encounter.enemies, opponents, "%s.enemies" % id, errors)
		if encounter.enemies.is_empty():
			errors.append("[%s] encounter must contain opponents." % id)
		var xp = encounter.rewards.get("xp")
		if not (xp is int or xp is float) or xp < 0 or xp != int(xp):
			errors.append("[%s] rewards.xp must be a nonnegative integer." % id)
		check_refs(encounter.rewards.get("items", []), collections.items, "%s.rewards.items" % id, errors)
	return errors

func reject_nulls(value: Variant, path: String, errors: PackedStringArray) -> void:
	if value == null:
		errors.append("%s: null is not allowed; omit optional fields." % path)
	elif value is Dictionary:
		for key in value:
			reject_nulls(value[key], path + "." + str(key), errors)
	elif value is Array:
		for index in range(value.size()):
			reject_nulls(value[index], "%s[%s]" % [path, index], errors)

func check_refs(ids: Variant, collection: Dictionary, field: String, errors: PackedStringArray) -> void:
	if not ids is Array:
		errors.append("%s must be an ID array." % field)
		return
	for id in ids:
		if not id is String or not collection.has(id):
			errors.append("%s: unresolved ID %s." % [field, id])

func check_status_refs(record: Dictionary, statuses: Dictionary, id: String, errors: PackedStringArray) -> void:
	check_refs(record.get("removes_statuses", []), statuses, "%s.removes_statuses" % id, errors)
	if not record.get("applies_statuses", []) is Array:
		errors.append("[%s] applies_statuses must be an array." % id)
		return
	for effect in record.get("applies_statuses", []):
		if not effect is Dictionary or not statuses.has(effect.get("status", "")) or not (effect.get("duration") is float or effect.get("duration") is int) or effect.get("duration", 0) < 1:
			errors.append("[%s] unresolved status reference." % id)
		elif not (effect.get("chance", 1.0) is float or effect.get("chance", 1.0) is int) or effect.get("chance", 1.0) < 0 or effect.get("chance", 1.0) > 1:
			errors.append("[%s] status chance must be between zero and one." % id)

func reset_state() -> void:
	career_id = ""
	encounter_index = 0
	total_xp = 0
	earned_items.clear()
	run_inventory.clear()
	encounter_inventory.clear()
	rewarded_encounters.clear()
	battle.clear()
	combat_events.clear()
	selected_action = ""
	selected_target = -1
	interaction = "idle"

func reset_run() -> void:
	reset_state()
	screen = "content_error" if registry.is_empty() else "career_select"
	render()

func choose_career(id: String) -> void:
	if screen != "career_select" or not registry.careers.has(id):
		return
	career_id = id
	for item_id in registry.careers[id].starting_items:
		if registry.items[item_id].slot == "consumable":
			run_inventory[item_id] = run_inventory.get(item_id, 0) + 1
	screen = "encounter_preview"
	render()

func current_encounter() -> Dictionary:
	if encounter_index < 0 or encounter_index >= encounter_ids.size():
		return {}
	return registry.encounters[encounter_ids[encounter_index]]

func start_encounter() -> void:
	if screen not in ["encounter_preview", "defeat"]:
		return
	var encounter := current_encounter()
	if screen == "encounter_preview":
		encounter_inventory = run_inventory.duplicate(true)
	var collection: Dictionary = registry.bosses if encounter.type == "boss" else registry.enemies
	var opponents: Array = []
	for id in encounter.enemies:
		opponents.append(collection[id])
	var career: Dictionary = registry.careers[career_id].duplicate(true)
	# Consumables belong to the run; the resolver still equips canonical gear.
	var equipment: Array = []
	for item_id in career.starting_items:
		if registry.items[item_id].slot != "consumable":
			equipment.append(item_id)
	career.starting_items = equipment
	battle = resolver.create_battle(career, opponents, registry, 42 + encounter_index)
	battle.inventory = encounter_inventory.duplicate(true)
	combat_events = battle.get("events", []).duplicate(true)
	screen = "combat"
	interaction = "idle"
	selected_action = ""
	selected_target = -1
	render()

func action_record(id: String) -> Dictionary:
	if id.begins_with("item:"):
		return registry.items.get(id.trim_prefix("item:"), {})
	return registry.skills.get(id, {})

func choose_action(id: String) -> void:
	if screen != "combat" or interaction == "resolving":
		return
	if id != "":
		var record := action_record(id)
		if record.is_empty():
			return
		if id.begins_with("item:"):
			if battle.inventory.get(id.trim_prefix("item:"), 0) <= 0 or not record.has("use"):
				return
		elif id not in battle.player.skills or record.has("trigger") or not resolver.unavailable(battle.player, record).is_empty():
			return
	selected_action = id
	selected_target = -1
	interaction = "action_selected"
	render()

func choose_target(index: int) -> void:
	if screen != "combat" or interaction not in ["action_selected", "preview"]:
		return
	var record := action_record(selected_action)
	var is_self: bool = selected_action == "" or selected_action.begins_with("item:") or record.get("target") == "self"
	if is_self:
		if index != -1:
			return
	else:
		if index < 0 or index >= battle.enemies.size() or battle.enemies[index].hp <= 0:
			return
	selected_target = index
	interaction = "preview"
	render()

func cancel_action() -> void:
	if screen != "combat" or interaction == "resolving":
		return
	if interaction == "preview":
		selected_target = -1
		interaction = "action_selected"
	else:
		selected_action = ""
		interaction = "idle"
	render()

func confirm_action() -> void:
	if screen != "combat" or interaction != "preview":
		return
	interaction = "resolving"
	render()
	# Defer one frame so the locked resolving state is actually drawn.
	call_deferred("_resolve_selected")

func _resolve_selected() -> void:
	if screen != "combat" or interaction != "resolving":
		return
	apply_battle_state(resolver.resolve_round(battle, selected_action, selected_target, registry))

func apply_battle_state(next: Dictionary) -> void:
	if screen != "combat":
		return
	battle = next
	for event in next.get("events", []):
		if combat_events.is_empty() or event.get("seq", 0) > combat_events.back().get("seq", 0):
			combat_events.append(event.duplicate(true))
	interaction = "idle"
	selected_action = ""
	selected_target = -1
	match battle.get("result", ""):
		"victory":
			var encounter := current_encounter()
			if not rewarded_encounters.has(encounter.id):
				run_inventory = battle.get("inventory", {}).duplicate(true)
				rewarded_encounters[encounter.id] = true
				total_xp += int(encounter.rewards.xp)
				for id in encounter.rewards.get("items", []):
					earned_items[id] = earned_items.get(id, 0) + 1
					if registry.items[id].slot == "consumable":
						run_inventory[id] = run_inventory.get(id, 0) + 1
			screen = "reward"
		"defeat":
			screen = "defeat"
	render()

func accept_reward() -> void:
	if screen != "reward":
		return
	screen = "progression"
	render()

func continue_run() -> void:
	if screen != "progression":
		return
	encounter_index += 1
	screen = "complete" if encounter_index >= encounter_ids.size() else "encounter_preview"
	battle = {}
	render()

func reward_summary(rewards: Dictionary) -> String:
	var names: Array = []
	for id in rewards.get("items", []):
		names.append(registry.items[id].name)
	return "%s XP · %s" % [int(rewards.xp), ", ".join(names) if not names.is_empty() else "No item rewards"]

func render() -> void:
	if hud == null:
		return
	if screen == "combat":
		var view_state := battle.duplicate(true)
		view_state.events = combat_events
		hud.render_combat(view_state, registry, current_encounter(), resolver, selected_action, selected_target, interaction)
		return
	hud.begin_screen("ECHO//BRUCH", screen.replace("_", " ").to_upper())
	match screen:
		"content_error":
			hud.heading("Content unavailable")
			hud.text(content_error)
			hud.button("Retry loading", load_pack)
		"career_select":
			hud.heading("Choose your career")
			hud.text("Four encounters. Every cost, effect and damage value stays visible. No saves, levels or unlocks in this slice.")
			var ids: Array = registry.careers.keys()
			ids.sort()
			for id in ids:
				var career: Dictionary = registry.careers[id]
				hud.heading(career.name)
				hud.button("Choose %s" % career.name, choose_career.bind(id))
				hud.text("%s · Reaction: %s\n%s" % [career.role, career.reaction, career.description])
				hud.text("Base stats · %s" % hud.values(career.base_stats))
				hud.text("Starting skills")
				for skill_id in career.starting_skills:
					hud.text(hud.skill_details(registry.skills[skill_id]))
				hud.text("Starting equipment / items")
				for item_id in career.starting_items:
					var item: Dictionary = registry.items[item_id]
					hud.text("%s · %s · %s\n%s%s" % [item.name, item.slot, item.rarity, item.description, "\n" + hud.values(item.stat_modifiers) if not item.stat_modifiers.is_empty() else ""])
		"encounter_preview":
			var encounter := current_encounter()
			hud.heading("%s / %s · %s" % [encounter_index + 1, encounter_ids.size(), encounter.name])
			hud.text("%s\nArena: %s · Difficulty: %s / 5 · %s" % [encounter.description, encounter.arena, int(encounter.difficulty), encounter.type])
			var collection: Dictionary = registry.bosses if encounter.type == "boss" else registry.enemies
			for id in encounter.enemies:
				var opponent: Dictionary = collection[id]
				hud.heading(opponent.name)
				hud.text("%s\n%s" % [opponent.get("title", opponent.get("role", "")), hud.values(opponent.base_stats)])
				hud.text(opponent.get("description", ""))
			hud.text("Victory rewards · %s" % reward_summary(encounter.rewards))
			hud.button("Start encounter", start_encounter)
			hud.button("Return to career select · reset run", reset_run)
		"reward":
			hud.heading("Victory · %s" % current_encounter().name)
			hud.text("Awarded once · %s" % reward_summary(current_encounter().rewards))
			hud.render_log(combat_events, registry)
			hud.button("Continue to progression", accept_reward)
		"defeat":
			hud.heading("Defeat · %s" % current_encounter().name)
			hud.text("No rewards granted for this attempt. Retry the same encounter or reset your run and choose a career.")
			hud.render_log(combat_events, registry)
			hud.button("Retry encounter", start_encounter)
			hud.button("Career select · reset run", reset_run)
		"progression", "complete":
			hud.heading("Run complete" if screen == "complete" else "Run progression")
			hud.text("%s · Total earned XP: %s\nEncounters completed: %s / %s" % [registry.careers[career_id].name, total_xp, rewarded_encounters.size(), encounter_ids.size()])
			hud.text("Earned items (run totals)")
			if earned_items.is_empty():
				hud.text("No item rewards yet.")
			for id in earned_items:
				hud.text("%s × %s" % [registry.items[id].name, earned_items[id]])
			hud.text("Available consumables · carried into the next encounter")
			if run_inventory.is_empty():
				hud.text("None remaining.")
			for id in run_inventory:
				hud.text("%s × %s" % [registry.items[id].name, run_inventory[id]])
			if screen == "progression":
				var next_name: String = registry.encounters[encounter_ids[encounter_index + 1]].name if encounter_index + 1 < encounter_ids.size() else "End of slice"
				hud.text("Next · %s" % next_name)
				hud.button("Continue", continue_run)
			else:
				hud.text("The four-encounter first playable is complete. Progress is in memory only.")
			hud.button("New run · career select", reset_run)
	hud.finish_screen()
