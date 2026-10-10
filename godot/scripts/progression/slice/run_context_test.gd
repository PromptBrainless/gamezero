extends SceneTree

## Run: godot --headless --path godot --script res://scripts/progression/slice/run_context_test.gd
## Tests use canonical JSON without boot integration or a parallel content model.
const RunContext = preload("res://scripts/progression/slice/run_context.gd")

var _failures: int = 0
var _checks: int = 0
var _careers: Array = []
var _encounters: Array = []
var _item_ids: Array = []


func _initialize() -> void:
	_careers = _load_collection("careers")
	_encounters = _load_collection("encounters")
	for item in _load_collection("items"):
		_item_ids.append(item["id"])
	_check(_careers.size() == 3, "three canonical careers")
	_check(_encounters.size() == 4, "four canonical encounters")
	if _careers.size() != 3 or _encounters.size() != 4:
		quit(1)
		return
	_test_full_runs()
	_test_guards_and_identity()
	_test_nonvictory_boundaries()
	_test_content_validation()
	_test_reset_and_detached_state()
	_test_reset_at_every_screen()
	_test_cyclic_and_deep_inputs()
	print("WS04 run context: %d checks, %d failures" % [_checks, _failures])
	quit(0 if _failures == 0 else 1)


func _test_full_runs() -> void:
	var expected: Array = _encounters.duplicate(true)
	expected.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a["order"] < b["order"])
	for career in _careers:
		var run = _new_run()
		_ok(run.select_career(career["id"]), "select canonical career")
		_check(run.snapshot()["screen"] == RunContext.Screen.CAREER_SELECT, "selection requires confirmation")
		_ok(run.confirm_career(), "confirm career")
		var xp: int = 0
		var items: Array = []
		for index in range(expected.size()):
			var state: Dictionary = run.snapshot()
			var encounter: Dictionary = expected[index]
			_check(state["encounter_cursor"] == index, "ordered cursor")
			_check(state["encounter"]["id"] == encounter["id"], "numeric order, not filename order")
			_check(state["selected_career"] == career, "carry canonical stats, skills and starting items")
			_ok(_start(run), "start approved context including boss")
			var result: Dictionary = _result(run, "victory", "%s_%d" % [career["id"], index])
			# Resolver-supplied amounts cannot override canonical inline encounter rewards.
			result["rewards"] = {"xp": 999999, "items": ["not_a_canonical_item"]}
			_ok(run.consume_result(result), "victory result")
			xp += int(encounter["rewards"]["xp"])
			items.append_array(encounter["rewards"].get("items", []))
			state = run.snapshot()
			_check(state["screen"] == RunContext.Screen.REWARD, "victory enters Reward")
			_check(state["xp"] == xp and state["reward_items"] == items, "canonical reward receipts exactly once")
			_check(state["last_reward"]["xp"] == int(encounter["rewards"]["xp"]), "reward screen handoff")
			_reject_unchanged(run, run.consume_result.bind(result), "duplicate_result")
			_reject_unchanged(run, run.continue_run, "invalid_transition")
			_ok(run.continue_to_progression(), "Reward to Progression")
			_reject_unchanged(run, run.consume_result.bind(result), "duplicate_result")
			_reject_unchanged(run, run.continue_to_progression, "invalid_transition")
			_ok(run.continue_run(), "Progression to next preview or finish")
			_check(run.snapshot()["xp"] == xp, "navigation cannot grant XP")
			_check(
				run.snapshot()["screen"] == (RunContext.Screen.FINISHED if index == expected.size() - 1 else RunContext.Screen.ENCOUNTER_PREVIEW),
				"terminal encounter finishes only after Progression"
			)
		_reject_unchanged(run, run.continue_run, "invalid_transition")
		_reject_unchanged(run, _start.bind(run), "invalid_transition")
		_ok(run.reset(), "finished reset")
		_check_fresh(run)
		_ok(run.select_career(career["id"]), "repeat run career selection")
		_ok(run.confirm_career(), "repeat run confirmation")
		_ok(_start(run), "repeat run starts at first encounter")


func _test_guards_and_identity() -> void:
	var unconfigured = RunContext.new()
	_reject_unchanged(unconfigured, unconfigured.select_career.bind(_careers[0]["id"]), "runtime_not_ready")
	var run = _new_run()
	_reject_unchanged(run, run.confirm_career, "career_required")
	_reject_unchanged(run, run.select_career.bind("missing"), "unknown_career")
	_reject_unchanged(run, run.continue_run, "invalid_transition")
	_reject_unchanged(run, _start.bind(run), "invalid_transition")
	_ok(run.select_career(_careers[0]["id"]), "first selection")
	_ok(run.select_career(_careers[1]["id"]), "change selection before confirmation")
	_ok(run.confirm_career(), "confirm changed selection")
	_reject_unchanged(run, run.select_career.bind(_careers[2]["id"]), "invalid_transition")
	_reject_unchanged(run, run.start_combat.bind(_entry(run)), "combat_entry_policy_required")
	var entry: Dictionary = _entry(run)
	entry["encounter_id"] = "wrong"
	_reject_unchanged(run, run.start_combat.bind(entry, true), "context_identity_mismatch")
	entry = _entry(run)
	entry["career_id"] = "wrong"
	_reject_unchanged(run, run.start_combat.bind(entry, true), "context_identity_mismatch")
	entry = _entry(run)
	entry["state"] = RefCounted.new()
	_reject_unchanged(run, run.start_combat.bind(entry, true), "invalid_combat_context")
	_ok(_start(run), "valid start after rejection")
	_reject_unchanged(run, _start.bind(run), "invalid_transition")
	_reject_unchanged(run, run.consume_result.bind({}), "invalid_result")
	var invalid: Dictionary = _result(run, "draw", "bad_outcome")
	_reject_unchanged(run, run.consume_result.bind(invalid), "invalid_outcome")
	invalid = _result(run, "victory", "wrong_encounter")
	invalid["encounter_id"] = "wrong"
	_reject_unchanged(run, run.consume_result.bind(invalid), "result_identity_mismatch")
	invalid = _result(run, "victory", "wrong_combat")
	invalid["combat_id"] = "wrong"
	_reject_unchanged(run, run.consume_result.bind(invalid), "result_identity_mismatch")
	var valid: Dictionary = _result(run, "victory", "accepted")
	_ok(run.consume_result(valid), "only current result accepted")
	valid["result_id"] = "alias"
	_reject_unchanged(run, run.consume_result.bind(valid), "invalid_transition")
	_ok(run.continue_to_progression(), "progression")
	_ok(run.continue_run(), "next encounter")
	_ok(_start(run), "second combat")
	_reject_unchanged(run, run.consume_result.bind(_result(run, "victory", "accepted")), "duplicate_result")
	valid["result_id"] = "stale_alias"
	_reject_unchanged(run, run.consume_result.bind(valid), "result_identity_mismatch")


func _test_nonvictory_boundaries() -> void:
	for outcome in ["defeat", "exit"]:
		var run = _new_run()
		_ok(run.select_career(_careers[0]["id"]), "select for nonvictory")
		_ok(run.confirm_career(), "confirm for nonvictory")
		_ok(_start(run), "start nonvictory")
		var result: Dictionary = _result(run, outcome, outcome)
		_ok(run.consume_result(result), "consume nonvictory once")
		var state: Dictionary = run.snapshot()
		_check(state["screen"] == RunContext.Screen.OUTCOME_BLOCKED, "no invented defeat/exit destination")
		_check(state["xp"] == 0 and state["reward_items"].is_empty(), "no rewards without victory")
		_check(state["last_reward"].is_empty() and state["last_result"] == result, "nonvictory result handoff")
		_check(not state["outcome_blocker"].is_empty(), "explicit gameplay blocker")
		_reject_unchanged(run, run.consume_result.bind(result), "duplicate_result")
		_reject_unchanged(run, run.continue_run, "outcome_policy_required")
		_reject_unchanged(run, run.continue_to_progression, "invalid_transition")
		_reject_unchanged(run, _start.bind(run), "invalid_transition")
		_ok(run.reset(), "explicit abandonment, not automatic recovery")
		_check_fresh(run)


func _test_content_validation() -> void:
	var run = RunContext.new()
	_reject_unchanged(run, run.configure.bind(_careers, _encounters, _item_ids, false), "runtime_not_ready")
	_reject_unchanged(run, run.configure.bind([], _encounters, _item_ids, true), "invalid_content")
	_reject_unchanged(run, run.configure.bind(_careers, [], _item_ids, true), "invalid_content")
	var bad: Array = _encounters.duplicate(true)
	bad[1]["order"] = bad[0]["order"]
	_reject_unchanged(run, run.configure.bind(_careers, bad, _item_ids, true), "invalid_content")
	bad = _encounters.duplicate(true)
	bad[1]["id"] = bad[0]["id"]
	_reject_unchanged(run, run.configure.bind(_careers, bad, _item_ids, true), "invalid_content")
	for invalid_xp in [-1, 1.5, true, "22", null, INF]:
		bad = _encounters.duplicate(true)
		bad[0]["rewards"]["xp"] = invalid_xp
		_reject_unchanged(run, run.configure.bind(_careers, bad, _item_ids, true), "invalid_content")
	bad = _encounters.duplicate(true)
	bad[0]["rewards"]["items"] = ["missing"]
	_reject_unchanged(run, run.configure.bind(_careers, bad, _item_ids, true), "invalid_content")
	bad = _careers.duplicate(true)
	bad[0]["starting_items"] = ["missing"]
	_reject_unchanged(run, run.configure.bind(bad, _encounters, _item_ids, true), "invalid_content")
	bad = _careers.duplicate(true)
	bad.append(bad[0].duplicate(true))
	_reject_unchanged(run, run.configure.bind(bad, _encounters, _item_ids, true), "invalid_content")
	_ok(run.configure(_careers, _encounters, _item_ids, true), "configuration after atomic rejections")
	_reject_unchanged(run, run.configure.bind(_careers, _encounters, _item_ids, true), "already_configured")
	# Optional reward items omitted is canonical; numeric orders need not be contiguous.
	bad = _encounters.duplicate(true)
	bad[0]["rewards"].erase("items")
	bad[0]["order"] = 100
	var optional = RunContext.new()
	_ok(optional.configure(_careers, bad, _item_ids, true), "optional items and noncontiguous orders")


func _test_reset_and_detached_state() -> void:
	var careers: Array = _careers.duplicate(true)
	var encounters: Array = _encounters.duplicate(true)
	var run = RunContext.new()
	_ok(run.configure(careers, encounters, _item_ids, true), "configure detached content")
	careers[0]["starting_items"].clear()
	encounters[0]["rewards"]["xp"] = 0
	_ok(run.select_career(_careers[0]["id"]), "select original content")
	_check(run.snapshot()["selected_career"] == _careers[0], "input mutation cannot alter career")
	var returned: Dictionary = run.confirm_career()
	returned["state"]["encounter"]["rewards"]["xp"] = 0
	var detached: Dictionary = run.snapshot()
	detached["selected_career"]["starting_items"].clear()
	detached["boundaries"].clear()
	_check(run.snapshot()["selected_career"] == _careers[0], "snapshot cannot mutate state")
	_check(not run.snapshot()["boundaries"].is_empty(), "snapshot cannot mutate blockers")
	var entry: Dictionary = _entry(run)
	_ok(run.start_combat(entry, true), "detached combat entry")
	entry["state"]["marker"] = "changed"
	_check(run.snapshot()["combat_context"]["state"]["marker"] == "approved_fixture", "entry is detached")
	var old: Dictionary = _result(run, "victory", "old_run")
	_ok(run.consume_result(old), "old run reward")
	old["outcome"] = "defeat"
	_check(run.snapshot()["last_result"]["outcome"] == "victory", "result is detached")
	var old_combat_id: String = run.snapshot()["combat_id"]
	_ok(run.reset(), "reset rewarded run")
	_check_fresh(run)
	_ok(run.select_career(_careers[0]["id"]), "same career in new run")
	_ok(run.confirm_career(), "same first encounter in new run")
	_ok(_start(run), "new combat identity")
	_check(run.snapshot()["combat_id"] != old_combat_id, "identity survives reset without reuse")
	old["outcome"] = "victory"
	_reject_unchanged(run, run.consume_result.bind(old), "result_identity_mismatch")
	_ok(run.consume_result(_result(run, "victory", "new_run")), "fresh callback rewards new run once")
	_ok(run.reset(), "reset after fresh reward")
	_check_fresh(run)


func _test_reset_at_every_screen() -> void:
	for target_screen in [
		RunContext.Screen.CAREER_SELECT,
		RunContext.Screen.ENCOUNTER_PREVIEW,
		RunContext.Screen.COMBAT,
		RunContext.Screen.REWARD,
		RunContext.Screen.PROGRESSION,
	]:
		var run = _new_run()
		_ok(run.select_career(_careers[0]["id"]), "select before reset")
		if target_screen != RunContext.Screen.CAREER_SELECT:
			_ok(run.confirm_career(), "confirm before reset")
		if target_screen in [
			RunContext.Screen.COMBAT, RunContext.Screen.REWARD, RunContext.Screen.PROGRESSION
		]:
			_ok(_start(run), "start before reset")
		if target_screen in [RunContext.Screen.REWARD, RunContext.Screen.PROGRESSION]:
			_ok(run.consume_result(_result(run, "victory", "reset_result")), "reward before reset")
		if target_screen == RunContext.Screen.PROGRESSION:
			_ok(run.continue_to_progression(), "progression before reset")
		_check(run.snapshot()["screen"] == target_screen, "reset from intended screen")
		_ok(run.reset(), "reset any active screen")
		_check_fresh(run)
		_ok(run.reset(), "reset is idempotent")
		_check_fresh(run)


func _test_cyclic_and_deep_inputs() -> void:
	var run = _new_run()
	_ok(run.select_career(_careers[0]["id"]), "select for bounded input checks")
	_ok(run.confirm_career(), "confirm for bounded input checks")

	var cyclic_array: Array = []
	cyclic_array.append(cyclic_array)
	var cyclic_dictionary: Dictionary = {}
	cyclic_dictionary["self"] = cyclic_dictionary
	var mutual_array: Array = []
	var mutual_dictionary: Dictionary = {"array": mutual_array}
	mutual_array.append(mutual_dictionary)
	var deep: Variant = "leaf"
	for index in range(RunContext.MAX_JSON_DEPTH + 1):
		deep = [deep] if index % 2 == 0 else {"nested": deep}

	for invalid in [cyclic_array, cyclic_dictionary, mutual_array, deep]:
		var entry: Dictionary = _entry(run)
		entry["state"] = invalid
		_reject_unchanged(run, run.start_combat.bind(entry, true), "invalid_combat_context")
		var fresh = RunContext.new()
		var careers: Array = _careers.duplicate(true)
		careers[0]["extra"] = invalid
		_reject_unchanged(
			fresh, fresh.configure.bind(careers, _encounters, _item_ids, true), "invalid_content"
		)

	# Ordinary nested JSON remains valid; rejecting unsafe inputs does not poison the run.
	var valid_entry: Dictionary = _entry(run)
	valid_entry["state"] = {"nested": [{"leaf": ["valid", 1, true]}]}
	_ok(run.start_combat(valid_entry, true), "accept ordinary nested context")
	for invalid in [cyclic_array, cyclic_dictionary, mutual_dictionary, deep]:
		var result: Dictionary = _result(run, "victory", "bounded_input_result")
		result["extra"] = invalid
		_reject_unchanged(run, run.consume_result.bind(result), "invalid_result")
	_ok(
		run.consume_result(_result(run, "victory", "bounded_input_result")),
		"valid result accepted after cyclic/deep rejections"
	)
	cyclic_array.clear()
	cyclic_dictionary.clear()
	mutual_array.clear()
	mutual_dictionary.clear()


func _new_run():
	var run = RunContext.new()
	_ok(run.configure(_careers, _encounters, _item_ids, true), "configure canonical content")
	return run


func _entry(run) -> Dictionary:
	var state: Dictionary = run.snapshot()
	return {
		"career_id": state["selected_career"].get("id", ""),
		"encounter_id": state["encounter"].get("id", ""),
		"state": {"marker": "approved_fixture"},
	}


func _start(run) -> Dictionary:
	return run.start_combat(_entry(run), true)


func _result(run, outcome: String, result_id: String) -> Dictionary:
	var state: Dictionary = run.snapshot()
	return {
		"result_id": result_id,
		"combat_id": state["combat_id"],
		"encounter_id": state["encounter"]["id"],
		"outcome": outcome,
	}


func _check_fresh(run) -> void:
	var state: Dictionary = run.snapshot()
	_check(state["configured"], "reset preserves validated content")
	_check(state["screen"] == RunContext.Screen.CAREER_SELECT, "reset screen")
	_check(state["selected_career"].is_empty() and state["encounter_cursor"] == 0, "reset career and cursor")
	_check(state["xp"] == 0 and state["reward_items"].is_empty(), "reset XP and item receipts")
	_check(state["combat_id"].is_empty() and state["combat_context"].is_empty(), "reset combat/carryover context")
	_check(state["last_result"].is_empty() and state["last_reward"].is_empty(), "reset handoff")
	_check(state["consumed_result_ids"].is_empty(), "reset run result ledger")


func _reject_unchanged(run, operation: Callable, code: String) -> void:
	var before: Dictionary = run.snapshot()
	var response: Dictionary = operation.call()
	_check(not response.get("ok", true) and response.get("code") == code, "reject: " + code)
	_check(run.snapshot() == before, "rejection is atomic: " + code)


func _ok(response: Dictionary, label: String) -> void:
	_check(response.get("ok", false), label + ": " + str(response))


func _check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures += 1
		push_error("WS04: " + label)


func _load_collection(collection: String) -> Array:
	var directory: String = ProjectSettings.globalize_path("res://").path_join("../data/" + collection)
	var records: Array = []
	for filename in DirAccess.get_files_at(directory):
		if filename.ends_with(".json"):
			var parsed = JSON.parse_string(FileAccess.get_file_as_string(directory.path_join(filename)))
			_check(parsed is Dictionary, "parse canonical " + collection + "/" + filename)
			if parsed is Dictionary:
				records.append(parsed)
	return records
