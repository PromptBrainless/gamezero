extends RefCounted

const Loader = preload("res://scripts/data/runtime/data_loader.gd")


# This is only the identity subset of reference validation, not schema validation.
func validate(records: Dictionary) -> Array:
	var issues: Array = []
	var pattern := RegEx.new()
	pattern.compile("^[a-z][a-z0-9]*(_[a-z0-9]+)*$")
	for collection in Loader.COLLECTIONS:
		var seen: Dictionary = {}
		for source in records[collection]:
			var id = source.record.get("id")
			if not id is String:
				issues.append(Loader.issue(collection, "", "id", "Required ID must be a string", source.path))
				continue
			if pattern.search(id) == null:
				issues.append(Loader.issue(collection, id, "id", "ID must be ASCII lower_snake_case", source.path))
			if source.path.get_file() != "%s.json" % id:
				issues.append(Loader.issue(collection, id, "id", "Filename must equal %s.json" % id, source.path))
			if seen.has(id):
				issues.append(Loader.issue(collection, id, "id", "Duplicate ID; first defined at %s" % seen[id], source.path))
			else:
				seen[id] = source.path
	Loader.sort_issues(issues)
	return issues
