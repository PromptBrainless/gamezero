extends RefCounted

## Standalone WS04 boundary; not a loader, resolver, scene router or save format.
## configure() receives WS01-validated canonical records, not resolved opponents.
## start_combat() requires an externally approved, JSON-like combat context.
## consume_result() accepts {result_id, combat_id, encounter_id, outcome};
## outcome is victory/defeat/exit. Reward amounts come ONLY from encounter.rewards.
## All returned dictionaries are detached snapshots. Failures leave state unchanged.

enum Screen {
	CAREER_SELECT,
	ENCOUNTER_PREVIEW,
	COMBAT,
	REWARD,
	PROGRESSION,
	FINISHED,
	OUTCOME_BLOCKED,
}

const MAX_INTEGER: int = 9223372036854775807
# Bounds recursion before snapshot duplication, including cyclic caller-owned containers.
const MAX_JSON_DEPTH: int = 64
const BOUNDARIES: Dictionary = {
	"runtime": "WS01 must validate records and references before configuration.",
	"combat_entry": "WS01/WS02 adapter must supply approved initial combat state.",
	"carryover": "HP, resources, statuses and consumable carryover require gameplay approval.",
	"defeat_exit_retry": "Defeat/exit recovery and retry policy require gameplay approval.",
	"loot": "Enemy/boss XP and chance-based loot are not applied; policy requires review.",
	"progression": "XP is accumulated only; no XP-level thresholds or career ranks are defined.",
}

var _configured: bool = false
var _careers: Dictionary = {}
var _encounters: Array = []
var _screen: Screen = Screen.CAREER_SELECT
var _selected_career: Dictionary = {}
var _cursor: int = 0
var _xp: int = 0
var _reward_items: Array = []
var _consumed_results: Dictionary = {}
var _combat_id: String = ""
var _combat_context: Dictionary = {}
var _last_result: Dictionary = {}
var _last_reward: Dictionary = {}
# This identity counter survives reset so stale combat callbacks cannot reward a new run.
var _combat_serial: int = 0


func configure(
	careers: Array, encounters: Array, item_ids: Array, runtime_validated: bool
) -> Dictionary:
	if _configured:
		return _failure("already_configured", "Create a new context to replace content.")
	if not runtime_validated:
		return _failure("runtime_not_ready", BOUNDARIES["runtime"])
	if careers.is_empty() or encounters.is_empty():
		return _failure("invalid_content", "Careers and encounters must not be empty.")
	var known_items: Dictionary = {}
	for item_id in item_ids:
		if not _is_id(item_id) or known_items.has(item_id):
			return _failure("invalid_content", "Item IDs must be nonempty and unique.")
		known_items[item_id] = true
	var checked_careers: Dictionary = {}
	for career in careers:
		if not career is Dictionary or not _is_json_value(career):
			return _failure("invalid_content", "Career records must be JSON-like dictionaries.")
		if not _is_id(career.get("id")) or checked_careers.has(career["id"]):
			return _failure("invalid_content", "Career IDs must be nonempty and unique.")
		if not _items_resolve(career.get("starting_items"), known_items):
			return _failure("invalid_content", "Career starting_items must resolve to supplied items.")
		checked_careers[career["id"]] = career.duplicate(true)
	var checked_encounters: Array = []
	var encounter_ids: Dictionary = {}
	var encounter_orders: Dictionary = {}
	for encounter in encounters:
		if not encounter is Dictionary or not _is_json_value(encounter):
			return _failure("invalid_content", "Encounter records must be JSON-like dictionaries.")
		if not _is_id(encounter.get("id")) or encounter_ids.has(encounter["id"]):
			return _failure("invalid_content", "Encounter IDs must be nonempty and unique.")
		var order = encounter.get("order")
		if not _is_integer(order) or encounter_orders.has(int(order)):
			return _failure("invalid_content", "Encounter orders must be integers and unique.")
		var rewards = encounter.get("rewards")
		if not rewards is Dictionary or not _is_integer(rewards.get("xp")):
			return _failure("invalid_content", "Encounter rewards.xp must be a nonnegative integer.")
		if rewards["xp"] < 0 or not _items_resolve(rewards.get("items", []), known_items):
			return _failure("invalid_content", "Encounter reward items must resolve; XP cannot be negative.")
		encounter_ids[encounter["id"]] = true
		encounter_orders[int(order)] = true
		checked_encounters.append(encounter.duplicate(true))
	checked_encounters.sort_custom(
		func(left: Dictionary, right: Dictionary) -> bool:
			return int(left["order"]) < int(right["order"])
	)
	_careers = checked_careers
	_encounters = checked_encounters
	_configured = true
	return _success()


func select_career(career_id: String) -> Dictionary:
	if not _configured:
		return _failure("runtime_not_ready", BOUNDARIES["runtime"])
	if _screen != Screen.CAREER_SELECT:
		return _invalid_transition("select_career")
	if not _careers.has(career_id):
		return _failure("unknown_career", "Select a configured canonical career.")
	_selected_career = _careers[career_id].duplicate(true)
	return _success()


func confirm_career() -> Dictionary:
	if _screen != Screen.CAREER_SELECT:
		return _invalid_transition("confirm_career")
	if _selected_career.is_empty():
		return _failure("career_required", "Select a career before confirming.")
	_screen = Screen.ENCOUNTER_PREVIEW
	return _success()


func start_combat(entry_context: Dictionary, entry_policy_approved: bool = false) -> Dictionary:
	if _screen != Screen.ENCOUNTER_PREVIEW:
		return _invalid_transition("start_combat")
	if not entry_policy_approved:
		return _failure("combat_entry_policy_required", BOUNDARIES["combat_entry"] + " " + BOUNDARIES["carryover"])
	if not _is_json_value(entry_context) or entry_context.is_empty():
		return _failure("invalid_combat_context", "Supply a JSON-like combat context.")
	if entry_context.get("career_id") != _selected_career["id"]:
		return _failure("context_identity_mismatch", "Combat context must identify the selected career.")
	if entry_context.get("encounter_id") != _encounters[_cursor]["id"]:
		return _failure("context_identity_mismatch", "Combat context must identify the current encounter.")
	if _combat_serial == MAX_INTEGER:
		return _failure("identity_exhausted", "Create a new context; combat identity cannot be reused.")
	_combat_serial += 1
	_combat_id = "slice_combat_%d" % _combat_serial
	_combat_context = entry_context.duplicate(true)
	_last_result = {}
	_last_reward = {}
	_screen = Screen.COMBAT
	return _success()


func consume_result(result: Dictionary) -> Dictionary:
	if not _is_json_value(result):
		return _failure("invalid_result", "Results must be JSON-like dictionaries.")
	for field in ["result_id", "combat_id", "encounter_id"]:
		if not _is_id(result.get(field)):
			return _failure("invalid_result", "Results require result_id, combat_id and encounter_id.")
	if _consumed_results.has(result["result_id"]):
		return _failure("duplicate_result", "This result has already been consumed.")
	if _screen != Screen.COMBAT:
		return _invalid_transition("consume_result")
	if result["combat_id"] != _combat_id or result["encounter_id"] != _encounters[_cursor]["id"]:
		return _failure("result_identity_mismatch", "Result does not belong to the active combat.")
	if result.get("outcome") not in ["victory", "defeat", "exit"]:
		return _failure("invalid_outcome", "Result outcome must be victory, defeat or exit.")
	var reward: Dictionary = {}
	if result["outcome"] == "victory":
		var canonical_rewards: Dictionary = _encounters[_cursor]["rewards"]
		var earned_xp: int = int(canonical_rewards["xp"])
		if _xp > MAX_INTEGER - earned_xp:
			return _failure("xp_overflow", "Accumulated XP exceeds the storage integer range.")
		reward = {
			"result_id": result["result_id"],
			"combat_id": _combat_id,
			"encounter_id": _encounters[_cursor]["id"],
			"xp": earned_xp,
			"items": canonical_rewards.get("items", []).duplicate(true),
		}
		_xp += earned_xp
		_reward_items.append_array(reward["items"])
	_consumed_results[result["result_id"]] = true
	_last_result = result.duplicate(true)
	_last_reward = reward
	_screen = Screen.REWARD if result["outcome"] == "victory" else Screen.OUTCOME_BLOCKED
	return _success()


func continue_to_progression() -> Dictionary:
	if _screen != Screen.REWARD:
		return _invalid_transition("continue_to_progression")
	_screen = Screen.PROGRESSION
	return _success()


func continue_run() -> Dictionary:
	if _screen != Screen.PROGRESSION:
		if _screen == Screen.OUTCOME_BLOCKED:
			return _failure("outcome_policy_required", BOUNDARIES["defeat_exit_retry"])
		return _invalid_transition("continue_run")
	if _cursor == _encounters.size() - 1:
		_screen = Screen.FINISHED
	else:
		_cursor += 1
		_combat_id = ""
		_combat_context = {}
		_last_result = {}
		_last_reward = {}
		_screen = Screen.ENCOUNTER_PREVIEW
	return _success()


## Explicit caller-requested abandonment/restart, not an automatic defeat policy.
## Validated content stays configured; all run state is cleared.
func reset() -> Dictionary:
	_screen = Screen.CAREER_SELECT
	_selected_career = {}
	_cursor = 0
	_xp = 0
	_reward_items = []
	_consumed_results = {}
	_combat_id = ""
	_combat_context = {}
	_last_result = {}
	_last_reward = {}
	return _success()


func snapshot() -> Dictionary:
	var current_encounter: Dictionary = {}
	if _configured:
		current_encounter = _encounters[_cursor]
	return {
		"configured": _configured,
		"screen": _screen,
		"selected_career": _selected_career,
		"encounter_cursor": _cursor,
		"encounter_count": _encounters.size(),
		"encounter": current_encounter,
		"xp": _xp,
		# Reward receipts, NOT an inventory or a consumable/stacking implementation.
		"reward_items": _reward_items,
		"combat_id": _combat_id,
		"combat_context": _combat_context,
		"last_result": _last_result,
		"last_reward": _last_reward,
		"consumed_result_ids": _consumed_results.keys(),
		"boundaries": BOUNDARIES,
		"outcome_blocker": BOUNDARIES["defeat_exit_retry"] if _screen == Screen.OUTCOME_BLOCKED else "",
	}.duplicate(true)


func _success() -> Dictionary:
	return {"ok": true, "state": snapshot()}


func _failure(code: String, reason: String) -> Dictionary:
	return {"ok": false, "code": code, "reason": reason}


func _invalid_transition(operation: String) -> Dictionary:
	return _failure("invalid_transition", "%s is unavailable from %s." % [operation, Screen.keys()[_screen]])


func _is_id(value: Variant) -> bool:
	return value is String and not value.strip_edges().is_empty()


func _is_integer(value: Variant) -> bool:
	if value is int:
		return true
	if value is float:
		# JSON numbers may be floats; the upper bound is exclusive to avoid rounded int overflow.
		return is_finite(value) and value == floor(value) and value >= -9223372036854775808.0 and value < 9223372036854775808.0
	return false


func _items_resolve(items: Variant, known_items: Dictionary) -> bool:
	if not items is Array:
		return false
	for item in items:
		if not _is_id(item) or not known_items.has(item):
			return false
	return true


func _is_json_value(value: Variant, depth: int = 0) -> bool:
	if depth > MAX_JSON_DEPTH:
		return false
	match typeof(value):
		TYPE_BOOL, TYPE_INT, TYPE_STRING:
			return true
		TYPE_FLOAT:
			return is_finite(value)
		TYPE_ARRAY:
			for entry in value:
				if not _is_json_value(entry, depth + 1):
					return false
			return true
		TYPE_DICTIONARY:
			for key in value:
				if not key is String or not _is_json_value(value[key], depth + 1):
					return false
			return true
	return false
