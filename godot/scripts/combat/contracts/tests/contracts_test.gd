extends SceneTree

const Contracts = preload("../combat_contracts.gd")

var assertions := 0
var failures: Array[String] = []


func _initialize() -> void:
	_test_events()
	_test_actions()
	_test_previews()
	_test_results()
	print("Combat contracts: %d assertions, %d failures" % [assertions, failures.size()])
	for failure in failures:
		printerr(failure)
	quit(0 if failures.is_empty() else 1)


func _expect(condition: bool, message: String) -> void:
	assertions += 1
	if not condition:
		failures.append(message)


func _event(sequence: int = 4) -> Dictionary:
	return {
		"sequence": sequence, "type": "damage", "turn": 0,
		"source_id": "player_1", "target_id": "enemy_1",
		"payload": {"amount": 6.0, "damage_type": "physical", "tags": ["melee"]},
	}


func _action() -> Dictionary:
	return {"actor_id": "player_1", "action_id": "precise_thrust", "target_ids": ["enemy_1"]}


func _preview() -> Dictionary:
	return {
		"action": _action(), "available": true, "legal_target_ids": ["enemy_1"],
		"cost": {"stamina": 8, "focus": 4}, "cooldown": 2, "damage_by_target": {"enemy_1": 6.0},
	}


func _test_events() -> void:
	var events := [_event(4), _event(9)]
	var checked := Contracts.check_events(events)
	_expect(checked.ok, "valid events allow gaps and an opaque turn zero")
	_expect(checked.value == events, "event order and payloads preserved")
	events[0].payload.tags.append("changed")
	_expect(checked.value[0].payload.tags == ["melee"], "event input deeply detached")
	checked.value[1].payload.amount = 99
	_expect(events[1].payload.amount == 6.0, "event output cannot mutate input")
	_expect(not Contracts.check_events([_event(9), _event(4)]).ok, "reject descending sequences")
	_expect(not Contracts.check_events([_event(4), _event(4)]).ok, "reject duplicate sequences")
	_expect(Contracts.check_events([]).ok, "empty event stream permitted")
	_expect(not Contracts.check_events({}).ok, "reject non-array stream")
	_expect(not Contracts.check_events([false]).ok, "reject malformed event")
	for key in ["sequence", "type", "turn", "payload"]:
		var missing := _event()
		missing.erase(key)
		_expect(not Contracts.check_event(missing).ok, "require event " + key)
	for value in [-1, 1.5, true, "1", null]:
		var event := _event()
		event.sequence = value
		_expect(not Contracts.check_event(event).ok, "reject invalid sequence")
		event = _event()
		event.turn = value
		_expect(not Contracts.check_event(event).ok, "reject invalid turn")
	for value in ["", " ", 1, null]:
		var event := _event()
		event.type = value
		_expect(not Contracts.check_event(event).ok, "reject invalid type")
	var event := _event()
	event.erase("source_id")
	event.erase("target_id")
	_expect(Contracts.check_event(event).ok, "non-applicable identifiers omitted")
	event.source_id = null
	_expect(not Contracts.check_event(event).ok, "identifier null rejected")
	for payload in [[], null, {"node": RefCounted.new()}, {"value": NAN}, {"value": INF}, {1: "bad"}, {"value": null}]:
		event = _event()
		event.payload = payload
		_expect(not Contracts.check_event(event).ok, "reject non-transport payload")
	event = _event()
	event.payload = {"flag": true, "change": -3, "nested": {"values": [1, "text"]}}
	_expect(Contracts.check_event(event).ok, "JSON payload supports signed deltas")
	event.extra = 1
	var invalid := Contracts.check_event(event)
	_expect(not invalid.ok and invalid.value.is_empty(), "unknown fields yield no partial value")
	event = {"sequence": -1, "type": "", "turn": -1, "payload": null}
	_expect(Contracts.check_event(event).issues.size() == 4, "event issues aggregated")
	var nested := {}
	nested["self"] = nested
	event = _event()
	event.payload = nested
	_expect(not Contracts.check_event(event).ok, "recursive dictionaries rejected safely")
	nested.clear()


func _test_actions() -> void:
	var action := _action()
	var checked := Contracts.check_action(action)
	_expect(checked.ok, "valid action accepted")
	action.target_ids.append("enemy_2")
	_expect(checked.value.target_ids == ["enemy_1"], "action snapshot detached")
	for key in ["actor_id", "action_id", "target_ids"]:
		action = _action()
		action.erase(key)
		_expect(not Contracts.check_action(action).ok, "require action " + key)
	for targets in [["enemy_1", "enemy_1"], [null], "enemy_1"]:
		action = _action()
		action.target_ids = targets
		_expect(not Contracts.check_action(action).ok, "reject invalid target IDs")
	action = _action()
	action.target_ids = []
	_expect(Contracts.check_action(action).ok, "cardinality policy deliberately deferred")


func _test_previews() -> void:
	var preview := _preview()
	var before := preview.duplicate(true)
	var checked := Contracts.check_preview(preview)
	_expect(checked.ok and preview == before, "preview validation non-mutating")
	checked.value.action.target_ids.clear()
	checked.value.cost.stamina = 99
	_expect(preview == before, "preview result deeply isolated")
	preview = _preview()
	preview.available = false
	preview.unavailable_reason = "Insufficient stamina"
	preview.erase("damage_by_target")
	_expect(Contracts.check_preview(preview).ok, "unavailable intent carries reason")
	preview.erase("unavailable_reason")
	_expect(not Contracts.check_preview(preview).ok, "unavailable reason required")
	preview = _preview()
	preview.unavailable_reason = "contradiction"
	_expect(not Contracts.check_preview(preview).ok, "available intent cannot carry failure reason")
	preview = _preview()
	preview.action.target_ids = ["enemy_2"]
	_expect(not Contracts.check_preview(preview).ok, "available target must be legal")
	preview = _preview()
	preview.damage_by_target = {"enemy_2": 4}
	_expect(not Contracts.check_preview(preview).ok, "computed damage targets must be legal")
	for cost in [{"mana": 1}, {"stamina": -1}, {"focus": 1.5}, null]:
		preview = _preview()
		preview.cost = cost
		_expect(not Contracts.check_preview(preview).ok, "reject invalid canonical costs")
	for damage in [-1, NAN, INF, "unknown", null]:
		preview = _preview()
		preview.damage_by_target.enemy_1 = damage
		_expect(not Contracts.check_preview(preview).ok, "reject invalid damage values")
	preview = _preview()
	preview.erase("cost")
	preview.erase("cooldown")
	preview.erase("damage_by_target")
	_expect(Contracts.check_preview(preview).ok, "unknown computed values omitted, not invented")
	for key in ["action", "available", "legal_target_ids"]:
		preview = _preview()
		preview.erase(key)
		_expect(not Contracts.check_preview(preview).ok, "require preview " + key)


func _test_results() -> void:
	for outcome in ["victory", "defeat", "exit"]:
		var result := {"encounter_id": "first_blood", "outcome": outcome, "events": [_event()]}
		var checked := Contracts.check_result(result)
		_expect(checked.ok, "terminal outcome " + outcome)
		result.events[0].payload.amount = 10
		_expect(checked.value.events[0].payload.amount == 6.0, "result events detached")
	var result := {"encounter_id": "first_blood", "outcome": "pending", "events": []}
	_expect(not Contracts.check_result(result).ok, "non-terminal outcome rejected")
	result.outcome = "exit"
	_expect(Contracts.check_result(result).ok, "exit may have no events")
	result.events = [_event(9), _event(4)]
	_expect(not Contracts.check_result(result).ok, "result cannot reorder event stream")
	for key in ["encounter_id", "outcome", "events"]:
		result = {"encounter_id": "first_blood", "outcome": "victory", "events": []}
		result.erase(key)
		_expect(not Contracts.check_result(result).ok, "require result " + key)
