extends RefCounted

const COLLECTIONS = [
	"careers", "skills", "statuses", "items", "enemies", "bosses", "encounters"
]


static func issue(collection: String, id: String, field: String, message: String, path: String) -> Dictionary:
	return {"collection": collection, "id": id, "field": field, "message": message, "path": path}


# The caller supplies a packaged content root; no dependency on the checkout's parent directory.
func load_directory(root: String) -> Dictionary:
	var sources: Array = []
	var issues: Array = []
	for collection in COLLECTIONS:
		var directory_path: String = root.path_join(collection)
		var directory := DirAccess.open(directory_path)
		if directory == null:
			issues.append(issue(collection, "", "$", "Cannot open collection directory: %s" % error_string(DirAccess.get_open_error()), directory_path))
			continue
		var filenames := directory.get_files()
		filenames.sort()
		for filename in filenames:
			if filename.get_extension() != "json":
				continue
			var path := directory_path.path_join(filename)
			var file := FileAccess.open(path, FileAccess.READ)
			if file == null:
				issues.append(issue(collection, filename.get_basename(), "$", "Cannot read JSON: %s" % error_string(FileAccess.get_open_error()), path))
				continue
			var bytes := file.get_buffer(file.get_length())
			if file.get_error() != OK:
				issues.append(issue(collection, filename.get_basename(), "$", "Cannot read complete JSON file", path))
				continue
			var text := bytes.get_string_from_utf8()
			if text.to_utf8_buffer() != bytes:
				issues.append(issue(collection, filename.get_basename(), "$", "Content must be valid UTF-8", path))
				continue
			sources.append({"collection": collection, "path": path, "text": text})
	var result := parse_sources(sources)
	result.issues.append_array(issues)
	sort_issues(result.issues)
	return result


# Sources are {collection, path, text}; records retain their source envelope for validation.
func parse_sources(sources: Array) -> Dictionary:
	var records: Dictionary = {}
	var issues: Array = []
	for collection in COLLECTIONS:
		records[collection] = []
	var ordered_sources := sources.duplicate(true)
	ordered_sources.sort_custom(func(a, b):
		if a.collection != b.collection:
			return COLLECTIONS.find(a.collection) < COLLECTIONS.find(b.collection)
		return a.path < b.path
	)
	for source in ordered_sources:
		var collection: String = source.collection
		var path: String = source.path
		if not records.has(collection):
			issues.append(issue(collection, "", "$", "Unknown content collection", path))
			continue
		var parser := JSON.new()
		var error := parser.parse(source.text)
		if error != OK:
			issues.append(issue(collection, path.get_file().get_basename(), "$", "JSON parse error at line %d: %s" % [parser.get_error_line(), parser.get_error_message()], path))
			continue
		if not parser.data is Dictionary:
			issues.append(issue(collection, path.get_file().get_basename(), "$", "Expected one JSON entity object per file", path))
			continue
		records[collection].append({"collection": collection, "path": path, "record": parser.data})
	sort_issues(issues)
	return {"records": records, "issues": issues}


static func sort_issues(issues: Array) -> void:
	issues.sort_custom(func(a, b):
		var left := COLLECTIONS.find(a.collection)
		var right := COLLECTIONS.find(b.collection)
		if left < 0:
			left = COLLECTIONS.size()
		if right < 0:
			right = COLLECTIONS.size()
		if left != right:
			return left < right
		if a.path != b.path:
			return a.path < b.path
		if a.field != b.field:
			return a.field < b.field
		return a.message < b.message
	)
