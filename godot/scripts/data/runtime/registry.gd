extends RefCounted

var _records: Dictionary = {}


# Owned by DataRuntime after its validation gate; callers receive detached snapshots.
func _init(records: Array = []) -> void:
	for source in records:
		_records[source.record.id] = source.record.duplicate(true)


func ids() -> Array:
	var result := _records.keys()
	result.sort()
	return result


func lookup(id: String) -> Dictionary:
	if not _records.has(id):
		return {"ok": false, "record": {}, "error": "Unknown record ID: %s" % id}
	return {"ok": true, "record": _records[id].duplicate(true), "error": ""}
