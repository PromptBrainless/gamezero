extends RefCounted

const Loader = preload("res://scripts/data/runtime/data_loader.gd")
const IdentityValidator = preload("res://scripts/data/runtime/identity_validator.gd")
const Registry = preload("res://scripts/data/runtime/registry.gd")

var _ready := false
var _issues: Array = []
var _registries: Dictionary = {}


func is_ready() -> bool:
	return _ready


func get_issues() -> Array:
	return _issues.duplicate(true)


func load_directory(root: String, schema_validator: Callable = Callable(), reference_validator: Callable = Callable()) -> bool:
	return _validate_and_publish(Loader.new().load_directory(root), schema_validator, reference_validator)


func load_sources(sources: Array, schema_validator: Callable = Callable(), reference_validator: Callable = Callable()) -> bool:
	return _validate_and_publish(Loader.new().parse_sources(sources), schema_validator, reference_validator)


# Each validator receives collection -> [{collection, path, record}] and returns issue dictionaries.
# Both stages are mandatory; parsing/identity checks alone never establish readiness.
func _validate_and_publish(parsed: Dictionary, schema_validator: Callable, reference_validator: Callable) -> bool:
	_ready = false
	_registries.clear()
	_issues = parsed.issues.duplicate(true)
	_issues.append_array(IdentityValidator.new().validate(parsed.records))
	if not schema_validator.is_valid():
		_issues.append(Loader.issue("runtime", "", "schema", "Structural schema validator is required before publication", ""))
	if not reference_validator.is_valid():
		_issues.append(Loader.issue("runtime", "", "references", "Cross-reference validator is required before publication", ""))
	if _issues.is_empty():
		_collect_validation(schema_validator, parsed.records, "schema")
		_collect_validation(reference_validator, parsed.records, "references")
	Loader.sort_issues(_issues)
	if not _issues.is_empty():
		return false
	for collection in Loader.COLLECTIONS:
		_registries[collection] = Registry.new(parsed.records[collection])
	_ready = true
	return true


func _collect_validation(validator: Callable, records: Dictionary, stage: String) -> void:
	var result = validator.call(records.duplicate(true))
	if not result is Array:
		_issues.append(Loader.issue("runtime", "", stage, "Validator must return an array of issues", ""))
		return
	for entry in result:
		if not entry is Dictionary or not _is_issue(entry):
			_issues.append(Loader.issue("runtime", "", stage, "Validator returned a malformed issue", ""))
		else:
			_issues.append(entry.duplicate(true))


func _is_issue(entry: Dictionary) -> bool:
	for key in ["collection", "id", "field", "message", "path"]:
		if not entry.get(key) is String:
			return false
	return true


func ids(collection: String) -> Dictionary:
	var error := _lookup_error(collection)
	if not error.is_empty():
		return {"ok": false, "ids": [], "error": error}
	return {"ok": true, "ids": _registries[collection].ids(), "error": ""}


func lookup(collection: String, id: String) -> Dictionary:
	var error := _lookup_error(collection)
	if not error.is_empty():
		return {"ok": false, "record": {}, "error": error}
	var result: Dictionary = _registries[collection].lookup(id)
	if not result.ok:
		result.error = "[%s/%s] %s" % [collection, id, result.error]
	return result


func _lookup_error(collection: String) -> String:
	if not _ready:
		return "DataRuntime is not ready; inspect get_issues()"
	if not _registries.has(collection):
		return "Unknown content collection: %s" % collection
	return ""
