extends SceneTree

const Loader = preload("res://scripts/data/runtime/data_loader.gd")
const Runtime = preload("res://scripts/data/runtime/data_runtime.gd")

var _failures: Array = []


func _initialize() -> void:
	# Pass the canonical data root explicitly after --; packaging belongs to WS06.
	var args := OS.get_cmdline_user_args()
	if args.size() != 1:
		printerr("Usage: godot --headless --path godot --script res://scripts/data/runtime/tests/runtime_test.gd -- <canonical-data-root>")
		quit(2)
		return
	var parsed: Dictionary = Loader.new().load_directory(args[0])
	_check(parsed.issues.is_empty(), "Canonical content parses without issues")
	var counts := {"careers": 3, "skills": 10, "statuses": 6, "items": 11, "enemies": 3, "bosses": 1, "encounters": 4}
	var sources: Array = []
	for collection in Loader.COLLECTIONS:
		_check(parsed.records[collection].size() == counts[collection], "Canonical count: %s" % collection)
		for source in parsed.records[collection]:
			sources.append({"collection": collection, "path": source.path, "text": JSON.stringify(source.record)})
	if not parsed.issues.is_empty() or sources.is_empty():
		_finish()
		return
	var runtime := Runtime.new()
	_check(not runtime.load_sources(sources), "Parsing alone cannot publish")
	_check(runtime.get_issues().size() == 2, "Both missing validation stages reported")
	_check(not runtime.lookup("careers", "mercenary").ok, "Not-ready lookup fails clearly")

	# These callbacks exercise the gate only; they do not claim full schema acceptance.
	var accept := func(_records): return []
	_check(runtime.load_sources(sources, accept, accept), "Seven collections publish after explicit validation")
	for collection in Loader.COLLECTIONS:
		_check(runtime.ids(collection).ids.size() == counts[collection], "Registry count: %s" % collection)
	_check(not runtime.lookup("careers", "missing").ok, "Unknown ID fails")
	_check(not runtime.ids("regions").ok, "Unknown collection fails")
	var record: Dictionary = runtime.lookup("careers", "mercenary").record
	record.base_stats.hp = -99
	_check(runtime.lookup("careers", "mercenary").record.base_stats.hp != -99, "Nested records are detached")
	var ids: Array = runtime.ids("skills").ids
	ids.clear()
	_check(runtime.ids("skills").ids.size() == 10, "ID lists are detached")
	var mutate := func(records):
		records.careers[0].record.name = "changed"
		return []
	_check(runtime.load_sources(sources, mutate, accept), "Validator receives detached candidates")
	_check(runtime.lookup("careers", parsed.records.careers[0].record.id).record.name != "changed", "Validators cannot rewrite candidates")

	var broken := sources.duplicate(true)
	broken.append({"collection": "skills", "path": "fixtures/broken.json", "text": "{"})
	broken.append({"collection": "items", "path": "fixtures/array.json", "text": "[]"})
	broken.append({"collection": "items", "path": "fixtures/no_id.json", "text": "{}"})
	broken.append({"collection": "items", "path": "fixtures/null_id.json", "text": '{"id":null}'})
	broken.append({"collection": "items", "path": "fixtures/invalid.json", "text": '{"id":"ÜPPER"}'})
	var duplicate: Dictionary = sources[0].duplicate(true)
	duplicate.path = "fixtures/duplicate.json"
	broken.append(duplicate)
	_check(not runtime.load_sources(broken, accept, accept), "Any parse or identity failure blocks all publication")
	var issues: Array = runtime.get_issues()
	_check(issues.size() == 8, "Parse, object, missing/null ID, invalid ID, mismatched filename and duplicate errors aggregate")
	_check(not runtime.lookup("careers", "mercenary").ok, "Failed reload revokes old registries")
	broken.reverse()
	runtime.load_sources(broken, accept, accept)
	_check(runtime.get_issues() == issues, "Issues are stable independent of input ordering")
	issues.clear()
	_check(not runtime.get_issues().is_empty(), "Issue arrays are detached")

	var reject := func(_records):
		return [Loader.issue("skills", "riposte", "trigger", "Fixture rejection", "fixtures/riposte.json")]
	_check(not runtime.load_sources(sources, reject, reject), "Validation errors block publication")
	_check(runtime.get_issues().size() == 2, "Both validation stages run and aggregate errors")
	var invalid_result := func(_records): return true
	_check(not runtime.load_sources(sources, invalid_result, accept), "Invalid validator result fails closed")
	var invalid_issue := func(_records): return [{}]
	_check(not runtime.load_sources(sources, invalid_issue, accept), "Malformed validator issue fails closed")
	_check(runtime.load_directory(args[0], accept, accept), "Directory API shares publication gate")
	_finish()


func _check(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)
		printerr("FAIL: %s" % message)


func _finish() -> void:
	if _failures.is_empty():
		print("Data runtime boundary tests passed (full schema/reference validation not implemented).")
	else:
		printerr("%d data runtime boundary assertions failed" % _failures.size())
	quit(0 if _failures.is_empty() else 1)
