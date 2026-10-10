extends Node
## Bootstrap: will route to menu / character creation / combat.

const Registry = preload("res://scripts/data/content_registry.gd")
var content_registry: ContentRegistry

func _ready() -> void:
	content_registry = Registry.new()
	if not content_registry.load_bundle():
		for error in content_registry.errors:
			push_error(error)
		return
	print("ECHO//BRUCH (Godot) booted")
	print("Validated content collections: ", content_registry.get_collection_counts())
