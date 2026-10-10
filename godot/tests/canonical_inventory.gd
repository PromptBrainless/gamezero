extends SceneTree

# Run from the checkout root using execution.command in canonical_inventory.json.
# This is deliberately isolated from boot and WS01: reading parent data here is
# dev inventory evidence, NEVER evidence that an exported game can load its JSON.
# Stdout's marked JSON plus exit status form the evidence contract. A Node/static
# pass cannot verify this script; absent Godot leaves native acceptance blocked.

const CONTRACT_PATH := "res://tests/canonical_inventory.json"
const EVIDENCE_MARKER := "WS06_INVENTORY_JSON="

var issues: Array[String] = []
var counts: Dictionary = {}
var source_revision := ""
var data_root := ""


func _initialize() -> void:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--source-revision="):
			source_revision = argument.trim_prefix("--source-revision=")
		else:
			issues.append("Unknown acceptance argument: %s" % argument)
	if source_revision.is_empty():
		issues.append("Missing --source-revision=<git HEAD>; retain git status/diff too")

	var version := Engine.get_version_info()
	if int(version["major"]) != 4 or int(version["minor"]) < 4:
		issues.append("Godot 4.4+ required; native acceptance blocked")
		_finish("blocked", 2)
		return

	var contract := _read_object(CONTRACT_PATH)
	if contract.is_empty():
		_finish("failed", 1)
		return
	data_root = ProjectSettings.globalize_path(
		"res://%s" % contract["data_root"]
	).simplify_path()
	var collections: Dictionary = contract["collections"]
	var records: Dictionary = {}
	for collection in collections:
		records[collection] = _check_collection(collection, collections[collection])
	_check_skills(records["skills"], contract)
	_check_order(records["encounters"], contract["encounter_order"])
	_finish("passed" if issues.is_empty() else "failed", 0 if issues.is_empty() else 1)


func _read_object(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		issues.append("%s: cannot read (error %s)" % [path, FileAccess.get_open_error()])
		return {}
	var parser := JSON.new()
	var error := parser.parse(file.get_as_text())
	if error != OK:
		issues.append("%s:%s: %s" % [path, parser.get_error_line(), parser.get_error_message()])
		return {}
	if not parser.data is Dictionary:
		issues.append("%s: expected one JSON object" % path)
		return {}
	return parser.data


func _check_collection(collection: String, expected: Array) -> Dictionary:
	var path := data_root.path_join(collection)
	var directory := DirAccess.open(path)
	var records: Dictionary = {}
	if directory == null:
		issues.append("%s: missing/unreadable collection directory" % path)
		counts[collection] = 0
		return records
	var filenames: Array[String] = []
	for filename in directory.get_files():
		if filename.ends_with(".json"):
			filenames.append(filename)
	filenames.sort()
	counts[collection] = filenames.size()
	if filenames.size() != expected.size():
		issues.append("%s: expected %s JSON files, found %s" % [
			collection, expected.size(), filenames.size()
		])
	var actual_ids: Array[String] = []
	var id_pattern := RegEx.new()
	id_pattern.compile("^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")
	for filename in filenames:
		var filename_id := filename.get_basename()
		actual_ids.append(filename_id)
		var record := _read_object(path.path_join(filename))
		var id = record.get("id")
		if not id is String:
			issues.append("%s/%s: id must be a string" % [collection, filename])
			continue
		if id_pattern.search(id) == null:
			issues.append("%s/%s: id must be snake_case ASCII" % [collection, filename])
		if id != filename_id:
			issues.append("%s/%s: id %s does not match filename" % [collection, filename, id])
		if records.has(id):
			issues.append("%s/%s: duplicate record id %s" % [collection, filename, id])
		else:
			records[id] = record
	if actual_ids != expected:
		issues.append("%s: expected exact filename IDs %s, found %s" % [
			collection, expected, actual_ids
		])
	var record_ids: Array = records.keys()
	record_ids.sort()
	if record_ids != expected:
		issues.append("%s: expected exact record IDs %s, found %s" % [
			collection, expected, record_ids
		])
	return records


func _check_skills(skills: Dictionary, contract: Dictionary) -> void:
	var player_count := 0
	var enemy_count := 0
	for career in contract["skill_owners"]:
		for id in contract["skill_owners"][career]:
			if not skills.has(id):
				issues.append("skills/%s: missing career-owned skill" % id)
			elif skills[id].get("career") != career:
				issues.append("skills/%s: expected career %s" % [id, career])
			else:
				player_count += 1
	for id in contract["enemy_only_skills"]:
		if not skills.has(id):
			issues.append("skills/%s: missing enemy-only skill" % id)
		elif skills[id].has("career"):
			issues.append("skills/%s: enemy-only career field must be omitted" % id)
		else:
			enemy_count += 1
	counts["player_skills"] = player_count
	counts["enemy_only_skills"] = enemy_count
	if player_count != 9 or enemy_count != 1:
		issues.append("skills: expected nine career-owned plus one enemy-only skill")


func _check_order(encounters: Dictionary, expected: Array) -> void:
	var orders: Dictionary = {}
	for index in range(expected.size()):
		var id: String = expected[index]
		if not encounters.has(id):
			issues.append("encounters/%s: missing ordered encounter" % id)
			continue
		var order = encounters[id].get("order")
		# Godot JSON parses numbers as floats, so accept integral numeric values.
		if not (order is float or order is int):
			issues.append("encounters/%s: order must be an integer" % id)
			continue
		if order != index + 1:
			issues.append("encounters/%s: expected order %s, found %s" % [id, index + 1, order])
		if orders.has(order):
			issues.append("encounters/%s: duplicate order %s" % [id, order])
		orders[order] = id


func _finish(status: String, exit_code: int) -> void:
	print(EVIDENCE_MARKER + JSON.stringify({
		"contract_version": 1,
		"scope": "dev canonical inventory only",
		"status": status,
		"exit_code": exit_code,
		"timestamp_utc": Time.get_datetime_string_from_system(true) + "Z",
		"engine": Engine.get_version_info(),
		"os": OS.get_name(),
		"command_arguments": OS.get_cmdline_args(),
		"acceptance_arguments": OS.get_cmdline_user_args(),
		"source_revision": source_revision,
		"dev_data_root": data_root,
		"counts": counts,
		"issues": issues,
		"runtime_packaging_verified": false,
		"first_playable_verified": false
	}))
	quit(exit_code)
