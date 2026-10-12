extends SceneTree

const Stage = preload("res://scripts/ui/foundation/battle_stage.gd")
var failures := 0
var checks := 0

func _initialize() -> void:
	var stage = Stage.new()
	root.add_child(stage)
	var player := {"id": "duelist", "hp": 40}
	var opponent := {"id": "iron_captain", "hp": 60}
	var events := [
		{"seq": 1, "type": "status_tick", "target": "duelist", "payload": {"amount": 3, "status": "bleeding"}},
		{"seq": 2, "type": "damage", "target": "duelist", "payload": {"amount": 3, "status": "bleeding"}},
		{"seq": 3, "type": "damage", "target": "iron_captain", "payload": {"amount": 7}}
	]
	stage.present({}, player, [opponent], -1, false, events)
	check(stage._impacts.size() == 2, "One damage label per resolved hit; DoT annotation must not duplicate its damage event")
	check(stage._impacts[0].amount == 3 and stage._impacts[1].amount == 7, "Labels consume resolved damage amounts in order")
	stage.present({}, player, [opponent], -1, false, events)
	check(stage._impacts.size() == 2, "Re-presenting the same event sequence cannot duplicate impacts")
	check(player.hp == 40 and opponent.hp == 60, "Feedback never applies damage to combat snapshots")
	stage.reduced_motion = true
	stage.present({}, player, [opponent], -1, false, [
		{"seq": 4, "type": "damage", "target": "duelist", "payload": {"amount": 9}}
	])
	check(stage._impacts.is_empty() and not stage.is_processing(), "Reduced motion disables impact animation")
	stage.free()
	print("Feedback tests: %s checks, %s failures" % [checks, failures])
	quit(0 if failures == 0 else 1)

func check(condition: bool, message: String) -> void:
	checks += 1
	if not condition:
		failures += 1
		push_error("FEEDBACK TEST: " + message)
