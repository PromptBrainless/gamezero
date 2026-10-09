class_name SaveService
extends RefCounted

const SAVE_PATH := "user://save.json"

func save_game(data: Dictionary) -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	f.store_string(JSON.stringify(data))
