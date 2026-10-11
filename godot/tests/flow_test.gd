extends SceneTree

const MainScene = preload("res://scenes/boot/main.tscn")
var failures := 0
var checks := 0
var capture_visuals := false

func _initialize() -> void:
	capture_visuals = "--visual" in OS.get_cmdline_user_args()
	call_deferred("run_tests")

func capture_screen(name: String) -> void:
	if not capture_visuals:
		return
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	var directory := OS.get_environment("GODOT_SCREENSHOT_DIR")
	if directory.is_empty():
		directory = ProjectSettings.globalize_path("user://screenshots")
	DirAccess.make_dir_recursive_absolute(directory)
	var image := root.get_texture().get_image()
	check(image.save_png(directory.path_join("godot-" + name + ".png")) == OK, "Visual reference captured")
	check(main_content_width() <= root.size.x, "Responsive content stays within viewport")
	check(root.get_node("Main").hud.size.x <= root.size.x, "Configured canvas root reflows without forced scale override")
	check(root.content_scale_size == Vector2i(390, 720), "Visual test preserves configured mobile-first canvas size")
	var hud = root.get_node("Main").hud
	for split_box in hud._responsive_boxes:
		check(split_box.vertical == (hud.size.x < 900), "Combat panels reflow instead of scaling desktop columns")
	for grid in hud._responsive_grids:
		check(grid.columns == (3 if hud.size.x >= 1100 else 1), "Career cards reflow between mobile and desktop")

func main_content_width() -> float:
	var main = root.get_node("Main")
	return main.hud.column.size.x + 32.0

func check(condition: bool, message: String) -> void:
	checks += 1
	if not condition:
		failures += 1
		push_error("FLOW TEST: " + message)

func visible_text(node: Node) -> String:
	var output := ""
	if node is Label or node is Button:
		output += node.text + "\n"
	for child in node.get_children():
		output += visible_text(child)
	return output

func assert_buttons(node: Node) -> void:
	if node is Button:
		check(node.custom_minimum_size.y >= 44, "Touch target is at least 44 pixels")
		check(node.focus_mode == Control.FOCUS_ALL, "Button supports keyboard focus")
	for child in node.get_children():
		assert_buttons(child)

func run_tests() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	await process_frame
	if capture_visuals:
		root.size = Vector2i(390, 844)
		await capture_screen("career-mobile")
		root.size = Vector2i(1280, 720)
		await capture_screen("career-desktop")
		root.size = Vector2i(390, 844)
	check(main.screen == "career_select", "Canonical pack opens career selection")
	if main.registry.is_empty():
		check(false, "Generated validated runtime_pack.json is required: " + main.content_error)
		finish(main)
		return
	check(main.registry.careers.size() == 3, "Three canonical careers loaded by ID")
	check(main.encounter_ids.size() == 4, "Four canonical encounters loaded by ID")
	var last_order := -1
	for id in main.encounter_ids:
		check(main.registry.encounters[id].id == id, "Encounter identity comes from pack")
		check(main.registry.encounters[id].order > last_order, "Encounter order comes from data")
		last_order = int(main.registry.encounters[id].order)
	for id in main.registry.careers:
		var career: Dictionary = main.registry.careers[id]
		var rendered := visible_text(main.hud)
		check(rendered.contains(career.name), "Canonical career name is visible")
		for skill_id in career.starting_skills:
			check(rendered.contains(main.registry.skills[skill_id].name), "Actual starting skill is visible")
		for item_id in career.starting_items:
			check(rendered.contains(main.registry.items[item_id].name), "Actual starting item is visible")
	assert_buttons(main.hud)
	var career_id: String = str(main.registry.careers.keys()[0])
	main.choose_career(career_id)
	var consumable_id := ""
	for id in main.registry.items:
		if main.registry.items[id].slot == "consumable" and main.registry.items[id].has("use"):
			consumable_id = id
			break
	check(not consumable_id.is_empty(), "Canonical pack provides usable consumables")
	main.run_inventory[consumable_id] = 2
	check(main.screen == "encounter_preview", "Career selection opens encounter preview")
	check(visible_text(main.hud).contains(main.current_encounter().arena), "Arena is visible")
	check(visible_text(main.hud).contains(main.reward_summary(main.current_encounter().rewards)), "Canonical rewards are visible")
	main.start_encounter()
	check(is_instance_valid(main.hud.battle_stage), "Native combat mounts an independent side-view stage")
	check(main.hud.battle_stage.actors[0].id == main.battle.player.id, "Stage renders the real player instance")
	check(main.hud.battle_stage.actors.size() == main.battle.enemies.size() + 1, "Stage renders all real opponent instances")
	check(main.hud.battle_stage.encounter.id == main.current_encounter().id, "Stage uses the current canonical encounter identity")
	var stage_snapshot: Dictionary = main.battle.duplicate(true)
	var player_id: String = main.battle.player.id
	main.hud.battle_stage.present(main.current_encounter(), main.battle.player, main.battle.enemies, -1, false, [
		{"seq": 100, "type": "damage", "target": player_id, "payload": {"amount": 4}},
		{"seq": 101, "type": "damage", "target": player_id, "payload": {"amount": 7}}
	])
	check(main.hud.battle_stage._impacts.size() == 2 and main.hud.battle_stage._impacts[0].line != main.hud.battle_stage._impacts[1].line, "Multiple resolved hits on one actor have separate readable damage lines")
	main.hud.battle_stage.actors[0].hp = 0
	check(main.battle == stage_snapshot, "Presentation snapshots cannot mutate combat state")
	main.render()
	await capture_screen("combat-mobile")
	if capture_visuals:
		root.size = Vector2i(1280, 720)
		await capture_screen("combat-desktop")
		root.size = Vector2i(390, 844)
	check(main.screen == "combat", "Start opens actual combat")
	check(visible_text(main.hud).contains("reference only; no critical rolls"), "Crit is explicitly inactive metadata")
	check(visible_text(main.hud).contains("reference only; no initiative"), "Speed is explicitly inactive metadata")
	check(main.battle.inventory.get(consumable_id, 0) == 2, "Run consumables handed into combat")
	main.choose_action("item:" + consumable_id)
	main.choose_target(-1)
	main.confirm_action()
	await process_frame
	check(main.battle.inventory.get(consumable_id, 0) == 1, "Resolver consumption is reflected in battle")
	check(not main.battle.player.is_empty() and not main.battle.enemies.is_empty(), "Resolver constructs battle actors")
	main.choose_action("")
	check(main.interaction == "action_selected", "Recover still requires target selection")
	main.choose_target(999)
	check(main.interaction == "action_selected", "Invalid target is ignored")
	main.choose_target(-1)
	check(main.interaction == "preview", "Self target opens recovery preview")
	var resource_preview: Dictionary = main.resolver.resource_preview(main.battle.player, main.registry)
	check(visible_text(main.hud).contains("Recovery grant · Stamina: +%s · Focus: +%s" % [resource_preview.recovery_stamina, resource_preview.recovery_focus]), "Recovery preview uses public resolver grants")
	check(visible_text(main.hud).contains("End-turn regeneration · Stamina: +%s · Focus: +%s" % [resource_preview.end_stamina, resource_preview.end_focus]), "Recovery preview shows computed end-turn grants")
	check(main.hud.confirm_button != null, "Preview exposes confirmation")
	main.cancel_action()
	check(main.interaction == "action_selected", "Cancel preview moves back one step")
	main.cancel_action()
	check(main.interaction == "idle", "Cancel action returns idle")
	var skill_id := ""
	for id in main.battle.player.skills:
		var skill: Dictionary = main.registry.skills[id]
		if skill.target == "enemy" and not skill.has("trigger") and main.resolver.unavailable(main.battle.player, skill).is_empty():
			skill_id = id
			break
	check(not skill_id.is_empty(), "Canonical career has a usable attack")
	if not skill_id.is_empty():
		var previous: Dictionary = main.battle.duplicate(true)
		main.choose_action(skill_id)
		await process_frame
		var stage_control: Control = main.hud.battle_stage
		var target_click := InputEventMouseButton.new()
		target_click.button_index = MOUSE_BUTTON_LEFT
		target_click.pressed = true
		target_click.position = (stage_control.actor_position(1) - Vector2(0, 100)) * Vector2(stage_control.size.x / 1000.0, stage_control.size.y / 360.0)
		stage_control._gui_input(target_click)
		check(main.selected_target == 0, "Pointer input on a living stage opponent selects the real target")
		check(main.interaction == "preview", "Living opponent opens numeric skill preview")
		check(visible_text(main.hud).contains("Preview damage:"), "Numeric resolver preview is visible")
		check(main.battle == previous, "Action selection and preview never mutate battle")
		main.confirm_action()
		check(main.interaction == "resolving", "Confirmation locks input")
		main.choose_action("")
		check(main.selected_action == skill_id, "Resolving ignores conflicting action input")
		await process_frame
		check(main.interaction == "idle", "Resolver round returns to idle")
		check(main.hud.battle_stage._last_sequence == main.battle.seq, "Stage consumes resolved events without replaying earlier sequences")
		check(not main.hud.log_label.visible, "Full combat log is initially compact")
		for control in main.hud.column.get_children():
			if control is Button and control.text.begins_with("Kampfprotokoll"):
				control.pressed.emit()
				check(main.hud.log_label.visible, "Log disclosure opens ordered event details")
				control.pressed.emit()
				check(not main.hud.log_label.visible, "Log disclosure closes ordered event details")
				break
		check(main.battle.round > previous.round or main.screen != "combat", "Confirmation invokes real resolver")
		if main.screen != "combat":
			main.reset_run()
			main.hud.reduced_motion = true
			main.choose_career(career_id)
			main.start_encounter()
			check(not main.hud.battle_stage.is_processing(), "Reduced-motion stage has no animation loop")
			main.reset_run()
			main.hud.reduced_motion = false
			main.choose_career(career_id)
			main.start_encounter()
	var lost: Dictionary = main.battle.duplicate(true)
	lost.result = "defeat"
	main.apply_battle_state(lost)
	check(main.screen == "defeat", "Defeat is explicit")
	check(main.total_xp == 0 and main.earned_items.is_empty(), "Loss grants no rewards")
	main.accept_reward()
	main.continue_run()
	check(main.screen == "defeat" and main.encounter_index == 0, "Loss cannot enter reward/progression")
	main.start_encounter()
	check(main.screen == "combat" and main.encounter_index == 0, "Retry restarts same encounter")
	check(main.battle.inventory.get(consumable_id, 0) == 2, "Defeat retry restores pre-fight consumable snapshot")
	check(main.run_inventory.get(consumable_id, 0) == 2, "Failed attempt does not mutate run inventory")
	check(main.battle.player.hp > 0, "Retry resets combat actors")
	var expected_xp := 0
	var expected_items: Dictionary = {}
	var consumed := false
	for index in range(main.encounter_ids.size()):
		var encounter: Dictionary = main.current_encounter()
		if main.battle.inventory.get(consumable_id, 0) > 0:
			main.choose_action("item:" + consumable_id)
			main.choose_target(-1)
			main.confirm_action()
			await process_frame
			consumed = true
		var remaining: Dictionary = main.battle.inventory.duplicate(true)
		var won: Dictionary = main.battle.duplicate(true)
		won.result = "victory"
		expected_xp += int(encounter.rewards.xp)
		for id in encounter.rewards.get("items", []):
			expected_items[id] = expected_items.get(id, 0) + 1
			if main.registry.items[id].slot == "consumable":
				remaining[id] = remaining.get(id, 0) + 1
		main.apply_battle_state(won)
		check(main.screen == "reward", "Victory enters reward")
		check(main.total_xp == expected_xp and main.earned_items == expected_items, "Victory awards exactly canonical XP and items")
		check(main.run_inventory == remaining, "Victory preserves consumption and adds earned consumables")
		main.apply_battle_state(won)
		check(main.total_xp == expected_xp and main.earned_items == expected_items, "Repeated result cannot duplicate rewards")
		check(main.run_inventory == remaining, "Repeated victory cannot duplicate consumable rewards")
		main.accept_reward()
		check(main.screen == "progression", "Reward continues to progression")
		check(visible_text(main.hud).contains(str(expected_xp)), "Progression displays total XP")
		main.continue_run()
		if index < main.encounter_ids.size() - 1:
			check(main.screen == "encounter_preview", "Progression opens next encounter")
			main.start_encounter()
			check(main.battle.inventory == remaining, "Next encounter receives remaining consumables without regrant")
		else:
			check(main.screen == "complete", "Final encounter ends slice")
	main.reset_run()
	check(main.screen == "career_select" and main.career_id.is_empty(), "Reset opens career select")
	check(consumed, "Consumable consumption exercised across encounter handoff")
	check(main.total_xp == 0 and main.earned_items.is_empty() and main.rewarded_encounters.is_empty() and main.run_inventory.is_empty() and main.encounter_inventory.is_empty(), "Reset clears reward accounting and inventories")
	check(main.encounter_index == 0 and main.battle.is_empty(), "Reset clears encounter/battle state")
	var pack := {"schema_version": 1, "collections": main.registry.duplicate(true)}
	var invalid_hp := pack.duplicate(true)
	invalid_hp.collections.careers[career_id].base_stats.hp = "invalid"
	check(not main.validate_pack(invalid_hp).is_empty(), "Non-numeric HP is rejected without a runtime error")
	var invalid_phase := pack.duplicate(true)
	var boss_id: String = str(invalid_phase.collections.bosses.keys()[0])
	invalid_phase.collections.bosses[boss_id].phases[0].erase("id")
	check(not main.validate_pack(invalid_phase).is_empty(), "Boss phase requires its runtime ID")
	for field in ["telegraphs", "on_enter"]:
		var malformed := pack.duplicate(true)
		malformed.collections.bosses[boss_id].phases[0][field] = "not_an_array"
		check(not main.validate_pack(malformed).is_empty(), "Nested boss " + field + " rejected safely")
	var malformed_use := pack.duplicate(true)
	malformed_use.collections.items[consumable_id].use.heal_hp = "not_a_number"
	check(not main.validate_pack(malformed_use).is_empty(), "Non-numeric item heal rejected")
	var malformed_damage := pack.duplicate(true)
	for id in malformed_damage.collections.skills:
		if malformed_damage.collections.skills[id].has("damage"):
			malformed_damage.collections.skills[id].damage.multiplier = -1
			break
	check(not main.validate_pack(malformed_damage).is_empty(), "Negative damage multiplier rejected")
	var malformed_application := pack.duplicate(true)
	malformed_application.collections.skills[malformed_application.collections.skills.keys()[0]].applies_statuses = [{"status": str(main.registry.statuses.keys()[0]), "duration": 1.5, "target": "unknown"}]
	check(not main.validate_pack(malformed_application).is_empty(), "Fractional duration and unknown status target rejected")
	var first_encounter: String = str(main.encounter_ids[0])
	pack.collections.encounters[first_encounter].enemies = ["not_a_resolved_reference"]
	check(not main.validate_pack(pack).is_empty(), "Invalid pack reference rejected")
	var typo_pack := {"schema_version": 1, "collections": main.registry.duplicate(true)}
	typo_pack.collections.encounters[first_encounter]["dificulty"] = 2
	check(not main.validate_pack(typo_pack).is_empty(), "Unknown canonical field rejected")
	var null_pack := {"schema_version": 1, "collections": main.registry.duplicate(true)}
	null_pack.collections.encounters[first_encounter]["description"] = null
	check(not main.validate_pack(null_pack).is_empty(), "Null field rejected")
	var references := [
		["careers", "starting_skills", ["missing_reference"]],
		["careers", "starting_items", ["missing_reference"]],
		["skills", "applies_statuses", [{"status": "missing_reference", "duration": 1}]],
		["items", "career_tags", ["missing_reference"]],
		["enemies", "skills", ["missing_reference"]],
		["bosses", "loot_table", [{"item": "missing_reference", "chance": 1.0}]],
		["encounters", "rewards", {"xp": 1, "items": ["missing_reference"]}]
	]
	for reference in references:
		var invalid_pack := {"schema_version": 1, "collections": main.registry.duplicate(true)}
		var collection: String = reference[0]
		var id: String = str(invalid_pack.collections[collection].keys()[0])
		invalid_pack.collections[collection][id][reference[1]] = reference[2]
		check(not main.validate_pack(invalid_pack).is_empty(), "Reject unresolved references in " + collection)
	check(not main.validate_pack({"schema_version": 1, "collections": {}}).is_empty(), "Missing collections rejected")
	check(not main.validate_pack(null).is_empty(), "Invalid root rejected")
	check(not main.load_pack("res://data/__missing_flow_test_pack.json"), "Missing pack fails closed")
	check(main.screen == "content_error" and main.registry.is_empty(), "Failed content cannot start a run")
	check(visible_text(main.hud).contains("Retry loading") and visible_text(main.hud).contains("exporter"), "Failed content presents visible actionable recovery")
	check(main.load_pack(), "Retry reloads canonical pack")
	check(main.screen == "career_select", "Reload starts fresh career selection")
	var warning_boss_id: String = str(main.registry.bosses.keys()[0])
	var boss_actor: Dictionary = main.resolver.create_battle(main.registry.careers[career_id], [main.registry.bosses[warning_boss_id]], main.registry).enemies[0]
	boss_actor.pending_skill = str(main.registry.bosses[warning_boss_id].phases[0].skills[0])
	boss_actor.pending_turns = 3
	main.hud.begin_screen("Test", "WARNING")
	main.hud.render_actor(boss_actor, main.registry)
	check(visible_text(main.hud).contains("warning turns remaining: 3"), "Multi-turn telegraph countdown is visible")
	main.render()
	for id in main.registry.careers:
		main.choose_career(id)
		main.start_encounter()
		check(main.battle.player.id == id, "Every canonical career starts actual combat")
		main.reset_run()
	await test_fresh_playthrough(main)
	finish(main)

func test_fresh_playthrough(main: Node) -> void:
	# Exercise real outcomes, not the result-handoff fixtures above.
	var completed := false
	for career in main.registry.careers:
		main.reset_run()
		main.choose_career(career)
		var rounds := 0
		while main.screen != "complete" and rounds < 400:
			if main.screen == "encounter_preview":
				main.start_encounter()
			elif main.screen == "reward":
				main.accept_reward()
			elif main.screen == "progression":
				main.continue_run()
			elif main.screen == "defeat":
				break
			elif main.screen == "combat":
				var target_index := -1
				for index in range(main.battle.enemies.size()):
					if main.battle.enemies[index].hp > 0 and (target_index < 0 or main.battle.enemies[index].hp < main.battle.enemies[target_index].hp):
						target_index = index
				var action := ""
				var best_damage := 0
				if target_index >= 0:
					for skill_id in main.battle.player.skills:
						var skill: Dictionary = main.registry.skills[skill_id]
						if skill.target != "enemy" or skill.has("trigger") or not main.resolver.unavailable(main.battle.player, skill).is_empty():
							continue
						var damage: int = main.resolver.preview(main.battle.player, main.battle.enemies[target_index], skill, main.registry)
						if damage > best_damage:
							best_damage = damage
							action = skill_id
				main.choose_action(action)
				main.choose_target(-1 if action.is_empty() else target_index)
				main.confirm_action()
				await process_frame
				rounds += 1
			else:
				break
		if main.screen == "complete":
			completed = true
			print("Fresh canonical playthrough: %s completed %s encounters in %s rounds, XP %s" % [career, main.rewarded_encounters.size(), rounds, main.total_xp])
			check(main.rewarded_encounters.size() == main.encounter_ids.size(), "Fresh resolver sequence awards all four encounters")
			break
		print("Fresh playthrough attempt: %s reached encounter %s; result %s" % [career, main.encounter_index + 1, main.screen])
	check(completed, "Fresh full encounter sequence is completable without levels or new mechanics")

func finish(main: Node) -> void:
	main.queue_free()
	print("Flow tests: %s checks, %s failures" % [checks, failures])
	quit(0 if failures == 0 else 1)
