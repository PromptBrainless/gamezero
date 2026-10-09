class_name ProgressionService
extends RefCounted

var xp := 0
var career_id: StringName
func add_xp(amount: int) -> void:
	xp += amount
