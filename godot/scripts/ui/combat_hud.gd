class_name CombatHud
extends Control

signal action_selected(id: String)
signal target_selected(index: int)
signal confirm_requested
signal cancel_requested

const BACKGROUND = Color("#17201c")
const SURFACE = Color("#26332b")
const BORDER = Color("#647765")
const INK = Color("#f5eedc")
const MUTED = Color("#bac8ad")
const ACCENT = Color("#e6c577")
const SPACING = 16
const TOUCH_HEIGHT = 48

var scroll: ScrollContainer
var column: VBoxContainer
var detail_label: Label
var confirm_button: Button
var cancel_button: Button
var action_buttons: Dictionary = {}
var target_buttons: Dictionary = {}
var log_label: Label
var _first_button: Button
var _focus_preference: Button

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	theme = make_theme()
	var backdrop := ColorRect.new()
	backdrop.color = BACKGROUND
	backdrop.mouse_filter = Control.MOUSE_FILTER_IGNORE
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(backdrop)
	scroll = ScrollContainer.new()
	scroll.name = "ScreenScroll"
	scroll.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scroll.offset_left = SPACING
	scroll.offset_top = SPACING
	scroll.offset_right = -SPACING
	scroll.offset_bottom = -SPACING
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	add_child(scroll)
	column = VBoxContainer.new()
	column.name = "Content"
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.add_theme_constant_override("separation", SPACING)
	scroll.add_child(column)

func make_theme() -> Theme:
	var result := Theme.new()
	result.default_font_size = 18
	result.set_color("font_color", "Label", INK)
	result.set_color("font_color", "Button", INK)
	result.set_color("font_hover_color", "Button", INK)
	result.set_color("font_focus_color", "Button", INK)
	result.set_color("font_pressed_color", "Button", BACKGROUND)
	result.set_color("font_disabled_color", "Button", MUTED)
	for state in ["normal", "hover", "pressed", "disabled", "focus"]:
		var style := StyleBoxFlat.new()
		style.bg_color = ACCENT if state == "pressed" else SURFACE
		style.border_color = ACCENT if state in ["hover", "focus"] else BORDER
		style.set_border_width_all(3 if state == "focus" else 1)
		style.set_corner_radius_all(4)
		style.content_margin_left = SPACING
		style.content_margin_right = SPACING
		style.content_margin_top = 12
		style.content_margin_bottom = 12
		if state == "focus":
			style.bg_color = Color.TRANSPARENT
		result.set_stylebox(state, "Button", style)
	return result

func begin_screen(brand: String, step: String) -> void:
	for child in column.get_children():
		column.remove_child(child)
		child.queue_free()
	_first_button = null
	_focus_preference = null
	confirm_button = null
	cancel_button = null
	detail_label = null
	log_label = null
	action_buttons.clear()
	target_buttons.clear()
	text("%s  /  %s" % [brand, step], MUTED)
	scroll.scroll_vertical = 0

func finish_screen() -> void:
	var focus := _focus_preference if is_instance_valid(_focus_preference) else _first_button
	if is_instance_valid(focus):
		call_deferred("_focus_if_current", focus)

func _focus_if_current(control: Button) -> void:
	if is_instance_valid(control) and control.is_inside_tree() and not control.is_queued_for_deletion():
		control.grab_focus()
		if _focus_preference == null:
			scroll.scroll_vertical = 0

func heading(value: String) -> Label:
	var label := text(value)
	label.add_theme_font_size_override("font_size", 24)
	return label

func text(value: String, color: Color = INK) -> Label:
	var label := Label.new()
	label.text = value
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.add_theme_color_override("font_color", color)
	column.add_child(label)
	return label

func button(value: String, callback: Callable, disabled: bool = false) -> Button:
	var control := Button.new()
	control.text = value
	control.custom_minimum_size.y = TOUCH_HEIGHT
	control.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	control.alignment = HORIZONTAL_ALIGNMENT_LEFT
	control.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	control.focus_mode = Control.FOCUS_ALL
	control.disabled = disabled
	control.pressed.connect(callback)
	column.add_child(control)
	if _first_button == null and not disabled:
		_first_button = control
	return control

func values(record: Dictionary) -> String:
	var parts: Array = []
	for key in record:
		var value = record[key]
		if key == "crit_chance":
			parts.append("Crit: %s%%" % snappedf(float(value) * 100.0, 0.1))
		else:
			parts.append("%s: %s" % [str(key).replace("_", " ").capitalize(), value])
	return " · ".join(parts)

func skill_details(skill: Dictionary) -> String:
	var damage_text := ""
	if skill.has("damage"):
		var damage: Dictionary = skill.damage
		damage_text = "\nDamage: max(1, %s + %s × %s − defense) · %s; status modifiers apply" % [damage.flat, damage.scaling_stat, damage.multiplier, damage.damage_type]
	var status_parts: Array = []
	for effect in skill.get("applies_statuses", []):
		status_parts.append("%s · %s turns · %s%%" % [effect.status, int(effect.duration), float(effect.get("chance", 1.0)) * 100])
	return "%s · Target: %s\nCost: %s · Cooldown: %s turns\n%s%s%s" % [skill.name, skill.target, values(skill.cost) if not skill.cost.is_empty() else "Free", int(skill.cooldown), skill.description, damage_text, "\nEffects: " + ", ".join(status_parts) if not status_parts.is_empty() else ""]

func render_combat(battle: Dictionary, registry: Dictionary, encounter: Dictionary, resolver: Variant, action: String, target: int, stage: String) -> void:
	begin_screen("ECHO//BRUCH", "COMBAT · ROUND %s · %s" % [battle.round, stage.replace("_", " ").to_upper()])
	heading(encounter.name)
	text("Arena: %s · Difficulty: %s / 5" % [encounter.arena, int(encounter.difficulty)], MUTED)
	var player: Dictionary = battle.player
	var record: Dictionary = registry.items.get(action.trim_prefix("item:"), {}) if action.begins_with("item:") else registry.skills.get(action, {})
	var self_action: bool = action == "" or action.begins_with("item:") or record.get("target") == "self"
	var selecting := stage in ["action_selected", "preview"]
	heading("YOUR SIDE")
	render_actor(player, registry)
	if selecting and self_action:
		var own := button("[Selected] %s" % player.name if stage == "preview" else "Choose self · %s" % player.name, func(): target_selected.emit(-1))
		target_buttons[-1] = own
		_focus_preference = own
	heading("OPPONENTS")
	for index in range(battle.enemies.size()):
		var enemy: Dictionary = battle.enemies[index]
		render_actor(enemy, registry)
		if selecting and not self_action:
			var label := "[Defeated] %s" % enemy.name if enemy.hp <= 0 else "[Selected] %s" % enemy.name if target == index and stage == "preview" else "Choose target · %s" % enemy.name
			var target_button := button(label, func(): target_selected.emit(index), enemy.hp <= 0)
			target_buttons[index] = target_button
			if enemy.hp > 0 and _focus_preference == null:
				_focus_preference = target_button
	heading("CHOOSE ACTION")
	text("Choose action → choose a living target (or self) → inspect exact preview → confirm.", MUTED)
	for id in player.skills:
		var skill: Dictionary = registry.skills[id]
		var reason: String = resolver.unavailable(player, skill)
		if skill.has("trigger"):
			reason = "Automatic reaction · " + str(skill.trigger).replace("_", " ")
		var prefix := "[Selected] " if selecting and action == id else ""
		var label := "%s%s · %s · CD %s\n%s" % [prefix, skill.name, values(skill.cost) if not skill.cost.is_empty() else "Free", player.cooldowns.get(id, 0), "Unavailable: " + reason if not reason.is_empty() else "Target: " + skill.target]
		# Unavailable actions remain focusable and tappable for inspection.
		var action_button := button(label, func():
			if reason.is_empty():
				action_selected.emit(id)
			else:
				show_detail(skill_details(skill) + "\nUnavailable: " + reason)
		, stage == "resolving")
		action_button.focus_entered.connect(func(): show_detail(skill_details(skill) + ("\nUnavailable: " + reason if not reason.is_empty() else "")))
		action_buttons[id] = action_button
	for id in battle.get("inventory", {}):
		var item: Dictionary = registry.items[id]
		var quantity: int = int(battle.inventory[id])
		if item.slot != "consumable":
			continue
		var item_button := button("%s · × %s · Target: self\n%s" % [item.name, quantity, values(item.get("use", {}))], func():
			if quantity > 0:
				action_selected.emit("item:" + id)
			else:
				show_detail(item.description + "\nUnavailable: no remaining items.")
		, stage == "resolving")
		item_button.focus_entered.connect(func(): show_detail(item.description + "\n" + values(item.get("use", {}))))
		action_buttons["item:" + id] = item_button
	action_buttons[""] = button("Recover · no skill / item used · Target: self", func(): action_selected.emit(""), stage == "resolving")
	heading("INSPECT / HELP")
	detail_label = text("Focus or tap an unavailable action or status chip for details.", MUTED)
	if selecting:
		heading("ACTION PREVIEW")
		if action == "":
			text("Recover · no cost. Restores resources according to the combat resolver.")
		elif action.begins_with("item:"):
			text("%s\n%s\nUse: %s" % [record.name, record.description, values(record.get("use", {}))])
		else:
			text(skill_details(record))
		if stage == "preview":
			var actor: Dictionary = player if self_action else battle.enemies[target]
			text("Target: %s" % actor.name)
			if record.has("damage"):
				var damage: int = resolver.preview(player, actor, record, registry)
				text("Preview damage: %s HP · guaranteed resolver damage" % damage)
			elif action == "" or action.begins_with("item:"):
				text("Direct damage: 0 HP · resource / item action")
			else:
				text("Direct damage: 0 HP · status action")
			confirm_button = button("Confirm · resolve round", func(): confirm_requested.emit())
			_focus_preference = confirm_button
		else:
			text("Choose %s to reveal the outcome preview." % ("self" if self_action else "a living opponent"), MUTED)
	if stage != "idle":
		cancel_button = button("Back · target selection" if stage == "preview" else "Cancel action", func(): cancel_requested.emit(), stage == "resolving")
	if stage == "resolving":
		text("Resolving round… Inputs locked.", ACCENT)
	render_log(battle.get("events", []), registry)
	finish_screen()

func render_actor(actor: Dictionary, registry: Dictionary) -> void:
	heading("%s · %s" % [actor.name, "Defeated" if actor.hp <= 0 else "Living"])
	meter("HP", actor.hp, actor.stats.get("hp", actor.hp))
	for resource in ["stamina", "focus"]:
		if actor.has(resource):
			meter(resource.capitalize(), actor[resource], actor.stats.get(resource, actor[resource]))
	text(values(actor.stats), MUTED)
	if registry.bosses.has(actor.id):
		var boss: Dictionary = registry.bosses[actor.id]
		var phase_index: int = int(actor.get("phase_index", 0))
		if phase_index >= 0 and phase_index < boss.phases.size():
			var phase: Dictionary = boss.phases[phase_index]
			text("Boss phase %s / %s · %s · HP threshold %s%%" % [phase_index + 1, boss.phases.size(), phase.name, phase.hp_threshold * 100], ACCENT)
	var pending: String = str(actor.get("pending_skill", ""))
	if not pending.is_empty():
		text("WARNING · Pending attack: %s" % registry.skills.get(pending, {}).get("name", pending), ACCENT)
	var effects: Array = actor.get("effects", [])
	if effects.is_empty():
		text("Statuses: none", MUTED)
	for effect in effects:
		var status: Dictionary = registry.statuses.get(effect.id, {})
		var label := "[%s] %s · %s turns · × %s" % [status.get("icon_shape", "status"), status.get("name", effect.id), int(effect.duration), int(effect.stacks)]
		var details := "%s\n%s\nDuration: %s turns · Stacks: %s\n%s" % [status.get("name", effect.id), status.get("description", ""), int(effect.duration), int(effect.stacks), values(status.get("effect", {}))]
		var chip := button(label, func(): show_detail(details))
		chip.focus_entered.connect(func(): show_detail(details))

func meter(label: String, current: Variant, maximum: Variant) -> void:
	text("%s: %s / %s" % [label, current, maximum])
	var bar := ProgressBar.new()
	bar.min_value = 0
	bar.max_value = maxf(1.0, float(maximum))
	bar.value = float(current)
	bar.show_percentage = false
	bar.custom_minimum_size.y = 8
	var background := StyleBoxFlat.new()
	background.bg_color = SURFACE
	var fill := StyleBoxFlat.new()
	fill.bg_color = ACCENT
	bar.add_theme_stylebox_override("background", background)
	bar.add_theme_stylebox_override("fill", fill)
	column.add_child(bar)

func show_detail(value: String) -> void:
	if is_instance_valid(detail_label):
		detail_label.text = value
		scroll.ensure_control_visible(detail_label)

func render_log(events: Array, registry: Dictionary) -> void:
	heading("COMBAT LOG · ORDERED EVENTS")
	var ordered: Array = events.duplicate(true)
	ordered.sort_custom(func(a, b): return a.get("seq", 0) < b.get("seq", 0))
	var lines: PackedStringArray = []
	for event in ordered:
		var source := entity_name(str(event.get("source", "")), registry)
		var target := entity_name(str(event.get("target", "")), registry)
		var payload: Dictionary = event.get("payload", {})
		lines.append("#%s · Round %s · %s · %s → %s\n%s" % [event.get("seq", "?"), event.get("turn", "?"), str(event.get("type", "event")).replace("_", " "), source, target, values(payload)])
	log_label = text("\n\n".join(lines) if not lines.is_empty() else "No events yet.", MUTED)

func entity_name(id: String, registry: Dictionary) -> String:
	for collection in ["careers", "enemies", "bosses", "skills", "items", "statuses"]:
		if registry[collection].has(id):
			return registry[collection][id].name
	return id if not id.is_empty() else "—"
