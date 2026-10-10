class_name ContentRegistry
extends RefCounted
## Checks bundle structure only; the exporter owns full schema/reference validation.

const COLLECTIONS := ["careers", "skills", "statuses", "items", "enemies", "bosses", "encounters"]

var errors: PackedStringArray = PackedStringArray()
var _collections: Dictionary = {}
var _runtime: Dictionary = {}
var _ready: bool = false

func load_bundle(path: String = "res://data/content_bundle.json") -> bool:
	errors.clear()
	_ready = false
	_collections = {}
	_runtime = {}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		errors.append("Cannot open content bundle: %s" % path)
		return false
	var parser := JSON.new()
	var result := parser.parse(file.get_as_text())
	file.close()
	if result != OK:
		errors.append("Invalid content JSON at line %d: %s" % [parser.get_error_line(), parser.get_error_message()])
		return false
	var envelope: Variant = parser.data
	if not envelope is Dictionary:
		errors.append("Content bundle must be an object")
		return false
	if not _version_one(envelope.get("schema_version")):
		errors.append("Unsupported content bundle schema_version (expected 1)")
	if not envelope.get("content_revision") is String or envelope.get("content_revision") != "slice_1":
		errors.append("Unsupported content_revision (expected slice_1)")
	var collections: Variant = envelope.get("collections")
	if not collections is Dictionary:
		errors.append("Content bundle collections must be an object")
	else:
		for collection in COLLECTIONS:
			var records: Variant = collections.get(collection)
			if not records is Dictionary:
				errors.append("Missing or invalid collection: %s" % collection)
				continue
			if records.is_empty():
				errors.append("Empty collection: %s" % collection)
			for id in records:
				var definition: Variant = records[id]
				if not id is String or not definition is Dictionary:
					errors.append("Invalid definition in collection: %s" % collection)
				elif not definition.get("id") is String or definition.get("id") != id:
					errors.append("Definition ID mismatch: %s/%s" % [collection, id])
	var runtime: Variant = envelope.get("runtime")
	if not runtime is Dictionary:
		errors.append("Content bundle runtime must be an object")
	else:
		if not _version_one(runtime.get("schema_version")):
			errors.append("Unsupported runtime schema_version (expected 1)")
		if not runtime.get("content_revision") is String or runtime.get("content_revision") != envelope.get("content_revision"):
			errors.append("Runtime content_revision must match the bundle")
		for section in ["rules", "equipment"]:
			if not runtime.get(section) is Dictionary:
				errors.append("Runtime section must be an object: %s" % section)
		for section in ["careers", "actions", "statuses", "archetypes", "stages", "encounters", "dialogue"]:
			if not runtime.get(section) is Array:
				errors.append("Runtime section must be an array: %s" % section)
	if not errors.is_empty():
		return false
	_collections = collections.duplicate(true)
	_runtime = runtime.duplicate(true)
	_freeze(_collections)
	_freeze(_runtime)
	_ready = true
	return true

func get_definition(collection: String, id: String) -> Dictionary:
	if not _ready or not _collections.has(collection):
		return {}
	var records: Dictionary = _collections[collection]
	if not records.has(id):
		return {}
	return records[id].duplicate(true)

func get_runtime() -> Dictionary:
	return _runtime.duplicate(true) if _ready else {}

func get_collection_counts() -> Dictionary:
	var counts: Dictionary = {}
	if _ready:
		for collection in COLLECTIONS:
			counts[collection] = _collections[collection].size()
	return counts

func _version_one(value: Variant) -> bool:
	return (typeof(value) == TYPE_INT or typeof(value) == TYPE_FLOAT) and value == 1

func _freeze(value: Variant) -> void:
	if value is Dictionary:
		for child in value.values():
			_freeze(child)
		value.make_read_only()
	elif value is Array:
		for child in value:
			_freeze(child)
		value.make_read_only()
