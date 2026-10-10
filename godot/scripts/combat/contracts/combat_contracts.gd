class_name CombatContracts
extends RefCounted
## Provisional WS02 transport boundary; not a resolver or a content registry.
## Checks return {ok, issues, value}. Successful values are detached snapshots.
## IDs refer to runtime instances/actions; membership is the resolver's responsibility.


static func check_event(input: Variant) -> Dictionary:
	var issues: Array[String] = []
	_event(input, "event", issues)
	return _checked(input, issues)


static func check_events(input: Variant) -> Dictionary:
	var issues: Array[String] = []
	_events(input, "events", issues)
	return _checked(input, issues)


static func check_action(input: Variant) -> Dictionary:
	var issues: Array[String] = []
	_action(input, "action", issues)
	return _checked(input, issues)


static func check_preview(input: Variant) -> Dictionary:
	var issues: Array[String] = []
	if _object(input, "preview", [
		"action", "available", "legal_target_ids", "unavailable_reason",
		"cost", "cooldown", "damage_by_target",
	], issues):
		_action(input.get("action"), "preview.action", issues)
		_ids(input.get("legal_target_ids"), "preview.legal_target_ids", issues)
		if typeof(input.get("available")) != TYPE_BOOL:
			issues.append("preview.available: expected boolean")
		elif input.available:
			if input.has("unavailable_reason"):
				issues.append("preview.unavailable_reason: omit for available intent")
			if typeof(input.get("action")) == TYPE_DICTIONARY:
				var targets: Variant = input.action.get("target_ids")
				var legal: Variant = input.get("legal_target_ids")
				if typeof(targets) == TYPE_ARRAY and typeof(legal) == TYPE_ARRAY:
					for target in targets:
						if target not in legal:
							issues.append("preview.action.target_ids: target is not legal")
		else:
			_text(input.get("unavailable_reason"), "preview.unavailable_reason", issues)
		if input.has("cost"):
			if _object(input.cost, "preview.cost", ["stamina", "focus"], issues):
				for key in input.cost:
					_integer(input.cost[key], "preview.cost.%s" % key, issues)
		if input.has("cooldown"):
			_integer(input.cooldown, "preview.cooldown", issues)
		if input.has("damage_by_target"):
			if typeof(input.damage_by_target) != TYPE_DICTIONARY:
				issues.append("preview.damage_by_target: expected dictionary")
			else:
				for target in input.damage_by_target:
					_text(target, "preview.damage_by_target key", issues)
					_number(input.damage_by_target[target], "preview.damage_by_target.%s" % target, issues)
					var legal: Variant = input.get("legal_target_ids")
					if typeof(legal) == TYPE_ARRAY and target not in legal:
						issues.append("preview.damage_by_target: target is not legal")
	return _checked(input, issues)


static func check_result(input: Variant) -> Dictionary:
	var issues: Array[String] = []
	if _object(input, "result", ["encounter_id", "outcome", "events"], issues):
		_text(input.get("encounter_id"), "result.encounter_id", issues)
		if input.get("outcome") not in ["victory", "defeat", "exit"]:
			issues.append("result.outcome: expected victory, defeat or exit")
		_events(input.get("events"), "result.events", issues)
	return _checked(input, issues)


static func _event(input: Variant, path: String, issues: Array[String]) -> void:
	if not _object(input, path, [
		"sequence", "type", "turn", "source_id", "target_id", "payload",
	], issues):
		return
	_integer(input.get("sequence"), path + ".sequence", issues)
	_text(input.get("type"), path + ".type", issues)
	_integer(input.get("turn"), path + ".turn", issues)
	for key in ["source_id", "target_id"]:
		if input.has(key):
			_text(input[key], path + "." + key, issues)
	if typeof(input.get("payload")) != TYPE_DICTIONARY:
		issues.append(path + ".payload: expected dictionary")
	else:
		# Operation-specific payload schemas await adopted-behavior review.
		_data(input.payload, path + ".payload", issues)


static func _events(input: Variant, path: String, issues: Array[String]) -> void:
	if typeof(input) != TYPE_ARRAY:
		issues.append(path + ": expected array")
		return
	var previous := -1
	for index in range(input.size()):
		var event: Variant = input[index]
		var event_path := "%s[%d]" % [path, index]
		_event(event, event_path, issues)
		if typeof(event) == TYPE_DICTIONARY and typeof(event.get("sequence")) == TYPE_INT:
			if event.sequence <= previous:
				issues.append(event_path + ".sequence: must strictly increase in supplied order")
			previous = event.sequence
	# No sorting, renumbering, contiguous-sequence or turn-advance policy.


static func _action(input: Variant, path: String, issues: Array[String]) -> void:
	if not _object(input, path, ["actor_id", "action_id", "target_ids"], issues):
		return
	_text(input.get("actor_id"), path + ".actor_id", issues)
	_text(input.get("action_id"), path + ".action_id", issues)
	_ids(input.get("target_ids"), path + ".target_ids", issues)
	# Target cardinality, action kind and registry legality are not decided here.


static func _object(input: Variant, path: String, keys: Array, issues: Array[String]) -> bool:
	if typeof(input) != TYPE_DICTIONARY:
		issues.append(path + ": expected dictionary")
		return false
	for key in input:
		if typeof(key) != TYPE_STRING or key not in keys:
			issues.append(path + ": unknown field %s" % str(key))
	return true


static func _text(input: Variant, path: String, issues: Array[String]) -> void:
	if typeof(input) != TYPE_STRING or input.strip_edges().is_empty():
		issues.append(path + ": expected non-empty string")


static func _integer(input: Variant, path: String, issues: Array[String]) -> void:
	if typeof(input) != TYPE_INT or input < 0:
		issues.append(path + ": expected non-negative integer")


static func _number(input: Variant, path: String, issues: Array[String]) -> void:
	if typeof(input) != TYPE_INT and typeof(input) != TYPE_FLOAT:
		issues.append(path + ": expected finite non-negative number")
	elif not is_finite(float(input)) or input < 0:
		issues.append(path + ": expected finite non-negative number")


static func _ids(input: Variant, path: String, issues: Array[String]) -> void:
	if typeof(input) != TYPE_ARRAY:
		issues.append(path + ": expected array")
		return
	var seen: Array = []
	for index in range(input.size()):
		_text(input[index], "%s[%d]" % [path, index], issues)
		if input[index] in seen:
			issues.append(path + ": duplicate ID")
		seen.append(input[index])


static func _data(input: Variant, path: String, issues: Array[String], depth: int = 0) -> void:
	if depth > 64:
		issues.append(path + ": payload nesting exceeds 64")
		return
	match typeof(input):
		TYPE_STRING, TYPE_BOOL, TYPE_INT:
			pass
		TYPE_FLOAT:
			if not is_finite(input):
				issues.append(path + ": expected finite number")
		TYPE_ARRAY:
			for index in range(input.size()):
				_data(input[index], "%s[%d]" % [path, index], issues, depth + 1)
		TYPE_DICTIONARY:
			for key in input:
				if typeof(key) != TYPE_STRING:
					issues.append(path + ": expected string keys")
				_data(input[key], path + "." + str(key), issues, depth + 1)
		_:
			issues.append(path + ": expected scene-independent JSON value; omit null")


static func _checked(input: Variant, issues: Array[String]) -> Dictionary:
	if not issues.is_empty():
		return {"ok": false, "issues": issues, "value": {}}
	return {"ok": true, "issues": issues, "value": input.duplicate(true)}
