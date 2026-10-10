extends SceneTree
## Run: godot --headless --path godot --script res://scripts/ui/foundation/foundation_checks.gd
## Widget checks only: native narrow/wide screenshots and device input remain required.

const MeterScene = preload("res://scenes/ui/foundation/numeric_meter.tscn")
const StatusScene = preload("res://scenes/ui/foundation/status_chip.tscn")
const HelpScene = preload("res://scenes/ui/foundation/focus_tap_help.tscn")

var _failures := 0


func _initialize() -> void:
	_run.call_deferred()


func _check(condition: bool, message: String) -> void:
	if not condition:
		_failures += 1
		push_error(message)


func _run() -> void:
	var meter = MeterScene.instantiate()
	_check(meter.set_values("Body", 82, 100), "Valid supplied meter rejected")
	root.add_child(meter)
	await process_frame
	_check(meter.value_label.text == "82 / 100", "Exact current/max lost")
	_check(is_equal_approx(meter.meter.value, 0.82), "Supporting fill incorrect")
	meter.set_values("Body", 120, 100, true)
	_check(meter.value_label.text == "120 / 100", "Numbers must not clamp")
	_check(meter.meter.value == 1.0 and meter.warning_label.visible,
			"Visual clamping / caller-supplied warning failed")
	meter.set_values("Body", 0, 100)
	_check(meter.value_label.text == "0 / 100" and meter.meter.value == 0.0,
			"Zero must remain supplied data")
	meter.set_values("Body", 12)
	_check(meter.value_label.text == "12" and not meter.meter.visible,
			"Missing maximum must not invent a bar")
	meter.set_values("Body", null, 100)
	_check(meter.value_label.text == "Max: 100" and not meter.meter.visible,
			"Maximum-only reading must not invent current")
	meter.set_values("Body", 8, 0)
	_check(not meter.meter.visible and meter.value_label.text == "8 / 0",
			"Zero maximum must not divide or alter numbers")
	_check(not meter.set_values("Body", NAN, 100), "Non-finite meter accepted")
	_check(not meter.value_label.visible and not meter.meter.visible,
			"Invalid reading must clear stale values")
	meter.set_values("Body", null)
	_check(not meter.value_label.visible, "Missing current must not become zero")

	# Canonical data is outside the Godot resource root; use the checkout path.
	var file := FileAccess.open(ProjectSettings.globalize_path("res://").path_join(
			"../data/statuses/bleeding.json"), FileAccess.READ)
	if file == null:
		_check(false, "Canonical status fixture could not be read")
	else:
		var record: Variant = JSON.parse_string(file.get_as_text())
		var status = StatusScene.instantiate()
		_check(status.set_status(record, 2, 1), "Canonical status record rejected")
		root.add_child(status)
		await process_frame
		_check(status.name_label.text == record["name"], "Status name changed")
		_check(status.help.description_label.text == record["description"],
				"Status description changed")
		_check(status.counts_label.text == "Duration: 2 · Stacks: 1",
				"Active duration/stacks not rendered")
		status.set_status(record)
		_check(not status.counts_label.visible, "Definition defaults became active counts")
		status.set_status(record, 0, 0)
		_check(status.counts_label.text == "Duration: 0 · Stacks: 0",
				"Supplied zero status counts lost")
		_check(not status.set_status({"name": 2}), "Invalid status accepted")
		_check(not status.visible, "Invalid status retained previous rendering")
		status.clear_status()
		status.queue_free()

	var help = HelpScene.instantiate()
	help.set_help("Supplied explanation", "Inspect", "Supplied unavailable reason")
	root.add_child(help)
	await process_frame
	_check(help.reason_label.visible and not help.trigger.disabled,
			"Unavailable content must stay inspectable with visible reason")
	_check(help.trigger.custom_minimum_size.y >= 48, "Help target below 48")
	_check(help.dismiss_button.custom_minimum_size.y >= 48, "Dismiss target below 48")
	help.trigger.grab_focus()
	_check(help.details.visible, "Keyboard focus did not open help")
	help.dismiss_button.grab_focus()
	await process_frame
	_check(help.details.visible, "Focus moving into details dismissed help")
	help.dismiss_button.pressed.emit()
	_check(not help.details.visible and help.trigger.has_focus(),
			"Dismiss did not close and restore focus")
	help.trigger.pressed.emit()
	_check(help.details.visible, "Tap/activation did not pin help")
	help.trigger.pressed.emit()
	_check(not help.details.visible, "Second activation did not dismiss help")
	help.trigger.pressed.emit()
	var cancel := InputEventAction.new()
	cancel.action = "ui_cancel"
	cancel.pressed = true
	help._unhandled_key_input(cancel)
	_check(not help.details.visible, "Keyboard cancel did not dismiss help")
	help.set_help("")
	_check(not help.trigger.visible and not help.details.visible, "Empty help stayed open")
	meter.queue_free()
	help.queue_free()
	await process_frame
	print("HUD foundation checks: %s failure(s)" % _failures)
	quit(0 if _failures == 0 else 1)
